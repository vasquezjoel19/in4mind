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

  function search(query, limitPerGroup = 5) {
    const q = (query || '').trim();
    if (!q || q.length < 2) return { courses: [], lessons: [], quizzes: [], help: [], notes: [], projects: [] };

    return {
      courses:  _courseResults(q).slice(0, limitPerGroup),
      lessons:  _lessonResults(q).slice(0, limitPerGroup),
      quizzes:  _quizResults(q).slice(0, limitPerGroup),
      help:     _helpResults(q).slice(0, limitPerGroup),
      notes:    _notesResults(q),
      projects: _projectsResults(q),
    };
  }

  function flatten(results) {
    return [
      ...results.courses,
      ...results.lessons,
      ...results.quizzes,
      ...results.help,
      ...(results.notes || []),
      ...(results.projects || []),
    ];
  }

  function groupLabel(type) {
    const map = {
      course:  _t('search.groupCourses', null, 'Cursos'),
      lesson:  _t('search.groupLessons', null, 'Lecciones'),
      quiz:    _t('search.groupQuizzes', null, 'Quizzes'),
      help:    _t('search.groupHelp', null, 'Ayuda'),
      note:    _t('nav.notes', null, 'Notas'),
      project: _t('nav.projects', null, 'Proyectos'),
    };
    return map[type] || type;
  }

  return { search, flatten, groupLabel };

})();

if (typeof module !== 'undefined') module.exports = GlobalSearchService;
