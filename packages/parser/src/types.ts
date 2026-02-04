/**
 * TypeScript types matching the `mojo doc` JSON output schema.
 * Based on exploration of actual mojo doc output.
 */

// ============================================================================
// Top-level output
// ============================================================================

export interface MojoDocOutput {
  version: string;
  decl: PackageDecl | ModuleDecl;
}

// ============================================================================
// Package and Module declarations
// ============================================================================

export interface PackageDecl {
  kind: 'package';
  name: string;
  summary: string;
  description: string;
  modules: ModuleDecl[];
  packages: PackageDecl[];
}

export interface ModuleDecl {
  kind: 'module';
  name: string;
  summary: string;
  description: string;
  functions: FunctionDecl[];
  structs: StructDecl[];
  traits: TraitDecl[];
  aliases: AliasDecl[];
}

// ============================================================================
// Function declarations
// ============================================================================

export interface FunctionDecl {
  kind: 'function';
  name: string;
  overloads: FunctionOverload[];
}

export interface FunctionOverload {
  kind: 'function';
  name: string;
  signature: string;
  summary: string;
  description: string;
  args: ArgumentDecl[];
  parameters: TypeParameterDecl[];
  returns: ReturnDecl | null;
  raises: boolean;
  raisesDoc: string;
  async: boolean;
  isStatic: boolean;
  isDef: boolean;
  isImplicitConversion: boolean;
  hasDefaultImplementation: boolean;
  deprecated: string;
  constraints: string;
}

export interface ArgumentDecl {
  kind: 'argument';
  name: string;
  type: string;
  description: string;
  convention: 'read' | 'mut' | 'owned' | 'ref' | 'out' | 'inout';
  passingKind: 'pos_or_kw' | 'pos_only' | 'kw_only' | 'variadic' | 'variadic_kw';
  path: string;
  default?: string;
}

export interface TypeParameterDecl {
  kind: 'parameter';
  name: string;
  type: string;
  description: string;
  passingKind: string;
  traits: TraitConstraint[];
}

export interface TraitConstraint {
  type: string;
}

export interface ReturnDecl {
  type: string;
  doc: string;
  path: string;
}

// ============================================================================
// Struct declarations
// ============================================================================

export interface StructDecl {
  kind: 'struct';
  name: string;
  signature: string;
  summary: string;
  description: string;
  parameters: TypeParameterDecl[];
  fields: FieldDecl[];
  functions: FunctionDecl[];
  deprecated: string;
  path: string;
}

export interface FieldDecl {
  kind: 'field';
  name: string;
  type: string;
  summary: string;
  description: string;
  path: string;
}

// ============================================================================
// Trait declarations
// ============================================================================

export interface TraitDecl {
  kind: 'trait';
  name: string;
  signature: string;
  summary: string;
  description: string;
  parameters: TypeParameterDecl[];
  functions: FunctionDecl[];
  parentTraits: string[];
  deprecated: string;
  path: string;
}

// ============================================================================
// Alias declarations
// ============================================================================

export interface AliasDecl {
  kind: 'alias';
  name: string;
  signature: string;
  summary: string;
  description: string;
  value: string;
  parameters: TypeParameterDecl[];
  path: string;
  deprecated: string;
}

// ============================================================================
// Type guards
// ============================================================================

export function isPackageDecl(decl: PackageDecl | ModuleDecl): decl is PackageDecl {
  return decl.kind === 'package';
}

export function isModuleDecl(decl: PackageDecl | ModuleDecl): decl is ModuleDecl {
  return decl.kind === 'module';
}

// ============================================================================
// Union types for convenience
// ============================================================================

export type DocItem = FunctionDecl | StructDecl | TraitDecl | AliasDecl;
export type DocItemKind = 'function' | 'struct' | 'trait' | 'alias' | 'field' | 'method';
