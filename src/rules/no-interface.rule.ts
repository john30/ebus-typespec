import {createRule} from "@typespec/compiler";

export const noInterfaceRule = createRule({
  name: "no-interface",
  severity: "warning",
  description: "Make sure interface is not used.",
  messages: {
    default: "Interface shouldn't be used with this library.",
  },
  create: (context) => {
    return {
      interface: (target) => {
        context.reportDiagnostic({target});
      },
    };
  },
});
