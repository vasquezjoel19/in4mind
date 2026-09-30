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

  /* ── HTML ────────────────────────────────────────────────────────────────
     El alumno escribe marcado; `comprobacion` es un JS oculto que mira el DOM
     ya construido e imprime lo que se compara. Así el ejercicio va de HTML y
     no de saber escribir un `console.log`. */
  const HTML = {
    'html-l1': {
      lenguaje: 'html', etiqueta: 'Tu HTML',
      enunciado: 'Falta el elemento que envuelve el contenido principal. Añádelo alrededor del título.',
      inicial: '<h1>Mi primera página</h1>\n<p>Contenido de la página.</p>',
      comprobacion: "console.log(document.querySelector('main') ? 'ok' : 'falta');",
      esperado: 'ok',
      pista: 'El contenido principal de una página va dentro de `<main>`.',
    },
    'html-l2': {
      lenguaje: 'html', etiqueta: 'Tu HTML',
      enunciado: 'Este bloque es una noticia independiente. Cámbiale la etiqueta por la semántica correcta.',
      inicial: '<div>\n  <h2>Titular de la noticia</h2>\n  <p>Cuerpo de la noticia.</p>\n</div>',
      comprobacion: "console.log(document.querySelector('article') ? 'ok' : 'falta');",
      esperado: 'ok',
      pista: 'Un contenido que se entiende por sí solo y podría republicarse es un `<article>`.',
    },
    'html-l3': {
      lenguaje: 'html', etiqueta: 'Tu HTML',
      enunciado: 'La imagen no dice nada a quien no la ve. Descríbela con el atributo que corresponde.',
      inicial: '<img src="grafico.png" width="120" height="80">',
      comprobacion: "console.log(document.querySelector('img')?.getAttribute('alt') || 'falta');",
      esperado: 'Ventas por trimestre',
      pista: 'El atributo `alt` describe la imagen; escribe exactamente «Ventas por trimestre».',
    },
    'html-l4': {
      lenguaje: 'html', etiqueta: 'Tu HTML',
      enunciado: 'La etiqueta no está unida al campo. Enlázalos para que al pulsarla se enfoque el input.',
      inicial: '<label>Correo:</label>\n<input id="email" type="email">',
      comprobacion: "const l=document.querySelector('label');\n"
        + "console.log(l && l.control && l.control.id === 'email' ? 'ok' : 'falta');",
      esperado: 'ok',
      pista: 'El `for` de la etiqueta tiene que valer lo mismo que el `id` del campo.',
    },
    'html-l5': {
      lenguaje: 'html', etiqueta: 'Tu HTML',
      enunciado: 'Añade la meta descripción que los buscadores muestran bajo el título.',
      inicial: '<h1>Curso de HTML</h1>',
      comprobacion: "console.log(document.querySelector('meta[name=\"description\"]')?.content || 'falta');",
      esperado: 'Aprende HTML desde cero',
      pista: 'Es un `<meta>` con `name="description"` y un `content`; escribe «Aprende HTML desde cero».',
    },
  };

  /* ── CSS ─────────────────────────────────────────────────────────────────
     Se comprueba el estilo YA aplicado con `getComputedStyle`, no el texto de
     la regla: así vale cualquier forma correcta de conseguirlo. */
  const CSS = {
    'css-l1': {
      lenguaje: 'css', etiqueta: 'Tu CSS',
      html: '<p class="destacado">Texto destacado</p>',
      enunciado: 'El párrafo destacado debe verse en negrita. Complétalo.',
      inicial: '.destacado {\n  color: #0f172a;\n}',
      comprobacion: "const e=document.querySelector('.destacado');\n"
        + "console.log(getComputedStyle(e).fontWeight);",
      esperado: '700',
      pista: 'La propiedad es `font-weight`, y el valor de negrita pesa 700.',
    },
    'css-l2': {
      lenguaje: 'css', etiqueta: 'Tu CSS',
      html: '<div class="caja">Contenido</div>',
      enunciado: 'La caja mide más de lo declarado porque el padding se suma. Haz que 200px sean 200px.',
      inicial: '.caja {\n  width: 200px;\n  padding: 20px;\n  border: 2px solid #999;\n}',
      comprobacion: "const e=document.querySelector('.caja');\n"
        + "console.log(Math.round(e.getBoundingClientRect().width));",
      esperado: '200',
      pista: 'Con `box-sizing: border-box` el ancho incluye el relleno y el borde.',
    },
    'css-l3': {
      lenguaje: 'css', etiqueta: 'Tu CSS',
      html: '<nav class="menu"><a>Inicio</a><a>Cursos</a></nav>',
      enunciado: 'Los enlaces se apilan. Ponlos en fila con el modelo de una dimensión.',
      inicial: '.menu {\n  gap: 1rem;\n}',
      comprobacion: "console.log(getComputedStyle(document.querySelector('.menu')).display);",
      esperado: 'flex',
      pista: 'Flexbox se activa con `display: flex` en el contenedor.',
    },
    'css-l4': {
      lenguaje: 'css', etiqueta: 'Tu CSS',
      html: '<div class="rejilla"><span>1</span><span>2</span><span>3</span></div>',
      enunciado: 'La rejilla debe tener exactamente tres columnas iguales.',
      inicial: '.rejilla {\n  display: grid;\n  gap: 8px;\n}',
      comprobacion: "const c=getComputedStyle(document.querySelector('.rejilla')).gridTemplateColumns;\n"
        + "console.log(c.split(' ').filter(Boolean).length);",
      esperado: '3',
      pista: '`grid-template-columns: repeat(3, 1fr)` reparte el ancho en tres partes iguales.',
    },
    'css-l5': {
      lenguaje: 'css', etiqueta: 'Tu CSS',
      html: '<button class="boton">Enviar</button>',
      enunciado: 'El botón no avisa de que es pulsable. Cambia el cursor al pasar por encima.',
      inicial: '.boton {\n  padding: 8px 16px;\n}',
      comprobacion: "console.log(getComputedStyle(document.querySelector('.boton')).cursor);",
      esperado: 'pointer',
      pista: 'La propiedad es `cursor`, y la mano que indica «pulsable» es `pointer`.',
    },
  };

  /* ── Python ──────────────────────────────────────────────────────────────
     Se ejecutan de verdad, en el worker de Pyodide. La primera comprobación
     de una lección de Python descarga el intérprete, así que el componente le
     da margen aparte antes de dar por colgada la ejecución. */
  const PYTHON = {
    'python-l1': {
      lenguaje: 'python', etiqueta: 'Tu código Python',
      enunciado: 'La edad se está tratando como texto. Conviértela para que la suma dé 26.',
      inicial: 'edad = "25"\nprint(edad + 1)',
      esperado: '26',
      pista: '`int()` convierte una cadena en número entero.',
    },
    'python-l2': {
      lenguaje: 'python', etiqueta: 'Tu código Python',
      enunciado: 'El bucle imprime de 1 a 4. Haz que llegue hasta 5.',
      inicial: 'for i in range(1, 5):\n    print(i)',
      esperado: '5',
      pista: 'En `range(a, b)` el segundo número queda fuera: hay que subirlo uno.',
    },
    'python-l3': {
      lenguaje: 'python', etiqueta: 'Tu código Python',
      enunciado: 'La función calcula pero no entrega nada. Arréglala para que imprima 8.',
      inicial: 'def suma(a, b):\n    a + b\n\nprint(suma(3, 5))',
      esperado: '8',
      pista: 'Sin `return`, una función de Python devuelve `None`.',
    },
    'python-l4': {
      lenguaje: 'python', etiqueta: 'Tu código Python',
      enunciado: 'Falta acceder al dato. Haz que imprima el correo de la persona.',
      inicial: "persona = {'nombre': 'Ana', 'email': 'ana@in4mind.test'}\nprint(persona)",
      esperado: 'ana@in4mind.test',
      pista: 'A un diccionario se le pide una clave entre corchetes.',
    },
    'python-l5': {
      lenguaje: 'python', etiqueta: 'Tu código Python',
      enunciado: 'Esto revienta al dividir entre cero. Captúralo e imprime «error».',
      inicial: 'def dividir(a, b):\n    return a / b\n\nprint(dividir(4, 0))',
      esperado: 'error',
      pista: 'Envuelve la llamada en `try` / `except` e imprime «error» en el except.',
    },
  };

  /* ── Sin motor en el navegador ───────────────────────────────────────────
     SQL, git y las fórmulas de hoja de cálculo no se pueden ejecutar aquí, así
     que se revisa la SINTAXIS contra un patrón. Es una comprobación honesta de
     lo escrito, no una ejecución, y el componente lo dice al validarlo.
     Los patrones son laxos con los espacios y las mayúsculas a propósito: se
     comprueba la construcción, no la caligrafía. */
  const PATRON = {
    'sql-l1': {
      lenguaje: 'texto', etiqueta: 'Tu consulta SQL',
      enunciado: 'Ordena el resultado por nombre de la A a la Z.',
      inicial: 'SELECT id, nombre\nFROM clientes\nWHERE activo = TRUE;',
      patron: 'order\\s+by\\s+nombre(\\s+asc)?',
      esperado: 'una cláusula ORDER BY nombre',
      pista: '`ORDER BY columna ASC` va después del `WHERE`.',
    },
    'sql-l2': {
      lenguaje: 'texto', etiqueta: 'Tu consulta SQL',
      enunciado: 'Trae también el nombre del cliente uniendo ambas tablas por su clave.',
      inicial: 'SELECT p.total\nFROM pedidos p;',
      patron: 'join\\s+clientes[\\s\\S]*\\bon\\b[\\s\\S]*=',
      esperado: 'un JOIN con clientes y su condición ON',
      pista: '`JOIN clientes c ON c.id = p.cliente_id` relaciona las dos tablas.',
    },
    'sql-l3': {
      lenguaje: 'texto', etiqueta: 'Tu consulta SQL',
      enunciado: 'Cuenta los pedidos por cliente. Falta agrupar.',
      inicial: 'SELECT cliente_id, COUNT(*)\nFROM pedidos;',
      patron: 'group\\s+by\\s+cliente_id',
      esperado: 'una cláusula GROUP BY cliente_id',
      pista: 'Al mezclar una columna con una función agregada hay que agrupar por esa columna.',
    },
    'sql-l4': {
      lenguaje: 'texto', etiqueta: 'Tu consulta SQL',
      enunciado: 'Declara la consulta auxiliar como CTE, antes del SELECT final.',
      inicial: 'SELECT * FROM recientes;',
      patron: '\\bwith\\s+recientes\\s+as\\s*\\(',
      esperado: 'un WITH recientes AS (…)',
      pista: 'Una CTE se declara con `WITH nombre AS ( … )` delante de la consulta.',
    },
    'sql-l5': {
      lenguaje: 'texto', etiqueta: 'Tu sentencia SQL',
      enunciado: 'Las búsquedas por email van lentas. Crea el índice que falta.',
      inicial: '-- escribe aquí la sentencia',
      patron: 'create\\s+index[\\s\\S]*\\bon\\s+clientes\\s*\\(\\s*email\\s*\\)',
      esperado: 'un CREATE INDEX sobre clientes(email)',
      pista: '`CREATE INDEX nombre ON tabla (columna);`',
    },
    'github-l1': {
      lenguaje: 'texto', etiqueta: 'Tu comando git',
      enunciado: 'Ya hiciste commit. Escribe el comando que sube la rama al remoto por primera vez.',
      inicial: '# escribe aquí el comando',
      patron: 'git\\s+push\\s+(-u|--set-upstream)\\s+origin\\s+\\S+',
      esperado: 'un git push -u origin <rama>',
      pista: '`-u` deja enlazada la rama local con la remota para los próximos push.',
    },
    'github-l2': {
      lenguaje: 'texto', etiqueta: 'Tu comando git',
      enunciado: 'Crea una rama llamada `feature/login` y cámbiate a ella en un solo comando.',
      inicial: '# escribe aquí el comando',
      patron: 'git\\s+(checkout\\s+-b|switch\\s+-c)\\s+feature/login',
      esperado: 'un git checkout -b feature/login',
      pista: '`checkout -b` (o `switch -c`) crea y cambia de rama a la vez.',
    },
    'github-l3': {
      lenguaje: 'texto', etiqueta: 'Tu mensaje de commit',
      enunciado: 'Escribe el mensaje en formato convencional para un arreglo del login.',
      inicial: '# escribe aquí el mensaje',
      patron: '^(fix|feat|docs|refactor|test|chore)(\\([\\w-]+\\))?:\\s+\\S+',
      esperado: 'un mensaje tipo fix(login): …',
      pista: 'El formato es `tipo(ámbito): descripción`, por ejemplo `fix(login): …`.',
    },
    'github-l4': {
      lenguaje: 'texto', etiqueta: 'Tu texto',
      enunciado: 'En la descripción del PR, escribe la palabra clave que cierra el issue 42 al fusionar.',
      inicial: '# escribe aquí la línea',
      patron: '\\b(closes|fixes|resolves)\\s+#42\\b',
      esperado: 'un «Closes #42»',
      pista: 'GitHub cierra el issue si el PR dice `Closes #42`, `Fixes #42` o `Resolves #42`.',
    },
    'github-l5': {
      lenguaje: 'texto', etiqueta: 'Tu YAML',
      enunciado: 'El workflow no se dispara nunca. Añade el evento que lo lanza en cada push.',
      inicial: 'name: CI\n\njobs:\n  test:\n    runs-on: ubuntu-latest',
      patron: '\\bon:\\s*[\\s\\S]*\\bpush\\b',
      esperado: 'un bloque on: con push',
      pista: 'El disparador se declara con `on:` y debajo `push:`.',
    },
    'excel-l1': {
      lenguaje: 'texto', etiqueta: 'Tu referencia',
      enunciado: 'Al copiar la fórmula, la celda B2 debe quedar fija. Escríbela como referencia absoluta.',
      inicial: 'B2',
      patron: '^\\s*\\$B\\$2\\s*$',
      esperado: '$B$2',
      pista: 'El símbolo `$` delante de la letra y del número congela ambas.',
    },
    'excel-l2': {
      lenguaje: 'texto', etiqueta: 'Tu fórmula',
      enunciado: 'Suma el rango A1:A10 con la función correspondiente.',
      inicial: '=',
      patron: '^\\s*=\\s*(suma|sum)\\s*\\(\\s*a1\\s*:\\s*a10\\s*\\)\\s*$',
      esperado: '=SUMA(A1:A10)',
      pista: 'La función se llama `SUMA` en español y `SUM` en inglés.',
    },
    'excel-l3': {
      lenguaje: 'texto', etiqueta: 'Tu fórmula',
      enunciado: 'Busca el valor de D2 en la tabla A:B y devuelve la segunda columna, con coincidencia exacta.',
      inicial: '=',
      patron: '^\\s*=\\s*(buscarv|vlookup)\\s*\\(\\s*d2\\s*[;,]\\s*a:b\\s*[;,]\\s*2\\s*[;,]\\s*(falso|false|0)\\s*\\)\\s*$',
      esperado: '=BUSCARV(D2;A:B;2;FALSO)',
      pista: 'El último argumento indica coincidencia exacta: `FALSO` (o 0).',
    },
    'excel-l4': {
      lenguaje: 'texto', etiqueta: 'Tu fórmula',
      enunciado: 'Cuenta cuántas filas del rango C2:C100 contienen «Cerrado».',
      inicial: '=',
      patron: '^\\s*=\\s*(contar\\.si|countif)\\s*\\(\\s*c2\\s*:\\s*c100\\s*[;,]\\s*"cerrado"\\s*\\)\\s*$',
      esperado: '=CONTAR.SI(C2:C100;"Cerrado")',
      pista: 'La función es `CONTAR.SI` (`COUNTIF`) y el criterio va entre comillas.',
    },
    'excel-l5': {
      lenguaje: 'texto', etiqueta: 'Tu fórmula',
      enunciado: 'Si el total supera 1000, muestra «Alto»; si no, «Bajo».',
      inicial: '=',
      patron: '^\\s*=\\s*(si|if)\\s*\\(\\s*[a-z]+\\d+\\s*>\\s*1000\\s*[;,]\\s*"alto"\\s*[;,]\\s*"bajo"\\s*\\)\\s*$',
      esperado: '=SI(A1>1000;"Alto";"Bajo")',
      pista: '`SI(condición; valor_si_verdadero; valor_si_falso)`.',
    },
  };

  const CHECKPOINTS = {
    ...HTML,
    ...CSS,
    ...PYTHON,
    ...PATRON,
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
