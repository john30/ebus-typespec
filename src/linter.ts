import {defineLinter} from "@typespec/compiler";
import {noFunctionRule} from "./rules/no-function.rule.js";
import {noInterfaceRule} from "./rules/no-interface.rule.js";
import {noIntrinsicRule} from "./rules/no-intrinsic.rule.js";
import {noLiteralRule} from "./rules/no-literal.rule.js";
import {noObjectRule} from "./rules/no-object.rule.js";
import {noOperationRule} from "./rules/no-operation.rule.js";
import {noProjectionRule} from "./rules/no-projection.rule.js";
import {noTemplateRule} from "./rules/no-template.rule.js";
import {noTupleRule} from "./rules/no-tuple.rule.js";
import {noUnionRule} from "./rules/no-union.rule.js";

export const $linter = defineLinter({
  rules: [noFunctionRule, noInterfaceRule, noIntrinsicRule, noLiteralRule,
    noObjectRule, noOperationRule, noProjectionRule, noTemplateRule,
    noTupleRule, noUnionRule],
  ruleSets: {
    recommended: {
      enable: {
        [`ebus/${noFunctionRule.name}`]: true,
        [`ebus/${noInterfaceRule.name}`]: true,
        [`ebus/${noIntrinsicRule.name}`]: true,
        [`ebus/${noLiteralRule.name}`]: true,
        [`ebus/${noObjectRule.name}`]: true,
        [`ebus/${noOperationRule.name}`]: true,
        [`ebus/${noProjectionRule.name}`]: true,
        [`ebus/${noTemplateRule.name}`]: true,
        [`ebus/${noTupleRule.name}`]: true,
        [`ebus/${noUnionRule.name}`]: true,
      },
    },
    all: {
      enable: {
        [`ebus/${noFunctionRule.name}`]: true,
        [`ebus/${noInterfaceRule.name}`]: true,
        [`ebus/${noIntrinsicRule.name}`]: true,
        [`ebus/${noLiteralRule.name}`]: true,
        [`ebus/${noObjectRule.name}`]: true,
        [`ebus/${noOperationRule.name}`]: true,
        [`ebus/${noProjectionRule.name}`]: true,
        [`ebus/${noTemplateRule.name}`]: true,
        [`ebus/${noTupleRule.name}`]: true,
        [`ebus/${noUnionRule.name}`]: true,
      },
    },
  },
});
