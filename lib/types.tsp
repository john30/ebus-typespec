namespace Ebus;

/** A symbol on the bus. */
scalar symbol extends uint8;

/** List of special symbols. */
union Symbols {
  SYN: 0xaa,
  ESC: 0xa9,
  symbol,
}

/** A source address 'QQ. */
scalar source extends symbol;

/** A target address 'ZZ'. */
scalar target extends symbol;

/** List of special target addresses. */
union Targets {
  /** the special broadcast target address. */
  broadcast: 0xfe,
  target,
}
/** the special broadcast target address. */
alias BROADCAST = Targets.broadcast;

/** the primary command symbol 'PB'. */
scalar pb extends symbol;

/** the secondary command symbol 'SB'. */
scalar sb extends symbol;

/** The known numeric base data types. */
namespace Num {
  // 1 byte length

  /** bit 0. */
  @encode("uint8")
  scalar BI0 extends boolean;
  /** bit 1. */
  @encode("uint8")
  scalar BI1 extends boolean;
  /** bit 2. */
  @encode("uint8")
  scalar BI2 extends boolean;
  /** bit 3. */
  @encode("uint8")
  scalar BI3 extends boolean;
  /** bit 4. */
  @encode("uint8")
  scalar BI4 extends boolean;
  /** bit 5. */
  @encode("uint8")
  scalar BI5 extends boolean;
  /** bit 6. */
  @encode("uint8")
  scalar BI6 extends boolean;
  /** bit 7. */
  @encode("uint8")
  scalar BI7 extends boolean;
  /** 6 bits starting from bit 0. */
  @Internal.maxBits(6)
  scalar BI0_6 extends uint8;
  /** 7 bits starting from bit 0. */
  @Internal.maxBits(7)
  scalar BI0_7 extends uint8;

  /** 1 byte unsigned integer, 0 - 254, replacement 0xff. */
  @minValue(0) @maxValue(0xfe)
  scalar UCH extends uint8;
  /** 1 byte unsigned integer, 0 - 255 (no replacement). */
  @minValue(0) @maxValue(0xff)
  scalar U1L extends uint8;
  /** 1 byte signed integer, -127 - +127, replacement 0x80. */
  @minValue(-127) @maxValue(0x7f)
  scalar SCH extends int8;
  /** same as SCH. */
  alias D1B = SCH;
  /** 1 byte signed integer, -128 - +127 (no replacement) */
  @minValue(-128) @maxValue(0x7f)
  scalar S1L extends int8;
  /** 1 byte unsigned decimal in BCD, 0 - 99, replacement 0xff. */
  @minValue(0) @maxValue(99)
  @Internal.bcd
  scalar BCD extends uint8;
  /**
   * 1 byte unsigned decimal digits in hex, 0 - 99
   * (0x00 - 0x63).
   */
  @minValue(0) @maxValue(99)
  @Internal.hex
  scalar HCD extends uint8;
  /**
   * 1 byte unsigned number (fraction 1/2), 0 - 100
   * (0x00 - 0xc8, replacement 0xff).
   */
  @divisor(2)
  @minValue(0) @maxValue(100)
  scalar D1C extends uint8;

  // 2 byte length

  /** 2 byte unsigned decimal in BCD, shown as 4 digits, 0000 - 9999 (fixed length). */
  @minValue(0) @maxValue(9999)
  @Internal.reverse
  @Internal.bcd
  scalar PIN extends uint16;
  /** 2 byte unsigned integer, 0 - 65534, replacement 0xffff. */
  @minValue(0) @maxValue(0xfffe)
  scalar UIN extends uint16;
  /** 2 byte unsigned integer, 0 - 65534, replacement 0xffff, big endian. */
  @minValue(0) @maxValue(0xfffe)
  @Internal.reverse
  scalar UIR extends UIN;
  /** 2 byte unsigned integer, 0 - 65535 (no replacement), little endian. */
  @minValue(0) @maxValue(0xffff)
  scalar U2L extends uint16;
  /** 2 byte unsigned integer, 0 - 65535 (no replacement), big endian. */
  @minValue(0) @maxValue(0xffff)
  @Internal.reverse
  scalar U2B extends uint16;
  /** 2 byte signed integer, -32767 - +32767, replacement 0x8000. */
  @minValue(-32767) @maxValue(0x7fff)
  scalar SIN extends int16;
  /** 2 byte signed integer, -32767 - +32767, replacement 0x8000, big endian. */
  @minValue(-32767) @maxValue(0x7fff)
  @Internal.reverse
  scalar SIR extends SIN;
  /** 2 byte signed integer, -32768 - +32767 (no replacement), little endian. */
  @minValue(-32768) @maxValue(0x7fff)
  scalar S2L extends int16;
  /** 2 byte signed integer, -32768 - +32767 (no replacement), big endian. */
  @minValue(-32768) @maxValue(0x7fff)
  @Internal.reverse
  scalar S2B extends SIN;
  /** 2 byte unsigned decimal in BCD, 0 - 9999, replacement 0xffff. */
  @minValue(0) @maxValue(9999)
  @Internal.bcd
  scalar BCD2 extends uint16;
  /**
   * 2 byte unsigned decimal digits in hex, 0 - 9999
   * (0x00,0x00 - 0x63,0x63).
   */
  @minValue(0) @maxValue(9999)
  @Internal.hex
  scalar HCD2 extends uint16;
  /**
   * 2 byte signed number (fraction 1/256), -127.99 - +127.99 .
   */
  @divisor(256)
  scalar D2B extends int16;
  /**
   * 2 byte signed number (fraction 1/16), -2047.9 - +2047.9 .
   */
  @divisor(16)
  scalar D2C extends int16;
  /**
   * 2 byte signed number (fraction 1/1000), -32.767 - +32.767 .
   */
  @divisor(1000)
  scalar FLT extends int16;
  /**
   * 2 byte signed number (fraction 1/1000), -32.767 - +32.767, big endian.
   */
  @Internal.reverse
  scalar FLR extends FLT;

  // 3 byte length

  //todo 3 byte int
  /** 3 byte unsigned decimal in BCD, 0 - 999999, replacement 0xffffff. */
  @minValue(0) @maxValue(999999)
  @Internal.bcd
  scalar BCD3 extends uint32; // todo 3 bytes
  /**
   * 3 byte unsigned decimal digits in hex, 0 - 999999
   * (0x00,0x00,0x00 - 0x63,0x63,0x63).
   */
  @minValue(0) @maxValue(999999)
  @Internal.hex
  scalar HCD3 extends uint32; // todo 3 bytes
  /** 3 byte unsigned integer, 0 - 16777214, replacement 0xffffff. */
  @minValue(0) @maxValue(0xfffffe)
  scalar U3N extends uint32; // todo 3 bytes
  /** 3 byte unsigned integer, 0 - 16777214, replacement 0xffffff, big endian. */
  @minValue(0) @maxValue(0xfffffe)
  @Internal.reverse
  scalar U3R extends U3N; // todo 3 bytes
  /** 3 byte unsigned integer, 0 - 16777215 (no replacement), little endian. */
  @minValue(0) @maxValue(0xffffff)
  scalar U3L extends uint32; // todo 3 bytes
  /** 3 byte unsigned integer, 0 - 16777215 (no replacement), big endian. */
  @minValue(0) @maxValue(0xffffff)
  @Internal.reverse
  scalar U3B extends U3N; // todo 3 bytes
  /** 3 byte signed integer, -8388607 - +8388607, replacement 0x800000. */
  @minValue(-8388607) @maxValue(0x7fffff)
  scalar S3N extends int32; // todo 3 bytes
  /** 3 byte signed integer, -8388607 - +8388607, replacement 0x800000, big endian. */
  @minValue(-8388607) @maxValue(0x7fffff)
  @Internal.reverse
  scalar S3R extends S3N; // todo 3 bytes
  /** 3 byte signed integer, -8388608 - +8388607 (no replacement), little endian. */
  @minValue(-8388608) @maxValue(0x7fffff)
  scalar S3L extends int32; // todo 3 bytes
  /** 3 byte signed integer, -8388608 - +8388607 (no replacement), big endian. */
  @minValue(-8388608) @maxValue(0x7fffff)
  @Internal.reverse
  scalar S3B extends S3N; // todo 3 bytes

  // 4 byte length

  /** 4 byte unsigned integer, 0 - 4294967294, replacement 0xffffffff. */
  @minValue(0) @maxValue(0xfffffffe)
  scalar ULG extends uint32;
  /** 4 byte unsigned integer, 0 - 4294967294, replacement 0xffffffff, big endian. */
  @minValue(0) @maxValue(0xfffffffe)
  @Internal.reverse
  scalar ULR extends ULG;
  /** 4 byte unsigned integer, 0 - 4294967295 (no replacement), little endian. */
  @minValue(0) @maxValue(0xffffffff)
  scalar U4L extends uint32;
  /** 4 byte unsigned integer, 0 - 4294967295 (no replacement), big endian. */
  @minValue(0) @maxValue(0xffffffff)
  @Internal.reverse
  scalar U4B extends ULG;
  /** 4 byte signed integer, -2147483647 - +2147483647, replacement 0x80000000. */
  @minValue(-2147483647) @maxValue(0x7fffffff)
  scalar SLG extends int32;
  /** 4 byte signed integer, -2147483647 - +2147483647, replacement 0x80000000, big endian. */
  @minValue(-2147483647) @maxValue(0x7fffffff)
  @Internal.reverse
  scalar SLR extends SLG;
  /** 4 byte signed integer, -2147483647 - +2147483648 (no replacement), little endian. */
  @minValue(-2147483647) @maxValue(0x7fffffff)
  scalar S4L extends int32;
  /** 4 byte signed integer, -2147483647 - +2147483648 (no replacement), big endian. */
  @minValue(-2147483647) @maxValue(0x7fffffff)
  @Internal.reverse
  scalar S4B extends SLG;
  /** 4 byte unsigned decimal in BCD, 0 - 99999999, replacement 0xffffffff. */
  @minValue(0) @maxValue(99999999)
  @Internal.bcd
  scalar BCD4 extends uint32;
  /**
   * 4 byte unsigned decimal digits in hex, 0 - 99999999
   * (0x00,0x00,0x00,0x00 - 0x63,0x63,0x63,0x63).
   */
  @minValue(0) @maxValue(99999999)
  @Internal.hex
  scalar HCD4 extends uint32;
  /**
   * 4 byte signed number in IEEE 754
   * (IEEE 754 binary32: 1 bit sign, 8 bits exponent, 23 bits significand).
   */
  scalar EXP extends float32;
  /**
   * 4 byte signed number in IEEE 754, big endian
   * (IEEE 754 binary32: 1 bit sign, 8 bits exponent, 23 bits significand).
   */
  @Internal.reverse
  scalar EXR extends EXP;
}

/** The known string base data types. */
namespace Str {
  /** >= 1 byte character string filled up with space. */
  @maxLength(31)
  scalar STR extends string;
  /** >= 1 byte character string filled up with 0x00 (null terminated string). */
  @encode("nullterm") // todo
  @maxLength(31)
  scalar NTS extends string;
  /** >= 1 byte ignored data. */
  @maxLength(31)
  scalar IGN extends string; // todo bytes would be more logical, but have not length limit
  /** >= 1 byte hex digit string, usually separated by space, e.g. 0a 1b 2c 3d. */
  @Internal.hex
  @maxLength(31)
  scalar HEX extends string;
}

/** The known date/time base data types. */
namespace Dtm {
  /**
   * 1 byte weekday, "Mon" - "Sun"
   * (0x00 - 0x06).
   */
  @minValue(0) @maxValue(0x06)
  scalar BDY extends uint8; // todo weekday values
  /**
   * 1 byte weekday, "Mon" - "Sun" [Vaillant type]
   * (0x01 - 0x07).
   */
  @minValue(1) @maxValue(0x07)
  scalar HDY extends uint8; // todo weekday values
  /**
   * 4 byte date with weekday in BCD, 01.01.2000 - 31.12.2099
   * (0x01,0x01,WW,0x00 - 0x31,0x12,WW,0x99, WW is weekday Mon=0x01 - Sun=0x07, replacement 0xff).
   */
  @Internal.bcd
  @encode("", uint32)
  scalar BDA extends plainDate;
  /** same as BDA. */
  alias BDA4 = BDA;
  /**
   * 3 byte date in BCD, 01.01.2000 - 31.12.2099
   * (0x01,0x01,0x00 - 0x31,0x12,0x99, replacement 0xff).
   */
  scalar BDA3 extends BDA; // todo 3 bytes
  /**
   * 3 byte date with zero-based weekday in BCD, 01.01.2000 - 31.12.2099
   * (0x01,0x01,WZ,0x00 - 0x31,0x12,WZ,0x99, WZ is zero-based weekday Mon=0x00 - Sun=0x06, replacement 0xff).
   */
  scalar BDZ extends BDA;
  /**
   * 4 byte date with weekday, 01.01.2000 - 31.12.2099
   * (0x01,0x01,WW,0x00 - 0x1f,0x0c,WW,0x63, WW is weekday Mon=0x01 - Sun=0x07, replacement 0xff).
   */
  @Internal.hex
  @encode("", uint32)
  scalar HDA extends plainDate;
  /** same as HDA. */
  alias HDA4 = HDA;
  /**
   * 3 byte date, 01.01.2000 - 31.12.2099
   * (0x01,0x01,0x00 - 0x1f,0x0c,0x63, replacement 0xff).
   */
  scalar HDA3 extends HDA; // todo 3 bytes
  /**
   * 2 byte date, days since 01.01.1900, 01.01.1900 - 06.06.2079
   * (0x00,0x00 - 0xff,0xff).
   */
  @encode("", uint16)
  scalar DAY extends plainDate;
  /**
   * 4 byte date+time in minutes since 01.01.2009, 01.01.2009 - 31.12.2099
   * (0x00,0x00,0x00,0x00 - 0x02,0xda,0x4e,0x1f).
   */
  @encode("", uint32)
  scalar DTM extends offsetDateTime;

  /**
   * 3 byte time in BCD, 00:00:00 - 23:59:59, seconds first
   * (0x00,0x00,0x00 - 0x59,0x59,0x23).
   */
  @Internal.bcd
  @Internal.reverse
  scalar BTI extends plainTime; // todo 3 bytes
  /**
   * 3 byte time, 00:00:00 - 23:59:59
   * (0x00,0x00,0x00 - 0x17,0x3b,0x3b).
   */
  @Internal.hex
  scalar HTI extends plainTime; // todo 3 bytes
  /**
   * 3 byte time, 00:00:00 - 23:59:59, seconds first [Vaillant type]
   * (0x00,0x00,0x00 - 0x3b,0x3b,0x17, replacement 0x63).
   */
  @Internal.reverse
  scalar VTI extends HTI;
  /**
   * 2 byte time as hh:mm in BCD, 00:00 - 23:59, minutes first
   * (0x00,0x00 - 0x59,0x23, replacement 0xff).
   */
  @Internal.bcd
  @Internal.reverse
  @encode("", uint16)
  scalar BTM extends plainTime;
  /**
   * 2 byte time as hh:mm, 00:00 - 23:59
   * (0x00,0x00 - 0x17,0x3b).
   */
  @Internal.hex
  @encode("", uint16)
  scalar HTM extends plainTime;
  /**
   * 2 byte time as hh:mm, 00:00 - 23:59, minutes first [Vaillant type]
   * (0x00,0x00 - 0x3b,0x17, replacement 0xff)
   */
  @Internal.reverse
  scalar VTM extends BTM;
  /**
   * 2 byte time, minutes since last midnight, 00:00 - 24:00
   * (minutes + hour * 60 as integer).
   */
  @encode("", uint16)
  scalar MIN extends plainTime; // todo check if rather duration
  /**
   * 1 byte truncated time (only multiple of 10 minutes), 00:00 - 24:00
   * (minutes div 10 + hour * 6 as integer).
   */
  @divisor(10)
  @encode("", uint8)
  scalar TTM extends plainTime;
  /**
   * 6 bit truncated time (only multiple of 30 minutes), 00:00 - 24:00
   * (minutes div 30 + hour * 2 as integer).
   */
  @divisor(30)
  @encode("", Num.BI0_6)
  scalar TTH extends plainTime;
  /**
   * 7 bit truncated time (only multiple of 15 minutes), 00:00 - 24:00
   * (minutes div 15 + hour * 4 as integer).
   */
  @divisor(15)
  @encode("", Num.BI0_7)
  scalar TTQ extends plainTime;
}

/** The known contributed base data types. */
namespace Contrib {
  /**
   * TEM_P parameter, "00-000" - "31-127"
   * (0x00,0x00 - 0xff,0x0f).
   */
  scalar TEM_P extends uint16;
}
