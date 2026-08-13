/**
 * IN4MIND — CourseCard
 * Tarjeta de curso con banner dinámico (landing + dashboard).
 */
'use strict';

const CourseCard = (() => {

  const CATEGORY_FALLBACK = {
    programming: 'Programación',
    design: 'Diseño',
    web: 'Desarrollo',
    office: 'Ofimática',
    data: 'Datos',
    tools: 'Herramientas',
    security: 'Seguridad',
  };

  const CATEGORY_I18N = {
    programming: 'tutorial.catProgramming',
    design: 'tutorial.catDesign',
    web: 'tutorial.catWeb',
    office: 'tutorial.catOffice',
    data: 'tutorial.catData',
    tools: 'tutorial.catTools',
    security: 'tutorial.catSecurity',
  };

  function _t(key, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  function _escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _hash(id) {
    let h = 0;
    const s = String(id || '');
    for (let i = 0; i < s.length; i += 1) h = ((h << 5) - h) + s.charCodeAt(i);
    return Math.abs(h);
  }

  function bannerUrl(course) {
    if (course?.banner) return course.banner;
    // Fondo tech compartido; el arte específico del curso va en --course-art (icono).
    return 'src/img/banners/circuit-bg.svg';
  }

  function artUrl(course) {
    return course?.bannerArt || course?.icon || '';
  }

  function categoryLabel(course) {
    const cat = course?.category || 'tools';
    if (typeof TutorialData !== 'undefined' && TutorialData.getCategoryLabel) {
      const label = TutorialData.getCategoryLabel(cat);
      if (label) return label;
    }
    const key = CATEGORY_I18N[cat];
    if (key) return _t(key, CATEGORY_FALLBACK[cat] || cat);
    return CATEGORY_FALLBACK[cat] || cat;
  }

  function statsFor(course) {
    const id = course?.id;
    let lessons = course?.lessonsCount;
    let modules = course?.modulesCount;
    let questions = course?.questionsCount;
    let rating = course?.rating;

    if (typeof TutorialData !== 'undefined' && TutorialData.getCourseData) {
      const d = TutorialData.getCourseData(id);
      if (d) {
        if (lessons == null) lessons = d.tutorials || d.topics?.length;
        if (modules == null) modules = typeof d.quizzes === 'number' ? d.quizzes : d.quizzes?.length;
        if (questions == null) questions = d.quizQuestions || (modules ? modules * 4 : null);
        if (rating == null) rating = d.rating;
      }
    }

    const h = _hash(id);
    if (lessons == null) lessons = 3 + (h % 6);
    if (modules == null) modules = 2 + (h % 4);
    if (questions == null) questions = modules * (3 + (h % 3));
    if (rating == null) rating = (4.4 + ((h % 6) * 0.1)).toFixed(1);

    return {
      lessons: Number(lessons) || 0,
      modules: Number(modules) || 0,
      questions: Number(questions) || 0,
      rating: String(rating),
    };
  }

  function decorate(course) {
    if (!course) return course;
    const stats = statsFor(course);
    return {
      ...course,
      banner: bannerUrl(course),
      bannerArt: artUrl(course),
      categoryLabel: categoryLabel(course),
      lessonsCount: stats.lessons,
      modulesCount: stats.modules,
      questionsCount: stats.questions,
      rating: stats.rating,
    };
  }

  function render(course, options = {}) {
    const c = decorate(course);
    const tag = options.tag === 'article' ? 'article' : 'a';
    const href = options.href || 'login.html';
    const accent = c.color || 'var(--clr-brand-500)';
    const banner = _escape(c.banner);
    const art = _escape(c.bannerArt || c.icon || '');
    const lessonsLabel = _t('courseCard.lessons', '{n} lecciones').replace('{n}', String(c.lessonsCount));
    const modulesLabel = _t('courseCard.modulesQuestions', '{m} módulos • {q} preguntas')
      .replace('{m}', String(c.modulesCount))
      .replace('{q}', String(c.questionsCount));
    const verLabel = _t('courseCard.view', 'Ver');
    const extra = options.extraClass ? ` ${options.extraClass}` : '';
    const aria = options.ariaLabel
      ? ` aria-label="${_escape(options.ariaLabel)}"`
      : '';
    const openAttrs = tag === 'a'
      ? ` href="${_escape(href)}" data-open-course="${_escape(c.id)}"`
      : ` role="button" tabindex="0"`;

    return `
      <${tag} class="course-banner-card${extra}"
         data-course="${_escape(c.id)}"
         ${openAttrs}${aria}
         style="--course-accent:${accent};--course-banner:url('${banner}');--course-art:url('${art}')">
        <span class="course-banner-card__bg" aria-hidden="true"></span>
        <span class="course-banner-card__overlay" aria-hidden="true"></span>
        <span class="course-banner-card__art" aria-hidden="true"></span>
        <span class="course-banner-card__body">
          <span class="course-banner-card__header">
            <span class="course-banner-card__icon">
              <img src="${_escape(c.icon)}" alt="" width="28" height="28" loading="lazy">
            </span>
            <span class="course-banner-card__titles">
              <span class="course-banner-card__title">${_escape(c.title)}</span>
              <span class="course-banner-card__category">${_escape(c.categoryLabel)}</span>
            </span>
          </span>
          <span class="course-banner-card__desc">${_escape(c.desc)}</span>
          <span class="course-banner-card__badges">
            <span class="course-banner-card__badge">${_escape(lessonsLabel)}</span>
            <span class="course-banner-card__badge">${_escape(modulesLabel)}</span>
          </span>
          <span class="course-banner-card__footer">
            <span class="course-banner-card__rating">
              <span class="course-banner-card__star" aria-hidden="true">★</span>
              ${_escape(c.rating)}
            </span>
            <span class="course-banner-card__cta">${_escape(verLabel)}</span>
          </span>
        </span>
      </${tag}>`;
  }

  return { bannerUrl, artUrl, decorate, statsFor, categoryLabel, render };
})();

if (typeof module !== 'undefined') module.exports = CourseCard;
