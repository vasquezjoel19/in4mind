/**
 * IN4MIND — Genera bundles de producción (boot + app-shell + landing).
 * Uso: node scripts/bundle-shell.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/js/dist');
const VERSION = '20260813logos32';

const BOOT_FILES = [
  'src/js/controllers/ThemeController.js',
  'src/js/a11y-boot.js',
  'src/js/locales/es.js',
  'src/js/locales/en.js',
  'src/js/locales/zh.js',
  'src/js/locales/curriculum-en.js',
  'src/js/locales/curriculum-zh.js',
  'src/js/services/I18n.js',
];

const SHELL_FILES = [
  'src/js/components/In4mindBulb.js',
  'src/js/i18n-boot.js',
  'src/js/data/courseFactory.js',
  'src/js/data/extendedCourses.js',
  'src/js/locales/extended-course-locales.js',
  'src/js/data/extendedCourseLocales.js',
  'src/js/services/SessionStore.js',
  'src/js/services/ErrorReporter.js',
  'src/js/services/SyncOutboxService.js',
  'src/js/services/ConnectivityService.js',
  'src/js/services/CloudBlobSync.js',
  'src/js/services/AuthSessionSync.js',
  'src/js/services/LazyScriptLoader.js',
  'src/js/services/ShareService.js',
  'src/js/services/DataService.js',
  'src/js/components/CourseCard.js',
  'src/js/services/UserProfileService.js',
  'src/js/services/QuizProgressService.js',
  'src/js/services/GamificationService.js',
  'src/js/services/GlobalSearchService.js',
  'src/js/services/NotificationService.js',
  'src/js/services/PushNotificationService.js',
  'src/js/services/AccessibilityService.js',
  'src/js/services/AuthService.js',
  'src/js/services/DataExportService.js',
  'src/js/controllers/AppFeatures.js',
  'src/js/services/GlobalChatService.js',
  'src/js/controllers/GlobalChatController.js',
  'src/js/services/AppShell.js',
  'src/js/controllers/SidebarController.js',
  'src/js/controllers/OtherMenuController.js',
  'src/js/controllers/SettingsController.js',
];

/** Landing: shared libs without AppShell/Auth/sidebar auto-boot weight. */
const LANDING_FILES = [
  'src/js/components/In4mindBulb.js',
  'src/js/data/courseFactory.js',
  'src/js/data/extendedCourses.js',
  'src/js/locales/extended-course-locales.js',
  'src/js/data/extendedCourseLocales.js',
  'src/js/services/QuizProgressService.js',
  'src/js/services/QuizRandomizer.js',
  'src/js/services/SessionStore.js',
  'src/js/services/ShareService.js',
  'src/js/services/DataService.js',
  'src/js/components/CourseCard.js',
  'src/js/controllers/OtherMenuController.js',
  'src/js/i18n-boot.js',
];

function concat(files, bannerExtra = '') {
  const parts = files.map((rel) => {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) throw new Error(`Missing: ${rel}`);
    return `\n;/* --- ${rel} --- */\n${fs.readFileSync(full, 'utf8')}\n`;
  });
  const banner = `/*! IN4MIND bundle ${VERSION} — ${new Date().toISOString()} */\n${bannerExtra}`;
  return banner + parts.join('');
}

fs.mkdirSync(outDir, { recursive: true });

const bootExtra = `
;try {
  if (typeof ThemeController !== 'undefined' && ThemeController.initEarly) ThemeController.initEarly();
  if (typeof I18n !== 'undefined' && I18n.initEarly) I18n.initEarly();
} catch (e) { /* boot */ }
`;

const outputs = [
  ['boot.bundle.js', concat(BOOT_FILES, bootExtra)],
  ['app-shell.bundle.js', concat(SHELL_FILES)],
  ['landing.bundle.js', concat(LANDING_FILES)],
];

for (const [name, body] of outputs) {
  const out = path.join(outDir, name);
  fs.writeFileSync(out, body, 'utf8');
  console.log(`Wrote src/js/dist/${name} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
}
console.log(`VERSION=${VERSION}`);
