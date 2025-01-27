import "../dist/src/index.js";
import "./types.tsp";

using TypeSpec.Reflection;

namespace Ebus;


/**
 * Define a condition for the whole message by checking an own model or property.
 * This decorator and `@conditionExt` can be used multiple times to check that all conditions are met.
 * @param property the referenced model property, or a model in case of existance check or single property only.
 * @param values the optional alternative values the property needs to match (one of the values must match for the condition to be met).
 * For numeric values, a single value (e.g. "18"), a value range separated by dash (e.g. "19-22"), or a value range with comparison (e.g. "<=5", ">10") can be used.
 * For string values, the value needs to be put in single quotes (e.g. 'abc').
 */
extern dec condition(target: Namespace|Model|UnionVariant, property: ModelProperty|Model,
  ...values: valueof string[]);

/**
 * Define a condition for the whole message by checking another target address model or property.
 * This decorator and `@condition` can be used multiple times to check that all conditions are met.
 * @param property the referenced model property, or a model in case of existance check or single property only.
 * @param zz the target address ZZ.
 * @param values the optional alternative values the property needs to match (one of the values must match for the condition to be met).
 * For numeric values, a single value (e.g. "18"), a value range separated by dash (e.g. "19-22"), or a value range with comparison (e.g. "<=5", ">10") can be used.
 * For string values, the value needs to be put in single quotes (e.g. 'abc').
 */
extern dec conditionExt(target: Namespace|Model|UnionVariant, property: ModelProperty|Model, zz: valueof target, ...values: valueof string[]);

/**
 * Define write direction.
 * @param toSource true to use the source address pendant of the target address instead of the target address.
 */
extern dec write(target: Model, toSource?: valueof boolean);

/**
 * Define passive only.
 */
extern dec passive(target: Model);

/**
 * Define the poll priority (only for active read).
 * @param value the poll priority (between 1 and 9).
 */
extern dec poll(target: Model, value?: valueof uint8);

/**
 * Define authentication level.
 * @param value the authentication level (e.g. 'install').
 */
extern dec auth(target: Model, value: valueof string);

/**
 * Define the source address.
 * @param value the source address QQ.
 */
extern dec qq(target: Model, value?: valueof source);

/**
 * Define the target address.
 * @param value the target address ZZ.
 */
extern dec zz(target: Model|Namespace, value?: valueof target);

/**
 * Define the whole message ID.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param dd further message ID parts.
 */
extern dec id(target: Model, pb: valueof pb, sb: valueof sb, ...dd: valueof symbol[]);

/**
 * Define the base message ID to be combined with an extension ID.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param dd further message ID parts.
 */
extern dec base(target: Model, pb: valueof pb, sb: valueof sb, ...dd: valueof symbol[]);

/**
 * Define the extension message ID to be combined with a base ID.
 * @param dd message ID extensions parts.
 */
extern dec ext(target: Model, ...dd: valueof symbol[]);

/**
 * Define chained message IDs.
 * @param length the (maximum) length of a single message part of this chain, or 0 for default (=24).
 * @param dd second message ID part the chain is built from (first one taken from id or ext decorator).
 * @param dds list of further message ID parts the chain is built from.
 */
extern dec chain(target: Model, length: valueof uint8, dd: valueof symbol[], ...dds: valueof symbol[][]);

/**
 * Define the inherited model(s).
 * @param models inherited models.
 */
extern dec inherit(target: Model, ...models: Model[]);

/**
 * Define a data example.
 * @param desc a text describing the example.
 * @param q the query part of the message, i.e. pb, sb, and dd bytes sent to the target.
 * @param a the answer part of the message, i.e. dd bytes received from the target.
 */
extern dec example(target: Model, desc: valueof string, q: valueof string|symbol[], a?: valueof string|symbol[]);

/**
 * Define message part outbound to target.
 * @param writeOnly optional true to put in only if write direction, false to put in only if read direction (alyways if absent).
 */
extern dec out(target: ModelProperty, writeOnly?: valueof boolean);

/**
 * Define message part inbound from target.
 * @param writeOnly optional true to put in only if write direction, false to put in only if read direction (alyways if absent).
 */
extern dec in(target: ModelProperty, writeOnly?: valueof boolean);

/**
 * Define the unit.
 * @param value the unit.
 */
extern dec unit(target: numeric|ModelProperty, value: valueof string);

/**
 * Define the divisor.
 * @param value the divisor.
 */
extern dec divisor(target: numeric|plainTime|ModelProperty, value: valueof numeric);

/**
 * Define the factor.
 * @param value the factor.
 */
extern dec factor(target: numeric|plainTime|ModelProperty, value: valueof numeric);

/**
 * Define the increment/decrement step value (useful in combination with `@minValue` and/or `@maxValue`).
 * @param value the increment/decrement step value.
 */
extern dec step(target: numeric|ModelProperty, value: valueof numeric);

/**
 * Define the known values.
 * @param values the known values.
 */
extern dec values(target: numeric|boolean|ModelProperty, values: Enum);

/**
 * Define the const value.
 * @param value the const value.
 */
extern dec constValue(target: numeric|boolean|ModelProperty, value: valueof numeric|string);


namespace Internal {
  /**
   * Define reverse representation.
   * For numeric types this means most significant byte first (big-endian)
   * instead of least significant byte first (little-endian).
   * For date/time types coded as sequence of individual parts this means reverse sequence
   * (i.e. year,month,day instead of day,month,year for dates
   * and seconds,minutes,hours instead of hours,minutes,seconds for times).
   */
  extern dec reverse(target: Scalar);

  /**
   * Define BCD encoding.
   */
  extern dec bcd(target: Scalar);

  /**
   * Define HEX encoding.
   */
  extern dec hex(target: Scalar);

  /**
   * Define the max bits.
   * @param value the max bits.
   */
  extern dec maxBits(target: numeric, value: valueof uint8);
}
