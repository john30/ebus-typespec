import {type Diagnostic} from "@typespec/compiler";
import {createAssetEmitter} from "@typespec/compiler/emitter-framework";
import {createTestHost, expectDiagnosticEmpty} from "@typespec/compiler/testing";
import {parse} from "yaml";
import {EbusdEmitter} from "../src/csv_emitter.js";
import {type EbusdEmitterOptions} from "../src/lib.js";
import {EbusTestLibrary} from "../src/testing/index.js";

export async function getHostForTspFile(contents: string) {
  const host = await createTestHost({
    libraries: [EbusTestLibrary],
  });
  host.addTypeSpecFile("main.tsp", contents);
  await host.compile("main.tsp", {
    noEmit: false,
    outputDir: "tsp-output",
  });
  return host;
}

export async function emitWithDiagnostics(
  code: string,
  options: EbusdEmitterOptions = {},
  testOptions: { emitNamespace?: boolean; emitTypes?: string[] } = { emitNamespace: true }
): Promise<[Record<string, any>, readonly Diagnostic[]]> {
  if (!options["file-type"]) {
    options["file-type"] = "csv";
  }

  code = testOptions.emitNamespace
    ? `import "ebus"; using Ebus; namespace test; ${code}`
    : `import "ebus"; using Ebus; ${code}`;
  const host = await getHostForTspFile(code);
  const emitter = createAssetEmitter(
    host.program,
    EbusdEmitter,
    {
      emitterOutputDir: "tsp-output",
      options,
    } as any
  );
  if (testOptions.emitTypes === undefined) {
    emitter.emitProgram();
  } else {
    for (const name of testOptions.emitTypes) {
      emitter.emitType(host.program.resolveTypeReference(name)[0]!);
    }
  }

  await emitter.writeOutput();
  const schemas: Record<string, any> = {};
  const files: string[] = [];
  const fileType = options?.["file-type"] === "csv" ? 'csv'
  : options?.["file-type"] === "yaml" ? 'yaml' : 'json';
  const readDirs = async (parent: string = '') => {
    for (const file of await emitter.getProgram().host.readDir("./tsp-output"+(parent?`/${parent}`:''))) {
      if (file.endsWith(fileType)) {
        files.push((parent?`${parent}/`:'')+file);
      } else {
        await readDirs((parent?`${parent}/`:'')+file);
      }
    }
  }
  await readDirs();

  for (const file of files) {
    let name = file;
    if (testOptions.emitNamespace && name.startsWith('test/')) {
      name = name.substring(5);
    }
    const sf = await emitter.getProgram().host.readFile(`./tsp-output/${file}`);
    if (fileType === "csv") {
      schemas[name] = sf.text;
    } else if (fileType === "yaml") {
      schemas[name] = parse(sf.text);
    } else {
      schemas[name] = JSON.parse(sf.text);
    }
  }

  return [schemas, host.program.diagnostics];
}

export async function emit(
  code: string,
  options: EbusdEmitterOptions = {},
  testOptions: { emitNamespace?: boolean; emitTypes?: string[] } = { emitNamespace: true }
) {
  const [schemas, diagnostics] = await emitWithDiagnostics(code, options, testOptions);
  expectDiagnosticEmpty(diagnostics);
  return schemas;
}