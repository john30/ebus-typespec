# ebus

TypeSpec library for defining eBUS messages and emitting to ebusd CSV.

## Install

```bash
npm install https://github.com/john30/ebus-typespec
```

## Emitter

### Usage

1. Via the command line

```bash
tsp compile . --emit=ebus
```

2. Via the config

```yaml
emit:
  - "ebus"
```

### Emitter options

#### `file-type`

**Type:** `"csv"`

Serialize the schema as csv

#### `includes`

**Type:** `boolean`

Emit includes files as includes instead of inline (incomplete!)

## Linter

### Usage

Add the following in `tspconfig.yaml`:

```yaml
linter:
  extends:
    - ebus/recommended
```

### RuleSets

Available ruleSets:

- [`ebus/recommended`](#ebus/recommended)
- [`ebus/all`](#ebus/all)

### Rules

| Name                 | Description                       |
| -------------------- | --------------------------------- |
| `ebus/no-function`   | Make sure function is not used.   |
| `ebus/no-interface`  | Make sure interface is not used.  |
| `ebus/no-intrinsic`  | Make sure intrinsic is not used.  |
| `ebus/no-literal`    | Make sure literal is not used.    |
| `ebus/no-object`     | Make sure object is not used.     |
| `ebus/no-operation`  | Make sure operation is not used.  |
| `ebus/no-projection` | Make sure projection is not used. |
| `ebus/no-template`   | Make sure template is not used.   |
| `ebus/no-tuple`      | Make sure tuple is not used.      |
| `ebus/no-union`      | Make sure union is not used.      |

## Decorators

### Ebus

- [`@auth`](#@auth)
- [`@base`](#@base)
- [`@condition`](#@condition)
- [`@divisor`](#@divisor)
- [`@ext`](#@ext)
- [`@factor`](#@factor)
- [`@id`](#@id)
- [`@in`](#@in)
- [`@inherit`](#@inherit)
- [`@out`](#@out)
- [`@passive`](#@passive)
- [`@qq`](#@qq)
- [`@unit`](#@unit)
- [`@values`](#@values)
- [`@write`](#@write)
- [`@zz`](#@zz)

#### `@auth`

Define authentication level.

```typespec
@Ebus.auth(auth: valueof string)
```

##### Target

`Model`

##### Parameters

| Name | Type                    | Description |
| ---- | ----------------------- | ----------- |
| auth | `valueof scalar string` |             |

#### `@base`

Define the base message ID to be combined with an extension ID.

```typespec
@Ebus.base(pb: valueof Ebus.Pb, sb: valueof Ebus.Sb, ...id: valueof Ebus.Symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type                          | Description               |
| ---- | ----------------------------- | ------------------------- |
| pb   | `valueof scalar Ebus.Pb`      | the primary message ID.   |
| sb   | `valueof scalar Ebus.Sb`      | the secondary message ID. |
| id   | `valueof model Ebus.Symbol[]` | further message ID parts. |

#### `@condition`

Define the condition(s) for the whole message (if given multiple times, all conditions must be met).

```typespec
@Ebus.condition(property: ModelProperty | Model, ...values: valueof string[])
```

##### Target

`union Namespace | Model | UnionVariant`

##### Parameters

| Name     | Type                           | Description                                                                                                             |
| -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| property | `union ModelProperty \| Model` | the referenced model property, or a model in case of existance check or single property only.                           |
| values   | `valueof model string[]`       | the optional alternative values the property needs to match (one of the values must match for the condition to be met). |

#### `@divisor`

Define the divisor.

```typespec
@Ebus.divisor(value: valueof numeric)
```

##### Target

`union numeric | plainTime | ModelProperty`

##### Parameters

| Name  | Type                     | Description  |
| ----- | ------------------------ | ------------ |
| value | `valueof scalar numeric` | the divisor. |

#### `@ext`

Define the extension message ID to be combined with a base ID.

```typespec
@Ebus.ext(...id: valueof Ebus.Symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type                          | Description                  |
| ---- | ----------------------------- | ---------------------------- |
| id   | `valueof model Ebus.Symbol[]` | message ID extensions parts. |

#### `@factor`

Define the factor.

```typespec
@Ebus.factor(value: valueof numeric)
```

##### Target

`union numeric | plainTime | ModelProperty`

##### Parameters

| Name  | Type                     | Description |
| ----- | ------------------------ | ----------- |
| value | `valueof scalar numeric` | the factor. |

#### `@id`

Define the whole message ID.

```typespec
@Ebus.id(pb: valueof Ebus.Pb, sb: valueof Ebus.Sb, ...id: valueof Ebus.Symbol[])
```

##### Target

`Model`

##### Parameters

| Name | Type                          | Description               |
| ---- | ----------------------------- | ------------------------- |
| pb   | `valueof scalar Ebus.Pb`      | the primary message ID.   |
| sb   | `valueof scalar Ebus.Sb`      | the secondary message ID. |
| id   | `valueof model Ebus.Symbol[]` | further message ID parts. |

#### `@in`

Define message part inbound from target.

```typespec
@Ebus.in
```

##### Target

`ModelProperty`

##### Parameters

None

#### `@inherit`

Define the inherited model(s).

```typespec
@Ebus.inherit(...models: valueof Model[])
```

##### Target

`Model`

##### Parameters

| Name   | Type                    | Description       |
| ------ | ----------------------- | ----------------- |
| models | `valueof model Model[]` | inherited models. |

#### `@out`

Define message part outbound to target.

```typespec
@Ebus.out
```

##### Target

`ModelProperty`

##### Parameters

None

#### `@passive`

Define passive only.

```typespec
@Ebus.passive
```

##### Target

`Model`

##### Parameters

None

#### `@qq`

Define the source address.

```typespec
@Ebus.qq(value?: valueof Ebus.Source)
```

##### Target

`Model`

##### Parameters

| Name  | Type                         | Description            |
| ----- | ---------------------------- | ---------------------- |
| value | `valueof scalar Ebus.Source` | the source address QQ. |

#### `@unit`

Define the unit.

```typespec
@Ebus.unit(value: valueof string)
```

##### Target

`union numeric | ModelProperty`

##### Parameters

| Name  | Type                    | Description |
| ----- | ----------------------- | ----------- |
| value | `valueof scalar string` | the unit.   |

#### `@values`

Define the known values.

```typespec
@Ebus.values(values: Enum)
```

##### Target

`union numeric | boolean | ModelProperty`

##### Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| values | `Enum` |             |

#### `@write`

Define write direction.

```typespec
@Ebus.write
```

##### Target

`Model`

##### Parameters

None

#### `@zz`

Define the target address.

```typespec
@Ebus.zz(value?: valueof Ebus.Target)
```

##### Target

`union Model | Namespace`

##### Parameters

| Name  | Type                         | Description            |
| ----- | ---------------------------- | ---------------------- |
| value | `valueof scalar Ebus.Target` | the target address ZZ. |

### Ebus.internal

- [`@bcd`](#@bcd)
- [`@hex`](#@hex)
- [`@maxBits`](#@maxbits)
- [`@reverse`](#@reverse)

#### `@bcd`

Define BCD encoding.

```typespec
@Ebus.internal.bcd
```

##### Target

`Scalar`

##### Parameters

None

#### `@hex`

Define HEX encoding.

```typespec
@Ebus.internal.hex
```

##### Target

`Scalar`

##### Parameters

None

#### `@maxBits`

Define the max bits.

```typespec
@Ebus.internal.maxBits(value: valueof numeric)
```

##### Target

`scalar numeric`

##### Parameters

| Name  | Type                     | Description   |
| ----- | ------------------------ | ------------- |
| value | `valueof scalar numeric` | the max bits. |

#### `@reverse`

Define reverse representation.

```typespec
@Ebus.internal.reverse
```

##### Target

`Scalar`

##### Parameters

None
