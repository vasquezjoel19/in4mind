/**
 * IN4MIND — Post-signup goal onboarding (not the dashboard tour).
 * Persists onboarding_completed + learning goal per user (local + profiles).
 */
'use strict';

const OnboardingService = (() => {
  // Career tracks first (Ruta Empleable), then optional other goals.
  const GOALS = [
    {
      id: 'web',
      pathId: 'web-dev',
      courseId: 'html',
      lesson: 1,
      icon: 'globe',
      careerPathId: 'web-junior',
      featured: true,
    },
    {
      id: 'data-career',
      pathId: 'programming',
      courseId: 'excel',
      lesson: 1,
      icon: 'chart',
      careerPathId: 'data-analyst-jr',
      featured: true,
    },
    {
      id: 'office-automation',
      pathId: 'office',
      courseId: 'powerapps',
      lesson: 1,
      icon: 'briefcase',
      careerPathId: 'office365-automation',
      featured: true,
    },
    {
      id: 'python-basics',
      pathId: 'programming',
      courseId: 'python',
      lesson: 1,
      icon: 'code',
    },
    {
      id: 'logic',
      pathId: 'programming',
      courseId: 'flowchart',
      lesson: 1,
      icon: 'git',
    },
    {
      id: 'design',
      pathId: 'design',
      courseId: 'canvas',
      lesson: 1,
      icon: 'palette',
    },
    {
      id: 'office',
      pathId: 'office',
      courseId: 'excel',
      lesson: 1,
      icon: 'briefcase',
    },
  ];

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _userEmail(explicit) {
    if (explicit) return String(explicit).trim().toLowerCase();
    try {
      if (typeof UserProfileService !== 'undefined') {
        const u = UserProfileService.getCurrentUser();
        if (u?.email) return u.email.toLowerCase();
      }
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) return String(u.email).toLowerCase();
      }
    } catch { /* ignore */ }
    return null;
  }

  function _key(suffix, email) {
    const em = _userEmail(email);
    return em ? `in4mind_${suffix}_${em}` : null;
  }

  function _readFlag(email) {
    const key = _key('onboarding_completed', email);
    if (!key) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function _writeFlag(value, email) {
    const key = _key('onboarding_completed', email);
    if (!key) return;
    try {
      localStorage.setItem(key, value ? '1' : '0');
    } catch { /* ignore */ }
  }

  function _hasPriorActivity(email) {
    const em = _userEmail(email);
    if (!em) return false;
    try {
      const lessons = JSON.parse(localStorage.getItem(`in4mind_lesson_local_${em}`) || '{}') || {};
      if (Object.keys(lessons).length) return true;
      const quizzes = JSON.parse(localStorage.getItem(`in4mind_quiz_results_${em}`) || '{}') || {};
      if (Object.keys(quizzes).length) return true;
      const visits = JSON.parse(localStorage.getItem(`in4mind_visits_${em}`) || '[]') || [];
      if (visits.length) return true;
    } catch { /* ignore */ }
    return false;
  }

  function getGoals() {
    return GOALS.map((g) => ({
      ...g,
      title: _t(`signupOnboard.goals.${g.id}.title`, null, g.id),
      desc: _t(`signupOnboard.goals.${g.id}.desc`, null, ''),
    }));
  }

  function getGoalById(id) {
    return getGoals().find((g) => g.id === id) || null;
  }

  function getSavedGoal(email) {
    const key = _key('learning_goal', email);
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveGoal(goalId, email) {
    const goal = GOALS.find((g) => g.id === goalId);
    if (!goal) return null;
    const payload = {
      goalId: goal.id,
      pathId: goal.pathId,
      courseId: goal.courseId,
      lesson: goal.lesson || 1,
      savedAt: Date.now(),
    };
    const goalKey = _key('learning_goal', email);
    const pathKey = _key('learning_path', email);
    try {
      if (goalKey) localStorage.setItem(goalKey, JSON.stringify(payload));
      if (pathKey) localStorage.setItem(pathKey, goal.pathId);
    } catch { /* ignore */ }
    return payload;
  }

  function isCompleted(email) {
    const flag = _readFlag(email);
    if (flag === '1') return true;
    if (flag === '0') return false;
    // Unset = cuentas anteriores a este flujo (o sin marca local).
    // Los registros nuevos llaman markIncomplete(); la nube puede bajar false vía hydrate.
    if (_hasPriorActivity(email)) {
      _writeFlag(true, email);
      return true;
    }
    return true;
  }

  function markIncomplete(email) {
    _writeFlag(false, email);
  }

  function markCompleted(email) {
    _writeFlag(true, email);
  }

  function lessonUrl(goalOrId) {
    const goal = typeof goalOrId === 'string'
      ? GOALS.find((g) => g.id === goalOrId)
      : goalOrId;
    if (!goal?.courseId) return 'dashboard.html';
    const lesson = goal.lesson || 1;
    return `tutorial.html?course=${encodeURIComponent(goal.courseId)}&lesson=${lesson}`;
  }

  async function _syncCloud(fields) {
    try {
      const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
      if (!sb) return;
      const { data } = await sb.auth.getUser();
      const id = data?.user?.id;
      if (!id) return;
      await sb.from('profiles').update({
        ...fields,
        updated_at: new Date().toISOString(),
      }).eq('id', id);
    } catch { /* column may not exist yet */ }
  }

  async function hydrateFromCloud(email) {
    try {
      const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
      if (!sb) return;
      const { data } = await sb.auth.getUser();
      const id = data?.user?.id;
      if (!id) return;
      const { data: row } = await sb
        .from('profiles')
        .select('onboarding_completed, learning_goal, learning_path_id')
        .eq('id', id)
        .maybeSingle();
      if (!row) return;
      const em = _userEmail(email) || data.user.email?.toLowerCase();
      if (row.onboarding_completed === true) _writeFlag(true, em);
      if (row.onboarding_completed === false) _writeFlag(false, em);
      if (row.learning_goal) {
        const parsed = typeof row.learning_goal === 'string'
          ? (() => { try { return JSON.parse(row.learning_goal); } catch { return { goalId: row.learning_goal }; } })()
          : row.learning_goal;
        const goalKey = _key('learning_goal', em);
        if (goalKey && parsed) localStorage.setItem(goalKey, JSON.stringify(parsed));
      }
      if (row.learning_path_id) {
        const pathKey = _key('learning_path', em);
        if (pathKey) localStorage.setItem(pathKey, row.learning_path_id);
      }
    } catch { /* ignore */ }
  }

  /**
   * Step 2: persist goal, mark onboarding done, return lesson URL.
   */
  async function completeWithGoal(goalId, email) {
    const saved = saveGoal(goalId, email);
    if (!saved) return { ok: false, href: 'dashboard.html' };
    markCompleted(email);
    if (saved.careerPathId && typeof EmployabilityService !== 'undefined') {
      EmployabilityService.setActivePath(saved.careerPathId);
    }
    void _syncCloud({
      onboarding_completed: true,
      learning_goal: JSON.stringify(saved),
      learning_path_id: saved.pathId,
    });
    return { ok: true, href: lessonUrl(saved), goal: saved };
  }

  function needsOnboarding(email) {
    return !isCompleted(email);
  }

  return {
    GOALS,
    getGoals,
    getGoalById,
    getSavedGoal,
    saveGoal,
    isCompleted,
    markIncomplete,
    markCompleted,
    lessonUrl,
    hydrateFromCloud,
    completeWithGoal,
    needsOnboarding,
  };
})();

if (typeof module !== 'undefined') module.exports = OnboardingService;
