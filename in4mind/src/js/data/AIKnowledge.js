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
    flowchart: 'Diagrama de flujo — modelado de procesos con símbolos estándar y decisiones.',
    os: 'Sistema operativo — archivos, permisos, procesos, red y productividad.',
    powerapps: 'Power Apps — aplicaciones low-code con Microsoft 365 y Power Automate.',
    sharepoint: 'SharePoint — sitios, bibliotecas, coautoría y permisos en M365.',
    outlook: 'Outlook — correo profesional, calendario, reglas y tareas.',
    onedrive: 'OneDrive — sincronización, compartir seguro y coedición en la nube.',
    scrum: 'Scrum — sprints, user stories, tablero Kanban y retrospectivas.',
    scratch: 'Scratch — programación visual por bloques para educación.',
    'video-editing': 'Edición de videos — timeline, audio, títulos y exportación.',
    django: 'Django — framework web Python con ORM, plantillas y admin.',
    powerbi: 'Power BI — Power Query, DAX, modelado y dashboards.',
    'prompt-engineering': 'Prompt Engineering — técnicas para IA generativa.',
    engineering: 'Ingeniería de software — requisitos, arquitectura, pruebas y DevOps.',
    'game-editing': 'Edición de videojuegos — motores, assets, física, UI y publicación.',
  };

  function _coursesList() {
    if (typeof DataService === 'undefined') {
      return Object.entries(COURSE_HINTS).map(([id, desc]) => `- **${id}**: ${desc}`).join('\n');
    }
    return DataService.getCourses().map(c =>
      `- **${c.title}** (${c.category}): ${c.desc}`
    ).join('\n');
  }

  function _locale() {
    if (typeof I18n === 'undefined') return 'es';
    const l = I18n.getLocale();
    if (l === 'en' || l === 'zh') return l;
    return 'es';
  }

  function _courseLink(courseId, courseTitle) {
    const loc = _locale();
    if (loc === 'en') {
      return `Open **Courses**, choose **${courseTitle}**, and click *Start Learning*. You also have a dedicated quiz in **Quizzes**.`;
    }
    if (loc === 'zh') {
      return `打开 **课程**，选择 **${courseTitle}**，然后点击 *开始学习*。您还可以在 **测验** 中找到专属测验。`;
    }
    return `Abre **Cursos**, elige **${courseTitle}** y pulsa *Empieza a Aprender*. También tienes un quiz dedicado en **Quizzes**.`;
  }

  const GENERIC_TOPIC_IDS = new Set([
    'in4mind_platform',
    'in4mind_brand',
    'in4mind_tutorials',
    'in4mind_quizzes',
    'in4mind_dashboard',
    'in4mind_courses',
    'ai_section',
  ]);

  function _lessonById(courseId, lessonId) {
    if (typeof CourseCurriculum === 'undefined') return null;
    return CourseCurriculum.getLessons(courseId)?.find(l => l.id === lessonId) || null;
  }

  function _L(es, en, zh) {
    const loc = _locale();
    if (loc === 'en') return en;
    if (loc === 'zh') return zh;
    return es;
  }

  function _formatLessonSteps(lesson) {
    if (!lesson?.steps?.length) return '';
    const lines = lesson.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const tip = lesson.tip ? `\n\n💡 ${lesson.tip}` : '';
    return `\n\n**${lesson.title}** (IN4MIND):\n${lines}${tip}`;
  }

  function _platformOverview() {
    return _L(
      `**IN4MIND** es una plataforma educativa para aprender tecnología de forma clara, moderna y accesible.\n\n` +
      `Incluye:\n` +
      `- **Dashboard**: cursos destacados y progreso reciente\n` +
      `- **Cursos**: lecciones por curso con pasos prácticos\n` +
      `- **Quizzes**: evaluaciones con opción múltiple, V/F y pareos\n` +
      `- **IA** (aquí): asistente para resolver dudas al instante\n\n` +
      `Cursos disponibles:\n${_coursesList()}`,
      `**IN4MIND** is an educational platform to learn technology clearly, modernly, and accessibly.\n\n` +
      `It includes:\n` +
      `- **Dashboard**: featured courses and recent progress\n` +
      `- **Courses**: step-by-step lessons per course\n` +
      `- **Quizzes**: multiple choice, true/false, and matching assessments\n` +
      `- **AI** (here): assistant for instant help\n\n` +
      `Available courses:\n${_coursesList()}`,
      `**IN4MIND** 是一个清晰、现代、易用的技术学习平台。\n\n` +
      `包含：\n` +
      `- **仪表盘**：精选课程与最近进度\n` +
      `- **课程**：分步骤的课程课时\n` +
      `- **测验**：选择题、判断题与配对题\n` +
      `- **AI**（此处）：即时答疑助手\n\n` +
      `可用课程：\n${_coursesList()}`
    );
  }

  const TOPICS = [
    {
      id: 'greeting',
      keywords: ['hola', 'buenas', 'hey', 'saludos', 'buenos dias', 'buenas tardes', 'buenas noches', 'que tal', 'hello', 'hi', 'good morning', 'good afternoon', '你好', '您好', '早上好', '下午好', '晚上好'],
      respond: () => _L(
        `¡Hola! Soy el **Asistente IN4MIND**, tu guía en tecnología y en esta plataforma.\n\n` +
        `Puedo ayudarte con:\n` +
        `- Conceptos de programación, web, diseño, datos y herramientas de oficina\n` +
        `- Cómo usar IN4MIND: cursos, quizzes, dashboard e IA\n` +
        `- Recomendaciones de por dónde empezar según tu objetivo\n\n` +
        `¿Qué te gustaría aprender hoy?`,
        `Hello! I'm the **IN4MIND Assistant**, your guide to technology and this platform.\n\n` +
        `I can help with:\n` +
        `- Programming, web, design, data, and office tools\n` +
        `- Using IN4MIND: courses, quizzes, dashboard, and AI\n` +
        `- Recommendations on where to start based on your goal\n\n` +
        `What would you like to learn today?`,
        `你好！我是 **IN4MIND 助手**，你的技术与平台向导。\n\n` +
        `我可以帮助：\n` +
        `- 编程、Web、设计、数据与办公工具\n` +
        `- 使用 IN4MIND：课程、测验、仪表盘与 AI\n` +
        `- 根据你的目标推荐学习路径\n\n` +
        `今天想学什么？`
      ),
    },
    {
      id: 'thanks',
      keywords: ['gracias', 'thank', 'genial', 'perfecto', 'excelente', 'muy bien', 'te lo agradezco', '谢谢', '感谢', '多谢'],
      respond: () => _L(
        `¡Con mucho gusto! Me alegra haberte sido útil.\n\n` +
        `Recuerda que en IN4MIND puedes reforzar lo aprendido con lecciones paso a paso y quizzes interactivos.\n\n` +
        `Cuando quieras, sigue preguntando. Estoy aquí para ayudarte.`,
        `You're welcome! Glad I could help.\n\n` +
        `Remember that in IN4MIND you can reinforce what you learn with step-by-step lessons and interactive quizzes.\n\n` +
        `Feel free to keep asking — I'm here to help.`,
        `不客气！很高兴能帮到你。\n\n` +
        `在 IN4MIND 中，你可以通过分步课时和互动测验巩固所学。\n\n` +
        `随时继续提问，我在这里为你服务。`
      ),
    },
    {
      id: 'bye',
      keywords: ['adios', 'chao', 'hasta luego', 'nos vemos', 'bye', '再见', '拜拜', '回头见'],
      respond: () => _L(
        `¡Hasta pronto! Sigue aprendiendo a tu ritmo en IN4MIND.\n\n` +
        `Tip: revisa la sección **Recién vistos** en el Dashboard para retomar donde lo dejaste.`,
        `See you soon! Keep learning at your own pace in IN4MIND.\n\n` +
        `Tip: check **Recently viewed** on the Dashboard to pick up where you left off.`,
        `再见！在 IN4MIND 中按自己的节奏继续学习。\n\n` +
        `提示：在仪表盘的 **最近浏览** 中可快速回到上次学习的内容。`
      ),
    },
    {
      id: 'phishing',
      keywords: [
        'phishing', 'correo fraudulento', 'correo falso', 'suplantacion', 'suplantacion de identidad',
        'enlace sospechoso', 'smishing', 'vishing', 'ingenieria social', 'correo sospechoso',
        'email fraudulento', 'fake email', 'social engineering',
        'proteger', 'protejo', 'proteccion', 'protect', 'protection',
      ],
      respond: () => {
        const loc = _locale();
        const lesson = _lessonById('cybersecurity', 'cybersecurity-l2');
        if (loc === 'en') {
          return (
            `**Phishing** is a digital fraud where attackers impersonate trusted entities (banks, services, colleagues) to steal credentials, data, or money.\n\n` +
            `**How it works:** fake emails, SMS, or messages with urgent language and links to cloned sites.\n\n` +
            `**How to protect yourself (IN4MIND):**\n` +
            `- Check the **real sender and domain** — not just the display name\n` +
            `- Be wary of **artificial urgency** or threats ("your account will be closed")\n` +
            `- **Do not click** suspicious links or open unexpected attachments\n` +
            `- **Verify sensitive requests** through another channel (phone, official app)\n` +
            `- **Report** suspicious messages to your security team or provider\n` +
            _formatLessonSteps(lesson) +
            `\n\n${_courseLink('cybersecurity', 'Cybersecurity')}`
          );
        }
        if (loc === 'zh') {
          return (
            `**钓鱼攻击**是一种数字欺诈：攻击者冒充银行、服务商或同事等可信实体，窃取凭据、数据或资金。\n\n` +
            `**常见方式：** 伪造邮件、短信或消息，使用紧迫话术并链接到克隆网站。\n\n` +
            `**如何防护（IN4MIND）：**\n` +
            `- 核对**真实发件人与域名**——不要只看显示名称\n` +
            `- 警惕**人为制造的紧迫感**或威胁（如「账户将被关闭」）\n` +
            `- **不要点击**可疑链接或打开意外附件\n` +
            `- 通过**其他渠道验证**敏感请求（电话、官方 App）\n` +
            `- **举报**可疑消息给安全团队或服务商\n` +
            _formatLessonSteps(lesson) +
            `\n\n${_courseLink('cybersecurity', '网络安全')}`
          );
        }
        return (
          `**Phishing** es un fraude digital donde atacantes suplantan entidades de confianza (bancos, servicios, compañeros) para robar credenciales, datos o dinero.\n\n` +
          `**Cómo funciona:** correos, SMS o mensajes falsos con lenguaje urgente y enlaces a sitios clonados.\n\n` +
          `**Cómo protegerte (según IN4MIND):**\n` +
          `- Revisa el **remitente y dominio real** — no solo el nombre visible\n` +
          `- Desconfía de la **urgencia artificial** o amenazas ("tu cuenta será cerrada")\n` +
          `- **No hagas clic** en enlaces sospechosos ni abras adjuntos inesperados\n` +
          `- **Verifica solicitudes sensibles** por otro canal (teléfono, app oficial)\n` +
          `- **Reporta** mensajes sospechosos al equipo de seguridad o al proveedor\n` +
          _formatLessonSteps(lesson) +
          `\n\n${_courseLink('cybersecurity', 'Ciberseguridad')}`
        );
      },
    },
    {
      id: 'in4mind_platform',
      keywords: ['que es in4mind', 'what is in4mind', 'sobre in4mind', 'about in4mind', 'esta app', 'this app', 'esta pagina', 'this site'],
      respond: () => _platformOverview(),
    },
    {
      id: 'in4mind_brand',
      keywords: ['in4mind', 'plataforma', 'platform'],
      respond: () => _platformOverview(),
    },
    {
      id: 'in4mind_tutorials',
      keywords: ['tutorial', 'tutoriales', 'leccion', 'lecciones', 'como estudiar', 'empieza a aprender', 'ver curso', '教程', '课时', '如何学习', '开始学习'],
      respond: () => _L(
        `En **Cursos** encontrarás todos los cursos organizados por categoría.\n\n` +
        `Cómo usarlos:\n` +
        `1. Elige un curso (Python, HTML, Figma, etc.) y pulsa **Ver**\n` +
        `2. Revisa las **carátulas de cada apartado** y la ruta de aprendizaje\n` +
        `3. Abre una lección: verás pasos numerados, consejos y barra de progreso\n` +
        `4. Al finalizar, usa **Quiz de [curso]** para practicar\n\n` +
        `Desde el Dashboard también puedes abrir un curso desde las tarjetas o desde **Recién vistos**.`,
        `In **Courses** you'll find all courses organized by category.\n\n` +
        `How to use them:\n` +
        `1. Pick a course (Python, HTML, Figma, etc.) and click **View**\n` +
        `2. Review section covers and the learning path\n` +
        `3. Open a lesson: numbered steps, tips, and progress bar\n` +
        `4. When done, use **Quiz for [course]** to practice\n\n` +
        `From the Dashboard you can also open courses from cards or **Recently viewed**.`,
        `在 **课程** 中可按分类浏览全部课程。\n\n` +
        `使用方法：\n` +
        `1. 选择课程（Python、HTML、Figma 等）并点击 **查看**\n` +
        `2. 浏览各章节封面与学习路径\n` +
        `3. 打开课时：分步说明、提示与进度条\n` +
        `4. 学完后使用 **课程测验** 巩固\n\n` +
        `也可从仪表盘的课程卡片或 **最近浏览** 进入。`
      ),
    },
    {
      id: 'in4mind_quizzes',
      keywords: ['quiz', 'quizzes', 'evaluacion', 'examen', 'preguntas', 'conocimiento general', 'practicar', '测验', '考试', '练习'],
      respond: () => _L(
        `Los **Quizzes** de IN4MIND ponen a prueba lo que aprendiste con preguntas variadas.\n\n` +
        `- Cada curso tiene su **quiz dedicado** (Canvas, Python, SQL, Figma, etc.)\n` +
        `- **Conocimiento General** mezcla preguntas de todas las herramientas\n` +
        `- Tipos: opción múltiple, verdadero/falso y pareos\n` +
        `- Tu progreso se guarda en la sesión\n\n` +
        `Tip: desde una lección de curso, el botón **Quiz de [curso]** te lleva directo al quiz correcto.`,
        `IN4MIND **Quizzes** test what you learned with varied questions.\n\n` +
        `- Each course has a **dedicated quiz** (Canvas, Python, SQL, Figma, etc.)\n` +
        `- **General Knowledge** mixes questions from all tools\n` +
        `- Types: multiple choice, true/false, and matching\n` +
        `- Your progress is saved in the session\n\n` +
        `Tip: from a course lesson, **Quiz for [course]** goes straight to the right quiz.`,
        `IN4MIND **测验** 用多种题型检验所学。\n\n` +
        `- 每门课程有**专属测验**（Canvas、Python、SQL、Figma 等）\n` +
        `- **综合知识** 混合各工具题目\n` +
        `- 题型：选择题、判断题、配对题\n` +
        `- 进度保存在当前会话\n\n` +
        `提示：在课程课时的 **课程测验** 按钮可直达对应测验。`
      ),
    },
    {
      id: 'in4mind_dashboard',
      keywords: ['dashboard', 'inicio', 'home', 'recien vistos', 'destacados', 'ver todos', '仪表盘', '首页', '最近浏览', '精选'],
      respond: () => _L(
        `El **Dashboard** es tu punto de partida en IN4MIND.\n\n` +
        `- **Destacados** y **Sigue aprendiendo**: carruseles de cursos\n` +
        `- **Ver todos**: expande la lista completa\n` +
        `- **Recién vistos**: retoma lecciones con un clic\n` +
        `- Buscador superior: filtra cursos por nombre o tema\n\n` +
        `Desde cualquier tarjeta puedes ir directo al curso.`,
        `The **Dashboard** is your starting point in IN4MIND.\n\n` +
        `- **Featured** and **Keep learning**: course carousels\n` +
        `- **View all**: expands the full list\n` +
        `- **Recently viewed**: resume lessons in one click\n` +
        `- Top search: filter courses by name or topic\n\n` +
        `From any card you can go straight to the course.`,
        `**仪表盘** 是 IN4MIND 的起点。\n\n` +
        `- **精选** 与 **继续学习**：课程轮播\n` +
        `- **查看全部**：展开完整列表\n` +
        `- **最近浏览**：一键继续学习\n` +
        `- 顶部搜索：按名称或主题筛选\n\n` +
        `任意课程卡片可直达课程。`
      ),
    },
    {
      id: 'in4mind_courses',
      keywords: ['cursos', 'que puedo aprender', 'catalogo', 'lista de cursos', 'temas disponibles', '课程', '学什么', '目录'],
      respond: () => _L(
        `Estos son los cursos que IN4MIND ofrece hoy:\n\n${_coursesList()}\n\n` +
        `Filtra por categoría en Cursos: Web, Programación, Diseño, Office, Datos, Ciberseguridad y Herramientas.`,
        `These are the courses IN4MIND offers today:\n\n${_coursesList()}\n\n` +
        `Filter by category in Courses: Web, Programming, Design, Office, Data, Cybersecurity, and Tools.`,
        `IN4MIND 目前提供以下课程：\n\n${_coursesList()}\n\n` +
        `在课程中可按分类筛选：Web、编程、设计、Office、数据、网络安全与工具。`
      ),
    },
    {
      id: 'cybersecurity',
      keywords: [
        'ciberseguridad', 'cybersecurity', 'seguridad informatica', 'seguridad digital',
        'phishing', 'malware', 'ransomware', 'contraseña', 'contraseñas', 'password',
        'mfa', 'autenticacion multifactor', '2fa', 'hacker', 'hackeo', 'firewall',
        'vpn', 'encriptacion', 'cifrado', 'vulnerabilidad', 'brecha', 'ingenieria social',
        'antivirus', 'backup', 'confidencialidad',
        '网络安全', '信息安全', '密码', '钓鱼', '恶意软件', '勒索软件',
      ],
      respond: () => _L(
        `**Ciberseguridad** protege sistemas, redes y datos frente a accesos no autorizados y amenazas digitales.\n\n` +
        `Temas clave en IN4MIND:\n` +
        `- **Principios CIA**: confidencialidad, integridad y disponibilidad\n` +
        `- **Phishing** e ingeniería social: cómo detectar correos y enlaces falsos\n` +
        `- **Contraseñas y MFA**: gestores de contraseñas y autenticación en dos pasos\n` +
        `- **Malware y ransomware**: prevención y respuesta\n` +
        `- **Buenas prácticas**: VPN, backups, actualizaciones y mínimo privilegio\n\n` +
        _courseLink('cybersecurity', 'Ciberseguridad'),
        `**Cybersecurity** protects systems, networks, and data from unauthorized access and digital threats.\n\n` +
        `Key topics in IN4MIND:\n` +
        `- **CIA principles**: confidentiality, integrity, availability\n` +
        `- **Phishing** and social engineering\n` +
        `- **Passwords and MFA**\n` +
        `- **Malware and ransomware**\n` +
        `- **Best practices**: VPN, backups, updates, least privilege\n\n` +
        _courseLink('cybersecurity', 'Cybersecurity'),
        `**网络安全** 保护系统、网络与数据免受未授权访问与数字威胁。\n\n` +
        `IN4MIND 关键主题：\n` +
        `- **CIA 原则**：机密性、完整性、可用性\n` +
        `- **钓鱼** 与社会工程\n` +
        `- **密码与 MFA**\n` +
        `- **恶意软件与勒索软件**\n` +
        `- **最佳实践**：VPN、备份、更新与最小权限\n\n` +
        _courseLink('cybersecurity', '网络安全')
      ),
    },
    {
      id: 'programming_start',
      keywords: ['empezar a programar', 'desde cero', 'principiante', 'por donde empiezo', 'aprender a programar', 'no se nada', '零基础', '入门', '从哪里开始', '学编程'],
      respond: () => _L(
        `Si recién comienzas, te recomiendo esta ruta en IN4MIND:\n\n` +
        `1. **HTML** — entiende la estructura de una página web\n` +
        `2. **CSS** — dale estilo y layout a lo que construiste\n` +
        `3. **JavaScript** — añade interactividad y lógica\n` +
        `4. **Python** — ideal para automatización, datos y scripts\n\n` +
        `Dedica 20–30 min diarios, completa las lecciones y refuerza con quizzes. La constancia marca la diferencia.`,
        `If you're just starting, I recommend this path in IN4MIND:\n\n` +
        `1. **HTML** — understand web page structure\n` +
        `2. **CSS** — style and layout what you built\n` +
        `3. **JavaScript** — add interactivity and logic\n` +
        `4. **Python** — great for automation, data, and scripts\n\n` +
        `Spend 20–30 minutes daily, complete lessons, and reinforce with quizzes. Consistency matters.`,
        `若你刚开始学习，建议在 IN4MIND 按此路径：\n\n` +
        `1. **HTML** — 理解网页结构\n` +
        `2. **CSS** — 为页面添加样式与布局\n` +
        `3. **JavaScript** — 增加交互与逻辑\n` +
        `4. **Python** — 适合自动化、数据与脚本\n\n` +
        `每天 20–30 分钟，完成课时并用测验巩固。坚持最重要。`
      ),
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
      keywords: ['esta seccion', 'este chat', 'asistente', 'bot', 'ia in4mind', 'inteligencia artificial', '助手', '聊天', '人工智能'],
      respond: () => _L(
        `Estás en el **Asistente IA de IN4MIND** — un chat educativo integrado en la plataforma.\n\n` +
        `Solo respondo consultas sobre **IN4MIND** y su catálogo de cursos (programación, web, diseño, datos, ciberseguridad y más).\n\n` +
        `Escríbeme, por ejemplo: "¿Qué es Flexbox?", "¿Cómo abro un quiz de Python?" o "¿Cómo funciona mi perfil en IN4MIND?".`,
        `You're in the **IN4MIND AI Assistant** — an educational chat built into the platform.\n\n` +
        `I only answer questions about **IN4MIND** and its course catalog (programming, web, design, data, cybersecurity, and more).\n\n` +
        `Try: "What is Flexbox?", "How do I open the Python quiz?" or "How does my profile work in IN4MIND?".`,
        `您正在使用 **IN4MIND AI 助手** — 平台内置的教育聊天。\n\n` +
        `我只回答与 **IN4MIND** 及其课程目录相关的问题（编程、Web、设计、数据、网络安全等）。\n\n` +
        `例如：「什么是 Flexbox？」「如何打开 Python 测验？」「IN4MIND 的资料如何运作？」`
      ),
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
    'in4mind', 'plataforma', 'platform', 'dashboard', 'tutorial', 'tutorials', 'tutoriales',
    'quiz', 'quizzes', 'leccion', 'lecciones', 'lesson', 'lessons', 'curso', 'cursos',
    'course', 'courses', 'perfil', 'profile', 'favorito', 'favoritos', 'favorite', 'favorites',
    'guardado', 'guardados', 'saved', 'certificacion', 'certificaciones', 'certification',
    'certifications', 'login', 'sesion', 'session', 'recien vistos', 'recently viewed',
    'destacados', 'featured', 'asistente', 'assistant', 'sidebar', 'modo oscuro', 'dark mode',
    'help center', 'centro de ayuda',
    '教程', '测验', '课程', '平台', '仪表盘', '资料', '收藏', '认证', '登录', '会话',
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
    if (typeof I18n !== 'undefined') {
      const full = I18n.t('ai.offTopicFull');
      if (full && typeof full === 'string' && full !== 'ai.offTopicFull') return full;
    }
    return `**Consulta fuera del alcance de IN4MIND**\n\n` +
      `Solo puedo ayudarte con temas relacionados con **IN4MIND**: la plataforma, sus cursos, quizzes, perfil, certificaciones y el catálogo que ofrecemos.\n\n` +
      `Por favor, formula preguntas sobre IN4MIND, por ejemplo:\n` +
      `- "¿Cómo funcionan los cursos en IN4MIND?"\n` +
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

    const genericQuestion = /^(que es|que son|como|explicame|define|significa|ayuda|diferencia|para que|what is|what are|how do|how to|how can|explain|tell me about|help me)/.test(norm);
    if (genericQuestion && !hasPlatform && !hasCurriculum && bestScore < 2) {
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

  function _isContextualIn4mindRef(norm) {
    return /(?:segun|en|de|about|from|in|according to)\s+in4mind\s*$/.test(norm);
  }

  function _pickBestTopic(norm) {
    let candidates = TOPICS.map(topic => ({
      topic,
      score: _scoreTopic(norm, topic),
      generic: GENERIC_TOPIC_IDS.has(topic.id),
    })).filter(c => c.score >= 2);

    const contextual = _isContextualIn4mindRef(norm);
    const hasSpecific = candidates.some(c => !c.generic && c.score >= 2);

    if (contextual && hasSpecific) {
      candidates = candidates.map(c =>
        c.generic ? { ...c, score: c.score - 10 } : c
      );
    }

    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.generic !== b.generic) return a.generic ? 1 : -1;
      return 0;
    });

    return candidates[0]?.topic ?? null;
  }

  function findResponse(userMessage) {
    const norm = _normalize(userMessage);
    if (!norm) {
      return typeof I18n !== 'undefined' ? I18n.t('ai.emptyPrompt') : 'Escribe tu pregunta sobre IN4MIND y con gusto te ayudo.';
    }

    if (!isInScope(userMessage)) {
      return getOffTopicResponse();
    }

    const best = _pickBestTopic(norm);
    if (best) {
      return best.respond(userMessage, norm);
    }

    // Coincidencia por curso de DataService
    if (typeof DataService !== 'undefined') {
      const courses = DataService.getCourses();
      for (const c of courses) {
        const titleNorm = _normalize(c.title);
        if (norm.includes(titleNorm) || c.tags.some(t => norm.includes(_normalize(t)))) {
          const hint = c.desc || COURSE_HINTS[c.id] || '';
          return _L(
            `Sobre **${c.title}** en IN4MIND:\n\n${hint}\n\n${_courseLink(c.id, c.title)}`,
            `About **${c.title}** in IN4MIND:\n\n${hint}\n\n${_courseLink(c.id, c.title)}`,
            `关于 IN4MIND 中的 **${c.title}**：\n\n${hint}\n\n${_courseLink(c.id, c.title)}`
          );
        }
      }
    }

    if (/^(que es|que son|como funciona|explicame|define|significa|什么是|如何|解释|介绍)/.test(norm)) {
      return _L(
        `Entiendo tu pregunta sobre "${userMessage.trim()}".\n\n` +
        `En IN4MIND puedes explorar cursos relacionados en **Cursos** y reforzar con **Quizzes**.\n\n` +
        `Prueba preguntarme de forma más específica, por ejemplo:\n` +
        `- "¿Qué es Python en IN4MIND?"\n` +
        `- "¿Cómo funcionan los cursos en IN4MIND?"\n` +
        `- "Explícame selectores CSS"`,
        `I understand your question about "${userMessage.trim()}".\n\n` +
        `In IN4MIND you can explore related courses in **Courses** and reinforce with **Quizzes**.\n\n` +
        `Try asking more specifically, for example:\n` +
        `- "What is Python in IN4MIND?"\n` +
        `- "How do courses work in IN4MIND?"\n` +
        `- "Explain CSS selectors"`,
        `我理解你关于「${userMessage.trim()}」的问题。\n\n` +
        `在 IN4MIND 可在 **课程** 中探索相关课程，并在 **测验** 中巩固。\n\n` +
        `请尝试更具体地提问，例如：\n` +
        `- "IN4MIND 中的 Python 是什么？"\n` +
        `- "IN4MIND 的课程如何使用？"\n` +
        `- "解释 CSS 选择器"`
      );
    }

    return getOffTopicResponse();
  }

  function getSuggestions() {
    if (typeof I18n !== 'undefined') {
      return [
        { label: I18n.t('ai.sug1Label'), msg: I18n.t('ai.sug1Msg') },
        { label: I18n.t('ai.sug2Label'), msg: I18n.t('ai.sug2Msg') },
        { label: I18n.t('ai.sug3Label'), msg: I18n.t('ai.sug3Msg') },
        { label: I18n.t('ai.sug4Label'), msg: I18n.t('ai.sug4Msg') },
      ];
    }
    return [
      { label: '¿Qué es IN4MIND?', msg: '¿Qué es IN4MIND y qué puedo aprender?' },
      { label: 'Empezar a programar', msg: '¿Por dónde debo empezar si quiero aprender a programar desde cero?' },
      { label: 'Usar cursos', msg: '¿Cómo funcionan los cursos en IN4MIND?' },
      { label: 'Quizzes', msg: '¿Cómo funcionan los quizzes en IN4MIND?' },
    ];
  }

  return { findResponse, getSuggestions, isInScope, getOffTopicResponse, _normalize };

})();

if (typeof module !== 'undefined') module.exports = AIKnowledge;
