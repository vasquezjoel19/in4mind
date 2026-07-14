/**
 * IN4MIND — Comprobaciones rápidas al finalizar cada lección.
 * Genera preguntas a partir del contenido real de TutorialData.
 */

'use strict';

const LessonCheckData = (() => {

  function _shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * @param {string} courseId
   * @param {number} lessonIndex
   * @returns {{ q: string, opts: string[], ans: number, exp: string } | null}
   */
  function getCheck(courseId, lessonIndex) {
    const lessons = typeof TutorialData !== 'undefined'
      ? TutorialData.getLessons(courseId)
      : [];
    const lesson = lessons[lessonIndex];
    if (!lesson) return null;

    const steps = (lesson.steps || []).filter(Boolean);
    const correct = steps[0] || `Aplicar lo aprendido sobre "${lesson.title}" en un ejercicio guiado.`;
    const distractors = [
      steps[1],
      steps[2],
      steps[3],
      `Memorizar definiciones de "${lesson.title}" sin practicar.`,
      `Saltar la práctica y avanzar sin revisar "${lesson.title}".`,
      'Copiar la solución sin entender el procedimiento.',
    ].filter(Boolean);

    const uniqueWrong = [...new Set(distractors.filter(d => d !== correct))].slice(0, 3);
    while (uniqueWrong.length < 3) {
      uniqueWrong.push(`Omitir los pasos prácticos de "${lesson.title}".`);
    }

    const opts = _shuffle([correct, ...uniqueWrong.slice(0, 3)]);
    const ans = opts.indexOf(correct);

    return {
      q: `Antes de avanzar: ¿cuál es la mejor acción tras la lección "${lesson.title}"?`,
      opts,
      ans,
      exp: lesson.tip || `Practica "${lesson.title}" aplicando los pasos de la lección antes de continuar.`,
    };
  }

  function _pickLessonIndices(totalLessons, count) {
    if (totalLessons <= 0) return [];
    const picked = [];
    while (picked.length < count) {
      picked.push(Math.floor(Math.random() * totalLessons));
    }
    return picked;
  }

  /**
   * Preguntas de comprobación antes de ir al quiz si faltan lecciones.
   * @param {string} courseId
   * @param {string[]} completedLessonIds — ids de lecciones ya completadas
   * @returns {Array<{ q, opts, ans, exp, lessonIndex, lessonTitle }>}
   */
  function getQuizGateChecks(courseId, completedLessonIds = []) {
    const completed = new Set(completedLessonIds);
    const lessons = typeof TutorialData !== 'undefined'
      ? TutorialData.getLessons(courseId)
      : [];
    if (!lessons.length) return [];

    const uncompletedIndices = lessons
      .map((l, i) => (!completed.has(l.id) ? i : -1))
      .filter(i => i >= 0);

    if (!uncompletedIndices.length) return [];

    const indices = completed.size === 0
      ? _pickLessonIndices(lessons.length, 5)
      : uncompletedIndices;

    return indices
      .map(i => {
        const check = getCheck(courseId, i);
        if (!check) return null;
        return { ...check, lessonIndex: i, lessonTitle: lessons[i].title };
      })
      .filter(Boolean);
  }

  return { getCheck, getQuizGateChecks };

})();

if (typeof module !== 'undefined') module.exports = LessonCheckData;
