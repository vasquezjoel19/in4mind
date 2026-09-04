/**
 * IN4MIND — Prueba de conexión real con Groq.
 *
 * /api/health solo dice si la variable está *configurada*. Esto hace una
 * llamada mínima de verdad (1 token) para confirmar que la clave es válida y
 * que el modelo responde, que es lo que falla en la práctica: clave caducada,
 * revocada, sin crédito o con el modelo retirado.
 *
 * Nunca devuelve la clave: solo su estado, el modelo probado y la latencia.
 *
 * GET /api/groq/ping         → usa el resultado cacheado si es reciente
 * GET /api/groq/ping?fresh=1 → fuerza una llamada nueva
 */
'use strict';

const { resolveGroqKey, resolveGroqModel, ENV_VAR } = require('../_lib/groq-env.js');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL_INFO = resolveGroqModel();
const DEFAULT_MODEL = MODEL_INFO.model;

/** Evita quemar cuota si alguien recarga la página de diagnóstico. */
const CACHE_MS = 60 * 1000;
const TIMEOUT_MS = 8000;

let _cache = null; // { at: number, payload: object, status: number }

function _statusToError(status, rawBody) {
  if (status === 401 || status === 403) return 'GROQ_API_KEY_INVALID';
  if (status === 429) return 'GROQ_RATE_LIMITED';

  let upstreamCode = '';
  try {
    upstreamCode = String(JSON.parse(rawBody)?.error?.code || '');
  } catch { /* Groq no siempre devuelve JSON */ }

  if (status === 404 || /decommission|model_not_found|does_not_exist/i.test(upstreamCode)) {
    return 'GROQ_MODEL_NOT_FOUND';
  }
  return `GROQ_HTTP_${status}`;
}

async function _callGroq(apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      // Petición deliberadamente mínima: confirma credencial y modelo sin gastar.
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        temperature: 0,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { ok: keyOk, key: apiKey, reason } = resolveGroqKey();
  if (!keyOk) {
    return res.status(503).json({
      ok: false,
      configured: false,
      error: 'GROQ_API_KEY_MISSING',
      reason,
      hint: `Define ${ENV_VAR} en Vercel → Settings → Environment Variables y vuelve a desplegar.`,
    });
  }

  const fresh = String(req.query?.fresh || '') === '1';
  if (!fresh && _cache && Date.now() - _cache.at < CACHE_MS) {
    return res.status(_cache.status).json({ ..._cache.payload, cached: true });
  }

  const started = Date.now();
  let payload;
  let status;

  try {
    const groqRes = await _callGroq(apiKey);
    const latencyMs = Date.now() - started;

    if (!groqRes.ok) {
      const detail = await groqRes.text().catch(() => '');
      console.error('[api/groq/ping] upstream', groqRes.status, detail.slice(0, 300));
      status = groqRes.status === 429 ? 429 : 502;
      payload = {
        ok: false,
        configured: true,
        error: _statusToError(groqRes.status, detail),
        upstreamStatus: groqRes.status,
        model: DEFAULT_MODEL,
        // Si el modelo no es de los conocidos, es lo primero que hay que mirar.
        modelSource: MODEL_INFO.source,
        modelKnown: MODEL_INFO.known,
        latencyMs,
      };
    } else {
      const data = await groqRes.json().catch(() => null);
      status = 200;
      payload = {
        ok: true,
        configured: true,
        model: data?.model || DEFAULT_MODEL,
        latencyMs,
        // Confirma que la respuesta trae la forma esperada, no solo un 200.
        respondedWithChoices: Array.isArray(data?.choices) && data.choices.length > 0,
      };
    }
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    console.error('[api/groq/ping]', err);
    status = 504;
    payload = {
      ok: false,
      configured: true,
      error: aborted ? 'GROQ_TIMEOUT' : 'GROQ_UNREACHABLE',
      model: DEFAULT_MODEL,
      latencyMs: Date.now() - started,
    };
  }

  _cache = { at: Date.now(), payload, status };
  return res.status(status).json(payload);
};
