/**
 * IN4MIND — AdaptiveQuizEngine
 *
 * Selección adaptativa de preguntas encima de QuizRandomizer:
 *  - Ajusta la dificultad objetivo según aciertos recientes.
 *  - Reprograma conceptos fallados con otro tipo de pregunta.
 *  - Persiste mastery por tema en localStorage (particionado por usuario).
 *
 * Los exámenes de certificación pueden optar por no usarlo (orden fijo).
 */

'use strict';

const AdaptiveQuizEngine = (() => {

  const MASTERY_PREFIX = 'in4mind_quiz_mastery';
  const RECENT_WINDOW = 4;
  const MASTERED = 0.8;
  const WEAK = 0.45;

  function _userSuffix() {
    let email = '';
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      email = raw ? (JSON.parse(raw).email || '') : '';
    } catch { /* guest */ }
    return (email || 'guest').toLowerCase();
  }

  function _masteryKey() {
    return `${MASTERY_PREFIX}:${_userSuffix()}`;
  }

  function loadMastery() {
    try {
      const raw = localStorage.getItem(_masteryKey());
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveMastery(map) {
    try {
      localStorage.setItem(_masteryKey(), JSON.stringify(map || {}));
      return true;
    } catch {
      return false;
    }
  }

  function getTopicMastery(topicKey, map) {
    const row = (map || loadMastery())[topicKey];
    if (!row) return 0.5;
    return typeof row.level === 'number' ? row.level : 0.5;
  }

  /**
   * Topic estable: sección del quiz (o campo explícito `topic`).
   * @param {object} q
   * @param {string} quizId
   */
  function topicKey(q, quizId) {
    if (q.topic) return String(q.topic);
    const section = q.sectionTitle || `sec-${q.sectionIndex ?? 0}`;
    return `${quizId || 'quiz'}::${section}`;
  }

  /**
   * Dificultad 1–3. Respeta `q.difficulty` si existe; si no, heurística por tipo.
   */
  function inferDifficulty(q) {
    const d = q.difficulty;
    if (d === 1 || d === 'easy' || d === 'beginner') return 1;
    if (d === 3 || d === 'hard' || d === 'advanced') return 3;
    if (d === 2 || d === 'medium' || d === 'intermediate') return 2;
    if (q.type === 'match') return 3;
    if (q.type === 'truefalse') return 1;
    const n = Array.isArray(q.options) ? q.options.length
      : (Array.isArray(q.opts) ? q.opts.length : 0);
    return n >= 4 ? 2 : 1;
  }

  function _enrich(q, quizId) {
    return {
      ...q,
      topicKey: topicKey(q, quizId),
      difficulty: inferDifficulty(q),
      isReview: Boolean(q.isReview),
      adaptiveHint: q.adaptiveHint || null,
    };
  }

  function _accuracy(recent) {
    if (!recent.length) return 0.6;
    const ok = recent.filter(Boolean).length;
    return ok / recent.length;
  }

  function _scoreCandidate(q, ctx) {
    const mastery = getTopicMastery(q.topicKey, ctx.mastery);
    const diffGap = Math.abs((q.difficulty || 2) - ctx.targetDiff);
    let score = 0;

    // Preferir temas débiles.
    score += (1 - mastery) * 4;

    // Acercarse a la dificultad objetivo.
    score += (2 - diffGap) * 2;

    // Empujar reviews pendientes.
    if (ctx.reviewTopics.has(q.topicKey)) score += 5;

    // Preferir otro tipo al repasar el mismo tema.
    if (ctx.lastTopic === q.topicKey && q.type !== ctx.lastType) score += 2.5;
    if (ctx.lastTopic === q.topicKey && q.type === ctx.lastType) score -= 1.5;

    // Evitar el mismo tipo seguido si hay alternativas.
    if (q.type === ctx.lastType) score -= 0.4;

    return score;
  }

  /**
   * Ordena el banco preparado de forma adaptativa (una sola vez al inicio).
   * La secuencia luego puede reordenarse con `rebalanceAfterAnswer`.
   */
  function buildAttempt(quiz, seed, options = {}) {
    const quizId = quiz?.id || 'quiz';
    const mastery = options.mastery || loadMastery();
    const bank = (typeof QuizRandomizer !== 'undefined'
      ? QuizRandomizer.prepare(quiz, seed)
      : []
    ).map(q => _enrich(q, quizId));

    if (!bank.length && typeof QuizRandomizer === 'undefined') {
      // Fallback sin randomizer: aplanar sin barajar.
      (quiz?.sections || []).forEach((sec, si) => {
        (sec.questions || []).forEach((q, qi) => {
          bank.push(_enrich({
            ...q,
            sectionTitle: sec.title,
            sectionIndex: si,
            sourceIndex: qi,
            uid: `${si}:${qi}:${q.type}`,
          }, quizId));
        });
      });
    }

    const avgMastery = bank.length
      ? bank.reduce((s, q) => s + getTopicMastery(q.topicKey, mastery), 0) / bank.length
      : 0.5;

    let targetDiff = 2;
    if (avgMastery >= MASTERED) targetDiff = 3;
    else if (avgMastery <= WEAK) targetDiff = 1;

    if (options.savedOrder?.length) {
      const byUid = new Map(bank.map(q => [q.uid, q]));
      const ordered = [];
      options.savedOrder.forEach(uid => {
        const q = byUid.get(uid);
        if (q) {
          ordered.push(q);
          byUid.delete(uid);
        }
      });
      byUid.forEach(q => ordered.push(q));
      return {
        questions: ordered,
        meta: {
          targetDiff: options.savedMeta?.targetDiff ?? targetDiff,
          streak: options.savedMeta?.streak ?? 0,
          recent: options.savedMeta?.recent ?? [],
          reviewTopics: options.savedMeta?.reviewTopics ?? [],
          enabled: true,
        },
      };
    }

    const reviewTopics = new Set(
      Object.entries(mastery)
        .filter(([, row]) => (row?.level ?? 0.5) < WEAK)
        .map(([k]) => k)
    );

    const remaining = [...bank];
    const ordered = [];
    let lastTopic = null;
    let lastType = null;
    let td = targetDiff;

    while (remaining.length) {
      const ctx = {
        mastery,
        targetDiff: td,
        reviewTopics,
        lastTopic,
        lastType,
      };
      remaining.sort((a, b) => _scoreCandidate(b, ctx) - _scoreCandidate(a, ctx));
      const next = remaining.shift();
      ordered.push(next);
      lastTopic = next.topicKey;
      lastType = next.type;
      // Ligera rampa de dificultad a lo largo del intento.
      if (ordered.length % 3 === 0 && td < 3) td += 0.25;
    }

    return {
      questions: ordered,
      meta: {
        targetDiff,
        streak: 0,
        recent: [],
        reviewTopics: [...reviewTopics],
        enabled: true,
      },
    };
  }

  /**
   * Actualiza mastery + meta y reordena las preguntas *aún no contestadas*
   * para subir/bajar dificultad y meter review del tema fallado.
   *
   * @returns {{ questions: object[], meta: object, hint: string|null }}
   */
  function rebalanceAfterAnswer(questions, currentIdx, correct, meta, quizId) {
    const q = questions[currentIdx];
    if (!q) {
      return { questions, meta, hint: null };
    }

    const mastery = loadMastery();
    const key = q.topicKey || topicKey(q, quizId);
    const prev = mastery[key] || { level: 0.5, seen: 0, correct: 0 };
    const seen = (prev.seen || 0) + 1;
    const correctCount = (prev.correct || 0) + (correct ? 1 : 0);
    // Media exponencial suave hacia el resultado reciente.
    const level = Math.max(0, Math.min(1, (prev.level ?? 0.5) * 0.7 + (correct ? 0.3 : 0)));
    mastery[key] = {
      level,
      seen,
      correct: correctCount,
      lastAt: Date.now(),
      quizId: quizId || null,
    };
    saveMastery(mastery);

    const recent = [...(meta?.recent || []), correct].slice(-RECENT_WINDOW);
    let streak = correct ? ((meta?.streak || 0) + 1) : 0;
    let targetDiff = meta?.targetDiff ?? 2;
    const acc = _accuracy(recent);

    if (correct) {
      if (streak >= 2 || acc >= 0.75) targetDiff = Math.min(3, targetDiff + 0.5);
    } else {
      targetDiff = Math.max(1, targetDiff - 0.75);
      streak = 0;
    }

    const reviewTopics = new Set(meta?.reviewTopics || []);
    let hint = null;

    if (!correct) {
      reviewTopics.add(key);
      hint = q.exp
        || 'Repasa este concepto: la próxima pregunta del mismo tema te ayudará a fijarlo.';
      // Marcar una pregunta futura del mismo tema (otro tipo si existe) como review.
      const upcoming = questions.slice(currentIdx + 1);
      const reviewIdx = upcoming.findIndex(cand =>
        (cand.topicKey || topicKey(cand, quizId)) === key && cand.type !== q.type
      );
      const fallbackIdx = upcoming.findIndex(cand =>
        (cand.topicKey || topicKey(cand, quizId)) === key
      );
      const pickRel = reviewIdx >= 0 ? reviewIdx : fallbackIdx;
      if (pickRel >= 0) {
        const abs = currentIdx + 1 + pickRel;
        const [reviewQ] = questions.splice(abs, 1);
        reviewQ.isReview = true;
        reviewQ.adaptiveHint = hint;
        // Insertar pronto (siguiente o dentro de 1–2 preguntas).
        const insertAt = Math.min(questions.length, currentIdx + 1 + (reviewIdx >= 0 ? 1 : 0));
        questions.splice(insertAt, 0, reviewQ);
      }
    } else if (level >= MASTERED) {
      reviewTopics.delete(key);
    }

    // Reordenar solo el tramo futuro según nueva dificultad / reviews.
    const head = questions.slice(0, currentIdx + 1);
    const tail = questions.slice(currentIdx + 1);
    const ctx = {
      mastery,
      targetDiff: Math.round(targetDiff),
      reviewTopics,
      lastTopic: key,
      lastType: q.type,
    };
    tail.sort((a, b) => _scoreCandidate(b, ctx) - _scoreCandidate(a, ctx));

    // Tras aciertos seguidos, priorizar preguntas más difíciles al frente del tail.
    if (correct && streak >= 2) {
      tail.sort((a, b) => {
        const da = Math.abs((a.difficulty || 2) - Math.round(targetDiff));
        const db = Math.abs((b.difficulty || 2) - Math.round(targetDiff));
        if (da !== db) return da - db;
        return (b.difficulty || 2) - (a.difficulty || 2);
      });
    }

    // Tras fallos, priorizar fáciles + reviews.
    if (!correct) {
      tail.sort((a, b) => {
        const revA = a.isReview || reviewTopics.has(a.topicKey) ? 1 : 0;
        const revB = b.isReview || reviewTopics.has(b.topicKey) ? 1 : 0;
        if (revA !== revB) return revB - revA;
        return (a.difficulty || 2) - (b.difficulty || 2);
      });
    }

    const nextMeta = {
      targetDiff,
      streak,
      recent,
      reviewTopics: [...reviewTopics],
      enabled: true,
      accuracy: Math.round(acc * 100),
    };

    return {
      questions: head.concat(tail),
      meta: nextMeta,
      hint: correct ? null : hint,
    };
  }

  function serializeOrder(questions) {
    return (questions || []).map(q => q.uid).filter(Boolean);
  }

  function getMasterySummary(quizId) {
    const map = loadMastery();
    return Object.entries(map)
      .filter(([key, row]) => {
        if (!quizId) return true;
        if (row?.quizId === quizId) return true;
        return String(key).startsWith(`${quizId}::`);
      })
      .map(([key, row]) => ({
        topicKey: key,
        level: row.level,
        seen: row.seen,
        correct: row.correct,
      }));
  }

  /**
   * Snapshot ligero para prompts de IA (weak_topics + mastery_level).
   * @param {{ quizId?: string, weakLimit?: number }} [opts]
   */
  function getMemorySnapshot(opts = {}) {
    const summary = getMasterySummary(opts.quizId);
    const weakLimit = opts.weakLimit ?? 5;
    const weak = summary
      .filter(t => (t.level ?? 0.5) < WEAK)
      .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
      .slice(0, weakLimit);

    const avg = summary.length
      ? summary.reduce((s, t) => s + (t.level ?? 0.5), 0) / summary.length
      : 0.5;

    const label = (key) => {
      const parts = String(key).split('::');
      return parts.length > 1 ? parts.slice(1).join('::') : key;
    };

    return {
      weak_topics: weak.map(t => label(t.topicKey)),
      mastery_level: Math.round(avg * 100) / 100,
      topics: summary.slice(0, 12).map(t => ({
        topic: label(t.topicKey),
        level: Math.round((t.level ?? 0.5) * 100) / 100,
        seen: t.seen || 0,
      })),
    };
  }

  /** Expuesto para tests / UI. */
  function isEnabledForQuiz(quiz) {
    if (!quiz) return false;
    // Exámenes de certificación: orden pedagógico fijo (sin adaptación).
    if (quiz.isCertExam) return false;
    return true;
  }

  function mergeGuestInto(email) {
    if (!email) return;
    const guestKey = `${MASTERY_PREFIX}:guest`;
    const userKey = `${MASTERY_PREFIX}:${String(email).toLowerCase()}`;
    let guest;
    try {
      guest = JSON.parse(localStorage.getItem(guestKey) || '{}');
    } catch {
      return;
    }
    if (!guest || !Object.keys(guest).length) return;

    let mine;
    try {
      mine = JSON.parse(localStorage.getItem(userKey) || '{}');
    } catch {
      mine = {};
    }

    Object.entries(guest).forEach(([key, row]) => {
      const existing = mine[key];
      if (!existing) {
        mine[key] = row;
        return;
      }
      // Conservar el mastery más alto / más reciente.
      const level = Math.max(existing.level || 0, row.level || 0);
      mine[key] = {
        ...existing,
        ...row,
        level,
        seen: Math.max(existing.seen || 0, row.seen || 0),
        correct: Math.max(existing.correct || 0, row.correct || 0),
        lastAt: Math.max(existing.lastAt || 0, row.lastAt || 0),
      };
    });

    try {
      localStorage.setItem(userKey, JSON.stringify(mine));
      localStorage.removeItem(guestKey);
    } catch { /* ignore */ }
  }

  return {
    loadMastery,
    saveMastery,
    getTopicMastery,
    topicKey,
    inferDifficulty,
    buildAttempt,
    rebalanceAfterAnswer,
    serializeOrder,
    getMasterySummary,
    getMemorySnapshot,
    isEnabledForQuiz,
    mergeGuestInto,
    MASTERED,
    WEAK,
  };

})();

if (typeof module !== 'undefined') module.exports = AdaptiveQuizEngine;
