import {expectDiagnostics} from "@typespec/compiler/testing";
import assert from "assert";
import {describe, it} from "node:test";
import {emit, emitWithDiagnostics} from "./utils.js";

const headerLine = `type,circuit,level,name,comment,qq,zz,pbsb,id,`
+`*name,part,type,divisor/values,unit,comment\n`;
const stripHeader = (s?: string) => s && s.startsWith(headerLine) ? s.substring(headerLine.length) : s;

describe("emitting models", () => {
  it("works", async () => {
    const files = await emit(`
      using Ebus.num;
      @qq(0x01)
      @zz(0x08)
      @id(0,1,2)
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
      "r,main,,Foo,a foo,01,08,0001,02,x,m,BCD:4,10,y,an x,z,,UCH,,,\n"
    );
  });
  it("works with multiple", async () => {
    const files = await emit(`
      using Ebus.num;
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
      "r,main,,Foo,,,,0001,,x,,UCH,,,\n"+
      "r,main,,Bar,,,,0002,01,y,,UCH,,,,z,,UCH,,,\n"
    );
  });
  it("works with derived types", async () => {
    const files = await emit(`
      using Ebus.num;
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
      "r,main,,Foo,,,,0001,,x,,UCH,,°C,temperature\n"
    );
  });
  it("works with inherit", async () => {
    const files = await emit(`
      using Ebus.num;
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
      "r,main,,Foo,a test,,08,0001,020304,b,,UCH,,,the b,x,,UCH,,,an x\n"
    );
  });
  it("works with multi inherit", async () => {
    const files = await emit(`
      using Ebus.num;
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
      "r,main,,Foo,,,,0001,,x,,UCH,,,,y,,UCH,,,\n"+
      "w,main,,Foo,,,,0001,,x,,UCH,,,\n"
    );
  });
  it("works with values", async () => {
    const files = await emit(`
      using Ebus.num;
      @values(men)
      scalar man extends UCH;
      enum men {
        One: 1,
        Two: 2,
      }
      @id(0,1)
      model Foo {
        m: man,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,main,,Foo,,,,0001,,m,,UCH,1=One;2=Two,,\n"
    );
  });
  it("works with bits", async () => {
    const files = await emit(`
      using Ebus.num;
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
      "r,main,,Foo,,,,0001,,b0,,BI0,,,,b1,,BI1,,,,b2,,BI2,,,,b3,,BI3,,,,b4,,BI4,,,,b5,,BI5,,,,b6,,BI6,,,,b7,,BI7,,,,n,,BI0:7,,,\n"
    );
  });
  it("works with var length str", async () => {
    const files = await emit(`
      using Ebus.str;
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
      "r,main,,Foo,,,,0001,,s,,STR,,,,s1,,STR:1,,,,s5,,STR:10,,,\n"
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
        message: `There are multiple models with the same id "test,r,,,1,2".`,
      },
      {
        code: "ebus/duplicate-id",
        message: `There are multiple models with the same id "test,r,,,1,2".`,
      },
    ]);
  });
  it("does not emit diagnostic on duplicate IDs/names in different namespaces", async () => {
    const files = await emit(`
      namespace Test1 {
        @id(1,2)
        model Foo {}
      }
      namespace Test2 {
        @id(1,2)
        model Foo {}
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,main,,Foo,,,,0102,,\n"+ //todo could be limited to those having a condition only
      "r,main,,Foo,,,,0102,,\n"
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
      model id is Ebus.id.id;
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,main,,id,identification,,,0704,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version\n"+
      "u,main,,id,identification,,fe,0704,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version\n"+
      "w,main,,id,identification,,fe,0704,,\n"
    );
  });
  it("keeps property name", async () => {
    const files = await emit(`
      namespace manuf {
        @values(values_onoff)
        scalar onoff extends num.UCH;
        enum values_onoff {
          off: 0,
          on: 1,
        }
        namespace manufcircuit {
          @id(1,2)
          model Foo {
            onoff: onoff,
          }
        }
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,main,,Foo,,,,0102,,onoff,,UCH,0=off;1=on,,\n"
    );
  });
  it("inherits namespace with zz for circuit name and nearest zz", async () => {
    const files = await emit(`
      using Ebus.num;
      scalar tops extends UCH;
      @zz(0x15)
      namespace top {
        @qq(0x01)
        @zz(0x08)
        @id(0,1)
        model Foo {
          @out
          x: BCD4,
          z: UCH,
        }
        namespace x {
          @id(0,2)
          model y {}
          namespace ver1 {
            @id(0,2,3)
            model z {
              t: tops;
            }
          }
        }
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,top,,z,,,15,0002,03,t,,UCH,,,\n"+
      "r,top,,y,,,15,0002,,\n"+
      "r,top,,Foo,,01,08,0001,,x,m,BCD:4,,,,z,,UCH,,,\n"
    );
  });
  it("resolves properties referencing a model property", async () => {
    const files = await emit(`
      @id(1,2)
      model Scanme {
        id: Ebus.id.id.id;
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,main,,Scanme,,,,0102,,id,,STR:5,,,device id\n"
    );
  });
  it("flattens properties referencing a whole model", async () => {
    const files = await emit(`
      @id(1,2)
      model Scanme {
        /** entry */
        ref: Ebus.id.id;
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "r,main,,Scanme,,,,0102,,mf,,manufacturer,,,entry,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version\n"
    );
  });
  it("works with scan condition", async () => {
    const files = await emit(`
      @id(0,1)
      @condition(Ebus.id.id.sw, ">1")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "*[id_sw],scan,,,,SW\n"+
      "[id_sw>1]r,main,,Foo,,,,0001,,\n"
    );
  });
  it("works with scan conditions", async () => {
    const files = await emit(`
      @id(0,1)
      @condition(Ebus.id.id.sw, ">1")
      @condition(Ebus.id.id.hw, "0700", "0800")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "*[id_hw],scan,,,,HW\n"+
      "*[id_sw],scan,,,,SW\n"+
      "[id_hw=0700;0800][id_sw>1]r,main,,Foo,,,,0001,,\n"
    );
  });
  it("works with own condition", async () => {
    const files = await emit(`
      @id(0,2)
      model Bar {disc: num.UCH}
      @id(0,1)
      @condition(Bar.disc, "1")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(stripHeader(file),
      "*[bar_disc],,,bar,,disc\n"+
      "r,main,,Bar,,,,0002,,disc,,UCH,,,\n"+
      "[bar_disc=1]r,main,,Foo,,,,0001,,\n"
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
      "r,main,high,Foo,,,,0001,,\n"
    );
  });
  it("combines divisor/factor", async () => {
    const files = await emit(`
      @divisor(10)
      scalar div10 extends num.D2C;
      @factor(10)
      scalar mul10 extends num.D2C;
      @id(0,1)
      model Foo {
        p: num.D2C,
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
      "r,main,,Foo,,,,0001,,p,,D2C,,,,q,,D2C,10,,,r,,D2C,-10,,\n"+
      "r,main,,Bar,,,,0002,,s,,D2C,-2,,\n"+
      "r,main,,Bar2,,,,0003,,t,,D2C,2,,\n"
    );
  });
  it("includes imported namespace models", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace importfile_inc {
        @base(0,1)
        model r {}
        @inherit(r)
        @ext
        model Foo {
          uch: num.UCH,
        }
      }
    `;
    const files = await emit(`
      @zz(0x15)
      namespace circ {
        @id(0,2)
        model Bar {
        }
        /** included stuff */
        union _includes {
          /** included file */
          importfile_inc,
        }
      }
    `, {}, {emitNamespace: true,
      extraSpecFiles: [['importfile_inc.tsp', importTsp]],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "r,circ,,Bar,,,15,0002,,\n"+
      // "# included stuff\n"+
      "r,circ,,Foo,,,15,0001,,uch,,UCH,,,\n"+
      "\n" // due to the union
    );
    assert.strictEqual(Object.keys(files).length, 1); // no other fiile emitted
  });
  it("includes imported namespace models with conditions", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace importfile_inc {
        @base(0,1)
        model r {}
        @inherit(r)
        @ext
        model Foo {
          uch: num.UCH,
        }
      }
    `;
    const files = await emit(`
      @zz(0x15)
      namespace circ {
        @id(0,2)
        model Bar {
        }
        /** included stuff */
        union _includes {
          /** included file */
          @condition(Ebus.id.id.sw, ">1")
          importfile_inc,
        }
      }
    `, {}, {emitNamespace: true,
      extraSpecFiles: [['importfile_inc.tsp', importTsp]],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "*[id_sw],scan,,,,SW\n"+
      "r,circ,,Bar,,,15,0002,,\n"+
      // "# included stuff\n"+
      "[id_sw>1]r,circ,,Foo,,,15,0001,,uch,,UCH,,,\n"+
      "\n" // due to the union
    );
    assert.strictEqual(Object.keys(files).length, 1); // no other fiile emitted
  });
  it("references imported namespace models", async () => {
    const importTsp = `
      import "ebus"; using Ebus;
      namespace importfile_inc;
      @id(0,1)
      model Foo {
        uch: num.UCH,
      }
    `;
    const files = await emit(`
      @id(0,2)
      model Bar {
      }
      /** included stuff */
      union _includes {
        /** included file */
        importfile_inc,
      }
    `, {includes: true}, {emitNamespace: true,
      extraSpecFiles: [['importfile_inc.tsp', importTsp]],
    });
    assert.strictEqual(stripHeader(files["main.csv"]),
      "r,main,,Bar,,,,0002,,\n"+
      "# included stuff\n"+
      "!include,importfile.inc,,,included file\n"
    );
    assert.strictEqual(stripHeader(files["importfile.inc"]),
      "r,,,Foo,,,,0001,,uch,,UCH,,,\n"
    );
  });
});
