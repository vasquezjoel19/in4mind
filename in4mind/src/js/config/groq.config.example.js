/**
 * IN4MIND — Plantilla de configuración Groq
 *
 * En producción NO hace falta este archivo con clave: el navegador llama a
 * /api/groq/chat y la función serverless usa GROQ_API_KEY (variable de entorno
 * en Vercel). El build genera un groq.config.js sin secretos.
 *
 * Úselo solo para desarrollo local sin backend (`npm start`): copie este archivo
 * como groq.config.js e inserte su clave. Está en .gitignore — nunca lo suba.
 */

'use strict';

const GroqConfig = {
  /** Obtén tu clave en: https://console.groq.com/keys — déjala vacía en producción */
  API_KEY: '',

  /** false fuerza el modo directo desde el navegador (expone la clave; solo local) */
  USE_PROXY: true,

  /** Modelos recomendados: openai/gpt-oss-20b | openai/gpt-oss-120b */
  MODEL: 'openai/gpt-oss-20b',

  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  MAX_TOKENS: 1200,
  TEMPERATURE: 0.45,
};
