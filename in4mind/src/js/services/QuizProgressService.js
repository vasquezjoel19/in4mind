/**
 * IN4MIND — QuizProgressService
 *
 * Persiste el avance de un quiz *en curso* (no solo el resultado final) para que
 * el usuario pueda cerrar la pestaña o la sesión y retomar donde lo dejó.
 *
 * Se guarda en localStorage y se particiona por usuario, de modo que el progreso
 * sobreviva al cierre de sesión (sessionStorage se limpia en `AppShell.logout`).
 *
 * Cada entrada guarda además la `seed` con la que se barajaron opciones, pareos y
 * la polaridad de Verdadero/Falso. Al reanudar se regenera exactamente la misma
 * presentación, así el usuario no ve otras preguntas ni otro orden de respuestas.
 */

'use strict';

const QuizProgressService = (() => {

  const KEY_PREFIX = 'in4mind_quiz_state';
  /** Estados más antiguos que esto se descartan al leer. */
  const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 días

  function _userKey() {
    let email = '';
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      email = raw ? (JSON.parse(raw).email || '') : '';
    } catch { /* sesión ilegible → invitado */ }
    return `${KEY_PREFIX}:${email.toLowerCase() || 'guest'}`;
  }

  function _readAll() {
    try {
      const raw = localStorage.getItem(_userKey());
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeAll(map) {
    try {
      localStorage.setItem(_userKey(), JSON.stringify(map));
      return true;
    } catch {
      // Cuota llena o almacenamiento bloqueado: el quiz debe seguir funcionando.
      return false;
    }
  }

  function _isFresh(entry) {
    return Boolean(entry) && (Date.now() - (entry.updatedAt || 0)) < MAX_AGE_MS;
  }

  /** Semilla aleatoria para una nueva partida. */
  function newSeed() {
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }

  /**
   * Todos los estados vigentes del usuario actual.
   * @returns {Object<string, object>}
   */
  function getAll() {
    const map = _readAll();
    const out = {};
    let pruned = false;
    Object.keys(map).forEach(id => {
      if (_isFresh(map[id])) out[id] = map[id];
      else pruned = true;
    });
    if (pruned) _writeAll(out);
    return out;
  }

  function get(quizId) {
    const entry = _readAll()[quizId];
    return _isFresh(entry) ? entry : null;
  }

  /**
   * Guarda el avance de un intento en curso.
   * @param {string} quizId
   * @param {{seed:number, currentIdx:number, total:number, answers:Array, isCertExam?:boolean, title?:string, icon?:string}} state
   */
  function save(quizId, state) {
    if (!quizId || !state || !state.total) return false;
    const map = _readAll();
    const answered = (state.answers || []).length;
    const correct = (state.answers || []).filter(a => a && a.correct).length;

    map[quizId] = {
      quizId,
      seed:        state.seed,
      currentIdx:  state.currentIdx || 0,
      total:       state.total,
      answers:     state.answers || [],
      answered,
      correct,
      /** % de preguntas contestadas — es lo que alimenta la barra de la tarjeta. */
      completionPct: Math.round((answered / state.total) * 100),
      /** % de aciertos sobre lo contestado hasta ahora. */
      scorePct:    answered > 0 ? Math.round((correct / answered) * 100) : 0,
      isCertExam:  Boolean(state.isCertExam),
      title:       state.title || quizId,
      icon:        state.icon || '',
      completed:   answered >= state.total,
      updatedAt:   Date.now(),
    };
    return _writeAll(map);
  }

  /** Elimina el avance de un quiz (al reiniciar o al terminarlo). */
  function clear(quizId) {
    const map = _readAll();
    if (!(quizId in map)) return false;
    delete map[quizId];
    return _writeAll(map);
  }

  function clearAll() {
    return _writeAll({});
  }

  /**
   * ¿Hay un intento a medias que valga la pena retomar?
   * Un quiz terminado no es reanudable: se vuelve a empezar.
   */
  function isResumable(quizId) {
    const entry = get(quizId);
    return Boolean(entry) && !entry.completed && entry.answered > 0 && entry.answered < entry.total;
  }

  /** % completado (0 si no hay avance guardado). */
  function getCompletionPct(quizId) {
    return get(quizId)?.completionPct ?? 0;
  }

  /**
   * Migra el progreso de invitado a la cuenta recién iniciada, sin pisar
   * intentos que la cuenta ya tuviera más avanzados.
   */
  function mergeGuestInto(email) {
    if (!email) return;
    const guestKey = `${KEY_PREFIX}:guest`;
    let guest;
    try {
      guest = JSON.parse(localStorage.getItem(guestKey) || '{}');
    } catch {
      return;
    }
    if (!guest || !Object.keys(guest).length) return;

    const userKey = `${KEY_PREFIX}:${email.toLowerCase()}`;
    let mine;
    try {
      mine = JSON.parse(localStorage.getItem(userKey) || '{}');
    } catch {
      mine = {};
    }

    Object.entries(guest).forEach(([id, entry]) => {
      const existing = mine[id];
      if (!existing || (entry.updatedAt || 0) > (existing.updatedAt || 0)) mine[id] = entry;
    });

    try {
      localStorage.setItem(userKey, JSON.stringify(mine));
      localStorage.removeItem(guestKey);
    } catch { /* sin espacio: se conserva el de invitado */ }
  }

  return {
    newSeed,
    getAll,
    get,
    save,
    clear,
    clearAll,
    isResumable,
    getCompletionPct,
    mergeGuestInto,
  };

})();

if (typeof module !== 'undefined') module.exports = QuizProgressService;
