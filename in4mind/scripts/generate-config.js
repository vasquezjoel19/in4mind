/**
 * Genera supabase.config.js y groq.config.js en build a partir de variables de entorno.
 * Sin GROQ_API_KEY en el entorno, se respeta el groq.config.js manual (ver INTEGRACION_GROQ.md).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'src', 'js', 'config');

function env(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function write(fileName, content) {
  const filePath = path.join(CONFIG_DIR, fileName);
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[build] Generado: ${filePath}`);
}

const supabaseUrl = env('SUPABASE_URL', 'https://opocfwypcucpbrbpdixi.supabase.co');
const supabaseAnonKey = env(
  'SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wb2Nmd3lwY3VjcGJyYnBkaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzcyMTUsImV4cCI6MjA5NzIxMzIxNX0.-rKhtMGBnhF0uBS4B0hmvpMfGkQ5K_if52SonLWEm1o'
);

write('supabase.config.js', `/**
 * IN4MIND — Supabase (generado en build)
 * Variables: SUPABASE_URL, SUPABASE_ANON_KEY
 */
'use strict';

const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};
const SUPABASE_ANON_KEY = ${JSON.stringify(supabaseAnonKey)};

const _sbClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
`);

console.log('[build] Supabase URL:', supabaseUrl ? 'OK' : 'FALTA');

/*
 * Groq: la clave NUNCA se escribe aquí. El navegador llama a /api/groq/chat y es
 * la función serverless la que usa GROQ_API_KEY. Este archivo solo lleva ajustes
 * públicos (modelo y parámetros) para que el <script> de las páginas resuelva.
 * Si ya existe un groq.config.js local (con clave, para desarrollo) se respeta.
 */
const groqConfigPath = path.join(CONFIG_DIR, 'groq.config.js');

if (fs.existsSync(groqConfigPath)) {
  console.log('[build] Groq: groq.config.js local existente — no se sobrescribe');
} else {
  const groqModel = env('GROQ_MODEL', 'openai/gpt-oss-20b');
  const groqMaxTokens = Number(env('GROQ_MAX_TOKENS', '1200')) || 1200;
  const groqTemperatureRaw = Number(env('GROQ_TEMPERATURE', '0.45'));
  const groqTemperature = Number.isFinite(groqTemperatureRaw) ? groqTemperatureRaw : 0.45;

  write('groq.config.js', `/**
 * IN4MIND — Groq (generado en build). Sin secretos: la API Key vive en el
 * servidor (GROQ_API_KEY) y solo la usa /api/groq/chat.
 */
'use strict';

const GroqConfig = {
  API_KEY: '',
  USE_PROXY: true,
  MODEL: ${JSON.stringify(groqModel)},
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  MAX_TOKENS: ${groqMaxTokens},
  TEMPERATURE: ${groqTemperature},
};
`);
}

console.log('[build] Groq: la clave la resuelve /api/groq/chat con GROQ_API_KEY');
console.log('[build] Groq API Key en el entorno:', env('GROQ_API_KEY') ? 'OK' : 'FALTA (asistente en modo local)');
