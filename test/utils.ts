import {createAssetEmitter} from "@typespec/asset-emitter";
import {type Diagnostic} from "@typespec/compiler";
import {createTestHost, expectDiagnosticEmpty} from "@typespec/compiler/testing";
import {getEbusdEmitterClass} from "../src/csv_emitter.js";
import {type EbusdEmitterOptions} from "../src/lib.js";
import {EbusTestLibrary} from "../src/testing/index.js";

export async function getHostForTspFile(contents: string, extraSpecFiles?: {name: string, code: string}[]) {
  const host = await createTestHost({
    libraries: [EbusTestLibrary],
  });
  host.addTypeSpecFile("main.tsp", contents);
  extraSpecFiles?.forEach(({name, code}) => host.addTypeSpecFile(name, code));
  await host.compile("main.tsp", {
    noEmit: false,
    outputDir: "tsp-output",
  });
  return host;
}

export type TestOptions = {
  emitNamespace?: boolean,
  emitTypes?: string[],
  extraSpecFiles?: {name: string, code: string, main?: true}[],
};

export async function emitWithDiagnostics(
  code: string,
  options: EbusdEmitterOptions = {},
  testOptions: TestOptions = { emitNamespace: true }
): Promise<[Record<string, any>, readonly Diagnostic[]]> {
  code = (testOptions.extraSpecFiles||[]).filter(f=>!f.main && f.name.endsWith('.tsp')).map(({name}) => `import "./${name}"; `).join('')
  + (testOptions.emitNamespace
    ? `import "ebus"; using Ebus; namespace test; ${code}`
    : `import "ebus"; using Ebus; ${code}`);
  const host = await getHostForTspFile(code, testOptions.extraSpecFiles);
  const emitter = createAssetEmitter(
    host.program,
    await getEbusdEmitterClass(host.compilerHost, options.includes, options.withMinMax, options.translations),
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
  const readDirs = async (parent: string = '') => {
    for (const file of await emitter.getProgram().host.readDir("./tsp-output"+(parent?`/${parent}`:''))) {
      if (file.endsWith('.csv') || file.endsWith('.inc')) {
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
    schemas[name] = sf.text;
  }

  return [schemas, host.program.diagnostics];
}

export async function emit(
  code: string,
  options: EbusdEmitterOptions = {},
  testOptions: TestOptions = { emitNamespace: true }
) {
  const [schemas, diagnostics] = await emitWithDiagnostics(code, options, testOptions);
  expectDiagnosticEmpty(diagnostics);
  return schemas;
}