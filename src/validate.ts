import {createDiagnosticCollector, getNamespaceFullName, type Model, type ModelProperty, type Program, type Scalar} from "@typespec/compiler";
import {getChain, getIdType, getValues} from "./decorators.js";
import {reportDiagnostic, StateKeys} from "./lib.js";


// perform higher level validation that can't be done by decorators directly
export const $onValidate = (program: Program): void => {
  const diagnostics = createDiagnosticCollector();
  // walk through all models having an @id/@ext assigned
  for (const target of program.stateSet(StateKeys.id).values() as IterableIterator<Model>) {
    const {isExt, id} = getIdType(program, target)!;
    // check combination with @chain
    const chain = getChain(program, target);
    if (chain) {
      const length = id.length - (isExt?0:2);
      if (length <= 0) {
        reportDiagnostic(program, {
          code: "invalid-length",
          target,
          format: { which: isExt ? '@ext' : '@id', value: '0'},
        });
      } else {
        const badLength = chain.dds.find(dd => dd.length !== length);
        if (badLength !== undefined) {
          reportDiagnostic(program, {
            code: "invalid-length",
            target,
            format: { which: '@chain', value: badLength.length.toString()},
          });
        }
      }
    }
    // check for model recursion
    const nameOf = (model: Model): string => (model.namespace?getNamespaceFullName(model.namespace)+'.':'')+model.name;
    const checkRecursion = (model: Model, parents: string[]): Model|undefined => {
      const name = nameOf(model);
      if (parents.includes(name)) {
        return model;
      }
      const subParents = [...parents, name];
      for (const prop of model.properties.values()) {
        if (prop.type.kind==='Model') {
          const ret = checkRecursion(prop.type, subParents);
          if (ret) {
            return ret;
          }
        }
      }
    }
    const model = checkRecursion(target, []);
    if (model) {
      reportDiagnostic(program, {
        code: "banned-inheritance",
        target,
        format: {ref: model.name},
      });
    }
  }
  // walk through all models having a @chain assigned
  for (const target of program.stateMap(StateKeys.chain).keys() as IterableIterator<Model>) {
    const id = getIdType(program, target);
    // only valid in combination with @id/@ext
    if (!id || id.isExt===undefined) {
      reportDiagnostic(program, {
        code: "missing-decorator",
        target,
        format: { which: 'id/@ext'},
      });
    }
  }
  //  walk through all scalars+modelproperties having a @divisor or @factor assigned
  for (const target of program.stateSet(StateKeys.divisor).values() as IterableIterator<Scalar|ModelProperty>) {
    if (getValues(program, target)) {
      reportDiagnostic(program, {
        code: "banned-values",
        target,
        format: { detail: 'combined with divisor/factor' },
      });
    }
  }

  if (diagnostics.diagnostics.length > 0) {
    program.reportDiagnostics(diagnostics.diagnostics);
  }
}
