/**
 * IN4MIND — Mapa de dominio en 3D.
 *
 * Aquí se comprueba lo que se puede comprobar sin GPU: cómo se construye la
 * constelación a partir del estado del motor y cuándo el componente decide
 * que WebGL no toca. El montaje real, el clic sobre un nodo y la pausa fuera
 * del viewport se verifican en el banco funcional con Chromium.
 *
 * Ejecutar: node tests/skill-graph.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');

/* ── Dobles del navegador ───────────────────────────────────────────────── */
const _store = {};
global.localStorage = {
  getItem(k) { return _store[k] ?? null; },
  setItem(k, v) { _store[k] = String(v); },
  removeItem(k) { delete _store[k]; },
};
global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.CustomEvent = class CustomEvent {
  constructor(type, init) { this.type = type; this.detail = init?.detail; }
};

/** Capacidades del aparato simulado; cada caso ajusta lo que necesita. */
let _capacidades = {
  reducedMotion: false,
  anchoEstrecho: false,
  saveData: false,
  memoria: 8,
  nucleos: 8,
  webgl: true,
};

global.window = {
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return true; },
  matchMedia: (q) => ({
    matches: /prefers-reduced-motion/.test(q)
      ? _capacidades.reducedMotion
      : (/max-width: 768px/.test(q) ? _capacidades.anchoEstrecho : false),
  }),
};

/* Node 22 ya define `navigator` y solo tiene getter, así que se redefine la
   propiedad en vez de asignarla. */
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  get: () => ({
    connection: { saveData: _capacidades.saveData },
    deviceMemory: _capacidades.memoria,
    hardwareConcurrency: _capacidades.nucleos,
  }),
});

global.document = {
  readyState: 'complete',
  hidden: false,
  addEventListener() {},
  removeEventListener() {},
  querySelector: () => null,
  createElement: () => ({
    getContext: () => (_capacidades.webgl ? { getExtension: () => ({ loseContext() {} }) } : null),
    style: {}, classList: { add() {} }, appendChild() {}, setAttribute() {},
  }),
};

global.AdaptiveLearningService = require(path.join(__dirname, '..', 'src/js/services/AdaptiveLearningService.js'));
const Graph = require(path.join(__dirname, '..', 'src/js/components/SkillGraph3D.js'));

let passed = 0;

function test(name, fn) {
  for (const k of Object.keys(_store)) delete _store[k];
  _capacidades = { reducedMotion: false, anchoEstrecho: false, saveData: false, memoria: 8, nucleos: 8, webgl: true };
  fn();
  console.log(`  ✅ ${name}`);
  passed++;
}

console.log('\n🌐 SkillGraph3D — constelación');

test('sin datos no hay nodos', () => {
  assert.deepEqual(Graph._datos(), { nodos: [], enlaces: [] });
});

test('cada curso es un centro y sus temas orbitan unidos a él', () => {
  AdaptiveLearningService.setEnabled(true);
  AdaptiveLearningService.recordAnswer({ id: 'python:bucles', label: 'Bucles', courseId: 'python' }, true);
  AdaptiveLearningService.recordAnswer({ id: 'python:listas', label: 'Listas', courseId: 'python' }, true);
  AdaptiveLearningService.recordAnswer({ id: 'sql:joins', label: 'JOINs', courseId: 'sql' }, true);

  const { nodos, enlaces } = Graph._datos();
  const cursos = nodos.filter(n => n.tipo === 'curso');
  const temas = nodos.filter(n => n.tipo === 'tema');

  assert.equal(cursos.length, 2, 'dos cursos distintos');
  assert.equal(temas.length, 3);
  assert.equal(enlaces.length, 3, 'cada tema cuelga de su curso');
  assert.ok(enlaces.every(([centro, tema]) => tema.id.startsWith(centro.label)),
    'cada enlace une el tema con SU curso');
});

test('las posiciones son estables entre visitas', () => {
  AdaptiveLearningService.setEnabled(true);
  AdaptiveLearningService.recordAnswer({ id: 'python:bucles', label: 'Bucles', courseId: 'python' }, true);
  const a = Graph._datos().nodos.map(n => `${n.x.toFixed(4)},${n.y.toFixed(4)},${n.z.toFixed(4)}`);
  const b = Graph._datos().nodos.map(n => `${n.x.toFixed(4)},${n.y.toFixed(4)},${n.z.toFixed(4)}`);
  assert.deepEqual(a, b, 'el mapa no debe saltar en cada carga');
});

test('las posiciones no dependen del orden de actividad', () => {
  // getTopics() ordena por actividad reciente. Sin reordenar por id, responder
  // cualquier cosa recolocaba el mapa entero y, de paso, borraba el refuerzo
  // que se estuviera leyendo.
  AdaptiveLearningService.setEnabled(true);
  AdaptiveLearningService.recordAnswer({ id: 'python:bucles', label: 'Bucles', courseId: 'python' }, true);
  AdaptiveLearningService.recordAnswer({ id: 'python:listas', label: 'Listas', courseId: 'python' }, true);
  const antes = Graph._datos().nodos.map(n => `${n.id}@${n.x.toFixed(3)},${n.z.toFixed(3)}`);

  // Se toca el tema más antiguo: cambia su updatedAt y con él el orden.
  AdaptiveLearningService.recordAnswer({ id: 'python:bucles', label: 'Bucles', courseId: 'python' }, true);
  const despues = Graph._datos().nodos.map(n => `${n.id}@${n.x.toFixed(3)},${n.z.toFixed(3)}`);

  assert.deepEqual(despues, antes, 'el mapa no debe recolocarse al responder');
});

test('el estado del tema viaja al nodo', () => {
  AdaptiveLearningService.setEnabled(true);
  const t = { id: 'js:async', label: 'Async', courseId: 'js' };
  AdaptiveLearningService.recordAnswer(t, true);
  AdaptiveLearningService.recordAnswer(t, true);
  AdaptiveLearningService.recordGap('js:promesas', { gap_concept: 'Promesas', root_cause: 'x' });

  const nodos = Graph._datos().nodos.filter(n => n.tipo === 'tema');
  const dominado = nodos.find(n => n.id === 'js:async');
  const hueco = nodos.find(n => n.id === 'js:promesas');
  assert.equal(dominado.estado, 'mastered');
  assert.equal(hueco.estado, 'gap');
});

console.log('\n🌐 SkillGraph3D — cuándo NO se usa WebGL');

test('con animaciones reducidas, no', () => {
  _capacidades.reducedMotion = true;
  assert.equal(Graph.puede3D(), false);
});

test('en pantalla de móvil, no', () => {
  _capacidades.anchoEstrecho = true;
  assert.equal(Graph.puede3D(), false);
});

test('con ahorro de datos, no', () => {
  _capacidades.saveData = true;
  assert.equal(Graph.puede3D(), false);
});

test('en equipos con poca memoria o pocos núcleos, no', () => {
  _capacidades.memoria = 2;
  assert.equal(Graph.puede3D(), false);
  _capacidades.memoria = 8;
  _capacidades.nucleos = 2;
  assert.equal(Graph.puede3D(), false);
});

test('sin contexto WebGL, no', () => {
  _capacidades.webgl = false;
  assert.equal(Graph.puede3D(), false);
});

test('en un equipo capaz, sí', () => {
  assert.equal(Graph.puede3D(), true);
});

test('los colores son los del encargo', () => {
  assert.equal(Graph.COLORES.mastered, '#10B981');
  assert.equal(Graph.COLORES.progress, '#F59E0B');
  assert.equal(Graph.COLORES.gap, '#EF4444');
});

test('destroy() es seguro sin nada montado', () => {
  Graph.destroy();
  Graph.destroy();
});

console.log('\nskill-graph.test.js: all passed');
console.log(`  Total: ${passed}`);
