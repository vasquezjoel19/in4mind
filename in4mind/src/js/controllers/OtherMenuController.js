'use strict';

/**
 * IN4MIND — Menú «Otros» del sidebar (enlaces secundarios y acciones de cuenta).
 */
const OtherMenuController = (() => {

  let _bound = false;
  let _prevFocus = null;
  let _focusTrapHandler = null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _themePreference() {
    if (typeof ThemeController !== 'undefined' && ThemeController.getPreference) {
      return ThemeController.getPreference();
    }
    const saved = localStorage.getItem('in4mind_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  }

  function _syncThemeCards(pref) {
    const preference = pref || _themePreference();
    document.querySelectorAll('#other-overlay [data-theme-pref]').forEach((b) => {
      const active = b.dataset.themePref === preference;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
  }

  function _appearanceBlock() {
    const pref = _themePreference();
    const label = _t('otherMenu.appearance', null, 'Apariencia');
    const hint = _t('otherMenu.appearanceHint', null, 'Elige el modo visual de IN4MIND');
    const light = _t('otherMenu.themeLight', null, 'Claro');
    const dark = _t('otherMenu.themeDark', null, 'Oscuro');
    const system = _t('otherMenu.themeSystem', null, 'Sistema');
    return `
      <div class="other-menu__appearance" role="group" aria-label="${label}">
        <div class="other-menu__appearance-head">
          <span class="other-menu__section-label">${label}</span>
          <span class="other-menu__hint">${hint}</span>
        </div>
        <div class="settings-theme-grid other-menu__theme-grid" role="radiogroup" aria-label="${label}">
          <button type="button" class="settings-theme-card ${pref === 'light' ? 'is-active' : ''}" data-theme-pref="light" role="radio" aria-checked="${pref === 'light'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--light" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
            </div>
            <span class="settings-theme-card__label">${light}</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'dark' ? 'is-active' : ''}" data-theme-pref="dark" role="radio" aria-checked="${pref === 'dark'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--dark" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label">${dark}</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'system' ? 'is-active' : ''}" data-theme-pref="system" role="radio" aria-checked="${pref === 'system'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--system" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label">${system}</span>
          </button>
        </div>
      </div>
      <div class="other-menu__divider" role="separator"></div>`;
  }

  function _items() {
    const items = [
      { type: 'link', href: 'help.html', icon: 'help', label: _t('otherMenu.help', null, 'Centro de ayuda'), hint: _t('otherMenu.helpHint', null, 'FAQ y asistente') },
      { type: 'link', href: 'profile.html', icon: 'profile', label: _t('otherMenu.profile', null, 'Mi perfil'), hint: _t('otherMenu.profileHint', null, 'Certificados y progreso') },
      { type: 'link', href: 'verify.html', icon: 'verify', label: _t('otherMenu.verify', null, 'Verificar certificado') },
      { type: 'divider' },
      { type: 'link', href: 'privacidad.html', icon: 'privacy', label: _t('otherMenu.privacy', null, 'Privacidad') },
      { type: 'link', href: 'terminos.html', icon: 'terms', label: _t('otherMenu.terms', null, 'Términos de uso') },
      { type: 'link', href: 'cookies.html', icon: 'cookies', label: _t('otherMenu.cookies', null, 'Cookies') },
    ];

    const actions = [];
    if (typeof AppFeatures !== 'undefined') {
      actions.push({ type: 'action', action: 'search', icon: 'search', label: _t('otherMenu.shortcuts', null, 'Búsqueda rápida'), hint: _t('otherMenu.shortcutsHint', null, 'Ctrl+K') });
    }
    if (typeof DataExportService !== 'undefined') {
      actions.push({ type: 'action', action: 'export', icon: 'export', label: _t('otherMenu.export', null, 'Exportar mis datos') });
    }
    if (typeof AuthService !== 'undefined') {
      actions.push({ type: 'action', action: 'logout', icon: 'logout', label: _t('otherMenu.logout', null, 'Cerrar sesión'), danger: true });
    }
    if (actions.length) {
      items.push({ type: 'divider' }, ...actions);
    }

    items.push(
      { type: 'divider' },
      { type: 'link', href: 'index.html', icon: 'home', label: _t('otherMenu.home', null, 'Volver al inicio') }
    );
    return items;
  }

  function _icon(name) {
    const icons = {
      help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      profile: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      verify: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
      privacy: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
      terms: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
      cookies: '<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none"/>',
      search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
      export: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
      logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
  }

  function _renderList() {
    const links = _items().map(item => {
      if (item.type === 'divider') return '<div class="other-menu__divider" role="separator"></div>';
      const arrow = '<svg class="other-menu__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
      const hint = item.hint ? `<span class="other-menu__hint">${item.hint}</span>` : '';
      const danger = item.danger ? ' other-menu__item--danger' : '';

      if (item.type === 'link') {
        return `
          <a class="other-menu__item${danger}" href="${item.href}">
            <span class="other-menu__icon">${_icon(item.icon)}</span>
            <span class="other-menu__text">
              <span class="other-menu__label">${item.label}</span>
              ${hint}
            </span>
            ${arrow}
          </a>`;
      }

      return `
        <button type="button" class="other-menu__item${danger}" data-other-action="${item.action}">
          <span class="other-menu__icon">${_icon(item.icon)}</span>
          <span class="other-menu__text">
            <span class="other-menu__label">${item.label}</span>
            ${hint}
          </span>
          ${arrow}
        </button>`;
    }).join('');

    return _appearanceBlock() + links;
  }

  function _buildModal() {
    if (document.getElementById('other-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'other-overlay';
    overlay.className = 'settings-overlay other-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = `
      <div class="settings-modal other-modal" role="dialog" aria-modal="true" aria-labelledby="other-modal-title">
        <header class="settings-modal__header">
          <h2 class="settings-modal__title" id="other-modal-title">${_t('otherMenu.title', null, 'Otros')}</h2>
          <button type="button" class="settings-modal__close" id="other-close" aria-label="${_t('otherMenu.close', null, 'Cerrar')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <nav class="other-menu__list" id="other-menu-list" aria-label="${_t('otherMenu.title', null, 'Otros')}">
          ${_renderList()}
        </nav>
      </div>`;

    document.body.appendChild(overlay);
  }

  function _refreshList() {
    const list = document.getElementById('other-menu-list');
    if (list) list.innerHTML = _renderList();
    const title = document.getElementById('other-modal-title');
    if (title) title.textContent = _t('otherMenu.title', null, 'Otros');
  }

  function _lockBackground() {
    document.body.classList.add('other-modal-open');
    document.documentElement.classList.add('other-modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'other-overlay') el.setAttribute('inert', '');
    });
  }

  function _unlockBackground() {
    document.body.classList.remove('other-modal-open');
    document.documentElement.classList.remove('other-modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'other-overlay') el.removeAttribute('inert');
    });
  }

  function _activateFocusTrap() {
    const modal = document.querySelector('#other-overlay .other-modal');
    if (!modal) return;
    _focusTrapHandler = e => {
      if (e.key !== 'Tab' || !document.getElementById('other-overlay')?.classList.contains('is-open')) return;
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', _focusTrapHandler);
  }

  function _deactivateFocusTrap() {
    if (_focusTrapHandler) {
      document.removeEventListener('keydown', _focusTrapHandler);
      _focusTrapHandler = null;
    }
  }

  function close() {
    const overlay = document.getElementById('other-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    _deactivateFocusTrap();
    _unlockBackground();
    if (_prevFocus && typeof _prevFocus.focus === 'function') {
      _prevFocus.focus();
    }
    _prevFocus = null;
  }

  function open() {
    if (typeof SettingsController !== 'undefined' && SettingsController.close) {
      SettingsController.close();
    }
    _buildModal();
    _refreshList();
    const overlay = document.getElementById('other-overlay');
    if (!overlay) return;
    _prevFocus = document.activeElement;
    overlay.hidden = false;
    overlay.classList.add('is-open');
    _lockBackground();
    _activateFocusTrap();
    document.getElementById('other-close')?.focus();
  }

  async function _runAction(action) {
    if (action === 'search') {
      close();
      if (typeof AppFeatures !== 'undefined' && AppFeatures.openSearch) {
        AppFeatures.openSearch();
      }
      return;
    }
    if (action === 'export') {
      if (typeof DataExportService !== 'undefined') {
        DataExportService.downloadJson();
      }
      close();
      return;
    }
    if (action === 'logout') {
      const msg = _t('profile.logoutConfirm', null, '¿Cerrar sesión?');
      if (!confirm(msg)) return;
      close();
      if (typeof AuthService !== 'undefined') await AuthService.logout();
      if (typeof AppShell !== 'undefined') AppShell.logout();
      else location.href = 'index.html';
    }
  }

  function _handleOtherNav(e) {
    const otherNav = e.target.closest(
      '#sidebar .nav-item[data-nav="other"], #sidebar-footer .nav-item[data-nav="other"], [data-open-other-menu]'
    );
    if (!otherNav) return false;
    e.preventDefault();
    e.stopPropagation();
    open();
    if (typeof SidebarController !== 'undefined') SidebarController.closeMobile?.();
    return true;
  }

  function _bindGlobal() {
    if (_bound) return;
    _bound = true;

    document.addEventListener('click', e => {
      if (_handleOtherNav(e)) return;

      const themeBtn = e.target.closest('#other-overlay [data-theme-pref]');
      if (themeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pref = themeBtn.dataset.themePref;
        if (typeof ThemeController !== 'undefined' && ThemeController.setPreference) {
          ThemeController.setPreference(pref);
        }
        _syncThemeCards(pref);
        return;
      }

      const actionBtn = e.target.closest('[data-other-action]');
      if (actionBtn) {
        e.preventDefault();
        void _runAction(actionBtn.dataset.otherAction);
        return;
      }
      if (e.target.closest('#other-close')) {
        e.preventDefault();
        close();
        return;
      }
      if (e.target.id === 'other-overlay') {
        close();
      }
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('other-overlay')?.classList.contains('is-open')) {
        close();
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      _handleOtherNav(e);
    }, true);

    window.addEventListener('in4mind-relocalize', () => {
      if (document.getElementById('other-overlay')?.classList.contains('is-open')) {
        _refreshList();
      }
    });

    window.addEventListener('in4mind-theme-change', (e) => {
      const pref = e.detail?.preference || _themePreference();
      _syncThemeCards(pref);
    });
  }

  function init() {
    _buildModal();
    _bindGlobal();
  }

  return { init, open, close };

})();

if (typeof module !== 'undefined') module.exports = OtherMenuController;
