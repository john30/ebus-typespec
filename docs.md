# @ebusd/ebus-typespec

TypeSpec library for defining eBUS messages and emitting to ebusd CSV.

## Install

```bash
npm install @ebusd/ebus-typespec
```

## Emitter usage

1. Via the command line

```bash
tsp compile . --emit=@ebusd/ebus-typespec
```

2. Via the config

```yaml
emit:
  - "@ebusd/ebus-typespec"
```

The config can be extended with options as follows:

```yaml
emit:
  - "@ebusd/ebus-typespec"
options:
  "@ebusd/ebus-typespec":
    option: value
```

## Emitter options

### `emitter-output-dir`

**Type:** `absolutePath`

Defines the emitter output directory. Defaults to `{output-dir}/@ebusd/ebus-typespec`
See [Configuring output directory for more info](https://typespec.io/docs/handbook/configuration/configuration/#configuring-output-directory)

### `includes`

**Type:** `boolean`

Emit includes files as includes instead of inline (incomplete!)

### `translations`

**Type:** `string`

File name with translations to use.

### `withMinMax`

**Type:** `boolean`

Emit min+max values

## Linter usage

Add the following in `tspconfig.yaml`:

```yaml
linter:
  extends:
    - ebus/recommended
```

### RuleSets

Available ruleSets:

- `ebus/recommended`
- `ebus/all`

### Rules

| Name                | Description                      |
| ------------------- | -------------------------------- |
| `ebus/no-interface` | Make sure interface is not used. |
| `ebus/no-intrinsic` | Make sure intrinsic is not used. |
| `ebus/no-literal`   | Make sure literal is not used.   |
| `ebus/no-operation` | Make sure operation is not used. |
| `ebus/no-template`  | Make sure template is not used.  |
| `ebus/no-tuple`     | Make sure tuple is not used.     |
| `ebus/no-union`     | Make sure union is not used.     |

## Decorators

### Ebus

- [`@auth`](#@auth)
- [`@base`](#@base)
- [`@chain`](#@chain)
- [`@condition`](#@condition)
- [`@conditionExt`](#@conditionext)
- [`@constValue`](#@constvalue)
- [`@divisor`](#@divisor)
- [`@example`](#@example)
- [`@ext`](#@ext)
- [`@factor`](#@factor)
- [`@id`](#@id)
- [`@in`](#@in)
- [`@inherit`](#@inherit)
- [`@out`](#@out)
- [`@passive`](#@passive)
- [`@poll`](#@poll)
- [`@qq`](#@qq)
- [`@step`](#@step)
- [`@unit`](#@unit)
- [`@values`](#@values)
- [`@write`](#@write)
- [`@zz`](#@zz)

#### `@auth`

Define authentication level.

```typespec
@Ebus.auth(value: valueof string)
```

##### Target

`Model`

##### Parameters

| Name  | Type             | Description                                |
| ----- | ---------------- | ------------------------------------------ |
| value | `valueof string` | the authentication level (e.g. 'install'). |

#### `@base`

Define the base message ID to be combined with an extension ID.

```typespec
@Ebus.base(pb: valueof Ebus.pb, sb: valueof Ebus.sb, ...dd: valueof Ebus.symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type                | Description               |
| ---- | ------------------- | ------------------------- |
| pb   | [valueof `pb`](#pb) | the primary message ID.   |
| sb   | [valueof `sb`](#sb) | the secondary message ID. |
| dd   | `valueof symbol[]`  | further message ID parts. |

#### `@chain`

Define chained message IDs.

```typespec
@Ebus.chain(length: valueof uint8, dd: valueof Ebus.symbol[], ...dds: valueof Ebus.symbol[][])
```

##### Target

`Model`

##### Parameters

| Name   | Type                 | Description                                                                                |
| ------ | -------------------- | ------------------------------------------------------------------------------------------ |
| length | `valueof uint8`      | the (maximum) length of a single message part of this chain, or 0 for default (=24).       |
| dd     | `valueof symbol[]`   | second message ID part the chain is built from (first one taken from id or ext decorator). |
| dds    | `valueof symbol[][]` | list of further message ID parts the chain is built from.                                  |

#### `@condition`

Define a condition for the whole message by checking an own model or property.
This decorator and `@conditionExt` can be used multiple times to check that all conditions are met.

```typespec
@Ebus.condition(property: ModelProperty | Model, ...values: valueof string[])
```

##### Target

`Namespace | Model | UnionVariant`

##### Parameters

| Name     | Type                     | Description                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| property | `ModelProperty \| Model` | the referenced model property, or a model in case of existance check or single property only.                                                                                                                                                                                                                                                                                   |
| values   | `valueof string[]`       | the optional alternative values the property needs to match (one of the values must match for the condition to be met).<br />For numeric values, a single value (e.g. "18"), a value range separated by dash (e.g. "19-22"), or a value range with comparison (e.g. "<=5", ">10") can be used.<br />For string values, the value needs to be put in single quotes (e.g. 'abc'). |

#### `@conditionExt`

Define a condition for the whole message by checking another target address model or property.
This decorator and `@condition` can be used multiple times to check that all conditions are met.

```typespec
@Ebus.conditionExt(property: ModelProperty | Model, zz: valueof Ebus.target, ...values: valueof string[])
```

##### Target

`Namespace | Model | UnionVariant`

##### Parameters

| Name     | Type                        | Description                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| property | `ModelProperty \| Model`    | the referenced model property, or a model in case of existance check or single property only.                                                                                                                                                                                                                                                                                   |
| zz       | [valueof `target`](#target) | the target address ZZ.                                                                                                                                                                                                                                                                                                                                                          |
| values   | `valueof string[]`          | the optional alternative values the property needs to match (one of the values must match for the condition to be met).<br />For numeric values, a single value (e.g. "18"), a value range separated by dash (e.g. "19-22"), or a value range with comparison (e.g. "<=5", ">10") can be used.<br />For string values, the value needs to be put in single quotes (e.g. 'abc'). |

#### `@constValue`

Define the const value.

```typespec
@Ebus.constValue(value: valueof numeric | string)
```

##### Target

`numeric | boolean | ModelProperty`

##### Parameters

| Name  | Type                        | Description      |
| ----- | --------------------------- | ---------------- |
| value | `valueof numeric \| string` | the const value. |

#### `@divisor`

Define the divisor.

```typespec
@Ebus.divisor(value: valueof numeric)
```

##### Target

`numeric | plainTime | ModelProperty`

##### Parameters

| Name  | Type              | Description  |
| ----- | ----------------- | ------------ |
| value | `valueof numeric` | the divisor. |

#### `@example`

Define a data example.

```typespec
@Ebus.example(desc: valueof string, q: valueof string | Ebus.symbol[], a?: valueof string | Ebus.symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type                         | Description                                                                  |
| ---- | ---------------------------- | ---------------------------------------------------------------------------- |
| desc | `valueof string`             | a text describing the example.                                               |
| q    | `valueof string \| symbol[]` | the query part of the message, i.e. pb, sb, and dd bytes sent to the target. |
| a    | `valueof string \| symbol[]` | the answer part of the message, i.e. dd bytes received from the target.      |

#### `@ext`

Define the extension message ID to be combined with a base ID.

```typespec
@Ebus.ext(...dd: valueof Ebus.symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type               | Description                  |
| ---- | ------------------ | ---------------------------- |
| dd   | `valueof symbol[]` | message ID extensions parts. |

#### `@factor`

Define the factor.

```typespec
@Ebus.factor(value: valueof numeric)
```

##### Target

`numeric | plainTime | ModelProperty`

##### Parameters

| Name  | Type              | Description |
| ----- | ----------------- | ----------- |
| value | `valueof numeric` | the factor. |

#### `@id`

Define the whole message ID.

```typespec
@Ebus.id(pb: valueof Ebus.pb, sb: valueof Ebus.sb, ...dd: valueof Ebus.symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type                | Description               |
| ---- | ------------------- | ------------------------- |
| pb   | [valueof `pb`](#pb) | the primary message ID.   |
| sb   | [valueof `sb`](#sb) | the secondary message ID. |
| dd   | `valueof symbol[]`  | further message ID parts. |

#### `@in`

Define message part inbound from target.

```typespec
@Ebus.in(writeOnly?: valueof boolean)
```

##### Target

`ModelProperty`

##### Parameters

| Name      | Type              | Description                                                                                                  |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| writeOnly | `valueof boolean` | optional true to put in only if write direction, false to put in only if read direction (alyways if absent). |

#### `@inherit`

Define the inherited model(s).

```typespec
@Ebus.inherit(...models: Model[])
```

##### Target

`Model`

##### Parameters

| Name   | Type      | Description       |
| ------ | --------- | ----------------- |
| models | `Model[]` | inherited models. |

#### `@out`

Define message part outbound to target.

```typespec
@Ebus.out(writeOnly?: valueof boolean)
```

##### Target

`ModelProperty`

##### Parameters

| Name      | Type              | Description                                                                                                  |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| writeOnly | `valueof boolean` | optional true to put in only if write direction, false to put in only if read direction (alyways if absent). |

#### `@passive`

Define passive only.

```typespec
@Ebus.passive
```

##### Target

`Model`

##### Parameters

None

#### `@poll`

Define the poll priority (only for active read).

```typespec
@Ebus.poll(value?: valueof uint8)
```

##### Target

`Model`

##### Parameters

| Name  | Type            | Description                          |
| ----- | --------------- | ------------------------------------ |
| value | `valueof uint8` | the poll priority (between 1 and 9). |

#### `@qq`

Define the source address.

```typespec
@Ebus.qq(value?: valueof Ebus.source)
```

##### Target

`Model`

##### Parameters

| Name  | Type                        | Description            |
| ----- | --------------------------- | ---------------------- |
| value | [valueof `source`](#source) | the source address QQ. |

#### `@step`

Define the increment/decrement step value (useful in combination with `@minValue` and/or `@maxValue`).

```typespec
@Ebus.step(value: valueof numeric)
```

##### Target

`numeric | ModelProperty`

##### Parameters

| Name  | Type              | Description                         |
| ----- | ----------------- | ----------------------------------- |
| value | `valueof numeric` | the increment/decrement step value. |

#### `@unit`

Define the unit.

```typespec
@Ebus.unit(value: valueof string)
```

##### Target

`numeric | ModelProperty`

##### Parameters

| Name  | Type             | Description |
| ----- | ---------------- | ----------- |
| value | `valueof string` | the unit.   |

#### `@values`

Define the known values.

```typespec
@Ebus.values(values: Enum)
```

##### Target

`numeric | boolean | ModelProperty`

##### Parameters

| Name   | Type   | Description       |
| ------ | ------ | ----------------- |
| values | `Enum` | the known values. |

#### `@write`

Define write direction.

```typespec
@Ebus.write(toSource?: valueof boolean)
```

##### Target

`Model`

##### Parameters

| Name     | Type              | Description                                                                                 |
| -------- | ----------------- | ------------------------------------------------------------------------------------------- |
| toSource | `valueof boolean` | true to use the source address pendant of the target address instead of the target address. |

#### `@zz`

Define the target address.

```typespec
@Ebus.zz(value?: valueof Ebus.target)
```

##### Target

`Model | Namespace`

##### Parameters

| Name  | Type                        | Description            |
| ----- | --------------------------- | ---------------------- |
| value | [valueof `target`](#target) | the target address ZZ. |

### Ebus.Internal

- [`@bcd`](#@bcd)
- [`@hex`](#@hex)
- [`@maxBits`](#@maxbits)
- [`@reverse`](#@reverse)

#### `@bcd`

Define BCD encoding.

```typespec
@Ebus.Internal.bcd
```

##### Target

`Scalar`

##### Parameters

None

#### `@hex`

Define HEX encoding.

```typespec
@Ebus.Internal.hex
```

##### Target

`Scalar`

##### Parameters

None

#### `@maxBits`

Define the max bits.

```typespec
@Ebus.Internal.maxBits(value: valueof uint8)
```

##### Target

`numeric`

##### Parameters

| Name  | Type            | Description   |
| ----- | --------------- | ------------- |
| value | `valueof uint8` | the max bits. |

#### `@reverse`

Define reverse representation.
For numeric types this means most significant byte first (big-endian)
instead of least significant byte first (little-endian).
For date/time types coded as sequence of individual parts this means reverse sequence
(i.e. year,month,day instead of day,month,year for dates
and seconds,minutes,hours instead of hours,minutes,seconds for times).

```typespec
@Ebus.Internal.reverse
```

##### Target

`Scalar`

##### Parameters

None
