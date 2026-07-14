/**
 * IN4MIND — TutorialData
 * Contenido extendido de cursos y lecciones.
 */

'use strict';

const TutorialData = (() => {

  const CATEGORY_LABELS = {
    web:         'Web',
    programming: 'Programación',
    design:      'Diseño',
    office:      'Office',
    data:        'Datos',
    tools:       'Herramientas',
    security:    'Ciberseguridad',
  };

  const LEVEL_COLORS = {
    'Principiante': '#64748b',
    'Intermedio':   '#3b82f6',
    'Avanzado':     '#14b8a6',
    'Básico':       '#64748b',
    'Experto':      '#ef4444',
    'Fundamentos':  '#64748b',
    'Wireframe':    '#64748b',
    'UI Design':    '#3b82f6',
    'SELECT':       '#64748b',
    'Estructura':   '#64748b',
    'Init':         '#64748b',
  };

  const RAW = {
    canvas: {
      rating: '4.7', reviews: 312, quizzes: 2,
      aboutShort: 'Canva es una plataforma de diseño gráfico en línea que permite crear contenido visual profesional sin necesidad de conocimientos técnicos avanzados.',
      aboutExtra: 'Con más de 100 millones de usuarios, Canva ofrece plantillas, elementos gráficos, tipografías y colaboración en tiempo real para marketing, educación y creación de contenido.',
      videos: ['Introducción a Canva', 'Plantillas y elementos', 'Exportar en alta calidad', 'Diseño para redes sociales'],
      topics: ['Interfaz y herramientas', 'Plantillas y branding', 'Tipografía y colores', 'Exportación y formatos', 'Colaboración en equipo'],
      timeline: ['Básico', 'Intermedio', 'Avanzado', 'Experto'],
    },
    figma: {
      rating: '4.9', reviews: 520, quizzes: 3,
      aboutShort: 'Figma es la herramienta líder de diseño UI/UX colaborativo desde el navegador.',
      aboutExtra: 'Usado por Airbnb, Spotify y Microsoft, Figma centraliza diseño de interfaces, prototipos y design systems con componentes reutilizables.',
      videos: ['Fundamentos de Figma', 'Componentes y Auto Layout', 'Prototipado interactivo', 'Design Systems'],
      topics: ['Frames y grillas', 'Componentes y variantes', 'Auto Layout', 'Prototipado', 'Variables y tokens'],
      timeline: ['Wireframe', 'UI Design', 'Prototipo', 'Handoff'],
    },
    python: {
      rating: '4.8', reviews: 389, quizzes: 3,
      aboutShort: 'Python es un lenguaje interpretado de alto nivel, centrado en legibilidad y versatilidad.',
      aboutExtra: 'Usado por Google, Netflix y NASA para web, datos, IA y automatización gracias a su ecosistema de librerías.',
      videos: ['Introducción a Python', 'Estructuras de Datos', 'Funciones y módulos', 'Proyecto práctico'],
      topics: ['Variables y tipos', 'Condicionales y bucles', 'Funciones', 'Listas y diccionarios', 'Manejo de archivos'],
      timeline: ['Básico', 'Intermedio', 'Avanzado', 'Experto'],
    },
    javascript: {
      rating: '4.8', reviews: 445, quizzes: 3,
      aboutShort: 'JavaScript aporta interactividad y lógica a la web; es el lenguaje nativo del navegador.',
      aboutExtra: 'Con Node.js y frameworks como React o Vue, JavaScript es clave para el desarrollo full-stack moderno.',
      videos: ['JS desde cero', 'DOM y eventos', 'Async/Await', 'ES6+ y módulos'],
      topics: ['Variables y scope', 'Funciones y closures', 'DOM', 'Fetch y APIs', 'Módulos ES6'],
      timeline: ['Fundamentos', 'DOM', 'Async', 'Avanzado'],
    },
    html: {
      rating: '4.7', reviews: 298, quizzes: 2,
      aboutShort: 'HTML define la estructura y semántica del contenido en la web.',
      aboutExtra: 'HTML5 añade etiquetas semánticas, multimedia nativa, formularios avanzados y APIs para gráficos.',
      videos: ['Estructura HTML5', 'Etiquetas semánticas', 'Formularios', 'Accesibilidad'],
      topics: ['Documento base', 'Texto y enlaces', 'Imágenes y listas', 'Formularios', 'Semántica HTML5'],
      timeline: ['Estructura', 'Semántica', 'Formularios', 'Avanzado'],
    },
    css: {
      rating: '4.7', reviews: 276, quizzes: 2,
      aboutShort: 'CSS controla colores, tipografía, layout, animaciones y diseño responsivo.',
      aboutExtra: 'Flexbox, Grid, variables CSS y media queries permiten interfaces profesionales y accesibles.',
      videos: ['Fundamentos CSS', 'Flexbox', 'CSS Grid', 'Animaciones'],
      topics: ['Selectores', 'Box model', 'Flexbox', 'CSS Grid', 'Responsive y animaciones'],
      timeline: ['Bases', 'Layout', 'Responsive', 'Animaciones'],
    },
    github: {
      rating: '4.6', reviews: 201, quizzes: 2,
      aboutShort: 'GitHub aloja repositorios Git y facilita colaboración en software.',
      aboutExtra: 'GitHub Actions, Pages y Copilot convierten la plataforma en un ecosistema de desarrollo completo.',
      videos: ['Git desde cero', 'Branches', 'Pull Requests', 'GitHub Actions'],
      topics: ['Repositorios', 'Commits y ramas', 'Merge y conflictos', 'Pull Requests', 'CI/CD básico'],
      timeline: ['Init', 'Branches', 'Colaboración', 'CI/CD'],
    },
    excel: {
      rating: '4.6', reviews: 334, quizzes: 2,
      aboutShort: 'Excel organiza datos, fórmulas, tablas dinámicas y automatización empresarial.',
      aboutExtra: 'Power Query y Power Pivot extienden Excel hacia análisis de negocio profesional.',
      videos: ['Fundamentos', 'Fórmulas clave', 'Tablas dinámicas', 'Macros intro'],
      topics: ['Celdas y rangos', 'Fórmulas SUM/IF', 'BUSCARV/XLOOKUP', 'Tablas dinámicas', 'Gráficos'],
      timeline: ['Básico', 'Fórmulas', 'Análisis', 'Automatización'],
    },
    powerpoint: {
      rating: '4.5', reviews: 187, quizzes: 2,
      aboutShort: 'PowerPoint crea presentaciones corporativas con diseño, animación y datos.',
      aboutExtra: 'Slide Master, Morph y gráficos vinculados permiten presentaciones de alto impacto.',
      videos: ['Diapositivas efectivas', 'Animaciones', 'Slide Master', 'Presentar con impacto'],
      topics: ['Estructura de slides', 'Diseño visual', 'Animaciones', 'Transiciones', 'Datos y gráficos'],
      timeline: ['Básico', 'Diseño', 'Animaciones', 'Profesional'],
    },
    sql: {
      rating: '4.8', reviews: 267, quizzes: 3,
      aboutShort: 'SQL consulta y gestiona bases de datos relacionales.',
      aboutExtra: 'PostgreSQL, MySQL y SQL Server usan SQL para análisis, backends y data engineering.',
      videos: ['SELECT y filtros', 'JOINs', 'Agregaciones', 'Optimización'],
      topics: ['SELECT y WHERE', 'JOINs', 'GROUP BY', 'Subconsultas', 'Índices'],
      timeline: ['SELECT', 'JOINs', 'Agregaciones', 'Optimización'],
    },
    cybersecurity: {
      rating: '4.9', reviews: 418, quizzes: 2,
      aboutShort: 'La ciberseguridad protege sistemas, redes y datos frente a accesos no autorizados y amenazas digitales.',
      aboutExtra: 'Desde contraseñas robustas hasta detección de phishing: habilidades esenciales para cualquier perfil tecnológico.',
      videos: ['Fundamentos de seguridad', 'Amenazas comunes', 'Contraseñas y MFA', 'Respuesta a incidentes'],
      topics: ['Principios CIA', 'Phishing e ingeniería social', 'Contraseñas y autenticación', 'Malware y ransomware', 'Buenas prácticas en la nube'],
      timeline: ['Fundamentos', 'Amenazas', 'Defensa', 'Respuesta'],
    },
    ...(typeof ExtendedCourses !== 'undefined' ? ExtendedCourses.getTutorialRaw() : {}),
  };

  const LESSON_DETAILS = {
    canvas: [
      { summary: 'Domina el panel lateral, la barra superior y las herramientas esenciales para crear diseños desde el primer minuto.', steps: ['Abre Canva y crea un diseño en blanco de 1080×1080 px.', 'Explora el panel izquierdo: Plantillas, Elementos, Texto, Subidas y Proyectos.', 'Practica mover, redimensionar y alinear objetos con las guías inteligentes.', 'Guarda tu primer borrador y nómbralo con una convención clara (ej. marca-fecha-v1).'], tip: 'Usa Ctrl+D (Cmd+D en Mac) para duplicar elementos rápidamente.' },
      { summary: 'Aprende a personalizar plantillas y aplicar tu identidad de marca de forma consistente.', steps: ['Selecciona una plantilla cercana a tu objetivo y desagrupa solo lo necesario.', 'Configura Brand Kit: logo, colores y tipografías corporativas.', 'Reemplaza textos e imágenes manteniendo jerarquía visual y contraste.', 'Crea una versión para Instagram y otra para LinkedIn reutilizando el mismo diseño.'], tip: 'Bloquea elementos finales para evitar moverlos por accidente.' },
      { summary: 'Combina tipografías y paletas de color con criterio profesional.', steps: ['Limita tu diseño a 2 fuentes: una display y una de lectura.', 'Aplica la regla 60-30-10 para distribuir colores primario, secundario y acento.', 'Ajusta interlineado y tracking en títulos largos para mejorar legibilidad.', 'Comprueba contraste con la herramienta de accesibilidad de Canva.'], tip: 'Evita más de tres colores fuertes en una misma pieza.' },
      { summary: 'Exporta en el formato correcto según el canal: web, impresión o presentación.', steps: ['Descarga en PNG para redes y JPG para fotos con buen peso.', 'Usa PDF Print para material impreso y SVG para logos escalables.', 'Activa fondo transparente solo cuando el canal lo requiera.', 'Revisa peso del archivo: optimiza antes de subir a web o email.'], tip: 'Para impresión, activa sangrado y usa 300 DPI.' },
      { summary: 'Colabora en tiempo real, comenta cambios y gestiona versiones en equipo.', steps: ['Invita colaboradores con permiso de editar o solo comentar.', 'Usa comentarios anclados sobre elementos específicos del diseño.', 'Duplica versiones antes de cambios grandes (v1, v2, final).', 'Presenta el diseño con modo presentación para revisión con stakeholders.'], tip: 'Define un responsable de aprobación final para evitar cambios infinitos.' },
    ],
    figma: [
      { summary: 'Configura frames, layout grids y restricciones para interfaces escalables.', steps: ['Crea un frame de 1440 px y activa Layout Grid de 12 columnas.', 'Dibuja contenedores con Auto Layout en mente desde el inicio.', 'Define constraints horizontales y verticales en componentes clave.', 'Organiza capas con nombres semánticos: Header/Nav/Button-Primary.'], tip: 'Usa Shift+2 para encuadrar la selección y navegar más rápido.' },
      { summary: 'Construye componentes reutilizables con variantes para acelerar el diseño.', steps: ['Convierte un botón base en componente principal.', 'Añade variantes: estado (default, hover, disabled) y tamaño (S, M, L).', 'Publica el componente en la librería del equipo.', 'Instancia el componente y prueba cambios en la master.'], tip: 'Nombra variantes con propiedades claras: State=Hover, Size=L.' },
      { summary: 'Domina Auto Layout para interfaces adaptables sin cálculos manuales.', steps: ['Aplica Auto Layout a tarjetas, listas y barras de navegación.', 'Configura padding, gap y alineación en vertical u horizontal.', 'Anida Auto Layouts para estructuras complejas (sidebar + contenido).', 'Combina con Fill container para elementos elásticos.'], tip: 'Usa min/max width en contenedores para evitar rupturas en móvil.' },
      { summary: 'Crea prototipos clicables con transiciones realistas para validar UX.', steps: ['Conecta frames con interacciones On Click → Navigate to.', 'Aplica Smart Animate entre estados similares.', 'Configura overlays para modales y menús contextuales.', 'Prueba el flujo en el visor de prototipo y registra feedback.'], tip: 'Empieza con el happy path antes de cubrir casos de error.' },
      { summary: 'Gestiona variables, tokens y handoff para desarrollo.', steps: ['Define variables de color y espaciado vinculadas a tokens.', 'Documenta componentes con descripción y propiedades en Dev Mode.', 'Exporta assets en 1x y 2x con nombres consistentes.', 'Comparte enlace de inspección con el equipo de desarrollo.'], tip: 'Alinea nombres de tokens con tu archivo CSS o theme del proyecto.' },
    ],
    python: [
      { summary: 'Comprende tipos de datos, variables y buenas prácticas de estilo PEP 8.', steps: ['Instala Python 3 y verifica con python --version.', 'Declara variables con nombres descriptivos: user_count, is_active.', 'Experimenta con int, float, str, bool y conversiones de tipo.', 'Formatea strings con f-strings: f"Hola {name}".'], tip: 'Usa snake_case para variables y funciones en Python.' },
      { summary: 'Controla el flujo del programa con condicionales y bucles eficientes.', steps: ['Escribe if/elif/else para validar entrada de usuario.', 'Recorre listas con for y usa range() para índices.', 'Evita bucles infinitos con condiciones de salida claras.', 'Resuelve un ejercicio FizzBuzz para practicar lógica.'], tip: 'Prefiere for sobre while cuando conozcas el número de iteraciones.' },
      { summary: 'Encapsula lógica en funciones reutilizables y módulos organizados.', steps: ['Define funciones con parámetros tipados y docstrings breves.', 'Retorna valores en lugar de imprimir dentro de funciones de negocio.', 'Importa módulos estándar: math, datetime, pathlib.', 'Separa código en archivos: main.py y utils.py.'], tip: 'Una función debe hacer una sola cosa y hacerla bien.' },
      { summary: 'Trabaja con listas, diccionarios y comprensiones para datos reales.', steps: ['Crea un diccionario de productos con id, nombre y precio.', 'Filtra con list comprehension: [p for p in products if p["price"] > 10].', 'Ordena con sorted() y key personalizada.', 'Cuenta ocurrencias con collections.Counter.'], tip: 'Usa .get() en diccionarios para evitar KeyError.' },
      { summary: 'Lee y escribe archivos de forma segura con manejo de errores.', steps: ['Abre archivos con with open(...) as f para cierre automático.', 'Lee CSV o JSON según el formato de tus datos.', 'Captura excepciones con try/except específicos.', 'Registra errores en un log en lugar de silenciarlos.'], tip: 'Guarda rutas con pathlib.Path para compatibilidad entre sistemas.' },
    ],
    javascript: [
      { summary: 'Entiende var, let, const y el scope para evitar bugs comunes.', steps: ['Declara constantes con const y variables mutables con let.', 'Observa la diferencia entre scope de bloque y función.', 'Evita var en código moderno.', 'Prueba hoisting con funciones declaradas vs expresadas.'], tip: 'Por defecto usa const; cambia a let solo si reasignas.' },
      { summary: 'Escribe funciones claras y comprende closures con ejemplos prácticos.', steps: ['Crea funciones flecha para callbacks cortos.', 'Pasa funciones como argumentos (map, filter, forEach).', 'Construye un closure que recuerde estado privado.', 'Refactoriza código repetido en funciones puras.'], tip: 'Las funciones puras facilitan pruebas y depuración.' },
      { summary: 'Manipula el DOM: selecciona nodos, eventos y actualiza la UI.', steps: ['Selecciona con querySelector y querySelectorAll.', 'Añade event listeners con addEventListener.', 'Modifica clases con classList y contenido con textContent.', 'Crea elementos dinámicamente con createElement y append.'], tip: 'Delega eventos en contenedores para listas dinámicas.' },
      { summary: 'Consume APIs REST con fetch, async/await y manejo de errores.', steps: ['Realiza GET con fetch y parsea JSON con response.json().', 'Envía POST con body JSON y headers Content-Type.', 'Envuelve llamadas en try/catch y muestra estados de carga.', 'Cancela peticiones obsoletas con AbortController si aplica.'], tip: 'Siempre valida response.ok antes de procesar datos.' },
      { summary: 'Organiza código en módulos ES6 import/export.', steps: ['Separa utilidades en utils.js y expórtalas con export.', 'Importa funciones con import { fn } from "./utils.js".', 'Usa type="module" en tu script HTML.', 'Evita variables globales innecesarias en window.'], tip: 'Un archivo por responsabilidad mejora mantenimiento.' },
    ],
    html: [
      { summary: 'Estructura un documento HTML5 válido con metadatos esenciales.', steps: ['Crea la plantilla: doctype, html, head y body.', 'Añade charset UTF-8, viewport y title descriptivo.', 'Enlaza tu CSS externo y prepara un main contenedor.', 'Valida el documento en el validador W3C.'], tip: 'Usa lang="es" en <html> para accesibilidad y SEO.' },
      { summary: 'Marca contenido textual, enlaces y jerarquía de encabezados.', steps: ['Usa h1 único por página y h2–h6 para subsecciones.', 'Crea enlaces descriptivos; evita "clic aquí".', 'Aplica strong/em con significado, no solo estilo.', 'Inserta listas ul/ol para pasos o ítems relacionados.'], tip: 'La jerarquía de headings debe reflejar el outline del contenido.' },
      { summary: 'Integra imágenes responsivas y listas estructuradas.', steps: ['Añade alt text significativo en cada imagen.', 'Usa figure y figcaption para contenido ilustrado.', 'Combina srcset y sizes para imágenes adaptativas.', 'Organiza navegación con listas de enlaces.'], tip: 'El alt debe describir la función de la imagen, no solo su aspecto.' },
      { summary: 'Construye formularios accesibles con validación nativa.', steps: ['Asocia label con input mediante for/id.', 'Usa tipos correctos: email, tel, number, date.', 'Añade required, min, max y mensajes de error claros.', 'Agrupa campos relacionados con fieldset y legend.'], tip: 'No dependas solo del color para indicar errores.' },
      { summary: 'Aplica etiquetas semánticas HTML5 para SEO y accesibilidad.', steps: ['Sustituye divs genéricos por header, nav, main, article, footer.', 'Usa section solo con encabezado propio.', 'Marca contenido independiente con article.', 'Añade landmarks ARIA solo cuando la semántica no alcance.'], tip: 'Piensa en la página como un documento outline, no como cajas.' },
    ],
    css: [
      { summary: 'Selecciona elementos con precisión y entiende especificidad.', steps: ['Practica selectores de clase, id, atributo y descendientes.', 'Calcula especificidad para evitar guerras de !important.', 'Usa :hover, :focus-visible y :nth-child en listas.', 'Organiza reglas por componente, no solo por tipo de selector.'], tip: 'Prefiere clases sobre selectores profundamente anidados.' },
      { summary: 'Domina el box model, margin collapse y display.', steps: ['Configura box-sizing: border-box globalmente.', 'Diferencia margin vs padding con un layout de tarjeta.', 'Usa display block, inline-block y flex según contexto.', 'Visualiza el modelo con DevTools (pestaña Layout).'], tip: 'Un reset o normalize evita sorpresas entre navegadores.' },
      { summary: 'Construye layouts flexibles con Flexbox.', steps: ['Define contenedor flex con justify y align.', 'Controla hijos con flex-grow, flex-shrink y flex-basis.', 'Crea barras de navegación y filas de tarjetas.', 'Invierte ejes con flex-direction y wrap.'], tip: 'gap en flex elimina hacks de margin entre ítems.' },
      { summary: 'Diseña grillas complejas con CSS Grid.', steps: ['Define grid-template-columns con fr y minmax().', 'Coloca ítems con grid-column y grid-row.', 'Usa grid-template-areas para layouts de página.', 'Combina Grid para macro-layout y Flex para componentes.'], tip: 'Grid para la página; Flex para componentes internos.' },
      { summary: 'Adapta diseños a cualquier pantalla y añade micro-interacciones.', steps: ['Escribe media queries mobile-first con breakpoints lógicos.', 'Usa unidades relativas: rem, %, vw/vh y clamp().', 'Añade transiciones suaves en hover y focus.', 'Respeta prefers-reduced-motion para accesibilidad.'], tip: 'Prueba en 320px, 768px y 1280px como mínimo.' },
    ],
    github: [
      { summary: 'Inicializa repositorios locales y conéctalos con GitHub.', steps: ['Configura git config user.name y user.email.', 'Ejecuta git init y crea un README.md inicial.', 'Haz git add y git commit con mensajes convencionales.', 'Conecta con git remote add origin y git push -u.'], tip: 'Commits pequeños y frecuentes facilitan revisiones.' },
      { summary: 'Trabaja con ramas para features aisladas.', steps: ['Crea rama feature/nombre con git checkout -b.', 'Mantén main estable; desarrolla en ramas.', 'Fusiona con merge o rebase según política del equipo.', 'Elimina ramas mergeadas para mantener orden.'], tip: 'Nombre de rama: tipo/descripcion-corta (feat/login-form).' },
      { summary: 'Resuelve conflictos de merge con calma y método.', steps: ['Actualiza tu rama con main antes de abrir PR.', 'Identifica archivos en conflicto con git status.', 'Edita marcadores <<<<<<< y conserva el código correcto.', 'Ejecuta tests tras resolver y commitea la resolución.'], tip: 'Habla con quien tocó las mismas líneas antes de forzar cambios.' },
      { summary: 'Abre Pull Requests claros que faciliten la revisión.', steps: ['Describe qué, por qué y cómo probar el cambio.', 'Adjunta capturas o GIF si hay impacto visual.', 'Pide review a compañeros y responde comentarios.', 'Squash o merge según estándar del repositorio.'], tip: 'PRs pequeños se revisan más rápido y con mejor calidad.' },
      { summary: 'Introduce CI/CD básico con GitHub Actions.', steps: ['Crea workflow en .github/workflows/ci.yml.', 'Configura trigger en push y pull_request.', 'Añade pasos: checkout, install, test.', 'Muestra badge de estado en el README.'], tip: 'Empieza con un job simple antes de pipelines complejos.' },
    ],
    excel: [
      { summary: 'Navega la hoja, formatea datos y usa referencias de celda.', steps: ['Diferencia celda activa, rango y nombre de hoja.', 'Aplica formatos numéricos, fechas y tablas (Ctrl+T).', 'Usa referencias relativas y absolutas ($A$1).', 'Congela paneles para encabezados visibles al desplazarte.'], tip: 'Convierte rangos en Tabla Excel para fórmulas automáticas.' },
      { summary: 'Domina SUM, IF y funciones de texto más usadas.', steps: ['Suma condicional con SUMIF y SUMIFS.', 'Ramifica lógica con IF e IFS anidados.', 'Limpia texto con TRIM, IZQUIERDA, DERECHA y CONCAT.', 'Combina funciones en una fórmula legible por pasos.'], tip: 'Usa el asistente de fórmulas si olvidas la sintaxis.' },
      { summary: 'Busca datos con BUSCARV, XLOOKUP e INDEX/EQUIV.', steps: ['Define tabla de búsqueda ordenada o usa XLOOKUP.', 'Configura coincidencia exacta vs aproximada.', 'Sustituye BUSCARV frágil por INDEX/EQUIV en tablas anchas.', 'Maneja #N/D con SI.ERROR o IFNA.'], tip: 'XLOOKUP es más flexible y legible que BUSCARV en Excel moderno.' },
      { summary: 'Resume datos con tablas dinámicas y segmentaciones.', steps: ['Inserta tabla dinámica desde rango tabular limpio.', 'Arrastra campos a Filas, Columnas, Valores y Filtros.', 'Añade segmentación (slicers) para dashboards interactivos.', 'Actualiza origen de datos al recibir información nueva.'], tip: 'Sin filas vacías ni columnas mezcladas en el origen.' },
      { summary: 'Visualiza métricas con gráficos claros y profesionales.', steps: ['Elige gráfico según mensaje: barras, líneas, torta con criterio.', 'Elimina chart junk: bordes, fondos y leyendas redundantes.', 'Añade títulos, etiquetas de datos y colores accesibles.', 'Vincula gráficos a tablas dinámicas para actualización automática.'], tip: 'Un gráfico debe responder una pregunta de negocio concreta.' },
    ],
    powerpoint: [
      { summary: 'Planifica la narrativa y estructura diapositivas con intención.', steps: ['Define objetivo, audiencia y duración antes de diseñar.', 'Usa regla 10-20-30 como referencia: mensajes concisos.', 'Una idea principal por diapositiva; evita muros de texto.', 'Crea outline en Vista Esquema antes del modo Normal.'], tip: 'Si no puedes leer la slide en 5 segundos, simplifica.' },
      { summary: 'Aplica diseño visual consistente: tipografía, color y espacio.', steps: ['Configura Slide Master con fuentes y colores corporativos.', 'Alinea objetos con guías y Distribuir horizontal/vertical.', 'Usa imágenes de alta resolución y iconos coherentes.', 'Mantén márgenes generosos; menos es más.'], tip: 'Duplica layouts del master en lugar de copiar slides sueltas.' },
      { summary: 'Anima con propósito: revela información, no distraigas.', steps: ['Prefiere Animar → Aparecer o Fundido para texto.', 'Usa Animación de ruta solo cuando aporte claridad.', 'Abre Panel de selección para ordenar capas animadas.', 'Reproduce desde inicio para revisar ritmo global.'], tip: 'Máximo una animación destacada por diapositiva.' },
      { summary: 'Conecta ideas con transiciones suaves entre secciones.', steps: ['Usa Corte o Fundido entre la mayoría de slides.', 'Reserva Morph para cambios de estado del mismo objeto.', 'Agrupa secciones con diapositivas de transición visual.', 'Sincroniza transición con guion del presentador.'], tip: 'Morph requiere objetos con el mismo nombre entre slides.' },
      { summary: 'Integra datos vivos y prepara la presentación final.', steps: ['Vincula gráficos a Excel para actualización automática.', 'Añade hipervínculos y zoom de sección en presentaciones largas.', 'Configura Presentación personalizada y notas del orador.', 'Exporta PDF y prueba en el proyector o Teams antes del evento.'], tip: 'Lleva PDF de respaldo por si falla la versión editable.' },
    ],
    sql: [
      { summary: 'Consulta datos con SELECT, filtros WHERE y ordenamiento.', steps: ['Selecciona columnas explícitas en lugar de SELECT *.', 'Filtra con WHERE, AND, OR y operadores IN/BETWEEN.', 'Ordena con ORDER BY y limita filas con LIMIT/TOP.', 'Usa alias (AS) para columnas calculadas legibles.'], tip: 'Nombra tablas con alias cortos en consultas con joins.' },
      { summary: 'Combina tablas relacionadas con INNER, LEFT y RIGHT JOIN.', steps: ['Identifica claves primarias y foráneas entre tablas.', 'Escribe INNER JOIN para coincidencias en ambos lados.', 'Usa LEFT JOIN para conservar filas del lado izquierdo.', 'Evita producto cartesiano sin condición ON.'], tip: 'Dibuja el diagrama ER antes de escribir joins complejos.' },
      { summary: 'Agrega métricas con GROUP BY y funciones SUM, COUNT, AVG.', steps: ['Agrupa ventas por región con GROUP BY region.', 'Filtra grupos con HAVING (no confundir con WHERE).', 'Cuenta distintos con COUNT(DISTINCT columna).', 'Redondea promedios y maneja NULL con COALESCE.'], tip: 'Toda columna en SELECT debe estar en GROUP BY o en una agregación.' },
      { summary: 'Encapsula lógica con subconsultas y CTEs legibles.', steps: ['Escribe subconsulta escalar para un valor único.', 'Sustituye subconsultas anidadas por WITH ... AS (CTE).', 'Encadena CTEs para pipelines de transformación claros.', 'Compara EXISTS vs IN para subconsultas de existencia.'], tip: 'Las CTEs mejoran lectura; verifica rendimiento en tablas grandes.' },
      { summary: 'Optimiza consultas con índices y planes de ejecución.', steps: ['Crea índices en columnas de filtro y join frecuentes.', 'Analiza EXPLAIN/EXPLAIN ANALYZE del motor que uses.', 'Evita funciones sobre columnas indexadas en WHERE.', 'Normaliza diseño pero desnormaliza cuando el lectura lo exija.'], tip: 'Índice correcto > consulta ingeniosa sin índice.' },
    ],
    cybersecurity: [
      { summary: 'Comprende los pilares CIA: confidencialidad, integridad y disponibilidad.', steps: ['Define confidencialidad: solo quien debe ver los datos, los ve.', 'Integridad: los datos no se alteran sin autorización.', 'Disponibilidad: sistemas accesibles cuando se necesitan.', 'Relaciona cada pilar con controles: cifrado, hashes, backups y redundancia.'], tip: 'Toda decisión de seguridad equilibra estos tres principios.' },
      { summary: 'Identifica phishing, smishing y técnicas de ingeniería social.', steps: ['Revisa remitente, dominio y urgencia artificial del mensaje.', 'No abras enlaces ni adjuntos de fuentes no verificadas.', 'Confirma solicitudes sensibles por un canal alternativo.', 'Reporta intentos sospechosos al equipo de seguridad.'], tip: 'La mayoría de brechas empiezan con un clic en un enlace falso.' },
      { summary: 'Crea contraseñas robustas y activa autenticación multifactor (MFA).', steps: ['Usa gestor de contraseñas con claves únicas por servicio.', 'Combina longitud (16+ caracteres) con complejidad razonable.', 'Activa MFA en email, banca, GitHub y herramientas de trabajo.', 'Evita reutilizar contraseñas entre plataformas.'], tip: 'MFA bloquea la mayoría de ataques aunque filtren una contraseña.' },
      { summary: 'Reconoce malware, ransomware y vectores de infección comunes.', steps: ['Malware: software malicioso (virus, troyanos, spyware).', 'Ransomware: cifra datos y exige rescate; prioriza backups offline.', 'Vectores: email, USB, descargas pirata y plugins no confiables.', 'Mantén SO, navegador y antivirus actualizados.'], tip: 'Backups probados son tu mejor defensa contra ransomware.' },
      { summary: 'Aplica higiene digital en la nube, Wi‑Fi y dispositivos personales.', steps: ['Usa HTTPS y VPN en redes públicas.', 'Revisa permisos de apps con acceso a Google/Microsoft.', 'Cifra disco completo en portátiles (BitLocker, FileVault).', 'Segmenta cuentas: personal vs laboral; mínimo privilegio siempre.'], tip: 'Asume que cualquier red pública puede estar comprometida.' },
    ],
  };

  function _sectionForIndex(topics, timeline, index) {
    if (!timeline?.length) return 'General';
    const per = Math.ceil(topics.length / timeline.length);
    return timeline[Math.min(Math.floor(index / per), timeline.length - 1)];
  }

  function _buildLessons(courseId, data) {
    if (typeof CourseCurriculum !== 'undefined') {
      const curated = CourseCurriculum.getLessons(courseId);
      if (curated.length) return curated;
    }

    const topics = data.topics || [];
    const videos = data.videos || [];
    const details = LESSON_DETAILS[courseId] || [];
    const levels = ['Principiante', 'Intermedio', 'Intermedio', 'Avanzado', 'Avanzado'];
    return topics.map((topic, i) => {
      const section = _sectionForIndex(topics, data.timeline, i);
      const duration = `${8 + (i % 5) * 4} min`;
      const detail = details[i];
      return {
        id: `${courseId}-l${i + 1}`,
        title: topic,
        section,
        duration,
        level: levels[i] || section,
        video: videos[i % videos.length] || topic,
        description: detail?.summary || `¿Qué es ${topic} y para qué sirve? Aprende con ejemplos prácticos guiados.`,
        summary: detail?.summary || `Aprende ${topic.toLowerCase()} con ejemplos prácticos y ejercicios guiados.`,
        requirements: ['Acceso a internet'],
        steps: detail?.steps || [
          `Concepto clave: entiende qué es "${topic}" y cuándo aplicarlo.`,
          'Demostración: sigue el ejemplo paso a paso.',
          'Práctica: completa el mini reto de la lección.',
        ],
        resources: {
          video: videos[i % videos.length] || topic,
          docs: 'Documentación oficial',
          docsUrl: '#',
        },
        tip: detail?.tip || `Dedica ${duration} a practicar antes de pasar a la siguiente lección.`,
      };
    });
  }

  function _syncFromCurriculum(id, courseData) {
    if (typeof CourseCurriculum === 'undefined') return courseData;
    const meta = CourseCurriculum.getCertMeta(id);
    const lessons = courseData.lessons || [];
    if (!meta || !lessons.length) return courseData;
    return {
      ...courseData,
      topics: lessons.map((l) => l.title),
      videos: lessons.map((l) => l.title),
      timeline: meta.levelsCovered,
      quizzes: meta.quizModuleCount,
      quizQuestions: meta.quizQuestionCount,
      tutorials: meta.lessonCount,
    };
  }

  const COURSE_DATA = {};
  Object.keys(RAW).forEach(id => {
    const d = RAW[id];
    const lessons = _buildLessons(id, d);
    COURSE_DATA[id] = _syncFromCurriculum(id, {
      ...d,
      tutorials: lessons.length,
      lessons,
    });
  });

  function getCourseData(courseId) {
    const base = COURSE_DATA[courseId] || null;
    if (!base) return null;
    const locale = typeof I18n !== 'undefined' ? I18n.getLocale() : 'es';
    if (typeof ExtendedCourseLocales !== 'undefined') {
      const meta = ExtendedCourseLocales.getTutorialMeta(courseId, locale);
      if (meta) return { ...base, ...meta };
    }
    return base;
  }

  function getLessons(courseId) {
    return COURSE_DATA[courseId]?.lessons || [];
  }

  function getCategoryLabel(cat) {
    const map = {
      web: 'catWeb',
      programming: 'catProgramming',
      design: 'catDesign',
      office: 'catOffice',
      data: 'catData',
      tools: 'catTools',
      security: 'catSecurity',
    };
    if (typeof I18n !== 'undefined' && map[cat]) {
      return I18n.t(`tutorial.${map[cat]}`);
    }
    return CATEGORY_LABELS[cat] || cat;
  }

  function getLevelColor(level) {
    return LEVEL_COLORS[level] || 'var(--clr-brand-500)';
  }

  return {
    COURSE_DATA,
    CATEGORY_LABELS,
    getCourseData,
    getLessons,
    getCategoryLabel,
    getLevelColor,
  };

})();

if (typeof module !== 'undefined') module.exports = TutorialData;
