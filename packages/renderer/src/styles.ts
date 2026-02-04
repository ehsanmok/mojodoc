/**
 * CSS styles for the Inferno design system.
 * A bold, modern design language for Mojo - the world's most performant language.
 */

export const styles = `
/* ============================================================================
   Inferno Design System - For Mojo Documentation
   ============================================================================ */

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  /* Inferno Fire Palette */
  --fire-50: #fff8f3;
  --fire-100: #ffedd5;
  --fire-200: #fed7aa;
  --fire-300: #fdba74;
  --fire-400: #fb923c;
  --fire-500: #f97316;
  --fire-600: #ea580c;
  --fire-700: #c2410c;
  --fire-800: #9a3412;
  --fire-900: #7c2d12;

  /* Ember Accents */
  --ember: #ff6b35;
  --ember-glow: #ff8f5c;
  --magma: #dc2626;
  --lava: #f59e0b;

  /* Plasma Purples (for traits) */
  --plasma-400: #a78bfa;
  --plasma-500: #8b5cf6;
  --plasma-600: #7c3aed;

  /* Type Colors - Vibrant */
  --color-function: #ff6b35;
  --color-struct: #06b6d4;
  --color-trait: #a78bfa;
  --color-alias: #fbbf24;
  --color-field: #34d399;
  --color-module: #94a3b8;

  /* Dark Theme (Default) */
  --bg-void: #09090b;
  --bg-deep: #0c0c0f;
  --bg-surface: #111114;
  --bg-raised: #18181b;
  --bg-elevated: #1f1f23;
  --bg-card: rgba(24, 24, 27, 0.8);

  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --text-dim: #52525b;

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-accent: rgba(255, 107, 53, 0.3);

  /* Glass Effects */
  --glass-bg: rgba(17, 17, 20, 0.85);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;

  /* Gradients */
  --gradient-fire: linear-gradient(135deg, #ff6b35 0%, #f97316 50%, #ea580c 100%);
  --gradient-ember: linear-gradient(135deg, #ff8f5c 0%, #ff6b35 100%);
  --gradient-inferno: linear-gradient(135deg, #ff6b35 0%, #dc2626 50%, #7c2d12 100%);
  --gradient-glow: radial-gradient(ellipse at center, rgba(255, 107, 53, 0.15) 0%, transparent 70%);
  --gradient-plasma: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  --gradient-cyan: linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%);

  /* Typography */
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;

  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Animation */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* Layout */
  --sidebar-width: 300px;
  --header-height: 64px;
  --content-max-width: 920px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

[data-theme="light"] {
  --bg-void: #fafafa;
  --bg-deep: #f5f5f5;
  --bg-surface: #ffffff;
  --bg-raised: #f8f8f8;
  --bg-elevated: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.9);

  --text-primary: #09090b;
  --text-secondary: #3f3f46;
  --text-muted: #71717a;
  --text-dim: #a1a1aa;

  --border-subtle: rgba(0, 0, 0, 0.04);
  --border-default: rgba(0, 0, 0, 0.08);
  --border-accent: rgba(255, 107, 53, 0.2);

  --glass-bg: rgba(255, 255, 255, 0.9);
  --glass-border: rgba(0, 0, 0, 0.06);

  --gradient-glow: radial-gradient(ellipse at center, rgba(255, 107, 53, 0.08) 0%, transparent 70%);

  /* Code block colors for light mode */
  --code-bg: #f6f8fa;
  --code-text: #24292f;
  --code-border: rgba(0, 0, 0, 0.1);
}

/* Light mode code block overrides */
[data-theme="light"] .signature-card {
  background: var(--code-bg);
  border-color: var(--code-border);
}

[data-theme="light"] .signature-card::before {
  opacity: 0;
}

[data-theme="light"] .signature {
  color: var(--code-text);
}

[data-theme="light"] .item-description pre {
  background: var(--code-bg);
  border-color: var(--code-border);
}

[data-theme="light"] .item-description pre code {
  color: var(--code-text);
}

/* ============================================================================
   Global Reset & Base
   ============================================================================ */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-display);
  background: var(--bg-void);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  overflow-x: hidden;
}

/* Background Glow Effect */
body::before {
  content: '';
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: var(--gradient-glow);
  pointer-events: none;
  z-index: -1;
  animation: subtleFloat 20s ease-in-out infinite;
}

@keyframes subtleFloat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(2%, 2%) rotate(1deg); }
  66% { transform: translate(-1%, 1%) rotate(-1deg); }
}

::selection {
  background: rgba(255, 107, 53, 0.3);
  color: var(--text-primary);
}

a {
  color: var(--ember);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out-expo);
}

a:hover {
  color: var(--ember-glow);
}

code, pre {
  font-family: var(--font-mono);
}

/* ============================================================================
   Layout Structure
   ============================================================================ */

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-container {
  display: flex;
  flex: 1;
  padding-top: var(--header-height);
}

/* ============================================================================
   Header - Glass Morphism
   ============================================================================ */

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  z-index: 100;
}

.header::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--ember), transparent);
  opacity: 0.3;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* Logo - Animated Fire */
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.logo:hover {
  text-decoration: none;
}

.logo-icon {
  font-size: 1.6rem;
  filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.5));
  animation: fireGlow 2s ease-in-out infinite alternate;
}

@keyframes fireGlow {
  from { filter: drop-shadow(0 0 8px rgba(255, 107, 53, 0.4)); transform: scale(1); }
  to { filter: drop-shadow(0 0 16px rgba(255, 107, 53, 0.8)); transform: scale(1.05); }
}

.version {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-elevated);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  border: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
}

/* Sidebar Toggle */
.sidebar-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.sidebar-toggle:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  color: var(--text-primary);
}

/* Search Trigger - Glowing Border */
.search-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-2) var(--space-5);
  color: var(--text-muted);
  cursor: pointer;
  min-width: 320px;
  transition: all var(--duration-normal) var(--ease-out-expo);
  position: relative;
  overflow: hidden;
}

.search-trigger::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: var(--gradient-fire);
  border-radius: inherit;
  opacity: 0;
  z-index: -1;
  transition: opacity var(--duration-normal);
}

.search-trigger:hover {
  border-color: transparent;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(255, 107, 53, 0.15);
}

.search-trigger:hover::before {
  opacity: 1;
}

.search-trigger kbd {
  margin-left: auto;
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 600;
  background: var(--bg-void);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-default);
  color: var(--text-dim);
}

/* Theme Toggle */
.theme-toggle {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.theme-toggle:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  color: var(--text-primary);
  transform: rotate(15deg);
}

[data-theme="light"] .moon-icon,
[data-theme="dark"] .sun-icon,
html:not([data-theme]) .sun-icon {
  display: none;
}

.github-link {
  color: var(--text-secondary);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  display: flex;
  border: 1px solid var(--border-subtle);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.github-link:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  color: var(--text-primary);
}

/* ============================================================================
   Sidebar - Sleek Navigation
   ============================================================================ */

.sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: var(--bg-deep);
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
  padding: var(--space-6);
  scrollbar-width: thin;
  scrollbar-color: var(--border-default) transparent;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: var(--radius-full);
}

/* Navigation Tree - Modular-inspired with Inferno accents */
.nav-tree {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.nav-node {
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--duration-fast) var(--ease-out-expo);
  position: relative;
  border-radius: var(--radius-sm);
  margin: 1px 0;
}

.nav-link::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: transparent;
  transition: background var(--duration-fast);
}

.nav-link:hover {
  background: var(--bg-raised);
  color: var(--text-primary);
  text-decoration: none;
}

.nav-link:hover::before {
  background: var(--ember);
}

.nav-node.active > .nav-link {
  color: var(--ember);
  font-weight: 600;
}

.nav-node.active > .nav-link::before {
  background: var(--ember);
}

.nav-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.nav-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-arrow {
  font-size: 0.6rem;
  color: var(--text-dim);
  transition: transform var(--duration-fast) var(--ease-out-expo);
  opacity: 0.6;
}

.nav-node.expanded > .nav-link .nav-arrow,
.nav-node.active > .nav-link .nav-arrow {
  transform: rotate(90deg);
}

/* Collapsible children - hidden by default, shown when expanded */
.nav-children {
  margin-left: var(--space-4);
  padding-left: var(--space-3);
  border-left: 1px solid var(--border-subtle);
  display: none;
  flex-direction: column;
}

.nav-node.expanded > .nav-children,
.nav-node.active > .nav-children {
  display: flex;
}

/* Nav Items (functions, structs, etc.) - compact list */
.nav-items {
  margin-left: var(--space-4);
  padding-left: var(--space-3);
  border-left: 1px solid var(--border-subtle);
  display: none;
  flex-direction: column;
  gap: 0;
  margin-top: var(--space-1);
}

.nav-node.expanded > .nav-items,
.nav-node.active > .nav-items {
  display: flex;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-family: var(--font-mono);
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.nav-item:hover {
  background: var(--bg-raised);
  color: var(--text-secondary);
  text-decoration: none;
}

.nav-item-badge {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nav-item.function .nav-item-badge {
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.2), rgba(255, 107, 53, 0.1));
  color: var(--color-function);
}
.nav-item.struct .nav-item-badge {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.1));
  color: var(--color-struct);
}
.nav-item.trait .nav-item-badge {
  background: linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(167, 139, 250, 0.1));
  color: var(--color-trait);
}
.nav-item.alias .nav-item-badge {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1));
  color: var(--color-alias);
}

/* ============================================================================
   Main Content Area
   ============================================================================ */

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: var(--space-10);
  max-width: calc(var(--content-max-width) + var(--sidebar-width) + var(--space-10) * 2);
}

/* Page Header - Dramatic */
.page-header {
  margin-bottom: var(--space-12);
  padding-bottom: var(--space-8);
  border-bottom: 1px solid var(--border-subtle);
  position: relative;
}

.page-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 120px;
  height: 2px;
  background: var(--gradient-fire);
  border-radius: var(--radius-full);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.breadcrumb a {
  color: var(--text-muted);
  transition: color var(--duration-fast);
}

.breadcrumb a:hover {
  color: var(--ember);
}

.breadcrumb .separator {
  color: var(--text-dim);
  font-size: 0.7rem;
}

.page-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-3);
}

.page-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin-bottom: 0;
}

.source-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.15s ease;
}

.source-link:hover {
  color: var(--ember);
  border-color: var(--ember);
  background: rgba(255, 107, 53, 0.1);
}

.source-link svg {
  flex-shrink: 0;
}

.page-summary {
  font-size: 1.15rem;
  color: var(--text-secondary);
  max-width: 65ch;
  line-height: 1.7;
}

/* Kind Badges - Gradient Pills */
.kind-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: var(--font-mono);
}

.kind-badge.function, .kind-badge.fn {
  background: var(--gradient-fire);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
}
.kind-badge.struct {
  background: var(--gradient-cyan);
  color: white;
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.3);
}
.kind-badge.trait {
  background: var(--gradient-plasma);
  color: white;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}
.kind-badge.alias, .kind-badge.const {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}
.kind-badge.module, .kind-badge.mod {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(100, 116, 139, 0.3);
}
.kind-badge.package, .kind-badge.pkg {
  background: linear-gradient(135deg, #64748b 0%, #334155 100%);
  color: white;
}

/* ============================================================================
   Documentation Sections
   ============================================================================ */

.doc-section {
  margin-bottom: var(--space-16);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: var(--space-8);
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--border-default), transparent);
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* ============================================================================
   Doc Item Cards - Glass Morphism
   ============================================================================ */

.doc-item {
  position: relative;
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  transition: all var(--duration-normal) var(--ease-out-expo);
  overflow: hidden;
}

.doc-item::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, transparent 50%);
  pointer-events: none;
}

.doc-item:hover {
  border-color: var(--border-accent);
  transform: translateY(-2px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 0 1px var(--border-accent);
}

/* Type Ribbons - Glowing Left Border */
.item-ribbon {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: var(--radius-xl) 0 0 var(--radius-xl);
}

.item-ribbon.function {
  background: var(--gradient-fire);
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.4);
}
.item-ribbon.struct {
  background: var(--gradient-cyan);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
}
.item-ribbon.trait {
  background: var(--gradient-plasma);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
}
.item-ribbon.alias {
  background: linear-gradient(180deg, #fbbf24, #f59e0b);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
}

.item-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 1.25rem;
  font-weight: 600;
}

.item-name {
  font-family: var(--font-mono);
  letter-spacing: -0.01em;
}

.modifier-badge {
  font-size: 0.6rem;
  font-weight: 600;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.item-actions {
  display: flex;
  gap: var(--space-2);
}

.copy-btn {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-dim);
  cursor: pointer;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: all var(--duration-fast) var(--ease-out-expo);
}

.doc-item:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background: var(--bg-elevated);
  border-color: var(--border-default);
  color: var(--text-secondary);
  transform: scale(1.1);
}

/* Signature Card - Code Showcase */
.signature-card {
  background: #0d0d0d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-6);
  margin-bottom: var(--space-5);
  overflow-x: auto;
  position: relative;
}

.signature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, var(--color-function), var(--color-struct), var(--color-trait));
  opacity: 0.5;
}

.signature {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.7;
  color: #e4e4e7;
  white-space: pre-wrap;
  margin: 0;
}

/* Signature syntax highlighting */
.sig-keyword { color: #c586c0; font-weight: 500; }
.sig-name { color: #dcdcaa; }
.sig-type { color: #4ec9b0; }
.sig-param { color: #9cdcfe; }
.sig-punct { color: #808080; }

.item-summary {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  line-height: 1.7;
}

.item-description {
  color: var(--text-secondary);
  line-height: 1.8;
}

.item-description p {
  margin-bottom: var(--space-4);
}

.item-description code {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.875em;
  color: var(--ember);
}

.item-description pre {
  background: #0d0d0d;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  overflow-x: auto;
  margin: var(--space-5) 0;
}

.item-description pre code {
  background: none;
  border: none;
  padding: 0;
  color: #e4e4e7;
}

/* ============================================================================
   Parameters, Returns, Raises
   ============================================================================ */

.params-section, .returns-section, .raises-section, .fields-section, .methods-section {
  margin-top: var(--space-8);
}

.params-section h4, .returns-section h4, .raises-section h4, .fields-section h4, .methods-section h4 {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.params-list, .fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.param-card, .field-card {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  transition: border-color var(--duration-fast);
}

.param-card:hover, .field-card:hover {
  border-color: var(--border-default);
}

.param-header, .field-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.param-name, .field-name {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.param-type, .field-type {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-struct);
}

.convention-badge {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 107, 53, 0.05));
  color: var(--ember);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.param-desc, .field-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.param-default {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: var(--space-2);
}

.param-default code {
  background: var(--bg-elevated);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--lava);
}

/* Returns Card */
.return-card {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
}

.return-type {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--color-struct);
  display: block;
  margin-bottom: var(--space-2);
}

.return-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Raises Section - Warning Style */
.raises-section {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02));
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
}

.raises-section::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #ef4444, #dc2626);
}

.raises-section h4 {
  color: #f87171;
}

.raises-content {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Deprecated Notice */
.deprecated-notice {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02));
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  margin-top: var(--space-5);
  font-size: 0.9rem;
  color: var(--text-secondary);
  position: relative;
  overflow: hidden;
}

.deprecated-notice::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #f59e0b, #d97706);
}

.deprecated-notice strong {
  color: #fbbf24;
}

/* Alias Value */
.alias-value {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-5);
  margin-bottom: var(--space-4);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.value-label {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.alias-value code {
  font-family: var(--font-mono);
  color: var(--lava);
}

/* ============================================================================
   Package Page - Modules List (Modular-inspired)
   ============================================================================ */

.modules-section {
  margin-top: var(--space-8);
}

.modules-section .section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

/* Simple list format like Modular docs */
.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.module-item {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border-subtle);
  transition: all var(--duration-fast);
}

.module-item:last-child {
  border-bottom: none;
}

.module-item:hover {
  background: var(--bg-raised);
  margin: 0 calc(var(--space-3) * -1);
  padding-left: var(--space-3);
  padding-right: var(--space-3);
  border-radius: var(--radius-sm);
}

.module-item .module-link {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  color: var(--ember);
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.module-item .module-link:hover {
  color: var(--ember-glow);
}

.module-item .module-link::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--ember);
  border-radius: 50%;
  margin-right: var(--space-1);
  flex-shrink: 0;
  position: relative;
  top: -2px;
}

.module-item .module-desc {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.module-item .module-desc::before {
  content: ': ';
  color: var(--text-dim);
}

/* Grid view for cards */
.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}

.module-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  transition: all var(--duration-fast) var(--ease-out-expo);
  position: relative;
}

.module-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--gradient-fire);
  opacity: 0;
  transition: opacity var(--duration-fast);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
}

.module-card:hover {
  border-color: var(--border-accent);
  text-decoration: none;
}

.module-card:hover::before {
  opacity: 1;
}

.module-icon {
  font-size: 1.2rem;
}

.module-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.module-summary {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ============================================================================
   Public API Section - Hero display of main exports
   ============================================================================ */

.public-api-section {
  margin-bottom: var(--space-10);
}

.api-section {
  margin-bottom: var(--space-8);
}

.api-section .section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.api-section .section-title::before {
  content: '🔥';
  font-size: 1.2rem;
}

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
}

.api-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background: var(--bg-card);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-5);
  transition: all var(--duration-normal) var(--ease-out-expo);
  position: relative;
  overflow: hidden;
  text-decoration: none;
}

.api-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  opacity: 0.7;
  transition: opacity var(--duration-fast);
}

.api-card.function::before { background: var(--fn-gradient); }
.api-card.struct::before { background: var(--struct-gradient); }
.api-card.trait::before { background: var(--trait-gradient); }
.api-card.alias::before { background: var(--alias-gradient); }

.api-card:hover {
  border-color: var(--border-accent);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.1);
  text-decoration: none;
}

.api-card:hover::before {
  opacity: 1;
}

.api-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.api-card .kind-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
}

.api-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary);
  font-family: var(--font-mono);
  letter-spacing: -0.01em;
}

.api-summary {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.api-source {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  margin-top: auto;
  padding-top: var(--space-2);
  border-top: 1px solid var(--border-subtle);
}

/* ============================================================================
   Search Modal - Spotlight Style
   ============================================================================ */

.search-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}

.search-modal[hidden] {
  display: none;
}

.search-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.search-dialog {
  position: relative;
  width: 100%;
  max-width: 640px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  box-shadow:
    0 0 0 1px rgba(255, 107, 53, 0.1),
    0 25px 60px rgba(0, 0, 0, 0.4),
    0 0 100px rgba(255, 107, 53, 0.1);
  overflow: hidden;
  animation: searchSlideIn 0.2s var(--ease-out-expo);
}

@keyframes searchSlideIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-subtle);
}

.search-input-wrapper svg {
  color: var(--ember);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-family: var(--font-display);
  font-size: 1.15rem;
  color: var(--text-primary);
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-input-wrapper kbd {
  font-family: var(--font-display);
  font-size: 0.65rem;
  font-weight: 600;
  background: var(--bg-raised);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  color: var(--text-dim);
}

.search-results {
  max-height: 420px;
  overflow-y: auto;
  padding: var(--space-3);
}

.search-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out-expo);
  border: 1px solid transparent;
}

.search-result:hover, .search-result.selected {
  background: var(--bg-raised);
  border-color: var(--border-accent);
}

.search-result.selected {
  box-shadow: 0 0 0 1px var(--ember);
}

.search-result-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.search-result-name {
  font-family: var(--font-mono);
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.search-result-path {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.search-result-summary {
  font-size: 0.85rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-empty {
  padding: var(--space-10);
  text-align: center;
  color: var(--text-muted);
}

/* ============================================================================
   Additional Overload Styling
   ============================================================================ */

.overload.additional {
  margin-top: var(--space-8);
  padding-top: var(--space-8);
  border-top: 1px dashed var(--border-subtle);
}

/* ============================================================================
   Responsive Design
   ============================================================================ */

@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform var(--duration-normal) var(--ease-out-expo);
    z-index: 50;
    background: var(--bg-surface);
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 20px 0 60px rgba(0, 0, 0, 0.3);
  }

  .content {
    margin-left: 0;
    max-width: 100%;
  }

  .sidebar-toggle {
    display: block;
  }

  .header-center {
    position: static;
    transform: none;
  }
}

@media (max-width: 640px) {
  .search-trigger {
    min-width: auto;
    padding: var(--space-2) var(--space-3);
  }

  .search-trigger span {
    display: none;
  }

  .header {
    padding: 0 var(--space-4);
  }

  .header-center {
    display: none;
  }

  .content {
    padding: var(--space-5);
  }

  .page-title {
    font-size: 1.75rem;
  }

  .search-dialog {
    margin: var(--space-4);
    border-radius: var(--radius-lg);
  }

  .doc-item {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
  }

  .modules-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================================================
   Syntax Highlighting (highlight.js)
   ============================================================================ */

.hljs {
  background: transparent !important;
  color: #e4e4e7;
}

.hljs-keyword { color: #c586c0; }
.hljs-string { color: #ce9178; }
.hljs-number { color: #b5cea8; }
.hljs-comment { color: #6a9955; }
.hljs-function { color: #dcdcaa; }
.hljs-class { color: #4ec9b0; }
.hljs-variable { color: #9cdcfe; }
.hljs-literal { color: #569cd6; }
.hljs-built_in { color: #4ec9b0; }
.hljs-type { color: #4ec9b0; }
.hljs-attr { color: #9cdcfe; }
.hljs-meta { color: #c586c0; }

/* ============================================================================
   Print Styles
   ============================================================================ */

@media print {
  .header, .sidebar, .search-modal {
    display: none !important;
  }

  .content {
    margin-left: 0;
    padding: 0;
  }

  .doc-item {
    break-inside: avoid;
  }
}
`;
