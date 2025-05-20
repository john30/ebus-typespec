import {
  createLinterRuleTester,
  createTestRunner,
  type BasicTestRunner
} from "@typespec/compiler/testing";
import {beforeEach, describe, it} from "node:test";
import {noInterfaceRule} from "../../src/rules/no-interface.rule.js";
import {noIntrinsicRule} from "../../src/rules/no-intrinsic.rule.js";
import {noLiteralRule} from "../../src/rules/no-literal.rule.js";
import {noOperationRule} from "../../src/rules/no-operation.rule.js";
import {noTemplateRule} from "../../src/rules/no-template.rule.js";
import {noTupleRule} from "../../src/rules/no-tuple.rule.js";
import {noUnionRule} from "../../src/rules/no-union.rule.js";

describe("rules", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createTestRunner();
  });
  //todo make the commented ones work

  describe("noInterfaceRule", () => {
    it("emit diagnostics if using interface", async () => {
      const ruleTester = createLinterRuleTester(runner, noInterfaceRule, "ebus");
      await ruleTester.expect(`interface Test {}`).toEmitDiagnostics({
        code: "ebus/no-interface",
        message: "Interface shouldn't be used with this library.",
      });
    });
  });

  describe("noIntrinsicRule", () => {
    it("emit diagnostics if using intrinsic", async () => {
      const ruleTester = createLinterRuleTester(runner, noIntrinsicRule, "ebus");
      await ruleTester.expect(`interface Test {}`).toEmitDiagnostics({
        code: "ebus/no-interface",
        message: "Interface shouldn't be used with this library.",
      });
    });
  });

  describe("noLiteralRule", () => {
    it("emit diagnostics if using string literal", async () => {
      const ruleTester = createLinterRuleTester(runner, noLiteralRule, "ebus");
      await ruleTester.expect(`model x {lit: "xx"};`).toEmitDiagnostics({
        code: "ebus/no-literal",
        message: "Literal shouldn't be used with this library.",
      });
    });
    it("emit diagnostics if using number literal", async () => {
      const ruleTester = createLinterRuleTester(runner, noLiteralRule, "ebus");
      await ruleTester.expect(`alias x = 123;`).toEmitDiagnostics({
        code: "ebus/no-literal",
        message: "Literal shouldn't be used with this library.",
      });
    });
  });

  describe("noOperationRule", () => {
    it("emit diagnostics if using operation", async () => {
      const ruleTester = createLinterRuleTester(runner, noOperationRule, "ebus");
      await ruleTester.expect(`op read(): void;`).toEmitDiagnostics({
        code: "ebus/no-operation",
        message: "Operation shouldn't be used with this library.",
      });
    });
  });

  describe("noTemplateRule", () => {
    it("emit diagnostics if using template", async () => {
      const ruleTester = createLinterRuleTester(runner, noTemplateRule, "ebus");
      await ruleTester.expect(`model x<T>{y: T};`).toEmitDiagnostics({
        code: "ebus/no-template",
        message: "Template shouldn't be used with this library.",
      });
    });
  });

  describe("noTupleRule", () => {
    it("emit diagnostics if using tuple", async () => {
      const ruleTester = createLinterRuleTester(runner, noTupleRule, "ebus");
      await ruleTester.expect(`alias x = [int8,int8];`).toEmitDiagnostics({
        code: "ebus/no-tuple",
        message: "Tuple shouldn't be used with this library.",
      });
    });
  });

  describe("noUnionRule", () => {
    it("emit diagnostics if using union", async () => {
      const ruleTester = createLinterRuleTester(runner, noUnionRule, "ebus");
      await ruleTester.expect(`union x {}`).toEmitDiagnostics({
        code: "ebus/no-union",
        message: "Union shouldn't be used with this library.",
      });
    });
  });
});
