import "./types.tsp";

namespace Ebus;
using Ebus.num;

namespace id {

  enum manufacturers {
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

  @values(manufacturers)
  scalar manufacturer extends UCH

  model id_read {}
  @zz(BROADCAST)
  @passive
  model id_bcast {}
  @zz(BROADCAST)
  model id_write {}

  /** identification */
  @inherit(id_read, id_bcast, id_write) @id(0x07, 0x04)
  model id {
    /** device manufacturer */
    mf?: manufacturer,
    /** device id */
    id?: num.PIN,
    /** software version */
    sw?: num.PIN,
    /** hardware version */
    hw?: num.PIN,
  }
}
