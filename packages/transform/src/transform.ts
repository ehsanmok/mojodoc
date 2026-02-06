/**
 * Main transform function - converts parsed JSON to renderable structures.
 */

import type {
  MojoDocOutput,
  PackageDecl,
  ModuleDecl,
  FunctionDecl,
  FunctionOverload,
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

import {
  renderMarkdown,
  highlightSignature,
  highlightType,
  extractSummary,
  resolveTypePath,
  type TypeRegistry,
} from './markdown.js';
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
 * Context for type cross-referencing during transformation.
 */
interface TypeLinkContext {
  baseUrl: string;
  packageName: string;
  /** Registry of known types to their documentation URLs */
  typeRegistry: TypeRegistry;
}

/**
 * Transform mojo doc output into a DocSite structure.
 */
export function transform(doc: MojoDocOutput, options: TransformOptions = {}): DocSite {
  const decl = doc.decl;
  const moduleFiles = options.moduleFiles || new Map<string, string>();
  const packageName = options.name || decl.name;
  const baseUrl = options.baseUrl || '/';

  // Build the type registry by scanning all declarations
  const typeRegistry = buildTypeRegistry(decl, packageName, baseUrl);

  // Create type link context for cross-referencing
  const linkCtx: TypeLinkContext = {
    baseUrl,
    packageName,
    typeRegistry,
  };

  // Handle both package and module at root level
  let rootPackage: Package;
  let allModules: Module[];

  if (decl.kind === 'package') {
    rootPackage = transformPackage(decl as PackageDecl, '', moduleFiles, linkCtx);
    allModules = collectAllModules(rootPackage);
  } else {
    // Single module - wrap in synthetic package
    const mod = transformModule(decl as ModuleDecl, decl.name, decl.name, moduleFiles, linkCtx);
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
    baseUrl,
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

// ============================================================================
// Type Registry Builder
// ============================================================================

/**
 * Build a type registry by scanning ALL path-bearing fields in the mojo doc
 * JSON output. This harvests type name → URL mappings from:
 *
 * - Struct/trait/alias declarations (their own paths)
 * - Struct/trait parentTraits (name + path for each implemented trait)
 * - Function args (type + path for each argument)
 * - Function returns (type + path)
 * - Struct fields (type + path)
 * - Type parameters (path, when present)
 * - Trait constraints (path, when present)
 *
 * No hardcoded stdlib paths — mojo doc is the sole source of truth.
 */
function buildTypeRegistry(
  decl: PackageDecl | ModuleDecl,
  packageName: string,
  baseUrl: string
): TypeRegistry {
  const registry: TypeRegistry = new Map();

  if (decl.kind === 'package') {
    scanPackageForTypes(decl as PackageDecl, packageName, baseUrl, registry);
  } else {
    scanModuleForTypes(decl as ModuleDecl, packageName, baseUrl, registry);
  }

  return registry;
}

/**
 * Register a type name → URL mapping.
 * If the path from mojo doc is populated, resolve it.
 * Extracts the simple type name from complex types (e.g., "List[Int]" → "List").
 */
function registerType(
  typeName: string,
  path: string | undefined | null,
  packageName: string,
  baseUrl: string,
  registry: TypeRegistry
): void {
  if (!typeName || !path) return;

  const href = resolveTypePath(path, baseUrl, packageName);
  if (!href) return;

  // Extract the outermost type name (before any [ or generic params)
  const simpleName = typeName.match(/^([A-Z][A-Za-z0-9_]*)/)?.[1];
  if (simpleName && !registry.has(simpleName)) {
    registry.set(simpleName, href);
  }
}

/**
 * Register a local type (struct, trait, alias) when mojo doc doesn't provide
 * a path. Constructs the URL from the module path and type name.
 */
function registerLocalType(
  typeName: string,
  modulePath: string,
  packageName: string,
  baseUrl: string,
  registry: TypeRegistry
): void {
  if (!typeName || registry.has(typeName)) return;

  // Build URL: baseUrl + packageName/modulePath/index.html#anchor
  const anchor = toAnchor(typeName);
  const href = `${baseUrl}${packageName}/${modulePath}/index.html#${anchor}`;
  registry.set(typeName, href);
}

/**
 * Recursively scan a package for type information.
 */
function scanPackageForTypes(
  pkg: PackageDecl,
  packageName: string,
  baseUrl: string,
  registry: TypeRegistry,
  parentModulePath: string = ''
): void {
  for (const mod of pkg.modules) {
    const modulePath = parentModulePath ? `${parentModulePath}/${mod.name}` : mod.name;
    scanModuleForTypes(mod, packageName, baseUrl, registry, modulePath);
  }
  for (const sub of pkg.packages) {
    const subPath = parentModulePath ? `${parentModulePath}/${sub.name}` : sub.name;
    scanPackageForTypes(sub, packageName, baseUrl, registry, subPath);
  }
}

/**
 * Scan all overloads of a function for arg/return type paths.
 */
function scanFunctionForTypes(
  fn: FunctionDecl,
  packageName: string,
  baseUrl: string,
  registry: TypeRegistry
): void {
  for (const overload of fn.overloads) {
    scanOverloadForTypes(overload, packageName, baseUrl, registry);
  }
}

/**
 * Scan a single function overload for type paths in args, returns,
 * and type parameter constraints.
 */
function scanOverloadForTypes(
  ov: FunctionOverload,
  packageName: string,
  baseUrl: string,
  registry: TypeRegistry
): void {
  // Args: each arg has type + path
  for (const arg of ov.args || []) {
    registerType(arg.type, arg.path, packageName, baseUrl, registry);
  }

  // Return: type + path
  if (ov.returns) {
    registerType(ov.returns.type, ov.returns.path, packageName, baseUrl, registry);
  }

  // Type parameters may have path (for their constraint type)
  for (const param of ov.parameters || []) {
    if (param.path) {
      registerType(param.type, param.path, packageName, baseUrl, registry);
    }
    // Trait constraints on type parameters
    for (const trait of param.traits || []) {
      if (trait.path) {
        registerType(trait.type, trait.path, packageName, baseUrl, registry);
      }
    }
  }
}

/**
 * Scan a module for all type information from declarations, fields, args, etc.
 */
function scanModuleForTypes(
  mod: ModuleDecl,
  packageName: string,
  baseUrl: string,
  registry: TypeRegistry,
  modulePath: string = mod.name
): void {
  // Structs: declaration path + parentTraits + fields + methods
  for (const struct of mod.structs || []) {
    if (struct.path) {
      registerType(struct.name, struct.path, packageName, baseUrl, registry);
    } else {
      // mojo doc leaves path empty for local types — construct it ourselves
      registerLocalType(struct.name, modulePath, packageName, baseUrl, registry);
    }

    // Parent traits (e.g., AnyType, Copyable, etc.)
    if (struct.parentTraits) {
      for (const pt of struct.parentTraits) {
        registerType(pt.name, pt.path, packageName, baseUrl, registry);
      }
    }

    // Fields: type + path
    for (const field of struct.fields || []) {
      registerType(field.type, field.path, packageName, baseUrl, registry);
    }

    // Methods
    for (const fn of struct.functions || []) {
      scanFunctionForTypes(fn, packageName, baseUrl, registry);
    }
  }

  // Traits: declaration path + parentTraits + methods
  for (const trait of mod.traits || []) {
    if (trait.path) {
      registerType(trait.name, trait.path, packageName, baseUrl, registry);
    } else {
      registerLocalType(trait.name, modulePath, packageName, baseUrl, registry);
    }

    // Parent traits
    for (const pt of trait.parentTraits || []) {
      registerType(pt.name, pt.path, packageName, baseUrl, registry);
    }

    // Methods
    for (const fn of trait.functions || []) {
      scanFunctionForTypes(fn, packageName, baseUrl, registry);
    }
  }

  // Aliases: declaration path (only type-like names)
  for (const alias of mod.aliases || []) {
    if (alias.name[0] === alias.name[0].toUpperCase()) {
      if (alias.path) {
        registerType(alias.name, alias.path, packageName, baseUrl, registry);
      } else {
        registerLocalType(alias.name, modulePath, packageName, baseUrl, registry);
      }
    }
  }

  // Top-level functions
  for (const fn of mod.functions || []) {
    scanFunctionForTypes(fn, packageName, baseUrl, registry);
  }
}

// ============================================================================
// Transform functions
// ============================================================================

/**
 * Transform a package declaration.
 */
function transformPackage(
  pkg: PackageDecl,
  parentPath: string,
  moduleFiles: Map<string, string>,
  linkCtx: TypeLinkContext
): Package {
  const path = parentPath ? `${parentPath}.${pkg.name}` : pkg.name;

  const modules = pkg.modules.map((mod) =>
    transformModule(mod, path, `${path}.${mod.name}`, moduleFiles, linkCtx)
  );

  const subpackages = pkg.packages.map((sub) => transformPackage(sub, path, moduleFiles, linkCtx));

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
  moduleFiles: Map<string, string>,
  linkCtx: TypeLinkContext
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
    functions: mod.functions.map((fn) => transformFunction(fn, linkCtx)),
    structs: mod.structs.map((s) => transformStruct(s, linkCtx)),
    traits: mod.traits.map((t) => transformTrait(t, linkCtx)),
    aliases: mod.aliases.map((a) => transformAlias(a, linkCtx)),
    parentPackage: parentPath,
    sourceFile,
  };
}

/**
 * Transform a function declaration.
 */
function transformFunction(fn: FunctionDecl, linkCtx: TypeLinkContext): FunctionItem {
  return {
    kind: 'function',
    name: fn.name,
    anchor: toAnchor(fn.name),
    overloads: fn.overloads.map((ov) => transformOverload(ov, linkCtx)),
  };
}

/**
 * Transform a function overload.
 */
function transformOverload(
  overload: import('@mojodoc/parser').FunctionOverload,
  linkCtx: TypeLinkContext
): ProcessedOverload {
  return {
    signature: overload.signature,
    signatureHtml: highlightSignature(overload.signature, linkCtx.typeRegistry),
    summary: overload.summary || '',
    description: overload.description || '',
    descriptionHtml: renderMarkdown(overload.description || ''),
    args: overload.args.map((arg) => transformArg(arg, linkCtx)),
    typeParams: overload.parameters.map(transformTypeParam),
    returns: overload.returns ? transformReturn(overload.returns, linkCtx) : null,
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
function transformArg(
  arg: import('@mojodoc/parser').ArgumentDecl,
  linkCtx: TypeLinkContext
): ProcessedArg {
  return {
    name: arg.name,
    type: arg.type,
    typeHtml: highlightType(
      arg.type,
      arg.path,
      linkCtx.baseUrl,
      linkCtx.packageName,
      linkCtx.typeRegistry
    ),
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
function transformReturn(
  ret: import('@mojodoc/parser').ReturnDecl,
  linkCtx: TypeLinkContext
): ProcessedReturn {
  return {
    type: ret.type,
    typeHtml: highlightType(
      ret.type,
      ret.path,
      linkCtx.baseUrl,
      linkCtx.packageName,
      linkCtx.typeRegistry
    ),
    typePath: ret.path || null,
    description: ret.doc || '',
    descriptionHtml: renderMarkdown(ret.doc || ''),
  };
}

/**
 * Transform a struct declaration.
 */
function transformStruct(struct: StructDecl, linkCtx: TypeLinkContext): StructItem {
  return {
    kind: 'struct',
    name: struct.name,
    anchor: toAnchor(struct.name),
    signature: struct.signature || `struct ${struct.name}`,
    signatureHtml: highlightSignature(
      struct.signature || `struct ${struct.name}`,
      linkCtx.typeRegistry
    ),
    summary: struct.summary || extractSummary(struct.description),
    description: struct.description || '',
    descriptionHtml: renderMarkdown(struct.description || ''),
    typeParams: (struct.parameters || []).map(transformTypeParam),
    fields: (struct.fields || []).map((f) => transformField(f, linkCtx)),
    methods: (struct.functions || []).map((fn) => transformFunction(fn, linkCtx)),
    deprecated: struct.deprecated || null,
  };
}

/**
 * Transform a field.
 */
function transformField(
  field: import('@mojodoc/parser').FieldDecl,
  linkCtx: TypeLinkContext
): ProcessedField {
  return {
    name: field.name,
    type: field.type,
    typeHtml: highlightType(
      field.type,
      field.path,
      linkCtx.baseUrl,
      linkCtx.packageName,
      linkCtx.typeRegistry
    ),
    typePath: field.path || null,
    summary: field.summary || '',
    description: field.description || '',
    descriptionHtml: renderMarkdown(field.description || ''),
  };
}

/**
 * Transform a trait declaration.
 */
function transformTrait(trait: TraitDecl, linkCtx: TypeLinkContext): TraitItem {
  return {
    kind: 'trait',
    name: trait.name,
    anchor: toAnchor(trait.name),
    signature: trait.signature || `trait ${trait.name}`,
    signatureHtml: highlightSignature(
      trait.signature || `trait ${trait.name}`,
      linkCtx.typeRegistry
    ),
    summary: trait.summary || extractSummary(trait.description),
    description: trait.description || '',
    descriptionHtml: renderMarkdown(trait.description || ''),
    typeParams: (trait.parameters || []).map(transformTypeParam),
    methods: (trait.functions || []).map((fn) => transformFunction(fn, linkCtx)),
    deprecated: trait.deprecated || null,
  };
}

/**
 * Transform an alias declaration.
 */
function transformAlias(alias: AliasDecl, linkCtx: TypeLinkContext): AliasItem {
  return {
    kind: 'alias',
    name: alias.name,
    anchor: toAnchor(alias.name),
    signature: alias.signature || `comptime ${alias.name}`,
    signatureHtml: highlightSignature(
      alias.signature || `comptime ${alias.name}`,
      linkCtx.typeRegistry
    ),
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
