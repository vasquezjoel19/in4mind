/**
 * IN4MIND — TutorialController
 * Listado, detalle de curso y lecciones interactivas.
 */

'use strict';

const TutorialController = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') return I18n.t(k, p);
    return fb ?? '';
  }

  function _levels() {
    return [
      _t('tutorial.levelBeginner', null, 'Principiante'),
      _t('tutorial.levelIntermediate', null, 'Intermedio'),
      _t('tutorial.levelAdvanced', null, 'Avanzado'),
    ];
  }

  function _defaultLevel() {
    return _t('tutorial.levelBeginner', null, 'Principiante');
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

  let _activeFilter = 'all';
  let _currentCourse = null;
  let _currentLessons = [];
  let _currentLessonIdx = 0;
  let _searchTimeout = null;
  let _lessonCheckAttempts = 0;
  let _lessonCheckSelected = -1;
  let _lessonCheckCallback = null;
  let _quizGateQuestions = [];
  let _quizGateIdx = 0;
  let _quizGateCorrect = 0;
  let _quizGateMode = false;
  const QUIZ_GATE_PASS_PCT = 70;

  let $listView, $detailView, $lessonView;
  let $filtersWrap, $tutGrid, $searchInput;

  const NAV_ICONS = {
    home:     '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    book:     '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
    quiz:     '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    bot:      '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
    user:     '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    more:     '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  };

  function _svgIcon(id) {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${NAV_ICONS[id] || ''}</svg>`;
  }

  function _navItem(item, active = false) {
    const href = item.href || '';
    const inner = `${_svgIcon(item.icon)}<span>${item.label}</span>`;
    if (!href) {
      return `<li class="nav-item ${active ? 'nav-item--active' : ''}"
                  data-nav="${item.id}" data-label="${item.label}" role="button" tabindex="0">
        ${inner}
      </li>`;
    }
    return `<li role="none">
      <a class="nav-item ${active ? 'nav-item--active' : ''}"
         href="${href}" data-nav="${item.id}" data-label="${item.label}">
        ${inner}
      </a>
    </li>`;
  }

  function _renderFilters() {
    $filtersWrap.innerHTML = _categories().map(cat => `
      <button type="button" class="tut-filter ${cat.id === _activeFilter ? 'tut-filter--active' : ''}"
              data-filter="${cat.id}">${cat.label}</button>
    `).join('');

    $filtersWrap.querySelectorAll('.tut-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeFilter = btn.dataset.filter;
        _renderFilters();
        _renderGrid();
      });
    });
  }

  function _curriculumMeta(courseId) {
    return typeof CourseCurriculum !== 'undefined'
      ? CourseCurriculum.getCertMeta(courseId)
      : null;
  }

  function _youtubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace(/^\//, '').split('/')[0] || null;
      }
      if (u.hostname.includes('youtube.com')) {
        return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || null;
      }
    } catch { /* ignore malformed URLs */ }
    const match = url.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return match ? match[1] : null;
  }

  function _embedYoutubeVideo(frameWrap, videoUrl, autoplay = false, meta = {}) {
    const videoId = _youtubeVideoId(videoUrl);
    if (!videoId || !frameWrap) return null;
    let iframe = frameWrap.querySelector('iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'lesson-w3__video-iframe';
      iframe.title = _t('tutorial.videoLessonTitle', null, 'Video de la lección');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      frameWrap.appendChild(iframe);
    }
    const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
    if (autoplay) params.set('autoplay', '1');
    if (typeof VideoProgressService !== 'undefined' && meta.courseId && meta.lessonId) {
      const pos = VideoProgressService.getPosition(meta.courseId, meta.lessonId, videoId);
      if (pos?.seconds > 0) params.set('start', String(pos.seconds));
    }
    iframe.src = `https://www.youtube.com/embed/${videoId}?${params}`;
    iframe.dataset.videoId = videoId;
    return iframe;
  }

  let _videoWatchTimer = null;
  let _videoWatchSeconds = 0;

  function _stopVideoWatch(meta = {}) {
    if (_videoWatchTimer) {
      clearInterval(_videoWatchTimer);
      _videoWatchTimer = null;
    }
    if (typeof VideoProgressService !== 'undefined' && meta.courseId && meta.lessonId && _videoWatchSeconds > 0) {
      const frame = document.getElementById('lesson-video-frame');
      const videoId = frame?.querySelector('iframe')?.dataset?.videoId;
      VideoProgressService.savePosition(meta.courseId, meta.lessonId, videoId, _videoWatchSeconds);
    }
    _videoWatchSeconds = 0;
  }

  function _startVideoWatch(meta = {}) {
    _stopVideoWatch(meta);
    _videoWatchTimer = setInterval(() => { _videoWatchSeconds += 1; }, 1000);
  }

  function _videoMeta() {
    const lesson = _currentLessons?.[_currentLessonIdx];
    return {
      courseId: _currentCourse?.id,
      lessonId: lesson?.id,
    };
  }

  function _openInlineVideo(videoUrl, autoplay = true) {
    const toggle = document.getElementById('lesson-video-toggle');
    const frameWrap = document.getElementById('lesson-video-frame');
    if (!frameWrap || !videoUrl) return;
    const meta = _videoMeta();
    _embedYoutubeVideo(frameWrap, videoUrl, autoplay, meta);
    frameWrap.hidden = false;
    _startVideoWatch(meta);
    if (toggle) {
      toggle.textContent = _t('tutorial.hideVideo', null, 'Ocultar video');
      toggle.setAttribute('aria-expanded', 'true');
    }
    document.getElementById('lesson-sec-video')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function _bindLessonVideoToggle(videoUrl) {
    const toggle = document.getElementById('lesson-video-toggle');
    const frameWrap = document.getElementById('lesson-video-frame');
    if (!toggle || !frameWrap || !videoUrl) return;

    const videoId = _youtubeVideoId(videoUrl);
    const meta = () => _videoMeta();
    toggle.addEventListener('click', () => {
      const isHidden = frameWrap.hidden;
      if (isHidden && videoId) {
        _embedYoutubeVideo(frameWrap, videoUrl, true, meta());
        frameWrap.hidden = false;
        _startVideoWatch(meta());
        toggle.textContent = _t('tutorial.hideVideo', null, 'Ocultar video');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        _stopVideoWatch(meta());
        frameWrap.hidden = true;
        toggle.textContent = _t('tutorial.showVideo', null, '▶ Ver video');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.getElementById('lesson-video-play-inline')?.addEventListener('click', (e) => {
      e.preventDefault();
      _openInlineVideo(videoUrl, true);
    });
  }

  function _renderGrid(query = '') {
    let courses = DataService.getCourses(query);
    if (_activeFilter !== 'all') {
      courses = courses.filter(c => c.category === _activeFilter);
    }

    $tutGrid.innerHTML = courses.length
      ? courses.map((c, i) => {
          const data = TutorialData.getCourseData(c.id);
          const meta = _curriculumMeta(c.id);
          const count = meta?.lessonCount ?? data?.tutorials ?? 5;
          const quizTag = meta
            ? _t('tutorial.tagQuizModules', { m: meta.quizModuleCount, q: meta.quizQuestionCount }, `${meta.quizModuleCount} módulos · ${meta.quizQuestionCount} preg.`)
            : _t('tutorial.quizCount', { n: data?.quizzes ?? 2 }, `${data?.quizzes ?? 2} quizzes`);
          const catLabel = TutorialData.getCategoryLabel(c.category);
          return `
          <article class="tut-grid-card anim-fade-up delay-${Math.min(i + 1, 6)}"
                   data-course-id="${c.id}" role="button" tabindex="0"
                   aria-label="${_t('tutorial.gridCardAria', { course: c.title }, `Ver curso de ${c.title}`)}">
            <div class="tut-grid-card__header">
              <div class="tut-grid-card__icon">
                <img src="${c.icon}" alt="${c.title}" loading="lazy" width="26" height="26">
              </div>
              <div>
                <h3 class="tut-grid-card__title">${c.title}</h3>
                <span class="tut-grid-card__category">${catLabel}</span>
              </div>
            </div>
            <p class="tut-grid-card__desc">${c.desc}</p>
            <div class="tut-grid-card__tags">
              <span class="tut-tag">${_t('tutorial.tagLessons', { n: count }, `${count} lecciones`)}</span>
              <span class="tut-tag tut-tag--quiz">${quizTag}</span>
            </div>
            <div class="tut-grid-card__footer">
              <span class="tut-grid-card__meta"><span class="tut-star" aria-hidden="true">★</span> ${data?.rating ?? '4.7'}</span>
              <button type="button" class="btn--course" data-course-id="${c.id}">${_t('common.view', null, 'Ver')}</button>
            </div>
          </article>`;
        }).join('')
      : `<p class="tut-empty">${_t('tutorial.emptyList', null, 'Sin resultados para este filtro.')}</p>`;

    $tutGrid.onclick = e => {
      const trigger = e.target.closest('[data-course-id]');
      if (!trigger) return;
      e.preventDefault();
      _showDetail(trigger.dataset.courseId);
    };
    $tutGrid.onkeydown = e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const trigger = e.target.closest('[data-course-id]');
      if (!trigger) return;
      e.preventDefault();
      _showDetail(trigger.dataset.courseId);
    };
  }

  function _groupLessons(lessons) {
    const groups = {};
    lessons.forEach((l, i) => {
      const key = l.section || 'General';
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...l, index: i });
    });
    return groups;
  }

  function _renderVideoCover(videoTitle, idx, course, lessonIdx, sectionLabel, videoUrl) {
    const thumbClass = `tut-thumb--${(idx % 4) + 1}`;
    const hasVideo = videoUrl?.startsWith('http');
    return `
      <article class="tut-video-card ${hasVideo ? 'tut-video-card--has-video' : ''}" data-lesson-idx="${lessonIdx}" tabindex="0" role="button"
               aria-label="${_t('tutorial.openSectionAria', { title: videoTitle }, `Abrir apartado ${videoTitle}`)}">
        <div class="tut-thumb ${thumbClass}">
          <img class="tut-thumb__logo" src="${course.icon}" alt="" width="36" height="36" loading="lazy">
          <span class="tut-badge">${_t('tutorial.sectionN', { n: idx + 1 }, `Apartado ${idx + 1}`)}</span>
          ${hasVideo ? `<span class="tut-badge tut-badge--video" aria-hidden="true">${_t('tutorial.videoBadge', null, '▶ Video')}</span>` : ''}
          <span class="tut-thumb__title">${videoTitle}</span>
          <span class="tut-thumb__sub">${sectionLabel}</span>
        </div>
        <p class="tut-card__label">${videoTitle}</p>
        ${hasVideo ? `<div class="tut-video-card__actions" onclick="event.stopPropagation()">
          <button type="button" class="tut-video-card__link" data-lesson-video="${lessonIdx}">${_t('tutorial.showVideo', null, '▶ Ver video')}</button>
          <span class="tut-video-actions__sep" aria-hidden="true">·</span>
          <a class="tut-video-card__yt" href="${videoUrl}" target="_blank" rel="noopener noreferrer">${_t('tutorial.openYoutube', null, 'Abrir en YouTube')}</a>
        </div>` : ''}
      </article>`;
  }

  function _firstLessonForSection(groups, sectionName, fallbackIdx) {
    const items = groups[sectionName];
    if (items?.length) return items[0].index;
    return fallbackIdx;
  }

  function _renderLessonCard(lesson, course, globalIdx) {
    const color = TutorialData.getLevelColor(lesson.level);
    const done = typeof UserProfileService !== 'undefined'
      && UserProfileService.getLessonProgressSync(course.id)[lesson.id];
    const quizModule = lesson.quizModule || lesson.section || `Módulo ${globalIdx + 1}`;
    const quizMeta = lesson.quizQuestionCount
      ? _t('tutorial.quizQuestionsCount', { n: lesson.quizQuestionCount }, `${lesson.quizQuestionCount} preguntas en quiz`)
      : _t('tutorial.evaluatedQuiz', null, 'Evaluado en quiz del módulo');
    const videoUrl = lesson.resources?.video;
    const hasVideo = videoUrl?.startsWith('http');
    return `
      <article class="tut-lesson-card ${done ? 'tut-lesson-card--done' : ''}" data-lesson-idx="${globalIdx}" tabindex="0" role="button"
               aria-label="Abrir lección ${lesson.title}">
        <div class="tut-lesson-card__thumb" style="--accent:${color}">
          <img class="tut-lesson-card__logo" src="${course.icon}" alt="" width="28" height="28" loading="lazy">
          <span class="tut-lesson-card__play" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </span>
          <span class="tut-lesson-card__num">${String(globalIdx + 1).padStart(2, '0')}</span>
        </div>
        <div class="tut-lesson-card__body">
          <span class="tut-lesson-card__level" style="color:${color}">${lesson.level}</span>
          <h3 class="tut-lesson-card__title">${lesson.title}</h3>
          <p class="tut-lesson-card__video">${_t('tutorial.quizModuleLine', { module: quizModule, meta: quizMeta }, `Quiz: ${quizModule} · ${quizMeta}`)}</p>
          ${hasVideo ? `<div class="tut-lesson-card__video-actions" onclick="event.stopPropagation()">
            <button type="button" class="tut-lesson-card__video-link" data-lesson-video="${globalIdx}">${_t('tutorial.showVideoOptional', null, '▶ Ver video (opcional)')}</button>
            <span class="tut-video-actions__sep" aria-hidden="true">·</span>
            <a class="tut-lesson-card__video-yt" href="${videoUrl}" target="_blank" rel="noopener noreferrer">${_t('tutorial.openYoutube', null, 'Abrir en YouTube')}</a>
          </div>` : ''}
          <div class="tut-lesson-card__meta">
            <span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${lesson.duration}
            </span>
            ${done ? `<span class="tut-lesson-card__done">${done.pct}% ✓</span>` : ''}
          </div>
        </div>
        <svg class="tut-lesson-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </article>`;
  }

  function _bindLessonCards() {
    document.querySelectorAll('.tut-lesson-card, .tut-topic-item[data-lesson-idx], .tut-video-card[data-lesson-idx]').forEach(el => {
      const idx = parseInt(el.dataset.lessonIdx, 10);
      const locked = !Number.isNaN(idx) && !canAccess(idx);
      el.classList.toggle('is-locked', locked);
      el.setAttribute('aria-disabled', locked ? 'true' : 'false');
      if (locked && !el.querySelector('.tut-lesson-lock')) {
        const lock = document.createElement('span');
        lock.className = 'tut-lesson-lock';
        lock.setAttribute('aria-hidden', 'true');
        lock.textContent = '🔒';
        el.appendChild(lock);
      }
      el.addEventListener('click', () => {
        if (!isNaN(idx)) _requestShowLesson(idx);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isNaN(idx)) _requestShowLesson(idx);
        }
      });
    });
    document.querySelectorAll('[data-lesson-video]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.lessonVideo, 10);
        if (!isNaN(idx)) _requestShowLesson(idx, { autoplayVideo: true });
      });
    });
  }

  function _goToCourseQuiz() {
    if (!_currentCourse) {
      window.location.href = 'quizzes.html';
      return;
    }

    const progress = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getLessonProgressSync(_currentCourse.id)
      : {};
    const completedIds = Object.keys(progress);
    const total = _currentLessons.length;
    const allComplete = total > 0 && completedIds.length >= total;

    if (allComplete) {
      _proceedToCourseQuiz();
      return;
    }

    if (typeof LessonCheckData === 'undefined') {
      _proceedToCourseQuiz();
      return;
    }

    const checks = LessonCheckData.getQuizGateChecks(_currentCourse.id, completedIds);
    if (!checks.length) {
      _proceedToCourseQuiz();
      return;
    }

    _startQuizGate(checks);
  }

  function _proceedToCourseQuiz() {
    sessionStorage.setItem('in4mind_open_quiz', _currentCourse.id);
    window.location.href = 'quizzes.html';
  }

  async function _goToCertExam() {
    if (!_currentCourse) return;
    if (typeof UserProfileService === 'undefined') return;
    if (!UserProfileService.getCurrentUser()) {
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(_t('tutorial.loginToSave', null, 'Inicia sesión para presentar el examen de certificación.'));
      }
      return;
    }
    const stats = await UserProfileService.getCertificationRequirements(_currentCourse.id, _currentLessons.length);
    if (!stats.examUnlocked) {
      const parts = [];
      if (!stats.lessonStats?.unlocked) {
        parts.push(`lecciones con promedio ≥${stats.lessonMinAvg}%`);
      }
      if (!stats.quizPassed) {
        parts.push(`quiz ≥${stats.quizMinPct}% (actual ${stats.quizPct}%)`);
      }
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(_t('tutorial.certUnlock', { parts: parts.join(' y ') }, `Completa: ${parts.join(' y ')} para desbloquear el examen.`));
      }
      return;
    }
    sessionStorage.setItem('in4mind_open_exam', _currentCourse.id);
    window.location.href = 'quizzes.html';
  }

  function _isLessonComplete(lessonId) {
    if (!_currentCourse || typeof UserProfileService === 'undefined') return false;
    return Boolean(UserProfileService.getLessonProgressSync(_currentCourse.id)[lessonId]);
  }

  /**
   * Acceso unificado: lección 0 siempre libre; el resto exige la anterior completada.
   * @param {number} index
   * @returns {boolean}
   */
  function canAccess(index) {
    if (!_currentLessons?.length) return false;
    const idx = Number(index);
    if (!Number.isInteger(idx) || idx < 0 || idx >= _currentLessons.length) return false;
    if (idx === 0) return true;
    const prev = _currentLessons[idx - 1];
    if (!prev) return false;

    /* Dos condiciones, no una: terminar de leer la lección anterior y además
       superar su micro-quiz. La segunda sólo se exige si esa lección llegó a
       tener preguntas; si no las tiene, no hay nada que superar y pedirlo
       dejaría el curso cortado para siempre en ese punto. */
    if (!_isLessonComplete(prev.id)) return false;
    if (!_currentCourse) return true;
    const tienePreguntas = _preguntasMicro(_currentCourse.id, idx - 1).length > 0;
    return !tienePreguntas || _microSuperado(_currentCourse.id, prev.id);
  }

  function _toastLessonLocked() {
    const msg = _t('tutorial.lessonLockedQuiz', null,
      'Completa el quiz de la lección anterior para desbloquear esta unidad.');

    /* Lo dice Infy, con el gesto de estar leyendo: un candado que sólo se
       queja es una pared; explicado por la mascota es una indicación. Si Infy
       no está en esta página, el aviso normal sigue sirviendo. */
    if (typeof Infy !== 'undefined' && Infy.showToast) {
      if (Infy.showToast(msg, 'LEARNING')) return;
    }
    if (typeof AppShell !== 'undefined') AppShell.showToast(msg);
  }

  /** Navega a una lección si canAccess; si no, toast y no cambia de vista. */
  function _requestShowLesson(idx, opts = {}) {
    const index = parseInt(idx, 10);
    if (Number.isNaN(index)) return false;
    if (!canAccess(index)) {
      _toastLessonLocked();
      return false;
    }
    _showLesson(index, opts);
    return true;
  }

  /** Índice accesible más cercano ≤ solicitado (deep links / preview). */
  function _clampAccessibleLesson(idx) {
    const target = Math.max(0, Math.min(idx, _currentLessons.length - 1));
    if (canAccess(target)) return target;
    for (let i = target - 1; i >= 0; i -= 1) {
      if (canAccess(i)) return i;
    }
    return 0;
  }

  /**
   * Abre o cierra el índice lateral de la lección en móvil.
   *
   * Centraliza lo que antes hacía un `classList.toggle` suelto: además de la
   * clase, sincroniza el fondo, el estado del botón y el bloqueo de scroll del
   * cuerpo — sin eso, al desplazar el índice se movía la lección de debajo.
   *
   * @param {boolean} open
   */
  function _setLessonSidebar(open) {
    const sidebar = document.getElementById('lesson-sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('lesson-w3__sidebar--open', open);
    document.getElementById('lesson-sidebar-overlay')?.classList.toggle('is-visible', open);
    document.getElementById('lesson-sidebar-toggle')?.setAttribute('aria-expanded', String(open));

    // Cerrar siempre libera el scroll; bloquearlo solo tiene sentido en móvil,
    // donde el panel flota sobre la lección. El asimétrico es deliberado: si el
    // cierre también dependiera de la media query, girar a escritorio con el
    // panel abierto dejaría el `overflow: hidden` puesto para siempre.
    if (!open) {
      document.body.style.overflow = '';
    } else if (window.matchMedia('(max-width: 700px)').matches) {
      document.body.style.overflow = 'hidden';
    }
  }

  function _hideLessonCheck() {
    const overlay = document.getElementById('lesson-check');
    if (overlay) overlay.hidden = true;
    _lessonCheckCallback = null;
    _lessonCheckSelected = -1;
    _lessonCheckAttempts = 0;
    _quizGateMode = false;
    _quizGateQuestions = [];
    _quizGateIdx = 0;
    _quizGateCorrect = 0;
    const $prog = document.getElementById('lesson-check-progress');
    if ($prog) $prog.hidden = true;
  }

  function _completeLessonProgress(scorePct) {
    if (!_currentCourse || typeof UserProfileService === 'undefined') return;
    const lesson = _currentLessons[_currentLessonIdx];
    if (!lesson) return;
    // Guarda localmente también sin sesión; no redirigir (congelaba "Siguiente").
    UserProfileService.saveLessonProgress(_currentCourse.id, lesson.id, scorePct, {
      title: lesson.title,
    }).catch(() => {});
    if (!UserProfileService.getCurrentUser() && typeof AppShell !== 'undefined') {
      AppShell.showToast(_t('tutorial.progressLocal', null, 'Progreso guardado en este dispositivo. Inicia sesión para sincronizarlo.'));
    }
    if (typeof GamificationService !== 'undefined') {
      GamificationService.recordActivity('lesson', { courseId: _currentCourse.id, lessonId: lesson.id });
    }

    /* Señal para el motor adaptativo (opcional y desactivado por defecto).
       Se emite como evento en vez de llamar al servicio para que este
       controlador no dependa de que exista: si el módulo no está cargado, o
       está apagado, no la escucha nadie y aquí no cambia nada. */
    window.dispatchEvent(new CustomEvent('in4mind-learning-signal', {
      detail: {
        source: 'lesson',
        courseId: _currentCourse.id,
        lessonId: lesson.id,
        title: lesson.title,
        courseTitle: _currentCourse.title,
        text: [lesson.description, ...(lesson.steps || [])].filter(Boolean).join(' ').slice(0, 900),
      },
    }));
  }

  function _showLessonCheck(onSuccess) {
    if (typeof LessonCheckData === 'undefined' || !_currentCourse) {
      onSuccess?.();
      return;
    }
    const lesson = _currentLessons[_currentLessonIdx];
    if (lesson && _isLessonComplete(lesson.id)) {
      onSuccess?.();
      return;
    }

    const check = LessonCheckData.getCheck(_currentCourse.id, _currentLessonIdx);
    if (!check) {
      _completeLessonProgress(100);
      onSuccess?.();
      return;
    }

    _lessonCheckAttempts = 0;
    _lessonCheckSelected = -1;
    _lessonCheckCallback = onSuccess;
    _quizGateMode = false;

    const overlay = document.getElementById('lesson-check');
    const $title = document.getElementById('lesson-check-title');
    const $sub = document.querySelector('.lesson-check__sub');
    const $prog = document.getElementById('lesson-check-progress');
    const $q = document.getElementById('lesson-check-question');
    const $opts = document.getElementById('lesson-check-options');
    const $feedback = document.getElementById('lesson-check-feedback');
    const $submit = document.getElementById('lesson-check-submit');

    if (!overlay || !$q || !$opts) {
      onSuccess?.();
      return;
    }

    if ($title) $title.textContent = _t('tutorial.quickCheck', null, 'Comprobación rápida');
    if ($sub) $sub.textContent = _t('tutorial.quickCheckSub', null, 'Responde para registrar tu avance en esta lección.');
    if ($prog) $prog.hidden = true;

    $q.textContent = check.q;
    $feedback.textContent = '';
    $submit.disabled = true;
    $submit.textContent = _t('common.confirm', null, 'Confirmar');

    $opts.innerHTML = check.opts.map((opt, i) => `
      <button type="button" class="lesson-check__option" data-idx="${i}">${opt}</button>
    `).join('');

    $opts.querySelectorAll('.lesson-check__option').forEach(btn => {
      btn.addEventListener('click', () => {
        _lessonCheckSelected = parseInt(btn.dataset.idx, 10);
        $opts.querySelectorAll('.lesson-check__option').forEach(b => b.classList.remove('lesson-check__option--selected'));
        btn.classList.add('lesson-check__option--selected');
        $submit.disabled = false;
      });
    });

    const bindSubmit = () => {
      $submit.onclick = () => {
        if (_lessonCheckSelected < 0) return;
        _lessonCheckAttempts += 1;
        const correct = _lessonCheckSelected === check.ans;

        $opts.querySelectorAll('.lesson-check__option').forEach((btn, i) => {
          btn.disabled = true;
          if (i === check.ans) btn.classList.add('lesson-check__option--ok');
          else if (i === _lessonCheckSelected && !correct) btn.classList.add('lesson-check__option--wrong');
        });

        if (correct) {
          const score = _lessonCheckAttempts === 1 ? 100 : 85;
          _completeLessonProgress(score);
          $feedback.textContent = `${check.exp} Puntuación registrada: ${score}%.`;
          $submit.textContent = _t('quizzes.continue', null, 'Continuar →');
          $submit.disabled = false;
          $submit.onclick = () => {
            _hideLessonCheck();
            _lessonCheckCallback?.();
          };
          return;
        }

        $feedback.textContent = `${check.exp} Inténtalo de nuevo.`;
        $submit.disabled = true;
        _lessonCheckSelected = -1;
        setTimeout(() => {
          $opts.querySelectorAll('.lesson-check__option').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('lesson-check__option--selected', 'lesson-check__option--wrong', 'lesson-check__option--ok');
          });
          $feedback.textContent = _t('tutorial.selectOther', null, 'Selecciona otra respuesta.');
          $submit.textContent = _t('common.confirm', null, 'Confirmar');
          bindSubmit();
        }, 900);
      };
    };

    bindSubmit();

    overlay.hidden = false;
  }

  function _startQuizGate(checks) {
    _quizGateMode = true;
    _quizGateQuestions = checks;
    _quizGateIdx = 0;
    _quizGateCorrect = 0;
    _lessonCheckSelected = -1;
    _showQuizGateQuestion();
  }

  function _showQuizGateQuestion() {
    const check = _quizGateQuestions[_quizGateIdx];
    if (!check) return;

    const overlay = document.getElementById('lesson-check');
    const $title = document.getElementById('lesson-check-title');
    const $sub = document.querySelector('.lesson-check__sub');
    const $prog = document.getElementById('lesson-check-progress');
    const $q = document.getElementById('lesson-check-question');
    const $opts = document.getElementById('lesson-check-options');
    const $feedback = document.getElementById('lesson-check-feedback');
    const $submit = document.getElementById('lesson-check-submit');

    if (!overlay || !$q || !$opts || !$submit) {
      _proceedToCourseQuiz();
      return;
    }

    if ($title) {
      $title.textContent = _t('tutorial.quizGateTitle', null, 'Comprueba lo aprendido');
    }
    if ($sub) {
      $sub.textContent = _t('tutorial.quizGateSub', null, 'Responde sobre el contenido del curso antes de ir al quiz.');
    }
    if ($prog) {
      $prog.hidden = false;
      $prog.textContent = _t('tutorial.quizGateProgress', {
        n: _quizGateIdx + 1,
        total: _quizGateQuestions.length,
      }, `Pregunta ${_quizGateIdx + 1} de ${_quizGateQuestions.length}`);
    }

    $q.textContent = check.q;
    $feedback.textContent = '';
    $submit.disabled = true;
    $submit.textContent = _t('common.confirm', null, 'Confirmar');

    $opts.innerHTML = check.opts.map((opt, i) => `
      <button type="button" class="lesson-check__option" data-idx="${i}">${opt}</button>
    `).join('');

    $opts.querySelectorAll('.lesson-check__option').forEach(btn => {
      btn.addEventListener('click', () => {
        _lessonCheckSelected = parseInt(btn.dataset.idx, 10);
        $opts.querySelectorAll('.lesson-check__option').forEach(b => b.classList.remove('lesson-check__option--selected'));
        btn.classList.add('lesson-check__option--selected');
        $submit.disabled = false;
      });
    });

    $submit.onclick = () => {
      if (_lessonCheckSelected < 0) return;
      const correct = _lessonCheckSelected === check.ans;

      $opts.querySelectorAll('.lesson-check__option').forEach((btn, i) => {
        btn.disabled = true;
        if (i === check.ans) btn.classList.add('lesson-check__option--ok');
        else if (i === _lessonCheckSelected && !correct) btn.classList.add('lesson-check__option--wrong');
      });

      if (correct) _quizGateCorrect += 1;

      $feedback.textContent = correct
        ? check.exp
        : `${check.exp} ${_t('tutorial.quizGateWrong', null, 'Revisa la lección e inténtalo de nuevo.')}`;

      const isLast = _quizGateIdx >= _quizGateQuestions.length - 1;

      if (!isLast) {
        $submit.textContent = _t('quizzes.next', null, 'Siguiente →');
        $submit.disabled = false;
        $submit.onclick = () => {
          _quizGateIdx += 1;
          _lessonCheckSelected = -1;
          _showQuizGateQuestion();
        };
        return;
      }

      const pct = Math.round((_quizGateCorrect / _quizGateQuestions.length) * 100);
      const passed = pct >= QUIZ_GATE_PASS_PCT;

      if (passed) {
        $feedback.textContent = _t('tutorial.quizGatePass', { pct }, `¡Bien! ${pct}% correcto. Puedes ir al quiz.`);
        $submit.textContent = _t('tutorial.quizGateGo', null, 'Ir al quiz →');
        $submit.onclick = () => {
          _hideLessonCheck();
          _proceedToCourseQuiz();
        };
      } else {
        $feedback.textContent = _t('tutorial.quizGateFail', { pct, min: QUIZ_GATE_PASS_PCT }, `Obtuviste ${pct}%. Necesitas al menos ${QUIZ_GATE_PASS_PCT}% para continuar. Repasa las lecciones.`);
        $submit.textContent = _t('tutorial.quizGateRetry', null, 'Reintentar');
        $submit.onclick = () => {
          _quizGateIdx = 0;
          _quizGateCorrect = 0;
          _lessonCheckSelected = -1;
          _showQuizGateQuestion();
        };
      }
    };

    overlay.hidden = false;
  }

  async function _renderCertPanel() {
    const panel = document.getElementById('tut-cert-panel');
    if (!panel || !_currentCourse) return;

    const total = _currentLessons.length;
    const req = typeof UserProfileService !== 'undefined'
      ? await UserProfileService.getCertificationRequirements(_currentCourse.id, total)
      : null;
    const stats = req?.lessonStats || { completed: 0, total, avg: 0, unlocked: false };
    const hasCert = typeof UserProfileService !== 'undefined'
      ? await UserProfileService.hasExamCertification(_currentCourse.id)
      : false;
    const progressPct = total ? Math.round((stats.completed / total) * 100) : 0;
    const lessonMin = req?.lessonMinAvg ?? 80;
    const quizMin = req?.quizMinPct ?? 70;
    const examMin = req?.examMinPct ?? 80;
    const quizPct = req?.quizPct ?? 0;
    const examUnlocked = req?.examUnlocked ?? false;

    const careerPath = typeof CareerPathsData !== 'undefined'
      ? CareerPathsData.getPathForCourse(_currentCourse.id)
      : null;
    let displayPct = progressPct;
    let gateHtml = '';
    if (careerPath && typeof EmployabilityService !== 'undefined') {
      const quizMap = typeof QuizProgressService !== 'undefined' ? (QuizProgressService.getAll?.() || {}) : {};
      const emp = EmployabilityService.getPortfolioProgress(careerPath.id, {
        quizProgress: quizMap,
        certifications: [],
      });
      displayPct = Math.min(progressPct, emp.record.projectUrl ? 100 : 99);
      if (progressPct >= 100 && !emp.record.projectUrl) {
        displayPct = 99;
        gateHtml = `<p class="employable-gate">${_t('employable.gateMsg', null, 'Aprendizaje casi listo: la ruta no se marca al 100% hasta enviar el proyecto final.')}</p>`;
      }
    }

    let badgeClass = 'tut-cert-panel__badge';
    let badgeText = _t('tutorial.badgeProgress', null, 'En progreso');
    if (hasCert) {
      badgeClass += ' tut-cert-panel__badge--earned';
      badgeText = _t('tutorial.badgeCert', null, 'Certificado obtenido');
    } else if (examUnlocked) {
      badgeClass += ' tut-cert-panel__badge--unlocked';
      badgeText = _t('tutorial.badgeExam', null, 'Examen disponible');
    }

    const certModules = typeof CourseCurriculum !== 'undefined'
      ? (CourseCurriculum.getCertMeta(_currentCourse.id)?.modules || [])
      : [];

    const step = (ok, label) => `
      <li class="tut-cert-step ${ok ? 'tut-cert-step--ok' : ''}">
        <span class="tut-cert-step__icon" aria-hidden="true">${ok ? '✓' : '○'}</span>
        <span>${label}</span>
      </li>`;

    panel.innerHTML = `
      <div class="tut-cert-panel__header">
        <div>
          <h2 class="tut-cert-panel__title">${_t('tutorial.certTitle', null, 'Certificación profesional')}</h2>
          <p class="tut-cert-panel__desc">
            ${_t('tutorial.certDesc', null, 'Para certificarte debes cumplir tres requisitos en orden: completar lecciones, aprobar el quiz y aprobar el examen práctico.')}
          </p>
          ${certModules.length ? `<p class="tut-cert-panel__modules">${_t('tutorial.certModules', null, 'Módulos:')} ${certModules.join(' · ')}</p>` : ''}
        </div>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      <ol class="tut-cert-steps">
        ${step(stats.unlocked, _t('tutorial.certStepLessons', { completed: stats.completed, total: stats.total, min: lessonMin, avg: stats.avg }, `Lecciones: ${stats.completed}/${stats.total} con promedio ≥${lessonMin}% (actual ${stats.avg}%)`))}
        ${step(req?.quizPassed, _t('tutorial.certStepQuiz', { min: quizMin, pct: quizPct }, `Quiz de práctica: ≥${quizMin}% (tu mejor ${quizPct}%)`))}
        ${step(hasCert, _t('tutorial.certStepExam', { min: examMin }, `Examen final: ≥${examMin}% para certificación profesional`))}
      </ol>
      <div class="tut-cert-panel__stats">
        <div class="tut-cert-stat">
          <span class="tut-cert-stat__label">${_t('tutorial.certStatLessons', null, 'Lecciones')}</span>
          <span class="tut-cert-stat__val">${stats.completed}/${stats.total}</span>
        </div>
        <div class="tut-cert-stat">
          <span class="tut-cert-stat__label">${_t('tutorial.certStatAvg', null, 'Promedio')}</span>
          <span class="tut-cert-stat__val">${stats.avg}%</span>
        </div>
        <div class="tut-cert-stat">
          <span class="tut-cert-stat__label">${_t('tutorial.certStatQuiz', null, 'Quiz')}</span>
          <span class="tut-cert-stat__val">${quizPct}%</span>
        </div>
      </div>
      <div class="tut-cert-panel__bar-wrap">
        <div class="tut-cert-panel__bar-label">
          <span>${_t('tutorial.certProgress', null, 'Progreso del curso')}</span>
          <span>${displayPct}%</span>
        </div>
        <div class="tut-cert-panel__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${displayPct}">
          <div class="tut-cert-panel__bar-fill" style="width:${displayPct}%"></div>
        </div>
      </div>
      ${gateHtml}
      <div class="tut-cert-panel__actions">
        <button type="button" class="btn--primary tut-btn-learn" id="tut-cert-exam-btn">
          ${hasCert ? _t('tutorial.btnViewCert', null, 'Ver certificado en perfil') : examUnlocked ? _t('tutorial.btnGoExam', null, 'Ir al examen de certificación') : _t('tutorial.btnExamBlocked', null, 'Examen bloqueado')}
        </button>
        <button type="button" class="btn--course" id="tut-cert-quiz-btn">${_t('tutorial.btnPracticeQuiz', { min: quizMin }, `Quiz de práctica (≥${quizMin}%)`)}</button>
        ${careerPath ? `<button type="button" class="btn--course" id="tut-employable-btn">${_t('employable.openPanel', null, 'Ver entregables')}</button>` : ''}
      </div>`;

    document.getElementById('tut-cert-exam-btn')?.addEventListener('click', () => {
      if (hasCert) {
        window.location.href = 'profile.html';
        return;
      }
      void _goToCertExam();
    });
    document.getElementById('tut-cert-quiz-btn')?.addEventListener('click', _goToCourseQuiz);
    document.getElementById('tut-employable-btn')?.addEventListener('click', () => {
      if (typeof EmployabilityController !== 'undefined' && careerPath) {
        EmployabilityService?.setActivePath?.(careerPath.id);
        EmployabilityController.openModal(careerPath.id);
      }
    });
  }

  function _showList() {
    _cerrarSandboxes();
    if (typeof StudyTimeService !== 'undefined') StudyTimeService.stop();
    $lessonView.style.display = 'none';
    $detailView.style.display = 'none';
    $listView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    _currentCourse = null;
    _publishShareContext('list');
    _syncDeepLinkUrl();
  }

  function _currentView() {
    if ($lessonView?.style.display === 'block') return 'lesson';
    if ($detailView?.style.display === 'block') return 'detail';
    return 'list';
  }

  function _relocalize() {
    if (!$tutGrid) return;
    const query = $searchInput?.value || '';
    _renderFilters();
    const view = _currentView();
    if (view === 'lesson' && _currentCourse) {
      const courseId = _currentCourse.id;
      const idx = _currentLessonIdx;
      _currentCourse = DataService.getCourses().find(c => c.id === courseId) || _currentCourse;
      const data = TutorialData.getCourseData(courseId) || {};
      _currentLessons = data.lessons || [];
      _showLesson(Math.min(idx, Math.max(0, _currentLessons.length - 1)));
    } else if (view === 'detail' && _currentCourse) {
      _showDetail(_currentCourse.id);
    } else {
      _renderGrid(query);
    }
  }

  /** Publica lo que se está viendo para que "Compartir" arme el enlace exacto. */
  function _publishShareContext(view) {
    if (typeof ShareService === 'undefined') return;
    if (!_currentCourse) {
      ShareService.setContext({ page: 'tutorial.html', title: 'IN4MIND' });
      return;
    }
    const params = { course: _currentCourse.id };
    if (view === 'lesson') params.lesson = _currentLessonIdx + 1;

    ShareService.setContext({
      page: 'tutorial.html',
      params,
      title: view === 'lesson' && _currentLessons[_currentLessonIdx]
        ? `${_currentCourse.title} — ${_currentLessons[_currentLessonIdx].title}`
        : _currentCourse.title,
      text: _currentCourse.desc,
    });
  }

  function _showDetail(courseId, openFirstLesson = false) {
    const course = DataService.getCourses().find(c => c.id === courseId);
    if (!course) return;
    _cerrarSandboxes();
    if (typeof StudyTimeService !== 'undefined') StudyTimeService.stop();
    _currentCourse = course;
    const data = TutorialData.getCourseData(courseId) || {};
    _currentLessons = data.lessons || [];
    if (typeof UserProfileService !== 'undefined') {
      UserProfileService.getLessonProgress(courseId).catch(() => {});
    }
    const meta = _curriculumMeta(courseId);

    document.getElementById('tut-detail-title').innerHTML = `
      <img src="${course.icon}" alt="${course.title}" width="36" height="36"
           style="border-radius:var(--rad-sm);background:white;padding:4px;box-shadow:var(--shadow-card);">
      ${course.title}`;

    document.getElementById('tut-detail-desc').textContent = course.desc;
    document.getElementById('tut-detail-meta').innerHTML = `
      <span class="tut-banner__rating">
        <svg class="tut-star" width="13" height="13" viewBox="0 0 24 24" stroke-width="1.5" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        ${data.rating ?? '4.7'} <span>${_t('tutorial.reviews', { n: data.reviews ?? 200 }, `(${data.reviews ?? 200} opiniones)`)}</span>
      </span>
      <span>${_t('tutorial.lessonCount', { n: _currentLessons.length }, `${_currentLessons.length} lecciones`)}</span>
      <span>${meta ? _t('tutorial.quizModules', { n: meta.quizModuleCount }, `${meta.quizModuleCount} módulos de quiz`) : _t('tutorial.quizCount', { n: data.quizzes ?? 2 }, `${data.quizzes ?? 2} quizzes`)}</span>
      <span>${_t('tutorial.questionCount', { n: meta?.quizQuestionCount ?? data.quizQuestions ?? 0 }, `${meta?.quizQuestionCount ?? data.quizQuestions ?? 0} preguntas`)}</span>`;

    document.getElementById('tut-detail-graphic').innerHTML =
      `<img src="${course.icon}" alt="" width="110" height="110" style="opacity:0.25;filter:grayscale(0.3);">`;

    document.getElementById('tut-about-title').textContent = _t('tutorial.aboutCourse', { course: course.title }, `Sobre ${course.title}`);
    document.getElementById('about-text').textContent = data.aboutShort ?? course.desc;
    const extraEl = document.getElementById('about-extra');
    extraEl.textContent = data.aboutExtra ?? '';
    extraEl.style.display = 'none';
    document.getElementById('btn-more').textContent = _t('tutorial.readMore', null, 'Leer Más');
    const startBtn = document.getElementById('tut-detail-start');
    if (startBtn) startBtn.textContent = _t('tutorial.startLearning', null, 'Empieza a Aprender');

    if (typeof EmployabilityController !== 'undefined') {
      EmployabilityController.renderCourseBanner(
        document.getElementById('employable-course-banner'),
        course.id
      );
    }

    const groups = _groupLessons(_currentLessons);
    const timeline = meta?.levelsCovered || data.timeline || _levels();
    const path = typeof CourseCurriculum !== 'undefined'
      ? CourseCurriculum.getLearningPath(courseId)
      : _currentLessons.map((l, i) => ({
          index: i,
          lessonTitle: l.title,
          moduleTitle: l.section || l.title,
          level: l.level,
        }));

    document.getElementById('tut-videos-grid').innerHTML = path.map((mod, i) =>
      _renderVideoCover(
        mod.lessonTitle,
        i,
        course,
        mod.index,
        mod.level || mod.moduleTitle,
        mod.videoUrl
      )
    ).join('');

    document.getElementById('tut-lessons-list').innerHTML = Object.entries(groups).map(([section, items]) => `
      <div class="tut-lesson-group">
        <h3 class="tut-lesson-group__title">${section}</h3>
        <p class="tut-lesson-group__hint">${_t('tutorial.lessonGroupHint', { section }, `Lección → quiz «${section}» → examen final`)}</p>
        <div class="tut-lesson-group__grid">
          ${items.map(l => _renderLessonCard(l, course, l.index)).join('')}
        </div>
      </div>
    `).join('');

    document.getElementById('tut-topics-list').innerHTML = _currentLessons.map((l, i) => {
      const done = typeof UserProfileService !== 'undefined'
        && UserProfileService.getLessonProgressSync(courseId)[l.id];
      const quizLabel = l.quizModule || l.section || `Módulo ${i + 1}`;
      return `
      <div class="tut-topic-item ${done ? 'tut-topic-item--done' : ''}" data-lesson-idx="${i}" tabindex="0" role="button">
        <span class="tut-topic__num">${i + 1}</span>
        <div class="tut-topic__body">
          <span class="tut-topic__name">${l.title}</span>
          <span class="tut-topic__quiz">${_t('tutorial.topicQuiz', { module: quizLabel }, `Quiz: ${quizLabel}`)}</span>
        </div>
        <span class="tut-topic__dur">${l.duration}${done ? ` · ${done.pct}%` : ''}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--clr-text-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>`;
    }).join('');

    const dotColors = ['#64748b', '#3b82f6', '#14b8a6', '#ef4444'];
    document.getElementById('tut-timeline-points').innerHTML = timeline.map((t, i) => `
      <div class="tut-timeline__point">
        <div class="tut-timeline__dot" style="background:${dotColors[i % dotColors.length]};"></div>
        <span>${t}</span>
      </div>
    `).join('');

    _setActionButtonState('fav', false);
    _setActionButtonState('save', false);
    _syncActionButtons();
    void _renderCertPanel();

    UserProfileService.recordVisit(UserProfileService.buildCourseItem(course));

    try {
      sessionStorage.setItem('in4mind_open_course', courseId);
    } catch { /* ignore */ }

    _bindDetailExtraActions(courseId);
    _bindLessonCards();

    $listView.style.display = 'none';
    $lessonView.style.display = 'none';
    $detailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    _publishShareContext('detail');
    _syncDeepLinkUrl();

    if (openFirstLesson && _currentLessons.length) _showLesson(0);
  }

  function _bindDetailExtraActions(courseId) {
    const offlineBtn = document.getElementById('tut-btn-offline');
    const tutorBtn = document.getElementById('tut-btn-tutor');
    if (offlineBtn) {
      const downloaded = typeof OfflineCourseService !== 'undefined'
        && OfflineCourseService.isDownloaded(courseId);
      offlineBtn.textContent = downloaded
        ? _t('offline.downloaded', null, 'Listo offline')
        : _t('offline.download', null, 'Descargar offline');
      offlineBtn.onclick = async () => {
        if (typeof OfflineCourseService === 'undefined') return;
        offlineBtn.disabled = true;
        offlineBtn.textContent = _t('offline.downloading', null, 'Descargando…');
        await OfflineCourseService.downloadCourse(courseId);
        offlineBtn.disabled = false;
        offlineBtn.textContent = OfflineCourseService.isDownloaded(courseId)
          ? _t('offline.downloaded', null, 'Listo offline')
          : _t('offline.download', null, 'Descargar offline');
      };
    }
    if (tutorBtn) {
      tutorBtn.href = `ai.html?course=${encodeURIComponent(courseId)}`;
      tutorBtn.textContent = _t('tutorial.askTutor', null, 'Tutor IA');
      tutorBtn.onclick = () => {
        try { sessionStorage.setItem('in4mind_open_course', courseId); } catch { /* ignore */ }
      };
    }
  }

  function _levelScaleHtml(activeLevel) {
    const levels = _levels();
    return levels.map(lvl => `
      <span class="lesson-w3__level-pill ${lvl === activeLevel ? 'lesson-w3__level-pill--active' : ''}">${lvl}</span>
    `).join('<span class="lesson-w3__level-sep" aria-hidden="true">|</span>');
  }

  function _renderLessonSidebar(activeIdx) {
    const $list = document.getElementById('lesson-sidebar-list');
    const $course = document.getElementById('lesson-sidebar-course');
    const $icon = document.getElementById('lesson-sidebar-icon');
    if (!$list || !_currentCourse) return;

    $course.textContent = _currentCourse.title;
    $icon.src = _currentCourse.icon;
    $icon.alt = _currentCourse.title;

    const progress = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getLessonProgressSync(_currentCourse.id)
      : {};

    $list.innerHTML = _currentLessons.map((l, i) => {
      const done = progress[l.id];
      const locked = !canAccess(i);
      return `
        <button type="button" class="lesson-w3__nav-item ${i === activeIdx ? 'lesson-w3__nav-item--active' : ''} ${done ? 'lesson-w3__nav-item--done' : ''} ${locked ? 'lesson-w3__nav-item--locked' : ''}"
                data-lesson-idx="${i}" aria-disabled="${locked ? 'true' : 'false'}">
          <span class="lesson-w3__nav-num">${i + 1}</span>
          <span class="lesson-w3__nav-text">${l.title}</span>
          ${locked ? '<span class="lesson-w3__nav-lock" aria-hidden="true">🔒</span>' : ''}
          ${!locked && done ? '<span class="lesson-w3__nav-check" aria-hidden="true">✓</span>' : ''}
        </button>`;
    }).join('');

    $list.querySelectorAll('[data-lesson-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.lessonIdx, 10);
        // Elegir lección es el caso normal de salida en móvil: si el panel
        // siguiera abierto, taparía la lección recién cargada.
        _setLessonSidebar(false);
        _requestShowLesson(idx);
      });
    });

    const $quizLink = document.getElementById('lesson-sidebar-quiz');
    if ($quizLink) {
      $quizLink.onclick = (e) => {
        e.preventDefault();
        // No siempre navega: si faltan lecciones abre el aviso de bloqueo, y
        // ese aviso quedaría detrás del panel.
        _setLessonSidebar(false);
        _goToCourseQuiz();
      };
    }
  }

  /**
   * Cierra los sandboxes vivos de la lección.
   *
   * Hace falta en los tres caminos por los que se abandona una lección: pasar
   * a la siguiente, volver al curso y volver al listado. Los dos últimos sólo
   * ocultan la vista con `display:none`, así que sin esto el worker de Python
   * sigue corriendo con todo Pyodide en memoria y el iframe sigue montado.
   */
  function _cerrarSandboxes() {
    _cerrarCheckpoint();
    /* El cronómetro NO se para aquí: esta función también corre al pasar de
       una lección a otra, y pararlo ahí lo apagaría justo después de que
       `_showLesson` lo encendiera. Se para al salir de la vista. */
    /* La voz no muere con el DOM: seguiría leyendo la lección anterior encima
       de la nueva pantalla. */
    if (typeof LessonReader !== 'undefined') LessonReader.parar();
    if (typeof CodeSandbox === 'undefined') return;
    document.querySelectorAll('[data-sandbox]').forEach(el => CodeSandbox.destroy(el));
  }

  /* ── Espacio de trabajo de la lección ─────────────────────────────────────
   * La lección se reparte en tres pestañas. El artículo se sigue pintando de
   * una pieza —es la única fuente de verdad del contenido— y luego se mueven
   * los bloques ya construidos a su panel. Mover un nodo conserva sus
   * listeners, así que todo lo que el controlador enganchó sigue funcionando.
   */

  const LWTABS = ['contenido', 'practica', 'quiz', 'flashcards'];
  // Sólo para la insignia si la gamificación no estuviera disponible; la cifra
  // real la pone `XP_MAP` en GamificationService, y es la que se muestra.
  const XP_MICRO = 25;
  const CONFETI_CDN = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
  let _lwLigado = false;
  let _microOk = false;      // el micro-quiz de esta lección ya se superó

  function _repartirPestanas() {
    const practica = document.getElementById('lesson-practica');
    const notas = document.getElementById('lesson-notes-host');

    if (practica) {
      practica.textContent = '';
      // El ejemplo y el sandbox son «hacer», no «leer».
      for (const id of ['lesson-sec-example', 'lesson-sec-sandbox']) {
        const el = document.getElementById(id);
        if (el) practica.appendChild(el);
      }
      if (!practica.children.length) {
        const vacio = document.createElement('p');
        vacio.className = 'lesson-w3__text lesson-w3__text--muted';
        vacio.textContent = _t('tutorial.practiceEmpty', null,
          'Esta lección no tiene ejercicio práctico. Repasa el contenido y pasa al micro-quiz.');
        practica.appendChild(vacio);
      }
    }

    // Las notas viven en el cajón flotante, no en mitad del texto.
    const secNotas = document.getElementById('lesson-notes-section');
    if (notas && secNotas) {
      notas.textContent = '';
      notas.appendChild(secNotas);
    }
  }

  /** ¿Están todas las lecciones del módulo completadas? */
  function _moduloCompleto() {
    return Boolean(_currentLessons.length
      && _currentLessons.every(l => _isLessonComplete(l.id)));
  }

  function _activarPestana(nombre) {
    if (!LWTABS.includes(nombre)) return;

    /* Las flashcards repasan el módulo entero: abrirlas a mitad de camino
       enseñaría respuestas de lecciones que todavía no se han visto. */
    if (nombre === 'flashcards' && !_moduloCompleto()) {
      const msg = _t('tutorial.cardsLocked', null,
        'Termina el módulo para desbloquear las flashcards.');
      if (typeof Infy === 'undefined' || !Infy.showToast || !Infy.showToast(msg, 'LEARNING')) {
        if (typeof AppShell !== 'undefined') AppShell.showToast(msg);
      }
      return;
    }
    for (const t of LWTABS) {
      const boton = document.querySelector(`[data-lwtab="${t}"]`);
      const panel = document.getElementById(`lwpanel-${t}`);
      const activo = t === nombre;
      if (boton) {
        boton.classList.toggle('is-active', activo);
        boton.setAttribute('aria-selected', String(activo));
        boton.tabIndex = activo ? 0 : -1;
      }
      if (panel) {
        panel.classList.toggle('is-active', activo);
        panel.hidden = !activo;
      }
    }

    /* CodeMirror mide su alto al crearse: si nació en un panel oculto se queda
       en cero y aparece como una franja vacía hasta que alguien lo toca. */
    if (nombre === 'practica' && typeof CodeSandbox !== 'undefined' && CodeSandbox.refresh) {
      document.querySelectorAll('#lesson-practica [data-sandbox]').forEach(el => CodeSandbox.refresh(el));
    }

    // La baraja se arma al abrirla: antes no hay nada que mostrar.
    if (nombre === 'flashcards') _montarFlashcards();
  }

  function _ligarPestanas() {
    if (_lwLigado) return;
    const tabs = [...document.querySelectorAll('[data-lwtab]')];
    if (!tabs.length) return;
    _lwLigado = true;

    tabs.forEach((boton) => {
      boton.addEventListener('click', () => _activarPestana(boton.dataset.lwtab));
      // Flechas entre pestañas: es lo que un lector de pantalla espera de un tablist.
      boton.addEventListener('keydown', (ev) => {
        const i = LWTABS.indexOf(boton.dataset.lwtab);
        let destino = null;
        if (ev.key === 'ArrowRight') destino = LWTABS[(i + 1) % LWTABS.length];
        else if (ev.key === 'ArrowLeft') destino = LWTABS[(i - 1 + LWTABS.length) % LWTABS.length];
        else if (ev.key === 'Home') destino = LWTABS[0];
        else if (ev.key === 'End') destino = LWTABS[LWTABS.length - 1];
        if (!destino) return;
        ev.preventDefault();
        _activarPestana(destino);
        document.querySelector(`[data-lwtab="${destino}"]`)?.focus();
      });
    });

    // Cajón de notas
    const abrir = document.getElementById('lesson-notes-toggle');
    const cajon = document.getElementById('lesson-notes-drawer');
    const cerrar = document.getElementById('lesson-notes-close');
    const alternar = (abierto) => {
      if (!cajon) return;
      cajon.hidden = !abierto;
      cajon.classList.toggle('is-open', abierto);
      abrir?.setAttribute('aria-expanded', String(abierto));
      if (abierto) cajon.querySelector('textarea')?.focus();
    };
    abrir?.addEventListener('click', () => alternar(cajon?.hidden !== false));
    document.getElementById('lesson-notes-ai')?.addEventListener('click', _resumirNotas);
    cerrar?.addEventListener('click', () => { alternar(false); abrir?.focus(); });
    window.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && cajon && !cajon.hidden) { alternar(false); abrir?.focus(); }
    });
  }

  /**
   * Resume la lección en Markdown y lo añade a las notas del alumno.
   *
   * Se AÑADE, nunca se reemplaza: lo que escribió a mano es suyo y perderlo
   * por pulsar un botón sería imperdonable. El resumen se pide sobre el texto
   * real de la lección (descripción y pasos), no sobre su título, para que no
   * se lo invente.
   */
  async function _resumirNotas() {
    const boton = document.getElementById('lesson-notes-ai');
    const aviso = document.getElementById('lesson-notes-ai-msg');
    const campo = document.getElementById('lesson-notes-input');
    const lesson = _currentLessons[_currentLessonIdx];
    if (!boton || !campo || !lesson) return;

    if (typeof GroqService === 'undefined' || !GroqService.chat) {
      if (aviso) aviso.textContent = _t('tutorial.notesNoAi', null, 'Infy no está disponible ahora mismo.');
      return;
    }

    boton.disabled = true;
    if (aviso) aviso.textContent = _t('tutorial.notesWorking', null, 'Infy está resumiendo…');

    const pasos = Array.isArray(lesson.steps) ? lesson.steps : [];
    const prompt = [
      'Resume esta lección como apuntes en Markdown, en español.',
      'Usa un encabezado de nivel 2 con el título, 3-5 viñetas con las ideas',
      'clave y una última línea que empiece por "**Recuerda:**".',
      'Máximo 120 palabras. No inventes nada que no esté abajo.',
      '',
      `Título: ${lesson.title || ''}`,
      `Descripción: ${lesson.description || lesson.summary || ''}`,
      pasos.length ? `Pasos:\n${pasos.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '',
    ].filter(Boolean).join('\n');

    try {
      const resumen = await GroqService.chat([{ role: 'user', content: prompt }]);
      if (!resumen) throw new Error('vacio');

      const previo = campo.value.trim();
      campo.value = previo ? `${previo}\n\n${resumen}` : resumen;
      // `input` para que LessonNotesService lo guarde como si lo hubiera escrito.
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      campo.scrollTop = campo.scrollHeight;
      if (aviso) aviso.textContent = _t('tutorial.notesAdded', null, 'Resumen añadido a tus notas.');
    } catch {
      if (aviso) aviso.textContent = _t('tutorial.notesFailed', null, 'No se pudo resumir. Inténtalo otra vez.');
    } finally {
      boton.disabled = false;
    }
  }

  /** Progreso del módulo: lecciones ya completadas sobre el total. */
  function _pintarProgresoModulo() {
    const total = _currentLessons.length;
    if (!total || !_currentCourse) return;

    // Misma fuente que usa el índice lateral, para que no se contradigan.
    const progreso = typeof UserProfileService !== 'undefined'
      ? (UserProfileService.getLessonProgressSync(_currentCourse.id) || {})
      : {};
    const hechas = _currentLessons.filter(l => progreso[l.id]).length;
    const pct = Math.round((hechas / total) * 100);

    const fill = document.getElementById('lesson-progress-fill');
    const barra = document.getElementById('lesson-progress-bar');
    const texto = document.getElementById('lesson-progress-pct');
    const meta = document.getElementById('lesson-progress-meta');
    if (fill) fill.style.width = `${pct}%`;
    if (barra) barra.setAttribute('aria-valuenow', String(pct));
    if (texto) texto.textContent = `${pct}%`;
    if (meta) {
      meta.textContent = _t('tutorial.progressMeta', { n: hechas, total },
        `${hechas} de ${total} lecciones completadas`);
    }
  }

  /* ── Lectura en voz alta ─────────────────────────────────────────────── */

  function _pintarBotonLectura(leyendo) {
    const btn = document.getElementById('lesson-listen');
    if (!btn) return;
    const txt = btn.querySelector('.lw-head__listen-txt');
    if (txt) {
      txt.textContent = leyendo
        ? _t('tutorial.listenStop', null, 'Detener')
        : _t('tutorial.listen', null, 'Escuchar con Infy');
    }
    btn.classList.toggle('is-leyendo', leyendo);
    btn.setAttribute('aria-pressed', String(leyendo));
  }

  function _alternarLectura() {
    if (typeof LessonReader === 'undefined') return;
    const lesson = _currentLessons[_currentLessonIdx];

    if (LessonReader.leyendo()) { LessonReader.parar(); return; }

    /* Se lee lo que hay en la pestaña de contenido, saltando código y
       controles: leer en voz alta un bloque de código es ruido. */
    const panel = document.getElementById('lwpanel-contenido');
    const texto = [lesson?.title, LessonReader.textoDe(panel)].filter(Boolean).join('. ');
    void LessonReader.alternar(texto).then((empezo) => {
      if (!empezo) {
        _pintarInfyLeccion(lesson, 'IDLE',
          _t('tutorial.listenFail', null, 'Tu navegador no puede leer esta lección en voz alta.'));
      }
    });
  }

  /** Cambia el gesto de Infy en la tarjeta lateral. */
  function _infyGesto(estado) {
    const img = document.getElementById('lesson-infy-img');
    if (!img || typeof InfyMascot === 'undefined') return;
    const archivo = InfyMascot.GESTOS?.[estado];
    if (archivo) img.src = `${InfyMascot.RUTA}${archivo}`;
  }

  /* ── Mapa de calor y velocidad ───────────────────────────────────────── */

  /** Minutos que el temario dice que cuesta el módulo entero. */
  function _metaMinutos() {
    return _currentLessons.reduce((total, l) => {
      const m = /(\d+)/.exec(l.duration || '');
      return total + (m ? Number(m[1]) : 10);
    }, 0);
  }

  function _pintarMapaCalor() {
    const caja = document.getElementById('lesson-heat');
    const grid = document.getElementById('lesson-heat-grid');
    if (!caja || !grid || typeof StudyTimeService === 'undefined') return;

    const dias = StudyTimeService.getDaily(14);
    grid.textContent = '';

    /* La intensidad se reparte en cuatro escalones sobre 30 minutos: por
       encima de eso todos los días se verían iguales y el mapa dejaría de
       distinguir una tarde larga de un rato corto. */
    for (const d of dias) {
      const min = Math.round(d.segundos / 60);
      const nivel = min === 0 ? 0 : Math.min(4, Math.ceil(min / 8));
      const celda = document.createElement('span');
      celda.className = 'lw-heat__dia';
      celda.dataset.nivel = String(nivel);
      celda.title = _t('tutorial.heatDay', { dia: d.dia, min },
        `${d.dia}: ${min} min`);
      grid.appendChild(celda);
    }

    const racha = StudyTimeService.getStreak();
    const chip = document.getElementById('lesson-heat-streak');
    if (chip) {
      chip.textContent = racha > 0
        ? _t('tutorial.heatStreak', { n: racha }, `🔥 ${racha} días`)
        : '';
    }

    const meta = document.getElementById('lesson-heat-meta');
    if (meta && _currentCourse) {
      const min = Math.round(StudyTimeService.getSeconds(_currentCourse.id) / 60);
      meta.textContent = _t('tutorial.heatTotal', { min, meta: _metaMinutos() },
        `${min} min en este módulo · meta ${_metaMinutos()} min`);
    }
    caja.hidden = false;
  }

  /**
   * Premia terminar el módulo por debajo de la duración estimada.
   *
   * Se comprueba una sola vez por curso: sin la marca, cada repaso de la
   * última lección volvería a soltar el bonus.
   */
  function _bonusVelocidad() {
    if (!_currentCourse || typeof StudyTimeService === 'undefined') return;
    const todas = _currentLessons.length
      && _currentLessons.every(l => _isLessonComplete(l.id));
    if (!todas) return;

    const clave = `in4mind_bonus_vel:${_currentCourse.id}`;
    try { if (localStorage.getItem(clave)) return; } catch { return; }

    const minutos = StudyTimeService.getSeconds(_currentCourse.id) / 60;
    const meta = _metaMinutos();
    if (!meta || minutos >= meta) return;

    try { localStorage.setItem(clave, '1'); } catch { /* vale por esta sesión */ }

    if (typeof GamificationService !== 'undefined' && GamificationService.recordActivity) {
      try { GamificationService.recordActivity('speed', { courseId: _currentCourse.id }); }
      catch { /* el aviso vale aunque falle la contabilidad */ }
    }
    if (typeof Infy !== 'undefined' && Infy.showToast) {
      Infy.showToast(
        _t('tutorial.speedBonus', { min: Math.round(minutos), meta },
          `¡Bonus de velocidad! Terminaste en ${Math.round(minutos)} min (meta ${meta}).`),
        'SUCCESS');
    }
  }

  /* ── Profundizar ─────────────────────────────────────────────────────────
   * Un botón bajo la descripción que le pide a Infy otra explicación: una
   * analogía o un ejemplo de código, según el curso. No reemplaza el texto,
   * lo añade debajo: quien ya entendió la versión original no debería perderla
   * por pulsar un botón, y comparar las dos es parte de entender.
   */

  function _montarProfundizar(lesson) {
    const bloque = document.getElementById('lesson-sec-desc');
    if (!bloque || typeof GroqService === 'undefined' || !GroqService.chat) return;
    if (bloque.querySelector('.lw-deep')) return;

    const caja = document.createElement('div');
    caja.className = 'lw-deep';
    caja.innerHTML = `
      <button type="button" class="lw-deep__btn">
        <span aria-hidden="true">💡</span>
        <span class="lw-deep__txt"></span>
      </button>
      <div class="lw-deep__salida" role="region" aria-live="polite" hidden></div>`;
    bloque.appendChild(caja);

    const boton = caja.querySelector('.lw-deep__btn');
    const texto = caja.querySelector('.lw-deep__txt');
    const salida = caja.querySelector('.lw-deep__salida');
    texto.textContent = _t('tutorial.deepDive', null, 'Explícamelo de otra forma');

    boton.addEventListener('click', async () => {
      boton.disabled = true;
      salida.hidden = false;
      salida.textContent = _t('tutorial.deepWorking', null, 'Infy está buscando otra manera de contarlo…');
      _infyGesto('THINKING');

      /* Qué se pide depende del curso: en uno de código, un ejemplo mínimo
         enseña más que una metáfora; en uno de herramienta, al revés. */
      const esCodigo = typeof LessonExamples !== 'undefined'
        && LessonExamples.isCodeCourse?.(_currentCourse?.id);
      const prompt = [
        'Eres Infy, tutor de IN4MIND. Explica este concepto de OTRA manera,',
        'en español y en menos de 90 palabras, para alguien que no lo pilló a la primera.',
        esCodigo
          ? 'Usa un ejemplo de código mínimo y comentado.'
          : 'Usa una analogía cotidiana, sin tecnicismos nuevos.',
        'No repitas el texto de abajo: dilo distinto.',
        '',
        `Lección: ${lesson?.title || ''}`,
        `Texto original: ${lesson?.description || lesson?.summary || ''}`,
      ].join('\n');

      try {
        const respuesta = await GroqService.chat([{ role: 'user', content: prompt }]);
        if (!respuesta) throw new Error('vacio');
        salida.textContent = respuesta;
        _infyGesto('SUCCESS');
        texto.textContent = _t('tutorial.deepAgain', null, 'Otra explicación más');
      } catch {
        salida.textContent = _t('tutorial.deepFailed', null,
          'Infy no está disponible ahora mismo. Inténtalo más tarde.');
        _infyGesto('IDLE');
      } finally {
        boton.disabled = false;
      }
    });
  }

  /* ── Flashcards ──────────────────────────────────────────────────────── */

  /** Pone el candado de la pestaña según el estado del módulo. */
  function _pintarCandadoFlashcards() {
    const tab = document.querySelector('[data-lwtab="flashcards"]');
    const lock = document.getElementById('lwtab-cards-lock');
    if (!tab) return;
    const abierta = _moduloCompleto();
    tab.classList.toggle('is-bloqueada', !abierta);
    tab.setAttribute('aria-disabled', abierta ? 'false' : 'true');
    if (lock) lock.hidden = abierta;
  }

  function _montarFlashcards() {
    const host = document.getElementById('lesson-flashcards');
    if (!host || !_currentCourse || typeof FlashcardService === 'undefined') return;

    const todas = FlashcardService.baraja(_currentCourse.id, _currentLessons);
    const cola = FlashcardService.pendientes(_currentCourse.id, todas);
    host.textContent = '';

    if (!todas.length) {
      const p = document.createElement('p');
      p.className = 'lesson-w3__text lesson-w3__text--muted';
      p.textContent = _t('tutorial.cardsEmpty', null, 'Este módulo todavía no tiene tarjetas de repaso.');
      host.appendChild(p);
      return;
    }

    if (!cola.length) {
      /* Nada vencido: se dice cuándo toca en vez de dejar la pestaña vacía,
         que parecería rota. Repasar antes de tiempo no consolida nada. */
      const p = document.createElement('p');
      p.className = 'lw-cards__aldia';
      p.textContent = _t('tutorial.cardsDone', null,
        'Estás al día. Vuelve cuando toque el siguiente repaso.');
      host.appendChild(p);
      _pintarPrecision(host);
      return;
    }

    let i = 0;
    const tarjeta = document.createElement('div');
    tarjeta.className = 'lw-card';
    tarjeta.innerHTML = `
      <div class="lw-card__cuenta"></div>
      <button type="button" class="lw-card__cara" aria-live="polite">
        <span class="lw-card__modulo"></span>
        <span class="lw-card__texto"></span>
        <span class="lw-card__pista"></span>
      </button>
      <div class="lw-card__acciones" hidden>
        <button type="button" class="lw-card__btn lw-card__btn--no"></button>
        <button type="button" class="lw-card__btn lw-card__btn--si"></button>
      </div>`;
    host.appendChild(tarjeta);

    const $cara = tarjeta.querySelector('.lw-card__cara');
    const $modulo = tarjeta.querySelector('.lw-card__modulo');
    const $texto = tarjeta.querySelector('.lw-card__texto');
    const $pista = tarjeta.querySelector('.lw-card__pista');
    const $acciones = tarjeta.querySelector('.lw-card__acciones');
    const $cuenta = tarjeta.querySelector('.lw-card__cuenta');
    const $no = tarjeta.querySelector('.lw-card__btn--no');
    const $si = tarjeta.querySelector('.lw-card__btn--si');

    $no.textContent = _t('tutorial.cardsNo', null, 'No la sabía');
    $si.textContent = _t('tutorial.cardsYes', null, 'La sabía');

    let volteada = false;

    const pintar = () => {
      if (i >= cola.length) {
        host.textContent = '';
        const fin = document.createElement('p');
        fin.className = 'lw-cards__aldia';
        fin.textContent = _t('tutorial.cardsFinished', null, '¡Repaso terminado!');
        host.appendChild(fin);
        _pintarPrecision(host);
        if (typeof Infy !== 'undefined' && Infy.showToast) {
          Infy.showToast(_t('tutorial.cardsFinished', null, '¡Repaso terminado!'), 'SUCCESS');
        }
        return;
      }
      volteada = false;
      const c = cola[i];
      tarjeta.classList.remove('is-volteada');
      $cuenta.textContent = _t('tutorial.cardsProgress', { n: i + 1, total: cola.length },
        `${i + 1} de ${cola.length}`);
      $modulo.textContent = c.modulo || '';
      $texto.textContent = c.frente;
      $pista.textContent = _t('tutorial.cardsFlip', null, 'Toca para ver la respuesta');
      $acciones.hidden = true;
    };

    const voltear = () => {
      if (volteada) return;
      volteada = true;
      tarjeta.classList.add('is-volteada');
      $texto.textContent = cola[i].dorso;
      $pista.textContent = '';
      $acciones.hidden = false;
    };

    const responder = (acierto) => {
      if (!volteada) return;
      const r = FlashcardService.responder(_currentCourse.id, cola[i].id, acierto);
      /* Se dice cuándo vuelve: ver que un acierto la aleja y un fallo la trae
         de vuelta mañana es lo que hace entendible el sistema. */
      const dias = r.intervalo;
      if (typeof AppShell !== 'undefined') {
        /* Clave distinta para el singular: con una sola plantilla salía
           «Vuelve en 1 días», y el respaldo del código no puede arreglarlo
           porque la traducción siempre gana. */
        const aviso = dias === 1
          ? _t('tutorial.cardsNextOne', null, 'Vuelve mañana.')
          : _t('tutorial.cardsNext', { n: dias }, `Vuelve en ${dias} días.`);
        AppShell.showToast(aviso, 1800);
      }
      i += 1;
      pintar();
    };

    $cara.addEventListener('click', voltear);
    $no.addEventListener('click', () => responder(false));
    $si.addEventListener('click', () => responder(true));
    pintar();
  }

  function _pintarPrecision(host) {
    if (typeof FlashcardService === 'undefined' || !_currentCourse) return;
    const pct = FlashcardService.precision(_currentCourse.id);
    if (pct === null) return;
    const p = document.createElement('p');
    p.className = 'lw-cards__precision';
    p.textContent = _t('tutorial.cardsAccuracy', { pct }, `Recuerdo: ${pct}% de aciertos`);
    host.appendChild(p);
  }

  /**
   * Avisa de los repasos vencidos.
   *
   * Sólo reclama barajas que el alumno ya abrió alguna vez: avisar de un
   * repaso que nunca empezó sería inventarle deberes.
   */
  function _avisarRepasos() {
    if (typeof FlashcardService === 'undefined' || typeof Infy === 'undefined') return;
    const pendientes = FlashcardService.vencidos();
    if (!pendientes.length) return;
    const total = pendientes.reduce((n, p) => n + p.n, 0);
    const aviso = total === 1
      ? _t('tutorial.cardsDueOne', null, 'Tienes 1 tarjeta lista para repasar.')
      : _t('tutorial.cardsDue', { n: total }, `Tienes ${total} tarjetas listas para repasar.`);
    Infy.showToast(aviso, 'LEARNING');
  }

  /* ── Checkpoint de código ────────────────────────────────────────────── */

  /**
   * Coloca el checkpoint tras los pasos y esconde lo que viene después.
   *
   * Va después de «Pasos» y no antes: lo que hace falta para resolverlo está
   * explicado ahí arriba, así que nada de lo que se oculta es necesario para
   * superarlo.
   */
  function _montarCheckpoint(lesson) {
    if (typeof CodeCheckpoint === 'undefined' || typeof LessonCheckpoints === 'undefined') return;
    const def = LessonCheckpoints.get(lesson?.id);
    const pasos = document.getElementById('lesson-sec-steps');
    if (!def || !pasos) return;

    const posteriores = [];
    for (let el = pasos.nextElementSibling; el; el = el.nextElementSibling) {
      posteriores.push(el);
    }

    const caja = document.createElement('section');
    caja.id = 'lesson-sec-checkpoint';
    pasos.insertAdjacentElement('afterend', caja);
    CodeCheckpoint.mount(caja, def, posteriores);
  }

  function _cerrarCheckpoint() {
    if (typeof CodeCheckpoint === 'undefined') return;
    const caja = document.getElementById('lesson-sec-checkpoint');
    if (caja) CodeCheckpoint.destroy(caja);
  }

  /** Consejo de Infy para la lección activa. */
  function _pintarInfyLeccion(lesson, estado = 'LEARNING', texto = null) {
    const txt = document.getElementById('lesson-infy-text');
    if (!txt) return;

    txt.textContent = texto || lesson?.tip
      || _t('tutorial.infyTipDefault', null,
        'Lee el contenido, prueba el ejercicio y remátalo con el micro-quiz.');
    _infyGesto(estado);
  }

  /**
   * Convierte las preguntas del temario al formato del micro-quiz.
   *
   * El temario guarda tres tipos; aquí sólo sirven los de respuesta única.
   * `match` se descarta: no se puede responder con dos botones.
   */
  function _preguntasMicro(courseId, idx) {
    let seccion = null;
    try {
      seccion = typeof CourseCurriculum !== 'undefined'
        ? CourseCurriculum.getQuizDef(courseId)?.sections?.[idx]
        : null;
    } catch { return []; }

    const brutas = Array.isArray(seccion?.questions) ? seccion.questions : [];
    const salida = [];
    for (const q of brutas) {
      if (salida.length === 2) break;
      if (q.type === 'choice' && Array.isArray(q.opts)) {
        salida.push({ question: q.q, options: q.opts.slice(), answer: q.ans, exp: q.exp || '' });
      } else if (q.type === 'truefalse') {
        salida.push({
          question: q.q,
          // Ya traducidas para el quiz del curso: no hace falta duplicarlas.
          options: [_t('quizzes.true', null, 'Verdadero'), _t('quizzes.false', null, 'Falso')],
          answer: q.ans ? 0 : 1,
          exp: q.exp || '',
        });
      }
    }
    return salida;
  }

  /* Nota mínima para dar por superado un micro-quiz. Con dos preguntas, 80 %
     equivale a acertar las dos; se guarda el porcentaje y no un booleano para
     que la regla siga siendo la misma si algún módulo trae más preguntas. */
  const MICRO_APROBADO = 80;

  function _claveMicro(courseId, lessonId) {
    return `in4mind_micro_ok:${courseId}:${lessonId}`;
  }

  /** Nota guardada del micro-quiz, en porcentaje. */
  function _microNota(courseId, lessonId) {
    try {
      const v = localStorage.getItem(_claveMicro(courseId, lessonId));
      if (v === null) return null;
      // '1' es el formato viejo, de cuando sólo se guardaba «superado».
      return v === '1' ? 100 : Number(v);
    } catch { return null; }
  }

  function _microSuperado(courseId, lessonId) {
    const nota = _microNota(courseId, lessonId);
    return nota !== null && nota >= MICRO_APROBADO;
  }

  /**
   * Abre o cierra el paso a la siguiente lección.
   *
   * Sólo se cierra cuando hay micro-quiz que superar: si la lección no tiene
   * preguntas, bloquear «Siguiente» dejaría al alumno encerrado sin salida.
   */
  function _gateSiguiente(bloquear) {
    const next = document.getElementById('lesson-next');
    if (!next) return;

    /* `aria-disabled` y no `disabled`, igual que hace el bloqueo por lección:
       el botón sigue recibiendo el clic y puede explicar por qué no avanza.
       Un botón inerte dejaría al alumno delante de algo apagado y mudo. */
    next.setAttribute('aria-disabled', bloquear ? 'true' : 'false');
    next.classList.toggle('is-gated', bloquear);
    if (bloquear) {
      next.title = _t('tutorial.gateHint', null, 'Supera el micro-quiz para continuar.');
    } else {
      next.removeAttribute('title');
    }
    const punto = document.getElementById('lwtab-quiz-dot');
    if (punto) punto.hidden = !bloquear;
  }

  /** ¿Puede esta lección dejar pasar a la siguiente? */
  function _microBloquea() {
    return !_microOk;
  }

  function _montarMicroQuiz(lesson, idx) {
    const host = document.getElementById('lesson-microquiz');
    if (!host || !_currentCourse) return;
    host.textContent = '';

    const preguntas = _preguntasMicro(_currentCourse.id, idx);
    _microOk = !preguntas.length || _microSuperado(_currentCourse.id, lesson.id);
    _gateSiguiente(!_microOk);

    if (!preguntas.length) {
      const p = document.createElement('p');
      p.className = 'lesson-w3__text lesson-w3__text--muted';
      p.textContent = _t('tutorial.quizEmpty', null,
        'Esta lección no tiene micro-quiz. Puedes pasar a la siguiente.');
      host.appendChild(p);
      return;
    }

    if (_microOk) {
      const p = document.createElement('p');
      p.className = 'lw-quiz__done';
      p.textContent = _t('tutorial.quizAlready', null, 'Ya superaste este micro-quiz. ¡Buen trabajo!');
      host.appendChild(p);
    }

    const lanzar = document.createElement('button');
    lanzar.type = 'button';
    lanzar.className = 'btn--primary lw-quiz__start';
    lanzar.textContent = _microOk
      ? _t('tutorial.quizRetry', null, 'Repetir micro-quiz')
      : _t('tutorial.quizStart', null, 'Empezar micro-quiz');
    lanzar.addEventListener('click', () => {
      if (typeof MicroQuiz === 'undefined') return;
      MicroQuiz.render({
        context: { courseId: _currentCourse.id, lessonId: lesson.id, lessonIdx: idx },
        questions: preguntas,
      });
    });
    host.appendChild(lanzar);
  }

  /**
   * Confeti de celebración.
   *
   * Se hace con nodos y CSS en vez de traer una librería: son 30 elementos que
   * viven dos segundos y medio. Con movimiento reducido no se dibuja nada —un
   * estallido de partículas es justo lo que esa preferencia pide evitar—.
   */
  /**
   * Carga `canvas-confetti` la primera vez que hace falta.
   *
   * No se trae en el arranque: son bytes que sólo sirven en el instante de
   * celebrar, y la mayoría de visitas a una lección no llegan a ese instante.
   * jsDelivr ya está permitido en `script-src`, así que no hace falta tocar la
   * CSP.
   */
  let _confetiCargando = null;
  function _cargarConfeti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (_confetiCargando) return _confetiCargando;
    _confetiCargando = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = CONFETI_CDN;
      s.async = true;
      s.onload = () => resolve(window.confetti);
      s.onerror = reject;
      document.head.appendChild(s);
    }).catch(() => null);
    return _confetiCargando;
  }

  function _confeti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* Se pide la librería y, si llega, se usa. Si el CDN falla se cae al
       confeti de CSS, que no depende de la red: la celebración no puede
       quedarse en nada por un recurso externo. */
    void _cargarConfeti().then((confetti) => {
      if (typeof confetti !== 'function') { _confetiCss(); return; }
      const opciones = { spread: 70, startVelocity: 38, ticks: 140, zIndex: 980,
        colors: ['#2EC4B6', '#5DA9E9', '#5eead4'] };
      confetti({ ...opciones, particleCount: 70, origin: { x: .3, y: .7 } });
      confetti({ ...opciones, particleCount: 70, origin: { x: .7, y: .7 } });
    });
  }

  function _confetiCss() {
    const capa = document.createElement('div');
    capa.className = 'lw-confeti';
    capa.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 30; i += 1) {
      const p = document.createElement('i');
      p.style.left = `${Math.random() * 100}%`;
      p.style.animationDelay = `${Math.random() * 0.4}s`;
      p.style.setProperty('--giro', `${Math.random() * 720 - 360}deg`);
      p.style.setProperty('--desvio', `${Math.random() * 120 - 60}px`);
      capa.appendChild(p);
    }
    document.body.appendChild(capa);
    setTimeout(() => capa.remove(), 2600);
  }

  /**
   * Suma el XP del micro-quiz y lo enseña saliendo de la tarjeta de Infy.
   *
   * El XP va por `GamificationService.recordActivity`, que es quien lleva la
   * cuenta, la racha y las insignias: escribir el número por libre dejaría el
   * resto de la gamificación sin enterarse.
   */
  function _premioXp() {
    let ganado = XP_MICRO;
    if (typeof GamificationService !== 'undefined' && GamificationService.recordActivity) {
      try {
        const antes = GamificationService.getXp ? GamificationService.getXp() : null;
        GamificationService.recordActivity('microquiz', { course: _currentCourse?.id });
        if (antes !== null && GamificationService.getXp) {
          // Lo que se muestra es lo que de verdad se sumó, no una cifra fija.
          ganado = GamificationService.getXp() - antes;
        }
      } catch { /* la celebración no puede caerse por esto */ }
    }
    if (ganado <= 0) return;

    const insignia = document.createElement('div');
    insignia.className = 'lw-xp';
    insignia.setAttribute('aria-hidden', 'true');
    insignia.textContent = `+${ganado} XP`;
    (document.querySelector('.lw-infy') || document.body).appendChild(insignia);
    setTimeout(() => insignia.remove(), 2200);
  }

  /** Marca con un brillo la lección que se acaba de abrir. */
  function _brillarDesbloqueada(idx) {
    const item = document.querySelector(`#lesson-sidebar-list [data-lesson-idx="${idx}"]`);
    if (!item) return;
    item.classList.add('is-recien-abierta');
    setTimeout(() => item.classList.remove('is-recien-abierta'), 2400);
  }

  /** Lleva la atención al contenido que conviene releer. */
  function _resaltarContenido() {
    _activarPestana('contenido');
    const objetivo = document.getElementById('lesson-sec-steps')
      || document.getElementById('lesson-sec-desc');
    if (!objetivo) return;
    objetivo.classList.add('is-repaso');
    objetivo.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setTimeout(() => objetivo.classList.remove('is-repaso'), 2600);
  }

  /**
   * Explica un fallo concreto del micro-quiz.
   *
   * Se le manda la pregunta y la opción que eligió, y se le pide que razone
   * por qué ESA no era, sin decir cuál sí. Si el alumno recibe la respuesta
   * hecha, copia y no aprende; el objetivo es que vuelva al texto sabiendo
   * qué mirar.
   */
  async function _diagnosticarFallo(detalle) {
    const txt = document.getElementById('lesson-infy-text');
    if (!txt || typeof GroqService === 'undefined' || !GroqService.chat) return;

    const q = detalle.question || {};
    const lesson = _currentLessons[_currentLessonIdx];

    _pintarInfyLeccion(lesson, 'THINKING',
      _t('tutorial.infyThinking', null, 'Déjame ver por qué no era esa…'));

    const prompt = [
      'Eres Infy, el tutor de IN4MIND. Un estudiante falló esta pregunta.',
      'Explica en español, en menos de 60 palabras y con tono alentador, por qué',
      'la opción que eligió NO es correcta y qué concepto debería repasar.',
      'NO digas cuál es la respuesta correcta: tiene que volver a intentarlo.',
      '',
      `Lección: ${lesson?.title || ''}`,
      `Pregunta: ${q.question || ''}`,
      `Eligió: ${detalle.chosenText || ''}`,
    ].join('\n');

    try {
      const respuesta = await GroqService.chat([{ role: 'user', content: prompt }]);
      if (respuesta) _pintarInfyLeccion(lesson, 'THINKING', respuesta);
    } catch {
      /* Sin IA disponible queda la explicación del temario, que para esto
         sirve igual: el alumno no se queda sin nada. */
      if (q.exp) _pintarInfyLeccion(lesson, 'THINKING', q.exp);
    }
  }

  function _alFallarPregunta(detalle) {
    _resaltarContenido();
    void _diagnosticarFallo(detalle);
  }

  function _alTerminarMicroQuiz(detalle) {
    const lesson = _currentLessons[_currentLessonIdx];
    if (!lesson || !_currentCourse) return;

    const total = detalle.total || 0;
    const pct = total ? Math.round((detalle.bien / total) * 100) : 0;
    const aprobado = pct >= MICRO_APROBADO;

    if (aprobado) {
      _microOk = true;
      // Se guarda la nota, no un «sí»: la regla de aprobado puede cambiar.
      try { localStorage.setItem(_claveMicro(_currentCourse.id, lesson.id), String(pct)); }
      catch { /* sin almacenamiento: el desbloqueo vale para esta sesión */ }

      /* Superar el micro-quiz da la lección por vista. Sin esto el candado de
         la siguiente seguiría echado —`canAccess` pide las dos cosas— y el
         brillo de desbloqueo estaría celebrando algo que no ha pasado.
         Se comprueba antes de llamar porque `_completeLessonProgress` suma XP
         de lección, y no debe contarse dos veces si ya estaba completada. */
      if (!_isLessonComplete(lesson.id)) _completeLessonProgress(pct);

      _gateSiguiente(false);
      _confeti();
      _premioXp();
      _pintarInfyLeccion(lesson, 'SUCCESS',
        _t('tutorial.infyTipPerfect', null, '¡Pleno! La siguiente lección ya está abierta.'));

      // El índice repinta candados y progreso con el nuevo estado.
      _renderLessonSidebar(_currentLessonIdx);
      _pintarProgresoModulo();
      _pintarMapaCalor();
      _brillarDesbloqueada(_currentLessonIdx + 1);
      /* Ésta puede haber sido la última que faltaba: se recomprueba el candado
         de las flashcards y se mira si hay bonus por velocidad. */
      _pintarCandadoFlashcards();
      _bonusVelocidad();
      return;
    }

    /* Fallo: Infy explica y señala qué releer, en vez de dejar al alumno
       delante de un botón apagado sin saber qué hacer. */
    _pintarInfyLeccion(lesson, 'THINKING',
      _t('tutorial.infyTipRetry', { n: detalle.bien, total: detalle.total },
        `${detalle.bien} de ${detalle.total}. Repasa los pasos y vuelve a intentarlo.`));
    _resaltarContenido();
  }

  /** Escapa un valor para meterlo entre comillas dobles en un atributo. */
  function _attr(valor) {
    return String(valor)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _renderLessonArticle(lesson, idx, total) {
    const course = _currentCourse;
    const pct = Math.round(((idx + 1) / total) * 100);
    const levelColor = TutorialData.getLevelColor(lesson.level);
    const desc = lesson.description || lesson.summary || '';
    const reqs = Array.isArray(lesson.requirements) ? lesson.requirements : [lesson.requirements].filter(Boolean);
    const steps = lesson.steps || [];
    const res = lesson.resources || {};
    const videoUrl = res.video?.startsWith('http') ? res.video : null;
    const videoId = videoUrl ? _youtubeVideoId(videoUrl) : null;
    const videoResume = (typeof VideoProgressService !== 'undefined' && course && lesson && videoId)
      ? VideoProgressService.getResumeLabel(course.id, lesson.id, videoId)
      : null;

    const quizModule = typeof CourseCurriculum !== 'undefined'
      ? (CourseCurriculum.getQuizDef(course.id)?.sections?.[idx]?.title || lesson.title)
      : lesson.title;

    const docsUrl = res.docsUrl || '#';
    const docsLabel = res.docs || _t('tutorial.officialDocs', null, 'Documentación oficial');

    const exampleHtml = typeof LessonExamples !== 'undefined'
      ? LessonExamples.buildHtml(lesson, course.id)
      : `<pre class="lesson-w3__code"><code>${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}</code></pre>`;

    const $breadcrumb = document.getElementById('lesson-breadcrumb');
    if ($breadcrumb) {
      $breadcrumb.innerHTML = `
        <a href="tutorial.html">${_t('nav.tutorials', null, 'Cursos')}</a>
        <span aria-hidden="true">›</span>
        <a href="#" id="lesson-bc-course">${course.title}</a>
        <span aria-hidden="true">›</span>
        <span aria-current="page">${lesson.title}</span>`;
      document.getElementById('lesson-bc-course')?.addEventListener('click', e => {
        e.preventDefault();
        _showDetail(course.id);
      });
    }

    const $article = document.getElementById('lesson-article');
    if (!$article) return;

    /* El sandbox de la lección anterior no muere solo al reemplazar el HTML:
       el worker de Python sobrevive al DOM con todo Pyodide cargado dentro, y
       su listener de `message` se queda colgado del window. Hay que cerrarlo
       explícitamente antes de pisar el artículo. */
    _cerrarSandboxes();

    const sandbox = typeof LessonExamples !== 'undefined' && LessonExamples.sandboxSeed
      ? LessonExamples.sandboxSeed(lesson, course.id)
      : null;

    /* La cabecera va fuera del artículo: así título, duración y nivel siguen
       a la vista al cambiar de pestaña, en lugar de desaparecer con el
       contenido. */
    const $head = document.getElementById('lesson-head');
    if ($head) {
      $head.innerHTML = `
        <span class="lesson-w3__module">${lesson.quizModule || lesson.section || _t('tutorial.moduleN', { n: idx + 1 }, `Módulo ${idx + 1}`)}</span>
        <h1 class="lesson-w3__title">${lesson.title}</h1>
        <div class="lw-head__badges">
          <span class="lw-head__badge lw-head__badge--time">
            <span aria-hidden="true">⏱</span> ${lesson.duration || '10 min'}
          </span>
          <span class="lw-head__badge lw-head__badge--level" style="--level-color:${levelColor}">
            ${lesson.level || _defaultLevel()}
          </span>
          <span class="lw-head__badge lw-head__badge--pos">
            ${_t('tutorial.lessonOf', { n: idx + 1, total }, `Lección ${idx + 1} de ${total}`)}
          </span>
        </div>
        <div class="lesson-w3__progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="lesson-w3__progress-fill" style="width:${pct}%"></div>
        </div>`;

      /* El botón sólo aparece si el navegador sabe hablar: uno que no suena
         es peor que no tenerlo. */
      if (typeof LessonReader !== 'undefined' && LessonReader.soportado()) {
        const oir = document.createElement('button');
        oir.type = 'button';
        oir.id = 'lesson-listen';
        oir.className = 'lw-head__listen';
        oir.innerHTML = `<span aria-hidden="true">🔊</span><span class="lw-head__listen-txt"></span>`;
        oir.addEventListener('click', _alternarLectura);
        $head.querySelector('.lw-head__badges')?.appendChild(oir);
        _pintarBotonLectura(false);
      }
    }

    $article.innerHTML = `
      ${videoUrl ? `
      <section class="lesson-w3__video-block" id="lesson-sec-video" aria-labelledby="lesson-video-title">
        <div class="lesson-w3__video-head">
          <h2 class="lesson-w3__video-title" id="lesson-video-title">${_t('tutorial.videoComplementary', null, 'Video complementario')}</h2>
          <span class="lesson-w3__video-badge">${_t('tutorial.videoOptional', null, 'Opcional')}</span>
        </div>
        <p class="lesson-w3__text lesson-w3__text--muted">${_t('tutorial.videoHint', null, 'Puedes ver este video para reforzar la lección o continuar solo con el contenido escrito.')}</p>
        ${videoResume ? `<p class="lesson-w3__video-resume">${videoResume}</p>` : ''}
        <div class="lesson-w3__video-actions">
          <button type="button" class="btn--course lesson-w3__video-btn" id="lesson-video-toggle"
                  aria-expanded="false" aria-controls="lesson-video-frame">${_t('tutorial.showVideo', null, '▶ Ver video')}</button>
          <a class="lesson-w3__video-ext" href="${videoUrl}" target="_blank" rel="noopener noreferrer">${_t('tutorial.openYoutube', null, 'Abrir en YouTube')}</a>
        </div>
        <div class="lesson-w3__video-frame" id="lesson-video-frame" hidden></div>
      </section>` : ''}

      <section class="lesson-w3__block" id="lesson-sec-desc">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">1</span> ${_t('tutorial.sectionDesc', null, 'Descripción')}</h2>
        <p class="lesson-w3__text">${desc}</p>
      </section>

      <section class="lesson-w3__block" id="lesson-sec-level">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">2</span> ${_t('tutorial.sectionLevel', null, 'Nivel')}</h2>
        <div class="lesson-w3__level-scale" style="--level-color:${levelColor}">${_levelScaleHtml(lesson.level)}</div>
        <p class="lesson-w3__text lesson-w3__text--muted">${_t('tutorial.levelLesson', null, 'Nivel de esta lección:')} <strong style="color:${levelColor}">${lesson.level || _defaultLevel()}</strong></p>
      </section>

      <section class="lesson-w3__block" id="lesson-sec-req">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">3</span> ${_t('tutorial.sectionReqs', null, 'Requisitos')}</h2>
        <ul class="lesson-w3__list">
          ${reqs.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </section>

      <section class="lesson-w3__block" id="lesson-sec-steps">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">4</span> ${_t('tutorial.sectionSteps', null, 'Tutorial paso a paso')}</h2>
        <ol class="lesson-w3__steps">
          ${steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </section>

      <div class="lesson-w3__example" id="lesson-sec-example">
        <div class="lesson-w3__example-head">
          <span>${_t('tutorial.example', null, 'Ejemplo')}</span>
          <button type="button" class="lesson-w3__try-btn" id="lesson-try-btn">${_t('tutorial.trySteps', null, 'Probar pasos')}</button>
        </div>
        <div class="lesson-w3__example-body">${exampleHtml}</div>
      </div>

      ${sandbox ? `
      <section class="lesson-w3__block" id="lesson-sec-sandbox">
        <h2 class="lesson-w3__block-title">${_t('tutorial.sectionPractice', null, 'Practica aquí')}</h2>
        <p class="lesson-w3__text lesson-w3__text--muted">${_t('tutorial.practiceHint', null, 'Edita el código y pulsa Ejecutar. Si algo falla, Infy te explica por qué.')}</p>
        <div data-sandbox="${sandbox.lenguaje}" data-sandbox-activa="${sandbox.activo}"
             data-sandbox-inicial="${_attr(JSON.stringify(sandbox.inicial))}"></div>
      </section>` : ''}

      <section class="lesson-w3__block" id="lesson-sec-resources">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">5</span> ${_t('tutorial.additionalResources', null, 'Recursos adicionales')}</h2>
        <ul class="lesson-w3__resources">
          ${videoUrl ? `
          <li>
            <span class="lesson-w3__res-icon" aria-hidden="true">▶</span>
            <div>
              <strong>${_t('tutorial.explanatoryVideo', null, 'Video explicativo')}</strong>
              <span class="lesson-w3__res-actions">
                <button type="button" class="lesson-w3__res-play" id="lesson-video-play-inline">${_t('tutorial.playVideoHere', null, 'Reproducir aquí')}</button>
                <span class="tut-video-actions__sep" aria-hidden="true">·</span>
                <a class="lesson-w3__res-yt" href="${videoUrl}" target="_blank" rel="noopener noreferrer">${_t('tutorial.openYoutube', null, 'Abrir en YouTube')}</a>
              </span>
            </div>
          </li>` : ''}
          <li>
            <span class="lesson-w3__res-icon" aria-hidden="true">📄</span>
            <div>
              <strong>${_t('tutorial.officialDocs', null, 'Documentación oficial')}</strong>
              <a href="${docsUrl}" target="_blank" rel="noopener noreferrer">${docsLabel}</a>
            </div>
          </li>
        </ul>
      </section>

      ${lesson.tip ? `
      <aside class="lesson-w3__note">
        <strong>${_t('tutorial.noteLabel', null, 'Nota:')}</strong> ${lesson.tip}
      </aside>` : ''}

      <aside class="lesson-w3__cert">
        <strong>${_t('tutorial.certTitle', null, 'Certificación profesional')}:</strong>
        ${_t('tutorial.certBlock', {
          lessonMin: UserProfileService?.LESSON_EXAM_UNLOCK_AVG || 80,
          quizMin: UserProfileService?.QUIZ_UNLOCK_EXAM_PCT || 70,
          examMin: UserProfileService?.EXAM_CERT_MIN_PCT || 80,
          module: quizModule,
        }, `Para certificarte necesitas: lecciones ≥${UserProfileService?.LESSON_EXAM_UNLOCK_AVG || 80}% de promedio, quiz ≥${UserProfileService?.QUIZ_UNLOCK_EXAM_PCT || 70}% y examen ≥${UserProfileService?.EXAM_CERT_MIN_PCT || 80}%. Este módulo («${quizModule}») se evalúa en el`)}
        <button type="button" class="lesson-w3__cert-link" id="lesson-cert-quiz-link">${_t('tutorial.certQuizLink', { course: course.title }, `quiz de ${course.title}`)}</button>.
      </aside>

      <section class="lesson-w3__block" id="lesson-notes-section">
        <h2 class="lesson-w3__block-title">${_t('tutorial.myNotes', null, 'Mis notas')}</h2>
        <textarea class="lesson-w3__notes" id="lesson-notes-input" rows="4"
          placeholder="${_t('tutorial.notesPlaceholder', null, 'Escribe tus apuntes de esta lección…')}"></textarea>
        <div class="lesson-w3__rating">
          <span>${_t('tutorial.wasUseful', null, '¿Te fue útil?')}</span>
          <button type="button" class="lesson-rating-btn" data-rating="1" aria-label="${_t('tutorial.thumbsUp', null, 'Útil')}">👍</button>
          <button type="button" class="lesson-rating-btn" data-rating="0" aria-label="${_t('tutorial.thumbsDown', null, 'No útil')}">👎</button>
        </div>
      </section>`;

    /* Orden importante: primero se reparten los bloques en sus pestañas y
       luego se monta el sandbox, para que CodeMirror mida sobre su sitio
       definitivo. Mover un nodo conserva sus listeners, así que todo lo que
       se engancha más abajo por `getElementById` sigue encontrándose. */
    _ligarPestanas();
    _repartirPestanas();
    /* El checkpoint se monta DESPUÉS de repartir: mide qué bloques quedan tras
       los pasos para esconderlos, y si se montara antes se llevaría por
       delante el ejemplo y las notas, que acaban en otras pestañas y se
       quedarían ocultos allí. */
    _montarCheckpoint(lesson);
    _montarProfundizar(lesson);
    /* El glosario va al final del pintado: parte nodos de texto en tres, y
       hacerlo antes dejaría al checkpoint midiendo un árbol que ya cambió. */
    if (typeof LessonGlossary !== 'undefined') {
      LessonGlossary.aplicar(document.getElementById('lesson-article'));
    }
    _activarPestana('contenido');

    /* El auto-arranque de CodeSandbox sólo corre en DOMContentLoaded, y este
       artículo se pinta mucho después y otra vez por cada lección. */
    if (sandbox && typeof CodeSandbox !== 'undefined') CodeSandbox.init();

    _pintarProgresoModulo();
    _pintarMapaCalor();
    _pintarCandadoFlashcards();
    _pintarInfyLeccion(lesson);
    _montarMicroQuiz(lesson, idx);

    document.getElementById('lesson-try-btn')?.addEventListener('click', () => {
      document.getElementById('lesson-sec-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('lesson-cert-quiz-link')?.addEventListener('click', _goToCourseQuiz);
    if (videoUrl) _bindLessonVideoToggle(videoUrl);

    if (typeof LessonNotesService !== 'undefined' && course && lesson) {
      const notesEl = document.getElementById('lesson-notes-input');
      if (notesEl) {
        notesEl.value = LessonNotesService.getNote(course.id, lesson.id);
        notesEl.addEventListener('input', () => {
          LessonNotesService.saveNote(course.id, lesson.id, notesEl.value);
        });
      }
      const rating = LessonNotesService.getRating(course.id, lesson.id);
      document.querySelectorAll('.lesson-rating-btn').forEach(btn => {
        if (parseInt(btn.dataset.rating, 10) === rating) btn.classList.add('is-active');
        btn.addEventListener('click', () => {
          document.querySelectorAll('.lesson-rating-btn').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          LessonNotesService.setRating(course.id, lesson.id, parseInt(btn.dataset.rating, 10));
        });
      });
    }
  }

  function _showLesson(idx, opts = {}) {
    if (!_currentLessons.length || idx < 0 || idx >= _currentLessons.length) return;

    // Cierra el timer del video de la lección anterior antes de cambiar estado.
    try { _stopVideoWatch(_videoMeta()); } catch { /* ignore */ }

    _currentLessonIdx = idx;
    const lesson = _currentLessons[idx];
    const total = _currentLessons.length;

    try {
      if (_currentCourse?.id) sessionStorage.setItem('in4mind_open_course', _currentCourse.id);
      sessionStorage.setItem('in4mind_open_lesson', lesson?.title || lesson?.id || String(idx + 1));
    } catch { /* ignore */ }

    // El cronómetro sólo corre con la lección abierta y la pestaña visible.
    if (typeof StudyTimeService !== 'undefined' && _currentCourse) {
      StudyTimeService.start(_currentCourse.id);
    }

    _renderLessonSidebar(idx);
    _renderLessonArticle(lesson, idx, total);

    const prevBtn = document.getElementById('lesson-prev');
    const nextBtn = document.getElementById('lesson-next');
    const quizBtn = document.getElementById('lesson-quiz-btn');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) {
      const isLast = idx === total - 1;
      const nextIdx = idx + 1;
      const nextLocked = !isLast && !canAccess(nextIdx);
      nextBtn.disabled = false;
      nextBtn.setAttribute('aria-disabled', nextLocked ? 'true' : 'false');
      nextBtn.classList.toggle('is-locked', nextLocked);
      /* El micro-quiz se monta dentro de `_renderLessonArticle`, que corre
         antes que esto: sin volver a aplicarlo aquí, el `disabled = false` de
         arriba borraría el candado recién puesto. */
      _gateSiguiente(_microBloquea());
      const baseLabel = isLast
        ? _t('tutorial.finishCourse', null, 'Finalizar curso')
        : _t('tutorial.next', null, 'Siguiente →');
      nextBtn.textContent = nextLocked ? `🔒 ${baseLabel}` : baseLabel;
    }
    if (quizBtn) quizBtn.textContent = _t('tutorial.quizLabel', { course: _currentCourse.title }, `Quiz: ${_currentCourse.title}`);

    $listView.style.display = 'none';
    $detailView.style.display = 'none';
    $lessonView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    _publishShareContext('lesson');
    _syncDeepLinkUrl();

    if (opts.autoplayVideo && lesson.resources?.video?.startsWith('http')) {
      requestAnimationFrame(() => _openInlineVideo(lesson.resources.video, true));
    }
  }

  /**
   * Refleja la vista actual en la barra de direcciones sin recargar, para que
   * copiar la URL o recargar lleve al mismo sitio.
   */
  function _syncDeepLinkUrl() {
    if (typeof ShareService === 'undefined') return;
    const url = ShareService.buildUrl();
    if (url && url !== window.location.href) {
      window.history.replaceState({}, '', url);
    }
  }

  function _setActionButtonState(kind, active) {
    const isFav = kind === 'fav';
    const btn = document.getElementById(isFav ? 'btn-fav' : 'btn-save');
    const label = document.getElementById(isFav ? 'btn-fav-label' : 'btn-save-label');
    if (!btn) return;

    btn.classList.toggle('tut-action-btn--active', active);
    btn.classList.toggle('tut-action-btn--fav', isFav && active);
    btn.classList.toggle('tut-action-btn--save', !isFav && active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute(
      'aria-label',
      isFav
        ? (active ? _t('tutorial.removeFavorite', null, 'Quitar de favoritos') : _t('tutorial.addFavorite', null, 'Agregar a favoritos'))
        : (active ? _t('common.saved', null, 'Quitar de guardados') : _t('tutorial.saveCourse', null, 'Guardar curso'))
    );

    if (label) {
      label.textContent = isFav
        ? (active ? _t('common.favorites', null, 'Favoritos') : _t('common.favorite', null, 'Favorito'))
        : (active ? _t('common.saved', null, 'Guardado') : _t('common.save', null, 'Guardar'));
    }
  }

  async function _syncActionButtons() {
    if (!_currentCourse || typeof UserProfileService === 'undefined') return;
    const item = UserProfileService.buildCourseItem(_currentCourse);
    try {
      const [fav, saved] = await Promise.all([
        UserProfileService.isFavorite(item.refId, item.type),
        UserProfileService.isSaved(item.refId, item.type),
      ]);
      _setActionButtonState('fav', fav);
      _setActionButtonState('save', saved);
    } catch (err) {
      console.error('_syncActionButtons:', err);
      _setActionButtonState('fav', false);
      _setActionButtonState('save', false);
    }
  }

  async function _toggleFavorite(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!_currentCourse) return;
    if (typeof UserProfileService === 'undefined') return;
    if (!UserProfileService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    const item = UserProfileService.buildCourseItem(_currentCourse);
    try {
      const active = await UserProfileService.toggleFavorite(item);
      _setActionButtonState('fav', active);
      AppShell.showToast(active
        ? _t('tutorial.addFavorite', null, '❤ Agregado a favoritos en tu perfil')
        : _t('tutorial.removeFavorite', null, 'Eliminado de favoritos'));
    } catch (err) {
      console.error('_toggleFavorite:', err);
    }
  }

  async function _toggleSaved(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!_currentCourse) return;
    if (typeof UserProfileService === 'undefined') return;
    if (!UserProfileService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    const item = UserProfileService.buildCourseItem(_currentCourse);
    try {
      const active = await UserProfileService.toggleSaved(item);
      _setActionButtonState('save', active);
      AppShell.showToast(active
        ? _t('tutorial.saveCourse', null, '🔖 Guardado en tu perfil')
        : _t('common.delete', null, 'Eliminado de guardados'));
    } catch (err) {
      console.error('_toggleSaved:', err);
    }
  }

  function init() {
    $listView    = document.getElementById('tutorial-list-view');
    $detailView  = document.getElementById('tutorial-detail-view');
    $lessonView  = document.getElementById('tutorial-lesson-view');
    $filtersWrap  = document.getElementById('tut-filters');
    $tutGrid     = document.getElementById('tut-grid');
    $searchInput = document.getElementById('search-input');

    _renderFilters();
    _renderGrid();

    /* El aviso de repaso llega cuando la página ya está quieta: soltarlo
       durante el arranque compite con todo lo demás que aparece. */
    setTimeout(_avisarRepasos, 2500);

    /* El micro-quiz vive en su propio componente y avisa por evento; aquí se
       decide qué significa ese resultado para la lección. */
    window.addEventListener('in4mind-microquiz-done', (ev) => {
      try { _alTerminarMicroQuiz(ev.detail || {}); }
      catch (err) {
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('microquiz_done', { message: err?.message || String(err) });
        }
      }
    });

    /* Infy pone cara de estar leyendo mientras suena la voz, y vuelve a su
       consejo al acabar: el avatar dice de un vistazo si sigue hablando. */
    if (typeof LessonReader !== 'undefined' && LessonReader.onCambio) {
      LessonReader.onCambio((estado) => {
        const leyendo = estado === 'leyendo';
        _pintarBotonLectura(leyendo);
        const lesson = _currentLessons[_currentLessonIdx];
        if (leyendo) {
          _pintarInfyLeccion(lesson, 'LEARNING',
            _t('tutorial.listening', null, 'Te estoy leyendo la lección…'));
        } else if (lesson) {
          _pintarInfyLeccion(lesson);
        }
      });
    }

    window.addEventListener('in4mind-microquiz-wrong', (ev) => {
      try { _alFallarPregunta(ev.detail || {}); }
      catch (err) {
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('microquiz_wrong', { message: err?.message || String(err) });
        }
      }
    });

    document.getElementById('tut-btn-back')?.addEventListener('click', _showList);
    document.getElementById('lesson-btn-back')?.addEventListener('click', () => {
      if (_currentCourse) _showDetail(_currentCourse.id);
    });

    document.getElementById('btn-more')?.addEventListener('click', () => {
      const extra = document.getElementById('about-extra');
      const btn = document.getElementById('btn-more');
      const hidden = extra.style.display === 'none';
      extra.style.display = hidden ? 'block' : 'none';
      btn.textContent = hidden ? _t('tutorial.readLess', null, 'Leer Menos') : _t('tutorial.readMore', null, 'Leer Más');
    });

    document.getElementById('btn-fav')?.addEventListener('click', _toggleFavorite);
    document.getElementById('btn-save')?.addEventListener('click', _toggleSaved);

    if (typeof UserProfileService !== 'undefined') {
      window.addEventListener(UserProfileService.EVENT, () => {
        if (_currentCourse) _syncActionButtons();
      });
    }

    document.getElementById('tut-detail-start')?.addEventListener('click', () => {
      if (_currentLessons.length) _showLesson(0);
      else if (_currentCourse) _showDetail(_currentCourse.id, true);
    });

    document.getElementById('tut-banner-btn')?.addEventListener('click', () => {
      const first = DataService.getCourses()[0];
      if (first) _showDetail(first.id, true);
    });

    document.getElementById('lesson-prev')?.addEventListener('click', () => _requestShowLesson(_currentLessonIdx - 1));
    document.getElementById('lesson-next')?.addEventListener('click', () => {
      /* Antes que nada: si el micro-quiz de ESTA lección sigue sin superarse,
         no se avanza. Se dice por qué y se abre la pestaña donde resolverlo,
         en lugar de dejar al alumno pulsando un botón que no reacciona. */
      if (_microBloquea()) {
        if (typeof AppShell !== 'undefined') {
          AppShell.showToast(_t('tutorial.gateHint', null, 'Supera el micro-quiz para continuar.'));
        }
        _activarPestana('quiz');
        document.getElementById('lwtab-quiz')?.focus();
        return;
      }

      const isLast = _currentLessonIdx >= _currentLessons.length - 1;
      const nextIdx = _currentLessonIdx + 1;
      // Si la siguiente está bloqueada, avisar; el check de esta lección sigue para poder desbloquearla.
      if (!isLast && !canAccess(nextIdx)) {
        _toastLessonLocked();
      }
      _showLessonCheck(async () => {
        if (_currentLessonIdx < _currentLessons.length - 1) {
          if (canAccess(nextIdx)) {
            _showLesson(nextIdx);
          } else {
            _toastLessonLocked();
          }
        } else if (_currentCourse) {
          _showDetail(_currentCourse.id);
          try {
            const stats = await UserProfileService?.getCourseLessonStats(_currentCourse.id, _currentLessons.length);
            if (stats?.unlocked) {
              AppShell.showToast(_t('tutorial.finishCourse', null, '¡Curso completado! Ya puedes presentar el examen de certificación.'));
            } else {
              AppShell.showToast(_t('tutorial.quickCheckSub', null, 'Lección final registrada. Sigue practicando para alcanzar el 80% de promedio.'));
            }
          } catch {
            AppShell.showToast(_t('tutorial.quickCheckSub', null, 'Lección final registrada.'));
          }
        }
      });
    });

    document.getElementById('lesson-check-cancel')?.addEventListener('click', _hideLessonCheck);

    document.getElementById('lesson-sidebar-toggle')?.addEventListener('click', () => {
      _setLessonSidebar(
        !document.getElementById('lesson-sidebar')?.classList.contains('lesson-w3__sidebar--open')
      );
    });

    // El botón que abre el índice está en `.lesson-w3__main`, que el panel tapa
    // al abrirse; sin estas dos salidas no había forma de cerrarlo en móvil.
    document.getElementById('lesson-sidebar-overlay')
      ?.addEventListener('click', () => _setLessonSidebar(false));

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (document.getElementById('lesson-sidebar')?.classList.contains('lesson-w3__sidebar--open')) {
        _setLessonSidebar(false);
      }
    });

    // Al pasar a escritorio el panel vuelve a ser una columna del grid, pero el
    // `overflow: hidden` del cuerpo seguiría puesto y dejaría la página
    // bloqueada sin nada visible que lo explicara.
    window.matchMedia('(max-width: 700px)').addEventListener('change', e => {
      if (!e.matches) _setLessonSidebar(false);
    });

    document.getElementById('lesson-quiz-btn')?.addEventListener('click', _goToCourseQuiz);

    $searchInput?.addEventListener('input', () => {
      clearTimeout(_searchTimeout);
      _searchTimeout = setTimeout(() => _renderGrid($searchInput.value), 300);
    });
    $searchInput?.addEventListener('keydown', e => {
      if (e.key === 'Escape') { $searchInput.value = ''; _renderGrid(); }
    });

    const pending = sessionStorage.getItem('in4mind_open_course');
    const params = new URLSearchParams(window.location.search);
    const previewCourse = params.get('course') || pending;

    if (params.get('preview') === '1') {
      document.body.classList.add('tutorial-preview-mode');
      const banner = document.createElement('div');
      banner.className = 'tutorial-preview-banner';
      banner.innerHTML = `<p>${_t('tutorial.previewBanner', null, 'Vista previa —')} <a href="login.html">${_t('landing.start', null, 'Comenzar')}</a> ${_t('tutorial.previewBannerEnd', null, 'para guardar progreso.')}</p>`;
      document.querySelector('.main-area')?.prepend(banner);
    }

    if (previewCourse) {
      const lessonFromSession = sessionStorage.getItem('in4mind_open_lesson');
      sessionStorage.removeItem('in4mind_open_course');
      sessionStorage.removeItem('in4mind_open_lesson');
      if (typeof AuthGuard !== 'undefined' && AuthGuard.clearPendingRedirect) {
        AuthGuard.clearPendingRedirect();
      }
      _showDetail(previewCourse);

      // Enlace compartido a una lección concreta: ?course=python&lesson=3
      const lessonParam = parseInt(params.get('lesson') || lessonFromSession, 10);
      if (Number.isInteger(lessonParam) && lessonParam >= 1) {
        const wanted = Math.min(lessonParam, _currentLessons.length) - 1;
        const accessible = _clampAccessibleLesson(wanted);
        if (accessible !== wanted) _toastLessonLocked();
        _showLesson(accessible);
      } else {
        _syncDeepLinkUrl();
      }
    }

    window.addEventListener('in4mind-relocalize', _relocalize);
  }

  return { init, canAccess };

})();

if (typeof module !== 'undefined') module.exports = TutorialController;
