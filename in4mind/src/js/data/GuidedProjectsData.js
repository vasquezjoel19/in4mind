/**
 * IN4MIND — Catálogo de proyectos guiados.
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
      icon: 'src/img/courses/html.svg',
      title: 'Landing page semántica',
      summary: 'Construye la estructura HTML de una landing page profesional, sección a sección.',
      steps: [
        {
          id: 's1',
          title: 'Documento base',
          instructions: 'Crea el esqueleto HTML5: doctype, html lang, head con charset/viewport/title y un body vacío.\n\nObjetivo: un documento válido listo para contenido.',
          workspaceType: 'code',
          placeholder: '<!DOCTYPE html>\n<html lang="es">\n<head>\n  …\n</head>\n<body>\n</body>\n</html>',
          hint: 'Incluye <meta charset="UTF-8"> y un <title> descriptivo.',
          rubric: [
            { id: 'completeness', label: 'Completitud', weight: 0.4 },
            { id: 'semantics', label: 'Semántica HTML', weight: 0.35 },
            { id: 'best_practices', label: 'Buenas prácticas', weight: 0.25 },
          ],
        },
        {
          id: 's2',
          title: 'Cabecera y navegación',
          instructions: 'Añade un <header> con el nombre del producto y un <nav> con tres enlaces internos (#inicio, #features, #contacto).',
          workspaceType: 'code',
          placeholder: '<header>\n  <h1>…</h1>\n  <nav>…</nav>\n</header>',
          hint: 'Usa <a href="#..."> para anclas internas.',
        },
        {
          id: 's3',
          title: 'Hero y características',
          instructions: 'Crea un <main> con:\n1) sección hero (h2 + párrafo + botón/enlace CTA)\n2) sección de 3 <article> con h3 y texto corto.',
          workspaceType: 'code',
          placeholder: '<main>\n  <section id="inicio">…</section>\n  <section id="features">…</section>\n</main>',
        },
        {
          id: 's4',
          title: 'Formulario de contacto',
          instructions: 'En #contacto, añade un <form> con label+input para nombre y email, un textarea de mensaje y un botón submit. Explica en 2–3 líneas qué hace cada campo.',
          workspaceType: 'code',
          placeholder: '<section id="contacto">\n  <form>…</form>\n</section>\n\n<!-- Notas: -->',
        },
      ],
    },
    {
      id: 'gp-css-card',
      quizId: 'css',
      courseId: 'css',
      difficulty: 'beginner',
      estimatedMinutes: 40,
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732190.png',
      title: 'Card responsive con Flexbox',
      summary: 'Diseña una tarjeta de producto adaptable usando variables CSS y Flexbox.',
      steps: [
        {
          id: 's1',
          title: 'Tokens y reset ligero',
          instructions: 'Define en :root colores (--brand, --text, --surface) y un box-sizing border-box global. Describe por qué usas tokens.',
          workspaceType: 'code',
          placeholder: ':root {\n  --brand: …;\n}\n\n*, *::before, *::after { box-sizing: border-box; }',
        },
        {
          id: 's2',
          title: 'Estructura de la card',
          instructions: 'Escribe el CSS de .card (padding, radio, sombra suave, fondo --surface) y .card__title / .card__price.',
          workspaceType: 'code',
          placeholder: '.card {\n  …\n}',
        },
        {
          id: 's3',
          title: 'Layout Flexbox',
          instructions: 'Haz que .card__footer use display:flex; justify-content:space-between; align-items:center. Añade un media query que apile en columna bajo 480px.',
          workspaceType: 'code',
          placeholder: '.card__footer { display: flex; … }\n\n@media (max-width: 480px) {\n  …\n}',
        },
      ],
    },
    {
      id: 'gp-js-todo',
      quizId: 'javascript',
      courseId: 'javascript',
      difficulty: 'intermediate',
      estimatedMinutes: 50,
      icon: 'src/img/courses/javascript.svg',
      title: 'Mini lista de tareas',
      summary: 'Implementa la lógica de una to-do list: añadir, marcar hecha y filtrar.',
      steps: [
        {
          id: 's1',
          title: 'Modelo de datos',
          instructions: 'Define un array `tasks` y una función `addTask(text)` que empuje `{ id, text, done:false }`. Explica cómo generarías el id.',
          workspaceType: 'code',
          placeholder: 'const tasks = [];\n\nfunction addTask(text) {\n  …\n}',
        },
        {
          id: 's2',
          title: 'Render en el DOM',
          instructions: 'Escribe `renderTasks(listEl)` que vacíe el contenedor y cree un <li> por tarea con el texto y un checkbox según `done`.',
          workspaceType: 'code',
          placeholder: 'function renderTasks(listEl) {\n  …\n}',
        },
        {
          id: 's3',
          title: 'Toggle y filtro',
          instructions: 'Implementa `toggleTask(id)` y `getVisible(filter)` donde filter es "all" | "open" | "done". Resume en prosa cómo conectarías esto a botones del UI.',
          workspaceType: 'code',
          placeholder: 'function toggleTask(id) { … }\nfunction getVisible(filter) { … }\n\n// Conexión UI:',
        },
      ],
    },
    {
      id: 'gp-python-csv',
      quizId: 'python',
      courseId: 'python',
      difficulty: 'intermediate',
      estimatedMinutes: 45,
      icon: 'src/img/courses/python.svg',
      title: 'Script de limpieza CSV',
      summary: 'Diseña un script Python que lea filas, limpie nulos y exporte un resumen.',
      steps: [
        {
          id: 's1',
          title: 'Leer filas',
          instructions: 'Esboza una función `load_rows(path)` usando csv.DictReader (o pseudocódigo claro). Indica qué excepciones capturarías.',
          workspaceType: 'code',
          placeholder: 'import csv\n\ndef load_rows(path):\n    …',
        },
        {
          id: 's2',
          title: 'Limpiar datos',
          instructions: 'Escribe `clean(rows)` que quite filas sin "email", normalice espacios en "name" y convierta "age" a int cuando sea posible.',
          workspaceType: 'code',
          placeholder: 'def clean(rows):\n    …',
        },
        {
          id: 's3',
          title: 'Resumen',
          instructions: 'Implementa `summarize(rows)` que devuelva un dict con total, promedio de age y cantidad sin age. Explica el resultado esperado con un ejemplo breve.',
          workspaceType: 'code',
          placeholder: 'def summarize(rows):\n    …\n\n# Ejemplo:',
        },
      ],
    },
    {
      id: 'gp-sql-report',
      quizId: 'sql',
      courseId: 'sql',
      difficulty: 'intermediate',
      estimatedMinutes: 40,
      icon: 'src/img/courses/sql.svg',
      title: 'Reporte de ventas con SQL',
      summary: 'Redacta consultas para un reporte: filtros, agregaciones y un JOIN.',
      steps: [
        {
          id: 's1',
          title: 'Filtro básico',
          instructions: 'Tabla orders(id, customer_id, total, created_at). Escribe un SELECT de pedidos de 2025 con total > 100, ordenados por total DESC.',
          workspaceType: 'code',
          placeholder: 'SELECT …\nFROM orders\nWHERE …\nORDER BY …;',
        },
        {
          id: 's2',
          title: 'Agregación',
          instructions: 'Consulta el total vendido y el número de pedidos por customer_id, solo clientes con 2+ pedidos.',
          workspaceType: 'code',
          placeholder: 'SELECT customer_id, …\nFROM orders\nGROUP BY …\nHAVING …;',
        },
        {
          id: 's3',
          title: 'JOIN',
          instructions: 'customers(id, name). Lista nombre del cliente y suma de totales con LEFT JOIN, incluyendo clientes sin pedidos (suma 0 o NULL). Comenta la diferencia vs INNER JOIN.',
          workspaceType: 'code',
          placeholder: 'SELECT c.name, …\nFROM customers c\nLEFT JOIN orders o ON …\nGROUP BY …;\n\n-- Nota INNER vs LEFT:',
        },
      ],
    },
    {
      id: 'gp-git-flow',
      quizId: 'github',
      courseId: 'github',
      difficulty: 'advanced',
      estimatedMinutes: 55,
      icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      title: 'Flujo Git de un feature',
      summary: 'Planifica un flujo real: rama, commits atómicos, PR y resolución de conflictos.',
      steps: [
        {
          id: 's1',
          title: 'Rama y commits',
          instructions: 'Describe los comandos para crear `feature/login` desde main actualizado, hacer 2 commits atómicos y empujar la rama. Lista los mensajes de commit que usarías.',
          workspaceType: 'text',
          placeholder: 'git checkout main\ngit pull\n…',
        },
        {
          id: 's2',
          title: 'Pull request',
          instructions: 'Redacta la descripción de un PR (contexto, cambios, cómo probar). Incluye checklist de review.',
          workspaceType: 'text',
          placeholder: '## Contexto\n…\n## Cómo probar\n- [ ] …',
        },
        {
          id: 's3',
          title: 'Conflicto',
          instructions: 'main avanzó y hay conflicto en `auth.js`. Escribe los pasos (comandos + criterio) para integrar main en tu rama y resolver el conflicto sin perder el feature.',
          workspaceType: 'text',
          placeholder: '1. git fetch\n2. …\nCriterio de resolución: …',
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
