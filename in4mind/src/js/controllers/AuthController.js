/**
 * IN4MIND — AuthController
 * Controla toda la lógica de autenticación:
 * toggle entre login/registro, validación de formularios,
 * llamadas al DataService y redirección post-login.
 */

'use strict';

const AuthController = (() => {

  // ── Estado interno ──
  let _currentView = 'login'; // 'login' | 'register' | 'forgot' | 'reset'

  // ── Referencias DOM (inicializadas en init()) ──
  let $loginView, $registerView, $forgotView, $resetView;
  let $leftTitle, $leftDesc;
  let $loginForm, $registerForm, $forgotForm, $resetForm;
  let $loginBtn, $registerBtn, $forgotBtn, $resetBtn;
  let $toRegister, $toLogin, $toForgot, $backToLogin, $backFromReset;
  let $loginError, $registerError, $forgotError, $resetError;
  let $forgotSuccess, $resetSuccess;
  let $rememberBox;
  let _resetEmail = '';

  // ── Copy dinámico del panel izquierdo ──
  function _t(key, params) {
    return typeof I18n !== 'undefined' ? I18n.t(key, params) : key;
  }

  function _panelKeys(view) {
    const keys = {
      login:    ['auth.panelLoginTitle', 'auth.panelLoginDesc'],
      register: ['auth.panelRegisterTitle', 'auth.panelRegisterDesc'],
      forgot:   ['auth.panelForgotTitle', 'auth.panelForgotDesc'],
      reset:    ['auth.panelResetTitle', 'auth.panelResetDesc'],
    };
    return keys[view] || keys.login;
  }

  function _panelCopy(view) {
    const [tk, dk] = _panelKeys(view);
    return { title: _t(tk), desc: _t(dk), titleKey: tk, descKey: dk };
  }

  function _updatePanelCopy(view) {
    const copy = _panelCopy(view);
    if ($leftTitle) {
      $leftTitle.setAttribute('data-i18n', copy.titleKey);
      $leftTitle.textContent = copy.title;
    }
    if ($leftDesc) {
      $leftDesc.setAttribute('data-i18n', copy.descKey);
      $leftDesc.textContent = copy.desc;
    }
  }

  function _refreshSubmitLabels() {
    if ($loginBtn && !$loginBtn.disabled) $loginBtn.textContent = _t('auth.loginBtn');
    if ($registerBtn && !$registerBtn.disabled) $registerBtn.textContent = _t('auth.registerBtn');
    if ($forgotBtn && !$forgotBtn.disabled) $forgotBtn.textContent = _t('auth.forgotBtn');
    if ($resetBtn && !$resetBtn.disabled) $resetBtn.textContent = _t('auth.savePassword');
  }

  function _onLocaleChange() {
    _updatePanelCopy(_currentView);
    _refreshSubmitLabels();
    if (typeof I18n !== 'undefined') {
      const scope = document.getElementById('auth-page');
      if (scope) I18n.applyDom(scope);
    }
  }

  function _bindAuthHelp() {
    const btn = document.getElementById('auth-help-btn');
    const panel = document.getElementById('auth-help-panel');
    const close = document.getElementById('auth-help-close');
    if (!btn || !panel) return;

    function setHelpOpen(open) {
      panel.classList.toggle('is-open', open);
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (open) {
        close?.focus();
      } else {
        btn.focus();
      }
    }

    // Siempre cerrado al entrar a login — solo se abre si el usuario pulsa el enlace
    setHelpOpen(false);

    btn.addEventListener('click', () => {
      setHelpOpen(!panel.classList.contains('is-open'));
    });

    close?.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      setHelpOpen(false);
    });

    panel.addEventListener('click', e => {
      if (e.target === panel) setHelpOpen(false);
    });

    panel.querySelector('.auth-help-panel__inner')?.addEventListener('click', e => {
      e.stopPropagation();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) setHelpOpen(false);
    });
  }

  // ────────────────────────────────────────────
  // Utilidades
  // ────────────────────────────────────────────

  /**
   * Alterna la visibilidad del input de contraseña.
   * @param {HTMLButtonElement} btn
   */
  function _togglePassword(btn) {
    const input = btn.closest('.form-group').querySelector('input');
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.querySelector('.eye-icon').innerHTML = isHidden
      ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }

  /**
   * Muestra un error en el formulario.
   * @param {HTMLElement} el - Elemento de mensaje de error
   * @param {string} msg
   */
  function _showError(el, msg) {
    el.textContent = msg;
    el.style.display = 'block';
    el.classList.add('anim-fade-in');
  }

  /** Limpia mensajes de error. */
  function _clearErrors() {
    [$loginError, $registerError, $forgotError, $resetError].forEach(el => {
      if (!el) return;
      el.textContent = '';
      el.style.display = 'none';
    });
    if ($forgotSuccess) $forgotSuccess.hidden = true;
    if ($resetSuccess) $resetSuccess.hidden = true;
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('is-invalid'));
  }

  function _hideAllViews() {
    [$loginView, $registerView, $forgotView, $resetView].forEach(v => {
      v?.classList.add('auth-view--hidden');
      v?.classList.remove('auth-view--visible');
    });
  }

  function _showView(el) {
    el?.classList.remove('auth-view--hidden');
    el?.classList.add('auth-view--visible');
  }

  /**
   * Valida un campo requerido y marca el grupo como inválido.
   * @param {HTMLInputElement} input
   * @returns {boolean}
   */
  function _validateRequired(input) {
    if (!input.value.trim()) {
      input.closest('.form-group')?.classList.add('is-invalid');
      return false;
    }
    return true;
  }

  /**
   * Valida formato de email estrictamente:
   * - Solo caracteres ASCII imprimibles (sin emojis ni unicode raro)
   * - Formato usuario@dominio.extension
   * @param {HTMLInputElement} input
   * @returns {boolean}
   */
  function _validateEmail(input) {
    const val = input.value.trim();
    // Solo ASCII imprimible (codes 32-126), sin espacios
    const isAsciiOnly = /^[\x21-\x7E]+$/.test(val);
    // Formato estricto: letras/números/guiones/puntos @ dominio . extensión (2-10 letras)
    const isValidFormat = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,10}$/.test(val);
    const ok = isAsciiOnly && isValidFormat;
    if (!ok) input.closest('.form-group')?.classList.add('is-invalid');
    return ok;
  }

  /**
   * Valida contraseña:
   * - Mínimo 6 caracteres
   * - Solo caracteres ASCII imprimibles (sin emojis)
   * @param {HTMLInputElement} input
   * @param {number} [min=6]
   * @returns {boolean}
   */
  function _validatePassword(input, min = 6) {
    const val = input.value;
    const isAsciiOnly = /^[\x20-\x7E]+$/.test(val);
    const isLongEnough = val.length >= min;
    const ok = isAsciiOnly && isLongEnough;
    if (!ok) input.closest('.form-group')?.classList.add('is-invalid');
    return ok;
  }

  // ────────────────────────────────────────────
  // Cambio de vista
  // ────────────────────────────────────────────

  /**
   * Alterna entre vistas de autenticación.
   * @param {'login'|'register'|'forgot'|'reset'} view
   * @param {{ email?: string }} [opts]
   */
  function switchView(view, opts = {}) {
    _currentView = view;
    _clearErrors();

    _updatePanelCopy(view);

    _hideAllViews();

    if (view === 'login')       _showView($loginView);
    if (view === 'register')    _showView($registerView);
    if (view === 'forgot')      _showView($forgotView);
    if (view === 'reset') {
      _showView($resetView);
      const emailField = $resetForm?.querySelector('#reset-email');
      if (emailField && opts.email) {
        emailField.value = opts.email;
        _resetEmail = opts.email;
      }
    }
  }

  // ────────────────────────────────────────────
  // Submit handlers
  // ────────────────────────────────────────────

  /**
   * Abre la vista de restablecer si se llegó desde el enlace del correo
   * (`login.html?view=reset&email=...`).
   */
  function _applyDeepLink() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') !== 'reset') return;
    const email = params.get('email') || '';
    if (email) _resetEmail = email;
    _openResetView();
  }

  function _redirectAfterAuth() {
    // Prioridad: el contenido compartido al que el usuario intentaba entrar.
    if (typeof AuthGuard !== 'undefined') {
      const next = AuthGuard.consumeRedirect();
      if (next) {
        window.location.replace(next);
        return;
      }
    }

    const destination = sessionStorage.getItem('in4mind_open_destination');
    if (destination === 'ai') {
      sessionStorage.removeItem('in4mind_open_destination');
      window.location.href = 'ai.html';
      return;
    }
    if (sessionStorage.getItem('in4mind_open_course')) {
      window.location.href = 'tutorial.html';
      return;
    }
    if (sessionStorage.getItem('in4mind_open_quiz')) {
      window.location.href = 'quizzes.html';
      return;
    }
    window.location.href = 'dashboard.html';
  }

  /** Maneja el envío del formulario de login. */
  async function _handleLogin(e) {
    e.preventDefault();
    _clearErrors();

    const emailInput = $loginForm.querySelector('#login-email');
    const passInput  = $loginForm.querySelector('#login-password');

    let valid = true;
    if (!_validateRequired(emailInput) || !_validateEmail(emailInput)) valid = false;
    if (!_validatePassword(passInput)) valid = false;

    if (!valid) {
      _showError($loginError, _t('auth.errFields'));
      return;
    }

    // Estado de carga
    $loginBtn.disabled = true;
    $loginBtn.textContent = _t('auth.loggingIn');

    const remember = Boolean($rememberBox?.checked);
    const authFn = typeof AuthService !== 'undefined' ? AuthService.login.bind(AuthService) : DataService.login.bind(DataService);
    const result = await authFn(emailInput.value, passInput.value, remember);

    if (result.ok) {
      if (typeof AuthService === 'undefined') {
        if (typeof SessionStore !== 'undefined') SessionStore.persist(result.user, remember);
        else sessionStorage.setItem('in4mind_user', JSON.stringify(result.user));
        if (typeof UserProfileService !== 'undefined') {
          UserProfileService.mergeGuestIntoUser(result.user.email);
          UserProfileService.migrateSessionQuizProgress();
        }
      }
      _redirectAfterAuth();
    } else {
      _showError($loginError, result.error || _t('auth.errLogin'));
      $loginBtn.disabled = false;
      $loginBtn.textContent = _t('auth.loginBtn');
    }
  }

  /** Solicitud de recuperación de contraseña. */
  async function _handleForgot(e) {
    e.preventDefault();
    _clearErrors();

    const emailInput = $forgotForm.querySelector('#forgot-email');
    if (!_validateRequired(emailInput) || !_validateEmail(emailInput)) {
      _showError($forgotError, _t('auth.errEmail'));
      return;
    }

    $forgotBtn.disabled = true;
    $forgotBtn.textContent = _t('auth.sending');

    const authFn = typeof AuthService !== 'undefined'
      ? AuthService.requestPasswordReset.bind(AuthService)
      : DataService.requestPasswordReset.bind(DataService);
    const result = await authFn(emailInput.value);

    if (result.ok) {
      _resetEmail = result.email;
      $forgotSuccess.hidden = false;
      $forgotForm.hidden = true;
      const msg = $forgotSuccess.querySelector('.auth-success__text');
      if (msg) {
        // Sólo se afirma que se envió el correo cuando realmente se envió.
        msg.textContent = result.delivered
          ? _t('auth.forgotSent', { email: result.email })
          : _t('auth.forgotNotSent', { email: result.email });
      }
      // Sin proveedor de correo, el usuario puede continuar en este dispositivo.
      const nextBtn = document.getElementById('forgot-to-reset');
      if (nextBtn) nextBtn.hidden = Boolean(result.delivered);
    } else {
      _showError($forgotError, result.error || _t('auth.errProcess'));
      $forgotBtn.disabled = false;
      $forgotBtn.textContent = _t('auth.forgotBtn');
    }
  }

  /** Restablecer contraseña. */
  async function _handleReset(e) {
    e.preventDefault();
    _clearErrors();

    const emailInput = $resetForm.querySelector('#reset-email');
    const passInput  = $resetForm.querySelector('#reset-password');
    const confirmInput = $resetForm.querySelector('#reset-password-confirm');

    let valid = true;
    if (!_validateRequired(emailInput) || !_validateEmail(emailInput)) valid = false;
    if (!_validatePassword(passInput)) valid = false;
    if (!confirmInput.value.trim()) {
      confirmInput.closest('.form-group')?.classList.add('is-invalid');
      valid = false;
    }

    if (!valid) {
      _showError($resetError, _t('auth.errFields'));
      return;
    }
    if (passInput.value !== confirmInput.value) {
      confirmInput.closest('.form-group')?.classList.add('is-invalid');
      _showError($resetError, _t('auth.errMatch'));
      return;
    }

    $resetBtn.disabled = true;
    $resetBtn.textContent = _t('auth.saving');

    const authFn = typeof AuthService !== 'undefined'
      ? AuthService.resetPassword.bind(AuthService)
      : DataService.resetPassword.bind(DataService);
    const result = await authFn(
      emailInput.value,
      passInput.value,
      confirmInput.value
    );

    if (result.ok) {
      $resetSuccess.hidden = false;
      $resetForm.hidden = true;
      const loginEmail = $loginForm.querySelector('#login-email');
      if (loginEmail) loginEmail.value = result.email;
    } else {
      _showError($resetError, result.error || _t('auth.errUpdatePassword'));
      $resetBtn.disabled = false;
      $resetBtn.textContent = _t('auth.savePassword');
    }
  }

  function _openForgotView() {
    if ($forgotForm) $forgotForm.hidden = false;
    if ($forgotSuccess) $forgotSuccess.hidden = true;
    if ($forgotBtn) {
      $forgotBtn.disabled = false;
      $forgotBtn.textContent = _t('auth.forgotBtn');
    }
    const loginEmail = $loginForm?.querySelector('#login-email')?.value.trim();
    const forgotEmail = $forgotForm?.querySelector('#forgot-email');
    if (forgotEmail && loginEmail) forgotEmail.value = loginEmail;
    switchView('forgot');
  }

  function _openResetView() {
    if ($resetForm) $resetForm.hidden = false;
    if ($resetSuccess) $resetSuccess.hidden = true;
    if ($resetBtn) {
      $resetBtn.disabled = false;
      $resetBtn.textContent = _t('auth.savePassword');
    }
    switchView('reset', { email: _resetEmail });
  }

  /** Maneja el envío del formulario de registro. */
  async function _handleRegister(e) {
    e.preventDefault();
    _clearErrors();

    const nameInput  = $registerForm.querySelector('#reg-name');
    const emailInput = $registerForm.querySelector('#reg-email');
    const passInput  = $registerForm.querySelector('#reg-password');

    let valid = true;
    if (!_validateRequired(nameInput))                                 valid = false;
    if (!_validateRequired(emailInput) || !_validateEmail(emailInput)) valid = false;
    if (!_validatePassword(passInput, 6))                              valid = false;

    if (!valid) {
      _showError($registerError, _t('auth.errFillAll'));
      return;
    }

    $registerBtn.disabled = true;
    $registerBtn.textContent = _t('auth.creating');

    const authFn = typeof AuthService !== 'undefined' ? AuthService.register.bind(AuthService) : DataService.register.bind(DataService);
    const result = await authFn(nameInput.value, emailInput.value, passInput.value);

    if (result.ok) {
      if (typeof AuthService === 'undefined') {
        sessionStorage.setItem('in4mind_user', JSON.stringify(result.user));
        if (typeof UserProfileService !== 'undefined') {
          UserProfileService.mergeGuestIntoUser(result.user.email);
          UserProfileService.migrateSessionQuizProgress();
        }
      }
      _redirectAfterAuth();
    } else {
      _showError($registerError, result.error || _t('auth.errRegister'));
      $registerBtn.disabled = false;
      $registerBtn.textContent = _t('auth.registerBtn');
    }
  }

  // ────────────────────────────────────────────
  // Inicialización pública
  // ────────────────────────────────────────────

  async function _handleGoogleLogin() {
    if (typeof AuthService === 'undefined') return;
    const result = await AuthService.signInWithGoogle();
    if (result.ok && result.redirecting) return;
    if (result.ok) {
      window.location.href = 'dashboard.html';
      return;
    }
    if ($loginError) {
      $loginError.textContent = result.error || _t('auth.errLogin');
      $loginError.hidden = false;
    }
  }

  /** Inicializa el controlador y asocia listeners. */
  async function init() {
    const params = new URLSearchParams(window.location.search);
    // Si se llega desde el enlace del correo, la vista de restablecer manda
    // aunque haya una sesión abierta.
    const isResetLink = params.get('view') === 'reset';

    if (typeof AuthService !== 'undefined' && !isResetLink) {
      const oauth = await AuthService.restoreOAuthSession();
      if (oauth.ok) {
        _redirectAfterAuth();
        return;
      }
    }

    // Redirigir si ya hay sesión (SessionStore ya rehidrató "Recordar datos")
    const existing = sessionStorage.getItem('in4mind_user');
    if (existing && !isResetLink) {
      _redirectAfterAuth();
      return;
    }

    // Cachear referencias DOM
    $loginView    = document.getElementById('login-view');
    $registerView = document.getElementById('register-view');
    $forgotView   = document.getElementById('forgot-view');
    $resetView    = document.getElementById('reset-view');
    $leftTitle    = document.getElementById('left-title');
    $leftDesc     = document.getElementById('left-desc');
    $loginForm    = document.getElementById('login-form');
    $registerForm = document.getElementById('register-form');
    $forgotForm   = document.getElementById('forgot-form');
    $resetForm    = document.getElementById('reset-form');
    $loginBtn     = document.getElementById('login-btn');
    $registerBtn  = document.getElementById('register-btn');
    $forgotBtn    = document.getElementById('forgot-btn');
    $resetBtn     = document.getElementById('reset-btn');
    $toRegister   = document.getElementById('to-register');
    $toLogin      = document.getElementById('to-login');
    $toForgot     = document.getElementById('to-forgot');
    $backToLogin  = document.getElementById('back-to-login');
    $backFromReset= document.getElementById('back-from-reset');
    $loginError   = document.getElementById('login-error');
    $registerError= document.getElementById('register-error');
    $forgotError  = document.getElementById('forgot-error');
    $resetError   = document.getElementById('reset-error');
    $forgotSuccess= document.getElementById('forgot-success');
    $resetSuccess = document.getElementById('reset-success');
    $rememberBox  = document.getElementById('login-remember');

    // "Recordar datos": restaurar la preferencia y precargar el correo.
    if (typeof SessionStore !== 'undefined') {
      const remembered = SessionStore.getRememberedEmail();
      if ($rememberBox) $rememberBox.checked = SessionStore.isRemembered() || Boolean(remembered);
      const loginEmail = $loginForm?.querySelector('#login-email');
      if (loginEmail && remembered && !loginEmail.value) {
        loginEmail.value = remembered;
        // El foco va a la contraseña: el correo ya está puesto.
        $loginForm.querySelector('#login-password')?.focus();
      }
    }

    // Inicializar vista
    switchView('login');
    _applyDeepLink();
    _bindAuthHelp();
    window.addEventListener('in4mind-locale-change', _onLocaleChange);

    // Toggle de vistas
    $toRegister?.addEventListener('click', () => switchView('register'));
    $toLogin?.addEventListener('click',    () => switchView('login'));
    $toForgot?.addEventListener('click',    e => { e.preventDefault(); _openForgotView(); });
    $backToLogin?.addEventListener('click', () => switchView('login'));
    $backFromReset?.addEventListener('click', () => switchView('login'));

    document.getElementById('forgot-to-reset')?.addEventListener('click', _openResetView);
    document.getElementById('reset-to-login')?.addEventListener('click', () => switchView('login'));

    // Submit
    $loginForm?.addEventListener('submit',    _handleLogin);
    $registerForm?.addEventListener('submit', _handleRegister);
    $forgotForm?.addEventListener('submit',   _handleForgot);
    $resetForm?.addEventListener('submit',    _handleReset);

    document.getElementById('login-google-btn')?.addEventListener('click', _handleGoogleLogin);

    // Toggles de contraseña
    document.querySelectorAll('.pwd-toggle').forEach(btn => {
      btn.addEventListener('click', () => _togglePassword(btn));
    });

    // Limpiar error al escribir
    document.querySelectorAll('.form-input').forEach(input => {
      input.addEventListener('input', () => {
        input.closest('.form-group')?.classList.remove('is-invalid');
      });
    });
  }

  return { init };

})();
