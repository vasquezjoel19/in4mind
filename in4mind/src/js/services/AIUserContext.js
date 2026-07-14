'use strict';

/**
 * Contexto del usuario para IA y notificaciones.
 */
const AIUserContext = (() => {

  async function build() {
    const lines = [];
    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    if (user?.name) lines.push(`Usuario: ${user.name}`);

    const openCourse = sessionStorage.getItem('in4mind_open_course');
    if (openCourse && typeof DataService !== 'undefined') {
      const course = DataService.getCourses().find(c => c.id === openCourse);
      if (course) lines.push(`Curso activo en sesión: ${course.title} (${course.id})`);
    }

    if (typeof UserProfileService !== 'undefined') {
      try {
        const [visits, quizProgress] = await Promise.all([
          UserProfileService.getRecentVisits(3),
          UserProfileService.getQuizProgress(),
        ]);
        const recent = visits.filter(v => v.type === 'course').slice(0, 2);
        if (recent.length) {
          lines.push(`Visitas recientes: ${recent.map(v => v.title).join(', ')}`);
        }
        const quizEntries = Object.entries(quizProgress || {}).slice(0, 3);
        if (quizEntries.length) {
          lines.push('Progreso en quizzes: ' + quizEntries.map(([id, q]) => {
            const c = DataService?.getCourses().find(x => x.id === id);
            return `${c?.title || id} ${q.bestPct ?? q.pct ?? 0}%`;
          }).join('; '));
        }
      } catch { /* ignore */ }
    }

    if (typeof GamificationService !== 'undefined') {
      const g = GamificationService.getSummary();
      lines.push(`Racha: ${g.streak} días. Meta semanal: ${g.weekly.lessons}/${g.weekly.lessonGoal} lecciones.`);
    }

    return lines.join('\n');
  }

  return { build };

})();

if (typeof module !== 'undefined') module.exports = AIUserContext;
