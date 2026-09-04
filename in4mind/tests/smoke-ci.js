# Node smoke checks for CI (no browser).
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
  'src/js/services/EmployabilityService.js',
  'src/js/services/EmployabilityStarters.js',
  'src/js/services/ShareService.js',
  'src/js/data/CareerPathsData.js',
  'dashboard.html',
  'onboarding.html',
  'tutorial.html',
  'quizzes.html',
  'guided-projects.html',
  'ai.html',
  'sw.js',
  'tests/smoke.html',
  'src/js/services/OnboardingService.js',
  'src/js/controllers/OnboardingController.js',
  'src/js/controllers/AuthController.js',
  'src/js/controllers/TutorialController.js',
  'src/js/controllers/QuizzesController.js',
];

let failed = 0;

function assert(name, cond, detail = '') {
  if (cond) {
    console.log(`OK  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const rel of required) {
  const full = path.join(root, rel);
  assert(`exists:${rel}`, fs.existsSync(full));
}

const srs = read('src/js/services/SpacedRepetitionService.js');
assert('SRS exports getDueTopics', /getDueTopics/.test(srs));

const paths = read('src/js/services/LearningPathService.js');
assert('LearningPathService getAllProgress', /getAllProgress/.test(paths));

const dash = read('dashboard.html');
assert('dashboard loads SpacedRepetitionService', /SpacedRepetitionService\.js/.test(dash));
assert('dashboard loads LearningPathService', /LearningPathService\.js/.test(dash));
assert('dashboard loads WeeklyShareService', /WeeklyShareService\.js/.test(dash));
assert('dashboard uses boot.bundle', /boot\.bundle\.js/.test(dash));
assert('dashboard uses app-shell.bundle', /app-shell\.bundle\.js/.test(dash));
assert('dashboard defers app-shell', /defer[^>]+app-shell\.bundle\.js|app-shell\.bundle\.js[^>]+defer/.test(dash));
assert('dashboard loads EmployabilityStarters', /EmployabilityStarters\.js/.test(dash));

const idx = read('index.html');
assert('index uses landing.bundle', /landing\.bundle\.js/.test(idx));

const tut = read('tutorial.html');
assert('tutorial loads OfflineCourseService', /OfflineCourseService\.js/.test(tut));
assert('tutorial loads EmployabilityController', /EmployabilityController\.js/.test(tut));

const gp = read('guided-projects.html');
assert('guided loads ProjectReviewService', /ProjectReviewService\.js/.test(gp));
assert('guided loads GroqService', /GroqService\.js/.test(gp));

const groq = read('src/js/services/GroqService.js');
assert('GroqService exports chat helpers', /function\s+\w+|async\s+function/.test(groq));
const aiCtx = read('src/js/services/AIUserContext.js');
assert('AIUserContext module present', /AIUserContext/.test(aiCtx));

const push = read('src/js/services/PushNotificationService.js');
assert('Push syncUsefulReminders', /syncUsefulReminders/.test(push));

assert('bundle-shell script', fs.existsSync(path.join(root, 'scripts/bundle-shell.js')));

for (const name of ['boot.bundle.js', 'app-shell.bundle.js', 'landing.bundle.js']) {
  assert(`dist:${name}`, fs.existsSync(path.join(root, 'src/js/dist', name)));
}

const loginHtml = read('login.html');
assert('login loads OnboardingService', /OnboardingService\.js/.test(loginHtml));

const authCtrl = read('src/js/controllers/AuthController.js');
assert('auth redirects mention onboarding', /onboarding\.html/.test(authCtrl));
assert('auth stashes pending redirect', /stashPendingRedirect|IN4MIND_NEXT_REDIRECT|onboardingUrlWithPending/.test(authCtrl));
assert('auth preserves tutorial deep-link query', /tutorial\.html\?course=/.test(authCtrl));
assert('auth preserves quiz deep-link query', /quizzes\.html\?quiz=/.test(authCtrl));

const obSvc = read('src/js/services/OnboardingService.js');
assert('onboarding completes with goal', /completeWithGoal/.test(obSvc));
assert('onboarding sets completed flag', /onboarding_completed/.test(obSvc));

const obCtrl = read('src/js/controllers/OnboardingController.js');
assert('onboarding finishes via pending redirect helper', /_finishRedirect|consumePendingRedirect/.test(obCtrl));

const share = read('src/js/services/ShareService.js');
assert('AuthGuard sanitizeNext', /function sanitizeNext/.test(share));
assert('AuthGuard stashPendingRedirect', /function stashPendingRedirect/.test(share));
assert('AuthGuard PENDING_KEY', /IN4MIND_NEXT_REDIRECT/.test(share));
assert('AuthGuard rejects javascript URLs', /javascript/i.test(share));

const quizCtrl = read('src/js/controllers/QuizzesController.js');
assert('quizzes reads ?quiz=', /urlParams\.get\('quiz'\)/.test(quizCtrl));
assert('quizzes clears pending redirect after open', /clearPendingRedirect/.test(quizCtrl));
assert('quizzes replaceState after deep-link', /history\.replaceState/.test(quizCtrl));

const tutCtrl = read('src/js/controllers/TutorialController.js');
assert('tutorial reads ?course=', /params\.get\('course'\)/.test(tutCtrl));
assert('tutorial reads ?lesson=', /params\.get\('lesson'\)/.test(tutCtrl));
assert('tutorial clears pending redirect after open', /clearPendingRedirect/.test(tutCtrl));

const emp = read('src/js/services/EmployabilityService.js');
assert('employable reqChecks persistence', /reqChecks/.test(emp));
assert('employable getProjectPreview', /getProjectPreview/.test(emp));
assert('employable setReqCheck', /setReqCheck/.test(emp));
assert('employable applyUrlToReqChecks', /applyUrlToReqChecks/.test(emp));

const empCtrl = read('src/js/controllers/EmployabilityController.js');
assert('employable preview button', /employable-preview-btn/.test(empCtrl));
assert('employable interactive req checklist', /data-req-id/.test(empCtrl));

const career = read('src/js/data/CareerPathsData.js');
assert('career path python-junior', /python-junior/.test(career));
assert('career path cyber-inicial', /cyber-inicial/.test(career));

const starters = read('src/js/services/EmployabilityStarters.js');
assert('starters buildZip', /function buildZip/.test(starters));
assert('starters has web kit', /web-junior/.test(starters));

// Runtime sanitize checks (no DOM / no browser)
{
  const sandbox = {
    window: {
      location: { origin: 'https://in4mind.app', href: 'https://in4mind.app/login.html' },
    },
    sessionStorage: {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; },
    },
    localStorage: {
      _d: {},
      getItem(k) { return this._d[k] || null; },
      setItem(k, v) { this._d[k] = String(v); },
      removeItem(k) { delete this._d[k]; },
    },
    document: undefined,
    module: { exports: {} },
    URL,
  };
  // Extract AuthGuard IIFE by evaluating ShareService with document undefined guard
  const code = share
    .replace(/if \(typeof document !== 'undefined'\) \{[\s\S]*$/, '');
  vm.runInNewContext(code + '\nthis.AuthGuard = AuthGuard;', sandbox);
  const AG = sandbox.AuthGuard;
  assert('sanitize allows tutorial deep-link', AG.sanitizeNext('tutorial.html?course=python&lesson=2') === 'tutorial.html?course=python&lesson=2');
  assert('sanitize allows quiz deep-link', AG.sanitizeNext('quizzes.html?quiz=python') === 'quizzes.html?quiz=python');
  assert('sanitize blocks external host', AG.sanitizeNext('https://evil.example/phish') === null);
  assert('sanitize blocks javascript', AG.sanitizeNext('javascript:alert(1)') === null);
  const stashed = AG.stashPendingRedirect('https://in4mind.app/tutorial.html?course=html&lesson=1');
  assert('stash stores relative path', stashed === 'tutorial.html?course=html&lesson=1');
  assert('stash writes IN4MIND_NEXT_REDIRECT', sandbox.localStorage.getItem('IN4MIND_NEXT_REDIRECT') === 'tutorial.html?course=html&lesson=1');
  const consumed = AG.consumePendingRedirect();
  assert('consume returns stashed path', consumed === 'tutorial.html?course=html&lesson=1');
  assert('consume clears storage', sandbox.localStorage.getItem('IN4MIND_NEXT_REDIRECT') === null);
}

assert('global chat quizChallengeHref', /quizChallengeHref/.test(read('src/js/services/GlobalChatService.js')));
assert('global chat relative quiz url', /quizzes\.html\?quiz=/.test(read('src/js/controllers/GlobalChatController.js')));
assert('UiDialog module', /function confirm/.test(read('src/js/services/UiDialog.js')));
assert('UserScopedStorage module', /function accountId/.test(read('src/js/services/UserScopedStorage.js')));
assert('notes tombstones deletedNotes', /deletedNotes/.test(read('src/js/services/NotesService.js')));
assert('CloudBlobSync mergeMaps tombstones', /deletedMap/.test(read('src/js/services/CloudBlobSync.js')));
assert('Gamification uses UserScopedStorage', /UserScopedStorage/.test(read('src/js/services/GamificationService.js')));

/* ── Funciones serverless: una sola ubicación ────────────────────────────────
 * Vercel despliega las funciones desde /api en la RAÍZ del repo. Antes existía
 * una copia en in4mind/api que no se desplegaba: un arreglo hecho allí no
 * llegaba a producción. Se eliminó; estas comprobaciones evitan que vuelva.
 */
const repoRoot = path.join(root, '..');
const apiRoutes = [
  '_lib/groq-env.js',
  'groq/chat.js',
  'groq/ping.js',
  'health.js',
  'auth/request-reset.js',
];

assert('no duplicate in4mind/api directory', !fs.existsSync(path.join(root, 'api')));

for (const rel of apiRoutes) {
  assert(`api route present: ${rel}`, fs.existsSync(path.join(repoRoot, 'api', rel)));
}

/* Ningún handler debe depender ya de la ruta eliminada. */
for (const rel of apiRoutes) {
  const f = path.join(repoRoot, 'api', rel);
  if (!fs.existsSync(f)) continue;
  assert(
    `${rel} has no in4mind/api dependency`,
    !/in4mind\/api\//.test(fs.readFileSync(f, 'utf8'))
  );
}

const groqEnvLib = fs.existsSync(path.join(repoRoot, 'api/_lib/groq-env.js'))
  ? fs.readFileSync(path.join(repoRoot, 'api/_lib/groq-env.js'), 'utf8')
  : '';
assert('groq-env reads GROQ_API_KEY', /process\.env\[ENV_VAR\]/.test(groqEnvLib));
assert('groq-env trims whitespace', /\.trim\(\)/.test(groqEnvLib));
assert('groq-env warns when unset', /console\.warn/.test(groqEnvLib));

/* Ningún handler debe volver a leer la variable por su cuenta: el criterio de
 * validación vive solo en groq-env.js. */
for (const rel of ['groq/chat.js', 'groq/ping.js', 'health.js']) {
  const src = fs.readFileSync(path.join(repoRoot, 'api', rel), 'utf8');
  assert(`${rel} delegates key lookup`, !/process\.env\.GROQ_API_KEY/.test(src));
}

/* Solo se usa GROQ_API_KEY: sin prefijos de framework (este proyecto no es
 * Next ni Vite en el cliente, y la clave nunca debe llegar al navegador). */
const forbiddenEnvNames = /NEXT_PUBLIC_GROQ|VITE_GROQ|REACT_APP_GROQ|IN4MIND_GROQ_KEY/;
for (const rel of apiRoutes) {
  const f = path.join(repoRoot, 'api', rel);
  if (!fs.existsSync(f)) continue;
  assert(`${rel} has no client-side env prefix`, !forbiddenEnvNames.test(fs.readFileSync(f, 'utf8')));
}

/* El modelo se resuelve en groq-env y el allowlist incluye el del operador:
 * si no, configurar GROQ_MODEL tras una retirada de modelo no serviría. */
assert('groq-env resolves GROQ_MODEL', /resolveGroqModel/.test(groqEnvLib));
assert('groq-env warns on unknown model', /no está en la lista de modelos conocidos/.test(groqEnvLib));
{
  const chatSrc = fs.readFileSync(path.join(repoRoot, 'api/groq/chat.js'), 'utf8');
  assert('chat.js allowlist includes operator model', /ALLOWED_MODELS = new Set\(\[\.\.\.KNOWN_MODELS, DEFAULT_MODEL\]\)/.test(chatSrc));
  assert('chat.js does not read GROQ_MODEL directly', !/process\.env\.GROQ_MODEL/.test(chatSrc));
  assert('chat.js maps rate limit', /GROQ_RATE_LIMITED/.test(chatSrc));
  assert('chat.js maps decommissioned model', /GROQ_MODEL_NOT_FOUND/.test(chatSrc));
  /* Un 503 de Groq no debe llegar al cliente como 503: lo interpretaba como
   * "falta la API Key" y pedía configurar una que ya estaba puesta. */
  assert('chat.js remaps upstream 503', /groqRes\.status === 503 \? 502/.test(chatSrc));
}

/* El cliente debe distinguir cada causa en vez de colapsarlas en un texto. */
{
  const groqSvc = read('src/js/services/GroqService.js');
  assert('GroqService trusts body code over status', /KNOWN_CODES\.includes\(code\)/.test(groqSvc));
  assert('GroqService keeps upstream status', /\^GROQ_HTTP_\\d\{3\}\$/.test(groqSvc));

  const engine = read('src/js/services/AIEngine.js');
  const chatCtrl = read('src/js/controllers/AIChatController.js');
  for (const key of ['ai.errModel', 'ai.errRateLimit', 'ai.errEmpty', 'ai.errStatusHint']) {
    assert(`AIEngine handles ${key}`, engine.includes(key));
    assert(`AIChatController handles ${key}`, chatCtrl.includes(key));
  }
  /* Los errores del chat pasaban por strings en español fijos: en inglés o
   * chino se mostraban igualmente en español. */
  assert('AIChatController errors go through I18n', !/\*\*Configuración requerida\*\*/.test(chatCtrl));
}

for (const loc of ['es', 'en', 'zh']) {
  const src = read(`src/js/locales/${loc}.js`);
  for (const key of ['errModel:', 'errRateLimit:', 'errEmpty:', 'errStatusHint:']) {
    assert(`${loc}.js has ai.${key.replace(':', '')}`, src.includes(key));
  }
}

/* Verificador de credencial: cierra el bucle sin necesidad de desplegar. */
{
  const check = read('scripts/check-groq.js');
  assert('check-groq prefers env over file', /process\.env\.GROQ_API_KEY/.test(check));
  assert('check-groq falls back to groq.config.js', /groq\.config\.js/.test(check));
  assert('check-groq detects invalid key', /invalid_api_key|CLAVE INVÁLIDA/.test(check));
  assert('check-groq detects retired model', /YA NO EXISTE/.test(check));
  /* Nunca debe volcar la credencial en consola. */
  assert('check-groq masks the key', /function mask/.test(check));
  const pkg = JSON.parse(read('package.json'));
  assert('package.json exposes check:groq', pkg.scripts['check:groq'] === 'node scripts/check-groq.js');
}

/* El frontend llama siempre a rutas root-relative: una ruta relativa se
 * rompería al navegar desde subcarpetas. */
for (const [file, endpoint] of [
  ['src/js/services/GroqService.js', '/api/health'],
  ['src/js/services/GroqService.js', '/api/groq/chat'],
  ['src/js/services/AuthService.js', '/api/auth/request-reset'],
]) {
  assert(`${file} uses root-relative ${endpoint}`, read(file).includes(`'${endpoint}'`));
}

if (failed) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}

console.log('\nAll smoke checks passed');
