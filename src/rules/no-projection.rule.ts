import {createRule} from "@typespec/compiler";

export const noProjectionRule = createRule({
  name: "no-projection",
  severity: "warning",
  description: "Make sure projection is not used.",
  messages: {
    default: "Projection shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      projection: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
