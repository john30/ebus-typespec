import "../dist/src/decorators.js";
import "./types.tsp";

using TypeSpec.Reflection;

namespace Ebus;


/**
 * Define condition for the whole message.
 * @param property the referenced model property, or a model in case of existance check or single property only.
 * @param values the optional alternative values the property needs to match.
 */
extern dec cond(target: Namespace|Model|UnionVariant, property: ModelProperty|Model, ...values: valueof string[]);

/**
 * Define write direction.
 */
extern dec write(target: Model);

/**
 * Define passive only.
 */
extern dec passive(target: Model);

/**
 * Define authentication.
 */
extern dec auth(target: Model, auth: valueof string);

/**
 * Define the source address.
 * @param value the source address QQ.
 */
extern dec qq(source: Model, value?: valueof Source);

/**
 * Define the target address.
 * @param value the target address ZZ.
 */
extern dec zz(target: Model|Namespace, value?: valueof Target);

/**
 * Define the whole message ID.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param id further message ID parts.
 */
extern dec id(target: Model, pb: valueof Pb, sb: valueof Sb, ...id: valueof Symbol[]);

/**
 * Define the base message ID to be combined with an extension ID.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param id further message ID parts.
 */
extern dec base(target: Model, pb: valueof Pb, sb: valueof Sb, ...id: valueof Symbol[]);

/**
 * Define the extension message ID to be combined with a base ID.
 * @param id message ID extensions parts.
 */
extern dec ext(target: Model, ...id: valueof Symbol[]);

/**
 * Define the inherited model(s).
 * @param models inherited models.
 */
extern dec inherit(target: Model, ...models: valueof Model[]);

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


namespace internal {
  /**
   * Define reverse representation.
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
  extern dec maxBits(target: numeric, value: valueof numeric);
}
