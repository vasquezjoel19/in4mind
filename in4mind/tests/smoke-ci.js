# Node smoke checks for CI (no browser).
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const required = [
  'src/js/services/SpacedRepetitionService.js',
  'src/js/services/LearningPathService.js',
  'src/js/services/WeeklyShareService.js',
  'src/js/services/OfflineCourseService.js',
  'src/js/services/ProjectReviewService.js',
  'src/js/services/NotificationService.js',
  'src/js/services/PushNotificationService.js',
  'src/js/services/GroqService.js',
  'src/js/services/AIUserContext.js',
  'dashboard.html',
  'tutorial.html',
  'guided-projects.html',
  'ai.html',
  'sw.js',
  'tests/smoke.html',
];

let failed = 0;

function assert(name, cond, detail = '') {
  if (cond) {
    console.log(`OK  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

for (const rel of required) {
  const full = path.join(root, rel);
  assert(`exists:${rel}`, fs.existsSync(full));
}

const srs = fs.readFileSync(path.join(root, 'src/js/services/SpacedRepetitionService.js'), 'utf8');
assert('SRS exports getDueTopics', /getDueTopics/.test(srs));

const paths = fs.readFileSync(path.join(root, 'src/js/services/LearningPathService.js'), 'utf8');
assert('LearningPathService getAllProgress', /getAllProgress/.test(paths));

const dash = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
assert('dashboard loads SpacedRepetitionService', /SpacedRepetitionService\.js/.test(dash));
assert('dashboard loads LearningPathService', /LearningPathService\.js/.test(dash));
assert('dashboard loads WeeklyShareService', /WeeklyShareService\.js/.test(dash));
assert('dashboard uses boot.bundle', /boot\.bundle\.js/.test(dash));
assert('dashboard uses app-shell.bundle', /app-shell\.bundle\.js/.test(dash));
assert('dashboard defers app-shell', /defer[^>]+app-shell\.bundle\.js|app-shell\.bundle\.js[^>]+defer/.test(dash));

const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert('index uses landing.bundle', /landing\.bundle\.js/.test(idx));

const tut = fs.readFileSync(path.join(root, 'tutorial.html'), 'utf8');
assert('tutorial loads OfflineCourseService', /OfflineCourseService\.js/.test(tut));

const gp = fs.readFileSync(path.join(root, 'guided-projects.html'), 'utf8');
assert('guided loads ProjectReviewService', /ProjectReviewService\.js/.test(gp));
assert('guided loads GroqService', /GroqService\.js/.test(gp));

const groq = fs.readFileSync(path.join(root, 'src/js/services/GroqService.js'), 'utf8');
assert('Groq injects AIUserContext', /AIUserContext/.test(groq));

const push = fs.readFileSync(path.join(root, 'src/js/services/PushNotificationService.js'), 'utf8');
assert('Push syncUsefulReminders', /syncUsefulReminders/.test(push));

const shellBundle = path.join(root, 'scripts/bundle-shell.js');
assert('bundle-shell script', fs.existsSync(shellBundle));

for (const name of ['boot.bundle.js', 'app-shell.bundle.js', 'landing.bundle.js']) {
  assert(`dist:${name}`, fs.existsSync(path.join(root, 'src/js/dist', name)));
}

if (failed) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}

console.log('\nAll smoke checks passed');
