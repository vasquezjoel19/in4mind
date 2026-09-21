/**
 * IN4MIND — Paridad de claves entre locales (es / en / zh).
 *
 * Español es la referencia: es el idioma en el que se escribe la interfaz.
 * Una clave que falta en otro idioma no rompe nada —I18n cae al texto por
 * defecto— pero deja la pantalla a medio traducir, y eso no se ve hasta que
 * alguien cambia de idioma. Aquí se ve en CI.
 *
 * Comprueba además claves duplicadas dentro de un mismo objeto: JavaScript se
 * queda con la última en silencio, así que la traducción anterior desaparece
 * sin aviso.
 *
 * Ejecutar: node tests/i18n-parity.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');

const LOCALES = [
  ['es', 'LOCALE_ES', 'src/js/locales/es.js'],
  ['en', 'LOCALE_EN', 'src/js/locales/en.js'],
  ['zh', 'LOCALE_ZH', 'src/js/locales/zh.js'],
];

/** Excepciones justificadas: claves que solo tienen sentido en un idioma. */
const ALLOWED_MISSING = new Set([]);

let failed = 0;

function fail(message) {
  console.error(`FAIL ${message}`);
  failed++;
}

function ok(message) {
  console.log(`OK   ${message}`);
}

function load(globalName, rel) {
  const code = fs.readFileSync(path.join(root, rel), 'utf8');
  const sandbox = {};
  vm.runInNewContext(`${code};this.__locale = ${globalName};`, sandbox);
  return sandbox.__locale;
}

/** Rutas de hoja: "auth.errLogin", "courses.python.title"… */
function flatten(obj, prefix = '', out = new Set()) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    // Un objeto vacío es una hoja a efectos de traducción (p. ej. `bodies: {}`).
    if (value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length) {
      flatten(value, full, out);
    } else {
      out.add(full);
    }
  }
  return out;
}

/**
 * Claves repetidas en un mismo literal de objeto.
 *
 * Se analiza el texto porque al evaluarlo ya solo queda la última: el dato que
 * delata el fallo se pierde justo en el `require`. Se sigue la profundidad con
 * las llaves y se ignoran las que aparecen dentro de cadenas.
 */
function duplicateKeys(rel) {
  const source = fs.readFileSync(path.join(root, rel), 'utf8');
  const seen = [new Set()];
  const dupes = [];
  let depth = 0;
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    // Saltar cadenas y comentarios: dentro no hay claves que contar.
    if (ch === "'" || ch === '"' || ch === '`') {
      const quote = ch;
      i++;
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && source[i + 1] === '*') {
      i = source.indexOf('*/', i);
      if (i === -1) break;
      i += 2;
      continue;
    }

    if (ch === '{') {
      depth++;
      seen[depth] = new Set();
      i++;
      continue;
    }
    if (ch === '}') {
      seen[depth] = undefined;
      depth = Math.max(0, depth - 1);
      i++;
      continue;
    }

    // Clave: identificador (o cadena ya saltada) seguido de ':' al inicio de
    // una propiedad. Basta con mirar identificador + dos puntos.
    const match = /^([A-Za-z_$][\w$]*)\s*:/.exec(source.slice(i));
    if (match && depth > 0) {
      const key = match[1];
      const bucket = seen[depth];
      if (bucket) {
        if (bucket.has(key)) dupes.push({ key, depth });
        else bucket.add(key);
      }
      i += match[0].length;
      continue;
    }

    i++;
  }

  return dupes;
}

const loaded = LOCALES.map(([code, globalName, rel]) => ({
  code,
  rel,
  keys: flatten(load(globalName, rel)),
}));

const [reference, ...others] = loaded;
console.log(`Referencia: ${reference.code} (${reference.keys.size} claves)\n`);

for (const locale of others) {
  const missing = [...reference.keys].filter(k => !locale.keys.has(k) && !ALLOWED_MISSING.has(k));
  const extra = [...locale.keys].filter(k => !reference.keys.has(k));

  if (missing.length) {
    fail(`${locale.code}: faltan ${missing.length} claves que sí están en ${reference.code}`);
    for (const k of missing.slice(0, 40)) console.error(`       · ${k}`);
    if (missing.length > 40) console.error(`       … y ${missing.length - 40} más`);
  } else {
    ok(`${locale.code}: no falta ninguna clave de ${reference.code}`);
  }

  if (extra.length) {
    fail(`${locale.code}: ${extra.length} claves que ${reference.code} no tiene`);
    for (const k of extra.slice(0, 20)) console.error(`       · ${k}`);
    if (extra.length > 20) console.error(`       … y ${extra.length - 20} más`);
  } else {
    ok(`${locale.code}: sin claves sobrantes`);
  }
}

for (const { code, rel } of loaded) {
  const dupes = duplicateKeys(rel);
  if (dupes.length) {
    fail(`${code}: ${dupes.length} clave(s) duplicada(s) — la última gana y borra la anterior`);
    for (const d of dupes) console.error(`       · ${d.key} (nivel ${d.depth})`);
  } else {
    ok(`${code}: sin claves duplicadas`);
  }
}

if (failed) {
  console.error(`\n${failed} comprobación(es) de i18n fallaron`);
  process.exit(1);
}

console.log('\ni18n-parity.test.js: all passed');
