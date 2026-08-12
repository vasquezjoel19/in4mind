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
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.lessonIdx, 10);
        if (!isNaN(idx)) _showLesson(idx);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const idx = parseInt(el.dataset.lessonIdx, 10);
          if (!isNaN(idx)) _showLesson(idx);
        }
      });
    });
    document.querySelectorAll('[data-lesson-video]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.lessonVideo, 10);
        if (!isNaN(idx)) _showLesson(idx, { autoplayVideo: true });
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
          <span>${progressPct}%</span>
        </div>
        <div class="tut-cert-panel__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPct}">
          <div class="tut-cert-panel__bar-fill" style="width:${progressPct}%"></div>
        </div>
      </div>
      <div class="tut-cert-panel__actions">
        <button type="button" class="btn--primary tut-btn-learn" id="tut-cert-exam-btn">
          ${hasCert ? _t('tutorial.btnViewCert', null, 'Ver certificado en perfil') : examUnlocked ? _t('tutorial.btnGoExam', null, 'Ir al examen de certificación') : _t('tutorial.btnExamBlocked', null, 'Examen bloqueado')}
        </button>
        <button type="button" class="btn--course" id="tut-cert-quiz-btn">${_t('tutorial.btnPracticeQuiz', { min: quizMin }, `Quiz de práctica (≥${quizMin}%)`)}</button>
      </div>`;

    document.getElementById('tut-cert-exam-btn')?.addEventListener('click', () => {
      if (hasCert) {
        window.location.href = 'profile.html';
        return;
      }
      void _goToCertExam();
    });
    document.getElementById('tut-cert-quiz-btn')?.addEventListener('click', _goToCourseQuiz);
  }

  function _showList() {
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
      return `
        <button type="button" class="lesson-w3__nav-item ${i === activeIdx ? 'lesson-w3__nav-item--active' : ''} ${done ? 'lesson-w3__nav-item--done' : ''}"
                data-lesson-idx="${i}">
          <span class="lesson-w3__nav-num">${i + 1}</span>
          <span class="lesson-w3__nav-text">${l.title}</span>
          ${done ? '<span class="lesson-w3__nav-check" aria-hidden="true">✓</span>' : ''}
        </button>`;
    }).join('');

    $list.querySelectorAll('[data-lesson-idx]').forEach(btn => {
      btn.addEventListener('click', () => _showLesson(parseInt(btn.dataset.lessonIdx, 10)));
    });

    const $quizLink = document.getElementById('lesson-sidebar-quiz');
    if ($quizLink) {
      $quizLink.onclick = (e) => {
        e.preventDefault();
        _goToCourseQuiz();
      };
    }
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

    $article.innerHTML = `
      <header class="lesson-w3__header">
        <span class="lesson-w3__module">${lesson.quizModule || lesson.section || _t('tutorial.moduleN', { n: idx + 1 }, `Módulo ${idx + 1}`)}</span>
        <h1 class="lesson-w3__title">${lesson.title}</h1>
        <div class="lesson-w3__meta">
          <span class="lesson-w3__duration">${lesson.duration || '10 min'}</span>
          <span class="lesson-w3__meta-sep">·</span>
          <span>${_t('tutorial.lessonOf', { n: idx + 1, total }, `Lección ${idx + 1} de ${total}`)}</span>
        </div>
        <div class="lesson-w3__progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="lesson-w3__progress-fill" style="width:${pct}%"></div>
        </div>
      </header>

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

    _renderLessonSidebar(idx);
    _renderLessonArticle(lesson, idx, total);

    const prevBtn = document.getElementById('lesson-prev');
    const nextBtn = document.getElementById('lesson-next');
    const quizBtn = document.getElementById('lesson-quiz-btn');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.textContent = idx === total - 1
        ? _t('tutorial.finishCourse', null, 'Finalizar curso')
        : _t('tutorial.next', null, 'Siguiente →');
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

    document.getElementById('lesson-prev')?.addEventListener('click', () => _showLesson(_currentLessonIdx - 1));
    document.getElementById('lesson-next')?.addEventListener('click', () => {
      _showLessonCheck(async () => {
        if (_currentLessonIdx < _currentLessons.length - 1) {
          _showLesson(_currentLessonIdx + 1);
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
      const sidebar = document.getElementById('lesson-sidebar');
      const btn = document.getElementById('lesson-sidebar-toggle');
      const open = sidebar?.classList.toggle('lesson-w3__sidebar--open');
      btn?.setAttribute('aria-expanded', String(Boolean(open)));
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
      sessionStorage.removeItem('in4mind_open_course');
      _showDetail(previewCourse);

      // Enlace compartido a una lección concreta: ?course=python&lesson=3
      const lessonParam = parseInt(params.get('lesson'), 10);
      if (Number.isInteger(lessonParam) && lessonParam >= 1) {
        _showLesson(Math.min(lessonParam, _currentLessons.length) - 1);
      }
    }

    window.addEventListener('in4mind-relocalize', _relocalize);
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = TutorialController;
