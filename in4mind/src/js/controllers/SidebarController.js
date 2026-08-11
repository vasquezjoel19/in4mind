/**
 * IN4MIND — SidebarController
 * Sidebar colapsable (navbar de iconos) en escritorio + drawer en móvil.
 * Adaptado a pantalla dividida (Snap / ventanas estrechas).
 */

'use strict';

const SidebarController = (() => {

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : '';
  }

  const STORAGE_KEY = 'in4mind_sidebar_collapsed';
  const DESKTOP_BP  = '(min-width: 901px)';
  const COMPACT_MAX = 1280;

  const NAV_ROUTES = {
    home:      'dashboard.html',
    tutorials: 'tutorial.html',
    notes:     'notes.html',
    projects:  'projects.html',
    guided:    'guided-projects.html',
    quizzes:   'quizzes.html',
    ai:        'ai.html',
  };

  let _desktopMq;
  let _coreBound = false;
  let _userPinnedExpanded = false;
  let _resizeTimer = null;

  function _isDesktop() {
    return _desktopMq?.matches ?? window.innerWidth > 900;
  }

  function _isCompactDesktop() {
    const w = window.innerWidth;
    return w > 900 && w <= COMPACT_MAX;
  }

  function _isCollapsed() {
    return document.documentElement.classList.contains('sidebar-collapsed');
  }

  function _navHref(el) {
    if (!el) return '';
    return el.getAttribute('href') || el.dataset.href || NAV_ROUTES[el.dataset.nav] || '';
  }

  function _syncNavLabels() {
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.label) return;
      const label = el.querySelector('span')?.textContent?.trim();
      if (label) el.dataset.label = label;
    });
  }

  function _updateToggleUi(collapsed) {
    const btn = document.getElementById('sidebar-collapse');
    if (btn) {
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.setAttribute('aria-label', collapsed ? _t('shell.expandMenu') : _t('shell.collapseMenu'));
    }
  }

  function _setCompactViewClass() {
    document.documentElement.classList.toggle('compact-view', _isCompactDesktop());
  }

  function _applyCollapsed(collapsed, { persist = true } = {}) {
    if (!_isDesktop()) {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.getElementById('sidebar')?.classList.remove('sidebar--collapsed');
      return;
    }

    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    document.getElementById('sidebar')?.classList.toggle('sidebar--collapsed', collapsed);
    _updateToggleUi(collapsed);

    if (persist && !_isCompactDesktop()) {
      try {
        localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
      } catch (_) { /* ignore */ }
    }
  }

  function _restoreFromStorage() {
    try {
      if (_isDesktop() && localStorage.getItem(STORAGE_KEY) === '1') {
        _applyCollapsed(true, { persist: false });
      }
    } catch (_) { /* ignore */ }
  }

  function _syncLayoutForViewport() {
    _setCompactViewClass();

    if (!_isDesktop()) {
      closeMobile();
      return;
    }

    closeMobile();

    if (_isCompactDesktop()) {
      if (!_userPinnedExpanded && !_isCollapsed()) {
        _applyCollapsed(true, { persist: false });
      }
    } else {
      _userPinnedExpanded = false;
      _restoreFromStorage();
    }

    _updateToggleUi(_isCollapsed());
  }

  function toggleCollapse() {
    if (!_isDesktop()) return;

    const willExpand = _isCollapsed();

    if (_isCompactDesktop()) {
      _userPinnedExpanded = willExpand;
      _applyCollapsed(!willExpand, { persist: false });
    } else {
      _applyCollapsed(!_isCollapsed(), { persist: true });
    }
  }

  function openMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggle  = document.getElementById('menu-toggle');
    sidebar?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggle  = document.getElementById('menu-toggle');
    sidebar?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function _onBreakpointChange(e) {
    if (e.matches) {
      _syncLayoutForViewport();
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.documentElement.classList.remove('compact-view');
      document.getElementById('sidebar')?.classList.remove('sidebar--collapsed');
      _userPinnedExpanded = false;
      closeMobile();
    }
  }

  function _onResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_syncLayoutForViewport, 120);
  }

  function _bindCoreOnce() {
    if (_coreBound) return;
    _coreBound = true;

    document.getElementById('sidebar-collapse')?.addEventListener('click', toggleCollapse);
    document.getElementById('menu-toggle')?.addEventListener('click', openMobile);
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobile);

    _desktopMq.addEventListener('change', _onBreakpointChange);
    window.addEventListener('resize', _onResize);
  }

  function _setupNavDelegation() {
    if (document.documentElement.dataset.navBound === '1') return;
    document.documentElement.dataset.navBound = '1';

    document.addEventListener('click', e => {
      const item = e.target.closest('#sidebar a.nav-item[href], #sidebar .nav-item[data-href], #sidebar .nav-item[data-nav]');
      if (!item) return;

      if (item.dataset.nav === 'settings') return;

      const href = _navHref(item);
      if (!href) return;

      e.preventDefault();
      if (!_isDesktop()) closeMobile();
      if (typeof AppShell !== 'undefined' && AppShell.navigateTo) {
        AppShell.navigateTo(href);
      } else {
        window.location.href = href;
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('#sidebar a.nav-item[href], #sidebar .nav-item[data-href], #sidebar .nav-item[data-nav]');
      if (!item) return;

      if (item.dataset.nav === 'settings') return;

      const href = _navHref(item);
      if (!href) return;

      e.preventDefault();
      if (!_isDesktop()) closeMobile();
      if (typeof AppShell !== 'undefined' && AppShell.navigateTo) {
        AppShell.navigateTo(href);
      } else {
        window.location.href = href;
      }
    });
  }

  function init() {
    _desktopMq = window.matchMedia(DESKTOP_BP);
    closeMobile();
    _syncNavLabels();
    _syncLayoutForViewport();
    _bindCoreOnce();
    _setupNavDelegation();
  }

  // Estado inicial antes de pintar (script al final del body)
  try {
    const w = window.innerWidth;
    if (w > 900 && w <= COMPACT_MAX) {
      document.documentElement.classList.add('sidebar-collapsed', 'compact-view');
    } else if (w > COMPACT_MAX && localStorage.getItem(STORAGE_KEY) === '1') {
      document.documentElement.classList.add('sidebar-collapsed');
    }
  } catch (_) { /* ignore */ }

  return { init, toggleCollapse, openMobile, closeMobile, isCollapsed: _isCollapsed };

})();

if (typeof module !== 'undefined') module.exports = SidebarController;
