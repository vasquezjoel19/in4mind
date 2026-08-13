'use strict';

/** IN4MIND ? Cat?logo extendido de herramientas y tecnolog?as. */
const ExtendedCourses = (() => {

  const ICON = {
    flowchart: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
    os: 'https://cdn-icons-png.flaticon.com/512/888/888882.png',
    powerapps: 'https://cdn-icons-png.flaticon.com/512/5968/5968557.png',
    sharepoint: 'src/img/courses/logos/sharepoint.png',
    outlook: 'https://cdn-icons-png.flaticon.com/512/732/732223.png',
    onedrive: 'https://cdn-icons-png.flaticon.com/512/2991/2991143.png',
    scrum: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
    scratch: 'https://cdn-icons-png.flaticon.com/512/5968/5968242.png',
    video: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
    django: 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png',
    powerbi: 'src/img/courses/logos/powerbi.png',
    prompt: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
    engineering: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
    game: 'https://cdn-icons-png.flaticon.com/512/686/686589.png',
  };

  /** Videos YouTube por curso (uno por m�dulo). Se rellenan hasta 5 si hay menos enlaces. */
  const VIDEOS_RAW = {
    flowchart: ['zuCHSKLIibo', '0G0-kIwDggE', 'aFZX20Cb9S8'],
    os: ['1C8x3nn-u_w', 'ccKNxlKpe_Q'],
    powerapps: ['bihOpGpdJMs', 'bAhVEmU1aIs', 'lG46zdgn6pU'],
    sharepoint: ['uAsv3ofcb5U', 'cDfQ-o9hny0', '6zZecoftVmA'],
    outlook: ['-Ntmp7BugP4', 'Sro03l1jlbQ', '2wUf3hdFhzk'],
    onedrive: ['FDnEIvadlv4', 'uoUVhMu0CKM', 'FTPbEoHJpWU'],
    scrum: ['sLexw-z13Fo', '7HeEAgmu-GY', 'ExTUJHwiuoU'],
    scratch: ['a5DOIvjxiQ0', '5OUb91fDKXw', 'D-nW4jvzRr8'],
    'video-editing': ['Gk8IKZoK3l8', 'o5QRf-nLTQo', '9B6W6kOcopt', 'Q44v1ouc_mY', 'a13oF00IqEk'],
    django: ['srkMntDfil4', '7XO1AzwkPPE'],
    powerbi: ['pwJuFbyhZFE', 'U86tOaQCgVI', 'C8HatpMK9Hw'],
    'prompt-engineering': ['Rbws9lbVNAM', '7f5xF-I-S3c'],
    engineering: ['W8KQJ1KcEk0', 'whylUwZjbVk', 'OV6LKjrrcu4', 'Q78KbL7N7UQ', 'IG-SuxoV6e4'],
    'game-editing': ['j48BhgjGmN0', 'Ben-Xe36htj8', 'MOiRVfddhZA', 'Gp0enaj0zxc', '6YnzoBkJl1s'],
  };

  function _padVideoIds(ids, count = 5) {
    if (!ids?.length) return [];
    const out = [];
    for (let i = 0; i < count; i += 1) out.push(ids[i % ids.length]);
    return out;
  }

  const VIDEOS = Object.fromEntries(
    Object.entries(VIDEOS_RAW).map(([id, list]) => [id, _padVideoIds(list)])
  );

  function _youtuVideos(courseId) {
    return (VIDEOS[courseId] || []).map((id) => `https://youtu.be/${id}`);
  }

  function _watchVideos(courseId) {
    return (VIDEOS[courseId] || []).map((id) => `https://www.youtube.com/watch?v=${id}`);
  }

  function _mod(title, description, steps, extra = {}) {
    return { title, description, steps, ...extra };
  }

  function getCourses(LEVELS) {
    const F = (spec) => CourseFactory.build(LEVELS, {
      ...spec,
      videos: _watchVideos(spec.id),
    });

    return {
      flowchart: F({
        id: 'flowchart', title: 'Diagrama de flujo', category: 'tools', icon: ICON.flowchart,
        requirements: ['Editor de diagramas', 'Proceso a documentar'],
        docs: { label: 'Diagramas de flujo', url: 'https://www.lucidchart.com/pages/es/que-es-un-diagrama-de-flujo' },
        modules: [
          _mod('S?mbolos y notaci?n', 'Aprende la notaci?n est?ndar para representar procesos.', ['Identificar inicio, fin, proceso y decisi?n', 'Usar conectores y direcci?n de flujo', 'Evitar cruces innecesarios', 'Aplicar lectura top-down', 'Exportar diagrama compartible']),
          _mod('Proceso actual (AS-IS)', 'Documenta el flujo real antes de mejorar.', ['Entrevistar actores clave', 'Dibujar flujo sin idealizar', 'Marcar esperas y retrabajo', 'Cuantificar tiempos por etapa', 'Validar con el equipo']),
          _mod('Decisiones y excepciones', 'Modela ramificaciones y caminos alternativos.', ['Preguntas s?/no en decisiones', 'Representar bucles con salida clara', 'Documentar excepciones', 'Balancear detalle', 'Verificar cierre de caminos']),
          _mod('Proceso objetivo (TO-BE)', 'Dise?a el flujo mejorado.', ['Detectar cuellos de botella', 'Proponer simplificaci?n', 'Definir responsables', 'Estimar impacto', 'Comparar AS-IS vs TO-BE']),
          _mod('Documentaci?n viva', 'Mant?n diagramas actualizados.', ['Asignar due?o', 'Versionar cambios', 'Vincular a SOPs', 'Programar revisiones', 'Archivar obsoletos']),
        ],
      }),
      os: F({
        id: 'os', title: 'Sistema operativo', category: 'tools', icon: ICON.os,
        requirements: ['PC con Windows, macOS o Linux', 'Usuario con permisos b?sicos'],
        docs: { label: 'Windows', url: 'https://learn.microsoft.com/es-es/windows/' },
        modules: [
          _mod('Archivos y escritorio', 'Navega y organiza el sistema con eficiencia.', ['Explorar carpetas y rutas', 'Crear y mover archivos', 'Usar b?squeda del SO', 'Configurar vistas', 'Recuperar desde papelera']),
          _mod('Usuarios y permisos', 'Configura cuentas y seguridad local.', ['Usuario est?ndar vs admin', 'Permisos de lectura/escritura', 'Bloqueo de pantalla', 'Actualizaciones de seguridad', 'Copia de seguridad b?sica']),
          _mod('Procesos y rendimiento', 'Diagnostica uso de recursos.', ['Administrador de tareas', 'Identificar procesos pesados', 'Liberar espacio en disco', 'Finalizar apps bloqueadas', 'Reiniciar cuando convenga']),
          _mod('Red y conectividad', 'Resuelve problemas de conexi?n comunes.', ['Conectar Wi-Fi segura', 'Diagn?stico de red', 'Olvidar redes problem?ticas', 'Distinguir fallo local vs ISP', 'Probar con otro dispositivo']),
          _mod('Productividad diaria', 'Atajos y automatizaci?n del SO.', ['Atajos de ventana', 'Espacios virtuales', 'Tareas programadas', 'Sync con nube', 'Documentar tu setup']),
        ],
      }),
      powerapps: F({
        id: 'powerapps', title: 'Power Apps', category: 'office', icon: ICON.powerapps,
        requirements: ['Cuenta Microsoft 365', 'Licencia Power Apps'],
        docs: { label: 'Power Apps', url: 'https://learn.microsoft.com/es-es/power-apps/' },
        modules: [
          _mod('Introducci?n a Power Apps', 'Crea apps low-code conectadas a datos.', ['Explorar Power Apps Studio', 'Canvas vs model-driven', 'Conectar SharePoint o Excel', 'Controles b?sicos', 'Publicar app de prueba']),
          _mod('F?rmulas y UX', 'Power Fx y navegaci?n entre pantallas.', ['Botones y entradas', 'F?rmulas Filter y LookUp', 'Validar formularios', 'Navegar entre pantallas', 'Tema coherente']),
          _mod('Datos y conectores', 'Integra fuentes empresariales.', ['Elegir conector', 'Mapear campos', 'Crear y editar registros', 'Manejar errores', 'Probar con datos reales']),
          _mod('Power Automate', 'Automatiza desde la app.', ['Flujo al enviar formulario', 'Notificaci?n Teams/email', 'Flujo de aprobaci?n', 'Registrar en SharePoint', 'Prueba end-to-end']),
          _mod('Publicaci?n y gobernanza', 'Despliega en entornos corporativos.', ['Entorno dev vs prod', 'Permisos por rol', 'Documentar dependencias', 'Versionar cambios', 'Feedback de usuarios']),
        ],
      }),
      sharepoint: F({
        id: 'sharepoint', title: 'SharePoint', category: 'office', icon: ICON.sharepoint,
        requirements: ['Cuenta Microsoft 365', 'Sitio de equipo'],
        docs: { label: 'SharePoint', url: 'https://support.microsoft.com/es-es/sharepoint' },
        modules: [
          _mod('Sitios y bibliotecas', 'Organiza documentos en la nube.', ['Acceder a sitio de equipo', 'Subir a biblioteca', 'Crear lista con columnas', 'Vistas filtradas', 'Compartir con permisos']),
          _mod('Coautor?a', 'Edita en equipo con versionado.', ['Coeditar en navegador', 'Historial de versiones', 'Restaurar versi?n', 'Comentarios', 'Checkout si aplica']),
          _mod('Permisos', 'Control de acceso seguro.', ['Lectura vs edici?n', 'Grupos M365', 'Herencia de permisos', 'Auditar accesos', 'Revocar enlaces']),
          _mod('P?ginas e intranet', 'Comunica en el sitio.', ['P?gina de noticias', 'Web parts', 'Publicar contenido', 'Navegaci?n del sitio', 'Medir uso b?sico']),
          _mod('Integraci?n M365', 'Teams, Outlook y Power Platform.', ['Biblioteca en Teams', 'Sync OneDrive', 'Listas en Automate', 'Calendario del sitio', 'Flujo documental']),
        ],
      }),
      outlook: F({
        id: 'outlook', title: 'Outlook', category: 'office', icon: ICON.outlook,
        requirements: ['Cuenta Microsoft 365 o Outlook.com'],
        docs: { label: 'Outlook', url: 'https://support.microsoft.com/es-es/outlook' },
        modules: [
          _mod('Correo profesional', 'Redacta y gestiona mensajes.', ['Firma y respuestas auto', 'Asunto accionable', 'Para/CC/CCO', 'Adjuntos y enlaces', 'Programar env?o']),
          _mod('Organizaci?n', 'Carpetas y reglas autom?ticas.', ['Carpetas por proyecto', 'Reglas de entrada', 'Categor?as de color', 'Seguimiento', 'Archivar con criterio']),
          _mod('Calendario', 'Reuniones y disponibilidad.', ['Evento con agenda', 'Invitar y Teams', 'Recordatorios', 'Zonas horarias', 'Sala de reuniones']),
          _mod('Tareas integradas', 'Del correo a la acci?n.', ['Marcar seguimiento', 'Crear tarea', 'Microsoft To Do', 'Cerrar pendientes', 'Priorizar bloques']),
          _mod('Seguridad', 'Phishing y datos sensibles.', ['Se?ales de phishing', 'Adjuntos sospechosos', 'Cifrado', 'Reportar fraude', 'Pol?tica de retenci?n']),
        ],
      }),
      onedrive: F({
        id: 'onedrive', title: 'OneDrive', category: 'office', icon: ICON.onedrive,
        requirements: ['Cuenta Microsoft 365', 'Cliente OneDrive'],
        docs: { label: 'OneDrive', url: 'https://support.microsoft.com/es-es/onedrive' },
        modules: [
          _mod('Sync y almacenamiento', 'Archivos en la nube con espejo local.', ['Instalar cliente', 'Elegir carpetas sync', 'Subir y organizar', 'Estado de sync', 'Archivos bajo demanda']),
          _mod('Compartir seguro', 'Enlaces con permisos y expiraci?n.', ['Enlace vista/edici?n', 'Fecha de expiraci?n', 'Revocar acceso', 'Carpeta de equipo', 'Evitar enlaces abiertos']),
          _mod('Coedici?n Office', 'Trabajo simult?neo en documentos.', ['Office web', 'Coedici?n tiempo real', 'Comentarios', 'Resolver conflictos', 'Versi?n final']),
          _mod('Recuperaci?n', 'Versiones y papelera.', ['Historial de versiones', 'Papelera OneDrive', 'Known Folder Move', 'Backup m?vil', 'Prueba de restore']),
          _mod('Gobernanza', 'Pol?ticas corporativas.', ['OneDrive vs SharePoint', 'Etiquetas sensibilidad', 'DLP', 'Sin credenciales en texto', 'Estructura de carpetas']),
        ],
      }),
      scrum: F({
        id: 'scrum', title: 'Scrum', category: 'tools', icon: ICON.scrum,
        requirements: ['Proyecto o equipo', 'Tablero (Jira, Trello, Azure Boards)'],
        docs: { label: 'Scrum Guide', url: 'https://scrumguides.org/scrum-guide.html' },
        modules: [
          _mod('Roles y eventos', 'Framework ?gil en sprints.', ['PO, SM y Developers', 'Duraci?n de sprint', 'Sprint Planning', 'Daily Scrum', 'Review y Retro']),
          _mod('User stories', 'INVEST y criterios de aceptaci?n.', ['Formato Como/Quiero/Para', 'Criterios verificables', 'Estimaci?n', 'Priorizaci?n', 'Refinar backlog']),
          _mod('Tablero Kanban', 'Flujo visual del sprint.', ['Columnas To Do/Doing/Done', 'L?mite WIP', 'Mover con criterio', 'Detectar bloqueos', 'Burndown simple']),
          _mod('Definition of Done', 'Acuerdo de calidad del equipo.', ['Definir DoD', 'Incluir pruebas', 'Aplicar en cada ?tem', 'Deuda en retro', 'Evolucionar DoD']),
          _mod('Mejora continua', 'M?tricas y retrospectiva.', ['Velocity para planificar', 'Acciones en retro', 'Escalar impedimentos', 'Cultura de inspecci?n', 'Adaptar cada sprint']),
        ],
      }),
      scratch: F({
        id: 'scratch', title: 'Scratch', category: 'programming', icon: ICON.scratch,
        requirements: ['Navegador web', 'Cuenta Scratch opcional'],
        docs: { label: 'Scratch Ideas', url: 'https://scratch.mit.edu/ideas' },
        modules: [
          _mod('Sprites y bloques', 'Programaci?n visual sin sintaxis.', ['Escenario y sprites', 'Movimiento b?sico', 'Apariencia y sonido', 'Guardar proyecto', 'Remixar de comunidad']),
          _mod('Eventos y bucles', 'Reaccionar a acciones del usuario.', ['Banderita verde', 'Teclas', 'Bucles repeat/forever', 'Condiciones if', 'Depurar paso a paso']),
          _mod('Variables y mensajes', 'Puntuaci?n y comunicaci?n.', ['Variable de score', 'Actualizar en eventos', 'Broadcast entre sprites', 'Sincronizar animaciones', 'Probar casos l?mite']),
          _mod('Mini-juego', 'Proyecto interactivo completo.', ['Reglas y victoria', 'Dificultad progresiva', 'Feedback visual', 'Prueba con usuario', 'Iterar dise?o']),
          _mod('Comunidad Scratch', 'Compartir con responsabilidad.', ['Notas del proyecto', 'Atribuir assets', 'Publicar', 'Comentar constructivo', 'Reflexionar aprendizaje']),
        ],
      }),
      'video-editing': F({
        id: 'video-editing', title: 'Edici?n de videos', category: 'design', icon: ICON.video,
        requirements: ['Editor de video', 'Clips de pr?ctica'],
        docs: { label: 'Edici?n de video', url: 'https://www.youtube.com/results?search_query=video+editing+basics' },
        modules: [
          _mod('Timeline y cortes', 'Montaje b?sico con ritmo.', ['Importar clips', 'Cortar y ordenar', 'Ajustar in/out', 'Eliminar sobrantes', 'Exportar borrador']),
          _mod('Audio', 'Voz, m?sica y niveles.', ['Normalizar di?logo', 'M?sica de fondo', 'Fade in/out', 'Cortes al ritmo', 'Reducir ruido']),
          _mod('T?tulos y transiciones', 'Guiar al espectador.', ['Lower thirds', 'Transiciones suaves', 'Evitar distracciones', 'Marca visual', 'Legibilidad m?vil']),
          _mod('Color y export', 'Look profesional y formatos.', ['Exposici?n y contraste', 'Preset/LUT ligero', 'Codec por plataforma', 'Export YouTube/IG', 'Verificar en destino']),
          _mod('Flujo de trabajo', 'Organizaci?n y revisi?n.', ['Carpetas de proyecto', 'Nombres consistentes', 'Checklist de revisi?n', 'Feedback cliente', 'Archivar proyecto']),
        ],
      }),
      django: F({
        id: 'django', title: 'Django', category: 'programming', icon: ICON.django,
        requirements: ['Python instalado', 'Terminal b?sica'],
        docs: { label: 'Django docs', url: 'https://docs.djangoproject.com/es/5.0/' },
        modules: [
          _mod('Proyecto MVT', 'Framework web en Python.', ['Entorno virtual', 'Crear proyecto y app', 'settings y urls', 'Servidor dev', 'Vista y plantilla']),
          _mod('Modelos ORM', 'Persistencia y migraciones.', ['Definir modelo', 'Migraciones', 'Admin', 'Datos de prueba', 'Shell Django']),
          _mod('Vistas y templates', 'P?ginas din?micas.', ['URL a vista', 'Contexto a template', 'base.html', 'Lista y detalle', 'Enlaces entre p?ginas']),
          _mod('Formularios', 'Entrada de usuario segura.', ['ModelForm', 'Validaci?n servidor', 'Errores en template', 'Token CSRF', 'Redirect tras guardar']),
          _mod('API y deploy', 'DRF intro y producci?n.', ['REST framework b?sico', 'Serializar modelo', 'Probar endpoint', 'DEBUG y ALLOWED_HOSTS', 'Checklist seguridad']),
        ],
      }),
      powerbi: F({
        id: 'powerbi', title: 'Power BI', category: 'data', icon: ICON.powerbi,
        requirements: ['Power BI Desktop', 'Datos Excel o CSV'],
        docs: { label: 'Power BI', url: 'https://learn.microsoft.com/es-es/power-bi/' },
        modules: [
          _mod('Power Query', 'Importar y limpiar datos.', ['Conectar origen', 'Editor Power Query', 'Tipos y nulos', 'Transformaciones', 'Cargar al modelo']),
          _mod('Modelado', 'Relaciones y estrella.', ['Claves primarias', 'Relaci?n 1:N', 'Evitar ambig?edad', 'Ocultar columnas', 'Documentar tablas']),
          _mod('DAX esencial', 'KPIs con medidas.', ['SUM ventas', 'Variaci?n YoY', 'DIVIDE seguro', 'CALCULATE', 'Validar n?meros']),
          _mod('Visuales', 'Informes accionables.', ['Visual por pregunta', 'Segmentadores', 'Filtros sincronizados', 'Formato de marca', 'Tooltips claros']),
          _mod('Publicaci?n', 'Service y refresh.', ['Publicar workspace', 'Refresh programado', 'Permisos', 'Export PDF', 'Monitorear fallos']),
        ],
      }),
      'prompt-engineering': F({
        id: 'prompt-engineering', title: 'Prompt Engineering', category: 'tools', icon: ICON.prompt,
        requirements: ['Asistente de IA', 'Casos de uso definidos'],
        docs: { label: 'Prompt engineering', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
        modules: [
          _mod('Anatom?a del prompt', 'Contexto, tarea y formato.', ['Rol y contexto', 'Formato de salida', 'Few-shot', 'Tono y audiencia', 'Iterar una variable']),
          _mod('Razonamiento', 'Chain-of-thought y descomposici?n.', ['Paso a paso', 'Subpreguntas', 'Verificar supuestos', 'Comparar enfoques', 'Detectar alucinaciones']),
          _mod('Productividad', 'Correos, res?menes y tablas.', ['Resumen con l?mite', 'Notas a informe', 'Borrador de email', 'Tabla Markdown', 'Validar salida']),
          _mod('C?digo y datos', 'Asistencia t?cnica segura.', ['Stack y versi?n', 'Error completo al depurar', 'Pedir tests', 'Sin API keys', 'Explicar complejidad']),
          _mod('Evaluaci?n', 'Plantillas y pol?ticas.', ['Criterios de ?xito', 'Guardar plantillas', 'Pol?tica de datos', 'Revisar sesgos', 'Actualizar con modelo']),
        ],
      }),
      engineering: F({
        id: 'engineering', title: 'Ingenier?a de software', category: 'programming', icon: ICON.engineering,
        requirements: ['Bases de programaci?n', 'Trabajo en equipo'],
        docs: { label: 'Ingenier?a de software', url: 'https://martinfowler.com/' },
        modules: [
          _mod('Requisitos', 'Del problema al alcance.', ['Funcionales y NFR', 'Priorizar valor', 'Casos de uso', 'Validar alcance', 'Criterios aceptaci?n']),
          _mod('Arquitectura', 'Modularidad y capas.', ['Separar m?dulos', 'Capas UI/l?gica/datos', 'Patrones b?sicos', 'Diagrama componentes', 'Cohesi?n y acoplamiento']),
          _mod('Pruebas y CI', 'Calidad automatizada.', ['Tests unitarios', 'Suite en CI', 'Cobertura con criterio', 'Code review', 'Regresiones']),
          _mod('DevOps', 'Entrega y monitoreo.', ['Build reproducible', 'Pipeline deploy', 'Secretos seguros', 'Logs y m?tricas', 'Plan rollback']),
          _mod('Mantenimiento', 'Deuda t?cnica y evoluci?n.', ['Identificar deuda', 'Refactor incremental', 'ADR ligero', 'Est?ndares equipo', 'Features vs estabilidad']),
        ],
      }),
      'game-editing': F({
        id: 'game-editing', title: 'Edici\u00f3n de videojuegos', category: 'design', icon: ICON.game,
        requirements: ['Motor de juego (Unity, Unreal o Godot)', 'PC con requisitos m\u00ednimos del editor'],
        docs: { label: 'Unity Learn', url: 'https://learn.unity.com/' },
        modules: [
          _mod('Introducci\u00f3n al editor', 'Conoce el entorno de creaci\u00f3n de videojuegos.', ['Abrir proyecto de ejemplo', 'Explorar escena, jerarqu\u00eda e inspector', 'Navegar vista Scene y Game', 'Guardar escena y proyecto', 'Probar Play mode']),
          _mod('Assets y prefabs', 'Organiza recursos reutilizables del juego.', ['Importar modelos, sprites y audio', 'Crear prefabs desde objetos', 'Aplicar materiales y texturas', 'Organizar carpetas del proyecto', 'Instanciar prefabs en escena']),
          _mod('F\u00edsica y colisiones', 'Simula interacci\u00f3n entre objetos.', ['A\u00f1adir Rigidbody y Colliders', 'Configurar capas de colisi\u00f3n', 'Detectar triggers y contactos', 'Ajustar gravedad y fricci\u00f3n', 'Depurar colisiones en runtime']),
          _mod('UI y jugabilidad', 'Pantallas, HUD y feedback al jugador.', ['Crear Canvas y botones', 'Mostrar puntuaci\u00f3n y vidas', 'Conectar eventos UI a l\u00f3ica', 'A\u00f1adir sonidos de feedback', 'Probar flujo de men\u00fa a partida']),
          _mod('Build y publicaci\u00f3n', 'Exporta y prueba tu juego.', ['Configurar Player Settings', 'Elegir plataforma objetivo', 'Generar build de prueba', 'Probar en dispositivo o ventana', 'Documentar versi\u00f3n y cambios']),
        ],
      }),
    };
  }

  function getCatalogEntries() {
    return [
      { id: 'flowchart', title: 'Diagrama de flujo', desc: 'Modela procesos con notaci?n clara y decisiones trazables.', icon: ICON.flowchart, color: 'var(--clr-flowchart)', category: 'tools', tags: ['diagrama', 'flujo', 'procesos'] },
      { id: 'os', title: 'Sistema operativo', desc: 'Domina archivos, permisos, red y productividad en tu SO.', icon: ICON.os, color: 'var(--clr-os)', category: 'tools', tags: ['windows', 'linux', 'sistema operativo'] },
      { id: 'powerapps', title: 'Power Apps', desc: 'Apps empresariales low-code con Microsoft 365.', icon: ICON.powerapps, color: 'var(--clr-powerapps)', category: 'office', tags: ['power apps', 'microsoft', 'low-code'] },
      { id: 'sharepoint', title: 'SharePoint', desc: 'Colaboraci?n en documentos e intranet de equipo.', icon: ICON.sharepoint, color: 'var(--clr-sharepoint)', category: 'office', tags: ['sharepoint', 'microsoft'] },
      { id: 'outlook', title: 'Outlook', desc: 'Correo, calendario y tareas profesionales.', icon: ICON.outlook, color: 'var(--clr-outlook)', category: 'office', tags: ['outlook', 'correo', 'microsoft'] },
      { id: 'onedrive', title: 'OneDrive', desc: 'Almacena, sincroniza y comparte en la nube.', icon: ICON.onedrive, color: 'var(--clr-onedrive)', category: 'office', tags: ['onedrive', 'nube'] },
      { id: 'scrum', title: 'Scrum', desc: 'Framework ?gil con sprints y mejora continua.', icon: ICON.scrum, color: 'var(--clr-scrum)', category: 'tools', tags: ['scrum', 'agile', 'sprint'] },
      { id: 'scratch', title: 'Scratch', desc: 'Programaci?n visual por bloques para aprender l?gica.', icon: ICON.scratch, color: 'var(--clr-scratch)', category: 'programming', tags: ['scratch', 'programaci?n', 'educaci?n'] },
      { id: 'video-editing', title: 'Edici?n de videos', desc: 'Monta y exporta videos para web y redes.', icon: ICON.video, color: 'var(--clr-video)', category: 'design', tags: ['video', 'edici?n', 'montaje'] },
      { id: 'django', title: 'Django', desc: 'Desarrollo web con Python y patr?n MVT.', icon: ICON.django, color: 'var(--clr-django)', category: 'programming', tags: ['django', 'python', 'web'] },
      { id: 'powerbi', title: 'Power BI', desc: 'Dashboards e informes interactivos de negocio.', icon: ICON.powerbi, color: 'var(--clr-powerbi)', category: 'data', tags: ['power bi', 'dax', 'datos'] },
      { id: 'prompt-engineering', title: 'Prompt Engineering', desc: 'Prompts efectivos para IA generativa.', icon: ICON.prompt, color: 'var(--clr-prompt)', category: 'tools', tags: ['prompt', 'ia', 'chatgpt'] },
      { id: 'engineering', title: 'Ingenier?a de software', desc: 'Requisitos, arquitectura, pruebas y entrega.', icon: ICON.engineering, color: 'var(--clr-engineering)', category: 'programming', tags: ['ingenier?a', 'software', 'devops'] },
      { id: 'game-editing', title: 'Edici\u00f3n de videojuegos', desc: 'Crea y edita juegos con motores, assets y builds.', icon: ICON.game, color: 'var(--clr-game-editing)', category: 'design', tags: ['videojuegos', 'unity', 'unreal', 'game dev', 'dise\u00f1o'] },
    ];
  }

  function getLessonVideos() {
    const out = {};
    Object.keys(VIDEOS).forEach((id) => { out[id] = _youtuVideos(id); });
    return out;
  }

  function getTutorialRaw() {
    const b = (r, rev, short, extra, topics) => ({
      rating: r, reviews: rev, quizzes: 5, aboutShort: short, aboutExtra: extra,
      videos: topics.slice(0, 5), topics, timeline: ['B?sico', 'Intermedio', 'Avanzado', 'Experto'],
    });
    return {
      flowchart: b('4.6', 142, 'Diagramas de flujo documentan procesos con s?mbolos est?ndar.', 'Usados en negocio y TI para alinear equipos.', ['S?mbolos', 'AS-IS', 'Decisiones', 'TO-BE', 'Mantenimiento']),
      os: b('4.7', 198, 'El SO gestiona hardware, archivos y aplicaciones.', 'Mejora productividad y seguridad.', ['Archivos', 'Permisos', 'Procesos', 'Red', 'Atajos']),
      powerapps: b('4.5', 156, 'Power Apps crea apps empresariales low-code.', 'Integrado con Microsoft 365.', ['Studio', 'F?rmulas', 'Conectores', 'Automate', 'Deploy']),
      sharepoint: b('4.6', 178, 'SharePoint colabora en documentos y listas.', 'Plataforma de contenido M365.', ['Sitios', 'Coautor?a', 'Permisos', 'P?ginas', 'Integraci?n']),
      outlook: b('4.5', 203, 'Outlook unifica correo y calendario.', 'Productividad profesional.', ['Correo', 'Reglas', 'Calendario', 'Tareas', 'Seguridad']),
      onedrive: b('4.6', 189, 'OneDrive sincroniza archivos en la nube.', 'Compartir con control.', ['Sync', 'Enlaces', 'Coedici?n', 'Versiones', 'IT']),
      scrum: b('4.7', 224, 'Scrum entrega valor en sprints.', 'Framework ?gil.', ['Roles', 'Stories', 'Tablero', 'DoD', 'Retro']),
      scratch: b('4.8', 312, 'Scratch ense?a programaci?n visual.', 'Ideal para educaci?n.', ['Sprites', 'Eventos', 'Variables', 'Juegos', 'Comunidad']),
      'video-editing': b('4.6', 167, 'Edici?n de video: narrativa y ritmo.', 'Web y redes sociales.', ['Timeline', 'Audio', 'T?tulos', 'Export', 'Flujo']),
      django: b('4.7', 245, 'Django acelera web con Python.', 'ORM y admin incluidos.', ['MVT', 'Modelos', 'Vistas', 'Forms', 'API']),
      powerbi: b('4.8', 276, 'Power BI para decisiones con datos.', 'DAX y dashboards.', ['Query', 'Modelo', 'DAX', 'Visuales', 'Service']),
      'prompt-engineering': b('4.7', 198, 'Prompt engineering optimiza IA.', 'T?cnicas reproducibles.', ['Anatom?a', 'Razonamiento', 'Productividad', 'C?digo', 'Evaluaci?n']),
      engineering: b('4.8', 289, 'Ingenier?a de software sistematiza el desarrollo.', 'De requisitos a operaci?n.', ['Requisitos', 'Arquitectura', 'Tests', 'DevOps', 'Deuda']),
      'game-editing': b('4.7', 231, 'La edici\u00f3n de videojuegos une dise\u00f1o, l\u00f3gica y publicaci\u00f3n.', 'Motores como Unity o Unreal facilitan prototipos jugables.', ['Editor', 'Assets', 'F\u00edsica', 'UI', 'Build']),
    };
  }

  function getExamQuestions() {
    const exams = {};
    getCatalogEntries().forEach(c => { exams[c.id] = CourseFactory.buildExamQuestions(c.title); });
    return exams;
  }

  return { getCourses, getCatalogEntries, getLessonVideos, getTutorialRaw, getExamQuestions };
})();

if (typeof module !== 'undefined') module.exports = ExtendedCourses;
