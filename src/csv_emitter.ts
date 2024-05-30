import { stringify } from "yaml";
import { compilerAssert, DiagnosticTarget, EmitContext, emitFile, getDoc, getNamespaceFullName, getRelativePathFromDirectory, isDeclaredInNamespace, Model, ModelProperty, Node, Program, resolvePath, Scalar, Type, TypeSpecScriptNode } from "@typespec/compiler";
import { DuplicateTracker } from "@typespec/compiler/utils";
import {code, Context, Declaration, EmittedSourceFile, EmitterOutput, RawCode, Scope, ScopeBase, SourceFile, SourceFileScope, StringBuilder, TypeEmitter, TypeSpecDeclaration} from "@typespec/compiler/emitter-framework";
import {EbusdEmitterOptions, reportDiagnostic} from "./lib.js";
import {getDivisor, getId, getInherit, getOut, getPassive, getQq, getUnit, getWrite, getZz} from "./decorators.js";
import {basename, extname} from "path";

export class EbusdEmitter extends TypeEmitter<string, EbusdEmitterOptions> {
  #idDuplicateTracker = new DuplicateTracker<string, DiagnosticTarget>();
  #sourceFileByPath = new Map<string, SourceFile<any>>();
  // #typeForSourceFile = new Map<SourceFile<any>, JsonSchemaDeclaration>();
  // #refToDecl = new Map<string, Declaration<Record<string, unknown>>>();

  modelDeclaration(model: Model, name: string): EmitterOutput<string> {
    // const schema = this.#initializeSchema(model, name, {
    //   type: "object",
    //   properties: this.emitter.emitModelProperties(model),
    //   required: this.#requiredModelProperties(model),
    // });

    // if (model.baseModel) {
    //   const allOf = new ArrayBuilder();
    //   allOf.push(this.emitter.emitTypeReference(model.baseModel));
    //   schema.set("allOf", allOf);
    // }

    // if (model.indexer) {
    //   schema.set("additionalProperties", this.emitter.emitTypeReference(model.indexer.value));
    // }
    const program = this.emitter.getProgram();
    const hex = (v?: number): string => v===undefined?'':(0x100|v).toString(16).substring(1);
    const hexs = (vs?: number[]): string => vs?vs.map(hex).join(''):'';
    const decls: string[] = [];
    for (const inheritFrom of getInherit(program, model)??[undefined]) {
      const baseFields = inheritFrom&&(this.emitter.emitModelProperties(inheritFrom) as RawCode<string>).value;
      const fields = (this.emitter.emitModelProperties(model) as RawCode<string>).value;
      //todo could decline when either one is undefined
      const write = getWrite(program, model) ?? getWrite(program, inheritFrom);
      const passive = getPassive(program, model) ?? getPassive(program, inheritFrom);
      const direction = write ? (passive ? 'uw' : 'w') : (passive ? 'u' : 'r');
      const namespace = model.namespace ?? inheritFrom?.namespace;
      const circuit = namespace ? getNamespaceFullName(namespace) : '';
      const comment = getDoc(program, model) ?? getDoc(program, inheritFrom);
      const qq = getQq(program, model) ?? getQq(program, inheritFrom);
      const zz = getZz(program, model) ?? getZz(program, inheritFrom);
      //when inheriting id, only one of them may have pbsb, rest of id is concatenated
      const baseId = getId(program, inheritFrom);//todo could allow <2 bytes for inherited or child id when combining
      const id = [...(baseId||[]), ...(getId(program, model)||[])];
      if (id.length<2) {
        //todo throw
      }
      const idh = hexs(id);
      // type (r[1-9];w;u),class,name,comment,QQ,ZZ,PBSB,ID
      const message = [direction, circuit.toLowerCase(), name.toLowerCase(), comment, hex(qq), hex(zz), idh.substring(0, 4), idh.substring(4)]
      decls.push([...message, ...(baseFields?[baseFields]:[]), fields].join());
    }
    return this.emitter.result.declaration(name, decls.join('\n'));
  }

  modelProperties(model: Model): EmitterOutput<string> {
    const b = new StringBuilder()
    let first = true
    const program = this.emitter.getProgram();
    model.properties.forEach(p => {
      if (p.type.kind!=='Scalar') {
        return;//todo report
      }
      let res = {} as {name: string, dir?: 'm'|'s', divisor?: number, unit?: string, comment?: string};
      let s: ModelProperty|Scalar = p;
      let isOwn = false;
      do {
        res = {...res, name: s.name};
        if (s.kind!=='ModelProperty' && this.#isStdType(s, true)) {
          isOwn = true;
          break; // ebus base type reached
        }
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
        if (!res.unit) {
          res.unit = getUnit(program, s);
        }
        if (!res.comment) {
          res.comment = getDoc(program, s);
        }
        if (s.kind==='ModelProperty') {
          s = p.type as Scalar;
        } else {
          if (!s.baseScalar) {
            break;
          }
          s = s.baseScalar;
        }
      } while (true);
      //todo if (!isOwn) throw
      // field,part (m/s),type / templates,divider / values,unit,comment
      const field = [p.name,res.dir,res.name,res.divisor?Math.round(res.divisor<1?-1.0/res.divisor:res.divisor):undefined,res.unit,res.comment];
      if (first) {
        first = false;
      } else {
        b.push(',');
      }
      b.push(field.join());
    })
    return code`${b}`
  }
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
  
  modelDeclarationContext(model: Model, name: string): Context {
    // if (this.#isStdType(model) && model.name === "object") {
    //   return {};
    // }
    return this.#newFileScope(model);
  }

  #getCurrentSourceFile(name?: string) {
    let scope: Scope<string> = this.emitter.getContext().scope;
    while (scope && scope.kind !== "sourceFile" && !(name && name===scope.name)) {
      scope = scope.parentScope;
    }
    return (scope as SourceFileScope<string>).sourceFile;
  }
  // programContext(program: Program): Context {
  //   // const base = this.emitter.getOptions().emitterOutputDir;
  //   // const file = this.#getCurrentSourceFile().path;
  //   // const relative = getRelativePathFromDirectory(base, file, false);
  //   // let scope: Scope<string> = this.programContext().scope;
  //   // while (scope && scope.kind !== "sourceFile") {
  //   //   console.log(scope.kind)
  //   //   scope = scope.parentScope;
  //   // }
  //   // program.sourceFiles
  //   // const relative='file';
  //   // // program.getSourceFileLocationContext()
  //   // const sf = program.sourceFiles;
  //   // const c = this.emitter.getContext()
  //   // const sourceFile = this.emitter.createSourceFile(
  //   //   `${relative}.${this.#fileExtension()}`
  //   // );

  //   // sourceFile.meta.shouldEmit = true;
  //   // sourceFile.meta.bundledRefs = [];

  //   // this.#typeForSourceFile.set(sourceFile, type);
  //   // return {
  //   //   scope: sourceFile.globalScope,
  //   // };
  //   const scope = this.emitter.createScope({
  //     program,
  //   }, 'program');
  //   return {scope};
  // }
  #newFileScope(type: TypeSpecDeclaration) {
    const program: Program = this.emitter.getProgram();
    const fileParent = (n: Node): TypeSpecScriptNode['file'] => (n as TypeSpecScriptNode).file || n.parent && fileParent(n.parent);
    const fp = fileParent(type.node as Node);
    // const fl = p.getSourceFileLocationContext(fp);
    const name = fp?.path && basename(fp.path, extname(fp.path)) || this.declarationName(type) || '';
    let sourceFile = this.#sourceFileByPath.get(name);
    if (!sourceFile) {
      sourceFile = this.emitter.createSourceFile(
        `${name}.${this.#fileExtension()}`
      );
      // ((sourceFile.globalScope as SourceFileScope<string>).sourceFile as any).program = program;
      sourceFile.meta.shouldEmit = true;
      sourceFile.meta.bundledRefs = [];
      this.#sourceFileByPath.set(name, sourceFile);
    }

    // this.#typeForSourceFile.set(sourceFile, type);
    return {
      scope: sourceFile.globalScope,
    };
  }

  #fileExtension() {
    return this.emitter.getOptions()["file-type"] === "json" ? "json"
     : this.emitter.getOptions()["file-type"] === "yaml" ? "yaml" : "csv";
  }
}
