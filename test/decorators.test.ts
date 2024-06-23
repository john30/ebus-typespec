import {type Model} from "@typespec/compiler";
import {expectDiagnostics, type BasicTestRunner} from "@typespec/compiler/testing";
import {deepEqual, strictEqual} from "node:assert";
import {beforeEach, describe, it} from "node:test";
import {getId, getQq, getZz} from "../src/decorators.js";
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

    it("set broadcast zz on model via union", async () => {
      const { Test } = (await runner.compile(
        `@zz(targets.Broadcast) @test model Test {}`
      )) as { Test: Model };
      strictEqual(getZz(runner.program, Test), 0xfe);
    });

    it("set broadcast zz on model via alias", async () => {
      const { Test } = (await runner.compile(
        `@zz(BROADCAST) @test model Test {}`
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

  describe("@id", () => {
    it("set id on model", async () => {
      const { Test } = (await runner.compile(
        `@zz(0xfe) @id(1,2,0x00,0) @test model Test {}`
      )) as { Test: Model };
      deepEqual(getId(runner.program, Test), [1,2,0,0]);
    });

    it("emit diagnostic with invalid value", async () => {
      const diagnostics = await runner.diagnose(
        `@id(1,2,0x100) @test model Test {}`
      );
      expectDiagnostics(diagnostics, {
        severity: "error",
        code: "invalid-argument",
        message: "Argument of type '0x100' is not assignable to parameter of type 'valueof Ebus.Symbol'"
      })
    });
  });
});
