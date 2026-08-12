/**
 * IN4MIND — Progreso unificado de rutas: lección → quiz → proyecto → cert.
 */
'use strict';

const LearningPathService = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _courseStage(courseId, quizProgress, certifications = []) {
    const lessons = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getLessonProgressSync(courseId)
      : {};
    const lessonCount = Object.keys(lessons || {}).length;
    const quiz = quizProgress?.[courseId];
    const quizPct = quiz?.bestPct ?? quiz?.pct ?? 0;
    const hasCert = (certifications || []).some(c => c.refId === courseId && (c.type === 'exam' || !c.type));

    let guidedPct = 0;
    let guidedId = null;
    if (typeof GuidedProjectsData !== 'undefined' && typeof GuidedProjectsService !== 'undefined') {
      const gp = (GuidedProjectsData.getAll?.() || []).find(p => p.courseId === courseId || p.quizId === courseId);
      if (gp) {
        guidedId = gp.id;
        guidedPct = GuidedProjectsService.getCompletionPct?.(gp.id) || 0;
      }
    }

    let score = 0;
    if (lessonCount >= 1) score += Math.min(30, lessonCount * 10);
    if (quizPct >= 70) score += 35;
    else if (quizPct > 0) score += Math.round(35 * (quizPct / 70));
    if (guidedPct >= 100) score += 20;
    else if (guidedPct > 0) score += Math.round(20 * (guidedPct / 100));
    if (hasCert) score += 15;

    let next = null;
    if (lessonCount < 2) {
      next = { kind: 'lesson', href: `tutorial.html?course=${encodeURIComponent(courseId)}`, label: _t('paths.nextLesson', null, 'Continuar lección') };
    } else if (quizPct < 70) {
      next = { kind: 'quiz', href: `quizzes.html?quiz=${encodeURIComponent(courseId)}`, label: _t('paths.nextQuiz', null, 'Hacer quiz') };
    } else if (guidedId && guidedPct < 100) {
      next = { kind: 'project', href: `guided-projects.html?project=${encodeURIComponent(guidedId)}`, label: _t('paths.nextProject', null, 'Proyecto guiado') };
    } else if (!hasCert) {
      next = { kind: 'cert', href: `quizzes.html?exam=${encodeURIComponent(courseId)}`, label: _t('paths.nextCert', null, 'Examen de certificación') };
    } else {
      next = { kind: 'done', href: `tutorial.html?course=${encodeURIComponent(courseId)}`, label: _t('paths.done', null, 'Ruta completada') };
    }

    return {
      courseId, lessonCount, quizPct, guidedPct, hasCert,
      score: Math.min(100, score), next,
    };
  }

  function getPathProgress(path, quizProgress = {}, certifications = []) {
    const stages = (path.courseIds || []).map(id => _courseStage(id, quizProgress, certifications));
    const pct = stages.length
      ? Math.round(stages.reduce((s, st) => s + st.score, 0) / stages.length)
      : 0;
    const nextStage = stages.find(st => st.next?.kind !== 'done') || stages[stages.length - 1];
    return { pct, stages, next: nextStage?.next || null, nextCourseId: nextStage?.courseId || path.courseIds?.[0] };
  }

  function getAllProgress(quizProgress = {}, certifications = []) {
    if (typeof LearningPathsData === 'undefined') return [];
    return LearningPathsData.getPaths().map(path => ({
      path,
      ...getPathProgress(path, quizProgress, certifications),
    }));
  }

  return { getPathProgress, getAllProgress, getCourseStage: _courseStage };
})();

if (typeof module !== 'undefined') module.exports = LearningPathService;
