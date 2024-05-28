import { createTypeSpecLibrary, paramMessage } from "@typespec/compiler";

export const $lib = createTypeSpecLibrary({
  name: "ebus",
  diagnostics: {
    "banned-source-address": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid source address "${"value"}".`,
      },
    },
    "banned-target-address": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid target address "${"value"}".`,
      },
    },
    "banned-divisor": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid divisor value "${"value"}".`,
      },
    },
  },
  state: {
    write: { description: "write direction" },
    passive: { description: "passive only" },
    qq: { description: "source address QQ" },
    zz: { description: "target address ZZ" },
    id: { description: "message ID" },
    inherit: { description: "inherited model(s)" },
    bcd: { description: 'BCD encoding' },
    hex: { description: 'HEX encoding' },
    reverse: { description: "reverse representation" },
    unit: { description: "unit" },
    divisor: { description: "divisor" },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
