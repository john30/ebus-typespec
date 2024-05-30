import { Diagnostic } from "@typespec/compiler";
import { createAssetEmitter } from "@typespec/compiler/emitter-framework";
import { createTestHost, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { parse } from "yaml";
import { EbusdEmitter } from "../src/csv_emitter.js";
import { EbusdEmitterOptions } from "../src/lib.js";
import { EbusTestLibrary } from "../src/testing/index.js";
import {getEbusdTypes} from "../src/index.js";

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
    for (const item of getEbusdTypes(host.program)) {
      emitter.emitType(item);
    }
  } else {
    for (const name of testOptions.emitTypes) {
      emitter.emitType(host.program.resolveTypeReference(name)[0]!);
    }
  }

  await emitter.writeOutput();
  const schemas: Record<string, any> = {};
  const files = await emitter.getProgram().host.readDir("./tsp-output");

  for (const file of files) {
    const sf = await emitter.getProgram().host.readFile(`./tsp-output/${file}`);
    if (options?.["file-type"] === "csv") {
      schemas[file] = sf.text;
    } else if (options?.["file-type"] === "yaml") {
      schemas[file] = parse(sf.text);
    } else {
      schemas[file] = JSON.parse(sf.text);
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