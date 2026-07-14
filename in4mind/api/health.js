/**
 * Estado de servicios para el frontend (sin exponer secretos).
 */
'use strict';

module.exports = function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    groq: Boolean(process.env.GROQ_API_KEY && !String(process.env.GROQ_API_KEY).includes('TU_API_KEY')),
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
  });
};
