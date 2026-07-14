/**
 * Genera supabase.config.js en build a partir de variables de entorno.
 * Groq: configure src/js/config/groq.config.js manualmente (ver INTEGRACION_GROQ.md).
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
console.log('[build] Groq: use src/js/config/groq.config.js (no se genera en build)');
