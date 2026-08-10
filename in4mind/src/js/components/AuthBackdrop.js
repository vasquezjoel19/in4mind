'use strict';

/**
 * IN4MIND — Fondo animado de la pantalla de acceso.
 *
 * Dibuja una cinta de líneas paralelas que se pliega sobre sí misma y ondula
 * muy despacio, al estilo del hero de Stripe, teñida con el degradado de marca
 * (teal del logo → azul IN4MIND).
 *
 * Sigue el tema activo: cada uno lleva su paleta y su forma de componer, porque
 * lo que hace visible el pliegue es lo contrario en fondo claro y en oscuro.
 */
const AuthBackdrop = (() => {

  /** Paleta y composición por tema, de un borde de la cinta al opuesto. */
  const THEMES = {
    /**
     * Sumar luz sobre el navy enciende el pliegue donde las líneas convergen,
     * sin blur ni sombras, que serían mucho más caras por fotograma.
     */
    dark: {
      blend: 'lighter',
      alpha: 0.26,
      stops: [
        [13, 148, 136],
        [32, 178, 170],
        [74, 118, 178],
        [107, 147, 201],
        [147, 180, 217],
      ],
    },
    /**
     * Sobre fondo claro sumar color sólo lo blanquea. Aquí las líneas se apilan
     * en opacidad, así que el pliegue se densifica en vez de encenderse, con
     * tonos más saturados para que contrasten con el degradado claro.
     */
    light: {
      blend: 'source-over',
      alpha: 0.4,
      stops: [
        [13, 148, 136],
        [19, 126, 150],
        [45, 88, 146],
        [64, 105, 163],
        [110, 148, 200],
      ],
    },
  };

  /** Puntos por línea. Suficientes para que la curva se vea continua. */
  const SEGMENTS = 46;

  /** Más allá de 1.5× el coste sube sin diferencia visible en líneas finas. */
  const MAX_DPR = 1.5;

  let _canvas = null;
  let _ctx = null;
  let _raf = 0;
  let _w = 0;
  let _h = 0;
  let _lines = 62;
  let _band = 0;
  let _elapsed = 0;
  let _last = 0;
  let _still = false;
  let _dark = false;

  /** Devuelve true si el tema cambió respecto al último dibujado. */
  function _syncTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (dark === _dark) return false;
    _dark = dark;
    return true;
  }

  function _color(stops, t) {
    const n = stops.length - 1;
    const p = Math.min(Math.max(t, 0), 0.9999) * n;
    const i = Math.floor(p);
    const f = p - i;
    const a = stops[i];
    const b = stops[i + 1];
    return `${Math.round(a[0] + (b[0] - a[0]) * f)},`
         + `${Math.round(a[1] + (b[1] - a[1]) * f)},`
         + `${Math.round(a[2] + (b[2] - a[2]) * f)}`;
  }

  /**
   * Altura de la línea `u` (−0.5 … 0.5 de un borde al otro de la cinta) en la
   * posición horizontal `xn` (0 … 1).
   *
   * `twist` cambia de signo a lo largo del ancho: ahí la cinta se estrangula,
   * las líneas se cruzan y aparece el pliegue luminoso.
   */
  function _y(xn, u, time) {
    const twist = Math.sin(xn * Math.PI * 1.15 - 0.4 + time * 0.13);
    const wave  = Math.sin(xn * Math.PI * 1.7 + time * 0.19) * 0.14
                + Math.sin(xn * Math.PI * 3.1 - time * 0.27) * 0.05;
    return _h * 0.52 + _band * (wave + 0.44 * twist * u);
  }

  function _draw(time) {
    const skin = _dark ? THEMES.dark : THEMES.light;
    _ctx.clearRect(0, 0, _w, _h);
    _ctx.globalCompositeOperation = skin.blend;
    _ctx.lineWidth = 1.1;

    for (let i = 0; i < _lines; i++) {
      const t = i / (_lines - 1);
      const u = t - 0.5;
      _ctx.strokeStyle = `rgba(${_color(skin.stops, t)},${skin.alpha})`;
      _ctx.beginPath();
      for (let s = 0; s <= SEGMENTS; s++) {
        const xn = s / SEGMENTS;
        const y = _y(xn, u, time);
        if (s === 0) _ctx.moveTo(0, y);
        else _ctx.lineTo(xn * _w, y);
      }
      _ctx.stroke();
    }
  }

  function _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const rect = _canvas.getBoundingClientRect();
    _w = Math.max(Math.round(rect.width), 1);
    _h = Math.max(Math.round(rect.height), 1);
    _canvas.width = Math.round(_w * dpr);
    _canvas.height = Math.round(_h * dpr);
    _ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    _lines = _w < 640 ? 34 : (_w < 1100 ? 48 : 62);
    // En viewports altos y estrechos la cinta debe seguir siendo una cinta,
    // no una mancha que ocupe toda la pantalla.
    _band = Math.min(_h, _w * 0.75);
  }

  function _frame(now) {
    if (!_last) _last = now;
    // Un salto grande (pestaña en segundo plano) no debe teletransportar la cinta.
    _elapsed += Math.min((now - _last) / 1000, 0.05);
    _last = now;
    _draw(_elapsed);
    _raf = requestAnimationFrame(_frame);
  }

  function play() {
    if (_raf || _still || !_ctx) return;
    _last = 0;
    _raf = requestAnimationFrame(_frame);
  }

  function stop() {
    if (!_raf) return;
    cancelAnimationFrame(_raf);
    _raf = 0;
  }

  function init(selector = '#auth-bg-canvas') {
    _canvas = document.querySelector(selector);
    if (!_canvas || typeof _canvas.getContext !== 'function') return;
    _ctx = _canvas.getContext('2d');
    if (!_ctx) return;

    _still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    _syncTheme();
    _resize();

    // Si la cinta está animando, el siguiente fotograma ya usa la paleta nueva;
    // con movimiento reducido hay que repintar el único fotograma a mano.
    new MutationObserver(() => {
      if (_syncTheme() && _still) _draw(_elapsed);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let pending = 0;
    window.addEventListener('resize', () => {
      clearTimeout(pending);
      pending = setTimeout(() => {
        _resize();
        if (_still) _draw(0);
      }, 150);
    });

    if (_still) {
      _draw(0);
      return;
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else play();
    });
    play();
  }

  return { init, play, stop };

})();

if (typeof document !== 'undefined') {
  const run = () => AuthBackdrop.init();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}

if (typeof module !== 'undefined') module.exports = AuthBackdrop;
