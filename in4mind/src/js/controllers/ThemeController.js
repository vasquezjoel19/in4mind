/**
 * IN4MIND — ThemeController
 * Modo oscuro global con persistencia y botón en todas las vistas.
 */

'use strict';

const ThemeController = (() => {

  const STORAGE_KEY = 'in4mind_theme';

  const MOUNT_SLOTS = [
    { selector: '.topbar__actions',     before: '.avatar, #avatar' },
    { selector: '.ai-topbar__actions',  before: '.avatar, #avatar' },
    { selector: '.auth-topbar__actions', before: '.auth-btn-home' },
    { selector: '.lp-header__actions',  before: '.lp-btn--primary' },
    { selector: '.legal-header__actions', before: '.legal-btn-back' },
  ];

  function _resolveTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function _updateToggleUi(isDark) {
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(isDark));
      btn.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
      btn.title = isDark ? 'Modo claro' : 'Modo oscuro';
    });
  }

  function applyTheme(theme, { persist = true } = {}) {
    const isDark = theme === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (persist) localStorage.setItem(STORAGE_KEY, theme);
    _updateToggleUi(isDark);
  }

  function toggle() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function _withTransition(fn) {
    document.documentElement.classList.add('theme-transition');
    fn();
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 320);
  }

  function _createToggle(variant) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `theme-toggle theme-toggle--${variant}`;
    btn.setAttribute('data-theme-toggle', '');
    btn.innerHTML = `
      <span class="theme-toggle__icons" aria-hidden="true">
        <svg class="theme-toggle__sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="theme-toggle__moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </span>
    `;
    btn.addEventListener('click', () => _withTransition(toggle));
    return btn;
  }

  function mount() {
    MOUNT_SLOTS.forEach(({ selector, before }) => {
      const container = document.querySelector(selector);
      if (!container || container.querySelector('[data-theme-toggle]')) return;

      const variant = selector.includes('lp-header') ? 'landing'
        : selector.includes('auth') ? 'auth'
        : selector.includes('legal') ? 'auth'
        : 'app';

      const toggleBtn = _createToggle(variant);
      const ref = container.querySelector(before);
      if (ref) container.insertBefore(toggleBtn, ref);
      else container.appendChild(toggleBtn);
    });

    _updateToggleUi(getTheme() === 'dark');
  }

  /** Llamar en <head> antes del paint para evitar flash. */
  function initEarly() {
    const theme = _resolveTheme();
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  function init() {
    mount();
  }

  return { initEarly, init, toggle, applyTheme, getTheme };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeController.init());
  } else {
    ThemeController.init();
  }
}
