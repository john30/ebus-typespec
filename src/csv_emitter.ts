import {emitFile, getDoc, getMaxLength, getNamespaceFullName, isDeclaredInNamespace, isNumericType, type DiagnosticTarget, type Model, type ModelProperty, type Node, type Program, type Scalar, type Type, type TypeSpecScriptNode} from "@typespec/compiler";
import {StringBuilder, TypeEmitter, code, type Context, type EmittedSourceFile, type EmitterOutput, type SourceFile} from "@typespec/compiler/emitter-framework";
import {DuplicateTracker} from "@typespec/compiler/utils";
import {basename, extname} from "path";
import {getDivisor, getId, getInherit, getMaxBits, getOut, getPassive, getQq, getUnit, getValues, getWrite, getZz, isSourceAddr} from "./decorators.js";
import {StateKeys, reportDiagnostic, type EbusdEmitterOptions} from "./lib.js";

const hex = (v?: number): string => v===undefined?'':(0x100|v).toString(16).substring(1);
const hexs = (vs?: number[]): string => vs?vs.map(hex).join(''):'';
const fileParent = (n: Node): TypeSpecScriptNode['file'] => (n as TypeSpecScriptNode).file || n.parent && fileParent(n.parent);

export class EbusdEmitter extends TypeEmitter<string, EbusdEmitterOptions> {
  #idDuplicateTracker = new DuplicateTracker<string, DiagnosticTarget>();
  #sourceFileByPath = new Map<string, SourceFile<any>>();

  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile('');
    return {
      scope: sourceFile.globalScope,
    };
  }

  modelDeclaration(model: Model, name: string): EmitterOutput<string> {
    const program = this.emitter.getProgram();
    const decls: string[] = [];
    //todo detect invalid in with broadcast
    if (!program.stateSet(StateKeys.id).has(model)) {
      return this.emitter.result.none();
    }
    // get "file" namespace
    const fp = fileParent(model.node as Node);
    let circuit: string = basename(fp.path, extname(fp.path));
    let nearestZz: number|undefined;
    for (let n = fp && model.namespace; n; n=n.namespace) {
      if (n?.name==='Ebus') {
        break;
      }
      if (fileParent(n.node)!==fp) {
        break;
      }
      const zz = getZz(program, n);
      if (zz) {
        // topmost namespace with @zz decides the circuit name.
        // if absent, then the file name is taken
        circuit = n.name;
        if (!nearestZz) {
          // nearest namespace with @zz decides the fallback ZZ
          nearestZz = zz;
        }
      }
    }
    for (const inheritFrom of getInherit(program, model)??[undefined]) {
      //todo could decline when either one is undefined
      let write = getWrite(program, model) ?? getWrite(program, inheritFrom);
      const passive = getPassive(program, model) ?? getPassive(program, inheritFrom);
      let zz = getZz(program, model) ?? getZz(program, inheritFrom) ?? nearestZz;
      if (zz === 0xfe || isSourceAddr(zz)) {
        // special: broadcast or source as target
        if (passive===undefined) {
          // auto for write depending on zz unless @passive was set
          write ??= true;
        }
      } else if (zz===0xaa) { // explicit unset in child (see decorator handling)
        zz = undefined;
      }
      const direction = write ? (passive ? 'uw' : 'w') : (passive ? 'u' : 'r');
      const baseFields = inheritFrom&&this.modelPropertiesRw(inheritFrom, write&&!passive);
      const fields = this.modelPropertiesRw(model, write&&!passive);
      const comment = getDoc(program, model) ?? getDoc(program, inheritFrom);
      const qq = getQq(program, model) ?? getQq(program, inheritFrom); // todo could do same handling as for zz
      // when inheriting id, only one of them may have pbsb, rest of id is concatenated
      const baseId = getId(program, inheritFrom);//todo could allow <2 bytes for inherited or child id when combining
      const modelId = getId(program, model);
      const id = [...(baseId||[]), ...(modelId||[])];
      if (id.length<2) {
        //todo throw
      } else {
        this.#idDuplicateTracker.track([model.namespace?getNamespaceFullName(model.namespace):'',direction, qq, zz, ...id].join(), model);
      }
      const idh = hexs(id);
      // type (r[1-9];w;u),class,name,comment,QQ,ZZ,PBSB,ID
      const message = [direction, circuit.toLowerCase(), name.toLowerCase(), comment, hex(qq), hex(zz), idh.substring(0, 4), idh.substring(4)]
      decls.push([...message, ...(baseFields?[baseFields]:[]), fields].join());
    }
    return this.emitter.result.declaration(name, decls.join('\n'));
  }

  modelPropertiesRw(model: Model, activeWrite?: boolean): EmitterOutput<string> {
    const b = new StringBuilder()
    let first = true
    const program = this.emitter.getProgram();
    const properties = Array.from(model.properties.values());
    let recursion = 0;
    for (let idx = 0; idx<properties.length; idx++) {
      const p = properties[idx];
      if (p.type.kind!=='Scalar' && p.type.kind!=='ModelProperty') {
        if (p.type.kind==='Model' && p.type.properties && recursion<5) { // todo could emit warning if deeper
          // insert the referenced models properties inplace and go on with those (this is recursive)
          const append = Array.from(p.type.properties.values());
          properties.splice(idx+1, 0, ...append);
          recursion++;
        }
        continue;//todo report
      }
      if (p.optional && activeWrite) {
        // optional fields are omitted for active write
        continue;
      }
      let res = {} as {name: string, length?: number, dir?: 'm'|'s', divisor?: number, values?: string[], unit?: string, comment?: string};
      let s: ModelProperty|Scalar = p;
      let isOwn = false;
      do {
        res = {...res, name: s.name};
        if (s.kind!=='ModelProperty' && this.#isStdType(s, true)) {
          isOwn = true;
          // set length depending on difference to max in base type
          if (res.length!==undefined) {
            const length = isNumericType(program, s) ? getMaxBits(program, s) : getMaxLength(program, s);
            if (!length || res.length > length) {
              res.length = undefined; // todo rather throw?
            } else if (length === res.length) {
              res.length = undefined;
            }
          }
          break; // ebus base type reached
        }
        res.length ??= isNumericType(program, s) ? getMaxBits(program, s) : getMaxLength(program, s);
        if (!res.dir && s.kind==='ModelProperty') {
          const out = getOut(program, s as ModelProperty);
          if (out!==undefined) {
            res.dir = out ? 'm' : 's';
          }
        }
        const d = getDivisor(program, s);
        if (d!==undefined && d!==0) {
          res.divisor = (res.divisor||1) * d;
        }
        if (!res.divisor && !res.values) {
          const members = getValues(program, s)?.members;
          if (members) {
            const values: string[] = [];
            members.forEach(m => m.value!==undefined && values.push(m.value+'='+m.name));
            res.values = values;
          }
        }
        res.unit ??= getUnit(program, s);
        res.comment ??= getDoc(program, s);
        if (s.kind==='ModelProperty') {
          s = s.type as Scalar|ModelProperty;
        } else {
          if (!s.baseScalar) {
            break;
          }
          s = s.baseScalar;
        }
      } while (true);
      if (!isOwn) {
        continue; // todo throw?
      }
      // field,part (m/s),type / templates,divider / values,unit,comment
      const divisor = res.divisor?Math.round(res.divisor<1?-1.0/res.divisor:res.divisor)
      : res.values?.join(';');
      let typ: string = res.name;
      if (typ.length>4 && typ[3]==='_') {
        // expect to end with digits e.g. BI3_1
        typ = typ.substring(0, 3)+':'+typ.substring(4);
      } else if (typ.length>3 && typ.toUpperCase()===typ) {
        // expect to end with digits e.g. BCD4
        typ = typ.substring(0, 3)+':'+typ.substring(3);
      } else if (res.length) {
        typ += ':'+res.length;
      }
      const field = [p.name,res.dir,typ,divisor,res.unit,res.comment];
      if (first) {
        first = false;
      } else {
        b.push(',');
      }
      b.push(field.join());
    }
    return code`${b}`
  }
  //todo model combination
  //todo auth
  modelPropertyLiteral(property: ModelProperty): EmitterOutput<string> {
    return code`a property named ${property.name} and a type of ${this.emitter.emitType(
      property.type
    )}`;
  }

  modelLiteral(model: Model) {
    return code`an object literal`;
  }

  #isStdType(type: Type, ownOnly=false) {
    if (ownOnly) {
      const g = this.emitter.getProgram().getGlobalNamespaceType();
      const own = g.namespaces.get('Ebus');
      return own && isDeclaredInNamespace(type as Model, own);
    }
    return this.emitter.getProgram().checker.isStdType(type);
  }

  #reportDuplicateIds() {
    for (const [id, targets] of this.#idDuplicateTracker.entries()) {
      for (const target of targets) {
        reportDiagnostic(this.emitter.getProgram(), {
          code: "duplicate-id",
          format: { id },
          target: target,
        });
      }
    }
  }

  async writeOutput(sourceFiles: SourceFile<string>[]): Promise<void> {
    if (this.emitter.getOptions().noEmit) {
      return;
    }
    this.#reportDuplicateIds();
    const toEmit: EmittedSourceFile[] = [];

    for (const sf of sourceFiles) {
      const emittedSf = await this.emitter.emitSourceFile(sf);

      // emitSourceFile will assert if somehow we have more than one declaration here
      if (sf.meta.shouldEmit) {
        toEmit.push(emittedSf);
      }
    }

    for (const emittedSf of toEmit) {
      await emitFile(this.emitter.getProgram(), {
        path: emittedSf.path,
        content: emittedSf.contents,
      });
    }
  }

  sourceFile(sourceFile: SourceFile<string>): EmittedSourceFile {
    const content = sourceFile.globalScope.declarations.map(d => d.value)
    return {
      contents:
        // '# type (r[1-9];w;u),class,name,comment,QQ,ZZ,PBSB,ID,field,part (m/s),type / templates,divider / values,unit,comment\n'+
        content.join('\n')+'\n',
      path: sourceFile.path,
    };
  }


  // #serializeSourceFileContent(content: string[]): string {
  //   if (this.emitter.getOptions()["file-type"] === "csv") {
  //     return content.join('\n');
  //   } else if (this.emitter.getOptions()["file-type"] === "json") {
  //     return JSON.stringify(content, null, 2);
  //   } else {
  //     return stringify(content, {
  //       aliasDuplicateObjects: false,
  //       lineWidth: 0,
  //     });
  //   }
  // }
  
  modelDeclarationContext(model: Model, modelName: string): Context {
    // if (this.#isStdType(model) && model.name === "object") {
    //   return {};
    // }
    for (let n = model.namespace; n; n=n.namespace) {
      if (n?.name==='Ebus') { // omit lib models
        return {};
      }
    }
    const fp = fileParent(model.node as Node);
    const nsf = model.namespace&&getNamespaceFullName(model.namespace);
    const root = nsf && nsf.split('.')[0];
    const name = fp?.path && basename(fp.path, extname(fp.path)) || this.declarationName(model) || '';
    const fullname = `${root&&root!==name?root+'/':''}${name}`;
    let sourceFile = this.#sourceFileByPath.get(fullname);
    if (!sourceFile) {
      sourceFile = this.emitter.createSourceFile(
        `${fullname}.${this.#fileExtension()}`
      );
      sourceFile.meta.shouldEmit = true;
      sourceFile.meta.bundledRefs = [];
      this.#sourceFileByPath.set(fullname, sourceFile);
    }

    return {
      scope: sourceFile.globalScope,
    };
  }

  #fileExtension() {
    // return this.emitter.getOptions()["file-type"] === "json" ? "json"
    //  : this.emitter.getOptions()["file-type"] === "yaml" ? "yaml" :
    return "csv";
  }
}
