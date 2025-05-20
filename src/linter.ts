import {defineLinter} from "@typespec/compiler";
import {noInterfaceRule} from "./rules/no-interface.rule.js";
import {noIntrinsicRule} from "./rules/no-intrinsic.rule.js";
import {noLiteralRule} from "./rules/no-literal.rule.js";
import {noOperationRule} from "./rules/no-operation.rule.js";
import {noTemplateRule} from "./rules/no-template.rule.js";
import {noTupleRule} from "./rules/no-tuple.rule.js";
import {noUnionRule} from "./rules/no-union.rule.js";

export const $linter = defineLinter({
  rules: [
    noInterfaceRule, noIntrinsicRule, noLiteralRule,
    noOperationRule, noTemplateRule,
    noTupleRule, noUnionRule,
  ],
  ruleSets: {
    recommended: {
      enable: {
        [`ebus/${noInterfaceRule.name}`]: true,
        [`ebus/${noIntrinsicRule.name}`]: true,
        [`ebus/${noLiteralRule.name}`]: true,
        [`ebus/${noOperationRule.name}`]: true,
        [`ebus/${noTemplateRule.name}`]: true,
        [`ebus/${noTupleRule.name}`]: true,
        [`ebus/${noUnionRule.name}`]: true,
      },
    },
    all: {
      enable: {
        [`ebus/${noInterfaceRule.name}`]: true,
        [`ebus/${noIntrinsicRule.name}`]: true,
        [`ebus/${noLiteralRule.name}`]: true,
        [`ebus/${noOperationRule.name}`]: true,
        [`ebus/${noTemplateRule.name}`]: true,
        [`ebus/${noTupleRule.name}`]: true,
        [`ebus/${noUnionRule.name}`]: true,
      },
    },
  },
});
