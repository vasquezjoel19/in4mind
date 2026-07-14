/**
 * IN4MIND — DashboardController
 * Orquesta el renderizado dinámico del dashboard:
 * sidebar, topbar, carruseles de cursos y sección reciente.
 */

'use strict';

const DashboardController = (() => {

  // ── Estado ──
  let _currentNav   = 'home';
  let _searchTimeout = null;
  const _expanded = { featured: false, learning: false, recent: false };
  const _PREVIEW_LIMIT = { recent: 3 };

  function _t(key, params, fallback = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  /** Reparte el catálogo entre los dos carruseles horizontales. */
  function _splitCoursesForCarousels(all) {
    const mid = Math.ceil(all.length / 2);
    return {
      featured: all.slice(0, mid),
      learning: all.slice(mid),
    };
  }

  // ── Refs DOM ──
  let $sidebarNav, $sidebarFooter, $welcomeTitle;
  let $summaryGrid, $quickActionsGrid, $resumeGrid, $recommendedTrack;
  let $learningPathsGrid, $analyticsPanel;
  let $featuredTrack, $learningTrack, $recentTrack, $promoSlot;
  let $searchInput;
  let $sidebar, $overlay;

  // ────────────────────────────────────────────
  // Helpers de render
  // ────────────────────────────────────────────

  /**
   * Genera el SVG de ícono de navegación según id.
   * @param {string} iconId
   * @returns {string} SVG HTML
   */
  function _navIcon(iconId) {
    const ICONS = {
      home:      '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      book:      '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
      quiz:      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      bot:       '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>',
      settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
      user:      '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      more:      '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconId] || ''}</svg>`;
  }

  /**
   * Construye el HTML de un nav-item del sidebar.
   * @param {{ id: string, label: string, icon: string }} item
   * @param {boolean} isActive
   * @returns {string}
   */
  function _renderNavItem(item, isActive = false) {
    const href = item.href || '';
    const inner = `${_navIcon(item.icon)}<span>${item.label}</span>`;
    if (!href) {
      return `
        <li class="nav-item ${isActive ? 'nav-item--active' : ''}"
            data-nav="${item.id}" data-label="${item.label}" role="button" tabindex="0">
          ${inner}
        </li>`;
    }
    return `
      <li role="none">
        <a class="nav-item ${isActive ? 'nav-item--active' : ''}"
           href="${href}" data-nav="${item.id}" data-label="${item.label}">
          ${inner}
        </a>
      </li>`;
  }

  /**
   * Construye el HTML de una tarjeta de curso.
   * @param {import('../services/DataService').Course} course
   * @param {number} delay - índice para animación escalonada
   * @returns {string}
   */
  function _renderCourseCard(course, delay = 0, options = {}) {
    const extraClass = options.variant ? ` course-card--${options.variant}` : '';
    const badgeHtml = options.badge
      ? `<span class="course-card__badge">${options.badge}</span>`
      : '';
    const metaHtml = options.meta
      ? `<p class="course-card__meta">${options.meta}</p>`
      : '';
    return `
      <article class="course-card${extraClass} anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-course="${course.id}" role="button" tabindex="0"
               aria-label="${_t('dashboard.courseAria', { course: course.title }, `Ver curso de ${course.title}`)}">
        <div class="course-card__header">
          <div class="course-card__icon-wrap">
            <img src="${course.icon}" alt="${course.title}" loading="lazy" width="24" height="24">
          </div>
          <div class="course-card__title-wrap">
            ${badgeHtml}
            <h3 class="course-card__title">${course.title}</h3>
          </div>
        </div>
        <p class="course-card__desc">${course.desc}</p>
        ${metaHtml}
        <div class="course-card__footer">
          <button class="btn--course" data-course="${course.id}">${_t('nav.tutorials', null, 'Cursos')}</button>
        </div>
      </article>`;
  }

  /**
   * Construye el HTML de una tarjeta "recién visto".
   * @param {import('../services/DataService').RecentItem} item
   * @param {number} delay
   * @returns {string}
   */
  function _renderRecentCard(item, delay = 0) {
    return `
      <article class="recent-card anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-recent="${item.id}" data-course="${item.courseId || ''}"
               role="button" tabindex="0"
               aria-label="${typeof I18n !== 'undefined' ? I18n.t('dashboard.continueItemAria', { title: item.title }) : `Continuar ${item.title}`}">
        <p class="recent-card__title">${item.title}</p>
        <p class="recent-card__sub">${item.subtitle}</p>
        <div class="recent-card__footer">
          <button type="button" class="recent-card__cta" data-course="${item.courseId || ''}">${typeof I18n !== 'undefined' ? I18n.t('common.seeMore') : 'Ver Más'}</button>
          <span class="recent-card__time">${item.timeLabel}</span>
        </div>
      </article>`;
  }

  function _uiIcon(iconId) {
    const ICONS = {
      bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>',
      heart: '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>',
      check: '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      trophy: '<path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/>',
      play: '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>',
      quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      bot: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>',
      user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      spark: '<path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2z"/><path d="M19 14l.9 2.6L22.5 18l-2.6.9L19 21.5l-.9-2.6L15.5 18l2.6-.9L19 14z"/><path d="M5 14l.9 2.6L8.5 18l-2.6.9L5 21.5l-.9-2.6L1.5 18l2.6-.9L5 14z"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    };
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[iconId] || ICONS.spark}</svg>`;
  }

  function _courseById(courseId, courses = []) {
    return (courses.length ? courses : DataService.getCourses()).find(course => course.id === courseId) || null;
  }

  function _categoryLabel(category) {
    const map = {
      web: _t('tutorial.catWeb', null, 'Web'),
      programming: _t('tutorial.catProgramming', null, 'Programación'),
      design: _t('tutorial.catDesign', null, 'Diseño'),
      office: _t('tutorial.catOffice', null, 'Office'),
      data: _t('tutorial.catData', null, 'Datos'),
      security: _t('tutorial.catSecurity', null, 'Ciberseguridad'),
      tools: _t('tutorial.catTools', null, 'Herramientas'),
    };
    return map[category] || category;
  }

  /** Segmento del día para personalizar acciones rápidas. */
  function _getTimeSegment() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 23) return 'evening';
    return 'night';
  }

  /** Peso por recencia: visitas recientes valen más, con decaimiento suave. */
  function _recencyWeight(visitedAt, listIndex = 0) {
    const ageMs = Math.max(0, Date.now() - (visitedAt || 0));
    const dayDecay = Math.exp(-ageMs / (5 * 24 * 60 * 60 * 1000));
    const positionBoost = Math.max(0, 6 - listIndex) * 0.35;
    return dayDecay + positionBoost;
  }

  /**
   * Mapa de afinidad por curso: mezcla visitas, favoritos, guardados y quizzes.
   * @returns {Map<string, { score: number, lastVisit: number, quizPct: number|null, sources: Set<string> }>}
   */
  function _buildUserAffinity(visits, favorites, saved, quizProgress) {
    const affinity = new Map();

    const bump = (courseId, amount, source, extra = {}) => {
      if (!courseId) return;
      const entry = affinity.get(courseId) || {
        score: 0,
        lastVisit: 0,
        quizPct: null,
        sources: new Set(),
      };
      entry.score += amount;
      if (extra.lastVisit) entry.lastVisit = Math.max(entry.lastVisit, extra.lastVisit);
      if (extra.quizPct != null) entry.quizPct = Math.max(entry.quizPct ?? 0, extra.quizPct);
      entry.sources.add(source);
      affinity.set(courseId, entry);
    };

    (visits || []).forEach((visit, index) => {
      if (visit.type !== 'course' || !visit.refId) return;
      bump(visit.refId, 2.5 * _recencyWeight(visit.visitedAt, index), 'recent', {
        lastVisit: visit.visitedAt || 0,
      });
    });

    (favorites || []).forEach((item, index) => {
      if (item.type !== 'course' || !item.refId) return;
      bump(item.refId, 5 - Math.min(index, 3) * 0.4, 'favorites');
    });

    (saved || []).forEach((item, index) => {
      if (item.type !== 'course' || !item.refId) return;
      bump(item.refId, 4 - Math.min(index, 3) * 0.35, 'saved');
    });

    Object.entries(quizProgress || {}).forEach(([courseId, quiz]) => {
      const pct = quiz?.bestPct ?? quiz?.pct ?? 0;
      const attempts = quiz?.attempts || 1;
      bump(courseId, 1.5 + (pct / 25) + Math.min(attempts, 4) * 0.25, 'quiz', {
        quizPct: pct,
        lastVisit: quiz?.completedAt || 0,
      });
    });

    return affinity;
  }

  function _getTopUsedCourse(affinity, courses) {
    let best = null;
    affinity.forEach((data, courseId) => {
      const course = _courseById(courseId, courses);
      if (!course) return;
      if (!best || data.score > best.data.score) {
        best = { course, data };
      }
    });
    return best;
  }

  /** Etiqueta de franja horaria para indicadores en acciones rápidas. */
  function _segmentHintLabel(segment) {
    const map = {
      morning: _t('dashboard.hintMorning', null, 'Por la mañana'),
      afternoon: _t('dashboard.hintAfternoon', null, 'Por la tarde'),
      evening: _t('dashboard.hintEvening', null, 'Por la noche'),
      night: _t('dashboard.hintNight', null, 'De madrugada'),
    };
    return map[segment] || map.afternoon;
  }

  function _courseHintLabel(courseTitle) {
    return _t('dashboard.hintBasedOnCourse', { course: courseTitle }, `Basado en ${courseTitle}`);
  }

  function _withActionHint(action, hint, hintKind = 'default') {
    if (!hint) return action;
    return { ...action, hint, hintKind };
  }

  function _pickWithCategoryDiversity(scored, limit = 6, maxPerCategory = 2) {
    const picked = [];
    const categoryCount = new Map();

    scored.forEach((item) => {
      if (picked.length >= limit) return;
      const cat = item.course.category;
      const count = categoryCount.get(cat) || 0;
      if (count >= maxPerCategory) return;
      picked.push(item);
      categoryCount.set(cat, count + 1);
    });

    if (picked.length < limit) {
      scored.forEach((item) => {
        if (picked.length >= limit) return;
        if (picked.some(p => p.course.id === item.course.id)) return;
        picked.push(item);
      });
    }

    return picked;
  }

  function _summaryItems(stats) {
    return [
      { tone: 'saved', label: _t('dashboard.summarySaved', null, 'Guardados'), value: stats.saved ?? 0, icon: 'bookmark' },
      { tone: 'favorites', label: _t('dashboard.summaryFavorites', null, 'Favoritos'), value: stats.favorites ?? 0, icon: 'heart' },
      { tone: 'quizzes', label: _t('dashboard.summaryQuizzes', null, 'Quizzes'), value: stats.quizzes ?? 0, icon: 'check' },
      { tone: 'certs', label: _t('dashboard.summaryCerts', null, 'Certificaciones'), value: stats.certifications ?? 0, icon: 'trophy' },
    ];
  }

  function _renderSummary(stats) {
    if (!$summaryGrid) return;
    $summaryGrid.innerHTML = _summaryItems(stats).map((item, i) => `
      <article class="summary-card summary-card--${item.tone} anim-fade-up delay-${Math.min(i + 1, 6)}" role="listitem">
        <div class="summary-card__icon">${_uiIcon(item.icon)}</div>
        <div class="summary-card__value">${item.value}</div>
        <div class="summary-card__label">${item.label}</div>
      </article>
    `).join('');
  }

  function _renderQuickActionCard(action, delay = 0) {
    const hintHtml = action.hint
      ? `<span class="quick-action-card__hint quick-action-card__hint--${action.hintKind || 'default'}">${action.hint}</span>`
      : '';
    return `
      <article class="quick-action-card quick-action-card--${action.tone || 'default'} anim-fade-up delay-${Math.min(delay + 1, 6)}"
               ${action.courseId ? `data-course="${action.courseId}"` : ''}
               ${action.route ? `data-route="${action.route}"` : ''}
               role="button" tabindex="0"
               aria-label="${_t('dashboard.openActionAria', { title: action.title }, `Abrir ${action.title}`)}">
        <div class="quick-action-card__icon">${_uiIcon(action.icon)}</div>
        <div class="quick-action-card__body">
          ${hintHtml}
          <h3 class="quick-action-card__title">${action.title}</h3>
          <p class="quick-action-card__sub">${action.sub}</p>
        </div>
        <span class="quick-action-card__arrow">${_uiIcon('arrow')}</span>
      </article>`;
  }

  function _renderResumeCard(item, delay = 0) {
    const meta = [];
    if (item.lessonsCompleted) {
      meta.push(_t('dashboard.resumeLessons', { n: item.lessonsCompleted }, `${item.lessonsCompleted} lecciones`));
    }
    if (item.quizPct != null) {
      meta.push(_t('dashboard.resumeQuizScore', { pct: item.quizPct }, `Quiz ${item.quizPct}%`));
    }
    return `
      <article class="resume-card anim-fade-up delay-${Math.min(delay + 1, 6)}"
               data-course="${item.courseId}" role="button" tabindex="0"
               aria-label="${_t('dashboard.continueItemAria', { title: item.title }, `Continuar ${item.title}`)}">
        <div class="resume-card__top">
          <div class="resume-card__course">
            <div class="resume-card__icon-wrap">
              <img src="${item.icon}" alt="${item.title}" loading="lazy" width="26" height="26">
            </div>
            <div class="resume-card__copy">
              <span class="resume-card__eyebrow">${item.lastLessonTitle
                ? _t('dashboard.resumeLastLesson', { title: item.lastLessonTitle }, `Última lección: ${item.lastLessonTitle}`)
                : _t('dashboard.resumeRecentVisit', null, 'Actividad reciente')}</span>
              <h3 class="resume-card__title">${item.title}</h3>
            </div>
          </div>
          <span class="resume-card__percent">${item.progressPct}%</span>
        </div>
        <p class="resume-card__desc">${meta.join(' · ') || _t('dashboard.resumeNoProgress', null, 'Empieza tu primer módulo y registra tu avance.')}</p>
        <div class="resume-card__bar" aria-hidden="true">
          <span style="width:${item.progressPct}%"></span>
        </div>
        <div class="resume-card__footer">
          <span class="resume-card__time">${item.visitedLabel}</span>
          <span class="resume-card__cta">${_t('dashboard.resumeCta', null, 'Continuar')}</span>
        </div>
      </article>`;
  }

  function _renderPromoCard(promo) {
    return `
      <article class="dashboard-promo dashboard-promo--${promo.tone || 'ai'}"
               ${promo.courseId ? `data-course="${promo.courseId}"` : ''}
               ${promo.route ? `data-route="${promo.route}"` : ''}
               role="button" tabindex="0"
               aria-label="${promo.title}">
        <div class="dashboard-promo__icon">${_uiIcon(promo.icon || 'spark')}</div>
        <div class="dashboard-promo__body">
          <span class="dashboard-promo__eyebrow" id="dashboard-promo-title">${promo.eyebrow}</span>
          <h2 class="dashboard-promo__title">${promo.title}</h2>
          <p class="dashboard-promo__sub">${promo.sub}</p>
        </div>
        <span class="dashboard-promo__cta">${promo.cta}</span>
      </article>`;
  }

  function _bindCourseTrack(track) {
    track.querySelectorAll('.course-card, .btn--course').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.course
          || e.currentTarget.closest('[data-course]')?.dataset.course;
        if (id) _handleCourseClick(id);
      });
    });
  }

  function _bindRecentTrack() {
    $recentTrack.querySelectorAll('.recent-card, .recent-card__cta').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.course
          || e.currentTarget.closest('[data-course]')?.dataset.course;
        if (id) _handleCourseClick(id);
      });
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const id = el.dataset.course || el.closest('[data-course]')?.dataset.course;
          if (id) _handleCourseClick(id);
        }
      });
    });
  }

  function _bindActionCards(root, selector) {
    root?.querySelectorAll(selector).forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const route = e.currentTarget.dataset.route;
        const courseId = e.currentTarget.dataset.course;
        if (courseId) {
          _handleCourseClick(courseId);
          return;
        }
        if (route) window.location.href = route;
      });
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          const route = el.dataset.route;
          const courseId = el.dataset.course;
          if (courseId) {
            _handleCourseClick(courseId);
            return;
          }
          if (route) window.location.href = route;
        }
      });
    });
  }

  function _buildQuickActions(stats, resumeItems, context = {}) {
    const { affinity, topCourse, quizProgress } = context;
    const segment = _getTimeSegment();
    const primaryResume = resumeItems[0];
    const focusCourse = primaryResume
      ? { id: primaryResume.courseId, title: primaryResume.title, progressPct: primaryResume.progressPct }
      : topCourse
        ? { id: topCourse.course.id, title: topCourse.course.title, progressPct: topCourse.data.quizPct }
        : null;

    const focusQuiz = focusCourse ? quizProgress?.[focusCourse.id] : null;
    const focusQuizPct = focusQuiz?.bestPct ?? focusQuiz?.pct ?? focusCourse?.progressPct ?? 0;

    const primaryAction = focusCourse
      ? {
          tone: 'continue',
          icon: 'play',
          title: segment === 'morning'
            ? _t('dashboard.quickMorning', null, 'Sesión de enfoque')
            : _t('dashboard.quickContinue', null, 'Continuar ahora'),
          sub: segment === 'morning'
            ? _t('dashboard.quickMorningSub', { course: focusCourse.title }, `Empieza el día retomando ${focusCourse.title}.`)
            : focusCourse.title,
          courseId: focusCourse.id,
        }
      : {
          tone: 'continue',
          icon: 'play',
          title: _t('dashboard.quickExplore', null, 'Explorar cursos'),
          sub: _t('dashboard.quickExploreSub', null, 'Empieza una nueva ruta de aprendizaje.'),
          route: 'tutorial.html',
        };

    let secondaryAction;
    if (focusCourse && focusQuizPct >= 70 && (stats.certifications || 0) === 0) {
      secondaryAction = {
        tone: 'quiz',
        icon: 'trophy',
        title: _t('dashboard.quickCertPush', null, 'Preparar certificación'),
        sub: _t('dashboard.quickCertPushSub', { course: focusCourse.title }, `Estás cerca en ${focusCourse.title}.`),
        route: 'quizzes.html',
      };
    } else if (focusCourse && focusQuizPct >= 40 && focusQuizPct < 70) {
      secondaryAction = {
        tone: 'quiz',
        icon: 'quiz',
        title: _t('dashboard.quickQuizRetake', null, 'Mejorar quiz'),
        sub: _t('dashboard.quickQuizRetakeSub', { course: focusCourse.title, pct: focusQuizPct }, `Sigue practicando en ${focusCourse.title} (${focusQuizPct}%).`),
        route: 'quizzes.html',
      };
    } else if (segment === 'evening' || segment === 'night') {
      secondaryAction = {
        tone: 'ai',
        icon: 'bot',
        title: _t('dashboard.quickEveningAi', null, 'Resolver dudas'),
        sub: _t('dashboard.quickEveningAiSub', null, 'Ideal para repasar lo aprendido hoy.'),
        route: 'ai.html',
      };
    } else {
      secondaryAction = {
        tone: 'quiz',
        icon: 'quiz',
        title: _t('dashboard.quickQuizzes', null, 'Ir a quizzes'),
        sub: _t('dashboard.quickQuizzesSub', null, 'Evalúa lo aprendido y desbloquea certificados.'),
        route: 'quizzes.html',
      };
    }

    const tertiaryAction = (segment === 'afternoon' && focusCourse)
      ? {
          tone: 'ai',
          icon: 'bot',
          title: _t('dashboard.quickAi', null, 'Abrir asistente IA'),
          sub: _t('dashboard.quickAiSub', null, 'Resuelve dudas sobre cursos, quizzes y plataforma.'),
          route: 'ai.html',
        }
      : (segment === 'morning' && !focusCourse)
        ? {
            tone: 'ai',
            icon: 'spark',
            title: _t('dashboard.quickExplore', null, 'Explorar cursos'),
            sub: _t('dashboard.quickExploreSub', null, 'Empieza una nueva ruta de aprendizaje.'),
            route: 'tutorial.html',
          }
        : {
            tone: 'ai',
            icon: 'bot',
            title: _t('dashboard.quickAi', null, 'Abrir asistente IA'),
            sub: _t('dashboard.quickAiSub', null, 'Resuelve dudas sobre cursos, quizzes y plataforma.'),
            route: 'ai.html',
          };

    let fourthAction;
    if (stats.saved > 0 && (segment === 'night' || segment === 'evening')) {
      fourthAction = {
        tone: 'saved',
        icon: 'bookmark',
        title: _t('dashboard.quickSaved', null, 'Mis guardados'),
        sub: _t('dashboard.quickSavedSub', { n: stats.saved }, `${stats.saved} recursos listos para retomar.`),
        route: 'profile.html',
      };
    } else if (topCourse && (!focusCourse || topCourse.course.id !== focusCourse.id)) {
      fourthAction = {
        tone: 'profile',
        icon: 'clock',
        title: _t('dashboard.quickTopCourse', null, 'Tu curso principal'),
        sub: _t('dashboard.quickTopCourseSub', { course: topCourse.course.title }, `Retoma ${topCourse.course.title}, tu ruta más activa.`),
        courseId: topCourse.course.id,
      };
    } else if (stats.saved > 0) {
      fourthAction = {
        tone: 'saved',
        icon: 'bookmark',
        title: _t('dashboard.quickSaved', null, 'Mis guardados'),
        sub: _t('dashboard.quickSavedSub', { n: stats.saved }, `${stats.saved} recursos listos para retomar.`),
        route: 'profile.html',
      };
    } else {
      fourthAction = {
        tone: 'profile',
        icon: 'user',
        title: _t('dashboard.quickProfile', null, 'Ir a mi perfil'),
        sub: _t('dashboard.quickProfileSub', null, 'Gestiona progreso, favoritos y certificaciones.'),
        route: 'profile.html',
      };
    }

    return [
      _withActionHint(
        primaryAction,
        focusCourse ? _courseHintLabel(focusCourse.title) : _segmentHintLabel(segment),
        focusCourse ? 'course' : 'time',
      ),
      _withActionHint(
        secondaryAction,
        focusCourse && focusQuizPct >= 40
          ? _t('dashboard.hintProgress', { pct: focusQuizPct }, `Progreso ${focusQuizPct}%`)
          : (segment === 'evening' || segment === 'night')
            ? _segmentHintLabel(segment)
            : _segmentHintLabel(segment === 'morning' ? 'morning' : 'afternoon'),
        focusCourse && focusQuizPct >= 40 ? 'progress' : 'time',
      ),
      _withActionHint(
        tertiaryAction,
        (segment === 'afternoon' && focusCourse)
          ? _courseHintLabel(focusCourse.title)
          : _segmentHintLabel(segment),
        (segment === 'afternoon' && focusCourse) ? 'course' : 'time',
      ),
      _withActionHint(
        fourthAction,
        topCourse && fourthAction.courseId === topCourse.course.id
          ? _courseHintLabel(topCourse.course.title)
          : stats.saved > 0 && fourthAction.tone === 'saved'
            ? _t('dashboard.hintSavedCount', { n: stats.saved }, `${stats.saved} guardados`)
            : _segmentHintLabel(segment),
        topCourse && fourthAction.courseId === topCourse.course.id
          ? 'course'
          : stats.saved > 0 && fourthAction.tone === 'saved'
            ? 'saved'
            : 'time',
      ),
    ];
  }

  async function _buildResumeItems(courses, visits, quizProgress) {
    const recentCourseVisits = visits.filter(v => v.type === 'course' && v.refId);
    const courseIds = [];

    recentCourseVisits.forEach(visit => {
      if (!courseIds.includes(visit.refId)) courseIds.push(visit.refId);
    });
    Object.keys(quizProgress || {}).forEach(courseId => {
      if (!courseIds.includes(courseId)) courseIds.push(courseId);
    });

    const scopedIds = courseIds.slice(0, 4);
    const cards = await Promise.all(scopedIds.map(async (courseId) => {
      const course = _courseById(courseId, courses);
      if (!course) return null;

      const syncLessonMap = UserProfileService.getLessonProgressSync(courseId);
      const asyncLessonMap = await UserProfileService.getLessonProgress(courseId);
      const lessonMap = Object.keys(asyncLessonMap || {}).length ? asyncLessonMap : syncLessonMap;
      const lessonEntries = Object.values(lessonMap).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
      const lastLesson = lessonEntries[0] || null;
      const quiz = quizProgress?.[courseId] || null;
      const visit = recentCourseVisits.find(v => v.refId === courseId) || null;
      const lessonAvg = lessonEntries.length
        ? Math.round(lessonEntries.reduce((sum, lesson) => sum + (lesson.pct || 0), 0) / lessonEntries.length)
        : 0;
      const progressPct = Math.max(lessonAvg, quiz?.bestPct || quiz?.pct || 0);

      return {
        courseId,
        title: course.title,
        icon: course.icon,
        progressPct: progressPct || 8,
        lessonsCompleted: lessonEntries.length,
        lastLessonTitle: lastLesson?.title || null,
        quizPct: quiz?.bestPct ?? quiz?.pct ?? null,
        visitedLabel: UserProfileService.formatVisitDate(
          visit?.visitedAt || lastLesson?.completedAt || quiz?.completedAt || Date.now()
        ),
      };
    }));

    return cards.filter(Boolean);
  }

  function _buildRecommendedCourses(courses, visits, favorites, saved, context = {}) {
    const { affinity, topCourse, quizProgress } = context;
    const engagedIds = new Set((affinity || new Map()).keys());

    const favCourses = courses.filter(course => (favorites || []).some(item => item.type === 'course' && item.refId === course.id));
    const savedCourses = courses.filter(course => (saved || []).some(item => item.type === 'course' && item.refId === course.id));
    const recentCourses = courses.filter(course => (visits || []).some(item => item.type === 'course' && item.refId === course.id));

    const sourceMeta = {
      favorites: {
        categories: new Set(favCourses.map(course => course.category)),
        tags: new Set(favCourses.flatMap(course => course.tags || [])),
        weight: 6,
        badge: _t('dashboard.reasonFavorites', null, 'Por tus favoritos'),
      },
      saved: {
        categories: new Set(savedCourses.map(course => course.category)),
        tags: new Set(savedCourses.flatMap(course => course.tags || [])),
        weight: 5,
        badge: _t('dashboard.reasonSaved', null, 'Porque lo guardas'),
      },
      recent: {
        categories: new Set(recentCourses.map(course => course.category)),
        tags: new Set(recentCourses.flatMap(course => course.tags || [])),
        weight: 4,
        badge: _t('dashboard.reasonRecent', null, 'Relacionado con lo reciente'),
      },
    };

    const topCategory = topCourse?.course?.category;
    const topTags = new Set(topCourse?.course?.tags || []);

    const scored = courses
      .filter(course => !engagedIds.has(course.id))
      .map((course) => {
        let score = 0;
        let badge = '';
        let dominantSource = '';

        Object.entries(sourceMeta).forEach(([source, meta]) => {
          let localScore = 0;
          if (meta.categories.has(course.category)) localScore += meta.weight;
          const sharedTags = (course.tags || []).filter(tag => meta.tags.has(tag)).length;
          if (sharedTags) localScore += sharedTags * (meta.weight / 2);
          if (localScore > 0) {
            score += localScore;
            if (!badge || localScore > (dominantSource ? sourceMeta[dominantSource].weight : 0)) {
              badge = meta.badge;
              dominantSource = source;
            }
          }
        });

        if (topCategory && course.category === topCategory) {
          score += 3.5;
          if (!badge) {
            badge = _t('dashboard.reasonCategoryFocus', null, 'Similar a lo que estudias');
          }
        }

        const topTagOverlap = (course.tags || []).filter(tag => topTags.has(tag)).length;
        if (topTagOverlap) {
          score += topTagOverlap * 1.75;
          if (!badge) {
            badge = topCourse
              ? _t('dashboard.reasonTopCourse', { course: topCourse.course.title }, `Complementa ${topCourse.course.title}`)
              : _t('dashboard.reasonTagMatch', null, 'Relacionado con tus intereses');
          }
        }

        if (topCourse && course.category === topCourse.course.category && course.id !== topCourse.course.id) {
          score += 1.25;
        }

        const relatedQuiz = quizProgress?.[course.id];
        if (relatedQuiz && (relatedQuiz.bestPct ?? relatedQuiz.pct ?? 0) < 70) {
          score -= 0.5;
        }

        const noveltyBoost = engagedIds.size < 3 ? 0.4 : 0;
        score += noveltyBoost;

        return {
          course,
          score,
          badge: badge || _t('dashboard.reasonDiscover', null, 'Para descubrir'),
          meta: _t('dashboard.recommendedMeta', { category: _categoryLabel(course.category) }, _categoryLabel(course.category)),
        };
      })
      .sort((a, b) => b.score - a.score || a.course.title.localeCompare(b.course.title));

    const picked = _pickWithCategoryDiversity(scored, 6, 2);
    if (picked.length >= 4) return picked;

    const filler = courses
      .filter(course => !picked.some(item => item.course.id === course.id) && !engagedIds.has(course.id))
      .slice(0, 6 - picked.length)
      .map(course => ({
        course,
        score: 0,
        badge: _t('dashboard.reasonNewInCategory', { category: _categoryLabel(course.category) }, `Nuevo en ${_categoryLabel(course.category)}`),
        meta: _t('dashboard.recommendedMeta', { category: _categoryLabel(course.category) }, _categoryLabel(course.category)),
      }));

    return [...picked, ...filler];
  }

  function _selectPromo(stats, resumeItems, recommendations) {
    const firstResume = resumeItems[0];
    if (firstResume && firstResume.quizPct != null && firstResume.quizPct >= 70 && (stats.certifications || 0) === 0) {
      return {
        tone: 'progress',
        icon: 'trophy',
        eyebrow: _t('dashboard.promoProgressEyebrow', null, 'Siguiente paso'),
        title: _t('dashboard.promoProgressTitle', null, 'Convierte tu avance en una certificación'),
        sub: _t('dashboard.promoProgressSub', { course: firstResume.title }, `Ya tienes progreso en ${firstResume.title}. Da el siguiente paso con sus quizzes y examen final.`),
        cta: _t('dashboard.promoProgressCta', null, 'Ir a quizzes'),
        route: 'quizzes.html',
      };
    }

    if ((stats.saved || 0) > 0) {
      return {
        tone: 'saved',
        icon: 'bookmark',
        eyebrow: _t('dashboard.promoSavedEyebrow', null, 'Biblioteca personal'),
        title: _t('dashboard.promoSavedTitle', null, 'Retoma tus recursos guardados'),
        sub: _t('dashboard.promoSavedSub', { n: stats.saved }, `Tienes ${stats.saved} elementos listos para continuar cuando quieras.`),
        cta: _t('dashboard.promoSavedCta', null, 'Abrir perfil'),
        route: 'profile.html',
      };
    }

    if (recommendations[0]?.course) {
      return {
        tone: 'discover',
        icon: 'spark',
        eyebrow: _t('dashboard.promoDiscoverEyebrow', null, 'Recomendación destacada'),
        title: _t('dashboard.promoDiscoverTitle', { course: recommendations[0].course.title }, `Prueba ${recommendations[0].course.title}`),
        sub: _t('dashboard.promoDiscoverSub', null, 'Una sugerencia basada en tus intereses actuales para mantener el ritmo de aprendizaje.'),
        cta: _t('dashboard.promoDiscoverCta', null, 'Abrir curso'),
        courseId: recommendations[0].course.id,
      };
    }

    return {
      tone: 'ai',
      icon: 'bot',
      eyebrow: _t('dashboard.promoAiEyebrow', null, 'Asistencia inteligente'),
      title: _t('dashboard.promoAiTitle', null, 'Consulta al asistente educativo de IN4MIND'),
      sub: _t('dashboard.promoAiSub', null, 'Pide ayuda sobre cursos, quizzes, certificaciones o cómo seguir una ruta de aprendizaje.'),
      cta: _t('dashboard.promoAiCta', null, 'Abrir IA'),
      route: 'ai.html',
    };
  }

  function _updateExpandLabels() {
    const labels = {
      featured: { on: typeof I18n !== 'undefined' ? I18n.t('common.seeLess') : 'Ver menos', off: typeof I18n !== 'undefined' ? I18n.t('common.seeAll') : 'Ver todos' },
      learning: { on: typeof I18n !== 'undefined' ? I18n.t('common.seeLess') : 'Ver menos', off: typeof I18n !== 'undefined' ? I18n.t('common.seeAll') : 'Ver todos' },
      recent:   { on: typeof I18n !== 'undefined' ? I18n.t('common.seeLess') : 'Ver menos', off: typeof I18n !== 'undefined' ? I18n.t('common.seeMore') : 'Ver más'   },
    };
    Object.keys(labels).forEach(key => {
      const btn = document.querySelector(`[data-expand="${key}"]`);
      if (!btn) return;
      btn.innerHTML = `${_expanded[key] ? labels[key].on : labels[key].off} &rsaquo;`;
      btn.setAttribute('aria-expanded', String(_expanded[key]));
    });
  }

  function _toggleSection(section) {
    _expanded[section] = !_expanded[section];
    if (section === 'recent') {
      _renderRecent();
    } else {
      _renderCourses($searchInput?.value || '');
    }
    _updateExpandLabels();
  }

  // ────────────────────────────────────────────
  // Render de secciones
  // ────────────────────────────────────────────

  /** Renderiza los ítems de navegación del sidebar. */
  function _renderNav() {
    const main   = DataService.getNavItems();
    const footer = DataService.getNavFooter();

    $sidebarNav.innerHTML   = main.map((it, i) => _renderNavItem(it, it.id === _currentNav)).join('');
    $sidebarFooter.innerHTML = footer.map(it => _renderNavItem(it)).join('');
  }

  /**
   * Renderiza los carruseles de cursos.
   * @param {string} [query=''] - Texto de búsqueda para filtrar
   */
  function _renderCourses(query = '') {
    const all = DataService.getCourses(query);
    const { featured, learning } = _splitCoursesForCarousels(all);

    $featuredTrack.classList.toggle('carousel-track--expanded', _expanded.featured);
    $learningTrack.classList.toggle('carousel-track--expanded', _expanded.learning);

    $featuredTrack.innerHTML = featured.length
      ? featured.map((c, i) => _renderCourseCard(c, i)).join('')
      : `<p style="color:var(--clr-text-muted);font-size:.85rem">${typeof I18n !== 'undefined' ? I18n.t('common.noResults') : 'Sin resultados.'}</p>`;

    $learningTrack.innerHTML = learning.length
      ? learning.map((c, i) => _renderCourseCard(c, i)).join('')
      : `<p style="color:var(--clr-text-muted);font-size:.85rem">${typeof I18n !== 'undefined' ? I18n.t('dashboard.noCoursesSection') : 'Sin cursos en esta sección.'}</p>`;

    _bindCourseTrack($featuredTrack);
    _bindCourseTrack($learningTrack);
  }

  /** Renderiza la sección de recién vistos desde el perfil del usuario. */
  async function _renderRecent() {
    let visits = [];
    try {
      const result = UserProfileService.getRecentVisits(_expanded.recent ? 24 : _PREVIEW_LIMIT.recent);
      visits = result && typeof result.then === 'function' ? await result : (result || []);
    } catch {
      visits = [];
    }
    if (!Array.isArray(visits)) visits = [];

    const items = visits.map((v, i) => ({
      id: v.id || `v-${i}`,
      courseId: v.refId,
      title: v.title,
      subtitle: v.desc?.slice(0, 48) || 'Curso',
      timeLabel: UserProfileService.formatVisitDate(v.visitedAt),
    }));

    $recentTrack.classList.toggle('carousel-track--expanded', _expanded.recent);
    $recentTrack.innerHTML = items.length
      ? items.map((it, i) => _renderRecentCard(it, i)).join('')
      : `<p style="color:var(--clr-text-muted);font-size:.85rem">${typeof I18n !== 'undefined' ? I18n.t('dashboard.emptyRecent') : 'Sin actividad reciente. Explora cursos para ver tu historial.'}</p>`;

    _bindRecentTrack();
  }

  function _renderQuickActions(stats, resumeItems, context = {}) {
    if (!$quickActionsGrid) return;
    const actions = _buildQuickActions(stats, resumeItems, context);
    $quickActionsGrid.innerHTML = actions.map((action, i) => _renderQuickActionCard(action, i)).join('');
    _bindActionCards($quickActionsGrid, '.quick-action-card');
  }

  function _renderResume(resumeItems) {
    if (!$resumeGrid) return;
    if (!resumeItems.length) {
      $resumeGrid.innerHTML = `
        <article class="empty-state-panel">
          <div class="empty-state-panel__icon">${_uiIcon('clock')}</div>
          <div>
            <h3 class="empty-state-panel__title">${_t('dashboard.resumeEmptyTitle', null, 'Aún no hay progreso registrado')}</h3>
            <p class="empty-state-panel__desc">${_t('dashboard.resumeEmptyDesc', null, 'Explora un curso, completa una lección o responde un quiz para ver tu progreso aquí.')}</p>
          </div>
        </article>`;
      return;
    }
    $resumeGrid.innerHTML = resumeItems.map((item, i) => _renderResumeCard(item, i)).join('');
    _bindActionCards($resumeGrid, '.resume-card');
  }

  function _renderRecommendations(recommendations) {
    if (!$recommendedTrack) return;
    $recommendedTrack.innerHTML = recommendations.length
      ? recommendations.map((item, i) => _renderCourseCard(item.course, i, {
          variant: 'recommended',
          badge: item.badge,
          meta: item.meta,
        })).join('')
      : `<p style="color:var(--clr-text-muted);font-size:.85rem">${_t('common.noResults', null, 'Sin resultados.')}</p>`;

    _bindCourseTrack($recommendedTrack);
  }

  function _renderPromo(promo) {
    if (!$promoSlot) return;
    $promoSlot.innerHTML = _renderPromoCard(promo);
    _bindActionCards($promoSlot, '.dashboard-promo');
  }

  async function _pathProgress(courseIds, quizProgress) {
    let done = 0;
    for (const id of courseIds) {
      const quiz = quizProgress?.[id];
      if (quiz && (quiz.bestPct ?? quiz.pct ?? 0) >= 70) done += 1;
      else {
        const lessons = UserProfileService.getLessonProgressSync(id);
        if (Object.keys(lessons).length >= 2) done += 0.5;
      }
    }
    return Math.min(100, Math.round((done / Math.max(courseIds.length, 1)) * 100));
  }

  function _renderLearningPaths(quizProgress) {
    if (!$learningPathsGrid || typeof LearningPathsData === 'undefined') return;
    const courses = DataService.getCourses();
    $learningPathsGrid.innerHTML = LearningPathsData.getPaths().map((path, i) => `
      <article class="learning-path-card anim-fade-up delay-${Math.min(i + 1, 6)}"
        data-path-id="${path.id}" data-course="${path.courseIds[0] || ''}" role="button" tabindex="0">
        <h3 class="learning-path-card__title">${path.title}</h3>
        <p class="learning-path-card__desc">${path.desc}</p>
        <div class="learning-path-card__bar" data-path-bar="${path.id}"><span style="width:0%"></span></div>
        <p class="learning-path-card__meta" data-path-meta="${path.id}">${_t('paths.progress', null, 'Progreso de ruta')}</p>
      </article>`).join('');
    LearningPathsData.getPaths().forEach(async (path) => {
      const pct = await _pathProgress(path.courseIds, quizProgress);
      const bar = $learningPathsGrid.querySelector(`[data-path-bar="${path.id}"] span`);
      const meta = $learningPathsGrid.querySelector(`[data-path-meta="${path.id}"]`);
      if (bar) bar.style.width = `${pct}%`;
      if (meta) meta.textContent = _t('paths.progressPct', { pct }, `${pct}% completado`);
    });
    _bindActionCards($learningPathsGrid, '.learning-path-card');
  }

  function _renderAnalytics() {
    if (!$analyticsPanel || typeof GamificationService === 'undefined') return;
    const g = GamificationService.getSummary();
    const weeks = GamificationService.getActivityByWeek(6);
    const max = Math.max(...weeks.map(w => w.count), 1);
    $analyticsPanel.innerHTML = `
      <div class="analytics-panel">
        <div class="analytics-panel__stats">
          <div class="analytics-stat">
            <div class="analytics-stat__value" data-count="${g.streak}" data-suffix="">0</div>
            <div class="analytics-stat__label">${_t('analytics.streak', null, 'Racha (días)')}</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat__value" data-count="${g.weekly.lessons}" data-suffix="/${g.weekly.lessonGoal}">0/${g.weekly.lessonGoal}</div>
            <div class="analytics-stat__label">${_t('analytics.weeklyLessons', null, 'Lecciones esta semana')}</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat__value" data-count="${g.weekly.quizzes}" data-suffix="/${g.weekly.quizGoal}">0/${g.weekly.quizGoal}</div>
            <div class="analytics-stat__label">${_t('analytics.weeklyQuizzes', null, 'Quizzes esta semana')}</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat__value" data-count="${g.level}" data-suffix="">0</div>
            <div class="analytics-stat__label">${_t('analytics.level', null, 'Nivel')}</div>
          </div>
          <div class="analytics-stat">
            <div class="analytics-stat__value" data-count="${g.xp}" data-suffix="">0</div>
            <div class="analytics-stat__label">${_t('analytics.xp', null, 'XP')}</div>
          </div>
        </div>
        ${g.badges?.length ? `<div class="analytics-badges">${g.badges.map(b => `<span class="analytics-badge" title="${b.id}">${b.icon}</span>`).join('')}</div>` : ''}
        <div class="analytics-chart" role="img" aria-label="${_t('analytics.chartAria', null, 'Actividad semanal')}">
          ${weeks.map(w => `
            <div class="analytics-chart__bar-wrap">
              <div class="analytics-chart__bar" style="--bar-h:${Math.max(8, (w.count / max) * 100)}%"></div>
              <span class="analytics-chart__label">${w.label}</span>
            </div>`).join('')}
        </div>
      </div>`;
    _animateAnalyticsCounters($analyticsPanel);
  }

  function _animateAnalyticsCounters(root) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = root.querySelectorAll('[data-count]');
    els.forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      if (!Number.isFinite(target)) return;
      if (reduce) {
        el.textContent = Math.round(target) + suffix;
        return;
      }
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else {
          el.textContent = Math.round(target) + suffix;
          el.classList.add('is-counted');
        }
      }
      requestAnimationFrame(tick);
    });

    root.querySelectorAll('.analytics-chart__bar').forEach((bar, i) => {
      bar.style.height = '0%';
      requestAnimationFrame(() => {
        setTimeout(() => {
          bar.style.height = bar.style.getPropertyValue('--bar-h') || '8%';
        }, 80 + i * 60);
      });
    });
  }

  async function _refreshDashboardInsights() {
    if (!$summaryGrid) return;

    UserProfileService.hydrateCacheFromLocal();
    _renderSummary(UserProfileService.getStatsSync());

    const courses = DataService.getCourses();
    const [visits, quizProgress, favorites, saved, certifications] = await Promise.all([
      UserProfileService.getRecentVisits(24),
      UserProfileService.getQuizProgress(),
      UserProfileService.getFavorites(),
      UserProfileService.getSaved(),
      UserProfileService.getCertifications(),
    ]);

    const stats = {
      saved: saved.length,
      favorites: favorites.length,
      quizzes: Object.keys(quizProgress || {}).length,
      certifications: certifications.length,
    };
    const affinity = _buildUserAffinity(visits, favorites, saved, quizProgress);
    const topCourse = _getTopUsedCourse(affinity, courses);
    const insightContext = { visits, quizProgress, affinity, topCourse };
    const resumeItems = await _buildResumeItems(courses, visits, quizProgress);
    const recommendations = _buildRecommendedCourses(courses, visits, favorites, saved, insightContext);

    _renderSummary(stats);
    _renderQuickActions(stats, resumeItems, insightContext);
    _renderResume(resumeItems);
    _renderRecommendations(recommendations);
    _renderLearningPaths(quizProgress);
    _renderAnalytics();
    _renderPromo(_selectPromo(stats, resumeItems, recommendations));
  }

  // ────────────────────────────────────────────
  // Event handlers
  // ────────────────────────────────────────────

  /** Manejador de clic en ítem de navegación. */
  function _handleNavClick(e) {
    const navId = e.currentTarget.dataset.nav;
    if (!navId || navId === _currentNav) return;

    _currentNav = navId;
    _renderNav();
    _closeSidebar();

    // Secciones con página propia → redirigir
    const SECTION_ROUTES = {
      quizzes:   'quizzes.html',
      tutorials: 'tutorial.html',
      ai:        'ai.html',        // ← ruta a la página IA
    };

    if (SECTION_ROUTES[navId]) {
      window.location.href = SECTION_ROUTES[navId];
      return;
    }

    // Mostrar estado básico por sección (extensible)
    const SECTION_TITLES = {
      home:     '¡Bienvenido, User!',
      settings: 'Ajustes',
    };

    if ($welcomeTitle) {
      $welcomeTitle.textContent = SECTION_TITLES[navId] || 'IN4MIND';
    }
  }

  /**
   * Manejador de clic en tarjeta de curso.
   * @param {string} courseId
   */
  function _handleCourseClick(courseId) {
    if (courseId) {
      sessionStorage.setItem('in4mind_open_course', courseId);
      const course = DataService.getCourses().find(c => c.id === courseId);
      if (course) UserProfileService.recordVisit(UserProfileService.buildCourseItem(course));
    }
    const card = document.querySelector(`.course-card[data-course="${courseId}"]`);
    if (card) {
      card.style.transform = 'scale(0.97)';
      setTimeout(() => {
        card.style.transform = '';
        window.location.href = 'tutorial.html';
      }, 150);
    } else {
      window.location.href = 'tutorial.html';
    }
  }

  /** Cierra el sidebar en móvil. */
  function _closeSidebar() {
    SidebarController.closeMobile();
  }

  /** Abre el sidebar en móvil. */
  function _openSidebar() {
    SidebarController.openMobile();
  }

  /** Maneja búsqueda con debounce de 300ms. */
  function _handleSearch() {
    clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
      _renderCourses($searchInput.value);
    }, 300);
  }

  /** Maneja el cierre de sesión. */
  function _handleLogout() {
    AppShell.logout();
  }

  function _relocalize() {
    if (!$featuredTrack) return;
    const userRaw = sessionStorage.getItem('in4mind_user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (user && $welcomeTitle) {
      const firstName = user.name.trim().split(/[\s.]+/)[0];
      const name = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      $welcomeTitle.textContent = typeof I18n !== 'undefined'
        ? I18n.t('dashboard.welcome', { name })
        : `¡Bienvenido, ${name}!`;
    }
    _renderCourses($searchInput?.value || '');
    void _renderRecent();
    void _refreshDashboardInsights();
    _updateExpandLabels();
  }

  // ────────────────────────────────────────────
  // Inicialización
  // ────────────────────────────────────────────

  /** Punto de entrada del dashboard. */
  function init() {
    const userRaw = sessionStorage.getItem('in4mind_user');
    const user    = userRaw ? JSON.parse(userRaw) : null;

    // En producción, descomentar para proteger la ruta:
    // if (!user) { window.location.href = 'login.html'; return; }

    // Cachear DOM
    $sidebarNav    = document.getElementById('sidebar-nav');
    $sidebarFooter = document.getElementById('sidebar-footer');
    $welcomeTitle  = document.getElementById('welcome-title');
    $summaryGrid   = document.getElementById('dashboard-summary-grid');
    $quickActionsGrid = document.getElementById('quick-actions-grid');
    $resumeGrid    = document.getElementById('resume-grid');
    $recommendedTrack = document.getElementById('recommended-track');
    $learningPathsGrid = document.getElementById('learning-paths-grid');
    $analyticsPanel = document.getElementById('analytics-panel');
    $featuredTrack = document.getElementById('featured-track');
    $learningTrack = document.getElementById('learning-track');
    $recentTrack   = document.getElementById('recent-track');
    $promoSlot     = document.getElementById('dashboard-promo-slot');
    $searchInput   = document.getElementById('search-input');
    $sidebar       = document.getElementById('sidebar');
    $overlay       = document.getElementById('sidebar-overlay');

    // Personalizar con nombre de usuario
    if (user && $welcomeTitle) {
      const firstName = user.name.trim().split(/[\s.]+/)[0];
      const name = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
      $welcomeTitle.textContent = typeof I18n !== 'undefined'
        ? I18n.t('dashboard.welcome', { name })
        : `¡Bienvenido, ${name}!`;
    }

    // Renderizar contenido
    AppShell.initPage('home');
    _renderCourses();
    void _renderRecent();
    void _refreshDashboardInsights();
    _updateExpandLabels();

    document.querySelectorAll('[data-expand]').forEach(btn => {
      btn.addEventListener('click', () => _toggleSection(btn.dataset.expand));
    });

    // Buscador
    $searchInput?.addEventListener('input', _handleSearch);
    $searchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape') { $searchInput.value = ''; _renderCourses(); }
    });

    window.addEventListener('in4mind-relocalize', _relocalize);
    window.addEventListener(UserProfileService.EVENT, () => {
      void _renderRecent();
      void _refreshDashboardInsights();
    });
    window.addEventListener('pageshow', () => {
      void _renderRecent();
      void _refreshDashboardInsights();
    });
  }

  return { init };

})();
