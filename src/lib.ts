import {createTypeSpecLibrary, paramMessage, type JSONSchemaType} from "@typespec/compiler";

export type FileType = "csv";// | "yaml" | "json";

export interface EbusdEmitterOptions {
  /**
   * Serialize the schema as either csv, yaml, or json.
   * @default csv
   */
  "file-type"?: FileType;
  /** Emit includes files as includes instead of inline (incomplete!). */
  includes?: boolean;
}

export const EmitterOptionsSchema: JSONSchemaType<EbusdEmitterOptions> = {
  type: "object",
  additionalProperties: false,
  properties: {
    "file-type": {
      type: "string",
      enum: ["csv"],//, "yaml", "json"],
      nullable: true,
      description: "Serialize the schema as csv", //either csv, yaml, or json.",
    },
    includes: {
      type: "boolean",
      nullable: true,
      description: "Emit includes files as includes instead of inline (incomplete!)",
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
    "duplicate-id": {
      severity: "error",
      messages: {
        default: paramMessage`There are multiple models with the same id "${"id"}".`,
      },
    },
    "duplicate-name": {
      severity: "error",
      messages: {
        default: paramMessage`There are multiple models types with the same id "${"id"}".`,
      },
    },
  },
  emitter: {
    options: EmitterOptionsSchema as JSONSchemaType<EbusdEmitterOptions>,
  },
  state: {
    cond: { description: "message conditions" },
    write: { description: "write direction" },
    passive: { description: "passive only" },
    auth: { description: "authentication level" },
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
