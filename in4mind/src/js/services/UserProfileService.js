/**
 * IN4MIND — Perfil de usuario (favoritos, guardados, quizzes, visitas)
 * Persistencia por email en localStorage.
 */

'use strict';

const UserProfileService = (() => {

  const PREFIX = 'in4mind_profile_';
  const EVENT  = 'in4mind-profile-updated';
  const MAX_VISITS = 24;
  const CERT_MIN_PCT = 70;
  const EXAM_CERT_MIN_PCT = 80;
  const LESSON_EXAM_UNLOCK_AVG = 80;
  const QUIZ_UNLOCK_EXAM_PCT = 70;

  function getCurrentUser() {
    try {
      return JSON.parse(sessionStorage.getItem('in4mind_user') || 'null');
    } catch {
      return null;
    }
  }

  function mergeGuestIntoUser(email) {
    const normalized = email?.trim().toLowerCase();
    if (!normalized) return;

    const guestKey = PREFIX + 'guest';
    const userKey = PREFIX + normalized;

    try {
      const guestRaw = localStorage.getItem(guestKey);
      if (!guestRaw) return;

      const guest = { ..._defaultProfile(), ...JSON.parse(guestRaw) };
      const userRaw = localStorage.getItem(userKey);
      const user = { ..._defaultProfile(), ...(userRaw ? JSON.parse(userRaw) : {}) };

      const mergeList = (a, b) => {
        const map = new Map();
        [...(b || []), ...(a || [])].forEach(item => {
          const key = `${item.type}:${item.refId}`;
          if (!map.has(key)) map.set(key, item);
        });
        return Array.from(map.values());
      };

      user.favorites = mergeList(user.favorites, guest.favorites);
      user.saved = mergeList(user.saved, guest.saved);
      user.visits = mergeList(user.visits, guest.visits).slice(0, MAX_VISITS);

      Object.entries(guest.quizProgress || {}).forEach(([id, data]) => {
        const prev = user.quizProgress[id];
        if (!prev || (data.pct || 0) > (prev.pct || 0)) {
          user.quizProgress[id] = { ...prev, ...data };
        }
      });

      Object.entries(guest.lessonProgress || {}).forEach(([courseId, data]) => {
        const prev = user.lessonProgress[courseId] || { lessons: {} };
        const mergedLessons = { ...prev.lessons };
        Object.entries(data.lessons || {}).forEach(([lessonId, lesson]) => {
          const existing = mergedLessons[lessonId];
          if (!existing || (lesson.pct || 0) > (existing.pct || 0)) {
            mergedLessons[lessonId] = { ...existing, ...lesson };
          }
        });
        user.lessonProgress[courseId] = { lessons: mergedLessons };
      });

      user.certifications = mergeList(user.certifications, guest.certifications);

      localStorage.setItem(userKey, JSON.stringify(user));
      localStorage.removeItem(guestKey);
      _notify();
    } catch { /* ignore */ }
  }

  function _email() {
    const email = getCurrentUser()?.email?.trim().toLowerCase();
    return email || 'guest';
  }

  function _storageKey() {
    return PREFIX + _email();
  }

  function _defaultProfile() {
    return {
      favorites: [],
      saved: [],
      quizProgress: {},
      lessonProgress: {},
      visits: [],
      certifications: [],
    };
  }

  function _load() {
    try {
      const raw = localStorage.getItem(_storageKey());
      if (!raw) return _defaultProfile();
      const data = JSON.parse(raw);
      return {
        favorites: Array.isArray(data.favorites) ? data.favorites : [],
        saved: Array.isArray(data.saved) ? data.saved : [],
        quizProgress: data.quizProgress && typeof data.quizProgress === 'object' ? data.quizProgress : {},
        lessonProgress: data.lessonProgress && typeof data.lessonProgress === 'object' ? data.lessonProgress : {},
        visits: Array.isArray(data.visits) ? data.visits : [],
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
      };
    } catch {
      return _defaultProfile();
    }
  }

  function _save(profile) {
    localStorage.setItem(_storageKey(), JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { email: _email() } }));
  }

  function _notify() {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { email: _email() } }));
  }

  function buildCourseItem(course) {
    return {
      id: `course-${course.id}`,
      type: 'course',
      refId: course.id,
      title: course.title,
      desc: course.desc,
      icon: course.icon,
      color: course.color || '',
      visitedAt: Date.now(),
    };
  }

  function buildQuizItem(quiz) {
    return {
      id: `quiz-${quiz.id}`,
      type: 'quiz',
      refId: quiz.id,
      title: quiz.title,
      desc: quiz.desc || 'Quiz completado',
      icon: quiz.icon || '',
      visitedAt: Date.now(),
    };
  }

  function _findIndex(list, refId, type) {
    return list.findIndex(i => i.refId === refId && i.type === type);
  }

  function isFavorite(refId, type = 'course') {
    return _findIndex(_load().favorites, refId, type) >= 0;
  }

  function isSaved(refId, type = 'course') {
    return _findIndex(_load().saved, refId, type) >= 0;
  }

  function toggleFavorite(item) {
    const profile = _load();
    const idx = _findIndex(profile.favorites, item.refId, item.type);
    if (idx >= 0) {
      profile.favorites.splice(idx, 1);
      _save(profile);
      return false;
    }
    profile.favorites.unshift({ ...item, savedAt: Date.now() });
    _save(profile);
    return true;
  }

  function toggleSaved(item) {
    const profile = _load();
    const idx = _findIndex(profile.saved, item.refId, item.type);
    if (idx >= 0) {
      profile.saved.splice(idx, 1);
      _save(profile);
      return false;
    }
    profile.saved.unshift({ ...item, savedAt: Date.now() });
    _save(profile);
    return true;
  }

  function removeFavorite(id) {
    const profile = _load();
    profile.favorites = profile.favorites.filter(i => i.id !== id);
    _save(profile);
  }

  function removeSaved(id) {
    const profile = _load();
    profile.saved = profile.saved.filter(i => i.id !== id);
    _save(profile);
  }

  function getFavorites() {
    return _load().favorites;
  }

  function getSaved() {
    return _load().saved;
  }

  function recordVisit(item) {
    const profile = _load();
    const filtered = profile.visits.filter(v => !(v.refId === item.refId && v.type === item.type));
    filtered.unshift({ ...item, visitedAt: Date.now() });
    profile.visits = filtered.slice(0, MAX_VISITS);
    _save(profile);
  }

  function getRecentVisits(limit = 9) {
    return _load().visits.slice(0, limit);
  }

  function saveQuizProgress(quizId, correct, total, meta = {}) {
    const profile = _load();
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const prev = profile.quizProgress[quizId];
    profile.quizProgress[quizId] = {
      correct,
      total,
      pct,
      title: meta.title || prev?.title || quizId,
      icon: meta.icon || prev?.icon || '',
      completedAt: Date.now(),
      attempts: (prev?.attempts || 0) + 1,
      bestPct: Math.max(prev?.bestPct || 0, pct),
    };
    _save(profile);
    return profile.quizProgress[quizId];
  }

  function getQuizProgress() {
    return _load().quizProgress;
  }

  function getCompletedQuizCount() {
    return Object.keys(_load().quizProgress).length;
  }

  function getStats() {
    const profile = _load();
    return {
      saved: profile.saved.length,
      favorites: profile.favorites.length,
      quizzes: Object.keys(profile.quizProgress).length,
      certifications: (profile.certifications || []).length,
    };
  }

  function getCertifications() {
    return _load().certifications || [];
  }

  function getExamId(courseId) {
    return `${courseId}-cert-exam`;
  }

  function saveLessonProgress(courseId, lessonId, pct, meta = {}) {
    const profile = _load();
    if (!profile.lessonProgress) profile.lessonProgress = {};
    if (!profile.lessonProgress[courseId]) profile.lessonProgress[courseId] = { lessons: {} };

    const prev = profile.lessonProgress[courseId].lessons[lessonId];
    const score = Math.max(0, Math.min(100, Math.round(pct)));
    profile.lessonProgress[courseId].lessons[lessonId] = {
      pct: Math.max(prev?.pct || 0, score),
      title: meta.title || prev?.title || lessonId,
      completedAt: Date.now(),
      attempts: (prev?.attempts || 0) + 1,
    };
    _save(profile);
    return profile.lessonProgress[courseId].lessons[lessonId];
  }

  function getLessonProgress(courseId) {
    return _load().lessonProgress?.[courseId]?.lessons || {};
  }

  function getCourseLessonStats(courseId, totalLessons = 0) {
    const lessons = getLessonProgress(courseId);
    const entries = Object.values(lessons);
    const completed = entries.length;
    const avg = completed
      ? Math.round(entries.reduce((sum, l) => sum + (l.pct || 0), 0) / completed)
      : 0;
    const allComplete = totalLessons > 0 && completed >= totalLessons;
    const lessonsOk = allComplete && avg >= LESSON_EXAM_UNLOCK_AVG;

    return { completed, total: totalLessons, avg, allComplete, unlocked: lessonsOk };
  }

  function getQuizScoreForCourse(courseId) {
    const data = _load().quizProgress[courseId];
    return data?.bestPct ?? data?.pct ?? 0;
  }

  function isQuizPassedForCert(courseId) {
    return getQuizScoreForCourse(courseId) >= QUIZ_UNLOCK_EXAM_PCT;
  }

  /** Requisitos completos para desbloquear el examen de certificación. */
  function getCertificationRequirements(courseId, totalLessons = 0) {
    if (!totalLessons && typeof TutorialData !== 'undefined') {
      totalLessons = TutorialData.getLessons(courseId).length;
    }
    const lessonStats = getCourseLessonStats(courseId, totalLessons);
    const quizPct = getQuizScoreForCourse(courseId);
    const quizPassed = quizPct >= QUIZ_UNLOCK_EXAM_PCT;
    const examUnlocked = lessonStats.unlocked && quizPassed;

    return {
      lessonStats,
      quizPct,
      quizPassed,
      examUnlocked,
      lessonMinAvg: LESSON_EXAM_UNLOCK_AVG,
      quizMinPct: QUIZ_UNLOCK_EXAM_PCT,
      examMinPct: EXAM_CERT_MIN_PCT,
    };
  }

  function isExamUnlocked(courseId, totalLessons = 0) {
    return getCertificationRequirements(courseId, totalLessons).examUnlocked;
  }

  function hasExamCertification(courseId) {
    return (_load().certifications || []).some(c => c.type === 'exam' && c.refId === courseId);
  }

  /** Otorga certificación al aprobar un quiz de práctica (≥70%). */
  function tryAwardCertification(quizId, meta = {}) {
    const pct = meta.pct ?? 0;
    if (pct < CERT_MIN_PCT) return null;

    const profile = _load();
    if (!profile.certifications) profile.certifications = [];

    const existingIdx = profile.certifications.findIndex(c => c.refId === quizId && c.type === 'quiz');
    const cert = {
      id: `cert-${quizId}`,
      refId: quizId,
      type: 'quiz',
      title: meta.title || `Certificado: ${quizId}`,
      desc: meta.desc || `Aprobado con ${pct}% de aciertos`,
      icon: meta.icon || '',
      pct,
      earnedAt: Date.now(),
    };

    if (existingIdx >= 0) {
      if (pct > (profile.certifications[existingIdx].pct || 0)) {
        profile.certifications[existingIdx] = { ...profile.certifications[existingIdx], ...cert };
      }
    } else {
      profile.certifications.unshift(cert);
    }

    _save(profile);
    return cert;
  }

  /** Certificación profesional al aprobar examen práctico (≥80%). */
  function tryAwardExamCertification(courseId, meta = {}) {
    const pct = meta.pct ?? 0;
    if (pct < EXAM_CERT_MIN_PCT) return null;

    const profile = _load();
    if (!profile.certifications) profile.certifications = [];

    const existingIdx = profile.certifications.findIndex(c => c.refId === courseId && c.type === 'exam');
    const cert = {
      id: `cert-exam-${courseId}`,
      refId: courseId,
      type: 'exam',
      title: meta.title || `Certificación profesional: ${courseId}`,
      desc: meta.desc || `Examen práctico aprobado con ${pct}% de aciertos`,
      icon: meta.icon || '',
      pct,
      earnedAt: Date.now(),
      modules: meta.modules || [],
      levelsCovered: meta.levelsCovered || [],
      lessonCount: meta.lessonCount || 0,
    };

    if (existingIdx >= 0) {
      if (pct > (profile.certifications[existingIdx].pct || 0)) {
        profile.certifications[existingIdx] = { ...profile.certifications[existingIdx], ...cert };
      }
    } else {
      profile.certifications.unshift(cert);
    }

    _save(profile);
    return cert;
  }

  /** Sincroniza certificaciones desde quizzes ya completados. */
  function syncCertificationsFromQuizzes() {
    const profile = _load();
    Object.entries(profile.quizProgress).forEach(([quizId, data]) => {
      if ((data.pct || 0) >= CERT_MIN_PCT) {
        tryAwardCertification(quizId, {
          title: `Certificado: ${data.title || quizId}`,
          icon: data.icon,
          pct: data.pct,
          desc: `Aprobado con ${data.pct}% de aciertos`,
        });
      }
    });
  }

  function formatVisitDate(ts) {
    if (!ts) return 'Reciente';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Visto hace un momento';
    if (mins < 60) return `Visitado hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Visitado hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Visitado ayer';
    if (days < 7) return `Visitado hace ${days} días`;
    const d = new Date(ts);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `Visitado ${months[d.getMonth()]} ${d.getDate()}`;
  }

  function updateDisplayName(name) {
    const trimmed = name?.trim();
    if (!trimmed) return false;
    const user = getCurrentUser();
    if (!user) return false;

    user.name = trimmed;
    sessionStorage.setItem('in4mind_user', JSON.stringify(user));

    try {
      const users = JSON.parse(localStorage.getItem('in4mind_users') || '{}');
      const key = user.email.toLowerCase();
      if (users[key]) {
        users[key].name = trimmed;
        localStorage.setItem('in4mind_users', JSON.stringify(users));
      }
    } catch { /* ignore */ }

    _notify();
    return true;
  }

  /** Migra progreso de quiz en sessionStorage al perfil del usuario. */
  function migrateSessionQuizProgress() {
    try {
      const raw = sessionStorage.getItem('in4mind_quiz_progress');
      if (!raw) return;
      const session = JSON.parse(raw);
      Object.entries(session).forEach(([quizId, data]) => {
        if (data && typeof data.correct === 'number') {
          saveQuizProgress(quizId, data.correct, data.total, { title: data.title, icon: data.icon });
        }
      });
    } catch { /* ignore */ }
  }

  return {
    getCurrentUser,
    buildCourseItem,
    buildQuizItem,
    isFavorite,
    isSaved,
    toggleFavorite,
    toggleSaved,
    removeFavorite,
    removeSaved,
    getFavorites,
    getSaved,
    recordVisit,
    getRecentVisits,
    saveQuizProgress,
    getQuizProgress,
    getCompletedQuizCount,
    getStats,
    getCertifications,
    tryAwardCertification,
    tryAwardExamCertification,
    syncCertificationsFromQuizzes,
    saveLessonProgress,
    getLessonProgress,
    getCourseLessonStats,
    isExamUnlocked,
    isQuizPassedForCert,
    getQuizScoreForCourse,
    getCertificationRequirements,
    hasExamCertification,
    getExamId,
    formatVisitDate,
    updateDisplayName,
    migrateSessionQuizProgress,
    mergeGuestIntoUser,
    LESSON_EXAM_UNLOCK_AVG,
    QUIZ_UNLOCK_EXAM_PCT,
    EXAM_CERT_MIN_PCT,
    CERT_MIN_PCT,
    EVENT,
  };

})();

if (typeof module !== 'undefined') module.exports = UserProfileService;
