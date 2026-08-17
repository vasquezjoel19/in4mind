'use strict';

/**
 * IN4MIND — Funciones globales de la app: notificaciones, búsqueda, bottom nav, onboarding, PWA.
 */
const AppFeatures = (() => {

  const ONBOARD_KEY = 'in4mind_onboarding_done';
  let _activeNav = null;
  let _notifOpen = false;
  let _searchOpen = false;
  let _notifications = [];

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _navigateItem(item) {
    if (!item) return;

    if (item.type === 'note' && item.noteId) {
      window.location.href = `notes.html?note=${encodeURIComponent(item.noteId)}`;
      return;
    }
    if (item.type === 'project' && item.projectId) {
      window.location.href = `projects.html?project=${encodeURIComponent(item.projectId)}`;
      return;
    }
    if (item.type === 'guided' && item.route) {
      window.location.href = item.route;
      return;
    }
    if (item.type === 'quiz') {
      if (item.quizId) sessionStorage.setItem('in4mind_open_quiz', item.quizId);
      else if (item.courseId) sessionStorage.setItem('in4mind_open_quiz', item.courseId);
      const q = item.quizId || item.courseId;
      window.location.href = q
        ? `quizzes.html?quiz=${encodeURIComponent(q)}`
        : 'quizzes.html';
      return;
    }
    if (item.type === 'lesson' && item.courseId) {
      sessionStorage.setItem('in4mind_open_course', item.courseId);
      const lesson = item.lessonId ? `&lesson=${encodeURIComponent(item.lessonId)}` : '';
      window.location.href = `tutorial.html?course=${encodeURIComponent(item.courseId)}${lesson}`;
      return;
    }
    if (item.courseId) sessionStorage.setItem('in4mind_open_course', item.courseId);
    if (item.route) {
      let url = item.hash ? `${item.route}${item.hash}` : item.route;
      if (item.type === 'course' && item.courseId && !/[?&]course=/.test(url)) {
        url = `tutorial.html?course=${encodeURIComponent(item.courseId)}`;
      }
      window.location.href = url;
    }
  }

  // ── Notificaciones ───────────────────────────────────────────

  function _ensureNotifPanel() {
    let panel = document.getElementById('app-notif-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'app-notif-panel';
    panel.className = 'app-notif-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="app-notif-panel__head">
        <h2 class="app-notif-panel__title">${_t('notif.panelTitle', null, 'Notificaciones')}</h2>
        <button type="button" class="app-notif-panel__mark" id="app-notif-mark-all">${_t('notif.markAll', null, 'Marcar leídas')}</button>
      </div>
      <ul class="app-notif-panel__list" id="app-notif-list" role="list"></ul>
      <p class="app-notif-panel__empty" id="app-notif-empty" hidden>${_t('notif.empty', null, 'No hay notificaciones nuevas.')}</p>`;
    document.body.appendChild(panel);
    document.getElementById('app-notif-mark-all')?.addEventListener('click', () => {
      NotificationService.markAllRead(_notifications);
      void _refreshNotifications();
    });
    return panel;
  }

  function _renderNotifList() {
    const list = document.getElementById('app-notif-list');
    const empty = document.getElementById('app-notif-empty');
    if (!list) return;
    if (!_notifications.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = _notifications.map(n => {
      const read = NotificationService.isRead(n);
      const high = NotificationService.isHighPriority(n);
      return `
      <li class="app-notif-item ${read ? 'app-notif-item--read' : ''} ${high ? 'app-notif-item--priority' : ''}"
          data-notif-id="${n.id}" role="listitem" tabindex="0">
        <span class="app-notif-item__dot" aria-hidden="true"></span>
        <div class="app-notif-item__content">
          <p class="app-notif-item__title">${n.title}</p>
          <p class="app-notif-item__body">${n.body}</p>
        </div>
        <button type="button" class="app-notif-item__snooze" data-snooze="${n.id}"
                aria-label="${_t('notif.snooze', null, 'Recordar mañana')}">⏱</button>
      </li>`;
    }).join('');
    list.querySelectorAll('.app-notif-item').forEach((el, i) => {
      const notif = _notifications[i];
      const open = () => {
        NotificationService.markRead(notif);
        _notifOpen = false;
        _ensureNotifPanel().hidden = true;
        _updateNotifBadge();
        _navigateItem(notif);
      };
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-snooze]')) return;
        open();
      });
      el.querySelector('[data-snooze]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        NotificationService.snooze(notif, 24);
        void _refreshNotifications();
      });
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          if (ev.target.closest('[data-snooze]')) return;
          ev.preventDefault();
          open();
        }
      });
    });
  }

  function _updateNotifBadge() {
    const unread = NotificationService.getUnreadCount(_notifications);
    document.querySelectorAll('[data-notifications-btn]').forEach(btn => {
      let badge = btn.querySelector('.icon-btn__badge');
      if (unread > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'icon-btn__badge';
          badge.setAttribute('aria-hidden', 'true');
          btn.appendChild(badge);
        }
        badge.textContent = unread > 9 ? '9+' : String(unread);
        badge.hidden = false;
      } else if (badge) {
        badge.hidden = true;
      }
    });
  }

  async function _refreshNotifications() {
    if (typeof NotificationService === 'undefined') return;
    _notifications = await NotificationService.buildNotifications();
    _renderNotifList();
    _updateNotifBadge();
    if (typeof PushNotificationService !== 'undefined') {
      PushNotificationService.syncUsefulReminders(_notifications);
    }
  }

  function _toggleNotifPanel() {
    const panel = _ensureNotifPanel();
    _notifOpen = !_notifOpen;
    panel.hidden = !_notifOpen;
    if (_notifOpen) void _refreshNotifications();
  }

  function _bindNotifications() {
    document.querySelectorAll('.topbar__actions .icon-btn[aria-label], [data-notifications-btn]').forEach(btn => {
      const label = btn.getAttribute('aria-label') || '';
      const isNotif = btn.hasAttribute('data-notifications-btn')
        || /notific/i.test(label)
        || (typeof I18n !== 'undefined' && label === I18n.t('shell.notifications'));
      if (!isNotif || btn.dataset.notifBound) return;
      btn.dataset.notifBound = '1';
      btn.setAttribute('data-notifications-btn', '');
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        _toggleNotifPanel();
      });
    });
    document.addEventListener('click', e => {
      if (!_notifOpen) return;
      const panel = document.getElementById('app-notif-panel');
      const btn = e.target.closest('[data-notifications-btn]');
      if (panel && !panel.contains(e.target) && !btn) {
        _notifOpen = false;
        panel.hidden = true;
      }
    });
    window.addEventListener(NotificationService?.EVENT || 'in4mind-notifications-updated', () => {
      void _refreshNotifications();
    });
    if (typeof UserProfileService !== 'undefined') {
      window.addEventListener(UserProfileService.EVENT, () => void _refreshNotifications());
    }
  }

  // ── Búsqueda global ──────────────────────────────────────────

  function _ensureSearchModal() {
    let modal = document.getElementById('global-search-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'global-search-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="global-search-modal__backdrop" data-close-search></div>
      <div class="global-search-modal__dialog" role="dialog" aria-modal="true" aria-label="${_t('search.title', null, 'Búsqueda global')}">
        <div class="global-search-modal__input-wrap">
          <input type="search" id="global-search-input" class="global-search-modal__input"
                 placeholder="${_t('search.placeholder', null, 'Buscar cursos, lecciones, quizzes…')}"
                 autocomplete="off" />
          <kbd class="global-search-modal__kbd">Esc</kbd>
        </div>
        <div class="global-search-modal__results" id="global-search-results"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close-search]')?.addEventListener('click', _closeSearch);
    const input = document.getElementById('global-search-input');
    let timer = null;
    input?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => _renderSearchResults(input.value), 120);
    });
    input?.addEventListener('keydown', e => {
      if (e.key === 'Escape') _closeSearch();
    });
    return modal;
  }

  function _renderSearchResults(query) {
    const root = document.getElementById('global-search-results');
    if (!root || typeof GlobalSearchService === 'undefined') return;
    const q = (query || '').trim();
    if (q.length < 2) {
      root.innerHTML = `<p class="global-search-modal__hint">${_t('search.hint', null, 'Escribe al menos 2 caracteres. Atajo: / o Ctrl+K')}</p>`;
      return;
    }
    const results = GlobalSearchService.search(q);
    const groups = ['courses', 'lessons', 'quizzes', 'notes', 'projects', 'guided', 'help'];
    const typeMap = {
      courses: 'course', lessons: 'lesson', quizzes: 'quiz', help: 'help',
      notes: 'note', projects: 'project', guided: 'guided',
    };
    let html = '';
    groups.forEach(g => {
      const items = results[g];
      if (!items?.length) return;
      html += `<div class="global-search-group"><h3 class="global-search-group__title">${GlobalSearchService.groupLabel(typeMap[g])}</h3><ul role="list">`;
      items.forEach(item => {
        html += `<li class="global-search-item" data-search-item tabindex="0" role="listitem">
          <span class="global-search-item__title">${item.title}</span>
          <span class="global-search-item__sub">${item.subtitle || ''}</span>
        </li>`;
      });
      html += '</ul></div>';
    });
    root.innerHTML = html || `<p class="global-search-modal__hint">${_t('common.noResults', null, 'Sin resultados.')}</p>`;
    // Flatten in the same group order used above
    const flat = groups.flatMap(g => results[g] || []);
    root.querySelectorAll('[data-search-item]').forEach((el, i) => {
      const item = flat[i];
      if (!item) return;
      const go = () => { _closeSearch(); _navigateItem(item); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
    });
  }

  function _openSearch(prefill = '') {
    const modal = _ensureSearchModal();
    modal.hidden = false;
    _searchOpen = true;
    const input = document.getElementById('global-search-input');
    if (input) {
      input.value = prefill;
      _renderSearchResults(prefill);
      setTimeout(() => input.focus(), 50);
    }
  }

  function _closeSearch() {
    const modal = document.getElementById('global-search-modal');
    if (modal) modal.hidden = true;
    _searchOpen = false;
  }

  function _bindGlobalSearch() {
    document.addEventListener('keydown', e => {
      if ((e.key === '/' && !/input|textarea/i.test(e.target.tagName)) || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        _openSearch();
      }
    });
    document.querySelectorAll('#search-input, .search-bar__input').forEach(input => {
      if (input.dataset.globalSearchBound) return;
      if (input.dataset.helpAssistant) return;
      input.dataset.globalSearchBound = '1';
      input.addEventListener('focus', () => {
        if (typeof GlobalSearchService !== 'undefined') _openSearch(input.value);
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.value.trim().length >= 2) {
          e.preventDefault();
          _openSearch(e.target.value);
        }
      });
    });
  }

  // ── Bottom navigation (móvil) ────────────────────────────────

  function _renderBottomNav(activeId) {
    if (!document.querySelector('.dashboard, .main-area')) return;
    let nav = document.getElementById('app-bottom-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'app-bottom-nav';
      nav.className = 'app-bottom-nav';
      nav.setAttribute('aria-label', _t('shell.mainNav', null, 'Navegación principal'));
      document.body.appendChild(nav);
    }
    const items = [
      { id: 'home', label: _t('nav.home', null, 'Inicio'), icon: 'home', href: 'dashboard.html' },
      { id: 'tutorials', label: _t('nav.tutorials', null, 'Cursos'), icon: 'book', href: 'tutorial.html' },
      { id: 'quizzes', label: _t('nav.quizzes', null, 'Quizzes'), icon: 'quiz', href: 'quizzes.html' },
      { id: 'ai', label: _t('nav.ai', null, 'IA'), icon: 'bot', href: 'ai.html' },
      { id: 'profile', label: _t('shell.myProfile', null, 'Perfil'), icon: 'user', href: 'profile.html' },
    ];
    nav.innerHTML = items.map(it => `
      <a href="${it.href}" class="app-bottom-nav__item ${activeId === it.id ? 'app-bottom-nav__item--active' : ''}"
         ${activeId === it.id ? 'aria-current="page"' : ''}>
        ${typeof AppShell !== 'undefined' ? AppShell.navIcon(it.icon) : ''}
        <span>${it.label}</span>
      </a>`).join('');
  }

  // ── Onboarding ───────────────────────────────────────────────

  const ONBOARD_STEPS = [
    { sel: '#resume-grid, .resume-section', key: 'onboard.resume' },
    { sel: '#quick-actions-grid, .quick-actions-section', key: 'onboard.quick' },
    { sel: '#recommended-track, .recommended-section', key: 'onboard.recommend' },
    { sel: 'a[href="ai.html"], [data-nav="ai"]', key: 'onboard.ai' },
  ];

  function _startOnboarding() {
    if (localStorage.getItem(ONBOARD_KEY) === '1') return;
    if (!document.getElementById('resume-grid') && !document.querySelector('.quick-actions-section')) return;

    let step = 0;
    let overlay = document.getElementById('onboard-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'onboard-overlay';
      overlay.className = 'onboard-overlay';
      overlay.innerHTML = `
        <div class="onboard-card" role="dialog" aria-modal="true">
          <p class="onboard-card__step" id="onboard-step-label"></p>
          <h2 class="onboard-card__title" id="onboard-title"></h2>
          <p class="onboard-card__body" id="onboard-body"></p>
          <div class="onboard-card__actions">
            <button type="button" class="prof-btn" id="onboard-skip">${_t('onboard.skip', null, 'Omitir')}</button>
            <button type="button" class="prof-btn prof-btn--primary" id="onboard-next">${_t('onboard.next', null, 'Siguiente')}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.getElementById('onboard-skip')?.addEventListener('click', _finishOnboarding);
      document.getElementById('onboard-next')?.addEventListener('click', () => {
        step += 1;
        if (step >= ONBOARD_STEPS.length) _finishOnboarding();
        else _showOnboardStep(step);
      });
    }

    function _showOnboardStep(idx) {
      const s = ONBOARD_STEPS[idx];
      document.getElementById('onboard-step-label').textContent = _t('onboard.step', { n: idx + 1, total: ONBOARD_STEPS.length }, `Paso ${idx + 1} de ${ONBOARD_STEPS.length}`);
      document.getElementById('onboard-title').textContent = _t(`${s.key}Title`, null, '');
      document.getElementById('onboard-body').textContent = _t(`${s.key}Body`, null, '');
      document.querySelector(s.sel)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function _finishOnboarding() {
      localStorage.setItem(ONBOARD_KEY, '1');
      overlay?.remove();
    }

    overlay.hidden = false;
    _showOnboardStep(0);
  }

  // ── PWA ──────────────────────────────────────────────────────

  function _registerPWA() {
    if (!('serviceWorker' in navigator)) return;
    const isAppPage = /dashboard|tutorial|quizzes|ai|profile|help/.test(window.location.pathname);
    if (!isAppPage) return;
    navigator.serviceWorker.register('sw.js?v=20260817nobanners34').catch(() => {});
  }

  function _injectManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'manifest.json';
    document.head.appendChild(link);
  }

  // ── Init ───────────────────────────────────────────────────

  function init(activeNavId = null) {
    _activeNav = activeNavId;
    if (typeof AccessibilityService !== 'undefined') AccessibilityService.initEarly();
    if (typeof CookieConsent !== 'undefined') CookieConsent.init();
    _bindNotifications();
    _bindGlobalSearch();
    _renderBottomNav(activeNavId === 'home' ? 'home' : activeNavId);
    _injectManifest();
    _registerPWA();
    void _refreshNotifications();

    if (typeof ContentLoader !== 'undefined') void ContentLoader.load();

    if (activeNavId === 'home') {
      setTimeout(_startOnboarding, 800);
    }
  }

  return {
    init,
    refreshNotifications: _refreshNotifications,
    openSearch: _openSearch,
    closeSearch: _closeSearch,
  };

})();

if (typeof module !== 'undefined') module.exports = AppFeatures;
