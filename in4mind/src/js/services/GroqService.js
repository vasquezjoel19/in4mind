/**
 * IN4MIND — GroqService
 * Cliente del asistente. Prioriza el proxy serverless (/api/groq/chat), donde la
 * API Key vive en el servidor. Solo cae al modo directo si existe una clave local
 * en groq.config.js (uso de desarrollo; nunca en producción).
 */

'use strict';

const GroqService = (() => {

  const HEALTH_URL = '/api/health';
  const PROXY_URL = '/api/groq/chat';

  /** 'unknown' | 'proxy' | 'direct' | 'none' */
  let _mode = 'unknown';
  let _initPromise = null;

  function _config() {
    return typeof GroqConfig !== 'undefined' ? GroqConfig : null;
  }

  /** Clave embebida en el cliente: solo escape hatch de desarrollo local. */
  function _hasLocalKey() {
    const cfg = _config();
    const key = (cfg && cfg.API_KEY) || '';
    return key.length > 20 && !key.includes('PEGAR') && !key.includes('TU_API_KEY');
  }

  function _proxyDisabled() {
    const cfg = _config();
    return Boolean(cfg && cfg.USE_PROXY === false);
  }

  /**
   * Detecta una sola vez si el backend tiene la clave configurada.
   * Idempotente: las llamadas posteriores reutilizan la misma promesa.
   */
  function init() {
    if (_initPromise) return _initPromise;

    _initPromise = (async () => {
      if (!_proxyDisabled()) {
        try {
          const res = await fetch(HEALTH_URL, { headers: { Accept: 'application/json' } });
          if (res.ok) {
            const data = await res.json();
            if (data && data.groq === true) {
              _mode = 'proxy';
              return _mode;
            }
          }
        } catch (_) {
          /* Sin backend (p. ej. `npx serve`): se evalúa el modo directo. */
        }
      }

      _mode = _hasLocalKey() ? 'direct' : 'none';
      return _mode;
    })();

    return _initPromise;
  }

  /** Síncrono por compatibilidad: refleja el último estado conocido. */
  function isConfigured() {
    if (_mode === 'proxy' || _mode === 'direct') return true;
    if (_mode === 'none') return false;
    return _hasLocalKey();
  }

  function usesProxy() {
    return _mode === 'proxy';
  }

  function _buildSystemPrompt() {
    let coursesBlock = '';
    if (typeof DataService !== 'undefined') {
      coursesBlock = DataService.getCourses()
        .map(c => `- ${c.title}: ${c.desc}`)
        .join('\n');
    }

    return `Eres IN4MIND Assistant, el asistente educativo oficial exclusivo de la plataforma IN4MIND.

REGLA PRINCIPAL (OBLIGATORIA)
- SOLO respondes consultas relacionadas con IN4MIND o su catálogo educativo.
- IN4MIND incluye: la plataforma (cursos, quizzes, dashboard, perfil, favoritos, guardados, certificaciones, navegación) y el catálogo educativo.
- Si la pregunta NO tiene relación con IN4MIND ni con sus cursos, NO respondas el tema. Rechaza cortésmente y pide que reformule sobre IN4MIND.
- No respondas preguntas generales ajenas: deportes, política, entretenimiento, recetas, salud personal, relaciones, finanzas no técnicas, chistes, etc.

FORMATO DE RECHAZO (usa este estilo cuando la consulta esté fuera de alcance)
"Consulta fuera del alcance de IN4MIND. Solo puedo ayudarte con la plataforma IN4MIND y sus cursos. Por favor, pregúntame sobre cursos, quizzes, perfil, certificaciones o temas de nuestro catálogo (Python, HTML, CSS, JavaScript, SQL, Excel, PowerPoint, Figma, Canva, GitHub, Ciberseguridad)."

IDENTIDAD Y TONO
- Comunicación profesional, clara y respetuosa en español latinoamericano.
- Registro formal-moderno: preciso, didáctico y orientado a resultados.
- Sin emojis, jerga informal ni tono coloquial.
- Párrafos breves y listas cuando corresponda.

ALCANCE DEL CATÁLOGO IN4MIND
- HTML, CSS, JavaScript, Python, SQL, Excel, PowerPoint, Figma, Canva, GitHub.
- Ciberseguridad: phishing, contraseñas, MFA, malware, ransomware, principios CIA.
- Desarrollo web, bases de datos, diseño UI/UX, control de versiones y productividad.

PLATAFORMA IN4MIND
- Cursos: lecciones por curso con pasos prácticos.
- Quizzes: evaluaciones por curso y Conocimiento General.
- Dashboard: cursos destacados y Recién vistos.
- Perfil: favoritos, guardados, quizzes completados y certificaciones.

Cursos disponibles:
${coursesBlock || '(Catálogo estándar IN4MIND)'}

DIRECTRICES
- Recomienda Cursos o Quizzes de IN4MIND cuando sea pertinente.
- Ejemplos técnicos concisos solo para temas del catálogo IN4MIND.
- Respuestas breves y sin redundancia.`;
  }

  function _mapHistory(history) {
    return history.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));
  }

  /** Petición al proxy: el servidor añade la credencial. */
  function _proxyRequest(history, stream) {
    const cfg = _config();
    return fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: _buildSystemPrompt(),
        history: _mapHistory(history),
        model: cfg?.MODEL,
        max_tokens: cfg?.MAX_TOKENS,
        temperature: cfg?.TEMPERATURE,
        stream,
      }),
    });
  }

  /** Petición directa a Groq con la clave del cliente (solo desarrollo local). */
  function _directRequest(history, stream) {
    const cfg = _config();
    const messages = [
      { role: 'system', content: _buildSystemPrompt() },
      ..._mapHistory(history),
    ];

    return fetch(cfg.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.API_KEY}`,
      },
      body: JSON.stringify({
        model: cfg.MODEL,
        messages,
        max_tokens: cfg.MAX_TOKENS,
        temperature: cfg.TEMPERATURE,
        stream,
      }),
    });
  }

  async function _request(history, stream) {
    const mode = await init();
    if (mode === 'none') throw new Error('GROQ_API_KEY_MISSING');
    return mode === 'proxy'
      ? _proxyRequest(history, stream)
      : _directRequest(history, stream);
  }

  async function _assertOk(response) {
    if (response.ok) return;

    const raw = await response.text().catch(() => '');
    let code = '';
    try {
      code = JSON.parse(raw)?.error || '';
    } catch (_) { /* respuesta no JSON */ }

    if (code === 'GROQ_API_KEY_MISSING' || response.status === 503) {
      throw new Error('GROQ_API_KEY_MISSING');
    }
    if (code === 'GROQ_API_KEY_INVALID' || response.status === 401 || response.status === 403) {
      throw new Error('GROQ_API_KEY_INVALID');
    }
    throw new Error(`GROQ_HTTP_${response.status}: ${raw.slice(0, 200)}`);
  }

  /**
   * @param {{ role: string, content: string }[]} history
   * @returns {Promise<string>}
   */
  async function chat(history) {
    const response = await _request(history, false);
    await _assertOk(response);

    const data = await response.json();
    /* El proxy devuelve { reply }; Groq directo devuelve choices[]. */
    const reply = (data.reply || data.choices?.[0]?.message?.content || '').trim();
    if (!reply) throw new Error('GROQ_EMPTY_RESPONSE');
    return reply;
  }

  /**
   * Streaming chat. Calls onChunk(partialText) as tokens arrive.
   * @param {{ role: string, content: string }[]} history
   * @param {(partial: string) => void} [onChunk]
   * @returns {Promise<string>}
   */
  async function chatStream(history, onChunk) {
    const response = await _request(history, true);
    await _assertOk(response);

    if (!response.body || !response.body.getReader) {
      return chat(history);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith('data:')) continue;
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            if (typeof onChunk === 'function') onChunk(full);
          }
        } catch (_) { /* ignore partial JSON */ }
      }
    }

    if (!full.trim()) throw new Error('GROQ_EMPTY_RESPONSE');
    return full.trim();
  }

  return { init, chat, chatStream, isConfigured, usesProxy, buildSystemPrompt: _buildSystemPrompt };

})();

if (typeof module !== 'undefined') module.exports = GroqService;
