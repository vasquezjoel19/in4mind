/**
 * Estado de servicios para el frontend (sin exponer secretos).
 *
 * Comprueba únicamente que las credenciales estén *configuradas*. Para saber si
 * la clave de Groq realmente funciona contra la API, usa /api/groq/ping.
 */
'use strict';

const { resolveGroqKey } = require('./_lib/groq-env.js');
const { isAuthConfigured } = require('./_lib/supabase-auth.js');
const { isQuotaConfigured, perMinuteLimit, perDayLimit } = require('./_lib/rate-limit.js');

module.exports = function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const groq = resolveGroqKey();

  res.status(200).json({
    ok: true,
    groq: groq.ok,
    // Por qué no está lista, para diagnosticar sin revelar la clave.
    groqReason: groq.ok ? undefined : groq.reason,
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    // Si es false, /api/groq/chat rechaza todo con 503 AUTH_NOT_CONFIGURED:
    // falta SUPABASE_JWT_SECRET o SUPABASE_ANON_KEY en el entorno.
    auth: isAuthConfigured(),
    // Límites del asistente. `quota: false` significa que solo actúa el tope
    // por instancia: falta SUPABASE_URL/SUPABASE_ANON_KEY o la migración.
    rateLimit: {
      perMinute: perMinuteLimit(),
      perDay: perDayLimit(),
      quota: isQuotaConfigured(),
    },
  });
};
