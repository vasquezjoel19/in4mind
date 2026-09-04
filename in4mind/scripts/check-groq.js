/**
 * IN4MIND — Verifica la credencial de Groq sin desplegar.
 *
 *   node scripts/check-groq.js
 *
 * Busca la clave en este orden:
 *   1. GROQ_API_KEY del entorno (lo mismo que usa la función serverless)
 *   2. API_KEY de src/js/config/groq.config.js (modo desarrollo local)
 *
 * Comprueba dos cosas distintas que suelen confundirse:
 *   - que la clave sea válida (GET /models, no consume tokens)
 *   - que el modelo configurado siga existiendo (Groq retira modelos)
 *
 * La clave nunca se imprime.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const CONFIG = path.join(__dirname, '..', 'src/js/config/groq.config.js');
const FALLBACK_MODEL = 'openai/gpt-oss-20b';

function readConfigValue(field) {
  if (!fs.existsSync(CONFIG)) return '';
  const src = fs.readFileSync(CONFIG, 'utf8');
  const m = new RegExp(`${field}:\\s*'([^']*)'`).exec(src);
  return m ? m[1] : '';
}

function resolveKey() {
  const fromEnv = (process.env.GROQ_API_KEY || '').trim();
  if (fromEnv) return { key: fromEnv, source: 'GROQ_API_KEY (entorno)' };

  const fromFile = readConfigValue('API_KEY').trim();
  if (fromFile) return { key: fromFile, source: 'src/js/config/groq.config.js' };

  return { key: '', source: null };
}

function mask(key) {
  return key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '(muy corta)';
}

async function call(url, key) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      // Sin User-Agent explícito el WAF de Groq responde 403 (error 1010).
      'User-Agent': 'in4mind-check-groq',
    },
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* respuesta no JSON */ }
  return { status: res.status, json, text };
}

(async () => {
  const resolved = resolveKey();
  console.log('IN4MIND — verificación de Groq\n');

  if (!resolved.key) {
    console.error('✗ No hay clave.');
    console.error('  Defina GROQ_API_KEY en el entorno, o API_KEY en src/js/config/groq.config.js');
    console.error('  Obtenga una en https://console.groq.com/keys');
    process.exit(1);
  }

  console.log(`Origen de la clave : ${resolved.source}`);
  console.log(`Clave              : ${mask(resolved.key)} (${resolved.key.length} caracteres)`);

  if (!/^gsk_[A-Za-z0-9]{20,}$/.test(resolved.key)) {
    console.error('\n✗ La clave no tiene el formato esperado ("gsk_" + token).');
    console.error('  Revise que se copió completa y sin comillas ni espacios.');
    process.exit(1);
  }

  const configuredModel = (process.env.GROQ_MODEL || readConfigValue('MODEL') || FALLBACK_MODEL).trim();
  console.log(`Modelo configurado : ${configuredModel}\n`);

  let models;
  try {
    models = await call(`${GROQ_BASE}/models`, resolved.key);
  } catch (err) {
    console.error(`✗ No se pudo contactar con Groq: ${err.message}`);
    process.exit(1);
  }

  if (models.status === 401) {
    console.error('✗ CLAVE INVÁLIDA — Groq la rechaza (401 invalid_api_key).');
    console.error('  Suele significar que fue revocada, borrada o copiada mal.');
    console.error('  Si estuvo en un repositorio público, Groq la revoca automáticamente.');
    console.error('  Genere una nueva en https://console.groq.com/keys');
    process.exit(1);
  }

  if (models.status !== 200) {
    console.error(`✗ Respuesta inesperada de Groq: HTTP ${models.status}`);
    console.error(`  ${models.text.slice(0, 300)}`);
    process.exit(1);
  }

  const ids = (models.json?.data || []).map(m => m.id).sort();
  console.log(`✓ Clave válida — ${ids.length} ${ids.length === 1 ? 'modelo disponible' : 'modelos disponibles'}.\n`);

  if (ids.includes(configuredModel)) {
    console.log(`✓ El modelo "${configuredModel}" está disponible.`);
    console.log('\nTodo correcto: la integración debería funcionar.');
    process.exit(0);
  }

  console.error(`✗ El modelo "${configuredModel}" YA NO EXISTE en Groq.`);
  console.error('  Es la causa habitual de que todas las peticiones fallen.');
  console.error('\n  Modelos disponibles ahora:');
  ids.forEach(id => console.error(`    - ${id}`));
  console.error('\n  Corrija GROQ_MODEL en Vercel (y en groq.config.js si trabaja en local).');
  process.exit(1);
})();
