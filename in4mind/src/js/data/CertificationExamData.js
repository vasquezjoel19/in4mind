/**
 * IN4MIND — Exámenes prácticos de certificación por curso.
 * id: {courseId}-cert-exam — requiere lecciones completadas con promedio ≥80%.
 */

'use strict';

const CertificationExamData = (() => {

  const CERT_EXAM_MIN = 25;
  const CERT_EXAM_MAX = 30;

  const EXAM_QUESTIONS = {
    canvas: [
      { type: 'match', q: 'En un brief de redes sociales, relaciona cada recurso de Canva con su uso:',
        pairs: [
          { left: 'Plantilla 1080×1080', right: 'Post cuadrado para Instagram' },
          { left: 'Brand Kit', right: 'Colores y fuentes oficiales de marca' },
          { left: 'Magic Resize', right: 'Adaptar diseño a otros formatos' },
          { left: 'PDF para impresión', right: 'Exportar flyer en alta calidad' },
        ],
        exp: 'Combinar plantillas, marca y exportación acelera entregables profesionales.' },
      { type: 'choice', q: 'Debes entregar un carrusel coherente con la identidad visual. ¿Qué haces primero?',
        opts: ['Elegir fuentes aleatorias', 'Aplicar Brand Kit y plantilla base', 'Exportar sin revisar márgenes', 'Usar solo elementos gratuitos sin guía'],
        ans: 1, exp: 'Brand Kit + plantilla garantiza consistencia antes de personalizar.' },
      { type: 'truefalse', q: 'Para impresión profesional conviene exportar en PDF con sangrado si la imprenta lo solicita.',
        ans: true, exp: 'PDF mantiene calidad y permite sangrados para corte en imprenta.' },
      { type: 'choice', q: 'Un compañero edita el mismo diseño en tiempo real. ¿Qué función de Canva lo permite?',
        opts: ['Solo descarga local', 'Colaboración en la nube con enlace', 'Exportar a Word', 'Modo offline sin sync'],
        ans: 1, exp: 'Canva permite colaboración simultánea vía enlace compartido.' },
      { type: 'match', q: 'Relaciona formato de exportación con caso de uso:',
        pairs: [
          { left: 'PNG transparente', right: 'Logo sobre fondo variable' },
          { left: 'MP4', right: 'Animación corta para stories' },
          { left: 'PDF', right: 'Material impreso' },
          { left: 'JPG', right: 'Imagen ligera para web' },
        ],
        exp: 'Elegir el formato correcto evita retrabajo y pérdida de calidad.' },
      { type: 'choice', q: 'El cliente pide cambiar tipografía en 12 piezas. ¿Cuál flujo es más eficiente?',
        opts: ['Editar una por una sin sistema', 'Actualizar estilos en Brand Kit / estilos de marca', 'Recrear desde cero cada pieza', 'Rasterizar todo a imagen'],
        ans: 1, exp: 'Centralizar tipografías en Brand Kit reduce cambios manuales repetitivos.' },
    ],
    figma: [
      { type: 'match', q: 'En handoff UI, relaciona concepto con acción en Figma:',
        pairs: [
          { left: 'Auto Layout', right: 'Botones que crecen con el texto' },
          { left: 'Component + Variant', right: 'Estados hover/disabled reutilizables' },
          { left: 'Prototype link', right: 'Simular navegación entre pantallas' },
          { left: 'Dev Mode', right: 'Inspeccionar medidas y tokens' },
        ],
        exp: 'Estos bloques conectan diseño colaborativo con implementación.' },
      { type: 'choice', q: 'Debes diseñar 20 pantallas móviles con la misma barra inferior. ¿Qué usas?',
        opts: ['Copiar capas sueltas', 'Componente maestro con instancias', 'Rasterizar la barra', 'Exportar solo PNG'],
        ans: 1, exp: 'Componentes con instancias permiten cambios centralizados.' },
      { type: 'truefalse', q: 'Constraints permiten que elementos se adapten al redimensionar frames.',
        ans: true, exp: 'Constraints definen anclaje y comportamiento responsive dentro del frame.' },
      { type: 'choice', q: 'Un botón debe alinear icono y texto con espaciado uniforme al cambiar copy. ¿Qué aplicas?',
        opts: ['Posicionamiento manual pixel a pixel', 'Auto Layout con padding y gap', 'Outline stroke', 'Flatten layers'],
        ans: 1, exp: 'Auto Layout distribuye hijos automáticamente al cambiar contenido.' },
      { type: 'match', q: 'Relaciona rol con herramienta Figma:',
        pairs: [
          { left: 'Design system', right: 'Biblioteca de componentes compartida' },
          { left: 'Stakeholder review', right: 'Comentarios en archivo' },
          { left: 'Responsive grid', right: 'Layout Grid en frame' },
          { left: 'Interactive demo', right: 'Prototype con hotspots' },
        ],
        exp: 'Figma cubre diseño, revisión y prototipado en un solo flujo.' },
      { type: 'choice', q: 'Desarrollo pide tokens de color. ¿Dónde los documentas mejor?',
        opts: ['Notas sueltas en Slack', 'Variables / estilos locales y documentación en Dev Mode', 'Capturas PNG', 'PDF estático sin specs'],
        ans: 1, exp: 'Variables y Dev Mode entregan specs actualizables al equipo técnico.' },
    ],
    python: [
      { type: 'choice', q: '¿Qué imprime: print([x * 2 for x in range(3)])?',
        opts: ['[0, 2, 4]', '[2, 4, 6]', '[1, 2, 3]', 'Error de sintaxis'],
        ans: 0, exp: 'range(3) → 0,1,2; duplicados → [0,2,4].' },
      { type: 'match', q: 'Relaciona estructura con uso típico:',
        pairs: [
          { left: 'list', right: 'Colección ordenada mutable' },
          { left: 'dict', right: 'Clave → valor para registros' },
          { left: 'set', right: 'Elementos únicos sin orden' },
          { left: 'tuple', right: 'Secuencia inmutable' },
        ],
        exp: 'Elegir la estructura correcta simplifica lógica y rendimiento.' },
      { type: 'truefalse', q: 'La indentación en Python forma parte de la sintaxis del bloque.',
        ans: true, exp: 'Python usa indentación para delimitar bloques de código.' },
      { type: 'choice', q: 'Lees un CSV y procesas filas. ¿Qué módulo es más adecuado?',
        opts: ['csv', 'tkinter', 'socket', 'random'],
        ans: 0, exp: 'El módulo csv está pensado para archivos separados por delimitadores.' },
      { type: 'choice', q: '¿Cuál maneja excepciones correctamente?',
        opts: ['try/except alrededor de código riesgoso', 'Ignorar errores silenciosamente', 'print en cada línea', 'Reiniciar el intérprete'],
        ans: 0, exp: 'try/except captura errores esperables sin detener todo el programa.' },
      { type: 'match', q: 'Relaciona función built-in con propósito:',
        pairs: [
          { left: 'len()', right: 'Contar elementos' },
          { left: 'open()', right: 'Acceder a archivos' },
          { left: 'enumerate()', right: 'Índice + valor en bucles' },
          { left: 'sorted()', right: 'Ordenar iterable' },
        ],
        exp: 'Built-ins comunes resuelven tareas frecuentes con pocas líneas.' },
    ],
    javascript: [
      { type: 'choice', q: '¿Qué devuelve typeof null en JavaScript?',
        opts: ['"null"', '"object"', '"undefined"', '"number"'],
        ans: 1, exp: 'Históricamente typeof null es "object" (quirks del lenguaje).' },
      { type: 'match', q: 'Relaciona concepto JS con definición:',
        pairs: [
          { left: 'const', right: 'Binding no reasignable' },
          { left: 'arrow function', right: 'Función concisa con lexic this' },
          { left: 'Promise', right: 'Valor async futuro' },
          { left: 'DOM', right: 'Árbol de nodos HTML' },
        ],
        exp: 'Estos bloques son base del JS moderno en frontend.' },
      { type: 'truefalse', q: 'addEventListener permite registrar múltiples handlers para el mismo evento.',
        ans: true, exp: 'A diferencia de onclick, puedes añadir varios listeners.' },
      { type: 'choice', q: 'Fetch devuelve datos de una API. ¿Qué patrón es correcto?',
        opts: ['fetch(url).then(r => r.json()).then(data => ...)', 'fetch(url).json inmediato sin then', 'XMLHttpRequest obligatorio', 'Solo WebSockets'],
        ans: 0, exp: 'fetch retorna Promise; hay que parsear json en cadena then/async.' },
      { type: 'choice', q: 'Evitas mutar estado directamente. ¿Qué haces?',
        opts: ['Copiar/spread y crear nuevo objeto', 'Mutar el mismo objeto global', 'Borrar el DOM', 'Usar var en bucle'],
        ans: 0, exp: 'Inmutabilidad facilita detectar cambios y depurar UI.' },
      { type: 'match', q: 'Relaciona sintaxis con efecto:',
        pairs: [
          { left: '===', right: 'Igualdad estricta sin coerción' },
          { left: '?.', right: 'Optional chaining seguro' },
          { left: '...arr', right: 'Spread para copiar/combinar' },
          { left: 'async/await', right: 'Sintaxis legible para Promises' },
        ],
        exp: 'Sintaxis ES6+ mejora seguridad y claridad del código.' },
    ],
    html: [
      { type: 'choice', q: '¿Qué etiqueta es más semántica para navegación principal?',
        opts: ['<div class="nav">', '<nav>', '<span>', '<b>'],
        ans: 1, exp: '<nav> comunica propósito a lectores de pantalla y SEO.' },
      { type: 'match', q: 'Relaciona etiqueta con uso correcto:',
        pairs: [
          { left: '<main>', right: 'Contenido principal único' },
          { left: '<article>', right: 'Entrada autocontenida' },
          { left: '<label for>', right: 'Asociar texto a input' },
          { left: '<img alt>', right: 'Texto alternativo accesible' },
        ],
        exp: 'HTML semántico mejora accesibilidad y mantenibilidad.' },
      { type: 'truefalse', q: 'Un documento HTML5 válido debe incluir <!DOCTYPE html>.',
        ans: true, exp: 'DOCTYPE activa modo estándar en navegadores modernos.' },
      { type: 'choice', q: 'Formulario envía email y contraseña. ¿Qué atributo ayuda en móvil?',
        opts: ['type="email" y type="password"', 'type="text" para todo', 'readonly en submit', 'iframe oculto'],
        ans: 0, exp: 'Tipos nativos activan teclados y validación básica del navegador.' },
      { type: 'choice', q: 'Jerarquía de encabezados correcta en artículo:',
        opts: ['h1 título, h2 secciones, h3 subsecciones', 'Solo h4 para todo', 'Saltar de h1 a h4', 'Usar negrita sin headings'],
        ans: 0, exp: 'Jerarquía lógica ayuda a tecnologías asistivas a navegar contenido.' },
      { type: 'match', q: 'Relaciona meta/atributo con beneficio:',
        pairs: [
          { left: 'lang="es"', right: 'Pronunciación correcta' },
          { left: 'viewport meta', right: 'Layout responsive móvil' },
          { left: 'defer en script', right: 'Ejecutar tras parsear HTML' },
          { left: 'loading="lazy"', right: 'Diferir carga de imágenes' },
        ],
        exp: 'Metadatos y atributos optimizan UX y rendimiento.' },
    ],
    css: [
      { type: 'choice', q: 'Centrar un bloque horizontalmente con ancho fijo. ¿Qué regla clásica?',
        opts: ['margin: 0 auto; con width definido', 'float: center', 'align: middle', 'position: static only'],
        ans: 0, exp: 'margin auto en bloques con width los centra en el contenedor.' },
      { type: 'match', q: 'Relaciona layout con herramienta CSS:',
        pairs: [
          { left: 'Flexbox', right: 'Eje principal y alineación 1D' },
          { left: 'Grid', right: 'Filas y columnas 2D' },
          { left: 'media query', right: 'Estilos por breakpoint' },
          { left: 'var(--token)', right: 'Variable reutilizable' },
        ],
        exp: 'Flex + Grid + tokens cubren la mayoría de layouts modernos.' },
      { type: 'truefalse', q: 'box-sizing: border-box incluye padding y border en el width declarado.',
        ans: true, exp: 'border-box simplifica cálculos de tamaño en componentes.' },
      { type: 'choice', q: 'Grid con sidebar fijo y contenido fluido. ¿Qué enfoque?',
        opts: ['grid-template-columns: 240px 1fr', 'display: inline solamente', 'font-size en px únicamente', 'tablas HTML para layout'],
        ans: 0, exp: 'Grid define columnas fijas + fracción flexible eficientemente.' },
      { type: 'choice', q: 'Hover accesible en móvil. ¿Qué consideras?',
        opts: ['No depender solo de :hover; estados focus/active visibles', 'Ocultar focus outline', 'Solo color sin contraste', 'pointer-events: none global'],
        ans: 0, exp: 'Touch no tiene hover; focus visible es obligatorio para accesibilidad.' },
      { type: 'match', q: 'Relaciona selector con especificidad típica:',
        pairs: [
          { left: '#id', right: 'Alta especificidad' },
          { left: '.class', right: 'Reutilizable en componentes' },
          { left: 'elemento', right: 'Base tipográfica global' },
          { left: ':root', right: 'Variables globales' },
        ],
        exp: 'Balance entre especificidad y reutilización evita !important.' },
    ],
    github: [
      { type: 'choice', q: 'Primer paso para compartir proyecto local en GitHub:',
        opts: ['git init, commit, remote add, push', 'Subir ZIP por email', 'Editar main en producción sin commit', 'Borrar .git'],
        ans: 0, exp: 'Flujo estándar: repo local → commits → remoto → push.' },
      { type: 'match', q: 'Relaciona comando Git con función:',
        pairs: [
          { left: 'git status', right: 'Ver cambios en working tree' },
          { left: 'git pull', right: 'Traer y fusionar remoto' },
          { left: 'git branch', right: 'Gestionar ramas' },
          { left: 'git merge', right: 'Integrar historial de ramas' },
        ],
        exp: 'Dominar estos comandos cubre colaboración diaria.' },
      { type: 'truefalse', q: 'Un Pull Request permite revisión antes de fusionar cambios.',
        ans: true, exp: 'PRs documentan cambios y habilitan code review.' },
      { type: 'choice', q: 'Conflicto de merge en README. ¿Qué haces?',
        opts: ['Resolver marcadores en local, commit y push', 'Ignorar y force push', 'Clonar de nuevo sin resolver', 'Eliminar rama main'],
        ans: 0, exp: 'Los conflictos se resuelven editando archivos y completando el merge.' },
      { type: 'choice', q: 'Archivo .gitignore sirve para:',
        opts: ['Excluir node_modules, .env, builds del repo', 'Acelerar CPU', 'Cifrar contraseñas automáticamente', 'Publicar secretos'],
        ans: 0, exp: 'gitignore evita versionar artefactos y datos sensibles.' },
      { type: 'match', q: 'Relaciona concepto GitHub con uso:',
        pairs: [
          { left: 'Issue', right: 'Rastrear bug o tarea' },
          { left: 'Fork', right: 'Copia personal para contribuir' },
          { left: 'Actions', right: 'CI/CD automatizado' },
          { left: 'Release', right: 'Empaquetar versión estable' },
        ],
        exp: 'GitHub extiende Git con colaboración y automatización.' },
    ],
    excel: [
      { type: 'choice', q: 'Suma ventas en B2:B100 si región en C es "Norte". ¿Qué fórmula?',
        opts: ['=SUMIF(C2:C100,"Norte",B2:B100)', '=SUM(B2:B100)', '=AVERAGE(C2:C100)', '=CONCAT(B2:B100)'],
        ans: 0, exp: 'SUMIF condiciona el rango de suma según criterio.' },
      { type: 'match', q: 'Relaciona herramienta Excel con caso:',
        pairs: [
          { left: 'Tabla dinámica', right: 'Resumir ventas por categoría' },
          { left: 'XLOOKUP/VLOOKUP', right: 'Buscar precio por SKU' },
          { left: 'Formato condicional', right: 'Resaltar valores bajo umbral' },
          { left: 'Validación datos', right: 'Limitar entradas en celda' },
        ],
        exp: 'Estas funciones resuelven análisis empresarial frecuente.' },
      { type: 'truefalse', q: 'Referencia $B$2 es absoluta: no cambia al copiar la fórmula.',
        ans: true, exp: 'El símbolo $ fija fila/columna en referencias.' },
      { type: 'choice', q: 'Gráfico debe actualizarse al añadir filas en tabla. ¿Qué conviene?',
        opts: ['Convertir rango en Tabla de Excel (Ctrl+T)', 'Copiar valores estáticos', 'Insertar imagen del gráfico', 'Ocultar filas nuevas'],
        ans: 0, exp: 'Las Tablas expanden referencias automáticamente.' },
      { type: 'choice', q: 'Detectar duplicados en columna ID cliente:',
        opts: ['Formato condicional → duplicados o COUNTIF', 'Fusionar celdas', 'Texto a columnas', 'Quitar filtros'],
        ans: 0, exp: 'Formato condicional/COUNTIF identifican IDs repetidos rápidamente.' },
      { type: 'match', q: 'Relaciona función con resultado:',
        pairs: [
          { left: 'IF', right: 'Lógica condicional' },
          { left: 'TEXT', right: 'Formatear fecha como texto' },
          { left: 'UNIQUE', right: 'Lista sin repetidos' },
          { left: 'SUBTOTAL', right: 'Agregado respetando filtros' },
        ],
        exp: 'Funciones combinan limpieza, análisis y presentación.' },
    ],
    powerpoint: [
      { type: 'choice', q: 'Presentación corporativa coherente. ¿Qué configuras primero?',
        opts: ['Diapositiva maestra / tema', 'Animaciones aleatorias', 'Fuentes distintas por slide', 'Exportar PDF antes de diseñar'],
        ans: 0, exp: 'La diapositiva maestra unifica layout, colores y tipografías.' },
      { type: 'match', q: 'Relaciona recurso PPT con uso:',
        pairs: [
          { left: 'Layout Title and Content', right: 'Título + cuerpo estándar' },
          { left: 'SmartArt', right: 'Procesos y jerarquías visuales' },
          { left: 'Notas del presentador', right: 'Guion no visible al público' },
          { left: 'Modo presentador', right: 'Vista con timer y notas' },
        ],
        exp: 'Maestras y vistas de presentador mejoran calidad al exponer.' },
      { type: 'truefalse', q: 'Demasiadas transiciones distintas por slide distraen al público.',
        ans: true, exp: 'Consistencia visual mantiene foco en el mensaje.' },
      { type: 'choice', q: 'Gráfico debe reflejar datos Excel vinculados. ¿Qué haces?',
        opts: ['Insertar gráfico vinculado y actualizar datos', 'Captura PNG estática sin enlace', 'Escanear gráfico impreso', 'Redibujar a mano'],
        ans: 0, exp: 'Vincular datos mantiene gráficos actualizados automáticamente.' },
      { type: 'choice', q: 'Accesibilidad: imágenes informativas requieren:',
        opts: ['Alt text descriptivo', 'Sin alt en ninguna', 'Solo título de slide', 'Ocultar imágenes'],
        ans: 0, exp: 'Texto alternativo permite comprender contenido visual.' },
      { type: 'match', q: 'Relaciona flujo con acción:',
        pairs: [
          { left: 'F5', right: 'Iniciar presentación' },
          { left: 'Duplicar slide', right: 'Reutilizar layout existente' },
          { left: 'Alinear objetos', right: 'Distribución uniforme' },
          { left: 'Exportar PDF', right: 'Compartir versión fija' },
        ],
        exp: 'Atajos y alineación aceleran producción de decks.' },
    ],
    sql: [
      { type: 'choice', q: 'Listar clientes únicos de pedidos. ¿Qué cláusula?',
        opts: ['SELECT DISTINCT cliente_id FROM pedidos', 'DELETE cliente_id', 'DROP TABLE pedidos', 'INSERT INTO pedidos'],
        ans: 0, exp: 'DISTINCT elimina duplicados en el resultado.' },
      { type: 'match', q: 'Relaciona cláusula SQL con función:',
        pairs: [
          { left: 'JOIN', right: 'Combinar filas de tablas relacionadas' },
          { left: 'GROUP BY', right: 'Agregados por categoría' },
          { left: 'HAVING', right: 'Filtrar grupos agregados' },
          { left: 'ORDER BY', right: 'Ordenar resultados' },
        ],
        exp: 'Consultas analíticas combinan JOIN + GROUP BY + HAVING.' },
      { type: 'truefalse', q: 'Una clave primaria identifica de forma única cada fila.',
        ans: true, exp: 'PRIMARY KEY garantiza unicidad e integridad referencial.' },
      { type: 'choice', q: 'Evitar inyección SQL en app web. ¿Qué práctica?',
        opts: ['Consultas parametrizadas / prepared statements', 'Concatenar input del usuario en SQL crudo', 'Dar permisos admin al usuario final', 'Publicar credenciales en repo'],
        ans: 0, exp: 'Parámetros separan datos de la instrucción SQL.' },
      { type: 'choice', q: 'Ventas totales por mes en 2024:',
        opts: ['SELECT MONTH(fecha), SUM(total) ... GROUP BY MONTH(fecha)', 'SELECT * FROM ventas', 'UPDATE ventas SET total=0', 'TRUNCATE ventas'],
        ans: 0, exp: 'GROUP BY con función de fecha agrega por periodo.' },
      { type: 'match', q: 'Relaciona concepto SQL con resultado:',
        pairs: [
          { left: 'INNER JOIN', right: 'Solo coincidencias en ambas tablas' },
          { left: 'LEFT JOIN', right: 'Todas las filas izquierda + match derecha' },
          { left: 'INDEX', right: 'Acelerar búsquedas frecuentes' },
          { left: 'FOREIGN KEY', right: 'Integridad referencial' },
        ],
        exp: 'Elegir JOIN correcto evita filas perdidas o duplicadas.' },
    ],
    cybersecurity: [
      { type: 'choice', q: 'Correo urgente pide credenciales bancarias con enlace desconocido. ¿Acción?',
        opts: ['No hacer clic; reportar como phishing', 'Introducir datos para verificar', 'Reenviar a todos', 'Responder con tu contraseña'],
        ans: 0, exp: 'Phishing usa urgencia falsa; verifica por canal oficial.' },
      { type: 'match', q: 'Relaciona control con propósito:',
        pairs: [
          { left: 'MFA', right: 'Segundo factor además de contraseña' },
          { left: 'Gestor contraseñas', right: 'Secretos únicos y fuertes' },
          { left: 'Cifrado TLS', right: 'Proteger datos en tránsito' },
          { left: 'Parcheo', right: 'Corregir vulnerabilidades conocidas' },
        ],
        exp: 'Defensa en profundidad combina varios controles.' },
      { type: 'truefalse', q: 'Usar la misma contraseña en todos los servicios aumenta el riesgo de credential stuffing.',
        ans: true, exp: 'Una filtración compromete múltiples cuentas si reutilizas claves.' },
      { type: 'choice', q: 'USB desconocido en parking. ¿Qué haces?',
        opts: ['No conectarlo; entregar a seguridad IT', 'Conectarlo en PC corporativa', 'Abrir archivos .exe', 'Formatearlo en tu laptop personal'],
        ans: 0, exp: 'USB drop attacks explotan curiosidad para infectar sistemas.' },
      { type: 'choice', q: 'Wi‑Fi público para revisar email corporativo. Medida mínima:',
        opts: ['VPN corporativa + HTTPS', 'HTTP sin cifrar', 'Compartir hotspot sin clave', 'Desactivar firewall'],
        ans: 0, exp: 'VPN + HTTPS reduce interceptación en redes no confiables.' },
      { type: 'match', q: 'Relaciona amenaza con ejemplo:',
        pairs: [
          { left: 'Malware', right: 'Ransomware cifra archivos' },
          { left: 'Ingeniería social', right: 'Llamada falsa de soporte IT' },
          { left: 'Insider threat', right: 'Empleado exfiltra datos' },
          { left: 'Zero-day', right: 'Exploit sin parche aún' },
        ],
        exp: 'Identificar amenazas guía la respuesta adecuada.' },
    ],
    ...(typeof ExtendedCourses !== 'undefined' ? ExtendedCourses.getExamQuestions() : {}),
  };

  function _hashCourseId(courseId) {
    let h = 0;
    for (let i = 0; i < courseId.length; i += 1) {
      h = (h * 31 + courseId.charCodeAt(i)) % 2147483647;
    }
    return Math.abs(h);
  }

  function _targetQuestionCount(courseId) {
    return CERT_EXAM_MIN + (_hashCourseId(courseId) % (CERT_EXAM_MAX - CERT_EXAM_MIN + 1));
  }

  function _normalizeQuestion(raw) {
    const text = (raw?.q || raw?.text || '').trim();
    if (!text) return null;
    return { ...raw, q: text };
  }

  function _collectQuestionPool(courseId, seen) {
    const pool = [];
    const add = (questions) => {
      (questions || []).forEach((raw) => {
        const q = _normalizeQuestion(raw);
        if (!q) return;
        const key = q.q.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        pool.push(q);
      });
    };

    if (typeof CourseCurriculum !== 'undefined') {
      (CourseCurriculum.getExamSections(courseId) || []).forEach((sec) => add(sec.questions));
      const quizDef = CourseCurriculum.getQuizDef(courseId);
      quizDef?.sections?.forEach((sec) => add(sec.questions));
    }

    add(EXAM_QUESTIONS[courseId]);

    if (typeof CourseFactory !== 'undefined') {
      const title = typeof DataService !== 'undefined'
        ? DataService.getCourses().find((c) => c.id === courseId)?.title
        : null;
      let round = 0;
      while (pool.length < CERT_EXAM_MAX && round < 8) {
        CourseFactory.buildExamQuestions(title || courseId).forEach((q, i) => {
          add([{
            ...q,
            q: round === 0 && i < 6 ? q.q : `${q.q} (evaluación ${round + 1}.${i + 1})`,
          }]);
        });
        round += 1;
      }
    }

    return pool;
  }

  function _padSynthetic(pool, seen, courseId, courseTitle, target) {
    const modules = typeof CourseCurriculum !== 'undefined'
      ? (CourseCurriculum.getCertMeta(courseId)?.modules || [])
      : [];
    const t = courseTitle || courseId;
    let n = 0;
    while (pool.length < target) {
      const mod = modules[n % Math.max(modules.length, 1)] || `Módulo ${(n % 5) + 1}`;
      const kind = n % 3;
      let candidate;
      if (kind === 0) {
        candidate = {
          type: 'choice',
          q: `En ${t}, aplicando «${mod}», ¿qué decisión refleja mejor práctica profesional?`,
          opts: [
            'Improvisar sin validar',
            'Planificar, ejecutar con estándares y revisar resultado',
            'Omitir documentación',
            'Duplicar trabajo innecesario',
          ],
          ans: 1,
          exp: `Dominar ${mod} reduce errores y mejora entregas con ${t}.`,
        };
      } else if (kind === 1) {
        candidate = {
          type: 'truefalse',
          q: `Documentar el trabajo en «${mod}» con ${t} facilita colaboración y mantenimiento.`,
          ans: true,
          exp: 'La trazabilidad es clave en entornos profesionales.',
        };
      } else {
        candidate = {
          type: 'match',
          q: `Relaciona etapa y control al trabajar con ${t} en «${mod}»:`,
          pairs: [
            { left: 'Planificación', right: 'Definir objetivo y alcance' },
            { left: 'Ejecución', right: 'Aplicar pasos del módulo' },
            { left: 'Validación', right: 'Verificar resultado esperado' },
            { left: 'Mejora', right: 'Iterar con feedback' },
          ],
          exp: 'Cada fase aporta calidad al flujo de trabajo.',
        };
      }
      const key = candidate.q.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        pool.push(candidate);
      } else {
        candidate.q = `${candidate.q} [${pool.length + 1}]`;
        seen.add(candidate.q.toLowerCase());
        pool.push(candidate);
      }
      n += 1;
      if (n > 120) break;
    }
    return pool;
  }

  function _splitIntoSections(questions, courseTitle) {
    const titles = [
      `Fundamentos de ${courseTitle}`,
      'Aplicación práctica',
      'Casos intermedios',
      'Escenarios avanzados',
      'Evaluación integrada',
    ];
    const sections = [];
    const perSection = Math.ceil(questions.length / titles.length);
    let idx = 0;
    titles.forEach((title) => {
      if (idx >= questions.length) return;
      const chunk = questions.slice(idx, idx + perSection);
      if (chunk.length) sections.push({ title, questions: chunk });
      idx += perSection;
    });
    if (idx < questions.length && sections.length) {
      sections[sections.length - 1].questions.push(...questions.slice(idx));
    }
    return sections.length ? sections : [{ title: `Examen de ${courseTitle}`, questions }];
  }

  function _normalizeCertSections(courseId, courseTitle, rawSections) {
    const target = _targetQuestionCount(courseId);
    const seen = new Set();
    const pool = [];

    const add = (questions) => {
      (questions || []).forEach((raw) => {
        const q = _normalizeQuestion(raw);
        if (!q) return;
        const key = q.q.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        pool.push(q);
      });
    };

    (rawSections || []).forEach((sec) => add(sec.questions));

    if (pool.length < target) {
      _collectQuestionPool(courseId, seen).forEach((q) => {
        const key = q.q.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          pool.push(q);
        }
      });
    }

    _padSynthetic(pool, seen, courseId, courseTitle, target);

    let final = pool.slice(0, CERT_EXAM_MAX);
    if (final.length > target) final = final.slice(0, target);
    while (final.length < CERT_EXAM_MIN) {
      _padSynthetic(final, seen, courseId, courseTitle, CERT_EXAM_MIN);
      final = final.slice(0, CERT_EXAM_MAX);
    }

    return _splitIntoSections(final, courseTitle);
  }

  function getExamId(courseId) {
    return `${courseId}-cert-exam`;
  }

  function getExam(courseId) {
    const course = typeof DataService !== 'undefined'
      ? DataService.getCourses().find(c => c.id === courseId)
      : null;
    if (!course) return null;

    const rawSections = typeof CourseCurriculum !== 'undefined'
      ? CourseCurriculum.getExamSections(courseId)
      : (EXAM_QUESTIONS[courseId]
        ? [{ title: 'Escenarios prácticos', questions: EXAM_QUESTIONS[courseId] }]
        : []);

    if (!rawSections.length) return null;

    const sections = _normalizeCertSections(courseId, course.title, rawSections);
    const questionCount = sections.reduce((n, sec) => n + (sec.questions?.length || 0), 0);

    const meta = typeof CourseCurriculum !== 'undefined'
      ? CourseCurriculum.getCertMeta(courseId)
      : null;

    return {
      id: getExamId(courseId),
      courseId,
      isCertExam: true,
      title: course.title,
      category: course.category,
      desc: `Examen de certificación · ${questionCount} preguntas (${meta?.lessonCount || 5} módulos del tutorial evaluados).`,
      icon: course.icon,
      sections,
    };
  }

  function getAllExams() {
    if (typeof DataService === 'undefined') return [];
    return DataService.getCourses()
      .map(c => getExam(c.id))
      .filter(Boolean);
  }

  return {
    getExamId,
    getExam,
    getAllExams,
    CERT_EXAM_MIN,
    CERT_EXAM_MAX,
  };

})();

if (typeof module !== 'undefined') module.exports = CertificationExamData;
