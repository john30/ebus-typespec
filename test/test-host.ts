import { createTestHost, createTestWrapper } from "@typespec/compiler/testing";
import { EbusTestLibrary } from "../src/testing/index.js";

export async function createEbusTestHost() {
  return createTestHost({
    libraries: [EbusTestLibrary],
  });
}

export async function createEbusTestRunner() {
  const host = await createEbusTestHost();

  return createTestWrapper(host, {
    autoUsings: ["Ebus"]
  });
}

