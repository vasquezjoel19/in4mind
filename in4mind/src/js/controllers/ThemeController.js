/**
 * IN4MIND — ThemeController
 * Tema global (claro / oscuro / sistema).
 * Preferencia: Ajustes → Apariencia, menú Otros, o toggle del header en landing.
 */

'use strict';

const ThemeController = (() => {

  const STORAGE_KEY = 'in4mind_theme';

  function getPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  }

  function _resolveFromPreference(pref) {
    if (pref === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return pref === 'dark' ? 'dark' : 'light';
  }

  function _resolveTheme() {
    return _resolveFromPreference(getPreference());
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function _updateToggleUi(_isDark) {
    /* Sin botón en topbar: el tema se cambia solo en Ajustes → Apariencia. */
  }

  function unmountToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach(el => el.remove());
  }

  function applyTheme(theme, { persist = true } = {}) {
    const resolved = theme === 'system' ? _resolveFromPreference('system') : (theme === 'dark' ? 'dark' : 'light');
    const isDark = resolved === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (persist) localStorage.setItem(STORAGE_KEY, theme === 'system' ? 'system' : resolved);
    _updateToggleUi(isDark);
  }

  function setPreference(pref) {
    const valid = pref === 'dark' || pref === 'light' || pref === 'system' ? pref : 'light';
    localStorage.setItem(STORAGE_KEY, valid);
    _withTransition(() => applyTheme(_resolveFromPreference(valid), { persist: false }));
  }

  function toggle() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function _watchSystemPreference() {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      if (getPreference() === 'system') {
        applyTheme(_resolveFromPreference('system'), { persist: false });
      }
    });
  }

  function _withTransition(fn) {
    document.documentElement.classList.add('theme-transition');
    fn();
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 320);
  }

  function mount() {
    unmountToggles();
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
    _watchSystemPreference();
  }

  return { initEarly, init, mount, unmountToggles, toggle, applyTheme, getTheme, getPreference, setPreference };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeController.init());
  } else {
    ThemeController.init();
  }
}
