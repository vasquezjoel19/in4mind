/**
 * Vercel Serverless — proxy opcional hacia Groq (no usado por el cliente por defecto).
 */
'use strict';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'GROQ_API_KEY_MISSING' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const messages = [];
  if (body.systemPrompt) {
    messages.push({ role: 'system', content: String(body.systemPrompt) });
  }
  (body.history || []).forEach(item => {
    if (!item?.content) return;
    messages.push({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: String(item.content),
    });
  });

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: body.model || 'llama-3.3-70b-versatile',
        messages,
        max_tokens: body.max_tokens ?? 1200,
        temperature: body.temperature ?? 0.45,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return res.status(groqRes.status).json({ error: errText.slice(0, 300) });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return res.status(502).json({ error: 'GROQ_EMPTY_RESPONSE' });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'GROQ_PROXY_ERROR' });
  }
};
