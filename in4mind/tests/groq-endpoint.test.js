/**
 * IN4MIND — El proxy de IA, extremo a extremo contra dobles.
 *
 * El test de `rate-limit.test.js` comprueba la ventana deslizante en
 * aislamiento. Aquí se comprueba lo que de verdad protege la cuota: que el
 * endpoint **corte antes de llamar a Groq**. Un límite que bloquease después
 * de gastar la llamada no serviría de nada.
 *
 * Todo va contra dobles: no se toca Supabase ni Groq de verdad.
 *
 * Ejecutar: node tests/groq-endpoint.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');
const Module = require('module');

const RAIZ = path.join(__dirname, '..', '..');

/* ── Entorno mínimo para que el endpoint arranque ───────────────────────── */
process.env.GROQ_API_KEY = 'gsk_' + 'A'.repeat(32);   // forma válida: gsk_ + 20+ alfanuméricos
process.env.SUPABASE_URL = 'https://proyecto.supabase.co';
process.env.SUPABASE_ANON_KEY = 'anon-de-prueba';
process.env.GROQ_RATE_LIMIT_PER_MIN = '3';
process.env.GROQ_RATE_LIMIT_PER_DAY = '5';

/** Cuántas veces se ha llamado a Groq y a la cuota, y con qué. */
const llamadas = { groq: 0, cuota: 0, auth: 0 };
let cuotaPermite = true;

const USUARIO = '11111111-2222-3333-4444-555555555555';

global.fetch = async (url, opts = {}) => {
  const u = String(url);

  if (u.includes('/auth/v1/user')) {
    llamadas.auth += 1;
    return { ok: true, status: 200, json: async () => ({ id: USUARIO }) };
  }

  if (u.includes('/rpc/ai_usage_hit')) {
    llamadas.cuota += 1;
    const cuerpo = JSON.parse(opts.body || '{}');
    return {
      ok: true,
      status: 200,
      json: async () => ([{
        allowed: cuotaPermite,
        used: cuotaPermite ? 1 : cuerpo.max_calls,
        reset_at: new Date(Date.now() + 3600_000).toISOString(),
      }]),
    };
  }

  if (u.includes('api.groq.com')) {
    llamadas.groq += 1;
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ choices: [{ message: { content: 'hola' } }] }),
      text: async () => '{}',
    };
  }

  throw new Error(`fetch inesperado: ${u}`);
};

/* ── Dobles de req/res ──────────────────────────────────────────────────── */

function peticion({ token = 'jwt-valido', origen = 'https://in4mind.vercel.app', cuerpo } = {}) {
  return {
    method: 'POST',
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
      origin: origen,
      host: 'in4mind.vercel.app',
      'x-forwarded-proto': 'https',
    },
    body: cuerpo ?? { messages: [{ role: 'user', content: 'hola' }] },
  };
}

function respuesta() {
  const r = {
    statusCode: 0, cuerpo: null, cabeceras: {},
    setHeader(k, v) { this.cabeceras[k.toLowerCase()] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.cuerpo = b; return this; },
    end() { return this; },
    write() { return true; },
  };
  return r;
}

/** El endpoint cachea módulos; se recarga limpio para cada escenario. */
function cargarHandler() {
  for (const k of Object.keys(require.cache)) {
    if (k.includes(path.join(RAIZ, 'api'))) delete require.cache[k];
  }
  return require(path.join(RAIZ, 'api', 'groq', 'chat.js'));
}

let passed = 0;
/* El contador de ráfaga vive en el módulo y persiste entre peticiones —que es
   justo lo que debe hacer—, así que cada escenario arranca de cero. Se toma
   la misma instancia que usa el handler, ya cargada. */
let resetBurst = () => {};
function test(nombre, fn) {
  llamadas.groq = 0; llamadas.cuota = 0; llamadas.auth = 0;
  cuotaPermite = true;
  resetBurst();
  return Promise.resolve(fn()).then(() => {
    console.log(`  ✅ ${nombre}`);
    passed += 1;
  });
}

(async () => {
  console.log('\n🔒 /api/groq/chat — sesión y límite de uso');

  const handler = cargarHandler();
  ({ _resetBurst: resetBurst } = require(path.join(RAIZ, 'api', '_lib', 'rate-limit.js')));

  await test('sin token no se llama a Groq', async () => {
    const res = respuesta();
    await handler(peticion({ token: null }), res);
    assert.equal(res.statusCode, 401);
    assert.equal(llamadas.groq, 0, 'no debe gastarse una llamada a Groq');
  });

  await test('con sesión válida la petición pasa', async () => {
    const res = respuesta();
    await handler(peticion(), res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.cuerpo));
    assert.equal(llamadas.groq, 1);
  });

  await test('la ráfaga corta ANTES de llamar a Groq', async () => {
    resetBurst();
    // El límite por minuto es 3 y el estado en memoria persiste entre
    // peticiones, así que la cuarta debe rebotar.
    for (let i = 0; i < 3; i += 1) {
      await handler(peticion(), respuesta());
    }
    const antes = llamadas.groq;

    const res = respuesta();
    await handler(peticion(), res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.cuerpo.scope, 'burst');
    assert.equal(llamadas.groq, antes, 'la petición bloqueada no debe llegar a Groq');
    assert.ok(Number(res.cabeceras['retry-after']) > 0, 'debe decir cuándo reintentar');
  });

  await test('la cuota diaria también corta antes de gastar', async () => {
    cuotaPermite = false;
    const res = respuesta();
    await handler(peticion(), res);

    assert.equal(res.statusCode, 429);
    assert.equal(res.cuerpo.scope, 'daily');
    assert.equal(llamadas.groq, 0, 'la petición bloqueada no debe llegar a Groq');
    assert.ok(Number(res.cabeceras['retry-after']) >= 60);
  });

  await test('un origen ajeno se rechaza sin tocar nada', async () => {
    const res = respuesta();
    await handler(peticion({ origen: 'https://sitio-ajeno.example' }), res);
    assert.equal(res.statusCode, 403);
    assert.equal(llamadas.groq, 0);
    assert.equal(llamadas.auth, 0, 'ni siquiera debe preguntarse por la sesión');
  });

  await test('la sesión se verifica una sola vez por petición', async () => {
    // `guard` y el límite piden ambos la sesión, pero la caché de positivos
    // evita la segunda ida y vuelta.
    const res = respuesta();
    await handler(peticion({ token: 'jwt-recien-visto' }), res);
    assert.equal(res.statusCode, 200);
    assert.equal(llamadas.auth, 1, `esperaba 1 verificación, hubo ${llamadas.auth}`);
  });

  console.log('\ngroq-endpoint.test.js: all passed');
  console.log(`  Total: ${passed}`);
})().catch((err) => {
  console.error('\n❌', err && err.message);
  console.error(err);
  process.exit(1);
});

// `Module` se importa para dejar claro que se manipula la caché de require.
void Module;
