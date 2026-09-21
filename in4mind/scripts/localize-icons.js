/**
 * IN4MIND — Trae a local los iconos que hoy se piden a un CDN externo.
 *
 * Por qué: 20 iconos del catálogo se cargan desde cdn-icons-png.flaticon.com.
 * Eso significa (1) depender de un tercero para que la app se vea entera,
 * (2) filtrar la IP de cada estudiante a ese dominio y (3) una petición extra
 * por icono. Con los archivos servidos desde el propio dominio desaparecen las
 * tres cosas, y `img-src` de la CSP puede cerrarse un poco más.
 *
 * Uso:
 *   node scripts/localize-icons.js --dry-run   enseña qué haría
 *   node scripts/localize-icons.js             descarga y reescribe las rutas
 *
 * Requiere salida a internet. Tras ejecutarlo:
 *   1. Revisa el diff y borra de la CSP el origen de flaticon
 *      (SOURCES.img en scripts/generate-csp.js) y vuelve a generar.
 *   2. La licencia gratuita de Flaticon exige atribución: manténla en los
 *      créditos de la app antes de publicar.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const OUT_DIR = path.join(root, 'src/img/courses/vendor');
const OUT_REL = 'src/img/courses/vendor';

/** Sobrescribible para pruebas: apunta a otro host sin tocar el código. */
const BASE = process.env.ICON_CDN_BASE || 'https://cdn-icons-png.flaticon.com';
const URL_RE = /https:\/\/cdn-icons-png\.flaticon\.com\/(\d+)\/(\d+)\/(\d+)\.png/g;

const DRY = process.argv.includes('--dry-run');

/** Archivos de texto donde pueden aparecer las URLs. */
function sourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['dist', 'node_modules', 'img'].includes(entry.name)) walk(full);
      } else if (/\.(js|html|css|json)$/.test(entry.name)) {
        out.push(full);
      }
    }
  };
  walk(path.join(root, 'src'));
  for (const f of fs.readdirSync(root)) {
    if (f.endsWith('.html')) out.push(path.join(root, f));
  }
  return out;
}

function collect(files) {
  const found = new Map(); // url → nombre local
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(URL_RE)) {
      found.set(m[0], `flaticon-${m[3]}.png`);
    }
  }
  return found;
}

async function download(url, dest) {
  // La URL puede venir de otro host en pruebas; se respeta la ruta.
  const target = BASE === 'https://cdn-icons-png.flaticon.com'
    ? url
    : url.replace('https://cdn-icons-png.flaticon.com', BASE);

  const res = await fetch(target);
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${target}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error(`respuesta vacía en ${target}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  const files = sourceFiles();
  const icons = collect(files);

  if (!icons.size) {
    console.log('[icons] No queda ninguna URL de flaticon: nada que hacer.');
    return;
  }

  console.log(`[icons] ${icons.size} iconos distintos en ${files.length} archivos.`);
  if (DRY) {
    for (const [url, name] of icons) console.log(`  ${url}\n    → ${OUT_REL}/${name}`);
    console.log('[icons] --dry-run: no se ha descargado ni modificado nada.');
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let bytes = 0;
  for (const [url, name] of icons) {
    bytes += await download(url, path.join(OUT_DIR, name));
    console.log(`  ✓ ${name}`);
  }

  let touched = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    let next = text;
    for (const [url, name] of icons) {
      next = next.split(url).join(`${OUT_REL}/${name}`);
    }
    if (next !== text) {
      fs.writeFileSync(file, next, 'utf8');
      touched++;
    }
  }

  console.log(`[icons] ${icons.size} archivos guardados (${Math.round(bytes / 1024)} KB), `
    + `${touched} fuentes reescritas.`);
  console.log('[icons] Siguiente paso: quitar flaticon de SOURCES.img en '
    + 'scripts/generate-csp.js y ejecutar npm run build:csp.');
}

main().catch((err) => {
  console.error(`[icons] ${err.message}`);
  process.exitCode = 1;
});
