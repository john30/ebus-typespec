import {EmitContext, Model, Program} from "@typespec/compiler";
import {EbusdEmitter} from "./csv_emitter.js";
import {EbusdEmitterOptions, StateKeys} from "./lib.js";

export { getWrite, getPassive, getQq, getZz, getId, getInherit, getUnit, getDivisor, getValues, getReverse, getBcd, getHex } from "./decorators.js";
export { $lib } from "./lib.js";

export async function $onEmit(context: EmitContext<EbusdEmitterOptions>) {
  const emitter =
  // context.options["file-type"]==='csv'?
  context.getAssetEmitter(EbusdEmitter)
  // :context.getAssetEmitter(EbusSchemaEmitter);

  for (const item of getEbusdTypes(context.program)) {
    emitter.emitType(item);
  }
  await emitter.writeOutput();
}

export function getEbusdTypes(program: Program): Model[] {
  return [...(program.stateSet(StateKeys.id) || [])] as Model[];
}