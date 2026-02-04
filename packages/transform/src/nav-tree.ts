/**
 * Build navigation tree from package structure.
 */

import type { PackageDecl, ModuleDecl } from '@mojodoc/parser';
import type { NavNode, NavItemRef } from './types.js';

/**
 * Build the navigation tree from a package.
 */
export function buildNavTree(pkg: PackageDecl, basePath: string = ''): NavNode[] {
  const nodes: NavNode[] = [];

  // Create package node
  const pkgPath = basePath ? `${basePath}.${pkg.name}` : pkg.name;
  const pkgUrlPath = pkgPath.replace(/\./g, '/');

  const pkgNode: NavNode = {
    type: 'package',
    name: pkg.name,
    path: pkgPath,
    urlPath: pkgUrlPath,
    children: [],
  };

  // Add modules as children
  for (const mod of pkg.modules) {
    if (mod.name === '__init__') {
      // __init__ module items go directly on the package
      pkgNode.items = getModuleNavItems(mod);
    } else {
      const modPath = `${pkgPath}.${mod.name}`;
      const modUrlPath = `${pkgUrlPath}/${mod.name}`;

      pkgNode.children.push({
        type: 'module',
        name: mod.name,
        path: modPath,
        urlPath: modUrlPath,
        children: [],
        items: getModuleNavItems(mod),
      });
    }
  }

  // Add subpackages recursively
  for (const subPkg of pkg.packages) {
    const subNodes = buildNavTree(subPkg, pkgPath);
    pkgNode.children.push(...subNodes);
  }

  nodes.push(pkgNode);
  return nodes;
}

/**
 * Get navigation item references from a module.
 */
function getModuleNavItems(mod: ModuleDecl): NavItemRef[] {
  const items: NavItemRef[] = [];

  // Functions
  for (const fn of mod.functions) {
    items.push({
      kind: 'function',
      name: fn.name,
      anchor: toAnchor(fn.name),
    });
  }

  // Structs
  for (const struct of mod.structs) {
    items.push({
      kind: 'struct',
      name: struct.name,
      anchor: toAnchor(struct.name),
    });
  }

  // Traits
  for (const trait of mod.traits) {
    items.push({
      kind: 'trait',
      name: trait.name,
      anchor: toAnchor(trait.name),
    });
  }

  // Aliases
  for (const alias of mod.aliases) {
    items.push({
      kind: 'alias',
      name: alias.name,
      anchor: toAnchor(alias.name),
    });
  }

  return items;
}

/**
 * Convert a name to a URL-safe anchor.
 */
export function toAnchor(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Flatten the nav tree into a list for search/iteration.
 */
export function flattenNavTree(nodes: NavNode[]): NavNode[] {
  const flat: NavNode[] = [];

  function visit(node: NavNode) {
    flat.push(node);
    for (const child of node.children) {
      visit(child);
    }
  }

  for (const node of nodes) {
    visit(node);
  }

  return flat;
}
