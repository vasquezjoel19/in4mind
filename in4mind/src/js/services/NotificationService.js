'use strict';

const NotificationService = (() => {

  const READ_KEY = 'in4mind_notif_read';
  const SNOOZE_KEY = 'in4mind_notif_snooze';
  const EVENT = 'in4mind-notifications-updated';
  const DAY_MS = 86400000;

  const TYPE_PRIORITY = {
    cert: 92,
    streak_risk: 88,
    resume: 82,
    study: 80,
    review: 78,
    lesson: 76,
    quiz: 72,
    path: 66,
    weekly: 54,
    streak: 48,
    announce: 42,
    discover: 34,
  };

  const MAX_BY_TYPE = {
    cert: 2,
    streak_risk: 1,
    resume: 2,
    lesson: 2,
    quiz: 2,
    review: 2,
    study: 1,
    path: 1,
    weekly: 1,
    streak: 1,
    announce: 2,
    discover: 1,
  };

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _readIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  function _writeIds(set) {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...set]));
    } catch { /* ignore */ }
  }

  function _readSnoozes() {
    try {
      return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _isSnoozed(id) {
    const until = _readSnoozes()[id];
    return until && until > Date.now();
  }

  function _id(item) {
    return item.id || `${item.type}-${item.at}`;
  }

  function _daysSince(ts) {
    if (!ts) return 0;
    return Math.floor((Date.now() - ts) / DAY_MS);
  }

  function _courseById(courses, id) {
    return courses.find(c => c.id === id) || null;
  }

  function _hasCert(certifications, courseId) {
    return certifications.some(c => c.refId === courseId);
  }

  /** @param {object} raw */
  function _finalize(raw) {
    const base = TYPE_PRIORITY[raw.type] ?? 50;
    let priority = base + (raw.priorityBoost || 0);

    if (raw.daysSinceVisit) {
      priority += Math.min(18, raw.daysSinceVisit * 2);
    }
    if (raw.pct != null) {
      if (raw.type === 'cert') priority += Math.min(12, (raw.pct - 65) / 2);
      if (raw.type === 'quiz') priority += Math.min(8, (70 - raw.pct) / 4);
    }
    if (raw.lessonCount) {
      priority += Math.min(10, raw.lessonCount * 2);
    }

    const day = new Date().getDay();
    if (raw.type === 'weekly' && (day === 0 || day === 5 || day === 6)) {
      priority += 8;
    }

    return {
      ...raw,
      priority: Math.round(priority),
      at: raw.at || Date.now(),
    };
  }

  function _pickBestPerCourse(candidates) {
    const byCourse = new Map();
    const withoutCourse = [];

    candidates.forEach((item) => {
      if (!item.courseId) {
        withoutCourse.push(item);
        return;
      }
      const prev = byCourse.get(item.courseId);
      if (!prev || item.priority > prev.priority) {
        byCourse.set(item.courseId, item);
      }
    });

    return [...withoutCourse, ...byCourse.values()];
  }

  function _applyTypeLimits(sorted) {
    const counts = {};
    return sorted.filter((item) => {
      const type = item.type;
      counts[type] = (counts[type] || 0) + 1;
      return counts[type] <= (MAX_BY_TYPE[type] ?? 2);
    });
  }

  async function buildNotifications() {
    const now = Date.now();

    if (typeof UserProfileService === 'undefined') return [];

    if (typeof ContentLoader !== 'undefined') {
      await ContentLoader.load();
    }

    const [visits, quizProgress, certifications, favorites, saved] = await Promise.all([
      UserProfileService.getRecentVisits(12),
      UserProfileService.getQuizProgress(),
      UserProfileService.getCertifications(),
      UserProfileService.getFavorites(),
      UserProfileService.getSaved(),
    ]);

    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    const candidates = [];
    const certIds = new Set(certifications.map(c => c.refId));

    visits
      .filter(v => v.type === 'course' && v.refId)
      .forEach((v) => {
        const days = _daysSince(v.visitedAt);
        if (days < 2) return;
        const course = _courseById(courses, v.refId);
        candidates.push(_finalize({
          id: `resume-${v.refId}`,
          type: 'resume',
          title: _t('notif.resumeTitle', { course: course?.title || v.title }, `Retoma ${course?.title || v.title}`),
          body: days >= 7
            ? _t('notif.resumeBodyLong', { days }, `Llevas ${days} días sin continuar.`)
            : _t('notif.resumeBody', null, 'Hace tiempo que no continúas este curso.'),
          at: v.visitedAt || now,
          courseId: v.refId,
          route: 'tutorial.html',
          daysSinceVisit: days,
          priorityBoost: days >= 7 ? 6 : 0,
        }));
      });

    Object.entries(quizProgress || {}).forEach(([courseId, quiz]) => {
      const pct = quiz.bestPct ?? quiz.pct ?? 0;
      const course = _courseById(courses, courseId);
      if (!course) return;

      if (pct >= 70 && !certIds.has(courseId)) {
        candidates.push(_finalize({
          id: `cert-near-${courseId}`,
          type: 'cert',
          title: _t('notif.certNearTitle', { course: course.title }, `Casi certificado en ${course.title}`),
          body: _t('notif.certNearBody', { pct }, `Tu mejor score es ${pct}%. Completa el examen final.`),
          at: quiz.completedAt || now,
          courseId,
          pct,
          route: 'quizzes.html',
          priorityBoost: pct >= 85 ? 6 : 0,
        }));
      } else if (pct >= 40 && pct < 70) {
        const attempts = quiz.attempts || 1;
        candidates.push(_finalize({
          id: `quiz-improve-${courseId}`,
          type: 'quiz',
          title: _t('notif.quizImproveTitle', { course: course.title }, `Mejora tu quiz de ${course.title}`),
          body: _t('notif.quizImproveBody', { pct }, `Llevas ${pct}%. Un repaso más y subes.`),
          at: quiz.completedAt || now,
          courseId,
          pct,
          route: 'quizzes.html',
          priorityBoost: attempts >= 2 ? 4 : 0,
        }));
      }
    });

    courses.forEach((course) => {
      if (certIds.has(course.id)) return;
      const lessons = UserProfileService.getLessonProgressSync(course.id);
      const lessonEntries = Object.values(lessons);
      if (!lessonEntries.length) return;
      const quiz = quizProgress?.[course.id];
      const quizPct = quiz?.bestPct ?? quiz?.pct ?? 0;
      if (quizPct >= 70) return;

      candidates.push(_finalize({
        id: `lesson-progress-${course.id}`,
        type: 'lesson',
        title: _t('notif.lessonTitle', { course: course.title }, `Sigue con ${course.title}`),
        body: _t('notif.lessonBody', { n: lessonEntries.length }, `Tienes ${lessonEntries.length} lecciones registradas. Completa el módulo.`),
        at: Math.max(...lessonEntries.map(l => l.completedAt || 0), 0) || now,
        courseId: course.id,
        route: 'tutorial.html',
        lessonCount: lessonEntries.length,
      }));
    });

    if (typeof LearningPathsData !== 'undefined' && typeof GamificationService !== 'undefined') {
      LearningPathsData.getPaths().forEach((path) => {
        let done = 0;
        path.courseIds.forEach((id) => {
          const q = quizProgress?.[id];
          if (q && (q.bestPct ?? q.pct ?? 0) >= 70) done += 1;
          else if (Object.keys(UserProfileService.getLessonProgressSync(id)).length >= 2) done += 0.5;
        });
        const pct = Math.round((done / Math.max(path.courseIds.length, 1)) * 100);
        if (pct < 20 || pct >= 100) return;
        const nextId = path.courseIds.find((id) => {
          const q = quizProgress?.[id];
          return !(q && (q.bestPct ?? q.pct ?? 0) >= 70);
        });
        const nextCourse = nextId ? _courseById(courses, nextId) : null;
        if (!nextCourse) return;

        candidates.push(_finalize({
          id: `path-${path.id}`,
          type: 'path',
          title: _t('notif.pathTitle', { path: path.title }, `Ruta: ${path.title}`),
          body: _t('notif.pathBody', { course: nextCourse.title, pct }, `${pct}% de la ruta · sigue con ${nextCourse.title}`),
          at: now,
          courseId: nextCourse.id,
          route: 'tutorial.html',
          priorityBoost: pct >= 50 ? 5 : 0,
        }));
      });
    }

    // Ruta Empleable: 95%+ learning without project URL
    if (typeof EmployabilityService !== 'undefined' && typeof CareerPathsData !== 'undefined') {
      CareerPathsData.getPaths().forEach((path) => {
        const emp = EmployabilityService.getPortfolioProgress(path.id, { quizProgress, certifications });
        if (emp.learningPct < 95 || emp.record.projectUrl) return;
        candidates.push(_finalize({
          id: `employable-nudge-${path.id}`,
          type: 'cert',
          title: _t('employable.eyebrow', null, 'Ruta Empleable'),
          body: _t('employable.nudgeMsg', null, '¡Casi terminas! Solo te falta subir tu proyecto para obtener tu certificado.'),
          at: now,
          route: 'dashboard.html#employable-root',
          priorityBoost: 10,
        }));
      });
    }

    if (typeof SpacedRepetitionService !== 'undefined') {
      SpacedRepetitionService.getDueTopics(3).forEach((topic, i) => {
        candidates.push(_finalize({
          id: `srs-${topic.topicKey}`,
          type: 'review',
          title: _t('notif.srsTitle', null, 'Repaso espaciado'),
          body: _t('notif.srsBody', { topic: topic.label, days: topic.overdueDays }, `Repasa «${topic.label}» (${topic.overdueDays}d de retraso)`),
          at: topic.dueAt || now - i,
          courseId: topic.quizId,
          route: 'quizzes.html',
          priorityBoost: Math.min(12, topic.overdueDays),
        }));
      });
    }

    // Recordatorio de estudio diario (si no hubo actividad hoy)
    if (typeof GamificationService !== 'undefined' && !GamificationService.wasActiveToday?.()) {
      const hour = new Date().getHours();
      if (hour >= 9) {
        candidates.push(_finalize({
          id: 'study-today',
          type: 'study',
          title: _t('notif.studyTitle', null, 'Momento de estudiar'),
          body: _t('notif.studyBody', null, 'Dedica 15 minutos hoy: una lección o un quiz corto.'),
          at: now,
          route: 'dashboard.html',
          priorityBoost: hour >= 18 ? 6 : 0,
        }));
      }
    }

    if (typeof GamificationService !== 'undefined') {
      const g = GamificationService.getSummary();

      if (GamificationService.isStreakAtRisk()) {
        candidates.push(_finalize({
          id: 'streak-risk',
          type: 'streak_risk',
          title: _t('notif.streakRiskTitle', { n: g.streak }, `No pierdas tu racha de ${g.streak} días`),
          body: _t('notif.streakRiskBody', null, 'Completa una lección o quiz hoy para mantenerla.'),
          at: now,
          route: 'tutorial.html',
          priorityBoost: 10,
        }));
      } else if (g.streak >= 3) {
        candidates.push(_finalize({
          id: `streak-${g.streak}`,
          type: 'streak',
          title: _t('notif.streakTitle', { n: g.streak }, `Racha de ${g.streak} días`),
          body: _t('notif.streakBody', null, 'Sigue aprendiendo para mantenerla.'),
          at: now,
          route: 'dashboard.html',
        }));
      }

      const w = g.weekly;
      const remaining = Math.max(0, w.lessonGoal - w.lessons);
      if (remaining > 0) {
        candidates.push(_finalize({
          id: `weekly-goal-${w.lessons}`,
          type: 'weekly',
          title: _t('notif.weeklyGoalTitle', null, 'Meta semanal'),
          body: _t('notif.weeklyGoalBody', { done: w.lessons, goal: w.lessonGoal }, `${w.lessons}/${w.lessonGoal} lecciones esta semana.`),
          at: now,
          route: 'tutorial.html',
          priorityBoost: remaining === 1 ? 6 : 0,
        }));
      }
    }

    if (typeof ContentLoader !== 'undefined') {
      ContentLoader.getAnnouncements().forEach((a, i) => {
        const age = a.expiresAt ? a.expiresAt - now : null;
        if (age != null && age < 0) return;
        candidates.push(_finalize({
          id: `announce-${a.id || i}`,
          type: 'announce',
          title: a.title,
          body: a.body || '',
          at: a.at || now - i,
          route: a.route || 'dashboard.html',
          priorityBoost: a.priority || 0,
        }));
      });
    }

    const engagedIds = new Set([
      ...visits.filter(v => v.type === 'course').map(v => v.refId),
      ...Object.keys(quizProgress || {}),
    ]);

    [...favorites, ...saved]
      .filter(item => item.type === 'course' && item.refId && !engagedIds.has(item.refId))
      .slice(0, 1)
      .forEach((f) => {
        const course = _courseById(courses, f.refId);
        if (!course) return;
        candidates.push(_finalize({
          id: `fav-${f.refId}`,
          type: 'discover',
          title: _t('notif.favTitle', { course: course.title }, `Tu favorito: ${course.title}`),
          body: _t('notif.favBody', null, 'Continúa donde lo dejaste.'),
          at: f.visitedAt || f.savedAt || now,
          courseId: f.refId,
          route: 'tutorial.html',
        }));
      });

    const filtered = candidates
      .filter(item => !_isSnoozed(_id(item)))
      .sort((a, b) => b.priority - a.priority || (b.at || 0) - (a.at || 0));

    const deduped = _pickBestPerCourse(filtered);
    const limited = _applyTypeLimits(
      deduped.sort((a, b) => b.priority - a.priority || (b.at || 0) - (a.at || 0))
    );

    return limited.slice(0, 10);
  }

  function getUnreadCount(notifications) {
    const read = _readIds();
    return notifications.filter(n => !read.has(_id(n))).length;
  }

  function markRead(notification) {
    const read = _readIds();
    read.add(_id(notification));
    _writeIds(read);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  function snooze(notification, hours = 24) {
    const snoozes = _readSnoozes();
    snoozes[_id(notification)] = Date.now() + hours * 3600000;
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
    } catch { /* ignore */ }
    markRead(notification);
  }

  function markAllRead(notifications) {
    const read = _readIds();
    notifications.forEach(n => read.add(_id(n)));
    _writeIds(read);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  function isRead(notification) {
    return _readIds().has(_id(notification));
  }

  function isHighPriority(notification) {
    return (notification?.priority ?? 0) >= 80;
  }

  return {
    EVENT,
    buildNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    snooze,
    isRead,
    isHighPriority,
  };

})();

if (typeof module !== 'undefined') module.exports = NotificationService;
