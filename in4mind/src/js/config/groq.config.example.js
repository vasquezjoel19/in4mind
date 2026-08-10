/**
 * IN4MIND — Plantilla de configuración Groq
 * Copia este archivo como groq.config.js e inserta tu API Key.
 */

'use strict';

const GroqConfig = {
  /** Obtén tu clave en: https://console.groq.com/keys */
  API_KEY: 'TU_API_KEY_DE_GROQ',

  /** Modelos recomendados: llama-3.3-70b-versatile | llama-3.1-8b-instant */
  MODEL: 'llama-3.3-70b-versatile',

  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  MAX_TOKENS: 1200,
  TEMPERATURE: 0.45,
};
