/**
 * IN4MIND — Límite de uso del proxy de IA (capa en memoria).
 *
 * La cuota diaria vive en Supabase y se prueba contra la base; aquí se
 * comprueba la ventana deslizante, que es pura y determinista.
 *
 * Ejecutar: node tests/rate-limit.test.js
 */
'use strict';

const assert = require('assert');
const path = require('path');

const lib = require(path.join(__dirname, '..', '..', 'api', '_lib', 'rate-limit.js'));

let passed = 0;

function test(name, fn) {
  lib._resetBurst();
  fn();
  console.log(`  ✅ ${name}`);
  passed++;
}

console.log('\n🚦 rate-limit — ventana deslizante en memoria');

test('permite hasta el límite y bloquea la siguiente', () => {
  const opts = { limit: 3, windowMs: 60_000, now: 1_000_000 };
  for (let i = 1; i <= 3; i++) {
    const r = lib.checkBurst('u1', opts);
    assert.equal(r.allowed, true, `la llamada ${i} debería pasar`);
    assert.equal(r.used, i);
  }
  const blocked = lib.checkBurst('u1', opts);
  assert.equal(blocked.allowed, false, 'la cuarta debe bloquearse');
  assert.equal(blocked.limit, 3);
});

test('el bloqueo no consume cupo: sigue bloqueado sin crecer', () => {
  const opts = { limit: 2, windowMs: 60_000, now: 1_000_000 };
  lib.checkBurst('u1', opts);
  lib.checkBurst('u1', opts);
  const first = lib.checkBurst('u1', opts);
  const second = lib.checkBurst('u1', opts);
  assert.equal(first.allowed, false);
  assert.equal(second.allowed, false);
  assert.equal(second.used, 2, 'las rechazadas no se registran');
});

test('la ventana se desliza: al caducar vuelve a permitir', () => {
  const base = 1_000_000;
  const opts = { limit: 2, windowMs: 60_000 };
  lib.checkBurst('u1', { ...opts, now: base });
  lib.checkBurst('u1', { ...opts, now: base + 1000 });
  assert.equal(lib.checkBurst('u1', { ...opts, now: base + 2000 }).allowed, false);
  // Justo después de que caduque la primera marca hay hueco para una.
  const after = lib.checkBurst('u1', { ...opts, now: base + 60_001 });
  assert.equal(after.allowed, true);
  assert.equal(after.used, 2, 'la segunda marca sigue dentro de la ventana');
});

test('retryAfter apunta a cuándo caduca la marca más antigua', () => {
  const base = 1_000_000;
  const opts = { limit: 1, windowMs: 60_000 };
  lib.checkBurst('u1', { ...opts, now: base });
  const blocked = lib.checkBurst('u1', { ...opts, now: base + 10_000 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfter, 50, 'quedan 50 s para el hueco');
});

test('cada usuario tiene su propio contador', () => {
  const opts = { limit: 1, windowMs: 60_000, now: 1_000_000 };
  assert.equal(lib.checkBurst('u1', opts).allowed, true);
  assert.equal(lib.checkBurst('u1', opts).allowed, false);
  assert.equal(lib.checkBurst('u2', opts).allowed, true, 'u2 no hereda el bloqueo de u1');
});

test('límite 0 desactiva la comprobación', () => {
  const opts = { limit: 0, windowMs: 60_000, now: 1_000_000 };
  for (let i = 0; i < 50; i++) {
    assert.equal(lib.checkBurst('u1', opts).allowed, true);
  }
});

console.log('\n🚦 rate-limit — configuración por entorno');

test('lee los límites del entorno y descarta valores inválidos', () => {
  const original = { ...process.env };
  try {
    process.env.GROQ_RATE_LIMIT_PER_MIN = '7';
    process.env.GROQ_RATE_LIMIT_PER_DAY = '99';
    assert.equal(lib.perMinuteLimit(), 7);
    assert.equal(lib.perDayLimit(), 99);

    process.env.GROQ_RATE_LIMIT_PER_MIN = 'muchas';
    assert.equal(lib.perMinuteLimit(), 15, 'un valor no numérico cae al defecto');

    delete process.env.GROQ_RATE_LIMIT_PER_MIN;
    delete process.env.GROQ_RATE_LIMIT_PER_DAY;
    assert.equal(lib.perMinuteLimit(), 15);
    assert.equal(lib.perDayLimit(), 200);
  } finally {
    process.env = original;
  }
});

console.log('\nrate-limit.test.js: all passed');
console.log(`  Total: ${passed}`);
