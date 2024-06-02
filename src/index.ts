import type {EmitContext, Model, Program} from "@typespec/compiler";
import {EbusdEmitter} from "./csv_emitter.js";
import {StateKeys, type EbusdEmitterOptions} from "./lib.js";

export {getAuth, getBcd, getConds, getDivisor, getHex, getId, getInherit, getMaxBits, getPassive, getQq, getReverse, getUnit, getValues, getWrite, getZz} from "./decorators.js";
export {$lib} from "./lib.js";
export {$linter} from "./linter.js";

export async function $onEmit(context: EmitContext<EbusdEmitterOptions>) {
  const emitter =
  // context.options["file-type"]==='csv'?
  context.getAssetEmitter(EbusdEmitter)
  // :context.getAssetEmitter(EbusSchemaEmitter);
  emitter.emitProgram();
  await emitter.writeOutput();
}

// export function getEbusdTypes(program: Program): Model[] {
//   return [...(program.stateSet(StateKeys.id) || [])] as Model[];
// }