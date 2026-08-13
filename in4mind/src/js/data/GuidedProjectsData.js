/**
 * IN4MIND â€” CatÃ¡logo de proyectos guiados.
 * Cada proyecto se desbloquea con >80 % en el quiz del tema vinculado (`quizId`).
 */

'use strict';

const GuidedProjectsData = (() => {

  const PROJECTS = [
    {
      id: 'gp-html-landing',
      quizId: 'html',
      courseId: 'html',
      difficulty: 'beginner',
      estimatedMinutes: 35,
      icon: 'src/img/courses/logos/html.png',
      title: 'Landing page semÃ¡ntica',
      summary: 'Construye la estructura HTML de una landing page profesional, secciÃ³n a secciÃ³n.',
      steps: [
        {
          id: 's1',
          title: 'Documento base',
          instructions: 'Crea el esqueleto HTML5: doctype, html lang, head con charset/viewport/title y un body vacÃ­o.\n\nObjetivo: un documento vÃ¡lido listo para contenido.',
          workspaceType: 'code',
          placeholder: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  â€¦\n</head>\n<body>\n</body>\n</html>',
          hint: 'Incluye <meta charset="UTF-8"> y un <title> descriptivo.',
          rubric: [
            { id: 'completeness', label: 'Completitud', weight: 0.4 },
            { id: 'semantics', label: 'SemÃ¡ntica HTML', weight: 0.35 },
            { id: 'best_practices', label: 'Buenas prÃ¡cticas', weight: 0.25 },
          ],
        },
        {
          id: 's2',
          title: 'Cabecera y navegaciÃ³n',
          instructions: 'AÃ±ade un <header> con el nombre del producto y un <nav> con tres enlaces internos (#inicio, #features, #contacto).',
          workspaceType: 'code',
          placeholder: '<header>\n  <h1>â€¦</h1>\n  <nav>â€¦</nav>\n</header>',
          hint: 'Usa <a href="#..."> para anclas internas.',
        },
        {
          id: 's3',
          title: 'Hero y caracterÃ­sticas',
          instructions: 'Crea un <main> con:\n1) secciÃ³n hero (h2 + pÃ¡rrafo + botÃ³n/enlace CTA)\n2) secciÃ³n de 3 <article> con h3 y texto corto.',
          workspaceType: 'code',
          placeholder: '<main>\n  <section id="inicio">â€¦</section>\n  <section id="features">â€¦</section>\n</main>',
        },
        {
          id: 's4',
          title: 'Formulario de contacto',
          instructions: 'En #contacto, aÃ±ade un <form> con label+input para nombre y email, un textarea de mensaje y un botÃ³n submit. Explica en 2â€“3 lÃ­neas quÃ© hace cada campo.',
          workspaceType: 'code',
          placeholder: '<section id="contacto">\n  <form>â€¦</form>\n</section>\n\n<!-- Notas: -->',
        },
      ],
    },
    {
      id: 'gp-css-card',
      quizId: 'css',
      courseId: 'css',
      difficulty: 'beginner',
      estimatedMinutes: 40,
      icon: 'src/img/courses/logos/css.png',
      title: 'Card responsive con Flexbox',
      summary: 'DiseÃ±a una tarjeta de producto adaptable usando variables CSS y Flexbox.',
      steps: [
        {
          id: 's1',
          title: 'Tokens y reset ligero',
          instructions: 'Define en :root colores (--brand, --text, --surface) y un box-sizing border-box global. Describe por quÃ© usas tokens.',
          workspaceType: 'code',
          placeholder: ':root {\n  --brand: â€¦;\n}\n\n*, *::before, *::after { box-sizing: border-box; }',
        },
        {
          id: 's2',
          title: 'Estructura de la card',
          instructions: 'Escribe el CSS de .card (padding, radio, sombra suave, fondo --surface) y .card__title / .card__price.',
          workspaceType: 'code',
          placeholder: '.card {\n  â€¦\n}',
        },
        {
          id: 's3',
          title: 'Layout Flexbox',
          instructions: 'Haz que .card__footer use display:flex; justify-content:space-between; align-items:center. AÃ±ade un media query que apile en columna bajo 480px.',
          workspaceType: 'code',
          placeholder: '.card__footer { display: flex; â€¦ }\n\n@media (max-width: 480px) {\n  â€¦\n}',
        },
      ],
    },
    {
      id: 'gp-js-todo',
      quizId: 'javascript',
      courseId: 'javascript',
      difficulty: 'intermediate',
      estimatedMinutes: 50,
      icon: 'src/img/courses/logos/javascript.png',
      title: 'Mini lista de tareas',
      summary: 'Implementa la lÃ³gica de una to-do list: aÃ±adir, marcar hecha y filtrar.',
      steps: [
        {
          id: 's1',
          title: 'Modelo de datos',
          instructions: 'Define un array `tasks` y una funciÃ³n `addTask(text)` que empuje `{ id, text, done:false }`. Explica cÃ³mo generarÃ­as el id.',
          workspaceType: 'code',
          placeholder: 'const tasks = [];\n\nfunction addTask(text) {\n  â€¦\n}',
        },
        {
          id: 's2',
          title: 'Render en el DOM',
          instructions: 'Escribe `renderTasks(listEl)` que vacÃ­e el contenedor y cree un <li> por tarea con el texto y un checkbox segÃºn `done`.',
          workspaceType: 'code',
          placeholder: 'function renderTasks(listEl) {\n  â€¦\n}',
        },
        {
          id: 's3',
          title: 'Toggle y filtro',
          instructions: 'Implementa `toggleTask(id)` y `getVisible(filter)` donde filter es "all" | "open" | "done". Resume en prosa cÃ³mo conectarÃ­as esto a botones del UI.',
          workspaceType: 'code',
          placeholder: 'function toggleTask(id) { â€¦ }\nfunction getVisible(filter) { â€¦ }\n\n// ConexiÃ³n UI:',
        },
      ],
    },
    {
      id: 'gp-python-csv',
      quizId: 'python',
      courseId: 'python',
      difficulty: 'intermediate',
      estimatedMinutes: 45,
      icon: 'src/img/courses/logos/python.png',
      title: 'Script de limpieza CSV',
      summary: 'DiseÃ±a un script Python que lea filas, limpie nulos y exporte un resumen.',
      steps: [
        {
          id: 's1',
          title: 'Leer filas',
          instructions: 'Esboza una funciÃ³n `load_rows(path)` usando csv.DictReader (o pseudocÃ³digo claro). Indica quÃ© excepciones capturarÃ­as.',
          workspaceType: 'code',
          placeholder: 'import csv\n\ndef load_rows(path):\n    â€¦',
        },
        {
          id: 's2',
          title: 'Limpiar datos',
          instructions: 'Escribe `clean(rows)` que quite filas sin "email", normalice espacios en "name" y convierta "age" a int cuando sea posible.',
          workspaceType: 'code',
          placeholder: 'def clean(rows):\n    â€¦',
        },
        {
          id: 's3',
          title: 'Resumen',
          instructions: 'Implementa `summarize(rows)` que devuelva un dict con total, promedio de age y cantidad sin age. Explica el resultado esperado con un ejemplo breve.',
          workspaceType: 'code',
          placeholder: 'def summarize(rows):\n    â€¦\n\n# Ejemplo:',
        },
      ],
    },
    {
      id: 'gp-sql-report',
      quizId: 'sql',
      courseId: 'sql',
      difficulty: 'intermediate',
      estimatedMinutes: 40,
      icon: 'src/img/courses/logos/sql.png',
      title: 'Reporte de ventas con SQL',
      summary: 'Redacta consultas para un reporte: filtros, agregaciones y un JOIN.',
      steps: [
        {
          id: 's1',
          title: 'Filtro bÃ¡sico',
          instructions: 'Tabla orders(id, customer_id, total, created_at). Escribe un SELECT de pedidos de 2025 con total > 100, ordenados por total DESC.',
          workspaceType: 'code',
          placeholder: 'SELECT â€¦\nFROM orders\nWHERE â€¦\nORDER BY â€¦;',
        },
        {
          id: 's2',
          title: 'AgregaciÃ³n',
          instructions: 'Consulta el total vendido y el nÃºmero de pedidos por customer_id, solo clientes con 2+ pedidos.',
          workspaceType: 'code',
          placeholder: 'SELECT customer_id, â€¦\nFROM orders\nGROUP BY â€¦\nHAVING â€¦;',
        },
        {
          id: 's3',
          title: 'JOIN',
          instructions: 'customers(id, name). Lista nombre del cliente y suma de totales con LEFT JOIN, incluyendo clientes sin pedidos (suma 0 o NULL). Comenta la diferencia vs INNER JOIN.',
          workspaceType: 'code',
          placeholder: 'SELECT c.name, â€¦\nFROM customers c\nLEFT JOIN orders o ON â€¦\nGROUP BY â€¦;\n\n-- Nota INNER vs LEFT:',
        },
      ],
    },
    {
      id: 'gp-git-flow',
      quizId: 'github',
      courseId: 'github',
      difficulty: 'advanced',
      estimatedMinutes: 55,
      icon: 'src/img/courses/logos/github.png',
      title: 'Flujo Git de un feature',
      summary: 'Planifica un flujo real: rama, commits atÃ³micos, PR y resoluciÃ³n de conflictos.',
      steps: [
        {
          id: 's1',
          title: 'Rama y commits',
          instructions: 'Describe los comandos para crear `feature/login` desde main actualizado, hacer 2 commits atÃ³micos y empujar la rama. Lista los mensajes de commit que usarÃ­as.',
          workspaceType: 'text',
          placeholder: 'git checkout main\ngit pull\nâ€¦',
        },
        {
          id: 's2',
          title: 'Pull request',
          instructions: 'Redacta la descripciÃ³n de un PR (contexto, cambios, cÃ³mo probar). Incluye checklist de review.',
          workspaceType: 'text',
          placeholder: '## Contexto\nâ€¦\n## CÃ³mo probar\n- [ ] â€¦',
        },
        {
          id: 's3',
          title: 'Conflicto',
          instructions: 'main avanzÃ³ y hay conflicto en `auth.js`. Escribe los pasos (comandos + criterio) para integrar main en tu rama y resolver el conflicto sin perder el feature.',
          workspaceType: 'text',
          placeholder: '1. git fetch\n2. â€¦\nCriterio de resoluciÃ³n: â€¦',
        },
      ],
    },
  ];

  function getAll() {
    return PROJECTS.map(p => ({ ...p, steps: p.steps.map(s => ({ ...s })) }));
  }

  function getById(id) {
    const p = PROJECTS.find(item => item.id === id);
    return p ? { ...p, steps: p.steps.map(s => ({ ...s })) } : null;
  }

  return { getAll, getById, UNLOCK_PCT: 80 };

})();

if (typeof module !== 'undefined') module.exports = GuidedProjectsData;
