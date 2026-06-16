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
  let _resetEmail = '';

  // ── Copy dinámico del panel izquierdo ──
  const PANEL_COPY = {
    login: {
      title: '¡Bienvenido a IN4MIND!',
      desc:  'Empieza a entender la tecnología, de forma clara y accesible.',
    },
    register: {
      title: '¡Crea tu cuenta!',
      desc:  'Únete a nuestra plataforma y descubre el mundo digital.',
    },
    forgot: {
      title: 'Recupera tu acceso',
      desc:  'Te ayudamos a restablecer tu contraseña de forma segura.',
    },
    reset: {
      title: 'Nueva contraseña',
      desc:  'Elige una contraseña segura para tu cuenta IN4MIND.',
    },
  };

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

    const copy = PANEL_COPY[view];
    $leftTitle.textContent = copy.title;
    $leftDesc.textContent  = copy.desc;

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

  function _redirectAfterAuth() {
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
      _showError($loginError, 'Por favor corrige los campos marcados.');
      return;
    }

    // Estado de carga
    $loginBtn.disabled = true;
    $loginBtn.textContent = 'Ingresando...';

    const result = await DataService.login(emailInput.value, passInput.value);

    if (result.ok) {
      sessionStorage.setItem('in4mind_user', JSON.stringify(result.user));
      if (typeof UserProfileService !== 'undefined') {
        UserProfileService.mergeGuestIntoUser(result.user.email);
        UserProfileService.migrateSessionQuizProgress();
      }
      _redirectAfterAuth();
    } else {
      _showError($loginError, result.error || 'Error al iniciar sesión.');
      $loginBtn.disabled = false;
      $loginBtn.textContent = 'Inicia Sesión';
    }
  }

  /** Solicitud de recuperación de contraseña. */
  async function _handleForgot(e) {
    e.preventDefault();
    _clearErrors();

    const emailInput = $forgotForm.querySelector('#forgot-email');
    if (!_validateRequired(emailInput) || !_validateEmail(emailInput)) {
      _showError($forgotError, 'Introduce un correo electrónico válido.');
      return;
    }

    $forgotBtn.disabled = true;
    $forgotBtn.textContent = 'Enviando...';

    const result = await DataService.requestPasswordReset(emailInput.value);

    if (result.ok) {
      _resetEmail = result.email;
      $forgotSuccess.hidden = false;
      $forgotForm.hidden = true;
      const msg = $forgotSuccess.querySelector('.auth-success__text');
      if (msg) {
        msg.textContent = `Si existe una cuenta con ${result.email}, recibirás instrucciones. En esta demo puedes continuar y establecer una nueva contraseña ahora.`;
      }
    } else {
      _showError($forgotError, result.error || 'No se pudo procesar la solicitud.');
      $forgotBtn.disabled = false;
      $forgotBtn.textContent = 'Enviar enlace';
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
      _showError($resetError, 'Revisa los campos marcados.');
      return;
    }
    if (passInput.value !== confirmInput.value) {
      confirmInput.closest('.form-group')?.classList.add('is-invalid');
      _showError($resetError, 'Las contraseñas no coinciden.');
      return;
    }

    $resetBtn.disabled = true;
    $resetBtn.textContent = 'Guardando...';

    const result = await DataService.resetPassword(
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
      _showError($resetError, result.error || 'No se pudo actualizar la contraseña.');
      $resetBtn.disabled = false;
      $resetBtn.textContent = 'Guardar contraseña';
    }
  }

  function _openForgotView() {
    if ($forgotForm) $forgotForm.hidden = false;
    if ($forgotSuccess) $forgotSuccess.hidden = true;
    if ($forgotBtn) {
      $forgotBtn.disabled = false;
      $forgotBtn.textContent = 'Enviar enlace';
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
      $resetBtn.textContent = 'Guardar contraseña';
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
      _showError($registerError, 'Por favor completa todos los campos correctamente.');
      return;
    }

    $registerBtn.disabled = true;
    $registerBtn.textContent = 'Creando cuenta...';

    const result = await DataService.register(nameInput.value, emailInput.value, passInput.value);

    if (result.ok) {
      sessionStorage.setItem('in4mind_user', JSON.stringify(result.user));
      if (typeof UserProfileService !== 'undefined') {
        UserProfileService.mergeGuestIntoUser(result.user.email);
        UserProfileService.migrateSessionQuizProgress();
      }
      _redirectAfterAuth();
    } else {
      _showError($registerError, result.error || 'Error al registrarse.');
      $registerBtn.disabled = false;
      $registerBtn.textContent = 'Registrarse';
    }
  }

  // ────────────────────────────────────────────
  // Inicialización pública
  // ────────────────────────────────────────────

  /** Inicializa el controlador y asocia listeners. */
  function init() {
    // Redirigir si ya hay sesión
    const existing = sessionStorage.getItem('in4mind_user');
    if (existing) {
      window.location.href = 'dashboard.html';
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

    // Inicializar vista
    switchView('login');

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
