/**
 * IN4MIND — AIKnowledge
 * Base de conocimiento del asistente: tecnología + plataforma IN4MIND.
 */

'use strict';

const AIKnowledge = (() => {

  const COURSE_HINTS = {
    canvas:     'Canva — diseño gráfico en la nube, plantillas y Brand Kit.',
    figma:      'Figma — diseño UI/UX colaborativo, componentes y prototipos.',
    python:     'Python — lenguaje versátil para automatización, datos e IA.',
    javascript: 'JavaScript — interactividad web y desarrollo full-stack.',
    html:       'HTML — estructura y semántica de páginas web.',
    css:        'CSS — estilos, layout responsivo y animaciones.',
    github:     'GitHub — control de versiones con Git y colaboración.',
    excel:      'Excel — fórmulas, tablas dinámicas y análisis de datos.',
    powerpoint: 'PowerPoint — presentaciones corporativas con impacto visual.',
    sql:        'SQL — consultas y gestión de bases de datos relacionales.',
    cybersecurity: 'Ciberseguridad — protección de datos, phishing, contraseñas, MFA y amenazas comunes.',
  };

  function _coursesList() {
    if (typeof DataService === 'undefined') {
      return Object.entries(COURSE_HINTS).map(([id, desc]) => `- **${id}**: ${desc}`).join('\n');
    }
    return DataService.getCourses().map(c =>
      `- **${c.title}** (${c.category}): ${c.desc}`
    ).join('\n');
  }

  function _courseLink(courseId, courseTitle) {
    return `Abre **Tutoriales**, elige **${courseTitle}** y pulsa *Empieza a Aprender*. También tienes un quiz dedicado en **Quizzes**.`;
  }

  const TOPICS = [
    {
      id: 'greeting',
      keywords: ['hola', 'buenas', 'hey', 'saludos', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal'],
      respond: () =>
        `¡Hola! Soy el **Asistente IN4MIND**, tu guía en tecnología y en esta plataforma.\n\n` +
        `Puedo ayudarte con:\n` +
        `- Conceptos de programación, web, diseño, datos y herramientas de oficina\n` +
        `- Cómo usar IN4MIND: tutoriales, quizzes, dashboard e IA\n` +
        `- Recomendaciones de por dónde empezar según tu objetivo\n\n` +
        `¿Qué te gustaría aprender hoy?`,
    },
    {
      id: 'thanks',
      keywords: ['gracias', 'thank', 'genial', 'perfecto', 'excelente', 'muy bien', 'te lo agradezco'],
      respond: () =>
        `¡Con mucho gusto! Me alegra haberte sido útil.\n\n` +
        `Recuerda que en IN4MIND puedes reforzar lo aprendido con lecciones paso a paso y quizzes interactivos.\n\n` +
        `Cuando quieras, sigue preguntando. Estoy aquí para ayudarte.`,
    },
    {
      id: 'bye',
      keywords: ['adios', 'chao', 'hasta luego', 'nos vemos', 'bye'],
      respond: () =>
        `¡Hasta pronto! Sigue aprendiendo a tu ritmo en IN4MIND.\n\n` +
        `Tip: revisa la sección **Recién vistos** en el Dashboard para retomar donde lo dejaste.`,
    },
    {
      id: 'in4mind_platform',
      keywords: ['in4mind', 'plataforma', 'que es in4mind', 'sobre in4mind', 'esta app', 'esta pagina'],
      respond: () =>
        `**IN4MIND** es una plataforma educativa para aprender tecnología de forma clara, moderna y accesible.\n\n` +
        `Incluye:\n` +
        `- **Dashboard**: cursos destacados y progreso reciente\n` +
        `- **Tutoriales**: lecciones por curso con pasos prácticos\n` +
        `- **Quizzes**: evaluaciones con opción múltiple, V/F y pareos\n` +
        `- **IA** (aquí): asistente para resolver dudas al instante\n\n` +
        `Cursos disponibles:\n${_coursesList()}`,
    },
    {
      id: 'in4mind_tutorials',
      keywords: ['tutorial', 'tutoriales', 'leccion', 'lecciones', 'como estudiar', 'empieza a aprender', 'ver curso'],
      respond: () =>
        `En **Tutoriales** encontrarás todos los cursos organizados por categoría.\n\n` +
        `Cómo usarlos:\n` +
        `1. Elige un curso (Python, HTML, Figma, etc.) y pulsa **Ver**\n` +
        `2. Revisa las **carátulas de cada apartado** y la ruta de aprendizaje\n` +
        `3. Abre una lección: verás pasos numerados, consejos y barra de progreso\n` +
        `4. Al finalizar, usa **Quiz de [curso]** para practicar\n\n` +
        `Desde el Dashboard también puedes abrir un curso desde las tarjetas o desde **Recién vistos**.`,
    },
    {
      id: 'in4mind_quizzes',
      keywords: ['quiz', 'quizzes', 'evaluacion', 'examen', 'preguntas', 'conocimiento general', 'practicar'],
      respond: () =>
        `Los **Quizzes** de IN4MIND ponen a prueba lo que aprendiste con preguntas variadas.\n\n` +
        `- Cada curso tiene su **quiz dedicado** (Canvas, Python, SQL, Figma, etc.)\n` +
        `- **Conocimiento General** mezcla preguntas de todas las herramientas\n` +
        `- Tipos: opción múltiple, verdadero/falso y pareos\n` +
        `- Tu progreso se guarda en la sesión\n\n` +
        `Tip: desde una lección de tutorial, el botón **Quiz de [curso]** te lleva directo al quiz correcto.`,
    },
    {
      id: 'in4mind_dashboard',
      keywords: ['dashboard', 'inicio', 'home', 'recien vistos', 'destacados', 'ver todos'],
      respond: () =>
        `El **Dashboard** es tu punto de partida en IN4MIND.\n\n` +
        `- **Destacados** y **Sigue aprendiendo**: carruseles de cursos\n` +
        `- **Ver todos**: expande la lista completa\n` +
        `- **Recién vistos**: retoma lecciones con un clic\n` +
        `- Buscador superior: filtra cursos por nombre o tema\n\n` +
        `Desde cualquier tarjeta puedes ir directo a los tutoriales del curso.`,
    },
    {
      id: 'in4mind_courses',
      keywords: ['cursos', 'que puedo aprender', 'catalogo', 'lista de cursos', 'temas disponibles'],
      respond: () =>
        `Estos son los cursos que IN4MIND ofrece hoy:\n\n${_coursesList()}\n\n` +
        `Filtra por categoría en Tutoriales: Web, Programación, Diseño, Office, Datos, Ciberseguridad y Herramientas.`,
    },
    {
      id: 'cybersecurity',
      keywords: [
        'ciberseguridad', 'cybersecurity', 'seguridad informatica', 'seguridad digital',
        'phishing', 'malware', 'ransomware', 'contraseña', 'contraseñas', 'password',
        'mfa', 'autenticacion multifactor', '2fa', 'hacker', 'hackeo', 'firewall',
        'vpn', 'encriptacion', 'cifrado', 'vulnerabilidad', 'brecha', 'ingenieria social',
        'antivirus', 'backup', 'confidencialidad',
      ],
      respond: () =>
        `**Ciberseguridad** protege sistemas, redes y datos frente a accesos no autorizados y amenazas digitales.\n\n` +
        `Temas clave en IN4MIND:\n` +
        `- **Principios CIA**: confidencialidad, integridad y disponibilidad\n` +
        `- **Phishing** e ingeniería social: cómo detectar correos y enlaces falsos\n` +
        `- **Contraseñas y MFA**: gestores de contraseñas y autenticación en dos pasos\n` +
        `- **Malware y ransomware**: prevención y respuesta\n` +
        `- **Buenas prácticas**: VPN, backups, actualizaciones y mínimo privilegio\n\n` +
        _courseLink('cybersecurity', 'Ciberseguridad'),
    },
    {
      id: 'programming_start',
      keywords: ['empezar a programar', 'desde cero', 'principiante', 'por donde empiezo', 'aprender a programar', 'no se nada'],
      respond: () =>
        `Si recién comienzas, te recomiendo esta ruta en IN4MIND:\n\n` +
        `1. **HTML** — entiende la estructura de una página web\n` +
        `2. **CSS** — dale estilo y layout a lo que construiste\n` +
        `3. **JavaScript** — añade interactividad y lógica\n` +
        `4. **Python** — ideal para automatización, datos y scripts\n\n` +
        `Dedica 20–30 min diarios, completa las lecciones y refuerza con quizzes. La constancia marca la diferencia.`,
    },
    {
      id: 'html_vs_css',
      keywords: ['html vs css', 'diferencia html css', 'html y css', 'para que sirve html', 'para que sirve css'],
      respond: () =>
        `**HTML** y **CSS** trabajan juntos pero cumplen roles distintos:\n\n` +
        `- **HTML**: define *qué* hay en la página (títulos, párrafos, imágenes, formularios). Es la estructura.\n` +
        `- **CSS**: define *cómo se ve* (colores, tipografía, espaciado, diseño responsivo).\n\n` +
        `Analogía: HTML es el esqueleto; CSS es la ropa y el estilo.\n\n` +
        _courseLink('html', 'HTML') + ' Luego continúa con **CSS**.',
    },
    {
      id: 'python',
      keywords: ['python', 'phyton', 'pip', 'django', 'pandas'],
      respond: () =>
        `**Python** es un lenguaje claro y muy usado en web, datos, automatización e inteligencia artificial.\n\n` +
        `Conceptos clave para empezar:\n` +
        `- Variables, tipos de datos y condicionales\n` +
        `- Bucles \`for\` y \`while\`\n` +
        `- Funciones y listas/diccionarios\n` +
        `- Manejo de archivos y librerías\n\n` +
        `Ejemplo: \`print("Hola IN4MIND")\` muestra texto en consola.\n\n` +
        _courseLink('python', 'Python'),
    },
    {
      id: 'javascript',
      keywords: ['javascript', 'js', 'node', 'react', 'dom', 'fetch'],
      respond: () =>
        `**JavaScript** es el lenguaje nativo del navegador: hace páginas interactivas y también corre en servidores (Node.js).\n\n` +
        `Temas esenciales:\n` +
        `- Variables (\`let\`, \`const\`) y funciones\n` +
        `- Manipulación del **DOM** (cambiar HTML desde código)\n` +
        `- Eventos (clicks, formularios)\n` +
        `- **fetch** y APIs para datos en tiempo real\n\n` +
        _courseLink('javascript', 'JavaScript'),
    },
    {
      id: 'html',
      keywords: ['html', 'etiqueta', 'etiquetas', 'semantica', 'head body', 'formulario html'],
      respond: () =>
        `**HTML5** estructura el contenido web con etiquetas semánticas.\n\n` +
        `Las más usadas:\n` +
        `- \`<h1>\`–\`<h6>\`: encabezados\n` +
        `- \`<p>\`, \`<a>\`, \`<img>\`: texto, enlaces e imágenes\n` +
        `- \`<header>\`, \`<nav>\`, \`<main>\`, \`<footer>\`: secciones semánticas\n` +
        `- \`<form>\`, \`<input>\`: formularios\n\n` +
        `Buena semántica mejora accesibilidad y SEO.\n\n` +
        _courseLink('html', 'HTML'),
    },
    {
      id: 'css',
      keywords: ['css', 'selector', 'flexbox', 'grid', 'responsive', 'animacion css'],
      respond: () =>
        `**CSS** controla la presentación visual de tu sitio.\n\n` +
        `Pilares modernos:\n` +
        `- **Selectores** y box model (margin, padding, border)\n` +
        `- **Flexbox** para filas/columnas flexibles\n` +
        `- **CSS Grid** para layouts en cuadrícula\n` +
        `- **Media queries** para diseño responsivo\n\n` +
        _courseLink('css', 'CSS'),
    },
    {
      id: 'sql',
      keywords: ['sql', 'base de datos', 'mysql', 'postgresql', 'select', 'join', 'consulta'],
      respond: () =>
        `**SQL** (Structured Query Language) consulta y gestiona bases de datos relacionales.\n\n` +
        `Comandos fundamentales:\n` +
        `- \`SELECT\` + \`WHERE\`: leer y filtrar datos\n` +
        `- \`JOIN\`: combinar tablas relacionadas\n` +
        `- \`GROUP BY\` + agregaciones (\`COUNT\`, \`SUM\`)\n` +
        `- Índices para mejorar rendimiento\n\n` +
        _courseLink('sql', 'SQL'),
    },
    {
      id: 'github',
      keywords: ['github', 'git', 'commit', 'push', 'pull request', 'repositorio', 'rama', 'branch'],
      respond: () =>
        `**Git** controla versiones de tu código; **GitHub** lo aloja y facilita colaboración.\n\n` +
        `Flujo básico:\n` +
        `- \`git init\` → crea repositorio\n` +
        `- \`git add\` + \`git commit\` → guarda cambios\n` +
        `- \`git push\` → sube al remoto\n` +
        `- **Pull Request** → propone fusionar cambios con revisión\n\n` +
        _courseLink('github', 'GitHub'),
    },
    {
      id: 'excel',
      keywords: ['excel', 'hoja de calculo', 'sum', 'sumar', 'buscarv', 'vlookup', 'tabla dinamica', 'formula'],
      respond: () =>
        `**Excel** organiza y analiza datos con fórmulas y visualizaciones.\n\n` +
        `Funciones imprescindibles:\n` +
        `- \`=SUM()\` / \`=SUMAR()\`: sumar rangos\n` +
        `- \`=IF()\` / \`=SI()\`: lógica condicional\n` +
        `- **BUSCARV** / **XLOOKUP**: buscar valores en tablas\n` +
        `- **Tablas dinámicas**: resumir grandes volúmenes\n\n` +
        _courseLink('excel', 'Excel'),
    },
    {
      id: 'powerpoint',
      keywords: ['powerpoint', 'ppt', 'presentacion', 'diapositiva', 'slide', 'slide master'],
      respond: () =>
        `**PowerPoint** comunica ideas con diapositivas claras y visuales.\n\n` +
        `Buenas prácticas:\n` +
        `- Una idea principal por diapositiva\n` +
        `- Usa **Slide Master** para diseño consistente\n` +
        `- Animaciones con propósito, no distracción\n` +
        `- Gráficos vinculados a Excel para datos actualizados\n\n` +
        _courseLink('powerpoint', 'PowerPoint'),
    },
    {
      id: 'figma',
      keywords: ['figma', 'ui', 'ux', 'prototipo', 'wireframe', 'auto layout', 'componente figma'],
      respond: () =>
        `**Figma** diseña interfaces y prototipos colaborativos desde el navegador.\n\n` +
        `Conceptos clave:\n` +
        `- **Frames** y layout grids\n` +
        `- **Componentes** y variantes reutilizables\n` +
        `- **Auto Layout** para interfaces flexibles\n` +
        `- **Prototyping** para simular flujos de usuario\n\n` +
        _courseLink('figma', 'Figma'),
    },
    {
      id: 'canvas',
      keywords: ['canva', 'canvas', 'diseno grafico', 'plantilla', 'brand kit', 'post redes'],
      respond: () =>
        `**Canva** permite crear diseños profesionales sin software complejo.\n\n` +
        `Ideal para:\n` +
        `- Posts de redes sociales e infografías\n` +
        `- Presentaciones y flyers\n` +
        `- **Brand Kit**: colores y tipografías de marca\n` +
        `- Exportación en PNG, PDF o JPG según el canal\n\n` +
        _courseLink('canvas', 'Canvas'),
    },
    {
      id: 'web_dev',
      keywords: ['desarrollo web', 'frontend', 'full stack', 'pagina web', 'sitio web', 'crear web'],
      respond: () =>
        `El **desarrollo web** combina varias capas:\n\n` +
        `- **Frontend**: HTML + CSS + JavaScript (lo que ve el usuario)\n` +
        `- **Backend**: lógica en servidor, APIs y bases de datos (Python, Node, SQL)\n` +
        `- **Diseño**: Figma/Canva para prototipos visuales\n\n` +
        `En IN4MIND tienes una ruta completa: HTML → CSS → JavaScript, más SQL y GitHub para proyectos reales.`,
    },
    {
      id: 'ai_section',
      keywords: ['esta seccion', 'este chat', 'asistente', 'bot', 'ia in4mind', 'inteligencia artificial'],
      respond: () =>
        `Estás en el **Asistente IA de IN4MIND** — un chat educativo integrado en la plataforma.\n\n` +
        `Solo respondo consultas sobre **IN4MIND** y su catálogo de cursos (programación, web, diseño, datos, ciberseguridad y más).\n\n` +
        `Escríbeme, por ejemplo: "¿Qué es Flexbox?", "¿Cómo abro un quiz de Python?" o "¿Cómo funciona mi perfil en IN4MIND?".`,
    },
  ];

  const OFF_TOPIC_KEYWORDS = [
    'amor', 'novia', 'novio', 'romance', 'futbol', 'soccer', 'baloncesto', 'nba',
    'politica', 'elecciones', 'presidente', 'guerra', 'receta', 'cocinar', 'cocina',
    'clima', 'horoscopo', 'zodiaco', 'chiste', 'meme', 'celebridad', 'famoso',
    'pelicula', 'peliculas', 'netflix', 'serie', 'mundial', 'apuesta', 'casino',
    'bitcoin', 'trading', 'forex', 'dieta', 'adelgazar', 'medicina', 'doctor',
    'enfermedad', 'sintoma', 'religion', 'biblia', 'oracion', 'tiktok', 'instagram',
    'viaje', 'turismo', 'hotel', 'restaurante', 'mascota', 'perro', 'gato',
  ];

  const PLATFORM_KEYWORDS = [
    'in4mind', 'plataforma', 'dashboard', 'tutorial', 'tutoriales', 'quiz', 'quizzes',
    'leccion', 'lecciones', 'curso', 'cursos', 'perfil', 'favorito', 'favoritos',
    'guardado', 'guardados', 'certificacion', 'certificaciones', 'login', 'sesion',
    'recien vistos', 'destacados', 'asistente', 'sidebar', 'modo oscuro',
  ];

  function _curriculumKeywords() {
    const words = new Set([
      ...Object.keys(COURSE_HINTS),
      'programacion', 'programar', 'tecnologia', 'aprender', 'estudiar',
      'variable', 'funcion', 'codigo', 'desarrollo', 'web', 'frontend', 'backend',
      'diseño', 'diseno', 'ui', 'ux', 'datos', 'seguridad', 'hacking',
    ]);
    TOPICS.forEach(topic => {
      topic.keywords.forEach(kw => {
        kw.split(' ').forEach(w => {
          if (w.length > 2) words.add(_normalize(w));
        });
      });
    });
    if (typeof DataService !== 'undefined') {
      DataService.getCourses().forEach(c => {
        words.add(_normalize(c.title));
        c.tags.forEach(t => words.add(_normalize(t)));
      });
    }
    return words;
  }

  function getOffTopicResponse() {
    return `**Consulta fuera del alcance de IN4MIND**\n\n` +
      `Solo puedo ayudarte con temas relacionados con **IN4MIND**: la plataforma, sus tutoriales, quizzes, perfil, certificaciones y los cursos que ofrecemos.\n\n` +
      `Por favor, formula preguntas sobre IN4MIND, por ejemplo:\n` +
      `- "¿Cómo funcionan los tutoriales en IN4MIND?"\n` +
      `- "¿Qué cursos puedo estudiar en IN4MIND?"\n` +
      `- "Explícame variables en Python"\n` +
      `- "¿Qué es el phishing?"\n\n` +
      `Estoy aquí para apoyarte en tu aprendizaje dentro de IN4MIND.`;
  }

  function _containsKeyword(norm, kw) {
    const nk = _normalize(kw);
    if (!nk) return false;
    if (nk.length <= 3) {
      return norm.split(' ').includes(nk);
    }
    return norm.includes(nk);
  }

  function isInScope(userMessage) {
    const norm = _normalize(userMessage);
    if (!norm) return true;

    const curriculum = _curriculumKeywords();
    const hasPlatform = PLATFORM_KEYWORDS.some(kw => _containsKeyword(norm, kw));
    const hasCurriculum = [...curriculum].some(kw => kw.length >= 4 && _containsKeyword(norm, kw));
    const hasOffTopic = OFF_TOPIC_KEYWORDS.some(kw => _containsKeyword(norm, kw));

    if (hasPlatform || hasCurriculum) return true;

    let bestScore = 0;
    TOPICS.forEach(topic => {
      const score = _scoreTopic(norm, topic);
      if (score > bestScore) bestScore = score;
    });

    if (typeof DataService !== 'undefined') {
      for (const c of DataService.getCourses()) {
        if (_containsKeyword(norm, c.title)) return true;
        if (c.tags.some(t => _containsKeyword(norm, t))) return true;
      }
    }

    if (bestScore >= 2 && !hasOffTopic) return true;

    if (hasOffTopic) return false;

    if (/^(que es|que son|como|explicame|define|significa|ayuda|diferencia|para que)/.test(norm)) {
      return false;
    }

    return false;
  }

  function _normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s?]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function _scoreTopic(normQuery, topic) {
    let score = 0;
    for (const kw of topic.keywords) {
      const nkw = _normalize(kw);
      if (normQuery.includes(nkw)) score += nkw.split(' ').length + 2;
      else {
        nkw.split(' ').forEach(word => {
          if (word.length > 3 && normQuery.includes(word)) score += 1;
        });
      }
    }
    return score;
  }

  function findResponse(userMessage) {
    const norm = _normalize(userMessage);
    if (!norm) {
      return 'Escribe tu pregunta sobre IN4MIND y con gusto te ayudo.';
    }

    if (!isInScope(userMessage)) {
      return getOffTopicResponse();
    }

    let best = null;
    let bestScore = 0;

    TOPICS.forEach(topic => {
      const score = _scoreTopic(norm, topic);
      if (score > bestScore) {
        bestScore = score;
        best = topic;
      }
    });

    if (best && bestScore >= 2) {
      return best.respond(userMessage, norm);
    }

    // Coincidencia por curso de DataService
    if (typeof DataService !== 'undefined') {
      const courses = DataService.getCourses();
      for (const c of courses) {
        const titleNorm = _normalize(c.title);
        if (norm.includes(titleNorm) || c.tags.some(t => norm.includes(_normalize(t)))) {
          const hint = COURSE_HINTS[c.id] || c.desc;
          return `Sobre **${c.title}** en IN4MIND:\n\n${hint}\n\n${_courseLink(c.id, c.title)}`;
        }
      }
    }

    if (/^(que es|que son|como funciona|explicame|define|significa)/.test(norm)) {
      return `Entiendo tu pregunta sobre "${userMessage.trim()}".\n\n` +
        `En IN4MIND puedes explorar cursos relacionados en **Tutoriales** y reforzar con **Quizzes**.\n\n` +
        `Prueba preguntarme de forma más específica, por ejemplo:\n` +
        `- "¿Qué es Python en IN4MIND?"\n` +
        `- "¿Cómo funcionan los tutoriales en IN4MIND?"\n` +
        `- "Explícame selectores CSS"`;
    }

    return getOffTopicResponse();
  }

  function getSuggestions() {
    return [
      { label: '¿Qué es IN4MIND?', msg: '¿Qué es IN4MIND y qué puedo aprender?' },
      { label: 'Empezar a programar', msg: '¿Por dónde debo empezar si quiero aprender a programar desde cero?' },
      { label: 'Usar tutoriales', msg: '¿Cómo funcionan los tutoriales en IN4MIND?' },
      { label: 'Quizzes', msg: '¿Cómo funcionan los quizzes en IN4MIND?' },
      { label: 'Python', msg: '¿Qué es Python y para qué sirve?' },
      { label: 'Ciberseguridad', msg: '¿Qué es el phishing y cómo me protejo?' },
    ];
  }

  return { findResponse, getSuggestions, isInScope, getOffTopicResponse, _normalize };

})();

if (typeof module !== 'undefined') module.exports = AIKnowledge;
