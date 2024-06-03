namespace Ebus;

/** A symbol on the bus. */
scalar Symbol extends uint8

/** List of special symbols. */
union symbols {
  SYN: 0xaa,
  ESC: 0xa9,
  Symbol,
}

/** A source address 'QQ. */
scalar Source extends Symbol

/** A target address 'ZZ'. */
scalar Target extends Symbol

/** List of special target addresses. */
union targets {
  /** the special broadcast target address. */
  Broadcast: 0xfe,
  Target,
}
/** the special broadcast target address. */
alias BROADCAST = 0xfe; // todo should be possible as targets.Broadcast someday

/** the primary command symbol 'PB'. */
scalar Pb extends Symbol

/** the secondary command symbol 'SB'. */
scalar Sb extends Symbol

/** The known numeric base types. */
namespace num {
  @encode("uint8")
  scalar BI0 extends boolean
  @encode("uint8")
  scalar BI1 extends boolean
  @encode("uint8")
  scalar BI2 extends boolean
  @encode("uint8")
  scalar BI3 extends boolean
  @encode("uint8")
  scalar BI4 extends boolean
  @encode("uint8")
  scalar BI5 extends boolean
  @encode("uint8")
  scalar BI6 extends boolean
  @encode("uint8")
  scalar BI7 extends boolean
  @internal.maxBits(7)
  scalar BI0_7 extends uint8

  scalar UCH extends uint8
  scalar SCH extends int8
  alias D1B = SCH;
  @internal.bcd
  scalar BCD extends uint8
  @internal.hex
  scalar HCD extends uint8
  @divisor(2)
  scalar D1C extends uint8

  @internal.reverse
  @internal.bcd
  scalar PIN extends uint16
  scalar UIN extends uint16
  @internal.reverse
  scalar UIR extends UIN
  scalar SIN extends int16
  @internal.reverse
  scalar SIR extends SIN
  @internal.hex
  scalar HCD2 extends uint16

  @divisor(256)
  scalar D2B extends int16

  @divisor(16)
  scalar D2C extends int16

  @divisor(1000)
  scalar FLT extends int16
  @internal.reverse
  scalar FLR extends FLT

  //todo 3 byte int
  @internal.bcd
  scalar BCD3 extends uint32 // todo 3 bytes
  @internal.hex
  scalar HCD3 extends uint32 // todo 3 bytes

  scalar ULG extends uint32
  @internal.reverse
  scalar ULR extends ULG
  scalar SLG extends int32
  @internal.reverse
  scalar SLR extends SLG
  @internal.bcd
  scalar BCD4 extends uint32
  @internal.hex
  scalar HCD4 extends uint32

  scalar EXP extends float32
  @internal.reverse
  scalar EXR extends EXP
}

/** The known string base types. */
namespace str {
  @maxLength(31)
  scalar STR extends string
  @encode("nullterm") // todo
  @maxLength(31)
  scalar NTS extends string
  @maxLength(31)
  scalar IGN extends string // todo bytes would be more logical, but have not length limit
  @internal.hex
  @maxLength(31)
  scalar HEX extends string
}

/** The known date/time base types. */
namespace dtm {
  scalar BDY extends uint8 // todo weekday
  scalar HDY extends uint8 // todo weekday
  @internal.bcd
  @encode("", uint32)
  scalar BDA extends plainDate
  alias BDA4 = BDA;
  scalar BDA3 extends BDA // todo 3 bytes
  scalar BDZ extends BDA
  @internal.hex
  @encode("", uint32)
  scalar HDA extends plainDate
  alias HDA4 = HDA;
  scalar HDA3 extends HDA
  @encode("", uint16)
  scalar DAY extends plainDate
  @encode("", uint32)
  scalar DTM extends offsetDateTime

  @internal.bcd
  scalar BTI extends plainTime // todo 3 bytes
  @internal.hex
  scalar HTI extends plainTime // todo 3 bytes
  @internal.reverse
  scalar VTI extends HTI
  @internal.bcd
  @encode("", uint16)
  scalar BTM extends plainTime
  @internal.reverse
  scalar VTM extends BTM
  @internal.hex
  @encode("", uint16)
  scalar HTM extends plainTime
  @encode("", uint16)
  scalar MIN extends plainTime // todo check if rather duration
  @divisor(10)
  @encode("", uint8)
  scalar TTM extends plainTime
  @divisor(30)
  @encode("", uint8)
  scalar TTH extends plainTime
  @divisor(15)
  @encode("", uint8) // todo actually 7 bits
  scalar TTQ extends plainTime
}
