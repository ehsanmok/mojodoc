/**
 * HTML templates for the documentation site.
 * Using the "Inferno" design system - bold, modern, and uniquely Mojo.
 *
 * Layout philosophy: cargo doc UX (API-first, two-pass summary→detail)
 * + Inferno visual identity (ember palette, ribbons, glass morphism).
 */

import type {
  DocSite,
  Module,
  FunctionItem,
  StructItem,
  TraitItem,
  AliasItem,
  PublicApiItem,
} from '@mojodoc/transform';

/**
 * Generate the main layout HTML.
 */
export function layoutTemplate(content: string, site: DocSite, _currentPath: string): string {
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
      <!-- Sidebar: "On this page" kind anchors, populated by JS -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-kinds" id="sidebar-kinds"></div>
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
    window.BASE_URL = ${JSON.stringify(site.config.baseUrl)};
  </script>
  <script src="${site.config.baseUrl}assets/main.js"></script>
</body>
</html>`;
}

/**
 * Get badge text for item kind.
 */
function kindBadge(kind: string): string {
  switch (kind) {
    case 'function':
      return 'fn';
    case 'struct':
      return 'struct';
    case 'trait':
      return 'trait';
    case 'alias':
      return 'const';
    case 'field':
      return 'fd';
    case 'method':
      return 'fn';
    default:
      return kind.slice(0, 2);
  }
}

/**
 * Render a cargo-doc style overview table for a list of items.
 * Each row: kind-badge + name (jump-link) | one-line summary.
 */
function overviewTable(
  items: Array<{ name: string; anchor: string; summary: string; kind: string }>
): string {
  if (items.length === 0) return '';
  return `
    <table class="overview-table">
      <tbody>
        ${items
          .map(
            (item) => `
          <tr>
            <td class="ov-name">
              <span class="kind-badge ${item.kind}">${kindBadge(item.kind)}</span>
              <a href="#${item.anchor}" class="ov-link">${escapeHtml(item.name)}</a>
            </td>
            <td class="ov-summary">${item.summary ? escapeHtml(item.summary) : ''}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

/**
 * Render a cargo-doc style overview table for public API re-exports.
 * Each row links to the item's detail page + anchor.
 */
function reExportTable(items: PublicApiItem[], baseUrl: string): string {
  if (items.length === 0) return '';
  return `
    <table class="overview-table re-export-table">
      <tbody>
        ${items
          .map(
            (item) => `
          <tr>
            <td class="ov-name">
              <span class="kind-badge ${item.kind}">${kindBadge(item.kind)}</span>
              <a href="${baseUrl}${item.urlPath}/index.html#${item.anchor}" class="ov-link">${escapeHtml(item.name)}</a>
            </td>
            <td class="ov-summary">${item.summary ? escapeHtml(item.summary) : ''}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `;
}

/**
 * Generate module page HTML.
 * Two-pass layout: cargo-doc overview tables at top, full detail docs below.
 */
export function moduleTemplate(
  mod: Module,
  sourceLink: string | null = null,
  baseUrl: string = '/'
): string {
  // Build breadcrumb parts: each segment links to its package/module index
  const breadcrumbParts = mod.parentPackage.split('.');
  const breadcrumbHtml = breadcrumbParts
    .map(
      (p, i, arr) =>
        `<a href="${baseUrl}${arr.slice(0, i + 1).join('/')}/index.html">${escapeHtml(p)}</a>`
    )
    .join('<span class="separator"> / </span>');

  // Overview rows for each kind
  const fnRows = mod.functions.map((fn) => ({
    name: fn.name,
    anchor: fn.anchor,
    summary: fn.overloads[0]?.summary || '',
    kind: 'function',
  }));
  const structRows = mod.structs.map((s) => ({
    name: s.name,
    anchor: s.anchor,
    summary: s.summary || '',
    kind: 'struct',
  }));
  const traitRows = mod.traits.map((t) => ({
    name: t.name,
    anchor: t.anchor,
    summary: t.summary || '',
    kind: 'trait',
  }));
  const aliasRows = mod.aliases.map((a) => ({
    name: a.name,
    anchor: a.anchor,
    summary: a.summary || '',
    kind: 'alias',
  }));

  const hasOverview =
    fnRows.length > 0 || structRows.length > 0 || traitRows.length > 0 || aliasRows.length > 0;

  return `
    <article class="module-page">
      <header class="page-header">
        <div class="breadcrumb">
          ${breadcrumbHtml}<span class="separator"> / </span><span class="breadcrumb-current">${escapeHtml(mod.name)}</span>
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
        hasOverview
          ? `
        <!-- cargo-doc style overview tables: quick scan before detail docs -->
        <div class="overview-sections">
          ${
            fnRows.length > 0
              ? `
            <div class="overview-group">
              <h2 class="overview-heading">Functions</h2>
              ${overviewTable(fnRows)}
            </div>
          `
              : ''
          }
          ${
            structRows.length > 0
              ? `
            <div class="overview-group">
              <h2 class="overview-heading">Structs</h2>
              ${overviewTable(structRows)}
            </div>
          `
              : ''
          }
          ${
            traitRows.length > 0
              ? `
            <div class="overview-group">
              <h2 class="overview-heading">Traits</h2>
              ${overviewTable(traitRows)}
            </div>
          `
              : ''
          }
          ${
            aliasRows.length > 0
              ? `
            <div class="overview-group">
              <h2 class="overview-heading">Constants &amp; Type Aliases</h2>
              ${overviewTable(aliasRows)}
            </div>
          `
              : ''
          }
        </div>

        <div class="section-divider">
          <span class="section-divider-label">Detail Documentation</span>
        </div>
      `
          : ''
      }

      ${
        mod.functions.length > 0
          ? `
        <section class="doc-section" id="functions">
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
        <section class="doc-section" id="structs">
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
        <section class="doc-section" id="traits">
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
        <section class="doc-section" id="constants">
          <h2 class="section-title">Constants &amp; Type Aliases</h2>
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
              <a class="item-permalink" href="#${fn.anchor}" aria-label="Permalink to ${escapeHtml(fn.name)}">§</a>
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
              <h4>Parameters</h4>
              <table class="params-table">
                <tbody>
                  ${overload.typeParams
                    .map(
                      (p) => `
                    <tr>
                      <td class="param-name-cell"><span class="param-name">${escapeHtml(p.name)}</span></td>
                      <td class="param-type-cell"><span class="param-type">${escapeHtml(p.type)}</span></td>
                      <td class="param-desc-cell">${p.descriptionHtml ? p.descriptionHtml : ''}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            overload.args.length > 0
              ? `
            <div class="params-section">
              <h4>Args</h4>
              <table class="params-table">
                <tbody>
                  ${overload.args
                    .map(
                      (arg) => `
                    <tr>
                      <td class="param-name-cell">
                        <span class="param-name">${escapeHtml(arg.name)}</span>
                        ${arg.convention !== 'read' ? `<span class="convention-badge">${arg.convention}</span>` : ''}
                      </td>
                      <td class="param-type-cell"><span class="param-type">${arg.typeHtml}</span></td>
                      <td class="param-desc-cell">
                        ${arg.descriptionHtml ? arg.descriptionHtml : ''}
                        ${arg.default ? `<span class="param-default">Default: <code>${escapeHtml(arg.default)}</code></span>` : ''}
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            overload.returns
              ? `
            <div class="returns-section">
              <h4>Returns</h4>
              <table class="params-table">
                <tbody>
                  <tr>
                    <td class="param-type-cell"><span class="param-type">${overload.returns.typeHtml}</span></td>
                    <td class="param-desc-cell">${overload.returns.descriptionHtml ? overload.returns.descriptionHtml : ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            overload.raises
              ? `
            <div class="raises-section">
              <h4>Raises</h4>
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
          <a class="item-permalink" href="#${struct.anchor}" aria-label="Permalink to ${escapeHtml(struct.name)}">§</a>
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
          <table class="fields-table">
            <tbody>
              ${struct.fields
                .map(
                  (f) => `
                <tr id="${struct.anchor}-${f.name}">
                  <td class="field-name-cell"><span class="field-name">${escapeHtml(f.name)}</span></td>
                  <td class="field-type-cell">${f.typeHtml}</td>
                  <td class="field-desc-cell">${f.summary ? escapeHtml(f.summary) : ''}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      `
          : ''
      }

      ${
        struct.methods.length > 0
          ? `
        <div class="methods-section">
          <h4>Methods</h4>
          <div class="methods-overview">
            ${overviewTable(
              struct.methods.map((m) => ({
                name: m.name,
                anchor: `${struct.anchor}-${m.anchor}`,
                summary: m.overloads[0]?.summary || '',
                kind: 'function',
              }))
            )}
          </div>
          <div class="methods-list">
            ${struct.methods.map((m) => methodTemplate(m, struct.anchor)).join('')}
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
 * Generate a method item HTML (same as function but with a namespaced anchor).
 */
function methodTemplate(fn: FunctionItem, structAnchor: string): string {
  const methodAnchor = `${structAnchor}-${fn.anchor}`;
  return `
    <div class="doc-item function method" id="${methodAnchor}">
      <div class="item-ribbon function"></div>
      ${fn.overloads
        .map(
          (overload, idx) => `
        <div class="overload ${idx > 0 ? 'additional' : ''}">
          <div class="item-header">
            <h4 class="item-title method-title">
              <span class="kind-badge function">fn</span>
              <span class="item-name">${escapeHtml(fn.name)}</span>
              ${overload.isStatic ? '<span class="modifier-badge">static</span>' : ''}
              ${overload.isAsync ? '<span class="modifier-badge">async</span>' : ''}
              <a class="item-permalink" href="#${methodAnchor}" aria-label="Permalink to ${escapeHtml(fn.name)}">§</a>
            </h4>
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

          ${overload.summary ? `<p class="item-summary">${escapeHtml(overload.summary)}</p>` : ''}
          ${overload.descriptionHtml ? `<div class="item-description">${overload.descriptionHtml}</div>` : ''}

          ${
            overload.typeParams.length > 0
              ? `
            <div class="params-section">
              <h5>Parameters</h5>
              <table class="params-table">
                <tbody>
                  ${overload.typeParams
                    .map(
                      (p) => `
                    <tr>
                      <td class="param-name-cell"><span class="param-name">${escapeHtml(p.name)}</span></td>
                      <td class="param-type-cell"><span class="param-type">${escapeHtml(p.type)}</span></td>
                      <td class="param-desc-cell">${p.descriptionHtml}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            overload.args.length > 0
              ? `
            <div class="params-section">
              <h5>Args</h5>
              <table class="params-table">
                <tbody>
                  ${overload.args
                    .map(
                      (arg) => `
                    <tr>
                      <td class="param-name-cell">
                        <span class="param-name">${escapeHtml(arg.name)}</span>
                        ${arg.convention !== 'read' ? `<span class="convention-badge">${arg.convention}</span>` : ''}
                      </td>
                      <td class="param-type-cell"><span class="param-type">${arg.typeHtml}</span></td>
                      <td class="param-desc-cell">
                        ${arg.descriptionHtml}
                        ${arg.default ? `<span class="param-default">Default: <code>${escapeHtml(arg.default)}</code></span>` : ''}
                      </td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            overload.returns
              ? `
            <div class="returns-section">
              <h5>Returns</h5>
              <table class="params-table">
                <tbody>
                  <tr>
                    <td class="param-type-cell"><span class="param-type">${overload.returns.typeHtml}</span></td>
                    <td class="param-desc-cell">${overload.returns.descriptionHtml}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          `
              : ''
          }

          ${
            overload.raises
              ? `
            <div class="raises-section">
              <h5>Raises</h5>
              <div class="raises-content">${overload.raises.descriptionHtml}</div>
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
          <a class="item-permalink" href="#${trait.anchor}" aria-label="Permalink to ${escapeHtml(trait.name)}">§</a>
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
          <div class="methods-overview">
            ${overviewTable(
              trait.methods.map((m) => ({
                name: m.name,
                anchor: `${trait.anchor}-${m.anchor}`,
                summary: m.overloads[0]?.summary || '',
                kind: 'function',
              }))
            )}
          </div>
          <div class="methods-list">
            ${trait.methods.map((m) => methodTemplate(m, trait.anchor)).join('')}
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
          <a class="item-permalink" href="#${alias.anchor}" aria-label="Permalink to ${escapeHtml(alias.name)}">§</a>
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

      ${
        alias.descriptionHtml
          ? `
        <div class="item-description">${alias.descriptionHtml}</div>
      `
          : ''
      }
    </div>
  `;
}

/**
 * Generate index page for a package.
 * Cargo-doc UX: re-exports primary, modules secondary.
 */
export function packageIndexTemplate(
  pkg: import('@mojodoc/transform').Package,
  baseUrl: string = '/'
): string {
  // Group public API items by kind for the re-exports overview
  const allPublicItems = pkg.publicApi.flatMap((s) => s.items);

  // Determine if we have named sections or just a flat Public API
  const hasNamedSections =
    pkg.publicApi.length > 1 ||
    (pkg.publicApi.length === 1 && pkg.publicApi[0].title !== 'Public API');

  // When a package has explicit public API (from __init__.mojo re-exports),
  // internal modules are implementation details and should not be surfaced.
  // Only show modules/subpackages when no public API is declared (fallback for
  // packages without __init__.mojo re-exports).
  const hasExplicitPublicApi = pkg.publicApi.some((s) => s.items.length > 0);
  const visibleModules = hasExplicitPublicApi
    ? []
    : pkg.modules.filter((m) => m.name !== '__init__');
  const visibleSubpackages = hasExplicitPublicApi ? [] : pkg.subpackages;

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
        allPublicItems.length > 0
          ? hasNamedSections
            ? `
          <!-- Named sections from __init__.mojo comments -->
          <section class="doc-section re-exports-section" id="re-exports">
            ${pkg.publicApi
              .map(
                (section) => `
              <div class="re-export-group">
                <h2 class="overview-heading">${escapeHtml(section.title)}</h2>
                ${reExportTable(section.items, baseUrl)}
              </div>
            `
              )
              .join('')}
          </section>
        `
            : `
          <!-- Flat re-exports grouped by kind -->
          <section class="doc-section re-exports-section" id="re-exports">
            <h2 class="section-title">Re-exports</h2>
            ${renderReExportsByKind(allPublicItems, baseUrl)}
          </section>
        `
          : ''
      }

      ${
        visibleModules.length > 0
          ? `
        <section class="doc-section modules-section" id="modules">
          <h2 class="section-title">Modules</h2>
          <table class="overview-table modules-table">
            <tbody>
              ${visibleModules
                .map(
                  (m) => `
                <tr>
                  <td class="ov-name">
                    <span class="kind-badge module">mod</span>
                    <a href="${m.name}/index.html" class="ov-link">${escapeHtml(m.name)}</a>
                  </td>
                  <td class="ov-summary">${m.summary ? escapeHtml(m.summary) : ''}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </section>
      `
          : ''
      }

      ${
        visibleSubpackages.length > 0
          ? `
        <section class="doc-section modules-section" id="subpackages">
          <h2 class="section-title">Subpackages</h2>
          <table class="overview-table modules-table">
            <tbody>
              ${visibleSubpackages
                .map(
                  (sub) => `
                <tr>
                  <td class="ov-name">
                    <span class="kind-badge package">pkg</span>
                    <a href="${sub.name}/index.html" class="ov-link">${escapeHtml(sub.name)}</a>
                  </td>
                  <td class="ov-summary">${sub.summary ? escapeHtml(sub.summary) : ''}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </section>
      `
          : ''
      }
    </article>
  `;
}

/**
 * Render re-exports grouped by kind (Functions, Structs, Traits, Constants).
 * Used when there are no named sections from __init__.mojo.
 */
function renderReExportsByKind(items: PublicApiItem[], baseUrl: string): string {
  const byKind: Record<string, PublicApiItem[]> = {
    struct: [],
    trait: [],
    function: [],
    alias: [],
  };

  for (const item of items) {
    const key = item.kind in byKind ? item.kind : 'alias';
    byKind[key].push(item);
  }

  const kindLabels: Record<string, string> = {
    struct: 'Structs',
    trait: 'Traits',
    function: 'Functions',
    alias: 'Constants &amp; Type Aliases',
  };

  const order = ['struct', 'trait', 'function', 'alias'];

  return order
    .filter((k) => byKind[k].length > 0)
    .map(
      (k) => `
      <div class="re-export-group">
        <h3 class="re-export-kind-heading">${kindLabels[k]}</h3>
        ${reExportTable(byKind[k], baseUrl)}
      </div>
    `
    )
    .join('');
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
