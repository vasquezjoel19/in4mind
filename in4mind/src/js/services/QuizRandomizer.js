/**
 * IN4MIND — QuizRandomizer
 *
 * Convierte la definición estática de un quiz en una presentación aleatorizada
 * pero *reproducible*: a partir de una misma semilla siempre sale el mismo
 * barajado, lo que permite reanudar un intento a medias sin cambiar las preguntas.
 *
 * Qué se aleatoriza:
 *  - Opción múltiple → orden de las opciones (y se recalcula el índice correcto).
 *  - Pareos          → orden de las filas y orden del desplegable de definiciones.
 *  - Verdadero/Falso → polaridad: si el enunciado trae una variante falsa
 *                      (`qFalse`), se muestra una u otra al azar.
 *
 * Sin esto la app era predecible: en el contenido base la respuesta correcta de
 * opción múltiple era casi siempre la segunda opción, y en V/F siempre "Verdadero".
 */

'use strict';

const QuizRandomizer = (() => {

  /**
   * PRNG determinista (mulberry32). Math.random() no sirve aquí porque no se
   * puede sembrar y la presentación debe ser reproducible al reanudar.
   * @param {number} seed
   * @returns {() => number} función que devuelve [0, 1)
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

  /**
   * Baraja las opciones y recalcula el índice de la respuesta correcta.
   * Se baraja un array de índices para no depender de que los textos sean únicos.
   */
  function _randomizeChoice(q, rand) {
    const opts = Array.isArray(q.opts) ? q.opts : [];
    if (opts.length < 2) return { ...q };

    const order = _shuffle(opts.map((_, i) => i), rand);
    return {
      ...q,
      opts: order.map(i => opts[i]),
      ans:  order.indexOf(q.ans),
    };
  }

  /**
   * Elige la polaridad del enunciado. Si el dato no trae variante falsa
   * (`qFalse`), se conserva el enunciado original tal cual: es preferible una
   * pregunta sin aleatorizar a una afirmación negada automáticamente, que en
   * español produce frases incorrectas.
   */
  function _randomizeTrueFalse(q, rand) {
    const hasVariant = typeof q.qFalse === 'string' && q.qFalse.trim().length > 0;
    if (!hasVariant) return { ...q, polarity: 'original' };

    // Sólo tiene sentido invertir si el enunciado base es verdadero.
    if (q.ans !== true) return { ...q, polarity: 'original' };

    if (rand() < 0.5) return { ...q, polarity: 'original' };

    return {
      ...q,
      q:        q.qFalse,
      ans:      false,
      exp:      q.expFalse || q.exp,
      polarity: 'negated',
    };
  }

  /** Baraja el orden de las filas y, por separado, el de las definiciones. */
  function _randomizeMatch(q, rand) {
    const pairs = Array.isArray(q.pairs) ? q.pairs : [];
    if (pairs.length < 2) return { ...q, rights: pairs.map(p => p.right) };

    const rows = _shuffle(pairs, rand);
    return {
      ...q,
      pairs:  rows,
      rights: _shuffle(rows.map(p => p.right), rand),
    };
  }

  function _randomizeQuestion(q, rand) {
    if (q.type === 'truefalse') return _randomizeTrueFalse(q, rand);
    if (q.type === 'match')     return _randomizeMatch(q, rand);
    if (q.type === 'choice')    return _randomizeChoice(q, rand);
    return { ...q };
  }

  /**
   * Aplana el quiz en una lista de preguntas ya aleatorizadas.
   * Se conserva el orden de secciones y preguntas (es pedagógico); lo que se
   * baraja son las respuestas dentro de cada pregunta.
   *
   * @param {object} quiz  definición con `sections[].questions[]`
   * @param {number} seed  semilla; la misma semilla da la misma presentación
   * @returns {Array<object>}
   */
  function prepare(quiz, seed) {
    const rand = _rng(seed);
    const flat = [];
    (quiz?.sections || []).forEach((sec, si) => {
      (sec.questions || []).forEach(q => {
        flat.push({
          ..._randomizeQuestion(q, rand),
          sectionTitle: sec.title,
          sectionIndex: si,
        });
      });
    });
    return flat;
  }

  return { prepare, _rng, _shuffle };

})();

if (typeof module !== 'undefined') module.exports = QuizRandomizer;
