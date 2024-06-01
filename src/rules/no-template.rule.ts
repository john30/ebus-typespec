import {createRule} from "@typespec/compiler";

export const noTemplateRule = createRule({
  name: "no-template",
  severity: "warning",
  description: "Make sure template is not used.",
  messages: {
    default: "Template shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      templateParameter: (target) => {
        context.reportDiagnostic({target});
      },
      stringTemplate: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
