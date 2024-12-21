import {expectDiagnostics, type BasicTestRunner} from "@typespec/compiler/testing";
import {beforeEach, describe, it} from "node:test";
import {createEbusTestRunner} from "./test-host.js";
import {emit} from "./utils.js";

describe("validating models", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEbusTestRunner();
  })

  it("emit diagnostic on property recursion", async () => {
    const diagnostics = await runner.diagnose(`
      @id(1,0)
      model M0 {
        m: M1
      }
      model M1 {
        m: M0
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/banned-inheritance",
        message: `The inheritance is too deep in M0.`,
      },
    ]);
  });

  it("does not emit diagnostic on multiple property use", async () => {
    await emit(`
      using Ebus.Num;
      @id(1,0)
      model M0 {
        m1: M1,
        m2: M1,
        m3: M3
      }
      model M1 {
        m2: M3,
        m3: M3
      }
      model M3 {
        m: UCH,
      }
    `);
  });
});
