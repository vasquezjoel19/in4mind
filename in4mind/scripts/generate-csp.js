/**
 * IN4MIND — Genera la Content-Security-Policy de vercel.json.
 *
 * Uso:
 *   node scripts/generate-csp.js          escribe la cabecera en vercel.json
 *   node scripts/generate-csp.js --check  falla si está desincronizada (CI)
 *
 * Por qué se genera y no se escribe a mano: las páginas tienen scripts inline
 * (los `DOMContentLoaded` que arrancan cada controlador, y el carrusel de
 * index.html). Para no abrir la puerta con 'unsafe-inline' —que permitiría
 * ejecutar cualquier script inyectado, justo lo que la CSP debe frenar— cada
 * bloque entra en la política por su hash SHA-256. Al editar un script inline
 * hay que regenerar; `--check` lo convierte en un fallo de CI en vez de una
 * página en blanco en producción.
 *
 * vercel.json NO puede generarse durante el build: Vercel lo lee del repo
 * antes de construir. Por eso se commitea ya generado y CI lo verifica.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const appRoot = path.join(__dirname, '..');
const vercelJsonPath = path.join(appRoot, '..', 'vercel.json');

/** Paquete UMD de Supabase fijado con SRI en el HTML. */
const CDN_SCRIPTS = 'https://cdn.jsdelivr.net';

/**
 * Orígenes permitidos por directiva. Todo lo que no aparezca aquí queda
 * bloqueado por `default-src 'self'`.
 */
const SOURCES = {
  // Google Fonts sirve el CSS desde googleapis y las fuentes desde gstatic.
  style: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  font: ["'self'", 'https://fonts.gstatic.com', 'data:'],
  // flaticon: iconos del catálogo. supabase: avatares y adjuntos.
  // data:/blob: certificados y exportaciones que la app genera en el navegador.
  img: [
    "'self'", 'data:', 'blob:',
    'https://cdn-icons-png.flaticon.com',
    'https://*.supabase.co',
    'https://i.ytimg.com',
  ],
  // REST + Realtime de Supabase. Las llamadas a Groq salen por /api (self).
  connect: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'],
  // youtube: vídeos de las lecciones. https: lo exige la vista previa de la
  // Ruta Empleable, que incrusta el proyecto que publica cada estudiante.
  frame: ["'self'", 'https://www.youtube.com', 'https://www.youtube-nocookie.com', 'https:'],
  media: ["'self'", 'blob:'],
};

/** Texto exacto entre <script ...> y </script>, solo para bloques sin src. */
function inlineScripts(html) {
  const out = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (/\ssrc\s*=/.test(m[1])) continue;
    out.push(m[2]);
  }
  return out;
}

/** El navegador hashea el contenido tal cual, byte a byte. */
function sha256(source) {
  return `'sha256-${crypto.createHash('sha256').update(source, 'utf8').digest('base64')}'`;
}

function collectHashes() {
  const files = fs.readdirSync(appRoot).filter(f => f.endsWith('.html')).sort();
  const hashes = new Set();
  for (const file of files) {
    const html = fs.readFileSync(path.join(appRoot, file), 'utf8');
    for (const block of inlineScripts(html)) hashes.add(sha256(block));
  }
  // Orden estable: sin esto, un cambio de sistema de ficheros mueve la cabecera.
  return [...hashes].sort();
}

function buildCsp(hashes) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `script-src 'self' ${CDN_SCRIPTS} ${hashes.join(' ')}`,
    // Sin manejadores inline (onclick=...) en el HTML: se prohíben del todo.
    "script-src-attr 'none'",
    `style-src ${SOURCES.style.join(' ')}`,
    `font-src ${SOURCES.font.join(' ')}`,
    `img-src ${SOURCES.img.join(' ')}`,
    `connect-src ${SOURCES.connect.join(' ')}`,
    `frame-src ${SOURCES.frame.join(' ')}`,
    `media-src ${SOURCES.media.join(' ')}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function readVercelJson() {
  return JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
}

/** Cabeceras del patrón global `/(.*)`, que es donde vive la CSP. */
function globalHeaders(config) {
  const entry = (config.headers || []).find(h => h.source === '/(.*)');
  if (!entry) throw new Error('vercel.json: falta la entrada de headers para "/(.*)"');
  return entry.headers;
}

function currentCsp(config) {
  const found = globalHeaders(config).find(h => h.key === 'Content-Security-Policy');
  return found ? found.value : null;
}

function main() {
  const check = process.argv.includes('--check');
  const hashes = collectHashes();
  const csp = buildCsp(hashes);
  const config = readVercelJson();
  const existing = currentCsp(config);

  if (check) {
    if (existing === csp) {
      console.log(`[csp] vercel.json al día (${hashes.length} scripts inline).`);
      return;
    }
    console.error('[csp] vercel.json NO coincide con el HTML actual.');
    console.error('[csp] Ejecuta: npm run build:csp');
    process.exitCode = 1;
    return;
  }

  const headers = globalHeaders(config);
  const found = headers.find(h => h.key === 'Content-Security-Policy');
  if (found) found.value = csp;
  else headers.push({ key: 'Content-Security-Policy', value: csp });

  fs.writeFileSync(vercelJsonPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`[csp] vercel.json actualizado (${hashes.length} scripts inline).`);
}

main();
