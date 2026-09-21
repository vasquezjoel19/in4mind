/**
 * IN4MIND — Genera los bundles de producción (boot + app-shell + landing).
 *
 * Uso:
 *   node scripts/bundle-shell.js               concatena y minifica
 *   node scripts/bundle-shell.js --no-minify   deja el código legible (depurar)
 *
 * Los bundles son concatenaciones de scripts clásicos, no módulos: cada
 * archivo declara sus símbolos en el ámbito global y las páginas los usan por
 * nombre. Por eso se minifica con `transform` y no con `bundle`, y por eso
 * esbuild NO renombra los identificadores de nivel superior: si lo hiciera,
 * `AppShell`, `AuthService` y compañía dejarían de existir para el HTML.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/js/dist');
const VERSION = '20260916sidebar';

const MINIFY = !process.argv.includes('--no-minify');

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
  'src/js/controllers/OtherMenuController.js',
  'src/js/i18n-boot.js',
];

/**
 * esbuild llega como devDependency. Si falta (por ejemplo, alguien ejecuta el
 * script sin instalar), se avisa y se sigue sin minificar: es preferible un
 * bundle grande a un despliegue sin bundles.
 */
function loadMinifier() {
  if (!MINIFY) return null;
  try {
    return require('esbuild');
  } catch {
    console.warn('[bundle] esbuild no disponible: se generan bundles sin minificar.');
    console.warn('[bundle] Instálalo con: npm install');
    return null;
  }
}

const esbuild = loadMinifier();

function concat(files, bannerExtra = '') {
  const parts = files.map((rel) => {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) throw new Error(`Missing: ${rel}`);
    return `\n;/* --- ${rel} --- */\n${fs.readFileSync(full, 'utf8')}\n`;
  });
  return bannerExtra + parts.join('');
}

/**
 * `target: es2020` cubre el encadenamiento opcional y `??` que usa el código
 * sin degradarlo a sintaxis antigua. `keepNames` conserva los nombres de
 * funciones y clases, que el código consulta en trazas y comprobaciones.
 */
function minify(code, name) {
  if (!esbuild) return code;
  const result = esbuild.transformSync(code, {
    minify: true,
    target: 'es2020',
    legalComments: 'none',
    keepNames: true,
    // Sin esto esbuild escapa cada carácter no ASCII como \uXXXX y el bundle
    // con los locales de zh/es acaba PESANDO MÁS que el original.
    charset: 'utf8',
  });
  if (result.warnings?.length) {
    for (const w of result.warnings) {
      console.warn(`[bundle] ${name}: ${w.text}`);
    }
  }
  return result.code;
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

let rawTotal = 0;
let outTotal = 0;

for (const [name, source] of outputs) {
  const banner = `/*! IN4MIND bundle ${VERSION} — ${new Date().toISOString()} */\n`;
  const body = minify(source, name);
  const out = path.join(outDir, name);
  fs.writeFileSync(out, banner + body, 'utf8');

  const rawKb = Math.round(Buffer.byteLength(source, 'utf8') / 1024);
  const outKb = Math.round(fs.statSync(out).size / 1024);
  rawTotal += rawKb;
  outTotal += outKb;
  const saved = rawKb > 0 ? Math.round((1 - outKb / rawKb) * 100) : 0;
  console.log(`Wrote src/js/dist/${name} (${outKb} KB${MINIFY && esbuild ? ` — ${saved}% menos que ${rawKb} KB` : ''})`);
}

if (MINIFY && esbuild) {
  console.log(`Total: ${outTotal} KB (antes ${rawTotal} KB)`);
}
console.log(`VERSION=${VERSION}`);
