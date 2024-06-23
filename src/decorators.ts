import type {
  DecoratorContext, Enum, Model, ModelProperty, Namespace,
  Numeric, Program, Scalar, UnionVariant,
} from "@typespec/compiler";
import {
  getPropertyType, isIntrinsicType, isNumeric, isNumericType, setTypeSpecNamespace
} from "@typespec/compiler";
import {StateKeys, reportDiagnostic} from "./lib.js";


/**
 * Implementation of the `@condition` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param values the value to set.
 */
export function $condition(context: DecoratorContext, target: Model|Namespace|UnionVariant, property: ModelProperty|Model, ...values: string[]) {
  const prev = (context.program.stateMap(StateKeys.condition).get(target)||[]) as [ModelProperty|Model, ...string[]][];
  if (target.kind==='Namespace' && prev.some(([p]) => p.name===property.name)) {
    return;
  }
  context.program.stateMap(StateKeys.condition).set(target, [...prev, [property, ...values]]);
}

/**
 * Accessor for the `@condition` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getConditions(program: Program, target: Model|Namespace|UnionVariant): [ModelProperty|Model, ...string[]][] {
  return program.stateMap(StateKeys.condition).get(target);
}

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

/**
 * Implementation of the `@auth` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $auth(context: DecoratorContext, target: Model, value: string) {
  if (value && !/^[a-z0-9_-]*$/i.test(value)) {
    reportDiagnostic(context.program, {
      code: "banned-auth",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
    return;
  }
  if (context.program.stateMap(StateKeys.auth).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'auth'},
    });
  }
  context.program.stateMap(StateKeys.auth).set(target, value);
}

/**
 * Accessor for the `@auth` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getAuth(program: Program, target: Model): string | undefined {
  return program.stateMap(StateKeys.auth).get(target);
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

const getNum = (value: Numeric|number): number|undefined => {
  if (typeof value === 'number') {
    return value;
  }
  if (!isNumeric(value)) {
    return undefined;
  }
  const v = value.asNumber();
  if (v===null) {
    const b = value.asBigInt(); // weird way of having 0x00 "loosing precision"
    if (b===null) {
      return undefined;
    }
    return Number(b.valueOf());
  }
  return v;
}

/**
 * Implementation of the `@qq` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $qq(context: DecoratorContext, target: Model, value?: Numeric) {
  if (value !== undefined && !validSource.includes(getNum(value)!)) {
    reportDiagnostic(context.program, {
      code: "banned-source-address",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
    return;
  }
  if (context.program.stateMap(StateKeys.qq).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'qq'},
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
  return getNum(program.stateMap(StateKeys.qq).get(target));
}

/**
 * Implementation of the `@zz` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $zz(context: DecoratorContext, target: Model|Namespace, value?: Numeric) {
  if (value !== undefined && invalidTarget.includes(getNum(value)!)) {
    reportDiagnostic(context.program, {
      code: "banned-target-address",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
    return;
  }
  if (context.program.stateMap(StateKeys.zz).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'zz'},
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
  return getNum(program.stateMap(StateKeys.zz).get(target));
}

type IdType = {isExt?: boolean, id: Numeric[]};

/**
 * Implementation of the `@id` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param dd further message ID parts.
 */
export function $id(context: DecoratorContext, target: Model, pb: Numeric, sb: Numeric, ...dd: Numeric[]) {
  // single @id and @ext can only combine with single @base from inherited model
  if (context.program.stateMap(StateKeys.id).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'id/@base/@ext'},
    });
  }
  const id: IdType = {id: [pb, sb, ...dd], isExt: false};
  context.program.stateMap(StateKeys.id).set(target, id);
  context.program.stateSet(StateKeys.id).add(target);
}

/**
 * Implementation of the `@base` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param dd further message ID parts.
 */
export function $base(context: DecoratorContext, target: Model, pb: Numeric, sb: Numeric, ...dd: Numeric[]) {
  // single @id and @ext can only combine with single @base from inherited model
  if (context.program.stateMap(StateKeys.id).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'base/@id/@ext'},
    });
  }
  const id: IdType = {id: [pb, sb, ...dd]};
  context.program.stateMap(StateKeys.id).set(target, id);
}

/**
 * Implementation of the `@ext` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param dd further message ID parts.
 */
export function $ext(context: DecoratorContext, target: Model, ...dd: Numeric[]) {
  // single @id and @ext can only combine with single @base from inherited model
  if (context.program.stateMap(StateKeys.id).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'ext/@id/@base'},
    });
  }
  const id: IdType = {id: dd, isExt: true};
  context.program.stateMap(StateKeys.id).set(target, id);
  context.program.stateSet(StateKeys.id).add(target);
}

/**
 * Accessor for the `@id`/`@base`/`@ext` decorators.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getId(program: Program, target: Model): number[] | undefined {
  const ids = program.stateMap(StateKeys.id).get(target) as IdType;
  return ids?.id.map(v => getNum(v) as number).filter(v => v!==undefined);
}

/**
 * Accessor for the `@id`/`@base`/`@ext` decorators with metadata
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getIdType(program: Program, target: Model): {isExt?: boolean, id: number[]} | undefined {
  const ids = program.stateMap(StateKeys.id).get(target) as IdType;
  if (!ids) {
    return;
  }
  return {...ids, id: ids.id.map(v => getNum(v) as number).filter(v => v!==undefined)};
}

/**
 * Implementation of the `@chain` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param length the (maximum) length of a single message part of this chain, or 0 for default (=24).
 * @param dd second message ID part the chain is built from (first one taken from id or ext decorator).
 * @param dds list of further message ID parts the chain is built from.
 */
export function $chain(context: DecoratorContext, target: Model, length: Numeric, dd: Numeric[], ...dds: Numeric[][]) {
  const val = getNum(length);
  if (val===undefined || val<0 || val>30) { // 0 is allowed as replacement for default=24, 31 is ebusd MAX_LEN
    reportDiagnostic(context.program, {
      code: "banned-length",
      target: context.getArgumentTarget(0)!,
      format: { which: 'chain', value: val!==undefined && val>30 ? '30' : '<0' },
    });
  }
  // required combination with @id checked by $onValidate
  if (context.program.stateMap(StateKeys.chain).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'chain'},
    });
  }  
  context.program.stateMap(StateKeys.chain).set(target, {length, dds: [dd, ...dds]});
}

/**
 * Accessor for the `@chain` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getChain(program: Program, target: Model): {length: number, dds: number[][]} | undefined {
  const {length, dds} = (program.stateMap(StateKeys.chain).get(target)??{}) as {length: Numeric, dds: Numeric[][]};
  if (!dds || length===undefined) {
    return;
  }
  // silently discards empty parts
  return {
    length: getNum(length)!,
    dds: dds.map(dd => dd?.map(v => getNum(v) as number).filter(v => v!==undefined)).filter(dd => dd!==undefined && dd.length),
  }
}

/**
 * Implementation of the `@inherit` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param first the primary inherited model.
 * @param other further inherited models.
 */
export function $inherit(context: DecoratorContext, target: Model, first: Model, ...other: Model[]) {
  if (context.program.stateMap(StateKeys.inherit).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'inherit'},
    });
  }
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

/**
 * Implementation of the `@maxBits` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $maxBits(context: DecoratorContext, target: Scalar, value: Numeric) {
  const val = getNum(value);
  if (val===undefined || val<=0 || val>7) {
    reportDiagnostic(context.program, {
      code: "banned-length",
      target: context.getArgumentTarget(0)!,
      format: { which: 'maxBits', value: val!==undefined && val>7 ? '7' : '<0' },
    });
  }
  if (context.program.stateMap(StateKeys.maxBits).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'maxBits'},
    });
  }
  context.program.stateMap(StateKeys.maxBits).set(target, val);
}

/**
 * Accessor for the `@maxBits` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getMaxBits(program: Program, target: Scalar): number | undefined {
  return getNum(program.stateMap(StateKeys.maxBits).get(target));
}

setTypeSpecNamespace("internal", $reverse, $bcd, $hex, $maxBits);


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
export function $divisor(context: DecoratorContext, target: Scalar|ModelProperty, value: Numeric) {
  const val = getNum(value);
  // todo report on boolean and bit types
  // this works only for direct Scalars, not for indirect ones via ModelProperty:
  const isPlainTime = target.kind==='Scalar' && isIntrinsicType(context.program, target, 'plainTime'); // for internal time types
  if (!(isNumericType(context.program, getPropertyType(target)) || isPlainTime)
  || val===undefined || val<=0
  || context.program.stateMap(StateKeys.values).has(target)) {
    reportDiagnostic(context.program, {
      code: "banned-divisor",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
    return;
  }
  if (context.program.stateMap(StateKeys.divisor).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'divisor/@factor'},
    });
  }
  context.program.stateMap(StateKeys.divisor).set(target, val);
}

/**
 * Implementation of the `@factor` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $factor(context: DecoratorContext, target: Scalar|ModelProperty, value: Numeric) {
  const val = getNum(value);
  const isPlainTime = target.kind==='Scalar' && isIntrinsicType(context.program, target, 'plainTime'); // for internal time types
  if (!(isNumericType(context.program, getPropertyType(target)) || isPlainTime)
  || val===undefined || val<=0
  || context.program.stateMap(StateKeys.values).has(target)) {
    reportDiagnostic(context.program, {
      code: "banned-factor",
      target: context.getArgumentTarget(0)!,
      format: { value: value.toString() },
    });
    return;
  }
  if (context.program.stateMap(StateKeys.divisor).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'factor/@divisor'},
    });
  }
  context.program.stateMap(StateKeys.divisor).set(target, 1.0/val);
}

/**
 * Accessor for the `@divisor` decorator.
 *
 * @param program TypeSpec program.
 * @param target Decorator target.
 * @returns value if provided on the given target or undefined.
 */
export function getDivisor(program: Program, target: Scalar|ModelProperty): number | undefined {
  return getNum(program.stateMap(StateKeys.divisor).get(target));
}

/**
 * Implementation of the `@values` decorator.
 *
 * @param context Decorator context.
 * @param target Decorator target.
 * @param value the value to set.
 */
export function $values(context: DecoratorContext, target: Scalar|ModelProperty, value: Enum) {
  if (context.program.stateMap(StateKeys.values).has(target)) {
    reportDiagnostic(context.program, {
      code: "multiple-decorator",
      target: context.getArgumentTarget(0)!,
      format: { which: 'values'},
    });
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
