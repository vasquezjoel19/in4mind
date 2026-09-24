/**
 * IN4MIND — Infy como guía: saludo adaptativo y tipos de aviso.
 *
 * Lo que se comprueba aquí es la decisión, no el dibujo: qué dice Infy según
 * la hora y la racha, y qué gesto corresponde a cada tipo de aviso. El
 * montaje real —el globo del acceso rápido, el confeti, el tour— se verifica
 * en el banco con Chromium, que es donde se ve si además se pinta.
 *
 * Ejecutar: node tests/mascot.test.js
 */

'use strict';

const assert = require('assert');
const path = require('path');

/* ── Dobles mínimos del navegador ───────────────────────────────────────── */
global.window = { addEventListener() {}, matchMedia: () => ({ matches: false }) };
global.document = {
  readyState: 'complete',
  addEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({
    className: '', textContent: '', dataset: {}, style: { setProperty() {} },
    setAttribute() {}, appendChild() {}, insertBefore() {}, remove() {},
    classList: { add() {}, remove() {}, contains: () => false },
    querySelector: () => null, querySelectorAll: () => [],
  }),
  body: { appendChild() {} },
};
global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} };

/* Sin I18n, `_t` cae en los textos por defecto, que es justo lo que interesa
   comprobar: que el mensaje se construya bien aunque falte la traducción. */
const Mascot = require(path.join(__dirname, '..', 'src/js/services/MascotService.js'));

let passed = 0;
function test(nombre, fn) {
  fn();
  console.log(`  ✅ ${nombre}`);
  passed += 1;
}

console.log('\n🤖 Infy — saludo adaptativo');

test('por la mañana saluda con los buenos días', () => {
  const s = Mascot.greetingFor(9, 0, 'Ana');
  assert.match(s.texto, /Buenos días/);
  assert.match(s.texto, /Ana/);
  assert.equal(s.gesto, 'IDLE');
});

test('el corte de la mañana son las 5 y las 12', () => {
  assert.match(Mascot.greetingFor(5, 0, 'Ana').texto, /Buenos días/);
  assert.match(Mascot.greetingFor(11, 0, 'Ana').texto, /Buenos días/);
  // Justo fuera, a ambos lados.
  assert.match(Mascot.greetingFor(4, 0, 'Ana').texto, /Buenas tardes/);
  assert.match(Mascot.greetingFor(12, 0, 'Ana').texto, /Buenas tardes/);
});

test('por la tarde invita a seguir donde lo dejó', () => {
  const s = Mascot.greetingFor(19, 0, 'Ana');
  assert.match(s.texto, /Buenas tardes/);
  assert.match(s.texto, /donde lo dejaste/);
});

test('la racha manda sobre la hora y celebra', () => {
  // Llevar días seguidos importa más que si son las nueve o las siete.
  const manana = Mascot.greetingFor(9, 5, 'Ana');
  const noche = Mascot.greetingFor(23, 5, 'Ana');
  for (const s of [manana, noche]) {
    assert.equal(s.gesto, 'SUCCESS', 'con racha, Infy celebra');
    assert.match(s.texto, /5 días seguidos/);
  }
});

test('una racha de 0 no se celebra', () => {
  assert.equal(Mascot.greetingFor(9, 0, 'Ana').gesto, 'IDLE');
});

test('sin nombre el saludo sigue siendo correcto', () => {
  // Alguien recién registrado puede no tener nombre todavía: no debe salir
  // "¡Buenos días, !" con la coma colgando.
  const s = Mascot.greetingFor(9, 0, '');
  assert.ok(!/,\s*!/.test(s.texto), `coma colgando: ${s.texto}`);
  assert.match(s.texto, /Buenos días/);
});

console.log('\n🤖 Infy — la API del encargo');

test('expone showToast y renderCard', () => {
  assert.equal(typeof Mascot.showToast, 'function');
  assert.equal(typeof Mascot.renderCard, 'function');
});

test('showToast admite las dos formas sin reventar', () => {
  // Sin mascota cargada devuelve null, pero no debe lanzar en ninguna forma.
  assert.doesNotThrow(() => Mascot.showToast('hola', 'success'));
  assert.doesNotThrow(() => Mascot.showToast({ message: 'hola', type: 'success', duration: 100 }));
  assert.doesNotThrow(() => Mascot.showToast(''));
  assert.doesNotThrow(() => Mascot.showToast(null));
});

test('no monta nada si la mascota no está cargada', () => {
  // Cada página decide si carga Infy; sin ella, el servicio se calla.
  assert.equal(Mascot.showToast('hola', 'success'), null);
  assert.equal(Mascot.renderCard(null, {}), null);
  assert.equal(Mascot.decorateEmptyStates(), 0);
  assert.equal(Mascot.decorateOnboarding(), 0);
});

console.log('\nmascot.test.js: all passed');
console.log(`  Total: ${passed}`);
