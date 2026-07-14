'use strict';

const AccessibilityService = (() => {

  const KEY = 'in4mind_a11y_prefs';

  function _read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _write(prefs) {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function _apply(prefs) {
    if (typeof window.In4mindA11y !== 'undefined') {
      window.In4mindA11y.apply(prefs);
      return;
    }
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

  function getPrefs() {
    const stored = _read();
    const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      largeText: stored.largeText === true,
      highContrast: stored.highContrast === true,
      reduceMotion: stored.reduceMotion === true || (stored.reduceMotion == null && systemReduce),
      fontScale: stored.fontScale || 100,
    };
  }

  function setPref(key, value) {
    const prefs = _read();
    prefs[key] = value;
    _write(prefs);
    _apply(getPrefs());
    window.dispatchEvent(new CustomEvent('in4mind-a11y-updated'));
  }

  function initEarly() {
    if (typeof window.In4mindA11y !== 'undefined') {
      window.In4mindA11y.apply(getPrefs());
      return;
    }
    _apply(getPrefs());
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (_read().reduceMotion == null) _apply(getPrefs());
    });
  }

  function renderPanel(container) {
    if (!container) return;
    const p = getPrefs();
    container.innerHTML = `
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.largeText') : 'Texto grande'}</p>
          <p class="settings-row__hint">${typeof I18n !== 'undefined' ? I18n.t('a11y.largeTextHint') : 'Aumenta el tamaño de fuente global.'}</p>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" id="a11y-large-text" ${p.largeText ? 'checked' : ''}>
          <span class="settings-toggle__track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.highContrast') : 'Alto contraste'}</p>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" id="a11y-high-contrast" ${p.highContrast ? 'checked' : ''}>
          <span class="settings-toggle__track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.reduceMotion') : 'Reducir animaciones'}</p>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" id="a11y-reduce-motion" ${p.reduceMotion ? 'checked' : ''}>
          <span class="settings-toggle__track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.shortcuts') : 'Atajos de teclado'}</p>
          <p class="settings-row__hint">Ctrl+K · ${typeof I18n !== 'undefined' ? I18n.t('search.placeholder') : 'Búsqueda'}</p>
        </div>
      </div>`;

    container.querySelector('#a11y-large-text')?.addEventListener('change', e => setPref('largeText', e.target.checked));
    container.querySelector('#a11y-high-contrast')?.addEventListener('change', e => setPref('highContrast', e.target.checked));
    container.querySelector('#a11y-reduce-motion')?.addEventListener('change', e => setPref('reduceMotion', e.target.checked));
  }

  return { initEarly, getPrefs, setPref, renderPanel };

})();

if (typeof module !== 'undefined') module.exports = AccessibilityService;
