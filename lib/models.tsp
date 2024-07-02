import "./types.tsp";

namespace Ebus;
using Ebus.Num;
using Ebus.Str;

namespace Id {

  enum Values_manufacturers {
    Dungs: 0x06,
    "FH Ostfalia": 0x0f,
    TEM: 0x10,
    Lamberti: 0x11,
    CEB: 0x14,
    "Landis-Staefa": 0x15,
    FERRO: 0x16,
    MONDIAL: 0x17,
    Wikon: 0x18,
    Wolf: 0x19,
    RAWE: 0x20,
    Satronic: 0x30,
    ENCON: 0x40,
    Kromschröder: 0x50,
    Eberle: 0x60,
    EBV: 0x65,
    Grässlin: 0x75,
    "ebm-papst": 0x85,
    SIG: 0x95,
    Theben: 0xa5,
    Thermowatt: 0xa7,
    Vaillant: 0xb5,
    Toby: 0xc0,
    Weishaupt: 0xc5,
    "ebusd.eu": 0xfd,
    ebusd: 0xfd,
    // Pb, // <= this is how to declare the base type as it seems for unions, see https://github.com/microsoft/typespec/issues/2737
  }

  @values(Values_manufacturers)
  scalar manufacturer extends UCH;

  /** identification */
  @id(0x07, 0x04)
  model Id {
    /** device manufacturer */
    mf?: manufacturer,
    /** device id */
    @maxLength(5)
    id?: STR,
    /** software version */
    sw?: PIN,
    /** hardware version */
    hw?: PIN,
  }

  /** answer to identification query */
  @zz(BROADCAST)
  @passive
  model IdAnswer is Id;

  /** query identification */
  @zz(BROADCAST)
  model IdQuery is Id;
}
