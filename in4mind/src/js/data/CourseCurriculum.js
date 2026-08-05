'use strict';

const CourseCurriculum = (() => {
  const LEVELS = Object.freeze({
    BEGINNER: 'Principiante',
    INTERMEDIATE: 'Intermedio',
    ADVANCED: 'Avanzado',
  });

  /**
   * Videos de YouTube por curso, en orden de lección (índice 0 = lección 1).
   * Solo se asigna el enlace correspondiente a cada posición; sin repetir ni mezclar cursos.
   */
  const LESSON_VIDEOS = Object.freeze({
    html: [
      'https://youtu.be/mNbnV3aN3KA',
      'https://youtu.be/lZeH53-EdjA',
      'https://youtu.be/MJkdaVFHrto',
    ],
    css: [
      'https://youtu.be/3yM5uXp-T_0',
      'https://youtu.be/wZniZEbPAzk',
      'https://youtu.be/aNEOu7de_FQ',
    ],
    python: [
      'https://youtu.be/_6N18g3ewnw',
      'https://youtu.be/IimBRwHhW54',
      'https://youtu.be/GRNI9T9R8gQ',
    ],
    javascript: [
      'https://youtu.be/8GTaO9XhA5M',
      'https://youtu.be/QoC4RxNIs5M',
    ],
    canvas: [
      'https://youtu.be/UG3yIIuhAb0',
      'https://youtu.be/K_h8vVleTC0',
      'https://youtu.be/pv02oKNzlSo',
    ],
    figma: [
      'https://youtu.be/Kgd9B6ETAUY',
      'https://youtu.be/bIK7PIdlLTU',
      'https://youtu.be/q6WPfjTU_B0',
    ],
    github: [
      'https://youtu.be/yLkOYXVRDvw',
    ],
    excel: [
      'https://youtu.be/yLkOYXVRDvw',
    ],
    powerpoint: [
      'https://youtu.be/LIXfGkAca0g',
      'https://youtu.be/qIsXgWYjPBU',
    ],
    sql: [
      'https://youtu.be/6i670_GQQGA',
      'https://youtu.be/Gn3cPj62bWk',
    ],
    ...(typeof ExtendedCourses !== 'undefined' ? ExtendedCourses.getLessonVideos() : {}),
  });

  const DATA = {
    canvas: {
      title: 'Canvas',
      category: 'design',
      icon: 'src/img/courses/canva.svg?v=20260713',
      requirements: ['Cuenta activa en Canva', 'Conexión a internet estable', 'Nociones básicas de diseño visual'],
      docs: { label: 'Centro de ayuda de Canva', url: 'https://www.canva.com/help/' },
      certModules: ['Fundamentos de Canva', 'Diseño de marca', 'Exportación profesional', 'Colaboración y revisión'],
      lessons: [
        {
          id: 'canvas-l1',
          title: 'Fundamentos de Canva',
          section: 'Módulo 1',
          duration: '12 min',
          level: LEVELS.BEGINNER,
          description: '¿Qué es Canva y para qué sirve? Esta lección explica su propósito como plataforma de diseño visual para crear piezas profesionales sin partir de cero.',
          requirements: ['Cuenta activa en Canva', 'Conexión a internet estable'],
          steps: ['Crear una cuenta y acceder al panel principal', 'Abrir un diseño nuevo con formato predefinido', 'Identificar barra lateral, lienzo y menú superior', 'Agregar texto, imagen y forma básica', 'Guardar y exportar una primera versión'],
          resources: { video: 'https://youtu.be/UG3yIIuhAb0?si=sYXrGP2wRybAaSN3', docs: 'Guía oficial de inicio en Canva', docsUrl: 'https://www.canva.com/help/getting-started/' },
          tip: 'Define objetivo y audiencia antes de elegir plantilla para evitar retrabajo.',
        },
        {
          id: 'canvas-l2',
          title: 'Plantillas y consistencia visual',
          section: 'Módulo 2',
          duration: '14 min',
          level: LEVELS.BEGINNER,
          description: '¿Qué son las plantillas y para qué sirven? Aprenderás a adaptarlas estratégicamente sin perder identidad visual ni claridad del mensaje.',
          requirements: ['Cuenta activa en Canva', 'Conexión a internet estable'],
          steps: ['Seleccionar plantilla alineada con el objetivo', 'Cambiar tipografías y colores de marca', 'Ajustar jerarquía visual de títulos y subtítulos', 'Reemplazar imágenes con contenido propio', 'Duplicar diseño para crear variaciones de campaña'],
          resources: { video: 'https://youtu.be/K_h8vVleTC0?si=pKwM16sSrZiBlxTM', docs: 'Uso de plantillas en Canva', docsUrl: 'https://www.canva.com/help/templates/' },
          tip: 'Modifica primero estructura y luego detalles para mantener consistencia.',
        },
        {
          id: 'canvas-l3',
          title: 'Composición y legibilidad',
          section: 'Módulo 3',
          duration: '13 min',
          level: LEVELS.INTERMEDIATE,
          description: '¿Qué es la composición y para qué sirve? Esta sesión te enseña a distribuir elementos para guiar la atención y mejorar comprensión.',
          requirements: ['Conocimiento básico de Canva', 'Criterio visual inicial'],
          steps: ['Aplicar regla de tercios para distribuir elementos', 'Usar contraste de color para destacar acciones', 'Alinear objetos con guías inteligentes', 'Controlar espacios en blanco de forma intencional', 'Revisar legibilidad en móvil y escritorio'],
          resources: { video: 'https://youtu.be/pv02oKNzlSo?si=dfMBKST0MQIEb7CQ', docs: 'Principios de diseño en Canva', docsUrl: 'https://www.canva.com/help/design-principles/' },
          tip: 'Si todo destaca, nada destaca: prioriza un foco visual por pieza.',
        },
        {
          id: 'canvas-l4',
          title: 'Exportación según canal',
          section: 'Módulo 4',
          duration: '11 min',
          level: LEVELS.INTERMEDIATE,
          description: '¿Qué es exportar correctamente y para qué sirve? Verás cómo elegir formato según destino para preservar calidad y rendimiento.',
          requirements: ['Conocimiento básico de Canva', 'Objetivo de publicación definido'],
          steps: ['Definir canal final: impresión, web o presentación', 'Elegir formato PNG, JPG, PDF o MP4 según caso', 'Configurar calidad y transparencia si aplica', 'Verificar peso del archivo antes de publicar', 'Probar resultado en el dispositivo de destino'],
          resources: { video: 'https://youtu.be/UG3yIIuhAb0?si=sYXrGP2wRybAaSN3', docs: 'Descargar y exportar diseños', docsUrl: 'https://www.canva.com/help/download-your-design/' },
          tip: 'Evita enviar JPG para impresión; usa PDF de alta calidad.',
        },
        {
          id: 'canvas-l5',
          title: 'Flujo colaborativo en equipo',
          section: 'Módulo 5',
          duration: '15 min',
          level: LEVELS.ADVANCED,
          description: '¿Qué es colaborar en Canva y para qué sirve? Aprenderás prácticas de revisión, comentarios y control de versiones visuales.',
          requirements: ['Conocimiento intermedio de Canva', 'Trabajo en equipo definido'],
          steps: ['Compartir diseño con permisos apropiados', 'Usar comentarios para feedback contextual', 'Crear versiones con nomenclatura clara', 'Consolidar cambios aprobados por responsable', 'Publicar versión final y archivar iteraciones'],
          resources: { video: 'https://www.youtube.com/watch?v=qT0QfVZq9t8', docs: 'Colaboración en Canva', docsUrl: 'https://www.canva.com/help/collaborate-on-designs/' },
          tip: 'Establece una fecha de cierre de cambios para evitar iteraciones infinitas.',
        },
      ],
      quizSections: [
        {
          title: 'Fundamentos de Canva',
          questions: [
            { type: 'choice', q: 'En un flujo profesional, ¿cuál es la razón principal para usar Canva en fases tempranas?', opts: ['Automatizar servidores', 'Prototipar piezas visuales con rapidez y coherencia', 'Gestionar bases de datos', 'Compilar código frontend'], ans: 1, exp: 'Canva acelera la validación visual sin barreras técnicas altas.' },
            { type: 'truefalse', q: 'Canva permite trabajar en navegador y mantener activos colaborativos centralizados.', ans: true, exp: 'Su modelo cloud facilita acceso y edición compartida.',
              qFalse: 'Canva exige instalar una suite de escritorio y cada persona guarda los activos de marca en su propio equipo.',
              expFalse: 'Canva es una herramienta en la nube: se trabaja desde el navegador y los activos de marca quedan centralizados para todo el equipo.'  },
            { type: 'match', q: 'Relaciona función y propósito en Canva:', pairs: [{ left: 'Plantilla', right: 'Base editable para acelerar producción' }, { left: 'Elementos', right: 'Recursos gráficos reutilizables' }, { left: 'Exportar', right: 'Generar archivo final según canal' }, { left: 'Comentarios', right: 'Revisión contextual entre equipo' }], exp: 'Cada bloque cubre una parte del flujo de diseño.' },
          ],
        },
        {
          title: 'Plantillas y consistencia visual',
          questions: [
            { type: 'choice', q: 'Si una marca exige coherencia entre 12 piezas, ¿qué práctica reduce más errores?', opts: ['Diseñar cada pieza desde cero', 'Usar plantilla base con estilos consistentes', 'Cambiar tipografía en cada publicación', 'Exportar sin revisión'], ans: 1, exp: 'Una base común asegura consistencia de identidad.' },
            { type: 'truefalse', q: 'Editar una plantilla sin revisar jerarquía tipográfica suele degradar claridad del mensaje.', ans: true, exp: 'La jerarquía visual define lectura y comprensión.',
              qFalse: 'Mientras el texto quepa en la plantilla, la jerarquía tipográfica no afecta la claridad del mensaje.',
              expFalse: 'La jerarquía tipográfica define el orden de lectura; si no se revisa al editar, el mensaje pierde claridad aunque el texto quepa.'  },
            { type: 'match', q: 'Relaciona decisión y resultado esperado:', pairs: [{ left: 'Paleta fija', right: 'Identidad visual reconocible' }, { left: 'Tipografía principal', right: 'Lectura consistente' }, { left: 'Sistema de márgenes', right: 'Orden visual estable' }, { left: 'Duplicar versión', right: 'Variantes sin romper base' }], exp: 'Estandarizar componentes evita inconsistencias.' },
          ],
        },
        {
          title: 'Composición y legibilidad',
          questions: [
            { type: 'choice', q: 'En una pieza con llamada a la acción, ¿qué decisión aumenta conversión?', opts: ['Usar cinco colores de alto contraste', 'Destacar un único foco visual y espacio negativo', 'Reducir tamaño del CTA al mínimo', 'Eliminar jerarquía de textos'], ans: 1, exp: 'Un foco claro reduce carga cognitiva.' },
            { type: 'truefalse', q: 'La legibilidad debe validarse en el dispositivo final antes de publicación.', ans: true, exp: 'La escala de lectura cambia entre móvil y escritorio.',
              qFalse: 'Basta con que el diseño se lea bien en el monitor del diseñador para darlo por aprobado.',
              expFalse: 'La escala de lectura cambia entre móvil y escritorio: hay que validar en el dispositivo donde se publicará.'  },
            { type: 'match', q: 'Relaciona principio y beneficio:', pairs: [{ left: 'Contraste', right: 'Prioriza información clave' }, { left: 'Alineación', right: 'Reduce ruido visual' }, { left: 'Espacio en blanco', right: 'Mejora comprensión' }, { left: 'Jerarquía', right: 'Define orden de lectura' }], exp: 'Son fundamentos para diseño funcional.' },
          ],
        },
        {
          title: 'Exportación según canal',
          questions: [
            { type: 'choice', q: 'Para impresión de alta calidad, ¿qué formato es más adecuado en Canva?', opts: ['GIF', 'PDF para impresión', 'TXT', 'WEBP comprimido extremo'], ans: 1, exp: 'PDF mantiene detalle y compatibilidad de imprenta.' },
            { type: 'truefalse', q: 'El formato ideal depende del canal de distribución y del uso final del archivo.', ans: true, exp: 'No existe un único formato óptimo para todo.',
              qFalse: 'Existe un único formato de exportación óptimo que sirve igual para impresión, web y redes sociales.',
              expFalse: 'No hay formato universal: PDF sirve para imprenta, PNG o JPG para web y MP4 para vídeo, según el canal y el uso final.'  },
            { type: 'match', q: 'Relaciona formato y caso de uso:', pairs: [{ left: 'PNG', right: 'Imagen digital con buena nitidez' }, { left: 'JPG', right: 'Archivo liviano para fotografía web' }, { left: 'PDF', right: 'Documento para impresión o entrega formal' }, { left: 'MP4', right: 'Contenido visual animado' }], exp: 'La decisión impacta calidad y rendimiento.' },
          ],
        },
        {
          title: 'Flujo colaborativo en equipo',
          questions: [
            { type: 'choice', q: 'En equipos distribuidos, ¿qué práctica mejora trazabilidad de revisiones?', opts: ['Enviar capturas por chat sin contexto', 'Usar comentarios en el diseño y versiones etiquetadas', 'Permitir edición sin roles', 'Saltar aprobación final'], ans: 1, exp: 'El feedback contextual reduce ambigüedad.' },
            { type: 'truefalse', q: 'Definir un responsable de aprobación final evita bloqueos por decisiones difusas.', ans: true, exp: 'La responsabilidad explícita acelera cierre.',
              qFalse: 'Dejar la aprobación final abierta a todo el equipo acelera el cierre del proyecto.',
              expFalse: 'Sin un responsable explícito las decisiones se diluyen y el proyecto se bloquea en revisiones interminables.'  },
            { type: 'match', q: 'Relaciona rol y responsabilidad:', pairs: [{ left: 'Editor', right: 'Implementa cambios en diseño' }, { left: 'Revisor', right: 'Evalúa calidad y coherencia' }, { left: 'Stakeholder', right: 'Valida objetivo de negocio' }, { left: 'Aprobador final', right: 'Autoriza publicación' }], exp: 'Roles claros evitan retrabajo.' },
          ],
        },
      ],
      examSections: [
        {
          title: 'Caso práctico de campaña visual',
          questions: [
            { type: 'choice', q: 'Debes entregar una campaña multiformato en 2 horas. ¿Qué estrategia es más robusta?', opts: ['Crear cada formato manualmente sin estructura', 'Definir plantilla maestra, estilos de marca y duplicar variantes', 'Diseñar solo una pieza y estirar dimensiones', 'Exportar todo en un único formato'], ans: 1, exp: 'Estandarizar primero optimiza velocidad y calidad.' },
            { type: 'truefalse', q: 'Una revisión final en dispositivo real antes de publicar reduce errores de lectura y recorte.', ans: true, exp: 'La validación contextual es parte del control de calidad.',
              qFalse: 'La vista previa del editor es suficiente para descartar errores de recorte antes de publicar.',
              expFalse: 'La vista previa no reproduce recortes ni escalas reales; revisar en el dispositivo final es lo que evita esos errores.'  },
            { type: 'match', q: 'Relaciona problema y corrección profesional:', pairs: [{ left: 'Texto ilegible', right: 'Aumentar contraste y tamaño' }, { left: 'Composición saturada', right: 'Aplicar espacio negativo' }, { left: 'Marca inconsistente', right: 'Reutilizar estilos definidos' }, { left: 'Archivo pesado', right: 'Optimizar exportación por canal' }], exp: 'Resolver fallas comunes requiere criterios técnicos y visuales.' },
          ],
        },
        {
          title: 'Gobernanza y entrega final',
          questions: [
            { type: 'choice', q: 'Si dos diseñadores editaron en paralelo y hay conflicto de decisiones, ¿qué flujo minimiza retrabajo?', opts: ['Publicar la versión más reciente sin revisión', 'Comparar comentarios, consolidar en versión base y aprobar formalmente', 'Descartar trabajo de ambos', 'Pedir cambios indefinidos'], ans: 1, exp: 'La consolidación guiada por criterios evita pérdida de calidad.' },
            { type: 'truefalse', q: 'Sin política de nombres de versión, es difícil auditar qué archivo fue aprobado.', ans: true, exp: 'Trazabilidad documental es clave en operaciones de diseño.',
              qFalse: 'Mientras el archivo esté en la carpeta compartida, no hace falta convención de nombres para saber cuál se aprobó.',
              expFalse: 'Sin convención de versiones nadie distingue el archivo aprobado del borrador; la trazabilidad depende del nombrado.'  },
            { type: 'match', q: 'Relaciona evidencia y auditoría de calidad:', pairs: [{ left: 'Historial de comentarios', right: 'Justifica decisiones tomadas' }, { left: 'Versión final etiquetada', right: 'Referencia única de publicación' }, { left: 'Checklist de exportación', right: 'Evita formatos incorrectos' }, { left: 'Aprobación registrada', right: 'Cierra ciclo operativo' }], exp: 'La calidad final también depende del proceso de entrega.' },
          ],
        },
      ],
    },
    figma: {
      title: 'Figma',
      category: 'design',
      icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png',
      requirements: ['Cuenta en Figma', 'Conexión a internet', 'Nociones básicas de interfaz'],
      docs: { label: 'Centro de ayuda de Figma', url: 'https://help.figma.com/' },
      certModules: ['Fundamentos de Figma', 'Componentes y variantes', 'Prototipado UX', 'Handoff a desarrollo'],
      lessons: [
        {
          id: 'figma-l1',
          title: '¿Qué es Figma y cómo iniciar?',
          section: 'Módulo 1',
          duration: '12 min',
          level: LEVELS.BEGINNER,
          description: '¿Qué es Figma y para qué sirve? Conocerás su enfoque colaborativo para diseñar interfaces y prototipos en tiempo real.',
          requirements: ['Cuenta en Figma', 'Conexión a internet'],
          steps: ['Crear cuenta en Figma y verificar correo', 'Iniciar un nuevo proyecto desde Drafts', 'Reconocer panel de capas, propiedades y lienzo', 'Explorar herramientas básicas de frame, texto y forma', 'Guardar archivo y exportar una pantalla inicial'],
          resources: { video: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8', docs: 'Primeros pasos en Figma', docsUrl: 'https://help.figma.com/hc/en-us/articles/360040328273-Get-started-with-Figma' },
          tip: 'Nombra cada capa desde el inicio para evitar caos en proyectos grandes.',
        },
        {
          id: 'figma-l2',
          title: 'Frames, grids y restricciones',
          section: 'Módulo 2',
          duration: '14 min',
          level: LEVELS.BEGINNER,
          description: '¿Qué son los frames y para qué sirven? Aprenderás a estructurar pantallas escalables con rejillas y restricciones responsive.',
          requirements: ['Cuenta en Figma', 'Nociones básicas de interfaz'],
          steps: ['Crear frame para desktop y mobile', 'Aplicar layout grid de columnas', 'Configurar constraints en elementos clave', 'Alinear componentes con reglas de espaciado', 'Validar reescalado al cambiar tamaño del frame'],
          resources: { video: 'https://www.youtube.com/watch?v=Y0I6fN4vK3Y', docs: 'Frames y grids en Figma', docsUrl: 'https://help.figma.com/hc/en-us/articles/360040451373-Use-layout-grids' },
          tip: 'Diseña primero en estructura; luego en detalle visual.',
        },
        {
          id: 'figma-l3',
          title: 'Componentes y variantes',
          section: 'Módulo 3',
          duration: '15 min',
          level: LEVELS.INTERMEDIATE,
          description: '¿Qué son componentes y para qué sirven? Esta lección cubre reutilización, escalabilidad y consistencia en sistemas UI.',
          requirements: ['Dominio básico de frames', 'Nomenclatura consistente de capas'],
          steps: ['Convertir botón base en componente principal', 'Crear variantes por estado y tamaño', 'Aplicar instancias en varias pantallas', 'Actualizar componente maestro y observar propagación', 'Documentar propiedades para el equipo'],
          resources: { video: 'https://www.youtube.com/watch?v=Q8vM5xkQ3gI', docs: 'Componentes en Figma', docsUrl: 'https://help.figma.com/hc/en-us/articles/360038662654-Create-components-and-variants' },
          tip: 'Evita componentes demasiado rígidos; piensa en escalabilidad.',
        },
        {
          id: 'figma-l4',
          title: 'Prototipado y validación UX',
          section: 'Módulo 4',
          duration: '13 min',
          level: LEVELS.INTERMEDIATE,
          description: '¿Qué es prototipar y para qué sirve? Aprenderás a simular flujos y validar decisiones antes de desarrollo.',
          requirements: ['Componentes básicos definidos', 'Flujo de pantalla delineado'],
          steps: ['Conectar pantallas con interacciones', 'Definir transiciones y overlays', 'Crear ruta de usuario principal', 'Probar prototipo con colegas', 'Registrar ajustes priorizados de UX'],
          resources: { video: 'https://www.youtube.com/watch?v=GJ9L2Xf1u3A', docs: 'Prototipos en Figma', docsUrl: 'https://help.figma.com/hc/en-us/articles/360040314193-Guide-to-prototyping-in-Figma' },
          tip: 'Prototipa primero el flujo crítico de negocio.',
        },
        {
          id: 'figma-l5',
          title: 'Dev Mode y handoff',
          section: 'Módulo 5',
          duration: '16 min',
          level: LEVELS.ADVANCED,
          description: '¿Qué es el handoff y para qué sirve? Verás cómo entregar especificaciones claras a desarrollo con menos fricción.',
          requirements: ['Prototipo funcional', 'Componentes y estilos organizados'],
          steps: ['Abrir Dev Mode y revisar medidas', 'Compartir tokens de color y tipografía', 'Exportar assets con nombres consistentes', 'Anotar reglas de interacción clave', 'Validar entrega con equipo técnico'],
          resources: { video: 'https://www.youtube.com/watch?v=YvYk8M6aR8Q', docs: 'Dev Mode en Figma', docsUrl: 'https://help.figma.com/hc/en-us/articles/15023124644247-Dev-Mode-overview' },
          tip: 'Una buena entrega técnica empieza con capas y componentes bien nombrados.',
        },
      ],
      quizSections: [
        {
          title: '¿Qué es Figma y cómo iniciar?',
          questions: [
            { type: 'choice', q: '¿Cuál ventaja estratégica diferencia a Figma frente a flujos locales tradicionales?', opts: ['Compila backend automáticamente', 'Colaboración simultánea en archivo único', 'Ejecuta consultas SQL', 'Versiona código Git nativo'], ans: 1, exp: 'Figma optimiza colaboración multidisciplinaria en tiempo real.' },
            { type: 'truefalse', q: 'Figma funciona en navegador y permite trabajo colaborativo sin instalar suites pesadas.', ans: true, exp: 'Su enfoque cloud reduce barreras de entrada.',
              qFalse: 'Figma requiere instalar una suite de escritorio y sólo permite que una persona edite el archivo a la vez.',
              expFalse: 'Figma corre en el navegador y varias personas pueden editar el mismo archivo simultáneamente.'  },
            { type: 'match', q: 'Relaciona área y función en Figma:', pairs: [{ left: 'Layers', right: 'Estructura del diseño' }, { left: 'Canvas', right: 'Área principal de trabajo' }, { left: 'Properties', right: 'Configuración del elemento seleccionado' }, { left: 'Assets', right: 'Acceso a componentes reutilizables' }], exp: 'Dominar la interfaz acelera diseño y revisión.' },
          ],
        },
        {
          title: 'Frames, grids y restricciones',
          questions: [
            { type: 'choice', q: '¿Qué combinación mejora comportamiento responsive al redimensionar pantallas?', opts: ['Frames + constraints bien definidos', 'Solo capas sueltas sin estructura', 'Imagen exportada fija', 'Texto convertido en curvas'], ans: 0, exp: 'Frames y constraints controlan adaptación de layout.' },
            { type: 'truefalse', q: 'Un layout grid ayuda a mantener alineación consistente en interfaces complejas.', ans: true, exp: 'La grilla aporta orden y escalabilidad.',
              qFalse: 'Los layout grids son sólo decorativos y no influyen en la alineación del contenido.',
              expFalse: 'El layout grid define columnas y márgenes que mantienen la alineación coherente en toda la interfaz.'  },
            { type: 'match', q: 'Relaciona técnica y resultado:', pairs: [{ left: 'Grid de 12 columnas', right: 'Sistema de alineación estable' }, { left: 'Constraints left/right', right: 'Elemento mantiene bordes relativos' }, { left: 'Frame mobile', right: 'Validación de experiencia pequeña' }, { left: 'Spacing tokens', right: 'Consistencia entre componentes' }], exp: 'Son prácticas base de diseño sistemático.' },
          ],
        },
        {
          title: 'Componentes y variantes',
          questions: [
            { type: 'choice', q: 'Si un botón cambia en 40 pantallas, ¿qué reduce mantenimiento?', opts: ['Editar cada instancia manualmente', 'Actualizar componente principal con variantes', 'Rasterizar botones', 'Ocultar capas anteriores'], ans: 1, exp: 'El componente maestro propaga cambios de forma controlada.' },
            { type: 'truefalse', q: 'Las variantes permiten modelar estados como hover, active y disabled dentro de un mismo componente.', ans: true, exp: 'Facilitan consistencia y handoff claro.',
              qFalse: 'Cada estado (hover, active, disabled) exige crear un componente independiente y sin relación entre sí.',
              expFalse: 'Las variantes agrupan los estados dentro de un mismo componente, evitando duplicarlo una vez por estado.'  },
            { type: 'match', q: 'Relaciona concepto y objetivo:', pairs: [{ left: 'Main component', right: 'Fuente de verdad visual' }, { left: 'Instance', right: 'Uso reutilizable en pantalla' }, { left: 'Variant set', right: 'Agrupar estados relacionados' }, { left: 'Property', right: 'Controlar comportamiento configurable' }], exp: 'Estructurar componentes reduce deuda de diseño.' },
          ],
        },
        {
          title: 'Prototipado y validación UX',
          questions: [
            { type: 'choice', q: '¿Qué aporta un prototipo navegable antes de desarrollar?', opts: ['Elimina necesidad de QA', 'Valida flujo y detecta fricción de uso temprana', 'Reemplaza requerimientos de negocio', 'Genera base de datos final'], ans: 1, exp: 'Permite aprender antes de construir costoso.' },
            { type: 'truefalse', q: 'Prototipar escenarios de error es tan importante como el flujo ideal.', ans: true, exp: 'La experiencia real incluye fallos y recuperación.',
              qFalse: 'El prototipo sólo debe cubrir el camino feliz; los errores se resuelven durante el desarrollo.',
              expFalse: 'Si el prototipo ignora los errores, el equipo subestima la complejidad y el usuario queda sin respuesta ante fallos.'  },
            { type: 'match', q: 'Relaciona interacción y uso UX:', pairs: [{ left: 'On click', right: 'Acción explícita del usuario' }, { left: 'Overlay', right: 'Modal sin salir de contexto' }, { left: 'Smart animate', right: 'Transición fluida entre estados' }, { left: 'Flow start point', right: 'Definir ruta de prueba' }], exp: 'Estas opciones simulan experiencia de producto.' },
          ],
        },
        {
          title: 'Dev Mode y handoff',
          questions: [
            { type: 'choice', q: 'En handoff, ¿qué información reduce dudas del desarrollador?', opts: ['Solo captura PNG', 'Medidas, estilos, tokens e interacciones documentadas', 'Comentario genérico sin contexto', 'Archivo sin estructura'], ans: 1, exp: 'Handoff efectivo necesita especificaciones trazables.' },
            { type: 'truefalse', q: 'Nombrar capas de forma semántica mejora comunicación entre diseño y desarrollo.', ans: true, exp: 'El lenguaje compartido evita errores de implementación.',
              qFalse: 'Los nombres de capa por defecto (Rectangle 27, Group 5) son suficientes para el handoff con desarrollo.',
              expFalse: 'Los nombres genéricos obligan a adivinar la intención; el nombrado semántico es lo que hace legible el archivo.'  },
            { type: 'match', q: 'Relaciona artefacto y valor de entrega:', pairs: [{ left: 'Token de color', right: 'Consistencia visual en código' }, { left: 'Asset exportado', right: 'Implementación de recursos gráficos' }, { left: 'Spec de espaciado', right: 'Precisión de layout' }, { left: 'Nota de interacción', right: 'Comportamiento esperado en UI' }], exp: 'El handoff robusto transforma diseño en implementación confiable.' },
          ],
        },
      ],
      examSections: [
        {
          title: 'Diseño de flujo de producto',
          questions: [
            { type: 'choice', q: 'Debes rediseñar onboarding móvil con múltiples estados. ¿Cuál enfoque garantiza escalabilidad?', opts: ['Pantallas sueltas sin componentes', 'Sistema de componentes, variantes y tokens desde el inicio', 'Diseño libre por cada diseñador', 'Prototipo sin estructura de capas'], ans: 1, exp: 'Los sistemas previenen inconsistencia y retrabajo.' },
            { type: 'truefalse', q: 'Si el prototipo no considera errores de validación, el equipo subestima complejidad de implementación.', ans: true, exp: 'Los edge cases impactan tiempo y calidad del producto.',
              qFalse: 'Omitir la validación en el prototipo no cambia la estimación de esfuerzo del equipo de desarrollo.',
              expFalse: 'Los estados de validación son parte del trabajo real: si no aparecen en el prototipo, la estimación queda corta.'  },
            { type: 'match', q: 'Relaciona decisión y efecto en entrega:', pairs: [{ left: 'Auto Layout correcto', right: 'Comportamiento flexible al cambiar contenido' }, { left: 'Dev Mode documentado', right: 'Menos dudas en desarrollo' }, { left: 'Variant properties', right: 'Estados controlados en diseño' }, { left: 'Comentarios de negocio', right: 'Contexto para decisiones técnicas' }], exp: 'Diseño y desarrollo deben compartir una única narrativa de producto.' },
          ],
        },
        {
          title: 'Handoff y calidad técnica',
          questions: [
            { type: 'choice', q: 'Cuando diseño y código divergen, ¿qué acción corrige más rápido?', opts: ['Ignorar diferencias visuales', 'Revisar specs de Figma y alinear tokens con implementación', 'Cambiar solo colores manualmente', 'Eliminar componentes compartidos'], ans: 1, exp: 'La alineación por tokens y specs minimiza deriva visual.' },
            { type: 'truefalse', q: 'Un archivo de Figma sin convención de nombres dificulta auditoría y mantenimiento.', ans: true, exp: 'La gobernanza del archivo es parte de la calidad técnica.',
              qFalse: 'Un archivo de Figma se mantiene igual de auditable aunque no tenga ninguna convención de nombres.',
              expFalse: 'Sin convención, localizar y actualizar componentes se vuelve lento y propenso a errores.'  },
            { type: 'match', q: 'Relaciona problema y mitigación:', pairs: [{ left: 'Assets inconsistentes', right: 'Exportación normalizada por nomenclatura' }, { left: 'Espaciados ambiguos', right: 'Definir escala de spacing tokenizada' }, { left: 'Estados faltantes', right: 'Completar variantes de componente' }, { left: 'Dudas de interacción', right: 'Anotar comportamiento en prototipo' }], exp: 'Un handoff preventivo reduce deuda de UI.' },
          ],
        },
      ],
    },
    python: {
      title: 'Python',
      category: 'programming',
      icon: 'src/img/courses/python.svg',
      requirements: ['Python 3 instalado', 'Editor de código (VS Code recomendado)', 'Terminal básica'],
      docs: { label: 'Documentación oficial de Python', url: 'https://docs.python.org/3/' },
      certModules: ['Sintaxis y tipos', 'Control de flujo', 'Funciones y módulos', 'Estructuras y archivos'],
      lessons: [
        { id: 'python-l1', title: 'Sintaxis, tipos y variables', section: 'Módulo 1', duration: '13 min', level: LEVELS.BEGINNER, description: '¿Qué es Python y para qué sirve? Esta lección establece su sintaxis clara, tipos de datos y bases para programar con orden.', requirements: ['Python 3 instalado', 'Terminal básica'], steps: ['Ejecutar primer script en consola', 'Crear variables con nombres descriptivos', 'Diferenciar int, float, str y bool', 'Convertir tipos de manera segura', 'Mostrar resultados con f-strings'], resources: { video: 'https://www.youtube.com/watch?v=kqtD5dpn9C8', docs: 'Tutorial oficial de Python', docsUrl: 'https://docs.python.org/3/tutorial/' }, tip: 'Nombra variables por intención de negocio, no por atajo técnico.' },
        { id: 'python-l2', title: 'Condicionales y bucles', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué es controlar flujo y para qué sirve? Aprenderás a tomar decisiones y repetir tareas sin duplicar código.', requirements: ['Python 3 instalado', 'Conceptos de variables'], steps: ['Escribir if/elif/else con casos reales', 'Recorrer listas con for', 'Usar while con condición de salida', 'Aplicar break y continue con criterio', 'Resolver reto de lógica con validaciones'], resources: { video: 'https://www.youtube.com/watch?v=6iF8Xb7Z3wQ', docs: 'Control flow en Python', docsUrl: 'https://docs.python.org/3/tutorial/controlflow.html' }, tip: 'Evita condiciones anidadas profundas; simplifica con funciones pequeñas.' },
        { id: 'python-l3', title: 'Funciones y modularidad', section: 'Módulo 3', duration: '15 min', level: LEVELS.INTERMEDIATE, description: '¿Qué son funciones y para qué sirven? Verás cómo encapsular lógica para reutilizar, probar y mantener código con menor riesgo.', requirements: ['Control de flujo básico', 'Editor de código'], steps: ['Definir funciones con parámetros', 'Retornar valores en vez de imprimir siempre', 'Agregar docstrings y tipos simples', 'Separar utilidades en módulos', 'Importar y reutilizar código entre archivos'], resources: { video: 'https://www.youtube.com/watch?v=9Os0o3wzS_I', docs: 'Definición de funciones', docsUrl: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions' }, tip: 'Si una función hace muchas cosas, divídela por responsabilidad.' },
        { id: 'python-l4', title: 'Listas, diccionarios y sets', section: 'Módulo 4', duration: '13 min', level: LEVELS.INTERMEDIATE, description: '¿Qué son las estructuras de datos y para qué sirven? Aprenderás a elegir la más adecuada para cada problema real.', requirements: ['Funciones básicas', 'Manejo de bucles'], steps: ['Crear y transformar listas con comprehensions', 'Acceder a diccionarios con seguridad', 'Eliminar duplicados con sets', 'Ordenar colecciones por criterio', 'Modelar un catálogo de datos pequeño'], resources: { video: 'https://www.youtube.com/watch?v=ohCDWZgNIU0', docs: 'Estructuras de datos en Python', docsUrl: 'https://docs.python.org/3/tutorial/datastructures.html' }, tip: 'Elegir bien la estructura puede simplificar más que optimizar luego.' },
        { id: 'python-l5', title: 'Archivos, errores y buenas prácticas', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es gestionar archivos y errores y para qué sirve? Esta lección cubre robustez operativa y calidad en scripts productivos.', requirements: ['Conocimiento intermedio de Python', 'Práctica con estructuras de datos'], steps: ['Leer y escribir archivos con context manager', 'Capturar excepciones específicas', 'Registrar errores útiles para depuración', 'Validar entradas antes de procesar', 'Aplicar estilo PEP 8 en script final'], resources: { video: 'https://www.youtube.com/watch?v=NIWwJbo-9_8', docs: 'Errores y excepciones', docsUrl: 'https://docs.python.org/3/tutorial/errors.html' }, tip: 'Maneja errores esperables; no ocultes excepciones críticas.' },
      ],
      quizSections: [
        { title: 'Sintaxis, tipos y variables', questions: [{ type: 'choice', q: 'En un script de datos, ¿qué ventaja aporta el tipado dinámico de Python cuando se usa con validación explícita?', opts: ['Evita cualquier error en runtime', 'Acelera iteración manteniendo flexibilidad controlada', 'Reemplaza pruebas unitarias', 'Elimina necesidad de documentación'], ans: 1, exp: 'La flexibilidad es útil si se valida de forma consciente.' }, { type: 'truefalse', q: 'f-strings mejoran legibilidad frente a concatenaciones complejas.', ans: true, exp: 'Facilitan formato claro y mantenimiento.',
              qFalse: 'Concatenar con el operador + es más legible que usar f-strings cuando se combinan varias variables.',
              expFalse: 'Las f-strings muestran el texto y las variables en su sitio; la concatenación con + se vuelve ilegible al crecer.'  }, { type: 'match', q: 'Relaciona tipo y caso habitual:', pairs: [{ left: 'int', right: 'Conteos discretos' }, { left: 'float', right: 'Mediciones con decimales' }, { left: 'str', right: 'Texto y etiquetas' }, { left: 'bool', right: 'Estados lógicos' }], exp: 'Seleccionar tipo correcto reduce errores semánticos.' }] },
        { title: 'Condicionales y bucles', questions: [{ type: 'choice', q: '¿Cuál patrón evita bucles infinitos en procesos de entrada?', opts: ['while True sin condición de salida', 'Condición explícita + break controlado', 'Eliminar validaciones', 'Usar recursión en todo'], ans: 1, exp: 'Control de salida es obligatorio en loops robustos.' }, { type: 'truefalse', q: 'continue puede mejorar claridad cuando se descartan casos no válidos temprano.', ans: true, exp: 'Reduce anidamiento innecesario.',
              qFalse: 'continue siempre reduce la claridad del bucle y conviene evitarlo en cualquier caso.',
              expFalse: 'Descartar temprano los casos no válidos con continue evita anidar condicionales y aplana la lógica.'  }, { type: 'match', q: 'Relaciona instrucción y efecto:', pairs: [{ left: 'if', right: 'Decisión condicional' }, { left: 'for', right: 'Iteración sobre colección' }, { left: 'while', right: 'Repetición por condición' }, { left: 'break', right: 'Salir del bucle actual' }], exp: 'Dominar flujo es base de lógica mantenible.' }] },
        { title: 'Funciones y modularidad', questions: [{ type: 'choice', q: '¿Qué diseño favorece testabilidad en funciones de negocio?', opts: ['Imprimir dentro de toda función', 'Retornar datos y separar E/S de la lógica', 'Usar variables globales en cascada', 'Escribir una sola función gigante'], ans: 1, exp: 'Separar lógica y presentación facilita pruebas.' }, { type: 'truefalse', q: 'Una función con única responsabilidad suele ser más mantenible.', ans: true, exp: 'Reduce acoplamiento y complejidad cognitiva.',
              qFalse: 'Agrupar varias responsabilidades en una sola función facilita su mantenimiento.',
              expFalse: 'Una función que hace varias cosas es más difícil de probar y de cambiar sin romper el resto.'  }, { type: 'match', q: 'Relaciona práctica y beneficio:', pairs: [{ left: 'Docstring', right: 'Explica propósito y contrato' }, { left: 'Parámetros claros', right: 'Uso predecible de la función' }, { left: 'Módulo separado', right: 'Reutilización de lógica' }, { left: 'Import explícito', right: 'Dependencias transparentes' }], exp: 'La modularidad reduce deuda técnica.' }] },
        { title: 'Listas, diccionarios y sets', questions: [{ type: 'choice', q: 'Si necesitas acceso rápido por clave única, ¿qué estructura es más adecuada?', opts: ['Lista de tuplas no indexada', 'Diccionario', 'Cadena de texto', 'Bucle while infinito'], ans: 1, exp: 'Los diccionarios modelan relación clave-valor eficientemente.' }, { type: 'truefalse', q: 'Un set es útil para eliminar duplicados sin lógica extra.', ans: true, exp: 'La unicidad es propiedad nativa del set.',
              qFalse: 'Para eliminar duplicados hay que recorrer la lista con un bucle porque set no lo resuelve.',
              expFalse: 'set() descarta duplicados por definición: no admite elementos repetidos.'  }, { type: 'match', q: 'Relaciona estructura y fortaleza:', pairs: [{ left: 'Lista', right: 'Orden y recorrido secuencial' }, { left: 'Diccionario', right: 'Acceso por clave' }, { left: 'Set', right: 'Unicidad de elementos' }, { left: 'Tuple', right: 'Inmutabilidad ligera' }], exp: 'Cada estructura optimiza un patrón de uso.' }] },
        { title: 'Archivos, errores y buenas prácticas', questions: [{ type: 'choice', q: '¿Qué enfoque de errores es más profesional en scripts de producción?', opts: ['except: pass en todo bloque', 'Capturar excepciones específicas y registrar contexto', 'Ignorar validaciones de entrada', 'Detener proceso sin mensaje'], ans: 1, exp: 'La observabilidad es parte de la calidad de software.' }, { type: 'truefalse', q: 'with open(...) garantiza cierre de archivo incluso ante excepción.', ans: true, exp: 'El context manager gestiona recursos de forma segura.',
              qFalse: 'Con with open(...) hay que llamar a close() manualmente si ocurre una excepción.',
              expFalse: 'El bloque with cierra el archivo al salir, tanto en ejecución normal como si se lanza una excepción.'  }, { type: 'match', q: 'Relaciona técnica y resultado:', pairs: [{ left: 'try/except específico', right: 'Manejo controlado de fallos' }, { left: 'logging', right: 'Diagnóstico posterior' }, { left: 'validación previa', right: 'Prevención de errores evitables' }, { left: 'PEP 8', right: 'Legibilidad y estándar de equipo' }], exp: 'Robustez combina prevención, captura y trazabilidad.' }] },
      ],
      examSections: [
        { title: 'Resolución de problema de negocio', questions: [{ type: 'choice', q: 'Debes procesar un CSV diario con datos incompletos. ¿Qué arquitectura minimiza fallos?', opts: ['Leer todo y asumir formato perfecto', 'Validar filas, registrar errores y continuar con datos válidos', 'Abortar al primer error sin reporte', 'Modificar archivo fuente manualmente cada día'], ans: 1, exp: 'La resiliencia operativa exige validación y trazabilidad.' }, { type: 'truefalse', q: 'Separar parseo, transformación y exportación en funciones distintas mejora mantenibilidad.', ans: true, exp: 'Facilita pruebas y evolución del pipeline.',
              qFalse: 'Resolver parseo, transformación y exportación en una única función facilita el mantenimiento del script.',
              expFalse: 'Separar las etapas permite probar y cambiar cada una por separado; juntarlas acopla todo el flujo.'  }, { type: 'match', q: 'Relaciona etapa y objetivo:', pairs: [{ left: 'Parseo', right: 'Interpretar datos de entrada' }, { left: 'Validación', right: 'Garantizar calidad mínima' }, { left: 'Transformación', right: 'Aplicar reglas de negocio' }, { left: 'Salida', right: 'Persistir resultado confiable' }], exp: 'Un pipeline claro reduce incidencias en producción.' }] },
        { title: 'Calidad y operación segura', questions: [{ type: 'choice', q: 'Si un script crítico falla en producción, ¿qué evidencia es más útil para diagnosticar?', opts: ['Solo mensaje "Error"', 'Logs con contexto, timestamp y causa específica', 'Captura de pantalla aislada', 'Reiniciar servidor sin análisis'], ans: 1, exp: 'Sin contexto, la recuperación se vuelve lenta e incierta.' }, { type: 'truefalse', q: 'Silenciar excepciones críticas aumenta riesgo de corrupción de datos.', ans: true, exp: 'Ocultar fallos impide respuesta temprana.',
              qFalse: 'Capturar toda excepción con un except vacío es buena práctica porque evita que el script se detenga.',
              expFalse: 'Silenciar el error deja pasar datos corruptos sin aviso; es peor que fallar de forma visible.'  }, { type: 'match', q: 'Relaciona práctica y impacto operativo:', pairs: [{ left: 'Pruebas unitarias', right: 'Reducir regresiones lógicas' }, { left: 'Linting', right: 'Uniformidad de estilo y errores tempranos' }, { left: 'Manejo de excepciones', right: 'Respuestas controladas ante fallos' }, { left: 'Validación de esquema', right: 'Evitar datos inválidos' }], exp: 'Calidad técnica es preventiva, no reactiva.' }] },
      ],
    },
    javascript: {
      title: 'JavaScript',
      category: 'web',
      icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968292.png',
      requirements: ['Navegador moderno', 'Editor de código', 'Conocimientos básicos de HTML/CSS'],
      docs: { label: 'MDN JavaScript', url: 'https://developer.mozilla.org/es/docs/Web/JavaScript' },
      certModules: ['Fundamentos JS', 'Funciones y asincronía', 'DOM y eventos', 'Integración con APIs'],
      lessons: [
        { id: 'javascript-l1', title: 'Variables, tipos y scope', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es JavaScript y para qué sirve? Entenderás su papel en la web interactiva y cómo manejar estado con seguridad.', requirements: ['Navegador moderno', 'Editor de código'], steps: ['Diferenciar var, let y const', 'Comprobar tipos con typeof', 'Practicar scope de bloque y función', 'Evitar redeclaraciones confusas', 'Escribir script simple sin variables globales'], resources: { video: 'https://www.youtube.com/watch?v=W6NZfCO5SIk', docs: 'Variables y alcance en JS', docsUrl: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Grammar_and_types' }, tip: 'Usa const por defecto y let solo cuando realmente reasignes.' },
        { id: 'javascript-l2', title: 'Funciones y patrones modernos', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué son las funciones y para qué sirven? Esta lección cubre encapsulación de lógica, claridad y reutilización en frontend.', requirements: ['Bases de variables en JS', 'Práctica en consola del navegador'], steps: ['Definir funciones declarativas y flecha', 'Pasar funciones como argumento', 'Crear closures simples', 'Aplicar map/filter/reduce en arrays', 'Refactorizar bloque repetido a función reutilizable'], resources: { video: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', docs: 'Funciones en JavaScript', docsUrl: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Functions' }, tip: 'Las funciones pequeñas facilitan debug y pruebas.' },
        { id: 'javascript-l3', title: 'DOM, eventos y accesibilidad', section: 'Módulo 3', duration: '15 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es el DOM y para qué sirve? Aprenderás a manipular interfaz y eventos de forma robusta y accesible.', requirements: ['Conocimientos básicos de HTML/CSS', 'Funciones básicas en JS'], steps: ['Seleccionar nodos con querySelector', 'Escuchar eventos con addEventListener', 'Modificar clases y atributos dinámicamente', 'Implementar foco visible y teclado', 'Construir componente interactivo pequeño'], resources: { video: 'https://www.youtube.com/watch?v=5fb2aPlgoys', docs: 'Introducción al DOM', docsUrl: 'https://developer.mozilla.org/es/docs/Web/API/Document_Object_Model/Introduction' }, tip: 'No dependas solo del clic; soporta teclado en componentes interactivos.' },
        { id: 'javascript-l4', title: 'Asincronía con Promises y async/await', section: 'Módulo 4', duration: '13 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es la asincronía y para qué sirve? Verás cómo coordinar tareas no bloqueantes y manejar errores de red.', requirements: ['Funciones en JS', 'Conceptos básicos de HTTP'], steps: ['Crear Promise y resolver/rechazar casos', 'Consumir promesas con then/catch', 'Reescribir flujo con async/await', 'Aplicar try/catch en peticiones', 'Mostrar estados loading, success y error'], resources: { video: 'https://www.youtube.com/watch?v=PoRJizFvM7s', docs: 'Promesas en JavaScript', docsUrl: 'https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Promise' }, tip: 'Siempre maneja errores de red y respuestas no exitosas.' },
        { id: 'javascript-l5', title: 'Integración con APIs y arquitectura cliente', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es integrar APIs y para qué sirve? Aprenderás a consumir servicios externos con contratos claros y manejo de estado.', requirements: ['Asincronía con async/await', 'Conocimiento básico de JSON'], steps: ['Consumir endpoint REST con fetch', 'Validar response.ok y parsear JSON', 'Normalizar datos antes de renderizar', 'Cachear respuestas críticas de forma simple', 'Aplicar patrón de servicio para separar lógica'], resources: { video: 'https://www.youtube.com/watch?v=cuEtnrL9-H0', docs: 'Fetch API en MDN', docsUrl: 'https://developer.mozilla.org/es/docs/Web/API/Fetch_API' }, tip: 'Separa capa de datos y capa UI para escalar mejor.' },
      ],
      quizSections: [
        { title: 'Variables, tipos y scope', questions: [{ type: 'choice', q: '¿Qué decisión minimiza bugs de redeclaración en JavaScript moderno?', opts: ['Usar var en todo archivo', 'Preferir const/let con scope de bloque', 'Guardar estado en window', 'Evitar funciones'], ans: 1, exp: 'const/let reducen ambigüedad y fugas de alcance.' }, { type: 'truefalse', q: 'El scope de bloque de let/const ayuda a contener estado temporal.', ans: true, exp: 'Evita efectos laterales indeseados.',
              qFalse: 'let y const tienen alcance de función igual que var, así que no acotan el estado temporal.',
              expFalse: 'let y const tienen alcance de bloque: sólo existen dentro de las llaves donde se declaran.'  }, { type: 'match', q: 'Relaciona declaración y comportamiento:', pairs: [{ left: 'const', right: 'No permite reasignación del binding' }, { left: 'let', right: 'Reasignable con scope de bloque' }, { left: 'var', right: 'Scope de función y hoisting tradicional' }, { left: 'typeof', right: 'Inspeccionar tipo en runtime' }], exp: 'Conocer semántica de variables evita errores sutiles.' }] },
        { title: 'Funciones y patrones modernos', questions: [{ type: 'choice', q: '¿Qué patrón mejora reutilización sin duplicar lógica en arrays?', opts: ['for anidado en cada pantalla', 'map/filter/reduce con funciones puras', 'Copiar código por módulo', 'if extensos en cadena'], ans: 1, exp: 'La programación funcional reduce ruido y errores.' }, { type: 'truefalse', q: 'Una closure puede conservar estado privado entre invocaciones.', ans: true, exp: 'Es útil para encapsular comportamiento.',
              qFalse: 'Una closure pierde su estado en cuanto termina la función que la creó.',
              expFalse: 'La closure mantiene vivo el entorno donde se creó, por eso conserva el estado entre llamadas.'  }, { type: 'match', q: 'Relaciona método y propósito:', pairs: [{ left: 'map', right: 'Transformar cada elemento' }, { left: 'filter', right: 'Seleccionar subconjunto' }, { left: 'reduce', right: 'Acumular resultado único' }, { left: 'forEach', right: 'Efecto secundario por elemento' }], exp: 'Elegir método correcto mejora legibilidad.' }] },
        { title: 'DOM, eventos y accesibilidad', questions: [{ type: 'choice', q: 'En una lista dinámica, ¿qué técnica reduce listeners redundantes?', opts: ['Agregar listener por cada nodo nuevo', 'Delegación de eventos en contenedor padre', 'Recargar página tras cada clic', 'Usar inline onclick en HTML'], ans: 1, exp: 'La delegación escala mejor con contenido dinámico.' }, { type: 'truefalse', q: 'Agregar soporte de teclado en componentes interactivos mejora accesibilidad.', ans: true, exp: 'No todos los usuarios navegan con mouse.',
              qFalse: 'Si el componente funciona con ratón, añadir soporte de teclado no aporta accesibilidad.',
              expFalse: 'Muchas personas navegan sólo con teclado o lector de pantalla; sin soporte de teclado el componente les resulta inutilizable.'  }, { type: 'match', q: 'Relaciona API y utilidad:', pairs: [{ left: 'querySelector', right: 'Seleccionar primer nodo coincidente' }, { left: 'classList.toggle', right: 'Activar/desactivar estado visual' }, { left: 'addEventListener', right: 'Registrar interacción del usuario' }, { left: 'setAttribute', right: 'Actualizar metadatos del nodo' }], exp: 'Manipular DOM con intención evita inconsistencias UI.' }] },
        { title: 'Asincronía con Promises y async/await', questions: [{ type: 'choice', q: '¿Cuál es la ventaja principal de async/await frente a cadenas largas de then?', opts: ['Elimina necesidad de manejo de errores', 'Mejora legibilidad secuencial del flujo asíncrono', 'Convierte código en síncrono real', 'Evita toda latencia de red'], ans: 1, exp: 'Sigue siendo asíncrono, pero con sintaxis más clara.' }, { type: 'truefalse', q: 'try/catch también captura errores lanzados por await en una función async.', ans: true, exp: 'Permite centralizar manejo de fallos.',
              qFalse: 'try/catch no puede capturar el error de un await: hay que usar .catch() obligatoriamente.',
              expFalse: 'Dentro de una función async, await lanza la excepción y try/catch la captura con normalidad.'  }, { type: 'match', q: 'Relaciona concepto y función:', pairs: [{ left: 'Promise', right: 'Representa resultado futuro' }, { left: 'await', right: 'Pausa lógica dentro de async' }, { left: 'catch', right: 'Gestionar error asíncrono' }, { left: 'finally', right: 'Ejecutar limpieza final' }], exp: 'Un flujo asíncrono robusto contempla éxito y error.' }] },
        { title: 'Integración con APIs y arquitectura cliente', questions: [{ type: 'choice', q: '¿Qué práctica evita que la UI dependa directamente del formato crudo de API?', opts: ['Renderizar respuesta cruda en pantalla', 'Normalizar datos en una capa de servicio', 'Duplicar fetch en cada componente', 'Ignorar contratos de API'], ans: 1, exp: 'La normalización desacopla backend y presentación.' }, { type: 'truefalse', q: 'Validar response.ok antes de parsear JSON evita errores silenciosos.', ans: true, exp: 'No toda respuesta HTTP trae éxito.',
              qFalse: 'fetch lanza una excepción automáticamente cuando el servidor responde 404 o 500.',
              expFalse: 'fetch sólo falla por error de red: un 404 o un 500 llegan como respuesta, por eso hay que comprobar response.ok.'  }, { type: 'match', q: 'Relaciona estrategia y beneficio:', pairs: [{ left: 'Service layer', right: 'Reutilizar acceso a datos' }, { left: 'Estado de carga', right: 'Feedback claro al usuario' }, { left: 'Cache simple', right: 'Reducir latencia repetida' }, { left: 'Fallback de error', right: 'Mantener UX ante fallos' }], exp: 'Arquitectura cliente robusta mejora resiliencia.' }] },
      ],
      examSections: [
        { title: 'Implementación frontend real', questions: [{ type: 'choice', q: 'Debes construir un panel que consulta tres endpoints con dependencia entre resultados. ¿Qué diseño es más mantenible?', opts: ['Todo en una función global gigantesca', 'Servicios separados + orquestación async/await + manejo central de errores', 'Peticiones anidadas sin control de fallo', 'Refrescar página ante cualquier error'], ans: 1, exp: 'Separar responsabilidades facilita evolución y diagnóstico.' }, { type: 'truefalse', q: 'La falta de estados de carga y error genera experiencias ambiguas para el usuario final.', ans: true, exp: 'UX robusta comunica siempre qué está ocurriendo.',
              qFalse: 'Mientras la petición termine rápido, mostrar estados de carga y de error es innecesario.',
              expFalse: 'Sin estados visibles el usuario no sabe si la app trabaja, falló o terminó; la latencia nunca está garantizada.'  }, { type: 'match', q: 'Relaciona problema y mitigación técnica:', pairs: [{ left: 'Race condition', right: 'Cancelar solicitud obsoleta' }, { left: 'API lenta', right: 'Mostrar estado loading' }, { left: 'Error 500', right: 'Fallback y mensaje claro' }, { left: 'Datos incompletos', right: 'Validación defensiva antes de render' }], exp: 'La ingeniería frontend exige resiliencia operacional.' }] },
        { title: 'Calidad de código y escalabilidad', questions: [{ type: 'choice', q: 'En revisión de código, ¿qué señal indica deuda técnica de arquitectura?', opts: ['Funciones pequeñas con responsabilidad única', 'Acoplamiento fuerte entre UI y llamadas fetch en muchos puntos', 'Manejo de errores consistente', 'Nombres semánticos en módulos'], ans: 1, exp: 'El acoplamiento disperso dificulta mantenimiento.' }, { type: 'truefalse', q: 'Pruebas de integración en flujos asíncronos reducen regresiones en producción.', ans: true, exp: 'Verifican coordinación entre capas y servicios.',
              qFalse: 'Las pruebas unitarias bastan para cubrir los flujos asíncronos y sus integraciones.',
              expFalse: 'Las unitarias aíslan piezas; los fallos de flujos asíncronos suelen aparecer en la integración entre ellas.'  }, { type: 'match', q: 'Relaciona práctica y resultado de negocio:', pairs: [{ left: 'Arquitectura modular', right: 'Entrega más rápida de nuevas features' }, { left: 'Manejo de errores consistente', right: 'Menos incidencias visibles al usuario' }, { left: 'Contrato de datos definido', right: 'Integración predecible con backend' }, { left: 'Code review disciplinado', right: 'Calidad sostenida en el tiempo' }], exp: 'Escalabilidad técnica impacta directamente el producto.' }] },
      ],
    },
    html: {
      title: 'HTML',
      category: 'web',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732212.png',
      requirements: ['Editor de código', 'Navegador web', 'Bases mínimas de internet'],
      docs: { label: 'MDN HTML', url: 'https://developer.mozilla.org/es/docs/Web/HTML' },
      certModules: ['Estructura HTML5', 'Semántica y accesibilidad', 'Formularios', 'Buenas prácticas SEO'],
      lessons: [
        { id: 'html-l1', title: 'Estructura base HTML5', section: 'Módulo 1', duration: '11 min', level: LEVELS.BEGINNER, description: '¿Qué es HTML y para qué sirve? Esta lección define la estructura mínima para construir documentos web válidos y claros.', requirements: ['Editor de código', 'Navegador web'], steps: ['Crear archivo HTML desde cero', 'Agregar doctype, html, head y body', 'Configurar charset y viewport', 'Añadir título y metadatos básicos', 'Validar estructura con herramienta estándar'], resources: { video: 'https://www.youtube.com/watch?v=UB1O30fR-EE', docs: 'Estructura de documento HTML', docsUrl: 'https://developer.mozilla.org/es/docs/Learn/HTML/Introduction_to_HTML/Getting_started' }, tip: 'Un documento limpio desde inicio evita deuda estructural.' },
        { id: 'html-l2', title: 'Contenido semántico y jerarquía', section: 'Módulo 2', duration: '13 min', level: LEVELS.BEGINNER, description: '¿Qué es la semántica HTML y para qué sirve? Aprenderás a etiquetar contenido para mejorar comprensión de usuarios y buscadores.', requirements: ['Estructura HTML básica', 'Comprensión de encabezados'], steps: ['Usar h1-h6 con jerarquía coherente', 'Separar contenido en section y article', 'Definir navegación con nav', 'Incluir footer con información contextual', 'Revisar outline lógico del documento'], resources: { video: 'https://www.youtube.com/watch?v=6mM7M4N6f0E', docs: 'HTML semántico', docsUrl: 'https://developer.mozilla.org/es/docs/Glossary/Semantics#sem%C3%A1ntica_en_html' }, tip: 'Semántica no es estética: es significado estructural.' },
        { id: 'html-l3', title: 'Enlaces, multimedia y listas', section: 'Módulo 3', duration: '12 min', level: LEVELS.INTERMEDIATE, description: '¿Qué son los elementos de contenido y para qué sirven? Verás cómo construir páginas informativas y navegables con buenas prácticas.', requirements: ['Bases de semántica HTML', 'Recursos de contenido preparados'], steps: ['Crear enlaces internos y externos seguros', 'Insertar imágenes con alt descriptivo', 'Agregar audio/video con controles nativos', 'Usar listas ordenadas y no ordenadas correctamente', 'Comprobar carga y fallback de recursos'], resources: { video: 'https://www.youtube.com/watch?v=qz0aGYrrlhU', docs: 'Elementos multimedia HTML', docsUrl: 'https://developer.mozilla.org/es/docs/Learn/HTML/Multimedia_and_embedding' }, tip: 'Todo enlace debe comunicar destino sin depender del contexto visual.' },
        { id: 'html-l4', title: 'Formularios accesibles', section: 'Módulo 4', duration: '14 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es un formulario accesible y para qué sirve? Aprenderás a recolectar datos con validaciones claras y buena experiencia de uso.', requirements: ['Estructura HTML válida', 'Conocimiento básico de inputs'], steps: ['Construir formulario con label asociados', 'Usar tipos de input apropiados', 'Aplicar validaciones nativas requeridas', 'Agrupar campos con fieldset y legend', 'Probar navegación completa con teclado'], resources: { video: 'https://www.youtube.com/watch?v=fNcJuPIZ2WE', docs: 'Formularios en HTML', docsUrl: 'https://developer.mozilla.org/es/docs/Learn/Forms' }, tip: 'Un error de formulario debe explicar qué corregir y cómo hacerlo.' },
        { id: 'html-l5', title: 'SEO técnico y calidad estructural', section: 'Módulo 5', duration: '15 min', level: LEVELS.ADVANCED, description: '¿Qué es optimizar HTML para SEO y para qué sirve? Esta lección conecta estructura, rendimiento y descubribilidad en buscadores.', requirements: ['Dominio de estructura y semántica', 'Conocimiento básico de metadatos'], steps: ['Configurar title y meta description útiles', 'Revisar encabezados para intención de búsqueda', 'Añadir atributos de rendimiento como loading', 'Detectar duplicidades de estructura y contenido', 'Auditar documento con checklist SEO técnico'], resources: { video: 'https://www.youtube.com/watch?v=xsVTqzratPs', docs: 'Buenas prácticas HTML', docsUrl: 'https://developer.mozilla.org/es/docs/Learn/HTML/Introduction_to_HTML' }, tip: 'SEO técnico empieza por un HTML semántico y rápido.' },
      ],
      quizSections: [
        { title: 'Estructura base HTML5', questions: [{ type: 'choice', q: '¿Qué elemento define metadatos no visibles al usuario pero críticos para render y SEO?', opts: ['body', 'head', 'main', 'footer'], ans: 1, exp: 'head encapsula metadatos de documento.' }, { type: 'truefalse', q: 'El doctype correcto ayuda a que el navegador use modo estándar.', ans: true, exp: 'Evita render inconsistente entre motores.',
              qFalse: 'Omitir el doctype no cambia la forma en que el navegador interpreta el documento.',
              expFalse: 'Sin doctype el navegador entra en quirks mode y aplica reglas heredadas que rompen el layout.'  }, { type: 'match', q: 'Relaciona etiqueta y propósito:', pairs: [{ left: '<html>', right: 'Raíz del documento' }, { left: '<head>', right: 'Metadatos de la página' }, { left: '<body>', right: 'Contenido visible' }, { left: '<title>', right: 'Título de pestaña y SEO base' }], exp: 'Una base sólida garantiza compatibilidad.' }] },
        { title: 'Contenido semántico y jerarquía', questions: [{ type: 'choice', q: '¿Qué error semántico afecta más comprensión de lectores de pantalla?', opts: ['Usar CSS externo', 'Saltar jerarquías de encabezados sin lógica', 'Incluir un footer', 'Usar listas ordenadas'], ans: 1, exp: 'La jerarquía guía navegación asistiva.' }, { type: 'truefalse', q: 'article debe usarse para contenido autónomo con sentido por sí mismo.', ans: true, exp: 'Su semántica indica independencia del bloque.',
              qFalse: 'La etiqueta article es un contenedor genérico intercambiable con div en cualquier situación.',
              expFalse: 'article comunica que el contenido tiene sentido por sí solo; div no aporta ninguna semántica.'  }, { type: 'match', q: 'Relaciona etiqueta y función:', pairs: [{ left: '<nav>', right: 'Enlaces de navegación principal' }, { left: '<section>', right: 'Agrupar contenido temático' }, { left: '<article>', right: 'Unidad de contenido independiente' }, { left: '<aside>', right: 'Contenido complementario' }], exp: 'La semántica mejora estructura y mantenimiento.' }] },
        { title: 'Enlaces, multimedia y listas', questions: [{ type: 'choice', q: '¿Qué práctica mejora seguridad al abrir enlaces externos en nueva pestaña?', opts: ['target="_blank" sin más', 'Agregar rel="noopener noreferrer"', 'Quitar atributo href', 'Convertir enlace en botón sin función'], ans: 1, exp: 'Previene acceso del destino al contexto original.' }, { type: 'truefalse', q: 'El atributo alt debe describir la función informativa de la imagen.', ans: true, exp: 'No es opcional en imágenes con valor de contenido.',
              qFalse: 'El atributo alt debe repetir el nombre del archivo de imagen para mejorar el posicionamiento.',
              expFalse: 'alt describe qué aporta la imagen; repetir el nombre del archivo no informa a quien usa lector de pantalla.'  }, { type: 'match', q: 'Relaciona elemento y uso correcto:', pairs: [{ left: '<a>', right: 'Navegación entre recursos' }, { left: '<img>', right: 'Mostrar imagen con texto alternativo' }, { left: '<ul>', right: 'Lista sin orden de prioridad' }, { left: '<ol>', right: 'Secuencia con orden explícito' }], exp: 'Los elementos deben corresponder al significado del contenido.' }] },
        { title: 'Formularios accesibles', questions: [{ type: 'choice', q: '¿Qué combinación mejora usabilidad y validación básica en correo electrónico?', opts: ['input type="text"', 'input type="email" + label asociado', 'placeholder sin label', 'div con contenteditable'], ans: 1, exp: 'El tipo correcto habilita validación y teclado optimizado.' }, { type: 'truefalse', q: 'Un placeholder no reemplaza a un label accesible.', ans: true, exp: 'El label mantiene contexto persistente.',
              qFalse: 'Un placeholder cumple la misma función que un label y permite prescindir de él.',
              expFalse: 'El placeholder desaparece al escribir y muchos lectores de pantalla no lo anuncian: el label sigue siendo necesario.'  }, { type: 'match', q: 'Relaciona componente y beneficio:', pairs: [{ left: 'label for', right: 'Asociación explícita campo-texto' }, { left: 'required', right: 'Validación nativa mínima' }, { left: 'fieldset', right: 'Agrupación lógica de campos' }, { left: 'aria-describedby', right: 'Contexto adicional de ayuda/error' }], exp: 'La accesibilidad en formularios depende de estructura semántica.' }] },
        { title: 'SEO técnico y calidad estructural', questions: [{ type: 'choice', q: '¿Qué práctica impacta directamente indexación y comprensión temática?', opts: ['Usar múltiples h1 sin criterio', 'Title y headings alineados a intención de búsqueda', 'Eliminar meta description siempre', 'Ocultar todo texto en imágenes'], ans: 1, exp: 'Coherencia semántica ayuda a motores y usuarios.' }, { type: 'truefalse', q: 'Un HTML semántico y liviano contribuye al rendimiento percibido.', ans: true, exp: 'Estructura limpia facilita parseo y render.',
              qFalse: 'La semántica del HTML es puramente estética y no influye en el rendimiento percibido.',
              expFalse: 'Un marcado limpio se analiza y se pinta antes, y permite al navegador priorizar mejor el contenido.'  }, { type: 'match', q: 'Relaciona señal técnica y efecto SEO:', pairs: [{ left: 'Meta description clara', right: 'Mejor contexto en resultados' }, { left: 'Encabezados ordenados', right: 'Comprensión jerárquica del contenido' }, { left: 'Imágenes optimizadas', right: 'Carga más rápida de página' }, { left: 'Landmarks semánticos', right: 'Mayor accesibilidad estructural' }], exp: 'SEO técnico y accesibilidad se refuerzan mutuamente.' }] },
      ],
      examSections: [
        { title: 'Construcción de página corporativa', questions: [{ type: 'choice', q: 'Debes publicar una landing accesible y orientada a conversión. ¿Qué orden de trabajo es más sólido?', opts: ['Diseñar estilos primero sin estructura', 'Definir estructura semántica, luego contenido, luego optimización técnica', 'Pegar HTML generado automático sin revisión', 'Priorizar animaciones sobre contenido'], ans: 1, exp: 'Una base semántica facilita accesibilidad, SEO y mantenimiento.' }, { type: 'truefalse', q: 'Si los formularios no tienen labels visibles o equivalentes, aumentan errores de usuario.', ans: true, exp: 'La falta de contexto afecta finalización del formulario.',
              qFalse: 'Quitar los labels de un formulario lo simplifica y reduce los errores de quien lo rellena.',
              expFalse: 'Sin label la persona debe adivinar qué se le pide, y los errores de captura aumentan.'  }, { type: 'match', q: 'Relaciona revisión y objetivo:', pairs: [{ left: 'Validador HTML', right: 'Detectar estructura inválida' }, { left: 'Prueba con teclado', right: 'Verificar navegación accesible' }, { left: 'Auditoría de metadatos', right: 'Mejorar descubribilidad' }, { left: 'Optimización de medios', right: 'Reducir tiempos de carga' }], exp: 'La calidad final depende de controles técnicos concretos.' }] },
        { title: 'Gobernanza de calidad web', questions: [{ type: 'choice', q: 'En mantenimiento continuo, ¿qué práctica reduce regresiones estructurales?', opts: ['Editar directamente producción sin revisión', 'Usar checklist semántico y revisión por pares', 'Eliminar documentación del markup', 'Mezclar estructura con scripts embebidos extensos'], ans: 1, exp: 'La estandarización evita degradación progresiva.' }, { type: 'truefalse', q: 'Un heading mal jerarquizado puede afectar tanto accesibilidad como SEO.', ans: true, exp: 'Ambos sistemas dependen de estructura clara.',
              qFalse: 'Los niveles de encabezado sólo cambian el tamaño del texto y no afectan accesibilidad ni posicionamiento.',
              expFalse: 'Los headings construyen el índice del documento: lectores de pantalla y buscadores navegan por él.'  }, { type: 'match', q: 'Relaciona riesgo y mitigación:', pairs: [{ left: 'Contenido sin contexto', right: 'Encabezados y landmarks correctos' }, { left: 'Campos ambiguos', right: 'Labels y mensajes de error claros' }, { left: 'Carga lenta', right: 'Optimización de recursos multimedia' }, { left: 'Semántica inconsistente', right: 'Guía de marcado compartida' }], exp: 'La gobernanza técnica sostiene calidad a largo plazo.' }] },
      ],
    },
    css: {
      title: 'CSS',
      category: 'web',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732190.png',
      requirements: ['Conocimientos básicos de HTML', 'Editor de código', 'Navegador con DevTools'],
      docs: { label: 'MDN CSS', url: 'https://developer.mozilla.org/es/docs/Web/CSS' },
      certModules: ['Fundamentos y especificidad', 'Modelo de caja', 'Flexbox/Grid', 'Responsive y animaciones'],
      lessons: [
        { id: 'css-l1', title: 'Selectores y cascada', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es CSS y para qué sirve? Comprenderás cómo aplica estilos mediante selectores, herencia y cascada.', requirements: ['Conocimientos básicos de HTML', 'Editor de código'], steps: ['Aplicar reglas por etiqueta, clase e id', 'Comparar especificidad de selectores', 'Evitar abuso de !important', 'Organizar estilos por componente', 'Inspeccionar reglas en DevTools'], resources: { video: 'https://www.youtube.com/watch?v=1PnVor36_40', docs: 'Selectores CSS', docsUrl: 'https://developer.mozilla.org/es/docs/Web/CSS/CSS_selectors' }, tip: 'La mejor especificidad es la mínima necesaria.' },
        { id: 'css-l2', title: 'Box model y flujo visual', section: 'Módulo 2', duration: '13 min', level: LEVELS.BEGINNER, description: '¿Qué es el modelo de caja y para qué sirve? Aprenderás a controlar dimensiones, espaciados y distribución visual confiable.', requirements: ['Selectores básicos', 'DevTools disponible'], steps: ['Configurar box-sizing global', 'Diferenciar margin, border y padding', 'Ajustar width/height de componentes', 'Detectar colapsos de margen', 'Construir tarjeta con espaciado consistente'], resources: { video: 'https://www.youtube.com/watch?v=rIO5326FgPE', docs: 'Modelo de caja CSS', docsUrl: 'https://developer.mozilla.org/es/docs/Learn/CSS/Building_blocks/The_box_model' }, tip: 'border-box simplifica cálculos en casi todos los layouts.' },
        { id: 'css-l3', title: 'Flexbox para layout unidimensional', section: 'Módulo 3', duration: '14 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es Flexbox y para qué sirve? Dominarás alineación y distribución de elementos en filas/columnas adaptables.', requirements: ['Modelo de caja dominado', 'Práctica con componentes UI'], steps: ['Crear contenedor flex base', 'Ajustar eje principal y transversal', 'Configurar grow/shrink/basis', 'Aplicar gap y wrapping', 'Resolver layout de navegación responsive'], resources: { video: 'https://www.youtube.com/watch?v=JJSoEo8JSnc', docs: 'Guía de Flexbox', docsUrl: 'https://developer.mozilla.org/es/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox' }, tip: 'Piensa primero en ejes antes de tocar propiedades de alineación.' },
        { id: 'css-l4', title: 'Grid para estructuras complejas', section: 'Módulo 4', duration: '14 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es CSS Grid y para qué sirve? Esta lección cubre diseños bidimensionales robustos para interfaces modernas.', requirements: ['Conocimiento de Flexbox', 'Maquetación básica realizada'], steps: ['Definir columnas y filas con fr y minmax', 'Ubicar áreas con grid-template-areas', 'Combinar grid y auto-placement', 'Diseñar dashboard con zonas principales', 'Ajustar comportamiento en breakpoints'], resources: { video: 'https://www.youtube.com/watch?v=t6CBKf8K_Ac', docs: 'Introducción a CSS Grid', docsUrl: 'https://developer.mozilla.org/es/docs/Web/CSS/CSS_grid_layout' }, tip: 'Grid para macroestructura; Flexbox para componentes internos.' },
        { id: 'css-l5', title: 'Responsive, estados y microinteracciones', section: 'Módulo 5', duration: '15 min', level: LEVELS.ADVANCED, description: '¿Qué es diseñar responsive y para qué sirve? Aprenderás a adaptar interfaces, transiciones y accesibilidad de movimiento.', requirements: ['Flexbox y Grid', 'Conceptos de accesibilidad básica'], steps: ['Aplicar media queries mobile-first', 'Usar unidades fluidas como rem y clamp', 'Definir estados hover/focus/active claros', 'Añadir transiciones con propósito', 'Respetar prefers-reduced-motion'], resources: { video: 'https://www.youtube.com/watch?v=srvUrASNj0s', docs: 'Diseño responsive en CSS', docsUrl: 'https://developer.mozilla.org/es/docs/Learn/CSS/CSS_layout/Responsive_Design' }, tip: 'Nunca sacrifiques accesibilidad por animación visual.' },
      ],
      quizSections: [
        { title: 'Selectores y cascada', questions: [{ type: 'choice', q: '¿Qué estrategia de selectores reduce fragilidad en proyectos grandes?', opts: ['Selectores largos por jerarquía profunda', 'Clases semánticas orientadas a componente', 'Uso masivo de id', 'Inline styles en cada nodo'], ans: 1, exp: 'Las clases por componente escalan con menor acoplamiento.' }, { type: 'truefalse', q: 'El abuso de !important suele indicar problemas de arquitectura de estilos.', ans: true, exp: 'Es síntoma de guerra de especificidad.',
              qFalse: 'Usar !important de forma sistemática es la manera recomendada de resolver conflictos de estilos.',
              expFalse: '!important tapa el síntoma y rompe la cascada; el conflicto real está en la especificidad y la organización.'  }, { type: 'match', q: 'Relaciona selector y especificidad relativa:', pairs: [{ left: '#id', right: 'Alta prioridad específica' }, { left: '.clase', right: 'Reutilizable y controlable' }, { left: 'elemento', right: 'Base global de estilo' }, { left: ':root', right: 'Contexto para variables globales' }], exp: 'Conocer especificidad evita sobreescrituras caóticas.' }] },
        { title: 'Box model y flujo visual', questions: [{ type: 'choice', q: 'Si un componente desborda su contenedor pese a width definido, ¿qué revisar primero?', opts: ['Tipo de fuente', 'Box model y padding/border acumulado', 'Color de fondo', 'Nombre de clase'], ans: 1, exp: 'Padding y border alteran tamaño total si no hay border-box.' }, { type: 'truefalse', q: 'margin controla espacio externo; padding espacio interno.', ans: true, exp: 'Diferenciarlos es clave para composición estable.',
              qFalse: 'margin controla el espacio interno del elemento y padding el espacio que lo separa de los demás.',
              expFalse: 'Es al revés: padding es el espacio interior, entre el borde y el contenido; margin separa del exterior.'  }, { type: 'match', q: 'Relaciona propiedad y efecto:', pairs: [{ left: 'margin', right: 'Separación externa entre elementos' }, { left: 'padding', right: 'Respiro interno del contenido' }, { left: 'border', right: 'Límite visual del bloque' }, { left: 'box-sizing', right: 'Modelo de cálculo de dimensiones' }], exp: 'El box model impacta layout y legibilidad.' }] },
        { title: 'Flexbox para layout unidimensional', questions: [{ type: 'choice', q: '¿Qué propiedad controla distribución de ítems sobre el eje principal?', opts: ['align-items', 'justify-content', 'z-index', 'font-weight'], ans: 1, exp: 'justify-content opera sobre el eje principal.' }, { type: 'truefalse', q: 'gap en flex permite espaciar elementos sin hacks de margin lateral.', ans: true, exp: 'Simplifica mantenimiento visual.',
              qFalse: 'La propiedad gap sólo funciona en Grid, por lo que en Flexbox hay que espaciar con márgenes.',
              expFalse: 'gap está soportado en Flexbox y evita los márgenes laterales y el clásico ajuste con :last-child.'  }, { type: 'match', q: 'Relaciona propiedad y resultado:', pairs: [{ left: 'display:flex', right: 'Activa contexto flexible' }, { left: 'flex-wrap', right: 'Permite salto de línea de ítems' }, { left: 'align-items', right: 'Alinea sobre eje transversal' }, { left: 'flex-grow', right: 'Distribuye espacio sobrante' }], exp: 'Flexbox resuelve la mayoría de layouts lineales.' }] },
        { title: 'Grid para estructuras complejas', questions: [{ type: 'choice', q: '¿Qué ventaja principal ofrece Grid frente a Flexbox en dashboards?', opts: ['Mejor tipografía por defecto', 'Control explícito bidimensional de filas y columnas', 'Evita cualquier media query', 'Reemplaza HTML semántico'], ans: 1, exp: 'Grid modela dos dimensiones con precisión.' }, { type: 'truefalse', q: 'grid-template-areas mejora legibilidad de layouts complejos.', ans: true, exp: 'Permite visualizar estructura de forma declarativa.',
              qFalse: 'grid-template-areas complica la lectura del layout frente a posicionar cada elemento por número de línea.',
              expFalse: 'Nombrar las zonas dibuja el layout en el propio CSS; los números de línea obligan a reconstruirlo mentalmente.'  }, { type: 'match', q: 'Relaciona concepto Grid y uso:', pairs: [{ left: 'fr', right: 'Fracción del espacio disponible' }, { left: 'minmax', right: 'Rango adaptable de tamaño' }, { left: 'auto-fit', right: 'Columnas responsivas automáticas' }, { left: 'grid-area', right: 'Asignar bloque a zona nombrada' }], exp: 'Estas herramientas habilitan diseños resistentes a cambios.' }] },
        { title: 'Responsive, estados y microinteracciones', questions: [{ type: 'choice', q: '¿Qué enfoque responsive es más sostenible para múltiples dispositivos?', opts: ['Desktop-first rígido sin breakpoints', 'Mobile-first con puntos de quiebre por contenido', 'Anchos fijos para todo', 'Diseño solo para 1920px'], ans: 1, exp: 'Los breakpoints deben responder al contenido, no a dispositivos aislados.' }, { type: 'truefalse', q: 'preferes-reduced-motion debe considerarse para accesibilidad en animaciones.', ans: true, exp: 'Respeta sensibilidad al movimiento.',
              qFalse: 'Las animaciones deben ejecutarse siempre igual, sin atender la preferencia de movimiento reducido.',
              expFalse: 'Hay personas a las que el movimiento les provoca mareo o migraña; prefers-reduced-motion permite respetarlo.'  }, { type: 'match', q: 'Relaciona patrón y beneficio UX:', pairs: [{ left: ':focus-visible', right: 'Navegación por teclado clara' }, { left: 'clamp()', right: 'Escala tipográfica fluida' }, { left: 'transition', right: 'Cambios visuales graduales' }, { left: 'media query', right: 'Adaptación contextual de layout' }], exp: 'Responsive y accesibilidad deben diseñarse juntos.' }] },
      ],
      examSections: [
        { title: 'Diseño adaptable de interfaz', questions: [{ type: 'choice', q: 'Debes implementar una interfaz que funcione en móvil, tablet y desktop sin duplicar código. ¿Qué estrategia aplicas?', opts: ['Tres archivos CSS aislados sin sistema común', 'Arquitectura mobile-first con tokens y componentes reutilizables', 'Layout fijo con scroll horizontal', 'Inline styles por pantalla'], ans: 1, exp: 'La reutilización sistemática reduce mantenimiento y errores.' }, { type: 'truefalse', q: 'Un sistema de espaciado tokenizado mejora coherencia visual entre equipos.', ans: true, exp: 'Define reglas compartidas y predecibles.',
              qFalse: 'Elegir los valores de espaciado a ojo en cada pantalla da un resultado más coherente que usar tokens.',
              expFalse: 'Los tokens fijan una escala común; sin ella cada pantalla acumula valores distintos y el conjunto se ve irregular.'  }, { type: 'match', q: 'Relaciona problema de layout y solución:', pairs: [{ left: 'Botones desalineados', right: 'Flex alignment y gap consistente' }, { left: 'Columnas rotas en móvil', right: 'Grid con minmax y media queries' }, { left: 'Texto desproporcionado', right: 'Escala tipográfica con clamp' }, { left: 'Estado de foco invisible', right: 'Estilos focus-visible accesibles' }], exp: 'La calidad visual emerge de decisiones estructurales.' }] },
        { title: 'Operación de diseño front-end', questions: [{ type: 'choice', q: 'Si un equipo reporta estilos inconsistentes por módulo, ¿qué acción corrige causa raíz?', opts: ['Agregar !important en cada regla', 'Definir convención de arquitectura CSS y revisar PRs de estilo', 'Copiar CSS de otros proyectos', 'Eliminar componentes reutilizables'], ans: 1, exp: 'La gobernanza de estilos previene regresiones continuas.' }, { type: 'truefalse', q: 'La falta de naming conventions en CSS incrementa colisiones y deuda técnica.', ans: true, exp: 'Nombres ambiguos generan sobreescritura accidental.',
              qFalse: 'Sin convenciones de nombres el CSS crece igual de sano mientras cada persona use nombres descriptivos.',
              expFalse: 'Sin convención, dos personas eligen el mismo nombre para cosas distintas y los estilos colisionan.'  }, { type: 'match', q: 'Relaciona control de calidad y objetivo:', pairs: [{ left: 'Lint de CSS', right: 'Detección temprana de errores' }, { left: 'Design tokens', right: 'Consistencia visual global' }, { left: 'Revisión responsive', right: 'Comportamiento correcto por viewport' }, { left: 'Checklist accesible', right: 'Cumplimiento de criterios UX inclusivos' }], exp: 'Operar CSS profesional requiere estándares técnicos claros.' }] },
      ],
    },
    github: {
      title: 'GitHub',
      category: 'tools',
      icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
      requirements: ['Cuenta en GitHub', 'Git instalado localmente', 'Terminal básica'],
      docs: { label: 'Documentación oficial de GitHub', url: 'https://docs.github.com/es' },
      certModules: ['Fundamentos Git', 'Ramas y colaboración', 'Pull Requests', 'Automatización con Actions'],
      lessons: [
        { id: 'github-l1', title: 'Git y repositorios remotos', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es GitHub y para qué sirve? Aprenderás la base de control de versiones y colaboración en repositorios remotos.', requirements: ['Cuenta en GitHub', 'Git instalado localmente'], steps: ['Configurar identidad en Git', 'Inicializar repositorio local', 'Crear primer commit con mensaje claro', 'Conectar remoto en GitHub', 'Publicar rama principal con seguridad'], resources: { video: 'https://www.youtube.com/watch?v=RGOj5yH7evk', docs: 'Introducción a GitHub', docsUrl: 'https://docs.github.com/es/get-started/start-your-journey/hello-world' }, tip: 'Mensajes de commit claros reducen tiempo de revisión y soporte.' },
        { id: 'github-l2', title: 'Ramas y flujo de trabajo', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué son las ramas y para qué sirven? Verás cómo aislar cambios para desarrollar sin afectar estabilidad principal.', requirements: ['Repositorio inicial creado', 'Conocimiento de commit'], steps: ['Crear rama de feature', 'Implementar cambios aislados', 'Rebasar o actualizar con main', 'Resolver conflictos básicos', 'Preparar historial limpio para revisión'], resources: { video: 'https://www.youtube.com/watch?v=8JJ101D3knE', docs: 'Acerca de ramas', docsUrl: 'https://docs.github.com/es/get-started/using-git/about-branches' }, tip: 'Ramas pequeñas se revisan más rápido y con menor riesgo.' },
        { id: 'github-l3', title: 'Pull Requests y revisión técnica', section: 'Módulo 3', duration: '15 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es un Pull Request y para qué sirve? Aprenderás a proponer cambios trazables con discusión técnica efectiva.', requirements: ['Flujo de ramas básico', 'Capacidad de resolver conflictos simples'], steps: ['Abrir PR con contexto y objetivo', 'Añadir plan de pruebas reproducible', 'Responder comentarios de revisión', 'Aplicar cambios y actualizar rama', 'Completar merge según política del repositorio'], resources: { video: 'https://www.youtube.com/watch?v=rgbCcBNZcdQ', docs: 'Acerca de pull requests', docsUrl: 'https://docs.github.com/es/pull-requests/collaborating-with-pull-requests/proposing-changes-with-pull-requests/about-pull-requests' }, tip: 'Explica el porqué del cambio, no solo el qué.' },
        { id: 'github-l4', title: 'Gestión de issues y trazabilidad', section: 'Módulo 4', duration: '13 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es la trazabilidad de trabajo y para qué sirve? Esta lección conecta issues, commits y PRs para gestión transparente.', requirements: ['Conocimiento de PRs', 'Trabajo en equipo definido'], steps: ['Crear issue con contexto de negocio', 'Etiquetar prioridad y tipo de trabajo', 'Vincular branch/PR al issue', 'Cerrar issue con evidencia de solución', 'Generar reporte de avance del sprint'], resources: { video: 'https://www.youtube.com/watch?v=TKJ4RdhyB5Y', docs: 'Issues en GitHub', docsUrl: 'https://docs.github.com/es/issues/tracking-your-work-with-issues/about-issues' }, tip: 'Un issue bien redactado ahorra horas de interpretación.' },
        { id: 'github-l5', title: 'CI/CD inicial con GitHub Actions', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es GitHub Actions y para qué sirve? Aprenderás a automatizar pruebas y despliegues para asegurar calidad continua.', requirements: ['Conocimiento de repositorios y PRs', 'Base de terminal y scripts'], steps: ['Crear workflow en .github/workflows', 'Configurar triggers de push y pull_request', 'Ejecutar lint y tests en pipeline', 'Publicar artefactos de build', 'Bloquear merge si pipeline falla'], resources: { video: 'https://www.youtube.com/watch?v=R8_veQiYBjI', docs: 'GitHub Actions', docsUrl: 'https://docs.github.com/es/actions/learn-github-actions/understanding-github-actions' }, tip: 'Automatiza primero lo repetitivo y crítico para el negocio.',
        },
      ],
      quizSections: [
        { title: 'Git y repositorios remotos', questions: [{ type: 'choice', q: '¿Qué beneficio de negocio aporta versionar cambios con commits frecuentes?', opts: ['Eliminar necesidad de documentación', 'Auditar decisiones y revertir incidentes con menor impacto', 'Acelerar hardware del servidor', 'Evitar revisiones de código'], ans: 1, exp: 'El historial es una bitácora operativa y técnica.' }, { type: 'truefalse', q: 'Un repositorio remoto centralizado facilita colaboración y respaldo del historial.', ans: true, exp: 'Disminuye riesgo de pérdida y fragmentación.',
              qFalse: 'Trabajar sólo con el repositorio local es igual de seguro porque Git ya guarda todo el historial.',
              expFalse: 'El historial local desaparece con el equipo; el remoto es lo que permite respaldo y trabajo compartido.'  }, { type: 'match', q: 'Relaciona comando y función:', pairs: [{ left: 'git init', right: 'Inicializa repositorio local' }, { left: 'git add', right: 'Prepara cambios para commit' }, { left: 'git commit', right: 'Guarda snapshot versionado' }, { left: 'git push', right: 'Publica cambios al remoto' }], exp: 'El flujo básico sostiene colaboración ordenada.' }] },
        { title: 'Ramas y flujo de trabajo', questions: [{ type: 'choice', q: '¿Cuál es la razón principal para desarrollar en ramas feature?', opts: ['Evitar documentación', 'Aislar cambios y proteger rama estable', 'Publicar directamente en main', 'Eliminar pruebas'], ans: 1, exp: 'El aislamiento reduce riesgo operativo.' }, { type: 'truefalse', q: 'Actualizar la rama feature con main antes del merge reduce conflictos tardíos.', ans: true, exp: 'Integra cambios gradualmente.',
              qFalse: 'Conviene no tocar la rama feature hasta el final para evitar conflictos con main.',
              expFalse: 'Cuanto más se retrasa la sincronización, más divergen las ramas y más grande es el conflicto final.'  }, { type: 'match', q: 'Relaciona término y propósito:', pairs: [{ left: 'feature branch', right: 'Implementar cambio aislado' }, { left: 'main branch', right: 'Base estable de integración' }, { left: 'merge conflict', right: 'Choque de cambios simultáneos' }, { left: 'rebase', right: 'Reaplicar commits sobre nuevo historial' }], exp: 'Entender ramas mejora previsibilidad del desarrollo.' }] },
        { title: 'Pull Requests y revisión técnica', questions: [{ type: 'choice', q: '¿Qué elemento incrementa calidad de revisión en un PR?', opts: ['Descripción vacía', 'Contexto, alcance y plan de pruebas verificable', 'Commit único gigante sin explicación', 'Cambios no relacionados mezclados'], ans: 1, exp: 'La claridad reduce fricción en revisión.' }, { type: 'truefalse', q: 'Responder comentarios con evidencia técnica acelera aprobación del PR.', ans: true, exp: 'La colaboración efectiva reduce ciclos.',
              qFalse: 'Aplicar los cambios sin responder a los comentarios acelera la aprobación del PR.',
              expFalse: 'Quien revisa necesita saber qué se cambió y por qué; sin respuesta debe reconstruir el contexto desde cero.'  }, { type: 'match', q: 'Relaciona artefacto y valor:', pairs: [{ left: 'Descripción de PR', right: 'Comunica intención del cambio' }, { left: 'Checks CI', right: 'Validan calidad automática' }, { left: 'Review comments', right: 'Mejoran solución propuesta' }, { left: 'Merge policy', right: 'Protege rama principal' }], exp: 'PRs bien estructurados elevan confiabilidad del código.' }] },
        { title: 'Gestión de issues y trazabilidad', questions: [{ type: 'choice', q: '¿Qué práctica conecta mejor problema reportado y solución técnica?', opts: ['Issue sin contexto ni pasos', 'Vincular issue, rama y PR con referencias explícitas', 'Resolver fuera de repositorio', 'Editar producción sin ticket'], ans: 1, exp: 'La trazabilidad facilita auditoría y aprendizaje.' }, { type: 'truefalse', q: 'Etiquetas y prioridades en issues ayudan a planificar trabajo por valor.', ans: true, exp: 'Ordenan backlog según impacto y urgencia.',
              qFalse: 'Etiquetar y priorizar issues es burocracia que no influye en la planificación del trabajo.',
              expFalse: 'Las etiquetas y prioridades son lo que permite ordenar el backlog por valor e impacto.'  }, { type: 'match', q: 'Relaciona elemento de gestión y función:', pairs: [{ left: 'Issue', right: 'Unidad de trabajo documentada' }, { left: 'Label', right: 'Clasificación temática/prioridad' }, { left: 'Milestone', right: 'Agrupación por objetivo temporal' }, { left: 'Assignee', right: 'Responsable de ejecución' }], exp: 'Gestión explícita reduce incertidumbre operativa.' }] },
        { title: 'CI/CD inicial con GitHub Actions', questions: [{ type: 'choice', q: '¿Qué ventaja clave aporta ejecutar tests en cada PR con Actions?', opts: ['Eliminar revisiones humanas', 'Detectar regresiones antes de merge', 'Aumentar tamaño de commits', 'Evitar rama main'], ans: 1, exp: 'CI previene defectos temprano en el flujo.' }, { type: 'truefalse', q: 'Un pipeline fallido debería bloquear merge en ramas protegidas.', ans: true, exp: 'Garantiza estándar mínimo de calidad.',
              qFalse: 'Un pipeline en rojo puede fusionarse igualmente si el equipo tiene prisa por entregar.',
              expFalse: 'Fusionar con el pipeline fallando mete el fallo en la rama principal y bloquea a todo el equipo.'  }, { type: 'match', q: 'Relaciona etapa del workflow y objetivo:', pairs: [{ left: 'checkout', right: 'Obtener código del repo' }, { left: 'install', right: 'Preparar dependencias' }, { left: 'test', right: 'Validar comportamiento esperado' }, { left: 'artifact', right: 'Guardar resultado de build' }], exp: 'Pipeline estructurado acelera entrega segura.' }] },
      ],
      examSections: [
        { title: 'Entrega colaborativa de feature', questions: [{ type: 'choice', q: 'Tu equipo reporta merges conflictivos frecuentes y PRs lentos. ¿Cuál intervención genera mayor impacto?', opts: ['Permitir pushes directos a main', 'Reducir tamaño de ramas, estandarizar PR template y activar checks obligatorios', 'Desactivar revisiones para ganar velocidad', 'Concentrar cambios mensualmente'], ans: 1, exp: 'Disciplina de flujo reduce fricción sistémica.' }, { type: 'truefalse', q: 'Un historial de commits claro facilita rollback controlado ante incidentes.', ans: true, exp: 'Permite aislar y revertir rápidamente el problema.',
              qFalse: 'Con commits grandes y mensajes genéricos el rollback ante un incidente resulta igual de sencillo.',
              expFalse: 'Para revertir hay que identificar el cambio culpable; con commits enormes se revierte también lo que funcionaba.'  }, { type: 'match', q: 'Relaciona riesgo y control recomendado:', pairs: [{ left: 'Cambios no revisados', right: 'Branch protection con reviewers' }, { left: 'Pruebas omitidas', right: 'CI obligatorio en PR' }, { left: 'Contexto difuso', right: 'Template de PR estandarizado' }, { left: 'Trabajo invisible', right: 'Issues vinculados al desarrollo' }], exp: 'La calidad de colaboración es diseño de proceso.' }] },
        { title: 'Gobernanza DevOps con GitHub', questions: [{ type: 'choice', q: '¿Qué indicador muestra madurez en flujo de entrega con GitHub?', opts: ['Commits enormes y raros', 'Tiempo de ciclo corto con baja tasa de rollback', 'Sin documentación de cambios', 'Pipelines opcionales'], ans: 1, exp: 'Mide estabilidad y velocidad sostenible.' }, { type: 'truefalse', q: 'Automatizar validaciones de seguridad en CI reduce riesgo de liberar vulnerabilidades.', ans: true, exp: 'Security checks tempranos disminuyen exposición.',
              qFalse: 'Las validaciones de seguridad deben hacerse sólo de forma manual antes de cada release anual.',
              expFalse: 'La revisión manual esporádica deja pasar meses de cambios; integrada en CI cada commit queda validado.'  }, { type: 'match', q: 'Relaciona práctica y resultado organizacional:', pairs: [{ left: 'Code owners', right: 'Revisión por expertos del dominio' }, { left: 'Dependabot', right: 'Actualización proactiva de dependencias' }, { left: 'Action reusable', right: 'Estandarización de pipelines' }, { left: 'Release tags', right: 'Trazabilidad de versiones productivas' }], exp: 'La gobernanza técnica sostiene escalabilidad de equipos.' }] },
      ],
    },
    excel: {
      title: 'Excel',
      category: 'office',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732220.png',
      requirements: ['Microsoft Excel instalado', 'Datos de práctica en hoja', 'Conocimiento básico de celdas'],
      docs: { label: 'Ayuda oficial de Excel', url: 'https://support.microsoft.com/es-es/excel' },
      certModules: ['Fundamentos de hoja', 'Fórmulas clave', 'Búsqueda y análisis', 'Visualización ejecutiva'],
      lessons: [
        { id: 'excel-l1', title: 'Estructura de hoja y referencias', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es Excel y para qué sirve? Esta lección establece bases para organizar datos y trabajar con referencias confiables.', requirements: ['Microsoft Excel instalado', 'Datos de práctica en hoja'], steps: ['Crear tabla con encabezados consistentes', 'Aplicar formato de número y fecha', 'Diferenciar referencias relativas/absolutas', 'Nombrar rangos clave de trabajo', 'Guardar archivo con versión controlada'], resources: { video: 'https://www.youtube.com/watch?v=Vl0H-qTclOg', docs: 'Introducción a Excel', docsUrl: 'https://support.microsoft.com/es-es/office/v%C3%ADdeos-de-entrenamiento-de-excel-9bc05390-e94c-46af-a5b3-d7c22f6990bb' }, tip: 'Una buena estructura de datos evita fórmulas frágiles.' },
        { id: 'excel-l2', title: 'Fórmulas esenciales para negocio', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué son las fórmulas y para qué sirven? Aprenderás a automatizar cálculos repetitivos y reducir errores manuales.', requirements: ['Estructura de hoja organizada', 'Conocimiento básico de funciones'], steps: ['Aplicar SUM y PROMEDIO correctamente', 'Usar IF para reglas simples', 'Combinar funciones de texto básicas', 'Copiar fórmulas con referencias correctas', 'Auditar resultados con datos de control'], resources: { video: 'https://www.youtube.com/watch?v=2M7x6jVD3lY', docs: 'Funciones de Excel', docsUrl: 'https://support.microsoft.com/es-es/office/f%C3%B3rmulas-y-funciones-294d9486-b332-48ed-b489-abe7d0f9eda9' }, tip: 'Valida con casos extremos antes de dar por correcta una fórmula.' },
        { id: 'excel-l3', title: 'BUSCARV/XLOOKUP y relaciones de datos', section: 'Módulo 3', duration: '15 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es buscar datos entre tablas y para qué sirve? Verás cómo relacionar fuentes sin copiar manualmente información.', requirements: ['Dominio de fórmulas básicas', 'Tablas de referencia disponibles'], steps: ['Preparar tablas maestras limpias', 'Aplicar BUSCARV y detectar limitaciones', 'Implementar XLOOKUP en escenarios flexibles', 'Gestionar errores con SI.ERROR', 'Comparar resultados contra control manual'], resources: { video: 'https://www.youtube.com/watch?v=Yw2QxvY9o3k', docs: 'BUSCARV y XLOOKUP', docsUrl: 'https://support.microsoft.com/es-es/office/funci%C3%B3n-buscarv-0bbc8083-26fe-4963-8ab8-93a18ad188a1' }, tip: 'Prioriza XLOOKUP cuando esté disponible por su mayor flexibilidad.' },
        { id: 'excel-l4', title: 'Tablas dinámicas y segmentación', section: 'Módulo 4', duration: '14 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es una tabla dinámica y para qué sirve? Aprenderás a resumir grandes volúmenes de datos para decisiones rápidas.', requirements: ['Datos tabulares limpios', 'Conocimiento de filtros y ordenación'], steps: ['Insertar tabla dinámica desde origen limpio', 'Configurar filas, columnas y valores', 'Aplicar filtros y segmentadores', 'Crear métricas comparativas por periodo', 'Actualizar tabla al agregar nuevos datos'], resources: { video: 'https://www.youtube.com/watch?v=qu-AK0Hv0b4', docs: 'Tablas dinámicas en Excel', docsUrl: 'https://support.microsoft.com/es-es/office/crear-una-tabla-din%C3%A1mica-0b89a356-7f1c-4a6f-9f8e-7e2f2f8e2f7a' }, tip: 'No uses filas vacías en origen si quieres dinámicas estables.' },
        { id: 'excel-l5', title: 'Dashboards y comunicación ejecutiva', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es un dashboard en Excel y para qué sirve? Esta lección integra métricas, visualización y narrativa para decisiones ejecutivas.', requirements: ['Tablas dinámicas funcionales', 'Métricas definidas por negocio'], steps: ['Seleccionar KPIs prioritarios', 'Elegir gráficos adecuados por métrica', 'Unificar estilo visual del tablero', 'Añadir controles de filtro para exploración', 'Validar consistencia con stakeholders'], resources: { video: 'https://www.youtube.com/watch?v=pCJ15nGFgVg', docs: 'Crear gráficos y paneles', docsUrl: 'https://support.microsoft.com/es-es/office/crear-un-gr%C3%A1fico-de-principio-a-fin-0baf399e-cf49-4b32-8f5f-51cae52f4d6a' }, tip: 'Un dashboard útil responde preguntas de negocio concretas, no muestra todo.',
        },
      ],
      quizSections: [
        { title: 'Estructura de hoja y referencias', questions: [{ type: 'choice', q: '¿Qué error operativo evita usar referencias absolutas al copiar fórmulas?', opts: ['Cambios de idioma del sistema', 'Desplazamiento involuntario de celdas críticas', 'Fallas de internet', 'Bloqueo del archivo'], ans: 1, exp: 'Las referencias absolutas preservan coordenadas clave.' }, { type: 'truefalse', q: 'Convertir rango a tabla mejora consistencia de fórmulas y filtros.', ans: true, exp: 'Las tablas estructuradas son más robustas.',
              qFalse: 'Trabajar sobre un rango suelto mantiene las fórmulas más consistentes que convertirlo en tabla.',
              expFalse: 'La tabla expande fórmulas y filtros automáticamente al añadir filas; el rango suelto hay que reajustarlo a mano.'  }, { type: 'match', q: 'Relaciona tipo de referencia y comportamiento:', pairs: [{ left: 'A1', right: 'Relativa completa' }, { left: '$A$1', right: 'Absoluta completa' }, { left: 'A$1', right: 'Fila fija, columna relativa' }, { left: '$A1', right: 'Columna fija, fila relativa' }], exp: 'Entender referencias es base de modelos confiables.' }] },
        { title: 'Fórmulas esenciales para negocio', questions: [{ type: 'choice', q: '¿Qué enfoque reduce errores en fórmulas complejas?', opts: ['Escribir todo en una línea sin validar', 'Construir por partes y verificar subresultados', 'Copiar de internet sin adaptar', 'Usar solo valores manuales'], ans: 1, exp: 'La validación incremental mejora precisión.' }, { type: 'truefalse', q: 'IF permite modelar reglas de negocio condicionales en una celda.', ans: true, exp: 'Es función clave para lógica de decisión.',
              qFalse: 'La función IF sólo sirve para comparar números y no permite modelar reglas de negocio.',
              expFalse: 'IF evalúa cualquier condición lógica (texto, fechas, referencias) y permite encadenar reglas de negocio.'  }, { type: 'match', q: 'Relaciona función y uso:', pairs: [{ left: 'SUM', right: 'Totalizar valores' }, { left: 'AVERAGE', right: 'Promedio de conjunto' }, { left: 'IF', right: 'Evaluación condicional' }, { left: 'CONCAT', right: 'Unir textos' }], exp: 'Las funciones base cubren gran parte de necesidades iniciales.' }] },
        { title: 'BUSCARV/XLOOKUP y relaciones de datos', questions: [{ type: 'choice', q: '¿Qué ventaja ofrece XLOOKUP frente a BUSCARV en escenarios modernos?', opts: ['Solo funciona en tablas pequeñas', 'Permite búsqueda flexible izquierda/derecha y manejo de no encontrado', 'Reemplaza tablas dinámicas', 'Evita toda validación de datos'], ans: 1, exp: 'XLOOKUP amplía casos y legibilidad.' }, { type: 'truefalse', q: 'Manejar #N/A con estrategia explícita evita reportes ambiguos.', ans: true, exp: 'El error no gestionado puede distorsionar decisiones.',
              qFalse: 'Es preferible dejar los #N/A visibles sin tratarlos porque así el reporte resulta más transparente.',
              expFalse: 'Un #N/A sin explicación se confunde con un dato faltante real; conviene tratarlo con IFNA y documentar el criterio.'  }, { type: 'match', q: 'Relaciona problema y solución:', pairs: [{ left: 'Clave no existe', right: 'SI.ERROR o if_not_found' }, { left: 'Tabla desordenada', right: 'Usar búsqueda exacta' }, { left: 'Múltiples fuentes', right: 'Normalizar llave primaria' }, { left: 'Resultados inconsistentes', right: 'Auditar rango de búsqueda' }], exp: 'La calidad de datos condiciona calidad del análisis.' }] },
        { title: 'Tablas dinámicas y segmentación', questions: [{ type: 'choice', q: '¿Cuál requisito es crítico para que una tabla dinámica no falle al actualizar?', opts: ['Colores llamativos', 'Origen sin filas vacías ni encabezados ambiguos', 'Múltiples hojas ocultas', 'Formato condicional complejo'], ans: 1, exp: 'El origen limpio determina estabilidad del resumen.' }, { type: 'truefalse', q: 'HAVING no aplica en Excel, pero segmentadores cumplen rol de filtrado visual dinámico.', ans: true, exp: 'Segmentadores mejoran exploración de datos para usuarios no técnicos.',
              qFalse: 'Excel incluye una cláusula HAVING equivalente a la de SQL para filtrar grupos en tablas dinámicas.',
              expFalse: 'HAVING es de SQL; en Excel el filtrado interactivo se hace con segmentadores y filtros de tabla dinámica.'  }, { type: 'match', q: 'Relaciona elemento de tabla dinámica y función:', pairs: [{ left: 'Rows', right: 'Dimensión principal de agrupación' }, { left: 'Columns', right: 'Comparación por eje secundario' }, { left: 'Values', right: 'Métrica agregada' }, { left: 'Filters', right: 'Recorte del dataset analizado' }], exp: 'Configurar ejes correctamente evita interpretaciones erróneas.' }] },
        { title: 'Dashboards y comunicación ejecutiva', questions: [{ type: 'choice', q: '¿Qué criterio hace más útil un dashboard para directivos?', opts: ['Mostrar todas las métricas posibles', 'Priorizar KPIs accionables con contexto temporal', 'Usar gráficos 3D decorativos', 'Ocultar supuestos de cálculo'], ans: 1, exp: 'El tablero debe facilitar decisiones, no solo exhibir datos.' }, { type: 'truefalse', q: 'Un dashboard sin definición de KPI puede llevar a interpretaciones contradictorias.', ans: true, exp: 'Los indicadores requieren significado compartido.',
              qFalse: 'Mientras los gráficos sean claros, definir los KPI por escrito no cambia la interpretación del dashboard.',
              expFalse: 'Sin definición compartida cada área calcula el indicador a su manera y las cifras dejan de ser comparables.'  }, { type: 'match', q: 'Relaciona gráfico y caso recomendado:', pairs: [{ left: 'Líneas', right: 'Evolución temporal' }, { left: 'Barras', right: 'Comparación entre categorías' }, { left: 'Tarjeta KPI', right: 'Valor clave actual' }, { left: 'Segmentador', right: 'Filtrado interactivo por dimensión' }], exp: 'Elegir visualización adecuada reduce ruido analítico.' }] },
      ],
      examSections: [
        { title: 'Caso de análisis comercial', questions: [{ type: 'choice', q: 'Debes consolidar ventas de 5 regiones con códigos inconsistentes. ¿Qué secuencia es más sólida?', opts: ['Crear gráficos directamente', 'Estandarizar claves, validar integridad y luego consolidar métricas', 'Usar solo formato condicional', 'Copiar datos manualmente hoja por hoja'], ans: 1, exp: 'Sin limpieza y estandarización, el análisis es poco confiable.' }, { type: 'truefalse', q: 'Una tabla dinámica puede ocultar errores de origen si no se valida previamente la calidad de datos.', ans: true, exp: 'La visualización no corrige datos defectuosos.',
              qFalse: 'La tabla dinámica detecta y corrige por sí sola los errores de los datos de origen.',
              expFalse: 'La tabla dinámica sólo agrega lo que recibe: si el origen tiene duplicados o tipos mal, los totales heredan el error.'  }, { type: 'match', q: 'Relaciona etapa y control:', pairs: [{ left: 'Limpieza de datos', right: 'Eliminar inconsistencias de origen' }, { left: 'Modelo de fórmulas', right: 'Calcular métricas repetibles' }, { left: 'Pivot', right: 'Sintetizar información por dimensión' }, { left: 'Dashboard', right: 'Comunicar hallazgos ejecutivos' }], exp: 'La cadena completa garantiza análisis defendible.' }] },
        { title: 'Gobierno de calidad en reportes', questions: [{ type: 'choice', q: '¿Qué práctica reduce errores recurrentes en reportes mensuales?', opts: ['Editar fórmulas manualmente cada mes', 'Plantilla controlada con validaciones y checklist de cierre', 'Eliminar referencias absolutas', 'Cambiar estructura de hoja cada ciclo'], ans: 1, exp: 'Estandarización incrementa confiabilidad operativa.' }, { type: 'truefalse', q: 'Documentar supuestos de cálculo es parte de la trazabilidad analítica.', ans: true, exp: 'Permite auditoría y continuidad del trabajo.',
              qFalse: 'Los supuestos de cálculo no necesitan documentarse mientras las fórmulas estén en la hoja.',
              expFalse: 'La fórmula muestra el cómo pero no el porqué; sin los supuestos nadie puede validar ni reproducir el análisis.'  }, { type: 'match', q: 'Relaciona riesgo y mitigación:', pairs: [{ left: 'Datos incompletos', right: 'Validación previa de entradas' }, { left: 'Métricas ambiguas', right: 'Definición formal de KPI' }, { left: 'Errores de fórmula', right: 'Pruebas con casos de control' }, { left: 'Dependencia personal', right: 'Documentación y plantilla compartida' }], exp: 'La calidad de reporting es un proceso, no un archivo.' }] },
      ],
    },
    powerpoint: {
      title: 'PowerPoint',
      category: 'office',
      icon: 'https://cdn-icons-png.flaticon.com/512/732/732224.png',
      requirements: ['Microsoft PowerPoint', 'Objetivo de presentación definido', 'Contenido base preparado'],
      docs: { label: 'Ayuda oficial de PowerPoint', url: 'https://support.microsoft.com/es-es/powerpoint' },
      certModules: ['Narrativa visual', 'Diseño de diapositivas', 'Animación efectiva', 'Presentación ejecutiva'],
      lessons: [
        { id: 'powerpoint-l1', title: 'Estructura narrativa de presentación', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es una narrativa efectiva y para qué sirve? Aprenderás a organizar ideas para guiar decisiones con claridad.', requirements: ['Microsoft PowerPoint', 'Objetivo de presentación definido'], steps: ['Definir audiencia y resultado esperado', 'Diseñar índice con historia lógica', 'Asignar mensaje principal por diapositiva', 'Eliminar contenido redundante', 'Validar coherencia del flujo completo'], resources: { video: 'https://www.youtube.com/watch?v=8S0FDjFBj8o', docs: 'Crear presentaciones efectivas', docsUrl: 'https://support.microsoft.com/es-es/office/crear-una-presentaci%C3%B3n-422250f8-5721-4cea-92cc-202fa7b89617' }, tip: 'Una diapositiva debe sostener una idea principal, no cinco.' },
        { id: 'powerpoint-l2', title: 'Diseño visual y diapositiva maestra', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué es la diapositiva maestra y para qué sirve? Verás cómo mantener consistencia tipográfica y visual en todo el deck.', requirements: ['Narrativa definida', 'Contenido base preparado'], steps: ['Configurar tema de colores y fuentes', 'Editar Slide Master con layouts base', 'Aplicar jerarquía visual de títulos', 'Alinear objetos con guías', 'Revisar consistencia global del diseño'], resources: { video: 'https://www.youtube.com/watch?v=RY0VdKQxQf8', docs: 'Usar patrón de diapositivas', docsUrl: 'https://support.microsoft.com/es-es/office/qu%C3%A9-es-el-patr%C3%B3n-de-diapositivas-1f6954d7-9a41-4b05-97f0-5e4ce4fdbf9a' }, tip: 'Si cambias estilo en cada slide, pierdes credibilidad visual.' },
        { id: 'powerpoint-l3', title: 'Gráficos, datos y claridad ejecutiva', section: 'Módulo 3', duration: '13 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es comunicar datos en diapositivas y para qué sirve? Aprenderás a transformar números en mensajes accionables.', requirements: ['Diseño visual básico', 'Datos estructurados en Excel u origen'], steps: ['Elegir gráfico según tipo de pregunta', 'Resaltar dato clave con contraste', 'Simplificar leyendas y ejes innecesarios', 'Vincular datos cuando corresponda', 'Añadir conclusión explícita por gráfico'], resources: { video: 'https://www.youtube.com/watch?v=v4RrQX0xvCk', docs: 'Insertar gráficos en PowerPoint', docsUrl: 'https://support.microsoft.com/es-es/office/agregar-un-gr%C3%A1fico-a-la-presentaci%C3%B3n-90a4a2d0-9d3f-4f18-a8eb-5d0c8f45cc8a' }, tip: 'Un gráfico sin insight es decoración, no comunicación.' },
        { id: 'powerpoint-l4', title: 'Animaciones y transiciones con propósito', section: 'Módulo 4', duration: '12 min', level: LEVELS.INTERMEDIATE, description: '¿Qué son animaciones efectivas y para qué sirven? Esta lección evita distracciones y mejora ritmo de explicación.', requirements: ['Presentación estructurada', 'Contenido visual organizado'], steps: ['Aplicar transición consistente entre secciones', 'Usar animaciones simples para revelar ideas', 'Controlar orden en panel de animación', 'Sincronizar tiempos con discurso', 'Probar visualización en modo presentación'], resources: { video: 'https://www.youtube.com/watch?v=0QhC4-2f6E4', docs: 'Animaciones en PowerPoint', docsUrl: 'https://support.microsoft.com/es-es/office/agregar-animaciones-a-las-diapositivas-1f3d3f8d-27f8-4e4c-8f9d-d8f7f4e4e2f2' }, tip: 'La animación debe reforzar mensaje, no competir con él.' },
        { id: 'powerpoint-l5', title: 'Entrega, ensayo y manejo de preguntas', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es presentar con dominio y para qué sirve? Aprenderás a cerrar con impacto y responder preguntas con evidencia.', requirements: ['Deck final casi listo', 'Ensayo básico realizado'], steps: ['Configurar modo presentador con notas', 'Ensayar tiempos por sección', 'Preparar diapositivas de respaldo', 'Responder objeciones con datos concretos', 'Cerrar con llamada a acción clara'], resources: { video: 'https://www.youtube.com/watch?v=FfQ4j4kV8jM', docs: 'Presentar diapositivas con confianza', docsUrl: 'https://support.microsoft.com/es-es/office/iniciar-la-presentaci%C3%B3n-y-ver-notas-en-la-vista-del-moderador-4de90e28-487e-435c-9401-5de1e8e5f6cf' }, tip: 'Ensaya transiciones verbales entre diapositivas, no solo cada slide aislada.' },
      ],
      quizSections: [
        { title: 'Estructura narrativa de presentación', questions: [{ type: 'choice', q: '¿Qué práctica mejora retención de mensaje en audiencias ejecutivas?', opts: ['Abrir con detalle técnico profundo', 'Estructurar historia problema-impacto-solución', 'Mostrar todas las cifras sin síntesis', 'Evitar conclusiones explícitas'], ans: 1, exp: 'La narrativa orientada a decisión facilita comprensión.' }, { type: 'truefalse', q: 'Definir audiencia antes de diseñar diapositivas mejora foco del contenido.', ans: true, exp: 'Permite adaptar profundidad y lenguaje.',
              qFalse: 'Conviene diseñar primero las diapositivas y pensar en la audiencia sólo al ensayar.',
              expFalse: 'La audiencia determina el nivel de detalle y el lenguaje; definirla después obliga a rehacer el contenido.'  }, { type: 'match', q: 'Relaciona sección y objetivo narrativo:', pairs: [{ left: 'Inicio', right: 'Plantear contexto y objetivo' }, { left: 'Desarrollo', right: 'Sustentar con evidencia' }, { left: 'Conclusión', right: 'Proponer decisión o acción' }, { left: 'Q&A', right: 'Resolver dudas clave' }], exp: 'Una historia clara reduce fricción comunicacional.' }] },
        { title: 'Diseño visual y diapositiva maestra', questions: [{ type: 'choice', q: '¿Qué ventaja operativa aporta usar Slide Master en presentaciones largas?', opts: ['Duplica peso del archivo', 'Centraliza estilo y evita inconsistencias entre slides', 'Bloquea edición de texto', 'Impide usar gráficos'], ans: 1, exp: 'El patrón reduce trabajo manual repetitivo.' }, { type: 'truefalse', q: 'Mantener paleta y tipografía consistentes aumenta percepción de profesionalismo.', ans: true, exp: 'La coherencia visual transmite claridad y rigor.',
              qFalse: 'Variar la paleta y la tipografía en cada diapositiva hace la presentación más profesional.',
              expFalse: 'La variación constante distrae y resta credibilidad; la consistencia es lo que se percibe como profesional.'  }, { type: 'match', q: 'Relaciona elemento de diseño y función:', pairs: [{ left: 'Tipografía', right: 'Jerarquizar lectura' }, { left: 'Color', right: 'Priorizar atención visual' }, { left: 'Espacio en blanco', right: 'Reducir saturación cognitiva' }, { left: 'Alineación', right: 'Ordenar composición' }], exp: 'Diseño consistente sostiene la narrativa.' }] },
        { title: 'Gráficos, datos y claridad ejecutiva', questions: [{ type: 'choice', q: '¿Cuál es el principal error al presentar datos complejos?', opts: ['Seleccionar gráfico por pregunta', 'Mostrar visuales sin insight explícito', 'Resaltar métricas clave', 'Comparar periodos homogéneos'], ans: 1, exp: 'Sin interpretación, el dato no guía decisiones.' }, { type: 'truefalse', q: 'Un gráfico debe responder una pregunta de negocio específica.', ans: true, exp: 'La visualización sin propósito genera ruido.',
              qFalse: 'Un buen gráfico debe mostrar todas las métricas disponibles para que la audiencia elija qué mirar.',
              expFalse: 'Un gráfico que lo muestra todo no comunica nada; cada uno debe responder una pregunta concreta.'  }, { type: 'match', q: 'Relaciona gráfico y uso recomendado:', pairs: [{ left: 'Línea', right: 'Tendencia en el tiempo' }, { left: 'Barras', right: 'Comparar categorías' }, { left: 'Área', right: 'Evolución acumulada' }, { left: 'Tarjeta KPI', right: 'Mostrar valor puntual crítico' }], exp: 'Elegir visual correcto incrementa comprensión.' }] },
        { title: 'Animaciones y transiciones con propósito', questions: [{ type: 'choice', q: '¿Qué criterio define una animación profesional en contexto ejecutivo?', opts: ['Complejidad visual máxima', 'Apoyar el ritmo de explicación sin distraer', 'Cambiar efecto en cada slide', 'Aplicar efectos por defecto a todo'], ans: 1, exp: 'La animación debe ser funcional, no ornamental.' }, { type: 'truefalse', q: 'Demasiadas transiciones distintas reducen foco del público en el mensaje central.', ans: true, exp: 'La consistencia ayuda a mantener atención cognitiva.',
              qFalse: 'Cuantas más transiciones distintas se usen, más atención presta el público al mensaje.',
              expFalse: 'El efecto llama la atención sobre sí mismo y compite con el contenido; conviene una transición sobria y coherente.'  }, { type: 'match', q: 'Relaciona recurso y efecto esperado:', pairs: [{ left: 'Fade', right: 'Transición discreta entre ideas' }, { left: 'Aparecer por bloques', right: 'Control de revelación de contenido' }, { left: 'Morph', right: 'Continuidad visual entre estados' }, { left: 'Sin animación', right: 'Priorizar contenido estático claro' }], exp: 'La elección depende de intención comunicativa.' }] },
        { title: 'Entrega, ensayo y manejo de preguntas', questions: [{ type: 'choice', q: '¿Qué práctica mejora desempeño ante preguntas difíciles?', opts: ['Leer texto literal de la diapositiva', 'Preparar evidencia de respaldo y escenarios de objeción', 'Improvisar sin datos', 'Evitar sección de preguntas'], ans: 1, exp: 'La preparación anticipa riesgos de comunicación.' }, { type: 'truefalse', q: 'Ensayar tiempos por sección reduce sobrecarga al final de la presentación.', ans: true, exp: 'Gestiona ritmo y cobertura de contenido.',
              qFalse: 'Ensayar sólo la duración total es suficiente para no quedarse sin tiempo al final.',
              expFalse: 'El total no revela dónde se acumula el retraso; sin tiempos por sección se corre en las últimas diapositivas.'  }, { type: 'match', q: 'Relaciona fase y foco de preparación:', pairs: [{ left: 'Pre-ensayo', right: 'Ajustar narrativa y secuencia' }, { left: 'Ensayo técnico', right: 'Validar equipo y formato' }, { left: 'Presentación', right: 'Conectar mensaje con audiencia' }, { left: 'Post-sesión', right: 'Recoger feedback para iterar' }], exp: 'Presentar bien es un proceso iterativo.' }] },
      ],
      examSections: [
        { title: 'Presentación de resultados estratégicos', questions: [{ type: 'choice', q: 'Debes exponer resultados trimestrales a dirección con tiempo limitado. ¿Qué enfoque maximiza impacto?', opts: ['Mostrar todo el detalle operativo', 'Sintetizar hallazgos críticos, riesgos y decisiones recomendadas', 'Usar solo animaciones llamativas', 'Leer cada tabla completa'], ans: 1, exp: 'La dirección necesita claridad para decidir rápidamente.' }, { type: 'truefalse', q: 'Una conclusión explícita por sección ayuda a que la audiencia recuerde mensajes clave.', ans: true, exp: 'Estructura y síntesis mejoran retención.',
              qFalse: 'Dejar las conclusiones implícitas hace que la audiencia recuerde mejor los mensajes clave.',
              expFalse: 'Si la conclusión no se enuncia, cada persona se lleva una distinta; explicitarla es lo que fija el mensaje.'  }, { type: 'match', q: 'Relaciona desafío y respuesta profesional:', pairs: [{ left: 'Tiempo reducido', right: 'Priorizar mensajes de alto impacto' }, { left: 'Audiencia heterogénea', right: 'Lenguaje claro con anexos técnicos' }, { left: 'Objeciones de datos', right: 'Evidencia y fuente verificable' }, { left: 'Decisión pendiente', right: 'Recomendación accionable final' }], exp: 'El valor de la presentación está en habilitar decisiones.' }] },
        { title: 'Calidad de comunicación ejecutiva', questions: [{ type: 'choice', q: '¿Qué señal indica una presentación bien gobernada en equipos?', opts: ['Estilos distintos por autor', 'Plantillas, guías y revisión previa estandarizada', 'Sin control de versiones', 'Cambios de último minuto sin registro'], ans: 1, exp: 'La estandarización protege calidad y reputación.' }, { type: 'truefalse', q: 'Documentar versión final y respaldo PDF reduce riesgo operativo en eventos.', ans: true, exp: 'Previene fallos por compatibilidad o edición accidental.',
              qFalse: 'Llevar sólo el archivo editable en la nube es la opción más segura para presentar en un evento.',
              expFalse: 'Sin conexión o con otra versión de la app el archivo puede no abrir; el PDF de respaldo garantiza la presentación.'  }, { type: 'match', q: 'Relaciona control y resultado:', pairs: [{ left: 'Checklist previa', right: 'Menos errores en vivo' }, { left: 'Guía visual', right: 'Consistencia entre presentadores' }, { left: 'Ensayo con cronómetro', right: 'Cumplimiento de tiempo' }, { left: 'Slides de respaldo', right: 'Respuesta sólida a preguntas' }], exp: 'La excelencia en presentación se construye con procesos.' }] },
      ],
    },
    sql: {
      title: 'SQL',
      category: 'data',
      icon: 'src/img/courses/sql.svg',
      requirements: ['Motor SQL disponible (PostgreSQL/MySQL)', 'Dataset de práctica', 'Editor o cliente SQL'],
      docs: { label: 'Documentación de PostgreSQL', url: 'https://www.postgresql.org/docs/current/index.html' },
      certModules: ['Consultas básicas', 'JOINs y agregaciones', 'Subconsultas/CTE', 'Optimización y seguridad'],
      lessons: [
        { id: 'sql-l1', title: 'SELECT, filtros y ordenamiento', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es SQL y para qué sirve? Iniciarás consultando datos con precisión usando filtros y ordenamiento.', requirements: ['Motor SQL disponible', 'Dataset de práctica'], steps: ['Conectar a base de datos de ejemplo', 'Ejecutar SELECT con columnas explícitas', 'Filtrar con WHERE y operadores lógicos', 'Ordenar con ORDER BY', 'Limitar resultados para análisis rápido'], resources: { video: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', docs: 'Tutorial SQL básico', docsUrl: 'https://www.postgresql.org/docs/current/tutorial-sql.html' }, tip: 'Evita SELECT * en consultas productivas para claridad y rendimiento.' },
        { id: 'sql-l2', title: 'JOINs y relaciones entre tablas', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué es combinar tablas y para qué sirve? Aprenderás a unir datos relacionados sin perder contexto de negocio.', requirements: ['SELECT y WHERE básicos', 'Modelo relacional simple'], steps: ['Identificar claves primarias y foráneas', 'Aplicar INNER JOIN en caso base', 'Usar LEFT JOIN para conservar faltantes', 'Detectar duplicados por cardinalidad', 'Validar resultados con conteos de control'], resources: { video: 'https://www.youtube.com/watch?v=9Pzj7Aj25lw', docs: 'JOIN en PostgreSQL', docsUrl: 'https://www.postgresql.org/docs/current/tutorial-join.html' }, tip: 'Primero entiende la relación entre tablas; luego escribe el JOIN.' },
        { id: 'sql-l3', title: 'GROUP BY y funciones agregadas', section: 'Módulo 3', duration: '13 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es agregar datos y para qué sirve? Verás cómo obtener métricas útiles para decisiones sin perder trazabilidad.', requirements: ['JOIN básicos', 'Manejo de filtros'], steps: ['Calcular COUNT, SUM y AVG por categoría', 'Separar filtros de fila y filtros de grupo', 'Usar HAVING en agregaciones', 'Controlar nulos con COALESCE', 'Comparar métricas entre periodos'], resources: { video: 'https://www.youtube.com/watch?v=7S_tz1z_5bA', docs: 'Funciones agregadas', docsUrl: 'https://www.postgresql.org/docs/current/functions-aggregate.html' }, tip: 'Toda columna no agregada en SELECT debe ir en GROUP BY.' },
        { id: 'sql-l4', title: 'Subconsultas y CTEs', section: 'Módulo 4', duration: '15 min', level: LEVELS.INTERMEDIATE, description: '¿Qué son CTEs y para qué sirven? Aprenderás a estructurar consultas complejas en bloques legibles y mantenibles.', requirements: ['Dominio de GROUP BY', 'Consultas intermedias'], steps: ['Construir subconsulta de filtro', 'Migrar lógica a CTE con WITH', 'Encadenar dos CTEs para pipeline analítico', 'Comparar legibilidad y rendimiento inicial', 'Refactorizar consulta para revisión de equipo'], resources: { video: 'https://www.youtube.com/watch?v=Kwb4h5tEfOE', docs: 'WITH queries (CTE)', docsUrl: 'https://www.postgresql.org/docs/current/queries-with.html' }, tip: 'Usa CTE para claridad, pero valida plan de ejecución en grandes volúmenes.' },
        { id: 'sql-l5', title: 'Optimización, índices y seguridad', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es optimizar SQL y para qué sirve? Esta lección cubre rendimiento, integridad y prácticas contra inyección SQL.', requirements: ['Consultas complejas funcionales', 'Acceso a EXPLAIN en entorno de prueba'], steps: ['Interpretar plan con EXPLAIN', 'Crear índice en columnas de filtro', 'Comparar rendimiento antes/después', 'Aplicar consultas parametrizadas en aplicación', 'Revisar privilegios mínimos de usuario'], resources: { video: 'https://www.youtube.com/watch?v=Kj5i7I5z6fw', docs: 'Índices y rendimiento', docsUrl: 'https://www.postgresql.org/docs/current/indexes.html' }, tip: 'Optimiza con evidencia de plan y tiempos, no por intuición.',
        },
      ],
      quizSections: [
        { title: 'SELECT, filtros y ordenamiento', questions: [{ type: 'choice', q: '¿Qué práctica mejora mantenibilidad en consultas de reporting?', opts: ['SELECT * en todas las vistas', 'Seleccionar columnas explícitas y alias claros', 'Ordenar siempre por posición numérica', 'Eliminar cláusula WHERE'], ans: 1, exp: 'La intención explícita facilita evolución y auditoría.' }, { type: 'truefalse', q: 'WHERE filtra filas antes de cualquier agregación.', ans: true, exp: 'Su aplicación ocurre en etapas tempranas de evaluación.',
              qFalse: 'WHERE se aplica después de agrupar, por lo que puede filtrar sobre resultados de SUM o COUNT.',
              expFalse: 'WHERE actúa antes de GROUP BY; para filtrar sobre valores agregados se usa HAVING.'  }, { type: 'match', q: 'Relaciona cláusula y función:', pairs: [{ left: 'SELECT', right: 'Definir columnas de salida' }, { left: 'FROM', right: 'Indicar origen de datos' }, { left: 'WHERE', right: 'Aplicar filtros de fila' }, { left: 'ORDER BY', right: 'Ordenar resultado final' }], exp: 'Comprender el flujo lógico de consulta es esencial.' }] },
        { title: 'JOINs y relaciones entre tablas', questions: [{ type: 'choice', q: '¿Qué riesgo aparece al unir tablas con cardinalidad no analizada?', opts: ['Mejor rendimiento automático', 'Duplicación inesperada de filas y métricas', 'Compresión de datos', 'Bloqueo del motor SQL'], ans: 1, exp: 'Cardinalidad mal entendida distorsiona resultados.' }, { type: 'truefalse', q: 'LEFT JOIN conserva todas las filas de la tabla izquierda aun sin coincidencia.', ans: true, exp: 'Las columnas de la derecha pueden quedar en NULL.',
              qFalse: 'LEFT JOIN descarta las filas de la tabla izquierda que no encuentran coincidencia en la derecha.',
              expFalse: 'Ese es el comportamiento de INNER JOIN; LEFT JOIN conserva la tabla izquierda y rellena con NULL.'  }, { type: 'match', q: 'Relaciona tipo de JOIN y resultado:', pairs: [{ left: 'INNER JOIN', right: 'Solo coincidencias en ambas tablas' }, { left: 'LEFT JOIN', right: 'Todo izquierda + coincidencias derecha' }, { left: 'RIGHT JOIN', right: 'Todo derecha + coincidencias izquierda' }, { left: 'CROSS JOIN', right: 'Producto cartesiano de filas' }], exp: 'Elegir JOIN correcto evita interpretaciones erróneas.' }] },
        { title: 'GROUP BY y funciones agregadas', questions: [{ type: 'choice', q: '¿Cuándo usar HAVING en lugar de WHERE?', opts: ['Para filtrar columnas indexadas', 'Para filtrar resultados agregados por grupo', 'Para ordenar descendentemente', 'Para crear índices'], ans: 1, exp: 'HAVING opera después de la agregación.' }, { type: 'truefalse', q: 'COUNT(DISTINCT campo) ayuda a medir unicidad en conjuntos grandes.', ans: true, exp: 'Reduce sobreconteo por duplicados.',
              qFalse: 'COUNT(DISTINCT campo) devuelve el total de filas, igual que COUNT(*).',
              expFalse: 'COUNT(*) cuenta filas; COUNT(DISTINCT campo) cuenta valores únicos, que es lo que mide la unicidad.'  }, { type: 'match', q: 'Relaciona función y objetivo analítico:', pairs: [{ left: 'COUNT', right: 'Cantidad de registros' }, { left: 'SUM', right: 'Acumulado numérico' }, { left: 'AVG', right: 'Promedio de valores' }, { left: 'MAX', right: 'Valor máximo observado' }], exp: 'Las funciones agregadas responden preguntas de negocio clave.' }] },
        { title: 'Subconsultas y CTEs', questions: [{ type: 'choice', q: '¿Qué ventaja principal aporta una CTE en consultas extensas?', opts: ['Ejecutar en memoria infinita', 'Dividir lógica compleja en bloques legibles', 'Evitar cualquier costo de ejecución', 'Sustituir índices automáticamente'], ans: 1, exp: 'La legibilidad mejora revisión y mantenimiento.' }, { type: 'truefalse', q: 'Una subconsulta correlacionada puede afectar rendimiento si se ejecuta por fila.', ans: true, exp: 'Debe evaluarse plan de ejecución.',
              qFalse: 'Una subconsulta correlacionada se ejecuta una sola vez, así que su coste es independiente del volumen.',
              expFalse: 'La subconsulta correlacionada se evalúa una vez por cada fila externa: su coste crece con el volumen.'  }, { type: 'match', q: 'Relaciona técnica y uso:', pairs: [{ left: 'CTE', right: 'Pipeline lógico en pasos' }, { left: 'Subconsulta escalar', right: 'Valor único derivado' }, { left: 'EXISTS', right: 'Verificar existencia eficiente' }, { left: 'IN', right: 'Comparar con conjunto de valores' }], exp: 'Seleccionar la técnica adecuada impacta claridad y performance.' }] },
        { title: 'Optimización, índices y seguridad', questions: [{ type: 'choice', q: '¿Qué medida reduce riesgo de SQL injection en aplicaciones?', opts: ['Concatenar input del usuario en query', 'Usar consultas parametrizadas', 'Dar permisos de superusuario a la app', 'Ocultar errores sin registro'], ans: 1, exp: 'Separar datos de instrucción mitiga inyección.' }, { type: 'truefalse', q: 'Un índice puede acelerar lecturas, pero también tiene costo de mantenimiento en escrituras.', ans: true, exp: 'Toda optimización implica trade-offs.',
              qFalse: 'Añadir índices sólo aporta beneficios, por lo que conviene indexar todas las columnas de la tabla.',
              expFalse: 'Cada índice debe actualizarse en INSERT, UPDATE y DELETE, y ocupa espacio: indexar de más penaliza las escrituras.'  }, { type: 'match', q: 'Relaciona práctica y efecto:', pairs: [{ left: 'EXPLAIN', right: 'Inspeccionar plan de ejecución' }, { left: 'Índice', right: 'Acelerar filtros/joins frecuentes' }, { left: 'Prepared statement', right: 'Seguridad y reutilización de query' }, { left: 'Least privilege', right: 'Reducir superficie de daño' }], exp: 'Rendimiento y seguridad deben evolucionar juntos.' }] },
      ],
      examSections: [
        { title: 'Análisis de datos relacionales', questions: [{ type: 'choice', q: 'Debes construir un informe mensual de ventas con múltiples dimensiones y alto volumen. ¿Qué enfoque es más robusto?', opts: ['Query única sin estructura ni validación', 'CTEs por etapa, joins validados y agregaciones auditadas', 'Exportar todo a Excel sin SQL', 'Duplicar tablas para cada reporte'], ans: 1, exp: 'Estructurar el pipeline SQL mejora confiabilidad y mantenibilidad.' }, { type: 'truefalse', q: 'Sin validar cardinalidad de joins, las métricas agregadas pueden inflarse.', ans: true, exp: 'La integridad relacional es crítica para exactitud analítica.',
              qFalse: 'La cardinalidad del join no influye en los totales porque SQL evita duplicar filas automáticamente.',
              expFalse: 'Un join uno-a-muchos duplica filas de la tabla izquierda y las sumas se inflan; hay que validar la cardinalidad.'  }, { type: 'match', q: 'Relaciona problema y control técnico:', pairs: [{ left: 'Latencia alta', right: 'Análisis de plan e índices adecuados' }, { left: 'Conteo incorrecto', right: 'Revisión de JOIN y DISTINCT' }, { left: 'Fallas de seguridad', right: 'Parámetros y privilegios mínimos' }, { left: 'Consulta ilegible', right: 'Refactor con CTEs semánticas' }], exp: 'Un buen diseño SQL equilibra exactitud, rendimiento y seguridad.' }] },
        { title: 'Calidad operativa de consultas', questions: [{ type: 'choice', q: '¿Qué práctica facilita mantenimiento de consultas críticas por varios analistas?', opts: ['Queries sin alias ni comentarios', 'Estándar de estilo, nomenclatura y revisión por pares', 'Cambiar nombres de campos en cada reporte', 'Excluir pruebas de validación'], ans: 1, exp: 'La estandarización reduce dependencia de una sola persona.' }, { type: 'truefalse', q: 'Versionar scripts SQL en repositorio mejora trazabilidad de cambios de negocio.', ans: true, exp: 'Permite auditoría y rollback confiable.',
              qFalse: 'Guardar los scripts SQL en una carpeta compartida ofrece la misma trazabilidad que versionarlos.',
              expFalse: 'La carpeta guarda el archivo actual; el repositorio guarda quién cambió qué, cuándo y por qué.'  }, { type: 'match', q: 'Relaciona artefacto y beneficio:', pairs: [{ left: 'Script versionado', right: 'Historial de decisiones técnicas' }, { left: 'Dataset de prueba', right: 'Validación reproducible' }, { left: 'Checklist de QA', right: 'Detección temprana de inconsistencias' }, { left: 'Documentación de supuestos', right: 'Interpretación correcta de métricas' }], exp: 'La operación analítica madura requiere disciplina de ingeniería.' }] },
      ],
    },
    cybersecurity: {
      title: 'Ciberseguridad',
      category: 'security',
      icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913133.png',
      requirements: ['Navegador actualizado', 'Correo electrónico de prueba', 'Conocimiento básico de internet y cuentas'],
      docs: { label: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/' },
      certModules: ['Fundamentos CIA', 'Amenazas comunes', 'Controles preventivos', 'Respuesta a incidentes'],
      lessons: [
        { id: 'cybersecurity-l1', title: 'Fundamentos de seguridad digital', section: 'Módulo 1', duration: '12 min', level: LEVELS.BEGINNER, description: '¿Qué es ciberseguridad y para qué sirve? Comprenderás cómo proteger información, sistemas y personas en entornos digitales.', requirements: ['Navegador actualizado', 'Conocimiento básico de internet y cuentas'], steps: ['Definir confidencialidad, integridad y disponibilidad', 'Identificar activos críticos de información', 'Reconocer superficie de ataque básica', 'Relacionar riesgos con impacto de negocio', 'Crear lista inicial de controles prioritarios'], resources: { video: 'https://www.youtube.com/watch?v=inWWhr5tnEA', docs: 'Introducción OWASP', docsUrl: 'https://owasp.org/www-project-top-ten/' }, tip: 'Seguridad no es un producto, es una práctica continua.' },
        { id: 'cybersecurity-l2', title: 'Phishing e ingeniería social', section: 'Módulo 2', duration: '14 min', level: LEVELS.BEGINNER, description: '¿Qué es la ingeniería social y para qué sirve en ataques? Aprenderás a detectar señales tempranas de manipulación digital.', requirements: ['Correo electrónico de prueba', 'Atención a patrones de fraude'], steps: ['Analizar remitente y dominio real', 'Detectar urgencia y lenguaje manipulador', 'Validar enlaces antes de abrir', 'Reportar mensajes sospechosos al canal oficial', 'Simular respuesta segura ante intento de fraude'], resources: { video: 'https://www.youtube.com/watch?v=3gpOM9f6f2M', docs: 'Guía anti-phishing', docsUrl: 'https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams' }, tip: 'Cuando algo suena urgente e inusual, verifica por otro canal.' },
        { id: 'cybersecurity-l3', title: 'Contraseñas, MFA y control de acceso', section: 'Módulo 3', duration: '13 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es proteger credenciales y para qué sirve? Esta lección reduce riesgo de acceso indebido en cuentas personales y corporativas.', requirements: ['Conocimiento básico de cuentas digitales', 'Acceso a configuración de seguridad'], steps: ['Crear contraseñas únicas y extensas', 'Configurar gestor de contraseñas', 'Activar MFA en servicios críticos', 'Revisar sesiones activas y dispositivos', 'Eliminar accesos obsoletos o inseguros'], resources: { video: 'https://www.youtube.com/watch?v=4m3Yh5gJqGs', docs: 'Autenticación multifactor NIST', docsUrl: 'https://www.nist.gov/itl/applied-cybersecurity/tig/back-basics-multi-factor-authentication' }, tip: 'Reutilizar contraseñas multiplica impacto de una sola filtración.' },
        { id: 'cybersecurity-l4', title: 'Malware, ransomware y protección endpoint', section: 'Módulo 4', duration: '15 min', level: LEVELS.INTERMEDIATE, description: '¿Qué es malware y para qué sirve en un ataque? Verás cómo prevenir infecciones y limitar daño operativo.', requirements: ['Dispositivo actualizado', 'Acceso a antivirus o EDR básico'], steps: ['Diferenciar tipos de malware comunes', 'Configurar actualizaciones automáticas', 'Revisar política de descargas seguras', 'Definir estrategia de backups verificados', 'Practicar respuesta inicial ante infección'], resources: { video: 'https://www.youtube.com/watch?v=4Q6J5Kq8f20', docs: 'Buenas prácticas CISA', docsUrl: 'https://www.cisa.gov/stopransomware' }, tip: 'Un backup no probado es solo una suposición de recuperación.' },
        { id: 'cybersecurity-l5', title: 'Respuesta a incidentes y cultura segura', section: 'Módulo 5', duration: '16 min', level: LEVELS.ADVANCED, description: '¿Qué es responder a incidentes y para qué sirve? Aprenderás a actuar rápido, contener impacto y mejorar procesos post-incidente.', requirements: ['Conceptos de amenazas y controles', 'Canales de comunicación internos definidos'], steps: ['Detectar y clasificar incidente reportado', 'Contener alcance con acciones inmediatas', 'Escalar al equipo adecuado según criticidad', 'Documentar evidencia y línea de tiempo', 'Realizar retrospectiva con mejoras preventivas'], resources: { video: 'https://www.youtube.com/watch?v=6dM4M4r7LwQ', docs: 'NIST Incident Response', docsUrl: 'https://www.nist.gov/cyberframework/respond-function' }, tip: 'La velocidad importa, pero la documentación también salva operaciones futuras.' },
      ],
      quizSections: [
        { title: 'Fundamentos de seguridad digital', questions: [{ type: 'choice', q: '¿Qué situación compromete directamente la confidencialidad de datos?', opts: ['Copia de seguridad cifrada', 'Acceso no autorizado a información sensible', 'Actualización de sistema operativa', 'Monitoreo de disponibilidad'], ans: 1, exp: 'Confidencialidad se viola cuando ve datos quien no debe.' }, { type: 'truefalse', q: 'La triada CIA es base para evaluar riesgos de seguridad.', ans: true, exp: 'Permite clasificar impacto y priorizar controles.',
              qFalse: 'La triada CIA se refiere a coste, implementación y auditoría de los controles de seguridad.',
              expFalse: 'CIA es confidencialidad, integridad y disponibilidad: los tres pilares sobre los que se evalúa el riesgo.'  }, { type: 'match', q: 'Relaciona pilar y enfoque:', pairs: [{ left: 'Confidencialidad', right: 'Restringir acceso indebido' }, { left: 'Integridad', right: 'Evitar alteración no autorizada' }, { left: 'Disponibilidad', right: 'Acceso oportuno a servicios' }, { left: 'Riesgo', right: 'Probabilidad por impacto' }], exp: 'Todo programa de seguridad parte de estos conceptos.' }] },
        { title: 'Phishing e ingeniería social', questions: [{ type: 'choice', q: '¿Cuál es la mejor primera respuesta ante correo urgente que solicita credenciales?', opts: ['Responder inmediatamente para evitar bloqueo', 'Verificar autenticidad por canal alterno y reportar', 'Abrir enlace en modo incógnito', 'Reenviar a todos para confirmar'], ans: 1, exp: 'La verificación externa evita caer en manipulación.' }, { type: 'truefalse', q: 'La urgencia artificial es una táctica común de ingeniería social.', ans: true, exp: 'Busca reducir pensamiento crítico de la víctima.',
              qFalse: 'Un mensaje que mete prisa es señal de que la solicitud es legítima y viene de un canal oficial.',
              expFalse: 'La prisa es justo la táctica que impide verificar; ante una urgencia inesperada hay que desconfiar y confirmar por otro canal.'  }, { type: 'match', q: 'Relaciona señal y riesgo asociado:', pairs: [{ left: 'Dominio sospechoso', right: 'Suplantación de identidad' }, { left: 'Adjunto inesperado', right: 'Posible malware' }, { left: 'Solicitud de secreto', right: 'Robo de credenciales' }, { left: 'Errores de redacción', right: 'Campaña fraudulenta probable' }], exp: 'Reconocer señales tempranas corta la cadena de ataque.' }] },
        { title: 'Contraseñas, MFA y control de acceso', questions: [{ type: 'choice', q: '¿Qué práctica reduce más el riesgo de credential stuffing?', opts: ['Repetir contraseña con variaciones mínimas', 'Contraseñas únicas + gestor + MFA', 'Cambiar clave solo una vez al año', 'Compartir contraseñas por chat interno'], ans: 1, exp: 'Combinación de controles reduce éxito de ataques automatizados.' }, { type: 'truefalse', q: 'MFA sigue siendo útil incluso si una contraseña se filtra.', ans: true, exp: 'Añade barrera adicional al acceso no autorizado.',
              qFalse: 'Si la contraseña se filtra, el MFA deja de aportar protección alguna.',
              expFalse: 'Ese es precisamente el escenario donde el MFA salva la cuenta: al atacante le sigue faltando el segundo factor.'  }, { type: 'match', q: 'Relaciona control y beneficio:', pairs: [{ left: 'Gestor de contraseñas', right: 'Claves largas y únicas sin memorizar todo' }, { left: 'MFA', right: 'Segundo factor de autenticación' }, { left: 'Revisión de sesiones', right: 'Detectar accesos no esperados' }, { left: 'Principio mínimo privilegio', right: 'Reducir impacto de cuenta comprometida' }], exp: 'La protección de identidad requiere capas complementarias.' }] },
        { title: 'Malware, ransomware y protección endpoint', questions: [{ type: 'choice', q: '¿Qué medida reduce impacto operativo de ransomware?', opts: ['Apagar antivirus para mejorar velocidad', 'Backups desconectados y probados periódicamente', 'Permitir macros desconocidas', 'Usar software sin parches'], ans: 1, exp: 'La recuperación depende de copias íntegras verificadas.' }, { type: 'truefalse', q: 'Parchar sistemas reduce exposición a vulnerabilidades conocidas.', ans: true, exp: 'Ataques oportunistas explotan software desactualizado.',
              qFalse: 'Conviene retrasar los parches indefinidamente porque cada actualización introduce más riesgo del que quita.',
              expFalse: 'Las vulnerabilidades conocidas son las más explotadas; el parche cierra la ventana de exposición.'  }, { type: 'match', q: 'Relaciona amenaza y control recomendado:', pairs: [{ left: 'Ransomware', right: 'Backup + segmentación + respuesta rápida' }, { left: 'Trojan', right: 'Descargas solo de fuentes confiables' }, { left: 'Spyware', right: 'Detección endpoint y monitoreo' }, { left: 'USB malicioso', right: 'Política de dispositivos y bloqueo automático' }], exp: 'Controles preventivos y de respuesta deben coexistir.' }] },
        { title: 'Respuesta a incidentes y cultura segura', questions: [{ type: 'choice', q: '¿Qué paso inicial es crítico al detectar incidente activo?', opts: ['Esperar confirmación final sin actuar', 'Contener y escalar según severidad definida', 'Publicar detalles en redes sociales', 'Reiniciar todo sin preservar evidencia'], ans: 1, exp: 'La contención temprana reduce daño y facilita investigación.' }, { type: 'truefalse', q: 'Documentar línea de tiempo del incidente ayuda a mejorar controles futuros.', ans: true, exp: 'Permite aprendizaje organizacional y auditoría.',
              qFalse: 'Una vez contenido el incidente, documentar la línea de tiempo ya no aporta valor al equipo.',
              expFalse: 'La cronología revela dónde falló la detección y la respuesta; sin ella se repite el mismo incidente.'  }, { type: 'match', q: 'Relaciona fase de respuesta y propósito:', pairs: [{ left: 'Detección', right: 'Identificar evento sospechoso' }, { left: 'Contención', right: 'Limitar propagación del impacto' }, { left: 'Erradicación', right: 'Eliminar causa raíz' }, { left: 'Lecciones aprendidas', right: 'Fortalecer prevención futura' }], exp: 'La respuesta efectiva es cíclica y mejora con cada evento.' }] },
      ],
      examSections: [
        { title: 'Escenario de incidente real', questions: [{ type: 'choice', q: 'Un colaborador ejecutó un adjunto sospechoso y reporta comportamiento anómalo. ¿Qué secuencia es más correcta?', opts: ['Ignorar hasta tener más reportes', 'Aislar equipo, notificar SOC/IT, preservar evidencia y evaluar alcance', 'Formatear de inmediato sin registro', 'Compartir archivo con más usuarios para comparar'], ans: 1, exp: 'Contención y evidencia temprana son críticas.' }, { type: 'truefalse', q: 'Si no existe canal formal de reporte, el tiempo de respuesta a incidentes empeora notablemente.', ans: true, exp: 'La gobernanza de comunicación impacta resiliencia.',
              qFalse: 'Reportar los incidentes por canales informales acelera la respuesta frente a un canal formal.',
              expFalse: 'Sin canal formal el aviso se pierde entre mensajes y nadie lo asume; el tiempo de respuesta se dispara.'  }, { type: 'match', q: 'Relaciona síntoma y acción inicial:', pairs: [{ left: 'Actividad de red inusual', right: 'Aislar endpoint y monitorear tráfico' }, { left: 'Cuenta comprometida', right: 'Forzar reset y revocar sesiones' }, { left: 'Archivo cifrado masivo', right: 'Activar plan anti-ransomware' }, { left: 'Correo fraudulento interno', right: 'Bloquear campaña y alertar usuarios' }], exp: 'La rapidez en la primera respuesta define el daño final.' }] },
        { title: 'Madurez de ciberseguridad organizacional', questions: [{ type: 'choice', q: '¿Qué práctica refleja mayor madurez de seguridad en una organización?', opts: ['Capacitación anual opcional sin seguimiento', 'Entrenamiento continuo, simulacros y mejora basada en incidentes', 'Solo compra de herramientas sin procesos', 'Políticas sin responsables definidos'], ans: 1, exp: 'La cultura y procesos sostienen controles tecnológicos.' }, { type: 'truefalse', q: 'La seguridad efectiva requiere responsabilidad compartida entre negocio, TI y usuarios.', ans: true, exp: 'No depende de un único equipo aislado.',
              qFalse: 'La seguridad es responsabilidad exclusiva del área de TI y no involucra a negocio ni a usuarios.',
              expFalse: 'La mayoría de incidentes entra por el usuario o por decisiones de negocio: la responsabilidad es compartida.'  }, { type: 'match', q: 'Relaciona capacidad y resultado:', pairs: [{ left: 'Awareness continuo', right: 'Menor tasa de phishing exitoso' }, { left: 'Plan de respuesta probado', right: 'Recuperación más rápida' }, { left: 'Gestión de parches', right: 'Menor exposición a CVEs conocidas' }, { left: 'Auditoría periódica', right: 'Visibilidad de brechas y cumplimiento' }], exp: 'La madurez se construye con disciplina operativa continua.' }] },
      ],
    },
  };

  if (typeof ExtendedCourses !== 'undefined') {
    Object.assign(DATA, ExtendedCourses.getCourses(LEVELS));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function _localeCode() {
    return typeof I18n !== 'undefined' ? I18n.getLocale() : 'es';
  }

  function _curriculumBundle() {
    const loc = _localeCode();
    if (loc === 'en' && typeof CURRICULUM_EN !== 'undefined') return CURRICULUM_EN;
    if (loc === 'zh' && typeof CURRICULUM_ZH !== 'undefined') return CURRICULUM_ZH;
    return null;
  }

  function _levelsMap() {
    const loc = _localeCode();
    if (loc === 'en' && typeof LEVELS_EN !== 'undefined') return LEVELS_EN;
    if (loc === 'zh' && typeof LEVELS_ZH !== 'undefined') return LEVELS_ZH;
    return null;
  }

  function _localizeLevel(level) {
    const map = _levelsMap();
    if (map && map[level]) return map[level];
    return level;
  }

  function _mergeQuestion(q, eq) {
    if (!eq) return q;
    const merged = {
      ...q,
      q: eq.q || eq.text || q.q,
      opts: eq.opts || eq.options || q.opts,
      exp: eq.exp || eq.explanation || q.exp,
      pairs: eq.pairs || q.pairs,
    };

    // Variante falsa de un Verdadero/Falso: el motor la usa para alternar la
    // polaridad al azar. Si el idioma activo no la trae, se elimina en vez de
    // heredar la española, para no mezclar idiomas en la misma pregunta.
    const localizedFalse = eq.qFalse || eq.textFalse;
    if (localizedFalse) {
      merged.qFalse = localizedFalse;
      merged.expFalse = eq.expFalse || eq.explanationFalse || merged.exp;
    } else {
      delete merged.qFalse;
      delete merged.expFalse;
    }

    return merged;
  }

  function _localizeCourse(course, courseId) {
    const bundle = _curriculumBundle();
    if (!bundle) {
      return clone({
        ...course,
        lessons: course.lessons.map(l => ({ ...l, level: _localizeLevel(l.level) })),
      });
    }
    const localized = clone(course);
    let loc = bundle[courseId];
    if (!loc && typeof ExtendedCourseLocales !== 'undefined' && ExtendedCourseLocales.isExtendedId(courseId)) {
      const extOverlay = ExtendedCourseLocales.buildOverlay(courseId, course, _localeCode());
      if (extOverlay) loc = extOverlay;
    }
    if (loc) {
      if (loc.title) localized.title = loc.title;
      if (loc.requirements) localized.requirements = loc.requirements;
      if (loc.certModules) localized.certModules = loc.certModules;
      if (loc.docs?.label) localized.docs = { ...localized.docs, label: loc.docs.label };
      localized.lessons = localized.lessons.map(lesson => {
        const ol = loc.lessons?.[lesson.id];
        const merged = ol ? { ...lesson, ...ol } : { ...lesson };
        merged.level = _localizeLevel(merged.level);
        if (ol?.resources?.docs) merged.resources = { ...merged.resources, docs: ol.resources.docs };
        return merged;
      });
      if (loc.quizSections) {
        localized.quizSections = localized.quizSections.map((sec, i) => {
          const es = loc.quizSections[i];
          if (!es) return sec;
          return {
            title: es.title || sec.title,
            questions: sec.questions.map((q, qi) => _mergeQuestion(q, es.questions?.[qi])),
          };
        });
      }
      if (loc.examSections) {
        localized.examSections = localized.examSections.map((sec, i) => {
          const es = loc.examSections[i];
          if (!es) return sec;
          return {
            title: es.title || sec.title,
            questions: sec.questions.map((q, qi) => _mergeQuestion(q, es.questions?.[qi])),
          };
        });
      }
    } else {
      localized.lessons = localized.lessons.map(l => ({ ...l, level: _localizeLevel(l.level) }));
    }
    return localized;
  }

  function getCourse(courseId) {
    const course = DATA[courseId] || null;
    if (!course) return null;
    return _localizeCourse(course, courseId);
  }

  function getCourseIds() {
    return Object.keys(DATA);
  }

  function getCourseMeta(courseId) {
    const course = getCourse(courseId);
    if (!course) return null;
    return clone({
      requirements: course.requirements,
      docs: course.docs,
      certModules: course.certModules,
      title: course.title,
      category: course.category,
      icon: course.icon,
    });
  }

  function _lessonVideoUrl(courseId, lessonIndex) {
    const curated = LESSON_VIDEOS[courseId];
    if (!curated || lessonIndex < 0 || lessonIndex >= curated.length) return null;
    return curated[lessonIndex] || null;
  }

  function getLessons(courseId) {
    const course = getCourse(courseId);
    if (!course) return [];
    return clone(course.lessons.map((lesson, i) => {
      const quizSection = course.quizSections[i];
      const moduleTitle = quizSection?.title || lesson.title;
      const curatedVideo = _lessonVideoUrl(courseId, i);
      const video = curatedVideo ?? lesson.resources?.video ?? null;
      return {
        ...lesson,
        section: moduleTitle,
        quizModule: moduleTitle,
        quizQuestionCount: quizSection?.questions?.length || 0,
        certModule: course.certModules[i] || moduleTitle,
        resources: {
          ...lesson.resources,
          ...(video ? { video } : {}),
        },
      };
    }));
  }

  /** Ruta alineada: lección → quiz del módulo → examen final. */
  function getLearningPath(courseId) {
    const course = getCourse(courseId);
    if (!course) return [];
    return clone(course.lessons.map((lesson, i) => {
      const quizSection = course.quizSections[i];
      const moduleTitle = quizSection?.title || lesson.title;
      return {
        index: i,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        moduleTitle,
        certModule: course.certModules[i] || moduleTitle,
        level: lesson.level,
        duration: lesson.duration,
        quizQuestions: quizSection?.questions?.length || 0,
        videoUrl: _lessonVideoUrl(courseId, i),
      };
    }));
  }

  function getQuizDef(courseId) {
    const course = getCourse(courseId);
    if (!course) return null;
    const qCount = course.quizSections.reduce((n, s) => n + s.questions.length, 0);
    return clone({
      id: courseId,
      title: course.title,
      category: course.category,
      icon: course.icon,
      desc: typeof I18n !== 'undefined'
        ? I18n.t('quizDesc', { n: qCount, m: course.lessons.length })
        : `Evaluación de ${qCount} preguntas alineada a los ${course.lessons.length} módulos del curso.`,
      sections: course.quizSections,
    });
  }

  function getAllQuizzes() {
    return getCourseIds().map((courseId) => getQuizDef(courseId)).filter(Boolean);
  }

  function getExamSections(courseId) {
    const course = getCourse(courseId);
    return course ? clone(course.examSections) : [];
  }

  function getCertMeta(courseId) {
    const course = getCourse(courseId);
    if (!course) return null;
    const levelsCovered = Array.from(new Set(course.lessons.map((lesson) => lesson.level)));
    const quizQuestionCount = course.quizSections.reduce((sum, section) => sum + section.questions.length, 0);
    const modules = course.lessons.map((lesson, i) =>
      course.certModules[i] || course.quizSections[i]?.title || lesson.title
    );
    return clone({
      modules,
      levelsCovered,
      lessonCount: course.lessons.length,
      quizModuleCount: course.quizSections.length,
      quizQuestionCount,
      examSectionCount: course.examSections.length,
    });
  }

  return {
    getCourseIds,
    getLessons,
    getLearningPath,
    getQuizDef,
    getAllQuizzes,
    getExamSections,
    getCertMeta,
    getCourseMeta,
    LEVELS,
  };
})();

if (typeof module !== 'undefined') module.exports = CourseCurriculum;
