import {createRule} from "@typespec/compiler";

export const noLiteralRule = createRule({
  name: "no-literal",
  severity: "warning",
  description: "Make sure literal is not used.",
  messages: {
    default: "Literal shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      string: (target) => {
        context.reportDiagnostic({target});
      },
      number: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
