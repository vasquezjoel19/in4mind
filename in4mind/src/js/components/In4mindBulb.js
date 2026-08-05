'use strict';

/**
 * IN4MIND — Logo oficial: foco line-art con circuito interior y rosca.
 *
 * Todo el trazo usa `currentColor`, así que las tres variantes de marca
 * (navy sobre claro, blanco sobre oscuro, negro sobre blanco) salen sólo con
 * cambiar `color` en CSS; no hay que mantener copias del SVG.
 */
const In4mindBulb = (() => {

  let _uid = 0;
  function _gid() {
    _uid += 1;
    return `in4b${_uid}`;
  }

  /** Nodos del circuito (centros). */
  const NODES = [
    { cx: 33, cy: 30 },
    { cx: 49, cy: 26 },
    { cx: 56, cy: 43 },
    { cx: 30, cy: 47 },
  ];

  /**
   * viewBox 80×100 — cristal cerrado, circuito de 4 nodos y rosca de 3 bandas.
   * `id` se acepta por firma estable aunque este trazo no necesite <defs>.
   */
  function _mark(id) { // eslint-disable-line no-unused-vars
    return `
      <g class="in4mind-bulb__mark" fill="none" stroke="currentColor"
         stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round">

        <!-- Cristal: casquete circular + hombros que cierran en el cuello -->
        <path class="in4mind-bulb__glass"
              d="M30 70V66c0-4-3-7-5.5-9.5A26 26 0 1 1 55.5 56.5C53 59 50 62 50 66v4Z"/>

        <!-- Circuito -->
        <path class="in4mind-bulb__trace" d="M14.5 41.5H24.5L33 30"/>
        <path class="in4mind-bulb__trace" d="M49 26L30 47"/>
        <path class="in4mind-bulb__trace" d="M56 43L46 54V70"/>

        ${NODES.map(n => `<circle class="in4mind-bulb__node" cx="${n.cx}" cy="${n.cy}" r="3.6"/>`).join('\n        ')}

        <!-- Rosca: tres bandas y contacto inferior -->
        <path class="in4mind-bulb__base" d="M28.5 75.5H51.5"/>
        <path class="in4mind-bulb__base" d="M29.5 82H50.5"/>
        <path class="in4mind-bulb__base" d="M31.5 88.5H48.5"/>
        <path class="in4mind-bulb__base" d="M35.5 93.5q4.5 4 9 0"/>
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
