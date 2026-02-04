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

    searchResults.innerHTML = results.map((item, idx) => \`
      <a href="/\${item.urlPath}/index.html#\${item.anchor}"
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
  // Nav Tree Expand/Collapse (Modular-style)
  // ============================================================================

  document.querySelectorAll('.nav-link').forEach(link => {
    const node = link.closest('.nav-node');
    const hasChildren = node?.querySelector('.nav-children') || node?.querySelector('.nav-items');
    const arrow = link.querySelector('.nav-arrow');

    if (hasChildren && arrow) {
      // Make arrow clickable to toggle expand/collapse
      arrow.style.cursor = 'pointer';
      arrow.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        node.classList.toggle('expanded');
      });
    }

    // For package links, clicking expands and navigates
    const isPackage = link.classList.contains('package');
    if (isPackage && hasChildren) {
      link.addEventListener('click', (e) => {
        // If not expanded, prevent navigation and just expand
        if (!node.classList.contains('expanded')) {
          e.preventDefault();
          node.classList.add('expanded');
        }
      });
    }
  });

  // Auto-expand active nodes on page load
  document.querySelectorAll('.nav-node.active').forEach(node => {
    node.classList.add('expanded');
    // Also expand parent nodes
    let parent = node.parentElement?.closest('.nav-node');
    while (parent) {
      parent.classList.add('expanded');
      parent = parent.parentElement?.closest('.nav-node');
    }
  });

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

  // Only apply fade-in if not already scrolled down
  if (window.scrollY < 100) {
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
