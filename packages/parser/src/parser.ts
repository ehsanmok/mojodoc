/**
 * Parser for mojo doc JSON output.
 */

import type {
  MojoDocOutput,
  PackageDecl,
  ModuleDecl,
  FunctionDecl,
  StructDecl,
  TraitDecl,
  AliasDecl,
} from './types.js';

export class ParseError extends Error {
  constructor(
    message: string,
    public path?: string
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Parse raw JSON string from mojo doc output.
 */
export function parseJson(jsonString: string): MojoDocOutput {
  let data: unknown;

  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    throw new ParseError(`Invalid JSON: ${(e as Error).message}`);
  }

  return validateMojoDocOutput(data);
}

/**
 * Validate and type-check the parsed JSON.
 */
function validateMojoDocOutput(data: unknown): MojoDocOutput {
  if (!isObject(data)) {
    throw new ParseError('Expected object at root');
  }

  if (typeof data.version !== 'string') {
    throw new ParseError('Missing or invalid "version" field');
  }

  if (!isObject(data.decl)) {
    throw new ParseError('Missing or invalid "decl" field');
  }

  const decl = data.decl;
  if (decl.kind !== 'package' && decl.kind !== 'module') {
    throw new ParseError(`Invalid decl kind: ${decl.kind}`);
  }

  // Validate based on kind
  if (decl.kind === 'package') {
    validatePackageDecl(decl, 'decl');
  } else {
    validateModuleDecl(decl, 'decl');
  }

  return data as unknown as MojoDocOutput;
}

function validatePackageDecl(data: unknown, path: string): asserts data is PackageDecl {
  if (!isObject(data)) {
    throw new ParseError(`Expected object at ${path}`);
  }

  assertString(data.name, `${path}.name`);
  assertString(data.summary, `${path}.summary`, '');
  assertString(data.description, `${path}.description`, '');
  assertArray(data.modules, `${path}.modules`);
  assertArray(data.packages, `${path}.packages`, []);

  // Validate nested modules
  for (let i = 0; i < data.modules.length; i++) {
    validateModuleDecl(data.modules[i], `${path}.modules[${i}]`);
  }

  // Validate nested packages
  for (let i = 0; i < (data.packages as unknown[]).length; i++) {
    validatePackageDecl((data.packages as unknown[])[i], `${path}.packages[${i}]`);
  }
}

function validateModuleDecl(data: unknown, path: string): asserts data is ModuleDecl {
  if (!isObject(data)) {
    throw new ParseError(`Expected object at ${path}`);
  }

  assertString(data.name, `${path}.name`);
  assertString(data.summary, `${path}.summary`, '');
  assertString(data.description, `${path}.description`, '');
  assertArray(data.functions, `${path}.functions`, []);
  assertArray(data.structs, `${path}.structs`, []);
  assertArray(data.traits, `${path}.traits`, []);
  assertArray(data.aliases, `${path}.aliases`, []);
}

// ============================================================================
// Helper functions
// ============================================================================

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(
  value: unknown,
  path: string,
  defaultValue?: string
): asserts value is string {
  if (typeof value === 'undefined' && defaultValue !== undefined) {
    return;
  }
  if (typeof value !== 'string') {
    throw new ParseError(`Expected string at ${path}, got ${typeof value}`);
  }
}

function assertArray(
  value: unknown,
  path: string,
  defaultValue?: unknown[]
): asserts value is unknown[] {
  if (typeof value === 'undefined' && defaultValue !== undefined) {
    return;
  }
  if (!Array.isArray(value)) {
    throw new ParseError(`Expected array at ${path}, got ${typeof value}`);
  }
}

// ============================================================================
// Utility functions for working with parsed data
// ============================================================================

/**
 * Flatten a package tree into a list of all modules.
 */
export function flattenModules(pkg: PackageDecl): ModuleDecl[] {
  const modules: ModuleDecl[] = [...pkg.modules];

  for (const subPkg of pkg.packages) {
    modules.push(...flattenModules(subPkg));
  }

  return modules;
}

/**
 * Get all items (functions, structs, traits, aliases) from a module.
 */
export function getModuleItems(
  mod: ModuleDecl
): Array<FunctionDecl | StructDecl | TraitDecl | AliasDecl> {
  return [...mod.functions, ...mod.structs, ...mod.traits, ...mod.aliases];
}

/**
 * Count total documented items in a package.
 */
export function countItems(pkg: PackageDecl): number {
  let count = 0;

  for (const mod of pkg.modules) {
    count += mod.functions.length;
    count += mod.structs.length;
    count += mod.traits.length;
    count += mod.aliases.length;

    // Count struct methods and fields
    for (const struct of mod.structs) {
      count += struct.functions.length;
      count += struct.fields.length;
    }

    // Count trait methods
    for (const trait of mod.traits) {
      count += trait.functions.length;
    }
  }

  for (const subPkg of pkg.packages) {
    count += countItems(subPkg);
  }

  return count;
}
