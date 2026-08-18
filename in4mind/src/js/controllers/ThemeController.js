/**
 * IN4MIND — ThemeController
 * Tema global (claro / oscuro / sistema).
 * Preferencia: Ajustes → Apariencia, menú Otros, o toggle sol/luna en topbars.
 */

'use strict';

const ThemeController = (() => {

  const STORAGE_KEY = 'in4mind_theme';
  const EVENT_NAME = 'in4mind-theme-change';
  const TRANSITION_MS = 360;

  let _systemWatchBound = false;
  let _storageWatchBound = false;
  let _uiBound = false;

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

  function _reduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function _t(key, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  function _toggleLabel(isDark) {
    return isDark
      ? _t('theme.light', 'Activar modo claro')
      : _t('theme.dark', 'Activar modo oscuro');
  }

  function _ensureBootStyle() {
    if (document.getElementById('in4mind-theme-boot')) return;
    const style = document.createElement('style');
    style.id = 'in4mind-theme-boot';
    // Fondos críticos antes de que cargue tokens.css (evita flash claro→oscuro).
    style.textContent = 'html,body{background-color:#f0f5fb}'
      + 'html[data-theme="dark"],html[data-theme="dark"] body{background-color:#121a28;color:#e2e8f0}';
    (document.head || document.documentElement).appendChild(style);
  }

  function _applyDom(resolved) {
    const isDark = resolved === 'dark';
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.setAttribute('color-scheme', isDark ? 'dark' : 'light');
  }

  function _emit(preference, theme) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { preference, theme },
    }));
  }

  function _updateToggleUi(isDark) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', _toggleLabel(isDark));
      btn.setAttribute('aria-pressed', String(isDark));
      btn.dataset.theme = isDark ? 'dark' : 'light';
    });
  }

  function _withTransition(fn) {
    if (_reduceMotion()) {
      fn();
      return;
    }
    const root = document.documentElement;
    root.classList.add('theme-transition');
    // Force style flush so the transition class applies before the theme flip.
    void root.offsetWidth;
    fn();
    window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, TRANSITION_MS);
  }

  /**
   * @param {'light'|'dark'|'system'} themeOrPref
   * @param {{ persist?: boolean, animate?: boolean, emit?: boolean }} [opts]
   */
  function applyTheme(themeOrPref, { persist = true, animate = false, emit = true } = {}) {
    const preference = themeOrPref === 'system'
      ? 'system'
      : (themeOrPref === 'dark' ? 'dark' : 'light');
    const resolved = _resolveFromPreference(
      themeOrPref === 'system' ? 'system' : preference
    );

    const run = () => {
      if (persist) {
        localStorage.setItem(STORAGE_KEY, preference === 'system' ? 'system' : resolved);
      }
      _applyDom(resolved);
      _updateToggleUi(resolved === 'dark');
      if (emit) _emit(getPreference(), resolved);
    };

    if (animate) _withTransition(run);
    else run();
  }

  function setPreference(pref) {
    const valid = pref === 'dark' || pref === 'light' || pref === 'system' ? pref : 'light';
    const resolved = _resolveFromPreference(valid);
    const prevResolved = getTheme();
    localStorage.setItem(STORAGE_KEY, valid);
    const run = () => {
      _applyDom(resolved);
      _updateToggleUi(resolved === 'dark');
      _emit(valid, resolved);
    };
    // Sin animación si el tema visual no cambia (p. ej. system → light cuando ya es light).
    if (prevResolved === resolved) run();
    else _withTransition(run);
  }

  function toggle() {
    // Alterna el modo resuelto actual (claro ↔ oscuro) de forma explícita.
    setPreference(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function unmountToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach((el) => el.remove());
  }

  function _toggleMarkup(extraClass) {
    const cls = extraClass ? `theme-toggle ${extraClass}` : 'theme-toggle';
    return `
      <span class="theme-toggle__icons" aria-hidden="true">
        <svg class="theme-toggle__sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="theme-toggle__moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </span>`;
  }

  function _ensureToggle(host, { before, extraClass } = {}) {
    if (!host) return null;
    let btn = host.querySelector(':scope > [data-theme-toggle]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = extraClass ? `theme-toggle ${extraClass}` : 'theme-toggle';
      btn.setAttribute('data-theme-toggle', '1');
      btn.innerHTML = _toggleMarkup();
      if (before && before.parentNode === host) host.insertBefore(btn, before);
      else host.insertBefore(btn, host.firstChild);
    } else if (extraClass && !btn.classList.contains(extraClass.split(' ')[0])) {
      extraClass.split(/\s+/).filter(Boolean).forEach((c) => btn.classList.add(c));
    }
    return btn;
  }

  function _bindUiOnce() {
    if (_uiBound) return;
    _uiBound = true;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      e.preventDefault();
      toggle();
    });
    window.addEventListener(EVENT_NAME, () => {
      _updateToggleUi(getTheme() === 'dark');
    });
    window.addEventListener('in4mind-locale-change', () => {
      _updateToggleUi(getTheme() === 'dark');
    });
    window.addEventListener('in4mind-relocalize', () => {
      _updateToggleUi(getTheme() === 'dark');
    });
  }

  function mount() {
    _bindUiOnce();

    const topbarActions = document.querySelector('.topbar__actions');
    if (topbarActions) {
      const before = topbarActions.querySelector('.avatar, #avatar, [data-notifications-btn], a.icon-btn');
      _ensureToggle(topbarActions, { before: before || null });
    }

    const aiActions = document.querySelector('.ai-topbar__actions');
    if (aiActions) {
      const before = aiActions.querySelector('.avatar, #avatar');
      _ensureToggle(aiActions, { before: before || null });
    }

    const authActions = document.querySelector('.auth-topbar__actions');
    if (authActions) {
      _ensureToggle(authActions, { extraClass: 'theme-toggle--auth' });
    }

    const lpActions = document.querySelector('.lp-header__actions');
    if (lpActions) {
      // Remove legacy landing-only toggle if present.
      lpActions.querySelectorAll('[data-lp-theme]').forEach((el) => el.remove());
      const before = lpActions.querySelector('.lp-btn--primary');
      _ensureToggle(lpActions, { before: before || null, extraClass: 'theme-toggle--landing' });
    }

    _updateToggleUi(getTheme() === 'dark');
  }

  function _watchSystemPreference() {
    if (_systemWatchBound) return;
    _systemWatchBound = true;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getPreference() === 'system') {
        applyTheme('system', { persist: false, animate: true, emit: true });
      }
    };
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onChange);
  }

  function _watchStorage() {
    if (_storageWatchBound) return;
    _storageWatchBound = true;
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      const resolved = _resolveTheme();
      if (getTheme() === resolved) {
        _updateToggleUi(resolved === 'dark');
        _emit(getPreference(), resolved);
        return;
      }
      _withTransition(() => {
        _applyDom(resolved);
        _updateToggleUi(resolved === 'dark');
        _emit(getPreference(), resolved);
      });
    });
  }

  /** Llamar en <head> antes del paint para evitar flash. */
  function initEarly() {
    _ensureBootStyle();
    const theme = _resolveTheme();
    _applyDom(theme);
  }

  function init() {
    applyTheme(_resolveTheme(), { persist: false, animate: false, emit: false });
    mount();
    _watchSystemPreference();
    _watchStorage();
    // Emit once so Settings/Other can sync if already open.
    _emit(getPreference(), getTheme());
  }

  return {
    initEarly,
    init,
    mount,
    unmountToggles,
    toggle,
    applyTheme,
    getTheme,
    getPreference,
    setPreference,
  };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeController.init());
  } else {
    ThemeController.init();
  }
}
