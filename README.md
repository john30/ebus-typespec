# eBUS TypeSpec library

This is a [TypeSpec](https://typespec.io/) library for defininf eBUS messages on a high level.

It comes with [decorators](#decorators) for the eBUS specific aspects of circuits, messages, fields and data transfer, as well as eBUS specific [data types](#data-types).

Once a message is declared in a typespec file, it can be converted to [ebusd CSV format](https://github.com/john30/ebusd/wiki/4.-Configuration) using an [emitter](#emitter).

## Decorators
This is a short overview of the [decorators](lib/decorators.tsp) offered by the library:
* source address `QQ`: `@qq(QQ)`
* target address `ZZ`: `@zz(ZZ)`
* message ID `PB`, `SB`, `ID*`: `@id(PB, SB, ID*)`  
  when using inheritance:
  * base ID: `@base(PB, SB, ID*)`
  * ID extension: `@ext(ID*)`
  * inheritance: ``@inherit(...)`
* message direction: `@write`, `@passive`
* message condition(s): `@condition(model, values)`
* message authorization: `@auth(level)`
* field location: `@in`, `@out`
* field divisor/factor: `@divisor(number)`, `@factor(number)`
* field value list: `@values(...)`
* field unit: `@unit(...)`

## Data types
All the standard eBUS base data types like UCH etc. are available in the [`Ebus` types namespace](lib/types.tsp) under:
* `Ebus.num`: numeric+bit types
* `Ebus.str`: string types including hex sequence
* `Ebus.dtm`: date/time type

## Models
The identification message is available in the [`Ebus` model namespace](lib/models.tsp) under:
* `Ebus.id`: read/write/broadcast version of identification

## Emitter
The CSV emitter is available as with the following parameters:

It can be used via `tsp compile --emit ebus --option @typespec/json-schema.emitAllRefs=true <tsp files>`.

## Example
Here is a small example of a message carrying just a single byte:

```typespec
import "Ebus";
using Ebus.num;

@zz(0x08)
@id(0x01, 0x02)
model message {
  field1: UCH,
}
```

This fits to an eBUS byte sequence like this
```hex
ff08010200 / 0105
```
that transfers the `message` from source `0xff` where the target `0x08` replied with a value of 5 for `field1`.