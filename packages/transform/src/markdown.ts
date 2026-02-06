/**
 * Markdown processing for docstrings.
 */

import { Marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';

// Register Mojo as an alias for Python (closest syntax highlighting)
hljs.registerAliases(['mojo'], { languageName: 'python' });

// Create marked instance with syntax highlighting
const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  })
);

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: false,
});

// ============================================================================
// Type Registry - maps type names to their documentation URLs
// ============================================================================

/**
 * A registry of known type names to their documentation URLs.
 * Built during transformation by scanning all path-bearing fields in the
 * mojo doc JSON output. For types that mojo doc doesn't provide paths for
 * (because they don't appear as arg/return/field types in the project),
 * inferStdlibUrl() provides a small set of pattern-based rules for stable
 * type families.
 */
export type TypeRegistry = Map<string, string>;

const STDLIB_BASE = 'https://docs.modular.com/mojo/stdlib';

/**
 * Infer a stdlib documentation URL for a type name based on stable URL patterns.
 *
 * This covers common Mojo types that may not appear in the mojo doc JSON when
 * a project doesn't use them as explicit arg/return types. Instead of a large
 * hardcoded map, these are pattern-based rules for type families whose URLs
 * are structurally predictable and very stable.
 *
 * Returns null if the type doesn't match any known pattern.
 */
export function inferStdlibUrl(typeName: string): string | null {
  // SIMD numeric type aliases — all live under /builtin/simd/
  // Covers: Scalar, SIMD, Int8-64, UInt8-64, Float16-64, DType
  if (
    /^(Scalar|SIMD|Int8|Int16|Int32|Int64|UInt8|UInt16|UInt32|UInt64|Float16|Float32|Float64)$/.test(
      typeName
    )
  ) {
    return `${STDLIB_BASE}/builtin/simd/`;
  }
  if (typeName === 'DType') return `${STDLIB_BASE}/builtin/dtype/DType`;

  // Core builtin types with predictable /builtin/{lower}/{Name} pattern
  const builtinSimple: Record<string, string> = {
    Int: 'builtin/int/Int',
    UInt: 'builtin/int/UInt',
    Bool: 'builtin/bool/Bool',
    String: 'collections/string/string/String',
    StringLiteral: 'builtin/string_literal/StringLiteral',
    StringSlice: 'utils/string_slice/StringSlice',
    Error: 'builtin/error/Error',
    NoneType: 'builtin/none/NoneType',
    Tuple: 'builtin/tuple/',
    List: 'collections/list/List',
    Dict: 'collections/dict/Dict',
    Optional: 'collections/optional/Optional',
    Span: 'memory/span/Span',
    UnsafePointer: 'memory/unsafe_pointer/UnsafePointer',
    Variant: 'utils/variant/Variant',
  };
  if (typeName in builtinSimple) return `${STDLIB_BASE}/${builtinSimple[typeName]}`;

  // Common traits with predictable paths
  const traits: Record<string, string> = {
    Sized: 'builtin/len/Sized',
    Stringable: 'builtin/str/Stringable',
    Representable: 'builtin/repr/Representable',
    Writable: 'utils/write/Writable',
    Writer: 'utils/write/Writer',
    Formattable: 'utils/format/Formattable',
    Copyable: 'builtin/value/Copyable',
    Movable: 'builtin/value/Movable',
    ExplicitlyCopyable: 'builtin/value/ExplicitlyCopyable',
    CollectionElement: 'builtin/value/CollectionElement',
    EqualityComparable: 'builtin/equality_comparable/EqualityComparable',
    Hashable: 'builtin/hash/Hashable',
    Intable: 'builtin/int/Intable',
    Boolable: 'builtin/bool/Boolable',
    AnyType: 'builtin/anytype/AnyType',
    Defaultable: 'builtin/value/Defaultable',
  };
  if (typeName in traits) return `${STDLIB_BASE}/${traits[typeName]}`;

  return null;
}

/**
 * Convert markdown to HTML.
 */
export function renderMarkdown(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return '';
  }

  // Preprocess the markdown for Mojo-specific patterns
  const processed = preprocessDocstring(markdown);

  const result = marked.parse(processed);
  if (typeof result === 'string') {
    return result;
  }
  // Handle Promise case (shouldn't happen with sync highlight)
  return '';
}

/**
 * Preprocess docstring markdown for Mojo-specific patterns.
 *
 * Handles:
 * 1. Example: sections -> proper code blocks
 * 2. Mojo generic syntax [param=value] -> escaped to prevent markdown links
 * 3. Note: sections -> callout blocks
 */
function preprocessDocstring(markdown: string): string {
  let result = markdown;

  // Handle Example: sections FIRST - convert to proper code blocks
  // Match "Example:" followed by code lines until we hit another section or double newline
  result = result.replace(
    /^(Example(?:s)?:)\s*\n((?:(?!^(?:Args?|Returns?|Raises?|Note|Warning|See Also|Parameters?):)[^\n]*\n?)*)/gim,
    (_match, header: string, code: string) => {
      const trimmedCode = code.trim();
      if (!trimmedCode) return _match;

      // Already a code block?
      if (trimmedCode.startsWith('```')) {
        return `**${header}**\n\n${trimmedCode}`;
      }

      // Wrap in code block
      return `**${header}**\n\n\`\`\`mojo\n${trimmedCode}\n\`\`\``;
    }
  );

  // Handle inline Example: on same line
  result = result.replace(
    /^(Example(?:s)?:)\s+(\S[^\n]*(?:\n(?!(?:Args?|Returns?|Raises?|Note|Warning)[:\s])(?!\n)[^\n]+)*)$/gim,
    (_match, header: string, code: string) => {
      const trimmedCode = code.trim();
      if (!trimmedCode) return _match;

      // Already processed?
      if (trimmedCode.startsWith('**') || trimmedCode.startsWith('```')) return _match;

      // Check if it looks like code
      if (trimmedCode.includes('=') || trimmedCode.includes('(')) {
        return `**${header}**\n\n\`\`\`mojo\n${trimmedCode}\n\`\`\``;
      }
      return _match;
    }
  );

  // NOW escape Mojo generic syntax that's NOT inside code blocks
  // Pattern: identifier[params](args) where params contains = or :
  // This looks like markdown links but is Mojo generic syntax
  // Only apply outside of code blocks (not between ```)
  const lines = result.split('\n');
  let inCodeBlock = false;
  const processedLines = lines.map((line) => {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return line;
    }
    if (inCodeBlock) return line;

    // Escape Mojo generics outside code blocks
    let processed = line.replace(/(\w+)\[([^\]]*[=:][^\]]*)\]\(([^)]+)\)/g, '`$1[$2]($3)`');
    processed = processed.replace(/(\w+)\[([^\]]*[=:"][^\]]*)\](?!\()/g, '`$1[$2]`');
    return processed;
  });
  result = processedLines.join('\n');

  // Handle Note: sections - make them blockquotes
  result = result.replace(/^(Note:)\s*/gim, '\n> **Note:** ');

  // Handle Warning: sections
  result = result.replace(/^(Warning:)\s*/gim, '\n> ⚠️ **Warning:** ');

  return result;
}

/**
 * Extract the first paragraph as a summary.
 */
export function extractSummary(markdown: string): string {
  if (!markdown) return '';

  // Split by double newline (paragraph break)
  const paragraphs = markdown.split(/\n\n+/);
  const firstPara = paragraphs[0] || '';

  // Remove any leading/trailing whitespace and limit length
  const summary = firstPara.trim();

  // Truncate if too long
  if (summary.length > 200) {
    return summary.substring(0, 197) + '...';
  }

  return summary;
}

// ============================================================================
// Signature highlighting with type cross-references
// ============================================================================

/**
 * Highlight a Mojo signature, optionally creating links for types.
 *
 * @param signature - The raw signature string
 * @param typeRegistry - Optional type registry for creating type links
 */
export function highlightSignature(signature: string, typeRegistry?: TypeRegistry): string {
  // Tokenize and highlight the signature
  const tokens = tokenizeSignature(signature);
  return tokens
    .map((token) => {
      switch (token.type) {
        case 'keyword':
          return `<span class="sig-keyword">${escapeHtml(token.value)}</span>`;
        case 'name':
          return `<span class="sig-name">${escapeHtml(token.value)}</span>`;
        case 'type': {
          const typeSpan = `<span class="sig-type">${escapeHtml(token.value)}</span>`;
          // Try to link: 1) registry (from mojo doc JSON), 2) stdlib URL inference
          if (typeRegistry) {
            const href = typeRegistry.get(token.value) ?? inferStdlibUrl(token.value);
            if (href) {
              return `<a href="${escapeHtml(href)}" class="type-link">${typeSpan}</a>`;
            }
          }
          return typeSpan;
        }
        case 'param':
          return `<span class="sig-param">${escapeHtml(token.value)}</span>`;
        case 'punctuation':
          return `<span class="sig-punct">${escapeHtml(token.value)}</span>`;
        default:
          return escapeHtml(token.value);
      }
    })
    .join('');
}

interface SignatureToken {
  type: 'keyword' | 'name' | 'type' | 'param' | 'punctuation' | 'text';
  value: string;
}

/**
 * Tokenize a Mojo signature for syntax highlighting.
 */
function tokenizeSignature(signature: string): SignatureToken[] {
  const tokens: SignatureToken[] = [];
  const keywords = new Set([
    'fn',
    'def',
    'struct',
    'trait',
    'alias',
    'comptime',
    'var',
    'let',
    'mut',
    'owned',
    'ref',
    'out',
    'inout',
    'raises',
    'async',
    'staticmethod',
  ]);
  const builtinTypes = new Set([
    'Int',
    'Int8',
    'Int16',
    'Int32',
    'Int64',
    'UInt',
    'UInt8',
    'UInt16',
    'UInt32',
    'UInt64',
    'Float16',
    'Float32',
    'Float64',
    'Bool',
    'String',
    'List',
    'Dict',
    'Optional',
    'Tuple',
    'Self',
    'None',
  ]);

  // Simple tokenizer using regex
  const pattern = /([a-zA-Z_][a-zA-Z0-9_]*)|([()[\]{}<>:,=\->])|(\s+)/g;
  let match;
  let lastIndex = 0;

  while ((match = pattern.exec(signature)) !== null) {
    // Add any text between matches
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: signature.slice(lastIndex, match.index) });
    }

    const [, identifier, punct, space] = match;

    if (identifier) {
      if (keywords.has(identifier)) {
        tokens.push({ type: 'keyword', value: identifier });
      } else if (builtinTypes.has(identifier)) {
        tokens.push({ type: 'type', value: identifier });
      } else if (identifier[0] === identifier[0].toUpperCase() && identifier[0] !== '_') {
        // Capitalized identifiers are likely types
        tokens.push({ type: 'type', value: identifier });
      } else {
        tokens.push({ type: 'param', value: identifier });
      }
    } else if (punct) {
      tokens.push({ type: 'punctuation', value: punct });
    } else if (space) {
      tokens.push({ type: 'text', value: space });
    }

    lastIndex = pattern.lastIndex;
  }

  // Add any remaining text
  if (lastIndex < signature.length) {
    tokens.push({ type: 'text', value: signature.slice(lastIndex) });
  }

  return tokens;
}

// ============================================================================
// Type highlighting with per-component cross-references
// ============================================================================

/**
 * Highlight a type reference with individual links for each type component.
 *
 * Complex types like `List[Value]` will have `List` and `Value` linked separately.
 * If a path is provided (from mojo doc JSON), it's used for the outermost type.
 * Inner types are resolved via the type registry.
 *
 * @param type - The type name (e.g., "String", "Value", "List[Value]")
 * @param path - The mojo doc path for the outermost type
 * @param baseUrl - The base URL for local docs
 * @param packageName - The root package name
 * @param typeRegistry - Optional registry for resolving inner types
 */
export function highlightType(
  type: string,
  path?: string | null,
  baseUrl?: string,
  packageName?: string,
  typeRegistry?: TypeRegistry
): string {
  // Build a local registry that merges the explicit path with the global registry
  const mergedRegistry = new Map<string, string>(typeRegistry || []);

  // If we have an explicit path from mojo doc, register the outermost type
  if (path) {
    const href = resolveTypePath(path, baseUrl || '/', packageName || '');
    if (href) {
      // Extract the outermost type name (before any [ or generic params)
      const outerType = type.match(/^([A-Z][A-Za-z0-9_]*)/)?.[1];
      if (outerType) {
        mergedRegistry.set(outerType, href);
      }
    }
  }

  // Use the signature highlighter with the merged registry to get per-component links
  return highlightSignature(type, mergedRegistry);
}

/**
 * Resolve a mojo doc type path to a URL.
 *
 * Local types (e.g., /mojson/value/Value) -> local docs link
 * Stdlib types (e.g., /std/collections/string/string/String) -> docs.modular.com link
 * Local types with anchor (e.g., /mojson/value/#Value) -> local docs link
 */
export function resolveTypePath(path: string, baseUrl: string, packageName: string): string | null {
  if (!path) return null;

  if (path.startsWith('/std/')) {
    // Stdlib type -> link to docs.modular.com
    // Path format: /std/collections/string/string/String
    // URL format: https://docs.modular.com/mojo/stdlib/collections/string/string/String
    const stdPath = path.replace(/^\/std\//, '');
    return `https://docs.modular.com/mojo/stdlib/${stdPath}`;
  }

  if (path.startsWith(`/${packageName}/`)) {
    // Local type -> link within our docs
    const localPath = path.replace(`/${packageName}/`, '');

    // Handle anchor format: /package/module/#TypeName
    const anchorMatch = localPath.match(/^(.+)\/#(.+)$/);
    if (anchorMatch) {
      const modulePath = anchorMatch[1];
      const anchor = anchorMatch[2];
      return `${baseUrl}${packageName}/${modulePath}/index.html#${anchor}`;
    }

    // Handle path format: /package/module/Type
    const parts = localPath.split('/');
    if (parts.length >= 2) {
      const typeName = parts[parts.length - 1];
      const modulePath = parts.slice(0, -1).join('/');
      return `${baseUrl}${packageName}/${modulePath}/index.html#${typeName}`;
    }
  }

  return null;
}

/**
 * Escape HTML special characters.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
