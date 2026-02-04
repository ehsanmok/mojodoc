/**
 * Build search index from documentation.
 */

import type { Module, SearchIndex, SearchItem } from './types.js';

/**
 * Build search index from all modules.
 */
export function buildSearchIndex(modules: Module[]): SearchIndex {
  const items: SearchItem[] = [];

  for (const mod of modules) {
    // Index functions
    for (const fn of mod.functions) {
      for (const overload of fn.overloads) {
        items.push({
          id: `${mod.fullPath}.${fn.name}`,
          kind: 'function',
          name: fn.name,
          fullPath: `${mod.fullPath}.${fn.name}`,
          urlPath: mod.urlPath,
          anchor: fn.anchor,
          signature: overload.signature,
          summary: overload.summary || fn.overloads[0]?.summary || '',
          inputTypes: overload.args.map((a) => normalizeType(a.type)),
          outputType: overload.returns ? normalizeType(overload.returns.type) : null,
        });
      }
    }

    // Index structs
    for (const struct of mod.structs) {
      items.push({
        id: `${mod.fullPath}.${struct.name}`,
        kind: 'struct',
        name: struct.name,
        fullPath: `${mod.fullPath}.${struct.name}`,
        urlPath: mod.urlPath,
        anchor: struct.anchor,
        signature: struct.signature,
        summary: struct.summary,
        inputTypes: [],
        outputType: null,
      });

      // Index struct methods
      for (const method of struct.methods) {
        for (const overload of method.overloads) {
          items.push({
            id: `${mod.fullPath}.${struct.name}.${method.name}`,
            kind: 'method',
            name: `${struct.name}.${method.name}`,
            fullPath: `${mod.fullPath}.${struct.name}.${method.name}`,
            urlPath: mod.urlPath,
            anchor: `${struct.anchor}-${method.anchor}`,
            signature: overload.signature,
            summary: overload.summary,
            inputTypes: overload.args.map((a) => normalizeType(a.type)),
            outputType: overload.returns ? normalizeType(overload.returns.type) : null,
          });
        }
      }

      // Index struct fields
      for (const field of struct.fields) {
        items.push({
          id: `${mod.fullPath}.${struct.name}.${field.name}`,
          kind: 'field',
          name: `${struct.name}.${field.name}`,
          fullPath: `${mod.fullPath}.${struct.name}.${field.name}`,
          urlPath: mod.urlPath,
          anchor: `${struct.anchor}-${field.name}`,
          signature: `${field.name}: ${field.type}`,
          summary: field.summary,
          inputTypes: [],
          outputType: normalizeType(field.type),
        });
      }
    }

    // Index traits
    for (const trait of mod.traits) {
      items.push({
        id: `${mod.fullPath}.${trait.name}`,
        kind: 'trait',
        name: trait.name,
        fullPath: `${mod.fullPath}.${trait.name}`,
        urlPath: mod.urlPath,
        anchor: trait.anchor,
        signature: trait.signature,
        summary: trait.summary,
        inputTypes: [],
        outputType: null,
      });
    }

    // Index aliases
    for (const alias of mod.aliases) {
      items.push({
        id: `${mod.fullPath}.${alias.name}`,
        kind: 'alias',
        name: alias.name,
        fullPath: `${mod.fullPath}.${alias.name}`,
        urlPath: mod.urlPath,
        anchor: alias.anchor,
        signature: alias.signature,
        summary: alias.summary,
        inputTypes: [],
        outputType: null,
      });
    }
  }

  return { items };
}

/**
 * Normalize a type string for search matching.
 */
function normalizeType(type: string): string {
  return type
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/self\./gi, '');
}

/**
 * Search the index for a query.
 */
export function searchIndex(index: SearchIndex, query: string): SearchItem[] {
  const normalizedQuery = query.toLowerCase().trim();

  if (!normalizedQuery) {
    return [];
  }

  // Check for type signature search (contains ->)
  if (normalizedQuery.includes('->')) {
    return searchByTypeSignature(index, normalizedQuery);
  }

  // Regular name/content search
  return searchByName(index, normalizedQuery);
}

/**
 * Search by name/content.
 */
function searchByName(index: SearchIndex, query: string): SearchItem[] {
  const results: Array<{ item: SearchItem; score: number }> = [];

  for (const item of index.items) {
    let score = 0;

    // Exact name match
    if (item.name.toLowerCase() === query) {
      score += 100;
    }
    // Name starts with query
    else if (item.name.toLowerCase().startsWith(query)) {
      score += 50;
    }
    // Name contains query
    else if (item.name.toLowerCase().includes(query)) {
      score += 25;
    }
    // Summary contains query
    else if (item.summary.toLowerCase().includes(query)) {
      score += 10;
    }
    // Signature contains query
    else if (item.signature.toLowerCase().includes(query)) {
      score += 5;
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 50).map((r) => r.item);
}

/**
 * Search by type signature (e.g., "String -> Int").
 */
function searchByTypeSignature(index: SearchIndex, query: string): SearchItem[] {
  const [inputPart, outputPart] = query.split('->').map((s) => s.trim());
  const inputTypes = inputPart ? inputPart.split(',').map((t) => t.trim().toLowerCase()) : [];
  const outputType = outputPart ? outputPart.toLowerCase() : null;

  const results: Array<{ item: SearchItem; score: number }> = [];

  for (const item of index.items) {
    if (item.kind !== 'function' && item.kind !== 'method') {
      continue;
    }

    let score = 0;

    // Check output type
    if (outputType && item.outputType) {
      if (item.outputType.includes(outputType)) {
        score += 50;
      }
    }

    // Check input types
    if (inputTypes.length > 0) {
      const itemInputs = item.inputTypes.join(',');
      for (const input of inputTypes) {
        if (itemInputs.includes(input)) {
          score += 25;
        }
      }
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results.slice(0, 50).map((r) => r.item);
}
