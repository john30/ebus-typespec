import {expectDiagnostics} from "@typespec/compiler/testing";
import assert from "assert";
import {describe, it} from "node:test";
import {emit, emitWithDiagnostics} from "./utils.js";

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
    assert.strictEqual(file,
      "r,main,foo,a foo,01,08,0001,02,x,m,BCD:4,10,y,an x,z,,UCH,,,\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0001,,x,,UCH,,,\n"+
      "r,main,bar,,,,0002,01,y,,UCH,,,,z,,UCH,,,\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0001,,x,,UCH,,°C,temperature\n"
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
    assert.strictEqual(file,
      "r,main,foo,a test,,08,0001,020304,b,,UCH,,,the b,x,,UCH,,,an x\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0001,,x,,UCH,,,,y,,UCH,,,\n"+
      "w,main,foo,,,,0001,,x,,UCH,,,\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0001,,m,,UCH,1=One;2=Two,,\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0001,,b0,,BI0,,,,b1,,BI1,,,,b2,,BI2,,,,b3,,BI3,,,,b4,,BI4,,,,b5,,BI5,,,,b6,,BI6,,,,b7,,BI7,,,,n,,BI0:7,,,\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0001,,s,,STR,,,,s1,,STR:1,,,,s5,,STR:10,,,\n"
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
    assert.strictEqual(file,
      "r,main,foo,,,,0102,,\n"+ //todo could be limited to those having a condition only
      "r,main,foo,,,,0102,,\n"
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
    assert.strictEqual(file, '\n');
  });
  it("does not shorten type names", async () => {
    const files = await emit(`
      model id is Ebus.id.id;
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      "r,main,id,identification,,,0704,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version\n"+
      "u,main,id,identification,,fe,0704,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version\n"+
      "w,main,id,identification,,fe,0704,,\n"
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
    assert.strictEqual(file,
      "r,top,z,,,15,0002,03,t,,UCH,,,\n"+
      "r,top,y,,,15,0002,,\n"+
      "r,top,foo,,01,08,0001,,x,m,BCD:4,,,,z,,UCH,,,\n"
    );
  });
  it("resolves properties referencing a model property", async () => {
    const files = await emit(`
      @id(1,2)
      model scanme {
        id: Ebus.id.id.id;
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      "r,main,scanme,,,,0102,,id,,STR:5,,,device id\n"
    );
  });
  it("flattens properties referencing a whole model", async () => {
    const files = await emit(`
      @id(1,2)
      model scanme {
        /** entry */
        id: Ebus.id.id;
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      // comment "entry" is hidden intentionally
      "r,main,scanme,,,,0102,,mf,,manufacturer,,,device manufacturer,id,,STR:5,,,device id,sw,,PIN,,,software version,hw,,PIN,,,hardware version\n"
    );
  });
  it("works with conditions", async () => {
    const files = await emit(`
      @id(0,1)
      @cond(Ebus.id.id, "1", "2")
      model Foo {}
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      "[id=1;2]r,main,foo,,,,0001,,\n"
    );
  });
});
