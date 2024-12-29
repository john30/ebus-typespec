import {createTypeSpecLibrary, paramMessage, type JSONSchemaType} from "@typespec/compiler";

export interface EbusdEmitterOptions {
  /** Emit includes files as includes instead of inline (incomplete!). */
  includes?: boolean;
  /**
   * File name with translations to use.
   */
  translations?: string;
  /** Emit min+max values. */
  withMinMax?: boolean;
}

export const EmitterOptionsSchema: JSONSchemaType<EbusdEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    includes: {
      type: "boolean",
      nullable: true,
      description: "Emit includes files as includes instead of inline (incomplete!)",
    },
    translations: {
      type: "string",
      nullable: true,
      description: "File name with translations to use."
    },
    withMinMax: {
      type: "boolean",
      nullable: true,
      description: "Emit min+max values"
    }
  },
}

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
    "banned-write-target": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid write target address "${"value"}".`,
      },
    },
    "banned-auth": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid auth "${"value"}".`,
      },
    },
    "banned-divisor": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid divisor value "${"value"}".`,
      },
    },
    "banned-factor": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid factor value "${"value"}".`,
      },
    },
    "banned-values": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid values ${"detail"}.`,
      },
    },
    "banned-type": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid type ${"type"} with name "${"name"}".`,
      },
    },
    "banned-length": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid @${"which"} exceeding ${"value"}.`,
      },
    },
    "banned-in": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid @in with broadcast or source target.`,
      },
    },
    "duplicate-id": {
      severity: "error",
      messages: {
        default: paramMessage`There are multiple models with the same id "${"id"}".`,
      },
    },
    "short-id": {
      severity: "error",
      messages: {
        default: paramMessage`The id "${"id"}" is too short.`,
      },
    },
    "banned-inheritance": {
      severity: "error",
      messages: {
        default: paramMessage`The inheritance is too deep in ${"ref"}.`,
      },
    },
    "duplicate-name": {
      severity: "error",
      messages: {
        default: paramMessage`There are multiple models types with the same id "${"id"}".`,
      },
    },
    "multiple-decorator": {
      severity: "error",
      messages: {
        default: paramMessage`Only single decorator "@${"which"}" allowed.`,
      },
    },
    "invalid-length": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid ${"which"} length ${"value"}.`,
      },
    },
    "missing-decorator": {
      severity: "error",
      messages: {
        default: paramMessage`Missing decorator "@${"which"}".`,
      },
    }
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<EbusdEmitterOptions>,
  },
  state: {
    condition: { description: "message condition(s)" },
    write: { description: "write direction" },
    passive: { description: "passive only" },
    poll: { description: "poll priority" },
    auth: { description: "authentication level" },
    qq: { description: "source address QQ" },
    zz: { description: "target address ZZ" },
    id: { description: "message ID" },
    chain: { description: "message chain" },
    inherit: { description: "inherited model(s)" },
    example: { description: "example data" },
    bcd: { description: 'BCD encoding' },
    hex: { description: 'HEX encoding' },
    maxBits: { description: 'max number of bits' },
    out: { description: 'outbound/inbound message part' },
    reverse: { description: "reverse representation" },
    unit: { description: "unit" },
    divisor: { description: "divisor" },
    values: { description: "known values" },
    constValue: { description: "const value" },
  },
});

export const $flags = {decoratorArgMarshalling: "new"};

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
