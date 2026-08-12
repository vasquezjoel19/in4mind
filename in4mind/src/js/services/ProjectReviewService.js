/**
 * IN4MIND — Rúbrica + feedback IA para pasos de proyectos guiados.
 */
'use strict';

const ProjectReviewService = (() => {

  const DEFAULT_RUBRIC = [
    { id: 'completeness', label: 'Completitud', weight: 0.4 },
    { id: 'clarity', label: 'Claridad', weight: 0.3 },
    { id: 'best_practices', label: 'Buenas prácticas', weight: 0.3 },
  ];

  function getRubric(step) {
    return Array.isArray(step?.rubric) && step.rubric.length ? step.rubric : DEFAULT_RUBRIC;
  }

  function _localHeuristic(response, step) {
    const text = String(response || '').trim();
    const len = text.length;
    const hasCode = /<|>|function|const |let |def |SELECT /i.test(text);
    const mentionsHint = step?.hint && text.toLowerCase().includes(String(step.hint).slice(0, 12).toLowerCase());
    let score = 40;
    if (len > 40) score += 15;
    if (len > 120) score += 15;
    if (hasCode) score += 20;
    if (mentionsHint) score += 10;
    return Math.min(100, score);
  }

  async function reviewStep({ project, step, response }) {
    const rubric = getRubric(step);
    const localScore = _localHeuristic(response, step);

    if (typeof GroqService === 'undefined' || !GroqService.isConfigured()) {
      return {
        score: localScore,
        feedback: 'Revisa que tu respuesta cubra las instrucciones del paso y las buenas prácticas del tema.',
        rubric: rubric.map(r => ({ ...r, score: localScore })),
        source: 'local',
      };
    }

    const system = [
      'Eres el revisor de proyectos guiados de IN4MIND.',
      'Evalúa la respuesta del alumno en español latinoamericano.',
      'Devuelve SOLO JSON válido con forma:',
      '{"score":0-100,"feedback":"2 frases","rubric":[{"id":"...","score":0-100}]}',
      `Rúbrica: ${JSON.stringify(rubric.map(r => ({ id: r.id, label: r.label })))}`,
    ].join(' ');

    const user = [
      `Proyecto: ${project?.title || ''}`,
      `Paso: ${step?.title || ''}`,
      `Instrucciones: ${String(step?.instructions || '').slice(0, 400)}`,
      `Respuesta del alumno:\n${String(response || '').slice(0, 1200)}`,
    ].join('\n');

    try {
      const raw = await GroqService.complete({
        system,
        user,
        model: 'llama-3.1-8b-instant',
        max_tokens: 220,
        temperature: 0.2,
        timeoutMs: 9000,
      });
      const match = String(raw).match(/\{[\s\S]*\}/);
      const parsed = match ? JSON.parse(match[0]) : null;
      if (!parsed || typeof parsed.score !== 'number') throw new Error('bad_json');
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        feedback: String(parsed.feedback || '').slice(0, 400),
        rubric: Array.isArray(parsed.rubric) ? parsed.rubric : rubric.map(r => ({ id: r.id, score: localScore })),
        source: 'ai',
      };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('project_review_fail', { message: err?.message || String(err) });
      }
      return {
        score: localScore,
        feedback: 'No se pudo obtener feedback de IA. Usa esta guía: cubre la instrucción, estructura clara y aplica el tip del paso.',
        rubric: rubric.map(r => ({ ...r, score: localScore })),
        source: 'local_fallback',
      };
    }
  }

  return { getRubric, reviewStep, DEFAULT_RUBRIC };
})();

if (typeof module !== 'undefined') module.exports = ProjectReviewService;
