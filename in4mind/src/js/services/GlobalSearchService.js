'use strict';

const GlobalSearchService = (() => {

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  function _match(text, q) {
    return _norm(text).includes(_norm(q));
  }

  /**
   * Acciones de la paleta: ir a un sitio o lanzar algo, sin buscar nada.
   *
   * Se devuelven aunque la consulta esté vacía —una paleta que no enseña nada
   * hasta escribir dos letras obliga a saber de antemano qué hay dentro— y se
   * filtran por texto en cuanto se escribe.
   */
  function _commandResults(q) {
    const base = [
      {
        clave: 'sandbox',
        title: _t('palette.sandbox', null, 'Practicar en el sandbox de código'),
        subtitle: _t('palette.sandboxSub', null, 'Editor aislado con ejecución en vivo'),
        route: 'tutorial.html?course=javascript',
      },
      {
        clave: 'certificados',
        title: _t('palette.certs', null, 'Mis certificados'),
        subtitle: _t('palette.certsSub', null, 'Los que ya has obtenido'),
        route: 'profile.html',
      },
      {
        clave: 'verificar',
        title: _t('palette.verify', null, 'Verificar un certificado'),
        subtitle: _t('palette.verifySub', null, 'Comprobar la autenticidad de un código'),
        route: 'verify.html',
      },
      {
        clave: 'panel dashboard inicio',
        title: _t('nav.dashboard', null, 'Panel'),
        subtitle: _t('palette.goTo', null, 'Ir a'),
        route: 'dashboard.html',
      },
      {
        clave: 'notas',
        title: _t('nav.notes', null, 'Notas'),
        subtitle: _t('palette.goTo', null, 'Ir a'),
        route: 'notes.html',
      },
      {
        clave: 'quizzes examenes',
        title: _t('nav.quizzes', null, 'Quizzes'),
        subtitle: _t('palette.goTo', null, 'Ir a'),
        route: 'quizzes.html',
      },
    ];

    const texto = (q || '').trim();
    const out = base
      .filter(c => !texto || _match(`${c.title} ${c.subtitle} ${c.clave}`, texto))
      .map(c => ({ type: 'command', id: `cmd-${c.clave}`, title: c.title, subtitle: c.subtitle, route: c.route }));

    /* Preguntar a Infy encabeza la lista en cuanto hay algo escrito: si lo que
       buscas no está en la plataforma, preguntarlo es la salida natural. */
    if (texto.length >= 2) {
      out.unshift({
        type: 'command',
        id: 'cmd-infy',
        title: _t('palette.askInfy', { q: texto }, `Preguntar a Infy: «${texto}»`),
        subtitle: _t('palette.askInfySub', null, 'Abre el chat con la pregunta escrita'),
        route: `ai.html?q=${encodeURIComponent(texto)}`,
      });
    }
    return out;
  }

  function _lessonResults(q) {
    const out = [];
    if (typeof CourseCurriculum === 'undefined') return out;
    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    courses.forEach(course => {
      const lessons = CourseCurriculum.getLessons?.(course.id) || [];
      lessons.forEach(lesson => {
        const hay = [lesson.title, lesson.description, lesson.section, ...(lesson.steps || [])].join(' ');
        if (_match(hay, q)) {
          out.push({
            type: 'lesson',
            id: `${course.id}-${lesson.id}`,
            title: lesson.title,
            subtitle: course.title,
            courseId: course.id,
            lessonId: lesson.id,
            route: 'tutorial.html',
          });
        }
      });
    });
    return out;
  }

  function _courseResults(q) {
    if (typeof DataService === 'undefined') return [];
    return DataService.getCourses(q).map(course => ({
      type: 'course',
      id: course.id,
      title: course.title,
      subtitle: course.desc,
      courseId: course.id,
      route: 'tutorial.html',
    }));
  }

  function _quizResults(q) {
    const out = [];
    if (typeof CourseCurriculum === 'undefined') return out;
    const quizzes = CourseCurriculum.getAllQuizzes?.() || [];
    quizzes.forEach(quiz => {
      const sections = quiz.sections || [];
      sections.forEach((mod, i) => {
        const hay = [mod.title, quiz.title].join(' ');
        if (_match(hay, q)) {
          out.push({
            type: 'quiz',
            id: `quiz-${quiz.id}-${i}`,
            title: mod.title || _t('search.quizModule', { course: quiz.title }, `Quiz de ${quiz.title}`),
            subtitle: quiz.title,
            courseId: quiz.id,
            quizId: quiz.id,
            route: 'quizzes.html',
          });
        }
      });
      if (!sections.length && _match(quiz.title + ' ' + (quiz.desc || ''), q)) {
        out.push({
          type: 'quiz',
          id: `quiz-${quiz.id}`,
          title: quiz.title,
          subtitle: _t('search.groupQuizzes', null, 'Quizzes'),
          courseId: quiz.id,
          quizId: quiz.id,
          route: 'quizzes.html',
        });
      }
    });
    return out;
  }

  function _helpResults(q) {
    if (typeof HelpData === 'undefined') return [];
    return HelpData.searchFaq(q).map(item => ({
      type: 'help',
      id: item.id,
      title: item.question,
      subtitle: _t('search.helpArticle', null, 'Centro de ayuda'),
      route: 'help.html',
      hash: `#faq-${item.id}`,
    }));
  }

  function _notesResults(q) {
    if (typeof NotesService === 'undefined') return [];
    return NotesService.search(q).slice(0, 5).map(note => ({
      type: 'note',
      id: note.id,
      title: note.title,
      subtitle: _t('nav.notes', null, 'Notas'),
      route: 'notes.html',
      noteId: note.id,
    }));
  }

  function _projectsResults(q) {
    if (typeof ProjectsService === 'undefined') return [];
    return ProjectsService.search(q).slice(0, 5).map(proj => ({
      type: 'project',
      id: proj.id,
      title: proj.title,
      subtitle: _t('nav.projects', null, 'Proyectos'),
      route: 'projects.html',
      projectId: proj.id,
    }));
  }

  function _guidedResults(q) {
    if (typeof GuidedProjectsData === 'undefined') return [];
    return GuidedProjectsData.getAll()
      .filter(p => _match([p.title, p.summary, p.quizId, p.difficulty].join(' '), q))
      .slice(0, 5)
      .map(p => ({
        type: 'guided',
        id: p.id,
        title: p.title,
        subtitle: _t('nav.guided', null, 'Guiados'),
        route: `guided-projects.html?project=${encodeURIComponent(p.id)}`,
        projectId: p.id,
      }));
  }

  function search(query, limitPerGroup = 5) {
    const q = (query || '').trim();
    /* Los comandos sí salen con la consulta vacía: son el menú de la paleta.
       El resto sigue pidiendo dos letras, que es lo que evita volcar el
       catálogo entero al abrir. */
    if (!q || q.length < 2) {
      return {
        commands: _commandResults(q),
        courses: [], lessons: [], quizzes: [], help: [], notes: [], projects: [], guided: [],
      };
    }

    return {
      commands: _commandResults(q),
      courses:  _courseResults(q).slice(0, limitPerGroup),
      lessons:  _lessonResults(q).slice(0, limitPerGroup),
      quizzes:  _quizResults(q).slice(0, limitPerGroup),
      help:     _helpResults(q).slice(0, limitPerGroup),
      notes:    _notesResults(q),
      projects: _projectsResults(q),
      guided:   _guidedResults(q),
    };
  }

  function flatten(results) {
    return [
      ...(results.commands || []),
      ...results.courses,
      ...results.lessons,
      ...results.quizzes,
      ...results.help,
      ...(results.notes || []),
      ...(results.projects || []),
      ...(results.guided || []),
    ];
  }

  function groupLabel(type) {
    const map = {
      command: _t('palette.groupActions', null, 'Acciones'),
      course:  _t('search.groupCourses', null, 'Cursos'),
      lesson:  _t('search.groupLessons', null, 'Lecciones'),
      quiz:    _t('search.groupQuizzes', null, 'Quizzes'),
      help:    _t('search.groupHelp', null, 'Ayuda'),
      note:    _t('nav.notes', null, 'Notas'),
      project: _t('nav.projects', null, 'Proyectos'),
      guided:  _t('nav.guided', null, 'Guiados'),
    };
    return map[type] || type;
  }

  return { search, flatten, groupLabel };

})();

if (typeof module !== 'undefined') module.exports = GlobalSearchService;
