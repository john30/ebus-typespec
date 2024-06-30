import {emitFile, getDoc as getDocNoTrans, getMaxLength, getMinLength, getNamespaceFullName, isDeclaredInNamespace, isNumericType, type CompilerHost, type DiagnosticTarget, type EmitContext, type Model, type ModelProperty, type Namespace, type Node, type Program, type Scalar, type Type, type TypeSpecScriptNode, type Union} from "@typespec/compiler";
import {CodeTypeEmitter, StringBuilder, code, type AssetEmitter, type Context, type EmittedSourceFile, type EmitterOutput, type Scope, type SourceFile, type SourceFileScope} from "@typespec/compiler/emitter-framework";
import {DuplicateTracker} from "@typespec/compiler/utils";
import jsYaml from "js-yaml";
import {basename, extname} from "path";
import {getAuth, getChain, getConditions, getDivisor, getId, getInherit, getMaxBits, getOut, getPassive, getQq, getUnit, getValues, getWrite, getZz, isSourceAddr} from "./decorators.js";
import {StateKeys, reportDiagnostic, type EbusdEmitterOptions} from "./lib.js";

const hex = (v?: number): string => v===undefined?'':(0x100|v).toString(16).substring(1);
const hexs = (vs?: number[]): string => vs?vs.map(hex).join(''):'';
const fileParent = (n: Node): TypeSpecScriptNode['file'] => (n as TypeSpecScriptNode).file || n.parent && fileParent(n.parent);
const isSourceFileWithPath = (scope: Scope<object>): scope is SourceFileScope<object> => scope.kind === "sourceFile" && !!scope.sourceFile.path;
const escape = (s?: string) => s&&(s.includes('"')||s?.includes(',')) ? `"${s.replaceAll('"', '""')}"` : s;
const pascalCase = (s?: string) => s ? s.substring(0,1).toUpperCase()+s.substring(1) : s;
const isDigit = (ch: string) => ch>='0' && ch<='9';
const normName: Record<'circuit'|'message'|'field', (s?: string) => string|undefined> = {
  circuit: (s) => s?pascalCase(s.startsWith('_')&&isDigit(s[1])?s.substring(1):s):s,
  message: (s) => pascalCase(s),
  field: (s) => s ? s.toLowerCase() : s,
}
const mapConds = (idModel: Type|undefined, sf: SourceFile<object>, conds?: [ModelProperty|Model, ...string[]][]) => conds?.map(c => {
  const values = c.length>1 ? (c[1].match(/^[<>=]/)?'':'=')+c.slice(1).join(';') : '';
  const ref = c[0];
  let propName = ref.kind==='ModelProperty' ? ref.name : '';
  const model = propName ? (ref as ModelProperty).model : ref as Model;
  let modelName = model?.name;
  let condName = (modelName+(propName==='value'?'':'_'+propName)).toLowerCase();
  let circuitName = '';
  if (idModel && model===idModel) {
    modelName = '';
    circuitName = 'scan';
    propName = propName.toUpperCase(); // todo support lowercase in ebusd as well
  } else {
    modelName = (modelName||'').toLowerCase();
  }
  sf.imports.set(condName, [`[${condName}]`,circuitName,'',modelName!,'',propName]);
  return `[${condName+values}]`;
}).join('');


export class EbusdEmitter extends CodeTypeEmitter<EbusdEmitterOptions> {
  #idDuplicateTracker = new DuplicateTracker<string, DiagnosticTarget>();
  #sourceFileByPath = new Map<string, SourceFile<any>>();

  constructor(emitter: AssetEmitter<string, EbusdEmitterOptions>,
    private translations = new Map<string, string>()) {
    super(emitter);
  }

  programContext(program: Program): Context {
    const sourceFile = this.emitter.createSourceFile('');
    return {
      scope: sourceFile.globalScope,
    };
  }

  modelDeclaration(model: Model, name: string): EmitterOutput<string> {
    const program = this.emitter.getProgram();
    const decls: string[] = [];
    const context = this.emitter.getContext();
    if (!program.stateSet(StateKeys.id).has(model) || context.exclude) {
      return this.emitter.result.none();
    }
    const sf = this.#getCurrentSourceFile();
    let nearestNamespace: string|undefined;
    let nearestCircuit: string|undefined;
    let nearestZz: number|undefined;
    for (const frame of [model, context.referencedBy as Union]) {
      if (!frame) continue;
      // get "file" namespace
      const fp = fileParent(frame.node as Node);
      for (let n = fp && frame.namespace; n; n=n.namespace) {
        if (n?.name==='Ebus') {
          break;
        }
        if (frame!==context.referencedBy && fileParent(n.node)!==fp) {
          break;
        }
        if (!nearestNamespace) {
          nearestNamespace = n.name;
        }
        const zz = getZz(program, n);
        if (zz!==undefined) {
          // topmost namespace with @zz decides the circuit name.
          // if absent, then the file name is taken
          if (!nearestCircuit) {
            nearestCircuit = n.name || nearestNamespace;
          }
          if (!nearestZz) {
            // nearest namespace with @zz decides the fallback ZZ
            nearestZz = zz;
          }
        }
      }
      if (!nearestCircuit) {
        let fileCircuit = basename(fp.path, extname(fp.path));
        if (context.referencedBy && fileCircuit.endsWith('_inc')
        || extname(sf?.path)==='.inc' && fileCircuit===basename(sf.path, '.inc')+'_inc') {
          fileCircuit = ''; // leave circuit blank in include files unless the circuit name was set explicitly
        } else {
          const parts = fileCircuit.split('.');
          if (parts.length>1 && parts[0].match(/^[0-9a-fA-F]{2,2}$/)) {
             // use topmost non-zz part and avoid component parts like mc in ehp.mc
            fileCircuit = parts[1];
          } else if (parts.length>1) {
            fileCircuit = ''; // avoid hw/sw filtered parts
          }
        }
        nearestCircuit = nearestNamespace && nearestNamespace.toLowerCase()===fileCircuit ? nearestNamespace : fileCircuit;
      }
    }
    if (nearestCircuit) {
      nearestCircuit = nearestCircuit.split('.')[0]; // strip off further other suffixes
      const nearestCircuitLower = nearestCircuit.toLowerCase();
      const parts = basename(sf.path, extname(sf.path)).split('.');
      if (parts.length>1 && parts[0].match(/^[0-9a-fA-F]{2,2}$/)) {
        parts.splice(0, 1); // remove zz part
        if (parts[0] === nearestCircuitLower) {
          nearestCircuit = '';
        }
      }
    }
    const [idModel] = program.resolveTypeReference('Ebus.Id.Id');
    const conds = (context.conds||'')+mapConds(idModel, sf, getConditions(program, model)||(model.namespace&&getConditions(program, model.namespace))||[]);
    for (const inheritFrom of getInherit(program, model)??[undefined]) {
      let write = getWrite(program, model) ?? getWrite(program, inheritFrom);
      const passive = getPassive(program, model) ?? getPassive(program, inheritFrom);
      let zz = getZz(program, model) ?? getZz(program, inheritFrom) ?? nearestZz;
      let broadcastTarget = false;
      if (zz === 0xfe || isSourceAddr(zz)) {
        // special: broadcast or source as target
        if (passive===undefined) {
          // auto for write depending on zz unless @passive was set
          write ??= true;
        }
        if (zz === 0xfe) {
          broadcastTarget = true;
        }
      } else if (zz===0xaa) { // explicit unset in child (see decorator handling)
        zz = undefined;
      }
      const direction = write ? (passive ? 'uw' : 'w') : (passive ? 'u' : 'r');
      // add a generic default line for each direction at least
      if (!sf.imports.has(direction)) {
        sf.imports.set(direction, [direction,'']);
      }
      const baseFields = inheritFrom&&this.modelPropertiesRw(inheritFrom, write&&!passive, broadcastTarget);
      const fields = this.modelPropertiesRw(model, write&&!passive, broadcastTarget);
      const comment = this.#getDoc(model) ?? this.#getDoc(inheritFrom);
      const qq = getQq(program, model) ?? getQq(program, inheritFrom); // todo could do same handling as for zz
      // when inheriting id, only one of them may have pbsb, rest of id is concatenated
      const baseId = getId(program, inheritFrom);
      const modelId = getId(program, model);
      const id = [...(baseId||[]), ...(modelId||[])];
      if (id.length<2) {
        reportDiagnostic(program, {
          code: "short-id",
          format: { id: id.join() },
          target: model,
        }); // impossible by decorators anyway
      } else {
        this.#idDuplicateTracker.track([sf?.path||'', conds, direction, qq, zz, ...id].join(), model);
      }
      const idh = hexs(id);
      const pbsb = idh.substring(0, 4);
      let ids = idh.substring(4);
      const chain = getChain(program, model) || getChain(program, inheritFrom);
      if (chain) {
        let badLength = ids.length ? '' : 'missing DD';
        let idsuffix = '';
        if (!badLength) {
          const lengthSuffix = chain.length ? `:${chain.length}` : '';
          idsuffix += lengthSuffix;
          const commonPrefix = idh.substring(4, idh.length-chain.dds[0].length*2);
          for (const dd of chain.dds) {
            const h = hexs(dd);
            if (h.length < idh.length-4-commonPrefix.length) {
              badLength = h || 'missing suffix';
            } else {
              idsuffix += `;${commonPrefix}${h}${lengthSuffix}`;
            }
          }
        }
        if (badLength) {
          reportDiagnostic(program, {
            code: "invalid-length",
            format: { which: 'chain', value: badLength },
            target: model,
          }); 
        } else {
          ids += idsuffix;
        }
      }
      if (zz!==undefined && basename(sf.path).startsWith(hex(zz)+'.')) {
        // avoid inline zz when already part of file name
        zz = undefined;
      }
      if (nearestCircuit && basename(sf.path).includes('.'+nearestCircuit.toLowerCase()+'.')) {
        nearestCircuit = undefined;
      }
      const level = getAuth(program, model) ?? getAuth(program, inheritFrom);
      // message: type,circuit,level,name,comment,qq,zz,pbsb,id,...fields
      // field: name,part,type,divisor/values,unit,comment
      const message = [conds+direction, normName.circuit(nearestCircuit), level, normName.message(name), escape(comment), hex(qq), hex(zz), pbsb, ids]
      decls.push([...message, ...(baseFields?[baseFields]:[]), fields].join());
    }
    return this.emitter.result.declaration(name, decls.join('\n'));
  }

  modelPropertiesRw(model: Model, activeWrite?: boolean, broadcastTarget?: boolean): EmitterOutput<string> {
    const b = new StringBuilder()
    let first = true
    const program = this.emitter.getProgram();
    const properties = Array.from(model.properties.values());
    let recursion = 0;
    let commentProp: ModelProperty|undefined;
    for (let idx = 0; idx<properties.length; idx++) {
      const p = properties[idx];
      if (p.type.kind!=='Scalar' && p.type.kind!=='ModelProperty') {
        if (p.type.kind==='Model' && p.type.properties && recursion<5) {
          // insert the referenced models properties inplace and go on with those (this is recursive)
          const append = Array.from(p.type.properties.values());
          properties.splice(idx+1, 0, ...append);
          recursion++;
          // extract the comment only from reference:
          commentProp = p;
        } else {
          reportDiagnostic(program, {
            code: "banned-inheritance",
            target: model,
            format: {ref: p.name},
          });
          commentProp = undefined;
        }
        continue;
      }
      if (p.optional && activeWrite) {
        // optional fields are omitted for active write
        commentProp = undefined;
        continue;
      }
      let res = {} as {pname: string, name: string, length?: number, remainLength?: boolean, dir?: 'm'|'s', divisor?: number, values?: string[], unit?: string, comment?: string};
      let s: ModelProperty|Scalar = p;
      let isOwn = false;
      do {
        res = {...res, name: s.name};
        if (s.kind==='ModelProperty') {
          if (!res.pname) {
            res.pname = s.name;
          }
        } else if (this.#isStdType(s, true)) {
          isOwn = true;
          // set length depending on difference to max in base type
          if (res.length!==undefined) {
            const length = isNumericType(program, s) ? getMaxBits(program, s) : getMaxLength(program, s);
            if (!length || res.length > length) {
              res.length = undefined;
              reportDiagnostic(program, {
                code: "banned-length",
                format: { which: isNumericType(program, s) ? 'maxBits' : 'maxLength', value: `${length}` },
                target: model,
              });
            } else if (length === res.length) {
              res.length = res.remainLength ? 1 : undefined;
            }
          }
          break; // ebus base type reached
        }
        res.length ??= isNumericType(program, s) ? getMaxBits(program, s) : getMaxLength(program, s);
        res.remainLength ??= !isNumericType(program, s) && getMinLength(program, s)===0;
        if (!res.dir && s.kind==='ModelProperty') {
          const out = getOut(program, s as ModelProperty);
          if (out!==undefined) {
            if (broadcastTarget && out===false) {
              reportDiagnostic(program, {
                code: "banned-in",
                format: { },
                target: s,
              });
            }
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
        if (commentProp) {
          res.comment ??= this.#getDoc(commentProp);
          commentProp = undefined;
        }
        res.comment ??= this.#getDoc(s);
        if (s.kind==='ModelProperty') {
          s = s.type as Scalar|ModelProperty;
        } else {
          if (!s.baseScalar) {
            break;
          }
          s = s.baseScalar;
        }
      } while (true);
      commentProp = undefined;
      if (!isOwn) {
        reportDiagnostic(program, {
          code: "banned-type",
          format: { type: res.name, name: res.pname },
          target: model,
        });
        continue;
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
        typ += ':'+(res.remainLength?'*':res.length);
      }
      const field = [normName.field(res.pname),res.dir,typ,divisor,res.unit,escape(res.comment)];
      if (first) {
        first = false;
      } else {
        b.push(',');
      }
      b.push(field.join());
    }
    return code`${b}`
  }

  unionDeclaration(union: Union, name: string): EmitterOutput<string> {
    if (name!=='_includes') {
      return this.emitter.result.none();
    }
    const decls: string[] = [];
    const addInclude = (ns: Namespace, comment?: string, conds?: string, isLoad = false) => {
      const fp = fileParent(ns.node as Node);
      let name = basename(fp.path, extname(fp.path))
      if (name.endsWith('_inc')) {
        name = name.substring(0, name.length-4)+'.inc';
      } else {
        name += '.csv';
      }
      const incl = [conds+'!'+(isLoad?'load':'include'), name.toLowerCase(), '', '', escape(comment)];
      decls.push(incl.join());
    };
    const program = this.emitter.getProgram();
    const sf = this.#getCurrentSourceFile();
    const [idModel] = program.resolveTypeReference('Ebus.Id.Id');
    if (this.emitter.getOptions()["includes"]) {
      const comment = this.#getDoc(union);
      if (comment) {
        decls.push(`# ${comment}`);
      }
      union.variants.forEach(uv => {
        if (uv.type.kind!=='Namespace') {
          return;
        }
        const isLoad = typeof uv.name === 'string' && !!uv.name;
        const conds = mapConds(idModel, sf, getConditions(program, uv)||[]);
        addInclude(uv.type, this.#getDoc(uv), conds, isLoad);
      });
      return this.emitter.result.declaration(name, decls.join('\n'));
    }
    const current = this.emitter.getContext();
    if (current.referencedBy) {
      reportDiagnostic(program, {
        code: "banned-inheritance",
        format: {},
        target: union,
      });
      return this.emitter.result.none(); // only single reference level supported
    }
    union.variants.forEach(uv => {
      if (uv.type.kind!=='Namespace') {
        return;
      }
      const namespace = uv.type as Namespace;
      const conds = mapConds(idModel, sf, getConditions(program, uv)||[]);
      const isLoad = typeof uv.name === 'string' && uv.name;
      if (isLoad) {
        const referenceContext = this.#mkContext(namespace.node, namespace, undefined, true);
        if (Object.keys(referenceContext).length && !referenceContext.exclude
        && this.#sourceFileByPath.get(referenceContext.fullname)?.meta.refCount===1) {
          this.emitter.emitTypeReference(namespace, {referenceContext}) // force emit the included file itself, once only
        }
        addInclude(namespace, this.#getDoc(uv), conds, true);
      } else {
        current.referencedBy = union;
        current.conds = conds;
        this.emitter.emitTypeReference(namespace, {referenceContext: current})
        delete current.conds;
        delete current.referencedBy;
      }
    });
    return this.emitter.result.declaration(name, decls.join('\n')); // at least empty string needed to combine emitted declarations from above
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
      if (sf.meta.shouldEmit && emittedSf.contents.length>1) {
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
    if (!content.length) {
      sourceFile.meta.shouldEmit = false;
      return {contents: '', path: sourceFile.path};
    }
    const b = new StringBuilder();
    Array.from(sourceFile.imports.values())
    .sort((a, b) => a.length-b.length) // have the single column defaults at the top
    .forEach(i => b.push(`*${i.join()}\n`));
    return {
      contents:
        `type,circuit,level,name,comment,qq,zz,pbsb,id,`
        +`*name,part,type,divisor/values,unit,comment\n`
        +b.reduce()
        +content.filter(l=>l).join('\n')+'\n',
      path: sourceFile.path,
    };
  }


  #getCurrentSourceFile() {
    let scope: Scope<object> = this.emitter.getContext().scope;
    while (scope && !isSourceFileWithPath(scope)) {
      scope = scope.parentScope;
    }
    return scope?.sourceFile;
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

  namespaceContext(namespace: Namespace): Context {
    return this.#mkContext(namespace.node, namespace); 
  }

  modelDeclarationContext(model: Model, modelName: string): Context {
    return this.#mkContext(model.node as Node, model.namespace, model);
  }

  #mkContext(node: Node, namespace?: Namespace, typ?: Model, forLoad = false): Context {
    // if (this.#isStdType(model) && model.name === "object") {
    //   return {};
    // }
    const currentCtx = this.emitter.getContext();
    if (currentCtx.referencedBy && !currentCtx.isLoad) {
      return currentCtx;
    }
    for (let n = namespace; n; n=n.namespace) {
      if (n?.name==='Ebus') { // omit lib models
        return {};
      }
    }
    const nsf = namespace&&getNamespaceFullName(namespace);
    let root = nsf && nsf.split('.')[0].toLowerCase();
    let ext = this.#fileExtension();
    const fp = fileParent(node);
    let fileCircuit = fp?.path && basename(fp.path, extname(fp.path));
    // similar to nearestCircuit calculation in modelDeclaration()
    if (fileCircuit?.endsWith('_inc')) {
      if (!this.emitter.getOptions()["includes"] && !(forLoad || currentCtx.isLoad)) {
        return {exclude: true};
      }
      if (root===fileCircuit) {
        root = '';
      }
      ext = 'inc';
      fileCircuit = fileCircuit.substring(0, fileCircuit.length-4);
    } else if (fileCircuit && root && fileCircuit.toLowerCase().includes(root.toLowerCase())) {
      // prevent root prefix
      root = '';
    }
    const name = (fileCircuit || (typ&&this.declarationName(typ)) || '').toLowerCase();
    const fullname = `${root&&root!==name?root+'/':''}${name}`;
    let sourceFile = this.#sourceFileByPath.get(fullname);
    if (!sourceFile) {
      sourceFile = this.emitter.createSourceFile(
        `${fullname}.${ext}`
      );
      sourceFile.meta.shouldEmit = true;
      sourceFile.meta.bundledRefs = [];
      sourceFile.meta.refCount = 1;
      this.#sourceFileByPath.set(fullname, sourceFile);
    } else {
      sourceFile.meta.refCount++;
    }

    return {
      scope: sourceFile.globalScope,
      isLoad: forLoad,
      fullname,
    };
  }

  #fileExtension() {
    // return this.emitter.getOptions()["file-type"] === "json" ? "json"
    //  : this.emitter.getOptions()["file-type"] === "yaml" ? "yaml" :
    return "csv";
  }

  #getDoc(target: Type) {
    const str = getDocNoTrans(this.emitter.getProgram(), target);
    return !str ? str : (this.translations.get(str) || str);
  }
  
}

export async function getEbusdEmitterClass(host: CompilerHost, translationFile?: string): Promise<typeof EbusdEmitter> {
  let translations: Map<string, string>;
  if (translationFile) {
    const content = (await host.readFile(translationFile)).text;
    if (content) {
      const data = jsYaml.load(content);
      translations = new Map();
      for (const [k, v] of Object.entries(data as Record<string, string>)) {
        translations.set(k, v);
        if (v.endsWith('.') && k.endsWith('.')) {
          // for convenience
          translations.set(k.substring(0, k.length-1), v.substring(0, v.length-1));
        }
      }
    }
  }

  class ParamedEbusdEmitter extends EbusdEmitter {
    constructor(emitter: AssetEmitter<string, EbusdEmitterOptions>) {
      super(emitter, translations);
    }
  };
  return ParamedEbusdEmitter;
}

export async function $onEmit(context: EmitContext<EbusdEmitterOptions>) {
  const emitter =
  // context.options["file-type"]==='csv'?
  context.getAssetEmitter(await getEbusdEmitterClass(context.program.host, context.options.translations));
  emitter.emitProgram();
  await emitter.writeOutput();
}
