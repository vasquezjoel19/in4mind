// Comprobaciones de humo para CI (sin navegador).
//
// Este fichero empezaba con "# Node smoke checks…". Node solo ignora la primera
// línea si es un hashbang (`#!`); un `#` suelto es un token inválido, así que
// `node tests/smoke-ci.js` fallaba en el primer carácter y `npm test` no llegó
// a ejecutar ninguna de estas comprobaciones.
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

/* Un archivo no puede ir en el bundle y cargarse además de forma diferida: al
 * inyectarlo por segunda vez se redeclara su `const` de nivel superior y el
 * navegador aborta ese script con "has already been declared". Pasaba con
 * PushNotificationService y DataExportService, y ensuciaba la consola de todas
 * las páginas del shell. */
{
  const bundler = read('scripts/bundle-shell.js');
  const lazy = read('src/js/services/LazyScriptLoader.js');
  const bundled = new Set(
    [...bundler.matchAll(/'(src\/js\/[^']+\.js)'/g)].map(m => m[1])
  );
  const lazyLoaded = [...lazy.matchAll(/'(src\/js\/[^'?]+\.js)/g)].map(m => m[1]);
  const duplicated = lazyLoaded.filter(f => bundled.has(f));
  assert(
    `lazy-loaded scripts are not already bundled${duplicated.length ? `: ${duplicated.join(', ')}` : ''}`,
    duplicated.length === 0
  );
}

/* Los bundles ya no se versionan: los genera `npm run build`, que `pretest`
 * ejecuta antes de esto. Si faltan aquí, es que el build no corrió o falló —
 * que es justo lo que interesa detectar, porque el sitio serviría código viejo
 * o ninguno. */
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
  '_lib/request-auth.js',
];

/* El relé de correo se elimino: aceptaba cualquier direccion sin sesion ni
 * limite, asi que servia para enviar correos con la imagen de IN4MIND a quien
 * fuera. La recuperacion la hace Supabase Auth. */
assert('open mail relay endpoint is gone',
  !fs.existsSync(path.join(repoRoot, 'api', 'auth', 'request-reset.js')));

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

/* ── Drawer móvil ───────────────────────────────────────────────────────────
 * Regresiones que ya ocurrieron y no deben volver.
 */
{
  const dash = read('src/css/dashboard.css');
  const polish = read('src/css/ui-polish.css');
  const gchat = read('src/css/global-chat.css');

  /* `slideInLeft` tiene fill-mode `both` y las animaciones ganan a las
   * declaraciones normales: sin `animation: none` el drawer se quedaba en
   * translateX(0), visible sobre el contenido aunque estuviera cerrado. */
  const drawerBlock = dash.slice(dash.indexOf('@media (max-width: 900px)'));
  assert('mobile drawer disables the entrance animation', /\.sidebar\s*\{[^}]*animation:\s*none/s.test(drawerBlock));
  assert('mobile drawer slides off-canvas', /transform:\s*translateX\(-100%\)/.test(drawerBlock));
  assert('mobile drawer opens with .is-open', /\.sidebar\.is-open\s*\{[^}]*transform:\s*translateX\(0\)/s.test(drawerBlock));
  assert('mobile drawer is scrollable', /overflow-y:\s*auto/.test(drawerBlock));
  assert('mobile drawer is width-capped', /width:\s*min\(300px,\s*80vw\)/.test(drawerBlock));

  /* El FAB estaba en 1100, por encima del drawer (960): se dibujaba sobre el
   * menú abierto. El orden vive en los tokens y nadie debe volver a fijarlo. */
  const z = name => Number((new RegExp(`--${name}:\\s*(\\d+)`).exec(polish) || [])[1]);
  assert('fab sits below the drawer backdrop', z('z-fab') < z('z-drawer-backdrop'));
  assert('bottom nav sits below the drawer backdrop', z('z-bottom-nav') < z('z-drawer-backdrop'));
  assert('drawer sits above its backdrop', z('z-drawer') > z('z-drawer-backdrop'));
  assert('drawer sits below toasts and modals', z('z-drawer') < z('z-toast') && z('z-toast') < z('z-modal'));
  assert('global chat uses the fab token', /z-index:\s*var\(--z-fab/.test(gchat));
  assert('global chat no longer hardcodes 1100', !/z-index:\s*1100/.test(gchat));

  /* En apaisado quedan ~350px de alto para 9 entradas más marca y pie. */
  const resp = read('src/css/responsive.css');
  assert('landscape breakpoint exists', /@media\s*\(max-height:\s*500px\)/.test(resp));
}

/* ── Índice de lección (tutorial.html) ──────────────────────────────────────
 * Es un segundo panel lateral, independiente del drawer del dashboard.
 * Se abría con `position: fixed; inset: 0`, tapando todo el viewport — incluido
 * `.lesson-w3__toolbar`, donde vive el único botón que lo cerraba. Una vez
 * abierto en móvil no había salida salvo navegar o recargar.
 */
{
  const tut = read('src/css/tutorial.css');
  const ctrl = read('src/js/controllers/TutorialController.js');
  const html = read('tutorial.html');

  const block = tut.slice(tut.indexOf('@media (max-width: 700px)'));
  assert('lesson index is a panel, not a full-screen cover', !/\.lesson-w3__sidebar\s*\{[^}]*inset:\s*0;/s.test(block));
  assert('lesson index is width-capped', /width:\s*80vw/.test(block) && /max-width:\s*300px/.test(block));
  assert('lesson index slides off-canvas', /transform:\s*translateX\(-100%\)/.test(block));
  assert('lesson index opens with --open', /\.lesson-w3__sidebar--open\s*\{[^}]*transform:\s*translateX\(0\)/s.test(block));
  assert('lesson index is scrollable', /overflow-y:\s*auto/.test(block));
  assert('lesson index traps overscroll', /overscroll-behavior:\s*contain/.test(block));
  assert('lesson index stays out of the tab order while closed', /visibility:\s*hidden/.test(block));
  assert('lesson index sits above its backdrop', /z-index:\s*var\(--z-drawer,/.test(block));
  assert('lesson backdrop uses the backdrop token', /\.lesson-w3__sidebar-overlay\s*\{[^}]*z-index:\s*var\(--z-drawer-backdrop/s.test(tut));
  assert('lesson landscape breakpoint exists', /@media\s*\(max-height:\s*500px\)\s*and\s*\(max-width:\s*700px\)/.test(tut));

  assert('lesson backdrop exists in the markup', /id="lesson-sidebar-overlay"/.test(html));

  /* Las tres salidas: tocar el fondo, Escape y elegir lección. Sin ellas el
   * panel vuelve a ser una trampa, porque su botón queda debajo. */
  assert('lesson index has a single open/close entry point', /function _setLessonSidebar\(/.test(ctrl));
  assert('lesson backdrop closes on tap', /lesson-sidebar-overlay'\)\s*\r?\n?\s*\?\.addEventListener\('click'/.test(ctrl));
  assert('lesson index closes on Escape', /e\.key !== 'Escape'[\s\S]{0,220}_setLessonSidebar\(false\)/.test(ctrl));
  assert('lesson index closes when a lesson is picked', /_setLessonSidebar\(false\);\s*\r?\n\s*_requestShowLesson/.test(ctrl));
  /* Cerrar libera el scroll siempre; bloquearlo solo bajo 700px. Si el cierre
   * dependiera de la media query, girar a escritorio con el panel abierto
   * dejaba el `overflow: hidden` puesto y la página congelada. */
  assert('closing always releases body scroll', /if \(!open\) \{\s*\r?\n\s*document\.body\.style\.overflow = '';/.test(ctrl));
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
]) {
  assert(`${file} uses root-relative ${endpoint}`, read(file).includes(`'${endpoint}'`));
}

/* ── Seguridad ──────────────────────────────────────────────────────────────
 * Cada aserción corresponde a un fallo real que ya ocurrió. No son estilo.
 */
{
  const sessionStore = read('src/js/services/SessionStore.js');
  const dataService  = read('src/js/services/DataService.js');
  const authCtrlSec  = read('src/js/controllers/AuthController.js');
  const chatSvc      = read('src/js/services/GlobalChatService.js');

  /* La contraseña se guardaba en localStorage en Base64, que es reversible sin
   * secreto: cualquier XSS o extensión la leía en claro. */
  assert('no base64 password helpers', !/_encodePwd|_decodePwd/.test(sessionStore));
  assert('no password getter survives', !/getRememberedPassword/.test(sessionStore));
  assert('login no longer prefills a stored password', !/getRememberedPassword/.test(authCtrlSec));
  /* Dejar de escribirla no la borra de quien ya la tiene guardada. */
  assert('legacy stored password is purged on boot', /_purgeLegacyPassword/.test(sessionStore));

  /* El modo demo guardaba `{name, password}` tal cual. */
  assert('demo store derives the password', /PBKDF2/.test(dataService));
  assert('demo store never persists a plain password',
    !/_users\[[^\]]+\]\s*=\s*\{\s*name,\s*password\s*\}/.test(dataService));
  assert('demo compares in constant time', /_safeEqual/.test(dataService));
  /* `Math.random()` no es criptográfico: su estado se reconstruye observando
   * unas pocas salidas, así que el token de recuperación era adivinable. */
  assert('reset token uses a CSPRNG', /getRandomValues/.test(dataService));
  assert('no Math.random left in token generation', !/Math\.random\(\)\.toString\(36\)/.test(dataService));

  /* `author_name` era texto libre del cliente: se podía firmar como otro. */
  assert('chat client no longer sends author_name', !/author_name:\s*_displayName/.test(chatSvc));
  assert('chat client no longer sends author_level', !/author_level:\s*_authorLevel/.test(chatSvc));

  const migration = fs.readFileSync(
    path.join(repoRoot, 'supabase/migrations/20260918_chat_author_from_profile.sql'), 'utf8');
  assert('trigger derives the author from auth.uid()', /new\.user_id\s*:=\s*uid/.test(migration));
  assert('trigger derives the name from profiles', /from public\.profiles/.test(migration));
  /* PostgreSQL ordena los triggers BEFORE alfabéticamente: si el limitador de
   * frecuencia corriera antes, agruparía por el user_id que mande el cliente. */
  assert('author trigger runs before the rate limiter',
    /chat_messages_01_set_author_trg/.test(migration) && /chat_messages_02_rate_limit_trg/.test(migration));

  /* `/api/groq/chat` era un proxy de LLM abierto a cualquiera con la URL. */
  const chatApi = fs.readFileSync(path.join(repoRoot, 'api/groq/chat.js'), 'utf8');
  const guardLib = fs.readFileSync(path.join(repoRoot, 'api/_lib/request-auth.js'), 'utf8');
  assert('chat endpoint is guarded', /await guard\(req\)/.test(chatApi));
  assert('guard checks the origin', /ORIGIN_NOT_ALLOWED/.test(guardLib));
  assert('guard verifies the Supabase session', /auth\/v1\/user/.test(guardLib));
  /* Una caída de Supabase no debe convertirse en una puerta abierta. */
  assert('guard fails closed when auth is unreachable', /AUTH_UNAVAILABLE/.test(guardLib));
  assert('client sends its access token', /Authorization: `Bearer \$\{token\}`/.test(read('src/js/services/GroqService.js')));

  /* El CDN servía `@2` sin fijar ni verificar: podía entregar cualquier cosa. */
  for (const page of ['login.html', 'dashboard.html', 'ai.html']) {
    const html = read(page);
    assert(`${page} pins the supabase CDN version`, /supabase-js@2\.\d+\.\d+\//.test(html));
    assert(`${page} verifies the CDN bundle`, /integrity="sha384-/.test(html));
    assert(`${page} sets crossorigin on the CDN tag`, /crossorigin="anonymous"/.test(html));
  }
  assert('no unpinned supabase CDN tag remains',
    !fs.readdirSync(root).filter(f => f.endsWith('.html'))
      .some(f => /supabase-js@2"/.test(read(f))));

  /* Cabeceras: sin CSP una inyección tenía vía libre. */
  const vercel = JSON.parse(fs.readFileSync(path.join(repoRoot, 'vercel.json'), 'utf8'));
  const hdr = Object.fromEntries(vercel.headers[0].headers.map(h => [h.key, h.value]));
  assert('CSP present', Boolean(hdr['Content-Security-Policy']));
  assert('CSP does not allow inline scripts',
    !/script-src[^;]*'unsafe-inline'/.test(hdr['Content-Security-Policy']));
  assert('CSP allows the supabase websocket',
    /wss:\/\/\*\.supabase\.co/.test(hdr['Content-Security-Policy']));
  assert('clickjacking blocked', hdr['X-Frame-Options'] === 'DENY'
    && /frame-ancestors 'none'/.test(hdr['Content-Security-Policy']));
  assert('nosniff present', hdr['X-Content-Type-Options'] === 'nosniff');
  assert('Permissions-Policy present', Boolean(hdr['Permissions-Policy']));

  /* Los hashes de la CSP se calculan del HTML: si alguien edita un arranque
   * inline y no los regenera, la página rompe en producción sin avisar. */
  const csp = hdr['Content-Security-Policy'];
  const inlinePat = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let drift = [];
  for (const f of fs.readdirSync(root).filter(x => x.endsWith('.html'))) {
    const html = read(f);
    let m;
    while ((m = inlinePat.exec(html)) !== null) {
      const h = 'sha256-' + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64');
      if (!csp.includes(h)) drift.push(`${f}: ${h}`);
    }
  }
  assert(`every inline script is in the CSP${drift.length ? ' — falta: ' + drift.join(', ') : ''}`,
    drift.length === 0);
}

/* ── Confirmación de correo ─────────────────────────────────────────────────
 * Preparado para cuando se active "Confirm email" en Supabase. Mientras esté
 * desactivado este camino no se recorre, así que sin estas comprobaciones un
 * fallo aquí no se notaría hasta el día que se encienda.
 */
{
  const auth = read('src/js/services/AuthService.js');
  const ctrl = read('src/js/controllers/AuthController.js');

  /* Sin `emailRedirectTo` el enlace del correo lleva al Site URL, o sea a la
   * portada, y el usuario tiene que buscarse el login. */
  assert('signUp sets the confirmation redirect', /emailRedirectTo:\s*_confirmRedirectUrl/.test(auth));
  assert('confirmation lands on the login view', /login\.html\?view=confirmed/.test(auth));

  /* Quien no reciba el correo se queda con una cuenta inservible: registrarse
   * otra vez responde "este correo ya está registrado". */
  assert('resending the confirmation is possible', /async function resendConfirmation/.test(auth));
  assert('resend uses the supabase resend endpoint', /_sb\.auth\.resend\(/.test(auth));
  assert('resendConfirmation is exported', /^\s*resendConfirmation,$/m.test(auth));

  assert('login handles the confirmed deep-link', /vista === 'confirmed'/.test(ctrl));
  assert('register offers the resend link', /_mostrarReenvio\(/.test(ctrl));

  /* Los mensajes deben existir en los tres idiomas o el usuario vería la clave
   * en crudo; el test de paridad cubre el resto. */
  for (const clave of ['emailConfirmed', 'resendConfirm', 'resendDone', 'resendFail',
                       'errEmailNotConfirmed']) {
    for (const idioma of ['es', 'en', 'zh']) {
      assert(`${idioma}: auth.${clave}`,
        new RegExp(`^\\s*${clave}:`, 'm').test(read(`src/js/locales/${idioma}.js`)));
    }
  }

  const authCss = read('src/css/auth.css');
  assert('resend link has styles', /\.auth-link-btn\s*\{/.test(authCss));
  assert('resend link is keyboard-visible', /\.auth-link-btn:focus-visible/.test(authCss));
}

/* ── Elementos 3D ───────────────────────────────────────────────────────────
 * Son decoración, así que lo que se comprueba aquí es sobre todo que no le
 * cuesten nada a quien no los ve.
 */
{
  const neural = read('src/js/services/NeuralBackground.js');
  const tilt = read('src/js/services/CardTilt.js');
  const orbJs = read('src/js/components/ChatOrb.js');
  const orbCss = read('src/css/orb.css');

  /* Three.js pesa 194 KB comprimidos, casi tres veces el arranque entero. */
  assert('three is vendored, not pulled from a CDN',
    fs.existsSync(path.join(root, 'src/js/vendor/three.module.js'))
    && fs.existsSync(path.join(root, 'src/js/vendor/three.core.js')));
  assert('three is not referenced from any CDN',
    !fs.readdirSync(root).filter(f => f.endsWith('.html'))
      .some(f => /cdn[^"']*three/i.test(read(f))));
  /* El módulo importa `./three.core.js` con ese nombre exacto: si alguien
   * renombra el fichero al actualizar, la carga falla en tiempo de ejecución. */
  assert('the vendored module resolves its core',
    /three\.core\.js/.test(read('src/js/vendor/three.module.js')));

  assert('three loads lazily', /await import\(/.test(neural));
  assert('the scene is skipped on reduced motion', /prefers-reduced-motion/.test(neural));
  assert('the scene respects data saver', /saveData/.test(neural));
  assert('the scene skips low-end devices', /deviceMemory/.test(neural));
  assert('the scene needs webgl', /getContext\('webgl/.test(neural));
  assert('the renderer is transparent', /alpha:\s*true/.test(neural));

  /* Sin estas dos pausas el bucle seguiría consumiendo GPU con el hero fuera
   * de pantalla o la pestaña en segundo plano. */
  assert('the loop pauses off-screen', /IntersectionObserver/.test(neural));
  assert('the loop pauses on a hidden tab', /visibilitychange/.test(neural));
  assert('pausing cancels the frame', /cancelAnimationFrame/.test(neural));
  assert('the loop state is observable', /dataset\.anim/.test(neural));
  /* La GPU no se libera sola: geometrías, materiales y texturas hay que
   * soltarlos a mano o quedan retenidos. */
  assert('gpu resources are released', /renderer\.dispose\(\)/.test(neural)
    && /geometry\.dispose\(\)/.test(neural));
  assert('the canvas follows its host size', /ResizeObserver/.test(neural));
  assert('the pixel ratio is capped', /Math\.min\(window\.devicePixelRatio/.test(neural));

  /* Se mira dentro del bloque de la regla, no en una ventana de caracteres:
   * un comentario más largo desplazaba la propiedad fuera del alcance. */
  assert('the background sits behind content and ignores clicks',
    /\[data-neural-bg\]\s*\{[^}]*pointer-events:\s*none/.test(orbCss)
    && /\[data-neural-bg\]\s*\{[^}]*z-index:\s*0/.test(orbCss));

  /* En táctil no existe el hover: el efecto se quedaría pegado tras el toque. */
  assert('tilt is desktop-only', /pointer:\s*fine/.test(tilt));
  assert('tilt respects reduced motion', /prefers-reduced-motion/.test(tilt));
  /* El catálogo se repinta al filtrar, así que hay que enganchar lo nuevo. */
  assert('tilt catches cards rendered later', /MutationObserver/.test(tilt));
  assert('tilt uses a 3d transform', /perspective\(900px\)[\s\S]{0,60}rotateX/.test(tilt));

  assert('the orb has its four layers',
    ['orb__halo', 'orb__core', 'orb__spec', 'orb__ring'].every(c => orbJs.includes(c)));
  assert('the orb is decorative for screen readers', /aria-hidden/.test(orbJs));
  assert('the orb reacts to the thinking state',
    /ChatOrb\.setState\(show \? 'thinking' : 'idle'\)/.test(read('src/js/controllers/AIChatController.js')));
  assert('the orb breathes', /@keyframes orb-breathe/.test(orbCss));
  assert('thinking speeds the orb up',
    /\.orb--thinking[\s\S]{0,180}animation-duration:\s*1\.\d+s/.test(orbCss));
  assert('all 3d motion stops on reduced motion',
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none\s*!important/.test(orbCss));
}

/* ── Presupuesto de composición ─────────────────────────────────────────────
 * Lo que hacía lenta la landing no era una cosa grande, sino muchas pequeñas
 * corriendo a la vez. Estas comprobaciones fijan los dos hallazgos concretos.
 */
{
  const budget = read('src/js/services/AnimationBudget.js');
  const neural2 = read('src/js/services/NeuralBackground.js');
  const orbCss2 = read('src/css/orb.css');

  /* Un elemento animado con `backdrop-filter` obliga a recomponer todo lo que
   * tiene detrás en cada fotograma. Había tres orbes y cuatro tarjetas
   * flotantes haciéndolo sobre el hero a la vez. */
  const reglasAnimadasConBackdrop = [];
  for (const archivo of fs.readdirSync(path.join(root, 'src/css')).filter(f => f.endsWith('.css'))) {
    // Sin comentarios: si no, el propio texto que explica esta regla la dispara.
    const css = read(`src/css/${archivo}`).replace(/\/\*[\s\S]*?\*\//g, '');
    const bloques = css.match(/\{[^{}]*\}/g) || [];
    for (const b of bloques) {
      /* Solo las infinitas. Una animación de entrada dura unas décimas y su
       * coste está acotado; lo grave es recomponer el fondo en cada fotograma
       * para siempre, que es lo que hacían los orbes y las tarjetas flotantes. */
      if (/backdrop-filter:\s*(?!none)/.test(b) && /animation:[^;]*infinite/.test(b)) {
        reglasAnimadasConBackdrop.push(archivo);
      }
    }
  }
  assert(`no rule loops an animation on a backdrop-filter element${reglasAnimadasConBackdrop.length ? ': ' + [...new Set(reglasAnimadasConBackdrop)].join(', ') : ''}`,
    reglasAnimadasConBackdrop.length === 0);

  /* Las animaciones CSS no se paran solas fuera de pantalla: el navegador las
   * sigue componiendo aunque nadie las vea. */
  assert('off-screen animations are paused', /animationPlayState\s*=\s*'paused'/.test(budget));
  assert('the budget uses an observer', /IntersectionObserver/.test(budget));
  assert('the budget stays out of the way on reduced motion',
    /prefers-reduced-motion/.test(budget));
  assert('the landing loads the budget', /AnimationBudget\.js/.test(read('index.html')));

  /* Reglas pedidas para la escena 3D. */
  assert('the 3d scene waits for an idle moment', /requestIdleCallback/.test(neural2));
  assert('the 3d scene is off on phones', /max-width:\s*768px[\s\S]{0,80}return false/.test(neural2));
  assert('a css gradient covers the 3d-less case',
    /\[data-neural-bg\]\s*\{[^}]*radial-gradient/.test(orbCss2));
  assert('the gradient steps aside when the canvas exists',
    /\[data-neural-bg\]:has\(canvas\)/.test(orbCss2));
}

/* ── QR de los certificados ─────────────────────────────────────────────────
 * El QR se pedía a `api.qrserver.com`. Eso mandaba el código de verificación
 * de cada certificado a un servidor ajeno —un código de verificación no
 * debería salir de aquí— y, desde que hay CSP, la imagen venía bloqueada:
 * los certificados se generaban sin QR.
 */
{
  const share = read('src/js/services/CertificateShare.js');
  assert('the qr is generated locally', /_qrDataUrl\(/.test(share));
  /* Sin comentarios: el propio texto que explica este cambio nombra el
   * servicio que se retiró, y haría saltar la comprobación. */
  /* El `(?<!:)` importa: sin él, el `//` de `https://` se toma por el inicio de
   * un comentario y se borra la URL entera, que es justo lo que se quiere
   * detectar. Una primera versión de esta línea daba un falso "correcto". */
  const shareCode = share.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(?<!:)\/\/[^\n]*/g, '');
  assert('no third-party qr service', !/qrserver\.com/.test(shareCode));
  assert('the qr library is vendored',
    fs.existsSync(path.join(root, 'src/js/vendor/qrcode.js')));
  /* La librería tiene que cargarse antes que quien la usa. */
  for (const page of fs.readdirSync(root).filter(f => f.endsWith('.html'))) {
    const html = read(page);
    if (!html.includes('CertificateShare.js')) continue;
    assert(`${page} loads the qr library first`,
      html.indexOf('vendor/qrcode.js') !== -1
      && html.indexOf('vendor/qrcode.js') < html.indexOf('CertificateShare.js'));
  }
  /* La URL que codifica el QR no debe cambiar nunca: hay certificados ya
   * impresos apuntando a ella. */
  assert('the verify deep-link is unchanged', /verify\.html\?id=/.test(share));
}

/* ── Limpieza del repositorio ───────────────────────────────────────────── */
{
  /* Iconos de terceros: cada carga informaba a flaticon de qué miraba cada
   * usuario, y una caída suya dejaba el catálogo sin imágenes. */
  const conIconos = ['src/js/data/CourseCurriculum.js', 'src/js/data/extendedCourses.js',
                     'src/js/services/DataService.js', 'src/js/controllers/QuizzesController.js',
                     'src/js/data/GuidedProjectsData.js', 'index.html'];
  for (const f of conIconos) {
    assert(`${f} has no third-party icon URLs`, !/cdn-icons-png\.flaticon\.com/.test(read(f)));
  }

  for (const dead of ['scripts/apply-bundles.py', 'scripts/sync-zh-locale.py',
                      'tests/smoke-ci.py', 'tests/dataservice_test.js',
                      'src/js/config/asset-version.js',
                      'src/img/marketing/theme-light-dark-grid.png']) {
    assert(`removed: ${dead}`, !fs.existsSync(path.join(root, dead)));
  }

  const ignore = read('.gitignore');
  assert('.gitignore blocks zips', /^\*\.zip$/m.test(ignore));
  assert('.gitignore blocks built bundles', /^src\/js\/dist\/$/m.test(ignore));

  /* El fichero se guardó como UTF-8 y se releyó como cp1252. */
  const shellRaw = fs.readFileSync(path.join(root, 'scripts/bundle-shell.js'));
  assert('bundle-shell has no BOM',
    !(shellRaw[0] === 0xEF && shellRaw[1] === 0xBB && shellRaw[2] === 0xBF));
  /* Ojo con el rango: cp1252 mapea 0x80-0x9F a caracteres como U+20AC (\u20ac) o
   * U+2014, que NO est\u00e1n en U+0080-U+00BF. Una primera versi\u00f3n de esta
   * comprobaci\u00f3n solo miraba ese rango y daba por limpio un fichero que a\u00fan
   * ten\u00eda "IN4MIND \u00e2\u20ac\u201d". Aqu\u00ed se incluyen los s\u00edmbolos de cp1252. */
  const MOJIBAKE = /[\u00c2\u00c3\u00e2][\u0080-\u00ff\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u017e\u0178]/;
  assert('bundle-shell has no mojibake', !MOJIBAKE.test(shellRaw.toString('utf8')));
  /* Y ning\u00fan otro fichero de texto del proyecto. */
  {
    const sospechosos = [];
    const mirar = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.git', 'dist'].includes(e.name)) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { mirar(full); continue; }
        if (!/\.(js|json|css|html|md|sql)$/.test(e.name)) continue;
        const buf = fs.readFileSync(full);
        if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
          sospechosos.push(`${path.relative(root, full)} (BOM)`);
        } else if (MOJIBAKE.test(buf.toString('utf8'))) {
          sospechosos.push(path.relative(root, full));
        }
      }
    };
    mirar(root);
    assert(`no BOM or mojibake anywhere${sospechosos.length ? ': ' + sospechosos.slice(0, 5).join(', ') : ''}`,
      sospechosos.length === 0);
  }
}

if (failed) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}

console.log('\nAll smoke checks passed');
