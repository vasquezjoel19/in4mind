/**
 * Vercel Serverless — proxy hacia Groq.
 * La API Key vive solo aquí (GROQ_API_KEY); nunca se envía al navegador.
 * Soporta respuesta completa (JSON) y streaming (SSE, mismo formato que Groq).
 */
'use strict';

const { resolveGroqKey, resolveGroqModel, KNOWN_MODELS } = require('../_lib/groq-env.js');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = resolveGroqModel().model;

/* El allowlist evita que un tercero use este endpoint como LLM gratuito con el
 * modelo que quiera. El modelo del operador entra siempre: si no, configurar
 * GROQ_MODEL con un modelo nuevo (p. ej. tras una retirada) haría que el
 * cliente pidiera uno y el proxy sirviera otro. */
const ALLOWED_MODELS = new Set([...KNOWN_MODELS, DEFAULT_MODEL]);
const MAX_TOKENS_CAP = Number(process.env.GROQ_MAX_TOKENS) || 1200;
const DEFAULT_TEMPERATURE = Number.isFinite(Number(process.env.GROQ_TEMPERATURE))
  ? Number(process.env.GROQ_TEMPERATURE)
  : 0.45;

/* Límites para que el endpoint no sea utilizable como LLM gratuito por terceros */
const MAX_MESSAGES = 24;
const MAX_CHARS_PER_MESSAGE = 6000;
const MAX_SYSTEM_CHARS = 8000;

const GUARDRAIL = 'Eres el asistente educativo de IN4MIND. Responde únicamente sobre la plataforma IN4MIND y su catálogo educativo; rechaza cortésmente cualquier otro tema.';

function clamp(text, max) {
  return String(text == null ? '' : text).slice(0, max);
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body && typeof body === 'object' ? body : {};
}

function buildMessages(body) {
  const messages = [{ role: 'system', content: GUARDRAIL }];

  if (body.systemPrompt) {
    messages.push({ role: 'system', content: clamp(body.systemPrompt, MAX_SYSTEM_CHARS) });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_MESSAGES) : [];
  for (const item of history) {
    if (!item || !item.content) continue;
    messages.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: clamp(item.content, MAX_CHARS_PER_MESSAGE),
    });
  }

  return messages;
}

function upstreamPayload(body, stream) {
  const model = ALLOWED_MODELS.has(body.model) ? body.model : DEFAULT_MODEL;
  const maxTokens = Math.min(Number(body.max_tokens) || MAX_TOKENS_CAP, MAX_TOKENS_CAP);
  const rawTemp = Number(body.temperature);
  const temperature = Number.isFinite(rawTemp)
    ? Math.min(Math.max(rawTemp, 0), 2)
    : DEFAULT_TEMPERATURE;

  return {
    model,
    messages: buildMessages(body),
    max_tokens: maxTokens,
    temperature,
    stream,
  };
}

/**
 * Traduce el fallo de Groq a un código que el cliente pueda explicar.
 * Groq responde `{ error: { code, message } }`; ese `code` distingue un modelo
 * retirado de una cuota agotada, cosa que el status HTTP por sí solo no hace.
 *
 * @param {number} status
 * @param {string} rawBody
 */
function upstreamError(status, rawBody) {
  if (status === 401 || status === 403) return 'GROQ_API_KEY_INVALID';
  if (status === 429) return 'GROQ_RATE_LIMITED';

  let upstreamCode = '';
  try {
    upstreamCode = String(JSON.parse(rawBody)?.error?.code || '');
  } catch { /* Groq no siempre devuelve JSON */ }

  if (/decommission|model_not_found|does_not_exist/i.test(upstreamCode)) {
    return 'GROQ_MODEL_NOT_FOUND';
  }
  if (status === 404 && /model/i.test(rawBody || '')) {
    return 'GROQ_MODEL_NOT_FOUND';
  }

  return `GROQ_HTTP_${status}`;
}

/** Reenvía el SSE de Groq tal cual, para que el cliente use un único parser. */
async function pipeStream(groqRes, res) {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const reader = groqRes.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  } finally {
    res.end();
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mismo criterio que /api/health y /api/groq/ping: evita que un placeholder
  // pase el filtro aquí y termine en un 401 opaco de Groq.
  const { ok: keyOk, key: apiKey, reason } = resolveGroqKey();
  if (!keyOk) {
    return res.status(503).json({ error: 'GROQ_API_KEY_MISSING', reason });
  }

  const body = parseBody(req);
  if (body === null) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const wantsStream = body.stream === true;
  const payload = upstreamPayload(body, wantsStream);

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text().catch(() => '');
      console.error('[api/groq/chat] upstream', groqRes.status, detail.slice(0, 300));
      // Se reenvía el status de Groq salvo el 503: el cliente lo interpretaba
      // como "falta la API Key" y pedía configurar una que ya estaba puesta.
      const status = groqRes.status === 503 ? 502 : groqRes.status;
      return res.status(status).json({
        error: upstreamError(groqRes.status, detail),
        upstreamStatus: groqRes.status,
        // El modelo realmente enviado, no el por defecto: si el cliente pidió
        // otro, reportar DEFAULT_MODEL despistaba el diagnóstico.
        model: payload.model,
      });
    }

    if (wantsStream && groqRes.body && typeof groqRes.body.getReader === 'function') {
      return pipeStream(groqRes, res);
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'GROQ_EMPTY_RESPONSE' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('[api/groq/chat]', err);
    if (res.headersSent) return res.end();
    return res.status(500).json({ error: 'GROQ_PROXY_ERROR' });
  }
};
