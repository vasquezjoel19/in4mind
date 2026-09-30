/**
 * IN4MIND — Repaso espaciado de conceptos (flashcards).
 *
 * Las tarjetas no se inventan: salen de las preguntas del temario, que ya
 * traen enunciado y explicación escritos, y de los consejos de cada lección.
 * Generarlas con IA metería errores en el material de estudio, que es justo
 * donde menos se pueden permitir.
 *
 * El calendario es SM-2 reducido a dos respuestas —la sabía / no la sabía—.
 * El SM-2 original pide una nota del 0 al 5, y pedirle eso a alguien que sólo
 * quiere repasar convierte cada tarjeta en un formulario. Con dos botones se
 * conserva lo que importa: los aciertos separan las revisiones y los fallos
 * las juntan.
 */

'use strict';

const FlashcardService = (() => {

  const KEY = 'in4mind_flashcards';
  const DIA_MS = 86400000;
  const FACILIDAD_INICIAL = 2.5;
  const FACILIDAD_MIN = 1.3;
  const FACILIDAD_MAX = 2.8;

  function _read() {
    if (typeof UserScopedStorage !== 'undefined') {
      return UserScopedStorage.getJson(KEY, {}) || {};
    }
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  }

  function _write(data) {
    if (typeof UserScopedStorage !== 'undefined') {
      UserScopedStorage.setJson(KEY, data);
      return;
    }
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { /* sin almacenamiento: el repaso vale para esta sesión */ }
  }

  /**
   * Baraja de un curso, construida desde el temario.
   *
   * @returns {{id:string, frente:string, dorso:string, modulo:string}[]}
   */
  function baraja(courseId, lessons = []) {
    const cartas = [];
    let def = null;
    try {
      def = typeof CourseCurriculum !== 'undefined'
        ? CourseCurriculum.getQuizDef(courseId) : null;
    } catch { def = null; }

    const secciones = Array.isArray(def?.sections) ? def.sections : [];
    secciones.forEach((sec, i) => {
      const preguntas = Array.isArray(sec?.questions) ? sec.questions : [];
      preguntas.forEach((q, j) => {
        // Sin explicación no hay dorso, y una tarjeta sin respuesta no enseña.
        if (!q?.q || !q?.exp) return;
        cartas.push({
          id: `${courseId}-s${i}-q${j}`,
          frente: q.q,
          dorso: q.exp,
          modulo: sec.title || '',
        });
      });
    });

    // Los consejos de cada lección son concepto puro: buenas tarjetas.
    lessons.forEach((l, i) => {
      if (!l?.tip) return;
      cartas.push({
        id: `${courseId}-tip${i}`,
        frente: l.title,
        dorso: l.tip,
        modulo: l.title,
      });
    });

    return cartas;
  }

  /** Estado guardado de una tarjeta, o uno nuevo si nunca se vio. */
  function estado(courseId, cardId) {
    const data = _read();
    return (data[courseId] || {})[cardId] || {
      repeticiones: 0,
      intervalo: 0,
      facilidad: FACILIDAD_INICIAL,
      proxima: 0,        // 0 = nunca vista, toca ya
      vistas: 0,
      aciertos: 0,
    };
  }

  /** Tarjetas que tocan hoy: las nunca vistas y las ya vencidas. */
  function pendientes(courseId, cartas) {
    const ahora = Date.now();
    return cartas.filter((c) => estado(courseId, c.id).proxima <= ahora);
  }

  /**
   * Anota la respuesta y coloca la tarjeta en el calendario.
   *
   * @param {boolean} acierto la recordaba
   * @returns {{intervalo:number, proxima:number}}
   */
  function responder(courseId, cardId, acierto) {
    const t = estado(courseId, cardId);

    if (!acierto) {
      /* Un fallo devuelve la tarjeta al día siguiente y baja su facilidad: si
         se falla repetidamente, aparece cada vez más seguido. */
      t.repeticiones = 0;
      t.intervalo = 1;
      t.facilidad = Math.max(FACILIDAD_MIN, t.facilidad - 0.2);
    } else {
      t.repeticiones += 1;
      if (t.repeticiones === 1) t.intervalo = 1;
      else if (t.repeticiones === 2) t.intervalo = 6;
      else t.intervalo = Math.round(Math.max(1, t.intervalo) * t.facilidad);
      t.facilidad = Math.min(FACILIDAD_MAX, t.facilidad + 0.1);
      t.aciertos += 1;
    }

    t.vistas += 1;
    t.proxima = Date.now() + t.intervalo * DIA_MS;

    const data = _read();
    data[courseId] = data[courseId] || {};
    data[courseId][cardId] = t;
    _write(data);

    return { intervalo: t.intervalo, proxima: t.proxima };
  }

  /** Precisión de recuerdo del curso, en porcentaje, o null si no hay datos. */
  function precision(courseId) {
    const fichas = Object.values(_read()[courseId] || {});
    const vistas = fichas.reduce((n, t) => n + (t.vistas || 0), 0);
    if (!vistas) return null;
    const aciertos = fichas.reduce((n, t) => n + (t.aciertos || 0), 0);
    return Math.round((aciertos / vistas) * 100);
  }

  /**
   * Cursos con tarjetas ya vencidas, para el aviso de repaso.
   *
   * Sólo mira lo guardado: una baraja que nunca se abrió no reclama nada, que
   * sería avisar de deberes que el alumno no ha puesto.
   */
  function vencidos() {
    const ahora = Date.now();
    const data = _read();
    const salida = [];
    for (const [curso, fichas] of Object.entries(data)) {
      const n = Object.values(fichas)
        .filter((t) => t.proxima && t.proxima <= ahora).length;
      if (n) salida.push({ curso, n });
    }
    return salida;
  }

  return { baraja, estado, pendientes, responder, precision, vencidos };

})();

if (typeof module !== 'undefined') module.exports = FlashcardService;
