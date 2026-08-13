/**
 * Vercel Serverless — proxy hacia Groq.
 * La API Key vive solo aquí (GROQ_API_KEY); nunca se envía al navegador.
 * Soporta respuesta completa (JSON) y streaming (SSE, mismo formato que Groq).
 */
'use strict';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const ALLOWED_MODELS = new Set([
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
]);

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
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

function upstreamError(status) {
  if (status === 401 || status === 403) return 'GROQ_API_KEY_INVALID';
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GROQ_API_KEY_MISSING' });
  }

  const body = parseBody(req);
  if (body === null) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const wantsStream = body.stream === true;

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamPayload(body, wantsStream)),
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text().catch(() => '');
      console.error('[api/groq/chat] upstream', groqRes.status, detail.slice(0, 300));
      return res.status(groqRes.status).json({ error: upstreamError(groqRes.status) });
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
