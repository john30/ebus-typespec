import {createRule} from "@typespec/compiler";

export const noObjectRule = createRule({
  name: "no-object",
  severity: "warning",
  description: "Make sure object is not used.",
  messages: {
    default: "Object shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      object: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
