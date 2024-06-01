import {createRule} from "@typespec/compiler";

export const noTupleRule = createRule({
  name: "no-tuple",
  severity: "warning",
  description: "Make sure tuple is not used.",
  messages: {
    default: "Tuple shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      tuple: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
