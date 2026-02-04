/**
 * Extract public API from __init__.mojo files.
 *
 * Parses `from .module import item` statements to identify
 * which items are part of the public API.
 */

import type { Module, PublicApiSection, PublicApiItem } from './types.js';

/**
 * Parsed import from __init__.mojo.
 */
interface ParsedImport {
  module: string;
  items: string[];
  comment?: string;
}

/**
 * Parse __init__.mojo content and extract exports.
 */
export function parseInitFile(content: string): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const lines = content.split('\n');

  let currentComment = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Capture section comments (like "# Core API")
    if (trimmed.startsWith('#') && !trimmed.startsWith('#!')) {
      const commentText = trimmed.slice(1).trim();
      // Only track meaningful section comments
      if (commentText && !commentText.includes(':') && commentText.length < 50) {
        currentComment = commentText;
      }
      continue;
    }

    // Parse: from .module import item1, item2, ...
    const singleLineMatch = trimmed.match(/^from\s+\.(\w+)\s+import\s+(.+)$/);
    if (singleLineMatch) {
      const [, module, itemsStr] = singleLineMatch;
      const items = itemsStr
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i && !i.startsWith('('));

      if (items.length > 0) {
        imports.push({
          module,
          items,
          comment: currentComment || undefined,
        });
      }
      continue;
    }

    // Parse multiline: from .module import (
    const multiLineStart = trimmed.match(/^from\s+\.(\w+)\s+import\s+\(\s*$/);
    if (multiLineStart) {
      const module = multiLineStart[1];
      const items: string[] = [];

      // Read continuation lines until )
      let idx = lines.indexOf(line) + 1;
      while (idx < lines.length) {
        const contLine = lines[idx].trim();
        if (contLine === ')') break;

        // Extract item names, handling trailing commas
        const itemMatches = contLine.match(/^(\w+)/);
        if (itemMatches) {
          items.push(itemMatches[1]);
        }
        idx++;
      }

      if (items.length > 0) {
        imports.push({
          module,
          items,
          comment: currentComment || undefined,
        });
      }
    }

    // Reset comment after non-comment, non-import line
    if (!trimmed.startsWith('from') && !trimmed.startsWith('#') && trimmed !== '') {
      currentComment = '';
    }
  }

  return imports;
}

/**
 * Build public API sections from parsed imports and module data.
 */
export function buildPublicApi(
  imports: ParsedImport[],
  modules: Module[],
  _packagePath: string
): PublicApiSection[] {
  const sections: PublicApiSection[] = [];
  const moduleMap = new Map(modules.map((m) => [m.name, m]));

  // Group imports by comment (section)
  const sectionMap = new Map<string, PublicApiItem[]>();

  for (const imp of imports) {
    const sourceModule = moduleMap.get(imp.module);
    if (!sourceModule) continue;

    const sectionTitle = imp.comment || 'Public API';

    if (!sectionMap.has(sectionTitle)) {
      sectionMap.set(sectionTitle, []);
    }

    const sectionItems = sectionMap.get(sectionTitle)!;

    for (const itemName of imp.items) {
      // Find the item in the source module
      const fn = sourceModule.functions.find((f) => f.name === itemName);
      const struct = sourceModule.structs.find((s) => s.name === itemName);
      const trait = sourceModule.traits.find((t) => t.name === itemName);
      const alias = sourceModule.aliases.find((a) => a.name === itemName);

      let item: PublicApiItem | null = null;

      if (fn) {
        item = {
          kind: 'function',
          name: fn.name,
          sourceModule: imp.module,
          urlPath: sourceModule.urlPath,
          anchor: fn.anchor,
          summary: fn.overloads[0]?.summary || '',
        };
      } else if (struct) {
        item = {
          kind: 'struct',
          name: struct.name,
          sourceModule: imp.module,
          urlPath: sourceModule.urlPath,
          anchor: struct.anchor,
          summary: struct.summary || '',
        };
      } else if (trait) {
        item = {
          kind: 'trait',
          name: trait.name,
          sourceModule: imp.module,
          urlPath: sourceModule.urlPath,
          anchor: trait.anchor,
          summary: trait.summary || '',
        };
      } else if (alias) {
        item = {
          kind: 'alias',
          name: alias.name,
          sourceModule: imp.module,
          urlPath: sourceModule.urlPath,
          anchor: alias.anchor,
          summary: alias.summary || '',
        };
      }

      if (item) {
        sectionItems.push(item);
      }
    }
  }

  // Convert to array, preserving order
  for (const [title, items] of sectionMap) {
    if (items.length > 0) {
      sections.push({ title, items });
    }
  }

  return sections;
}

/**
 * Extract the docstring from __init__.mojo.
 *
 * Supports two formats:
 * 1. Triple-quote docstring (standard Mojo format like Modular stdlib):
 *    """Description here..."""
 *
 * 2. Comment block (legacy format):
 *    # Description here...
 */
export function extractDocstring(content: string): string {
  // First, try to find a triple-quote docstring (standard Mojo format)
  // Skip license headers (look for docstring after license block)
  const tripleQuoteDocstring = extractTripleQuoteDocstring(content);
  if (tripleQuoteDocstring) {
    return tripleQuoteDocstring;
  }

  // Fall back to comment-based extraction
  return extractCommentDocstring(content);
}

/**
 * Extract triple-quote docstring ("""...""").
 * This is the standard Mojo format used by Modular stdlib.
 */
function extractTripleQuoteDocstring(content: string): string | null {
  // Find the first """ that isn't part of a license header
  // License headers typically end with "# ===" lines

  const lines = content.split('\n');
  let inLicenseHeader = false;
  let foundEndOfLicense = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Track license header (starts with # ===)
    if (line.startsWith('# ===')) {
      inLicenseHeader = !foundEndOfLicense;
      if (!inLicenseHeader) foundEndOfLicense = true;
      continue;
    }

    // Skip license comment lines
    if (inLicenseHeader && line.startsWith('#')) {
      continue;
    }

    // Found end of license
    if (inLicenseHeader && !line.startsWith('#')) {
      inLicenseHeader = false;
      foundEndOfLicense = true;
    }

    // Look for opening """
    if (line.startsWith('"""')) {
      // Could be single-line: """description"""
      if (line.endsWith('"""') && line.length > 6) {
        return line.slice(3, -3).trim();
      }

      // Multi-line docstring
      const docstringLines: string[] = [];

      // Handle content on same line as opening """
      const firstLine = line.slice(3).trim();
      if (firstLine) {
        docstringLines.push(firstLine);
      }

      // Read until closing """
      for (let j = i + 1; j < lines.length; j++) {
        const docLine = lines[j];
        const trimmedDocLine = docLine.trim();

        if (trimmedDocLine === '"""' || trimmedDocLine.endsWith('"""')) {
          // Handle content on same line as closing """
          if (trimmedDocLine !== '"""') {
            docstringLines.push(trimmedDocLine.slice(0, -3).trim());
          }
          break;
        }

        // Preserve the line (remove common leading whitespace later)
        docstringLines.push(docLine);
      }

      // Process the docstring content
      return processDocstringContent(docstringLines);
    }

    // Stop if we hit import/from statements without finding a docstring
    if (line.startsWith('from ') || line.startsWith('import ')) {
      break;
    }
  }

  return null;
}

/**
 * Process docstring content: dedent and clean up.
 */
function processDocstringContent(lines: string[]): string {
  if (lines.length === 0) return '';

  // Find minimum indentation (excluding empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    minIndent = Math.min(minIndent, indent);
  }

  if (minIndent === Infinity) minIndent = 0;

  // Remove common indentation
  const dedented = lines.map((line) => (line.trim() === '' ? '' : line.slice(minIndent)));

  // Join and clean up
  return dedented.join('\n').trim();
}

/**
 * Extract module-level docstring from a Mojo source file.
 * This is the same as extractDocstring but exported for use with all module files.
 */
export function extractModuleDocstring(content: string): string {
  return extractDocstring(content);
}

/**
 * Extract docstring from comment block (# format).
 * Legacy fallback for packages not using triple-quote format.
 */
function extractCommentDocstring(content: string): string {
  const lines = content.split('\n');
  const descLines: string[] = [];
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Look for initial comment block
    if (trimmed.startsWith('#') && !trimmed.startsWith('#!')) {
      // Remove # and leading space
      let text = trimmed.slice(1);
      if (text.startsWith(' ')) text = text.slice(1);

      // Skip empty lines at the start
      if (!started && text === '') continue;
      started = true;

      // Stop at "Usage:" or similar - the rest is examples
      if (/^Usage:|^Example:|^See also:/i.test(text)) break;

      // Stop when we hit code-like lines
      if (/^\s*(var |from |with |import )/.test(text)) break;

      descLines.push(text);

      // Limit to first 3 meaningful lines
      if (descLines.filter((l) => l.trim()).length >= 3) break;
    } else if (started) {
      // End of comment block
      break;
    }
  }

  return descLines.join('\n').trim();
}
