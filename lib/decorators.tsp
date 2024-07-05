import "../dist/src/index.js";
import "./types.tsp";

using TypeSpec.Reflection;

namespace Ebus;


/**
 * Define the condition(s) for the whole message (if given multiple times, all conditions must be met).
 * @param property the referenced model property, or a model in case of existance check or single property only.
 * @param values the optional alternative values the property needs to match (one of the values must match for the condition to be met).
 */
extern dec condition(target: Namespace|Model|UnionVariant, property: ModelProperty|Model, ...values: valueof string[]);

/**
 * Define write direction.
 */
extern dec write(target: Model);

/**
 * Define passive only.
 */
extern dec passive(target: Model);

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
 */
extern dec out(target: ModelProperty);

/**
 * Define message part inbound from target.
 */
extern dec in(target: ModelProperty);

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
 * Define the known values.
 * @param value the divisor.
 */
extern dec values(target: numeric|boolean|ModelProperty, values: Enum);


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
