/**
 * IN4MIND — Motor de aprendizaje adaptativo.
 *
 * Lo que se comprueba aquí es sobre todo que el módulo se comporte como
 * *opcional*: apagado no escucha, no guarda y no llama a ninguna API. El resto
 * son las reglas de clasificación y el ritmo, que es lo que decide si esto
 * ayuda o molesta.
 *
 * Ejecutar: node tests/adaptive-learning.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');

/* ── Dobles del navegador ─────────────────────────────────────────────────
 * El servicio se carga como script clásico: necesita `window`, `localStorage`
 * y `document` antes del require. */
const _store = {};
global.localStorage = {
  getItem(k) { return _store[k] ?? null; },
  setItem(k, v) { _store[k] = String(v); },
  removeItem(k) { delete _store[k]; },
};
global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const _listeners = {};
const _emitted = [];
global.window = {
  addEventListener(type, fn) { (_listeners[type] = _listeners[type] || []).push(fn); },
  removeEventListener() {},
  dispatchEvent(ev) {
    _emitted.push(ev);
    (_listeners[ev.type] || []).forEach(fn => fn(ev));
    return true;
  },
};
global.CustomEvent = class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init?.detail; }
};
global.document = {
  readyState: 'complete',
  hidden: false,
  activeElement: null,
  addEventListener() {},
};

const Adaptive = require(path.join(__dirname, '..', 'src/js/services/AdaptiveLearningService.js'));

let passed = 0;

function test(name, fn) {
  // Cada caso arranca con el almacenamiento limpio: el estado del motor
  // persiste entre llamadas a propósito, y arrastrarlo escondería fallos.
  for (const k of Object.keys(_store)) delete _store[k];
  _emitted.length = 0;
  fn();
  console.log(`  ✅ ${name}`);
  passed++;
}

async function asyncTest(name, fn) {
  for (const k of Object.keys(_store)) delete _store[k];
  _emitted.length = 0;
  await fn();
  console.log(`  ✅ ${name}`);
  passed++;
}

console.log('\n🧠 AdaptiveLearningService — opt-in');

test('viene desactivado: sin activarlo, isEnabled() es false', () => {
  assert.equal(Adaptive.isEnabled(), false);
});

test('apagado no escribe estado ni registra señales', () => {
  Adaptive.handleSignal({ source: 'lesson', courseId: 'python', title: 'Bucles' });
  assert.deepEqual(Object.keys(_store), [], 'no debería haber tocado localStorage');
  assert.equal(_emitted.length, 0, 'no debería haber emitido eventos');
});

test('activarlo y desactivarlo conserva el estado aprendido', () => {
  Adaptive.setEnabled(true);
  assert.equal(Adaptive.isEnabled(), true);
  Adaptive.recordAnswer({ id: 'python:bucles', label: 'Bucles', courseId: 'python' }, true);

  Adaptive.setEnabled(false);
  assert.equal(Adaptive.isEnabled(), false);
  assert.equal(Adaptive.getTopic('python:bucles').correct, 1, 'apagar no debe borrar el progreso');
});

test('las claves van particionadas por cuenta', () => {
  Adaptive.setEnabled(true);
  const claves = Object.keys(_store);
  assert.ok(claves.length > 0, 'debería haber escrito algo');
  assert.ok(claves.every(k => k.includes(':guest')), `esperaba sufijo de cuenta, hay: ${claves}`);
});

console.log('\n🧠 AdaptiveLearningService — clasificación de temas');

test('acertar de forma consistente da tema dominado', () => {
  Adaptive.setEnabled(true);
  const t = { id: 'sql:joins', label: 'JOINs', courseId: 'sql' };
  Adaptive.recordAnswer(t, true);
  Adaptive.recordAnswer(t, true);
  const topic = Adaptive.getTopic('sql:joins');
  assert.equal(topic.accuracy, 1);
  assert.equal(topic.status, Adaptive.STATUS.MASTERED);
});

test('una sola respuesta no basta para declarar dominio', () => {
  Adaptive.setEnabled(true);
  Adaptive.recordAnswer({ id: 'sql:joins', label: 'JOINs' }, true);
  assert.equal(Adaptive.getTopic('sql:joins').status, Adaptive.STATUS.PROGRESS,
    'con un acierto suelto aún no se puede afirmar nada');
});

test('fallar la mayoría marca hueco', () => {
  Adaptive.setEnabled(true);
  const t = { id: 'js:async', label: 'Async' };
  Adaptive.recordAnswer(t, false);
  Adaptive.recordAnswer(t, false);
  Adaptive.recordAnswer(t, true);
  assert.equal(Adaptive.getTopic('js:async').status, Adaptive.STATUS.GAP);
});

test('un hueco diagnosticado pesa más que la media de aciertos', () => {
  Adaptive.setEnabled(true);
  const t = { id: 'js:closures', label: 'Closures' };
  Adaptive.recordAnswer(t, true);
  Adaptive.recordAnswer(t, true);
  assert.equal(Adaptive.getTopic('js:closures').status, Adaptive.STATUS.MASTERED);

  Adaptive.recordGap('js:closures', { gap_concept: 'Ámbito léxico', root_cause: 'Confunde dónde se captura la variable' });
  const topic = Adaptive.getTopic('js:closures');
  assert.equal(topic.status, Adaptive.STATUS.GAP, 'saber responder no es lo mismo que entender');
  assert.equal(topic.gap.concept, 'Ámbito léxico');
});

test('recuperarse cierra el hueco', () => {
  Adaptive.setEnabled(true);
  const t = { id: 'py:listas', label: 'Listas' };
  Adaptive.recordGap('py:listas', { gap_concept: 'Índices', root_cause: 'Empieza a contar en 1' });
  Adaptive.recordAnswer(t, true);
  Adaptive.recordAnswer(t, true);
  Adaptive.recordAnswer(t, true);
  const topic = Adaptive.getTopic('py:listas');
  assert.equal(topic.gap, null);
  assert.equal(topic.status, Adaptive.STATUS.MASTERED);
});

test('topicId es estable y seguro para usar como clave', () => {
  assert.equal(Adaptive.topicId('python', 'Bucles While'), 'python:bucles-while');
  assert.equal(Adaptive.topicId('SQL', 'Índices únicos'), 'sql:indices-unicos');
  assert.equal(Adaptive.topicId(null, null), 'general:general');
});

console.log('\n🧠 AdaptiveLearningService — JSON del modelo');

test('acepta JSON limpio', () => {
  assert.deepEqual(Adaptive._parseJson('{"a":1}'), { a: 1 });
});

test('acepta JSON envuelto en vallas de código', () => {
  assert.deepEqual(Adaptive._parseJson('```json\n{"a":1}\n```'), { a: 1 });
});

test('acepta JSON precedido de texto', () => {
  assert.deepEqual(Adaptive._parseJson('Claro, aquí tienes:\n{"a":{"b":2}}'), { a: { b: 2 } });
});

test('devuelve null si no hay JSON usable', () => {
  assert.equal(Adaptive._parseJson('lo siento, no puedo'), null);
  assert.equal(Adaptive._parseJson(''), null);
});

console.log('\n🧠 AdaptiveLearningService — ritmo');

(async () => {
  await asyncTest('no propone quiz hasta la segunda señal, y luego respeta el enfriamiento', async () => {
    Adaptive.setEnabled(true);

    // Doble de Groq: devuelve siempre dos preguntas válidas.
    global.GroqService = {
      init: async () => 'proxy',
      isConfigured: () => true,
      chat: async () => JSON.stringify({
        questions: [
          { question: '¿Q1?', options: ['a', 'b'], answer: 0, concept: 'Bucles' },
          { question: '¿Q2?', options: ['a', 'b'], answer: 1, concept: 'Bucles' },
        ],
      }),
    };

    const señal = { source: 'lesson', courseId: 'python', title: 'Bucles', text: 'while' };
    const quizzes = () => _emitted.filter(e => e.type === 'in4mind-adaptive-quiz').length;

    Adaptive.handleSignal(señal);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(quizzes(), 0, 'la primera señal no debe interrumpir');

    Adaptive.handleSignal(señal);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(quizzes(), 1, 'la segunda sí');

    Adaptive.handleSignal(señal);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(quizzes(), 1, 'dos seguidos serían acoso: manda el enfriamiento');

    delete global.GroqService;
  });

  await asyncTest('sin Groq configurado no aparece nada', async () => {
    Adaptive.setEnabled(true);
    global.GroqService = { init: async () => 'none', isConfigured: () => false, chat: async () => '' };
    const señal = { source: 'chat', title: 'Algo' };
    Adaptive.handleSignal(señal);
    Adaptive.handleSignal(señal);
    await new Promise(r => setTimeout(r, 10));
    assert.equal(_emitted.filter(e => e.type === 'in4mind-adaptive-quiz').length, 0);
    delete global.GroqService;
  });

  await asyncTest('una respuesta fallada pide el diagnóstico y lo guarda', async () => {
    Adaptive.setEnabled(true);
    global.GroqService = {
      init: async () => 'proxy',
      isConfigured: () => true,
      chat: async () => '{"gap_concept":"Condición de salida","root_cause":"Cree que el bucle termina solo"}',
    };

    const resultado = await Adaptive.submitAnswer({
      context: { courseId: 'python', title: 'Bucles' },
      question: { question: '¿Cuándo para?', options: ['nunca', 'al cumplirse la condición'], answer: 1, concept: 'While' },
      chosenIndex: 0,
    });

    assert.equal(resultado.correct, false);
    assert.equal(resultado.gap.gap_concept, 'Condición de salida');
    assert.equal(resultado.topic.status, Adaptive.STATUS.GAP);
    assert.equal(Adaptive.getTopic('python:while').gap.cause, 'Cree que el bucle termina solo');
    delete global.GroqService;
  });

  await asyncTest('acertar no gasta una llamada al modelo', async () => {
    Adaptive.setEnabled(true);
    let llamadas = 0;
    global.GroqService = {
      init: async () => 'proxy',
      isConfigured: () => true,
      chat: async () => { llamadas++; return '{}'; },
    };

    const resultado = await Adaptive.submitAnswer({
      context: { courseId: 'python' },
      question: { question: '¿?', options: ['a', 'b'], answer: 1, concept: 'Listas' },
      chosenIndex: 1,
    });

    assert.equal(resultado.correct, true);
    assert.equal(llamadas, 0, 'el diagnóstico solo tiene sentido tras un fallo');
    delete global.GroqService;
  });

  console.log('\n🧠 AdaptiveLearningService — refuerzo');

  await asyncTest('genera la micro-lección del hueco y la reutiliza', async () => {
    Adaptive.setEnabled(true);
    let llamadas = 0;
    global.GroqService = {
      init: async () => 'proxy',
      isConfigured: () => true,
      chat: async () => { llamadas++; return '{"lesson":"Un bucle while repite mientras la condición sea cierta."}'; },
    };

    Adaptive.recordGap('python:while', { gap_concept: 'Condición de salida', root_cause: 'Cree que para solo' });

    const texto = await Adaptive.generateMicroLesson('python:while');
    assert.match(texto, /condición sea cierta/);
    assert.equal(llamadas, 1);

    // Segunda vez: sale de lo guardado, sin gastar otra llamada.
    const otra = await Adaptive.generateMicroLesson('python:while');
    assert.equal(otra, texto);
    assert.equal(llamadas, 1, 'una lección ya generada no se vuelve a pedir');
    assert.equal(Adaptive.getMicroLesson('python:while'), texto);
    delete global.GroqService;
  });

  await asyncTest('sin tema no hay lección', async () => {
    Adaptive.setEnabled(true);
    assert.equal(await Adaptive.generateMicroLesson('no:existe'), null);
  });

  await asyncTest('si el modelo no devuelve lección, no se guarda nada', async () => {
    Adaptive.setEnabled(true);
    global.GroqService = { init: async () => 'proxy', isConfigured: () => true, chat: async () => 'no puedo' };
    Adaptive.recordGap('js:async', { gap_concept: 'Promesas', root_cause: 'x' });
    assert.equal(await Adaptive.generateMicroLesson('js:async'), null);
    assert.equal(Adaptive.getMicroLesson('js:async'), null);
    delete global.GroqService;
  });

  test('leer el refuerzo no cierra el hueco por sí solo', () => {
    Adaptive.setEnabled(true);
    Adaptive.recordGap('sql:joins', { gap_concept: 'Claves', root_cause: 'x' });
    const topic = Adaptive.markReinforced('sql:joins');
    assert.ok(topic.gap.readAt, 'debería anotar cuándo se leyó');
    assert.equal(topic.status, Adaptive.STATUS.GAP, 'haber leído no es haber entendido');
  });

  console.log('\nadaptive-learning.test.js: all passed');
  console.log(`  Total: ${passed}`);
})();
