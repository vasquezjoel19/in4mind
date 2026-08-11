/**
 * IN4MIND — QuizRandomizer
 *
 * Una sola pasada Fisher–Yates semillada al cargar el intento. El resultado
 * queda congelado en cada pregunta (`options`, `answerId`, `tfOrder`, `pairs`,
 * `rights`), así re-renderizar o reanudar no vuelve a barajar.
 *
 * Qué se aleatoriza (siempre con la misma semilla):
 *  - Orden de las preguntas (y con él la secuencia de tipos/metodologías).
 *  - Opciones de opción múltiple (identidad estable por `id`, no por índice).
 *  - Filas y definiciones de pareos.
 *  - Polaridad V/F y posición de los botones Verdadero/Falso.
 */

'use strict';

const QuizRandomizer = (() => {

  /**
   * PRNG determinista (mulberry32). Math.random() no sirve: no se puede
   * sembrar y la presentación debe ser reproducible al reanudar.
   * @param {number} seed
   * @returns {() => number} [0, 1)
   */
  function _rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Fisher–Yates con RNG inyectado. Devuelve una copia. */
  function _shuffle(arr, rand) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _autoNegateStatement(text) {
    const base = String(text || '').trim().replace(/\?+$/, '').trim();
    if (!base) return text;
    const lower = base.charAt(0).toLowerCase() + base.slice(1);
    return `No es cierto que ${lower}.`;
  }

  /**
   * Opción múltiple: cada opción lleva un `id` estable (`o0`… desde el
   * contenido fuente). Tras el shuffle la validación usa `answerId`, nunca
   * la posición en pantalla.
   */
  function _randomizeChoice(q, rand) {
    const raw = Array.isArray(q.opts) ? q.opts : [];
    if (!raw.length) return { ...q, options: [], answerId: null };

    const options = raw.map((text, i) => ({
      id: `o${i}`,
      text: String(text),
    }));
    const answerId = options[Number.isInteger(q.ans) ? q.ans : 0]?.id || options[0].id;
    const shuffled = _shuffle(options, rand);

    return {
      ...q,
      options: shuffled,
      /** @deprecated preferir `options` + `answerId`; se mantiene por compat. */
      opts: shuffled.map(o => o.text),
      answerId,
      ans: shuffled.findIndex(o => o.id === answerId),
    };
  }

  /**
   * V/F: polaridad del enunciado + orden de los botones, ambos en el estado
   * de la pregunta para no recolocar "Verdadero" siempre a la izquierda.
   */
  function _randomizeTrueFalse(q, rand) {
    const hasVariant = typeof q.qFalse === 'string' && q.qFalse.trim().length > 0;
    let next = { ...q, polarity: 'original' };

    if (hasVariant && q.ans === true) {
      if (rand() >= 0.5) {
        next = {
          ...q,
          q: q.qFalse,
          ans: false,
          exp: q.expFalse || q.exp,
          polarity: 'negated',
        };
      }
    } else if (rand() >= 0.5) {
      next = {
        ...q,
        q: q.qFalse || _autoNegateStatement(q.q),
        ans: !q.ans,
        exp: q.expFalse || q.exp,
        polarity: 'flipped',
      };
    }

    next.tfOrder = _shuffle([true, false], rand);
    return next;
  }

  /** Pareos: filas y desplegable de definiciones, cada fila con `id` estable. */
  function _randomizeMatch(q, rand) {
    const pairs = Array.isArray(q.pairs) ? q.pairs : [];
    const tagged = pairs.map((p, i) => ({
      id: `p${i}`,
      left: p.left,
      right: p.right,
    }));

    if (tagged.length < 2) {
      return { ...q, pairs: tagged, rights: tagged.map(p => p.right) };
    }

    const rows = _shuffle(tagged, rand);
    return {
      ...q,
      pairs: rows,
      rights: _shuffle(rows.map(p => p.right), rand),
    };
  }

  function _randomizeQuestion(q, rand) {
    if (q.type === 'truefalse') return _randomizeTrueFalse(q, rand);
    if (q.type === 'match') return _randomizeMatch(q, rand);
    if (q.type === 'choice') return _randomizeChoice(q, rand);
    return { ...q };
  }

  /**
   * Aplana el quiz, aleatoriza cada pregunta y baraja el orden global.
   * Una sola llamada por intento: el array resultante es el estado local.
   *
   * @param {object} quiz  definición con `sections[].questions[]`
   * @param {number} seed  semilla; la misma semilla da la misma presentación
   * @returns {Array<object>}
   */
  function prepare(quiz, seed) {
    const rand = _rng(seed);
    const flat = [];

    (quiz?.sections || []).forEach((sec, si) => {
      (sec.questions || []).forEach((q, qi) => {
        flat.push({
          ..._randomizeQuestion(q, rand),
          sectionTitle: sec.title,
          sectionIndex: si,
          sourceIndex: qi,
          // Identidad estable para depuración / review; no depende del shuffle.
          uid: `${si}:${qi}:${q.type}`,
        });
      });
    });

    // El orden de preguntas (y por tanto la secuencia de metodologías) también
    // queda fijado en este array: nadie debe volver a llamar a prepare.
    return _shuffle(flat, rand);
  }

  return { prepare, _rng, _shuffle };

})();

if (typeof module !== 'undefined') module.exports = QuizRandomizer;
