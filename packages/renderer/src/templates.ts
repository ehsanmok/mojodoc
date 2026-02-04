/**
 * HTML templates for the documentation site.
 * Using the "Inferno" design system - bold, modern, and uniquely Mojo.
 */

import type {
  DocSite,
  Module,
  FunctionItem,
  StructItem,
  TraitItem,
  AliasItem,
  NavNode,
} from '@mojodoc/transform';

/**
 * Generate the main layout HTML.
 */
export function layoutTemplate(content: string, site: DocSite, currentPath: string): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(site.config.name)} - API Documentation</title>
  <meta name="description" content="${escapeHtml(site.config.description)}">
  <meta name="theme-color" content="#ff6b35">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔥</text></svg>">
  <link rel="stylesheet" href="${site.config.baseUrl}assets/styles.css">
</head>
<body>
  <div class="app">
    <!-- Header -->
    <header class="header">
      <div class="header-left">
        <button class="sidebar-toggle" aria-label="Toggle sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <a href="${site.config.baseUrl}" class="logo">
          <span class="logo-icon">🔥</span>
          <span class="logo-text">${escapeHtml(site.config.name)}</span>
        </a>
        <span class="version">${escapeHtml(site.config.version)}</span>
      </div>
      <div class="header-center">
        <button class="search-trigger" id="search-trigger">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <span>Search docs...</span>
          <kbd>⌘K</kbd>
        </button>
      </div>
      <div class="header-right">
        <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
          <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        ${
          site.config.repository
            ? `
        <a href="${escapeHtml(site.config.repository)}" class="github-link" target="_blank" rel="noopener">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        `
            : ''
        }
      </div>
    </header>

    <div class="main-container">
      <!-- Sidebar -->
      <aside class="sidebar" id="sidebar">
        <nav class="nav-tree">
          ${renderNavTree(site.navTree, currentPath)}
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="content">
        ${content}
      </main>
    </div>
  </div>

  <!-- Search Modal -->
  <div class="search-modal" id="search-modal" hidden>
    <div class="search-backdrop"></div>
    <div class="search-dialog">
      <div class="search-input-wrapper">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" class="search-input" id="search-input" placeholder="Search docs..." autocomplete="off">
        <kbd>esc</kbd>
      </div>
      <div class="search-results" id="search-results"></div>
    </div>
  </div>

  <script>
    window.SEARCH_INDEX = ${JSON.stringify(site.searchIndex)};
  </script>
  <script src="${site.config.baseUrl}assets/main.js"></script>
</body>
</html>`;
}

/**
 * Render navigation tree.
 */
function renderNavTree(nodes: NavNode[], currentPath: string): string {
  return nodes
    .map((node) => {
      const isActive = currentPath.startsWith(node.urlPath);
      const hasChildren = node.children.length > 0;

      return `
      <div class="nav-node ${isActive ? 'active' : ''}">
        <a href="/${node.urlPath}/index.html" class="nav-link ${node.type}">
          <span class="nav-icon">${node.type === 'package' ? '📦' : '📄'}</span>
          <span class="nav-name">${escapeHtml(node.name)}</span>
          ${hasChildren ? '<span class="nav-arrow">▸</span>' : ''}
        </a>
        ${
          hasChildren
            ? `
          <div class="nav-children">
            ${renderNavTree(node.children, currentPath)}
          </div>
        `
            : ''
        }
        ${
          node.items && node.items.length > 0
            ? `
          <div class="nav-items">
            ${node.items
              .map(
                (item) => `
              <a href="/${node.urlPath}/index.html#${item.anchor}" class="nav-item ${item.kind}">
                <span class="nav-item-badge">${kindBadge(item.kind)}</span>
                <span class="nav-item-name">${escapeHtml(item.name)}</span>
              </a>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
      </div>
    `;
    })
    .join('');
}

/**
 * Get badge text for item kind.
 */
function kindBadge(kind: string): string {
  switch (kind) {
    case 'function':
      return 'fn';
    case 'struct':
      return 'st';
    case 'trait':
      return 'tr';
    case 'alias':
      return 'al';
    case 'field':
      return 'fd';
    case 'method':
      return 'fn';
    default:
      return kind.slice(0, 2);
  }
}

/**
 * Generate module page HTML.
 */
export function moduleTemplate(mod: Module, sourceLink: string | null = null): string {
  return `
    <article class="module-page">
      <header class="page-header">
        <div class="breadcrumb">
          ${mod.parentPackage
            .split('.')
            .map(
              (p, i, arr) =>
                `<a href="/${arr.slice(0, i + 1).join('/')}/index.html">${escapeHtml(p)}</a>`
            )
            .join('<span class="separator">/</span>')}
        </div>
        <div class="page-title-row">
          <h1 class="page-title">
            <span class="kind-badge module">mod</span>
            ${escapeHtml(mod.name)}
          </h1>
          ${
            sourceLink
              ? `
            <a href="${sourceLink}" class="source-link" target="_blank" rel="noopener noreferrer" title="View source">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h4v4"/>
                <path d="M14 10l6-6"/>
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
              </svg>
              <span>src</span>
            </a>
          `
              : ''
          }
        </div>
        ${mod.summary ? `<p class="page-summary">${escapeHtml(mod.summary)}</p>` : ''}
      </header>

      ${
        mod.descriptionHtml
          ? `
        <section class="module-description">
          ${mod.descriptionHtml}
        </section>
      `
          : ''
      }

      ${
        mod.functions.length > 0
          ? `
        <section class="doc-section">
          <h2 class="section-title">Functions</h2>
          <div class="items-list">
            ${mod.functions.map((fn) => functionTemplate(fn)).join('')}
          </div>
        </section>
      `
          : ''
      }

      ${
        mod.structs.length > 0
          ? `
        <section class="doc-section">
          <h2 class="section-title">Structs</h2>
          <div class="items-list">
            ${mod.structs.map((s) => structTemplate(s)).join('')}
          </div>
        </section>
      `
          : ''
      }

      ${
        mod.traits.length > 0
          ? `
        <section class="doc-section">
          <h2 class="section-title">Traits</h2>
          <div class="items-list">
            ${mod.traits.map((t) => traitTemplate(t)).join('')}
          </div>
        </section>
      `
          : ''
      }

      ${
        mod.aliases.length > 0
          ? `
        <section class="doc-section">
          <h2 class="section-title">Constants & Aliases</h2>
          <div class="items-list">
            ${mod.aliases.map((a) => aliasTemplate(a)).join('')}
          </div>
        </section>
      `
          : ''
      }
    </article>
  `;
}

/**
 * Generate function item HTML.
 */
export function functionTemplate(fn: FunctionItem): string {
  return `
    <div class="doc-item function" id="${fn.anchor}">
      <div class="item-ribbon function"></div>
      ${fn.overloads
        .map(
          (overload, idx) => `
        <div class="overload ${idx > 0 ? 'additional' : ''}">
          <div class="item-header">
            <h3 class="item-title">
              <span class="kind-badge function">fn</span>
              <span class="item-name">${escapeHtml(fn.name)}</span>
              ${overload.isStatic ? '<span class="modifier-badge">static</span>' : ''}
              ${overload.isAsync ? '<span class="modifier-badge">async</span>' : ''}
            </h3>
            <div class="item-actions">
              <button class="copy-btn" data-copy="${escapeHtml(overload.signature)}" title="Copy signature">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="signature-card">
            <pre class="signature">${overload.signatureHtml}</pre>
          </div>

          ${
            overload.summary
              ? `
            <p class="item-summary">${escapeHtml(overload.summary)}</p>
          `
              : ''
          }

          ${
            overload.descriptionHtml
              ? `
            <div class="item-description">
              ${overload.descriptionHtml}
            </div>
          `
              : ''
          }

          ${
            overload.typeParams.length > 0
              ? `
            <div class="params-section">
              <h4>Type Parameters</h4>
              <div class="params-list">
                ${overload.typeParams
                  .map(
                    (p) => `
                  <div class="param-card">
                    <div class="param-header">
                      <span class="param-name">${escapeHtml(p.name)}</span>
                      <span class="param-type">${escapeHtml(p.type)}</span>
                    </div>
                    ${p.descriptionHtml ? `<div class="param-desc">${p.descriptionHtml}</div>` : ''}
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          ${
            overload.args.length > 0
              ? `
            <div class="params-section">
              <h4>Args</h4>
              <div class="params-list">
                ${overload.args
                  .map(
                    (arg) => `
                  <div class="param-card">
                    <div class="param-header">
                      <span class="param-name">${escapeHtml(arg.name)}</span>
                      <span class="param-type">${arg.typeHtml}</span>
                      ${arg.convention !== 'read' ? `<span class="convention-badge">${arg.convention}</span>` : ''}
                    </div>
                    ${arg.descriptionHtml ? `<div class="param-desc">${arg.descriptionHtml}</div>` : ''}
                    ${arg.default ? `<div class="param-default">Default: <code>${escapeHtml(arg.default)}</code></div>` : ''}
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
              : ''
          }

          ${
            overload.returns
              ? `
            <div class="returns-section">
              <h4>Returns</h4>
              <div class="return-card">
                <span class="return-type">${overload.returns.typeHtml}</span>
                ${overload.returns.descriptionHtml ? `<div class="return-desc">${overload.returns.descriptionHtml}</div>` : ''}
              </div>
            </div>
          `
              : ''
          }

          ${
            overload.raises
              ? `
            <div class="raises-section">
              <h4>⚠️ Raises</h4>
              <div class="raises-content">${overload.raises.descriptionHtml}</div>
            </div>
          `
              : ''
          }

          ${
            overload.deprecated
              ? `
            <div class="deprecated-notice">
              <strong>Deprecated:</strong> ${escapeHtml(overload.deprecated)}
            </div>
          `
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
  `;
}

/**
 * Generate struct item HTML.
 */
export function structTemplate(struct: StructItem): string {
  return `
    <div class="doc-item struct" id="${struct.anchor}">
      <div class="item-ribbon struct"></div>
      <div class="item-header">
        <h3 class="item-title">
          <span class="kind-badge struct">struct</span>
          <span class="item-name">${escapeHtml(struct.name)}</span>
        </h3>
        <div class="item-actions">
          <button class="copy-btn" data-copy="${escapeHtml(struct.signature)}" title="Copy signature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="signature-card">
        <pre class="signature">${struct.signatureHtml}</pre>
      </div>

      ${struct.summary ? `<p class="item-summary">${escapeHtml(struct.summary)}</p>` : ''}

      ${
        struct.descriptionHtml
          ? `
        <div class="item-description">${struct.descriptionHtml}</div>
      `
          : ''
      }

      ${
        struct.fields.length > 0
          ? `
        <div class="fields-section">
          <h4>Fields</h4>
          <div class="fields-list">
            ${struct.fields
              .map(
                (f) => `
              <div class="field-card" id="${struct.anchor}-${f.name}">
                <div class="field-header">
                  <span class="field-name">${escapeHtml(f.name)}</span>
                  <span class="field-type">${f.typeHtml}</span>
                </div>
                ${f.summary ? `<div class="field-desc">${escapeHtml(f.summary)}</div>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      ${
        struct.methods.length > 0
          ? `
        <div class="methods-section">
          <h4>Methods</h4>
          <div class="methods-list">
            ${struct.methods.map((m) => functionTemplate(m)).join('')}
          </div>
        </div>
      `
          : ''
      }

      ${
        struct.deprecated
          ? `
        <div class="deprecated-notice">
          <strong>Deprecated:</strong> ${escapeHtml(struct.deprecated)}
        </div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Generate trait item HTML.
 */
export function traitTemplate(trait: TraitItem): string {
  return `
    <div class="doc-item trait" id="${trait.anchor}">
      <div class="item-ribbon trait"></div>
      <div class="item-header">
        <h3 class="item-title">
          <span class="kind-badge trait">trait</span>
          <span class="item-name">${escapeHtml(trait.name)}</span>
        </h3>
      </div>

      <div class="signature-card">
        <pre class="signature">${trait.signatureHtml}</pre>
      </div>

      ${trait.summary ? `<p class="item-summary">${escapeHtml(trait.summary)}</p>` : ''}

      ${
        trait.descriptionHtml
          ? `
        <div class="item-description">${trait.descriptionHtml}</div>
      `
          : ''
      }

      ${
        trait.methods.length > 0
          ? `
        <div class="methods-section">
          <h4>Required Methods</h4>
          <div class="methods-list">
            ${trait.methods.map((m) => functionTemplate(m)).join('')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Generate alias item HTML.
 */
export function aliasTemplate(alias: AliasItem): string {
  return `
    <div class="doc-item alias" id="${alias.anchor}">
      <div class="item-ribbon alias"></div>
      <div class="item-header">
        <h3 class="item-title">
          <span class="kind-badge alias">const</span>
          <span class="item-name">${escapeHtml(alias.name)}</span>
        </h3>
      </div>

      <div class="signature-card">
        <pre class="signature">${alias.signatureHtml}</pre>
      </div>

      ${
        alias.value
          ? `
        <div class="alias-value">
          <span class="value-label">Value:</span>
          <code>${escapeHtml(alias.value)}</code>
        </div>
      `
          : ''
      }

      ${alias.summary ? `<p class="item-summary">${escapeHtml(alias.summary)}</p>` : ''}
    </div>
  `;
}

/**
 * Generate index page for a package.
 */
export function packageIndexTemplate(pkg: import('@mojodoc/transform').Package): string {
  return `
    <article class="package-page">
      <header class="page-header">
        <h1 class="page-title">
          <span class="kind-badge package">pkg</span>
          ${escapeHtml(pkg.name)}
        </h1>
        ${pkg.summary ? `<p class="page-summary">${escapeHtml(pkg.summary)}</p>` : ''}
      </header>

      ${
        pkg.descriptionHtml
          ? `
        <section class="package-description">
          ${pkg.descriptionHtml}
        </section>
      `
          : ''
      }

      ${
        pkg.publicApi.length > 0
          ? `
        <section class="doc-section public-api-section">
          ${pkg.publicApi
            .map(
              (section) => `
            <div class="api-section">
              <h2 class="section-title">${escapeHtml(section.title)}</h2>
              <div class="api-grid">
                ${section.items
                  .map(
                    (item) => `
                  <a href="/${item.urlPath}/index.html#${item.anchor}" class="api-card ${item.kind}">
                    <div class="api-card-header">
                      <span class="kind-badge ${item.kind}">${kindBadge(item.kind)}</span>
                      <span class="api-name">${escapeHtml(item.name)}</span>
                    </div>
                    ${item.summary ? `<p class="api-summary">${escapeHtml(item.summary)}</p>` : ''}
                    <span class="api-source">from .${escapeHtml(item.sourceModule)}</span>
                  </a>
                `
                  )
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </section>
      `
          : ''
      }

      ${
        pkg.modules.filter((m) => m.name !== '__init__').length > 0
          ? `
        <section class="doc-section modules-section">
          <h2 class="section-title">Modules</h2>
          <div class="modules-list">
            ${pkg.modules
              .filter((m) => m.name !== '__init__')
              .map(
                (m) => `
              <div class="module-item">
                <a href="${m.name}/index.html" class="module-link">${escapeHtml(m.name)}</a>
                ${m.summary ? `<span class="module-desc">${escapeHtml(m.summary)}</span>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      `
          : ''
      }

      ${
        pkg.subpackages.length > 0
          ? `
        <section class="doc-section modules-section">
          <h2 class="section-title">Subpackages</h2>
          <div class="modules-list">
            ${pkg.subpackages
              .map(
                (sub) => `
              <div class="module-item">
                <a href="${sub.name}/index.html" class="module-link">${escapeHtml(sub.name)}</a>
                ${sub.summary ? `<span class="module-desc">${escapeHtml(sub.summary)}</span>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        </section>
      `
          : ''
      }
    </article>
  `;
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
