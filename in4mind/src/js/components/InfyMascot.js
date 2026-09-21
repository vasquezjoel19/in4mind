/**
 * IN4MIND — Infy, la mascota del asistente.
 *
 * Pone cara al asistente y, de paso, comunica en qué está: pensando mientras
 * espera a Groq, contento al responder, extrañado si algo falla. Es el mismo
 * estado que ya refleja el indicador de "escribiendo", pero legible de un
 * vistazo y sin leer texto.
 *
 * Cómo se entera del estado: escuchando `in4mind-ai-state`. Ni el chat ni el
 * motor adaptativo llaman a este archivo — solo anuncian en qué punto están.
 * Si la mascota no está cargada, no la escucha nadie y no cambia nada.
 *
 * Los dibujos son WebP con transparencia (unos 19 KB cada uno) y se precargan
 * la primera vez que hace falta cambiar de gesto, para que el cambio no
 * parpadee la primera vez.
 */

'use strict';

const InfyMascot = (() => {

  const RUTA = 'src/img/mascot/';

  /**
   * Gesto por estado.
   *
   * `error` debería usar el gesto "sorprendido", que no está entre los
   * archivos entregados; mientras tanto reutiliza "pensando", que es el más
   * cercano. Cuando exista el dibujo, basta con cambiar esta línea.
   */
  const GESTOS = {
    idle: 'infy-feliz.webp',
    thinking: 'infy-pensando.webp',
    success: 'infy-motivado.webp',
    error: 'infy-pensando.webp',
    teaching: 'infy-enfocado.webp',
  };

  /** Cuánto dura el gesto de celebración antes de volver a la calma. */
  const CELEBRACION_MS = 1600;

  let _img = null;
  let _volver = 0;
  let _precargado = false;

  function _t(key, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  function _precargar() {
    if (_precargado) return;
    _precargado = true;
    for (const archivo of new Set(Object.values(GESTOS))) {
      const img = new Image();
      img.src = RUTA + archivo;
    }
  }

  /** Crea la imagen de Infy lista para insertar donde haga falta. */
  function crear(variante = 'header', gesto = 'idle') {
    const img = document.createElement('img');
    img.className = `infy infy--${variante}`;
    img.src = RUTA + (GESTOS[gesto] || GESTOS.idle);
    img.alt = _t('ai.infyAlt', 'Infy, el asistente de IN4MIND');
    img.dataset.gesto = gesto;
    img.width = 120;
    img.height = 120;
    /* La cabecera se pinta en el primer paint: sin `eager` la mascota entra
       tarde y da un salto. */
    img.loading = 'eager';
    img.decoding = 'async';
    return img;
  }

  /**
   * Cambia el gesto de la mascota de cabecera.
   * @param {'idle'|'thinking'|'success'|'error'|'teaching'} estado
   */
  function setState(estado) {
    if (!_img) return;
    const archivo = GESTOS[estado] || GESTOS.idle;
    _precargar();

    clearTimeout(_volver);
    if (_img.dataset.gesto !== estado) {
      _img.src = RUTA + archivo;
      _img.dataset.gesto = estado;
    }

    // Celebrar es un gesto, no un estado: vuelve solo a la calma.
    if (estado === 'success' || estado === 'error') {
      _volver = setTimeout(() => setState('idle'), CELEBRACION_MS);
    }
  }

  /** Monta la mascota dentro de `host` (la cabecera del chat). */
  function mount(host) {
    if (!host) return null;
    if (_img?.isConnected) return _img;
    _img = crear('header', 'idle');
    host.insertBefore(_img, host.firstChild);
    return _img;
  }

  function init() {
    const host = document.querySelector('[data-infy-slot]');
    if (host) mount(host);

    window.addEventListener('in4mind-ai-state', (e) => {
      const estado = e.detail?.state;
      if (estado) setState(estado);
    });
  }

  return { init, mount, setState, crear, GESTOS, RUTA };

})();

if (typeof window !== 'undefined') {
  const boot = () => InfyMascot.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = InfyMascot;
