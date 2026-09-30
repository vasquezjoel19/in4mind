/**
 * IN4MIND — Lectura en voz alta de la lección (Web Speech API).
 *
 * Lee el texto de la pestaña de contenido. No hay descarga ni petición: la voz
 * la pone el sistema operativo, así que funciona sin conexión y sin coste.
 *
 * Dos detalles que el navegador impone y aquí se tratan:
 *
 *  - Chrome corta las locuciones largas alrededor de los quince segundos. Por
 *    eso el texto se trocea en frases y se encadenan: cada trozo entra dentro
 *    del límite y el corte deja de ocurrir.
 *  - `getVoices()` puede llegar vacío en la primera llamada y rellenarse
 *    después, así que se espera a `voiceschanged` antes de elegir voz.
 */

'use strict';

const LessonReader = (() => {

  const LANGS = { es: 'es-ES', en: 'en-US', zh: 'zh-CN' };
  const MAX_TROZO = 180;     // caracteres; por debajo del corte de Chrome

  let _trozos = [];
  let _indice = 0;
  let _leyendo = false;
  let _alCambiar = null;     // (estado) => void

  function soportado() {
    return typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function _idioma() {
    const loc = (typeof I18n !== 'undefined' && I18n.getLocale)
      ? I18n.getLocale() : 'es';
    return LANGS[loc] || LANGS.es;
  }

  /** Voces del sistema, esperando a que el navegador las publique. */
  function _voces() {
    return new Promise((resolve) => {
      const actuales = window.speechSynthesis.getVoices();
      if (actuales.length) { resolve(actuales); return; }
      const alCambiar = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', alCambiar);
        resolve(window.speechSynthesis.getVoices());
      };
      window.speechSynthesis.addEventListener('voiceschanged', alCambiar);
      // Si el navegador no llega a emitirlo, se sigue con lo que haya.
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1200);
    });
  }

  /**
   * Parte el texto en trozos que quepan en una locución.
   *
   * Se corta por final de frase para que la voz respete las pausas; si una
   * frase sola ya pasa del límite, se parte por comas o a lo bruto.
   */
  function trocear(texto) {
    const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpio) return [];

    const frases = limpio.match(/[^.!?…]+[.!?…]*/g) || [limpio];
    const salida = [];
    let actual = '';

    const empujar = (t) => { if (t.trim()) salida.push(t.trim()); };

    for (const frase of frases) {
      if (frase.length > MAX_TROZO) {
        empujar(actual); actual = '';
        for (const parte of frase.split(/,\s*/)) {
          if (parte.length > MAX_TROZO) {
            for (let i = 0; i < parte.length; i += MAX_TROZO) {
              empujar(parte.slice(i, i + MAX_TROZO));
            }
          } else { empujar(parte); }
        }
        continue;
      }
      if ((actual + frase).length > MAX_TROZO) { empujar(actual); actual = frase; }
      else { actual += frase; }
    }
    empujar(actual);
    return salida;
  }

  /** Texto legible de un contenedor, sin lo que no se dice en voz alta. */
  function textoDe(raiz) {
    if (!raiz) return '';
    const copia = raiz.cloneNode(true);
    // Código, botones y controles no se leen: sonarían a ruido.
    copia.querySelectorAll('pre, code, button, textarea, iframe, [aria-hidden="true"], .lw-check')
      .forEach(el => el.remove());
    return copia.textContent || '';
  }

  function _emitir(estado) {
    if (typeof _alCambiar === 'function') {
      try { _alCambiar(estado); } catch { /* quien escucha no puede tumbar la voz */ }
    }
  }

  function parar() {
    _trozos = [];
    _indice = 0;
    if (!_leyendo) return;
    _leyendo = false;
    try { window.speechSynthesis.cancel(); } catch { /* ya estaba parado */ }
    _emitir('parado');
  }

  async function _siguiente(voz) {
    if (!_leyendo) return;
    if (_indice >= _trozos.length) { parar(); _emitir('fin'); return; }

    const u = new SpeechSynthesisUtterance(_trozos[_indice]);
    u.lang = _idioma();
    if (voz) u.voice = voz;
    u.rate = 1;
    u.onend = () => { _indice += 1; void _siguiente(voz); };
    /* Un trozo que falla no debe dejar la lectura colgada: se salta y sigue,
       que es mejor que quedarse callado a mitad de un párrafo. */
    u.onerror = () => { _indice += 1; void _siguiente(voz); };

    try { window.speechSynthesis.speak(u); }
    catch { parar(); }
  }

  /**
   * Lee un texto en voz alta. Si ya estaba leyendo, para.
   *
   * @returns {Promise<boolean>} true si empezó a leer
   */
  async function alternar(texto) {
    if (!soportado()) return false;
    if (_leyendo) { parar(); return false; }

    const trozos = trocear(texto);
    if (!trozos.length) return false;

    _trozos = trozos;
    _indice = 0;
    _leyendo = true;
    _emitir('leyendo');

    const idioma = _idioma();
    const voces = await _voces();
    // Voz del idioma pedido; si no hay, la del navegador por defecto.
    const voz = voces.find(v => v.lang === idioma)
      || voces.find(v => v.lang?.startsWith(idioma.slice(0, 2)))
      || null;

    // `parar()` puede haber entrado mientras se esperaban las voces.
    if (!_leyendo) return false;
    void _siguiente(voz);
    return true;
  }

  function leyendo() { return _leyendo; }

  /** Avisa de los cambios de estado: 'leyendo' | 'parado' | 'fin'. */
  function onCambio(fn) { _alCambiar = fn; }

  if (typeof window !== 'undefined') {
    /* Salir de la página con la voz hablando la deja sonando sobre la
       siguiente pantalla; en algunos navegadores incluso sobrevive al
       historial hacia atrás. */
    window.addEventListener('pagehide', parar);
    window.addEventListener('beforeunload', parar);
  }

  return { soportado, alternar, parar, leyendo, onCambio, trocear, textoDe };

})();

if (typeof module !== 'undefined') module.exports = LessonReader;
