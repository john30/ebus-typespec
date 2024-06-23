import {expectDiagnostics, type BasicTestRunner} from "@typespec/compiler/testing";
import {beforeEach, describe, it} from "node:test";
import {createEbusTestRunner} from "./test-host.js";

describe("validating models", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEbusTestRunner();
  })

  it("emit diagnostic on property recursion", async () => {
    const diagnostics = await runner.diagnose(`
      @id(1,0)
      model m0 {
        m: m1
      }
      model m1 {
        m: m0
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/banned-inheritance",
        message: `The inheritance is too deep in m0.`,
      },
    ]);
  });
});
