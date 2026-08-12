/**
 * IN4MIND — QuizAIFeedbackService
 * Feedback personalizado vía Groq + memoria del alumno (payload ligero).
 */

'use strict';

const QuizAIFeedbackService = (() => {

  const FEEDBACK_MODEL = 'llama-3.1-8b-instant';
  const MAX_TOKENS = 110;
  const TEMPERATURE = 0.35;

  function isAvailable() {
    return typeof GroqService !== 'undefined' && GroqService.isConfigured();
  }

  function _clip(str, n) {
    const s = String(str || '').replace(/\s+/g, ' ').trim();
    if (s.length <= n) return s;
    return `${s.slice(0, n - 1)}…`;
  }

  function _systemPrompt(memory) {
    const payload = {
      weak_topics: memory?.weak_topics || [],
      mastery_level: memory?.mastery_level ?? 0.5,
    };
    return [
      'Eres el tutor de quizzes de IN4MIND.',
      `Memoria del alumno (JSON): ${JSON.stringify(payload)}`,
      `Áreas débiles: [${(payload.weak_topics || []).join(', ') || 'ninguna registrada'}].`,
      'Adapta el feedback a esas debilidades.',
      'Responde en español latinoamericano, máximo 2 frases cortas.',
      'Sin markdown, sin emojis, sin repetir la pregunta completa.',
      'Explica el error con claridad y da un tip concreto para recordar el concepto.',
    ].join(' ');
  }

  function _userPrompt(ctx) {
    return [
      `Pregunta: ${_clip(ctx.question, 220)}`,
      `Respuesta del alumno: ${_clip(ctx.userAnswer, 120)}`,
      `Respuesta correcta: ${_clip(ctx.correctAnswer, 160)}`,
      ctx.explanation ? `Explicación base: ${_clip(ctx.explanation, 180)}` : '',
      ctx.topic ? `Tema: ${_clip(ctx.topic, 80)}` : '',
    ].filter(Boolean).join('\n');
  }

  /**
   * @param {{
   *   question: string,
   *   userAnswer: string,
   *   correctAnswer: string,
   *   explanation?: string,
   *   topic?: string,
   *   quizId?: string,
   * }} ctx
   * @returns {Promise<string|null>}
   */
  async function explainError(ctx) {
    if (!isAvailable()) return null;

    const memory = typeof QuizMemoryService !== 'undefined'
      ? await QuizMemoryService.fetchMemory({ quizId: ctx.quizId })
      : { weak_topics: [], mastery_level: 0.5 };

    const system = _systemPrompt(memory);
    const user = _userPrompt(ctx);

    try {
      return await GroqService.complete({
        system,
        user,
        model: FEEDBACK_MODEL,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        timeoutMs: 7000,
      });
    } catch (err) {
      console.warn('[QuizAIFeedback]', err?.message || err);
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('quiz_ai_feedback_fail', { message: err?.message || String(err) });
      }
      // Fallback local: explicación base del currículo o tip genérico.
      if (ctx.explanation) return _clip(ctx.explanation, 220);
      return 'Revisa la respuesta correcta y vuelve a intentar el concepto en la siguiente pregunta.';
    }
  }

  return { explainError, isAvailable };

})();

if (typeof module !== 'undefined') module.exports = QuizAIFeedbackService;
