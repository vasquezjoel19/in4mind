'use strict';

/**
 * IN4MIND — Logo oficial (imagen de marca).
 *
 * El logo vive como PNG en `src/img/brand/`. En pantalla se pinta con
 * `mask-image` + `background-color: currentColor` (ver `bulb-icon.css`), así que
 * una sola imagen sirve para las tres variantes de marca —navy sobre claro,
 * blanco sobre oscuro, teal de respaldo— sin mantener copias por tema ni idioma.
 */
const In4mindBulb = (() => {

  const BRAND_DIR = 'src/img/brand';
  const FAVICON   = `${BRAND_DIR}/favicon-64.png`;
  const TOUCH_ICON = `${BRAND_DIR}/apple-touch-icon.png`;

  /**
   * Marca como elemento enmascarado. El tamaño viaja en custom properties, no
   * en `width`/`height` en línea, para que cualquier regla CSS del contexto
   * (p. ej. `.ai-welcome__logo .ai-welcome__bulb`) siga teniendo prioridad.
   */
  function _mark(extraClass, w, h) {
    const cls = ['in4mind-bulb', extraClass].filter(Boolean).join(' ');
    const style = (w && h) ? ` style="--bulb-w:${w}px;--bulb-h:${h}px"` : '';
    return `<span class="${cls}"${style} aria-hidden="true"></span>`;
  }

  function large(extraClass = '') {
    return _mark(['in4mind-bulb--lg', extraClass].filter(Boolean).join(' '));
  }

  function medium(extraClass = '') {
    return _mark(['in4mind-bulb--md', extraClass].filter(Boolean).join(' '));
  }

  function small(extraClass = '', w = 28, h = 35) {
    return _mark(['in4mind-bulb--sm', extraClass].filter(Boolean).join(' '), w, h);
  }

  /** Ruta del favicon. Se mantiene el nombre histórico por compatibilidad. */
  function faviconDataUri() {
    return FAVICON;
  }

  /**
   * Sustituye el marcador de cada contexto por la marca.
   * Es idempotente: si ya se montó, no vuelve a tocar el nodo.
   */
  function _replaceMark(selector, factory) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.classList.contains('in4mind-bulb')) return;
      const target = el.tagName.toLowerCase() === 'svg'
        ? el
        : el.querySelector('svg, .in4mind-bulb');
      if (!target || target.classList.contains('in4mind-bulb')) return;
      target.outerHTML = factory();
    });
  }

  function wordmarkHtml() {
    return 'IN<span class="in4mind-wordmark__four">4</span>MIND';
  }

  function _injectWordmark(el) {
    if (el.querySelector('.in4mind-wordmark__four')) return;

    if (el.classList.contains('sidebar__brand-name')) {
      el.innerHTML = wordmarkHtml();
      return;
    }

    for (const node of [...el.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const text = node.textContent.replace(/\s/g, '');
      if (text.toUpperCase() !== 'IN4MIND') continue;
      const wrap = document.createElement('span');
      wrap.className = 'in4mind-wordmark';
      wrap.innerHTML = wordmarkHtml();
      el.replaceChild(wrap, node);
      return;
    }
  }

  function mountWordmarks() {
    document.querySelectorAll('.sidebar__brand-name').forEach(_injectWordmark);
    document.querySelectorAll('.lp-logo, .auth-topbar__brand, .legal-header__brand, .lp-footer__logo, .verify-topbar__brand')
      .forEach(_injectWordmark);
  }

  /** Favicon e icono de pantalla de inicio apuntando a los PNG de marca. */
  function mountIcons() {
    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {
      fav = document.createElement('link');
      fav.rel = 'icon';
      document.head.appendChild(fav);
    }
    fav.type = 'image/png';
    fav.href = FAVICON;

    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const touch = document.createElement('link');
      touch.rel = 'apple-touch-icon';
      touch.href = TOUCH_ICON;
      document.head.appendChild(touch);
    }
  }

  function mount() {
    _replaceMark('.sidebar__brand-icon', () => small('sidebar__brand-icon', 28, 35));
    _replaceMark('.lp-logo__icon', () => small('lp-logo__icon', 34, 42));
    _replaceMark('.auth-topbar__brand svg', () => small('', 28, 35));
    _replaceMark('.legal-header__brand svg', () => small('', 26, 33));
    _replaceMark('.verify-topbar__brand svg', () => small('', 26, 33));
    _replaceMark('.lp-footer__logo svg', () => small('', 28, 35));
    _replaceMark('.lp-loader__icon', () => small('lp-loader__icon', 36, 45));

    _replaceMark('.welcome-section__bulb', () => large('welcome-section__bulb'));
    _replaceMark('.lp-hero-illustration__bulb', () => large('lp-hero-illustration__bulb'));
    _replaceMark('.help-hero__bulb', () => large('help-hero__bulb help-hero__svg'));

    _replaceMark('.auth-panel-left__icon', () => large('auth-panel-left__icon'));
    _replaceMark('.quiz-banner__graphic svg', () => medium('quiz-banner__bulb'));
    _replaceMark('.ai-welcome__bulb', () => small('ai-welcome__bulb', 34, 42));

    mountIcons();
    mountWordmarks();
  }

  return { large, medium, small, faviconDataUri, wordmarkHtml, mountWordmarks, mountIcons, mount };

})();

if (typeof document !== 'undefined') {
  const run = () => { if (typeof In4mindBulb !== 'undefined') In4mindBulb.mount(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}

if (typeof module !== 'undefined') module.exports = In4mindBulb;
