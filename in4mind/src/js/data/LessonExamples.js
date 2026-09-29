/**
 * IN4MIND — Ejemplos prácticos estilo W3Schools por lección.
 */

'use strict';

const LessonExamples = (() => {

  const CODE = {
    'html-l1': `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi primera página</title>
</head>
<body>
  <h1>Hola IN4MIND</h1>
  <p>Esta es la estructura base de un documento HTML5.</p>
</body>
</html>`,
    'html-l4': `<form action="/enviar" method="post">
  <label for="email">Correo:</label>
  <input id="email" type="email" required>
  <button type="submit">Enviar</button>
</form>`,
    'css-l1': `/* Selector por clase */
.card {
  padding: 1rem;
  border-radius: 8px;
  background: #f8fafc;
}

.card--highlight {
  border: 2px solid #4a76b2;
}`,
    'css-l3': `.nav {
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}`,
    'javascript-l1': `const usuario = { nombre: 'Ana', activo: true };
let intentos = 0;

function saludar(nombre) {
  return \`Hola, \${nombre}\`;
}

console.log(saludar(usuario.nombre));`,
    'javascript-l4': `async function cargarDatos() {
  try {
    const res = await fetch('/api/cursos');
    if (!res.ok) throw new Error('Error de red');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(err);
  }
}`,
    'python-l1': `usuario = "Ana"
edad = 25
activo = True

print(f"{usuario} tiene {edad} años")`,
    'python-l3': `def calcular_promedio(notas):
    """Devuelve el promedio de una lista de notas."""
    return sum(notas) / len(notas)

print(calcular_promedio([8, 9, 7]))`,
    'sql-l1': `SELECT id, nombre, email
FROM clientes
WHERE activo = TRUE
ORDER BY nombre ASC
LIMIT 50;`,
    'sql-l2': `SELECT p.nombre, c.total
FROM pedidos c
INNER JOIN clientes p ON p.id = c.cliente_id
WHERE c.fecha >= '2024-01-01';`,
    'github-l1': `git init
git add .
git commit -m "feat: estructura inicial del proyecto"
git branch -M main
git remote add origin https://github.com/usuario/repo.git
git push -u origin main`,
  };

  function get(lessonId) {
    return CODE[lessonId] || null;
  }

  function isCodeCourse(courseId) {
    return ['html', 'css', 'javascript', 'python', 'sql', 'github'].includes(courseId);
  }

  /* Cursos que el sandbox puede ejecutar DE VERDAD. `sql` y `github` se quedan
     fuera a propósito: no hay motor que los corra en el navegador, y un botón
     «Ejecutar» que no ejecuta nada enseña peor que no ofrecer ninguno. */
  const EJECUTABLES = { html: 'web', css: 'web', javascript: 'web', python: 'python' };

  // Para lecciones sin ejemplo propio: algo mínimo que corra al primer intento.
  const ARRANQUE = {
    html: '<h1>Hola</h1>\n<p>Edita este HTML y pulsa Ejecutar.</p>',
    css: '.tarjeta {\n  padding: 1rem;\n  border-radius: 8px;\n  background: #f8fafc;\n}',
    javascript: "console.log('Hola IN4MIND');",
    python: "print('Hola IN4MIND')",
  };

  /**
   * Qué sandbox corresponde a una lección: el lenguaje a montar y el código
   * con el que arranca. `null` si el curso no es ejecutable en el navegador.
   *
   * @returns {{lenguaje: string, inicial: object}|null}
   */
  function sandboxSeed(lesson, courseId) {
    const lenguaje = EJECUTABLES[courseId];
    if (!lenguaje) return null;

    const code = get(lesson?.id) || ARRANQUE[courseId];
    if (courseId === 'python') return { lenguaje, activo: 'python', inicial: { python: code } };
    if (courseId === 'javascript') return { lenguaje, activo: 'js', inicial: { js: code } };
    if (courseId === 'html') return { lenguaje, activo: 'html', inicial: { html: code } };
    /* CSS sin marcado que lo reciba no se ve: la vista previa saldría en
       blanco y parecería que el sandbox está roto. Se arma un andamio con las
       propias clases del ejemplo —pero se abre en CSS, que es la lección. */
    return { lenguaje, activo: 'css', inicial: { css: code, html: _andamio(code) } };
  }

  /** Marcado mínimo para que las clases del CSS tengan a qué aplicarse. */
  function _andamio(css) {
    const clases = [...new Set((String(css).match(/\.[A-Za-z][\w-]*/g) || [])
      .map((c) => c.slice(1)))].slice(0, 4);
    if (!clases.length) return '<div>Escribe aquí tu marcado.</div>';
    return clases.map((c) => `<div class="${c}">${c}</div>`).join('\n');
  }

  function buildHtml(lesson, courseId) {
    const code = get(lesson.id);
    if (code) {
      return `<pre class="lesson-w3__code" tabindex="0"><code>${_escape(code)}</code></pre>`;
    }
    if (isCodeCourse(courseId) && lesson.steps?.length) {
      const snippet = lesson.steps.slice(0, 3).map((s, i) => `${i + 1}. ${s}`).join('\n');
      return `<pre class="lesson-w3__code lesson-w3__code--guide" tabindex="0"><code>${_escape(snippet)}</code></pre>`;
    }
    const lines = (lesson.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
    return `<pre class="lesson-w3__code lesson-w3__code--workflow" tabindex="0"><code>${_escape(lines)}</code></pre>`;
  }

  function _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return { get, buildHtml, isCodeCourse, sandboxSeed };

})();

if (typeof module !== 'undefined') module.exports = LessonExamples;
