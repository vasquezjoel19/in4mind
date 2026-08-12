/**
 * IN4MIND — Repetición espaciada (SRS) sobre mastery de quizzes.
 * Intervalos: 1 → 3 → 7 → 14 → 30 días según nivel de mastery.
 */
'use strict';

const SpacedRepetitionService = (() => {
  const INTERVALS_DAYS = [1, 3, 7, 14, 30];

  function _intervalForLevel(level) {
    const lvl = Math.max(0, Math.min(1, Number(level) || 0.5));
    const idx = Math.min(INTERVALS_DAYS.length - 1, Math.floor(lvl * INTERVALS_DAYS.length));
    return INTERVALS_DAYS[idx];
  }

  function _label(topicKey) {
    const parts = String(topicKey).split('::');
    return parts.length > 1 ? parts.slice(1).join(' · ') : topicKey;
  }

  function _quizIdFromKey(topicKey, row) {
    if (row?.quizId) return row.quizId;
    const parts = String(topicKey).split('::');
    return parts[0] || null;
  }

  /** @returns {Array<{topicKey,quizId,label,level,dueAt,overdueDays}>} */
  function getDueTopics(limit = 8) {
    if (typeof AdaptiveQuizEngine === 'undefined') return [];
    const map = AdaptiveQuizEngine.loadMastery?.() || {};
    const now = Date.now();
    const due = [];

    Object.entries(map).forEach(([topicKey, row]) => {
      if (!row || typeof row !== 'object') return;
      const level = row.level ?? 0.5;
      const lastAt = row.lastAt || 0;
      if (!lastAt) return;
      const intervalMs = _intervalForLevel(level) * 86400000;
      const dueAt = lastAt + intervalMs;
      if (dueAt > now) return;
      due.push({
        topicKey,
        quizId: _quizIdFromKey(topicKey, row),
        label: _label(topicKey),
        level,
        dueAt,
        overdueDays: Math.floor((now - dueAt) / 86400000),
        seen: row.seen || 0,
        correct: row.correct || 0,
      });
    });

    return due
      .sort((a, b) => (b.overdueDays - a.overdueDays) || (a.level - b.level))
      .slice(0, limit);
  }

  function getDueCount() {
    return getDueTopics(50).length;
  }

  /** Marca un tema como revisado ahora (reinicia el reloj SRS). */
  function markReviewed(topicKey) {
    if (typeof AdaptiveQuizEngine === 'undefined') return false;
    const map = AdaptiveQuizEngine.loadMastery?.() || {};
    if (!map[topicKey]) return false;
    map[topicKey] = { ...map[topicKey], lastAt: Date.now() };
    AdaptiveQuizEngine.saveMastery(map);
    return true;
  }

  return { getDueTopics, getDueCount, markReviewed, INTERVALS_DAYS };
})();

if (typeof module !== 'undefined') module.exports = SpacedRepetitionService;
