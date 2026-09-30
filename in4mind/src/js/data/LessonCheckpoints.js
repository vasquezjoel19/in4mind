/**
 * IN4MIND — Checkpoints de código por lección.
 *
 * Un checkpoint es un arreglo de una línea: cambiar un valor, añadir una
 * palabra que falta, corregir un descuido. No es un ejercicio abierto; su
 * única misión es comprobar que se entendió la idea del texto anterior.
 *
 * Sólo hay checkpoints de JavaScript. Corren en el mismo documento aislado
 * que el sandbox (`sandbox-runner.html`), que pesa nada. Los de Python
 * obligarían a descargar los ~10 MB de Pyodide para comprobar una línea, y eso
 * no compensa dentro de una tarjeta de teoría.
 *
 * Se valida comparando la salida de consola con `esperado`: es lo que el
 * alumno ve, y evita depender de cómo haya escrito la solución.
 */

'use strict';

const LessonCheckpoints = (() => {

  const CHECKPOINTS = {
    'javascript-l1': {
      enunciado: 'Cambia el valor para que el mensaje diga que estás aprendiendo JavaScript.',
      inicial: "const curso = 'Python';\nconsole.log(`Estoy aprendiendo ${curso}`);",
      esperado: 'Estoy aprendiendo JavaScript',
      pista: 'Solo hay que tocar el texto entre comillas de la primera línea.',
    },
    'javascript-l2': {
      enunciado: 'La función no devuelve nada. Arréglala para que imprima 42.',
      inicial: 'const doble = (n) => { n * 2 };\nconsole.log(doble(21));',
      esperado: '42',
      pista: 'Con llaves, una función flecha necesita `return` explícito.',
    },
    'javascript-l3': {
      enunciado: 'Añade la línea que hace el botón accesible para quien no ve su texto.',
      inicial: "const boton = document.createElement('button');\n"
        + "boton.textContent = 'Enviar';\n\n"
        + 'console.log(boton.getAttribute(\'aria-label\'));',
      esperado: 'Enviar',
      pista: 'Un `aria-label` da al botón un nombre que los lectores de pantalla anuncian.',
    },
    'javascript-l4': {
      enunciado: 'Falta esperar a que la promesa termine. Haz que imprima «listo».',
      inicial: "const tarda = () => new Promise(r => setTimeout(() => r('listo'), 50));\n\n"
        + 'async function principal() {\n'
        + '  const valor = tarda();\n'
        + '  console.log(valor);\n'
        + '}\n\n'
        + 'principal();',
      esperado: 'listo',
      pista: 'Dentro de una función `async`, `await` desenvuelve la promesa.',
    },
    'javascript-l5': {
      enunciado: 'El error no dice qué pasó. Haz que imprima «error 404».',
      inicial: 'const respuesta = { ok: false, status: 404 };\n\n'
        + 'function procesar(res) {\n'
        + "  if (res.ok) return 'datos';\n"
        + "  return 'error';\n"
        + '}\n\n'
        + 'console.log(procesar(respuesta));',
      esperado: 'error 404',
      pista: 'El código de estado está en `res.status`; incorpóralo al texto que devuelves.',
    },
  };

  /** Checkpoint de una lección, o `null` si no tiene. */
  function get(lessonId) {
    return CHECKPOINTS[lessonId] || null;
  }

  function has(lessonId) {
    return Boolean(CHECKPOINTS[lessonId]);
  }

  return { get, has };

})();

if (typeof module !== 'undefined') module.exports = LessonCheckpoints;
