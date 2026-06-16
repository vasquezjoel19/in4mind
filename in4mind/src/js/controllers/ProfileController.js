/**
 * IN4MIND — ProfileController
 * Página de perfil: favoritos, guardados y quizzes completados.
 */

'use strict';

const ProfileController = (() => {

  let _activeTab = 'saved';
  let _searchQuery = '';

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

  function _refreshProfile() {
    UserProfileService.syncCertificationsFromQuizzes();
    _renderAll();
  }

  function _renderStats() {
    const stats = UserProfileService.getStats();
    document.getElementById('stat-saved-count').textContent = `${stats.saved} ${stats.saved === 1 ? 'Elemento' : 'Elementos'}`;
    document.getElementById('stat-fav-count').textContent = `${stats.favorites} ${stats.favorites === 1 ? 'Elemento' : 'Elementos'}`;
    document.getElementById('stat-quiz-count').textContent = `${stats.quizzes} ${stats.quizzes === 1 ? 'Completado' : 'Completados'}`;
    const $certStat = document.getElementById('stat-cert-count');
    if ($certStat) {
      $certStat.textContent = `${stats.certifications} ${stats.certifications === 1 ? 'Obtenida' : 'Obtenidas'}`;
    }
  }

  function _filterItems(items) {
    if (!_searchQuery.trim()) return items;
    const q = _searchQuery.toLowerCase();
    return items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      (i.desc || '').toLowerCase().includes(q)
    );
  }

  function _renderItemCard(item, listType) {
    const dateLabel = UserProfileService.formatVisitDate(item.visitedAt || item.savedAt);
    const iconHtml = item.icon
      ? `<img src="${item.icon}" alt="" width="40" height="40" loading="lazy">`
      : `<span class="prof-item__icon-fallback">${item.title.charAt(0)}</span>`;

    const extraMeta = listType === 'quizzes' && item.pct != null
      ? `<span class="prof-item__score">${item.pct}% aciertos</span>`
      : '';

    const menuHtml = listType === 'quizzes' ? '' : `
          <div class="prof-item__menu-wrap">
            <button type="button" class="prof-item__menu-btn" aria-label="Eliminar" data-menu="${listType}" data-id="${item.id || item.refId}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
          </div>`;

    return `
      <article class="prof-item" data-item-id="${item.id || item.refId}">
        <div class="prof-item__icon">${iconHtml}</div>
        <div class="prof-item__body">
          <h3 class="prof-item__title">${item.title}</h3>
          <p class="prof-item__meta">${dateLabel}${extraMeta ? ` · ${extraMeta}` : ''}</p>
          <p class="prof-item__desc">${item.desc || ''}</p>
        </div>
        <div class="prof-item__actions">
          <button type="button" class="prof-btn prof-btn--ghost prof-item__open" data-ref="${item.refId}" data-type="${item.type}">
            Ver más
          </button>
          <button type="button" class="prof-btn prof-btn--primary prof-item__open" data-ref="${item.refId}" data-type="${item.type}">
            Abrir
          </button>
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
    const badgeLabel = isExam ? 'Certificación profesional' : 'Certificado de práctica';
    const btnLabel = isExam ? 'Ver examen' : 'Ver quiz';

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
          <p class="prof-item__meta">${dateLabel} · <span class="prof-item__score">${cert.pct}% aciertos</span></p>
          <p class="prof-item__desc">${cert.desc || (isExam ? 'Certificación IN4MIND — examen práctico alineado al tutorial' : 'Certificación IN4MIND')}</p>
          ${levelsHtml}
          ${modulesHtml}
        </div>
        <div class="prof-item__actions">
          <span class="prof-cert-badge" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>
            ${badgeLabel}
          </span>
          <button type="button" class="prof-btn prof-btn--primary prof-item__open" data-ref="${cert.refId}" data-type="${cert.type}">
            ${btnLabel}
          </button>
        </div>
      </article>`;
  }

  function _renderList() {
    const $list = document.getElementById('profile-list');
    const $empty = document.getElementById('profile-empty');
    if (!$list) return;

    let items = [];
    let emptyMsg = '';

    if (_activeTab === 'saved') {
      items = _filterItems(UserProfileService.getSaved());
      emptyMsg = 'Aún no has guardado contenido. Usa el botón Guardar en cualquier tutorial.';
    } else if (_activeTab === 'favorites') {
      items = _filterItems(UserProfileService.getFavorites());
      emptyMsg = 'No tienes favoritos. Marca cursos con el corazón en Tutoriales.';
    } else if (_activeTab === 'certifications') {
      items = _filterItems(UserProfileService.getCertifications());
      emptyMsg = 'Para certificarte: completa lecciones (≥80% promedio), aprueba el quiz (≥70%) y el examen final (≥80%).';
    } else {
      const progress = UserProfileService.getQuizProgress();
      items = _filterItems(Object.entries(progress).map(([refId, data]) => ({
        id: `quiz-${refId}`,
        refId,
        type: 'quiz',
        title: data.title || refId,
        desc: `${data.correct}/${data.total} respuestas correctas`,
        icon: data.icon,
        pct: data.pct,
        visitedAt: data.completedAt,
      })));
      emptyMsg = 'Completa un quiz para ver tu historial aquí.';
    }

    if (!items.length) {
      $list.innerHTML = '';
      $empty.hidden = false;
      $empty.querySelector('p').textContent = emptyMsg;
      return;
    }

    $empty.hidden = true;
    const listType = _activeTab === 'quizzes' ? 'quizzes' : _activeTab;

    if (_activeTab === 'certifications') {
      $list.innerHTML = items.map(cert => _renderCertCard(cert)).join('');
    } else {
      $list.innerHTML = items.map(item => _renderItemCard(item, listType)).join('');
    }

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
        _renderAll();
      });
    });
  }

  function _renderHeader() {
    const user = UserProfileService.getCurrentUser();
    if (!user) return;

    const displayName = user.name?.trim() || user.email?.split('@')[0] || 'Usuario';

    document.getElementById('profile-name').textContent = displayName;
    document.getElementById('profile-email').textContent = user.email || '';
    document.getElementById('profile-avatar-lg').textContent = displayName.charAt(0).toUpperCase();
  }

  function _setTab(tab) {
    _activeTab = tab;
    document.querySelectorAll('.prof-tab').forEach(el => {
      const active = el.dataset.tab === tab;
      el.classList.toggle('prof-tab--active', active);
      el.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.prof-stat-card').forEach(el => {
      el.classList.toggle('prof-stat-card--active', el.dataset.tabTarget === tab);
    });
    _renderList();
  }

  function _renderAll() {
    _renderHeader();
    _renderStats();
    _renderList();
  }

  function init() {
    const user = UserProfileService.getCurrentUser();
    if (!user) {
      window.location.replace('login.html');
      return;
    }

    AppShell.initPage(null);

    document.getElementById('profile-logout-btn')?.addEventListener('click', () => {
      if (confirm('¿Cerrar sesión?')) AppShell.logout();
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

    document.getElementById('search-input')?.addEventListener('input', e => {
      _searchQuery = e.target.value;
      _renderList();
    });

    window.addEventListener(UserProfileService.EVENT, _refreshProfile);
    window.addEventListener('storage', e => {
      if (e.key?.startsWith('in4mind_profile_')) _renderAll();
    });

    window.addEventListener('pageshow', () => _refreshProfile());

    UserProfileService.syncCertificationsFromQuizzes();
    _renderAll();
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = ProfileController;
