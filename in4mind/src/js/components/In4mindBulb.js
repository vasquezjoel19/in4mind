'use strict';

/**
 * IN4MIND — Logo oficial: foco outline + circuito + base (line-art).
 * Coincide con la marca (trazo uniforme, nodos, rosca). Color vía currentColor.
 */
const In4mindBulb = (() => {

  let _uid = 0;
  function _gid() {
    _uid += 1;
    return `in4b${_uid}`;
  }

  /**
   * viewBox 80×100 — silueta abierta, 3 trazas con nodos, 4 hilos de base.
   * stroke-width relativo al viewBox para que escale limpio.
   */
  function _mark(id) {
    return `
      <g class="in4mind-bulb__mark" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <!-- Cristal (abierto en el cuello) -->
        <path class="in4mind-bulb__glass" d="M24 67C15 59.5 11 49 11 37C11 21.5 22 9.5 40 9.5S69 21.5 69 37c0 12-4 22.5-13 30"/>

        <!-- Trazas / circuito (3 ramas + nodos) -->
        <path class="in4mind-bulb__trace" d="M16.5 39.5H28.5L36 28"/>
        <path class="in4mind-bulb__trace" d="M30.5 43.5L47.5 22.5"/>
        <path class="in4mind-bulb__trace" d="M40 64.5V47.5l10.5-9 5-8"/>

        <circle class="in4mind-bulb__node" cx="36" cy="28" r="3.7" fill="currentColor" stroke="none"/>
        <circle class="in4mind-bulb__node" cx="47.5" cy="22.5" r="3.7" fill="currentColor" stroke="none"/>
        <circle class="in4mind-bulb__node" cx="55.5" cy="30.5" r="3.7" fill="currentColor" stroke="none"/>

        <!-- Base / rosca -->
        <path class="in4mind-bulb__base" d="M26.5 71.5c5.2 2.3 21.8 2.3 27 0"/>
        <path class="in4mind-bulb__base" d="M28.5 77.5c4.6 2 18.4 2 23 0"/>
        <path class="in4mind-bulb__base" d="M31.5 83.5c3.6 1.6 13.4 1.6 17 0"/>
        <path class="in4mind-bulb__base" d="M34.5 89.5c2.6 1.2 8.4 1.2 11 0"/>
      </g>`;
  }

  function _svg(extraClass, w, h) {
    const id = _gid();
    const cls = ['in4mind-bulb', extraClass].filter(Boolean).join(' ');
    const sizeAttrs = w && h ? ` width="${w}" height="${h}"` : '';
    return `<svg class="${cls}"${sizeAttrs} viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${_mark(id)}</svg>`;
  }

  function large(extraClass = '') {
    return _svg(['in4mind-bulb--lg', extraClass].filter(Boolean).join(' '));
  }

  function medium(extraClass = '') {
    return _svg(['in4mind-bulb--md', extraClass].filter(Boolean).join(' '));
  }

  function small(extraClass = '', w = 28, h = 35) {
    return _svg(['in4mind-bulb--sm', extraClass].filter(Boolean).join(' '), w, h);
  }

  function faviconDataUri() {
    const inner = _mark('fav').replace(/currentColor/g, '#1b273c');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 100" fill="none">${inner}</svg>`
      .replace(/\s+/g, ' ')
      .trim();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  function _replaceSvg(selector, factory) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.tagName !== 'svg') {
        const svg = el.querySelector('svg');
        if (svg) svg.outerHTML = factory();
        return;
      }
      el.outerHTML = factory();
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
    document.querySelectorAll('.lp-logo, .auth-topbar__brand, .legal-header__brand, .lp-footer__logo')
      .forEach(_injectWordmark);
  }

  function mount() {
    _uid = 0;
    _replaceSvg('.sidebar__brand-icon', () => small('sidebar__brand-icon', 28, 35));
    _replaceSvg('.lp-logo__icon', () => small('lp-logo__icon', 34, 42));
    _replaceSvg('.auth-topbar__brand svg', () => small('', 28, 35));
    _replaceSvg('.legal-header__brand svg', () => small('', 26, 33));
    _replaceSvg('.lp-footer__logo svg', () => small('', 28, 35));
    _replaceSvg('.lp-loader__icon', () => small('lp-loader__icon', 36, 45));

    _replaceSvg('.welcome-section__bulb', () => large('welcome-section__bulb'));
    _replaceSvg('.lp-hero-illustration__bulb', () => large('lp-hero-illustration__bulb'));
    _replaceSvg('.help-hero__bulb', () => large('help-hero__bulb help-hero__svg'));

    _replaceSvg('.auth-panel-left__icon', () => large('auth-panel-left__icon'));
    _replaceSvg('.quiz-banner__graphic svg', () => medium('quiz-banner__bulb'));
    _replaceSvg('.ai-welcome__bulb', () => small('ai-welcome__bulb', 34, 42));

    const fav = document.querySelector('link[rel="icon"]');
    if (fav) fav.href = faviconDataUri();

    mountWordmarks();
  }

  return { large, medium, small, faviconDataUri, wordmarkHtml, mountWordmarks, mount };

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
