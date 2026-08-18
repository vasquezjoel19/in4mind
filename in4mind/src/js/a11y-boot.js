'use strict';

/**
 * IN4MIND — Aplica preferencias de accesibilidad antes del paint (todas las páginas).
 */
window.In4mindA11y = (() => {

  const KEY = 'in4mind_a11y_prefs';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function getPrefs() {
    const stored = read();
    const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      largeText: stored.largeText === true,
      highContrast: stored.highContrast === true,
      reduceMotion: stored.reduceMotion === true || (stored.reduceMotion == null && systemReduce),
    };
  }

  function apply(prefs = getPrefs()) {
    const root = document.documentElement;
    root.classList.toggle('a11y-large-text', prefs.largeText === true);
    root.classList.toggle('a11y-high-contrast', prefs.highContrast === true);
    root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion === true);
    if (prefs.reduceMotion) {
      root.style.setProperty('--motion-duration', '0.01ms');
    } else {
      root.style.removeProperty('--motion-duration');
    }
  }

  function _skipLabel() {
    if (typeof I18n !== 'undefined') {
      const t = I18n.t('a11y.skipToContent', null, 'Saltar al contenido');
      if (t && t !== 'a11y.skipToContent') return t;
    }
    return 'Saltar al contenido';
  }

  function _injectSkipLink() {
    if (document.querySelector('.skip-link')) return;
    const target = document.getElementById('main')
      || document.querySelector('.main-area')
      || document.querySelector('main')
      || document.querySelector('[role="main"]');
    if (!target) return;
    if (!target.id) target.id = 'main';
    const link = document.createElement('a');
    link.href = `#${target.id}`;
    link.className = 'skip-link';
    link.textContent = _skipLabel();
    document.body.insertBefore(link, document.body.firstChild);
  }

  function init() {
    apply();
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (read().reduceMotion == null) apply();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) apply();
    });
    window.addEventListener('in4mind-a11y-updated', () => apply());
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _injectSkipLink);
    } else {
      _injectSkipLink();
    }
  }

  init();

  // Ocultar páginas protegidas antes del paint si no hay sesión local
  // (AuthGuard en el shell confirma/redirige después).
  try {
    const html = document.documentElement;
    if (html.hasAttribute('data-requires-auth')) {
      const preview = /[?&]preview=1(?:&|$)/.test(location.search || '');
      if (!preview && !sessionStorage.getItem('in4mind_user')) {
        html.style.visibility = 'hidden';
      }
    }
  } catch { /* ignore */ }

  return { KEY, getPrefs, apply };

})();
