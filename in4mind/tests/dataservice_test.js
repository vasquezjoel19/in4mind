/**
 * IN4MIND — Tests Básicos
 * Pruebas de unidad para DataService y QuizzesController (sin framework, ejecutables en Node.js).
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

test('Cada curso tiene las propiedades requeridas', () => {
  const courses = DataService.getCourses();
  courses.forEach(c => {
    assert(c.id,       `Curso debe tener id`);
    assert(c.title,    `Curso debe tener title`);
    assert(c.desc,     `Curso debe tener desc`);
    assert(c.icon,     `Curso debe tener icon`);
    assert(c.category, `Curso debe tener category`);
    assert(Array.isArray(c.tags), `Curso debe tener tags como array`);
  });
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

test('Filtra por categoría "design"', () => {
  const results = DataService.getCoursesByCategory('design');
  assert(results.length >= 1, 'Debe haber al menos 1 curso de diseño');
  assert(results.every(c => c.category === 'design'), 'Todos deben ser de categoría design');
});

test('Filtra por categoría "office"', () => {
  const results = DataService.getCoursesByCategory('office');
  assert(results.length >= 1, 'Debe haber al menos 1 curso de office');
});

test('Filtra por categoría "programming"', () => {
  const results = DataService.getCoursesByCategory('programming');
  assert(results.length >= 1, 'Debe haber al menos 1 curso de programación');
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
// Suite: DataService.getNavItems / getNavFooter
// ════════════════════════════════════════
console.log('\n🧭 DataService.getNavItems / getNavFooter');

test('getNavItems devuelve los ítems principales de navegación', () => {
  const items = DataService.getNavItems();
  assert(Array.isArray(items), 'Debe ser un array');
  assert(items.length >= 4, 'Debe haber al menos 4 ítems de nav');
  items.forEach(it => {
    assert(it.id,    'Nav item debe tener id');
    assert(it.label, 'Nav item debe tener label');
    assert(it.icon,  'Nav item debe tener icon');
  });
});

test('getNavItems incluye las secciones Tutoriales y Quizzes', () => {
  const ids = DataService.getNavItems().map(it => it.id);
  assert(ids.includes('tutorials'), 'Debe incluir "tutorials"');
  assert(ids.includes('quizzes'),   'Debe incluir "quizzes"');
});

test('getNavFooter devuelve ítems del footer de navegación', () => {
  const items = DataService.getNavFooter();
  assert(Array.isArray(items), 'Debe ser un array');
  assert(items.length >= 1, 'Debe haber al menos 1 ítem en el footer');
  items.forEach(it => {
    assert(it.id,    'Footer item debe tener id');
    assert(it.label, 'Footer item debe tener label');
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
  // Suite: DataService.register (async)
  // ════════════════════════════════════════
  console.log('\n📝 DataService.register');

  // Registro válido
  await (async () => {
    try {
      const result = await DataService.register('Ana López', 'ana@test.com', 'segura123');
      assert(result.ok === true, 'Registro válido debe ser ok=true');
      assert(result.user,        'Debe devolver objeto user');
      assert(result.user.name === 'Ana López', 'El nombre del usuario debe coincidir');
      console.log('  ✅ Registro válido devuelve ok=true con nombre correcto');
      passed++;
    } catch(e) {
      console.error('  ❌ Registro válido:', e.message);
      failed++;
    }
  })();

  // Registro con contraseña corta
  await (async () => {
    try {
      const result = await DataService.register('Bob', 'bob@test.com', '123');
      assert(result.ok === false, 'Registro con contraseña corta debe ser ok=false');
      assert(result.error,        'Debe devolver mensaje de error');
      console.log('  ✅ Registro con contraseña corta retorna ok=false');
      passed++;
    } catch(e) {
      console.error('  ❌ Registro contraseña corta:', e.message);
      failed++;
    }
  })();

  // Registro seguido de login con nombre real
  await (async () => {
    try {
      await DataService.register('Carlos Ruiz', 'carlos@test.com', 'abc1234');
      const loginResult = await DataService.login('carlos@test.com', 'abc1234');
      assert(loginResult.ok === true, 'Login post-registro debe ser ok=true');
      assert(loginResult.user.name === 'Carlos Ruiz', 'Login debe devolver el nombre registrado');
      console.log('  ✅ Login post-registro usa el nombre real registrado');
      passed++;
    } catch(e) {
      console.error('  ❌ Login post-registro:', e.message);
      failed++;
    }
  })();

  // Login con contraseña incorrecta para usuario registrado
  await (async () => {
    try {
      await DataService.register('Diana', 'diana@test.com', 'correcta123');
      const result = await DataService.login('diana@test.com', 'incorrecta99');
      assert(result.ok === false, 'Login con contraseña incorrecta debe ser ok=false');
      assert(result.error,        'Debe devolver mensaje de error');
      console.log('  ✅ Login con contraseña incorrecta retorna ok=false');
      passed++;
    } catch(e) {
      console.error('  ❌ Login contraseña incorrecta:', e.message);
      failed++;
    }
  })();

  // ════════════════════════════════════════
  // Suite: QuizzesController — lógica de datos
  // ════════════════════════════════════════
  console.log('\n🎯 QuizzesController — datos y progreso');

  // Verificar integridad del banco de quizzes (sin instanciar el DOM)
  await (async () => {
    try {
      // QuizzesController no exporta su banco, pero podemos verificar
      // que getCourses cubre las mismas tecnologías que los quizzes esperados.
      const courseIds = DataService.getCourses().map(c => c.id);
      const expectedQuizIds = ['canvas', 'figma', 'python', 'excel', 'html', 'css', 'github', 'javascript', 'powerpoint', 'sql'];
      expectedQuizIds.forEach(id => {
        assert(courseIds.includes(id), `DataService debe incluir el curso "${id}" que tiene quiz`);
      });
      console.log('  ✅ Todos los cursos con quiz existen en DataService');
      passed++;
    } catch(e) {
      console.error('  ❌ Cursos con quiz:', e.message);
      failed++;
    }
  })();

  // Verificar que los cursos con quiz pertenecen a las categorías filtradas en Quizzes
  await (async () => {
    try {
      const validCategories = ['design', 'programming', 'office', 'web', 'tools', 'data'];
      const quizCourseIds = ['canvas', 'figma', 'python', 'excel', 'html', 'css', 'github', 'javascript', 'powerpoint', 'sql'];
      quizCourseIds.forEach(id => {
        const course = DataService.getCourses().find(c => c.id === id);
        assert(course, `Curso "${id}" debe existir`);
        assert(
          validCategories.includes(course.category),
          `Categoría "${course.category}" del curso "${id}" debe ser válida para filtros de quizzes`
        );
      });
      console.log('  ✅ Categorías de cursos con quiz son válidas para los filtros');
      passed++;
    } catch(e) {
      console.error('  ❌ Categorías de quiz:', e.message);
      failed++;
    }
  })();

  // ════════════════════════════════════════
  // Suite: TutorialController — datos extendidos
  // ════════════════════════════════════════
  console.log('\n📖 TutorialController — datos extendidos');

  // Verificar que todos los cursos de DataService tienen datos extendidos en COURSE_DATA
  await (async () => {
    try {
      // Los datos extendidos están en tutorial.html inline; verificamos
      // que DataService expone exactamente los ids que COURSE_DATA cubre.
      const allCourseIds = DataService.getCourses().map(c => c.id);
      const expectedDetailIds = ['canvas', 'figma', 'python', 'javascript', 'html', 'css', 'github', 'excel', 'powerpoint', 'sql'];
      expectedDetailIds.forEach(id => {
        assert(allCourseIds.includes(id), `DataService debe incluir el curso "${id}" con detalle en TutorialController`);
      });
      console.log('  ✅ Todos los cursos con detalle de tutorial existen en DataService');
      passed++;
    } catch(e) {
      console.error('  ❌ Cursos con detalle:', e.message);
      failed++;
    }
  })();

  // Verificar que getCoursesByCategory cubre todas las categorías usadas en los filtros de Tutoriales
  await (async () => {
    try {
      const tutorialFilterCategories = ['web', 'programming', 'design', 'office', 'data', 'tools'];
      tutorialFilterCategories.forEach(cat => {
        const results = DataService.getCoursesByCategory(cat);
        // No todas las categorías necesitan tener cursos, pero la función no debe lanzar error
        assert(Array.isArray(results), `getCoursesByCategory("${cat}") debe retornar un array`);
      });
      console.log('  ✅ getCoursesByCategory funciona para todas las categorías de filtros de Tutoriales');
      passed++;
    } catch(e) {
      console.error('  ❌ Categorías de tutoriales:', e.message);
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
