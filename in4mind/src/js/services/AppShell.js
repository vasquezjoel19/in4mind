/**
 * IN4MIND — Utilidades compartidas del shell de la app
 */

'use strict';

const AppShell = (() => {

  const SESSION_KEYS = [
    'in4mind_user',
    'in4mind_open_course',
    'in4mind_open_quiz',
    'in4mind_open_destination',
    'in4mind_ai_recent',
    'in4mind_quiz_progress',
  ];

  const PROFILE_HREF = 'profile.html';
  const HELP_HREF = 'help.html';
  let _avatarBound = false;
  let _helpBound = false;

  function clearSession() {
    SESSION_KEYS.forEach(k => sessionStorage.removeItem(k));
    if (typeof SessionStore !== 'undefined') {
      const remembered = SessionStore.isRemembered();
      SessionStore.clear({ keepEmail: true, keepPassword: remembered });
    }
  }

  function logout() {
    if (typeof AuthService !== 'undefined') {
      // Cierra también la sesión de Supabase; no se espera para no bloquear.
      Promise.resolve(AuthService.logout()).catch(() => {});
    }
    clearSession();
    window.location.replace('login.html');
  }

  function showToast(message, duration = 2600) {
    let el = document.getElementById('app-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast';
      el.className = 'app-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('app-toast--visible');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('app-toast--visible'), duration);
  }

  function _goToProfile() {
    navigateTo(PROFILE_HREF);
  }

  /**
   * Navegación con crossfade suave entre páginas de la app.
   * @param {string} href
   */
  function navigateTo(href) {
    if (!href) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      window.location.assign(href);
      return;
    }
    const main = document.querySelector('.main-area') || document.body;
    if (main.classList.contains('page-exit')) {
      window.location.assign(href);
      return;
    }
    main.classList.add('page-exit');
    window.setTimeout(() => {
      window.location.assign(href);
    }, 220);
  }

  /** Delegación global: avatar → perfil (fase capture, antes que otros handlers). */
  function _bindAvatarNavigation() {
    if (_avatarBound) return;
    _avatarBound = true;

    document.addEventListener('click', e => {
      const avatar = e.target.closest('#avatar, a.avatar');
      if (!avatar) return;
      e.preventDefault();
      e.stopPropagation();
      _goToProfile();
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const avatar = e.target.closest('#avatar, a.avatar');
      if (!avatar) return;
      e.preventDefault();
      _goToProfile();
    });
  }

  /** Delegación global: icono de ayuda → centro de ayuda. */
  function _bindHelpNavigation() {
    if (_helpBound) return;
    _helpBound = true;

    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-help-link], a.icon-btn[href="help.html"], button.icon-btn[aria-label="Ayuda"], a[href="help.html"]');
      if (!trigger) return;
      if (trigger.closest('#sidebar')) return;
      e.preventDefault();
      navigateTo(HELP_HREF);
    }, true);
  }

  function setupAvatar() {
    _bindAvatarNavigation();
    _bindHelpNavigation();
    _bindAvatarNavigation();

    const $avatar = document.getElementById('avatar');
    if (!$avatar) return;

    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    const label = user?.name?.trim() || user?.email?.split('@')[0] ||
      (typeof I18n !== 'undefined' ? I18n.t('shell.user') : 'Usuario');

    if ($avatar.tagName !== 'A') {
      const link = document.createElement('a');
      link.id = 'avatar';
      link.className = $avatar.className || 'avatar';
      link.href = PROFILE_HREF;
      link.textContent = label.charAt(0).toUpperCase();
      $avatar.replaceWith(link);
      return setupAvatar();
    }

    $avatar.href = PROFILE_HREF;
    $avatar.textContent = label.charAt(0).toUpperCase();
    $avatar.setAttribute('aria-label', typeof I18n !== 'undefined'
      ? I18n.t('shell.profileLabel', { name: label })
      : `Mi perfil — ${label}`);
    $avatar.removeAttribute('title');
    $avatar.style.cursor = 'pointer';
  }

  function navIcon(iconId) {
    const ICONS = {
      home:      '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      book:      '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
      notes:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
      projects:  '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
      quiz:      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      bot:       '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>',
      user:      '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
      more:      '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconId] || ''}</svg>`;
  }

  function renderNavItem(item, isActive = false) {
    const href = item.href || '';
    const inner = `${navIcon(item.icon)}<span>${item.label}</span>`;
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

  function renderSidebar(activeId) {
    const navMain   = DataService.getNavItems();
    const navFooter = DataService.getNavFooter();
    const $nav   = document.getElementById('sidebar-nav');
    const $footer = document.getElementById('sidebar-footer');
    if ($nav) {
      $nav.innerHTML = navMain.map(it => renderNavItem(it, activeId ? it.id === activeId : false)).join('');
    }
    if ($footer) {
      $footer.innerHTML = navFooter.map(it => renderNavItem(it, false)).join('');
    }
    SidebarController.init();
  }

  /**
   * Inicialización común de todas las páginas de la app.
   * @param {string|null} activeNavId — 'home' | 'tutorials' | 'quizzes' | 'ai' | null
   */
  function initPage(activeNavId = null) {
    _bindAvatarNavigation();
    _bindHelpNavigation();

    if (typeof UserProfileService !== 'undefined') {
      const user = UserProfileService.getCurrentUser();
      if (user?.email) {
        UserProfileService.mergeGuestIntoUser(user.email);
      }
      UserProfileService.migrateSessionQuizProgress();
    }

    renderSidebar(activeNavId);
    setupAvatar();

    if (typeof SettingsController !== 'undefined') {
      SettingsController.init();
    }

    if (typeof OtherMenuController !== 'undefined') {
      OtherMenuController.init();
    }

    if (typeof AppFeatures !== 'undefined') {
      AppFeatures.init(activeNavId);
    }

    if (typeof CursorSpotlight !== 'undefined') {
      CursorSpotlight.init({ intensity: 'app' });
    }

    const main = document.querySelector('.main-area');
    if (main && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => main.classList.add('page-enter'));
    } else if (main) {
      main.classList.add('page-enter');
    }
  }

  return {
    clearSession,
    logout,
    setupAvatar,
    renderSidebar,
    initPage,
    navigateTo,
    showToast,
    navIcon,
    renderNavItem,
  };

})();

if (typeof document !== 'undefined') {
  const boot = () => {
    if (typeof AppShell !== 'undefined') {
      AppShell.setupAvatar();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

if (typeof module !== 'undefined') module.exports = AppShell;
