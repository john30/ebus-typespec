import {createTypeSpecLibrary, paramMessage, type JSONSchemaType} from "@typespec/compiler";

export type FileType = "csv" | "yaml" | "json";

export interface EbusdEmitterOptions {
  /**
   * Serialize the schema as either csv, yaml, or json.
   * @default yaml
   */
  "file-type"?: FileType;
}

export const EmitterOptionsSchema: JSONSchemaType<EbusdEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "file-type": {
      type: "string",
      enum: ["csv", "yaml", "json"],
      nullable: true,
      description: "Serialize the schema as either csv, yaml, or json.",
    },
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
    "banned-divisor": {
      severity: "error",
      messages: {
        default: paramMessage`Invalid divisor value "${"value"}".`,
      },
    },
    "duplicate-id": {
      severity: "error",
      messages: {
        default: paramMessage`There are multiple types with the same id "${"id"}".`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<EbusdEmitterOptions>,
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
    maxBits: { description: 'max number of bits' },
    out: { description: 'outbound/inbound message part' },
    reverse: { description: "reverse representation" },
    unit: { description: "unit" },
    divisor: { description: "divisor" },
    values: { description: "known values" },
  },
});

export const { reportDiagnostic, createDiagnostic, stateKeys: StateKeys } = $lib;
