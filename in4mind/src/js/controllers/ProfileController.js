/**
 * IN4MIND — ProfileController
 * Página de perfil: favoritos, guardados y quizzes completados.
 */

'use strict';

const ProfileController = (() => {

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : '';
  }

  let _activeTab = 'saved';
  let _searchQuery = '';
  let _categoryFilter = 'all';
  let _loading = false;
  let _loadToken = 0;

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
    }
  }

  function _applyStats(stats) {
    const $saved = document.getElementById('stat-saved-count');
    const $fav = document.getElementById('stat-fav-count');
    const $quiz = document.getElementById('stat-quiz-count');
    const $cert = document.getElementById('stat-cert-count');
    if (!$saved || !$fav || !$quiz) return;

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
    _applyStats(stats);
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
      out = out.filter(i => i.category === _categoryFilter);
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
    if (_activeTab === 'certifications') return _t('profile.emptyCert');
    return _t('profile.emptyQuiz');
  }

  function _renderItemCard(item, listType) {
    const dateLabel = UserProfileService.formatVisitDate(item.visitedAt || item.savedAt);
    const iconHtml = item.icon
      ? `<img src="${item.icon}" alt="" width="40" height="40" loading="lazy">`
      : `<span class="prof-item__icon-fallback">${item.title.charAt(0)}</span>`;

    const extraMeta = listType === 'quizzes' && item.pct != null
      ? `<span class="prof-item__score">${_t('profile.accuracy', { pct: item.pct })}</span>`
      : '';

    const menuHtml = listType === 'quizzes' ? '' : `
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

    return `
      <article class="prof-item" data-item-id="${item.id || item.refId}">
        <div class="prof-item__icon">${iconHtml}</div>
        <div class="prof-item__body">
          <h3 class="prof-item__title">${item.title}</h3>
          <p class="prof-item__meta">${dateLabel}${extraMeta ? ` · ${extraMeta}` : ''}${item.pct != null ? ` · ${item.pct}%` : ''}</p>
          <p class="prof-item__desc">${item.desc || ''}</p>
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
      const $msg = $empty.querySelector('p');
      if ($msg) $msg.textContent = _emptyMessage();
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
    } else {
      $list.innerHTML = items.map(item => _renderItemCard(item, listType)).join('');
    }
    _clearListLoading();
    _bindListEvents($list, listType);
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
        _applyStats(UserProfileService.getStatsSync());
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
    _applyStats(UserProfileService.getStatsSync());
    _showListLoading();

    void _loadProfile({ background: true });
    void UserProfileService.syncCertificationsFromQuizzes().then(() => {
      _applyStats(UserProfileService.getStatsSync());
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
