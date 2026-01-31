#!/usr/bin/env node

import {compile, createSourceFile, formatDiagnostic, NodeHost, type CompilerHost, type CompilerOptions, type ProcessedLog, type SourceFile} from "@typespec/compiler";
import {createWriteStream, type WriteStream} from "fs";
import {readFile} from "node:fs/promises";
import {createConnection} from "node:net";
import {createInterface} from "node:readline";
import {extname, isAbsolute, resolve, sep} from "path";

const EBUSD_TIMEOUT = 3000;
const MICROEBUSD_TIMEOUT = 3000;
const SVC_TIMEOUT = 10000;
const SVC_URL = 'https://micro.ebusd.eu/convert';

let outFile: WriteStream|undefined = undefined;

type MicroEbusdTarget = {id: string, auth: string, build: string, api: URL, name: string, inline?: true};

const fetchTimeout = async <T>(
  input: Parameters<typeof fetch>[0],
  init: Parameters<typeof fetch>[1],
  timeout: number,
  handler: (response: Response) => Promise<T>,
): Promise<T> => {
  const abort = new AbortController();
  const timer = setTimeout(() => {
    abort.abort('request timed out');
  }, timeout);
  try {
    const response = await fetch(input, {...init, signal: abort.signal});
    return await handler(response);
  } finally {
    clearTimeout(timer);
  }
};

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  let inFiles: string[] = [];
  let translations: string|undefined = undefined;
  let outFileName: string|undefined = undefined;
  let ebusdHostPort: [string, number]|undefined = undefined;
  let microEbusdTarget: MicroEbusdTarget|undefined = undefined;
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
        'usage: tsp2ebusd [-e host[:port]] [-m url [-i]] [-o outfile] [infile*]',
        'converts eBUS TypeSpec file(s) or stdin to an ebusd CSV file or stdout or a micro-ebusd instance.',
        'with:',
        '  -t, --trans file         the translation JSON/YAML file',
        '  -e, --ebusd host[:port]  the ebusd host and optional port of ebusd REPL to send the CSV output to (needs to have the "--define" feature enabled)',
        '  -m, --micro-ebusd url    the micro-ebusd URL to send the output to, complete URL or just hostname with/without "https://" prefix if needed (uses conversion service and triggers micro-ebusd to load it)',
        '  -i, --inline             whether to send the conversion output inline to micro-ebusd (i.e. temporary only)',
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
      if (microEbusdTarget) {
        throw new Error('cannot use ebusd and micro-ebusd simultaneously');
      }
      const parts = args[++idx].split(':');
      if (!parts[0].length) {
        throw new Error('invalid ebusd host');
      }
      const ebusdPort = parts.length>1 ? parseInt(parts[1], 10) : 8888;
      if (ebusdPort<1 || ebusdPort>65535 || isNaN(ebusdPort)) {
        throw new Error('invalid ebusd port');
      }
      ebusdHostPort = [parts[0], ebusdPort];
    } else if (arg==='-m' || arg==='--micro-ebusd') {
      if (ebusdHostPort) {
        throw new Error('cannot use ebusd and micro-ebusd simultaneously');
      }
      let str = args[++idx];
      if (!str.startsWith('http') || !str.includes('://')) {
        str = 'http://'+str;
      }
      const url = URL.parse(str);
      if (!url) {
        throw new Error('invalid micro-ebusd URL');
      }
      url.pathname += 'api/v1/';
      const statusUrl = new URL(url);
      statusUrl.pathname += 'status';
      console.log('connecting micro-ebusd...');
      microEbusdTarget = await fetchTimeout(statusUrl, {}, MICROEBUSD_TIMEOUT, async (ret) => {
        const data = (await ret.json()) as {id: string, build: string, ebus: {proto: string, auth: string}};
        if (!data?.id || !data.build || data.ebus?.proto!=='easi' || !data.ebus.auth) {
          throw new Error('not a micro-ebusd URL');
        }
        return {api: url, id: data.id, auth: data.ebus.auth, build: data.build, name: 'out.csv'};
      });
      console.log('preparing for micro-ebusd '+microEbusdTarget.id);
    } else if (arg==='-i' || arg==='--micro-ebusd-inline') {
      if (!microEbusdTarget) {
        throw new Error('pass micro-ebusd URL first');
      }
      microEbusdTarget.inline = true;
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
  const outputFiles: Record<string, string> = {};
  const usedFiles: Record<string, string> = {};
  const markUsed = (path: string, output: SourceFile): SourceFile => {
    if (extname(path)==='.tsp' && !NodeHost.getLibDirs().some(d => path.startsWith(d))) {
      const parts = path.split(sep);
      if (!parts.includes('node_modules') && !parts.includes('lib')) {
        usedFiles[path] = output.text;
      }
    }
    return output;
  }
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
      markUsed(path, inputFiles[path] || await NodeHost.readFile(path)),
      // path),
    stat: async (path) => // trace('stat',
      inputFiles[path] ? inputSourceStat : NodeHost.stat(path),
      // path),
    writeFile: async (path, content) => {outputFiles[path] = content},
    mkdirp: async (path) => path,
  };
  const program = await compile(host, entryFile, options);
  if (program.hasError() || program.diagnostics.length) {
    throw new Error(`compilation failed:\n${program.diagnostics.map(d => formatDiagnostic(d)).join('\n')}`);
  }
  const filenames = Object.keys(outputFiles);
  if (filenames.length==0) {
    throw new Error(`no file emitted`);
  }
  if (filenames.length!=1) {
    throw new Error(`too many files emitted: ${filenames.join()}`)
  }
  if (!ebusdHostPort && !microEbusdTarget) {
    log(outputFiles[filenames[0]]);
  } else {
    const lines = outputFiles[filenames[0]].split('\n');
    if (microEbusdTarget && filenames[0].startsWith('@ebusd/ebus-typespec/')) {
      microEbusdTarget.name = filenames[0].substring('@ebusd/ebus-typespec/'.length);
    }
    await sendToEbusd(lines, usedFiles, ebusdHostPort!||microEbusdTarget, log);
  }
}

const sendToEbusd = async (inputLines: string[],
  files: Record<string, string>,
  target: [string, number]|MicroEbusdTarget,
  log: (message?: any, ...optionalParams: any[]) => void) => {
  const toMicroEbusd = !Array.isArray(target);
  // find the relevant line(s) from the output
  let removeLevel: boolean|undefined=undefined;
  const lines=inputLines.filter(line => {
    if (!toMicroEbusd && removeLevel===undefined) {
      removeLevel=line.includes(',level,');
      return undefined;
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
  if (toMicroEbusd) {
    const body: Pick<typeof target, 'build'|'name'|'inline'> & {lines: string[], files: typeof files}
    = {build: target.build, inline: target.inline, name: target.name, lines, files};
    const {message, inline} = await fetchTimeout(SVC_URL, {method: 'PUT', body: JSON.stringify(body), headers: {'Content-Type': 'application/json', 'X-MAC': target.id, 'X-SIG': target.auth}}, SVC_TIMEOUT, async (ret) => {
      let message = '';
      let inline: Uint8Array|undefined = undefined;
      if (target.inline && ret.ok && ret.headers.get('Content-Type')==='application/octet-stream') {
        inline = new Uint8Array(await ret.arrayBuffer());
      } else {
        let data: {error?: string, details?: unknown};
        try {
          if (ret.ok) {
            data = await ret.json() as typeof data;
          } else {
            data = {error: `conversion service returned ${ret.status} ${ret.statusText}, ${await ret.text()}`};
          }
        } catch (e) {
          data = {error: `${e}`};
        }
        if (!data || data?.error) {
          throw new Error('conversion: failed with '+(data?.error||'unknown error'));
        }
        message = 'OK';
      }
      return {message, inline};
    });
    console.log('conversion: successful'+(message?', message: '+message:inline?`, ${inline.length} inline`:''));
    const api = new URL(target.api);
    api.pathname += 'ebus/reload';
    await fetchTimeout(api, inline
      ? {method: 'PUT', body: inline, headers: {'Content-Type': 'application/octet-stream'}}
      : {method: 'PUT', body: '{"full": true}', headers: {'Content-Type': 'application/json'}}, MICROEBUSD_TIMEOUT, async (ret) => {
      if (ret.ok && ret.headers.get('Content-Type')==='application/json') {
        const data = (await ret.json()) as {status: string};
        const logs = data?.status || 'unknown';
        console.log(`micro-ebusd ${inline?'inline ':''}reload: ${logs}`);
        return;
      }
      console.error(`micro-ebusd reload: ${ret.status} ${ret.statusText}, ${await ret.text()}`);
    });
    return;
  }
  const conn=createConnection({port: target[1], host: target[0], allowHalfOpen: false});
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
      timer=setTimeout(() => conn.destroy(), EBUSD_TIMEOUT);
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
