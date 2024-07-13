#!/usr/bin/env node

import {compile, createSourceFile, formatDiagnostic, NodeHost, type CompilerHost, type CompilerOptions, type ProcessedLog, type SourceFile} from "@typespec/compiler";
import {createWriteStream, type WriteStream} from "fs";
import {readFile} from "node:fs/promises";
import {createConnection} from "node:net";
import {createInterface} from "node:readline";
import {extname, isAbsolute, resolve} from "path";

let outFile: WriteStream|undefined = undefined;

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  let inFiles: string[] = [];
  let translations: string|undefined = undefined;
  let outFileName: string|undefined = undefined;
  let ebusdHostPort: [string, number]|undefined = undefined;
  for (let idx = 0; idx < args.length; idx++) {
    const arg = args[idx];
    if (arg==='-') {
      break;
    }
    if (arg[0]!=='-') {
      inFiles = args.slice(idx);
      break;
    }
    if (arg==='-h' || arg==='--help') {
      const helpTxt = [
        'usage: tsp2ebusd [-e host[:port]] [-o outfile] [infile*]',
        'converts eBUS TypeSpec file(s) or stdin to an ebusd CSV file or stdout.',
        'with:',
        '  -t, --trans file         the translation JSON/YAML file',
        '  -e, --ebusd host[:port]  the ebusd host and optional port of ebusd REPL to send the CSV output to (needs to have the "--define" feature enabled)',
        '  -o, --output file        the output file to write to instead of stdout',
        '  infile                   the input file(s) to use instead of stdin',
      ];
      console.log(helpTxt.join('\n'));
      return;
    }
    if (arg==='-o' || arg==='--output') {
      outFileName = args[++idx];
    } else if (arg==='-t' || arg==='--trans') {
      translations = args[++idx];
    } else if (arg==='-e' || arg==='--ebusd') {
      const parts = args[++idx].split(':');
      if (!parts[0].length) {
        throw new Error('invalid ebusd host');
      }
      const ebusdPort = parts.length>1 ? parseInt(parts[1], 10) : 8888;
      if (ebusdPort<1 || ebusdPort>65535 || isNaN(ebusdPort)) {
        throw new Error('invalid ebusd port');
      }
      ebusdHostPort = [parts[0], ebusdPort];
    } else {
      throw new Error('invalid arguments');
    }
  }
  if (outFileName) {
    // console.log(`redirecting output to ${outFileName}`);
    outFile = createWriteStream(outFileName);
  }
  const log = outFile ? (...args: any[]) => outFile!.write(args.join(' ')+'\n') : console.log;
  const inputFiles: Record<string, SourceFile> = {};
  let entryFile = '';
  if (inFiles.length) {
    for (const inFile of inFiles) {
      let name = extname(inFile)==='.tsp' ? inFile : `${inFile}.tsp`;
      const relative = !isAbsolute(name);
      if (relative) {
        name = resolve(name);
      }
      if (!entryFile) {
        entryFile = name;
      }
      inputFiles[name] = createSourceFile(await readFile(inFile, 'utf-8'), name);
    }
  } else {
    entryFile = './main.tsp';
    const input = ['using Ebus;\n'];
    for await (const chunk of process.stdin) {
      input.push(chunk);
    }
    inputFiles[entryFile] = createSourceFile(input.join(''), entryFile);
    inputFiles[entryFile.substring(2)] = inputFiles[entryFile];
  }
  // console.log('inp',Object.keys(inputFiles))
  const inputSourceStat = {isDirectory: () => false, isFile: () => true};
  const logs: ProcessedLog[] = [];
  const logSink: CompilerHost['logSink'] = {log: (log) => logs.push(log)};
  const options: CompilerOptions = {
    emit: ['@ebusd/ebus-typespec'],
    additionalImports: ['@ebusd/ebus-typespec'],
    options: {
      '@ebusd/ebus-typespec': {
        translations,
      }
    }
  };
  // console.log('HERRE',process.cwd());
  const outputFiles: Record<string, string> = {};
  // const trace = <T>(method: string, output: T, ...args: any[]): T => {
  //   console.error(method, ...args);
  //   console.error(method+' result=', output);
  //   return output;
  // }
  const host: CompilerHost = {
    ...NodeHost,
    logSink,
    realpath: async (path) => // trace('realpath',
      inputFiles[path] ? path : NodeHost.realpath(path),
      // path),
    readFile: async (path) => // trace('readFile',
      inputFiles[path] || await NodeHost.readFile(path),
      // path),
    stat: async (path) => // trace('stat',
      inputFiles[path] ? inputSourceStat : NodeHost.stat(path),
      // path),
    writeFile: async (path, content) => {outputFiles[path] = content},
    mkdirp: async (path) => path,
  };
  const program = await compile(host, entryFile, options);
  if (program.hasError() || program.diagnostics.length) {
    throw new Error(`compilation failed:\n${program.diagnostics.map(formatDiagnostic).join('\n')}`);
  }
  const filenames = Object.keys(outputFiles);
  if (filenames.length==0) {
    throw new Error(`no file emitted`);
  }
  if (filenames.length!=1) {
    throw new Error(`too many files emitted: ${filenames.join()}`)
  }
  if (!ebusdHostPort) {
    log(outputFiles[filenames[0]]);
  } else {
    const lines = outputFiles[filenames[0]].split('\n');
    await sendToEbusd(lines, ebusdHostPort, log);
  }
}

const sendToEbusd = async (inputLines: string[], ebusdHostPort: [string, number], log: (message?: any, ...optionalParams: any[]) => void) => {
  // find the relevant line(s) from the output
  let removeLevel: boolean|undefined=undefined;
  const lines=inputLines.filter(line => {
    if (removeLevel===undefined) {
      removeLevel=line.includes(',level,');
      return;
    }
    if (!line||line.startsWith('#')||line.startsWith('*')) return;
    return line;
  }).map(line => {
    if (!removeLevel) return line;
    const parts=line.split(',');
    parts.splice(2, 1);
    return parts.join(',');
  });
  if (!lines.length) {
    throw new Error('no usable result');
  }
  const conn=createConnection({port: ebusdHostPort[1], host: ebusdHostPort[0], allowHalfOpen: false});
  conn.setEncoding('utf-8');
  let timer: NodeJS.Timeout|undefined;
  try {
    const send=(): true|undefined => {
      if (timer) {
        clearTimeout(timer);
      }
      const line=lines.shift();
      if (!line) {
        return;
      }
      timer=setTimeout(() => conn.destroy(), 3000);
      const cmd=`read -V -def "${line}"`;
      log(cmd);
      conn.write(cmd+'\n');
      return true;
    };
    send();
    for await (const line of createInterface(conn)) {
      if (!line) {
        if (!send()) {
          break; // end of commands
        }
        continue;
      }
      if (line.startsWith('ERR:')) {
        throw new Error('error from ebusd: '+line);
      }
      log('# '+line);
    }
  } finally {
    try {
      conn.write('\x04');
    } catch (_e) {
      // ignore
    }
    if (timer) {
      clearTimeout(timer);
    }
    conn.destroy();
  }
}

run()
.catch(err => {
  if (outFile) {
    try {
      outFile.write(err.toString());
    } catch (_e) {
      // ignore
    }
  }
  console.error(err);
  process.exit(1);
})
.finally(() => {
  if (outFile) {
    outFile.close();
  }
});
