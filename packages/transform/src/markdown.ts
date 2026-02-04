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

/**
 * Highlight a Mojo signature.
 */
export function highlightSignature(signature: string): string {
  // Tokenize and highlight the signature
  const tokens = tokenizeSignature(signature);
  return tokens
    .map((token) => {
      switch (token.type) {
        case 'keyword':
          return `<span class="sig-keyword">${escapeHtml(token.value)}</span>`;
        case 'name':
          return `<span class="sig-name">${escapeHtml(token.value)}</span>`;
        case 'type':
          return `<span class="sig-type">${escapeHtml(token.value)}</span>`;
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

/**
 * Highlight a type reference.
 */
export function highlightType(type: string): string {
  return highlightSignature(type);
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
