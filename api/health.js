/**
 * Estado de servicios para el frontend (sin exponer secretos).
 *
 * Comprueba únicamente que las credenciales estén *configuradas*. Para saber si
 * la clave de Groq realmente funciona contra la API, usa /api/groq/ping.
 */
'use strict';

const { resolveGroqKey } = require('./_lib/groq-env.js');
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
    /* Los límites aplicados, para poder comprobar tras desplegar que la cuota
       diaria está activa y no solo el tope por instancia. `quota` en false
       significa que falta aplicar la migración o configurar Supabase. */
    rateLimit: {
      perMin: perMinuteLimit(),
      perDay: perDayLimit(),
      quota: isQuotaConfigured(),
    },
  });
};
