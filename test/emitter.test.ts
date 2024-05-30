import assert, { deepStrictEqual } from "assert";
import { describe, it } from "node:test";
import { emit } from "./utils.js";

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
        x: UCH,
        z: UCH,
      }
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      "r,test,foo,a foo,01,08,0001,02,x,m,UCH,10,y,an x,z,,UCH,,,\n"
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
      "r,test,foo,,,,0001,,x,,UCH,,,\n"+
      "r,test,bar,,,,0002,01,y,,UCH,,,,z,,UCH,,,\n"
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
      "r,test,foo,,,,0001,,x,,UCH,,°C,temperature\n"
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
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      "r,test,foo,a test,,08,0001,020304,b,,UCH,,,the b,x,,UCH,,,an x\n"
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
    `);
    const file = files["main.csv"];
    assert.strictEqual(file,
      "r,test,foo,,,,0001,,x,,UCH,,,,y,,UCH,,,\n"+
      "w,test,foo,,,,0001,,x,,UCH,,,\n"
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
      "r,test,foo,,,,0001,,m,,UCH,1=One;2=Two,,\n"
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
      "r,test,foo,,,,0001,,b0,,BI0,,,,b1,,BI1,,,,b2,,BI2,,,,b3,,BI3,,,,b4,,BI4,,,,b5,,BI5,,,,b6,,BI6,,,,b7,,BI7,,,,n,,BI0:7,,,\n"
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
      "r,test,foo,,,,0001,,s,,STR,,,,s1,,STR:1,,,,s5,,STR:10,,,\n"
    );
  });
});
