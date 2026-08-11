/**
 * IN4MIND — QuizMemoryService
 * Agrega memoria del alumno (temas débiles + mastery) desde local / perfil.
 */

'use strict';

const QuizMemoryService = (() => {

  function _topicLabel(key) {
    const parts = String(key || '').split('::');
    return parts.length > 1 ? parts.slice(1).join('::') : String(key || '');
  }

  /**
   * @param {{ quizId?: string }} [opts]
   * @returns {Promise<{ weak_topics: string[], mastery_level: number, topics: object[] }>}
   */
  async function fetchMemory(opts = {}) {
    let memory = {
      weak_topics: [],
      mastery_level: 0.5,
      topics: [],
    };

    if (typeof AdaptiveQuizEngine !== 'undefined') {
      memory = AdaptiveQuizEngine.getMemorySnapshot({
        quizId: opts.quizId,
        weakLimit: 5,
      });
    }

    // Complementa con quizzes débiles del perfil (local / Supabase).
    if (typeof UserProfileService !== 'undefined') {
      try {
        const progress = await UserProfileService.getQuizProgress();
        const weakQuizzes = Object.entries(progress || {})
          .map(([id, row]) => ({
            id,
            pct: Number(row.bestPct ?? row.pct ?? 0),
            title: row.title || id,
          }))
          .filter(r => r.pct > 0 && r.pct < 70)
          .sort((a, b) => a.pct - b.pct)
          .slice(0, 4);

        weakQuizzes.forEach(r => {
          const label = r.title || r.id;
          if (!memory.weak_topics.includes(label)) memory.weak_topics.push(label);
        });

        if (weakQuizzes.length && memory.topics.length === 0) {
          memory.mastery_level = Math.round(
            (weakQuizzes.reduce((s, r) => s + r.pct, 0) / weakQuizzes.length / 100) * 100
          ) / 100;
        }
      } catch { /* sin perfil: basta mastery local */ }
    }

    memory.weak_topics = memory.weak_topics
      .map(_topicLabel)
      .filter(Boolean)
      .slice(0, 6);

    return memory;
  }

  return { fetchMemory };

})();

if (typeof module !== 'undefined') module.exports = QuizMemoryService;
