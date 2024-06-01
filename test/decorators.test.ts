import {type Model} from "@typespec/compiler";
import {expectDiagnostics, type BasicTestRunner} from "@typespec/compiler/testing";
import {strictEqual} from "node:assert";
import {beforeEach, describe, it} from "node:test";
import {getQq, getZz} from "../src/decorators.js";
import {createEbusTestRunner} from "./test-host.js";

describe("decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEbusTestRunner();
  })

  describe("@qq", () => {
    it("set qq on model", async () => {
      const { Test } = (await runner.compile(
        `@qq(0x31) @test model Test {}`
      )) as { Test: Model };
      strictEqual(getQq(runner.program, Test), 0x31);
    });

    it("emit diagnostic with invalid value", async () => {
      const diagnostics = await runner.diagnose(
        `@qq(0x12) @test model Test {}`
      );
      expectDiagnostics(diagnostics, {
        severity: "error",
        code: "ebus/banned-source-address",
        message: "Invalid source address \"18\"."
      })
    });
  });

  describe("@zz", () => {
    it("set zz on model", async () => {
      const { Test } = (await runner.compile(
        `@zz(0xfe) @test model Test {}`
      )) as { Test: Model };
      strictEqual(getZz(runner.program, Test), 0xfe);
    });

    it("emit diagnostic with invalid value", async () => {
      const diagnostics = await runner.diagnose(
        `@zz(0xaa) @test model Test {}`
      );
      expectDiagnostics(diagnostics, {
        severity: "error",
        code: "ebus/banned-target-address",
        message: "Invalid target address \"170\"."
      })
    });
  });
});
