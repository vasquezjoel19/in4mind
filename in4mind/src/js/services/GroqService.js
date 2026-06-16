/**
 * IN4MIND — GroqService
 * Cliente para la API de Groq (compatible OpenAI Chat Completions).
 */

'use strict';

const GroqService = (() => {

  function _config() {
    return typeof GroqConfig !== 'undefined' ? GroqConfig : null;
  }

  function isConfigured() {
    const cfg = _config();
    if (!cfg) return false;
    const key = cfg.API_KEY || '';
    return key.length > 20 && !key.includes('PEGAR') && !key.includes('TU_API_KEY');
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
- IN4MIND incluye: la plataforma (tutoriales, quizzes, dashboard, perfil, favoritos, guardados, certificaciones, navegación) y los cursos que ofrece.
- Si la pregunta NO tiene relación con IN4MIND ni con sus cursos, NO respondas el tema. Rechaza cortésmente y pide que reformule sobre IN4MIND.
- No respondas preguntas generales ajenas: deportes, política, entretenimiento, recetas, salud personal, relaciones, finanzas no técnicas, chistes, etc.

FORMATO DE RECHAZO (usa este estilo cuando la consulta esté fuera de alcance)
"Consulta fuera del alcance de IN4MIND. Solo puedo ayudarte con la plataforma IN4MIND y sus cursos. Por favor, pregúntame sobre tutoriales, quizzes, perfil, certificaciones o temas de nuestro catálogo (Python, HTML, CSS, JavaScript, SQL, Excel, PowerPoint, Figma, Canva, GitHub, Ciberseguridad)."

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
- Tutoriales: lecciones por curso con pasos prácticos.
- Quizzes: evaluaciones por curso y Conocimiento General.
- Dashboard: cursos destacados y Recién vistos.
- Perfil: favoritos, guardados, quizzes completados y certificaciones.

Cursos disponibles:
${coursesBlock || '(Catálogo estándar IN4MIND)'}

DIRECTRICES
- Recomienda Tutoriales o Quizzes de IN4MIND cuando sea pertinente.
- Ejemplos técnicos concisos solo para temas del catálogo IN4MIND.
- Respuestas breves y sin redundancia.`;
  }

  /**
   * @param {{ role: string, content: string }[]} history
   * @returns {Promise<string>}
   */
  async function chat(history) {
    if (!isConfigured()) {
      throw new Error('GROQ_API_KEY_MISSING');
    }

    const messages = [
      { role: 'system', content: _buildSystemPrompt() },
      ...history.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const cfg = _config();
    if (!cfg) throw new Error('GROQ_API_KEY_MISSING');

    const response = await fetch(cfg.API_URL, {
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
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      if (response.status === 401 || response.status === 403) {
        throw new Error('GROQ_API_KEY_INVALID');
      }
      throw new Error(`GROQ_HTTP_${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('GROQ_EMPTY_RESPONSE');
    return reply;
  }

  return { chat, isConfigured, buildSystemPrompt: _buildSystemPrompt };

})();

if (typeof module !== 'undefined') module.exports = GroqService;
