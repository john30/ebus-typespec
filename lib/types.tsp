namespace Ebus;

scalar Symbol extends uint8

scalar Source extends Symbol

scalar Target extends Symbol

scalar Pb extends Symbol

scalar Sb extends Symbol

namespace num {
  scalar BI0_1 extends boolean
  scalar BI1_1 extends boolean
  scalar BI2_1 extends boolean
  scalar BI3_1 extends boolean
  scalar BI4_1 extends boolean
  scalar BI5_1 extends boolean
  scalar BI6_1 extends boolean
  scalar BI7 extends boolean

  scalar UCH extends uint8
  scalar SCH extends int8
  alias D1B = SCH;

  @divisor(2)
  scalar D1C extends uint8

  @reverse
  @bcd
  scalar PIN extends uint16
  scalar UIN extends uint16
  @reverse
  scalar UIR extends UIN
  scalar SIN extends int16
  @reverse
  scalar SIR extends SIN

  @divisor(256)
  scalar D2B extends int16

  @divisor(16)
  scalar D2C extends int16

  @divisor(1000)
  scalar FLT extends int16
  @reverse
  scalar FLR extends FLT

  //todo 3 byte int

  scalar ULG extends uint32
  @reverse
  scalar ULR extends ULG
  scalar SLG extends int32
  @reverse
  scalar SLR extends SLG

  scalar EXP extends float32
  @reverse
  scalar EXR extends EXP
}

namespace str {
  @maxLength(31)
  scalar UCH extends string
  @maxLength(31)
  scalar NTS extends string // todo mark as special
  @maxLength(31)
  scalar IGN extends string // todo bytes would be more logical, but have not length limit
  @hex
  @maxLength(31)
  scalar HEX extends string
}

namespace dtm {
  @bcd
  scalar BDA extends plainDate
  alias BDA4 = BDA;
  scalar BDA3 extends BDA
  scalar BDZ extends BDA
  @hex
  scalar HDA extends plainDate
  alias HDA4 = HDA;
  scalar HDA3 extends HDA
  scalar DAY extends plainDate // todo uint16 based
  scalar DTM extends offsetDateTime

  @bcd
  scalar BTI extends plainTime
  @hex
  scalar HTI extends plainTime
  @reverse
  scalar VTI extends HTI
  @bcd
  scalar BTM extends plainTime // todo uint16 based
  @reverse
  scalar VTM extends BTM
  @hex
  scalar HTM extends plainTime // todo uint16 based
  scalar MIN extends plainTime // todo check if rather duration
  @divisor(10)
  scalar TTM extends plainTime
  @divisor(30)
  scalar TTH extends plainTime
  @divisor(15)
  scalar TTQ extends plainTime
}