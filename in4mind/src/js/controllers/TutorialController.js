/**
 * IN4MIND — TutorialController
 * Listado, detalle de curso y lecciones interactivas.
 */

'use strict';

const TutorialController = (() => {

  const CATEGORIES = [
    { id: 'all',         label: 'Todos'        },
    { id: 'web',         label: 'Web'          },
    { id: 'programming', label: 'Programación' },
    { id: 'design',      label: 'Diseño'       },
    { id: 'office',      label: 'Office'       },
    { id: 'data',        label: 'Datos'            },
    { id: 'security',    label: 'Ciberseguridad'   },
    { id: 'tools',       label: 'Herramientas'     },
  ];

  let _activeFilter = 'all';
  let _currentCourse = null;
  let _currentLessons = [];
  let _currentLessonIdx = 0;
  let _searchTimeout = null;
  let _lessonCheckAttempts = 0;
  let _lessonCheckSelected = -1;
  let _lessonCheckCallback = null;

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
    $filtersWrap.innerHTML = CATEGORIES.map(cat => `
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

  function _renderGrid(query = '') {
    let courses = DataService.getCourses(query);
    if (_activeFilter !== 'all') {
      courses = courses.filter(c => c.category === _activeFilter);
    }

    $tutGrid.innerHTML = courses.length
      ? courses.map((c, i) => {
          const data = TutorialData.getCourseData(c.id);
          const count = data?.tutorials ?? 5;
          const catLabel = TutorialData.getCategoryLabel(c.category);
          return `
          <article class="tut-grid-card anim-fade-up delay-${Math.min(i + 1, 6)}"
                   data-course-id="${c.id}" role="button" tabindex="0"
                   aria-label="Ver tutoriales de ${c.title}">
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
              <span class="tut-tag">${count} lecciones</span>
              <span class="tut-tag tut-tag--quiz">${data?.quizzes ?? 2} quizzes</span>
            </div>
            <div class="tut-grid-card__footer">
              <span class="tut-grid-card__meta"><span class="tut-star" aria-hidden="true">★</span> ${data?.rating ?? '4.7'}</span>
              <button type="button" class="btn--course" data-course-id="${c.id}">Ver</button>
            </div>
          </article>`;
        }).join('')
      : `<p class="tut-empty">Sin resultados para este filtro.</p>`;

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

  function _renderVideoCover(videoTitle, idx, course, lessonIdx, sectionLabel) {
    const thumbClass = `tut-thumb--${(idx % 4) + 1}`;
    return `
      <article class="tut-video-card" data-lesson-idx="${lessonIdx}" tabindex="0" role="button"
               aria-label="Abrir apartado ${videoTitle}">
        <div class="tut-thumb ${thumbClass}">
          <img class="tut-thumb__logo" src="${course.icon}" alt="" width="36" height="36" loading="lazy">
          <span class="tut-badge">Apartado ${idx + 1}</span>
          <span class="tut-thumb__title">${videoTitle}</span>
          <span class="tut-thumb__sub">${sectionLabel}</span>
        </div>
        <p class="tut-card__label">${videoTitle}</p>
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
      && UserProfileService.getLessonProgress(course.id)[lesson.id];
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
          <p class="tut-lesson-card__video">${lesson.video}</p>
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
  }

  function _goToCourseQuiz() {
    if (!_currentCourse) {
      window.location.href = 'quizzes.html';
      return;
    }
    sessionStorage.setItem('in4mind_open_quiz', _currentCourse.id);
    window.location.href = 'quizzes.html';
  }

  function _goToCertExam() {
    if (!_currentCourse) return;
    if (typeof UserProfileService === 'undefined') return;
    if (!UserProfileService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    const stats = UserProfileService.getCertificationRequirements(_currentCourse.id, _currentLessons.length);
    if (!stats.examUnlocked) {
      const parts = [];
      if (!stats.lessonStats.unlocked) {
        parts.push(`lecciones con promedio ≥${stats.lessonMinAvg}%`);
      }
      if (!stats.quizPassed) {
        parts.push(`quiz ≥${stats.quizMinPct}% (actual ${stats.quizPct}%)`);
      }
      AppShell.showToast(`Completa: ${parts.join(' y ')} para desbloquear el examen.`);
      return;
    }
    sessionStorage.setItem('in4mind_open_exam', _currentCourse.id);
    window.location.href = 'quizzes.html';
  }

  function _isLessonComplete(lessonId) {
    if (!_currentCourse || typeof UserProfileService === 'undefined') return false;
    return Boolean(UserProfileService.getLessonProgress(_currentCourse.id)[lessonId]);
  }

  function _hideLessonCheck() {
    const overlay = document.getElementById('lesson-check');
    if (overlay) overlay.hidden = true;
    _lessonCheckCallback = null;
    _lessonCheckSelected = -1;
    _lessonCheckAttempts = 0;
  }

  function _completeLessonProgress(scorePct) {
    if (!_currentCourse || typeof UserProfileService === 'undefined') return;
    const lesson = _currentLessons[_currentLessonIdx];
    if (!lesson) return;
    if (!UserProfileService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    UserProfileService.saveLessonProgress(_currentCourse.id, lesson.id, scorePct, {
      title: lesson.title,
    });
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

    const overlay = document.getElementById('lesson-check');
    const $q = document.getElementById('lesson-check-question');
    const $opts = document.getElementById('lesson-check-options');
    const $feedback = document.getElementById('lesson-check-feedback');
    const $submit = document.getElementById('lesson-check-submit');

    if (!overlay || !$q || !$opts) {
      onSuccess?.();
      return;
    }

    $q.textContent = check.q;
    $feedback.textContent = '';
    $submit.disabled = true;
    $submit.textContent = 'Confirmar';

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
          $submit.textContent = 'Continuar →';
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
          $feedback.textContent = 'Selecciona otra respuesta.';
          $submit.textContent = 'Confirmar';
          bindSubmit();
        }, 900);
      };
    };

    bindSubmit();

    overlay.hidden = false;
  }

  function _renderCertPanel() {
    const panel = document.getElementById('tut-cert-panel');
    if (!panel || !_currentCourse) return;

    const total = _currentLessons.length;
    const req = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCertificationRequirements(_currentCourse.id, total)
      : null;
    const stats = req?.lessonStats || { completed: 0, total, avg: 0, unlocked: false };
    const hasCert = typeof UserProfileService !== 'undefined'
      && UserProfileService.hasExamCertification(_currentCourse.id);
    const progressPct = total ? Math.round((stats.completed / total) * 100) : 0;
    const lessonMin = req?.lessonMinAvg ?? 80;
    const quizMin = req?.quizMinPct ?? 70;
    const examMin = req?.examMinPct ?? 80;
    const quizPct = req?.quizPct ?? 0;
    const examUnlocked = req?.examUnlocked ?? false;

    let badgeClass = 'tut-cert-panel__badge';
    let badgeText = 'En progreso';
    if (hasCert) {
      badgeClass += ' tut-cert-panel__badge--earned';
      badgeText = 'Certificado obtenido';
    } else if (examUnlocked) {
      badgeClass += ' tut-cert-panel__badge--unlocked';
      badgeText = 'Examen disponible';
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
          <h2 class="tut-cert-panel__title">Certificación profesional</h2>
          <p class="tut-cert-panel__desc">
            Para certificarte debes cumplir tres requisitos en orden: completar lecciones, aprobar el quiz y aprobar el examen práctico.
          </p>
          ${certModules.length ? `<p class="tut-cert-panel__modules">Módulos: ${certModules.join(' · ')}</p>` : ''}
        </div>
        <span class="${badgeClass}">${badgeText}</span>
      </div>
      <ol class="tut-cert-steps">
        ${step(stats.unlocked, `Lecciones: ${stats.completed}/${stats.total} con promedio ≥${lessonMin}% (actual ${stats.avg}%)`)}
        ${step(req?.quizPassed, `Quiz de práctica: ≥${quizMin}% (tu mejor ${quizPct}%)`)}
        ${step(hasCert, `Examen final: ≥${examMin}% para certificación profesional`)}
      </ol>
      <div class="tut-cert-panel__stats">
        <div class="tut-cert-stat">
          <span class="tut-cert-stat__label">Lecciones</span>
          <span class="tut-cert-stat__val">${stats.completed}/${stats.total}</span>
        </div>
        <div class="tut-cert-stat">
          <span class="tut-cert-stat__label">Promedio</span>
          <span class="tut-cert-stat__val">${stats.avg}%</span>
        </div>
        <div class="tut-cert-stat">
          <span class="tut-cert-stat__label">Quiz</span>
          <span class="tut-cert-stat__val">${quizPct}%</span>
        </div>
      </div>
      <div class="tut-cert-panel__bar-wrap">
        <div class="tut-cert-panel__bar-label">
          <span>Progreso del curso</span>
          <span>${progressPct}%</span>
        </div>
        <div class="tut-cert-panel__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progressPct}">
          <div class="tut-cert-panel__bar-fill" style="width:${progressPct}%"></div>
        </div>
      </div>
      <div class="tut-cert-panel__actions">
        <button type="button" class="btn--primary tut-btn-learn" id="tut-cert-exam-btn"
                ${examUnlocked && !hasCert ? '' : 'disabled'}>
          ${hasCert ? 'Ver certificado en perfil' : examUnlocked ? 'Ir al examen de certificación' : 'Examen bloqueado'}
        </button>
        <button type="button" class="btn--course" id="tut-cert-quiz-btn">Quiz de práctica (≥${quizMin}%)</button>
      </div>`;

    document.getElementById('tut-cert-exam-btn')?.addEventListener('click', () => {
      if (hasCert) window.location.href = 'profile.html';
      else _goToCertExam();
    });
    document.getElementById('tut-cert-quiz-btn')?.addEventListener('click', _goToCourseQuiz);
  }

  function _showList() {
    $lessonView.style.display = 'none';
    $detailView.style.display = 'none';
    $listView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function _showDetail(courseId, openFirstLesson = false) {
    const course = DataService.getCourses().find(c => c.id === courseId);
    if (!course) return;
    _currentCourse = course;
    const data = TutorialData.getCourseData(courseId) || {};
    _currentLessons = data.lessons || [];

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
        ${data.rating ?? '4.7'} <span>(${data.reviews ?? 200} opiniones)</span>
      </span>
      <span>${_currentLessons.length} lecciones</span>
      <span>${data.quizzes ?? 2} quizzes</span>`;

    document.getElementById('tut-detail-graphic').innerHTML =
      `<img src="${course.icon}" alt="" width="110" height="110" style="opacity:0.25;filter:grayscale(0.3);">`;

    document.getElementById('tut-about-title').textContent = `Sobre ${course.title}`;
    document.getElementById('about-text').textContent = data.aboutShort ?? course.desc;
    const extraEl = document.getElementById('about-extra');
    extraEl.textContent = data.aboutExtra ?? '';
    extraEl.style.display = 'none';
    document.getElementById('btn-more').textContent = 'Leer Más';

    const groups = _groupLessons(_currentLessons);
    const timeline = data.timeline || ['Básico', 'Intermedio', 'Avanzado'];
    const videos = data.videos || [];
    const sectionNames = Object.keys(groups);

    document.getElementById('tut-videos-grid').innerHTML = videos.length
      ? videos.map((videoTitle, i) => {
          const sectionLabel = timeline[i] || sectionNames[i] || `Nivel ${i + 1}`;
          const lessonIdx = _firstLessonForSection(groups, sectionLabel, i);
          return _renderVideoCover(videoTitle, i, course, lessonIdx, sectionLabel);
        }).join('')
      : sectionNames.map((section, i) => {
          const lessonIdx = groups[section][0].index;
          return _renderVideoCover(section, i, course, lessonIdx, section);
        }).join('');

    document.getElementById('tut-lessons-list').innerHTML = Object.entries(groups).map(([section, items]) => `
      <div class="tut-lesson-group">
        <h3 class="tut-lesson-group__title">${section}</h3>
        <div class="tut-lesson-group__grid">
          ${items.map(l => _renderLessonCard(l, course, l.index)).join('')}
        </div>
      </div>
    `).join('');

    document.getElementById('tut-topics-list').innerHTML = _currentLessons.map((l, i) => {
      const done = typeof UserProfileService !== 'undefined'
        && UserProfileService.getLessonProgress(courseId)[l.id];
      return `
      <div class="tut-topic-item ${done ? 'tut-topic-item--done' : ''}" data-lesson-idx="${i}" tabindex="0" role="button">
        <span class="tut-topic__num">${i + 1}</span>
        <span class="tut-topic__name">${l.title}</span>
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

    document.getElementById('btn-fav')?.classList.remove('tut-action-btn--active');
    document.getElementById('btn-save')?.classList.remove('tut-action-btn--active');
    _syncActionButtons();
    _renderCertPanel();

    UserProfileService.recordVisit(UserProfileService.buildCourseItem(course));

    _bindLessonCards();

    $listView.style.display = 'none';
    $lessonView.style.display = 'none';
    $detailView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (openFirstLesson && _currentLessons.length) _showLesson(0);
  }

  function _levelScaleHtml(activeLevel) {
    const levels = ['Principiante', 'Intermedio', 'Avanzado'];
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
      ? UserProfileService.getLessonProgress(_currentCourse.id)
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
    const videoLabel = videoUrl ? 'Video explicativo' : (res.video || 'Video explicativo del módulo');
    const docsUrl = res.docsUrl || '#';
    const docsLabel = res.docs || 'Documentación oficial';

    const quizModule = typeof CourseCurriculum !== 'undefined'
      ? (CourseCurriculum.getQuizDef(course.id)?.sections?.[idx]?.title || lesson.title)
      : lesson.title;

    const exampleHtml = typeof LessonExamples !== 'undefined'
      ? LessonExamples.buildHtml(lesson, course.id)
      : `<pre class="lesson-w3__code"><code>${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}</code></pre>`;

    const $breadcrumb = document.getElementById('lesson-breadcrumb');
    if ($breadcrumb) {
      $breadcrumb.innerHTML = `
        <a href="tutorial.html">Tutoriales</a>
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
        <span class="lesson-w3__module">${lesson.section || `Módulo ${idx + 1}`}</span>
        <h1 class="lesson-w3__title">${lesson.title}</h1>
        <div class="lesson-w3__meta">
          <span class="lesson-w3__duration">${lesson.duration || '10 min'}</span>
          <span class="lesson-w3__meta-sep">·</span>
          <span>Lección ${idx + 1} de ${total}</span>
        </div>
        <div class="lesson-w3__progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <div class="lesson-w3__progress-fill" style="width:${pct}%"></div>
        </div>
      </header>

      <section class="lesson-w3__block" id="lesson-sec-desc">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">1</span> Descripción</h2>
        <p class="lesson-w3__text">${desc}</p>
      </section>

      <section class="lesson-w3__block" id="lesson-sec-level">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">2</span> Nivel</h2>
        <div class="lesson-w3__level-scale" style="--level-color:${levelColor}">${_levelScaleHtml(lesson.level)}</div>
        <p class="lesson-w3__text lesson-w3__text--muted">Nivel de esta lección: <strong style="color:${levelColor}">${lesson.level || 'Principiante'}</strong></p>
      </section>

      <section class="lesson-w3__block" id="lesson-sec-req">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">3</span> Requisitos</h2>
        <ul class="lesson-w3__list">
          ${reqs.map(r => `<li>${r}</li>`).join('')}
        </ul>
      </section>

      <section class="lesson-w3__block" id="lesson-sec-steps">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">4</span> Tutorial paso a paso</h2>
        <ol class="lesson-w3__steps">
          ${steps.map(s => `<li>${s}</li>`).join('')}
        </ol>
      </section>

      <div class="lesson-w3__example" id="lesson-sec-example">
        <div class="lesson-w3__example-head">
          <span>Ejemplo</span>
          <button type="button" class="lesson-w3__try-btn" id="lesson-try-btn">Probar pasos</button>
        </div>
        <div class="lesson-w3__example-body">${exampleHtml}</div>
      </div>

      <section class="lesson-w3__block" id="lesson-sec-resources">
        <h2 class="lesson-w3__block-title"><span class="lesson-w3__block-num">5</span> Recursos adicionales</h2>
        <ul class="lesson-w3__resources">
          <li>
            <span class="lesson-w3__res-icon" aria-hidden="true">▶</span>
            <div>
              <strong>Video explicativo</strong>
              ${videoUrl
                ? `<a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${videoLabel}</a>`
                : `<span>${videoLabel}</span>`}
            </div>
          </li>
          <li>
            <span class="lesson-w3__res-icon" aria-hidden="true">📄</span>
            <div>
              <strong>Documentación oficial</strong>
              <a href="${docsUrl}" target="_blank" rel="noopener noreferrer">${docsLabel}</a>
            </div>
          </li>
        </ul>
      </section>

      ${lesson.tip ? `
      <aside class="lesson-w3__note">
        <strong>Nota:</strong> ${lesson.tip}
      </aside>` : ''}

      <aside class="lesson-w3__cert">
        <strong>Certificación:</strong> Para certificarte necesitas: lecciones ≥${UserProfileService?.LESSON_EXAM_UNLOCK_AVG || 80}% de promedio,
        quiz ≥${UserProfileService?.QUIZ_UNLOCK_EXAM_PCT || 70}% y examen ≥${UserProfileService?.EXAM_CERT_MIN_PCT || 80}%.
        Este módulo («${quizModule}») se evalúa en el
        <button type="button" class="lesson-w3__cert-link" id="lesson-cert-quiz-link">quiz de ${course.title}</button>.
      </aside>`;

    document.getElementById('lesson-try-btn')?.addEventListener('click', () => {
      document.getElementById('lesson-sec-steps')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.getElementById('lesson-cert-quiz-link')?.addEventListener('click', _goToCourseQuiz);
  }

  function _showLesson(idx) {
    if (!_currentLessons.length || idx < 0 || idx >= _currentLessons.length) return;
    _currentLessonIdx = idx;
    const lesson = _currentLessons[idx];
    const total = _currentLessons.length;

    _renderLessonSidebar(idx);
    _renderLessonArticle(lesson, idx, total);

    const prevBtn = document.getElementById('lesson-prev');
    const nextBtn = document.getElementById('lesson-next');
    const quizBtn = document.getElementById('lesson-quiz-btn');
    prevBtn.disabled = idx === 0;
    nextBtn.textContent = idx === total - 1 ? 'Finalizar curso' : 'Siguiente →';
    if (quizBtn) quizBtn.textContent = `Quiz: ${_currentCourse.title}`;

    $listView.style.display = 'none';
    $detailView.style.display = 'none';
    $lessonView.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function _syncActionButtons() {
    if (!_currentCourse) return;
    const item = UserProfileService.buildCourseItem(_currentCourse);
    document.getElementById('btn-fav')?.classList.toggle(
      'tut-action-btn--active',
      UserProfileService.isFavorite(item.refId, item.type)
    );
    document.getElementById('btn-save')?.classList.toggle(
      'tut-action-btn--active',
      UserProfileService.isSaved(item.refId, item.type)
    );
  }

  function _toggleFavorite(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!_currentCourse) return;
    if (typeof UserProfileService === 'undefined') return;
    if (!UserProfileService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    const btn = document.getElementById('btn-fav');
    const item = UserProfileService.buildCourseItem(_currentCourse);
    const active = UserProfileService.toggleFavorite(item);
    btn?.classList.toggle('tut-action-btn--active', active);
    AppShell.showToast(active ? '❤ Agregado a favoritos en tu perfil' : 'Eliminado de favoritos');
  }

  function _toggleSaved(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!_currentCourse) return;
    if (typeof UserProfileService === 'undefined') return;
    if (!UserProfileService.getCurrentUser()) {
      window.location.href = 'login.html';
      return;
    }
    const btn = document.getElementById('btn-save');
    const item = UserProfileService.buildCourseItem(_currentCourse);
    const active = UserProfileService.toggleSaved(item);
    btn?.classList.toggle('tut-action-btn--active', active);
    AppShell.showToast(active ? '🔖 Guardado en tu perfil' : 'Eliminado de guardados');
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
      btn.textContent = hidden ? 'Leer Menos' : 'Leer Más';
    });

    document.getElementById('btn-fav')?.addEventListener('click', _toggleFavorite);
    document.getElementById('btn-save')?.addEventListener('click', _toggleSaved);

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
      _showLessonCheck(() => {
        if (_currentLessonIdx < _currentLessons.length - 1) {
          _showLesson(_currentLessonIdx + 1);
        } else if (_currentCourse) {
          _showDetail(_currentCourse.id);
          const stats = UserProfileService?.getCourseLessonStats(_currentCourse.id, _currentLessons.length);
          if (stats?.unlocked) {
            AppShell.showToast('¡Curso completado! Ya puedes presentar el examen de certificación.');
          } else {
            AppShell.showToast('Lección final registrada. Sigue practicando para alcanzar el 80% de promedio.');
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
    if (pending) {
      sessionStorage.removeItem('in4mind_open_course');
      _showDetail(pending);
    }
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = TutorialController;
