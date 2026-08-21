'use strict';

const GamificationService = (() => {

  const STORAGE_KEY = 'in4mind_gamification';
  const ACTIVITY_KEY = 'in4mind_activity_log';
  const GOALS_KEY = 'in4mind_weekly_goals';
  const DAY_MS = 86400000;

  const BADGES = [
    { id: 'first_lesson', type: 'lesson', count: 1, icon: '📘' },
    { id: 'first_quiz', type: 'quiz', count: 1, icon: '✅' },
    { id: 'streak_7', streak: 7, icon: '🔥' },
    { id: 'streak_30', streak: 30, icon: '💎' },
    { id: 'xp_100', xp: 100, icon: '⭐' },
    { id: 'xp_500', xp: 500, icon: '🏆' },
  ];

  const XP_MAP = { lesson: 15, quiz: 25, cert: 50, exam: 80 };

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _read() {
    if (typeof UserScopedStorage !== 'undefined') {
      return UserScopedStorage.getJson(STORAGE_KEY, {}) || {};
    }
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _write(data) {
    if (typeof UserScopedStorage !== 'undefined') {
      UserScopedStorage.setJson(STORAGE_KEY, data);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  function _readActivity() {
    if (typeof UserScopedStorage !== 'undefined') {
      const log = UserScopedStorage.getJson(ACTIVITY_KEY, []);
      return Array.isArray(log) ? log : [];
    }
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function _writeActivity(log) {
    const trimmed = log.slice(-90);
    if (typeof UserScopedStorage !== 'undefined') {
      UserScopedStorage.setJson(ACTIVITY_KEY, trimmed);
      return;
    }
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }

  function _dayKey(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function _weekKey(ts = Date.now()) {
    const d = new Date(ts);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  function recordActivity(type, meta = {}) {
    const log = _readActivity();
    log.push({ type, at: Date.now(), ...meta });
    _writeActivity(log);

    const data = _read();
    const today = _dayKey();
    const lastDay = data.lastActiveDay;
    let streak = data.streak || 0;

    if (lastDay === today) {
      /* same day */
    } else if (lastDay) {
      const yesterday = _dayKey(Date.now() - 86400000);
      streak = lastDay === yesterday ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    data.lastActiveDay = today;
    data.streak = streak;
    data.totalActivities = (data.totalActivities || 0) + 1;
    data.xp = (data.xp || 0) + (XP_MAP[type] || 10);
    if (type === 'lesson') data.lessonsCompleted = (data.lessonsCompleted || 0) + 1;
    if (type === 'quiz') data.quizzesCompleted = (data.quizzesCompleted || 0) + 1;
    data.badges = _computeBadges(data);
    _write(data);
    window.dispatchEvent(new CustomEvent('in4mind-gamification-updated'));
  }

  function _getGoals() {
    try {
      const g = typeof UserScopedStorage !== 'undefined'
        ? (UserScopedStorage.getJson(GOALS_KEY, {}) || {})
        : JSON.parse(localStorage.getItem(GOALS_KEY) || '{}');
      return {
        lessons: g.lessons || 2,
        quizzes: g.quizzes || 1,
      };
    } catch {
      return { lessons: 2, quizzes: 1 };
    }
  }

  function setWeeklyGoals(lessons, quizzes) {
    const payload = {
      lessons: Math.max(1, lessons || 2),
      quizzes: Math.max(1, quizzes || 1),
    };
    if (typeof UserScopedStorage !== 'undefined') {
      UserScopedStorage.setJson(GOALS_KEY, payload);
    } else {
      localStorage.setItem(GOALS_KEY, JSON.stringify(payload));
    }
    window.dispatchEvent(new CustomEvent('in4mind-gamification-updated'));
  }

  function _computeBadges(data) {
    const earned = new Set(data.badges || []);
    BADGES.forEach(b => {
      if (b.streak && (data.streak || 0) >= b.streak) earned.add(b.id);
      if (b.xp && (data.xp || 0) >= b.xp) earned.add(b.id);
      if (b.type === 'lesson' && (data.lessonsCompleted || 0) >= b.count) earned.add(b.id);
      if (b.type === 'quiz' && (data.quizzesCompleted || 0) >= b.count) earned.add(b.id);
    });
    return [...earned];
  }

  function getBadges() {
    const data = _read();
    const ids = _computeBadges(data);
    return ids.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  }

  function getXp() {
    return _read().xp || 0;
  }

  function getLevel() {
    const xp = getXp();
    return Math.floor(xp / 100) + 1;
  }

  function getStreak() {
    const data = _read();
    const today = _dayKey();
    const yesterday = _dayKey(Date.now() - 86400000);
    if (data.lastActiveDay === today || data.lastActiveDay === yesterday) {
      return data.streak || 0;
    }
    return 0;
  }

  function getWeeklyProgress() {
    const goals = _getGoals();
    const week = _weekKey();
    const log = _readActivity().filter(e => _weekKey(e.at) === week);
    const lessons = log.filter(e => e.type === 'lesson').length;
    const quizzes = log.filter(e => e.type === 'quiz').length;
    return {
      lessons,
      quizzes,
      lessonGoal: goals.lessons,
      quizGoal: goals.quizzes,
      lessonPct: Math.min(100, Math.round((lessons / goals.lessons) * 100)),
      quizPct: Math.min(100, Math.round((quizzes / goals.quizzes) * 100)),
    };
  }

  function getActivityByWeek(weeks = 6) {
    const log = _readActivity();
    const buckets = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const ts = Date.now() - i * 7 * 86400000;
      const key = _weekKey(ts);
      const count = log.filter(e => _weekKey(e.at) === key).length;
      buckets.push({ key, label: _t('analytics.weekShort', { n: weeks - i }, `S${weeks - i}`), count });
    }
    return buckets;
  }

  function getSummary() {
    const data = _read();
    const weekly = getWeeklyProgress();
    return {
      streak: getStreak(),
      weekly,
      totalActivities: data.totalActivities || 0,
      xp: data.xp || 0,
      level: getLevel(),
      badges: getBadges(),
    };
  }

  function isStreakAtRisk() {
    const data = _read();
    const today = _dayKey();
    const yesterday = _dayKey(Date.now() - DAY_MS);
    return (data.streak || 0) >= 1 && data.lastActiveDay === yesterday && data.lastActiveDay !== today;
  }

  function wasActiveToday() {
    return _read().lastActiveDay === _dayKey();
  }

  return {
    recordActivity,
    getStreak,
    getWeeklyProgress,
    getActivityByWeek,
    getSummary,
    isStreakAtRisk,
    wasActiveToday,
    setWeeklyGoals,
    getBadges,
    getXp,
    getLevel,
    BADGES,
  };

})();

if (typeof module !== 'undefined') module.exports = GamificationService;
