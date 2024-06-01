import {createRule, type SemanticNodeListener} from "@typespec/compiler";

export const noOperationRule = createRule({
  name: "no-operation",
  severity: "warning",
  description: "Make sure operation is not used.",
  messages: {
    default: "Operation shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      operation: (op) => {
        context.reportDiagnostic({
          target: op,
        });
      },
    };
  },
});
