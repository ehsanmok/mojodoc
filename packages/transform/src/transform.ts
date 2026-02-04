/**
 * Main transform function - converts parsed JSON to renderable structures.
 */

import type {
  MojoDocOutput,
  PackageDecl,
  ModuleDecl,
  FunctionDecl,
  StructDecl,
  TraitDecl,
  AliasDecl,
} from '@mojodoc/parser';

import type {
  DocSite,
  SiteConfig,
  Package,
  Module,
  FunctionItem,
  StructItem,
  TraitItem,
  AliasItem,
  ProcessedOverload,
  ProcessedArg,
  ProcessedTypeParam,
  ProcessedReturn,
  ProcessedField,
} from './types.js';

import { renderMarkdown, highlightSignature, highlightType, extractSummary } from './markdown.js';
import { buildNavTree, toAnchor } from './nav-tree.js';
import { buildSearchIndex } from './search-index.js';
import {
  parseInitFile,
  buildPublicApi,
  extractDocstring,
  extractModuleDocstring,
} from './public-api.js';

export interface TransformOptions {
  name?: string;
  version?: string;
  description?: string;
  baseUrl?: string;
  repository?: string;
  editLink?: boolean;
  /** Content of the package's __init__.mojo file for extracting public API */
  initFileContent?: string;
  /** Map of relative file paths to their content for extracting module docstrings */
  moduleFiles?: Map<string, string>;
}

/**
 * Transform mojo doc output into a DocSite structure.
 */
export function transform(doc: MojoDocOutput, options: TransformOptions = {}): DocSite {
  const decl = doc.decl;
  const moduleFiles = options.moduleFiles || new Map<string, string>();

  // Handle both package and module at root level
  let rootPackage: Package;
  let allModules: Module[];

  if (decl.kind === 'package') {
    rootPackage = transformPackage(decl as PackageDecl, '', moduleFiles);
    allModules = collectAllModules(rootPackage);
  } else {
    // Single module - wrap in synthetic package
    const mod = transformModule(decl as ModuleDecl, decl.name, decl.name, moduleFiles);
    rootPackage = {
      name: decl.name,
      path: decl.name,
      fullPath: decl.name,
      summary: decl.summary || '',
      description: decl.description || '',
      descriptionHtml: '',
      modules: [mod],
      subpackages: [],
      publicApi: [],
    };
    allModules = [mod];
  }

  // Extract public API from __init__.mojo if provided
  if (options.initFileContent) {
    const parsedImports = parseInitFile(options.initFileContent);
    rootPackage.publicApi = buildPublicApi(parsedImports, rootPackage.modules, rootPackage.path);

    // Extract and render docstring as package description
    const docstring = extractDocstring(options.initFileContent);
    if (docstring) {
      rootPackage.description = docstring;
      rootPackage.descriptionHtml = renderMarkdown(docstring);
    }
  }

  // Build config
  const config: SiteConfig = {
    name: options.name || rootPackage.name,
    version: options.version || doc.version,
    description: options.description || rootPackage.summary,
    baseUrl: options.baseUrl || '/',
    repository: options.repository,
    editLink: options.editLink ?? false,
  };

  // Build navigation tree
  const navTree =
    decl.kind === 'package'
      ? buildNavTree(decl as PackageDecl)
      : [
          {
            type: 'module' as const,
            name: decl.name,
            path: decl.name,
            urlPath: decl.name,
            children: [],
            items: [],
          },
        ];

  // Build search index
  const searchIndex = buildSearchIndex(allModules);

  return {
    config,
    rootPackage,
    searchIndex,
    navTree,
    allModules,
  };
}

/**
 * Transform a package declaration.
 */
function transformPackage(
  pkg: PackageDecl,
  parentPath: string,
  moduleFiles: Map<string, string>
): Package {
  const path = parentPath ? `${parentPath}.${pkg.name}` : pkg.name;

  const modules = pkg.modules.map((mod) =>
    transformModule(mod, path, `${path}.${mod.name}`, moduleFiles)
  );

  const subpackages = pkg.packages.map((sub) => transformPackage(sub, path, moduleFiles));

  // Try to extract description from package's __init__.mojo
  let description = pkg.description || '';
  let descriptionHtml = renderMarkdown(description);

  // Look for __init__.mojo in the package
  const initPath = parentPath
    ? `${parentPath.split('.').slice(1).join('/')}/${pkg.name}/__init__.mojo`
    : `${pkg.name}/__init__.mojo`;
  const initContent = moduleFiles.get(initPath) || moduleFiles.get(`__init__.mojo`);
  if (initContent && !description) {
    const docstring = extractModuleDocstring(initContent);
    if (docstring) {
      description = docstring;
      descriptionHtml = renderMarkdown(docstring);
    }
  }

  return {
    name: pkg.name,
    path,
    fullPath: path,
    summary: pkg.summary || extractSummary(description),
    description,
    descriptionHtml,
    modules,
    subpackages,
    publicApi: [], // Will be populated later for root package
  };
}

/**
 * Transform a module declaration.
 */
function transformModule(
  mod: ModuleDecl,
  parentPath: string,
  fullPath: string,
  moduleFiles: Map<string, string>
): Module {
  const urlPath = fullPath.replace(/\./g, '/');

  // Compute source file path relative to package root
  // e.g., for "mojson.cpu.simd_backend", sourceFile is "cpu/simd_backend.mojo"
  // For root package modules (e.g., "mojson.config"), sourceFile is "config.mojo"
  const pathParts = fullPath.split('.');
  const sourceFile =
    pathParts.length > 1 ? pathParts.slice(1).join('/') + '.mojo' : mod.name + '.mojo';

  // Try to extract description from the module's source file if mojo doc didn't provide one
  let description = mod.description || '';
  let descriptionHtml = renderMarkdown(description);

  // Look for the module's source file to extract docstring
  const moduleContent = moduleFiles.get(sourceFile);
  if (moduleContent && !description) {
    const docstring = extractModuleDocstring(moduleContent);
    if (docstring) {
      description = docstring;
      descriptionHtml = renderMarkdown(docstring);
    }
  }

  return {
    name: mod.name,
    path: `${parentPath}.${mod.name}`,
    fullPath,
    urlPath,
    summary: mod.summary || extractSummary(description),
    description,
    descriptionHtml,
    functions: mod.functions.map(transformFunction),
    structs: mod.structs.map(transformStruct),
    traits: mod.traits.map(transformTrait),
    aliases: mod.aliases.map(transformAlias),
    parentPackage: parentPath,
    sourceFile,
  };
}

/**
 * Transform a function declaration.
 */
function transformFunction(fn: FunctionDecl): FunctionItem {
  return {
    kind: 'function',
    name: fn.name,
    anchor: toAnchor(fn.name),
    overloads: fn.overloads.map(transformOverload),
  };
}

/**
 * Transform a function overload.
 */
function transformOverload(
  overload: import('@mojodoc/parser').FunctionOverload
): ProcessedOverload {
  return {
    signature: overload.signature,
    signatureHtml: highlightSignature(overload.signature),
    summary: overload.summary || '',
    description: overload.description || '',
    descriptionHtml: renderMarkdown(overload.description || ''),
    args: overload.args.map(transformArg),
    typeParams: overload.parameters.map(transformTypeParam),
    returns: overload.returns ? transformReturn(overload.returns) : null,
    raises: overload.raises
      ? {
          description: overload.raisesDoc || 'May raise an exception.',
          descriptionHtml: renderMarkdown(overload.raisesDoc || 'May raise an exception.'),
        }
      : null,
    isStatic: overload.isStatic,
    isAsync: overload.async,
    deprecated: overload.deprecated || null,
  };
}

/**
 * Transform an argument.
 */
function transformArg(arg: import('@mojodoc/parser').ArgumentDecl): ProcessedArg {
  return {
    name: arg.name,
    type: arg.type,
    typeHtml: highlightType(arg.type),
    typePath: arg.path || null,
    description: arg.description || '',
    descriptionHtml: renderMarkdown(arg.description || ''),
    convention: arg.convention,
    default: arg.default || null,
  };
}

/**
 * Transform a type parameter.
 */
function transformTypeParam(
  param: import('@mojodoc/parser').TypeParameterDecl
): ProcessedTypeParam {
  return {
    name: param.name || '',
    type: param.type || '',
    description: param.description || '',
    descriptionHtml: renderMarkdown(param.description || ''),
    constraints: (param.traits || []).map((t) => t.type),
  };
}

/**
 * Transform a return value.
 */
function transformReturn(ret: import('@mojodoc/parser').ReturnDecl): ProcessedReturn {
  return {
    type: ret.type,
    typeHtml: highlightType(ret.type),
    typePath: ret.path || null,
    description: ret.doc || '',
    descriptionHtml: renderMarkdown(ret.doc || ''),
  };
}

/**
 * Transform a struct declaration.
 */
function transformStruct(struct: StructDecl): StructItem {
  return {
    kind: 'struct',
    name: struct.name,
    anchor: toAnchor(struct.name),
    signature: struct.signature || `struct ${struct.name}`,
    signatureHtml: highlightSignature(struct.signature || `struct ${struct.name}`),
    summary: struct.summary || extractSummary(struct.description),
    description: struct.description || '',
    descriptionHtml: renderMarkdown(struct.description || ''),
    typeParams: (struct.parameters || []).map(transformTypeParam),
    fields: (struct.fields || []).map(transformField),
    methods: (struct.functions || []).map(transformFunction),
    deprecated: struct.deprecated || null,
  };
}

/**
 * Transform a field.
 */
function transformField(field: import('@mojodoc/parser').FieldDecl): ProcessedField {
  return {
    name: field.name,
    type: field.type,
    typeHtml: highlightType(field.type),
    typePath: field.path || null,
    summary: field.summary || '',
    description: field.description || '',
    descriptionHtml: renderMarkdown(field.description || ''),
  };
}

/**
 * Transform a trait declaration.
 */
function transformTrait(trait: TraitDecl): TraitItem {
  return {
    kind: 'trait',
    name: trait.name,
    anchor: toAnchor(trait.name),
    signature: trait.signature || `trait ${trait.name}`,
    signatureHtml: highlightSignature(trait.signature || `trait ${trait.name}`),
    summary: trait.summary || extractSummary(trait.description),
    description: trait.description || '',
    descriptionHtml: renderMarkdown(trait.description || ''),
    typeParams: (trait.parameters || []).map(transformTypeParam),
    methods: (trait.functions || []).map(transformFunction),
    deprecated: trait.deprecated || null,
  };
}

/**
 * Transform an alias declaration.
 */
function transformAlias(alias: AliasDecl): AliasItem {
  return {
    kind: 'alias',
    name: alias.name,
    anchor: toAnchor(alias.name),
    signature: alias.signature || `comptime ${alias.name}`,
    signatureHtml: highlightSignature(alias.signature || `comptime ${alias.name}`),
    summary: alias.summary || extractSummary(alias.description),
    description: alias.description || '',
    descriptionHtml: renderMarkdown(alias.description || ''),
    value: alias.value || '',
    typeParams: (alias.parameters || []).map(transformTypeParam),
    deprecated: alias.deprecated || null,
  };
}

/**
 * Collect all modules from a package tree.
 */
function collectAllModules(pkg: Package): Module[] {
  const modules: Module[] = [...pkg.modules];

  for (const sub of pkg.subpackages) {
    modules.push(...collectAllModules(sub));
  }

  return modules;
}
