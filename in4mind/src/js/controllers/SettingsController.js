'use strict';

/**
 * IN4MIND — Modal flotante de Ajustes (estilo banner Copilot + secciones IN4MIND)
 */
const SettingsController = (() => {

  const NOTIF_KEY = 'in4mind_notif_prefs';
  let _panel = 'general';
  let _bound = false;
  let _prevFocus = null;
  let _focusTrapHandler = null;

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : k;
  }

  function _icon(name) {
    const icons = {
      general: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
      account: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      notifications: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
      appearance: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>',
      language: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
      privacy: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
  }

  function _navItems() {
    return [
      { id: 'general', icon: 'general', label: _t('settingsModal.navGeneral') },
      { id: 'account', icon: 'account', label: _t('settingsModal.navAccount') },
      { id: 'notifications', icon: 'notifications', label: _t('settingsModal.navNotifications') },
      { id: 'appearance', icon: 'appearance', label: _t('settingsModal.navAppearance') },
      { id: 'language', icon: 'language', label: _t('settingsModal.navLanguage') },
      { id: 'accessibility', icon: 'appearance', label: _t('settingsModal.navAccessibility', null, 'Accesibilidad') },
      { id: 'privacy', icon: 'privacy', label: _t('settingsModal.navPrivacy') },
    ];
  }

  function _getNotifPrefs() {
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _saveNotifPrefs(prefs) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  }

  function _themePreference() {
    if (typeof ThemeController !== 'undefined' && ThemeController.getPreference) {
      return ThemeController.getPreference();
    }
    const saved = localStorage.getItem('in4mind_theme');
    if (saved === 'system') return 'system';
    return saved === 'dark' ? 'dark' : 'light';
  }

  function _syncThemeCards(pref) {
    const preference = pref || _themePreference();
    document.querySelectorAll('#settings-overlay [data-theme-pref]').forEach((b) => {
      const active = b.dataset.themePref === preference;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
  }

  function _isProfilePage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return /(?:^|\/)profile\.html$/i.test(path) || /\/profile\/?$/i.test(path);
  }

  function _resetModalState() {
    document.body.classList.remove('settings-modal-open');
    document.documentElement.classList.remove('settings-modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'settings-overlay') el.removeAttribute('inert');
    });
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.hidden = true;
    }
    _deactivateFocusTrap();
    _prevFocus = null;
  }

  function _ensureOverlay() {
    let overlay = document.getElementById('settings-overlay');
    if (!overlay) {
      _buildModal();
      overlay = document.getElementById('settings-overlay');
    }
    if (overlay) document.body.appendChild(overlay);
    return overlay;
  }

  function _buildModal() {
    if (document.getElementById('settings-overlay')) return;

    const navHtml = _navItems().map(n => `
      <button type="button" class="settings-nav__btn ${_panel === n.id ? 'is-active' : ''}"
              data-settings-panel="${n.id}">
        ${_icon(n.icon)}
        <span data-i18n="settingsModal.nav${n.id.charAt(0).toUpperCase() + n.id.slice(1)}">${n.label}</span>
      </button>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'settings-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = `
      <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <header class="settings-modal__header">
          <h2 class="settings-modal__title" id="settings-modal-title" data-i18n="settingsModal.title">Ajustes</h2>
          <button type="button" class="settings-modal__close" id="settings-close" aria-label="Cerrar" data-i18n-aria="settingsModal.close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <div class="settings-modal__body">
          <nav class="settings-modal__nav" aria-label="Secciones de ajustes" data-i18n-aria="settingsModal.navAria">${navHtml}</nav>
          <div class="settings-modal__content" id="settings-panels"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function _renderPanels() {
    const wrap = document.getElementById('settings-panels');
    if (!wrap) return;

    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    const name = user?.name?.trim() || _t('shell.user');
    const email = user?.email || '—';
    const initial = name.charAt(0).toUpperCase();
    const pref = _themePreference();
    const notif = _getNotifPrefs();
    const emailOn = notif.email !== false;
    const pushOn = notif.push !== false;

    wrap.innerHTML = `
      <section class="settings-panel ${_panel === 'general' ? 'is-active' : ''}" data-panel="general">
        <h3 class="settings-panel__title" data-i18n="settingsModal.generalTitle">General</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.generalSub">Preferencias generales de IN4MIND: idioma, tema y ayuda.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.about">Acerca de IN4MIND</p>
            <p class="settings-row__hint" data-i18n="settingsModal.aboutHint">Plataforma educativa de tecnología.</p>
          </div>
          <a class="settings-row__action" href="help.html" data-i18n="settingsModal.viewHelp">Ver ayuda →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.version">Versión</p>
          </div>
          <span class="settings-row__value">in4mind.2026.07</span>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.weeklyGoals">Metas semanales</p>
            <p class="settings-row__hint" data-i18n="settingsModal.weeklyGoalsHint">Lecciones y quizzes por semana.</p>
          </div>
          <div class="settings-goals-inputs">
            <label><span data-i18n="analytics.weeklyLessons">Lecciones</span>
              <input type="number" id="settings-goal-lessons" min="1" max="20" value="2"></label>
            <label><span data-i18n="analytics.weeklyQuizzes">Quizzes</span>
              <input type="number" id="settings-goal-quizzes" min="1" max="20" value="1"></label>
          </div>
        </div>
        <button type="button" class="settings-btn" id="settings-reset-onboard" data-i18n="settingsModal.resetOnboard">Repetir tour de bienvenida</button>
      </section>

      <section class="settings-panel ${_panel === 'account' ? 'is-active' : ''}" data-panel="account">
        <h3 class="settings-panel__title" data-i18n="settingsModal.accountTitle">Cuenta</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.accountSub">Información de tu perfil y sesión.</p>
        <div class="settings-account__head">
          <div class="settings-account__avatar" id="settings-avatar">${initial}</div>
          <div>
            <p class="settings-account__name" id="settings-name">${name}</p>
            <p class="settings-account__email" id="settings-email">${email}</p>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.editName">Nombre</p>
          </div>
          <div class="settings-row__inline">
            <input type="text" class="settings-input" id="settings-edit-name" value="${name}" maxlength="60">
            <button type="button" class="settings-btn settings-btn--primary" id="settings-save-name" data-i18n="settingsModal.saveName">Guardar</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.profile">Mi perfil</p>
            <p class="settings-row__hint" data-i18n="settingsModal.profileHint">Guardados, favoritos, quizzes y certificaciones.</p>
          </div>
          <a class="settings-row__action" href="profile.html" data-settings-go-profile data-i18n="settingsModal.openProfile">Abrir →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="profile.logout">Cerrar sesión</p>
          </div>
          <button type="button" class="settings-btn settings-btn--danger" id="settings-logout" data-i18n="profile.logout">Cerrar sesión</button>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'notifications' ? 'is-active' : ''}" data-panel="notifications">
        <h3 class="settings-panel__title" data-i18n="settingsModal.notifTitle">Notificaciones</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.notifSub">Elige cómo quieres recibir avisos.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.emailNotif">Notificaciones por correo</p>
            <p class="settings-row__hint" data-i18n="settingsModal.emailNotifHint">Resumen de progreso y certificaciones.</p>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="settings-notif-email" ${emailOn ? 'checked' : ''}>
            <span class="settings-toggle__track"></span>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.pushNotif">Notificaciones en la app</p>
            <p class="settings-row__hint" data-i18n="settingsModal.pushNotifHint">Recordatorios de lecciones y quizzes.</p>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="settings-notif-push" ${pushOn ? 'checked' : ''}>
            <span class="settings-toggle__track"></span>
          </label>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'appearance' ? 'is-active' : ''}" data-panel="appearance">
        <h3 class="settings-panel__title" data-i18n="settingsModal.appearanceTitle">Apariencia</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.appearanceSub">Personaliza el aspecto visual de IN4MIND.</p>
        <div class="settings-appearance__hero">
          <div class="settings-appearance__bulb-wrap">
            <div class="settings-appearance__bulb-glow"></div>
            <div id="settings-bulb-slot"></div>
          </div>
          <div class="settings-appearance__intro">
            <h3 data-i18n="settingsModal.bulbTitle">Diseño IN4MIND</h3>
            <p data-i18n="settingsModal.bulbSub">El foco con circuito representa ideas, tecnología y claridad mental.</p>
          </div>
        </div>
        <p class="settings-row__label" style="margin-bottom:10px" data-i18n="settingsModal.theme">Tema</p>
        <div class="settings-theme-grid" role="radiogroup" aria-label="Tema" data-i18n-aria="settingsModal.theme">
          <button type="button" class="settings-theme-card ${pref === 'light' ? 'is-active' : ''}" data-theme-pref="light" role="radio" aria-checked="${pref === 'light'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--light" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
            </div>
            <span class="settings-theme-card__label" data-i18n="settingsModal.themeLight">Claro</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'dark' ? 'is-active' : ''}" data-theme-pref="dark" role="radio" aria-checked="${pref === 'dark'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--dark" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label" data-i18n="settingsModal.themeDark">Oscuro</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'system' ? 'is-active' : ''}" data-theme-pref="system" role="radio" aria-checked="${pref === 'system'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--system" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label" data-i18n="settingsModal.themeSystem">Sistema</span>
          </button>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'language' ? 'is-active' : ''}" data-panel="language">
        <h3 class="settings-panel__title" data-i18n="settingsModal.languageTitle">Idioma</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.languageSub">El idioma se aplica en toda la aplicación.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="profile.language">Idioma de la interfaz</p>
          </div>
          <div data-lang-switcher></div>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'accessibility' ? 'is-active' : ''}" data-panel="accessibility">
        <h3 class="settings-panel__title" data-i18n="settingsModal.accessibilityTitle">Accesibilidad</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.accessibilitySub">Ajustes de lectura y movimiento.</p>
        <div id="settings-a11y-panel"></div>
      </section>

      <section class="settings-panel ${_panel === 'privacy' ? 'is-active' : ''}" data-panel="privacy">
        <h3 class="settings-panel__title" data-i18n="settingsModal.privacyTitle">Privacidad</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.privacySub">Documentos legales y datos de tu cuenta.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.privacyPolicy">Política de privacidad</p>
          </div>
          <a class="settings-row__action" href="privacidad.html" data-i18n="settingsModal.read">Leer →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.cookies">Cookies</p>
          </div>
          <a class="settings-row__action" href="cookies.html" data-i18n="settingsModal.read">Leer →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.terms">Términos de uso</p>
          </div>
          <a class="settings-row__action" href="terminos.html" data-i18n="settingsModal.read">Leer →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.exportData">Exportar mis datos</p>
            <p class="settings-row__hint" data-i18n="privacy.exportHint">Descarga JSON con tu progreso.</p>
          </div>
          <button type="button" class="settings-btn" id="settings-export-data" data-i18n="privacy.exportBtn">Exportar</button>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.importData">Restaurar datos</p>
            <p class="settings-row__hint" data-i18n="privacy.importHint">Importa un JSON exportado previamente.</p>
          </div>
          <label class="settings-btn" style="cursor:pointer">
            <span data-i18n="privacy.importBtn">Importar</span>
            <input type="file" id="settings-import-data" accept="application/json,.json" hidden>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.clearAi">Borrar historial IA</p>
          </div>
          <button type="button" class="settings-btn" id="settings-clear-ai" data-i18n="privacy.clearAiBtn">Borrar</button>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.deleteAccount">Eliminar cuenta y datos</p>
          </div>
          <button type="button" class="settings-btn settings-btn--danger" id="settings-delete-account" data-i18n="privacy.deleteBtn">Eliminar</button>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="cert.verifyTitle">Verificar certificado</p>
          </div>
          <a class="settings-row__action" href="verify.html" data-i18n="cert.verifyBtn">Verificar →</a>
        </div>
      </section>`;

    if (typeof I18n !== 'undefined') I18n.applyDom(wrap);

    const bulbSlot = document.getElementById('settings-bulb-slot');
    if (bulbSlot && typeof In4mindBulb !== 'undefined') {
      bulbSlot.innerHTML = In4mindBulb.medium('settings-appearance-bulb');
    }

    if (typeof I18n !== 'undefined') {
      const langWrap = wrap.querySelector('[data-lang-switcher]');
      if (langWrap && !langWrap.querySelector('.lang-switcher')) {
        I18n.mountLanguageSwitcher(langWrap);
      }
    }

    if (typeof AccessibilityService !== 'undefined') {
      AccessibilityService.renderPanel(document.getElementById('settings-a11y-panel'));
    }

    if (typeof GamificationService !== 'undefined') {
      const g = GamificationService.getWeeklyProgress();
      const gl = document.getElementById('settings-goal-lessons');
      const gq = document.getElementById('settings-goal-quizzes');
      if (gl) gl.value = g.lessonGoal;
      if (gq) gq.value = g.quizGoal;
    }

    _bindPanelEvents();
  }

  function _saveWeeklyGoals() {
    const lessons = parseInt(document.getElementById('settings-goal-lessons')?.value, 10) || 2;
    const quizzes = parseInt(document.getElementById('settings-goal-quizzes')?.value, 10) || 1;
    if (typeof GamificationService !== 'undefined') {
      GamificationService.setWeeklyGoals(lessons, quizzes);
    }
  }

  function _bindPanelEvents() {
    document.getElementById('settings-notif-email')?.addEventListener('change', e => {
      const prefs = _getNotifPrefs();
      prefs.email = e.target.checked;
      _saveNotifPrefs(prefs);
    });
    document.getElementById('settings-notif-push')?.addEventListener('change', async e => {
      const prefs = _getNotifPrefs();
      prefs.push = e.target.checked;
      _saveNotifPrefs(prefs);
      if (e.target.checked && typeof PushNotificationService !== 'undefined') {
        await PushNotificationService.requestPermission();
      }
    });
    document.getElementById('settings-logout')?.addEventListener('click', async () => {
      const msg = typeof I18n !== 'undefined' ? I18n.t('profile.logoutConfirm') : '¿Cerrar sesión?';
      if (!confirm(msg)) return;
      close();
      if (typeof AuthService !== 'undefined') await AuthService.logout();
      if (typeof AppShell !== 'undefined') AppShell.logout();
    });
    document.getElementById('settings-save-name')?.addEventListener('click', async () => {
      const input = document.getElementById('settings-edit-name');
      if (!input || typeof AuthService === 'undefined') return;
      const result = await AuthService.updateDisplayName(input.value);
      if (result.ok) {
        const nameEl = document.getElementById('settings-name');
        const avEl = document.getElementById('settings-avatar');
        if (nameEl) nameEl.textContent = result.user.name;
        if (avEl) avEl.textContent = result.user.name.charAt(0).toUpperCase();
        if (typeof AppShell !== 'undefined') AppShell.setupAvatar();
      }
    });
    document.getElementById('settings-goal-lessons')?.addEventListener('change', _saveWeeklyGoals);
    document.getElementById('settings-goal-quizzes')?.addEventListener('change', _saveWeeklyGoals);
    document.getElementById('settings-reset-onboard')?.addEventListener('click', () => {
      localStorage.removeItem('in4mind_onboarding_done');
      alert(typeof I18n !== 'undefined' ? I18n.t('settingsModal.onboardReset') : 'Tour reiniciado.');
    });
    document.getElementById('settings-export-data')?.addEventListener('click', async () => {
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') DataExportService.downloadJson();
    });
    document.getElementById('settings-import-data')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') {
        const result = await DataExportService.importFromFile(file);
        if (!result.ok) {
          alert(typeof I18n !== 'undefined' ? I18n.t('privacy.importFail') : 'No se pudo importar el archivo.');
        }
      }
      e.target.value = '';
    });
    document.getElementById('settings-clear-ai')?.addEventListener('click', async () => {
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') DataExportService.clearAiHistory();
    });
    document.getElementById('settings-delete-account')?.addEventListener('click', async () => {
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') DataExportService.deleteAccount();
    });
    document.querySelector('[data-settings-go-profile]')?.addEventListener('click', e => {
      if (_isProfilePage()) {
        e.preventDefault();
        close();
      }
    });
    document.querySelectorAll('[data-theme-pref]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pref = btn.dataset.themePref;
        if (typeof ThemeController !== 'undefined' && ThemeController.setPreference) {
          ThemeController.setPreference(pref);
        }
        _syncThemeCards(pref);
      });
    });
  }

  function _setPanel(id) {
    _panel = id;
    document.querySelectorAll('.settings-nav__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.settingsPanel === id);
    });
    document.querySelectorAll('.settings-panel').forEach(p => {
      p.classList.toggle('is-active', p.dataset.panel === id);
    });
    if (id === 'appearance') {
      const slot = document.getElementById('settings-bulb-slot');
      if (slot && !slot.innerHTML && typeof In4mindBulb !== 'undefined') {
        slot.innerHTML = In4mindBulb.medium('settings-appearance-bulb');
      }
    }
    if (id === 'accessibility') {
      const a11y = document.getElementById('settings-a11y-panel');
      if (a11y && typeof AccessibilityService !== 'undefined' && !a11y.children.length) {
        AccessibilityService.renderPanel(a11y);
      }
    }
    if (id === 'language') {
      const langWrap = document.querySelector('#settings-panels [data-lang-switcher]');
      if (langWrap && typeof I18n !== 'undefined' && !langWrap.querySelector('.lang-switcher')) {
        I18n.mountLanguageSwitcher(langWrap);
      }
    }
  }

  function _lockBackground() {
    document.body.classList.add('settings-modal-open');
    document.documentElement.classList.add('settings-modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'settings-overlay') el.setAttribute('inert', '');
    });
  }

  function _unlockBackground() {
    document.body.classList.remove('settings-modal-open');
    document.documentElement.classList.remove('settings-modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'settings-overlay') el.removeAttribute('inert');
    });
  }

  function _activateFocusTrap() {
    const modal = document.querySelector('#settings-overlay .settings-modal');
    if (!modal) return;

    _focusTrapHandler = e => {
      if (e.key !== 'Tab' || !document.getElementById('settings-overlay')?.classList.contains('is-open')) return;
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  function _handleSettingsNav(e) {
    const settingsNav = e.target.closest('#sidebar .nav-item[data-nav="settings"], #sidebar-footer .nav-item[data-nav="settings"]');
    if (!settingsNav) return false;
    e.preventDefault();
    e.stopPropagation();
    open('general');
    if (typeof SidebarController !== 'undefined') SidebarController.closeMobile?.();
    return true;
  }

  function open(panel = 'general') {
    if (typeof OtherMenuController !== 'undefined') OtherMenuController.close();
    _ensureOverlay();
    _panel = panel;
    _renderPanels();
    document.querySelectorAll('.settings-nav__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.settingsPanel === panel);
    });
    const overlay = document.getElementById('settings-overlay');
    if (!overlay) return;

    _prevFocus = document.activeElement;
    overlay.hidden = false;
    overlay.classList.add('is-open');
    _lockBackground();
    _activateFocusTrap();
    if (typeof I18n !== 'undefined') I18n.applyDom(overlay);
    document.getElementById('settings-close')?.focus();
  }

  function close() {
    const overlay = document.getElementById('settings-overlay');
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

  function _bindGlobal() {
    if (_bound) return;
    _bound = true;

    document.addEventListener('click', e => {
      if (_handleSettingsNav(e)) return;
      if (e.target.closest('#settings-close')) {
        e.preventDefault();
        close();
        return;
      }
      if (e.target.id === 'settings-overlay') {
        close();
        return;
      }
      const navBtn = e.target.closest('[data-settings-panel]');
      if (navBtn) {
        _setPanel(navBtn.dataset.settingsPanel);
      }
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('settings-overlay')?.classList.contains('is-open')) {
        close();
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      _handleSettingsNav(e);
    }, true);

    window.addEventListener('pageshow', e => {
      if (e.persisted) _resetModalState();
    });

    window.addEventListener('beforeunload', () => {
      if (document.getElementById('settings-overlay')?.classList.contains('is-open')) {
        _resetModalState();
      }
    });

    window.addEventListener('in4mind-relocalize', () => {
      if (document.getElementById('settings-overlay')?.classList.contains('is-open')) {
        _renderPanels();
      }
    });

    window.addEventListener('in4mind-theme-change', (e) => {
      const pref = e.detail?.preference || _themePreference();
      _syncThemeCards(pref);
    });
  }

  function init() {
    if (!document.getElementById('sidebar')) return;
    _resetModalState();
    if (typeof ThemeController !== 'undefined' && ThemeController.mount) {
      ThemeController.mount();
    }
    _ensureOverlay();
    _bindGlobal();
    if (window.location.hash === '#settings') {
      open('general');
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  return { init, open, close };

})();

if (typeof module !== 'undefined') module.exports = SettingsController;
