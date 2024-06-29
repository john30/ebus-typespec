import {expectDiagnostics} from "@typespec/compiler/testing";
import assert from "assert";
import {describe, it} from "node:test";
import {emit, emitWithDiagnostics} from "./utils.js";

const headerLine =
  `type,circuit,level,name,comment,qq,zz,pbsb,id,`
  +`*name,part,type,divisor/values,unit,comment\n`;
const defaultLines = ['*r', '*w', '*u', '*uw'];
const stripHeader = (s: string) => {
  if (!s) {
    return s;
  }
  if (s.startsWith(headerLine)) {
    s = s.substring(headerLine.length);
  }
  s = s.trim();
  while (s) {
    const parts = s.split('\n', 2);
    if (!defaultLines.includes(parts[0])) {
      return s;
    }
    s = s.substring(parts[0].length+1).trim();
  }
  return s;
};

describe("emitting models", () => {
  it("works", async () => {
    const files = await emit(`
      using Ebus.Num;
      @qq(0x01)
      @zz(0x08)
      @id(0xb5, 0x09, 0x0e, 0x00, 0x01)
      /** a foo */
      model Foo {
        /** an x */
        @unit("y")
        @divisor(10)
        @out
        x: BCD4,
        z: UCH,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,a foo,01,08,b509,0e0001,x,m,BCD:4,10,y,an x,z,,UCH,,,"
    );
  });
  it("works with multiple", async () => {
    const files = await emit(`
      using Ebus.Num;
      @id(0,1)
      model Foo {
        x: UCH,
      }
      @id(0,2,1)
      model Bar {
        y: UCH,
        z: UCH,
      }
    `, undefined, {emitNamespace: true, emitTypes: ['test.Foo', 'test.Bar']});
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,x,,UCH,,,\n"+
      "r,Main,,Bar,,,,0002,01,y,,UCH,,,,z,,UCH,,,"
    );
  });
  it("works with derived types", async () => {
    const files = await emit(`
      using Ebus.Num;
      @unit("°C")
      /** temperature */
      scalar temp extends UCH;
      @id(0,1)
      model Foo {
        x: temp,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,x,,UCH,,°C,temperature"
    );
  });
  it("works with inherit", async () => {
    const files = await emit(`
      using Ebus.Num;
      @zz(8)
      @base(0,1,2)
      /** a base */
      model base {
        /** the b */
        b: UCH,
      }
      @ext(3,4)
      @inherit(base)
      /** a test */
      model Foo {
        /** an x */
        x: UCH,
      }
    `, undefined, {emitNamespace: true, emitTypes: ['test.Foo']});
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,a test,,08,0001,020304,b,,UCH,,,the b,x,,UCH,,,an x"
    );
  });
  it("works with multi inherit", async () => {
    const files = await emit(`
      using Ebus.Num;
      @base(0,1)
      model r {
      }
      @write
      @base(0,1)
      model w {
      }
      @ext
      @inherit(r,w)
      model Foo {
        x: UCH,
        y?: UCH,
      }
    `, undefined, {emitNamespace: true, emitTypes: ['test.Foo']});
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,x,,UCH,,,,y,,UCH,,,\n"+
      "w,Main,,Foo,,,,0001,,x,,UCH,,,"
    );
  });
  it("works with values", async () => {
    const files = await emit(`
      using Ebus.Num;
      @values(Values_men)
      scalar man extends UCH;
      enum Values_men {
        one: 1,
        two: 2,
      }
      @id(0,1)
      model Foo {
        m: man,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,m,,UCH,1=one;2=two,,"
    );
  });
  it("works with bits", async () => {
    const files = await emit(`
      using Ebus.Num;
      @id(0,1)
      model Foo {
        b0: BI0,
        b1: BI1,
        b2: BI2,
        b3: BI3,
        b4: BI4,
        b5: BI5,
        b6: BI6,
        b7: BI7,
        n: BI0_7,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,b0,,BI0,,,,b1,,BI1,,,,b2,,BI2,,,,b3,,BI3,,,,b4,,BI4,,,,b5,,BI5,,,,b6,,BI6,,,,b7,,BI7,,,,n,,BI0:7,,,"
    );
  });
  it("works with var length str", async () => {
    const files = await emit(`
      using Ebus.Str;
      @id(0,1)
      model Foo {
        s: STR,
        @maxLength(1)
        s1: STR,
        @maxLength(10)
        s5: STR,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,s,,STR,,,,s1,,STR:1,,,,s5,,STR:10,,,"
    );
  });
  it("works with remainder length str", async () => {
    const files = await emit(`
      using Ebus.Str;
      @id(0,1)
      model Foo {
        s: STR,
        @maxLength(1)
        s1: STR,
        @minLength(0)
        @maxLength(10)
        s5: STR,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,s,,STR,,,,s1,,STR:1,,,,s5,,STR:*,,,"
    );
  });
  it("emit diagnostic on duplicate IDs", async () => {
    const [_, diagnostics] = await emitWithDiagnostics(`
      @id(1,2)
      model Foo {}
      @id(1,2)
      model Bar {}
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/duplicate-id",
        message: `There are multiple models with the same id "tsp-output/test/main.csv,,r,,,1,2".`,
      },
      {
        code: "ebus/duplicate-id",
        message: `There are multiple models with the same id "tsp-output/test/main.csv,,r,,,1,2".`,
      },
    ]);
  });
  it("does not emit diagnostic on duplicate IDs/names in different file namespaces", async () => {
    const files = await emit(``, {}, {emitNamespace: true, extraSpecFiles: [{name: 'inc1.tsp',  code: `
      import "ebus"; using Ebus;
      namespace Inc1;
      @id(1,2)
      model Foo {}
    `}, {name: 'inc2.tsp', code: `
      import "ebus"; using Ebus;
      namespace Inc2;
      @id(1,2)
      model Foo {}
    `}]});
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file), undefined); // not emitted as empty
    assert.strictEqual(stripHeader(files['inc1.csv']),
      "r,Inc1,,Foo,,,,0102,,"
    );
    assert.strictEqual(stripHeader(files['inc2.csv']),
      "r,Inc2,,Foo,,,,0102,,"
    );
  });
  it("does not emit diagnostic on duplicate IDs in defaults", async () => {
    const files = await emit(`
      @base(1,2)
      model r {}
      @base(1,2)
      model w {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(file, undefined); // not emitted as empty
  });
  it("does not shorten type names", async () => {
    const files = await emit(`
      model Id is Ebus.Id.Id;
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Id,identification,,,0704,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version"
    );
  });
  it("emits concrete id message", async () => {
    const files = await emit(`
      @zz(8)
      model Id is Ebus.Id.Id;
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Id,identification,,08,0704,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version"
    );
  });
  it("keeps property name", async () => {
    const files = await emit(`
      namespace Manuf {
        @values(Values_onoff)
        scalar onoff extends Num.UCH;
        enum Values_onoff {
          off: 0,
          on: 1,
        }
        namespace Manufcircuit {
          @id(1,2)
          model Foo {
            onoff: onoff,
          }
        }
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0102,,onoff,,UCH,0=off;1=on,,"
    );
  });
  it("inherits namespace with zz for circuit name and nearest zz", async () => {
    const files = await emit(`
      using Ebus.Num;
      scalar tops extends UCH;
      @zz(0x15)
      namespace Top {
        @qq(0x01)
        @zz(0x08)
        @id(0,1)
        model Foo {
          @out
          x: BCD4,
          z: UCH,
        }
        namespace X {
          @id(0,2)
          model Y {}
          namespace Ver1 {
            @id(0,2,3)
            model Z {
              t: tops;
            }
          }
        }
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Top,,Z,,,15,0002,03,t,,UCH,,,\n"+
      "r,Top,,Y,,,15,0002,,\n"+
      "r,Top,,Foo,,01,08,0001,,x,m,BCD:4,,,,z,,UCH,,,"
    );
  });
  it("resolves properties referencing a model property", async () => {
    const files = await emit(`
      @id(1,2)
      model Scanme {
        id: Ebus.Id.Id.id;
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Scanme,,,,0102,,id,,STR:5,,,device id"
    );
  });
  it("flattens properties referencing a whole model", async () => {
    const files = await emit(`
      @id(1,2)
      model Scanme {
        /** entry */
        ref: Ebus.Id.Id;
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Scanme,,,,0102,,mf,,manufacturer,,,entry,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version"
    );
  });
  it("works with scan condition", async () => {
    const files = await emit(`
      @id(0,1)
      @condition(Ebus.Id.Id.sw, ">1")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "*[id_sw],scan,,,,SW\n"+
      "[id_sw>1]r,Main,,Foo,,,,0001,,"
    );
  });
  it("works with scan conditions", async () => {
    const files = await emit(`
      @id(0,1)
      @condition(Ebus.Id.Id.sw, ">1")
      @condition(Ebus.Id.Id.hw, "0700", "0800")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "*[id_hw],scan,,,,HW\n"+
      "*[id_sw],scan,,,,SW\n"+
      "[id_hw=0700;0800][id_sw>1]r,Main,,Foo,,,,0001,,"
    );
  });
  it("works with own condition", async () => {
    const files = await emit(`
      @id(0,2)
      model Bar {disc: Num.UCH}
      @id(0,1)
      @condition(Bar.disc, "1")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "*[bar_disc],,,bar,,disc\n"+
      "r,Main,,Bar,,,,0002,,disc,,UCH,,,\n"+
      "[bar_disc=1]r,Main,,Foo,,,,0001,,"
    );
  });
  it("works with auth level", async () => {
    const files = await emit(`
      @id(0,1)
      @auth("high")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,high,Foo,,,,0001,,"
    );
  });
  it("combines divisor/factor", async () => {
    const files = await emit(`
      @divisor(10)
      scalar div10 extends Num.D2C;
      @factor(10)
      scalar mul10 extends Num.D2C;
      @id(0,1)
      model Foo {
        p: Num.D2C,
        q: div10,
        r: mul10,
      }
      @id(0,2)
      model Bar {
        @divisor(5)
        s: mul10,
      }
      @id(0,3)
      model Bar2 {
        @divisor(20)
        t: mul10,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,,p,,D2C,,,,q,,D2C,10,,,r,,D2C,-10,,\n"+
      "r,Main,,Bar,,,,0002,,s,,D2C,-2,,\n"+
      "r,Main,,Bar2,,,,0003,,t,,D2C,2,,"
    );
  });
  it("includes imported namespace models", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace Importfile_inc {
        @base(0,1)
        model r {}
        @inherit(r)
        @ext
        model Foo {
          uch: Num.UCH,
        }
      }
    `;
    const files = await emit(`
      @zz(0x15)
      namespace Circ {
        @id(0,2)
        model Bar {
        }
        /** included stuff */
        union _includes {
          /** included file */
          Importfile_inc,
        }
      }
    `, {}, {emitNamespace: true,
      extraSpecFiles: [{name: 'Importfile_inc.tsp', code: importTsp}],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "r,Circ,,Bar,,,15,0002,,\n"+
      // "# included stuff\n"+
      "r,Circ,,Foo,,,15,0001,,uch,,UCH,,,"
    );
    assert.strictEqual(Object.keys(files).length, 1); // no other fiile emitted
  });
  it("includes imported namespace models with conditions", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace Importfile_inc {
        @base(0,1)
        model r {}
        @inherit(r)
        @ext
        model Foo {
          uch: Num.UCH,
        }
      }
    `;
    const files = await emit(`
      @zz(0x15)
      namespace Circ {
        @id(0,2)
        model Bar {
        }
        /** included stuff */
        union _includes {
          /** included file */
          @condition(Ebus.Id.Id.sw, ">1")
          Importfile_inc,
        }
      }
    `, {}, {emitNamespace: true,
      extraSpecFiles: [{name: 'Importfile_inc.tsp', code: importTsp}],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "*[id_sw],scan,,,,SW\n"+
      "r,Circ,,Bar,,,15,0002,,\n"+
      // "# included stuff\n"+
      "[id_sw>1]r,Circ,,Foo,,,15,0001,,uch,,UCH,,,"
    );
    assert.strictEqual(Object.keys(files).length, 1); // no other fiile emitted
  });
  it("includes loaded namespace models with conditions", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace Importfile_inc {
        @base(0,1)
        model r {}
        @inherit(r)
        @ext
        model Foo {
          uch: Num.UCH,
        }
      }
    `;
    const files = await emit(`
      @zz(0x15)
      namespace Circ {
        @id(0,2)
        model Bar {
        }
        /** included stuff */
        union _includes {
          /** loaded file */
          @condition(Ebus.Id.Id.sw, ">1")
          importfile_inc: Importfile_inc,
        }
      }
    `, {}, {emitNamespace: true,
      extraSpecFiles: [{name: 'importfile_inc.tsp', code: importTsp}],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "*[id_sw],scan,,,,SW\n"+
      "r,Circ,,Bar,,,15,0002,,\n"+
      // "# included stuff\n"+
      "[id_sw>1]!load,importfile.inc,,,loaded file"
    );
    assert.strictEqual(stripHeader(files["importfile.inc"]),
      "r,,,Foo,,,,0001,,uch,,UCH,,,"
    );
  });
  it("references imported namespace models", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace Importfile_inc;
      @id(0,1)
      model Foo {
        uch: Num.UCH,
      }
    `;
    const files = await emit(`
      @id(0,2)
      model Bar {
      }
      /** included stuff */
      union _includes {
        /** included file */
        Importfile_inc,
      }
    `, {includes: true}, {emitNamespace: true,
      extraSpecFiles: [{name: 'importfile_inc.tsp', code: importTsp}],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "r,Main,,Bar,,,,0002,,\n"+
      "# included stuff\n"+
      "!include,importfile.inc,,,included file"
    );
    assert.strictEqual(stripHeader(files["importfile.inc"]),
      "r,,,Foo,,,,0001,,uch,,UCH,,,"
    );
  });
  it("emit diagnostic on invalid type", async () => {
    const [_, diagnostics] = await emitWithDiagnostics(`
      @id(1,0)
      model M0 {
        m: uint8
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/banned-type",
        message: `Invalid type numeric with name "m".`,
      },
    ]);
  });
  it("emit diagnostic on too deep model", async () => {
    const [_, diagnostics] = await emitWithDiagnostics(`
      model m0 {
        m: Num.UCH
      }
      model m1 {
        m: m0
      }
      model m2 {
        m: m1
      }
      model m3 {
        m: m2
      }
      model m4 {
        m: m3
      }
      model m5 {
        m: m4
      }
      @id(1,0)
      model m6 {
        m: m5
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/banned-inheritance",
        message: `The inheritance is too deep in m.`,
      },
    ]);
  });
  it("emit diagnostic on invalid @in with broadcast", async () => {
    const [_, diagnostics] = await emitWithDiagnostics(`
      @id(1,0)
      @zz(0xfe)
      model M {
        @in
        m: Num.UCH
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/banned-in",
        message: `Invalid @in with broadcast target.`,
      },
    ]);
  });
  it("emit diagnostic on invalid length", async () => {
    const [_, diagnostics] = await emitWithDiagnostics(`
      @id(1,0)
      model M {
        @maxLength(33)
        m: Str.STR
      }
    `);
    expectDiagnostics(diagnostics, [
      {
        code: "ebus/banned-length",
        message: `Invalid @maxLength exceeding 31.`,
      },
    ]);
  });
  it("works with @chain", async () => {
    const files = await emit(`
      @id(0,1,2)
      @chain(0, #[3],#[4])
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,02;03;04,"
    );
  });
  it("works with @chain and @ext", async () => {
    const files = await emit(`
      @base(0,1)
      model r {}
      @inherit(r)
      @ext(2)
      @chain(0, #[3],#[4])
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0001,02;03;04,"
    );
  });
  it("works with @chain and length", async () => {
    const files = await emit(`
      @id(7,6,5,2)
      @chain(8, #[5,3],#[5,4])
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,,,,0706,0502:8;0503:8;0504:8,"
    );
  });
  it("works with translation", async () => {
    const files = await emit(`
      using Ebus.Num;
      /** Main circuit */
      @id(0,1)
      model Foo {
        /** temperature */
        x: UCH,
      }
    `, {translations: 'de.yaml'}, {emitNamespace: true, extraSpecFiles: [{
      name: 'de.yaml', code: 'Main circuit: Haupteinheit\ntemperature: Temperatur'
    }]});
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,Main,,Foo,Haupteinheit,,,0001,,x,,UCH,,,Temperatur"
    );
  });
});
