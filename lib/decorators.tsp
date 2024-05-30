import "../dist/src/decorators.js";
import "./types.tsp";

using TypeSpec.Reflection;

namespace Ebus;


/**
 * Define write direction.
 */
extern dec write(target: Model|Namespace);

/**
 * Define passive only.
 */
extern dec passive(target: Model|Namespace);

/**
 * Define the source address.
 * @param value the source address QQ.
 */
extern dec qq(source: Model|Namespace, value?: valueof Source);

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
extern dec id(target: Model|Namespace, pb: valueof Pb, sb: valueof Sb, ...id: valueof Symbol[]);

/**
 * Define the base message ID to be combined with an extension ID.
 * @param pb the primary message ID.
 * @param sb the secondary message ID.
 * @param id further message ID parts.
 */
extern dec base(target: Model|Namespace, pb: valueof Pb, sb: valueof Sb, ...id: valueof Symbol[]);

/**
 * Define the extension message ID to be combined with a base ID.
 * @param id message ID extensions parts.
 */
extern dec ext(target: Model|Namespace, ...id: valueof Symbol[]);

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
extern dec unit(target: Scalar|ModelProperty, value?: valueof string);

/**
 * Define the divisor.
 * @param value the divisor.
 */
extern dec divisor(target: Scalar|ModelProperty, value?: valueof numeric);


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
}
