import {createRule} from "@typespec/compiler";

export const noFunctionRule = createRule({
  name: "no-function",
  severity: "warning",
  description: "Make sure function is not used.",
  messages: {
    default: "Function shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      function: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
