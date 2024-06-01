import {createRule} from "@typespec/compiler";

export const noUnionRule = createRule({
  name: "no-union",
  severity: "warning",
  description: "Make sure union is not used.",
  messages: {
    default: "Union shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      union: (target) => {
        context.reportDiagnostic({target});
      },
      unionVariant: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
