/**
 * Internal representation types for rendering.
 */

import type { DocItemKind } from '@mojodoc/parser';

// ============================================================================
// Site-level types
// ============================================================================

export interface DocSite {
  config: SiteConfig;
  rootPackage: Package;
  searchIndex: SearchIndex;
  navTree: NavNode[];
  allModules: Module[];
}

export interface SiteConfig {
  name: string;
  version: string;
  description: string;
  baseUrl: string;
  repository?: string;
  editLink: boolean;
}

// ============================================================================
// Package and Module
// ============================================================================

export interface Package {
  name: string;
  path: string;
  fullPath: string;
  summary: string;
  description: string;
  descriptionHtml: string;
  modules: Module[];
  subpackages: Package[];
  /** Public API exported from __init__.mojo */
  publicApi: PublicApiSection[];
}

/**
 * A section of the public API (e.g., "Core API", "Struct Serialization").
 */
export interface PublicApiSection {
  title: string;
  items: PublicApiItem[];
}

/**
 * A reference to an item in the public API.
 */
export interface PublicApiItem {
  kind: 'function' | 'struct' | 'trait' | 'alias';
  name: string;
  sourceModule: string;
  urlPath: string;
  anchor: string;
  summary: string;
}

export interface Module {
  name: string;
  path: string;
  fullPath: string;
  urlPath: string;
  summary: string;
  description: string;
  descriptionHtml: string;
  functions: FunctionItem[];
  structs: StructItem[];
  traits: TraitItem[];
  aliases: AliasItem[];
  parentPackage: string;
  /** Source file path relative to package root (e.g., "config.mojo") */
  sourceFile: string;
}

// ============================================================================
// Doc Items
// ============================================================================

export interface FunctionItem {
  kind: 'function';
  name: string;
  anchor: string;
  overloads: ProcessedOverload[];
}

export interface ProcessedOverload {
  signature: string;
  signatureHtml: string;
  summary: string;
  description: string;
  descriptionHtml: string;
  args: ProcessedArg[];
  typeParams: ProcessedTypeParam[];
  returns: ProcessedReturn | null;
  raises: ProcessedRaises | null;
  isStatic: boolean;
  isAsync: boolean;
  deprecated: string | null;
}

export interface ProcessedArg {
  name: string;
  type: string;
  typeHtml: string;
  typePath: string | null;
  description: string;
  descriptionHtml: string;
  convention: string;
  default: string | null;
}

export interface ProcessedTypeParam {
  name: string;
  type: string;
  description: string;
  descriptionHtml: string;
  constraints: string[];
}

export interface ProcessedReturn {
  type: string;
  typeHtml: string;
  typePath: string | null;
  description: string;
  descriptionHtml: string;
}

export interface ProcessedRaises {
  description: string;
  descriptionHtml: string;
}

export interface StructItem {
  kind: 'struct';
  name: string;
  anchor: string;
  signature: string;
  signatureHtml: string;
  summary: string;
  description: string;
  descriptionHtml: string;
  typeParams: ProcessedTypeParam[];
  fields: ProcessedField[];
  methods: FunctionItem[];
  deprecated: string | null;
}

export interface ProcessedField {
  name: string;
  type: string;
  typeHtml: string;
  typePath: string | null;
  summary: string;
  description: string;
  descriptionHtml: string;
}

export interface TraitItem {
  kind: 'trait';
  name: string;
  anchor: string;
  signature: string;
  signatureHtml: string;
  summary: string;
  description: string;
  descriptionHtml: string;
  typeParams: ProcessedTypeParam[];
  methods: FunctionItem[];
  deprecated: string | null;
}

export interface AliasItem {
  kind: 'alias';
  name: string;
  anchor: string;
  signature: string;
  signatureHtml: string;
  summary: string;
  description: string;
  descriptionHtml: string;
  value: string;
  typeParams: ProcessedTypeParam[];
  deprecated: string | null;
}

// ============================================================================
// Navigation
// ============================================================================

export interface NavNode {
  type: 'package' | 'module';
  name: string;
  path: string;
  urlPath: string;
  children: NavNode[];
  items?: NavItemRef[];
}

export interface NavItemRef {
  kind: DocItemKind;
  name: string;
  anchor: string;
}

// ============================================================================
// Search
// ============================================================================

export interface SearchIndex {
  items: SearchItem[];
}

export interface SearchItem {
  id: string;
  kind: DocItemKind;
  name: string;
  fullPath: string;
  urlPath: string;
  anchor: string;
  signature: string;
  summary: string;
  inputTypes: string[];
  outputType: string | null;
}
