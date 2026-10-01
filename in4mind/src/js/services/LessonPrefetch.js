/**
 * IN4MIND — Precarga en segundo plano de lo que hará falta a continuación.
 *
 * Qué NO se precarga, y por qué:
 *
 *  - **El contenido de la lección.** No viaja por red: `CourseCurriculum` y
 *    `TutorialData` son objetos estáticos que ya vienen en el bundle. Pedirlos
 *    a Supabase sería inventarse una petición para luego celebrar haberla
 *    quitado.
 *  - **Las miniaturas de los vídeos.** Son de YouTube. Pedir la de una lección
 *    que quizá no se abra le cuenta a un tercero por dónde va el alumno, y lo
 *    que se gana es una imagen que puede que nadie llegue a ver.
 *
 * Qué sí, porque sí cuesta: el editor del sandbox son ocho ficheros que se
 * cargan EN SERIE la primera vez que alguien abre «Práctica», y el ejecutor es
 * un documento aparte que el iframe pide en ese mismo momento. Traerlos
 * mientras el alumno lee convierte esa espera en nada.
 *
 * Todo va en `requestIdleCallback`, y sólo con conexión que no pida ahorro.
 */

'use strict';

const LessonPrefetch = (() => {

  const CM_BASE = 'src/js/vendor/codemirror/';
  const CM_FICHEROS = [
    'codemirror.min.js',
    'xml.min.js', 'javascript.min.js', 'css.min.js',
    'htmlmixed.min.js', 'python.min.js',
    'closetag.min.js', 'closebrackets.min.js',
  ];
  const RUNNER = 'sandbox-runner.html';

  const _hecho = new Set();
  let _programado = 0;

  const _idle = (cb) => (typeof requestIdleCallback === 'function'
    ? requestIdleCallback(cb, { timeout: 4000 })
    : setTimeout(cb, 1200));

  /** ¿Se puede gastar red ahora mismo? */
  function _conviene() {
    const c = navigator.connection;
    if (!c) return true;
    // Quien pide ahorro de datos no quiere que adivinemos por él.
    if (c.saveData) return false;
    // En 2G, adelantar ocho ficheros compite con lo que de verdad se está leyendo.
    return !/(^|-)2g$/.test(c.effectiveType || '');
  }

  /**
   * Trae un recurso sin ejecutarlo.
   *
   * `fetch` con prioridad baja y no `<link rel=prefetch>`: el enlace deja el
   * recurso en la caché de precarga, que algunos navegadores descartan antes
   * de que se use, y además no avisa de si llegó. Aquí basta con que entre en
   * la caché HTTP, que es de donde lo sacará el `<script>` después.
   */
  function _traer(url) {
    if (_hecho.has(url)) return Promise.resolve();
    _hecho.add(url);
    try {
      return fetch(url, { credentials: 'same-origin', priority: 'low' })
        .then(() => {})
        .catch(() => {});       // precargar es opcional: fallar no se nota
    } catch {
      return Promise.resolve();
    }
  }

  /** Calienta el editor y el ejecutor del sandbox. */
  function sandbox() {
    if (!_conviene()) return;
    _idle(() => {
      void _traer(RUNNER);
      for (const f of CM_FICHEROS) void _traer(CM_BASE + f);
      void _traer(`${CM_BASE}codemirror.css`);
    });
  }

  /** Precarga los gestos de Infy, si no lo hizo ya el propio componente. */
  function infy() {
    if (typeof InfyMascot === 'undefined' || !InfyMascot.GESTOS) return;
    _idle(() => {
      for (const archivo of new Set(Object.values(InfyMascot.GESTOS))) {
        const url = `${InfyMascot.RUTA}${archivo}`;
        if (_hecho.has(url)) continue;
        _hecho.add(url);
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      }
    });
  }

  /**
   * Prepara lo que la siguiente lección necesitará.
   *
   * @param {object} siguiente lección N+1, o `null` si no hay
   * @param {boolean} ejecutable si su curso corre código
   */
  function siguienteLeccion(siguiente, ejecutable) {
    if (!siguiente) return;
    clearTimeout(_programado);
    /* Un poco de espera antes de empezar: si está saltando de lección en
       lección, precargar en cada salto gastaría red para nada. */
    _programado = setTimeout(() => {
      infy();
      if (ejecutable) sandbox();
    }, 1500);
  }

  function olvidar() {
    clearTimeout(_programado);
  }

  return { sandbox, infy, siguienteLeccion, olvidar };

})();

if (typeof module !== 'undefined') module.exports = LessonPrefetch;
