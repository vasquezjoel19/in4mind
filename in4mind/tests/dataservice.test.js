/**
 * IN4MIND — Tests Básicos
 * Pruebas de unidad para DataService (sin framework, ejecutables en Node.js).
 *
 * Ejecutar: node tests/dataservice.test.js
 */

'use strict';

// ── Simulación mínima de entorno browser ──
// El IIFE de DataService guarda en module.exports al final.
// Necesitamos que 'module' exista globalmente antes de requerir.
const DataService = require('../src/js/services/DataService.js');

// ── Micro test runner ──
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${e.message}`);
    failed++;
  }
}

function assert(condition, msg = 'Assertion failed') {
  if (!condition) throw new Error(msg);
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

// ════════════════════════════════════════
// Suite: DataService.getCourses
// ════════════════════════════════════════
console.log('\n📚 DataService.getCourses');

test('Devuelve todos los cursos sin query', () => {
  const courses = DataService.getCourses();
  assert(Array.isArray(courses), 'Debe ser un array');
  assert(courses.length >= 8,   'Debe haber al menos 8 cursos');
});

test('Filtra cursos por título (insensible a mayúsculas)', () => {
  const results = DataService.getCourses('python');
  assert(results.length >= 1, 'Debe encontrar al menos 1 resultado');
  assert(results.every(c => c.title.toLowerCase().includes('python') || c.tags.some(t => t.includes('python'))),
    'Todos los resultados deben coincidir con la query');
});

test('Filtra cursos por tag', () => {
  const results = DataService.getCourses('bases de datos');
  assert(results.length >= 1, 'Debe encontrar cursos por tag');
});

test('Retorna array vacío cuando no hay coincidencias', () => {
  const results = DataService.getCourses('xyz_no_existe_999');
  assertEqual(results.length, 0, 'Debe retornar 0 resultados');
});

test('Sin query vacía devuelve todos los cursos', () => {
  const all    = DataService.getCourses();
  const blank  = DataService.getCourses('');
  assertEqual(all.length, blank.length, 'Query vacía debe devolver todos');
});

// ════════════════════════════════════════
// Suite: DataService.getCoursesByCategory
// ════════════════════════════════════════
console.log('\n🗂️  DataService.getCoursesByCategory');

test('Filtra por categoría "web"', () => {
  const results = DataService.getCoursesByCategory('web');
  assert(results.length >= 2, 'Debe haber al menos 2 cursos web');
  assert(results.every(c => c.category === 'web'), 'Todos deben ser de categoría web');
});

test('Categoría inexistente retorna array vacío', () => {
  const results = DataService.getCoursesByCategory('blockchain');
  assertEqual(results.length, 0, 'Debe retornar vacío');
});

// ════════════════════════════════════════
// Suite: DataService.getRecentItems
// ════════════════════════════════════════
console.log('\n🕐 DataService.getRecentItems');

test('Devuelve ítems recientes con estructura correcta', () => {
  const items = DataService.getRecentItems();
  assert(Array.isArray(items), 'Debe ser un array');
  assert(items.length >= 1,    'Debe haber al menos un ítem');
  items.forEach(item => {
    assert(item.id,        `Ítem debe tener id`);
    assert(item.title,     `Ítem debe tener title`);
    assert(item.subtitle,  `Ítem debe tener subtitle`);
    assert(item.timeLabel, `Ítem debe tener timeLabel`);
  });
});

// ════════════════════════════════════════
// Suite: DataService.login (async)
// ════════════════════════════════════════
console.log('\n🔐 DataService.login');

async function runAsyncTests() {
  // Login válido
  await (async () => {
    try {
      const result = await DataService.login('user@test.com', 'password123');
      assert(result.ok === true, 'Login con credenciales válidas debe ser ok=true');
      assert(result.user,        'Debe devolver objeto user');
      console.log('  ✅ Login válido devuelve ok=true y user');
      passed++;
    } catch(e) {
      console.error('  ❌ Login válido:', e.message);
      failed++;
    }
  })();

  // Login con contraseña corta
  await (async () => {
    try {
      const result = await DataService.login('user@test.com', '123');
      assert(result.ok === false, 'Login con contraseña corta debe ser ok=false');
      assert(result.error,        'Debe devolver mensaje de error');
      console.log('  ✅ Login con contraseña corta retorna ok=false');
      passed++;
    } catch(e) {
      console.error('  ❌ Login inválido:', e.message);
      failed++;
    }
  })();

  // Login con email vacío
  await (async () => {
    try {
      const result = await DataService.login('', 'password123');
      assert(result.ok === false, 'Login sin email debe ser ok=false');
      console.log('  ✅ Login sin email retorna ok=false');
      passed++;
    } catch(e) {
      console.error('  ❌ Login sin email:', e.message);
      failed++;
    }
  })();

  // ════════════════════════════════════════
  // Resumen
  // ════════════════════════════════════════
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  Total: ${passed + failed} | ✅ Pasaron: ${passed} | ❌ Fallaron: ${failed}`);
  console.log(`${'─'.repeat(40)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAsyncTests();
