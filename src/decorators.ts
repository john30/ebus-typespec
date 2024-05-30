import {DecoratorContext, Enum, isNumericType, Model, ModelProperty, Namespace, Program, Scalar, setTypeSpecNamespace} from "@typespec/compiler";
import {reportDiagnostic, StateKeys} from "./lib.js";

export const namespace = "Ebus";

/**
 * Implementation of the `@write` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $write(context: DecoratorContext, target: Model) {
  context.program.stateMap(StateKeys.write).set(target, true);
}

/**
 * Accessor for the `@write` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getWrite(program: Program, target: Model): boolean {
  return program.stateMap(StateKeys.write).get(target);
}

/**
 * Implementation of the `@passive` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $passive(context: DecoratorContext, target: Model) {
  context.program.stateMap(StateKeys.passive).set(target, true);
}

/**
 * Accessor for the `@passive` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getPassive(program: Program, target: Model): boolean {
  return program.stateMap(StateKeys.passive).get(target);
}

const validSource: Uint8Array = new Uint8Array([
  0x00,0x01,0x03,0x07,0x0f,
  0x10,0x11,0x13,0x17,0x1f,
  0x30,0x31,0x33,0x37,0x3f,
  0x70,0x71,0x73,0x77,0x7f,
  0xf0,0xf1,0xf3,0xf7,0xff,
]);
const invalidTarget: Uint8Array = new Uint8Array([0xa9,0xaa]);
export const isSourceAddr = (qq?: number) => qq!==undefined && validSource.includes(qq);

/**
 * Implementation of the `@qq` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $qq(context: DecoratorContext, target: Model, value?: number) {
  if (value !== undefined && !validSource.includes(value)) {
    reportDiagnostic(context.program, {
      code: "banned-source-address",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
  }
  context.program.stateMap(StateKeys.qq).set(target, value);
}

/**
 * Accessor for the `@qq` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getQq(program: Program, target: Model): number | undefined {
  return program.stateMap(StateKeys.qq).get(target);
}

/**
 * Implementation of the `@zz` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $zz(context: DecoratorContext, target: Model|Namespace, value?: number) {
  if (value !== undefined && invalidTarget.includes(value)) {
    reportDiagnostic(context.program, {
      code: "banned-target-address",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
  }
  context.program.stateMap(StateKeys.zz).set(target, value===undefined?0xaa:value);
}

/**
 * Accessor for the `@zz` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getZz(program: Program, target: Model|Namespace): number | undefined {
  return program.stateMap(StateKeys.zz).get(target);
}

/**
 * Implementation of the `@id` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $id(context: DecoratorContext, target: Model, pb: number, sb: number, ...dd: number[]) {
  context.program.stateMap(StateKeys.id).set(target, [pb, sb, ...dd]);
  context.program.stateSet(StateKeys.id).add(target);
}

/**
 * Implementation of the `@base` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $base(context: DecoratorContext, target: Model, pb: number, sb: number, ...dd: number[]) {
  context.program.stateMap(StateKeys.id).set(target, [pb, sb, ...dd]);
}

/**
 * Implementation of the `@ext` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $ext(context: DecoratorContext, target: Model, ...dd: number[]) {
  context.program.stateMap(StateKeys.id).set(target, dd);
  context.program.stateSet(StateKeys.id).add(target);
}

/**
 * Accessor for the `@id` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getId(program: Program, target: Model): number[] | undefined {
  return program.stateMap(StateKeys.id).get(target);
}


/**
 * Implementation of the `@inherit` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the inherited models.
 */
export function $inherit(context: DecoratorContext, target: Model, first: Model, ...other: Model[]) {
  context.program.stateMap(StateKeys.inherit).set(target, [first, ...other]);
}

/**
 * Accessor for the `@inherit` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getInherit(program: Program, target: Model): Model[] {
  return program.stateMap(StateKeys.inherit).get(target);
}


/**
 * Implementation of the `@reverse` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $reverse(context: DecoratorContext, target: Scalar) {
  context.program.stateMap(StateKeys.reverse).set(target, true);
}

/**
 * Accessor for the `@reverse` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getReverse(program: Program, target: Scalar): boolean {
  return program.stateMap(StateKeys.reverse).has(target);
}

/**
 * Implementation of the `@bcd` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $bcd(context: DecoratorContext, target: Scalar) {
  context.program.stateMap(StateKeys.bcd).set(target, true);
}

/**
 * Accessor for the `@bcd` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getBcd(program: Program, target: Scalar): boolean {
  return program.stateMap(StateKeys.bcd).has(target);
}

/**
 * Implementation of the `@hex` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $hex(context: DecoratorContext, target: Scalar) {
  context.program.stateMap(StateKeys.hex).set(target, true);
}

/**
 * Accessor for the `@hex` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getHex(program: Program, target: Scalar): boolean {
  return program.stateMap(StateKeys.hex).has(target);
}
setTypeSpecNamespace("internal", $reverse, $bcd, $hex);


/**
 * Implementation of the `@in` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $in(context: DecoratorContext, target: ModelProperty) {
  context.program.stateMap(StateKeys.out).set(target, false);
}

/**
 * Implementation of the `@out` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 */
export function $out(context: DecoratorContext, target: ModelProperty) {
  context.program.stateMap(StateKeys.out).set(target, true);
}

/**
 * Accessor for the `@in`/`@out` decorators.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target (true when `out`, false when `in`), or undefined.
 */
export function getOut(program: Program, target: ModelProperty): boolean {
  return program.stateMap(StateKeys.out).get(target);
}

/**
 * Implementation of the `@unit` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $unit(context: DecoratorContext, target: Scalar|ModelProperty, value?: string) {
  context.program.stateMap(StateKeys.unit).set(target, value);
}

/**
 * Accessor for the `@unit` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getUnit(program: Program, target: Scalar|ModelProperty): string | undefined {
  return program.stateMap(StateKeys.unit).get(target);
}

/**
 * Implementation of the `@divisor` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $divisor(context: DecoratorContext, target: Scalar|ModelProperty, value?: number) {
  //todo only allow on numeric
  // if (value !== undefined && invalidTarget.includes(value)) {
  //   reportDiagnostic(context.program, {
  //     code: "banned-divisor",
  //     target: context.getArgumentTarget(0)!,
  //     format: { value: value.toString() },
  //   });
  // }
  context.program.stateMap(StateKeys.divisor).set(target, value);
}

/**
 * Accessor for the `@divisor` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getDivisor(program: Program, target: Scalar|ModelProperty): number | undefined {
  return program.stateMap(StateKeys.divisor).get(target);
}

/**
 * Implementation of the `@values` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $values(context: DecoratorContext, target: Scalar|ModelProperty, value: Enum) {
  if (!isNumericType(context.program, target)) {
    // context.program.reportDiagnostic(createDiagnostic({
    //   code: "decorator-wrong-target",
    //   format: { decorator: "@knownValues", to: "type, it is  not a string or numeric" },
    //   target,
    // }));
    return;//todo check
  }
  context.program.stateMap(StateKeys.values).set(target, value);
}

/**
 * Accessor for the `@values` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getValues(program: Program, target: Scalar|ModelProperty): Enum | undefined {
  return program.stateMap(StateKeys.values).get(target);
}
