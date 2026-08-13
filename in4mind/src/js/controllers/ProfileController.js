/**
 * IN4MIND — ProfileController
 * Página de perfil: favoritos, guardados y quizzes completados.
 */

'use strict';

const ProfileController = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k ?? '';
  }

  let _activeTab = 'saved';
  let _searchQuery = '';
  let _categoryFilter = 'all';
  let _loading = false;
  let _loadToken = 0;

  function _notesCount() {
    try {
      return typeof NotesService !== 'undefined' ? NotesService.getAllNotes().length : 0;
    } catch {
      return 0;
    }
  }

  function _projectsCount() {
    try {
      return typeof ProjectsService !== 'undefined' ? ProjectsService.getAll().length : 0;
    } catch {
      return 0;
    }
  }

  function _courseTitle(courseId) {
    if (!courseId) return _t('profile.generalNotes', null, 'Notas generales');
    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    const course = courses.find(c => c.id === courseId);
    if (course?.title) return course.title;
    const key = `courses.${courseId}.title`;
    const localized = _t(key, null, '');
    return localized && localized !== key ? localized : courseId;
  }

  function _getFeaturedProjects() {
    if (typeof ProjectsService === 'undefined') return [];
    const all = ProjectsService.getAll();
    const pinned = all.filter(p => p.pinned);
    const rest = all.filter(p => !p.pinned);
    // Destacados = fijados; si faltan, completar con los más recientes (máx. 2).
    return [...pinned, ...rest].slice(0, 2);
  }

  function _openItem(item) {
    if (item.type === 'course') {
      sessionStorage.setItem('in4mind_open_course', item.refId);
      window.location.href = 'tutorial.html';
      return;
    }
    if (item.type === 'exam') {
      sessionStorage.setItem('in4mind_open_exam', item.refId);
      window.location.href = 'quizzes.html';
      return;
    }
    if (item.type === 'quiz') {
      sessionStorage.setItem('in4mind_open_quiz', item.refId);
      window.location.href = 'quizzes.html';
      return;
    }
    if (item.type === 'project') {
      window.location.href = `projects.html?project=${encodeURIComponent(item.refId)}`;
      return;
    }
    if (item.type === 'note') {
      if (item.courseId && item.lessonId) {
        window.location.href = `tutorial.html?course=${encodeURIComponent(item.courseId)}&lesson=${encodeURIComponent(item.lessonId)}`;
        return;
      }
      window.location.href = 'notes.html';
    }
  }

  function _applyStats(stats) {
    const $saved = document.getElementById('stat-saved-count');
    const $fav = document.getElementById('stat-fav-count');
    const $quiz = document.getElementById('stat-quiz-count');
    const $cert = document.getElementById('stat-cert-count');
    const $projects = document.getElementById('stat-projects-count');
    const $notes = document.getElementById('stat-notes-count');
    if (!$saved || !$fav || !$quiz) return;

    const projects = stats.projects ?? _projectsCount();
    const notes = stats.notes ?? _notesCount();

    $saved.textContent = stats.saved === 1
      ? _t('profile.item', { n: stats.saved })
      : _t('profile.items', { n: stats.saved });
    $fav.textContent = stats.favorites === 1
      ? _t('profile.item', { n: stats.favorites })
      : _t('profile.items', { n: stats.favorites });
    $quiz.textContent = stats.quizzes === 1
      ? _t('profile.completedOne', { n: stats.quizzes })
      : _t('profile.completed', { n: stats.quizzes });
    if ($cert) {
      $cert.textContent = stats.certifications === 1
        ? _t('profile.obtainedOne', { n: stats.certifications })
        : _t('profile.obtained', { n: stats.certifications });
    }
    if ($projects) {
      $projects.textContent = projects === 1
        ? _t('profile.projectOne', { n: projects }, '{n} Proyecto')
        : _t('profile.projectMany', { n: projects }, '{n} Proyectos');
    }
    if ($notes) {
      $notes.textContent = notes === 1
        ? _t('profile.noteOne', { n: notes }, '{n} Nota')
        : _t('profile.noteMany', { n: notes }, '{n} Notas');
    }
  }

  function _setStatsLoading(loading) {
    document.querySelectorAll('.prof-stat-card__value').forEach(el => {
      el.classList.toggle('prof-stat-card__value--loading', loading);
    });
  }

  function _skeletonCards(count = 4) {
    return Array.from({ length: count }, () => `
      <div class="prof-item prof-item--skeleton" aria-hidden="true">
        <div class="prof-skel prof-skel--icon"></div>
        <div class="prof-skel__body">
          <div class="prof-skel prof-skel--title"></div>
          <div class="prof-skel prof-skel--meta"></div>
          <div class="prof-skel prof-skel--desc"></div>
        </div>
      </div>`).join('');
  }

  function _showListLoading() {
    const $list = document.getElementById('profile-list');
    const $empty = document.getElementById('profile-empty');
    if (!$list) return;
    $empty.hidden = true;
    $list.classList.add('prof-list--loading');
    $list.innerHTML = _skeletonCards(4);
    $list.setAttribute('aria-busy', 'true');
  }

  function _clearListLoading() {
    const $list = document.getElementById('profile-list');
    if (!$list) return;
    $list.classList.remove('prof-list--loading');
    $list.removeAttribute('aria-busy');
  }

  function _animateListEnter() {
    const $list = document.getElementById('profile-list');
    if (!$list) return;

    $list.classList.remove('prof-list--enter');
    $list.querySelectorAll('.prof-item:not(.prof-item--skeleton)').forEach((el, i) => {
      el.style.setProperty('--prof-i', String(Math.min(i, 12)));
    });

    requestAnimationFrame(() => {
      $list.classList.add('prof-list--enter');
    });
  }

  function _animateEmptyEnter() {
    const $empty = document.getElementById('profile-empty');
    if (!$empty || $empty.hidden) return;
    $empty.classList.remove('prof-empty--enter');
    requestAnimationFrame(() => {
      $empty.classList.add('prof-empty--enter');
    });
  }

  function _refreshProfile() {
    void _loadProfile({ background: true });
  }

  async function _renderStats() {
    const stats = await UserProfileService.getStats();
    _applyStats({
      ...stats,
      projects: _projectsCount(),
      notes: _notesCount(),
    });
    _renderFeaturedProjects();
  }

  function _renderFeaturedProjects() {
    const $grid = document.getElementById('prof-featured-grid');
    const $section = document.getElementById('prof-featured-projects');
    if (!$grid || !$section) return;

    const featured = _getFeaturedProjects();
    if (!featured.length) {
      $grid.innerHTML = `
        <div class="prof-featured__empty">
          <p>${_t('profile.emptyFeatured', null, 'Aún no tienes proyectos destacados. Crea o fija uno en Mis Proyectos.')}</p>
          <a class="btn--course" href="projects.html">${_t('profile.goProjects', null, 'Ir a Mis Proyectos')}</a>
        </div>`;
      return;
    }

    $grid.innerHTML = featured.map(p => {
      const pct = typeof ProjectsService.getProgress === 'function' ? ProjectsService.getProgress(p) : 0;
      const course = p.courseId ? _courseTitle(p.courseId) : '';
      const badge = p.pinned
        ? `<span class="prof-featured__badge">${_t('profile.highlighted', null, 'Destacado')}</span>`
        : '';
      return `
        <article class="prof-featured__card" style="--proj-color:${p.color || '#6366F1'}"
                 data-project-id="${p.id}" role="button" tabindex="0">
          <div class="prof-featured__card-top">
            <span class="prof-featured__icon" aria-hidden="true">${p.icon || '📁'}</span>
            ${badge}
          </div>
          <h3 class="prof-featured__card-title">${_escape(p.title)}</h3>
          <p class="prof-featured__card-desc">${_escape(p.description || _t('projects.noDesc', null, 'Sin descripción'))}</p>
          ${course ? `<span class="prof-featured__course">${_escape(course)}</span>` : ''}
          <div class="prof-featured__progress" aria-hidden="true">
            <div class="prof-featured__progress-fill" style="width:${pct}%"></div>
          </div>
          <footer class="prof-featured__foot">
            <span>${pct}% ${_t('projects.complete', null, 'completado')}</span>
            <span>${_t('profile.open', null, 'Abrir')} →</span>
          </footer>
        </article>`;
    }).join('');

    $grid.querySelectorAll('[data-project-id]').forEach(el => {
      const open = () => _openItem({ type: 'project', refId: el.dataset.projectId });
      el.addEventListener('click', open);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function _escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function _filterItems(items) {
    let out = items;
    if (_searchQuery.trim()) {
      const q = _searchQuery.toLowerCase();
      out = out.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.desc || '').toLowerCase().includes(q)
      );
    }
    if (_categoryFilter !== 'all') {
      // Items without category (e.g. free-form projects) stay visible.
      out = out.filter(i => !i.category || i.category === _categoryFilter);
    }
    return out;
  }

  function _enrichItemCategory(item) {
    if (!item?.refId) return item;
    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    const course = courses.find(c => c.id === item.refId);
    if (course) {
      return {
        ...item,
        category: course.category || item.category,
        title: item.title || course.title,
        desc: item.desc || course.desc,
        icon: course.icon || item.icon,
      };
    }
    if (item.type === 'quiz' && typeof QuizzesController !== 'undefined' && QuizzesController.getQuizById) {
      const quiz = QuizzesController.getQuizById(item.refId);
      if (quiz?.icon) return { ...item, icon: quiz.icon };
    }
    // Bust cached SVG for known local course icons still stored without ?v=
    if (item.icon && /\/courses\/[^?]+\.svg$/.test(item.icon)) {
      return { ...item, icon: `${item.icon}?v=20260713` };
    }
    return item;
  }

  async function _buildProgressItems() {
    const courses = DataService.getCourses();
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const [visits, quizProgress] = await Promise.all([
      UserProfileService.getRecentVisits(12),
      UserProfileService.getQuizProgress(),
    ]);
    const seen = new Set();
    const items = [];

    visits.filter(v => v.type === 'course' && v.refId).forEach(v => {
      if (seen.has(v.refId)) return;
      seen.add(v.refId);
      const course = courseMap.get(v.refId);
      if (!course) return;
      const quiz = quizProgress[v.refId];
      items.push({
        id: `prog-${v.refId}`,
        refId: v.refId,
        type: 'course',
        title: course.title,
        desc: course.desc,
        icon: course.icon,
        category: course.category,
        visitedAt: v.visitedAt,
        pct: quiz?.bestPct ?? quiz?.pct ?? null,
      });
    });

    Object.keys(quizProgress || {}).forEach(refId => {
      if (seen.has(refId)) return;
      const course = courseMap.get(refId);
      if (!course) return;
      seen.add(refId);
      const quiz = quizProgress[refId];
      items.push({
        id: `prog-${refId}`,
        refId,
        type: 'course',
        title: course.title,
        desc: course.desc,
        icon: course.icon,
        category: course.category,
        visitedAt: quiz.completedAt,
        pct: quiz.bestPct ?? quiz.pct,
      });
    });

    return items.sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0));
  }

  function _buildProjectItems() {
    if (typeof ProjectsService === 'undefined') return [];
    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    return ProjectsService.getAll().map(p => {
      const pct = ProjectsService.getProgress?.(p) ?? 0;
      const course = p.courseId ? courses.find(c => c.id === p.courseId) : null;
      return {
        id: p.id,
        refId: p.id,
        type: 'project',
        title: p.title,
        desc: p.description || (course ? course.title : _t('projects.noDesc', null, 'Sin descripción')),
        icon: null,
        emoji: p.icon || '📁',
        category: course?.category || null,
        visitedAt: p.updatedAt,
        pct,
        pinned: Boolean(p.pinned),
      };
    });
  }

  function _buildNotesSummaryGroups() {
    if (typeof NotesService === 'undefined') return [];
    const notes = NotesService.getAllNotes();
    const q = _searchQuery.trim().toLowerCase();
    const filtered = q
      ? notes.filter(n =>
          (n.title || '').toLowerCase().includes(q)
          || (n.preview || n.content || '').toLowerCase().includes(q)
          || _courseTitle(n.courseId).toLowerCase().includes(q))
      : notes;

    const byCourse = new Map();
    filtered.forEach(n => {
      const key = n.courseId || '_general';
      if (!byCourse.has(key)) byCourse.set(key, []);
      byCourse.get(key).push(n);
    });

    return [...byCourse.entries()]
      .map(([courseId, list]) => ({
        courseId: courseId === '_general' ? null : courseId,
        title: _courseTitle(courseId === '_general' ? null : courseId),
        notes: list.slice(0, 6),
        total: list.length,
      }))
      .sort((a, b) => {
        const aTime = Math.max(...a.notes.map(n => n.updatedAt || 0), 0);
        const bTime = Math.max(...b.notes.map(n => n.updatedAt || 0), 0);
        return bTime - aTime;
      });
  }

  async function _getTabItems() {
    if (_activeTab === 'progress') {
      const items = _filterItems(await _buildProgressItems());
      return { items, listType: 'progress' };
    }
    if (_activeTab === 'saved') {
      const items = _filterItems((await UserProfileService.getSaved()).map(_enrichItemCategory));
      return { items, listType: 'saved' };
    }
    if (_activeTab === 'favorites') {
      const items = _filterItems((await UserProfileService.getFavorites()).map(_enrichItemCategory));
      return { items, listType: 'favorites' };
    }
    if (_activeTab === 'notes') {
      const groups = _buildNotesSummaryGroups();
      return { items: groups, listType: 'notes' };
    }
    if (_activeTab === 'projects') {
      const items = _filterItems(_buildProjectItems());
      return { items, listType: 'projects' };
    }
    if (_activeTab === 'certifications') {
      return {
        items: _filterItems((await UserProfileService.getCertifications()).map(cert => {
          const course = cert.courseId
            ? DataService.getCourses().find(c => c.id === cert.courseId)
            : DataService.getCourses().find(c => c.id === cert.refId || cert.title?.includes?.(c.title));
          return course?.icon ? { ...cert, icon: course.icon } : cert;
        })),
        listType: 'certifications',
      };
    }

    const progress = await UserProfileService.getQuizProgress();
    const items = _filterItems(Object.entries(progress).map(([refId, data]) => {
      const course = DataService.getCourses().find(c => c.id === refId);
      return {
        id: `quiz-${refId}`,
        refId,
        type: 'quiz',
        title: data.title || course?.title || refId,
        desc: `${data.correct}/${data.total} respuestas correctas`,
        icon: course?.icon || data.icon,
        pct: data.pct,
        visitedAt: data.completedAt,
      };
    }));
    return { items, listType: 'quizzes' };
  }

  function _emptyMessage() {
    if (_activeTab === 'progress') return _t('profile.emptyProgress', null, 'Sin cursos en progreso. Empieza un curso.');
    if (_activeTab === 'saved') return _t('profile.emptySaved');
    if (_activeTab === 'favorites') return _t('profile.emptyFav');
    if (_activeTab === 'notes') return _t('profile.emptyNotes', null, 'Aún no tienes notas de estudio. Crea una en Mis Notas.');
    if (_activeTab === 'projects') return _t('profile.emptyProjects', null, 'Aún no tienes proyectos. Crea uno en Mis Proyectos.');
    if (_activeTab === 'certifications') return _t('profile.emptyCert');
    return _t('profile.emptyQuiz');
  }

  function _renderNotesSummary(groups) {
    return groups.map(group => `
      <section class="prof-notes-group">
        <header class="prof-notes-group__head">
          <h3 class="prof-notes-group__title">${_escape(group.title)}</h3>
          <span class="prof-notes-group__count">${_t('notes.notesCount', { n: group.total }, '{n} notas')}</span>
        </header>
        <div class="prof-notes-group__list">
          ${group.notes.map(n => `
            <article class="prof-note-chip" data-note-id="${_escape(n.id)}"
                     data-course="${_escape(n.courseId || '')}" data-lesson="${_escape(n.lessonId || '')}"
                     role="button" tabindex="0">
              <div class="prof-note-chip__swatch" style="--note-color:${n.color || '#90CAF9'}" aria-hidden="true"></div>
              <div class="prof-note-chip__body">
                <h4 class="prof-note-chip__title">${_escape(n.title || _t('notes.untitled', null, 'Sin título'))}</h4>
                <p class="prof-note-chip__preview">${_escape(n.preview || n.content || '')}</p>
                <p class="prof-note-chip__meta">${UserProfileService.formatVisitDate(n.updatedAt)}</p>
              </div>
            </article>`).join('')}
        </div>
      </section>`).join('') + `
      <div class="prof-notes-footer">
        <a class="btn--course btn--lg" href="notes.html">${_t('profile.goNotes', null, 'Abrir Mis Notas')}</a>
      </div>`;
  }

  function _renderItemCard(item, listType) {
    const dateLabel = UserProfileService.formatVisitDate(item.visitedAt || item.savedAt);
    const iconHtml = item.emoji
      ? `<span class="prof-item__icon-fallback" aria-hidden="true">${item.emoji}</span>`
      : item.icon
        ? `<img src="${item.icon}" alt="" width="40" height="40" loading="lazy">`
        : `<span class="prof-item__icon-fallback">${(item.title || '?').charAt(0)}</span>`;

    const extraMeta = listType === 'quizzes' && item.pct != null
      ? `<span class="prof-item__score">${_t('profile.accuracy', { pct: item.pct })}</span>`
      : '';

    const menuHtml = (listType === 'quizzes' || listType === 'projects' || listType === 'notes') ? '' : `
          <div class="prof-item__menu-wrap">
            <button type="button" class="prof-item__menu-btn" aria-label="${_t('profile.delete')}" data-menu="${listType}" data-id="${item.id || item.refId}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
          </div>`;

    const continueHtml = listType === 'progress'
      ? `<button type="button" class="prof-btn prof-btn--primary prof-item__open prof-item__continue" data-ref="${item.refId}" data-type="${item.type}">${_t('profile.continue', null, 'Continuar')}</button>`
      : `<button type="button" class="prof-btn prof-btn--primary prof-item__open" data-ref="${item.refId}" data-type="${item.type}">
            ${_t('profile.open')}
          </button>`;

    const pinBadge = item.pinned
      ? ` · <span class="prof-item__score">${_t('profile.highlighted', null, 'Destacado')}</span>`
      : '';

    return `
      <article class="prof-item" data-item-id="${item.id || item.refId}">
        <div class="prof-item__icon">${iconHtml}</div>
        <div class="prof-item__body">
          <h3 class="prof-item__title">${_escape(item.title)}</h3>
          <p class="prof-item__meta">${dateLabel}${extraMeta ? ` · ${extraMeta}` : ''}${item.pct != null ? ` · ${item.pct}%` : ''}${pinBadge}</p>
          <p class="prof-item__desc">${_escape(item.desc || '')}</p>
        </div>
        <div class="prof-item__actions">
          <button type="button" class="prof-btn prof-btn--ghost prof-item__open" data-ref="${item.refId}" data-type="${item.type}">
            ${_t('profile.seeMore')}
          </button>
          ${continueHtml}
          ${menuHtml}
        </div>
      </article>`;
  }

  function _renderCertCard(cert) {
    const dateLabel = UserProfileService.formatVisitDate(cert.earnedAt);
    const iconHtml = cert.icon
      ? `<img src="${cert.icon}" alt="" width="40" height="40" loading="lazy">`
      : `<span class="prof-item__icon-fallback">🏆</span>`;
    const isExam = cert.type === 'exam';
    const badgeLabel = isExam ? _t('profile.profCert') : _t('profile.practiceCert');
    const btnLabel = isExam ? _t('profile.viewExam') : _t('profile.viewQuiz');

    const modulesHtml = isExam && cert.modules?.length
      ? `<ul class="prof-cert-modules">${cert.modules.map(m => `<li>${m}</li>`).join('')}</ul>`
      : '';

    const levelsHtml = isExam && cert.levelsCovered?.length
      ? `<p class="prof-cert-levels">Niveles: ${cert.levelsCovered.join(' · ')}</p>`
      : '';

    return `
      <article class="prof-item prof-item--cert ${isExam ? 'prof-item--cert-exam' : ''}">
        <div class="prof-item__icon prof-item__icon--cert">${iconHtml}</div>
        <div class="prof-item__body">
          <h3 class="prof-item__title">${cert.title}</h3>
          <p class="prof-item__meta">${dateLabel} · <span class="prof-item__score">${_t('profile.accuracy', { pct: cert.pct })}</span></p>
          <p class="prof-item__desc">${cert.desc || (isExam ? 'Certificación IN4MIND — examen práctico alineado al curso' : 'Certificación IN4MIND')}</p>
          ${levelsHtml}
          ${modulesHtml}
        </div>
        <div class="prof-item__actions">
          <span class="prof-cert-badge" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>
            ${badgeLabel}
          </span>
          <button type="button" class="prof-btn prof-btn--ghost prof-cert-share" data-cert-id="${cert.id || cert.refId}">${_t('cert.share', null, 'Compartir')}</button>
          <button type="button" class="prof-btn prof-btn--primary prof-item__open" data-ref="${cert.refId}" data-type="${cert.type}">
            ${btnLabel}
          </button>
        </div>
      </article>`;
  }

  function _bindListEvents($list, listType) {
    $list.querySelectorAll('.prof-item__open').forEach(btn => {
      btn.addEventListener('click', () => {
        _openItem({ refId: btn.dataset.ref, type: btn.dataset.type });
      });
    });

    $list.querySelectorAll('.prof-item__menu-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const list = btn.dataset.menu;
        const id = btn.dataset.id;
        if (list === 'saved') UserProfileService.removeSaved(id);
        else if (list === 'favorites') UserProfileService.removeFavorite(id);
        void _loadProfile({ background: true });
      });
    });
  }

  async function _renderList() {
    const $list = document.getElementById('profile-list');
    const $empty = document.getElementById('profile-empty');
    if (!$list) return;

    const { items, listType } = await _getTabItems();

    if (!items.length) {
      $list.innerHTML = '';
      _clearListLoading();
      $empty.hidden = false;
      const $msg = $empty.querySelector('.empty-state__desc, p');
      if ($msg) $msg.textContent = _emptyMessage();
      const $action = $empty.querySelector('.empty-state__action');
      if ($action) {
        if (_activeTab === 'progress' || _activeTab === 'quizzes') {
          $action.href = 'tutorial.html';
          $action.textContent = _t('profile.emptyActionCourses', null, 'Explorar cursos');
        } else if (_activeTab === 'certifications') {
          $action.href = 'quizzes.html';
          $action.textContent = _t('profile.emptyActionQuizzes', null, 'Hacer un quiz');
        } else if (_activeTab === 'notes') {
          $action.href = 'notes.html';
          $action.textContent = _t('profile.goNotes', null, 'Abrir Mis Notas');
        } else if (_activeTab === 'projects') {
          $action.href = 'projects.html';
          $action.textContent = _t('profile.goProjects', null, 'Ir a Mis Proyectos');
        } else {
          $action.href = 'dashboard.html';
          $action.textContent = _t('profile.emptyAction', null, 'Ir al dashboard');
        }
      }
      _animateEmptyEnter();
      return;
    }

    $empty.hidden = true;
    $empty.classList.remove('prof-empty--enter');
    if (_activeTab === 'certifications') {
      $list.innerHTML = items.map(cert => _renderCertCard(cert)).join('');
      $list.querySelectorAll('.prof-cert-share').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const cert = items.find(c => (c.id || c.refId) === btn.dataset.certId);
          if (cert && typeof CertificateShare !== 'undefined') CertificateShare.openModal(cert);
        });
      });
    } else if (_activeTab === 'notes') {
      $list.innerHTML = _renderNotesSummary(items);
      $list.querySelectorAll('.prof-note-chip').forEach(el => {
        const open = () => _openItem({
          type: 'note',
          refId: el.dataset.noteId,
          courseId: el.dataset.course || null,
          lessonId: el.dataset.lesson || null,
        });
        el.addEventListener('click', open);
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
      });
    } else {
      $list.innerHTML = items.map(item => _renderItemCard(item, listType)).join('');
    }
    _clearListLoading();
    if (_activeTab !== 'notes') _bindListEvents($list, listType);
    _animateListEnter();
  }

  function _renderHeader() {
    const user = UserProfileService.getCurrentUser();
    if (!user) return;

    const displayName = user.name?.trim() || user.email?.split('@')[0] || _t('profile.user');

    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-email').textContent = user.email || '';
    document.getElementById('profile-avatar-lg').textContent = displayName.charAt(0).toUpperCase();
  }

  function _setTab(tab) {
    if (_activeTab === tab) return;
    _activeTab = tab;
    document.querySelectorAll('.prof-tab').forEach(el => {
      const active = el.dataset.tab === tab;
      el.classList.toggle('prof-tab--active', active);
      el.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.prof-stat-card').forEach(el => {
      el.classList.toggle('prof-stat-card--active', el.dataset.tabTarget === tab);
    });
    void _loadProfile({ background: false, listOnly: true });
  }

  async function _loadProfile({ background = false, listOnly = false } = {}) {
    const token = ++_loadToken;
    if (!background && !listOnly) {
      _loading = true;
      _setStatsLoading(true);
      _showListLoading();
    } else if (!listOnly) {
      _setStatsLoading(true);
    }

    try {
      if (!listOnly) {
        UserProfileService.hydrateCacheFromLocal();
        _applyStats({
          ...UserProfileService.getStatsSync(),
          projects: _projectsCount(),
          notes: _notesCount(),
        });
        _renderFeaturedProjects();
      }

      await UserProfileService.prefetchProfileData();
      if (token !== _loadToken) return;

      if (!listOnly) {
        await _renderStats();
        _setStatsLoading(false);
      }
      await _renderList();
    } catch (err) {
      console.error('[IN4MIND Perfil]', err);
      if (token === _loadToken) {
        _clearListLoading();
        _setStatsLoading(false);
      }
    } finally {
      if (token === _loadToken) _loading = false;
    }
  }

  function _ensureCategoryFilters() {
    if (document.getElementById('prof-category-filters')) return;
    const tabs = document.querySelector('.prof-tabs');
    if (!tabs) return;
    const row = document.createElement('div');
    row.id = 'prof-category-filters';
    row.className = 'prof-filter-row';
    const cats = [
      ['all', _t('profile.filterAll', null, 'Todas')],
      ['web', _t('tutorial.catWeb', null, 'Web')],
      ['programming', _t('tutorial.catProgramming', null, 'Programación')],
      ['design', _t('tutorial.catDesign', null, 'Diseño')],
      ['office', _t('tutorial.catOffice', null, 'Office')],
      ['data', _t('tutorial.catData', null, 'Datos')],
      ['security', _t('tutorial.catSecurity', null, 'Ciberseguridad')],
      ['tools', _t('tutorial.catTools', null, 'Herramientas')],
    ];
    row.innerHTML = cats.map(([id, label]) => `
      <button type="button" class="prof-filter-btn ${id === 'all' ? 'prof-filter-btn--active' : ''}"
              data-cat="${id}">${label}</button>`).join('');
    tabs.after(row);
    row.querySelectorAll('.prof-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _categoryFilter = btn.dataset.cat;
        row.querySelectorAll('.prof-filter-btn').forEach(b => {
          b.classList.toggle('prof-filter-btn--active', b.dataset.cat === _categoryFilter);
        });
        void _renderList();
      });
    });
  }

  function init() {
    const user = UserProfileService.getCurrentUser();
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    AppShell.initPage(null);
    _ensureCategoryFilters();
    _renderHeader();
    UserProfileService.hydrateCacheFromLocal();
    _applyStats({
      ...UserProfileService.getStatsSync(),
      projects: _projectsCount(),
      notes: _notesCount(),
    });
    _renderFeaturedProjects();
    _showListLoading();

    void _loadProfile({ background: true });
    void UserProfileService.syncCertificationsFromQuizzes().then(() => {
      _applyStats({
        ...UserProfileService.getStatsSync(),
        projects: _projectsCount(),
        notes: _notesCount(),
      });
      if (_activeTab === 'certifications') void _renderList();
    });

    document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
      if (confirm(_t('profile.logoutConfirm'))) AppShell.logout();
    });

    document.querySelectorAll('.prof-tab').forEach(tab => {
      tab.addEventListener('click', () => _setTab(tab.dataset.tab));
    });

    document.querySelectorAll('.prof-stat-card').forEach(card => {
      card.addEventListener('click', () => _setTab(card.dataset.tabTarget));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          _setTab(card.dataset.tabTarget);
        }
      });
    });

    let searchTimer;
    document.getElementById('search-input')?.addEventListener('input', e => {
      _searchQuery = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { void _renderList(); }, 100);
    });

    window.addEventListener(UserProfileService.EVENT, _refreshProfile);
    window.addEventListener('storage', e => {
      if (e.key?.startsWith('in4mind_favorites_') || e.key?.startsWith('in4mind_saved_')) {
        _refreshProfile();
      }
    });

    window.addEventListener('pageshow', () => {
      if (!_loading) _refreshProfile();
    });

    window.addEventListener('in4mind-relocalize', () => {
      _renderHeader();
      void _loadProfile({ background: true });
    });
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = ProfileController;
