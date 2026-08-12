/**
 * IN4MIND — Validación de desbloqueo de examenes (cliente + RPC opcional).
 * Si la función SQL `is_exam_unlocked` no existe, cae al chequeo local.
 */
'use strict';

const CertGateService = (() => {

  async function isExamUnlocked(courseId, totalLessons) {
    if (!courseId) return false;

    const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
    if (sb) {
      try {
        const { data, error } = await sb.rpc('is_exam_unlocked', {
          p_course_id: courseId,
          p_total_lessons: totalLessons || 0,
        });
        if (!error && typeof data === 'boolean') return data;
      } catch { /* fallback local */ }
    }

    if (typeof UserProfileService !== 'undefined' && UserProfileService.isExamUnlocked) {
      return Boolean(UserProfileService.isExamUnlocked(courseId, totalLessons));
    }
    return false;
  }

  return { isExamUnlocked };
})();

if (typeof module !== 'undefined') module.exports = CertGateService;
