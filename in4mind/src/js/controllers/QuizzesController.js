/**
 * IN4MIND — QuizzesController
 * Quizzes con secciones y tipos variados: opción múltiple, V/F y pareos.
 */

'use strict';

const QuizzesController = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') return I18n.t(k, p);
    return fb ?? '';
  }

  function _typeLabels() {
    return {
      choice:    _t('quizzes.typeChoice', null, 'Opción múltiple'),
      truefalse: _t('quizzes.typeTrueFalse', null, 'Verdadero o Falso'),
      match:     _t('quizzes.typeMatch', null, 'Pareos'),
    };
  }

  function _categories() {
    return [
      { id: 'all',         label: _t('tutorial.all', null, 'Todos') },
      { id: 'web',         label: _t('tutorial.catWeb', null, 'Web') },
      { id: 'programming', label: _t('tutorial.catProgramming', null, 'Programación') },
      { id: 'design',      label: _t('tutorial.catDesign', null, 'Diseño') },
      { id: 'office',      label: _t('tutorial.catOffice', null, 'Office') },
      { id: 'data',        label: _t('tutorial.catData', null, 'Datos') },
      { id: 'security',    label: _t('tutorial.catSecurity', null, 'Ciberseguridad') },
      { id: 'tools',       label: _t('tutorial.catTools', null, 'Herramientas') },
    ];
  }

  /** Fallback si CourseCurriculum no está cargado */
  const _LEGACY_QUIZZES = [
    {
      id: 'canvas', title: 'Canvas', category: 'design',
      desc: 'Fundamentos de Diseño Digital.',
      icon: 'src/img/courses/canva.svg?v=20260713',
      sections: [
        {
          title: 'Conceptos básicos',
          questions: [
            { type: 'choice', q: '¿Qué es Canva?',
              opts: ['Un editor de video profesional', 'Una herramienta de diseño gráfico en línea', 'Un gestor de proyectos', 'Un IDE de programación'],
              ans: 1, exp: 'Canva es una plataforma de diseño gráfico accesible desde el navegador.' },
            { type: 'truefalse', q: 'Canva requiere instalar software pesado en tu computadora para diseñar.',
              ans: false, exp: 'Canva funciona principalmente en la web; no necesitas instalar un programa complejo.' },
            { type: 'choice', q: '¿Qué tipo de archivo permite exportar Canva para impresión de alta calidad?',
              opts: ['MP4', 'PDF', 'TXT', 'ZIP'],
              ans: 1, exp: 'El PDF mantiene buena resolución para materiales impresos.' },
          ],
        },
        {
          title: 'Herramientas y flujo',
          questions: [
            { type: 'match', q: 'Relaciona cada elemento de Canva con su función:',
              pairs: [
                { left: 'Plantilla', right: 'Diseño prediseñado editable' },
                { left: 'Elementos', right: 'Iconos, formas e ilustraciones' },
                { left: 'Brand Kit', right: 'Colores y tipografías de marca' },
                { left: 'Exportar', right: 'Descargar el diseño final' },
              ],
              exp: 'Dominar estos bloques acelera cualquier proyecto visual en Canva.' },
            { type: 'truefalse', q: 'Una plantilla en Canva es un diseño que puedes personalizar sin empezar desde cero.',
              ans: true, exp: 'Las plantillas son la base más rápida para crear contenido profesional.' },
          ],
        },
      ],
    },
    {
      id: 'figma', title: 'Figma', category: 'design',
      desc: 'UI/UX y diseño colaborativo.',
      icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      sections: [
        {
          title: 'Frames y layout',
          questions: [
            { type: 'choice', q: '¿Qué es un Frame en Figma?',
              opts: ['Un tipo de texto', 'Un contenedor que agrupa y define el tamaño de diseño', 'Una animación exportable', 'Un plugin de terceros'],
              ans: 1, exp: 'Los frames son contenedores base para pantallas, componentes y prototipos.' },
            { type: 'truefalse', q: 'Figma permite colaborar en tiempo real desde el navegador.',
              ans: true, exp: 'Varios diseñadores pueden editar el mismo archivo simultáneamente.' },
            { type: 'choice', q: '¿Para qué sirve el Layout Grid en un frame?',
              opts: ['Exportar a PDF', 'Alinear contenido con columnas y márgenes', 'Crear animaciones', 'Publicar en GitHub'],
              ans: 1, exp: 'Las grillas ayudan a mantener consistencia en interfaces responsivas.' },
          ],
        },
        {
          title: 'Componentes y prototipos',
          questions: [
            { type: 'match', q: 'Relaciona cada concepto de Figma con su función:',
              pairs: [
                { left: 'Componente', right: 'Elemento reutilizable con instancias' },
                { left: 'Auto Layout', right: 'Distribución automática de hijos' },
                { left: 'Prototype', right: 'Conectar frames con interacciones' },
                { left: 'Variant', right: 'Estados alternativos de un componente' },
              ],
              exp: 'Estos bloques aceleran diseño UI y handoff con desarrollo.' },
            { type: 'truefalse', q: 'Auto Layout ajusta espaciado y alineación cuando cambia el contenido.',
              ans: true, exp: 'Auto Layout hace interfaces más flexibles sin mover cada capa a mano.' },
            { type: 'choice', q: '¿Qué permite el modo Dev Mode en Figma?',
              opts: ['Editar código del servidor', 'Inspeccionar medidas, tokens y specs para desarrollo', 'Grabar video del diseño', 'Eliminar componentes'],
              ans: 1, exp: 'Dev Mode facilita el handoff con medidas, CSS y variables.' },
          ],
        },
      ],
    },
    {
      id: 'python', title: 'Python', category: 'programming',
      desc: 'Lógica y Automatización.',
      icon: 'src/img/courses/python.svg',
      sections: [
        {
          title: 'Sintaxis esencial',
          questions: [
            { type: 'choice', q: '¿Cuál es el resultado de: print(2 ** 3)?',
              opts: ['5', '6', '8', '9'],
              ans: 2, exp: 'El operador ** es potenciación. 2³ = 8.' },
            { type: 'truefalse', q: 'En Python, True y False son valores del tipo bool.',
              ans: true, exp: 'Los booleanos representan estados lógicos verdadero/falso.' },
            { type: 'choice', q: '¿Cómo se define una función en Python?',
              opts: ['function miFuncion():', 'def miFuncion():', 'fun miFuncion():', 'define miFuncion():'],
              ans: 1, exp: 'Las funciones se declaran con la palabra clave def.' },
          ],
        },
        {
          title: 'Estructuras de datos',
          questions: [
            { type: 'match', q: 'Relaciona cada función con lo que hace:',
              pairs: [
                { left: 'len()', right: 'Devuelve la cantidad de elementos' },
                { left: 'print()', right: 'Muestra texto en la consola' },
                { left: 'def', right: 'Define una función' },
                { left: 'list[]', right: 'Colección ordenada y mutable' },
              ],
              exp: 'Estos bloques son la base para escribir scripts útiles en Python.' },
            { type: 'truefalse', q: 'Una lista en Python puede cambiar sus elementos después de crearse.',
              ans: true, exp: 'Las listas son mutables: puedes modificar, agregar o quitar elementos.' },
          ],
        },
      ],
    },
    {
      id: 'excel', title: 'Excel', category: 'office',
      desc: 'Fórmulas y Funciones Clave.',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732220.png',
      sections: [
        {
          title: 'Fórmulas básicas',
          questions: [
            { type: 'choice', q: '¿Qué fórmula suma un rango de celdas en Excel?',
              opts: ['=TOTAL(A1:A10)', '=ADD(A1:A10)', '=SUM(A1:A10)', '=COUNT(A1:A10)'],
              ans: 2, exp: '=SUM() suma todos los valores numéricos del rango.' },
            { type: 'truefalse', q: 'El símbolo $ en una referencia de celda la hace absoluta al copiar la fórmula.',
              ans: true, exp: '$ ancla fila o columna para que no cambie al arrastrar la fórmula.' },
          ],
        },
        {
          title: 'Funciones avanzadas',
          questions: [
            { type: 'match', q: 'Relaciona cada función con su propósito:',
              pairs: [
                { left: 'VLOOKUP / BUSCARV', right: 'Buscar un valor en una tabla' },
                { left: 'SUMIF / SUMAR.SI', right: 'Sumar solo celdas que cumplen una condición' },
                { left: 'Tabla dinámica', right: 'Resumir y analizar grandes volúmenes de datos' },
                { left: 'Gráfico', right: 'Visualizar datos numéricamente' },
              ],
              exp: 'Estas herramientas convierten Excel en un motor de análisis empresarial.' },
            { type: 'choice', q: '¿Qué hace la función VLOOKUP (BUSCARV)?',
              opts: ['Busca un valor y retorna uno relacionado', 'Ordena alfabéticamente', 'Borra duplicados', 'Protege la hoja'],
              ans: 0, exp: 'BUSCARV encuentra un valor en la primera columna y devuelve otro de la misma fila.' },
          ],
        },
      ],
    },
    {
      id: 'html', title: 'HTML', category: 'web',
      desc: 'Arquitectura de Páginas HTML.',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732212.png',
      sections: [
        {
          title: 'Estructura del documento',
          questions: [
            { type: 'choice', q: '¿Qué etiqueta define el título principal visible de una página?',
              opts: ['<title>', '<head>', '<h1>', '<header>'],
              ans: 2, exp: '<h1> es el encabezado más importante del contenido visible.' },
            { type: 'truefalse', q: 'HTML significa HyperText Markup Language.',
              ans: true, exp: 'HTML es el lenguaje de marcado estándar de la web.' },
            { type: 'choice', q: '¿Cuál es la etiqueta correcta para insertar una imagen?',
              opts: ['<image src="">', '<img src="">', '<pic href="">', '<photo>'],
              ans: 1, exp: '<img> con el atributo src es la forma estándar de mostrar imágenes.' },
          ],
        },
        {
          title: 'Etiquetas semánticas',
          questions: [
            { type: 'match', q: 'Relaciona cada etiqueta con su uso principal:',
              pairs: [
                { left: '<nav>', right: 'Enlaces de navegación' },
                { left: '<article>', right: 'Contenido independiente y reutilizable' },
                { left: '<form>', right: 'Recoger datos del usuario' },
                { left: '<footer>', right: 'Información al final de la página' },
              ],
              exp: 'El HTML semántico mejora accesibilidad y SEO.' },
            { type: 'truefalse', q: 'La etiqueta <head> contiene metadatos que no se muestran directamente en la página.',
              ans: true, exp: '<head> incluye title, charset, enlaces a CSS y más.' },
          ],
        },
      ],
    },
    {
      id: 'css', title: 'CSS', category: 'web',
      desc: 'Estética y Experiencia Visual.',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732190.png',
      sections: [
        {
          title: 'Selectores y propiedades',
          questions: [
            { type: 'choice', q: '¿Qué significa CSS?',
              opts: ['Cascading Style Sheets', 'Computer Style System', 'Creative Styling Script', 'Colorful Site Structure'],
              ans: 0, exp: 'CSS = Cascading Style Sheets, el lenguaje de estilos de la web.' },
            { type: 'truefalse', q: 'La propiedad color cambia el color del texto de un elemento.',
              ans: true, exp: 'color aplica al texto; background-color al fondo.' },
            { type: 'choice', q: '¿Qué selector apunta a un elemento con id="titulo"?',
              opts: ['.titulo', 'titulo', '#titulo', '@titulo'],
              ans: 2, exp: '# selecciona por id único en el documento.' },
          ],
        },
        {
          title: 'Layout moderno',
          questions: [
            { type: 'match', q: 'Relaciona cada concepto CSS con su función:',
              pairs: [
                { left: 'Flexbox', right: 'Distribuir elementos en una fila o columna' },
                { left: 'Grid', right: 'Crear layouts en cuadrícula bidimensional' },
                { left: 'margin', right: 'Espacio exterior del elemento' },
                { left: 'padding', right: 'Espacio interior del elemento' },
              ],
              exp: 'Flexbox y Grid son los sistemas de layout más usados hoy en CSS.' },
            { type: 'truefalse', q: 'display: flex convierte un contenedor en un flex container.',
              ans: true, exp: 'Los hijos directos se convierten en flex items alineables con flexbox.' },
          ],
        },
      ],
    },
    {
      id: 'github', title: 'GitHub', category: 'tools',
      desc: 'Integración y Publicación de Proyectos.',
      icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      sections: [
        {
          title: 'Comandos Git',
          questions: [
            { type: 'choice', q: '¿Qué comando inicializa un repositorio Git local?',
              opts: ['git start', 'git init', 'git new', 'git create'],
              ans: 1, exp: '"git init" crea un repositorio Git en el directorio actual.' },
            { type: 'truefalse', q: '"git push" sube commits locales al repositorio remoto.',
              ans: true, exp: 'push envía tus cambios a GitHub u otro remoto.' },
          ],
        },
        {
          title: 'Colaboración',
          questions: [
            { type: 'match', q: 'Relaciona cada término Git/GitHub con su definición:',
              pairs: [
                { left: 'Commit', right: 'Instantánea de cambios guardada' },
                { left: 'Branch', right: 'Línea de desarrollo independiente' },
                { left: 'Pull Request', right: 'Propuesta para fusionar cambios' },
                { left: 'Clone', right: 'Copiar un repositorio remoto localmente' },
              ],
              exp: 'Estos conceptos son el corazón del trabajo en equipo con Git.' },
            { type: 'choice', q: '¿Qué es un "pull request" en GitHub?',
              opts: ['Descargar el repositorio', 'Proponer fusionar cambios de una rama', 'Borrar el historial', 'Crear un commit automático'],
              ans: 1, exp: 'Un PR permite revisar código antes de integrarlo a la rama principal.' },
          ],
        },
      ],
    },
    {
      id: 'javascript', title: 'JavaScript', category: 'web',
      desc: 'Lógica y Dinamismo Web.',
      icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
      sections: [
        {
          title: 'Fundamentos',
          questions: [
            { type: 'choice', q: '¿Cómo se declara una variable moderna en JavaScript?',
              opts: ['var x = 5', 'let x = 5', 'dim x = 5', 'int x = 5'],
              ans: 1, exp: 'let tiene alcance de bloque y es la forma recomendada hoy.' },
            { type: 'truefalse', q: 'JavaScript solo puede ejecutarse dentro de un navegador.',
              ans: false, exp: 'Con Node.js, JavaScript también corre en el servidor.' },
            { type: 'choice', q: '¿Qué método agrega un elemento al final de un array?',
              opts: ['.add()', '.append()', '.push()', '.insert()'],
              ans: 2, exp: '.push() modifica el array agregando uno o más elementos al final.' },
          ],
        },
        {
          title: 'DOM y APIs',
          questions: [
            { type: 'match', q: 'Relaciona cada método/propiedad con su función:',
              pairs: [
                { left: 'getElementById()', right: 'Seleccionar un elemento por id' },
                { left: 'addEventListener()', right: 'Escuchar eventos del usuario' },
                { left: 'fetch()', right: 'Hacer peticiones HTTP asíncronas' },
                { left: 'JSON.parse()', right: 'Convertir texto JSON a objeto' },
              ],
              exp: 'Estas APIs son esenciales para aplicaciones web interactivas.' },
            { type: 'truefalse', q: 'document.getElementById() retorna null si no encuentra el elemento.',
              ans: true, exp: 'Si el id no existe, el método devuelve null.' },
          ],
        },
      ],
    },
    {
      id: 'powerpoint', title: 'PowerPoint', category: 'office',
      desc: 'Diseño Visual Corporativo.',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732224.png',
      sections: [
        {
          title: 'Vistas y presentación',
          questions: [
            { type: 'choice', q: '¿Qué vista muestra todas las diapositivas en miniatura?',
              opts: ['Vista de lectura', 'Clasificador de diapositivas', 'Vista normal', 'Vista de esquema'],
              ans: 1, exp: 'El Clasificador permite reorganizar diapositivas visualmente.' },
            { type: 'truefalse', q: 'La tecla F5 inicia la presentación desde la primera diapositiva.',
              ans: true, exp: 'F5 es el atajo clásico para presentar desde el inicio.' },
          ],
        },
        {
          title: 'Diseño de diapositivas',
          questions: [
            { type: 'match', q: 'Relaciona cada concepto de PowerPoint con su descripción:',
              pairs: [
                { left: 'Transición', right: 'Efecto al cambiar de diapositiva' },
                { left: 'Animación', right: 'Movimiento de objetos dentro de una diapositiva' },
                { left: 'Slide Master', right: 'Plantilla maestra de diseño' },
                { left: 'Notas del presentador', right: 'Texto de apoyo visible solo para ti' },
              ],
              exp: 'Combinar bien estos elementos crea presentaciones profesionales.' },
            { type: 'choice', q: '¿Qué es una "transición" en PowerPoint?',
              opts: ['Un cambio de fuente', 'Efecto animado entre diapositivas', 'Una fórmula', 'Un tipo de gráfico'],
              ans: 1, exp: 'Las transiciones animan el paso de una diapositiva a la siguiente.' },
          ],
        },
      ],
    },
    {
      id: 'sql', title: 'SQL', category: 'data',
      desc: 'Consultas y bases de datos relacionales.',
      icon: 'src/img/courses/sql.svg',
      sections: [
        {
          title: 'Consultas básicas',
          questions: [
            { type: 'choice', q: '¿Qué cláusula filtra filas en una consulta SELECT?',
              opts: ['ORDER BY', 'WHERE', 'GROUP BY', 'JOIN'],
              ans: 1, exp: 'WHERE aplica condiciones antes de devolver o agrupar resultados.' },
            { type: 'truefalse', q: 'SQL significa Structured Query Language.',
              ans: true, exp: 'SQL es el lenguaje estándar para consultar bases de datos relacionales.' },
            { type: 'choice', q: '¿Qué hace ORDER BY en una consulta?',
              opts: ['Elimina duplicados', 'Ordena el resultado por una o más columnas', 'Crea una tabla nueva', 'Inserta registros'],
              ans: 1, exp: 'ORDER BY ordena filas ascendentemente o descendentemente.' },
          ],
        },
        {
          title: 'JOINs y agregaciones',
          questions: [
            { type: 'match', q: 'Relaciona cada cláusula SQL con su propósito:',
              pairs: [
                { left: 'INNER JOIN', right: 'Filas que coinciden en ambas tablas' },
                { left: 'GROUP BY', right: 'Agrupar filas para calcular totales' },
                { left: 'COUNT()', right: 'Contar filas o valores' },
                { left: 'HAVING', right: 'Filtrar grupos ya agregados' },
              ],
              exp: 'Dominar JOINs y agregaciones es clave para análisis con SQL.' },
            { type: 'truefalse', q: 'Un LEFT JOIN conserva todas las filas de la tabla izquierda aunque no haya coincidencia.',
              ans: true, exp: 'Las filas sin match en la derecha aparecen con NULL en esas columnas.' },
            { type: 'choice', q: '¿Para qué sirve crear un índice en una columna?',
              opts: ['Cambiar el tipo de dato', 'Acelerar búsquedas y filtros frecuentes', 'Borrar la tabla', 'Encriptar la base de datos'],
              ans: 1, exp: 'Los índices mejoran rendimiento en consultas con WHERE y JOIN.' },
          ],
        },
      ],
    },
    {
      id: 'cybersecurity', title: 'Ciberseguridad', category: 'security',
      desc: 'Protección de datos y sistemas.',
      icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png',
      sections: [
        {
          title: 'Fundamentos',
          questions: [
            { type: 'choice', q: '¿Qué significa el pilar de Confidencialidad en seguridad?',
              opts: ['Que los sistemas estén siempre encendidos', 'Que solo personas autorizadas accedan a la información', 'Que los datos se copien en la nube', 'Que el software sea gratuito'],
              ans: 1, exp: 'Confidencialidad garantiza que la información no se exponga a quienes no deben verla.' },
            { type: 'truefalse', q: 'La autenticación multifactor (MFA) añade una capa extra además de la contraseña.',
              ans: true, exp: 'MFA combina algo que sabes, tienes o eres; reduce drásticamente accesos no autorizados.' },
            { type: 'choice', q: '¿Cuál es un ejemplo de ingeniería social?',
              opts: ['Actualizar el antivirus', 'Un correo de phishing que suplanta a tu banco', 'Hacer backup de archivos', 'Usar HTTPS en un sitio web'],
              ans: 1, exp: 'Phishing manipula a la víctima para revelar datos o instalar malware.' },
          ],
        },
        {
          title: 'Amenazas y defensa',
          questions: [
            { type: 'match', q: 'Relaciona cada amenaza o control con su descripción:',
              pairs: [
                { left: 'Ransomware', right: 'Cifra datos y exige rescate' },
                { left: 'Phishing', right: 'Suplanta identidades para robar credenciales' },
                { left: 'Gestor de contraseñas', right: 'Almacena claves únicas de forma segura' },
                { left: 'VPN', right: 'Túnel cifrado en redes no confiables' },
              ],
              exp: 'Conocer amenazas y controles básicos es el primer paso en ciberseguridad.' },
            { type: 'truefalse', q: 'Reutilizar la misma contraseña en varios sitios es una práctica segura.',
              ans: false, exp: 'Si una cuenta se filtra, todas las demás con la misma clave quedan expuestas.' },
            { type: 'choice', q: '¿Qué debes hacer ante un correo sospechoso con adjunto?',
              opts: ['Abrirlo para verificar', 'Reenviarlo a todos', 'No abrirlo y reportarlo', 'Responder pidiendo confirmación al remitente'],
              ans: 2, exp: 'No interactúes con contenido sospechoso; repórtalo al equipo de seguridad.' },
          ],
        },
      ],
    },
  ];

  /** @type {QuizDef[]} */
  function _getQuizzes() {
    return typeof CourseCurriculum !== 'undefined'
      ? CourseCurriculum.getAllQuizzes().map(q => {
        const count = (q.sections || []).reduce((n, s) => n + (s.questions?.length || 0), 0);
        const meta = CourseCurriculum.getCertMeta(q.id);
        return {
          ...q,
          desc: typeof I18n !== 'undefined'
            ? I18n.t('quizDesc', { n: count, m: meta?.lessonCount ?? 0 })
            : `Evalúa ${count} temas alineados al curso${meta ? ` · ${meta.lessonCount} módulos` : ''}.`,
        };
      })
      : _LEGACY_QUIZZES;
  }

  const GENERAL_QUIZ_ID = 'general';
  const GENERAL_QUIZ_ICON = 'https://cdn-icons-png.flaticon.com/512/3976/3976625.png';

  let _activeFilter  = 'all';
  let _currentQuiz   = null;
  let _flatQuestions = [];
  let _currentQIdx   = 0;
  let _answers       = [];
  let _answered      = false;
  let _progress      = {};

  let $listView, $quizView, $resultsView;
  let $filtersWrap, $quizGrid, $continueGrid, $certExamGrid;
  let $quizName, $quizSection, $quizType, $quizProgLabel, $quizProgressFill;
  let $quizQuestion, $quizOptions, $quizFeedback, $btnNext;
  let $resPct, $resTitle, $resSub, $resCorrect, $resWrong, $resTotal, $reviewList;

  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _countQuestions(quiz) {
    return quiz.sections.reduce((n, s) => n + s.questions.length, 0);
  }

  function _flattenQuiz(quiz) {
    const flat = [];
    quiz.sections.forEach((sec, si) => {
      sec.questions.forEach(q => {
        flat.push({ ...q, sectionTitle: sec.title, sectionIndex: si });
      });
    });
    return flat;
  }

  function _loadProgress() {
    if (typeof UserProfileService !== 'undefined') {
      UserProfileService.migrateSessionQuizProgress();
      _progress = UserProfileService.getQuizProgress();
      return;
    }
    try {
      const raw = sessionStorage.getItem('in4mind_quiz_progress');
      _progress = raw ? JSON.parse(raw) : {};
    } catch {
      _progress = {};
    }
  }

  function _saveProgress(quizId, correct, total) {
    const quiz = _getQuizById(quizId);
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    if (typeof UserProfileService !== 'undefined') {
      const saved = UserProfileService.saveQuizProgress(quizId, correct, total, {
        title: quiz?.isCertExam
          ? _t('quizzes.saveExamTitle', { title: quiz?.title || quizId }, `Examen: ${quiz?.title || quizId}`)
          : (quiz?.title || quizId),
        icon: quiz?.icon || '',
      });
      _progress[quizId] = saved;
      if (typeof GamificationService !== 'undefined') {
        GamificationService.recordActivity('quiz', { quizId });
      }

      if (quiz?.isCertExam && quiz.courseId) {
        const certMeta = typeof CourseCurriculum !== 'undefined'
          ? CourseCurriculum.getCertMeta(quiz.courseId)
          : null;
        UserProfileService.tryAwardExamCertification(quiz.courseId, {
          title: `Certificación profesional: ${quiz.title}`,
          icon: quiz.icon || '',
          pct,
          desc: certMeta
            ? _t('quizzes.saveExamDesc', { pct, min: UserProfileService.EXAM_CERT_MIN_PCT, modules: certMeta.modules.join(', ') }, `Examen aprobado con ${pct}% (mín. ${UserProfileService.EXAM_CERT_MIN_PCT}%) · Módulos: ${certMeta.modules.join(', ')}`)
            : _t('quizzes.saveExamDescShort', { pct, title: quiz.title }, `Examen práctico aprobado con ${pct}% en ${quiz.title}`),
          modules: certMeta?.modules || [],
          levelsCovered: certMeta?.levelsCovered || [],
          lessonCount: certMeta?.lessonCount || 0,
        });
      } else {
        UserProfileService.tryAwardCertification(quizId, {
          title: _t('quizzes.saveCertTitle', { title: quiz?.title || quizId }, `Certificado: ${quiz?.title || quizId}`),
          icon: quiz?.icon || '',
          pct,
          desc: _t('quizzes.saveCertDesc', { pct, title: quiz?.title || quizId }, `Aprobado con ${pct}% en el quiz de ${quiz?.title || quizId}`),
        });
      }
    } else {
      _progress[quizId] = { correct, total, pct };
    }

    try {
      sessionStorage.setItem('in4mind_quiz_progress', JSON.stringify(_progress));
    } catch { /* ignore */ }
  }

  function _getPct(id) {
    return _progress[id]?.pct ?? 0;
  }

  function _buildGeneralQuiz() {
    const picked = _getQuizzes().map(quiz => {
      const flat = _flattenQuiz(quiz);
      const idx = Math.floor(Math.random() * flat.length);
      const q = flat[idx];
      return { ...q, q: `[${quiz.title}] ${q.q}` };
    });
    return {
      id: GENERAL_QUIZ_ID,
      title: _t('quizzes.generalKnowledge', null, 'Conocimiento General'),
      category: 'general',
      desc: _t('quizzes.bannerSub', null, 'Preguntas variadas de todas las herramientas.'),
      icon: GENERAL_QUIZ_ICON,
      sections: [{ title: _t('quizzes.sectionAllAreas', null, 'Todas las áreas'), questions: _shuffle(picked) }],
    };
  }

  function _getQuizById(id) {
    if (id === GENERAL_QUIZ_ID) return _buildGeneralQuiz();
    const certExam = typeof CertificationExamData !== 'undefined'
      ? CertificationExamData.getAllExams().find(e => e.id === id)
      : null;
    if (certExam) return certExam;
    return _getQuizzes().find(q => q.id === id) ?? null;
  }

  function _questionLabel(q) {
    if (q.type === 'match') return q.q;
    return q.q;
  }

  function _renderCertExamCard(exam, delay = 0) {
    const totalLessons = typeof TutorialData !== 'undefined'
      ? TutorialData.getLessons(exam.courseId).length
      : 0;
    const req = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCertificationRequirements(exam.courseId, totalLessons)
      : { examUnlocked: false, lessonStats: { completed: 0, total: totalLessons, avg: 0 }, quizPct: 0, quizPassed: false, lessonMinAvg: 80, quizMinPct: 70, examMinPct: 80 };
    const hasCert = typeof UserProfileService !== 'undefined'
      && UserProfileService.hasExamCertification(exam.courseId);
    const pct = _getPct(exam.id);

    let lockMsg;
    if (hasCert) {
      lockMsg = _t('quizzes.certEarnedRetry', { min: req.examMinPct }, `Certificación obtenida. Puedes reintentar para mejorar (mínimo ${req.examMinPct}% en examen).`);
    } else if (req.examUnlocked) {
      lockMsg = _t('quizzes.examUnlocked', { min: req.examMinPct }, `Examen desbloqueado. Necesitas ≥${req.examMinPct}% para obtener la certificación profesional.`);
    } else {
      const parts = [];
      if (!req.lessonStats.unlocked) {
        parts.push(_t('quizzes.examLockedLessonsLine', {
          completed: req.lessonStats.completed,
          total: req.lessonStats.total,
          min: req.lessonMinAvg,
          avg: req.lessonStats.avg,
        }, `Lecciones: ${req.lessonStats.completed}/${req.lessonStats.total} con promedio ≥${req.lessonMinAvg}% (actual ${req.lessonStats.avg}%)`));
      }
      if (!req.quizPassed) {
        parts.push(_t('quizzes.examLockedQuizLine', { min: req.quizMinPct, pct: req.quizPct }, `Quiz: ≥${req.quizMinPct}% requerido (tu mejor: ${req.quizPct}%)`));
      }
      lockMsg = parts.join(' · ');
    }

    return `
      <article class="quiz-card quiz-card--cert ${req.examUnlocked ? '' : 'quiz-card--locked'} ${hasCert ? 'quiz-card--earned' : ''} anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-quiz-id="${exam.id}" data-cert-exam="1" role="button" tabindex="0"
               aria-label="${_t('quizzes.examCardAria', { title: exam.title }, `Examen de certificación de ${exam.title}`)}">
        <div class="quiz-card__header">
          <div class="quiz-card__icon-wrap">
            <img src="${exam.icon}" alt="${exam.title}" loading="lazy" width="22" height="22">
          </div>
          <div>
            <h3 class="quiz-card__title">${exam.title}</h3>
            <p class="quiz-card__desc">${exam.desc}</p>
            <p class="quiz-card__types">${_t('quizzes.examPractical', { min: req.examMinPct }, `Examen práctico · Aprobación ≥${req.examMinPct}%`)}</p>
            <p class="quiz-card__lock-msg">${lockMsg}</p>
          </div>
        </div>
        <div>
          <div class="quiz-card__progress-bg">
            <div class="quiz-card__progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="quiz-card__controls">
            <span class="quiz-card__stat">${_t('quizzes.questionsLabel', { n: _countQuestions(exam) }, `${_countQuestions(exam)} Preguntas`)}</span>
            <span class="quiz-card__stat quiz-card__stat--ok">${hasCert ? _t('quizzes.certEarnedBadge', null, '🏆 Certificado') : `&#10003; ${pct}%`}</span>
            <button type="button" class="btn--quiz-start" data-quiz-id="${exam.id}" ${req.examUnlocked ? '' : 'disabled'}>
              ${req.examUnlocked ? _t('quizzes.presentExam', null, 'Presentar examen') : _t('quizzes.locked', null, 'Bloqueado')}
            </button>
          </div>
        </div>
      </article>`;
  }

  function _renderCertExams() {
    if (!$certExamGrid || typeof CertificationExamData === 'undefined') return;
    const exams = CertificationExamData.getAllExams();
    $certExamGrid.innerHTML = exams.length
      ? exams.map((exam, i) => _renderCertExamCard(exam, i)).join('')
      : `<p style="color:var(--clr-text-muted);font-size:.85rem;grid-column:1/-1">${_t('quizzes.noExams', null, 'No hay exámenes disponibles.')}</p>`;

    $certExamGrid.querySelectorAll('[data-quiz-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.btn--quiz-start')) e.stopPropagation();
        _startQuiz(el.dataset.quizId);
      });
      el.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && el.dataset.quizId) {
          e.preventDefault();
          _startQuiz(el.dataset.quizId);
        }
      });
    });

    $certExamGrid.querySelectorAll('.btn--quiz-start').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _startQuiz(btn.dataset.quizId);
      });
    });
  }

  function _renderCard(quiz, delay = 0) {
    const pct = _getPct(quiz.id);
    const total = _countQuestions(quiz);
    const types = [...new Set(quiz.sections.flatMap(s => s.questions.map(q => q.type)))];
    const labels = _typeLabels();
    const typeHint = types.map(t => labels[t] || t).join(' · ');
    const quizMin = UserProfileService?.QUIZ_UNLOCK_EXAM_PCT ?? 70;
    const passed = pct >= quizMin;
    const passHint = passed
      ? _t('quizzes.quizPassedUnlock', { min: quizMin }, `✓ Quiz aprobado (≥${quizMin}%) — desbloquea certificación junto con las lecciones`)
      : _t('quizzes.certGoal', { min: quizMin }, `Meta certificación: ≥${quizMin}% en este quiz`);
    return `
      <article class="quiz-card anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-quiz-id="${quiz.id}" role="button" tabindex="0"
               aria-label="${_t('quizzes.startQuizAria', { title: quiz.title }, `Iniciar quiz de ${quiz.title}`)}">
        <div class="quiz-card__header">
          <div class="quiz-card__icon-wrap">
            <img src="${quiz.icon}" alt="${quiz.title}" loading="lazy" width="22" height="22">
          </div>
          <div>
            <h3 class="quiz-card__title">${quiz.title}</h3>
            <p class="quiz-card__desc">${quiz.desc}</p>
            <p class="quiz-card__types">${_t('quizzes.sectionsCount', { n: quiz.sections.length, types: typeHint }, `${quiz.sections.length} apartados · ${typeHint}`)}</p>
            <p class="quiz-card__lock-msg ${passed ? 'quiz-card__lock-msg--ok' : ''}">${passHint}</p>
          </div>
        </div>
        <div>
          <div class="quiz-card__progress-bg">
            <div class="quiz-card__progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="quiz-card__controls">
            <span class="quiz-card__stat">${_t('quizzes.questionsLabel', { n: total }, `${total} Preguntas`)}</span>
            <span class="quiz-card__stat quiz-card__stat--ok">&#10003; ${pct}%</span>
            <button type="button" class="btn--quiz-start" data-quiz-id="${quiz.id}">${_t('quizzes.start', null, 'Empezar')}</button>
          </div>
        </div>
      </article>`;
  }

  function _renderFilters() {
    $filtersWrap.innerHTML = _categories().map(cat => `
      <button type="button" class="quiz-filter ${cat.id === _activeFilter ? 'quiz-filter--active' : ''}"
              data-filter="${cat.id}">${cat.label}</button>
    `).join('');

    $filtersWrap.querySelectorAll('.quiz-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeFilter = btn.dataset.filter;
        _renderFilters();
        _renderGrid();
      });
    });
  }

  function _renderGrid() {
    const filtered = _activeFilter === 'all'
      ? _getQuizzes()
      : _getQuizzes().filter(q => q.category === _activeFilter);

    $quizGrid.innerHTML = filtered.length
      ? filtered.map((q, i) => _renderCard(q, i)).join('')
      : `<p style="color:var(--clr-text-muted);font-size:.85rem;grid-column:1/-1">${_t('quizzes.emptyFilter', null, 'Sin resultados para este filtro.')}</p>`;

    $quizGrid.querySelectorAll('[data-quiz-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.btn--quiz-start')) e.stopPropagation();
        const id = e.currentTarget.dataset.quizId;
        if (id) _startQuiz(id);
      });
      el.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && e.currentTarget.dataset.quizId) {
          e.preventDefault();
          _startQuiz(e.currentTarget.dataset.quizId);
        }
      });
    });

    $quizGrid.querySelectorAll('.btn--quiz-start').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _startQuiz(btn.dataset.quizId);
      });
    });
  }

  function _renderContinue() {
    const inProgress = _getQuizzes().filter(q => {
      const p = _progress[q.id];
      return p && p.pct > 0 && p.pct < 100;
    }).slice(0, 2);

    if (!inProgress.length) {
      $continueGrid.closest('.continue-section').style.display = 'none';
      return;
    }

    $continueGrid.closest('.continue-section').style.display = '';
    $continueGrid.innerHTML = inProgress.map(q => {
      const p = _progress[q.id];
      return `
        <div class="continue-card" data-quiz-id="${q.id}" role="button" tabindex="0"
             aria-label="${_t('quizzes.continueQuizAria', { title: q.title }, `Continuar quiz de ${q.title}`)}">
          <div class="continue-card__left">
            <img src="${q.icon}" alt="${q.title}" width="28" height="28">
            <div>
              <div class="continue-card__title">${q.desc}</div>
              <div class="continue-card__meta">
                ${_t('quizzes.continueCorrect', { correct: p.correct, total: p.total, pct: p.pct }, `${p.correct}/${p.total} Correctas · ${p.pct}%`)}
              </div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round"
               stroke-linejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>`;
    }).join('');

    $continueGrid.querySelectorAll('.continue-card').forEach(card => {
      card.addEventListener('click', () => _startQuiz(card.dataset.quizId));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') _startQuiz(card.dataset.quizId);
      });
    });
  }

  function _showListView() {
    $listView.style.display = '';
    $quizView.classList.remove('quiz-view--visible');
    $resultsView.classList.remove('results-view--visible');
    _renderGrid();
    _renderContinue();
    _renderCertExams();
  }

  function _relocalize() {
    if (!$filtersWrap) return;
    _renderFilters();
    if ($resultsView?.classList.contains('results-view--visible') && _currentQuiz && _answers.length) {
      _showResults();
      return;
    }
    if ($quizView?.classList.contains('quiz-view--visible') && _currentQuiz) {
      const savedIdx = _currentQIdx;
      const savedAnswers = _answers;
      _currentQuiz = _getQuizById(_currentQuiz.id);
      _flatQuestions = _flattenQuiz(_currentQuiz);
      _currentQIdx = Math.min(savedIdx, Math.max(0, _flatQuestions.length - 1));
      _answers = savedAnswers;
      _renderQuestion();
      return;
    }
    _renderGrid();
    _renderContinue();
    _renderCertExams();
  }

  function _showQuizView() {
    $listView.style.display = 'none';
    $resultsView.classList.remove('results-view--visible');
    $quizView.classList.add('quiz-view--visible');
  }

  function _showResultsView() {
    $listView.style.display = 'none';
    $quizView.classList.remove('quiz-view--visible');
    $resultsView.classList.add('results-view--visible');
  }

  function _startQuiz(id) {
    const quiz = _getQuizById(id);
    if (!quiz) return;

    if (quiz.isCertExam && typeof UserProfileService !== 'undefined') {
      const totalLessons = typeof TutorialData !== 'undefined'
        ? TutorialData.getLessons(quiz.courseId).length
        : 0;
      if (!UserProfileService.isExamUnlocked(quiz.courseId, totalLessons)) {
        const req = UserProfileService.getCertificationRequirements(quiz.courseId, totalLessons);
        const parts = [];
        if (!req.lessonStats.unlocked) {
          parts.push(_t('quizzes.examLockedLessons', {
            completed: req.lessonStats.completed,
            total: req.lessonStats.total,
            min: req.lessonMinAvg,
            avg: req.lessonStats.avg,
          }, `lecciones ${req.lessonStats.completed}/${req.lessonStats.total} con promedio ≥${req.lessonMinAvg}% (actual ${req.lessonStats.avg}%)`));
        }
        if (!req.quizPassed) {
          parts.push(_t('quizzes.examLockedQuiz', { min: req.quizMinPct, pct: req.quizPct }, `quiz ≥${req.quizMinPct}% (tu mejor: ${req.quizPct}%)`));
        }
        const prefix = _t('quizzes.examLockedPrefix', null, 'Examen bloqueado');
        AppShell.showToast(parts.length ? `${prefix}: ${parts.join(_t('quizzes.andJoin', null, ' y '))}.` : prefix);
        return;
      }
      if (!UserProfileService.getCurrentUser()) {
        window.location.href = 'login.html';
        return;
      }
    }

    _currentQuiz   = quiz;
    _flatQuestions = _flattenQuiz(quiz);
    _currentQIdx   = 0;
    _answers       = [];
    _answered      = false;
    _showQuizView();
    _renderQuestion();
  }

  function _showFeedback(correct, exp, chosenLabel, correctLabel) {
    const q = _flatQuestions[_currentQIdx];
    _answers.push({
      q:            _questionLabel(q),
      type:         q.type,
      correct,
      chosenLabel:  chosenLabel || (correct ? 'Correcto' : 'Incorrecto'),
      correctLabel: correctLabel || '',
      exp,
    });

    $quizFeedback.className = `quiz-feedback quiz-feedback--${correct ? 'correct' : 'wrong'}`;
    $quizFeedback.innerHTML = `<strong>${correct ? _t('quizzes.correctFeedback', null, '✓ ¡Correcto!') : _t('quizzes.wrongFeedback', null, '✗ Incorrecto.')}</strong> ${exp}`;
    $quizFeedback.classList.remove('is-bouncing');
    void $quizFeedback.offsetWidth;
    $quizFeedback.classList.add('is-bouncing');

    $btnNext.textContent = _currentQIdx < _flatQuestions.length - 1
      ? _t('quizzes.next', null, 'Siguiente →')
      : _t('quizzes.review', null, 'Ver resultados →');
    $btnNext.classList.add('btn--quiz-next-visible');
  }

  function _renderQuestion() {
    const total = _flatQuestions.length;
    const q     = _flatQuestions[_currentQIdx];
    _answered   = false;

    $quizName.textContent = _currentQuiz.isCertExam
      ? _t('quizzes.examTitle', { title: _currentQuiz.title }, `Examen de certificación: ${_currentQuiz.title}`)
      : _currentQuiz.title;
    $quizSection.textContent = q.sectionTitle || '';
    $quizType.textContent = _typeLabels()[q.type] || q.type;
    $quizProgLabel.textContent = `${_currentQIdx + 1} / ${total}`;
    $quizProgressFill.style.width = `${(_currentQIdx / total) * 100}%`;

    $quizQuestion.textContent = q.q;
    $quizFeedback.className = 'quiz-feedback';
    $quizFeedback.textContent = '';
    $btnNext.classList.remove('btn--quiz-next-visible');
    $btnNext.textContent = _t('quizzes.next', null, 'Siguiente →');

    if (q.type === 'match') {
      _renderMatchQuestion(q);
    } else if (q.type === 'truefalse') {
      _renderTrueFalseQuestion(q);
    } else {
      _renderChoiceQuestion(q);
    }
  }

  function _renderChoiceQuestion(q) {
    const LETTERS = ['A', 'B', 'C', 'D'];
    $quizOptions.className = 'quiz-options';
    $quizOptions.innerHTML = q.opts.map((opt, i) => `
      <button type="button" class="quiz-option" data-idx="${i}" aria-label="${_t('quizzes.optionAria', { letter: LETTERS[i], opt }, `Opción ${LETTERS[i]}: ${opt}`)}">
        <span class="quiz-option__letter">${LETTERS[i]}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    $quizOptions.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => _selectChoice(parseInt(btn.dataset.idx, 10)));
    });
  }

  function _selectChoice(idx) {
    if (_answered) return;
    _answered = true;
    const q = _flatQuestions[_currentQIdx];
    const correct = idx === q.ans;

    $quizOptions.querySelectorAll('.quiz-option').forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.ans) btn.classList.add('quiz-option--reveal');
      if (i === idx && !correct) btn.classList.add('quiz-option--wrong');
    });

    _showFeedback(correct, q.exp, q.opts[idx], q.opts[q.ans]);
  }

  function _renderTrueFalseQuestion(q) {
    $quizOptions.className = 'quiz-options quiz-options--tf';
    $quizOptions.innerHTML = `
      <button type="button" class="quiz-tf-btn" data-val="true">
        <span class="quiz-tf-btn__icon">✓</span> ${_t('quizzes.true', null, 'Verdadero')}
      </button>
      <button type="button" class="quiz-tf-btn" data-val="false">
        <span class="quiz-tf-btn__icon">✗</span> ${_t('quizzes.false', null, 'Falso')}
      </button>`;

    $quizOptions.querySelectorAll('.quiz-tf-btn').forEach(btn => {
      btn.addEventListener('click', () => _selectTrueFalse(btn.dataset.val === 'true'));
    });
  }

  function _selectTrueFalse(val) {
    if (_answered) return;
    _answered = true;
    const q = _flatQuestions[_currentQIdx];
    const correct = val === q.ans;

    $quizOptions.querySelectorAll('.quiz-tf-btn').forEach(btn => {
      btn.disabled = true;
      const btnVal = btn.dataset.val === 'true';
      if (btnVal === q.ans) btn.classList.add('quiz-tf-btn--reveal');
      if (btnVal === val && !correct) btn.classList.add('quiz-tf-btn--wrong');
    });

    _showFeedback(
      correct,
      q.exp,
      val ? 'Verdadero' : 'Falso',
      q.ans ? 'Verdadero' : 'Falso'
    );
  }

  function _renderMatchQuestion(q) {
    const rights = _shuffle(q.pairs.map(p => p.right));
    $quizOptions.className = 'quiz-options quiz-options--match';
    $quizOptions.innerHTML = `
      <p class="quiz-match__hint">${_t('quizzes.matchHint', null, 'Selecciona la definición correcta para cada término.')}</p>
      <div class="quiz-match__rows">
        ${q.pairs.map((pair, i) => `
          <div class="quiz-match__row">
            <span class="quiz-match__left">${pair.left}</span>
            <select class="quiz-match__select" data-idx="${i}" aria-label="${_t('quizzes.matchPairAria', { term: pair.left }, `Pareja para ${pair.left}`)}">
              <option value="">${_t('quizzes.matchSelect', null, '— Selecciona —')}</option>
              ${rights.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
          </div>
        `).join('')}
      </div>
      <button type="button" class="btn--quiz-check" id="quiz-match-check">${_t('quizzes.check', null, 'Comprobar')}</button>`;

    document.getElementById('quiz-match-check')
      ?.addEventListener('click', _checkMatchAnswer);
  }

  function _checkMatchAnswer() {
    if (_answered) return;
    const q = _flatQuestions[_currentQIdx];
    const selects = $quizOptions.querySelectorAll('.quiz-match__select');
    const selections = [...selects].map(s => s.value);

    if (selections.some(v => !v)) {
      $quizFeedback.className = 'quiz-feedback quiz-feedback--wrong';
      $quizFeedback.innerHTML = `<strong>${_t('quizzes.matchCompleteAll', null, 'Completa todos los pareos antes de comprobar.')}</strong>`;
      return;
    }

    _answered = true;
    const correct = q.pairs.every((p, i) => selections[i] === p.right);

    selects.forEach((sel, i) => {
      sel.disabled = true;
      sel.classList.add(selections[i] === q.pairs[i].right
        ? 'quiz-match__select--ok'
        : 'quiz-match__select--fail');
    });

    const summary = q.pairs.map(p => `${p.left} → ${p.right}`).join(' · ');
    _showFeedback(
      correct,
      q.exp,
      selections.join(', '),
      summary
    );
  }

  function _nextQuestion() {
    _currentQIdx++;
    if (_currentQIdx < _flatQuestions.length) {
      _renderQuestion();
    } else {
      _showResults();
    }
  }

  function _showResults() {
    const correct = _answers.filter(a => a.correct).length;
    const total   = _answers.length;
    const pct     = Math.round((correct / total) * 100);

    _saveProgress(_currentQuiz.id, correct, total);

    const isExam = Boolean(_currentQuiz.isCertExam);
    const certRef = isExam ? _currentQuiz.courseId : _currentQuiz.id;
    const certType = isExam ? 'exam' : 'quiz';
    const minCertPct = isExam
      ? (UserProfileService?.EXAM_CERT_MIN_PCT || 80)
      : (UserProfileService?.CERT_MIN_PCT || 70);
    const gotCert = typeof UserProfileService !== 'undefined'
      && pct >= minCertPct
      && UserProfileService.getCertifications().some(c => c.refId === certRef && c.type === certType);

    $resPct.textContent     = `${pct}%`;
    $resCorrect.textContent = correct;
    $resWrong.textContent   = total - correct;
    $resTotal.textContent   = total;

    $resTitle.textContent = pct >= minCertPct
      ? (isExam ? _t('profile.profCert', null, '¡Certificación obtenida!') : _t('quizzes.completed', null, '¡Excelente trabajo!'))
      : pct >= 50
        ? _t('quizzes.completed', null, '¡Buen intento! Sigue practicando.')
        : _t('quizzes.resultNeedReview', null, 'Necesitas repasar este tema.');

    let subMsg;
    if (gotCert) {
      subMsg = isExam
        ? _t('quizzes.resultExamCert', { pct }, `Aprobaste el examen con ${pct}%. ¡Certificación profesional añadida a tu perfil!`)
        : _t('quizzes.resultQuizCert', { pct }, `Completaste el quiz con ${pct}%. ¡Certificado de práctica añadido a tu perfil!`);
    } else if (isExam) {
      subMsg = _t('quizzes.resultExamFail', { min: minCertPct, pct }, `Necesitas al menos ${minCertPct}% en el examen para la certificación profesional. Obtuviste ${pct}%.`);
    } else {
      const quizMin = UserProfileService?.QUIZ_UNLOCK_EXAM_PCT || 70;
      if (pct >= quizMin) {
        subMsg = _t('quizzes.resultQuizPass', { pct }, `¡Aprobaste con ${pct}%! Este resultado cuenta para desbloquear el examen de certificación (junto con las lecciones).`);
      } else {
        subMsg = _t('quizzes.resultQuizFail', { pct, min: quizMin }, `Obtuviste ${pct}%. Necesitas ≥${quizMin}% en el quiz para avanzar hacia la certificación profesional.`);
      }
    }
    $resSub.textContent = subMsg;

    $reviewList.innerHTML = _answers.map((a, i) => {
      const labels = _typeLabels();
      return `
      <div class="review-item ${a.correct ? 'review-item--ok' : 'review-item--fail'}">
        <div class="review-item__meta">${labels[a.type] || a.type}</div>
        <div class="review-item__q">${i + 1}. ${a.q}</div>
        <div class="review-item__a">
          ${a.correct
            ? _t('quizzes.correctFeedback', null, '✓ Correcto')
            : `✗ ${_t('quizzes.wrongFeedback', null, 'Incorrecto.')} "${a.chosenLabel}"${a.correctLabel ? ` — ${_t('quizzes.correctAnswer', null, 'Correcta')}: "${a.correctLabel}"` : ''}`}
        </div>
      </div>`;
    }).join('');

    _showResultsView();
  }

  function init() {
    _loadProgress();

    $listView    = document.getElementById('quizzes-list-view');
    $quizView    = document.getElementById('quizzes-quiz-view');
    $resultsView = document.getElementById('quizzes-results-view');
    $filtersWrap  = document.getElementById('quiz-filters');
    $quizGrid     = document.getElementById('quiz-grid');
    $continueGrid = document.getElementById('quiz-continue-grid');
    $certExamGrid = document.getElementById('cert-exam-grid');

    $quizName         = document.getElementById('quiz-active-name');
    $quizSection      = document.getElementById('quiz-active-section');
    $quizType         = document.getElementById('quiz-active-type');
    $quizProgLabel    = document.getElementById('quiz-active-prog');
    $quizProgressFill = document.getElementById('quiz-active-progress-fill');
    $quizQuestion     = document.getElementById('quiz-active-question');
    $quizOptions      = document.getElementById('quiz-active-options');
    $quizFeedback     = document.getElementById('quiz-active-feedback');
    $btnNext          = document.getElementById('quiz-btn-next');

    $resPct     = document.getElementById('results-pct');
    $resTitle   = document.getElementById('results-title');
    $resSub     = document.getElementById('results-sub');
    $resCorrect = document.getElementById('results-correct');
    $resWrong   = document.getElementById('results-wrong');
    $resTotal   = document.getElementById('results-total');
    $reviewList = document.getElementById('results-review');

    _renderFilters();
    _renderGrid();
    _renderContinue();
    _renderCertExams();

    document.getElementById('quiz-btn-back')?.addEventListener('click', _showListView);
    $btnNext?.addEventListener('click', _nextQuestion);
    document.getElementById('results-btn-home')?.addEventListener('click', _showListView);
    document.getElementById('results-btn-retry')
      ?.addEventListener('click', () => _startQuiz(_currentQuiz.id));
    document.getElementById('quiz-banner-btn')
      ?.addEventListener('click', () => _startQuiz(GENERAL_QUIZ_ID));

    const pendingQuiz = sessionStorage.getItem('in4mind_open_quiz');
    if (pendingQuiz) {
      sessionStorage.removeItem('in4mind_open_quiz');
      if (_getQuizById(pendingQuiz)) _startQuiz(pendingQuiz);
      else _startQuiz(GENERAL_QUIZ_ID);
    }

    const pendingExam = sessionStorage.getItem('in4mind_open_exam');
    if (pendingExam) {
      sessionStorage.removeItem('in4mind_open_exam');
      const examId = typeof CertificationExamData !== 'undefined'
        ? CertificationExamData.getExamId(pendingExam)
        : `${pendingExam}-cert-exam`;
      if (_getQuizById(examId)) _startQuiz(examId);
    }

    window.addEventListener('in4mind-relocalize', _relocalize);
  }

  return { init };

})();
