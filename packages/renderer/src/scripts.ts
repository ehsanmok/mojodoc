/**
 * Client-side JavaScript for the documentation site.
 * Inferno Design System - Modern interactions for Mojo docs.
 */

export const scripts = `
(function() {
  'use strict';

  // ============================================================================
  // Theme Toggle with Animation
  // ============================================================================

  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;

  // Load saved theme or detect system preference (default to dark)
  const savedTheme = localStorage.getItem('mojodoc-theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemDark ? 'dark' : 'dark'); // Default dark
  html.setAttribute('data-theme', initialTheme);

  themeToggle?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';

    // Add transition class for smooth theme change
    html.classList.add('theme-transitioning');
    html.setAttribute('data-theme', next);
    localStorage.setItem('mojodoc-theme', next);

    setTimeout(() => {
      html.classList.remove('theme-transitioning');
    }, 300);
  });

  // ============================================================================
  // Sidebar Toggle with Smooth Animation
  // ============================================================================

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    document.body.classList.toggle('sidebar-open');
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !sidebarToggle?.contains(e.target)) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  });

  // ============================================================================
  // Search with Keyboard Navigation
  // ============================================================================

  const searchTrigger = document.getElementById('search-trigger');
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchIndex = window.SEARCH_INDEX?.items || [];

  let selectedIndex = -1;

  function openSearch() {
    searchModal?.removeAttribute('hidden');
    searchInput?.focus();
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => {
      searchModal?.querySelector('.search-dialog')?.classList.add('animate-in');
    });
  }

  function closeSearch() {
    const dialog = searchModal?.querySelector('.search-dialog');
    dialog?.classList.remove('animate-in');
    dialog?.classList.add('animate-out');

    setTimeout(() => {
      searchModal?.setAttribute('hidden', '');
      dialog?.classList.remove('animate-out');
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '';
      selectedIndex = -1;
      document.body.style.overflow = '';
    }, 150);
  }

  function search(query) {
    if (!query.trim()) {
      searchResults.innerHTML = renderSearchHint();
      selectedIndex = -1;
      return;
    }

    const q = query.toLowerCase();
    const results = searchIndex
      .map(item => {
        let score = 0;
        const nameLower = item.name.toLowerCase();
        const pathLower = item.fullPath.toLowerCase();

        // Exact name match
        if (nameLower === q) score += 100;
        // Name starts with query
        else if (nameLower.startsWith(q)) score += 50;
        // Name contains query
        else if (nameLower.includes(q)) score += 25;
        // Path contains query
        if (pathLower.includes(q)) score += 10;
        // Summary/signature contains query
        if (item.summary.toLowerCase().includes(q)) score += 5;
        if (item.signature.toLowerCase().includes(q)) score += 5;

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    if (results.length === 0) {
      searchResults.innerHTML = \`
        <div class="search-empty">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
          <div>No results found for "<strong>\${escapeHtml(query)}</strong>"</div>
          <div style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.6;">Try a different search term</div>
        </div>\`;
      selectedIndex = -1;
      return;
    }

    const baseUrl = window.BASE_URL || '/';
    searchResults.innerHTML = results.map((item, idx) => \`
      <a href="\${baseUrl}\${item.urlPath}/index.html#\${item.anchor}"
         class="search-result \${idx === selectedIndex ? 'selected' : ''}"
         data-index="\${idx}">
        <div class="search-result-header">
          <span class="kind-badge \${item.kind}">\${kindLabel(item.kind)}</span>
          <span class="search-result-name">\${highlightMatch(item.name, query)}</span>
        </div>
        <div class="search-result-path">\${escapeHtml(item.fullPath)}</div>
        \${item.summary ? \`<div class="search-result-summary">\${escapeHtml(item.summary)}</div>\` : ''}
      </a>
    \`).join('');

    selectedIndex = 0;
    updateSelection();
  }

  function renderSearchHint() {
    return \`
      <div class="search-hint" style="padding: 2rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 1rem; margin-bottom: 1rem;">Search for functions, structs, traits...</div>
        <div style="display: flex; gap: 1rem; justify-content: center; font-size: 0.8rem;">
          <span><kbd style="background: var(--bg-raised); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">↑↓</kbd> Navigate</span>
          <span><kbd style="background: var(--bg-raised); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">↵</kbd> Select</span>
          <span><kbd style="background: var(--bg-raised); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-subtle);">esc</kbd> Close</span>
        </div>
      </div>
    \`;
  }

  function kindLabel(kind) {
    const labels = {
      function: 'fn',
      struct: 'st',
      trait: 'tr',
      alias: 'al',
      field: 'fd',
      method: 'fn'
    };
    return labels[kind] || kind.slice(0, 2);
  }

  function highlightMatch(text, query) {
    const escaped = escapeHtml(text);
    const queryEscaped = escapeHtml(query);
    const regex = new RegExp('(' + queryEscaped.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi');
    return escaped.replace(regex, '<mark style="background: rgba(255, 107, 53, 0.3); color: inherit; border-radius: 2px; padding: 0 2px;">$1</mark>');
  }

  function updateSelection() {
    const items = searchResults.querySelectorAll('.search-result');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === selectedIndex);
    });

    // Scroll into view
    const selected = items[selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function navigateResults(direction) {
    const items = searchResults.querySelectorAll('.search-result');
    if (items.length === 0) return;

    selectedIndex += direction;
    if (selectedIndex < 0) selectedIndex = items.length - 1;
    if (selectedIndex >= items.length) selectedIndex = 0;

    updateSelection();
  }

  function selectResult() {
    const items = searchResults.querySelectorAll('.search-result');
    const selected = items[selectedIndex];
    if (selected) {
      closeSearch();
      window.location.href = selected.href;
    }
  }

  searchTrigger?.addEventListener('click', openSearch);

  searchModal?.querySelector('.search-backdrop')?.addEventListener('click', closeSearch);

  searchInput?.addEventListener('input', (e) => {
    search(e.target.value);
  });

  searchInput?.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Escape':
        closeSearch();
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateResults(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        navigateResults(-1);
        break;
      case 'Enter':
        e.preventDefault();
        selectResult();
        break;
    }
  });

  // Keyboard shortcut: Cmd/Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (searchModal?.hasAttribute('hidden')) {
        openSearch();
      } else {
        closeSearch();
      }
    }

    // Also support "/" to open search
    if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
      e.preventDefault();
      openSearch();
    }
  });

  // ============================================================================
  // Copy Buttons with Toast Feedback
  // ============================================================================

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.style.cssText = \`
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: var(--bg-elevated);
        border: 1px solid var(--border-default);
        color: var(--text-primary);
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 0.9rem;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      \`;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(100px)';
      toast.style.opacity = '0';
    }, 2000);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;

    const text = btn.dataset.copy;
    navigator.clipboard.writeText(text).then(() => {
      // Visual feedback on button
      const originalHTML = btn.innerHTML;
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
      btn.style.borderColor = '#22c55e';

      showToast('✓ Copied to clipboard');

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.borderColor = '';
      }, 2000);
    });
  });

  // ============================================================================
  // Sidebar: grouped public-API item list + scroll-spy on module pages
  // ============================================================================

  function buildSidebarKinds() {
    const kindsPanel = document.getElementById('sidebar-kinds');
    if (!kindsPanel) return;
    const content = document.querySelector('.content');
    if (!content) return;

    // Package-index pages have re-export overview tables; module pages have
    // .doc-item sections. Use different strategies for each.
    if (content.querySelector('.re-export-table')) {
      buildPublicApiSidebar(kindsPanel, content);
    } else {
      buildModuleDetailSidebar(kindsPanel, content);
    }
  }

  // --------------------------------------------------------------------------
  // Package index: scan all re-export table rows, group by kind, list items
  // --------------------------------------------------------------------------
  function buildPublicApiSidebar(kindsPanel, content) {
    const KIND_ORDER = ['function', 'struct', 'trait', 'alias'];
    const KIND_ICONS  = { function: 'fn', struct: 'st', trait: 'tr', alias: 'al' };
    const KIND_LABELS = { function: 'Functions', struct: 'Structs', trait: 'Traits', alias: 'Aliases' };

    const groups = {};
    content.querySelectorAll('.re-export-table tbody tr').forEach(row => {
      const badge = row.querySelector('.kind-badge');
      const link  = row.querySelector('.ov-link');
      if (!link) return;
      let kind = 'function';
      if (badge) {
        const k = [...badge.classList].find(c => c !== 'kind-badge');
        if (k) kind = k;
      }
      if (!groups[kind]) groups[kind] = [];
      groups[kind].push({ name: link.textContent.trim(), href: link.getAttribute('href') });
    });

    const total = Object.values(groups).reduce((s, arr) => s + arr.length, 0);
    if (total === 0) { kindsPanel.style.display = 'none'; return; }

    let html = '<div class="sidebar-kind-header">On this page</div><ul class="sidebar-kind-list">';
    KIND_ORDER.forEach(kind => {
      const items = groups[kind];
      if (!items || items.length === 0) return;
      html += \`
        <li class="sidebar-group">
          <div class="sidebar-group-label">
            <span class="sidebar-kind-icon">\${KIND_ICONS[kind] || '§'}</span>
            <span class="sidebar-kind-label">\${KIND_LABELS[kind] || kind}</span>
            <span class="sidebar-kind-count">\${items.length}</span>
          </div>
          <ul class="sidebar-item-list">
            \${items.map(item => \`<li><a href="\${escapeHtml(item.href)}" class="sidebar-item-link">\${escapeHtml(item.name)}</a></li>\`).join('')}
          </ul>
        </li>\`;
    });
    html += '</ul>';
    kindsPanel.innerHTML = html;
  }

  // --------------------------------------------------------------------------
  // Module detail: section-level links with individual item anchors beneath
  // --------------------------------------------------------------------------
  function buildModuleDetailSidebar(kindsPanel, content) {
    const docSections = Array.from(content.querySelectorAll('.doc-section[id]'));
    if (docSections.length === 0) { kindsPanel.style.display = 'none'; return; }

    const links = [];
    docSections.forEach(section => {
      const id = section.id;
      if (!id) return;
      const h2 = section.querySelector('h2.section-title');
      const label = h2?.textContent?.trim() || idToLabel(id);
      const icon  = kindIcon(label);
      const items = Array.from(section.querySelectorAll('.doc-item[id]')).map(el => ({
        name:   el.querySelector('.item-name')?.textContent?.trim() || el.id,
        anchor: el.id,
      }));
      links.push({ id, label, icon, el: section, items });
    });

    if (links.length === 0) { kindsPanel.style.display = 'none'; return; }

    let html = '<div class="sidebar-kind-header">On this page</div><ul class="sidebar-kind-list">';
    links.forEach(l => {
      if (l.items.length > 0) {
        html += \`
          <li class="sidebar-group">
            <a href="#\${l.id}" class="sidebar-group-label sidebar-kind-link" data-section-id="\${l.id}">
              <span class="sidebar-kind-icon">\${l.icon}</span>
              <span class="sidebar-kind-label">\${escapeHtml(l.label)}</span>
              <span class="sidebar-kind-count">\${l.items.length}</span>
            </a>
            <ul class="sidebar-item-list">
              \${l.items.map(item => \`<li><a href="#\${item.anchor}" class="sidebar-item-link">\${escapeHtml(item.name)}</a></li>\`).join('')}
            </ul>
          </li>\`;
      } else {
        html += \`
          <li>
            <a href="#\${l.id}" class="sidebar-kind-link" data-section-id="\${l.id}">
              <span class="sidebar-kind-icon">\${l.icon}</span>
              <span class="sidebar-kind-label">\${escapeHtml(l.label)}</span>
            </a>
          </li>\`;
      }
    });
    html += '</ul>';
    kindsPanel.innerHTML = html;

    // Smooth scroll for all sidebar links
    kindsPanel.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
        }
      });
    });

    // Scroll-spy: highlight the section whose .doc-item is visible
    if ('IntersectionObserver' in window) {
      const visibleSections = new Set();
      const spyObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visibleSections.add(entry.target.id);
          else visibleSections.delete(entry.target.id);
        });
        let activeSection = null;
        for (const l of links) {
          if (visibleSections.has(l.id)) { activeSection = l.id; break; }
        }
        kindsPanel.querySelectorAll('.sidebar-kind-link').forEach(a => {
          a.classList.toggle('active', a.dataset.sectionId === activeSection);
        });
      }, { root: null, rootMargin: '-10% 0px -60% 0px', threshold: 0 });
      links.forEach(l => { if (l.el) spyObserver.observe(l.el); });
    }
  }

  function idToLabel(id) {
    // Convert kebab/slug id to a readable label: "re-exports" → "Re-exports"
    return id.replace(/-/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }

  function kindIcon(label) {
    const l = label.toLowerCase();
    if (l === 'api' || l.includes('re-export') || l.includes('export')) return 'api';
    if (l.includes('function')) return 'fn';
    if (l.includes('struct')) return 'st';
    if (l.includes('trait')) return 'tr';
    if (l.includes('constant') || l.includes('alias')) return 'al';
    if (l.includes('module') || l.includes('subpackage')) return 'mod';
    return '§';
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildSidebarKinds);
  } else {
    buildSidebarKinds();
  }

  // ============================================================================
  // Scroll Progress Indicator
  // ============================================================================

  function updateScrollProgress() {
    const scrolled = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? (scrolled / height) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', progress + '%');
  }

  // Only add scroll progress if page is long enough
  if (document.documentElement.scrollHeight > window.innerHeight * 1.5) {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = \`
      position: fixed;
      top: var(--header-height);
      left: 0;
      height: 2px;
      background: var(--gradient-fire);
      width: var(--scroll-progress, 0%);
      z-index: 99;
      transition: width 0.1s linear;
    \`;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();
  }

  // ============================================================================
  // Intersection Observer for Fade-In Animations
  // ============================================================================

  // Only apply fade-in if not already scrolled down and no hash anchor target
  if (window.scrollY < 100 && !window.location.hash) {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -30px 0px',
      threshold: 0.05
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          fadeInObserver.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe doc items for fade-in (with a slight delay to ensure DOM is ready)
    requestAnimationFrame(() => {
      document.querySelectorAll('.doc-item, .module-card').forEach((item, idx) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(16px)';
        item.style.transition = \`opacity 0.3s ease-out \${idx * 0.03}s, transform 0.3s ease-out \${idx * 0.03}s\`;
        fadeInObserver.observe(item);
      });
    });
  }

  // ============================================================================
  // Anchor Link Smooth Scroll
  // ============================================================================

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // Flash highlight on target
        target.style.transition = 'box-shadow 0.3s ease-out';
        target.style.boxShadow = '0 0 0 2px var(--ember)';
        setTimeout(() => {
          target.style.boxShadow = '';
        }, 1500);
      }
    });
  });

  // ============================================================================
  // Utility Functions
  // ============================================================================

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================================
  // Initialize
  // ============================================================================

  console.log('%c🔥 mojodoc', 'font-size: 24px; font-weight: bold; color: #ff6b35;');
  console.log('%cWorld-class documentation for Mojo', 'font-size: 12px; color: #888;');

})();
`;
