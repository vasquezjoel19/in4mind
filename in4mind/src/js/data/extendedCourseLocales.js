'use strict';

const ExtendedCourseLocales = (() => {
  const IDS = [
    'flowchart', 'os', 'powerapps', 'sharepoint', 'outlook', 'onedrive',
    'scrum', 'scratch', 'video-editing', 'django', 'powerbi',
    'prompt-engineering', 'engineering', 'game-editing',
  ];

  function _locale() {
    return typeof I18n !== 'undefined' ? I18n.getLocale() : 'es';
  }

  function _sectionLabel(i, locale) {
    if (locale === 'zh') return `\u6a21\u5757 ${i + 1}`;
    if (locale === 'en') return `Module ${i + 1}`;
    return `M\u00f3dulo ${i + 1}`;
  }

  function _tip(mod, title, locale) {
    const topic = mod.title.toLowerCase();
    if (locale === 'zh') return `\u7528\u771f\u5b9e\u6848\u4f8b\u7ec3\u4e60\u300c${mod.title}\u300d\u3002`;
    if (locale === 'en') return `Practice ${topic} with a real case from your environment.`;
    return `Practica ${topic} con un caso real de tu entorno.`;
  }

  function buildOverlay(courseId, course, locale) {
    if (!locale || locale === 'es') return null;
    const data = EXTENDED_COURSE_LOCALE_DATA[locale]?.[courseId];
    if (!data) return null;

    const overlay = {
      title: data.title,
      requirements: data.requirements,
      docs: data.docs,
      certModules: data.modules.map(m => m.title),
      lessons: {},
      quizSections: [],
      examSections: [],
    };

    course.lessons.forEach((lesson, i) => {
      const mod = data.modules[i];
      if (!mod) return;
      overlay.lessons[lesson.id] = {
        title: mod.title,
        section: _sectionLabel(i, locale),
        description: mod.description,
        requirements: data.requirements.slice(0, 2),
        steps: mod.steps,
        tip: _tip(mod, data.title, locale),
        resources: { docs: data.docs.label },
      };
      overlay.quizSections.push(
        CourseFactory.buildQuizBlock({ title: mod.title }, data.title, locale),
      );
    });

    overlay.examSections = CourseFactory.buildExamSections(data.title, data.title, locale);
    return overlay;
  }

  function getTutorialMeta(courseId, locale) {
    const loc = locale || _locale();
    if (!loc || loc === 'es') return null;
    const data = EXTENDED_COURSE_LOCALE_DATA[loc]?.[courseId];
    if (!data?.tutorial) return null;
    return data.tutorial;
  }

  function isExtendedId(id) {
    return IDS.includes(id);
  }

  return { buildOverlay, getTutorialMeta, isExtendedId, IDS };
})();

if (typeof module !== 'undefined') module.exports = ExtendedCourseLocales;
