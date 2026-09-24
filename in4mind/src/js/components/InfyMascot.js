/**
 * IN4MIND — Infy, la mascota del asistente.
 *
 * Pone cara al asistente y, de paso, comunica en qué está: saludando en
 * reposo, pensando mientras espera a Groq, leyendo cuando hay lección por
 * delante y celebrando al acertar. Es el mismo estado que ya refleja el
 * indicador de "escribiendo", pero legible de un vistazo y sin leer texto.
 *
 * Cómo se entera del estado: escuchando `in4mind-ai-state`. Ni el chat ni el
 * motor adaptativo llaman a este archivo — solo anuncian en qué punto están.
 * Si la mascota no está cargada, no la escucha nadie y no cambia nada.
 *
 * Los dibujos son PNG cuadrados de 256 px con transparencia (unos 14 KB cada
 * uno) y se precargan la primera vez que hace falta cambiar de gesto, para
 * que el relevo no parpadee.
 */

'use strict';

const InfyMascot = (() => {

  const RUTA = 'src/img/infy/';

  /**
   * Gesto por estado.
   *
   * Las claves van en mayúsculas porque así se nombran los estados desde
   * fuera (`setInfyState('THINKING')`); `_normalizar` acepta también las
   * minúsculas que viajan en los eventos `in4mind-ai-state`.
   *
   * `ERROR` debería usar un gesto de extrañeza, que no está entre los
   * archivos entregados; mientras tanto reutiliza `THINKING`, que es el más
   * cercano. Cuando exista el dibujo, basta con cambiar esta línea.
   */
  const GESTOS = {
    IDLE: 'infy-saludo.png',
    THINKING: 'infy-pensando.png',
    LEARNING: 'infy-leyendo.png',
    SUCCESS: 'infy-celebrando.png',
    ERROR: 'infy-pensando.png',
  };

  /** Estados que son un gesto pasajero, no una postura: vuelven solos. */
  const PASAJEROS = ['SUCCESS', 'ERROR'];

  /** Cuánto dura un gesto pasajero antes de volver a la calma. */
  const CELEBRACION_MS = 1600;

  /** Lo que tarda el relevo de imagen en desvanecerse (igual que en el CSS). */
  const RELEVO_MS = 150;

  let _img = null;
  let _volver = 0;
  let _relevo = 0;
  let _precargado = false;

  function _t(key, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  /** `teaching` es como lo llama la nota de refuerzo; aquí es leer. */
  function _normalizar(estado) {
    const clave = String(estado || '').toUpperCase();
    if (clave === 'TEACHING') return 'LEARNING';
    return GESTOS[clave] ? clave : 'IDLE';
  }

  function _precargar() {
    if (_precargado) return;
    _precargado = true;
    for (const archivo of new Set(Object.values(GESTOS))) {
      const img = new Image();
      img.src = RUTA + archivo;
    }
  }

  /**
   * Crea la imagen de Infy lista para insertar donde haga falta.
   * @param {string} variante  sufijo de clase: `header`, `lesson`…
   * @param {string} gesto     estado inicial
   */
  function crear(variante = 'header', gesto = 'IDLE') {
    const clave = _normalizar(gesto);
    const img = document.createElement('img');
    img.className = `infy infy--${variante}`;
    img.src = RUTA + GESTOS[clave];
    img.alt = _t('ai.infyAlt', 'Infy, el asistente de IN4MIND');
    img.dataset.gesto = clave;
    img.width = 256;
    img.height = 256;
    /* La cabecera se pinta en el primer paint: sin `eager` la mascota entra
       tarde y da un salto. */
    img.loading = 'eager';
    img.decoding = 'async';
    return img;
  }

  /**
   * Cambia el gesto de la mascota de cabecera.
   * @param {'IDLE'|'THINKING'|'LEARNING'|'SUCCESS'|'ERROR'} estado
   */
  function setState(estado) {
    if (!_img) return;
    const clave = _normalizar(estado);
    _precargar();

    clearTimeout(_volver);
    if (_img.dataset.gesto !== clave) {
      /* El relevo se desvanece por clase, no por estilo en línea: así la
         duración vive en el CSS y `prefers-reduced-motion` puede anularla. */
      clearTimeout(_relevo);
      _img.classList.add('is-swapping');
      _relevo = setTimeout(() => {
        _img.src = RUTA + GESTOS[clave];
        _img.dataset.gesto = clave;
        _img.classList.remove('is-swapping');
      }, RELEVO_MS);
    }

    if (PASAJEROS.includes(clave)) {
      _volver = setTimeout(() => setState('IDLE'), CELEBRACION_MS);
    }
  }

  /**
   * Monta la mascota dentro de `host` (la cabecera del chat), envuelta en su
   * contenedor circular.
   */
  function mount(host) {
    if (!host) return null;
    if (_img?.isConnected) return _img;

    const caja = document.createElement('div');
    caja.className = 'infy-mascot-container';

    _img = crear('header', 'IDLE');
    _img.id = 'infy-avatar';
    _img.classList.add('infy-avatar-img');

    caja.appendChild(_img);
    host.insertBefore(caja, host.firstChild);
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
  /* Atajo global con el nombre del encargo, para poder marcar el estado desde
     cualquier punto sin tener que conocer el módulo. */
  window.setInfyState = (estado) => InfyMascot.setState(estado);

  const boot = () => InfyMascot.init();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = InfyMascot;
