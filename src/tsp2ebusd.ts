#!/usr/bin/env node

import {compile, createSourceFile, formatDiagnostic, NodeHost, type CompilerHost, type CompilerOptions, type ProcessedLog, type SourceFile} from "@typespec/compiler";
import {readFile} from "node:fs/promises";
import {createConnection} from "node:net";
import {createInterface} from "node:readline";

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  let inFiles: string[] = [];
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
    if (arg==='-e' || arg==='--ebusd') {
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
  const inputFiles: Record<string, SourceFile> = {};
  let entryFile: string|undefined = undefined;
  if (inFiles.length) {
    for (const inFile of inFiles) {
      inputFiles[inFile] = createSourceFile(await readFile(inFile, 'utf-8'), inFile);
      if (!entryFile) {
        entryFile = inFile;
      }
    }
  } else {
    entryFile = '.notebook.tsp';
    const input = ['using Ebus;\n'];
    for await (const chunk of process.stdin) {
      input.push(chunk);
    }
    inputFiles[entryFile] = createSourceFile(input.join(''), entryFile);
  }
  const inputSourceStat = {isDirectory: () => false, isFile: () => true};
  const logs: ProcessedLog[] = [];
  const logSink: CompilerHost['logSink'] = {log: (log) => logs.push(log)};
  const options: CompilerOptions = {
    emit: ['@ebusd/ebus-typespec'],
    additionalImports: ['@ebusd/ebus-typespec'],
  };
  const outputFiles: Record<string, string> = {};
  const host: CompilerHost = {
    ...NodeHost,
    logSink,
    readFile: async (path) => inputFiles[path] || await NodeHost.readFile(path),
    stat: async (path) => inputFiles[path] ? inputSourceStat : NodeHost.stat(path),
    writeFile: async (path, content) => {outputFiles[path] = content},
    mkdirp: async (path) => path,
  }
  const program = await compile(host, entryFile!, options);
  if (program.hasError() || program.diagnostics.length) {
    console.error('compilation failed:');
    program.diagnostics.forEach(d => console.error(formatDiagnostic(d)));
    throw new Error();
  }
  const filenames = Object.keys(outputFiles);
  if (filenames.length==0) {
    throw new Error(`no file emitted`);
  }
  if (filenames.length!=1) {
    throw new Error(`too many files emitted: ${filenames.join()}`)
  }
  if (!ebusdHostPort) {
    console.log(outputFiles[filenames[0]]);
  } else {
    // find the relevant line(s) from the output
    let removeLevel: boolean|undefined = undefined;
    const lines = outputFiles[filenames[0]].split('\n').filter(line => {
      if (removeLevel===undefined) {
        removeLevel = line.includes(',level,');
        return;
      }
      if (!line || line.startsWith('#') || line.startsWith('*')) return;
      return line;
    }).map(line => {
      if (!removeLevel) return line;
      const parts = line.split(',');
      parts.splice(2, 1);
      return parts.join(',');
    });
    if (!lines.length) {
      throw new Error('no usable result');
    }
    const conn = createConnection({port:ebusdHostPort[1], host:ebusdHostPort[0], allowHalfOpen: false});
    conn.setEncoding('utf-8');
    let timer: NodeJS.Timeout|undefined;
    try {
      const send = (): true|undefined => {
        if (timer) {
          clearTimeout(timer);
        }
        const line = lines.shift();
        if (!line) {
          return;
        }
        timer = setTimeout(() => conn.destroy(), 3000);
        const cmd = `read -V -def "${line}"`;
        console.log(cmd);
        conn.write(cmd+'\n');
        return true;
      }
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
        console.log('# '+line);
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
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
