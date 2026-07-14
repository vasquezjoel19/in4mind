/**
 * Tests for gamification, global search grouping, and learning paths data.
 */
'use strict';

const assert = require('assert');

// localStorage mock for Node
const _store = {};
global.localStorage = {
  getItem(k) { return _store[k] ?? null; },
  setItem(k, v) { _store[k] = String(v); },
  removeItem(k) { delete _store[k]; },
};

// Minimal I18n stub
global.I18n = {
  t(key, params) {
    if (key === 'paths.web-dev.title') return 'Desarrollo web';
    if (key === 'paths.web-dev.desc') return 'HTML, CSS y JS';
    if (key.startsWith('paths.')) return key;
    if (key === 'search.groupCourses') return 'Cursos';
    return key;
  },
  getLocale() { return 'es'; },
};

global.DataService = {
  getCourses(q = '') {
    const all = [
      { id: 'html', title: 'HTML', desc: 'Web markup', category: 'web', tags: ['html'] },
      { id: 'python', title: 'Python', desc: 'Code lang', category: 'programming', tags: ['python'] },
    ];
    if (!q) return all;
    return all.filter(c => c.title.toLowerCase().includes(q.toLowerCase()));
  },
};

global.CourseCurriculum = {
  getLessons(courseId) {
    if (courseId === 'html') return [{ id: 'h1', title: 'Etiquetas', description: 'tags', steps: [] }];
    return [];
  },
  getAllQuizzes() {
    return [{ id: 'html', title: 'HTML', desc: 'quiz', sections: [{ title: 'Módulo 1' }] }];
  },
};

global.HelpData = {
  searchFaq(q) {
    return q ? [{ id: 'mobile', question: '¿Funciona en móvil?', answer: 'Sí' }] : [];
  },
};

require('../src/js/data/LearningPathsData.js');
require('../src/js/services/GamificationService.js');
require('../src/js/services/GlobalSearchService.js');

function testLearningPaths() {
  const paths = LearningPathsData.getPaths();
  assert.ok(paths.length >= 4, 'should expose learning paths');
  assert.ok(paths.some(p => p.id === 'web-dev'), 'web-dev path exists');
  assert.ok(paths[0].title, 'path has localized title');
}

function testGamification() {
  localStorage.setItem('in4mind_gamification', '{}');
  localStorage.setItem('in4mind_activity_log', '[]');
  GamificationService.recordActivity('lesson', { courseId: 'html' });
  const summary = GamificationService.getSummary();
  assert.ok(summary.streak >= 1, 'streak should start at 1');
  assert.ok(summary.weekly.lessons >= 1, 'weekly lesson count increments');
  const weeks = GamificationService.getActivityByWeek(4);
  assert.equal(weeks.length, 4, 'activity buckets');
}

function testGlobalSearch() {
  const results = GlobalSearchService.search('html');
  assert.ok(results.courses.length >= 1, 'finds course');
  assert.ok(results.lessons.length >= 1, 'finds lesson');
  assert.ok(results.quizzes.length >= 1, 'finds quiz');
  const flat = GlobalSearchService.flatten(results);
  assert.ok(flat.length >= 2, 'flatten combines groups');
}

testLearningPaths();
testGamification();
testGlobalSearch();
console.log('dashboard_features.test.js: all passed');
