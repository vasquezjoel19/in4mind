/**
 * IN4MIND — Resolución de la credencial de Groq (única fuente de verdad).
 *
 * Vercel no enruta archivos ni carpetas que empiezan por `_`, así que este
 * módulo se despliega como dependencia pero nunca como endpoint.
 *
 * Antes cada handler leía `process.env.GROQ_API_KEY` a su manera: `chat.js`
 * solo comprobaba que existiera y `health.js` además buscaba el texto
 * "TU_API_KEY". Con un placeholder configurado, `/api/health` respondía
 * `groq: false` mientras `/api/groq/chat` sí intentaba la llamada y devolvía un
 * 401 confuso. Aquí se unifica el criterio.
 *
 * Variable de entorno: GROQ_API_KEY (sin prefijo de framework — este proyecto
 * es HTML/JS estático + funciones Node, así que `process.env` solo existe en el
 * servidor y la clave nunca llega al navegador).
 */
'use strict';

const ENV_VAR = 'GROQ_API_KEY';

/** Valores de plantilla que la gente pega por error desde la documentación. */
const PLACEHOLDERS = [
  'TU_API_KEY',
  'TU_CLAVE',
  'PEGAR',
  'YOUR_API_KEY',
  'YOUR_KEY',
  'XXXX',
  'CHANGEME',
];

/** Se avisa una sola vez por arranque en frío, no en cada petición. */
let _warned = false;

function _warnOnce(message) {
  if (_warned) return;
  _warned = true;
  console.warn(`[groq] ${message}`);
}

/**
 * Lee y valida la credencial.
 *
 * @returns {{ ok: boolean, key: string, reason: string }}
 *   reason: '' | 'missing' | 'placeholder' | 'malformed'
 */
function resolveGroqKey() {
  const raw = process.env[ENV_VAR];

  if (raw == null || String(raw).trim() === '') {
    _warnOnce(
      `${ENV_VAR} no está definida: el asistente responderá 503 (GROQ_API_KEY_MISSING). ` +
      'Defínela en Vercel → Settings → Environment Variables y vuelve a desplegar.'
    );
    return { ok: false, key: '', reason: 'missing' };
  }

  // Copiar y pegar en el panel de Vercel arrastra saltos de línea y espacios;
  // sin recortar, la cabecera queda "Bearer gsk_...\n" y Groq responde 401.
  const key = String(raw).trim();
  const upper = key.toUpperCase();

  if (PLACEHOLDERS.some(p => upper.includes(p))) {
    _warnOnce(
      `${ENV_VAR} contiene un valor de plantilla, no una clave real. ` +
      'Obtén la tuya en https://console.groq.com/keys'
    );
    return { ok: false, key: '', reason: 'placeholder' };
  }

  // Comprobación de forma, no de validez: las claves de Groq son "gsk_" + token.
  // Solo evita errores obvios de pegado; la validez real la dicta Groq.
  if (!/^gsk_[A-Za-z0-9]{20,}$/.test(key)) {
    _warnOnce(
      `${ENV_VAR} no tiene el formato esperado ("gsk_" seguido del token). ` +
      'Revisa que se haya copiado completa y sin comillas.'
    );
    return { ok: false, key: '', reason: 'malformed' };
  }

  return { ok: true, key, reason: '' };
}

/** ¿Está la integración utilizable? Sin exponer la clave. */
function isGroqConfigured() {
  return resolveGroqKey().ok;
}

/* ── Modelo ────────────────────────────────────────────────────────────────
 * Groq retira modelos con el tiempo. Cuando eso pasa devuelve 404/400
 * `model_decommissioned` y toda petición falla, así que el operador tiene que
 * poder cambiar el modelo por variable de entorno sin tocar código.
 *
 * `GROQ_MODEL` es configuración de operador, no entrada del cliente: se acepta
 * cualquier valor con forma válida. La lista de conocidos sirve solo para
 * avisar en los logs si parece un typo — nunca para bloquear.
 */
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';

const KNOWN_MODELS = Object.freeze([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]);

/**
 * @returns {{ model: string, source: 'env'|'default', known: boolean }}
 */
function resolveGroqModel() {
  const raw = process.env.GROQ_MODEL;
  const configured = raw == null ? '' : String(raw).trim();

  if (!configured) {
    return { model: FALLBACK_MODEL, source: 'default', known: true };
  }

  // Un valor con espacios o comillas es casi siempre un error de pegado y
  // provocaría un 400 opaco en cada petición.
  if (/\s|["']/.test(configured)) {
    _warnOnce(
      `GROQ_MODEL contiene espacios o comillas ("${configured}"); se usa ${FALLBACK_MODEL}. ` +
      'Escríbelo tal cual aparece en https://console.groq.com/docs/models'
    );
    return { model: FALLBACK_MODEL, source: 'default', known: true };
  }

  const known = KNOWN_MODELS.includes(configured);
  if (!known) {
    // No se bloquea: puede ser un modelo nuevo posterior a esta versión.
    _warnOnce(
      `GROQ_MODEL="${configured}" no está en la lista de modelos conocidos. ` +
      'Se usará igualmente; si Groq responde 404 model_decommissioned, revisa el nombre.'
    );
  }

  return { model: configured, source: 'env', known };
}

module.exports = {
  resolveGroqKey,
  isGroqConfigured,
  resolveGroqModel,
  ENV_VAR,
  KNOWN_MODELS,
  FALLBACK_MODEL,
};
