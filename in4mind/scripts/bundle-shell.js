/**
 * IN4MIND — Genera bundles de producción (boot + app-shell + landing).
 * Uso: node scripts/bundle-shell.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/js/dist');

/* ── Versión de los activos: una sola fuente de verdad ──────────────────────
 * Antes el número vivía a la vez aquí y escrito a mano en los `?v=` de las 19
 * páginas. Mantenerlos a mano significaba que, si alguien cambiaba un CSS y se
 * olvidaba de tocar los 375 `?v=`, los navegadores seguían sirviendo el
 * fichero viejo desde caché sin que nada fallara de forma visible.
 *
 * Ahora la calcula el build y reescribe los `?v=` del HTML. Se deriva del
 * contenido: si nada cambia, la versión no cambia y la caché se aprovecha; si
 * cambia un solo byte de CSS o de JS, cambia y los navegadores rebuscan.
 * `ASSET_VERSION` permite fijarla a mano si hiciera falta.
 */
function computeVersion() {
  if (process.env.ASSET_VERSION) return process.env.ASSET_VERSION.trim();

  const hash = crypto.createHash('sha1');
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : 1)) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(js|css)$/.test(entry.name)) continue;
      // El nombre entra en el hash: renombrar también debe invalidar la caché.
      hash.update(path.relative(root, full).replace(/\\/g, '/'));
      hash.update(fs.readFileSync(full));
    }
  };
  walk(path.join(root, 'src'));
  /* `scripts/` también: este fichero decide qué entra en cada bundle y en qué
     orden, así que cambiarlo cambia la salida aunque `src/` esté intacto. Sin
     esto, arreglar el orden del arranque no movía la versión y los navegadores
     seguían sirviendo el bundle anterior desde caché. */
  walk(path.join(root, 'scripts'));
  return hash.digest('hex').slice(0, 12);
}

const VERSION = computeVersion();

/* Español va dentro porque es el idioma por defecto y, sobre todo, la raíz de
   la cadena de respaldo de `I18n.t()`: si una clave falta en el idioma activo
   se busca en ES antes de devolver el identificador crudo. Sacarlo haría que
   cualquier hueco de traducción se viera como "nav.home" en pantalla. */
const BOOT_FILES = [
  'src/js/controllers/ThemeController.js',
  'src/js/a11y-boot.js',
  'src/js/locales/es.js',
  'src/js/services/I18n.js',
];

/* Inglés y chino se sirven aparte: antes los tres idiomas y sus dos temarios
   viajaban a todo el mundo, unos 435 KB de los 457 que pesaba boot.bundle.
   Quien navega en español ya no descarga nada de esto. */
const LOCALE_BUNDLES = {
  en: ['src/js/locales/en.js', 'src/js/locales/curriculum-en.js'],
  zh: ['src/js/locales/zh.js', 'src/js/locales/curriculum-zh.js'],
};

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
 * @param {string[]} files
 * @param {string} suffix  Código que se ejecuta DESPUÉS de los ficheros.
 *
 * `suffix` iba antes junto al banner, es decir, delante de todo. El arranque
 * (`ThemeController.initEarly()` / `I18n.initEarly()`) quedaba así por encima
 * de las definiciones, y como son `const`, hasta el `typeof` lanza
 * ReferenceError por la zona muerta temporal. El `try/catch` se lo tragaba en
 * silencio: en producción ninguno de los dos se ha ejecutado nunca, de modo
 * que el idioma guardado se ignoraba en cada carga y el tema se aplicaba tarde.
 */
function concat(files, suffix = '') {
  const parts = files.map((rel) => {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) throw new Error(`Missing: ${rel}`);
    return `\n;/* --- ${rel} --- */\n${fs.readFileSync(full, 'utf8')}\n`;
  });
  const banner = `/*! IN4MIND bundle ${VERSION} — ${new Date().toISOString()} */\n`;
  return banner + parts.join('') + suffix;
}

fs.mkdirSync(outDir, { recursive: true });

const bootExtra = `
;try {
  if (typeof ThemeController !== 'undefined' && ThemeController.initEarly) ThemeController.initEarly();
  if (typeof I18n !== 'undefined' && I18n.initEarly) I18n.initEarly();
} catch (e) { /* boot */ }
`;

/* Cargador del idioma, al principio del boot y antes que nada.
 *
 * `document.write` está desaconsejado en general, pero aquí es justo lo que
 * hace falta: boot.bundle es un script de <head> sin `defer`, así que el
 * parser está detenido y el script inyectado se ejecuta antes que el siguiente
 * del documento. Con `appendChild` la carga sería asíncrona y el diccionario
 * podría no estar cuando `applyDom()` traduce la página.
 *
 * No hace falta que esté listo durante el resto de boot.bundle: `initEarly()`
 * solo lee localStorage y fija `lang`/`data-locale`; la traducción ocurre más
 * tarde, ya con el idioma cargado.
 */
const localeLoader = `
;(function () {
  try {
    var idiomas = ${JSON.stringify(Object.keys(LOCALE_BUNDLES))};
    var guardado = (localStorage.getItem('in4mind_locale') || '').slice(0, 5).toLowerCase();
    var corto = guardado.split('-')[0];
    if (idiomas.indexOf(corto) === -1) return;   // español: nada que cargar
    document.write('<scr' + 'ipt src="src/js/dist/locale-' + corto + '.bundle.js?v=${VERSION}"><\\/scr' + 'ipt>');
  } catch (e) { /* sin almacenamiento: se queda en español */ }
})();
`;

const outputs = [
  ['boot.bundle.js', localeLoader + concat(BOOT_FILES, bootExtra)],
  ['app-shell.bundle.js', concat(SHELL_FILES)],
  ['landing.bundle.js', concat(LANDING_FILES)],
];

for (const [codigo, ficheros] of Object.entries(LOCALE_BUNDLES)) {
  outputs.push([`locale-${codigo}.bundle.js`, concat(ficheros)]);
}

/* ── Minificación ───────────────────────────────────────────────────────────
 * Deliberadamente tolerante a fallos: si esbuild no está instalado o revienta,
 * se escribe el bundle sin minificar y se avisa. Un despliegue con ficheros
 * algo más grandes es un problema pequeño; un build que falla y deja el sitio
 * sin JavaScript, no.
 */
function minify(code, name) {
  let esbuild;
  try {
    esbuild = require('esbuild');
  } catch {
    if (!minify._avisado) {
      minify._avisado = true;
      console.warn('[build] esbuild no disponible: los bundles van sin minificar.');
    }
    return { code, minified: false };
  }

  try {
    const res = esbuild.transformSync(code, {
      minify: true,
      // Los bundles son scripts clásicos concatenados, con `const` de nivel
      // superior que se comparten entre ficheros. Sin esto, esbuild podría
      // tratarlos como módulo y romper esas referencias.
      format: undefined,
      target: 'es2020',
      legalComments: 'none',
    });
    return { code: res.code, minified: true };
  } catch (err) {
    console.warn(`[build] no se pudo minificar ${name}: ${err.message}`);
    return { code, minified: false };
  }
}

for (const [name, body] of outputs) {
  const out = path.join(outDir, name);
  const original = Buffer.byteLength(body, 'utf8');
  const { code, minified } = minify(body, name);
  // El banner se vuelve a poner: `legalComments: 'none'` lo quita, y sirve para
  // saber qué versión se está sirviendo al depurar en producción.
  const final = `/*! IN4MIND ${name} ${VERSION} */\n${code}`;
  fs.writeFileSync(out, final, 'utf8');

  const kb = (n) => Math.round(n / 1024);
  const ahorro = minified ? ` (minificado, ${kb(original)} -> ${kb(Buffer.byteLength(final, 'utf8'))} KB)` : '';
  console.log(`Wrote src/js/dist/${name}${ahorro || ` (${kb(original)} KB)`}`);
}

/* ── Sincronización de los `?v=` del HTML ───────────────────────────────── */
{
  const paginas = fs.readdirSync(root).filter((f) => f.endsWith('.html'));
  let tocadas = 0;
  let sustituciones = 0;

  for (const nombre of paginas) {
    const full = path.join(root, nombre);
    const antes = fs.readFileSync(full, 'utf8');
    // Solo activos locales: nunca se toca una URL de CDN (llevan su propio
    // `integrity`, y cambiarles la query invalidaría el hash).
    const despues = antes.replace(
      /((?:src|href)="(?!https?:)[^"?]+\.(?:js|css))\?v=[^"]*"/g,
      (_, prefijo) => { sustituciones += 1; return `${prefijo}?v=${VERSION}"`; }
    );
    if (despues !== antes) {
      fs.writeFileSync(full, despues, 'utf8');
      tocadas += 1;
    }
  }
  console.log(`Asset version: ${sustituciones} referencias en ${tocadas} páginas`);
}

/* El service worker cachea por nombre: si no cambia, sirve lo viejo. */
{
  const swPath = path.join(root, 'sw.js');
  if (fs.existsSync(swPath)) {
    const antes = fs.readFileSync(swPath, 'utf8');
    const despues = antes.replace(
      /const CACHE_NAME = '[^']*';/,
      `const CACHE_NAME = 'in4mind-${VERSION}';`
    );
    if (despues !== antes) {
      fs.writeFileSync(swPath, despues, 'utf8');
      console.log(`Service worker cache: in4mind-${VERSION}`);
    }
  }
}

console.log(`VERSION=${VERSION}`);
