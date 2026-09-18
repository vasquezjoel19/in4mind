/**
 * IN4MIND — Paridad de claves entre es / en / zh.
 *
 * `I18n.t()` recurre a español cuando una clave falta en el idioma activo, así
 * que un hueco no rompe la pantalla: se ve el texto en español. Eso es un
 * respaldo, no un objetivo — pasa desapercibido hasta que alguien lo reporta.
 *
 * Este test funciona como trinquete: registra los huecos que había al
 * escribirlo, los enumera como aviso y falla solo si aumentan. Así no bloquea
 * el build por una deuda que ya existía, pero impide que crezca.
 *
 * También comprueba lo que sí es un fallo de verdad:
 *   - una clave presente en otro idioma pero ausente en español, que rompería
 *     la cadena de respaldo y saldría en crudo por pantalla;
 *   - una clave usada en el código que no existe en ningún idioma.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const localesDir = path.join(root, 'src/js/locales');

/* Los tres idiomas están completos (1265 claves cada uno) desde el 2026-09-18,
 * así que la tolerancia es cero: cualquier clave nueva sin traducir hace fallar
 * el test y dice cuál es. Si alguna vez hiciera falta aceptar deuda temporal,
 * se sube el número aquí y queda constancia de cuánta hay. */
const DEUDA = { en: 0, zh: 0 };

let failed = 0;
function assert(name, cond, detail = '') {
  if (cond) {
    console.log(`OK  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

/** Ejecuta el fichero de locale y devuelve el objeto que declara. */
function cargar(fichero, variable) {
  const codigo = fs.readFileSync(path.join(localesDir, fichero), 'utf8');
  const sandbox = { module: { exports: {} } };
  vm.createContext(sandbox);
  // Los locales son scripts clásicos con un `const` de nivel superior; se
  // evalúan y se recoge la variable por nombre.
  vm.runInContext(`${codigo}\n;globalThis.__out = ${variable};`, sandbox);
  return sandbox.__out;
}

/** Rutas de todas las hojas del objeto: 'nav.home', 'ai.errEmpty'… */
function rutas(obj, prefijo = '', acc = new Set()) {
  for (const [k, v] of Object.entries(obj || {})) {
    const ruta = prefijo ? `${prefijo}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) rutas(v, ruta, acc);
    else acc.add(ruta);
  }
  return acc;
}

const dicts = {
  es: cargar('es.js', 'LOCALE_ES'),
  en: cargar('en.js', 'LOCALE_EN'),
  zh: cargar('zh.js', 'LOCALE_ZH'),
};

const claves = Object.fromEntries(
  Object.entries(dicts).map(([k, v]) => [k, rutas(v)])
);

console.log(`claves: es=${claves.es.size} en=${claves.en.size} zh=${claves.zh.size}`);

for (const idioma of ['en', 'zh']) {
  const faltan = [...claves.es].filter(k => !claves[idioma].has(k)).sort();

  if (faltan.length) {
    console.warn(`\nAVISO  ${idioma}: ${faltan.length} claves sin traducir (se verán en español):`);
    faltan.slice(0, 20).forEach(k => console.warn(`   ${k}`));
    if (faltan.length > 20) console.warn(`   … y ${faltan.length - 20} más`);
    console.warn('');
  }

  assert(
    `${idioma}: los huecos de traducción no aumentan (${faltan.length} <= ${DEUDA[idioma]})`,
    faltan.length <= DEUDA[idioma],
    faltan.length > DEUDA[idioma]
      ? `nuevas sin traducir: ${faltan.slice(0, 5).join(', ')}`
      : ''
  );

  /* Al revés sí es un fallo: español es la raíz del respaldo, así que una
   * clave que solo exista en otro idioma se mostraría en crudo al resto. */
  const soloAqui = [...claves[idioma]].filter(k => !claves.es.has(k)).sort();
  assert(
    `${idioma}: no hay claves que falten en español`,
    soloAqui.length === 0,
    soloAqui.slice(0, 5).join(', ')
  );
}

/* Claves usadas en el código pero inexistentes en los tres idiomas.
 *
 * Solo cuentan las llamadas SIN texto de respaldo. El ayudante local
 * `_t(clave, params, respaldo)` devuelve el tercer argumento cuando la clave
 * no está, así que `_t('dashboard.browseCourses', null, 'Ver cursos')` es
 * deliberado y muestra texto correcto. Sin respaldo, en cambio, `I18n.t()`
 * devuelve la propia clave y el usuario ve "dashboard.browseCourses" escrito
 * en la pantalla. */
{
  const sinRespaldo = new Set();
  const LLAMADA = /\b(?:I18n\.t|_t)\(\s*'([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+)'([^)]*)\)/g;

  const recorrer = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', 'dist', 'locales'].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { recorrer(full); continue; }
      if (!e.name.endsWith('.js')) continue;
      const txt = fs.readFileSync(full, 'utf8');
      let m;
      while ((m = LLAMADA.exec(txt)) !== null) {
        // `resto` es lo que sigue a la clave: ", null, 'Ver cursos'" o "".
        // Una coma de primer nivel de más significa que hay respaldo.
        const resto = m[2] || '';
        const comas = (resto.match(/,/g) || []).length;
        if (comas < 2) sinRespaldo.add(m[1]);
      }
    }
  };
  recorrer(path.join(root, 'src/js'));

  const todas = new Set([...claves.es, ...claves.en, ...claves.zh]);
  const huerfanas = [...sinRespaldo].filter(k => !todas.has(k)).sort();

  console.log(`\nclaves usadas sin texto de respaldo: ${sinRespaldo.size}`);
  assert(
    'ninguna clave sin respaldo se mostraría en crudo',
    huerfanas.length === 0,
    huerfanas.slice(0, 8).join(', ')
  );
}

if (failed) {
  console.error(`\n${failed} comprobación(es) de paridad fallaron`);
  process.exit(1);
}
console.log('\nParidad de idiomas: correcta');
