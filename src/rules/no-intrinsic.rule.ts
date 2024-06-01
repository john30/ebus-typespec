import {createRule, type SemanticNodeListener} from "@typespec/compiler";

export const noIntrinsicRule = createRule({
  name: "no-intrinsic",
  severity: "warning",
  description: "Make sure intrinsic is not used.",
  messages: {
    default: "Intrinsic shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      intrinsic: (op) => {
        context.reportDiagnostic({
          target: op,
        });
      },
    };
  },
});
