# eBUS TypeSpec library

This is a [TypeSpec](https://typespec.io/) library for defining eBUS messages on a high level.

It comes with [decorators](#decorators) for the eBUS specific aspects of circuits, messages, fields and data transfer, as well as eBUS specific [data types](#data-types).

Once a message is declared in a typespec file, it can be converted to [ebusd CSV format](https://github.com/john30/ebusd/wiki/4.-Configuration) using an [emitter](#emitter).

This library is also used for [generating ebusd message configuration](https://github.com/john30/ebusd-configuration) files.

## Decorators
This is a short overview of the [decorators](lib/decorators.tsp) offered by the library:
* source address `QQ`: `@qq(QQ)`
* target address `ZZ`: `@zz(ZZ)`
* message ID `PB`, `SB`, `ID*`: `@id(PB, SB, ID*)`  
  when using inheritance:
  * base ID: `@base(PB, SB, ID*)`
  * ID extension: `@ext(ID*)`
  * inheritance: ``@inherit(...)`
* message chaining: `@chain(...)`
* message direction: `@write`, `@passive`
* message condition(s): `@condition(model, values)`
* message authorization: `@auth(level)`
* field location: `@in`, `@out`
* field divisor/factor: `@divisor(number)`, `@factor(number)`
* field value list: `@values(...)`
* field unit: `@unit(...)`

## Data types
All the standard eBUS base data types like UCH etc. are available in the [`Ebus` types namespace](lib/types.tsp) under:
* `Ebus.Num`: numeric+bit types
* `Ebus.Str`: string types including hex sequence
* `Ebus.Dtm`: date/time type

## Models
The identification message is available in the [`Ebus` model namespace](lib/models.tsp) under:
* `Ebus.Id`: read/write/broadcast versions of identification message

## Emitter
The CSV emitter is available as with the following parameters:

It can be used via `tsp compile --emit @ebusd/ebus-typespec <tsp files>`.

## Example
Here is a small example of a message carrying just a single byte:

```typespec
import "@ebusd/ebus-typespec";
using Ebus;
using Ebus.Num;

@zz(0x08)
@id(0x01, 0x02)
model Message {
  field1: UCH,
}
```

This fits to an eBUS byte sequence like this
```hex
ff08010200 / 0105
```
that transfers the `Message` from source `0xff` where the target `0x08` replied with a value of 5 for `field1`.

## Scripts
This library also provides the following scripts via npm:

* `tsp2ebusd`: converts TypSpec file(s) or stdin to an ebusd CSV file or stdout and can also send the output directly to an ebusd instance having the "--define" feature enabled.

## Documentation
See [here for the documentation](docs.md) generated from the source.

## Style guide
Following the [TypeSpec style guide](https://typespec.io/docs/handbook/style-guide) with these additions/exceptions:
* template models are supposed to be in camelCase (instead of PascalCase), e.g.  
  ```typespec
  model tempSensor {temp: UCH, sensor: UCH}
  ```
* default models (inherited from by "real" models) are supposed to be in camelCase (instead of PascalCase), e.g.  
  ```typespec
  @base(8, 9)
  model r {}
  ```
  versus a "real" model, e.g.  
  ```typespec
  @inherit(r)
  @ext(1, 2)
  model Temperature {
    value: UCH,
  }
  ```
* the name of value lists in `enum` is supposed to begin with `Values_` followed by the name of the message or field referring to, e.g.  
  ```typespec
  enum Values_manufacturer {...}
  ```
* due to absence of an option to include models in a namepsace from another namespace, the construct for inclusion is putting these namespaces into a union named `_includes`:  
  ```typespec
    union _includes {
      NamespaceModelName, // <= unnamed entry inlines the referenced definition or emits a !include instruction
      named: NamespaceModelName, // <= named entry emits a !load instruction
      // etc.
    }
  ```
