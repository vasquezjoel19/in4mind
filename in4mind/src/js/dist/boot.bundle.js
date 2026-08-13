/*! IN4MIND bundle 20260813live28 — 2026-08-13T20:39:44.477848+00:00 */

;/* --- src/js/controllers/ThemeController.js --- */
/**
 * IN4MIND — ThemeController
 * Tema global (claro / oscuro / sistema).
 * Preferencia: Ajustes → Apariencia, menú Otros, o toggle sol/luna en topbars.
 */

'use strict';

const ThemeController = (() => {

  const STORAGE_KEY = 'in4mind_theme';
  const EVENT_NAME = 'in4mind-theme-change';
  const TRANSITION_MS = 360;

  let _systemWatchBound = false;
  let _storageWatchBound = false;
  let _uiBound = false;

  function getPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  }

  function _resolveFromPreference(pref) {
    if (pref === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return pref === 'dark' ? 'dark' : 'light';
  }

  function _resolveTheme() {
    return _resolveFromPreference(getPreference());
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function _reduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function _t(key, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  function _toggleLabel(isDark) {
    return isDark
      ? _t('theme.light', 'Activar modo claro')
      : _t('theme.dark', 'Activar modo oscuro');
  }

  function _applyDom(resolved) {
    const isDark = resolved === 'dark';
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    root.style.colorScheme = isDark ? 'dark' : 'light';
    root.setAttribute('color-scheme', isDark ? 'dark' : 'light');
  }

  function _emit(preference, theme) {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, {
      detail: { preference, theme },
    }));
  }

  function _updateToggleUi(isDark) {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.setAttribute('aria-label', _toggleLabel(isDark));
      btn.setAttribute('aria-pressed', String(isDark));
      btn.dataset.theme = isDark ? 'dark' : 'light';
    });
  }

  function _withTransition(fn) {
    if (_reduceMotion()) {
      fn();
      return;
    }
    const root = document.documentElement;
    root.classList.add('theme-transition');
    // Force style flush so the transition class applies before the theme flip.
    void root.offsetWidth;
    fn();
    window.setTimeout(() => {
      root.classList.remove('theme-transition');
    }, TRANSITION_MS);
  }

  /**
   * @param {'light'|'dark'|'system'} themeOrPref
   * @param {{ persist?: boolean, animate?: boolean, emit?: boolean }} [opts]
   */
  function applyTheme(themeOrPref, { persist = true, animate = false, emit = true } = {}) {
    const preference = themeOrPref === 'system'
      ? 'system'
      : (themeOrPref === 'dark' ? 'dark' : 'light');
    const resolved = _resolveFromPreference(
      themeOrPref === 'system' ? 'system' : preference
    );

    const run = () => {
      if (persist) {
        localStorage.setItem(STORAGE_KEY, preference === 'system' ? 'system' : resolved);
      }
      _applyDom(resolved);
      _updateToggleUi(resolved === 'dark');
      if (emit) _emit(getPreference(), resolved);
    };

    if (animate) _withTransition(run);
    else run();
  }

  function setPreference(pref) {
    const valid = pref === 'dark' || pref === 'light' || pref === 'system' ? pref : 'light';
    localStorage.setItem(STORAGE_KEY, valid);
    const resolved = _resolveFromPreference(valid);
    _withTransition(() => {
      _applyDom(resolved);
      _updateToggleUi(resolved === 'dark');
      _emit(valid, resolved);
    });
  }

  function toggle() {
    setPreference(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function unmountToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach((el) => el.remove());
  }

  function _toggleMarkup(extraClass) {
    const cls = extraClass ? `theme-toggle ${extraClass}` : 'theme-toggle';
    return `
      <span class="theme-toggle__icons" aria-hidden="true">
        <svg class="theme-toggle__sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
        <svg class="theme-toggle__moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </span>`;
  }

  function _ensureToggle(host, { before, extraClass } = {}) {
    if (!host) return null;
    let btn = host.querySelector(':scope > [data-theme-toggle]');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = extraClass ? `theme-toggle ${extraClass}` : 'theme-toggle';
      btn.setAttribute('data-theme-toggle', '1');
      btn.innerHTML = _toggleMarkup();
      if (before && before.parentNode === host) host.insertBefore(btn, before);
      else host.insertBefore(btn, host.firstChild);
    } else if (extraClass && !btn.classList.contains(extraClass.split(' ')[0])) {
      extraClass.split(/\s+/).filter(Boolean).forEach((c) => btn.classList.add(c));
    }
    return btn;
  }

  function _bindUiOnce() {
    if (_uiBound) return;
    _uiBound = true;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      e.preventDefault();
      toggle();
    });
    window.addEventListener(EVENT_NAME, () => {
      _updateToggleUi(getTheme() === 'dark');
    });
    window.addEventListener('in4mind-locale-change', () => {
      _updateToggleUi(getTheme() === 'dark');
    });
    window.addEventListener('in4mind-relocalize', () => {
      _updateToggleUi(getTheme() === 'dark');
    });
  }

  function mount() {
    _bindUiOnce();

    const topbarActions = document.querySelector('.topbar__actions');
    if (topbarActions) {
      const before = topbarActions.querySelector('.avatar, #avatar, [data-notifications-btn], a.icon-btn');
      _ensureToggle(topbarActions, { before: before || null });
    }

    const aiActions = document.querySelector('.ai-topbar__actions');
    if (aiActions) {
      const before = aiActions.querySelector('.avatar, #avatar');
      _ensureToggle(aiActions, { before: before || null });
    }

    const authActions = document.querySelector('.auth-topbar__actions');
    if (authActions) {
      _ensureToggle(authActions, { extraClass: 'theme-toggle--auth' });
    }

    const lpActions = document.querySelector('.lp-header__actions');
    if (lpActions) {
      // Remove legacy landing-only toggle if present.
      lpActions.querySelectorAll('[data-lp-theme]').forEach((el) => el.remove());
      const before = lpActions.querySelector('.lp-btn--primary');
      _ensureToggle(lpActions, { before: before || null, extraClass: 'theme-toggle--landing' });
    }

    _updateToggleUi(getTheme() === 'dark');
  }

  function _watchSystemPreference() {
    if (_systemWatchBound) return;
    _systemWatchBound = true;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getPreference() === 'system') {
        applyTheme('system', { persist: false, animate: true, emit: true });
      }
    };
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onChange);
  }

  function _watchStorage() {
    if (_storageWatchBound) return;
    _storageWatchBound = true;
    window.addEventListener('storage', (e) => {
      if (e.key !== STORAGE_KEY) return;
      const resolved = _resolveTheme();
      _withTransition(() => {
        _applyDom(resolved);
        _updateToggleUi(resolved === 'dark');
        _emit(getPreference(), resolved);
      });
    });
  }

  /** Llamar en <head> antes del paint para evitar flash. */
  function initEarly() {
    const theme = _resolveTheme();
    _applyDom(theme);
  }

  function init() {
    applyTheme(_resolveTheme(), { persist: false, animate: false, emit: false });
    mount();
    _watchSystemPreference();
    _watchStorage();
    // Emit once so Settings/Other can sync if already open.
    _emit(getPreference(), getTheme());
  }

  return {
    initEarly,
    init,
    mount,
    unmountToggles,
    toggle,
    applyTheme,
    getTheme,
    getPreference,
    setPreference,
  };
})();

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeController.init());
  } else {
    ThemeController.init();
  }
}


;/* --- src/js/a11y-boot.js --- */
'use strict';

/**
 * IN4MIND — Aplica preferencias de accesibilidad antes del paint (todas las páginas).
 */
window.In4mindA11y = (() => {

  const KEY = 'in4mind_a11y_prefs';

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function getPrefs() {
    const stored = read();
    const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      largeText: stored.largeText === true,
      highContrast: stored.highContrast === true,
      reduceMotion: stored.reduceMotion === true || (stored.reduceMotion == null && systemReduce),
    };
  }

  function apply(prefs = getPrefs()) {
    const root = document.documentElement;
    root.classList.toggle('a11y-large-text', prefs.largeText === true);
    root.classList.toggle('a11y-high-contrast', prefs.highContrast === true);
    root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion === true);
    if (prefs.reduceMotion) {
      root.style.setProperty('--motion-duration', '0.01ms');
    } else {
      root.style.removeProperty('--motion-duration');
    }
  }

  function _skipLabel() {
    if (typeof I18n !== 'undefined') {
      const t = I18n.t('a11y.skipToContent', null, 'Saltar al contenido');
      if (t && t !== 'a11y.skipToContent') return t;
    }
    return 'Saltar al contenido';
  }

  function _injectSkipLink() {
    if (document.querySelector('.skip-link')) return;
    const target = document.getElementById('main')
      || document.querySelector('.main-area')
      || document.querySelector('main')
      || document.querySelector('[role="main"]');
    if (!target) return;
    if (!target.id) target.id = 'main';
    const link = document.createElement('a');
    link.href = `#${target.id}`;
    link.className = 'skip-link';
    link.textContent = _skipLabel();
    document.body.insertBefore(link, document.body.firstChild);
  }

  function init() {
    apply();
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (read().reduceMotion == null) apply();
    });
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) apply();
    });
    window.addEventListener('in4mind-a11y-updated', () => apply());
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _injectSkipLink);
    } else {
      _injectSkipLink();
    }
  }

  init();

  return { KEY, getPrefs, apply };

})();


;/* --- src/js/locales/es.js --- */
'use strict';

const LOCALE_ES = {
  meta: {
    defaultTitle: 'IN4MIND',
    loginTitle: 'IN4MIND — Iniciar Sesión',
    dashboardTitle: 'IN4MIND — Dashboard',
    tutorialTitle: 'IN4MIND — Cursos',
    quizzesTitle: 'IN4MIND — Quizzes',
    aiTitle: 'IN4MIND — Asistente IA',
    notesTitle: 'IN4MIND — Mis Notas',
    projectsTitle: 'IN4MIND — Mis Proyectos',
    guidedTitle: 'IN4MIND — Proyectos guiados',
    profileTitle: 'IN4MIND — Mi Perfil',
    helpTitle: 'IN4MIND — Centro de ayuda',
    landingTitle: 'IN4MIND — Aprende tecnología',
    onboardingTitle: 'IN4MIND — Bienvenida',
  },
  nav: {
    home: 'Inicio',
    tutorials: 'Cursos',
    notes: 'Notas',
    projects: 'Proyectos',
    guided: 'Guiados',
    quizzes: 'Quizzes',
    ai: 'IA',
    settings: 'Ajustes',
    other: 'Otros',
  },
  otherMenu: {
    title: 'Otros',
    close: 'Cerrar',
    help: 'Centro de ayuda',
    helpHint: 'FAQ y asistente IA',
    profile: 'Mi perfil',
    profileHint: 'Certificados y progreso',
    verify: 'Verificar certificado',
    privacy: 'Privacidad',
    terms: 'Términos de uso',
    cookies: 'Cookies',
    shortcuts: 'Búsqueda rápida',
    shortcutsHint: 'Ctrl+K',
    export: 'Exportar mis datos',
    logout: 'Cerrar sesión',
    home: 'Volver al inicio',
    appearance: 'Apariencia',
    appearanceHint: 'Elige el modo visual de IN4MIND',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
  },
  shell: {
    mainMenu: 'Menú principal',
    mainNav: 'Navegación principal',
    accountOptions: 'Opciones de cuenta',
    collapseMenu: 'Colapsar menú',
    expandMenu: 'Expandir menú',
    openMenu: 'Abrir menú',
    help: 'Ayuda',
    notifications: 'Notificaciones',
    myProfile: 'Ir a mi perfil',
    user: 'Usuario',
    profileLabel: 'Mi perfil — {name}',
    searchDashboard: 'Búsqueda de cursos, temas u otros...',
    searchDashboardAria: 'Buscar cursos',
    searchProfile: 'Buscar en guardados, favoritos y quizzes...',
    searchProfileAria: 'Buscar en perfil',
    searchHelp: 'Buscar cursos, temas u otros...',
    searchHelpAria: 'Buscar en la app',
  },
  common: {
    loading: 'Cargando…',
    loadingCourses: 'Cargando cursos…',
    loadingTutorials: 'Cargando cursos…',
    loadingQuizzes: 'Cargando quizzes…',
    seeAll: 'Ver todos',
    seeMore: 'Ver más',
    seeLess: 'Ver menos',
    view: 'Ver',
    noResults: 'Sin resultados.',
    or: 'o',
    backHome: 'Volver a Home',
    backToStart: 'Volver al inicio',
    terms: 'Términos de uso',
    privacy: 'Privacidad',
    cookies: 'Cookies',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    open: 'Abrir',
    delete: 'Eliminar',
    add: 'Añadir',
    share: 'Compartir',
    save: 'Guardar',
    saved: 'Guardado',
    favorite: 'Favorito',
    favorites: 'Favoritos',
    email: 'Email',
    password: 'Contraseña',
    showPassword: 'Mostrar/ocultar contraseña',
    showPwd: 'Mostrar contraseña',
    close: 'Cerrar',
  },
  auth: {
    needHelp: '¿Necesitas ayuda?',
    helpTitle: 'Cómo iniciar sesión en IN4MIND',
    helpStep1: '1. Si no tienes cuenta, pulsa «Regístrate» y completa nombre, correo y contraseña (mínimo 6 caracteres).',
    helpStep2: '2. Si ya tienes cuenta, escribe tu correo y contraseña en los campos del formulario.',
    helpStep3: '3. Pulsa «Inicia Sesión». Serás redirigido al Dashboard con cursos, quizzes e IA.',
    helpStep4: '4. ¿Olvidaste la contraseña? Usa «¿Olvidaste la contraseña?» para recuperar el acceso.',
    helpStep5: '5. También puedes explorar la plataforma desde «Volver a Home» antes de registrarte.',
    helpClose: 'Entendido',
    panelLoginTitle: '¡Bienvenido a IN4MIND!',
    panelLoginDesc: 'Empieza a entender la tecnología, de forma clara y accesible.',
    panelRegisterTitle: '¡Crea tu cuenta!',
    panelRegisterDesc: 'Únete a nuestra plataforma y descubre el mundo digital.',
    panelForgotTitle: 'Recupera tu acceso',
    panelForgotDesc: 'Te ayudamos a restablecer tu contraseña de forma segura.',
    panelResetTitle: 'Nueva contraseña',
    panelResetDesc: 'Elige una contraseña segura para tu cuenta IN4MIND.',
    loginHeading: '¡Empieza con IN4MIND!',
    loginSub: 'Ingresa tus datos a continuación.',
    loginBtn: 'Inicia Sesión',
    loginGoogle: 'Inicia Sesión con Google',
    loginGoogleAria: 'Iniciar sesión con Google',
    noAccount: '¿No tienes cuenta?',
    registerLink: 'Regístrate',
    hasAccount: '¿Ya tienes cuenta?',
    loginLink: 'Inicia Sesión',
    forgotLink: '¿Olvidaste la contraseña?',
    forgotHeading: '¿Olvidaste tu contraseña?',
    forgotSub: 'Introduce tu correo y te enviaremos instrucciones para restablecerla.',
    forgotBtn: 'Enviar enlace',
    forgotSuccessTitle: 'Solicitud enviada',
    forgotSuccessText: 'Si existe una cuenta con ese correo, recibirás instrucciones.',
    setNewPassword: 'Establecer nueva contraseña',
    backToLogin: '‹ Volver al inicio de sesión',
    resetHeading: 'Nueva contraseña',
    resetSub: 'Crea una contraseña segura de al menos 6 caracteres.',
    resetEmailPh: 'Correo electrónico',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    savePassword: 'Guardar contraseña',
    resetSuccessTitle: 'Contraseña actualizada',
    resetSuccessText: 'Ya puedes iniciar sesión con tu nueva contraseña.',
    goToLogin: 'Ir a iniciar sesión',
    registerHeading: 'Crea tu cuenta',
    registerSub: 'Completa tus datos para empezar.',
    fullName: 'Nombre Completo',
    passwordMin: 'Contraseña (mín. 6 caracteres)',
    registerBtn: 'Registrarse',
    errEmail: 'Ingresa un email válido.',
    errPassword: 'La contraseña debe tener al menos 6 caracteres.',
    errName: 'El nombre es requerido.',
    errMin6: 'Mínimo 6 caracteres.',
    errMatch: 'Las contraseñas deben coincidir.',
    errFields: 'Por favor corrige los campos marcados.',
    errFillAll: 'Por favor completa todos los campos.',
    loggingIn: 'Ingresando…',
    sending: 'Enviando…',
    saving: 'Guardando…',
    creating: 'Creando cuenta…',
    invalidCreds: 'Credenciales inválidas.',
    wrongPassword: 'Contraseña incorrecta.',
    sessionEnded: 'Sesión cerrada en otra pestaña.',
    sessionExpired: 'Tu sesión expiró. Vuelve a iniciar sesión.',
    errLogin: 'Error al iniciar sesión.',
    oauthUnavailable: 'Usa email y contraseña en modo demo, o configura Supabase para Google.',
    errRegister: 'Error al registrarse.',
    errProcess: 'No se pudo procesar la solicitud.',
    errUpdatePassword: 'No se pudo actualizar la contraseña.',
    forgotSent: 'Enviamos las instrucciones a {email}. Revisa tu bandeja de entrada y la carpeta de spam; el enlace caduca en 30 minutos.',
    forgotNotSent: 'No pudimos enviar el correo a {email} porque el servicio de email aún no está configurado. Puedes establecer una nueva contraseña ahora en este dispositivo.',
    rememberMe: 'Recordar mis datos',
    rememberNote: 'Guarda tu correo y contraseña en este dispositivo para autocompletar el próximo acceso.',
    forgotDemoSuccess: 'Si existe una cuenta con {email}, recibirás instrucciones. En esta demo puedes continuar y establecer una nueva contraseña ahora.',
    errEmailTaken: 'Este correo ya está registrado.',
    confirmEmail: 'Cuenta creada. Revisa {email} y confirma el enlace antes de iniciar sesión.',
    errEmailNotConfirmed: 'Confirma tu correo antes de iniciar sesión.',
    loginFormAria: 'Formulario de inicio de sesión',
    registerFormAria: 'Formulario de registro',
    forgotFormAria: 'Recuperar contraseña',
    resetFormAria: 'Nueva contraseña',
  },
  dashboard: {
    welcome: '¡Bienvenido, {name}!',
    welcomeSub: 'Explora todos los cursos disponibles deslizando lateralmente.',
    summaryTitle: 'Tu resumen',
    summarySub: 'Consulta tu actividad, progreso y accesos más útiles en un solo lugar.',
    summarySaved: 'Guardados',
    summaryFavorites: 'Favoritos',
    summaryQuizzes: 'Quizzes',
    summaryCerts: 'Certificaciones',
    quickActionsTitle: 'Acciones rápidas',
    quickActionsSub: 'Ve directo a lo que más usas, sin pasos extra.',
    quickContinue: 'Continuar ahora',
    quickExplore: 'Explorar cursos',
    quickExploreSub: 'Empieza una nueva ruta de aprendizaje.',
    quickQuizzes: 'Ir a quizzes',
    quickQuizzesSub: 'Evalúa lo aprendido y desbloquea certificados.',
    quickAi: 'Abrir asistente IA',
    quickAiSub: 'Resuelve dudas sobre cursos, quizzes y plataforma.',
    quickSaved: 'Mis guardados',
    quickSavedSub: '{n} recursos listos para retomar.',
    quickProfile: 'Ir a mi perfil',
    quickProfileSub: 'Gestiona progreso, favoritos y certificaciones.',
    quickMorning: 'Sesión de enfoque',
    quickMorningSub: 'Empieza el día retomando {course}.',
    quickEveningAi: 'Resolver dudas',
    quickEveningAiSub: 'Ideal para repasar lo aprendido hoy.',
    quickTopCourse: 'Tu curso principal',
    quickTopCourseSub: 'Retoma {course}, tu ruta más activa.',
    quickQuizRetake: 'Mejorar quiz',
    quickQuizRetakeSub: 'Sigue practicando en {course} ({pct}%).',
    quickCertPush: 'Preparar certificación',
    quickCertPushSub: 'Estás cerca en {course}.',
    hintMorning: 'Por la mañana',
    hintAfternoon: 'Por la tarde',
    hintEvening: 'Por la noche',
    hintNight: 'De madrugada',
    hintBasedOnCourse: 'Basado en {course}',
    hintProgress: 'Progreso {pct}%',
    hintSavedCount: '{n} guardados',
    openActionAria: 'Abrir {title}',
    resumeTitle: 'Continúa donde lo dejaste',
    resumeSub: 'Retoma cursos con progreso, lecciones recientes y quizzes en curso.',
    resumeCta: 'Continuar',
    resumeLessons: '{n} lecciones registradas',
    resumeQuizScore: 'Quiz {pct}%',
    resumeQuizOpen: 'Quiz a medias · {pct}%',
    resumeVideoOpen: 'Vídeo sin terminar',
    resumeLastLesson: 'Última lección: {title}',
    resumeRecentVisit: 'Actividad reciente',
    resumeNoProgress: 'Empieza tu primer módulo y registra tu avance.',
    resumeEmptyTitle: 'Aún no hay progreso registrado',
    resumeEmptyDesc: 'Explora un curso, completa una lección o responde un quiz para ver tu progreso aquí.',
    recommendedTitle: 'Recomendado para ti',
    recommendedSub: 'Sugerencias basadas en tus intereses, actividad y cursos guardados.',
    recommendedMeta: 'Categoría: {category}',
    reasonFavorites: 'Por tus favoritos',
    reasonSaved: 'Porque lo guardas',
    reasonRecent: 'Relacionado con lo reciente',
    reasonDiscover: 'Para descubrir',
    reasonTopCourse: 'Complementa {course}',
    reasonCategoryFocus: 'Similar a lo que estudias',
    reasonTagMatch: 'Relacionado con tus intereses',
    reasonNewInCategory: 'Nuevo en {category}',
    promoProgressEyebrow: 'Siguiente paso',
    promoProgressTitle: 'Convierte tu avance en una certificación',
    promoProgressSub: 'Ya tienes progreso en {course}. Da el siguiente paso con sus quizzes y examen final.',
    promoProgressCta: 'Ir a quizzes',
    promoSavedEyebrow: 'Biblioteca personal',
    promoSavedTitle: 'Retoma tus recursos guardados',
    promoSavedSub: 'Tienes {n} elementos listos para continuar cuando quieras.',
    promoSavedCta: 'Abrir perfil',
    promoDiscoverEyebrow: 'Recomendación destacada',
    promoDiscoverTitle: 'Prueba {course}',
    promoDiscoverSub: 'Una sugerencia basada en tus intereses actuales para mantener el ritmo de aprendizaje.',
    promoDiscoverCta: 'Abrir curso',
    promoAiEyebrow: 'Asistencia inteligente',
    promoAiTitle: 'Consulta al asistente educativo de IN4MIND',
    promoAiSub: 'Pide ayuda sobre cursos, quizzes, certificaciones o cómo seguir una ruta de aprendizaje.',
    promoAiCta: 'Abrir IA',
    featured: 'Cursos Destacados',
    continue: 'Continuar Aprendiendo',
    recent: 'Recién Vistos',
    aiBanner: '¿Tienes dudas? Consulta a nuestra Inteligencia Artificial',
    emptyRecent: 'Sin actividad reciente. Explora cursos para ver tu historial aquí.',
    courseAria: 'Ver curso de {course}',
    noCoursesSection: 'Sin cursos en esta sección.',
    continueItemAria: 'Continuar {title}',
    settingsTitle: 'Ajustes',
  },
  paths: {
    title: 'Rutas de aprendizaje',
    sub: 'Sigue un camino guiado por tema y avanza paso a paso.',
    progress: 'Progreso de ruta',
    progressPct: '{pct}% completado',
    nextLesson: 'Continuar lección',
    nextQuiz: 'Hacer quiz',
    nextProject: 'Proyecto guiado',
    nextCert: 'Examen de certificación',
    done: 'Ruta completada',
    'web-dev': { title: 'Desarrollo web', desc: 'HTML, CSS y JavaScript en secuencia.' },
    programming: { title: 'Programación', desc: 'Python, JavaScript y SQL para datos y lógica.' },
    office: { title: 'Productividad Office', desc: 'Excel y PowerPoint para el trabajo diario.' },
    design: { title: 'Diseño digital', desc: 'Canvas y Figma para contenido visual.' },
    devops: { title: 'Herramientas y seguridad', desc: 'GitHub y fundamentos de ciberseguridad.' },
  },
  analytics: {
    title: 'Tu actividad',
    sub: 'Racha, metas semanales y actividad reciente.',
    streak: 'Racha (días)',
    weeklyLessons: 'Lecciones esta semana',
    weeklyQuizzes: 'Quizzes esta semana',
    chartAria: 'Gráfico de actividad semanal',
    weekShort: 'S{n}',
    level: 'Nivel',
    xp: 'XP',
  },
  search: {
    title: 'Búsqueda global',
    placeholder: 'Buscar cursos, lecciones, quizzes…',
    hint: 'Escribe al menos 2 caracteres. Atajo: / o Ctrl+K',
    groupCourses: 'Cursos',
    groupLessons: 'Lecciones',
    groupQuizzes: 'Quizzes',
    groupHelp: 'Ayuda',
    helpArticle: 'Centro de ayuda',
    quizModule: 'Quiz de {course}',
    noResults: 'Sin resultados',
  },
  notif: {
    panelTitle: 'Notificaciones',
    markAll: 'Marcar leídas',
    empty: 'No hay notificaciones nuevas.',
    resumeTitle: 'Retoma {course}',
    resumeBody: 'Hace tiempo que no continúas este curso.',
    certNearTitle: 'Casi certificado en {course}',
    certNearBody: 'Tu mejor score es {pct}%. Completa el examen final.',
    quizImproveTitle: 'Mejora tu quiz de {course}',
    quizImproveBody: 'Llevas {pct}%. Un repaso más y subes.',
    streakTitle: 'Racha de {n} días',
    streakBody: 'Sigue aprendiendo para mantenerla.',
    weeklyGoalTitle: 'Meta semanal',
    weeklyGoalBody: '{done}/{goal} lecciones esta semana.',
    favTitle: 'Tu favorito: {course}',
    favBody: 'Continúa donde lo dejaste.',
    resumeBodyLong: 'Llevas {days} días sin continuar.',
    lessonTitle: 'Sigue con {course}',
    lessonBody: 'Tienes {n} lecciones registradas. Completa el módulo.',
    pathTitle: 'Ruta: {path}',
    pathBody: '{pct}% de la ruta · sigue con {course}',
    streakRiskTitle: 'No pierdas tu racha de {n} días',
    streakRiskBody: 'Completa una lección o quiz hoy para mantenerla.',
    srsTitle: 'Repaso espaciado',
    srsBody: 'Repasa «{topic}» ({days}d de retraso)',
    studyTitle: 'Momento de estudiar',
    studyBody: 'Dedica 15 minutos hoy: una lección o un quiz corto.',
    snooze: 'Recordar mañana',
  },
  srs: {
    dueTitle: 'Repaso espaciado',
    overdue: '{n}d',
  },
  offline: {
    download: 'Descargar offline',
    downloading: 'Descargando…',
    downloaded: 'Listo offline',
    ready: 'Curso listo para estudiar sin conexión.',
    fail: 'No se pudo descargar todo el curso. Inténtalo con red estable.',
  },
  onboard: {
    skip: 'Omitir',
    next: 'Siguiente',
    step: 'Paso {n} de {total}',
    resumeTitle: 'Continúa donde lo dejaste',
    resumeBody: 'Aquí verás tus cursos con progreso reciente para retomarlos al instante.',
    quickTitle: 'Acciones rápidas',
    quickBody: 'Accesos directos que cambian según la hora, tu progreso y tu curso más activo.',
    recommendTitle: 'Recomendado para ti',
    recommendBody: 'Sugerencias personalizadas según tus visitas, favoritos y quizzes.',
    aiTitle: 'Asistente IA',
    aiBody: 'Pregunta sobre cursos, quizzes o la plataforma. La IA conoce tu contexto de aprendizaje.',
  },
  signupOnboard: {
    title: '¿Cuál es tu objetivo?',
    sub: 'Elige por dónde quieres empezar. Te asignaremos el primer curso y la Lección 1.',
    step: 'Paso {n} de {total}',
    skip: 'Saltar por ahora',
    assignTitle: 'Tu primer curso: {course}',
    assignBody: 'Te llevamos a la Lección 1 para empezar ahora.',
    starting: 'Abriendo lección…',
    startLesson: 'Ir a la Lección 1',
    goals: {
      'python-basics': {
        title: 'Python básico',
        desc: 'Sintaxis, tipos y tu primera base de programación.',
      },
      logic: {
        title: 'Lógica',
        desc: 'Pensamiento estructurado con diagramas de flujo.',
      },
      web: {
        title: 'Desarrollo web',
        desc: 'Empieza con HTML y la estructura de la web.',
      },
      design: {
        title: 'Diseño',
        desc: 'Fundamentos creativos con Canva.',
      },
      office: {
        title: 'Ofimática',
        desc: 'Productividad con Excel desde cero.',
      },
    },
  },
  cert: {
    title: 'Certificado de finalización',
    issued: 'Emitido el {date}',
    code: 'Código: {code}',
    download: 'Descargar',
    copyLink: 'Copiar enlace',
    share: 'Compartir',
    shareText: '{name} obtuvo certificación en {course} con IN4MIND',
    copied: 'Enlace copiado',
    copyFail: 'No se pudo copiar',
    verifyPageTitle: 'Verificar certificado — IN4MIND',
    verifyTitle: 'Verificar certificado',
    verifySub: 'Introduce el código del certificado IN4MIND.',
    verifyBtn: 'Verificar',
    verifyValid: 'Certificado válido',
    verifyInvalid: 'Certificado no encontrado',
    holder: 'Titular',
    course: 'Curso',
  },
  video: {
    resumeAt: 'Continuar en {time}',
  },
  tutorial: {
    listTitle: 'Explora todos los Cursos',
    listSub: 'Elige un tema y empieza a aprender hoy.',
    featured: 'Ver Destacados',
    pickTopic: 'Elige un tema',
    backToList: 'Volver a cursos',
    addFavorite: 'Agregar a favoritos',
    removeFavorite: 'Quitar de favoritos',
    saveCourse: 'Guardar curso',
    shareCourse: 'Compartir curso',
    readMore: 'Leer Más',
    readLess: 'Leer Menos',
    aboutCourse: 'Apartados del curso',
    courseLessons: 'Lecciones del curso',
    quickIndex: 'Índice rápido',
    lesson: 'Lección',
    course: 'Curso',
    index: 'Índice',
    goQuiz: 'Ir al quiz del curso',
    prev: '← Anterior',
    next: 'Siguiente →',
    goQuizBtn: 'Ir al Quiz',
    quickCheck: 'Comprobación rápida',
    quickCheckSub: 'Responde para registrar tu avance en esta lección.',
    quizGateTitle: 'Comprueba lo aprendido',
    quizGateSub: 'Responde sobre el contenido del curso antes de ir al quiz.',
    quizGateProgress: 'Pregunta {n} de {total}',
    quizGateWrong: 'Revisa la lección e inténtalo de nuevo.',
    quizGatePass: '¡Bien! {pct}% correcto. Puedes ir al quiz.',
    quizGateFail: 'Obtuviste {pct}%. Necesitas al menos {min}% para continuar. Repasa las lecciones.',
    quizGateGo: 'Ir al quiz →',
    quizGateRetry: 'Reintentar',
    showVideo: '▶ Ver video',
    showVideoOptional: '▶ Ver video (opcional)',
    hideVideo: 'Ocultar video',
    startLearning: 'Empieza a Aprender',
    askTutor: 'Tutor IA',
    lessonLocked: 'Completa la lección anterior para desbloquear esta.',
    progressLocal: 'Progreso guardado en este dispositivo. Inicia sesión para sincronizarlo.',
    loginToSave: 'Inicia sesión para presentar el examen de certificación.',
    sectionN: 'Apartado {n}',
    openSectionAria: 'Abrir apartado {title}',
    videoBadge: '▶ Video',
    quizModuleLine: 'Quiz: {module} · {meta}',
    quizQuestionsCount: '{n} preguntas en quiz',
    topicQuiz: 'Quiz: {module}',
    example: 'Ejemplo',
    trySteps: 'Probar pasos',
    additionalResources: 'Recursos adicionales',
    explanatoryVideo: 'Video explicativo',
    playVideoHere: 'Reproducir aquí',
    gridCardAria: 'Ver curso de {course}',
    finishCourse: 'Finalizar curso',
    quizLabel: 'Quiz: {course}',
    all: 'Todos',
    catWeb: 'Web',
    catProgramming: 'Programación',
    catDesign: 'Diseño',
    catOffice: 'Office',
    catData: 'Datos',
    catSecurity: 'Ciberseguridad',
    catTools: 'Herramientas',
    certUnlock: 'Completa: {parts} para desbloquear el examen.',
    emptyList: 'No hay cursos que coincidan con tu búsqueda.',
    levelLesson: 'Nivel de esta lección:',
    levelBeginner: 'Principiante',
    levelIntermediate: 'Intermedio',
    levelAdvanced: 'Avanzado',
    aboutCourse: 'Sobre {course}',
    lessonOf: 'Lección {n} de {total}',
    moduleN: 'Módulo {n}',
    sectionDesc: 'Descripción',
    sectionLevel: 'Nivel',
    sectionReqs: 'Requisitos',
    sectionSteps: 'Curso paso a paso',
    videoComplementary: 'Video complementario',
    videoOptional: 'Opcional',
    videoHint: 'Puedes ver este video para reforzar la lección o continuar solo con el contenido escrito.',
    openYoutube: 'Abrir en YouTube',
    videoLessonTitle: 'Video de la lección',
    officialDocs: 'Documentación oficial',
    certTitle: 'Certificación profesional',
    certDesc: 'Para certificarte debes cumplir tres requisitos en orden: completar lecciones, aprobar el quiz y aprobar el examen práctico.',
    certModules: 'Módulos:',
    badgeProgress: 'En progreso',
    badgeCert: 'Certificado obtenido',
    badgeExam: 'Examen disponible',
    certStepLessons: 'Lecciones: {completed}/{total} con promedio ≥{min}% (actual {avg}%)',
    certStepQuiz: 'Quiz de práctica: ≥{min}% (tu mejor {pct}%)',
    certStepExam: 'Examen final: ≥{min}% para certificación profesional',
    certStatLessons: 'Lecciones',
    certStatAvg: 'Promedio',
    certStatQuiz: 'Quiz',
    certProgress: 'Progreso del curso',
    btnViewCert: 'Ver certificado en perfil',
    btnGoExam: 'Ir al examen de certificación',
    btnExamBlocked: 'Examen bloqueado',
    btnPracticeQuiz: 'Quiz de práctica (≥{min}%)',
    evaluatedQuiz: 'Evaluado en quiz del módulo',
    selectOther: 'Selecciona otra respuesta.',
    reviews: '({n} opiniones)',
    lessonCount: '{n} lecciones',
    quizModules: '{n} módulos de quiz',
    quizCount: '{n} quizzes',
    questionCount: '{n} preguntas',
    lessonGroupHint: 'Lección → quiz «{section}» → examen final',
    noteLabel: 'Nota:',
    certBlock: 'Certificación: Para certificarte necesitas: lecciones ≥{lessonMin}% de promedio, quiz ≥{quizMin}% y examen ≥{examMin}%. Este módulo («{module}») se evalúa en el',
    certQuizLink: 'quiz de {course}',
    tagLessons: '{n} lecciones',
    tagQuizModules: '{m} módulos · {q} preg.',
    myNotes: 'Mis notas',
    notesPlaceholder: 'Escribe tus apuntes de esta lección…',
    wasUseful: '¿Te fue útil?',
    thumbsUp: 'Útil',
    thumbsDown: 'No útil',
    previewBanner: 'Vista previa —',
    previewBannerEnd: 'para guardar progreso.',
  },
  share: {
    copied: 'Enlace copiado al portapapeles',
    copyFail: 'No se pudo copiar el enlace',
    quiz: 'Compartir este quiz',
    notes: 'Compartir mis notas',
    projects: 'Compartir mis proyectos',
    guided: 'Compartir proyectos guiados',
    weeklyCta: 'Compartir semana',
    weeklyEyebrow: 'Resumen semanal',
    weeklySub: 'Semana del {date}',
    weeklyText: 'Esta semana en IN4MIND: racha {streak} días · {lessons} lecciones · {quizzes} quizzes · nivel {level}. #IN4MIND',
    dueTopics: '{n} temas por repasar',
    print: 'Imprimir / PDF',
    copyText: 'Copiar texto',
  },
  chat: {
    title: 'Chat global',
    openAria: 'Abrir el chat global',
    minimize: 'Minimizar el chat',
    placeholder: 'Escribe un mensaje…',
    send: 'Enviar',
    online: 'En vivo',
    connecting: 'Conectando…',
    offline: 'Sin conexión',
    reconnecting: 'Sin conexión con el chat',
    onlineCount: '{n} en línea',
    empty: 'Todavía no hay mensajes. Rompe el hielo.',
    roleStudent: 'Estudiante',
    levelBadge: 'Nivel {n}',
    needsAccount: 'Inicia sesión para escribir',
    cooldown: 'Espera un momento antes de enviar otro mensaje.',
    tooLong: 'El mensaje supera los {n} caracteres.',
    sendFail: 'No se pudo enviar el mensaje.',
    shareQuiz: 'Compartir un quiz',
    quizSearch: 'Buscar un quiz…',
    quizNone: 'Ningún quiz coincide.',
    quizEyebrow: 'Reto de quiz',
    quizCardTitle: '¡Resuelve este quiz sobre {topic}!',
    quizCta: 'Resolver',
  },
  notes: {
    pageTitle: 'Mis Notas',
    pageSub: 'Organiza tus apuntes de cursos y proyectos.',
    searchPlaceholder: 'Buscar una nota…',
    searchAria: 'Buscar notas',
    newNote: 'Nueva nota',
    newFolder: 'Nueva carpeta',
    recentFolders: 'Carpetas recientes',
    myNotes: 'Mis notas',
    today: 'Hoy',
    thisWeek: 'Esta semana',
    thisMonth: 'Este mes',
    allNotes: 'Todas',
    favorites: 'Favoritas',
    recent: 'Recientes',
    fromLessons: 'De lecciones',
    emptyTitle: 'Aún no tienes notas',
    empty: 'Aún no tienes notas. ¡Crea la primera!',
    saved: 'Nota guardada',
    deleted: 'Nota eliminada',
    deleteConfirm: '¿Eliminar esta nota?',
    untitled: 'Sin título',
    editNote: 'Editar nota',
    titlePlaceholder: 'Título de la nota',
    contentPlaceholder: 'Escribe aquí…',
    tagsPlaceholder: 'Etiquetas separadas por coma',
    openLesson: 'Ver lección',
    folderNamePrompt: 'Nombre de la carpeta:',
    notesCount: '{n} notas',
  },
  projects: {
    pageTitle: 'Mis Proyectos',
    pageSub: 'Organiza tu aprendizaje con tareas, notas y cursos vinculados.',
    searchPlaceholder: 'Buscar proyectos…',
    searchAria: 'Buscar proyectos',
    newProject: 'Nuevo proyecto',
    emptyTitle: 'Sin proyectos todavía',
    empty: 'Organiza tu aprendizaje en proyectos con tareas y cursos vinculados.',
    noDesc: 'Sin descripción',
    tasks: 'tareas',
    back: 'Volver',
    linkedCourse: 'Curso vinculado',
    noCourse: '— Ninguno —',
    complete: 'completado',
    tasksTitle: 'Tareas',
    addTask: 'Añadir tarea…',
    notesTitle: 'Notas del proyecto',
    noNotes: 'Sin notas vinculadas.',
    openCourse: 'Abrir curso',
    saved: 'Proyecto guardado',
    deleted: 'Proyecto eliminado',
    deleteConfirm: '¿Eliminar este proyecto?',
    namePrompt: 'Nombre del proyecto:',
    descPlaceholder: 'Describe tu proyecto…',
  },
  guided: {
    pageTitle: 'Proyectos guiados',
    pageSub: 'Practica paso a paso. Se desbloquean con más de 80% en el quiz del tema.',
    searchPlaceholder: 'Buscar proyectos guiados…',
    searchAria: 'Buscar proyectos guiados',
    empty: 'No hay proyectos que coincidan.',
    diffBeginner: 'Principiante',
    diffIntermediate: 'Intermedio',
    diffAdvanced: 'Avanzado',
    estTime: '{n} min',
    start: 'Empezar proyecto',
    continue: 'Continuar',
    lockedCta: 'Bloqueado',
    unlockHint: 'Quiz >{pct}% (tienes {score}%)',
    lockedToast: 'Necesitas >{pct}% en el quiz de {topic}.',
    back: '← Volver',
    stepsNav: 'Pasos del proyecto',
    instructions: 'Instrucciones',
    workspace: 'Tu respuesta',
    workspacePlaceholder: 'Escribe tu respuesta o código aquí…',
    workspaceCode: 'Área de código',
    workspaceText: 'Área de respuesta',
    stepOf: 'Paso {n} de {total}: {title}',
    prev: 'Anterior',
    next: 'Siguiente',
    save: 'Guardar',
    saved: 'Progreso guardado',
    completeStep: 'Marcar paso como hecho',
    completedStep: 'Paso completado',
    needResponse: 'Escribe tu respuesta antes de marcar el paso.',
    projectDone: '¡Proyecto completado!',
    reviewing: 'Revisando tu respuesta…',
    reviewScore: 'Puntuación: {n}/100',
    reviewAi: 'Feedback con IA',
    reviewLocal: 'Feedback local',
  },
  quizzes: {
    bannerTitle: 'Pon a prueba tus conocimientos con Quizzes',
    bannerSub: 'Evalúa lo aprendido en cada curso y obtén certificaciones.',
    generalKnowledge: 'Conocimiento General',
    pickTopic: 'Elige un tema',
    continue: 'Continuar',
    certExams: 'Exámenes de certificación',
    certReq: 'Requisitos: lecciones ≥80%, quiz ≥70%, examen ≥80%.',
    backList: 'Volver al listado',
    next: 'Siguiente →',
    check: 'Comprobar',
    score: 'Puntaje',
    completed: '¡Quiz completado!',
    correct: 'Correctas',
    incorrect: 'Incorrectas',
    total: 'Total',
    correctFeedback: '✓ ¡Correcto!',
    wrongFeedback: '✗ Incorrecto.',
    typeChoice: 'Opción múltiple',
    typeTrueFalse: 'Verdadero o Falso',
    typeMatch: 'Pareos',
    questionGeneric: 'Pregunta',
    true: 'Verdadero',
    false: 'Falso',
    retry: 'Reintentar',
    backHome: 'Volver al inicio',
    review: 'Revisión',
    examLocked: 'Completa lecciones y quiz para desbloquear el examen.',
    examLockedPrefix: 'Examen bloqueado',
    examLockedLessons: 'lecciones {completed}/{total} con promedio ≥{min}% (actual {avg}%)',
    examLockedQuiz: 'quiz ≥{min}% (tu mejor: {pct}%)',
    continueCorrect: '{correct}/{total} correctas · {pct}%',
    continueAnswered: '{answered}/{total} respondidas · {pct}% completado',
    resume: 'Continuar',
    resumeHint: 'En curso · {pct}% completado',
    resumeTitle: '¿Continuar donde lo dejaste?',
    resumeDesc: 'Tienes {answered} de {total} preguntas respondidas en {title} ({pct}% completado).',
    resumeContinue: 'Continuar donde lo dejé',
    resumeRestart: 'Iniciar de nuevo',
    studyMe: 'Study Me',
    yourAnswer: 'Tu respuesta',
    whyLabel: '¿Por qué?',
    studyMeHint: 'Lee la explicación antes de continuar: la próxima vez la reconocerás.',
    noExplanation: 'Repasa este tema en la lección correspondiente.',
    adaptiveHarder: 'Subiendo dificultad: vas con buena racha.',
    adaptiveReview: 'Repaso dirigido',
    adaptiveReviewBadge: 'Repaso',
    diffEasy: 'Fácil',
    diffMedium: 'Media',
    diffHard: 'Difícil',
    aiTutor: 'Tutor IA',
    aiThinking: 'Personalizando la explicación…',
    examTitle: 'Examen de certificación: {title}',
    examCardAria: 'Examen de certificación de {title}',
    examPractical: 'Examen práctico · Aprobación ≥{min}%',
    examUnlocked: 'Examen desbloqueado. Necesitas ≥{min}% para obtener la certificación profesional.',
    quizPassedUnlock: '✓ Quiz aprobado (≥{min}%) — desbloquea certificación junto con las lecciones',
    resultNeedReview: 'Necesitas repasar este tema.',
    resultExamCert: 'Aprobaste el examen con {pct}%. ¡Certificación profesional añadida a tu perfil!',
    resultQuizCert: 'Completaste el quiz con {pct}%. ¡Certificado de práctica añadido a tu perfil!',
    resultExamFail: 'Necesitas al menos {min}% en el examen para la certificación profesional. Obtuviste {pct}%.',
    resultQuizPass: '¡Aprobaste con {pct}%! Este resultado cuenta para desbloquear el examen de certificación (junto con las lecciones).',
    resultQuizFail: 'Obtuviste {pct}%. Necesitas ≥{min}% en el quiz para avanzar hacia la certificación profesional.',
    saveExamTitle: 'Examen: {title}',
    saveExamDesc: 'Examen aprobado con {pct}% (mín. {min}%) · Módulos: {modules}',
    saveExamDescShort: 'Examen práctico aprobado con {pct}% en {title}',
    saveCertTitle: 'Certificado: {title}',
    saveCertDesc: 'Aprobado con {pct}% en el quiz de {title}',
    sectionAllAreas: 'Todas las áreas',
    certEarnedRetry: 'Certificación obtenida. Puedes reintentar para mejorar (mínimo {min}% en examen).',
    certGoal: 'Meta certificación: ≥{min}% en este quiz',
    questionsLabel: '{n} preguntas',
    presentExam: 'Presentar examen',
    locked: 'Bloqueado',
    noExams: 'No hay exámenes disponibles.',
    certEarnedBadge: '🏆 Certificado',
    andJoin: ' y ',
    start: 'Empezar',
    startQuizAria: 'Iniciar quiz de {title}',
    continueQuizAria: 'Continuar quiz de {title}',
    sectionsCount: '{n} apartados · {types}',
    emptyFilter: 'Sin resultados para este filtro.',
    matchHint: 'Selecciona la definición correcta para cada término.',
    matchSelect: '— Selecciona —',
    matchPairAria: 'Pareja para {term}',
    matchCompleteAll: 'Completa todos los pareos antes de comprobar.',
    optionAria: 'Opción {letter}: {opt}',
    examLockedLessonsLine: 'Lecciones: {completed}/{total} con promedio ≥{min}% (actual {avg}%)',
    examLockedQuizLine: 'Quiz: ≥{min}% requerido (tu mejor: {pct}%)',
    correctAnswer: 'Correcta',
    timeUp: 'Tiempo agotado. Mostrando resultados.',
  },
  ai: {
    assistant: 'IN4MIND Assistant',
    connecting: 'Conectando…',
    connected: 'Conectado a Groq IA',
    localMode: 'Modo local — configure GROQ_API_KEY en Vercel',
    assistantReady: 'Asistente educativo listo',
    generating: 'Generando respuesta…',
    error: 'Error en la solicitud',
    errNoKey: '**Configuración requerida**\n\nPara habilitar Groq IA, defina `GROQ_API_KEY` en Vercel (Settings → Environment Variables) y vuelva a desplegar.\n\n- Obtenga su clave en https://console.groq.com/keys\n- La clave permanece en el servidor: nunca se expone en el navegador',
    errInvalidKey: '**Credencial no válida**\n\nLa API Key configurada fue rechazada. Verifique que la clave sea correcta en la consola de Groq.',
    errUnavailable: '**Servicio temporalmente no disponible**\n\nNo fue posible completar la solicitud con Groq. Intente nuevamente en unos momentos.',
    errGeneric: '**Error de procesamiento**\n\nOcurrió un inconveniente al generar la respuesta. Reformule su consulta o verifique la conexión a internet.',
    newChat: 'Nueva conversación',
    welcomeTitle: 'Asistente educativo IN4MIND',
    welcomeSub: 'Puedes escribir en español, inglés o chino. Respondo sobre IN4MIND, cursos, quizzes, perfil y el catálogo.',
    offTopic: 'Consulta fuera del alcance de IN4MIND. Solo puedo ayudarte con la plataforma IN4MIND y sus cursos. Por favor, pregúntame sobre cursos, quizzes, perfil, certificaciones o temas de nuestro catálogo.',
    offTopicFull: '**Consulta fuera del alcance de IN4MIND**\n\nSolo puedo ayudarte con temas relacionados con **IN4MIND**: la plataforma, sus cursos, quizzes, perfil, certificaciones y el catálogo que ofrecemos.\n\nPor favor, formula preguntas sobre IN4MIND, por ejemplo:\n- "¿Cómo funcionan los cursos en IN4MIND?"\n- "¿Qué cursos puedo estudiar en IN4MIND?"\n- "Explícame variables en Python"\n- "¿Qué es el phishing?"\n\nEstoy aquí para apoyarte en tu aprendizaje dentro de IN4MIND.',
    emptyPrompt: 'Escribe tu pregunta sobre IN4MIND y con gusto te ayudo.',
    placeholder: 'Pregunte solo sobre IN4MIND o sus cursos…',
    send: 'Enviar mensaje',
    hint: 'IN4MIND Assistant puede cometer errores. Verifique la información crítica en cursos y documentación oficial.',
    configBanner: 'Configure GROQ_API_KEY en Vercel (Environment Variables) para activar respuestas con IA generativa.',
    conversations: 'Conversaciones',
    roleUser: 'Usted',
    roleAi: 'IN4MIND Assistant',
    roleIa: 'IA',
    historyAria: 'Historial de conversación',
    typingAria: 'Generando respuesta',
    sug1Label: 'Plataforma IN4MIND',
    sug1Hint: 'Cursos, quizzes y perfil',
    sug1Msg: '¿Cómo utilizo la plataforma IN4MIND: cursos, quizzes, dashboard y perfil?',
    sug2Label: 'Cursos disponibles',
    sug2Hint: 'Catálogo educativo IN4MIND',
    sug2Msg: '¿Qué cursos puedo estudiar en IN4MIND?',
    sug3Label: 'Fundamentos de Python',
    sug3Hint: 'Curso IN4MIND de Python',
    sug3Msg: 'Explique los fundamentos de Python según el curso de IN4MIND.',
    sug4Label: 'Ciberseguridad',
    sug4Hint: 'Phishing, contraseñas y MFA',
    sug4Msg: '¿Qué es el phishing y cómo me protejo según IN4MIND?',
  },
  profile: {
    user: 'Usuario',
    logout: 'Cerrar sesión',
    logoutConfirm: '¿Cerrar sesión?',
    saved: 'Guardados',
    favorites: 'Favoritos',
    quizzes: 'Quizzes',
    certifications: 'Certificaciones',
    projects: 'Proyectos',
    notes: 'Notas',
    items: '{n} Elementos',
    item: '{n} Elemento',
    completed: '{n} Completados',
    completedOne: '{n} Completado',
    obtained: '{n} Obtenidas',
    obtainedOne: '{n} Obtenida',
    projectMany: '{n} Proyectos',
    projectOne: '{n} Proyecto',
    noteMany: '{n} Notas',
    noteOne: '{n} Nota',
    tabSaved: 'Elementos guardados',
    tabProgress: 'En progreso',
    tabFavorites: 'Favoritos',
    tabNotes: 'Resumen de notas',
    tabProjects: 'Mis proyectos',
    tabQuizzes: 'Quizzes realizados',
    tabCerts: 'Certificaciones',
    featuredProjects: 'Proyectos destacados',
    viewAllProjects: 'Ver todos',
    highlighted: 'Destacado',
    generalNotes: 'Notas generales',
    goProjects: 'Ir a Mis Proyectos',
    goNotes: 'Abrir Mis Notas',
    empty: 'Aún no hay contenido aquí.',
    emptySaved: 'Aún no has guardado cursos. Explora Cursos y pulsa «Guardar».',
    emptyFav: 'Aún no tienes favoritos. Marca cursos con el corazón en Cursos.',
    emptyQuiz: 'Aún no has completado quizzes. Ve a Quizzes y pon a prueba tu conocimiento.',
    emptyCert: 'Aún no tienes certificaciones. Completa lecciones, quizzes y exámenes.',
    emptyProgress: 'Sin cursos en progreso. Empieza un curso.',
    emptyNotes: 'Aún no tienes notas de estudio. Crea una en Mis Notas.',
    emptyProjects: 'Aún no tienes proyectos. Crea uno en Mis Proyectos.',
    emptyFeatured: 'Aún no tienes proyectos destacados. Crea o fija uno en Mis Proyectos.',
    filterAll: 'Todas',
    continue: 'Continuar',
    seeMore: 'Ver más',
    open: 'Abrir',
    delete: 'Eliminar',
    accuracy: '{pct}% aciertos',
    profCert: 'Certificación profesional',
    practiceCert: 'Certificado de práctica',
    viewExam: 'Ver examen',
    viewQuiz: 'Ver quiz',
    contentAria: 'Contenido del perfil',
    activityAria: 'Resumen de actividad',
    viewSaved: 'Ver guardados',
    viewFav: 'Ver favoritos',
    viewQuizStat: 'Ver quizzes',
    viewCert: 'Ver certificaciones',
    viewProjects: 'Ver proyectos',
    viewNotes: 'Ver notas',
    settingsTitle: 'Preferencias',
    settingsSub: 'Personaliza tu experiencia en IN4MIND.',
    language: 'Idioma de la interfaz',
    languageSwitch: 'Cambiar idioma a {lang}',
    languageHint: 'El idioma se aplica en toda la aplicación: menús, cursos, quizzes y ayuda.',
  },
  settingsModal: {
    title: 'Ajustes',
    close: 'Cerrar',
    navAria: 'Secciones de ajustes',
    navGeneral: 'General',
    navAccount: 'Cuenta',
    navNotifications: 'Notificaciones',
    navAppearance: 'Apariencia',
    navLanguage: 'Idioma',
    navPrivacy: 'Privacidad',
    generalTitle: 'General',
    generalSub: 'Preferencias generales de IN4MIND: idioma, tema y ayuda.',
    about: 'Acerca de IN4MIND',
    aboutHint: 'Plataforma educativa de tecnología.',
    viewHelp: 'Ver ayuda →',
    version: 'Versión',
    accountTitle: 'Cuenta',
    accountSub: 'Información de tu perfil y sesión.',
    profile: 'Mi perfil',
    profileHint: 'Guardados, favoritos, quizzes y certificaciones.',
    openProfile: 'Abrir →',
    notifTitle: 'Notificaciones',
    notifSub: 'Elige cómo quieres recibir avisos.',
    emailNotif: 'Notificaciones por correo',
    emailNotifHint: 'Resumen de progreso y certificaciones.',
    pushNotif: 'Notificaciones en la app',
    pushNotifHint: 'Recordatorios de lecciones y quizzes.',
    appearanceTitle: 'Apariencia',
    appearanceSub: 'Personaliza el aspecto visual de IN4MIND.',
    bulbTitle: 'Diseño IN4MIND',
    bulbSub: 'El foco con circuito representa ideas, tecnología y claridad mental.',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
    languageTitle: 'Idioma',
    languageSub: 'El idioma se aplica en toda la aplicación.',
    privacyTitle: 'Privacidad',
    privacySub: 'Documentos legales y datos de tu cuenta.',
    privacyPolicy: 'Política de privacidad',
    cookies: 'Cookies',
    terms: 'Términos de uso',
    read: 'Leer →',
    navAccessibility: 'Accesibilidad',
    accessibilityTitle: 'Accesibilidad',
    accessibilitySub: 'Ajustes de lectura y movimiento.',
    editName: 'Nombre',
    saveName: 'Guardar',
    nameRequired: 'El nombre es obligatorio.',
    weeklyGoals: 'Metas semanales',
    weeklyGoalsHint: 'Lecciones y quizzes por semana.',
    resetOnboard: 'Repetir tour de bienvenida',
    onboardReset: 'Tour reiniciado. Ve al dashboard.',
  },
  cookies: {
    bannerTitle: 'Cookies',
    bannerText: 'Usamos cookies y almacenamiento local para recordar preferencias y mejorar tu experiencia.',
    learnMore: 'Más información',
    accept: 'Aceptar',
    decline: 'Solo esenciales',
  },
  privacy: {
    exportData: 'Exportar mis datos',
    exportHint: 'Descarga JSON con tu progreso.',
    exportBtn: 'Exportar',
    importData: 'Restaurar datos',
    importHint: 'Importa un JSON exportado previamente.',
    importBtn: 'Importar',
    importOk: 'Datos restaurados en este dispositivo.',
    importFail: 'No se pudo importar el archivo.',
    clearAi: 'Borrar historial IA',
    clearAiBtn: 'Borrar',
    deleteAccount: 'Eliminar cuenta y datos',
    deleteBtn: 'Eliminar',
    deleteConfirm: '¿Eliminar todos tus datos locales y cerrar sesión? Esta acción no se puede deshacer.',
  },
  connectivity: {
    offline: 'Sin conexión. Tus cambios se guardan en este dispositivo.',
    stillOffline: 'Sigues sin conexión.',
    synced: 'Se sincronizaron {n} cambio(s).',
    upToDate: 'Todo está sincronizado.',
    pending: 'Hay {n} cambio(s) pendientes de sincronizar.',
    saveLocal: 'Guardado en este dispositivo. Se sincronizará al recuperar la conexión.',
  },
  a11y: {
    largeText: 'Texto grande',
    largeTextHint: 'Aumenta el tamaño de fuente global.',
    highContrast: 'Alto contraste',
    reduceMotion: 'Reducir animaciones',
    shortcuts: 'Atajos de teclado',
    skipToContent: 'Saltar al contenido',
  },
  help: {
    title: 'Centro de ayuda',
    sub: 'Pregunta lo que necesites sobre IN4MIND o temas de tecnología. El asistente responde al instante.',
    searchHero: 'Pregunta al asistente de ayuda…',
    faqTitle: 'Preguntas frecuentes',
    contact: '¿No encuentras respuesta? Pregunta arriba o revisa el FAQ ›',
    filter: 'Filtrar preguntas...',
    empty: 'No hay resultados para tu búsqueda.',
    askAiTitle: 'Asistente IA de ayuda',
    askAiSub: 'Pregunta sobre IN4MIND, cursos, quizzes, perfil o el catálogo. Puedes escribir en español, inglés o chino.',
    askPlaceholder: 'Ej.: ¿Cómo guardo un curso? ¿Qué es el phishing?',
    askBtn: 'Preguntar',
    askGenerating: 'Generando respuesta…',
    askEmpty: 'Escribe tu pregunta abajo y el asistente te responderá al instante.',
    askHint: 'El asistente puede cometer errores. Verifica información crítica en cursos.',
    askOpenFull: 'Abrir chat completo en IA →',
    askTryFaq: 'También puedes buscar en las preguntas frecuentes de abajo.',
    chipSave: '¿Cómo guardo un curso?',
    chipSaveMsg: '¿Cómo guardo un curso en mi perfil?',
    chipPhishing: '¿Qué es el phishing?',
    chipPhishingMsg: '¿Qué es el phishing y cómo me protejo según IN4MIND?',
    chipCert: 'Certificación profesional',
    chipCertMsg: '¿Cómo obtengo una certificación profesional en IN4MIND?',
  },
  settings: {
    language: 'Idioma',
    languageSwitch: 'Cambiar idioma a {lang}',
  },
  theme: {
    dark: 'Activar modo oscuro',
    light: 'Activar modo claro',
    darkTitle: 'Modo oscuro',
    lightTitle: 'Modo claro',
  },
  courses: {
    canvas: { title: 'Canvas', desc: 'Diseño visual profesional y creación de contenido gráfico.' },
    figma: { title: 'Figma', desc: 'Diseño de interfaces y prototipos colaborativos.' },
    python: { title: 'Python', desc: 'Programación versátil para automatización y datos.' },
    javascript: { title: 'JavaScript', desc: 'Interactividad y dinamismo para la web moderna.' },
    html: { title: 'HTML', desc: 'Estructura y semántica de páginas web.' },
    css: { title: 'CSS', desc: 'Estilos, animaciones y diseño responsivo.' },
    github: { title: 'GitHub', desc: 'Control de versiones y colaboración en proyectos.' },
    excel: { title: 'Excel', desc: 'Gestión y análisis de datos con hojas de cálculo.' },
    powerpoint: { title: 'PowerPoint', desc: 'Presentaciones visuales de impacto corporativo.' },
    sql: { title: 'SQL', desc: 'Consultas y gestión de bases de datos relacionales.' },
    cybersecurity: { title: 'Ciberseguridad', desc: 'Protege sistemas, datos y usuarios frente a amenazas digitales.' },
    flowchart: { title: 'Diagrama de flujo', desc: 'Modela procesos con notación clara y decisiones trazables.' },
    os: { title: 'Sistema operativo', desc: 'Domina archivos, permisos, red y productividad en tu SO.' },
    powerapps: { title: 'Power Apps', desc: 'Apps empresariales low-code con Microsoft 365.' },
    sharepoint: { title: 'SharePoint', desc: 'Colaboración en documentos e intranet de equipo.' },
    outlook: { title: 'Outlook', desc: 'Correo, calendario y tareas profesionales.' },
    onedrive: { title: 'OneDrive', desc: 'Almacena, sincroniza y comparte en la nube.' },
    scrum: { title: 'Scrum', desc: 'Framework ágil con sprints y mejora continua.' },
    scratch: { title: 'Scratch', desc: 'Programación visual por bloques para aprender lógica.' },
    'video-editing': { title: 'Edición de videos', desc: 'Monta y exporta videos para web y redes.' },
    django: { title: 'Django', desc: 'Desarrollo web con Python y patrón MVT.' },
    powerbi: { title: 'Power BI', desc: 'Dashboards e informes interactivos de negocio.' },
    'prompt-engineering': { title: 'Prompt Engineering', desc: 'Prompts efectivos para IA generativa.' },
    engineering: { title: 'Ingeniería de software', desc: 'Requisitos, arquitectura, pruebas y entrega.' },
    'game-editing': { title: 'Edición de videojuegos', desc: 'Crea y edita juegos con motores, assets y builds.' },
  },
  recent: {
    r1: { title: 'Bases de Python', subtitle: 'Fundamentos', time: 'Visto hace 2 min' },
    r2: { title: 'Iniciando Canvas', subtitle: 'Uso básico', time: 'Hace 15 min' },
    r3: { title: 'Principios de Excel', subtitle: 'Funciones esenciales', time: 'Hace 1 hora' },
    r4: { title: 'Lógica de JS', subtitle: 'Introducción', time: 'Ayer' },
    r5: { title: 'Etiquetas HTML', subtitle: 'Estructura web', time: 'Ayer' },
    r6: { title: 'Git básico', subtitle: 'Control de versiones', time: 'Hace 2 días' },
    r7: { title: 'UI con Figma', subtitle: 'Prototipos', time: 'Hace 3 días' },
    r8: { title: 'Consultas SQL', subtitle: 'SELECT y JOINs', time: 'Hace 1 semana' },
    r9: { title: 'Fundamentos de ciberseguridad', subtitle: 'Phishing y contraseñas', time: 'Hace 4 días' },
  },
  visit: {
    recent: 'Reciente',
    moment: 'Visto hace un momento',
    mins: 'Visitado hace {n} min',
    hours: 'Visitado hace {n} h',
    days: 'Visitado hace {n} días',
    yesterday: 'Ayer',
    months: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  },
  faq: {
    q1: '¿Qué es IN4MIND?',
    a1: 'IN4MIND es una plataforma educativa para aprender tecnología de forma clara, moderna y accesible. Incluye cursos paso a paso, quizzes por módulo, exámenes de certificación, asistente de IA y un perfil donde guardas favoritos y progreso. El catálogo cubre diseño (Canvas, Figma), programación (Python, JavaScript, Django), web (HTML, CSS), herramientas (GitHub, diagramas de flujo, Scrum, prompt engineering), office (Excel, PowerPoint, Power Apps, SharePoint, Outlook, OneDrive), datos (SQL, Power BI), edición (video, videojuegos) y ciberseguridad.',
    q2: '¿Cómo creo una cuenta?',
    a2: 'Entra en la página de inicio de sesión desde el botón «Iniciar sesión» o «Registrarse». Necesitas un correo válido y una contraseña de al menos 6 caracteres. Tras registrarte, accedes al Dashboard con cursos, quizzes, IA y tu perfil personal.',
    q3: '¿IN4MIND es gratuito?',
    a3: 'Sí. IN4MIND es una plataforma formativa gratuita. Puedes explorar cursos, realizar quizzes, consultar al asistente de IA y obtener certificaciones de práctica sin pagar suscripción ni tarifas dentro de la app.',
    q4: '¿Cómo puedo guardar cursos o guías?',
    a4: 'Abre cualquier curso en Cursos y, en la vista de detalle, usa el botón «Guardar» para añadirlo a Guardados en tu perfil, o «Favorito» para marcarlo con el corazón. Ambas listas aparecen en Perfil → Elementos guardados / Favoritos.',
    q5: '¿Puedo acceder a IN4MIND desde el móvil?',
    a5: 'Sí. La interfaz es responsiva y funciona en navegadores de teléfono, tablet y escritorio. El menú lateral se adapta en pantallas pequeñas y puedes seguir lecciones, quizzes y tu perfil desde cualquier dispositivo.',
    q6: '¿Cómo hago seguimiento de mi progreso de aprendizaje?',
    a6: 'Al avanzar lecciones respondes una comprobación rápida que registra tu porcentaje. Los quizzes y exámenes guardan tu mejor puntuación. En Perfil verás guardados, favoritos, quizzes completados y certificaciones. Para la certificación profesional necesitas: lecciones ≥80%, quiz ≥70% y examen final ≥80%.',
    q7: '¿Qué métodos de pago aceptan?',
    a7: 'Ninguno dentro de la plataforma. IN4MIND no cobra por el acceso al contenido educativo. No hay planes de pago, facturación ni métodos de pago asociados a tu cuenta de aprendizaje.',
    q8: '¿Cómo contacto al soporte?',
    a8: 'Para dudas sobre la plataforma o los cursos, usa el **Asistente IA** en este Centro de ayuda (escribe tu pregunta arriba) o abre el chat completo desde el menú «IA».',
  },
  landing: {
    navHome: 'Inicio',
    navTopics: 'Temas',
    navImpact: 'Impacto',
    navTestimonials: 'Testimonios',
    navAbout: 'Nosotros',
    navCommunity: 'Comunidad',
    navGuides: 'Guías',
    navContact: 'Contacto',
    start: 'Empezar',
    heroTag: 'Mantente al día con tecnología accesible',
    heroTitle: 'Aprende tecnología de forma clara y moderna',
    heroSub: 'Cursos, quizzes, certificaciones y asistente IA en una sola plataforma.',
    explore: 'Explorar temas',
    intro: 'Ver introducción',
    introTitle: 'Bienvenido a IN4MIND',
    introBody: 'Cursos, quizzes, certificaciones y asistente IA en una plataforma accesible.',
    backTop: 'Volver arriba',
    search: 'Buscar',
    featuresTitle: 'Todo lo que necesitas para potenciar tus habilidades tecnológicas',
    coursesCarouselTitle: 'Herramientas y aplicaciones IN4MIND',
    coursesCarouselSub: 'Explora cursos, quizzes y certificaciones de todo el catálogo.',
    themeShowcaseTitle: 'Claro y oscuro, el mismo IN4MIND',
    themeShowcaseSub: 'Cambia de tema cuando quieras: la interfaz y el catálogo se adaptan sin perder claridad.',
    themeShowcaseAlt: 'Comparación del catálogo visual IN4MIND en modo claro y modo oscuro',
    themeShowcaseCta: 'Probar modo claro / oscuro',
    navTheme: 'Tema',
    courseSlideDot: 'Aplicaciones {n}',
    navCatalog: 'Catálogo',
    featureProgramming: 'Programación',
    featureProgrammingDesc: 'Aprende lenguajes como Python, JavaScript y más.',
    featureSecurity: 'Ciberseguridad',
    featureSecurityDesc: 'Protege tus datos con habilidades esenciales de seguridad.',
    featureAi: 'IA y Ciencia de Datos',
    featureAiDesc: 'Domina conceptos de IA y técnicas de análisis de datos.',
    featureWeb: 'Desarrollo Web',
    featureWebDesc: 'Crea sitios web responsivos y exitosos.',
    floatSecurity: 'Seguridad',
    floatWebDev: 'Web Dev',
    floatData: 'Datos',
    statsTutorials: 'Cursos técnicos',
    statsUsers: 'Usuarios activos',
    statsCourses: 'Cursos disponibles',
    testimonialsTitle: 'Lo que dicen nuestros usuarios',
    testimonialDot: 'Testimonio {n}',
    aboutTitle: 'Sobre IN4MIND',
    aboutLead: 'Somos una plataforma educativa enfocada en tecnología, diseñada para ayudarte a aprender de forma clara, práctica y a tu propio ritmo.',
    aboutMission: 'Nuestra misión',
    aboutMissionDesc: 'Empoderar a estudiantes en todo el mundo con educación de calidad y habilidades prácticas.',
    aboutEveryone: 'Para todos',
    aboutEveryoneDesc: 'Desde principiantes dando sus primeros pasos hasta profesionales que quieren avanzar en su carrera.',
    aboutEvolving: 'Siempre evolucionando',
    aboutEvolvingDesc: 'Actualizamos el contenido constantemente para mantenerte al día en el mundo tecnológico.',
    aboutPassion: 'Hecho con pasión',
    aboutPassionDesc: 'Creado por un equipo que ama enseñar, la tecnología y ayudar a otros a crecer.',
    popularTitle: 'Temas populares',
    popularWebDev: 'Desarrollo Web',
    popularDataSci: 'Ciencia de Datos',
    loveTitle: 'Lo que más valoran',
    loveClear: 'Claro y estructurado',
    loveClearDesc: 'Contenido fácil de seguir que hace el aprendizaje simple y agradable.',
    lovePractice: 'Práctica real',
    lovePracticeDesc: 'Ejemplos del mundo real, retos y quizzes para poner a prueba tus habilidades.',
    loveProgress: 'Seguimiento de progreso',
    loveProgressDesc: 'Monitorea tu avance y celebra cada logro en tu camino de aprendizaje.',
    loveSave: 'Guardar y organizar',
    loveSaveDesc: 'Guarda tu contenido favorito y accede cuando quieras, desde cualquier lugar.',
    guidesTitle: 'Vista previa de guías',
    guidesLead: 'Guías paso a paso para dominar nuevas habilidades y construir proyectos reales.',
    levelBeginner: 'Principiante',
    levelIntermediate: 'Intermedio',
    levelAdvanced: 'Avanzado',
    guidePyTitle: 'Python para principiantes',
    guidePyIntro: '<strong>Introducción:</strong> Python es uno de los lenguajes más demandados en programación, datos y automatización. Esta guía te lleva desde cero hasta escribir scripts claros y reutilizables, sin necesidad de experiencia previa.',
    guidePyDesc: 'Recorrerás sintaxis, control de flujo, funciones, estructuras de datos y manejo de archivos con ejemplos prácticos en cada módulo.',
    guideJsTitle: 'JavaScript moderno',
    guideJsIntro: '<strong>Introducción:</strong> JavaScript impulsa la web interactiva: desde botones y formularios hasta apps que consumen APIs. Si ya conoces HTML básico, aquí aprenderás a dar vida a tus páginas con código moderno y buenas prácticas.',
    guideJsDesc: 'Cubrirás variables, funciones, DOM, eventos, asincronía con async/await e integración con servicios externos paso a paso.',
    guideCyberTitle: 'Fundamentos de ciberseguridad',
    guideCyberIntro: '<strong>Introducción:</strong> En un entorno digital conectado, proteger datos, cuentas y sistemas es una habilidad esencial. Esta guía explica cómo piensan los atacantes y qué controles aplicar desde el primer día.',
    guideCyberDesc: 'Abordarás phishing, contraseñas y MFA, malware, respuesta a incidentes y hábitos seguros con escenarios del mundo real.',
    chapters: '{n} capítulos',
    duration: '{time}',
    guidePyChapters: '12 capítulos',
    guidePyDuration: '4h 30m',
    guideJsChapters: '18 capítulos',
    guideJsDuration: '6h 15m',
    guideCyberChapters: '15 capítulos',
    guideCyberDuration: '5h 45m',
    introLabel: 'Introducción:',
    metricUsers: 'Usuarios registrados',
    metricArticles: 'Cursos y artículos',
    metricHours: 'Horas de aprendizaje',
    metricSatisfaction: 'Satisfacción de estudiantes',
    metricsAria: 'Métricas de la plataforma',
    ctaTitle: '¿Listo para elevar tu conocimiento tecnológico?',
    ctaSub: 'Únete a IN4MIND hoy y comienza tu camino hacia el dominio tecnológico.',
    footerCopy: '© 2026 IN4MIND. Todos los derechos reservados.',
    footerResources: 'Recursos',
    footerSupport: 'Soporte',
    footerConnected: 'Mantente conectado',
    footerTerms: 'Términos de servicio',
    search: 'Buscar',
    carousel: 'carrusel',
    floatAi: 'IA',
    floatQuizzes: 'Quizzes',
    floatCyberTitle: 'Ciberseguridad',
    floatWebTitle: 'Desarrollo Web',
    floatAiTitle: 'Inteligencia Artificial',
    floatQuizTitle: 'Quizzes interactivos',
    floatDataTitle: 'Ciencia de Datos',
    floatPyTitle: 'Python',
    floatTipPy: 'Aprende Python desde cero: sintaxis, automatización, datos y scripts con lecciones paso a paso.',
    floatTipSecurity: 'Protege tus cuentas y datos: phishing, contraseñas, MFA y buenas prácticas digitales.',
    floatTipWebDev: 'Construye la web con HTML, CSS y JavaScript: estructura, diseño e interactividad.',
    floatTipAi: 'Asistente inteligente integrado que responde dudas sobre IN4MIND y tus cursos al instante.',
    floatTipQuizzes: 'Pon a prueba lo aprendido con preguntas interactivas y obtén certificaciones.',
    floatTipData: 'Analiza información con Excel, SQL y técnicas de ciencia de datos aplicadas.',
    newsletterPh: 'Introduce tu correo',
    newsletterBtn: 'Suscribirse',
    newsletterThanks: '¡Gracias por suscribirte! Te mantendremos informado.',
    testimonials: [
      { quote: '"IN4MIND ha sido un cambio total para aprender nuevas habilidades tecnológicas. Los cursos son claros, concisos y prácticos."', name: 'Sarah Martinez', role: 'Desarrolladora Web' },
      { quote: '"Los quizzes me ayudaron a validar mi conocimiento en Python, SQL y desarrollo web. Muy recomendable para equipos."', name: 'Carlos Mendoza', role: 'Ingeniero de Software' },
      { quote: '"Interfaz limpia, contenido profesional y el asistente IA responde exactamente lo que necesito mientras estudio."', name: 'Ana Rodríguez', role: 'Diseñadora UX' },
      { quote: '"IN4MIND se siente estructurado, calmado y enfocado en resultados reales de aprendizaje."', name: 'James Chen', role: 'Analista de Datos' },
    ],
  },
  legal: {
    back: 'Volver al inicio',
    termsTitle: 'Términos de uso',
    privacyTitle: 'Política de privacidad',
    cookiesTitle: 'Política de cookies',
    lastUpdated: 'Última actualización: 29 de mayo de 2026',
    footerCopy: '© 2026 IN4MIND. Todos los derechos reservados.',
    navTerms: 'Términos de uso',
    navPrivacy: 'Privacidad',
    navCookies: 'Cookies',
    navAria: 'Documentos legales',
    bodies: {},
  },
  quizDesc: 'Evaluación de {n} preguntas alineada a los {m} módulos del curso.',
};


;/* --- src/js/locales/en.js --- */
'use strict';

const LOCALE_EN = {
  meta: {
    defaultTitle: 'IN4MIND',
    loginTitle: 'IN4MIND — Sign In',
    dashboardTitle: 'IN4MIND — Dashboard',
    tutorialTitle: 'IN4MIND — Courses',
    quizzesTitle: 'IN4MIND — Quizzes',
    aiTitle: 'IN4MIND — AI Assistant',
    notesTitle: 'IN4MIND — My Notes',
    projectsTitle: 'IN4MIND — My Projects',
    guidedTitle: 'IN4MIND — Guided Projects',
    profileTitle: 'IN4MIND — My Profile',
    helpTitle: 'IN4MIND — Help Center',
    landingTitle: 'IN4MIND — Learn Technology',
    onboardingTitle: 'IN4MIND — Welcome',
  },
  nav: {
    home: 'Home',
    tutorials: 'Courses',
    notes: 'Notes',
    projects: 'Projects',
    guided: 'Guided',
    quizzes: 'Quizzes',
    ai: 'AI',
    settings: 'Settings',
    other: 'Other',
  },
  otherMenu: {
    title: 'More',
    close: 'Close',
    help: 'Help center',
    helpHint: 'FAQ and AI assistant',
    profile: 'My profile',
    profileHint: 'Certificates and progress',
    verify: 'Verify certificate',
    privacy: 'Privacy',
    terms: 'Terms of use',
    cookies: 'Cookies',
    shortcuts: 'Quick search',
    shortcutsHint: 'Ctrl+K',
    export: 'Export my data',
    logout: 'Sign out',
    home: 'Back to home',
    appearance: 'Appearance',
    appearanceHint: 'Choose IN4MIND visual mode',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
  },
  shell: {
    mainMenu: 'Main menu',
    mainNav: 'Main navigation',
    accountOptions: 'Account options',
    collapseMenu: 'Collapse menu',
    expandMenu: 'Expand menu',
    openMenu: 'Open menu',
    help: 'Help',
    notifications: 'Notifications',
    myProfile: 'Go to my profile',
    user: 'User',
    profileLabel: 'My profile — {name}',
    searchDashboard: 'Search courses, topics, and more...',
    searchDashboardAria: 'Search courses',
    searchProfile: 'Search saved, favorites, and quizzes...',
    searchProfileAria: 'Search profile',
    searchHelp: 'Search courses, topics, and more...',
    searchHelpAria: 'Search the app',
  },
  common: {
    loading: 'Loading…',
    loadingTutorials: 'Loading courses…',
    loadingQuizzes: 'Loading quizzes…',
    seeAll: 'See all',
    seeMore: 'See more',
    seeLess: 'See less',
    view: 'View',
    noResults: 'No results.',
    or: 'or',
    backHome: 'Back to Home',
    backToStart: 'Back to home',
    terms: 'Terms of use',
    privacy: 'Privacy',
    cookies: 'Cookies',
    cancel: 'Cancel',
    confirm: 'Confirm',
    open: 'Open',
    delete: 'Delete',
    share: 'Share',
    save: 'Save',
    saved: 'Saved',
    favorite: 'Favorite',
    favorites: 'Favorites',
    email: 'Email',
    password: 'Password',
    showPassword: 'Show/hide password',
    showPwd: 'Show password',
  },
  auth: {
    needHelp: 'Need help?',
    helpTitle: 'How to sign in to IN4MIND',
    helpStep1: '1. If you do not have an account, click «Sign up» and fill in name, email, and password (minimum 6 characters).',
    helpStep2: '2. If you already have an account, enter your email and password in the form fields.',
    helpStep3: '3. Click «Sign In». You will be redirected to the Dashboard with courses, quizzes, and AI.',
    helpStep4: '4. Forgot your password? Use «Forgot password?» to recover access.',
    helpStep5: '5. You can also explore the platform from «Back to Home» before registering.',
    helpClose: 'Got it',
    panelLoginTitle: 'Welcome to IN4MIND!',
    panelLoginDesc: 'Start understanding technology in a clear and accessible way.',
    panelRegisterTitle: 'Create your account!',
    panelRegisterDesc: 'Join our platform and discover the digital world.',
    panelForgotTitle: 'Recover your access',
    panelForgotDesc: 'We help you reset your password securely.',
    panelResetTitle: 'New password',
    panelResetDesc: 'Choose a secure password for your IN4MIND account.',
    loginHeading: 'Get started with IN4MIND!',
    loginSub: 'Enter your details below.',
    loginBtn: 'Sign In',
    loginGoogle: 'Sign in with Google',
    loginGoogleAria: 'Sign in with Google',
    noAccount: "Don't have an account?",
    registerLink: 'Sign up',
    hasAccount: 'Already have an account?',
    loginLink: 'Sign In',
    forgotLink: 'Forgot password?',
    forgotHeading: 'Forgot your password?',
    forgotSub: 'Enter your email and we will send reset instructions.',
    forgotBtn: 'Send link',
    forgotSuccessTitle: 'Request sent',
    forgotSuccessText: 'If an account exists with that email, you will receive instructions.',
    setNewPassword: 'Set new password',
    backToLogin: '‹ Back to sign in',
    resetHeading: 'New password',
    resetSub: 'Create a secure password of at least 6 characters.',
    resetEmailPh: 'Email address',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    savePassword: 'Save password',
    resetSuccessTitle: 'Password updated',
    resetSuccessText: 'You can now sign in with your new password.',
    goToLogin: 'Go to sign in',
    registerHeading: 'Create your account',
    registerSub: 'Complete your details to get started.',
    fullName: 'Full Name',
    passwordMin: 'Password (min. 6 characters)',
    registerBtn: 'Sign up',
    errEmail: 'Enter a valid email.',
    errPassword: 'Password must be at least 6 characters.',
    errName: 'Name is required.',
    errMin6: 'Minimum 6 characters.',
    errMatch: 'Passwords must match.',
    errFields: 'Please fix the highlighted fields.',
    errFillAll: 'Please complete all fields.',
    loggingIn: 'Signing in…',
    sending: 'Sending…',
    saving: 'Saving…',
    creating: 'Creating account…',
    invalidCreds: 'Invalid credentials.',
    wrongPassword: 'Incorrect password.',
    errLogin: 'Could not sign in.',
    sessionEnded: 'Signed out in another tab.',
    sessionExpired: 'Your session expired. Please sign in again.',
    oauthUnavailable: 'Use email and password in demo mode, or configure Supabase for Google.',
    errRegister: 'Could not register.',
    errProcess: 'Could not process the request.',
    errUpdatePassword: 'Could not update the password.',
    forgotSent: 'We sent the instructions to {email}. Check your inbox and spam folder; the link expires in 30 minutes.',
    forgotNotSent: 'We could not email {email} because the mail service is not configured yet. You can set a new password now on this device.',
    rememberMe: 'Remember me',
    rememberNote: 'Saves your email and password on this device for faster sign-in.',
    forgotDemoSuccess: 'If an account exists for {email}, you will receive instructions. In this demo you can continue and set a new password now.',
    errEmailTaken: 'This email is already registered.',
    confirmEmail: 'Account created. Check {email} and confirm the link before signing in.',
    errEmailNotConfirmed: 'Confirm your email before signing in.',
    loginFormAria: 'Sign-in form',
    registerFormAria: 'Registration form',
    forgotFormAria: 'Recover password',
    resetFormAria: 'New password',
  },
  dashboard: {
    welcome: 'Welcome, {name}!',
    welcomeSub: 'Explore all available courses by swiping sideways.',
    summaryTitle: 'Your overview',
    summarySub: 'Check your activity, progress, and most useful shortcuts in one place.',
    summarySaved: 'Saved',
    summaryFavorites: 'Favorites',
    summaryQuizzes: 'Quizzes',
    summaryCerts: 'Certifications',
    quickActionsTitle: 'Quick actions',
    quickActionsSub: 'Jump straight to what you use most.',
    quickContinue: 'Continue now',
    quickExplore: 'Explore courses',
    quickExploreSub: 'Start a new learning path.',
    quickQuizzes: 'Go to quizzes',
    quickQuizzesSub: 'Assess what you learned and unlock certifications.',
    quickAi: 'Open AI assistant',
    quickAiSub: 'Get help with courses, quizzes, and the platform.',
    quickSaved: 'My saved items',
    quickSavedSub: '{n} resources ready to resume.',
    quickProfile: 'Go to my profile',
    quickProfileSub: 'Manage progress, favorites, and certifications.',
    quickMorning: 'Focus session',
    quickMorningSub: 'Start your day by resuming {course}.',
    quickEveningAi: 'Clear doubts',
    quickEveningAiSub: 'Great for reviewing what you learned today.',
    quickTopCourse: 'Your main course',
    quickTopCourseSub: 'Resume {course}, your most active path.',
    quickQuizRetake: 'Improve quiz score',
    quickQuizRetakeSub: 'Keep practicing in {course} ({pct}%).',
    quickCertPush: 'Prepare certification',
    quickCertPushSub: 'You are close in {course}.',
    hintMorning: 'In the morning',
    hintAfternoon: 'In the afternoon',
    hintEvening: 'In the evening',
    hintNight: 'Late night',
    hintBasedOnCourse: 'Based on {course}',
    hintProgress: 'Progress {pct}%',
    hintSavedCount: '{n} saved',
    openActionAria: 'Open {title}',
    resumeTitle: 'Continue where you left off',
    resumeSub: 'Resume courses with progress, recent lessons, and active quizzes.',
    resumeCta: 'Continue',
    resumeLessons: '{n} lessons recorded',
    resumeQuizScore: 'Quiz {pct}%',
    resumeQuizOpen: 'Quiz in progress · {pct}%',
    resumeVideoOpen: 'Video unfinished',
    resumeLastLesson: 'Last lesson: {title}',
    resumeRecentVisit: 'Recent activity',
    resumeNoProgress: 'Start your first module and record your progress.',
    resumeEmptyTitle: 'No progress recorded yet',
    resumeEmptyDesc: 'Explore a course, complete a lesson, or answer a quiz to see progress here.',
    recommendedTitle: 'Recommended for you',
    recommendedSub: 'Suggestions based on your interests, activity, and saved courses.',
    recommendedMeta: 'Category: {category}',
    reasonFavorites: 'From your favorites',
    reasonSaved: 'Because you saved it',
    reasonRecent: 'Related to recent activity',
    reasonDiscover: 'Worth discovering',
    reasonTopCourse: 'Complements {course}',
    reasonCategoryFocus: 'Similar to what you study',
    reasonTagMatch: 'Related to your interests',
    reasonNewInCategory: 'New in {category}',
    promoProgressEyebrow: 'Next step',
    promoProgressTitle: 'Turn your progress into a certification',
    promoProgressSub: 'You already have progress in {course}. Take the next step with its quizzes and final exam.',
    promoProgressCta: 'Go to quizzes',
    promoSavedEyebrow: 'Personal library',
    promoSavedTitle: 'Resume your saved resources',
    promoSavedSub: 'You have {n} items ready to continue whenever you want.',
    promoSavedCta: 'Open profile',
    promoDiscoverEyebrow: 'Featured recommendation',
    promoDiscoverTitle: 'Try {course}',
    promoDiscoverSub: 'A suggestion based on your current interests to keep your learning momentum going.',
    promoDiscoverCta: 'Open course',
    promoAiEyebrow: 'Smart assistance',
    promoAiTitle: 'Ask the IN4MIND learning assistant',
    promoAiSub: 'Get help with courses, quizzes, certifications, or how to follow a learning path.',
    promoAiCta: 'Open AI',
    featured: 'Featured Courses',
    continue: 'Continue Learning',
    recent: 'Recently Viewed',
    aiBanner: 'Have questions? Ask our Artificial Intelligence',
    emptyRecent: 'No recent activity. Explore courses to see courses here.',
    courseAria: 'View {course} courses',
    noCoursesSection: 'No courses in this section.',
    continueItemAria: 'Continue {title}',
    settingsTitle: 'Settings',
  },
  paths: {
    title: 'Learning paths',
    sub: 'Follow a guided path by topic and progress step by step.',
    progress: 'Path progress',
    progressPct: '{pct}% complete',
    nextLesson: 'Continue lesson',
    nextQuiz: 'Take quiz',
    nextProject: 'Guided project',
    nextCert: 'Certification exam',
    done: 'Path completed',
    'web-dev': { title: 'Web development', desc: 'HTML, CSS, and JavaScript in sequence.' },
    programming: { title: 'Programming', desc: 'Python, JavaScript, and SQL for logic and data.' },
    office: { title: 'Office productivity', desc: 'Excel and PowerPoint for daily work.' },
    design: { title: 'Digital design', desc: 'Canvas and Figma for visual content.' },
    devops: { title: 'Tools & security', desc: 'GitHub and cybersecurity fundamentals.' },
  },
  analytics: {
    title: 'Your activity',
    sub: 'Streak, weekly goals, and recent activity.',
    streak: 'Streak (days)',
    weeklyLessons: 'Lessons this week',
    weeklyQuizzes: 'Quizzes this week',
    chartAria: 'Weekly activity chart',
    weekShort: 'W{n}',
    level: 'Level',
    xp: 'XP',
  },
  search: {
    title: 'Global search',
    placeholder: 'Search courses, lessons, quizzes…',
    hint: 'Type at least 2 characters. Shortcut: / or Ctrl+K',
    groupCourses: 'Courses',
    groupLessons: 'Lessons',
    groupQuizzes: 'Quizzes',
    groupHelp: 'Help',
    helpArticle: 'Help center',
    quizModule: '{course} quiz',
  },
  notif: {
    panelTitle: 'Notifications',
    markAll: 'Mark all read',
    empty: 'No new notifications.',
    resumeTitle: 'Resume {course}',
    resumeBody: 'You have not continued this course in a while.',
    certNearTitle: 'Almost certified in {course}',
    certNearBody: 'Your best score is {pct}%. Complete the final exam.',
    quizImproveTitle: 'Improve your {course} quiz',
    quizImproveBody: 'You are at {pct}%. One more practice run helps.',
    streakTitle: '{n}-day streak',
    streakBody: 'Keep learning to maintain it.',
    weeklyGoalTitle: 'Weekly goal',
    weeklyGoalBody: '{done}/{goal} lessons this week.',
    favTitle: 'Your favorite: {course}',
    favBody: 'Continue where you left off.',
    resumeBodyLong: 'You have not continued in {days} days.',
    lessonTitle: 'Keep going with {course}',
    lessonBody: 'You have {n} lessons recorded. Finish the module.',
    pathTitle: 'Path: {path}',
    pathBody: '{pct}% of the path · continue with {course}',
    streakRiskTitle: 'Do not lose your {n}-day streak',
    streakRiskBody: 'Complete a lesson or quiz today to keep it.',
    srsTitle: 'Spaced review',
    srsBody: 'Review “{topic}” ({days}d overdue)',
    studyTitle: 'Time to study',
    studyBody: 'Spend 15 minutes today: one lesson or a short quiz.',
    snooze: 'Remind me tomorrow',
  },
  srs: {
    dueTitle: 'Spaced review',
    overdue: '{n}d',
  },
  offline: {
    download: 'Download offline',
    downloading: 'Downloading…',
    downloaded: 'Ready offline',
    ready: 'Course ready to study offline.',
    fail: 'Could not download the full course. Try again on a stable network.',
  },
  onboard: {
    skip: 'Skip',
    next: 'Next',
    step: 'Step {n} of {total}',
    resumeTitle: 'Continue where you left off',
    resumeBody: 'See courses with recent progress and jump back in instantly.',
    quickTitle: 'Quick actions',
    quickBody: 'Shortcuts that adapt to time of day, progress, and your most active course.',
    recommendTitle: 'Recommended for you',
    recommendBody: 'Personalized suggestions from visits, favorites, and quizzes.',
    aiTitle: 'AI assistant',
    aiBody: 'Ask about courses, quizzes, or the platform. AI knows your learning context.',
  },
  signupOnboard: {
    title: 'What is your main goal?',
    sub: 'Pick where you want to start. We will assign your first course and Lesson 1.',
    step: 'Step {n} of {total}',
    skip: 'Skip for now',
    assignTitle: 'Your first course: {course}',
    assignBody: 'Taking you to Lesson 1 so you can start now.',
    starting: 'Opening lesson…',
    startLesson: 'Go to Lesson 1',
    goals: {
      'python-basics': {
        title: 'Basic Python',
        desc: 'Syntax, types, and your first programming foundation.',
      },
      logic: {
        title: 'Logic',
        desc: 'Structured thinking with flowcharts.',
      },
      web: {
        title: 'Web development',
        desc: 'Start with HTML and how the web is built.',
      },
      design: {
        title: 'Design',
        desc: 'Creative fundamentals with Canva.',
      },
      office: {
        title: 'Office skills',
        desc: 'Productivity with Excel from scratch.',
      },
    },
  },
  cert: {
    title: 'Certificate of completion',
    issued: 'Issued on {date}',
    code: 'Code: {code}',
    download: 'Download',
    copyLink: 'Copy link',
    share: 'Share',
    shareText: '{name} earned certification in {course} with IN4MIND',
    copied: 'Link copied',
    copyFail: 'Could not copy',
  },
  video: {
    resumeAt: 'Resume at {time}',
  },
  tutorial: {
    listTitle: 'Explore all Courses',
    listSub: 'Pick a topic and start learning today.',
    featured: 'See Featured',
    pickTopic: 'Pick a topic',
    backToList: 'Back to courses',
    addFavorite: 'Add to favorites',
    removeFavorite: 'Remove from favorites',
    saveCourse: 'Save course',
    shareCourse: 'Share course',
    readMore: 'Read More',
    readLess: 'Read Less',
    aboutCourse: 'Course sections',
    courseLessons: 'Course lessons',
    quickIndex: 'Quick index',
    lesson: 'Lesson',
    course: 'Course',
    index: 'Index',
    goQuiz: 'Go to course quiz',
    prev: '← Previous',
    next: 'Next →',
    goQuizBtn: 'Go to Quiz',
    quickCheck: 'Quick check',
    quickCheckSub: 'Answer to record your progress in this lesson.',
    quizGateTitle: 'Check what you learned',
    quizGateSub: 'Answer questions from the course before going to the quiz.',
    quizGateProgress: 'Question {n} of {total}',
    quizGateWrong: 'Review the lesson and try again.',
    quizGatePass: 'Nice! {pct}% correct. You can go to the quiz.',
    quizGateFail: 'You scored {pct}%. You need at least {min}% to continue. Review the lessons.',
    quizGateGo: 'Go to quiz →',
    quizGateRetry: 'Try again',
    showVideo: '▶ Watch video',
    showVideoOptional: '▶ Watch video (optional)',
    hideVideo: 'Hide video',
    startLearning: 'Start Learning',
    askTutor: 'AI tutor',
    lessonLocked: 'Complete the previous lesson to unlock this one.',
    progressLocal: 'Progress saved on this device. Sign in to sync it.',
    loginToSave: 'Sign in to take the certification exam.',
    sectionN: 'Section {n}',
    openSectionAria: 'Open section {title}',
    videoBadge: '▶ Video',
    quizModuleLine: 'Quiz: {module} · {meta}',
    quizQuestionsCount: '{n} quiz questions',
    topicQuiz: 'Quiz: {module}',
    example: 'Example',
    trySteps: 'Try steps',
    additionalResources: 'Additional resources',
    explanatoryVideo: 'Explainer video',
    playVideoHere: 'Play here',
    gridCardAria: 'View courses for {course}',
    finishCourse: 'Finish course',
    quizLabel: 'Quiz: {course}',
    all: 'All',
    catWeb: 'Web',
    catProgramming: 'Programming',
    catDesign: 'Design',
    catOffice: 'Office',
    catData: 'Data',
    catSecurity: 'Cybersecurity',
    catTools: 'Tools',
    certUnlock: 'Complete: {parts} to unlock the exam.',
    emptyList: 'No courses match your search.',
    levelLesson: 'Lesson level:',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    aboutCourse: 'About {course}',
    lessonOf: 'Lesson {n} of {total}',
    moduleN: 'Module {n}',
    sectionDesc: 'Description',
    sectionLevel: 'Level',
    sectionReqs: 'Requirements',
    sectionSteps: 'Step-by-step course',
    videoComplementary: 'Supplementary video',
    videoOptional: 'Optional',
    videoHint: 'You can watch this video to reinforce the lesson or continue with the written content only.',
    openYoutube: 'Open on YouTube',
    videoLessonTitle: 'Lesson video',
    officialDocs: 'Official documentation',
    certTitle: 'Professional certification',
    certDesc: 'To earn certification you must meet three requirements in order: complete lessons, pass the quiz, and pass the practical exam.',
    certModules: 'Modules:',
    badgeProgress: 'In progress',
    badgeCert: 'Certificate earned',
    badgeExam: 'Exam available',
    certStepLessons: 'Lessons: {completed}/{total} with average ≥{min}% (current {avg}%)',
    certStepQuiz: 'Practice quiz: ≥{min}% (your best {pct}%)',
    certStepExam: 'Final exam: ≥{min}% for professional certification',
    certStatLessons: 'Lessons',
    certStatAvg: 'Average',
    certStatQuiz: 'Quiz',
    certProgress: 'Course progress',
    btnViewCert: 'View certificate in profile',
    btnGoExam: 'Go to certification exam',
    btnExamBlocked: 'Exam locked',
    btnPracticeQuiz: 'Practice quiz (≥{min}%)',
    evaluatedQuiz: 'Assessed in module quiz',
    selectOther: 'Select another answer.',
    reviews: '({n} reviews)',
    lessonCount: '{n} lessons',
    quizModules: '{n} quiz modules',
    quizCount: '{n} quizzes',
    questionCount: '{n} questions',
    lessonGroupHint: 'Lesson → quiz «{section}» → final exam',
    noteLabel: 'Note:',
    certBlock: 'Certification: To earn certification you need: lessons ≥{lessonMin}% average, quiz ≥{quizMin}%, and exam ≥{examMin}%. This module («{module}») is assessed in the',
    certQuizLink: '{course} quiz',
    tagLessons: '{n} lessons',
    tagQuizModules: '{m} modules · {q} questions',
  },
  share: {
    copied: 'Link copied to clipboard',
    copyFail: 'Could not copy the link',
    quiz: 'Share this quiz',
    guided: 'Share guided projects',
    notes: 'Share notes',
    projects: 'Share projects',
    weeklyCta: 'Share week',
    weeklyEyebrow: 'Weekly summary',
    weeklySub: 'Week of {date}',
    weeklyText: 'This week on IN4MIND: {streak}-day streak · {lessons} lessons · {quizzes} quizzes · level {level}. #IN4MIND',
    dueTopics: '{n} topics to review',
    print: 'Print / PDF',
    copyText: 'Copy text',
  },
  notes: {
    pageTitle: 'My Notes',
    pageSub: 'Organize notes from courses and projects.',
    searchPlaceholder: 'Search a note…',
    searchAria: 'Search notes',
    newNote: 'New note',
    newFolder: 'New folder',
    recentFolders: 'Recent folders',
    myNotes: 'My notes',
    today: 'Today',
    thisWeek: 'This week',
    thisMonth: 'This month',
    allNotes: 'All',
    favorites: 'Favorites',
    recent: 'Recent',
    fromLessons: 'From lessons',
    emptyTitle: 'You have no notes yet',
    empty: 'You have no notes yet. Create your first one!',
    saved: 'Note saved',
    deleted: 'Note deleted',
    deleteConfirm: 'Delete this note?',
    untitled: 'Untitled',
    editNote: 'Edit note',
    titlePlaceholder: 'Note title',
    contentPlaceholder: 'Write here…',
    tagsPlaceholder: 'Tags separated by commas',
    openLesson: 'View lesson',
    folderNamePrompt: 'Folder name:',
    notesCount: '{n} notes',
  },
  projects: {
    pageTitle: 'My Projects',
    pageSub: 'Organize learning with tasks, notes, and linked courses.',
    searchPlaceholder: 'Search projects…',
    searchAria: 'Search projects',
    newProject: 'New project',
    emptyTitle: 'No projects yet',
    empty: 'Organize your learning into projects with tasks and linked courses.',
    noDesc: 'No description',
    tasks: 'tasks',
    back: 'Back',
    linkedCourse: 'Linked course',
    noCourse: '— None —',
    complete: 'complete',
    tasksTitle: 'Tasks',
    addTask: 'Add a task…',
    notesTitle: 'Project notes',
    noNotes: 'No linked notes.',
    openCourse: 'Open course',
    saved: 'Project saved',
    deleted: 'Project deleted',
    deleteConfirm: 'Delete this project?',
    namePrompt: 'Project name:',
    descPlaceholder: 'Describe your project…',
  },
  guided: {
    pageTitle: 'Guided projects',
    pageSub: 'Practice step by step. Unlock each project with over 80% on its topic quiz.',
    searchPlaceholder: 'Search guided projects…',
    searchAria: 'Search guided projects',
    empty: 'No matching projects.',
    diffBeginner: 'Beginner',
    diffIntermediate: 'Intermediate',
    diffAdvanced: 'Advanced',
    estTime: '{n} min',
    start: 'Start project',
    continue: 'Continue',
    lockedCta: 'Locked',
    unlockHint: 'Quiz >{pct}% (you have {score}%)',
    lockedToast: 'You need >{pct}% on the {topic} quiz.',
    back: '← Back',
    stepsNav: 'Project steps',
    instructions: 'Instructions',
    workspace: 'Your response',
    workspacePlaceholder: 'Write your answer or code here…',
    workspaceCode: 'Code workspace',
    workspaceText: 'Response workspace',
    stepOf: 'Step {n} of {total}: {title}',
    prev: 'Previous',
    next: 'Next',
    save: 'Save',
    saved: 'Progress saved',
    completeStep: 'Mark step complete',
    completedStep: 'Step completed',
    needResponse: 'Write a response before marking the step complete.',
    projectDone: 'Project completed!',
    reviewing: 'Reviewing your response…',
    reviewScore: 'Score: {n}/100',
    reviewAi: 'AI feedback',
    reviewLocal: 'Local feedback',
  },
  chat: {
    title: 'Global chat',
    openAria: 'Open the global chat',
    minimize: 'Minimise the chat',
    placeholder: 'Write a message…',
    send: 'Send',
    online: 'Live',
    connecting: 'Connecting…',
    offline: 'Offline',
    reconnecting: 'No connection to the chat',
    onlineCount: '{n} online',
    empty: 'No messages yet. Break the ice.',
    roleStudent: 'Student',
    levelBadge: 'Level {n}',
    needsAccount: 'Sign in to write',
    cooldown: 'Wait a moment before sending another message.',
    tooLong: 'The message is over {n} characters.',
    sendFail: 'The message could not be sent.',
    shareQuiz: 'Share a quiz',
    quizSearch: 'Search for a quiz…',
    quizNone: 'No quiz matches.',
    quizEyebrow: 'Quiz challenge',
    quizCardTitle: 'Take this quiz on {topic}!',
    quizCta: 'Take it',
  },
  quizzes: {
    bannerTitle: 'Test your knowledge with Quizzes',
    bannerSub: 'Assess what you learned in each course and earn certifications.',
    generalKnowledge: 'General Knowledge',
    pickTopic: 'Pick a topic',
    continue: 'Continue',
    certExams: 'Certification exams',
    certReq: 'Requirements: lessons ≥80%, quiz ≥70%, exam ≥80%.',
    backList: 'Back to list',
    next: 'Next →',
    check: 'Check',
    score: 'Score',
    completed: 'Quiz completed!',
    correct: 'Correct',
    incorrect: 'Incorrect',
    total: 'Total',
    correctFeedback: '✓ Correct!',
    wrongFeedback: '✗ Incorrect.',
    typeChoice: 'Multiple choice',
    typeTrueFalse: 'True or False',
    typeMatch: 'Matching',
    questionGeneric: 'Question',
    true: 'True',
    false: 'False',
    retry: 'Retry',
    backHome: 'Back to home',
    review: 'Review',
    examLocked: 'Complete lessons and quiz to unlock the exam.',
    examLockedPrefix: 'Exam locked',
    examLockedLessons: 'lessons {completed}/{total} with average ≥{min}% (current {avg}%)',
    examLockedQuiz: 'quiz ≥{min}% (your best: {pct}%)',
    continueCorrect: '{correct}/{total} correct · {pct}%',
    continueAnswered: '{answered}/{total} answered · {pct}% complete',
    resume: 'Continue',
    resumeHint: 'In progress · {pct}% complete',
    resumeTitle: 'Continue where you left off?',
    resumeDesc: 'You have answered {answered} of {total} questions in {title} ({pct}% complete).',
    resumeContinue: 'Continue where I left off',
    resumeRestart: 'Start over',
    studyMe: 'Study Me',
    yourAnswer: 'Your answer',
    whyLabel: 'Why?',
    studyMeHint: 'Read the explanation before moving on — you will recognise it next time.',
    noExplanation: 'Review this topic in the matching lesson.',
    adaptiveHarder: 'Raising difficulty — you are on a good streak.',
    adaptiveReview: 'Targeted review',
    adaptiveReviewBadge: 'Review',
    diffEasy: 'Easy',
    diffMedium: 'Medium',
    diffHard: 'Hard',
    aiTutor: 'AI tutor',
    aiThinking: 'Personalizing the explanation…',
    examTitle: 'Certification exam: {title}',
    examCardAria: 'Certification exam for {title}',
    examPractical: 'Practical exam · Pass ≥{min}%',
    examUnlocked: 'Exam unlocked. You need ≥{min}% to earn professional certification.',
    quizPassedUnlock: '✓ Quiz passed (≥{min}%) — unlocks certification along with lessons',
    resultNeedReview: 'You need to review this topic.',
    resultExamCert: 'You passed the exam with {pct}%. Professional certification added to your profile!',
    resultQuizCert: 'You completed the quiz with {pct}%. Practice certificate added to your profile!',
    resultExamFail: 'You need at least {min}% on the exam for professional certification. You got {pct}%.',
    resultQuizPass: 'You passed with {pct}%! This counts toward unlocking the certification exam (along with lessons).',
    resultQuizFail: 'You got {pct}%. You need ≥{min}% on the quiz to advance toward professional certification.',
    saveExamTitle: 'Exam: {title}',
    saveExamDesc: 'Exam passed with {pct}% (min. {min}%) · Modules: {modules}',
    saveExamDescShort: 'Practical exam passed with {pct}% in {title}',
    saveCertTitle: 'Certificate: {title}',
    saveCertDesc: 'Passed with {pct}% on the {title} quiz',
    sectionAllAreas: 'All areas',
    certEarnedRetry: 'Certification earned. You can retry to improve (minimum {min}% on exam).',
    certGoal: 'Certification goal: ≥{min}% on this quiz',
    questionsLabel: '{n} questions',
    presentExam: 'Take exam',
    locked: 'Locked',
    noExams: 'No exams available.',
    certEarnedBadge: '🏆 Certified',
    andJoin: ' and ',
    start: 'Start',
    startQuizAria: 'Start quiz for {title}',
    continueQuizAria: 'Continue quiz for {title}',
    sectionsCount: '{n} sections · {types}',
    emptyFilter: 'No results for this filter.',
    matchHint: 'Select the correct definition for each term.',
    matchSelect: '— Select —',
    matchPairAria: 'Match for {term}',
    matchCompleteAll: 'Complete all pairs before checking.',
    optionAria: 'Option {letter}: {opt}',
    examLockedLessonsLine: 'Lessons: {completed}/{total} with average ≥{min}% (current {avg}%)',
    examLockedQuizLine: 'Quiz: ≥{min}% required (your best: {pct}%)',
    correctAnswer: 'Correct',
  },
  ai: {
    assistant: 'IN4MIND Assistant',
    connecting: 'Connecting…',
    connected: 'Connected to Groq AI',
    localMode: 'Local mode — set GROQ_API_KEY in Vercel',
    assistantReady: 'Educational assistant ready',
    generating: 'Generating response…',
    error: 'Request error',
    errNoKey: '**Configuration required**\n\nTo enable Groq AI, set `GROQ_API_KEY` in Vercel (Settings → Environment Variables) and redeploy.\n\n- Get your key at https://console.groq.com/keys\n- The key stays on the server: it is never exposed to the browser',
    errInvalidKey: '**Invalid credentials**\n\nThe configured API Key was rejected. Verify the key is correct in the Groq console.',
    errUnavailable: '**Service temporarily unavailable**\n\nCould not complete the request with Groq. Please try again in a few moments.',
    errGeneric: '**Processing error**\n\nAn issue occurred while generating the response. Rephrase your question or check your internet connection.',
    newChat: 'New conversation',
    welcomeTitle: 'IN4MIND educational assistant',
    welcomeSub: 'You can write in Spanish, English, or Chinese. I answer about IN4MIND, courses, quizzes, profile, and catalog courses.',
    offTopic: 'Query outside IN4MIND scope. I can only help with the IN4MIND platform and its courses. Please ask about courses, quizzes, profile, certifications, or topics from our catalog.',
    offTopicFull: '**Query outside IN4MIND scope**\n\nI can only help with topics related to **IN4MIND**: the platform, its courses, quizzes, profile, certifications, and the courses we offer.\n\nPlease ask about IN4MIND, for example:\n- "How do courses work in IN4MIND?"\n- "What courses can I study on IN4MIND?"\n- "Explain variables in Python"\n- "What is phishing?"\n\nI am here to support your learning within IN4MIND.',
    emptyPrompt: 'Write your question about IN4MIND and I will gladly help.',
    placeholder: 'Ask only about IN4MIND or its courses…',
    send: 'Send message',
    hint: 'IN4MIND Assistant may make mistakes. Verify critical information in courses and official documentation.',
    configBanner: 'Set GROQ_API_KEY in Vercel (Environment Variables) to enable generative AI responses.',
    conversations: 'Conversations',
    roleUser: 'You',
    roleAi: 'IN4MIND Assistant',
    roleIa: 'AI',
    historyAria: 'Conversation history',
    typingAria: 'Generating response',
    sug1Label: 'IN4MIND Platform',
    sug1Hint: 'Courses, quizzes, and profile',
    sug1Msg: 'How do I use the IN4MIND platform: courses, quizzes, dashboard, and profile?',
    sug2Label: 'Available courses',
    sug2Hint: 'IN4MIND educational catalog',
    sug2Msg: 'What courses can I study on IN4MIND?',
    sug3Label: 'Python fundamentals',
    sug3Hint: 'IN4MIND Python course',
    sug3Msg: 'Explain Python fundamentals according to the IN4MIND course.',
    sug4Label: 'Cybersecurity',
    sug4Hint: 'Phishing, passwords, and MFA',
    sug4Msg: 'What is phishing and how do I protect myself according to IN4MIND?',
  },
  profile: {
    user: 'User',
    logout: 'Sign out',
    logoutConfirm: 'Sign out?',
    saved: 'Saved',
    favorites: 'Favorites',
    quizzes: 'Quizzes',
    certifications: 'Certifications',
    projects: 'Projects',
    notes: 'Notes',
    items: '{n} Items',
    item: '{n} Item',
    completed: '{n} Completed',
    completedOne: '{n} Completed',
    obtained: '{n} Earned',
    obtainedOne: '{n} Earned',
    projectMany: '{n} Projects',
    projectOne: '{n} Project',
    noteMany: '{n} Notes',
    noteOne: '{n} Note',
    tabSaved: 'Saved items',
    tabProgress: 'In progress',
    tabFavorites: 'Favorites',
    tabNotes: 'Study notes summary',
    tabProjects: 'My projects',
    tabQuizzes: 'Completed quizzes',
    tabCerts: 'Certifications',
    featuredProjects: 'Featured projects',
    viewAllProjects: 'View all',
    highlighted: 'Highlighted',
    generalNotes: 'General notes',
    goProjects: 'Go to My Projects',
    goNotes: 'Open My Notes',
    empty: 'No content here yet.',
    emptySaved: 'You have not saved courses yet. Explore Courses and click «Save».',
    emptyFav: 'No favorites yet. Mark courses with the heart in Courses.',
    emptyQuiz: 'No quizzes completed yet. Go to Quizzes and test your knowledge.',
    emptyCert: 'No certifications yet. Complete lessons, quizzes, and exams.',
    emptyProgress: 'No courses in progress. Start a course.',
    emptyNotes: 'No study notes yet. Create one in My Notes.',
    emptyProjects: 'No projects yet. Create one in My Projects.',
    emptyFeatured: 'No featured projects yet. Create or pin one in My Projects.',
    filterAll: 'All',
    continue: 'Continue',
    seeMore: 'See more',
    open: 'Open',
    delete: 'Delete',
    accuracy: '{pct}% accuracy',
    profCert: 'Professional certification',
    practiceCert: 'Practice certificate',
    viewExam: 'View exam',
    viewQuiz: 'View quiz',
    contentAria: 'Profile content',
    activityAria: 'Activity summary',
    viewSaved: 'View saved',
    viewFav: 'View favorites',
    viewQuizStat: 'View quizzes',
    viewCert: 'View certifications',
    viewProjects: 'View projects',
    viewNotes: 'View notes',
    settingsTitle: 'Preferences',
    settingsSub: 'Customize your IN4MIND experience.',
    language: 'Interface language',
    languageSwitch: 'Switch language to {lang}',
    languageHint: 'Language applies across the entire app: menus, courses, quizzes, and help.',
  },
  settingsModal: {
    title: 'Settings',
    close: 'Close',
    navAria: 'Settings sections',
    navGeneral: 'General',
    navAccount: 'Account',
    navNotifications: 'Notifications',
    navAppearance: 'Appearance',
    navLanguage: 'Language',
    navPrivacy: 'Privacy',
    generalTitle: 'General',
    generalSub: 'General IN4MIND preferences: language, theme, and help.',
    about: 'About IN4MIND',
    aboutHint: 'Educational technology platform.',
    viewHelp: 'View help →',
    version: 'Version',
    accountTitle: 'Account',
    accountSub: 'Your profile and session information.',
    profile: 'My profile',
    profileHint: 'Saved items, favorites, quizzes, and certifications.',
    openProfile: 'Open →',
    notifTitle: 'Notifications',
    notifSub: 'Choose how you want to receive alerts.',
    emailNotif: 'Email notifications',
    emailNotifHint: 'Progress summaries and certifications.',
    pushNotif: 'In-app notifications',
    pushNotifHint: 'Lesson and quiz reminders.',
    appearanceTitle: 'Appearance',
    appearanceSub: 'Customize the visual look of IN4MIND.',
    bulbTitle: 'IN4MIND design',
    bulbSub: 'The circuit bulb represents ideas, technology, and mental clarity.',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    languageTitle: 'Language',
    languageSub: 'Language applies across the entire app.',
    navAccessibility: 'Accessibility',
    accessibilityTitle: 'Accessibility',
    accessibilitySub: 'Reading and motion preferences.',
    privacyTitle: 'Privacy',
    privacySub: 'Legal documents and your account data.',
    privacyPolicy: 'Privacy policy',
    cookies: 'Cookies',
    terms: 'Terms of use',
    read: 'Read →',
  },
  privacy: {
    exportData: 'Export my data',
    exportHint: 'Download a JSON with your progress.',
    exportBtn: 'Export',
    importData: 'Restore data',
    importHint: 'Import a previously exported JSON.',
    importBtn: 'Import',
    importOk: 'Data restored on this device.',
    importFail: 'Could not import the file.',
    clearAi: 'Clear AI history',
    clearAiBtn: 'Clear',
    deleteAccount: 'Delete account and data',
    deleteBtn: 'Delete',
    deleteConfirm: 'Delete all local data and sign out? This cannot be undone.',
  },
  connectivity: {
    offline: 'You are offline. Changes are saved on this device.',
    stillOffline: 'Still offline.',
    synced: 'Synced {n} change(s).',
    upToDate: 'Everything is synced.',
    pending: '{n} change(s) pending sync.',
    saveLocal: 'Saved on this device. It will sync when you are back online.',
  },
  help: {
    title: 'Help Center',
    sub: 'Ask anything about IN4MIND or technology topics. The assistant replies instantly.',
    searchHero: 'Ask the help assistant…',
    faqTitle: 'Frequently Asked Questions',
    contact: "Can't find an answer? Ask above or browse the FAQ ›",
    filter: 'Filter questions...',
    empty: 'No results for your search.',
    askAiTitle: 'AI Help Assistant',
    askAiSub: 'Ask about IN4MIND, courses, quizzes, profile, or courses. You can write in Spanish, English, or Chinese.',
    askPlaceholder: 'E.g.: How do I save a course? What is phishing?',
    askBtn: 'Ask',
    askGenerating: 'Generating response…',
    askEmpty: 'Type your question below and the assistant will reply instantly.',
    askHint: 'The assistant may make mistakes. Verify critical information in courses.',
    askOpenFull: 'Open full chat in AI →',
    askTryFaq: 'You can also search the frequently asked questions below.',
    chipSave: 'How do I save a course?',
    chipSaveMsg: 'How do I save a course to my profile?',
    chipPhishing: 'What is phishing?',
    chipPhishingMsg: 'What is phishing and how do I protect myself according to IN4MIND?',
    chipCert: 'Professional certification',
    chipCertMsg: 'How do I earn professional certification on IN4MIND?',
  },
  a11y: {
    largeText: 'Large text',
    largeTextHint: 'Increases global font size.',
    highContrast: 'High contrast',
    reduceMotion: 'Reduce animations',
    shortcuts: 'Keyboard shortcuts',
    skipToContent: 'Skip to content',
  },
  settings: {
    language: 'Language',
    languageSwitch: 'Switch language to {lang}',
  },
  theme: {
    dark: 'Enable dark mode',
    light: 'Enable light mode',
    darkTitle: 'Dark mode',
    lightTitle: 'Light mode',
  },
  courses: {
    canvas: { title: 'Canvas', desc: 'Professional visual design and graphic content creation.' },
    figma: { title: 'Figma', desc: 'Interface design and collaborative prototypes.' },
    python: { title: 'Python', desc: 'Versatile programming for automation and data.' },
    javascript: { title: 'JavaScript', desc: 'Interactivity and dynamism for the modern web.' },
    html: { title: 'HTML', desc: 'Structure and semantics of web pages.' },
    css: { title: 'CSS', desc: 'Styles, animations, and responsive design.' },
    github: { title: 'GitHub', desc: 'Version control and project collaboration.' },
    excel: { title: 'Excel', desc: 'Data management and analysis with spreadsheets.' },
    powerpoint: { title: 'PowerPoint', desc: 'High-impact corporate visual presentations.' },
    sql: { title: 'SQL', desc: 'Queries and relational database management.' },
    cybersecurity: { title: 'Cybersecurity', desc: 'Protect systems, data, and users from digital threats.' },
    flowchart: { title: 'Flowchart', desc: 'Model processes with clear notation and traceable decisions.' },
    os: { title: 'Operating System', desc: 'Master files, permissions, networking, and OS productivity.' },
    powerapps: { title: 'Power Apps', desc: 'Low-code business apps with Microsoft 365.' },
    sharepoint: { title: 'SharePoint', desc: 'Team document collaboration and intranet.' },
    outlook: { title: 'Outlook', desc: 'Professional email, calendar, and tasks.' },
    onedrive: { title: 'OneDrive', desc: 'Store, sync, and share files in the cloud.' },
    scrum: { title: 'Scrum', desc: 'Agile framework with sprints and continuous improvement.' },
    scratch: { title: 'Scratch', desc: 'Visual block programming to learn logic.' },
    'video-editing': { title: 'Video Editing', desc: 'Edit and export videos for web and social media.' },
    django: { title: 'Django', desc: 'Web development with Python and the MVT pattern.' },
    powerbi: { title: 'Power BI', desc: 'Interactive business dashboards and reports.' },
    'prompt-engineering': { title: 'Prompt Engineering', desc: 'Effective prompts for generative AI.' },
    engineering: { title: 'Software Engineering', desc: 'Requirements, architecture, testing, and delivery.' },
    'game-editing': { title: 'Game Editing', desc: 'Create and edit games with engines, assets, and builds.' },
  },
  recent: {
    r1: { title: 'Python basics', subtitle: 'Fundamentals', time: 'Viewed 2 min ago' },
    r2: { title: 'Getting started with Canvas', subtitle: 'Basic use', time: '15 min ago' },
    r3: { title: 'Excel principles', subtitle: 'Essential functions', time: '1 hour ago' },
    r4: { title: 'JS logic', subtitle: 'Introduction', time: 'Yesterday' },
    r5: { title: 'HTML tags', subtitle: 'Web structure', time: 'Yesterday' },
    r6: { title: 'Basic Git', subtitle: 'Version control', time: '2 days ago' },
    r7: { title: 'UI with Figma', subtitle: 'Prototypes', time: '3 days ago' },
    r8: { title: 'SQL queries', subtitle: 'SELECT and JOINs', time: '1 week ago' },
    r9: { title: 'Cybersecurity fundamentals', subtitle: 'Phishing and passwords', time: '4 days ago' },
  },
  visit: {
    recent: 'Recent',
    moment: 'Viewed a moment ago',
    mins: 'Visited {n} min ago',
    hours: 'Visited {n} h ago',
    days: 'Visited {n} days ago',
    yesterday: 'Yesterday',
    months: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
  faq: {
    q1: 'What is IN4MIND?',
    a1: 'IN4MIND is an educational platform to learn technology in a clear, modern, and accessible way. It includes step-by-step courses, module quizzes, certification exams, an AI assistant, and a profile where you save favorites and progress. The catalog covers design (Canva, Figma), programming (Python, JavaScript, Django), web (HTML, CSS), tools (GitHub, flowcharts, Scrum, prompt engineering), office (Excel, PowerPoint, Power Apps, SharePoint, Outlook, OneDrive), data (SQL, Power BI), editing (video, game editing), and cybersecurity.',
    q2: 'How do I create an account?',
    a2: 'Go to the sign-in page via «Sign In» or «Sign up». You need a valid email and a password of at least 6 characters. After registering, you access the Dashboard with courses, quizzes, AI, and your personal profile.',
    q3: 'Is IN4MIND free?',
    a3: 'Yes. IN4MIND is a free learning platform. You can explore courses, take quizzes, use the AI assistant, and earn practice certifications without paying subscription or in-app fees.',
    q4: 'How can I save courses or guides?',
    a4: 'Open any course in Courses and, in the detail view, use «Save» to add it to Saved in your profile, or «Favorite» to mark it with the heart. Both lists appear in Profile → Saved items / Favorites.',
    q5: 'Can I access IN4MIND from mobile?',
    a5: 'Yes. The interface is responsive and works on phone, tablet, and desktop browsers. The sidebar adapts on small screens and you can follow lessons, quizzes, and your profile from any device.',
    q6: 'How do I track my learning progress?',
    a6: 'As you advance lessons you answer a quick check that records your percentage. Quizzes and exams save your best score. In Profile you will see saved, favorites, completed quizzes, and certifications. For professional certification you need: lessons ≥80%, quiz ≥70%, and final exam ≥80%.',
    q7: 'What payment methods do you accept?',
    a7: 'None within the platform. IN4MIND does not charge for access to educational content. There are no paid plans, billing, or payment methods linked to your learning account.',
    q8: 'How do I contact support?',
    a8: 'For questions about the platform or courses, use the **AI Assistant** in this Help Center (type your question above) or open the full chat from the «AI» menu.',
  },
  landing: {
    navHome: 'Home',
    navTopics: 'Topics',
    navImpact: 'Impact',
    navTestimonials: 'Testimonials',
    navAbout: 'About',
    navCommunity: 'Community',
    navGuides: 'Guides',
    navContact: 'Contact',
    start: 'Start',
    heroTag: 'Stay up to date with accessible technology',
    heroTitle: 'Learn technology clearly and modernly',
    heroSub: 'Courses, quizzes, certifications, and AI assistant in one platform.',
    explore: 'Explore topics',
    intro: 'Watch introduction',
    introTitle: 'Welcome to IN4MIND',
    introBody: 'Courses, quizzes, certifications, and an AI assistant in an accessible platform.',
    backTop: 'Back to top',
    featuresTitle: 'Everything you need to boost your tech skills',
    coursesCarouselTitle: 'IN4MIND tools and applications',
    coursesCarouselSub: 'Explore courses, quizzes, and certifications across the full catalog.',
    themeShowcaseTitle: 'Light and dark, the same IN4MIND',
    themeShowcaseSub: 'Switch themes anytime — the interface and catalog stay clear in both modes.',
    themeShowcaseAlt: 'Side-by-side comparison of the IN4MIND visual catalog in light and dark mode',
    themeShowcaseCta: 'Try light / dark mode',
    navTheme: 'Theme',
    courseSlideDot: 'Applications {n}',
    navCatalog: 'Catalog',
    featureProgramming: 'Programming',
    featureProgrammingDesc: 'Learn languages like Python, JavaScript, and more.',
    featureSecurity: 'Cybersecurity',
    featureSecurityDesc: 'Protect your data with essential security skills.',
    featureAi: 'AI and Data Science',
    featureAiDesc: 'Master AI concepts and data analysis techniques.',
    featureWeb: 'Web Development',
    featureWebDesc: 'Build responsive, successful websites.',
    floatSecurity: 'Security',
    floatWebDev: 'Web Dev',
    floatData: 'Data',
    statsTutorials: 'Technical courses',
    statsUsers: 'Active users',
    statsCourses: 'Available courses',
    testimonialsTitle: 'What our users say',
    testimonialDot: 'Testimonial {n}',
    aboutTitle: 'About IN4MIND',
    aboutLead: 'We are a technology-focused educational platform designed to help you learn clearly, practically, and at your own pace.',
    aboutMission: 'Our mission',
    aboutMissionDesc: 'Empower students worldwide with quality education and practical skills.',
    aboutEveryone: 'For everyone',
    aboutEveryoneDesc: 'From beginners taking their first steps to professionals advancing their careers.',
    aboutEvolving: 'Always evolving',
    aboutEvolvingDesc: 'We constantly update content to keep you current in the tech world.',
    aboutPassion: 'Made with passion',
    aboutPassionDesc: 'Created by a team that loves teaching, technology, and helping others grow.',
    popularTitle: 'Popular topics',
    popularWebDev: 'Web Development',
    popularDataSci: 'Data Science',
    loveTitle: 'What users value most',
    loveClear: 'Clear and structured',
    loveClearDesc: 'Easy-to-follow content that makes learning simple and enjoyable.',
    lovePractice: 'Real practice',
    lovePracticeDesc: 'Real-world examples, challenges, and quizzes to test your skills.',
    loveProgress: 'Progress tracking',
    loveProgressDesc: 'Monitor your progress and celebrate every milestone on your learning path.',
    loveSave: 'Save and organize',
    loveSaveDesc: 'Save your favorite content and access it anytime, anywhere.',
    guidesTitle: 'Guide preview',
    guidesLead: 'Step-by-step guides to master new skills and build real projects.',
    levelBeginner: 'Beginner',
    levelIntermediate: 'Intermediate',
    levelAdvanced: 'Advanced',
    guidePyTitle: 'Python for beginners',
    guidePyIntro: '<strong>Introduction:</strong> Python is one of the most in-demand languages in programming, data, and automation. This guide takes you from zero to writing clear, reusable scripts with no prior experience.',
    guidePyDesc: 'You will cover syntax, control flow, functions, data structures, and file handling with practical examples in each module.',
    guideJsTitle: 'Modern JavaScript',
    guideJsIntro: '<strong>Introduction:</strong> JavaScript powers interactive web experiences—from buttons and forms to apps that consume APIs. If you know basic HTML, you will learn to bring your pages to life with modern code and best practices.',
    guideJsDesc: 'You will cover variables, functions, the DOM, events, async/await, and external service integration step by step.',
    guideCyberTitle: 'Cybersecurity fundamentals',
    guideCyberIntro: '<strong>Introduction:</strong> In a connected digital world, protecting data, accounts, and systems is essential. This guide explains how attackers think and which controls to apply from day one.',
    guideCyberDesc: 'You will cover phishing, passwords and MFA, malware, incident response, and safe habits with real-world scenarios.',
    chapters: '{n} chapters',
    duration: '{time}',
    guidePyChapters: '12 chapters',
    guidePyDuration: '4h 30m',
    guideJsChapters: '18 chapters',
    guideJsDuration: '6h 15m',
    guideCyberChapters: '15 chapters',
    guideCyberDuration: '5h 45m',
    introLabel: 'Introduction:',
    metricUsers: 'Registered users',
    metricArticles: 'Courses and articles',
    metricHours: 'Learning hours',
    metricSatisfaction: 'Student satisfaction',
    metricsAria: 'Platform metrics',
    ctaTitle: 'Ready to elevate your tech knowledge?',
    ctaSub: 'Join IN4MIND today and start your path to tech mastery.',
    footerCopy: '© 2026 IN4MIND. All rights reserved.',
    footerResources: 'Resources',
    footerSupport: 'Support',
    footerConnected: 'Stay connected',
    footerTerms: 'Terms of service',
    search: 'Search',
    carousel: 'carousel',
    floatAi: 'AI',
    floatQuizzes: 'Quizzes',
    floatCyberTitle: 'Cybersecurity',
    floatWebTitle: 'Web Development',
    floatAiTitle: 'Artificial Intelligence',
    floatQuizTitle: 'Interactive quizzes',
    floatDataTitle: 'Data Science',
    floatPyTitle: 'Python',
    floatTipPy: 'Learn Python from scratch—syntax, automation, data, and scripting with step-by-step lessons.',
    floatTipSecurity: 'Protect accounts and data: phishing, passwords, MFA, and essential digital habits.',
    floatTipWebDev: 'Build the web with HTML, CSS, and JavaScript—structure, design, and interactivity.',
    floatTipAi: 'Built-in smart assistant that answers questions about IN4MIND and your courses instantly.',
    floatTipQuizzes: 'Test what you learned with interactive questions and earn certifications.',
    floatTipData: 'Analyze information with Excel, SQL, and practical data science techniques.',
    testimonials: [
      { quote: '"IN4MIND has been a game-changer for learning new tech skills. The courses are clear, concise, and practical."', name: 'Sarah Martinez', role: 'Web Developer' },
      { quote: '"The quizzes helped me validate my knowledge in Python, SQL, and web development. Highly recommended for teams."', name: 'Carlos Mendoza', role: 'Software Engineer' },
      { quote: '"Clean interface, professional content, and the AI assistant answers exactly what I need while studying."', name: 'Ana Rodríguez', role: 'UX Designer' },
      { quote: '"IN4MIND feels structured, calm, and focused on real learning outcomes."', name: 'James Chen', role: 'Data Analyst' },
    ],
    newsletterPh: 'Enter your email',
    newsletterBtn: 'Subscribe',
    newsletterThanks: 'Thanks for subscribing! We will keep you informed.',
  },
  legal: {
    back: 'Back to home',
    termsTitle: 'Terms of use',
    privacyTitle: 'Privacy policy',
    cookiesTitle: 'Cookie policy',
    lastUpdated: 'Last updated: May 29, 2026',
    footerCopy: '© 2026 IN4MIND. All rights reserved.',
    navTerms: 'Terms of use',
    navPrivacy: 'Privacy',
    navCookies: 'Cookies',
    navAria: 'Legal documents',
    bodies: {},
  },
  quizDesc: 'Assessment of {n} questions aligned to the {m} course modules.',
};


;/* --- src/js/locales/zh.js --- */
'use strict';

const LOCALE_ZH = {
  meta: {
    defaultTitle: 'IN4MIND',
    loginTitle: 'IN4MIND — 登录',
    dashboardTitle: 'IN4MIND — 仪表盘',
    tutorialTitle: 'IN4MIND — 课程',
    quizzesTitle: 'IN4MIND — 测验',
    aiTitle: 'IN4MIND — AI 助手',
    notesTitle: 'IN4MIND — 我的笔记',
    projectsTitle: 'IN4MIND — 我的项目',
    guidedTitle: 'IN4MIND — 引导项目',
    profileTitle: 'IN4MIND — 我的资料',
    helpTitle: 'IN4MIND — 帮助中心',
    landingTitle: 'IN4MIND — 学习技术',
    onboardingTitle: 'IN4MIND — 欢迎',
  },
  nav: {
    home: '首页',
    tutorials: '课程',
    notes: '笔记',
    projects: '项目',
    guided: '引导',
    quizzes: '测验',
    ai: 'AI',
    settings: '设置',
    other: '其他',
  },
  otherMenu: {
    title: '更多',
    close: '关闭',
    help: '帮助中心',
    helpHint: '常见问题与 AI 助手',
    profile: '我的资料',
    profileHint: '证书与进度',
    verify: '验证证书',
    privacy: '隐私政策',
    terms: '使用条款',
    cookies: 'Cookie',
    shortcuts: '快速搜索',
    shortcutsHint: 'Ctrl+K',
    export: '导出我的数据',
    logout: '退出登录',
    home: '返回首页',
    appearance: '外观',
    appearanceHint: '选择 IN4MIND 显示模式',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
  },
  shell: {
    mainMenu: '主菜单',
    mainNav: '主导航',
    accountOptions: '账户选项',
    collapseMenu: '收起菜单',
    expandMenu: '展开菜单',
    openMenu: '打开菜单',
    help: '帮助',
    notifications: '通知',
    myProfile: '前往我的资料',
    user: '用户',
    profileLabel: '我的资料 — {name}',
    searchDashboard: '搜索课程、主题等…',
    searchDashboardAria: '搜索课程',
    searchProfile: '搜索已保存、收藏和测验…',
    searchProfileAria: '搜索资料',
    searchHelp: '搜索课程、主题等…',
    searchHelpAria: '搜索应用',
  },
  common: {
    loading: '加载中…',
    loadingCourses: '加载课程中…',
    loadingTutorials: '加载课程中…',
    loadingQuizzes: '加载测验中…',
    seeAll: '查看全部',
    seeMore: '查看更多',
    seeLess: '收起',
    view: '查看',
    noResults: '无结果。',
    or: '或',
    backHome: '返回首页',
    backToStart: '返回首页',
    terms: '使用条款',
    privacy: '隐私',
    cookies: 'Cookie',
    cancel: '取消',
    confirm: '确认',
    open: '打开',
    delete: '删除',
    share: '分享',
    save: '保存',
    saved: '已保存',
    favorite: '收藏',
    favorites: '收藏夹',
    email: '电子邮件',
    password: '密码',
    showPassword: '显示/隐藏密码',
    showPwd: '显示密码',
  },
  auth: {
    needHelp: '需要帮助？',
    helpTitle: '如何登录 IN4MIND',
    helpStep1: '1. 如果您还没有账户，请点击「注册」并填写姓名、电子邮件和密码（至少 6 个字符）。',
    helpStep2: '2. 如果您已有账户，请在表单中输入您的电子邮件和密码。',
    helpStep3: '3. 点击「登录」。您将被重定向到包含课程、测验和 AI 的仪表盘。',
    helpStep4: '4. 忘记密码？使用「忘记密码？」恢复访问权限。',
    helpStep5: '5. 您也可以在注册前通过「返回首页」探索平台。',
    helpClose: '知道了',
    panelLoginTitle: '欢迎来到 IN4MIND！',
    panelLoginDesc: '以清晰、易懂的方式开始理解技术。',
    panelRegisterTitle: '创建您的账户！',
    panelRegisterDesc: '加入我们的平台，探索数字世界。',
    panelForgotTitle: '恢复访问权限',
    panelForgotDesc: '我们帮助您安全地重置密码。',
    panelResetTitle: '新密码',
    panelResetDesc: '为您的 IN4MIND 账户选择一个安全密码。',
    loginHeading: '开始使用 IN4MIND！',
    loginSub: '请在下方输入您的信息。',
    loginBtn: '登录',
    loginGoogle: '使用 Google 登录',
    loginGoogleAria: '使用 Google 登录',
    noAccount: '还没有账户？',
    registerLink: '注册',
    hasAccount: '已有账户？',
    loginLink: '登录',
    forgotLink: '忘记密码？',
    forgotHeading: '忘记密码？',
    forgotSub: '输入您的电子邮件，我们将发送重置说明。',
    forgotBtn: '发送链接',
    forgotSuccessTitle: '请求已发送',
    forgotSuccessText: '如果该电子邮件存在账户，您将收到说明。',
    setNewPassword: '设置新密码',
    backToLogin: '‹ 返回登录',
    resetHeading: '新密码',
    resetSub: '创建至少 6 个字符的安全密码。',
    resetEmailPh: '电子邮件地址',
    newPassword: '新密码',
    confirmPassword: '确认密码',
    savePassword: '保存密码',
    resetSuccessTitle: '密码已更新',
    resetSuccessText: '您现在可以使用新密码登录。',
    goToLogin: '前往登录',
    registerHeading: '创建您的账户',
    registerSub: '填写您的信息以开始使用。',
    fullName: '全名',
    passwordMin: '密码（至少 6 个字符）',
    registerBtn: '注册',
    errEmail: '请输入有效的电子邮件。',
    errPassword: '密码至少需要 6 个字符。',
    errName: '姓名为必填项。',
    errMin6: '至少 6 个字符。',
    errMatch: '两次密码必须一致。',
    errFields: '请修正高亮显示的字段。',
    errFillAll: '请填写所有字段。',
    loggingIn: '登录中…',
    sending: '发送中…',
    saving: '保存中…',
    creating: '创建账户中…',
    invalidCreds: '凭据无效。',
    wrongPassword: '密码不正确。',
    errLogin: '无法登录。',
    oauthUnavailable: '演示模式请使用邮箱和密码，或配置 Supabase 以使用 Google 登录。',
    errRegister: '无法注册。',
    errProcess: '无法处理请求。',
    errUpdatePassword: '无法更新密码。',
    forgotSent: '我们已将说明发送至 {email}。请查看收件箱和垃圾邮件文件夹；链接将在 30 分钟后失效。',
    forgotNotSent: '邮件服务尚未配置，无法向 {email} 发送邮件。你可以现在在本设备上设置新密码。',
    rememberMe: '记住我的信息',
    rememberNote: '在本设备上保存邮箱和密码以便下次自动填写。',
    forgotDemoSuccess: '如果 {email} 存在账户，您将收到说明。在此演示中，您可以继续并立即设置新密码。',
    errEmailTaken: '该邮箱已被注册。',
    confirmEmail: '账号已创建。请查收 {email} 并确认链接后再登录。',
    errEmailNotConfirmed: '请先确认邮箱再登录。',
    sessionEnded: '已在其他标签页退出登录。',
    sessionExpired: '会话已过期。请重新登录。',
    loginFormAria: '登录表单',
    registerFormAria: '注册表单',
    forgotFormAria: '找回密码',
    resetFormAria: '新密码',
  },
  dashboard: {
    welcome: '欢迎，{name}！',
    welcomeSub: '左右滑动浏览所有可用课程。',
    summaryTitle: '你的概览',
    summarySub: '在一个区域查看你的活动、进度和最常用快捷入口。',
    summarySaved: '已保存',
    summaryFavorites: '收藏',
    summaryQuizzes: '测验',
    summaryCerts: '认证',
    quickActionsTitle: '快捷操作',
    quickActionsSub: '直接进入你最常使用的功能。',
    quickContinue: '立即继续',
    quickExplore: '浏览课程',
    quickExploreSub: '开始一条新的学习路线。',
    quickQuizzes: '前往测验',
    quickQuizzesSub: '检验所学内容并解锁认证。',
    quickAi: '打开 AI 助手',
    quickAiSub: '快速获取课程、测验和平台相关帮助。',
    quickSaved: '我的已保存',
    quickSavedSub: '有 {n} 个资源可随时继续。',
    quickProfile: '进入我的资料',
    quickProfileSub: '管理进度、收藏与认证。',
    quickMorning: '专注学习',
    quickMorningSub: '从继续学习 {course} 开始今天。',
    quickEveningAi: '解答疑问',
    quickEveningAiSub: '适合回顾今天所学内容。',
    quickTopCourse: '你的主课程',
    quickTopCourseSub: '继续 {course}，你最活跃的学习路线。',
    quickQuizRetake: '提升测验成绩',
    quickQuizRetakeSub: '继续在 {course} 中练习（{pct}%）。',
    quickCertPush: '准备认证',
    quickCertPushSub: '你在 {course} 中已接近目标。',
    hintMorning: '上午时段',
    hintAfternoon: '下午时段',
    hintEvening: '晚上时段',
    hintNight: '深夜时段',
    hintBasedOnCourse: '基于 {course}',
    hintProgress: '进度 {pct}%',
    hintSavedCount: '已保存 {n} 项',
    openActionAria: '打开 {title}',
    resumeTitle: '从上次中断处继续',
    resumeSub: '继续有进度的课程、最近课时和进行中的测验。',
    resumeCta: '继续',
    resumeLessons: '已记录 {n} 节课',
    resumeQuizScore: '测验 {pct}%',
    resumeQuizOpen: '测验未完成 · {pct}%',
    resumeVideoOpen: '视频未看完',
    resumeLastLesson: '最近课时：{title}',
    resumeRecentVisit: '最近活动',
    resumeNoProgress: '开始你的第一模块并记录学习进度。',
    resumeEmptyTitle: '暂时还没有记录到进度',
    resumeEmptyDesc: '浏览课程、完成课时或回答测验后，这里会显示你的进度。',
    recommendedTitle: '为你推荐',
    recommendedSub: '根据你的兴趣、活动和已保存课程生成的建议。',
    recommendedMeta: '分类：{category}',
    reasonFavorites: '来自你的收藏',
    reasonSaved: '因为你保存过',
    reasonRecent: '与你的最近活动相关',
    reasonDiscover: '值得探索',
    reasonTopCourse: '补充 {course}',
    reasonCategoryFocus: '与你正在学习的内容相似',
    reasonTagMatch: '与你的兴趣相关',
    reasonNewInCategory: '{category} 新内容',
    promoProgressEyebrow: '下一步',
    promoProgressTitle: '把你的进度转化为认证',
    promoProgressSub: '你已经在 {course} 中有学习进度。现在可以继续测验并冲刺最终认证。',
    promoProgressCta: '前往测验',
    promoSavedEyebrow: '个人资料库',
    promoSavedTitle: '继续你的已保存资源',
    promoSavedSub: '你有 {n} 个内容可随时继续学习。',
    promoSavedCta: '打开资料',
    promoDiscoverEyebrow: '精选推荐',
    promoDiscoverTitle: '试试 {course}',
    promoDiscoverSub: '基于你当前兴趣给出的建议，帮助你持续保持学习节奏。',
    promoDiscoverCta: '打开课程',
    promoAiEyebrow: '智能辅助',
    promoAiTitle: '咨询 IN4MIND 学习助手',
    promoAiSub: '获取有关课程、测验、认证以及学习路线的帮助。',
    promoAiCta: '打开 AI',
    featured: '精选课程',
    continue: '继续学习',
    recent: '最近浏览',
    aiBanner: '有问题？问问我们的人工智能',
    emptyRecent: '暂无最近活动。浏览课程后，课程将显示在此处。',
    courseAria: '查看 {course} 课程',
    noCoursesSection: '此部分暂无课程。',
    continueItemAria: '继续 {title}',
    settingsTitle: '设置',
  },
  paths: {
    title: '学习路线',
    sub: '按主题跟随引导路径，循序渐进。',
    progress: '路线进度',
    progressPct: '已完成 {pct}%',
    nextLesson: '继续课时',
    nextQuiz: '去做测验',
    nextProject: '引导项目',
    nextCert: '认证考试',
    done: '路线已完成',
    'web-dev': { title: 'Web 开发', desc: '按顺序学习 HTML、CSS 和 JavaScript。' },
    programming: { title: '编程', desc: 'Python、JavaScript 和 SQL。' },
    office: { title: 'Office 效率', desc: 'Excel 和 PowerPoint。' },
    design: { title: '数字设计', desc: 'Canvas 和 Figma。' },
    devops: { title: '工具与安全', desc: 'GitHub 与网络安全基础。' },
  },
  analytics: {
    title: '你的活动',
    sub: '连续天数、周目标与近期活动。',
    streak: '连续天数',
    weeklyLessons: '本周课时',
    weeklyQuizzes: '本周测验',
    chartAria: '每周活动图表',
    weekShort: '第{n}周',
    level: '等级',
    xp: 'XP',
  },
  search: {
    title: '全局搜索',
    placeholder: '搜索课程、课时、测验…',
    hint: '至少输入 2 个字符。快捷键：/ 或 Ctrl+K',
    groupCourses: '课程',
    groupLessons: '课时',
    groupQuizzes: '测验',
    groupHelp: '帮助',
    helpArticle: '帮助中心',
    quizModule: '{course} 测验',
    noResults: '无结果',
  },
  notif: {
    panelTitle: '通知',
    markAll: '全部标为已读',
    empty: '暂无新通知。',
    resumeTitle: '继续学习 {course}',
    resumeBody: '你已经有一段时间没有继续这门课程了。',
    certNearTitle: '即将在 {course} 获得认证',
    certNearBody: '你的最佳成绩为 {pct}%。完成最终考试吧。',
    quizImproveTitle: '提升 {course} 测验成绩',
    quizImproveBody: '当前 {pct}%。再练习一次会更好。',
    streakTitle: '连续 {n} 天',
    streakBody: '坚持学习以保持连续记录。',
    weeklyGoalTitle: '本周目标',
    weeklyGoalBody: '本周课时 {done}/{goal}。',
    favTitle: '你的收藏：{course}',
    favBody: '从上次中断处继续。',
    resumeBodyLong: '你已经 {days} 天没有继续学习了。',
    lessonTitle: '继续学习 {course}',
    lessonBody: '你已记录 {n} 节课时。完成本模块吧。',
    pathTitle: '路线：{path}',
    pathBody: '路线进度 {pct}% · 继续学习 {course}',
    streakRiskTitle: '别中断连续 {n} 天的学习',
    streakRiskBody: '今天完成一节课或测验即可保持连续记录。',
    srsTitle: '间隔复习',
    srsBody: '复习「{topic}」（逾期 {days} 天）',
    studyTitle: '该学习了',
    studyBody: '今天花 15 分钟：一节课或一次短测验。',
    snooze: '明天再提醒',
  },
  srs: {
    dueTitle: '间隔复习',
    overdue: '{n}天',
  },
  offline: {
    download: '下载离线包',
    downloading: '下载中…',
    downloaded: '已可离线学习',
    ready: '课程已准备好离线学习。',
    fail: '未能完整下载课程。请在稳定网络下重试。',
  },
  onboard: {
    skip: '跳过',
    next: '下一步',
    step: '第 {n} 步，共 {total} 步',
    resumeTitle: '从上次中断处继续',
    resumeBody: '这里会显示有近期进度的课程，方便你立即继续。',
    quickTitle: '快捷操作',
    quickBody: '根据时段、进度和最常学习的课程动态变化。',
    recommendTitle: '为你推荐',
    recommendBody: '根据访问、收藏和测验生成的个性化建议。',
    aiTitle: 'AI 助手',
    aiBody: '可询问课程、测验或平台问题，AI 了解你的学习上下文。',
  },
  signupOnboard: {
    title: '你的主要目标是什么？',
    sub: '选择从哪里开始。我们将为你分配第一门课和第 1 课。',
    step: '第 {n} 步，共 {total} 步',
    skip: '暂时跳过',
    assignTitle: '你的第一门课：{course}',
    assignBody: '正在带你进入第 1 课，马上开始学习。',
    starting: '正在打开课程…',
    startLesson: '前往第 1 课',
    goals: {
      'python-basics': {
        title: 'Python 入门',
        desc: '语法、类型与编程基础。',
      },
      logic: {
        title: '逻辑思维',
        desc: '用流程图建立结构化思维。',
      },
      web: {
        title: '网页开发',
        desc: '从 HTML 与网页结构开始。',
      },
      design: {
        title: '设计',
        desc: '用 Canva 打下创意基础。',
      },
      office: {
        title: '办公技能',
        desc: '从零开始学习 Excel 提升效率。',
      },
    },
  },
  cert: {
    title: '结业证书',
    issued: '颁发日期：{date}',
    code: '证书编号：{code}',
    download: '下载',
    copyLink: '复制链接',
    share: '分享',
    shareText: '{name} 在 IN4MIND 获得了 {course} 认证',
    copied: '链接已复制',
    copyFail: '无法复制',
  },
  video: {
    resumeAt: '从 {time} 继续',
  },
  tutorial: {
    listTitle: '浏览全部课程',
    listSub: '选择一个主题，今天就开始学习。',
    featured: '查看精选',
    pickTopic: '选择主题',
    backToList: '返回课程列表',
    addFavorite: '添加到收藏',
    removeFavorite: '取消收藏',
    saveCourse: '保存课程',
    shareCourse: '分享课程',
    readMore: '阅读更多',
    readLess: '收起',
    aboutCourse: '课程章节',
    courseLessons: '课程课时',
    quickIndex: '快速索引',
    lesson: '课时',
    course: '课程',
    index: '索引',
    goQuiz: '前往课程测验',
    prev: '← 上一课',
    next: '下一课 →',
    goQuizBtn: '前往测验',
    quickCheck: '快速检测',
    quickCheckSub: '回答以记录本课的学习进度。',
    quizGateTitle: '检测所学内容',
    quizGateSub: '前往测验前，请回答课程中的问题。',
    quizGateProgress: '第 {n} 题，共 {total} 题',
    quizGateWrong: '请复习本课后再试。',
    quizGatePass: '很好！正确率 {pct}%。您可以前往测验。',
    quizGateFail: '您的得分为 {pct}%。需要至少 {min}% 才能继续。请复习课时。',
    quizGateGo: '前往测验 →',
    quizGateRetry: '再试一次',
    showVideo: '▶ 观看视频',
    showVideoOptional: '▶ 观看视频（可选）',
    hideVideo: '隐藏视频',
    startLearning: '开始学习',
    askTutor: 'AI 导师',
    lessonLocked: '请先完成上一课以解锁此课。',
    progressLocal: '进度已保存在本设备。登录后可同步。',
    loginToSave: '登录后即可参加认证考试。',
    sectionN: '第 {n} 节',
    openSectionAria: '打开章节 {title}',
    videoBadge: '▶ 视频',
    quizModuleLine: '测验：{module} · {meta}',
    quizQuestionsCount: '{n} 道测验题',
    topicQuiz: '测验：{module}',
    example: '示例',
    trySteps: '尝试步骤',
    additionalResources: '附加资源',
    explanatoryVideo: '讲解视频',
    playVideoHere: '在此播放',
    gridCardAria: '查看 {course} 课程',
    finishCourse: '完成课程',
    quizLabel: '测验：{course}',
    all: '全部',
    catWeb: 'Web',
    catProgramming: '编程',
    catDesign: '设计',
    catOffice: '办公',
    catData: '数据',
    catSecurity: '网络安全',
    catTools: '工具',
    certUnlock: '完成：{parts} 以解锁考试。',
    emptyList: '没有符合搜索条件的课程。',
    levelLesson: '课时级别：',
    levelBeginner: '初级',
    levelIntermediate: '中级',
    levelAdvanced: '高级',
    aboutCourse: '关于 {course}',
    lessonOf: '第 {n} 课，共 {total} 课',
    moduleN: '模块 {n}',
    sectionDesc: '描述',
    sectionLevel: '级别',
    sectionReqs: '要求',
    sectionSteps: '分步课程',
    videoComplementary: '补充视频',
    videoOptional: '可选',
    videoHint: '您可以观看此视频以巩固本课，或仅继续阅读文字内容。',
    openYoutube: '在 YouTube 上打开',
    videoLessonTitle: '课时视频',
    officialDocs: '官方文档',
    certTitle: '专业认证',
    certDesc: '要获得认证，您必须按顺序满足三项要求：完成课时、通过测验并通过实践考试。',
    certModules: '模块：',
    badgeProgress: '进行中',
    badgeCert: '已获得证书',
    badgeExam: '考试可用',
    certStepLessons: '课时：{completed}/{total}，平均分 ≥{min}%（当前 {avg}%）',
    certStepQuiz: '练习测验：≥{min}%（您的最佳 {pct}%）',
    certStepExam: '期末考试：≥{min}% 以获得专业认证',
    certStatLessons: '课时',
    certStatAvg: '平均分',
    certStatQuiz: '测验',
    certProgress: '课程进度',
    btnViewCert: '在资料中查看证书',
    btnGoExam: '前往认证考试',
    btnExamBlocked: '考试已锁定',
    btnPracticeQuiz: '练习测验（≥{min}%）',
    evaluatedQuiz: '在模块测验中评估',
    selectOther: '请选择其他答案。',
    reviews: '（{n} 条评价）',
    lessonCount: '{n} 课时',
    quizModules: '{n} 个测验模块',
    quizCount: '{n} 个测验',
    questionCount: '{n} 道题',
    lessonGroupHint: '课时 → 测验「{section}」→ 期末考试',
    noteLabel: '注意：',
    certBlock: '认证：要获得认证，您需要：课时平均分 ≥{lessonMin}%、测验 ≥{quizMin}%、考试 ≥{examMin}%。本模块（「{module}」）在',
    certQuizLink: '{course} 测验',
    tagLessons: '{n} 课时',
    tagQuizModules: '{m} 个模块 · {q} 道题',
    myNotes: '我的笔记',
    notesPlaceholder: '写下这一课的笔记…',
    wasUseful: '对你有帮助吗？',
    thumbsUp: '有用',
    thumbsDown: '没用',
    previewBanner: '预览 —',
    previewBannerEnd: '以保存进度。',
  },
  share: {
    copied: '链接已复制到剪贴板',
    copyFail: '无法复制链接',
    quiz: '分享此测验',
    notes: '分享我的笔记',
    projects: '分享我的项目',
    guided: '分享引导项目',
    weeklyCta: '分享本周',
    weeklyEyebrow: '本周总结',
    weeklySub: '{date} 所在周',
    weeklyText: '本周在 IN4MIND：连续 {streak} 天 · {lessons} 课时 · {quizzes} 测验 · 等级 {level}。#IN4MIND',
    dueTopics: '有 {n} 个主题待复习',
    print: '打印 / PDF',
    copyText: '复制文本',
  },
  notes: {
    pageTitle: '我的笔记',
    pageSub: '整理课程与项目笔记。',
    searchPlaceholder: '搜索笔记…',
    searchAria: '搜索笔记',
    newNote: '新建笔记',
    newFolder: '新建文件夹',
    recentFolders: '最近文件夹',
    myNotes: '我的笔记',
    today: '今天',
    thisWeek: '本周',
    thisMonth: '本月',
    allNotes: '全部',
    favorites: '收藏',
    recent: '最近',
    fromLessons: '来自课时',
    emptyTitle: '还没有笔记',
    empty: '还没有笔记。创建第一篇吧！',
    saved: '笔记已保存',
    deleted: '笔记已删除',
    deleteConfirm: '删除此笔记？',
    untitled: '无标题',
    editNote: '编辑笔记',
    titlePlaceholder: '笔记标题',
    contentPlaceholder: '在此书写…',
    tagsPlaceholder: '标签，用逗号分隔',
    openLesson: '查看课时',
    folderNamePrompt: '文件夹名称：',
    notesCount: '{n} 条笔记',
  },
  projects: {
    pageTitle: '我的项目',
    pageSub: '用任务、笔记和关联课程组织学习。',
    searchPlaceholder: '搜索项目…',
    searchAria: '搜索项目',
    newProject: '新建项目',
    emptyTitle: '还没有项目',
    empty: '用任务、笔记和关联课程来组织你的学习。',
    noDesc: '暂无描述',
    tasks: '任务',
    back: '返回',
    linkedCourse: '关联课程',
    noCourse: '— 无 —',
    complete: '已完成',
    tasksTitle: '任务',
    addTask: '添加任务…',
    notesTitle: '项目笔记',
    noNotes: '暂无关联笔记。',
    openCourse: '打开课程',
    saved: '项目已保存',
    deleted: '项目已删除',
    deleteConfirm: '删除此项目？',
    namePrompt: '项目名称：',
    descPlaceholder: '描述你的项目…',
  },
  guided: {
    pageTitle: '引导项目',
    pageSub: '按步骤练习。相关测验超过 80% 即可解锁。',
    searchPlaceholder: '搜索引导项目…',
    searchAria: '搜索引导项目',
    empty: '没有匹配的项目。',
    diffBeginner: '初级',
    diffIntermediate: '中级',
    diffAdvanced: '高级',
    estTime: '{n} 分钟',
    start: '开始项目',
    continue: '继续',
    lockedCta: '已锁定',
    unlockHint: '测验 >{pct}%（当前 {score}%）',
    lockedToast: '需要在 {topic} 测验中取得 >{pct}%。',
    back: '← 返回',
    stepsNav: '项目步骤',
    instructions: '说明',
    workspace: '你的回答',
    workspacePlaceholder: '在此写下回答或代码…',
    workspaceCode: '代码区',
    workspaceText: '回答区',
    stepOf: '第 {n} / {total} 步：{title}',
    prev: '上一步',
    next: '下一步',
    save: '保存',
    saved: '进度已保存',
    completeStep: '标记步骤完成',
    completedStep: '步骤已完成',
    needResponse: '标记完成前请先写下回答。',
    projectDone: '项目已完成！',
    reviewing: '正在批改你的回答…',
    reviewScore: '得分：{n}/100',
    reviewAi: 'AI 反馈',
    reviewLocal: '本地反馈',
  },
  chat: {
    title: '全球聊天',
    openAria: '打开全球聊天',
    minimize: '最小化聊天',
    placeholder: '输入消息…',
    send: '发送',
    online: '在线',
    connecting: '连接中…',
    offline: '未连接',
    reconnecting: '聊天未连接',
    onlineCount: '{n} 人在线',
    empty: '还没有消息，来打个招呼吧。',
    roleStudent: '学生',
    levelBadge: '{n} 级',
    needsAccount: '登录后即可发言',
    cooldown: '请稍等片刻再发送下一条消息。',
    tooLong: '消息超过 {n} 个字符。',
    sendFail: '消息发送失败。',
    shareQuiz: '分享测验',
    quizSearch: '搜索测验…',
    quizNone: '没有匹配的测验。',
    quizEyebrow: '测验挑战',
    quizCardTitle: '来做这个关于 {topic} 的测验！',
    quizCta: '开始',
  },
  quizzes: {
    bannerTitle: '用测验检验您的知识',
    bannerSub: '评估每门课程的学习成果并获取认证。',
    generalKnowledge: '综合知识',
    pickTopic: '选择主题',
    continue: '继续',
    certExams: '认证考试',
    certReq: '要求：课时 ≥80%、测验 ≥70%、考试 ≥80%。',
    backList: '返回列表',
    next: '下一题 →',
    check: '检查',
    score: '得分',
    completed: '测验完成！',
    correct: '正确',
    incorrect: '错误',
    total: '总计',
    correctFeedback: '✓ 正确！',
    wrongFeedback: '✗ 错误。',
    typeChoice: '选择题',
    typeTrueFalse: '判断题',
    typeMatch: '配对题',
    questionGeneric: '题目',
    true: '正确',
    false: '错误',
    retry: '重试',
    backHome: '返回首页',
    review: '复习',
    examLocked: '完成课时和测验以解锁考试。',
    examLockedPrefix: '考试已锁定',
    examLockedLessons: '课时 {completed}/{total}，平均分 ≥{min}%（当前 {avg}%）',
    examLockedQuiz: '测验 ≥{min}%（您的最佳：{pct}%）',
    continueCorrect: '{correct}/{total} 正确 · {pct}%',
    continueAnswered: '已回答 {answered}/{total} · 完成 {pct}%',
    resume: '继续',
    resumeHint: '进行中 · 完成 {pct}%',
    resumeTitle: '从上次的地方继续吗？',
    resumeDesc: '你在 {title} 中已回答 {total} 题中的 {answered} 题（完成 {pct}%）。',
    resumeContinue: '继续上次进度',
    resumeRestart: '重新开始',
    studyMe: 'Study Me',
    yourAnswer: '你的答案',
    whyLabel: '为什么？',
    studyMeHint: '继续之前请阅读解析，下次你就会认出它。',
    noExplanation: '请在对应课程中复习该主题。',
    adaptiveHarder: '正在提高难度——你状态不错。',
    adaptiveReview: '针对性复习',
    adaptiveReviewBadge: '复习',
    diffEasy: '简单',
    diffMedium: '中等',
    diffHard: '困难',
    aiTutor: 'AI 导师',
    aiThinking: '正在个性化讲解…',
    examTitle: '认证考试：{title}',
    examCardAria: '{title} 认证考试',
    examPractical: '实践考试 · 及格 ≥{min}%',
    examUnlocked: '考试已解锁。您需要 ≥{min}% 以获得专业认证。',
    quizPassedUnlock: '✓ 测验已通过（≥{min}%）— 与课时一起解锁认证',
    resultNeedReview: '您需要复习此主题。',
    resultExamCert: '您以 {pct}% 通过考试。专业认证已添加到您的资料！',
    resultQuizCert: '您以 {pct}% 完成测验。练习证书已添加到您的资料！',
    resultExamFail: '专业认证需要考试至少 {min}%。您得了 {pct}%。',
    resultQuizPass: '您以 {pct}% 通过！这有助于解锁认证考试（与课时一起）。',
    resultQuizFail: '您得了 {pct}%。专业认证需要测验 ≥{min}%。',
    saveExamTitle: '考试：{title}',
    saveExamDesc: '考试通过 {pct}%（最低 {min}%）· 模块：{modules}',
    saveExamDescShort: '在 {title} 中以 {pct}% 通过实践考试',
    saveCertTitle: '证书：{title}',
    saveCertDesc: '在 {title} 测验中以 {pct}% 通过',
    sectionAllAreas: '全部领域',
    certEarnedRetry: '已获得认证。您可以重试以提高分数（考试最低 {min}%）。',
    certGoal: '认证目标：本测验 ≥{min}%',
    questionsLabel: '{n} 道题',
    presentExam: '参加考试',
    locked: '已锁定',
    noExams: '暂无可用考试。',
    certEarnedBadge: '🏆 已认证',
    andJoin: ' 和 ',
    start: '开始',
    startQuizAria: '开始 {title} 测验',
    continueQuizAria: '继续 {title} 测验',
    sectionsCount: '{n} 个部分 · {types}',
    emptyFilter: '此筛选无结果。',
    matchHint: '为每个术语选择正确的定义。',
    matchSelect: '— 请选择 —',
    matchPairAria: '{term} 的配对',
    matchCompleteAll: '检查前请完成所有配对。',
    optionAria: '选项 {letter}：{opt}',
    examLockedLessonsLine: '课时：{completed}/{total}，平均分 ≥{min}%（当前 {avg}%）',
    examLockedQuizLine: '测验：需要 ≥{min}%（您的最佳：{pct}%）',
    correctAnswer: '正确答案',
  },
  ai: {
    assistant: 'IN4MIND 助手',
    connecting: '连接中…',
    connected: '已连接 Groq AI',
    localMode: '本地模式 — 请在 Vercel 中配置 GROQ_API_KEY',
    assistantReady: '教育助手已就绪',
    generating: '生成回复中…',
    error: '请求错误',
    errNoKey: '**需要配置**\n\n要启用 Groq AI，请在 Vercel（Settings → Environment Variables）中设置 `GROQ_API_KEY` 并重新部署。\n\n- 在 https://console.groq.com/keys 获取密钥\n- 密钥仅保存在服务器，绝不会暴露给浏览器',
    errInvalidKey: '**凭据无效**\n\n配置的 API Key 被拒绝。请在 Groq 控制台验证密钥是否正确。',
    errUnavailable: '**服务暂时不可用**\n\n无法通过 Groq 完成请求。请稍后再试。',
    errGeneric: '**处理错误**\n\n生成回复时出现问题。请重新表述您的问题或检查网络连接。',
    newChat: '新对话',
    welcomeTitle: 'IN4MIND 教育助手',
    welcomeSub: '您可以用中文、西班牙语或英语提问。我会回答关于 IN4MIND、课程、测验、资料和课程目录的问题。',
    offTopic: '查询超出 IN4MIND 范围。我只能帮助 IN4MIND 平台及其课程。请询问课程、测验、资料、认证或我们目录中的主题。',
    offTopicFull: '**查询超出 IN4MIND 范围**\n\n我只能帮助与 **IN4MIND** 相关的话题：平台、课程、测验、资料、认证以及我们提供的课程。\n\n请询问 IN4MIND，例如：\n- "IN4MIND 的课程如何使用？"\n- "我可以在 IN4MIND 学习哪些课程？"\n- "解释 Python 中的变量"\n- "什么是钓鱼攻击？"\n\n我在这里支持您在 IN4MIND 内的学习。',
    emptyPrompt: '写下您关于 IN4MIND 的问题，我很乐意帮助。',
    placeholder: '仅询问 IN4MIND 或其课程…',
    send: '发送消息',
    hint: 'IN4MIND 助手可能会出错。请在课程和官方文档中核实关键信息。',
    configBanner: '请在 Vercel（Environment Variables）中配置 GROQ_API_KEY 以启用生成式 AI 回复。',
    conversations: '对话',
    roleUser: '您',
    roleAi: 'IN4MIND 助手',
    roleIa: 'AI',
    historyAria: '对话历史',
    typingAria: '生成回复中',
    sug1Label: 'IN4MIND 平台',
    sug1Hint: '课程、测验和资料',
    sug1Msg: '如何使用 IN4MIND 平台：课程、测验、仪表盘和资料？',
    sug2Label: '可用课程',
    sug2Hint: 'IN4MIND 教育目录',
    sug2Msg: '我可以在 IN4MIND 学习哪些课程？',
    sug3Label: 'Python 基础',
    sug3Hint: 'IN4MIND Python 课程',
    sug3Msg: '根据 IN4MIND 课程解释 Python 基础。',
    sug4Label: '网络安全',
    sug4Hint: '钓鱼攻击、密码和 MFA',
    sug4Msg: '什么是钓鱼攻击？根据 IN4MIND 如何保护自己？',
  },
  profile: {
    user: '用户',
    logout: '退出登录',
    logoutConfirm: '确定退出登录？',
    saved: '已保存',
    favorites: '收藏',
    quizzes: '测验',
    certifications: '认证',
    projects: '项目',
    notes: '笔记',
    items: '{n} 项',
    item: '{n} 项',
    completed: '{n} 已完成',
    completedOne: '{n} 已完成',
    obtained: '{n} 已获得',
    obtainedOne: '{n} 已获得',
    projectMany: '{n} 个项目',
    projectOne: '{n} 个项目',
    noteMany: '{n} 条笔记',
    noteOne: '{n} 条笔记',
    tabSaved: '已保存项',
    tabProgress: '进行中',
    tabFavorites: '收藏',
    tabNotes: '学习笔记摘要',
    tabProjects: '我的项目',
    tabQuizzes: '已完成测验',
    tabCerts: '认证',
    featuredProjects: '精选项目',
    viewAllProjects: '查看全部',
    highlighted: '已置顶',
    generalNotes: '通用笔记',
    goProjects: '前往我的项目',
    goNotes: '打开我的笔记',
    empty: '此处暂无内容。',
    emptySaved: '您尚未保存课程。浏览课程并点击「保存」。',
    emptyFav: '暂无收藏。在课程中用爱心标记课程。',
    emptyQuiz: '暂无已完成测验。前往测验检验您的知识。',
    emptyCert: '暂无认证。完成课时、测验和考试。',
    emptyProgress: '暂无进行中的课程。开始一个课程吧。',
    emptyNotes: '还没有学习笔记。请在「我的笔记」中创建。',
    emptyProjects: '还没有项目。请在「我的项目」中创建。',
    emptyFeatured: '还没有精选项目。请在「我的项目」中创建或置顶。',
    filterAll: '全部',
    continue: '继续',
    seeMore: '查看更多',
    open: '打开',
    delete: '删除',
    accuracy: '正确率 {pct}%',
    profCert: '专业认证',
    practiceCert: '练习证书',
    viewExam: '查看考试',
    viewQuiz: '查看测验',
    contentAria: '资料内容',
    activityAria: '活动摘要',
    viewSaved: '查看已保存',
    viewFav: '查看收藏',
    viewQuizStat: '查看测验',
    viewCert: '查看认证',
    viewProjects: '查看项目',
    viewNotes: '查看笔记',
    settingsTitle: '偏好设置',
    settingsSub: '自定义您的 IN4MIND 体验。',
    language: '界面语言',
    languageSwitch: '切换语言为 {lang}',
    languageHint: '语言将应用于整个应用：菜单、课程、测验和帮助。',
  },
  settingsModal: {
    title: '设置',
    close: '关闭',
    navAria: '设置部分',
    navGeneral: '常规',
    navAccount: '账户',
    navNotifications: '通知',
    navAppearance: '外观',
    navLanguage: '语言',
    navPrivacy: '隐私',
    generalTitle: '常规',
    generalSub: 'IN4MIND 常规偏好：语言、主题和帮助。',
    about: '关于 IN4MIND',
    aboutHint: '教育技术平台。',
    viewHelp: '查看帮助 →',
    version: '版本',
    accountTitle: '账户',
    accountSub: '您的资料和会话信息。',
    profile: '我的资料',
    profileHint: '已保存项、收藏、测验和认证。',
    openProfile: '打开 →',
    notifTitle: '通知',
    notifSub: '选择您希望接收提醒的方式。',
    emailNotif: '电子邮件通知',
    emailNotifHint: '进度摘要和认证。',
    pushNotif: '应用内通知',
    pushNotifHint: '课时和测验提醒。',
    appearanceTitle: '外观',
    appearanceSub: '自定义 IN4MIND 的视觉外观。',
    bulbTitle: 'IN4MIND 设计',
    bulbSub: '带电路的灯泡象征创意、科技与思维清晰度。',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    languageTitle: '语言',
    languageSub: '语言将应用于整个应用。',
    navAccessibility: '无障碍',
    accessibilityTitle: '无障碍',
    accessibilitySub: '阅读与动效偏好。',
    privacyTitle: '隐私',
    privacySub: '法律文档和您的账户数据。',
    privacyPolicy: '隐私政策',
    cookies: 'Cookie',
    terms: '使用条款',
    read: '阅读 →',
    editName: '姓名',
    saveName: '保存',
    nameRequired: '姓名为必填项。',
    weeklyGoals: '每周目标',
    weeklyGoalsHint: '每周课时与测验数量。',
    resetOnboard: '重新开始欢迎导览',
    onboardReset: '导览已重置。请前往仪表盘。',
  },
  cookies: {
    bannerTitle: 'Cookie',
    bannerText: '我们使用 Cookie 和本地存储来记住偏好并改善体验。',
    learnMore: '了解更多',
    accept: '接受',
    decline: '仅必要项',
  },
  privacy: {
    exportData: '导出我的数据',
    exportHint: '下载包含进度的 JSON。',
    exportBtn: '导出',
    importData: '恢复数据',
    importHint: '导入先前导出的 JSON。',
    importBtn: '导入',
    importOk: '数据已在本设备恢复。',
    importFail: '无法导入该文件。',
  },
  connectivity: {
    offline: '离线。你的更改会保存在此设备。',
    stillOffline: '仍处于离线状态。',
    synced: '已同步 {n} 项更改。',
    upToDate: '全部已同步。',
    pending: '有 {n} 项更改待同步。',
    saveLocal: '已保存在本设备。恢复网络后将同步。',
  },
  help: {
    title: '帮助中心',
    sub: '询问任何关于 IN4MIND 或技术主题的问题。助手将即时回复。',
    searchHero: '向帮助助手提问…',
    faqTitle: '常见问题',
    contact: '找不到答案？在上方提问或浏览常见问题 ›',
    filter: '筛选问题…',
    empty: '搜索无结果。',
    askAiTitle: 'AI 帮助助手',
    askAiSub: '询问 IN4MIND、课程、测验、资料或课程。您可以用中文、西班牙语或英语提问。',
    askPlaceholder: '例如：如何保存课程？什么是钓鱼攻击？',
    askBtn: '提问',
    askGenerating: '生成回复中…',
    askEmpty: '在下方输入您的问题，助手将即时回复。',
    askHint: '助手可能会出错。请在课程中核实关键信息。',
    askOpenFull: '在 AI 中打开完整聊天 →',
    askTryFaq: '您也可以搜索下方的常见问题。',
    chipSave: '如何保存课程？',
    chipSaveMsg: '如何将课程保存到我的资料？',
    chipPhishing: '什么是钓鱼攻击？',
    chipPhishingMsg: '什么是钓鱼攻击？根据 IN4MIND 如何保护自己？',
    chipCert: '专业认证',
    chipCertMsg: '如何在 IN4MIND 获得专业认证？',
  },
  a11y: {
    largeText: '大号文字',
    largeTextHint: '增大全局字体。',
    highContrast: '高对比度',
    reduceMotion: '减少动画',
    shortcuts: '键盘快捷键',
    skipToContent: '跳到主要内容',
  },
  settings: {
    language: '语言',
    languageSwitch: '切换语言为 {lang}',
  },
  theme: {
    dark: '启用深色模式',
    light: '启用浅色模式',
    darkTitle: '深色模式',
    lightTitle: '浅色模式',
  },
  courses: {
    canvas: { title: 'Canva', desc: '专业视觉设计与图形内容创作。' },
    figma: { title: 'Figma', desc: '界面设计与协作原型。' },
    python: { title: 'Python', desc: '用于自动化和数据的多用途编程。' },
    javascript: { title: 'JavaScript', desc: '现代 Web 的交互与动态效果。' },
    html: { title: 'HTML', desc: '网页的结构与语义。' },
    css: { title: 'CSS', desc: '样式、动画与响应式设计。' },
    github: { title: 'GitHub', desc: '版本控制与项目协作。' },
    excel: { title: 'Excel', desc: '使用电子表格进行数据管理与分析。' },
    powerpoint: { title: 'PowerPoint', desc: '高影响力的企业视觉演示。' },
    sql: { title: 'SQL', desc: '查询与关系型数据库管理。' },
    cybersecurity: { title: '网络安全', desc: '保护系统、数据和用户免受数字威胁。' },
    flowchart: { title: '流程图', desc: '用标准符号建模流程与决策路径。' },
    os: { title: '操作系统', desc: '掌握文件、权限、网络与系统效率。' },
    powerapps: { title: 'Power Apps', desc: '基于 Microsoft 365 的低代码企业应用。' },
    sharepoint: { title: 'SharePoint', desc: '团队文档协作与内网门户。' },
    outlook: { title: 'Outlook', desc: '专业邮件、日历与任务管理。' },
    onedrive: { title: 'OneDrive', desc: '云端存储、同步与共享文件。' },
    scrum: { title: 'Scrum', desc: '敏捷框架：冲刺与持续改进。' },
    scratch: { title: 'Scratch', desc: '积木式可视化编程学习逻辑。' },
    'video-editing': { title: '视频剪辑', desc: '为网页与社交媒体剪辑导出视频。' },
    django: { title: 'Django', desc: '使用 Python 与 MVT 模式进行 Web 开发。' },
    powerbi: { title: 'Power BI', desc: '交互式商业仪表盘与报表。' },
    'prompt-engineering': { title: '提示词工程', desc: '为生成式 AI 编写高效提示词。' },
    engineering: { title: '软件工程', desc: '需求、架构、测试与交付。' },
    'game-editing': { title: '游戏编辑', desc: '使用引擎、资源与构建创建和编辑游戏。' },
  },
  recent: {
    r1: { title: 'Python 基础', subtitle: '基础', time: '2 分钟前浏览' },
    r2: { title: 'Canva 入门', subtitle: '基本使用', time: '15 分钟前' },
    r3: { title: 'Excel 原理', subtitle: '核心函数', time: '1 小时前' },
    r4: { title: 'JS 逻辑', subtitle: '入门', time: '昨天' },
    r5: { title: 'HTML 标签', subtitle: 'Web 结构', time: '昨天' },
    r6: { title: 'Git 基础', subtitle: '版本控制', time: '2 天前' },
    r7: { title: 'Figma UI', subtitle: '原型', time: '3 天前' },
    r8: { title: 'SQL 查询', subtitle: 'SELECT 与 JOIN', time: '1 周前' },
    r9: { title: '网络安全基础', subtitle: '钓鱼攻击与密码', time: '4 天前' },
  },
  visit: {
    recent: '最近',
    moment: '刚刚浏览',
    mins: '{n} 分钟前访问',
    hours: '{n} 小时前访问',
    days: '{n} 天前访问',
    yesterday: '昨天',
    months: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
  },
  faq: {
    q1: '什么是 IN4MIND？',
    a1: 'IN4MIND 是一个教育平台，以清晰、现代、易懂的方式学习技术。它包括分步课程、模块测验、认证考试、AI 助手，以及可保存收藏和进度的个人资料。目录涵盖设计（Canva、Figma）、编程（Python、JavaScript、Django）、Web（HTML、CSS）、工具（GitHub、流程图、Scrum、提示工程）、办公（Excel、PowerPoint、Power Apps、SharePoint、Outlook、OneDrive）、数据（SQL、Power BI）、编辑（视频、游戏编辑）和网络安全。',
    q2: '如何创建账户？',
    a2: '通过「登录」或「注册」进入登录页。您需要有效的电子邮件和至少 6 个字符的密码。注册后，您可访问包含课程、测验、AI 和个人资料的仪表盘。',
    q3: 'IN4MIND 免费吗？',
    a3: '是的。IN4MIND 是免费学习平台。您可以浏览课程、参加测验、使用 AI 助手并获取练习认证，无需支付订阅或应用内费用。',
    q4: '如何保存课程或指南？',
    a4: '在课程中打开任意课程，在详情页使用「保存」添加到资料的已保存项，或使用「收藏」用爱心标记。两个列表均显示在资料 → 已保存项 / 收藏。',
    q5: '可以在手机上访问 IN4MIND 吗？',
    a5: '可以。界面响应式，适用于手机、平板和桌面浏览器。小屏幕上侧边栏会自适应，您可在任何设备上学习课时、测验和查看资料。',
    q6: '如何跟踪学习进度？',
    a6: '学习课时时，您会回答快速检测以记录百分比。测验和考试会保存您的最佳分数。资料中可查看已保存、收藏、已完成测验和认证。专业认证需要：课时 ≥80%、测验 ≥70%、期末考试 ≥80%。',
    q7: '接受哪些支付方式？',
    a7: '平台内无。IN4MIND 不收取教育内容访问费用。没有付费计划、账单或与学习账户关联的支付方式。',
    q8: '如何联系支持？',
    a8: '有关平台或课程的问题，请使用本帮助中心的 **AI 助手**（在上方输入问题），或从「AI」菜单打开完整聊天。',
  },
  landing: {
    navHome: '首页',
    navTopics: '主题',
    navImpact: '影响',
    navTestimonials: '用户评价',
    navAbout: '关于',
    navCommunity: '社区',
    navGuides: '指南',
    navContact: '联系',
    start: '开始使用',
    heroTag: '随时掌握易懂的技术',
    heroTitle: '清晰、现代地学习技术',
    heroSub: '课程、测验、认证和 AI 助手，尽在一个平台。',
    explore: '探索主题',
    intro: '观看介绍',
    introTitle: '欢迎来到 IN4MIND',
    introBody: '课程、测验、认证和教育 AI，尽在一个易用的平台。',
    backTop: '返回顶部',
    featuresTitle: '提升技术技能所需的一切',
    coursesCarouselTitle: 'IN4MIND 工具与应用',
    coursesCarouselSub: '探索完整目录中的课程、测验与认证。',
    themeShowcaseTitle: '浅色与深色，同一套 IN4MIND',
    themeShowcaseSub: '随时切换主题：界面与目录在两种模式下都保持清晰。',
    themeShowcaseAlt: 'IN4MIND 视觉目录在浅色与深色模式下的对比',
    themeShowcaseCta: '试用浅色 / 深色模式',
    navTheme: '主题',
    courseSlideDot: '应用 {n}',
    navCatalog: '目录',
    featureProgramming: '编程',
    featureProgrammingDesc: '学习 Python、JavaScript 等语言。',
    featureSecurity: '网络安全',
    featureSecurityDesc: '用必备安全技能保护您的数据。',
    featureAi: 'AI 与数据科学',
    featureAiDesc: '掌握 AI 概念和数据分析技术。',
    featureWeb: 'Web 开发',
    featureWebDesc: '构建响应式、成功的网站。',
    floatSecurity: '安全',
    floatWebDev: 'Web 开发',
    floatData: '数据',
    statsTutorials: '技术课程',
    statsUsers: '活跃用户',
    statsCourses: '可用课程',
    testimonialsTitle: '用户评价',
    testimonialDot: '评价 {n}',
    aboutTitle: '关于 IN4MIND',
    aboutLead: '我们是一个以技术为重点的教育平台，旨在帮助您清晰、实用、按自己的节奏学习。',
    aboutMission: '我们的使命',
    aboutMissionDesc: '以优质教育和实用技能赋能全球学习者。',
    aboutEveryone: '面向所有人',
    aboutEveryoneDesc: '从迈出第一步的初学者到推进职业生涯的专业人士。',
    aboutEvolving: '持续进化',
    aboutEvolvingDesc: '我们不断更新内容，让您在技术世界中保持领先。',
    aboutPassion: '用心打造',
    aboutPassionDesc: '由热爱教学、技术和帮助他人成长的团队创建。',
    popularTitle: '热门主题',
    popularWebDev: 'Web 开发',
    popularDataSci: '数据科学',
    loveTitle: '用户最看重的',
    loveClear: '清晰且结构化',
    loveClearDesc: '易于跟随的内容，让学习简单且愉快。',
    lovePractice: '真实实践',
    lovePracticeDesc: '真实案例、挑战和测验来检验您的技能。',
    loveProgress: '进度跟踪',
    loveProgressDesc: '监控进度，庆祝学习路上的每一个里程碑。',
    loveSave: '保存与整理',
    loveSaveDesc: '保存喜爱的内容，随时随地访问。',
    guidesTitle: '指南预览',
    guidesLead: '分步指南，掌握新技能并构建真实项目。',
    levelBeginner: '初级',
    levelIntermediate: '中级',
    levelAdvanced: '高级',
    guidePyTitle: 'Python 入门',
    guidePyIntro: '<strong>简介：</strong>Python 是编程、数据和自动化领域需求最高的语言之一。本指南带您从零开始，无需任何经验即可编写清晰、可复用的脚本。',
    guidePyDesc: '您将学习语法、控制流、函数、数据结构和文件处理，每个模块都有实践示例。',
    guideJsTitle: '现代 JavaScript',
    guideJsIntro: '<strong>简介：</strong>JavaScript 驱动交互式 Web 体验——从按钮和表单到调用 API 的应用。如果您了解基础 HTML，将学习用现代代码和最佳实践让页面活起来。',
    guideJsDesc: '您将分步学习变量、函数、DOM、事件、async/await 和外部服务集成。',
    guideCyberTitle: '网络安全基础',
    guideCyberIntro: '<strong>简介：</strong>在互联的数字世界中，保护数据、账户和系统至关重要。本指南解释攻击者如何思考，以及从第一天起应应用哪些控制措施。',
    guideCyberDesc: '您将学习钓鱼攻击、密码与 MFA、恶意软件、事件响应和安全习惯，配合真实场景。',
    chapters: '{n} 章',
    duration: '{time}',
    guidePyChapters: '12 章',
    guidePyDuration: '4 小时 30 分',
    guideJsChapters: '18 章',
    guideJsDuration: '6 小时 15 分',
    guideCyberChapters: '15 章',
    guideCyberDuration: '5 小时 45 分',
    introLabel: '简介：',
    metricUsers: '注册用户',
    metricArticles: '课程与文章',
    metricHours: '学习时长',
    metricSatisfaction: '学员满意度',
    metricsAria: '平台指标',
    ctaTitle: '准备好提升您的技术知识了吗？',
    ctaSub: '立即加入 IN4MIND，开启技术精通之路。',
    footerCopy: '© 2026 IN4MIND. 保留所有权利。',
    footerResources: '资源',
    footerSupport: '支持',
    footerConnected: '保持联系',
    footerTerms: '服务条款',
    search: '搜索',
    carousel: '轮播',
    floatAi: 'AI',
    floatQuizzes: '测验',
    floatCyberTitle: '网络安全',
    floatWebTitle: 'Web 开发',
    floatAiTitle: '人工智能',
    floatQuizTitle: '互动测验',
    floatDataTitle: '数据科学',
    floatPyTitle: 'Python',
    floatTipPy: '从零学习 Python：语法、自动化、数据处理与脚本，配合分步课时。',
    floatTipSecurity: '保护账户与数据：钓鱼识别、密码、MFA 与数字安全习惯。',
    floatTipWebDev: '用 HTML、CSS、JavaScript 构建网站：结构、样式与交互。',
    floatTipAi: '内置智能助手，即时解答 IN4MIND 与课程相关问题。',
    floatTipQuizzes: '用互动题检验所学，并可获得认证。',
    floatTipData: '用 Excel、SQL 与实用数据分析技巧处理信息。',
    testimonials: [
      { quote: '「IN4MIND 彻底改变了学习新技术的方式。课程清晰、简洁、实用。」', name: 'Sarah Martinez', role: 'Web 开发者' },
      { quote: '「测验帮助我验证了 Python、SQL 和 Web 开发方面的知识。强烈推荐给团队。」', name: 'Carlos Mendoza', role: '软件工程师' },
      { quote: '「界面简洁、内容专业，AI 助手在学习时准确回答我需要的问题。」', name: 'Ana Rodríguez', role: 'UX 设计师' },
      { quote: '「IN4MIND 结构清晰、氛围平静、专注于真实学习成果。」', name: 'James Chen', role: '数据分析师' },
    ],
    newsletterPh: '输入您的电子邮件',
    newsletterBtn: '订阅',
    newsletterThanks: '感谢订阅！我们将及时通知您。',
  },
  legal: {
    back: '返回首页',
    termsTitle: '使用条款',
    privacyTitle: '隐私政策',
    cookiesTitle: 'Cookie 政策',
    lastUpdated: '最后更新：2026 年 5 月 29 日',
    footerCopy: '© 2026 IN4MIND. 保留所有权利。',
    navTerms: '使用条款',
    navPrivacy: '隐私',
    navCookies: 'Cookie',
    navAria: '法律文档',
    bodies: {},
  },
  quizDesc: '与 {m} 个课程模块对齐的 {n} 道题评估。',
};


;/* --- src/js/locales/curriculum-en.js --- */
'use strict';

const LEVELS_EN = {
  Principiante: 'Beginner',
  Intermedio: 'Intermediate',
  Avanzado: 'Advanced',
};

const CURRICULUM_EN = {
  canvas: {
    title: 'Canva',
    requirements: ['Active Canva account', 'Stable internet connection', 'Basic visual design knowledge'],
    certModules: ['Canva fundamentals', 'Brand design', 'Professional export', 'Collaboration and review'],
    docs: { label: 'Canva Help Center' },
    lessons: {
      'canvas-l1': {
        title: 'Canva fundamentals',
        section: 'Module 1',
        description: 'What is Canva and what is it for? This lesson explains its purpose as a visual design platform for creating professional pieces without starting from scratch.',
        requirements: ['Active Canva account', 'Stable internet connection'],
        steps: ['Create an account and access the main dashboard', 'Open a new design with a predefined format', 'Identify the sidebar, canvas, and top menu', 'Add text, image, and a basic shape', 'Save and export a first version'],
        tip: 'Define your goal and audience before choosing a template to avoid rework.',
        resources: { docs: 'Official Canva getting started guide' },
      },
      'canvas-l2': {
        title: 'Templates and visual consistency',
        section: 'Module 2',
        description: 'What are templates and what are they for? You will learn to adapt them strategically without losing visual identity or message clarity.',
        requirements: ['Active Canva account', 'Stable internet connection'],
        steps: ['Select a template aligned with the goal', 'Change brand fonts and colors', 'Adjust visual hierarchy of titles and subtitles', 'Replace images with your own content', 'Duplicate the design to create campaign variations'],
        tip: 'Modify structure first, then details, to maintain consistency.',
        resources: { docs: 'Using templates in Canva' },
      },
      'canvas-l3': {
        title: 'Composition and readability',
        section: 'Module 3',
        description: 'What is composition and what is it for? This session teaches you to distribute elements to guide attention and improve comprehension.',
        requirements: ['Basic Canva knowledge', 'Initial visual judgment'],
        steps: ['Apply the rule of thirds to distribute elements', 'Use color contrast to highlight actions', 'Align objects with smart guides', 'Control white space intentionally', 'Review readability on mobile and desktop'],
        tip: 'If everything stands out, nothing stands out: prioritize one visual focus per piece.',
        resources: { docs: 'Design principles in Canva' },
      },
      'canvas-l4': {
        title: 'Export by channel',
        section: 'Module 4',
        description: 'What is exporting correctly and what is it for? You will see how to choose the format by destination to preserve quality and performance.',
        requirements: ['Basic Canva knowledge', 'Defined publishing goal'],
        steps: ['Define final channel: print, web, or presentation', 'Choose PNG, JPG, PDF, or MP4 format as appropriate', 'Configure quality and transparency if applicable', 'Check file size before publishing', 'Test the result on the target device'],
        tip: 'Avoid sending JPG for print; use high-quality PDF.',
        resources: { docs: 'Download and export designs' },
      },
      'canvas-l5': {
        title: 'Collaborative team workflow',
        section: 'Module 5',
        description: 'What is collaborating in Canva and what is it for? You will learn review practices, comments, and visual version control.',
        requirements: ['Intermediate Canva knowledge', 'Defined team workflow'],
        steps: ['Share design with appropriate permissions', 'Use comments for contextual feedback', 'Create versions with clear naming', 'Consolidate changes approved by the owner', 'Publish final version and archive iterations'],
        tip: 'Set a change cutoff date to avoid endless iterations.',
        resources: { docs: 'Collaboration in Canva' },
      },
    },
    quizSections: [
      {
        title: 'Canva fundamentals',
        questions: [
          { type: 'choice', text: 'In a professional workflow, what is the main reason to use Canva in early phases?', options: ['Automate servers', 'Prototype visual pieces quickly and consistently', 'Manage databases', 'Compile frontend code'], ans: 1, explanation: 'Canva accelerates visual validation without high technical barriers.' },
          { type: 'truefalse', text: 'Canva allows working in the browser and keeping collaborative assets centralized.', ans: true, explanation: 'Its cloud model facilitates access and shared editing.', textFalse: 'Canva requires installing a desktop suite, and each person keeps brand assets on their own machine.', explanationFalse: 'Canva is a cloud tool: you work from the browser and brand assets stay centralized for the whole team.'  },
          { type: 'match', text: 'Match function and purpose in Canva:', pairs: [{ left: 'Template', right: 'Editable base to speed up production' }, { left: 'Elements', right: 'Reusable graphic resources' }, { left: 'Export', right: 'Generate final file by channel' }, { left: 'Comments', right: 'Contextual team review' }], explanation: 'Each block covers part of the design workflow.' },
        ],
      },
      {
        title: 'Templates and visual consistency',
        questions: [
          { type: 'choice', text: 'If a brand requires consistency across 12 pieces, which practice reduces the most errors?', options: ['Design each piece from scratch', 'Use a base template with consistent styles', 'Change typography in every post', 'Export without review'], ans: 1, explanation: 'A common base ensures identity consistency.' },
          { type: 'truefalse', text: 'Editing a template without reviewing typographic hierarchy usually degrades message clarity.', ans: true, explanation: 'Visual hierarchy defines reading and comprehension.', textFalse: 'As long as the text fits the template, typographic hierarchy does not affect message clarity.', explanationFalse: 'Typographic hierarchy sets the reading order; if it is not reviewed when editing, the message loses clarity even when the text fits.'  },
          { type: 'match', text: 'Match decision and expected result:', pairs: [{ left: 'Fixed palette', right: 'Recognizable visual identity' }, { left: 'Primary typography', right: 'Consistent reading' }, { left: 'Margin system', right: 'Stable visual order' }, { left: 'Duplicate version', right: 'Variants without breaking the base' }], explanation: 'Standardizing components avoids inconsistencies.' },
        ],
      },
      {
        title: 'Composition and readability',
        questions: [
          { type: 'choice', text: 'In a piece with a call to action, which decision increases conversion?', options: ['Use five high-contrast colors', 'Highlight a single visual focus and negative space', 'Reduce CTA size to minimum', 'Remove text hierarchy'], ans: 1, explanation: 'A clear focus reduces cognitive load.' },
          { type: 'truefalse', text: 'Readability should be validated on the final device before publishing.', ans: true, explanation: 'Reading scale changes between mobile and desktop.', textFalse: 'It is enough for the design to read well on the designer own monitor to consider it approved.', explanationFalse: 'Reading scale changes between mobile and desktop: validate on the device where it will actually be published.'  },
          { type: 'match', text: 'Match principle and benefit:', pairs: [{ left: 'Contrast', right: 'Prioritize key information' }, { left: 'Alignment', right: 'Reduce visual noise' }, { left: 'White space', right: 'Improve comprehension' }, { left: 'Hierarchy', right: 'Define reading order' }], explanation: 'These are fundamentals for functional design.' },
        ],
      },
      {
        title: 'Export by channel',
        questions: [
          { type: 'choice', text: 'For high-quality printing, which format is most appropriate in Canva?', options: ['GIF', 'PDF for print', 'TXT', 'Extremely compressed WEBP'], ans: 1, explanation: 'PDF maintains detail and print shop compatibility.' },
          { type: 'truefalse', text: 'The ideal format depends on the distribution channel and the final use of the file.', ans: true, explanation: 'There is no single optimal format for everything.', textFalse: 'There is a single optimal export format that works equally for print, web, and social media.', explanationFalse: 'There is no universal format: PDF for print, PNG or JPG for web, MP4 for video, depending on the channel and final use.'  },
          { type: 'match', text: 'Match format and use case:', pairs: [{ left: 'PNG', right: 'Digital image with good sharpness' }, { left: 'JPG', right: 'Lightweight file for web photography' }, { left: 'PDF', right: 'Document for print or formal delivery' }, { left: 'MP4', right: 'Animated visual content' }], explanation: 'The decision impacts quality and performance.' },
        ],
      },
      {
        title: 'Collaborative team workflow',
        questions: [
          { type: 'choice', text: 'In distributed teams, which practice improves review traceability?', options: ['Send screenshots via chat without context', 'Use design comments and labeled versions', 'Allow editing without roles', 'Skip final approval'], ans: 1, explanation: 'Contextual feedback reduces ambiguity.' },
          { type: 'truefalse', text: 'Defining a final approver avoids blocks from vague decisions.', ans: true, explanation: 'Explicit responsibility speeds up closure.', textFalse: 'Leaving final approval open to the whole team speeds up project closure.', explanationFalse: 'Without an explicit owner, decisions dissolve and the project stalls in endless review rounds.'  },
          { type: 'match', text: 'Match role and responsibility:', pairs: [{ left: 'Editor', right: 'Implements design changes' }, { left: 'Reviewer', right: 'Evaluates quality and consistency' }, { left: 'Stakeholder', right: 'Validates business objective' }, { left: 'Final approver', right: 'Authorizes publication' }], explanation: 'Clear roles avoid rework.' },
        ],
      },
    ],
    examSections: [
      {
        title: 'Visual campaign practical case',
        questions: [
          { type: 'choice', text: 'You must deliver a multi-format campaign in 2 hours. Which strategy is more robust?', options: ['Create each format manually without structure', 'Define master template, brand styles, and duplicate variants', 'Design only one piece and stretch dimensions', 'Export everything in a single format'], ans: 1, explanation: 'Standardizing first optimizes speed and quality.' },
          { type: 'truefalse', text: 'A final review on a real device before publishing reduces reading and cropping errors.', ans: true, explanation: 'Contextual validation is part of quality control.', textFalse: 'The editor preview is enough to rule out cropping errors before publishing.', explanationFalse: 'The preview does not reproduce real crops or scales; reviewing on the final device is what prevents those errors.'  },
          { type: 'match', text: 'Match problem and professional fix:', pairs: [{ left: 'Illegible text', right: 'Increase contrast and size' }, { left: 'Saturated composition', right: 'Apply negative space' }, { left: 'Inconsistent brand', right: 'Reuse defined styles' }, { left: 'Heavy file', right: 'Optimize export by channel' }], explanation: 'Fixing common issues requires technical and visual criteria.' },
        ],
      },
      {
        title: 'Governance and final delivery',
        questions: [
          { type: 'choice', text: 'If two designers edited in parallel and there is a conflict of decisions, which workflow minimizes rework?', options: ['Publish the most recent version without review', 'Compare comments, consolidate into base version, and formally approve', 'Discard both designers\' work', 'Request indefinite changes'], ans: 1, explanation: 'Guided consolidation by criteria avoids quality loss.' },
          { type: 'truefalse', text: 'Without a version naming policy, it is hard to audit which file was approved.', ans: true, explanation: 'Document traceability is key in design operations.', textFalse: 'As long as the file sits in the shared folder, no naming convention is needed to know which one was approved.', explanationFalse: 'Without a versioning convention nobody can tell the approved file from a draft; traceability depends on naming.'  },
          { type: 'match', text: 'Match evidence and quality audit:', pairs: [{ left: 'Comment history', right: 'Justifies decisions made' }, { left: 'Labeled final version', right: 'Single publication reference' }, { left: 'Export checklist', right: 'Avoids incorrect formats' }, { left: 'Recorded approval', right: 'Closes operational cycle' }], explanation: 'Final quality also depends on the delivery process.' },
        ],
      },
    ],
  },
  figma: {
    title: 'Figma',
    requirements: ['Figma account', 'Internet connection', 'Basic interface knowledge'],
    certModules: ['Figma fundamentals', 'Components and variants', 'UX prototyping', 'Development handoff'],
    docs: { label: 'Figma Help Center' },
    lessons: {
      'figma-l1': {
        title: 'What is Figma and how to get started?',
        section: 'Module 1',
        description: 'What is Figma and what is it for? You will learn its collaborative approach to designing interfaces and prototypes in real time.',
        requirements: ['Figma account', 'Internet connection'],
        steps: ['Create a Figma account and verify email', 'Start a new project from Drafts', 'Recognize layers panel, properties, and canvas', 'Explore basic frame, text, and shape tools', 'Save file and export an initial screen'],
        tip: 'Name every layer from the start to avoid chaos in large projects.',
        resources: { docs: 'Getting started with Figma' },
      },
      'figma-l2': {
        title: 'Frames, grids, and constraints',
        section: 'Module 2',
        description: 'What are frames and what are they for? You will learn to structure scalable screens with grids and responsive constraints.',
        requirements: ['Figma account', 'Basic interface knowledge'],
        steps: ['Create frame for desktop and mobile', 'Apply column layout grid', 'Configure constraints on key elements', 'Align components with spacing rules', 'Validate rescaling when changing frame size'],
        tip: 'Design structure first; then visual detail.',
        resources: { docs: 'Frames and grids in Figma' },
      },
      'figma-l3': {
        title: 'Components and variants',
        section: 'Module 3',
        description: 'What are components and what are they for? This lesson covers reuse, scalability, and consistency in UI systems.',
        requirements: ['Basic frame knowledge', 'Consistent layer naming'],
        steps: ['Convert base button into main component', 'Create variants by state and size', 'Apply instances across multiple screens', 'Update master component and observe propagation', 'Document properties for the team'],
        tip: 'Avoid overly rigid components; think about scalability.',
        resources: { docs: 'Components in Figma' },
      },
      'figma-l4': {
        title: 'Prototyping and UX validation',
        section: 'Module 4',
        description: 'What is prototyping and what is it for? You will learn to simulate flows and validate decisions before development.',
        requirements: ['Basic components defined', 'Screen flow outlined'],
        steps: ['Connect screens with interactions', 'Define transitions and overlays', 'Create main user route', 'Test prototype with colleagues', 'Record prioritized UX adjustments'],
        tip: 'Prototype the critical business flow first.',
        resources: { docs: 'Prototypes in Figma' },
      },
      'figma-l5': {
        title: 'Dev Mode and handoff',
        section: 'Module 5',
        description: 'What is handoff and what is it for? You will see how to deliver clear specifications to development with less friction.',
        requirements: ['Functional prototype', 'Organized components and styles'],
        steps: ['Open Dev Mode and review measurements', 'Share color and typography tokens', 'Export assets with consistent names', 'Annotate key interaction rules', 'Validate delivery with technical team'],
        tip: 'A good technical handoff starts with well-named layers and components.',
        resources: { docs: 'Dev Mode in Figma' },
      },
    },
    quizSections: [
      { title: 'What is Figma and how to get started?', questions: [{ type: 'choice', text: 'What strategic advantage differentiates Figma from traditional local workflows?', options: ['Automatically compiles backend', 'Simultaneous collaboration on a single file', 'Runs SQL queries', 'Native Git code versioning'], ans: 1, explanation: 'Figma optimizes multidisciplinary real-time collaboration.' }, { type: 'truefalse', text: 'Figma works in the browser and allows collaborative work without installing heavy suites.', ans: true, explanation: 'Its cloud approach reduces entry barriers.', textFalse: 'Figma requires installing a desktop suite and lets only one person edit a file at a time.', explanationFalse: 'Figma runs in the browser and several people can edit the same file simultaneously.'  }, { type: 'match', text: 'Match area and function in Figma:', pairs: [{ left: 'Layers', right: 'Design structure' }, { left: 'Canvas', right: 'Main work area' }, { left: 'Properties', right: 'Selected element configuration' }, { left: 'Assets', right: 'Access to reusable components' }], explanation: 'Mastering the interface speeds up design and review.' }] },
      { title: 'Frames, grids, and constraints', questions: [{ type: 'choice', text: 'Which combination improves responsive behavior when resizing screens?', options: ['Frames + well-defined constraints', 'Only loose layers without structure', 'Fixed exported image', 'Text converted to outlines'], ans: 0, explanation: 'Frames and constraints control layout adaptation.' }, { type: 'truefalse', text: 'A layout grid helps maintain consistent alignment in complex interfaces.', ans: true, explanation: 'The grid provides order and scalability.', textFalse: 'Layout grids are purely decorative and do not influence content alignment.', explanationFalse: 'The layout grid defines columns and margins that keep alignment consistent across the whole interface.'  }, { type: 'match', text: 'Match technique and result:', pairs: [{ left: '12-column grid', right: 'Stable alignment system' }, { left: 'Left/right constraints', right: 'Element maintains relative edges' }, { left: 'Mobile frame', right: 'Small-screen experience validation' }, { left: 'Spacing tokens', right: 'Consistency across components' }], explanation: 'These are foundational systematic design practices.' }] },
      { title: 'Components and variants', questions: [{ type: 'choice', text: 'If a button changes across 40 screens, what reduces maintenance?', options: ['Edit each instance manually', 'Update main component with variants', 'Rasterize buttons', 'Hide previous layers'], ans: 1, explanation: 'The master component propagates changes in a controlled way.' }, { type: 'truefalse', text: 'Variants allow modeling states like hover, active, and disabled within the same component.', ans: true, explanation: 'They facilitate consistency and clear handoff.', textFalse: 'Each state (hover, active, disabled) requires a separate, unrelated component.', explanationFalse: 'Variants group the states inside a single component, avoiding one duplicate per state.'  }, { type: 'match', text: 'Match concept and goal:', pairs: [{ left: 'Main component', right: 'Visual source of truth' }, { left: 'Instance', right: 'Reusable use on screen' }, { left: 'Variant set', right: 'Group related states' }, { left: 'Property', right: 'Control configurable behavior' }], explanation: 'Structuring components reduces design debt.' }] },
      { title: 'Prototyping and UX validation', questions: [{ type: 'choice', text: 'What does a navigable prototype provide before developing?', options: ['Eliminates need for QA', 'Validates flow and detects usage friction early', 'Replaces business requirements', 'Generates final database'], ans: 1, explanation: 'It allows learning before costly building.' }, { type: 'truefalse', text: 'Prototyping error scenarios is as important as the ideal flow.', ans: true, explanation: 'Real experience includes failures and recovery.', textFalse: 'The prototype should only cover the happy path; errors are handled during development.', explanationFalse: 'If the prototype ignores errors, the team underestimates complexity and the user is left with no response when things fail.'  }, { type: 'match', text: 'Match interaction and UX use:', pairs: [{ left: 'On click', right: 'Explicit user action' }, { left: 'Overlay', right: 'Modal without leaving context' }, { left: 'Smart animate', right: 'Smooth transition between states' }, { left: 'Flow start point', right: 'Define test route' }], explanation: 'These options simulate product experience.' }] },
      { title: 'Dev Mode and handoff', questions: [{ type: 'choice', text: 'In handoff, what information reduces developer questions?', options: ['PNG screenshot only', 'Measurements, styles, tokens, and documented interactions', 'Generic comment without context', 'File without structure'], ans: 1, explanation: 'Effective handoff needs traceable specifications.' }, { type: 'truefalse', text: 'Naming layers semantically improves communication between design and development.', ans: true, explanation: 'Shared language avoids implementation errors.', textFalse: 'Default layer names (Rectangle 27, Group 5) are good enough for handoff to development.', explanationFalse: 'Generic names force others to guess the intent; semantic naming is what makes the file readable.'  }, { type: 'match', text: 'Match artifact and delivery value:', pairs: [{ left: 'Color token', right: 'Visual consistency in code' }, { left: 'Exported asset', right: 'Graphic resource implementation' }, { left: 'Spacing spec', right: 'Layout precision' }, { left: 'Interaction note', right: 'Expected UI behavior' }], explanation: 'Robust handoff turns design into reliable implementation.' }] },
    ],
    examSections: [
      { title: 'Product flow design', questions: [{ type: 'choice', text: 'You must redesign mobile onboarding with multiple states. Which approach ensures scalability?', options: ['Loose screens without components', 'Component system, variants, and tokens from the start', 'Free design per designer', 'Prototype without layer structure'], ans: 1, explanation: 'Systems prevent inconsistency and rework.' }, { type: 'truefalse', text: 'If the prototype does not consider validation errors, the team underestimates implementation complexity.', ans: true, explanation: 'Edge cases impact product time and quality.', textFalse: 'Omitting validation from the prototype does not change the development team effort estimate.', explanationFalse: 'Validation states are part of the real work: if they are missing from the prototype, the estimate falls short.'  }, { type: 'match', text: 'Match decision and delivery effect:', pairs: [{ left: 'Correct Auto Layout', right: 'Flexible behavior when content changes' }, { left: 'Documented Dev Mode', right: 'Fewer development questions' }, { left: 'Variant properties', right: 'Controlled states in design' }, { left: 'Business comments', right: 'Context for technical decisions' }], explanation: 'Design and development must share a single product narrative.' }] },
      { title: 'Handoff and technical quality', questions: [{ type: 'choice', text: 'When design and code diverge, which action corrects fastest?', options: ['Ignore visual differences', 'Review Figma specs and align tokens with implementation', 'Change only colors manually', 'Remove shared components'], ans: 1, explanation: 'Alignment via tokens and specs minimizes visual drift.' }, { type: 'truefalse', text: 'A Figma file without naming conventions makes audit and maintenance difficult.', ans: true, explanation: 'File governance is part of technical quality.', textFalse: 'A Figma file stays just as auditable even without any naming convention.', explanationFalse: 'Without a convention, finding and updating components becomes slow and error-prone.'  }, { type: 'match', text: 'Match problem and mitigation:', pairs: [{ left: 'Inconsistent assets', right: 'Normalized export by naming' }, { left: 'Ambiguous spacing', right: 'Define tokenized spacing scale' }, { left: 'Missing states', right: 'Complete component variants' }, { left: 'Interaction questions', right: 'Annotate behavior in prototype' }], explanation: 'Preventive handoff reduces UI debt.' }] },
    ],
  },
  python: {
    title: 'Python',
    requirements: ['Python 3 installed', 'Code editor (VS Code recommended)', 'Basic terminal'],
    certModules: ['Syntax and types', 'Control flow', 'Functions and modules', 'Structures and files'],
    docs: { label: 'Official Python documentation' },
    lessons: {
      'python-l1': { title: 'Syntax, types, and variables', section: 'Module 1', description: 'What is Python and what is it for? This lesson establishes its clear syntax, data types, and foundations for programming with order.', requirements: ['Python 3 installed', 'Basic terminal'], steps: ['Run first script in console', 'Create variables with descriptive names', 'Differentiate int, float, str, and bool', 'Convert types safely', 'Display results with f-strings'], tip: 'Name variables by business intent, not technical shortcuts.', resources: { docs: 'Official Python tutorial' } },
      'python-l2': { title: 'Conditionals and loops', section: 'Module 2', description: 'What is controlling flow and what is it for? You will learn to make decisions and repeat tasks without duplicating code.', requirements: ['Python 3 installed', 'Variable concepts'], steps: ['Write if/elif/else with real cases', 'Iterate lists with for', 'Use while with exit condition', 'Apply break and continue with criteria', 'Solve logic challenge with validations'], tip: 'Avoid deeply nested conditions; simplify with small functions.', resources: { docs: 'Control flow in Python' } },
      'python-l3': { title: 'Functions and modularity', section: 'Module 3', description: 'What are functions and what are they for? You will see how to encapsulate logic to reuse, test, and maintain code with lower risk.', requirements: ['Basic control flow', 'Code editor'], steps: ['Define functions with parameters', 'Return values instead of always printing', 'Add docstrings and simple types', 'Separate utilities into modules', 'Import and reuse code across files'], tip: 'If a function does too many things, split it by responsibility.', resources: { docs: 'Defining functions' } },
      'python-l4': { title: 'Lists, dictionaries, and sets', section: 'Module 4', description: 'What are data structures and what are they for? You will learn to choose the most suitable one for each real problem.', requirements: ['Basic functions', 'Loop handling'], steps: ['Create and transform lists with comprehensions', 'Access dictionaries safely', 'Remove duplicates with sets', 'Sort collections by criteria', 'Model a small data catalog'], tip: 'Choosing the right structure can simplify more than optimizing later.', resources: { docs: 'Data structures in Python' } },
      'python-l5': { title: 'Files, errors, and best practices', section: 'Module 5', description: 'What is managing files and errors and what is it for? This lesson covers operational robustness and quality in productive scripts.', requirements: ['Intermediate Python knowledge', 'Practice with data structures'], steps: ['Read and write files with context manager', 'Catch specific exceptions', 'Log useful errors for debugging', 'Validate inputs before processing', 'Apply PEP 8 style in final script'], tip: 'Handle expected errors; do not hide critical exceptions.', resources: { docs: 'Errors and exceptions' } },
    },
    quizSections: [
      { title: 'Syntax, types, and variables', questions: [{ type: 'choice', text: 'In a data script, what advantage does Python\'s dynamic typing provide when used with explicit validation?', options: ['Avoids any runtime error', 'Speeds iteration while maintaining controlled flexibility', 'Replaces unit tests', 'Eliminates need for documentation'], ans: 1, explanation: 'Flexibility is useful if validated consciously.' }, { type: 'truefalse', text: 'f-strings improve readability over complex concatenations.', ans: true, explanation: 'They facilitate clear formatting and maintenance.', textFalse: 'Concatenating with the + operator is more readable than f-strings when combining several variables.', explanationFalse: 'f-strings show text and variables in place; concatenation with + becomes unreadable as it grows.'  }, { type: 'match', text: 'Match type and common case:', pairs: [{ left: 'int', right: 'Discrete counts' }, { left: 'float', right: 'Measurements with decimals' }, { left: 'str', right: 'Text and labels' }, { left: 'bool', right: 'Logical states' }], explanation: 'Selecting the correct type reduces semantic errors.' }] },
      { title: 'Conditionals and loops', questions: [{ type: 'choice', text: 'Which pattern avoids infinite loops in input processes?', options: ['while True without exit condition', 'Explicit condition + controlled break', 'Remove validations', 'Use recursion everywhere'], ans: 1, explanation: 'Exit control is mandatory in robust loops.' }, { type: 'truefalse', text: 'continue can improve clarity when discarding invalid cases early.', ans: true, explanation: 'It reduces unnecessary nesting.', textFalse: 'continue always reduces loop clarity and should be avoided in every case.', explanationFalse: 'Discarding invalid cases early with continue avoids nested conditionals and flattens the logic.'  }, { type: 'match', text: 'Match statement and effect:', pairs: [{ left: 'if', right: 'Conditional decision' }, { left: 'for', right: 'Iteration over collection' }, { left: 'while', right: 'Repetition by condition' }, { left: 'break', right: 'Exit current loop' }], explanation: 'Mastering flow is the basis of maintainable logic.' }] },
      { title: 'Functions and modularity', questions: [{ type: 'choice', text: 'Which design favors testability in business functions?', options: ['Print inside every function', 'Return data and separate I/O from logic', 'Use cascading global variables', 'Write one giant function'], ans: 1, explanation: 'Separating logic and presentation facilitates testing.' }, { type: 'truefalse', text: 'A function with a single responsibility is usually more maintainable.', ans: true, explanation: 'It reduces coupling and cognitive complexity.', textFalse: 'Grouping several responsibilities into a single function makes it easier to maintain.', explanationFalse: 'A function that does several things is harder to test and to change without breaking the rest.'  }, { type: 'match', text: 'Match practice and benefit:', pairs: [{ left: 'Docstring', right: 'Explains purpose and contract' }, { left: 'Clear parameters', right: 'Predictable function use' }, { left: 'Separate module', right: 'Logic reuse' }, { left: 'Explicit import', right: 'Transparent dependencies' }], explanation: 'Modularity reduces technical debt.' }] },
      { title: 'Lists, dictionaries, and sets', questions: [{ type: 'choice', text: 'If you need fast access by unique key, which structure is most suitable?', options: ['Unindexed tuple list', 'Dictionary', 'Text string', 'Infinite while loop'], ans: 1, explanation: 'Dictionaries model key-value relationships efficiently.' }, { type: 'truefalse', text: 'A set is useful for removing duplicates without extra logic.', ans: true, explanation: 'Uniqueness is a native set property.', textFalse: 'To remove duplicates you must loop through the list, because set does not solve it.', explanationFalse: 'set() discards duplicates by definition: it does not allow repeated elements.'  }, { type: 'match', text: 'Match structure and strength:', pairs: [{ left: 'List', right: 'Order and sequential traversal' }, { left: 'Dictionary', right: 'Access by key' }, { left: 'Set', right: 'Element uniqueness' }, { left: 'Tuple', right: 'Light immutability' }], explanation: 'Each structure optimizes a usage pattern.' }] },
      { title: 'Files, errors, and best practices', questions: [{ type: 'choice', text: 'Which error approach is more professional in production scripts?', options: ['except: pass in every block', 'Catch specific exceptions and log context', 'Ignore input validations', 'Stop process without message'], ans: 1, explanation: 'Observability is part of software quality.' }, { type: 'truefalse', text: 'with open(...) guarantees file closure even on exception.', ans: true, explanation: 'The context manager manages resources safely.', textFalse: 'With with open(...) you must still call close() manually if an exception occurs.', explanationFalse: 'The with block closes the file on exit, both in normal execution and when an exception is raised.'  }, { type: 'match', text: 'Match technique and result:', pairs: [{ left: 'Specific try/except', right: 'Controlled failure handling' }, { left: 'logging', right: 'Subsequent diagnosis' }, { left: 'Prior validation', right: 'Prevention of avoidable errors' }, { left: 'PEP 8', right: 'Readability and team standard' }], explanation: 'Robustness combines prevention, capture, and traceability.' }] },
    ],
    examSections: [
      { title: 'Business problem solving', questions: [{ type: 'choice', text: 'You must process a daily CSV with incomplete data. Which architecture minimizes failures?', options: ['Read everything and assume perfect format', 'Validate rows, log errors, and continue with valid data', 'Abort on first error without report', 'Manually modify source file each day'], ans: 1, explanation: 'Operational resilience requires validation and traceability.' }, { type: 'truefalse', text: 'Separating parsing, transformation, and export into distinct functions improves maintainability.', ans: true, explanation: 'It facilitates testing and pipeline evolution.', textFalse: 'Solving parsing, transformation, and export in a single function makes the script easier to maintain.', explanationFalse: 'Separating the stages lets you test and change each one independently; merging them couples the whole flow.'  }, { type: 'match', text: 'Match stage and goal:', pairs: [{ left: 'Parsing', right: 'Interpret input data' }, { left: 'Validation', right: 'Guarantee minimum quality' }, { left: 'Transformation', right: 'Apply business rules' }, { left: 'Output', right: 'Persist reliable result' }], explanation: 'A clear pipeline reduces production incidents.' }] },
      { title: 'Quality and safe operation', questions: [{ type: 'choice', text: 'If a critical script fails in production, which evidence is most useful for diagnosis?', options: ['Only "Error" message', 'Logs with context, timestamp, and specific cause', 'Isolated screenshot', 'Restart server without analysis'], ans: 1, explanation: 'Without context, recovery becomes slow and uncertain.' }, { type: 'truefalse', text: 'Silencing critical exceptions increases risk of data corruption.', ans: true, explanation: 'Hiding failures prevents early response.', textFalse: 'Catching every exception with an empty except is good practice because it keeps the script from stopping.', explanationFalse: 'Silencing the error lets corrupted data through unnoticed; that is worse than failing visibly.'  }, { type: 'match', text: 'Match practice and operational impact:', pairs: [{ left: 'Unit tests', right: 'Reduce logic regressions' }, { left: 'Linting', right: 'Style uniformity and early errors' }, { left: 'Exception handling', right: 'Controlled responses to failures' }, { left: 'Schema validation', right: 'Avoid invalid data' }], explanation: 'Technical quality is preventive, not reactive.' }] },
    ],
  },
  javascript: {
    title: 'JavaScript',
    requirements: ['Modern browser', 'Code editor', 'Basic HTML/CSS knowledge'],
    certModules: ['JS fundamentals', 'Functions and asynchrony', 'DOM and events', 'API integration'],
    docs: { label: 'MDN JavaScript' },
    lessons: {
      'javascript-l1': { title: 'Variables, types, and scope', section: 'Module 1', description: 'What is JavaScript and what is it for? You will understand its role in the interactive web and how to manage state safely.', requirements: ['Modern browser', 'Code editor'], steps: ['Differentiate var, let, and const', 'Check types with typeof', 'Practice block and function scope', 'Avoid confusing redeclarations', 'Write simple script without global variables'], tip: 'Use const by default and let only when you really reassign.', resources: { docs: 'Variables and scope in JS' } },
      'javascript-l2': { title: 'Functions and modern patterns', section: 'Module 2', description: 'What are functions and what are they for? This lesson covers logic encapsulation, clarity, and reuse in frontend.', requirements: ['JS variable basics', 'Browser console practice'], steps: ['Define declarative and arrow functions', 'Pass functions as arguments', 'Create simple closures', 'Apply map/filter/reduce on arrays', 'Refactor repeated block into reusable function'], tip: 'Small functions facilitate debugging and testing.', resources: { docs: 'Functions in JavaScript' } },
      'javascript-l3': { title: 'DOM, events, and accessibility', section: 'Module 3', description: 'What is the DOM and what is it for? You will learn to manipulate interface and events robustly and accessibly.', requirements: ['Basic HTML/CSS knowledge', 'Basic JS functions'], steps: ['Select nodes with querySelector', 'Listen to events with addEventListener', 'Modify classes and attributes dynamically', 'Implement visible focus and keyboard', 'Build small interactive component'], tip: 'Do not rely only on click; support keyboard in interactive components.', resources: { docs: 'Introduction to the DOM' } },
      'javascript-l4': { title: 'Asynchrony with Promises and async/await', section: 'Module 4', description: 'What is asynchrony and what is it for? You will see how to coordinate non-blocking tasks and handle network errors.', requirements: ['JS functions', 'Basic HTTP concepts'], steps: ['Create Promise and resolve/reject cases', 'Consume promises with then/catch', 'Rewrite flow with async/await', 'Apply try/catch on requests', 'Show loading, success, and error states'], tip: 'Always handle network errors and unsuccessful responses.', resources: { docs: 'Promises in JavaScript' } },
      'javascript-l5': { title: 'API integration and client architecture', section: 'Module 5', description: 'What is integrating APIs and what is it for? You will learn to consume external services with clear contracts and state management.', requirements: ['Asynchrony with async/await', 'Basic JSON knowledge'], steps: ['Consume REST endpoint with fetch', 'Validate response.ok and parse JSON', 'Normalize data before rendering', 'Cache critical responses simply', 'Apply service pattern to separate logic'], tip: 'Separate data layer and UI layer to scale better.', resources: { docs: 'Fetch API on MDN' } },
    },
    quizSections: [
      { title: 'Variables, types, and scope', questions: [{ type: 'choice', text: 'Which decision minimizes redeclaration bugs in modern JavaScript?', options: ['Use var everywhere', 'Prefer const/let with block scope', 'Store state in window', 'Avoid functions'], ans: 1, explanation: 'const/let reduce ambiguity and scope leaks.' }, { type: 'truefalse', text: 'Block scope of let/const helps contain temporary state.', ans: true, explanation: 'It avoids unwanted side effects.', textFalse: 'let and const have function scope just like var, so they do not contain temporary state.', explanationFalse: 'let and const have block scope: they only exist inside the braces where they are declared.'  }, { type: 'match', text: 'Match declaration and behavior:', pairs: [{ left: 'const', right: 'Does not allow binding reassignment' }, { left: 'let', right: 'Reassignable with block scope' }, { left: 'var', right: 'Function scope and traditional hoisting' }, { left: 'typeof', right: 'Inspect type at runtime' }], explanation: 'Knowing variable semantics avoids subtle errors.' }] },
      { title: 'Functions and modern patterns', questions: [{ type: 'choice', text: 'Which pattern improves reuse without duplicating logic in arrays?', options: ['Nested for on every screen', 'map/filter/reduce with pure functions', 'Copy code per module', 'Long if chains'], ans: 1, explanation: 'Functional programming reduces noise and errors.' }, { type: 'truefalse', text: 'A closure can preserve private state between invocations.', ans: true, explanation: 'It is useful for encapsulating behavior.', textFalse: 'A closure loses its state as soon as the function that created it finishes.', explanationFalse: 'The closure keeps alive the environment where it was created, which is why it preserves state between calls.'  }, { type: 'match', text: 'Match method and purpose:', pairs: [{ left: 'map', right: 'Transform each element' }, { left: 'filter', right: 'Select subset' }, { left: 'reduce', right: 'Accumulate single result' }, { left: 'forEach', right: 'Side effect per element' }], explanation: 'Choosing the correct method improves readability.' }] },
      { title: 'DOM, events, and accessibility', questions: [{ type: 'choice', text: 'In a dynamic list, which technique reduces redundant listeners?', options: ['Add listener per new node', 'Event delegation on parent container', 'Reload page after each click', 'Use inline onclick in HTML'], ans: 1, explanation: 'Delegation scales better with dynamic content.' }, { type: 'truefalse', text: 'Adding keyboard support in interactive components improves accessibility.', ans: true, explanation: 'Not all users navigate with a mouse.', textFalse: 'If the component works with a mouse, adding keyboard support adds nothing to accessibility.', explanationFalse: 'Many people navigate only with a keyboard or a screen reader; without keyboard support the component is unusable for them.'  }, { type: 'match', text: 'Match API and utility:', pairs: [{ left: 'querySelector', right: 'Select first matching node' }, { left: 'classList.toggle', right: 'Activate/deactivate visual state' }, { left: 'addEventListener', right: 'Register user interaction' }, { left: 'setAttribute', right: 'Update node metadata' }], explanation: 'Manipulating DOM with intent avoids UI inconsistencies.' }] },
      { title: 'Asynchrony with Promises and async/await', questions: [{ type: 'choice', text: 'What is the main advantage of async/await over long then chains?', options: ['Eliminates need for error handling', 'Improves sequential readability of async flow', 'Converts code to truly synchronous', 'Avoids all network latency'], ans: 1, explanation: 'It is still async, but with clearer syntax.' }, { type: 'truefalse', text: 'try/catch also captures errors thrown by await in an async function.', ans: true, explanation: 'It allows centralizing failure handling.', textFalse: 'try/catch cannot catch an error thrown by await: you must use .catch() instead.', explanationFalse: 'Inside an async function, await throws the exception and try/catch catches it normally.'  }, { type: 'match', text: 'Match concept and function:', pairs: [{ left: 'Promise', right: 'Represents future result' }, { left: 'await', right: 'Pause logic within async' }, { left: 'catch', right: 'Handle async error' }, { left: 'finally', right: 'Run final cleanup' }], explanation: 'A robust async flow considers success and error.' }] },
      { title: 'API integration and client architecture', questions: [{ type: 'choice', text: 'Which practice prevents UI from depending directly on raw API format?', options: ['Render raw response on screen', 'Normalize data in a service layer', 'Duplicate fetch in every component', 'Ignore API contracts'], ans: 1, explanation: 'Normalization decouples backend and presentation.' }, { type: 'truefalse', text: 'Validating response.ok before parsing JSON avoids silent errors.', ans: true, explanation: 'Not every HTTP response means success.', textFalse: 'fetch throws an exception automatically when the server responds with 404 or 500.', explanationFalse: 'fetch only fails on network errors: a 404 or 500 arrives as a response, which is why you must check response.ok.'  }, { type: 'match', text: 'Match strategy and benefit:', pairs: [{ left: 'Service layer', right: 'Reuse data access' }, { left: 'Loading state', right: 'Clear user feedback' }, { left: 'Simple cache', right: 'Reduce repeated latency' }, { left: 'Error fallback', right: 'Maintain UX on failures' }], explanation: 'Robust client architecture improves resilience.' }] },
    ],
    examSections: [
      { title: 'Real frontend implementation', questions: [{ type: 'choice', text: 'You must build a panel that queries three endpoints with dependent results. Which design is more maintainable?', options: ['Everything in one giant global function', 'Separate services + async/await orchestration + centralized error handling', 'Nested requests without failure control', 'Refresh page on any error'], ans: 1, explanation: 'Separating responsibilities facilitates evolution and diagnosis.' }, { type: 'truefalse', text: 'Lack of loading and error states creates ambiguous experiences for end users.', ans: true, explanation: 'Robust UX always communicates what is happening.', textFalse: 'As long as the request finishes quickly, showing loading and error states is unnecessary.', explanationFalse: 'Without visible states the user cannot tell whether the app is working, failed, or finished; latency is never guaranteed.'  }, { type: 'match', text: 'Match problem and technical mitigation:', pairs: [{ left: 'Race condition', right: 'Cancel obsolete request' }, { left: 'Slow API', right: 'Show loading state' }, { left: '500 error', right: 'Fallback and clear message' }, { left: 'Incomplete data', right: 'Defensive validation before render' }], explanation: 'Frontend engineering requires operational resilience.' }] },
      { title: 'Code quality and scalability', questions: [{ type: 'choice', text: 'In code review, which signal indicates architectural technical debt?', options: ['Small functions with single responsibility', 'Strong coupling between UI and fetch calls in many places', 'Consistent error handling', 'Semantic module names'], ans: 1, explanation: 'Scattered coupling makes maintenance difficult.' }, { type: 'truefalse', text: 'Integration tests in async flows reduce production regressions.', ans: true, explanation: 'They verify coordination between layers and services.', textFalse: 'Unit tests are enough to cover asynchronous flows and their integrations.', explanationFalse: 'Unit tests isolate pieces; failures in asynchronous flows usually appear in the integration between them.'  }, { type: 'match', text: 'Match practice and business result:', pairs: [{ left: 'Modular architecture', right: 'Faster delivery of new features' }, { left: 'Consistent error handling', right: 'Fewer visible user incidents' }, { left: 'Defined data contract', right: 'Predictable backend integration' }, { left: 'Disciplined code review', right: 'Sustained quality over time' }], explanation: 'Technical scalability directly impacts the product.' }] },
    ],
  },
  html: {
    title: 'HTML',
    requirements: ['Code editor', 'Web browser', 'Minimal internet basics'],
    certModules: ['HTML5 structure', 'Semantics and accessibility', 'Forms', 'SEO best practices'],
    docs: { label: 'MDN HTML' },
    lessons: {
      'html-l1': { title: 'HTML5 base structure', section: 'Module 1', description: 'What is HTML and what is it for? This lesson defines the minimum structure to build valid and clear web documents.', requirements: ['Code editor', 'Web browser'], steps: ['Create HTML file from scratch', 'Add doctype, html, head, and body', 'Configure charset and viewport', 'Add title and basic metadata', 'Validate structure with standard tool'], tip: 'A clean document from the start avoids structural debt.', resources: { docs: 'HTML document structure' } },
      'html-l2': { title: 'Semantic content and hierarchy', section: 'Module 2', description: 'What is HTML semantics and what is it for? You will learn to tag content to improve comprehension for users and search engines.', requirements: ['Basic HTML structure', 'Heading comprehension'], steps: ['Use h1-h6 with coherent hierarchy', 'Separate content into section and article', 'Define navigation with nav', 'Include footer with contextual information', 'Review logical document outline'], tip: 'Semantics is not aesthetics: it is structural meaning.', resources: { docs: 'Semantic HTML' } },
      'html-l3': { title: 'Links, multimedia, and lists', section: 'Module 3', description: 'What are content elements and what are they for? You will see how to build informative and navigable pages with best practices.', requirements: ['HTML semantics basics', 'Prepared content resources'], steps: ['Create safe internal and external links', 'Insert images with descriptive alt', 'Add audio/video with native controls', 'Use ordered and unordered lists correctly', 'Check loading and resource fallback'], tip: 'Every link should communicate destination without relying on visual context.', resources: { docs: 'HTML multimedia elements' } },
      'html-l4': { title: 'Accessible forms', section: 'Module 4', description: 'What is an accessible form and what is it for? You will learn to collect data with clear validations and good user experience.', requirements: ['Valid HTML structure', 'Basic input knowledge'], steps: ['Build form with associated labels', 'Use appropriate input types', 'Apply required native validations', 'Group fields with fieldset and legend', 'Test full keyboard navigation'], tip: 'A form error should explain what to fix and how.', resources: { docs: 'Forms in HTML' } },
      'html-l5': { title: 'Technical SEO and structural quality', section: 'Module 5', description: 'What is optimizing HTML for SEO and what is it for? This lesson connects structure, performance, and discoverability in search engines.', requirements: ['Structure and semantics mastery', 'Basic metadata knowledge'], steps: ['Configure useful title and meta description', 'Review headings for search intent', 'Add performance attributes like loading', 'Detect structure and content duplications', 'Audit document with technical SEO checklist'], tip: 'Technical SEO starts with semantic and fast HTML.', resources: { docs: 'HTML best practices' } },
    },
    quizSections: [
      { title: 'HTML5 base structure', questions: [{ type: 'choice', text: 'Which element defines metadata not visible to the user but critical for render and SEO?', options: ['body', 'head', 'main', 'footer'], ans: 1, explanation: 'head encapsulates document metadata.' }, { type: 'truefalse', text: 'The correct doctype helps the browser use standards mode.', ans: true, explanation: 'It avoids inconsistent rendering between engines.', textFalse: 'Omitting the doctype does not change how the browser interprets the document.', explanationFalse: 'Without a doctype the browser enters quirks mode and applies legacy rules that break the layout.'  }, { type: 'match', text: 'Match tag and purpose:', pairs: [{ left: '<html>', right: 'Document root' }, { left: '<head>', right: 'Page metadata' }, { left: '<body>', right: 'Visible content' }, { left: '<title>', right: 'Tab title and base SEO' }], explanation: 'A solid base guarantees compatibility.' }] },
      { title: 'Semantic content and hierarchy', questions: [{ type: 'choice', text: 'Which semantic error most affects screen reader comprehension?', options: ['Use external CSS', 'Skip heading hierarchies without logic', 'Include a footer', 'Use ordered lists'], ans: 1, explanation: 'Hierarchy guides assistive navigation.' }, { type: 'truefalse', text: 'article should be used for autonomous content that makes sense on its own.', ans: true, explanation: 'Its semantics indicate block independence.', textFalse: 'The article element is a generic container, interchangeable with div in any situation.', explanationFalse: 'article signals that the content stands on its own; div carries no semantics at all.'  }, { type: 'match', text: 'Match tag and function:', pairs: [{ left: '<nav>', right: 'Main navigation links' }, { left: '<section>', right: 'Group thematic content' }, { left: '<article>', right: 'Independent content unit' }, { left: '<aside>', right: 'Complementary content' }], explanation: 'Semantics improves structure and maintenance.' }] },
      { title: 'Links, multimedia, and lists', questions: [{ type: 'choice', text: 'Which practice improves security when opening external links in a new tab?', options: ['target="_blank" only', 'Add rel="noopener noreferrer"', 'Remove href attribute', 'Convert link to non-functional button'], ans: 1, explanation: 'It prevents destination from accessing original context.' }, { type: 'truefalse', text: 'The alt attribute should describe the informative function of the image.', ans: true, explanation: 'It is not optional for images with content value.', textFalse: 'The alt attribute should repeat the image file name to improve search ranking.', explanationFalse: 'alt describes what the image contributes; repeating the file name tells a screen-reader user nothing.'  }, { type: 'match', text: 'Match element and correct use:', pairs: [{ left: '<a>', right: 'Navigation between resources' }, { left: '<img>', right: 'Display image with alternative text' }, { left: '<ul>', right: 'List without priority order' }, { left: '<ol>', right: 'Sequence with explicit order' }], explanation: 'Elements should match content meaning.' }] },
      { title: 'Accessible forms', questions: [{ type: 'choice', text: 'Which combination improves usability and basic validation for email?', options: ['input type="text"', 'input type="email" + associated label', 'placeholder without label', 'div with contenteditable'], ans: 1, explanation: 'The correct type enables validation and optimized keyboard.' }, { type: 'truefalse', text: 'A placeholder does not replace an accessible label.', ans: true, explanation: 'The label maintains persistent context.', textFalse: 'A placeholder does the same job as a label, so the label can be dropped.', explanationFalse: 'The placeholder disappears as you type and many screen readers do not announce it: the label is still required.'  }, { type: 'match', text: 'Match component and benefit:', pairs: [{ left: 'label for', right: 'Explicit field-text association' }, { left: 'required', right: 'Minimum native validation' }, { left: 'fieldset', right: 'Logical field grouping' }, { left: 'aria-describedby', right: 'Additional help/error context' }], explanation: 'Form accessibility depends on semantic structure.' }] },
      { title: 'Technical SEO and structural quality', questions: [{ type: 'choice', text: 'Which practice directly impacts indexing and thematic comprehension?', options: ['Use multiple h1 without criteria', 'Title and headings aligned to search intent', 'Always remove meta description', 'Hide all text in images'], ans: 1, explanation: 'Semantic coherence helps engines and users.' }, { type: 'truefalse', text: 'Semantic and lightweight HTML contributes to perceived performance.', ans: true, explanation: 'Clean structure facilitates parsing and render.', textFalse: 'HTML semantics are purely cosmetic and do not affect perceived performance.', explanationFalse: 'Clean markup is parsed and painted sooner, and lets the browser prioritise content better.'  }, { type: 'match', text: 'Match technical signal and SEO effect:', pairs: [{ left: 'Clear meta description', right: 'Better context in results' }, { left: 'Ordered headings', right: 'Hierarchical content comprehension' }, { left: 'Optimized images', right: 'Faster page load' }, { left: 'Semantic landmarks', right: 'Greater structural accessibility' }], explanation: 'Technical SEO and accessibility reinforce each other.' }] },
    ],
    examSections: [
      { title: 'Corporate page construction', questions: [{ type: 'choice', text: 'You must publish an accessible conversion-oriented landing page. Which work order is more solid?', options: ['Design styles first without structure', 'Define semantic structure, then content, then technical optimization', 'Paste auto-generated HTML without review', 'Prioritize animations over content'], ans: 1, explanation: 'A semantic base facilitates accessibility, SEO, and maintenance.' }, { type: 'truefalse', text: 'If forms lack visible or equivalent labels, user errors increase.', ans: true, explanation: 'Lack of context affects form completion.', textFalse: 'Removing labels from a form simplifies it and reduces errors for the person filling it in.', explanationFalse: 'Without a label the person has to guess what is being asked, and input errors increase.'  }, { type: 'match', text: 'Match review and goal:', pairs: [{ left: 'HTML validator', right: 'Detect invalid structure' }, { left: 'Keyboard test', right: 'Verify accessible navigation' }, { left: 'Metadata audit', right: 'Improve discoverability' }, { left: 'Media optimization', right: 'Reduce load times' }], explanation: 'Final quality depends on concrete technical controls.' }] },
      { title: 'Web quality governance', questions: [{ type: 'choice', text: 'In continuous maintenance, which practice reduces structural regressions?', options: ['Edit production directly without review', 'Use semantic checklist and peer review', 'Remove markup documentation', 'Mix structure with extensive embedded scripts'], ans: 1, explanation: 'Standardization avoids progressive degradation.' }, { type: 'truefalse', text: 'A poorly hierarchical heading can affect both accessibility and SEO.', ans: true, explanation: 'Both systems depend on clear structure.', textFalse: 'Heading levels only change text size and affect neither accessibility nor search ranking.', explanationFalse: 'Headings build the document outline: screen readers and search engines navigate through it.'  }, { type: 'match', text: 'Match risk and mitigation:', pairs: [{ left: 'Content without context', right: 'Correct headings and landmarks' }, { left: 'Ambiguous fields', right: 'Clear labels and error messages' }, { left: 'Slow load', right: 'Multimedia resource optimization' }, { left: 'Inconsistent semantics', right: 'Shared markup guide' }], explanation: 'Technical governance sustains long-term quality.' }] },
    ],
  },
  css: {
    title: 'CSS',
    requirements: ['Basic HTML knowledge', 'Code editor', 'Browser with DevTools'],
    certModules: ['Fundamentals and specificity', 'Box model', 'Flexbox/Grid', 'Responsive and animations'],
    docs: { label: 'MDN CSS' },
    lessons: {
      'css-l1': { title: 'Selectors and cascade', section: 'Module 1', description: 'What is CSS and what is it for? You will understand how it applies styles through selectors, inheritance, and cascade.', requirements: ['Basic HTML knowledge', 'Code editor'], steps: ['Apply rules by tag, class, and id', 'Compare selector specificity', 'Avoid abusing !important', 'Organize styles by component', 'Inspect rules in DevTools'], tip: 'The best specificity is the minimum necessary.', resources: { docs: 'CSS selectors' } },
      'css-l2': { title: 'Box model and visual flow', section: 'Module 2', description: 'What is the box model and what is it for? You will learn to control dimensions, spacing, and reliable visual distribution.', requirements: ['Basic selectors', 'DevTools available'], steps: ['Configure global box-sizing', 'Differentiate margin, border, and padding', 'Adjust component width/height', 'Detect margin collapse', 'Build card with consistent spacing'], tip: 'border-box simplifies calculations in almost all layouts.', resources: { docs: 'CSS box model' } },
      'css-l3': { title: 'Flexbox for one-dimensional layout', section: 'Module 3', description: 'What is Flexbox and what is it for? You will master alignment and distribution of elements in adaptable rows/columns.', requirements: ['Box model mastered', 'UI component practice'], steps: ['Create base flex container', 'Adjust main and cross axis', 'Configure grow/shrink/basis', 'Apply gap and wrapping', 'Solve responsive navigation layout'], tip: 'Think about axes first before touching alignment properties.', resources: { docs: 'Flexbox guide' } },
      'css-l4': { title: 'Grid for complex structures', section: 'Module 4', description: 'What is CSS Grid and what is it for? This lesson covers robust two-dimensional layouts for modern interfaces.', requirements: ['Flexbox knowledge', 'Basic layout done'], steps: ['Define columns and rows with fr and minmax', 'Place areas with grid-template-areas', 'Combine grid and auto-placement', 'Design dashboard with main zones', 'Adjust behavior at breakpoints'], tip: 'Grid for macro structure; Flexbox for internal components.', resources: { docs: 'Introduction to CSS Grid' } },
      'css-l5': { title: 'Responsive, states, and microinteractions', section: 'Module 5', description: 'What is responsive design and what is it for? You will learn to adapt interfaces, transitions, and motion accessibility.', requirements: ['Flexbox and Grid', 'Basic accessibility concepts'], steps: ['Apply mobile-first media queries', 'Use fluid units like rem and clamp', 'Define clear hover/focus/active states', 'Add purposeful transitions', 'Respect prefers-reduced-motion'], tip: 'Never sacrifice accessibility for visual animation.', resources: { docs: 'Responsive design in CSS' } },
    },
    quizSections: [
      { title: 'Selectors and cascade', questions: [{ type: 'choice', text: 'Which selector strategy reduces fragility in large projects?', options: ['Long selectors by deep hierarchy', 'Semantic component-oriented classes', 'Massive id usage', 'Inline styles on every node'], ans: 1, explanation: 'Component classes scale with less coupling.' }, { type: 'truefalse', text: 'Abusing !important usually indicates style architecture problems.', ans: true, explanation: 'It is a symptom of specificity wars.', textFalse: 'Using !important systematically is the recommended way to resolve style conflicts.', explanationFalse: '!important hides the symptom and breaks the cascade; the real conflict lies in specificity and organisation.'  }, { type: 'match', text: 'Match selector and relative specificity:', pairs: [{ left: '#id', right: 'High specific priority' }, { left: '.class', right: 'Reusable and controllable' }, { left: 'element', right: 'Global style base' }, { left: ':root', right: 'Context for global variables' }], explanation: 'Knowing specificity avoids chaotic overrides.' }] },
      { title: 'Box model and visual flow', questions: [{ type: 'choice', text: 'If a component overflows its container despite defined width, what to check first?', options: ['Font type', 'Box model and accumulated padding/border', 'Background color', 'Class name'], ans: 1, explanation: 'Padding and border alter total size without border-box.' }, { type: 'truefalse', text: 'margin controls external space; padding internal space.', ans: true, explanation: 'Differentiating them is key for stable composition.', textFalse: 'margin controls the space inside the element and padding the space separating it from others.', explanationFalse: 'It is the other way round: padding is the inner space between border and content; margin separates from the outside.'  }, { type: 'match', text: 'Match property and effect:', pairs: [{ left: 'margin', right: 'External separation between elements' }, { left: 'padding', right: 'Internal content breathing room' }, { left: 'border', right: 'Visual block boundary' }, { left: 'box-sizing', right: 'Dimension calculation model' }], explanation: 'The box model impacts layout and readability.' }] },
      { title: 'Flexbox for one-dimensional layout', questions: [{ type: 'choice', text: 'Which property controls item distribution on the main axis?', options: ['align-items', 'justify-content', 'z-index', 'font-weight'], ans: 1, explanation: 'justify-content operates on the main axis.' }, { type: 'truefalse', text: 'gap in flex allows spacing elements without lateral margin hacks.', ans: true, explanation: 'It simplifies visual maintenance.', textFalse: 'The gap property only works in Grid, so in Flexbox you must space items with margins.', explanationFalse: 'gap is supported in Flexbox and removes the need for side margins and the classic :last-child fix.'  }, { type: 'match', text: 'Match property and result:', pairs: [{ left: 'display:flex', right: 'Activates flexible context' }, { left: 'flex-wrap', right: 'Allows item line break' }, { left: 'align-items', right: 'Aligns on cross axis' }, { left: 'flex-grow', right: 'Distributes leftover space' }], explanation: 'Flexbox solves most linear layouts.' }] },
      { title: 'Grid for complex structures', questions: [{ type: 'choice', text: 'What main advantage does Grid offer over Flexbox in dashboards?', options: ['Better default typography', 'Explicit two-dimensional row and column control', 'Avoids any media query', 'Replaces semantic HTML'], ans: 1, explanation: 'Grid models two dimensions with precision.' }, { type: 'truefalse', text: 'grid-template-areas improves readability of complex layouts.', ans: true, explanation: 'It allows visualizing structure declaratively.', textFalse: 'grid-template-areas makes a layout harder to read than positioning each item by line number.', explanationFalse: 'Naming the areas draws the layout in the CSS itself; line numbers force you to rebuild it mentally.'  }, { type: 'match', text: 'Match Grid concept and use:', pairs: [{ left: 'fr', right: 'Fraction of available space' }, { left: 'minmax', right: 'Adaptable size range' }, { left: 'auto-fit', right: 'Automatic responsive columns' }, { left: 'grid-area', right: 'Assign block to named zone' }], explanation: 'These tools enable change-resistant designs.' }] },
      { title: 'Responsive, states, and microinteractions', questions: [{ type: 'choice', text: 'Which responsive approach is more sustainable for multiple devices?', options: ['Rigid desktop-first without breakpoints', 'Mobile-first with content-driven breakpoints', 'Fixed widths for everything', 'Design only for 1920px'], ans: 1, explanation: 'Breakpoints should respond to content, not isolated devices.' }, { type: 'truefalse', text: 'prefers-reduced-motion should be considered for animation accessibility.', ans: true, explanation: 'It respects motion sensitivity.', textFalse: 'Animations should always run the same way, ignoring the reduced-motion preference.', explanationFalse: 'Motion triggers dizziness or migraine for some people; prefers-reduced-motion lets you respect that.'  }, { type: 'match', text: 'Match pattern and UX benefit:', pairs: [{ left: ':focus-visible', right: 'Clear keyboard navigation' }, { left: 'clamp()', right: 'Fluid typographic scale' }, { left: 'transition', right: 'Gradual visual changes' }, { left: 'media query', right: 'Contextual layout adaptation' }], explanation: 'Responsive and accessibility should be designed together.' }] },
    ],
    examSections: [
      { title: 'Adaptable interface design', questions: [{ type: 'choice', text: 'You must implement an interface that works on mobile, tablet, and desktop without duplicating code. Which strategy do you apply?', options: ['Three isolated CSS files without common system', 'Mobile-first architecture with tokens and reusable components', 'Fixed layout with horizontal scroll', 'Inline styles per screen'], ans: 1, explanation: 'Systematic reuse reduces maintenance and errors.' }, { type: 'truefalse', text: 'A tokenized spacing system improves visual coherence across teams.', ans: true, explanation: 'It defines shared and predictable rules.', textFalse: 'Picking spacing values by eye on each screen gives a more consistent result than using tokens.', explanationFalse: 'Tokens fix a shared scale; without one, each screen accumulates different values and the whole looks uneven.'  }, { type: 'match', text: 'Match layout problem and solution:', pairs: [{ left: 'Misaligned buttons', right: 'Flex alignment and consistent gap' }, { left: 'Broken columns on mobile', right: 'Grid with minmax and media queries' }, { left: 'Disproportionate text', right: 'Typographic scale with clamp' }, { left: 'Invisible focus state', right: 'Accessible focus-visible styles' }], explanation: 'Visual quality emerges from structural decisions.' }] },
      { title: 'Front-end design operations', questions: [{ type: 'choice', text: 'If a team reports inconsistent styles per module, which action fixes root cause?', options: ['Add !important to every rule', 'Define CSS architecture convention and review style PRs', 'Copy CSS from other projects', 'Remove reusable components'], ans: 1, explanation: 'Style governance prevents continuous regressions.' }, { type: 'truefalse', text: 'Lack of CSS naming conventions increases collisions and technical debt.', ans: true, explanation: 'Ambiguous names cause accidental overrides.', textFalse: 'Without naming conventions CSS grows just as healthily, as long as everyone uses descriptive names.', explanationFalse: 'Without a convention, two people pick the same name for different things and the styles collide.'  }, { type: 'match', text: 'Match quality control and goal:', pairs: [{ left: 'CSS lint', right: 'Early error detection' }, { left: 'Design tokens', right: 'Global visual consistency' }, { left: 'Responsive review', right: 'Correct behavior per viewport' }, { left: 'Accessible checklist', right: 'Inclusive UX criteria compliance' }], explanation: 'Professional CSS operation requires clear technical standards.' }] },
    ],
  },
  github: {
    title: 'GitHub',
    requirements: ['GitHub account', 'Git installed locally', 'Basic terminal'],
    certModules: ['Git fundamentals', 'Branches and collaboration', 'Pull Requests', 'Automation with Actions'],
    docs: { label: 'Official GitHub documentation' },
    lessons: {
      'github-l1': { title: 'Git and remote repositories', section: 'Module 1', description: 'What is GitHub and what is it for? You will learn the basics of version control and collaboration on remote repositories.', requirements: ['GitHub account', 'Git installed locally'], steps: ['Configure identity in Git', 'Initialize local repository', 'Create first commit with clear message', 'Connect remote on GitHub', 'Publish main branch safely'], tip: 'Clear commit messages reduce review and support time.', resources: { docs: 'Introduction to GitHub' } },
      'github-l2': { title: 'Branches and workflow', section: 'Module 2', description: 'What are branches and what are they for? You will see how to isolate changes to develop without affecting main stability.', requirements: ['Initial repository created', 'Commit knowledge'], steps: ['Create feature branch', 'Implement isolated changes', 'Rebase or update with main', 'Resolve basic conflicts', 'Prepare clean history for review'], tip: 'Small branches are reviewed faster with lower risk.', resources: { docs: 'About branches' } },
      'github-l3': { title: 'Pull Requests and technical review', section: 'Module 3', description: 'What is a Pull Request and what is it for? You will learn to propose traceable changes with effective technical discussion.', requirements: ['Basic branch workflow', 'Ability to resolve simple conflicts'], steps: ['Open PR with context and goal', 'Add reproducible test plan', 'Respond to review comments', 'Apply changes and update branch', 'Complete merge per repository policy'], tip: 'Explain why of the change, not just what.', resources: { docs: 'About pull requests' } },
      'github-l4': { title: 'Issue management and traceability', section: 'Module 4', description: 'What is work traceability and what is it for? This lesson connects issues, commits, and PRs for transparent management.', requirements: ['PR knowledge', 'Defined team workflow'], steps: ['Create issue with business context', 'Label priority and work type', 'Link branch/PR to issue', 'Close issue with solution evidence', 'Generate sprint progress report'], tip: 'A well-written issue saves hours of interpretation.', resources: { docs: 'Issues on GitHub' } },
      'github-l5': { title: 'Initial CI/CD with GitHub Actions', section: 'Module 5', description: 'What is GitHub Actions and what is it for? You will learn to automate tests and deployments to ensure continuous quality.', requirements: ['Repository and PR knowledge', 'Terminal and script basics'], steps: ['Create workflow in .github/workflows', 'Configure push and pull_request triggers', 'Run lint and tests in pipeline', 'Publish build artifacts', 'Block merge if pipeline fails'], tip: 'Automate repetitive and business-critical tasks first.', resources: { docs: 'GitHub Actions' } },
    },
    quizSections: [
      { title: 'Git and remote repositories', questions: [{ type: 'choice', text: 'What business benefit does versioning changes with frequent commits provide?', options: ['Eliminate need for documentation', 'Audit decisions and revert incidents with lower impact', 'Speed up server hardware', 'Avoid code reviews'], ans: 1, explanation: 'History is an operational and technical log.' }, { type: 'truefalse', text: 'A centralized remote repository facilitates collaboration and history backup.', ans: true, explanation: 'It reduces loss risk and fragmentation.', textFalse: 'Working only with the local repository is just as safe, because Git already stores the whole history.', explanationFalse: 'The local history disappears with the machine; the remote is what provides backup and shared work.'  }, { type: 'match', text: 'Match command and function:', pairs: [{ left: 'git init', right: 'Initialize local repository' }, { left: 'git add', right: 'Stage changes for commit' }, { left: 'git commit', right: 'Save versioned snapshot' }, { left: 'git push', right: 'Publish changes to remote' }], explanation: 'The basic flow sustains orderly collaboration.' }] },
      { title: 'Branches and workflow', questions: [{ type: 'choice', text: 'What is the main reason to develop on feature branches?', options: ['Avoid documentation', 'Isolate changes and protect stable branch', 'Publish directly to main', 'Eliminate tests'], ans: 1, explanation: 'Isolation reduces operational risk.' }, { type: 'truefalse', text: 'Updating feature branch with main before merge reduces late conflicts.', ans: true, explanation: 'It integrates changes gradually.', textFalse: 'It is better not to touch the feature branch until the end, to avoid conflicts with main.', explanationFalse: 'The longer you delay syncing, the more the branches diverge and the bigger the final conflict.'  }, { type: 'match', text: 'Match term and purpose:', pairs: [{ left: 'feature branch', right: 'Implement isolated change' }, { left: 'main branch', right: 'Stable integration base' }, { left: 'merge conflict', right: 'Simultaneous change collision' }, { left: 'rebase', right: 'Reapply commits on new history' }], explanation: 'Understanding branches improves development predictability.' }] },
      { title: 'Pull Requests and technical review', questions: [{ type: 'choice', text: 'Which element increases review quality in a PR?', options: ['Empty description', 'Context, scope, and verifiable test plan', 'Single giant commit without explanation', 'Unrelated mixed changes'], ans: 1, explanation: 'Clarity reduces review friction.' }, { type: 'truefalse', text: 'Responding to comments with technical evidence speeds PR approval.', ans: true, explanation: 'Effective collaboration reduces cycles.', textFalse: 'Applying the changes without replying to the comments speeds up PR approval.', explanationFalse: 'The reviewer needs to know what changed and why; without a reply they must rebuild the context from scratch.'  }, { type: 'match', text: 'Match artifact and value:', pairs: [{ left: 'PR description', right: 'Communicates change intent' }, { left: 'CI checks', right: 'Validate automatic quality' }, { left: 'Review comments', right: 'Improve proposed solution' }, { left: 'Merge policy', right: 'Protect main branch' }], explanation: 'Well-structured PRs raise code reliability.' }] },
      { title: 'Issue management and traceability', questions: [{ type: 'choice', text: 'Which practice best connects reported problem and technical solution?', options: ['Issue without context or steps', 'Link issue, branch, and PR with explicit references', 'Resolve outside repository', 'Edit production without ticket'], ans: 1, explanation: 'Traceability facilitates audit and learning.' }, { type: 'truefalse', text: 'Labels and priorities in issues help plan work by value.', ans: true, explanation: 'They order backlog by impact and urgency.', textFalse: 'Labelling and prioritising issues is bureaucracy that does not affect work planning.', explanationFalse: 'Labels and priorities are exactly what let you order the backlog by value and impact.'  }, { type: 'match', text: 'Match management element and function:', pairs: [{ left: 'Issue', right: 'Documented work unit' }, { left: 'Label', right: 'Thematic/priority classification' }, { left: 'Milestone', right: 'Grouping by time objective' }, { left: 'Assignee', right: 'Execution owner' }], explanation: 'Explicit management reduces operational uncertainty.' }] },
      { title: 'Initial CI/CD with GitHub Actions', questions: [{ type: 'choice', text: 'What key advantage does running tests on every PR with Actions provide?', options: ['Eliminate human reviews', 'Detect regressions before merge', 'Increase commit size', 'Avoid main branch'], ans: 1, explanation: 'CI prevents defects early in the flow.' }, { type: 'truefalse', text: 'A failed pipeline should block merge on protected branches.', ans: true, explanation: 'It guarantees minimum quality standard.', textFalse: 'A red pipeline can still be merged if the team is in a hurry to ship.', explanationFalse: 'Merging with a failing pipeline puts the failure on the main branch and blocks the whole team.'  }, { type: 'match', text: 'Match workflow stage and goal:', pairs: [{ left: 'checkout', right: 'Get code from repo' }, { left: 'install', right: 'Prepare dependencies' }, { left: 'test', right: 'Validate expected behavior' }, { left: 'artifact', right: 'Save build result' }], explanation: 'Structured pipeline accelerates safe delivery.' }] },
    ],
    examSections: [
      { title: 'Collaborative feature delivery', questions: [{ type: 'choice', text: 'Your team reports frequent conflictive merges and slow PRs. Which intervention has the greatest impact?', options: ['Allow direct pushes to main', 'Reduce branch size, standardize PR template, and activate mandatory checks', 'Disable reviews for speed', 'Concentrate changes monthly'], ans: 1, explanation: 'Flow discipline reduces systemic friction.' }, { type: 'truefalse', text: 'A clear commit history facilitates controlled rollback on incidents.', ans: true, explanation: 'It allows quickly isolating and reverting the problem.', textFalse: 'With large commits and generic messages, rolling back during an incident is just as simple.', explanationFalse: 'To revert you must identify the offending change; with huge commits you also revert what was working.'  }, { type: 'match', text: 'Match risk and recommended control:', pairs: [{ left: 'Unreviewed changes', right: 'Branch protection with reviewers' }, { left: 'Skipped tests', right: 'Mandatory CI on PR' }, { left: 'Vague context', right: 'Standardized PR template' }, { left: 'Invisible work', right: 'Issues linked to development' }], explanation: 'Collaboration quality is process design.' }] },
      { title: 'DevOps governance with GitHub', questions: [{ type: 'choice', text: 'Which indicator shows maturity in delivery flow with GitHub?', options: ['Huge and rare commits', 'Short cycle time with low rollback rate', 'No change documentation', 'Optional pipelines'], ans: 1, explanation: 'It measures sustainable stability and speed.' }, { type: 'truefalse', text: 'Automating security validations in CI reduces risk of releasing vulnerabilities.', ans: true, explanation: 'Early security checks decrease exposure.', textFalse: 'Security checks should be run manually only, once before each annual release.', explanationFalse: 'Sporadic manual review lets months of changes through; wired into CI, every commit gets validated.'  }, { type: 'match', text: 'Match practice and organizational result:', pairs: [{ left: 'Code owners', right: 'Review by domain experts' }, { left: 'Dependabot', right: 'Proactive dependency updates' }, { left: 'Reusable action', right: 'Pipeline standardization' }, { left: 'Release tags', right: 'Production version traceability' }], explanation: 'Technical governance sustains team scalability.' }] },
    ],
  },
  excel: {
    title: 'Excel',
    requirements: ['Microsoft Excel installed', 'Practice data in sheet', 'Basic cell knowledge'],
    certModules: ['Sheet fundamentals', 'Key formulas', 'Lookup and analysis', 'Executive visualization'],
    docs: { label: 'Official Excel Help' },
    lessons: {
      'excel-l1': { title: 'Sheet structure and references', section: 'Module 1', description: 'What is Excel and what is it for? This lesson establishes bases for organizing data and working with reliable references.', requirements: ['Microsoft Excel installed', 'Practice data in sheet'], steps: ['Create table with consistent headers', 'Apply number and date format', 'Differentiate relative/absolute references', 'Name key work ranges', 'Save file with controlled version'], tip: 'Good data structure avoids fragile formulas.', resources: { docs: 'Introduction to Excel' } },
      'excel-l2': { title: 'Essential business formulas', section: 'Module 2', description: 'What are formulas and what are they for? You will learn to automate repetitive calculations and reduce manual errors.', requirements: ['Organized sheet structure', 'Basic function knowledge'], steps: ['Apply SUM and AVERAGE correctly', 'Use IF for simple rules', 'Combine basic text functions', 'Copy formulas with correct references', 'Audit results with control data'], tip: 'Validate with edge cases before considering a formula correct.', resources: { docs: 'Excel functions' } },
      'excel-l3': { title: 'VLOOKUP/XLOOKUP and data relationships', section: 'Module 3', description: 'What is looking up data between tables and what is it for? You will see how to relate sources without manually copying information.', requirements: ['Basic formula mastery', 'Reference tables available'], steps: ['Prepare clean master tables', 'Apply VLOOKUP and detect limitations', 'Implement XLOOKUP in flexible scenarios', 'Handle errors with IFERROR', 'Compare results against manual control'], tip: 'Prioritize XLOOKUP when available for greater flexibility.', resources: { docs: 'VLOOKUP and XLOOKUP' } },
      'excel-l4': { title: 'Pivot tables and segmentation', section: 'Module 4', description: 'What is a pivot table and what is it for? You will learn to summarize large data volumes for quick decisions.', requirements: ['Clean tabular data', 'Filter and sort knowledge'], steps: ['Insert pivot table from clean source', 'Configure rows, columns, and values', 'Apply filters and slicers', 'Create comparative metrics by period', 'Update table when adding new data'], tip: 'Do not use blank rows in source if you want stable pivots.', resources: { docs: 'Pivot tables in Excel' } },
      'excel-l5': { title: 'Dashboards and executive communication', section: 'Module 5', description: 'What is an Excel dashboard and what is it for? This lesson integrates metrics, visualization, and narrative for executive decisions.', requirements: ['Functional pivot tables', 'Business-defined metrics'], steps: ['Select priority KPIs', 'Choose appropriate charts per metric', 'Unify dashboard visual style', 'Add filter controls for exploration', 'Validate consistency with stakeholders'], tip: 'A useful dashboard answers concrete business questions, not everything.', resources: { docs: 'Create charts and dashboards' } },
    },
    quizSections: [
      { title: 'Sheet structure and references', questions: [{ type: 'choice', text: 'What operational error does using absolute references when copying formulas avoid?', options: ['System language changes', 'Involuntary shift of critical cells', 'Internet failures', 'File lock'], ans: 1, explanation: 'Absolute references preserve key coordinates.' }, { type: 'truefalse', text: 'Converting range to table improves formula and filter consistency.', ans: true, explanation: 'Structured tables are more robust.', textFalse: 'Working on a loose range keeps formulas more consistent than converting it into a table.', explanationFalse: 'A table extends formulas and filters automatically as rows are added; a loose range must be readjusted by hand.'  }, { type: 'match', text: 'Match reference type and behavior:', pairs: [{ left: 'A1', right: 'Fully relative' }, { left: '$A$1', right: 'Fully absolute' }, { left: 'A$1', right: 'Fixed row, relative column' }, { left: '$A1', right: 'Fixed column, relative row' }], explanation: 'Understanding references is the basis of reliable models.' }] },
      { title: 'Essential business formulas', questions: [{ type: 'choice', text: 'Which approach reduces errors in complex formulas?', options: ['Write everything in one line without validating', 'Build in parts and verify subresults', 'Copy from internet without adapting', 'Use only manual values'], ans: 1, explanation: 'Incremental validation improves precision.' }, { type: 'truefalse', text: 'IF allows modeling conditional business rules in a cell.', ans: true, explanation: 'It is a key function for decision logic.', textFalse: 'The IF function only compares numbers and cannot model business rules.', explanationFalse: 'IF evaluates any logical condition (text, dates, references) and lets you chain business rules.'  }, { type: 'match', text: 'Match function and use:', pairs: [{ left: 'SUM', right: 'Totalize values' }, { left: 'AVERAGE', right: 'Set average' }, { left: 'IF', right: 'Conditional evaluation' }, { left: 'CONCAT', right: 'Join texts' }], explanation: 'Base functions cover most initial needs.' }] },
      { title: 'VLOOKUP/XLOOKUP and data relationships', questions: [{ type: 'choice', text: 'What advantage does XLOOKUP offer over VLOOKUP in modern scenarios?', options: ['Only works on small tables', 'Allows flexible left/right lookup and not-found handling', 'Replaces pivot tables', 'Avoids all data validation'], ans: 1, explanation: 'XLOOKUP expands cases and readability.' }, { type: 'truefalse', text: 'Handling #N/A with explicit strategy avoids ambiguous reports.', ans: true, explanation: 'Unmanaged error can distort decisions.', textFalse: 'It is better to leave #N/A visible without handling it, because the report is then more transparent.', explanationFalse: 'An unexplained #N/A gets confused with a genuinely missing value; handle it with IFNA and document the criterion.'  }, { type: 'match', text: 'Match problem and solution:', pairs: [{ left: 'Key does not exist', right: 'IFERROR or if_not_found' }, { left: 'Disordered table', right: 'Use exact lookup' }, { left: 'Multiple sources', right: 'Normalize primary key' }, { left: 'Inconsistent results', right: 'Audit lookup range' }], explanation: 'Data quality conditions analysis quality.' }] },
      { title: 'Pivot tables and segmentation', questions: [{ type: 'choice', text: 'Which requirement is critical for pivot table not to fail on update?', options: ['Bright colors', 'Source without blank rows or ambiguous headers', 'Multiple hidden sheets', 'Complex conditional formatting'], ans: 1, explanation: 'Clean source determines summary stability.' }, { type: 'truefalse', text: 'HAVING does not apply in Excel, but slicers fulfill dynamic visual filtering role.', ans: true, explanation: 'Slicers improve data exploration for non-technical users.', textFalse: 'Excel includes a HAVING clause equivalent to the SQL one for filtering groups in pivot tables.', explanationFalse: 'HAVING belongs to SQL; in Excel interactive filtering is done with slicers and pivot-table filters.'  }, { type: 'match', text: 'Match pivot element and function:', pairs: [{ left: 'Rows', right: 'Main grouping dimension' }, { left: 'Columns', right: 'Secondary axis comparison' }, { left: 'Values', right: 'Aggregated metric' }, { left: 'Filters', right: 'Analyzed dataset trim' }], explanation: 'Configuring axes correctly avoids misinterpretations.' }] },
      { title: 'Dashboards and executive communication', questions: [{ type: 'choice', text: 'Which criterion makes a dashboard more useful for executives?', options: ['Show all possible metrics', 'Prioritize actionable KPIs with temporal context', 'Use decorative 3D charts', 'Hide calculation assumptions'], ans: 1, explanation: 'The dashboard should facilitate decisions, not just display data.' }, { type: 'truefalse', text: 'A dashboard without KPI definition can lead to contradictory interpretations.', ans: true, explanation: 'Indicators require shared meaning.', textFalse: 'As long as the charts are clear, writing down KPI definitions does not change how the dashboard is read.', explanationFalse: 'Without a shared definition each area computes the indicator its own way and the figures stop being comparable.'  }, { type: 'match', text: 'Match chart and recommended case:', pairs: [{ left: 'Lines', right: 'Temporal evolution' }, { left: 'Bars', right: 'Comparison between categories' }, { left: 'KPI card', right: 'Current key value' }, { left: 'Slicer', right: 'Interactive dimension filtering' }], explanation: 'Choosing appropriate visualization reduces analytical noise.' }] },
    ],
    examSections: [
      { title: 'Commercial analysis case', questions: [{ type: 'choice', text: 'You must consolidate sales from 5 regions with inconsistent codes. Which sequence is more solid?', options: ['Create charts directly', 'Standardize keys, validate integrity, then consolidate metrics', 'Use only conditional formatting', 'Copy data manually sheet by sheet'], ans: 1, explanation: 'Without cleaning and standardization, analysis is unreliable.' }, { type: 'truefalse', text: 'A pivot table can hide source errors if data quality is not validated first.', ans: true, explanation: 'Visualization does not fix defective data.', textFalse: 'The pivot table detects and fixes source-data errors on its own.', explanationFalse: 'A pivot table only aggregates what it receives: if the source has duplicates or wrong types, the totals inherit the error.'  }, { type: 'match', text: 'Match stage and control:', pairs: [{ left: 'Data cleaning', right: 'Remove source inconsistencies' }, { left: 'Formula model', right: 'Calculate repeatable metrics' }, { left: 'Pivot', right: 'Synthesize information by dimension' }, { left: 'Dashboard', right: 'Communicate executive findings' }], explanation: 'The full chain guarantees defensible analysis.' }] },
      { title: 'Report quality governance', questions: [{ type: 'choice', text: 'Which practice reduces recurring errors in monthly reports?', options: ['Edit formulas manually each month', 'Controlled template with validations and closing checklist', 'Remove absolute references', 'Change sheet structure each cycle'], ans: 1, explanation: 'Standardization increases operational reliability.' }, { type: 'truefalse', text: 'Documenting calculation assumptions is part of analytical traceability.', ans: true, explanation: 'It allows audit and work continuity.', textFalse: 'Calculation assumptions do not need documenting as long as the formulas are in the sheet.', explanationFalse: 'The formula shows the how but not the why; without the assumptions nobody can validate or reproduce the analysis.'  }, { type: 'match', text: 'Match risk and mitigation:', pairs: [{ left: 'Incomplete data', right: 'Prior input validation' }, { left: 'Ambiguous metrics', right: 'Formal KPI definition' }, { left: 'Formula errors', right: 'Tests with control cases' }, { left: 'Personal dependency', right: 'Documentation and shared template' }], explanation: 'Reporting quality is a process, not a file.' }] },
    ],
  },
  powerpoint: {
    title: 'PowerPoint',
    requirements: ['Microsoft PowerPoint', 'Defined presentation goal', 'Prepared base content'],
    certModules: ['Visual narrative', 'Slide design', 'Effective animation', 'Executive presentation'],
    docs: { label: 'Official PowerPoint Help' },
    lessons: {
      'powerpoint-l1': { title: 'Presentation narrative structure', section: 'Module 1', description: 'What is an effective narrative and what is it for? You will learn to organize ideas to guide decisions with clarity.', requirements: ['Microsoft PowerPoint', 'Defined presentation goal'], steps: ['Define audience and expected outcome', 'Design index with logical story', 'Assign main message per slide', 'Remove redundant content', 'Validate full flow coherence'], tip: 'A slide should support one main idea, not five.', resources: { docs: 'Create effective presentations' } },
      'powerpoint-l2': { title: 'Visual design and slide master', section: 'Module 2', description: 'What is the slide master and what is it for? You will see how to maintain typographic and visual consistency across the deck.', requirements: ['Defined narrative', 'Prepared base content'], steps: ['Configure color theme and fonts', 'Edit Slide Master with base layouts', 'Apply visual hierarchy of titles', 'Align objects with guides', 'Review global design consistency'], tip: 'If you change style on every slide, you lose visual credibility.', resources: { docs: 'Use slide master' } },
      'powerpoint-l3': { title: 'Charts, data, and executive clarity', section: 'Module 3', description: 'What is communicating data on slides and what is it for? You will learn to transform numbers into actionable messages.', requirements: ['Basic visual design', 'Structured data from Excel or source'], steps: ['Choose chart by question type', 'Highlight key data with contrast', 'Simplify unnecessary legends and axes', 'Link data when appropriate', 'Add explicit conclusion per chart'], tip: 'A chart without insight is decoration, not communication.', resources: { docs: 'Insert charts in PowerPoint' } },
      'powerpoint-l4': { title: 'Animations and transitions with purpose', section: 'Module 4', description: 'What are effective animations and what are they for? This lesson avoids distractions and improves explanation rhythm.', requirements: ['Structured presentation', 'Organized visual content'], steps: ['Apply consistent transition between sections', 'Use simple animations to reveal ideas', 'Control order in animation panel', 'Sync timing with speech', 'Test display in presentation mode'], tip: 'Animation should reinforce message, not compete with it.', resources: { docs: 'Animations in PowerPoint' } },
      'powerpoint-l5': { title: 'Delivery, rehearsal, and Q&A handling', section: 'Module 5', description: 'What is presenting with mastery and what is it for? You will learn to close with impact and answer questions with evidence.', requirements: ['Deck almost ready', 'Basic rehearsal done'], steps: ['Configure presenter mode with notes', 'Rehearse timing per section', 'Prepare backup slides', 'Respond to objections with concrete data', 'Close with clear call to action'], tip: 'Rehearse verbal transitions between slides, not just each slide in isolation.', resources: { docs: 'Present slides with confidence' } },
    },
    quizSections: [
      { title: 'Presentation narrative structure', questions: [{ type: 'choice', text: 'Which practice improves message retention in executive audiences?', options: ['Open with deep technical detail', 'Structure problem-impact-solution story', 'Show all figures without synthesis', 'Avoid explicit conclusions'], ans: 1, explanation: 'Decision-oriented narrative facilitates comprehension.' }, { type: 'truefalse', text: 'Defining audience before designing slides improves content focus.', ans: true, explanation: 'It allows adapting depth and language.', textFalse: 'It is better to design the slides first and think about the audience only when rehearsing.', explanationFalse: 'The audience determines the level of detail and the language; defining it later forces you to redo the content.'  }, { type: 'match', text: 'Match section and narrative goal:', pairs: [{ left: 'Opening', right: 'Set context and objective' }, { left: 'Development', right: 'Support with evidence' }, { left: 'Conclusion', right: 'Propose decision or action' }, { left: 'Q&A', right: 'Resolve key doubts' }], explanation: 'A clear story reduces communication friction.' }] },
      { title: 'Visual design and slide master', questions: [{ type: 'choice', text: 'What operational advantage does using Slide Master provide in long presentations?', options: ['Duplicates file size', 'Centralizes style and avoids inconsistencies between slides', 'Blocks text editing', 'Prevents using charts'], ans: 1, explanation: 'The master reduces repetitive manual work.' }, { type: 'truefalse', text: 'Maintaining consistent palette and typography increases perception of professionalism.', ans: true, explanation: 'Visual coherence conveys clarity and rigor.', textFalse: 'Varying the palette and typography on every slide makes the presentation look more professional.', explanationFalse: 'Constant variation distracts and undermines credibility; consistency is what reads as professional.'  }, { type: 'match', text: 'Match design element and function:', pairs: [{ left: 'Typography', right: 'Hierarchy reading' }, { left: 'Color', right: 'Prioritize visual attention' }, { left: 'White space', right: 'Reduce cognitive saturation' }, { left: 'Alignment', right: 'Order composition' }], explanation: 'Consistent design sustains the narrative.' }] },
      { title: 'Charts, data, and executive clarity', questions: [{ type: 'choice', text: 'What is the main error when presenting complex data?', options: ['Select chart by question', 'Show visuals without explicit insight', 'Highlight key metrics', 'Compare homogeneous periods'], ans: 1, explanation: 'Without interpretation, data does not guide decisions.' }, { type: 'truefalse', text: 'A chart should answer a specific business question.', ans: true, explanation: 'Visualization without purpose generates noise.', textFalse: 'A good chart should show every available metric so the audience can choose what to look at.', explanationFalse: 'A chart that shows everything communicates nothing; each one should answer a specific question.'  }, { type: 'match', text: 'Match chart and recommended use:', pairs: [{ left: 'Line', right: 'Trend over time' }, { left: 'Bars', right: 'Compare categories' }, { left: 'Area', right: 'Accumulated evolution' }, { left: 'KPI card', right: 'Show critical point value' }], explanation: 'Choosing correct visual increases comprehension.' }] },
      { title: 'Animations and transitions with purpose', questions: [{ type: 'choice', text: 'Which criterion defines professional animation in executive context?', options: ['Maximum visual complexity', 'Support explanation rhythm without distracting', 'Change effect on every slide', 'Apply default effects to everything'], ans: 1, explanation: 'Animation should be functional, not ornamental.' }, { type: 'truefalse', text: 'Too many different transitions reduce audience focus on central message.', ans: true, explanation: 'Consistency helps maintain cognitive attention.', textFalse: 'The more different transitions you use, the more attention the audience pays to the message.', explanationFalse: 'The effect draws attention to itself and competes with the content; one consistent transition works better.'  }, { type: 'match', text: 'Match resource and expected effect:', pairs: [{ left: 'Fade', right: 'Discrete transition between ideas' }, { left: 'Appear by blocks', right: 'Content reveal control' }, { left: 'Morph', right: 'Visual continuity between states' }, { left: 'No animation', right: 'Prioritize clear static content' }], explanation: 'Choice depends on communicative intent.' }] },
      { title: 'Delivery, rehearsal, and Q&A handling', questions: [{ type: 'choice', text: 'Which practice improves performance on difficult questions?', options: ['Read literal text from slide', 'Prepare backup evidence and objection scenarios', 'Improvise without data', 'Avoid Q&A section'], ans: 1, explanation: 'Preparation anticipates communication risks.' }, { type: 'truefalse', text: 'Rehearsing timing per section reduces overload at end of presentation.', ans: true, explanation: 'It manages pace and content coverage.', textFalse: 'Rehearsing only the total duration is enough to avoid running out of time at the end.', explanationFalse: 'The total does not reveal where the delay builds up; without per-section timings you rush the last slides.'  }, { type: 'match', text: 'Match phase and preparation focus:', pairs: [{ left: 'Pre-rehearsal', right: 'Adjust narrative and sequence' }, { left: 'Technical rehearsal', right: 'Validate equipment and format' }, { left: 'Presentation', right: 'Connect message with audience' }, { left: 'Post-session', right: 'Collect feedback to iterate' }], explanation: 'Presenting well is an iterative process.' }] },
    ],
    examSections: [
      { title: 'Strategic results presentation', questions: [{ type: 'choice', text: 'You must present quarterly results to leadership with limited time. Which approach maximizes impact?', options: ['Show all operational detail', 'Synthesize critical findings, risks, and recommended decisions', 'Use only flashy animations', 'Read each complete table'], ans: 1, explanation: 'Leadership needs clarity to decide quickly.' }, { type: 'truefalse', text: 'An explicit conclusion per section helps audience remember key messages.', ans: true, explanation: 'Structure and synthesis improve retention.', textFalse: 'Leaving conclusions implicit makes the audience remember the key messages better.', explanationFalse: 'If the conclusion is not stated, each person leaves with a different one; making it explicit is what fixes the message.'  }, { type: 'match', text: 'Match challenge and professional response:', pairs: [{ left: 'Reduced time', right: 'Prioritize high-impact messages' }, { left: 'Heterogeneous audience', right: 'Clear language with technical annexes' }, { left: 'Data objections', right: 'Verifiable evidence and source' }, { left: 'Pending decision', right: 'Actionable final recommendation' }], explanation: 'Presentation value lies in enabling decisions.' }] },
      { title: 'Executive communication quality', questions: [{ type: 'choice', text: 'Which signal indicates a well-governed presentation in teams?', options: ['Different styles per author', 'Templates, guides, and standardized prior review', 'No version control', 'Last-minute changes without record'], ans: 1, explanation: 'Standardization protects quality and reputation.' }, { type: 'truefalse', text: 'Documenting final version and PDF backup reduces operational risk at events.', ans: true, explanation: 'It prevents failures from compatibility or accidental editing.', textFalse: 'Bringing only the editable file in the cloud is the safest option for presenting at an event.', explanationFalse: 'Without connectivity or with a different app version the file may not open; a PDF backup guarantees the presentation.'  }, { type: 'match', text: 'Match control and result:', pairs: [{ left: 'Prior checklist', right: 'Fewer live errors' }, { left: 'Visual guide', right: 'Consistency between presenters' }, { left: 'Rehearsal with timer', right: 'Time compliance' }, { left: 'Backup slides', right: 'Solid answer to questions' }], explanation: 'Presentation excellence is built with processes.' }] },
    ],
  },
  sql: {
    title: 'SQL',
    requirements: ['SQL engine available (PostgreSQL/MySQL)', 'Practice dataset', 'SQL editor or client'],
    certModules: ['Basic queries', 'JOINs and aggregations', 'Subqueries/CTE', 'Optimization and security'],
    docs: { label: 'PostgreSQL documentation' },
    lessons: {
      'sql-l1': { title: 'SELECT, filters, and sorting', section: 'Module 1', description: 'What is SQL and what is it for? You will start querying data with precision using filters and sorting.', requirements: ['SQL engine available', 'Practice dataset'], steps: ['Connect to sample database', 'Execute SELECT with explicit columns', 'Filter with WHERE and logical operators', 'Sort with ORDER BY', 'Limit results for quick analysis'], tip: 'Avoid SELECT * in production queries for clarity and performance.', resources: { docs: 'Basic SQL tutorial' } },
      'sql-l2': { title: 'JOINs and table relationships', section: 'Module 2', description: 'What is combining tables and what is it for? You will learn to join related data without losing business context.', requirements: ['Basic SELECT and WHERE', 'Simple relational model'], steps: ['Identify primary and foreign keys', 'Apply INNER JOIN in base case', 'Use LEFT JOIN to preserve missing rows', 'Detect duplicates by cardinality', 'Validate results with control counts'], tip: 'First understand table relationship; then write the JOIN.', resources: { docs: 'JOIN in PostgreSQL' } },
      'sql-l3': { title: 'GROUP BY and aggregate functions', section: 'Module 3', description: 'What is aggregating data and what is it for? You will see how to obtain useful metrics for decisions without losing traceability.', requirements: ['Basic JOINs', 'Filter handling'], steps: ['Calculate COUNT, SUM, and AVG by category', 'Separate row filters and group filters', 'Use HAVING in aggregations', 'Handle nulls with COALESCE', 'Compare metrics between periods'], tip: 'Every non-aggregated column in SELECT must go in GROUP BY.', resources: { docs: 'Aggregate functions' } },
      'sql-l4': { title: 'Subqueries and CTEs', section: 'Module 4', description: 'What are CTEs and what are they for? You will learn to structure complex queries in readable and maintainable blocks.', requirements: ['GROUP BY mastery', 'Intermediate queries'], steps: ['Build filter subquery', 'Migrate logic to CTE with WITH', 'Chain two CTEs for analytical pipeline', 'Compare readability and initial performance', 'Refactor query for team review'], tip: 'Use CTE for clarity, but validate execution plan on large volumes.', resources: { docs: 'WITH queries (CTE)' } },
      'sql-l5': { title: 'Optimization, indexes, and security', section: 'Module 5', description: 'What is optimizing SQL and what is it for? This lesson covers performance, integrity, and practices against SQL injection.', requirements: ['Functional complex queries', 'EXPLAIN access in test environment'], steps: ['Interpret plan with EXPLAIN', 'Create index on filter columns', 'Compare performance before/after', 'Apply parameterized queries in application', 'Review minimum user privileges'], tip: 'Optimize with plan and timing evidence, not intuition.', resources: { docs: 'Indexes and performance' } },
    },
    quizSections: [
      { title: 'SELECT, filters, and sorting', questions: [{ type: 'choice', text: 'Which practice improves maintainability in reporting queries?', options: ['SELECT * in all views', 'Select explicit columns and clear aliases', 'Always sort by numeric position', 'Remove WHERE clause'], ans: 1, explanation: 'Explicit intent facilitates evolution and audit.' }, { type: 'truefalse', text: 'WHERE filters rows before any aggregation.', ans: true, explanation: 'It applies in early evaluation stages.', textFalse: 'WHERE is applied after grouping, so it can filter on the results of SUM or COUNT.', explanationFalse: 'WHERE runs before GROUP BY; to filter on aggregated values you use HAVING.'  }, { type: 'match', text: 'Match clause and function:', pairs: [{ left: 'SELECT', right: 'Define output columns' }, { left: 'FROM', right: 'Indicate data source' }, { left: 'WHERE', right: 'Apply row filters' }, { left: 'ORDER BY', right: 'Sort final result' }], explanation: 'Understanding query logical flow is essential.' }] },
      { title: 'JOINs and table relationships', questions: [{ type: 'choice', text: 'What risk appears when joining tables with unanalyzed cardinality?', options: ['Automatic better performance', 'Unexpected row duplication and metrics', 'Data compression', 'SQL engine lock'], ans: 1, explanation: 'Misunderstood cardinality distorts results.' }, { type: 'truefalse', text: 'LEFT JOIN preserves all left table rows even without match.', ans: true, explanation: 'Right columns may be NULL.', textFalse: 'LEFT JOIN discards rows from the left table that find no match on the right.', explanationFalse: 'That is INNER JOIN behaviour; LEFT JOIN keeps the left table and fills the gaps with NULL.'  }, { type: 'match', text: 'Match JOIN type and result:', pairs: [{ left: 'INNER JOIN', right: 'Only matches in both tables' }, { left: 'LEFT JOIN', right: 'All left + right matches' }, { left: 'RIGHT JOIN', right: 'All right + left matches' }, { left: 'CROSS JOIN', right: 'Cartesian product of rows' }], explanation: 'Choosing correct JOIN avoids misinterpretations.' }] },
      { title: 'GROUP BY and aggregate functions', questions: [{ type: 'choice', text: 'When to use HAVING instead of WHERE?', options: ['To filter indexed columns', 'To filter aggregated results by group', 'To sort descending', 'To create indexes'], ans: 1, explanation: 'HAVING operates after aggregation.' }, { type: 'truefalse', text: 'COUNT(DISTINCT field) helps measure uniqueness in large sets.', ans: true, explanation: 'It reduces overcounting from duplicates.', textFalse: 'COUNT(DISTINCT field) returns the total number of rows, just like COUNT(*).', explanationFalse: 'COUNT(*) counts rows; COUNT(DISTINCT field) counts unique values, which is what measures uniqueness.'  }, { type: 'match', text: 'Match function and analytical goal:', pairs: [{ left: 'COUNT', right: 'Record quantity' }, { left: 'SUM', right: 'Numeric accumulation' }, { left: 'AVG', right: 'Value average' }, { left: 'MAX', right: 'Maximum observed value' }], explanation: 'Aggregate functions answer key business questions.' }] },
      { title: 'Subqueries and CTEs', questions: [{ type: 'choice', text: 'What main advantage does a CTE provide in extensive queries?', options: ['Execute in infinite memory', 'Divide complex logic into readable blocks', 'Avoid any execution cost', 'Automatically replace indexes'], ans: 1, explanation: 'Readability improves review and maintenance.' }, { type: 'truefalse', text: 'A correlated subquery can affect performance if executed per row.', ans: true, explanation: 'Execution plan should be evaluated.', textFalse: 'A correlated subquery runs only once, so its cost is independent of data volume.', explanationFalse: 'A correlated subquery is evaluated once per outer row: its cost grows with volume.'  }, { type: 'match', text: 'Match technique and use:', pairs: [{ left: 'CTE', right: 'Logical pipeline in steps' }, { left: 'Scalar subquery', right: 'Derived single value' }, { left: 'EXISTS', right: 'Verify existence efficiently' }, { left: 'IN', right: 'Compare with value set' }], explanation: 'Choosing appropriate technique impacts clarity and performance.' }] },
      { title: 'Optimization, indexes, and security', questions: [{ type: 'choice', text: 'Which measure reduces SQL injection risk in applications?', options: ['Concatenate user input in query', 'Use parameterized queries', 'Give superuser permissions to app', 'Hide errors without logging'], ans: 1, explanation: 'Separating data from instruction mitigates injection.' }, { type: 'truefalse', text: 'An index can speed reads but also has maintenance cost on writes.', ans: true, explanation: 'Every optimization involves trade-offs.', textFalse: 'Adding indexes only brings benefits, so it is best to index every column.', explanationFalse: 'Every index must be updated on INSERT, UPDATE, and DELETE, and takes space: over-indexing penalises writes.'  }, { type: 'match', text: 'Match practice and effect:', pairs: [{ left: 'EXPLAIN', right: 'Inspect execution plan' }, { left: 'Index', right: 'Speed frequent filters/joins' }, { left: 'Prepared statement', right: 'Query security and reuse' }, { left: 'Least privilege', right: 'Reduce damage surface' }], explanation: 'Performance and security should evolve together.' }] },
    ],
    examSections: [
      { title: 'Relational data analysis', questions: [{ type: 'choice', text: 'You must build a monthly sales report with multiple dimensions and high volume. Which approach is more robust?', options: ['Single unstructured query without validation', 'CTEs per stage, validated joins, and audited aggregations', 'Export everything to Excel without SQL', 'Duplicate tables for each report'], ans: 1, explanation: 'Structuring SQL pipeline improves reliability and maintainability.' }, { type: 'truefalse', text: 'Without validating JOIN cardinality, aggregated metrics can be inflated.', ans: true, explanation: 'Relational integrity is critical for analytical accuracy.', textFalse: 'Join cardinality does not affect totals, because SQL avoids duplicating rows automatically.', explanationFalse: 'A one-to-many join duplicates rows from the left table and inflates the sums; cardinality must be validated.'  }, { type: 'match', text: 'Match problem and technical control:', pairs: [{ left: 'High latency', right: 'Plan analysis and adequate indexes' }, { left: 'Incorrect count', right: 'JOIN and DISTINCT review' }, { left: 'Security failures', right: 'Parameters and minimum privileges' }, { left: 'Illegible query', right: 'Refactor with semantic CTEs' }], explanation: 'Good SQL design balances accuracy, performance, and security.' }] },
      { title: 'Query operational quality', questions: [{ type: 'choice', text: 'Which practice facilitates maintenance of critical queries by multiple analysts?', options: ['Queries without aliases or comments', 'Style standard, naming, and peer review', 'Change field names in every report', 'Exclude validation tests'], ans: 1, explanation: 'Standardization reduces dependency on a single person.' }, { type: 'truefalse', text: 'Versioning SQL scripts in repository improves business change traceability.', ans: true, explanation: 'It allows audit and reliable rollback.', textFalse: 'Keeping SQL scripts in a shared folder offers the same traceability as versioning them.', explanationFalse: 'The folder stores the current file; the repository stores who changed what, when, and why.'  }, { type: 'match', text: 'Match artifact and benefit:', pairs: [{ left: 'Versioned script', right: 'Technical decision history' }, { left: 'Test dataset', right: 'Reproducible validation' }, { left: 'QA checklist', right: 'Early inconsistency detection' }, { left: 'Assumption documentation', right: 'Correct metric interpretation' }], explanation: 'Mature analytical operation requires engineering discipline.' }] },
    ],
  },
  cybersecurity: {
    title: 'Cybersecurity',
    requirements: ['Updated browser', 'Test email account', 'Basic internet and account knowledge'],
    certModules: ['CIA fundamentals', 'Common threats', 'Preventive controls', 'Incident response'],
    docs: { label: 'OWASP Top 10' },
    lessons: {
      'cybersecurity-l1': { title: 'Digital security fundamentals', section: 'Module 1', description: 'What is cybersecurity and what is it for? You will understand how to protect information, systems, and people in digital environments.', requirements: ['Updated browser', 'Basic internet and account knowledge'], steps: ['Define confidentiality, integrity, and availability', 'Identify critical information assets', 'Recognize basic attack surface', 'Relate risks to business impact', 'Create initial list of priority controls'], tip: 'Security is not a product, it is a continuous practice.', resources: { docs: 'OWASP introduction' } },
      'cybersecurity-l2': { title: 'Phishing and social engineering', section: 'Module 2', description: 'What is social engineering and what is it for in attacks? You will learn to detect early signs of digital manipulation.', requirements: ['Test email account', 'Attention to fraud patterns'], steps: ['Analyze sender and real domain', 'Detect urgency and manipulative language', 'Validate links before opening', 'Report suspicious messages to official channel', 'Simulate safe response to fraud attempt'], tip: 'When something sounds urgent and unusual, verify through another channel.', resources: { docs: 'Anti-phishing guide' } },
      'cybersecurity-l3': { title: 'Passwords, MFA, and access control', section: 'Module 3', description: 'What is protecting credentials and what is it for? This lesson reduces risk of unauthorized access in personal and corporate accounts.', requirements: ['Basic digital account knowledge', 'Access to security settings'], steps: ['Create unique and long passwords', 'Configure password manager', 'Enable MFA on critical services', 'Review active sessions and devices', 'Remove obsolete or insecure access'], tip: 'Reusing passwords multiplies impact of a single breach.', resources: { docs: 'NIST multi-factor authentication' } },
      'cybersecurity-l4': { title: 'Malware, ransomware, and endpoint protection', section: 'Module 4', description: 'What is malware and what is it for in an attack? You will see how to prevent infections and limit operational damage.', requirements: ['Updated device', 'Access to basic antivirus or EDR'], steps: ['Differentiate common malware types', 'Configure automatic updates', 'Review safe download policy', 'Define verified backup strategy', 'Practice initial response to infection'], tip: 'An untested backup is only a recovery assumption.', resources: { docs: 'CISA best practices' } },
      'cybersecurity-l5': { title: 'Incident response and security culture', section: 'Module 5', description: 'What is responding to incidents and what is it for? You will learn to act quickly, contain impact, and improve post-incident processes.', requirements: ['Threat and control concepts', 'Defined internal communication channels'], steps: ['Detect and classify reported incident', 'Contain scope with immediate actions', 'Escalate to appropriate team by criticality', 'Document evidence and timeline', 'Conduct retrospective with preventive improvements'], tip: 'Speed matters, but documentation also saves future operations.', resources: { docs: 'NIST Incident Response' } },
    },
    quizSections: [
      { title: 'Digital security fundamentals', questions: [{ type: 'choice', text: 'Which situation directly compromises data confidentiality?', options: ['Encrypted backup copy', 'Unauthorized access to sensitive information', 'Operating system update', 'Availability monitoring'], ans: 1, explanation: 'Confidentiality is violated when someone who should not sees data.' }, { type: 'truefalse', text: 'The CIA triad is the basis for evaluating security risks.', ans: true, explanation: 'It allows classifying impact and prioritizing controls.', textFalse: 'The CIA triad refers to cost, implementation, and audit of security controls.', explanationFalse: 'CIA stands for confidentiality, integrity, and availability: the three pillars risk is assessed against.'  }, { type: 'match', text: 'Match pillar and focus:', pairs: [{ left: 'Confidentiality', right: 'Restrict improper access' }, { left: 'Integrity', right: 'Prevent unauthorized alteration' }, { left: 'Availability', right: 'Timely service access' }, { left: 'Risk', right: 'Probability times impact' }], explanation: 'Every security program starts from these concepts.' }] },
      { title: 'Phishing and social engineering', questions: [{ type: 'choice', text: 'What is the best first response to urgent email requesting credentials?', options: ['Respond immediately to avoid lockout', 'Verify authenticity through alternate channel and report', 'Open link in incognito mode', 'Forward to everyone to confirm'], ans: 1, explanation: 'External verification avoids falling for manipulation.' }, { type: 'truefalse', text: 'Artificial urgency is a common social engineering tactic.', ans: true, explanation: 'It seeks to reduce victim critical thinking.', textFalse: 'A message that creates urgency is a sign the request is legitimate and comes from an official channel.', explanationFalse: 'Urgency is precisely the tactic that prevents verification; when it is unexpected, distrust it and confirm through another channel.'  }, { type: 'match', text: 'Match signal and associated risk:', pairs: [{ left: 'Suspicious domain', right: 'Identity impersonation' }, { left: 'Unexpected attachment', right: 'Possible malware' }, { left: 'Secret request', right: 'Credential theft' }, { left: 'Writing errors', right: 'Probable fraudulent campaign' }], explanation: 'Recognizing early signals breaks the attack chain.' }] },
      { title: 'Passwords, MFA, and access control', questions: [{ type: 'choice', text: 'Which practice most reduces credential stuffing risk?', options: ['Repeat password with minimal variations', 'Unique passwords + manager + MFA', 'Change password only once a year', 'Share passwords via internal chat'], ans: 1, explanation: 'Control combination reduces automated attack success.' }, { type: 'truefalse', text: 'MFA remains useful even if a password is leaked.', ans: true, explanation: 'It adds additional barrier to unauthorized access.', textFalse: 'If the password leaks, MFA no longer provides any protection.', explanationFalse: 'That is exactly the scenario where MFA saves the account: the attacker still lacks the second factor.'  }, { type: 'match', text: 'Match control and benefit:', pairs: [{ left: 'Password manager', right: 'Long unique keys without memorizing all' }, { left: 'MFA', right: 'Second authentication factor' }, { left: 'Session review', right: 'Detect unexpected access' }, { left: 'Least privilege principle', right: 'Reduce compromised account impact' }], explanation: 'Identity protection requires complementary layers.' }] },
      { title: 'Malware, ransomware, and endpoint protection', questions: [{ type: 'choice', text: 'Which measure reduces operational impact of ransomware?', options: ['Turn off antivirus for better speed', 'Disconnected and periodically tested backups', 'Allow unknown macros', 'Use unpatched software'], ans: 1, explanation: 'Recovery depends on verified intact copies.' }, { type: 'truefalse', text: 'Patching systems reduces exposure to known vulnerabilities.', ans: true, explanation: 'Opportunistic attacks exploit outdated software.', textFalse: 'Patching should be postponed indefinitely, because every update introduces more risk than it removes.', explanationFalse: 'Known vulnerabilities are the most exploited ones; the patch closes the exposure window.'  }, { type: 'match', text: 'Match threat and recommended control:', pairs: [{ left: 'Ransomware', right: 'Backup + segmentation + rapid response' }, { left: 'Trojan', right: 'Downloads only from trusted sources' }, { left: 'Spyware', right: 'Endpoint detection and monitoring' }, { left: 'Malicious USB', right: 'Device policy and automatic blocking' }], explanation: 'Preventive and response controls must coexist.' }] },
      { title: 'Incident response and security culture', questions: [{ type: 'choice', text: 'Which initial step is critical when detecting active incident?', options: ['Wait for final confirmation without acting', 'Contain and escalate per defined severity', 'Publish details on social media', 'Restart everything without preserving evidence'], ans: 1, explanation: 'Early containment reduces damage and facilitates investigation.' }, { type: 'truefalse', text: 'Documenting incident timeline helps improve future controls.', ans: true, explanation: 'It enables organizational learning and audit.', textFalse: 'Once the incident is contained, documenting the timeline no longer adds value to the team.', explanationFalse: 'The timeline reveals where detection and response failed; without it the same incident repeats.'  }, { type: 'match', text: 'Match response phase and purpose:', pairs: [{ left: 'Detection', right: 'Identify suspicious event' }, { left: 'Containment', right: 'Limit impact propagation' }, { left: 'Eradication', right: 'Remove root cause' }, { left: 'Lessons learned', right: 'Strengthen future prevention' }], explanation: 'Effective response is cyclic and improves with each event.' }] },
    ],
    examSections: [
      { title: 'Real incident scenario', questions: [{ type: 'choice', text: 'A collaborator ran a suspicious attachment and reports anomalous behavior. Which sequence is most correct?', options: ['Ignore until more reports', 'Isolate equipment, notify SOC/IT, preserve evidence, and assess scope', 'Format immediately without record', 'Share file with more users to compare'], ans: 1, explanation: 'Early containment and evidence are critical.' }, { type: 'truefalse', text: 'Without formal reporting channel, incident response time notably worsens.', ans: true, explanation: 'Communication governance impacts resilience.', textFalse: 'Reporting incidents through informal channels speeds up response compared with a formal channel.', explanationFalse: 'Without a formal channel the alert gets lost among messages and nobody owns it; response time soars.'  }, { type: 'match', text: 'Match symptom and initial action:', pairs: [{ left: 'Unusual network activity', right: 'Isolate endpoint and monitor traffic' }, { left: 'Compromised account', right: 'Force reset and revoke sessions' }, { left: 'Mass encrypted files', right: 'Activate anti-ransomware plan' }, { left: 'Internal fraudulent email', right: 'Block campaign and alert users' }], explanation: 'Speed in first response defines final damage.' }] },
      { title: 'Organizational cybersecurity maturity', questions: [{ type: 'choice', text: 'Which practice reflects greater security maturity in an organization?', options: ['Optional annual training without follow-up', 'Continuous training, drills, and improvement based on incidents', 'Only buying tools without processes', 'Policies without defined owners'], ans: 1, explanation: 'Culture and processes sustain technological controls.' }, { type: 'truefalse', text: 'Effective security requires shared responsibility between business, IT, and users.', ans: true, explanation: 'It does not depend on a single isolated team.', textFalse: 'Security is solely the IT department responsibility and does not involve business or users.', explanationFalse: 'Most incidents come in through users or business decisions: the responsibility is shared.'  }, { type: 'match', text: 'Match capability and result:', pairs: [{ left: 'Continuous awareness', right: 'Lower successful phishing rate' }, { left: 'Tested response plan', right: 'Faster recovery' }, { left: 'Patch management', right: 'Lower exposure to known CVEs' }, { left: 'Periodic audit', right: 'Visibility of gaps and compliance' }], explanation: 'Maturity is built with continuous operational discipline.' }] },
    ],
  },
};

if (typeof module !== 'undefined') module.exports = { LEVELS_EN, CURRICULUM_EN };


;/* --- src/js/locales/curriculum-zh.js --- */
'use strict';

const LEVELS_ZH = {
  Principiante: '初级',
  Intermedio: '中级',
  Avanzado: '高级',
};

const CURRICULUM_ZH = {
  canvas: {
    title: 'Canva',
    requirements: ['有效的 Canva 账户', '稳定的网络连接', '基础视觉设计知识'],
    certModules: ['Canva 基础', '品牌设计', '专业导出', '协作与审阅'],
    docs: { label: 'Canva 帮助中心' },
    lessons: {
      'canvas-l1': {
        title: 'Canva 基础',
        section: '模块 1',
        description: '什么是 Canva？它有什么用途？本课介绍其作为视觉设计平台的定位，帮助您无需从零开始即可创作专业作品。',
        requirements: ['有效的 Canva 账户', '稳定的网络连接'],
        steps: ['创建账户并进入主仪表盘', '使用预设格式打开新设计', '识别侧边栏、画布和顶部菜单', '添加文字、图片和基本形状', '保存并导出第一个版本'],
        tip: '选择模板前先明确目标和受众，避免返工。',
        resources: { docs: 'Canva 官方入门指南' },
      },
      'canvas-l2': {
        title: '模板与视觉一致性',
        section: '模块 2',
        description: '什么是模板？它们有什么用途？您将学习如何策略性地调整模板，同时保持视觉识别和信息清晰度。',
        requirements: ['有效的 Canva 账户', '稳定的网络连接'],
        steps: ['选择与目标一致的模板', '更改品牌字体和颜色', '调整标题和副标题的视觉层级', '用自有内容替换图片', '复制设计以创建活动变体'],
        tip: '先调整结构，再处理细节，以保持一致性。',
        resources: { docs: '在 Canva 中使用模板' },
      },
      'canvas-l3': {
        title: '构图与可读性',
        section: '模块 3',
        description: '什么是构图？它有什么用途？本课教您如何分配元素以引导注意力并提高理解度。',
        requirements: ['Canva 基础知识', '初步视觉判断能力'],
        steps: ['应用三分法则分配元素', '用色彩对比突出操作', '使用智能参考线对齐对象', '有意识地控制留白', '在移动端和桌面端检查可读性'],
        tip: '如果什么都突出，就什么都不突出：每件作品只保留一个视觉焦点。',
        resources: { docs: 'Canva 设计原则' },
      },
      'canvas-l4': {
        title: '按渠道导出',
        section: '模块 4',
        description: '什么是正确导出？它有什么用途？您将了解如何按发布目标选择格式，以保留质量和性能。',
        requirements: ['Canva 基础知识', '明确的发布目标'],
        steps: ['确定最终渠道：印刷、网页或演示', '按需选择 PNG、JPG、PDF 或 MP4 格式', '如适用，配置质量和透明度', '发布前检查文件大小', '在目标设备上测试结果'],
        tip: '印刷勿用 JPG；请使用高质量 PDF。',
        resources: { docs: '下载和导出设计' },
      },
      'canvas-l5': {
        title: '团队协作工作流',
        section: '模块 5',
        description: '什么是 Canva 协作？它有什么用途？您将学习审阅实践、评论和视觉版本控制。',
        requirements: ['Canva 中级知识', '明确的团队工作流'],
        steps: ['以适当权限分享设计', '使用评论提供上下文反馈', '创建命名清晰的版本', '整合负责人批准的修改', '发布最终版本并归档迭代'],
        tip: '设定修改截止日期，避免无休止的迭代。',
        resources: { docs: 'Canva 协作' },
      },
    },
    quizSections: [
      {
        title: 'Canva 基础',
        questions: [
          { type: 'choice', text: '在专业工作流中，早期阶段使用 Canva 的主要原因是什么？', options: ['自动化服务器', '快速、一致地原型化视觉作品', '管理数据库', '编译前端代码'], ans: 1, explanation: 'Canva 可在低技术门槛下加速视觉验证。' },
          { type: 'truefalse', text: 'Canva 支持在浏览器中工作并集中管理协作资源。', ans: true, explanation: '其云端模式便于访问和共享编辑。', textFalse: 'Canva 必须安装桌面套件，每个人只能把品牌素材保存在自己的电脑上。', explanationFalse: 'Canva 是云端工具：在浏览器中工作，品牌素材集中保存供整个团队使用。'  },
          { type: 'match', text: '匹配 Canva 中的功能与用途：', pairs: [{ left: '模板', right: '可编辑基础，加速制作' }, { left: '元素', right: '可复用图形资源' }, { left: '导出', right: '按渠道生成最终文件' }, { left: '评论', right: '团队上下文审阅' }], explanation: '每个模块覆盖设计工作流的一部分。' },
        ],
      },
      {
        title: '模板与视觉一致性',
        questions: [
          { type: 'choice', text: '若品牌要求在 12 件作品中保持一致，哪种做法最能减少错误？', options: ['每件作品从零设计', '使用具有一致样式的基础模板', '每篇帖子更换字体', '不经审阅直接导出'], ans: 1, explanation: '统一基础确保识别一致性。' },
          { type: 'truefalse', text: '编辑模板而不检查字体层级通常会降低信息清晰度。', ans: true, explanation: '视觉层级决定阅读和理解。', textFalse: '只要文字能放进模板，排版层级就不会影响信息的清晰度。', explanationFalse: '排版层级决定阅读顺序；编辑时若不检查，即使文字放得下，信息也会变得不清晰。'  },
          { type: 'match', text: '匹配决策与预期结果：', pairs: [{ left: '固定色板', right: '可识别的视觉识别' }, { left: '主字体', right: '一致的阅读体验' }, { left: '边距系统', right: '稳定的视觉秩序' }, { left: '复制版本', right: '在不破坏基础的情况下做变体' }], explanation: '标准化组件避免不一致。' },
        ],
      },
      {
        title: '构图与可读性',
        questions: [
          { type: 'choice', text: '在含行动号召的作品中，哪种决策更能提高转化？', options: ['使用五种高对比色', '突出单一视觉焦点和留白', '将 CTA 缩到最小', '去掉文字层级'], ans: 1, explanation: '清晰焦点降低认知负担。' },
          { type: 'truefalse', text: '发布前应在最终设备上验证可读性。', ans: true, explanation: '移动端与桌面端的阅读尺度不同。', textFalse: '只要设计在设计师自己的显示器上易读，就可以视为通过。', explanationFalse: '移动端与桌面端的阅读比例不同：必须在实际发布的设备上验证。'  },
          { type: 'match', text: '匹配原则与益处：', pairs: [{ left: '对比', right: '突出关键信息' }, { left: '对齐', right: '减少视觉噪音' }, { left: '留白', right: '提高理解度' }, { left: '层级', right: '定义阅读顺序' }], explanation: '这些是功能性设计的基础。' },
        ],
      },
      {
        title: '按渠道导出',
        questions: [
          { type: 'choice', text: '在 Canva 中，高质量印刷最适合哪种格式？', options: ['GIF', '印刷用 PDF', 'TXT', '高度压缩的 WEBP'], ans: 1, explanation: 'PDF 保留细节并与印刷店兼容。' },
          { type: 'truefalse', text: '理想格式取决于分发渠道和文件最终用途。', ans: true, explanation: '没有一种格式适合所有场景。', textFalse: '存在一种通用的导出格式，对印刷、网页和社交媒体同样适用。', explanationFalse: '没有通用格式：印刷用 PDF，网页用 PNG 或 JPG，视频用 MP4，取决于渠道和最终用途。'  },
          { type: 'match', text: '匹配格式与用例：', pairs: [{ left: 'PNG', right: '清晰度好的数字图像' }, { left: 'JPG', right: '轻量网页摄影文件' }, { left: 'PDF', right: '印刷或正式交付文档' }, { left: 'MP4', right: '动画视觉内容' }], explanation: '格式选择影响质量和性能。' },
        ],
      },
      {
        title: '团队协作工作流',
        questions: [
          { type: 'choice', text: '在分布式团队中，哪种做法改善审阅可追溯性？', options: ['无上下文发送聊天截图', '使用设计评论和带标签的版本', '允许无角色编辑', '跳过最终批准'], ans: 1, explanation: '上下文反馈减少歧义。' },
          { type: 'truefalse', text: '明确最终审批人可避免模糊决策造成的阻塞。', ans: true, explanation: '明确责任加快收尾。', textFalse: '把最终审批权交给整个团队可以加快项目收尾。', explanationFalse: '没有明确责任人，决策就会被稀释，项目会陷入无休止的评审。'  },
          { type: 'match', text: '匹配角色与职责：', pairs: [{ left: '编辑', right: '实施设计修改' }, { left: '审阅者', right: '评估质量与一致性' }, { left: '利益相关方', right: '验证业务目标' }, { left: '最终审批人', right: '授权发布' }], explanation: '清晰角色避免返工。' },
        ],
      },
    ],
    examSections: [
      {
        title: '视觉活动实践案例',
        questions: [
          { type: 'choice', text: '您必须在 2 小时内交付多格式活动。哪种策略更稳健？', options: ['无结构地手动创建每种格式', '定义主模板、品牌样式并复制变体', '只设计一件并拉伸尺寸', '全部导出为单一格式'], ans: 1, explanation: '先标准化可优化速度和质量。' },
          { type: 'truefalse', text: '发布前在真实设备上最终审阅可减少阅读和裁剪错误。', ans: true, explanation: '上下文验证是质量控制的一部分。', textFalse: '编辑器的预览足以在发布前排除裁切错误。', explanationFalse: '预览无法还原真实的裁切和比例；只有在最终设备上检查才能避免这些错误。'  },
          { type: 'match', text: '匹配问题与专业修复：', pairs: [{ left: '文字难读', right: '提高对比度和字号' }, { left: '构图过满', right: '应用留白' }, { left: '品牌不一致', right: '复用已定义样式' }, { left: '文件过大', right: '按渠道优化导出' }], explanation: '修复常见问题需要技术和视觉标准。' },
        ],
      },
      {
        title: '治理与最终交付',
        questions: [
          { type: 'choice', text: '若两名设计师并行编辑且决策冲突，哪种工作流最小化返工？', options: ['不经审阅发布最新版本', '对比评论、整合到基础版本并正式批准', '丢弃两位设计师的工作', '要求无限期修改'], ans: 1, explanation: '按标准引导整合可避免质量损失。' },
          { type: 'truefalse', text: '没有版本命名策略，难以审计哪个文件已获批准。', ans: true, explanation: '文档可追溯性是设计运营的关键。', textFalse: '只要文件在共享文件夹里，不需要命名规范也能知道哪个是已批准的版本。', explanationFalse: '没有版本命名规范，没人能区分已批准文件和草稿；可追溯性依赖于命名。'  },
          { type: 'match', text: '匹配证据与质量审计：', pairs: [{ left: '评论历史', right: '证明所做决策' }, { left: '带标签的最终版本', right: '唯一发布参考' }, { left: '导出清单', right: '避免错误格式' }, { left: '记录批准', right: '闭合运营周期' }], explanation: '最终质量也取决于交付流程。' },
        ],
      },
    ],
  },
  figma: {
    title: 'Figma',
    requirements: ['Figma 账户', '网络连接', '基础界面知识'],
    certModules: ['Figma 基础', '组件与变体', 'UX 原型', '开发交付'],
    docs: { label: 'Figma 帮助中心' },
    lessons: {
      'figma-l1': { title: '什么是 Figma？如何开始？', section: '模块 1', description: '什么是 Figma？它有什么用途？您将了解其协作式设计界面和实时原型的方法。', requirements: ['Figma 账户', '网络连接'], steps: ['创建 Figma 账户并验证邮箱', '从草稿开始新项目', '识别图层面板、属性和画布', '探索基本框架、文字和形状工具', '保存文件并导出初始屏幕'], tip: '从一开始就命名每个图层，避免大型项目混乱。', resources: { docs: 'Figma 入门' } },
      'figma-l2': { title: '框架、网格与约束', section: '模块 2', description: '什么是框架？它们有什么用途？您将学习用网格和响应式约束构建可扩展屏幕。', requirements: ['Figma 账户', '基础界面知识'], steps: ['创建桌面和移动端框架', '应用列布局网格', '为关键元素配置约束', '按间距规则对齐组件', '改变框架大小时验证缩放'], tip: '先设计结构，再处理视觉细节。', resources: { docs: 'Figma 中的框架与网格' } },
      'figma-l3': { title: '组件与变体', section: '模块 3', description: '什么是组件？它们有什么用途？本课涵盖 UI 系统中的复用、可扩展性和一致性。', requirements: ['基础框架知识', '一致的图层命名'], steps: ['将基础按钮转换为主组件', '按状态和尺寸创建变体', '在多个屏幕应用实例', '更新主组件并观察传播', '为团队记录属性'], tip: '避免过于僵化的组件；考虑可扩展性。', resources: { docs: 'Figma 组件' } },
      'figma-l4': { title: '原型与 UX 验证', section: '模块 4', description: '什么是原型？它有什么用途？您将学习在开发前模拟流程并验证决策。', requirements: ['已定义基础组件', '已勾勒屏幕流程'], steps: ['用交互连接屏幕', '定义过渡和叠加层', '创建主要用户路径', '与同事测试原型', '记录优先 UX 调整'], tip: '先原型化关键业务流。', resources: { docs: 'Figma 原型' } },
      'figma-l5': { title: 'Dev Mode 与交付', section: '模块 5', description: '什么是交付？它有什么用途？您将了解如何向开发提供清晰规格，减少摩擦。', requirements: ['功能原型', '已组织组件和样式'], steps: ['打开 Dev Mode 并查看尺寸', '分享颜色和字体 token', '以一致命名导出资源', '标注关键交互规则', '与技术团队验证交付'], tip: '良好的技术交付始于命名清晰的图层和组件。', resources: { docs: 'Figma Dev Mode' } },
    },
    quizSections: [
      { title: '什么是 Figma？如何开始？', questions: [{ type: 'choice', text: 'Figma 相比传统本地工作流有何战略优势？', options: ['自动编译后端', '在单一文件上实时协作', '运行 SQL 查询', '原生 Git 代码版本控制'], ans: 1, explanation: 'Figma 优化多学科实时协作。' }, { type: 'truefalse', text: 'Figma 在浏览器中运行，无需安装重型套件即可协作。', ans: true, explanation: '云端方式降低入门门槛。', textFalse: 'Figma 需要安装桌面套件，且同一文件同时只能由一个人编辑。', explanationFalse: 'Figma 在浏览器中运行，多人可以同时编辑同一个文件。'  }, { type: 'match', text: '匹配 Figma 中的区域与功能：', pairs: [{ left: '图层', right: '设计结构' }, { left: '画布', right: '主工作区' }, { left: '属性', right: '选中元素配置' }, { left: '资源', right: '访问可复用组件' }], explanation: '掌握界面可加速设计与审阅。' }] },
      { title: '框架、网格与约束', questions: [{ type: 'choice', text: '哪种组合在调整屏幕大小时改善响应行为？', options: ['框架 + 明确定义的约束', '仅无结构的松散图层', '固定导出图像', '转换为轮廓的文字'], ans: 0, explanation: '框架和约束控制布局适配。' }, { type: 'truefalse', text: '布局网格有助于在复杂界面中保持对齐一致。', ans: true, explanation: '网格提供秩序和可扩展性。', textFalse: '布局网格只是装饰，不影响内容的对齐。', explanationFalse: '布局网格定义列与边距，使整个界面保持一致的对齐。'  }, { type: 'match', text: '匹配技术与结果：', pairs: [{ left: '12 列网格', right: '稳定的对齐系统' }, { left: '左/右约束', right: '元素保持相对边缘' }, { left: '移动端框架', right: '小屏体验验证' }, { left: '间距 token', right: '跨组件一致性' }], explanation: '这些是系统性设计的基础实践。' }] },
      { title: '组件与变体', questions: [{ type: 'choice', text: '若按钮在 40 个屏幕上变化，什么最能减少维护？', options: ['手动编辑每个实例', '更新带变体的主组件', '栅格化按钮', '隐藏旧图层'], ans: 1, explanation: '主组件以可控方式传播变更。' }, { type: 'truefalse', text: '变体可在同一组件内建模 hover、active、disabled 等状态。', ans: true, explanation: '便于一致性和清晰交付。', textFalse: '每种状态（hover、active、disabled）都必须创建互不相关的独立组件。', explanationFalse: '变体把各状态归入同一个组件，避免为每种状态复制一份。'  }, { type: 'match', text: '匹配概念与目标：', pairs: [{ left: '主组件', right: '视觉单一来源' }, { left: '实例', right: '屏幕上的复用' }, { left: '变体集', right: '分组相关状态' }, { left: '属性', right: '控制可配置行为' }], explanation: '结构化组件减少设计债务。' }] },
      { title: '原型与 UX 验证', questions: [{ type: 'choice', text: '开发前的可导航原型提供什么？', options: ['消除 QA 需求', '早期验证流程并发现使用摩擦', '替代业务需求', '生成最终数据库'], ans: 1, explanation: '可在昂贵构建前学习。' }, { type: 'truefalse', text: '原型化错误场景与理想流程同样重要。', ans: true, explanation: '真实体验包含失败与恢复。', textFalse: '原型只需覆盖顺利路径，错误情况留到开发阶段再处理。', explanationFalse: '原型若忽略错误，团队会低估复杂度，用户在出错时也得不到任何反馈。'  }, { type: 'match', text: '匹配交互与 UX 用途：', pairs: [{ left: '点击', right: '明确用户操作' }, { left: '叠加层', right: '不离开上下文的模态' }, { left: 'Smart Animate', right: '状态间平滑过渡' }, { left: '流程起点', right: '定义测试路径' }], explanation: '这些选项模拟产品体验。' }] },
      { title: 'Dev Mode 与交付', questions: [{ type: 'choice', text: '交付中什么信息能减少开发提问？', options: ['仅 PNG 截图', '尺寸、样式、token 和已记录交互', '无上下文的通用评论', '无结构文件'], ans: 1, explanation: '有效交付需要可追溯规格。' }, { type: 'truefalse', text: '语义化命名图层改善设计与开发沟通。', ans: true, explanation: '共同语言避免实现错误。', textFalse: '默认图层名（Rectangle 27、Group 5）足以用于交付给开发。', explanationFalse: '通用名称迫使他人猜测意图；语义化命名才能让文件易读。'  }, { type: 'match', text: '匹配交付物与价值：', pairs: [{ left: '颜色 token', right: '代码中的视觉一致' }, { left: '导出资源', right: '图形资源实现' }, { left: '间距规格', right: '布局精度' }, { left: '交互说明', right: '预期 UI 行为' }], explanation: '稳健交付将设计转为可靠实现。' }] },
    ],
    examSections: [
      { title: '产品流程设计', questions: [{ type: 'choice', text: '您需重新设计含多状态的移动端 onboarding。哪种方法确保可扩展？', options: ['无组件的松散屏幕', '从一开始就建立组件系统、变体和 token', '每位设计师自由设计', '无图层结构的原型'], ans: 1, explanation: '系统防止不一致和返工。' }, { type: 'truefalse', text: '若原型未考虑验证错误，团队会低估实现复杂度。', ans: true, explanation: '边界情况影响产品时间和质量。', textFalse: '在原型中省略校验状态，不会影响开发团队的工作量估算。', explanationFalse: '校验状态是实际工作的一部分：原型里没有它们，估算就会偏低。'  }, { type: 'match', text: '匹配决策与交付效果：', pairs: [{ left: '正确的 Auto Layout', right: '内容变化时的灵活行为' }, { left: '已记录的 Dev Mode', right: '更少开发提问' }, { left: '变体属性', right: '设计中可控状态' }, { left: '业务评论', right: '技术决策上下文' }], explanation: '设计与开发应共享同一产品叙事。' }] },
      { title: '交付与技术质量', questions: [{ type: 'choice', text: '当设计与代码偏离时，哪种行动最快纠正？', options: ['忽略视觉差异', '审阅 Figma 规格并对齐 token 与实现', '仅手动改颜色', '移除共享组件'], ans: 1, explanation: '通过 token 和规格对齐最小化视觉漂移。' }, { type: 'truefalse', text: '无命名约定的 Figma 文件难以审计和维护。', ans: true, explanation: '文件治理是技术质量的一部分。', textFalse: '即使没有任何命名规范，Figma 文件同样容易审查。', explanationFalse: '没有规范，查找和更新组件会变得缓慢且容易出错。'  }, { type: 'match', text: '匹配问题与缓解：', pairs: [{ left: '资源不一致', right: '按命名规范导出' }, { left: '间距模糊', right: '定义 token 化间距尺度' }, { left: '缺少状态', right: '补全组件变体' }, { left: '交互疑问', right: '在原型中标注行为' }], explanation: '预防性交付减少 UI 债务。' }] },
    ],
  },
  python: {
    title: 'Python',
    requirements: ['已安装 Python 3', '代码编辑器（推荐 VS Code）', '基础终端使用'],
    certModules: ['语法与类型', '控制流', '函数与模块', '结构与文件'],
    docs: { label: 'Python 官方文档' },
    lessons: {
      'python-l1': { title: '语法、类型与变量', section: '模块 1', description: '什么是 Python？它有什么用途？本课建立其清晰语法、数据类型以及有序编程的基础。', requirements: ['已安装 Python 3', '基础终端'], steps: ['在控制台运行第一个脚本', '用描述性名称创建变量', '区分 int、float、str 和 bool', '安全转换类型', '用 f-string 显示结果'], tip: '变量名应体现业务意图，而非技术缩写。', resources: { docs: 'Python 官方教程' } },
      'python-l2': { title: '条件与循环', section: '模块 2', description: '什么是控制流？它有什么用途？您将学习做决策和重复任务，避免重复代码。', requirements: ['已安装 Python 3', '变量概念'], steps: ['用真实案例编写 if/elif/else', '用 for 遍历列表', '用 while 配合退出条件', '有标准地应用 break 和 continue', '用验证解决逻辑挑战'], tip: '避免深层嵌套条件；用小函数简化。', resources: { docs: 'Python 控制流' } },
      'python-l3': { title: '函数与模块化', section: '模块 3', description: '什么是函数？它们有什么用途？您将了解如何封装逻辑以复用、测试和维护代码，降低风险。', requirements: ['基础控制流', '代码编辑器'], steps: ['定义带参数的函数', '返回值而非总是 print', '添加 docstring 和简单类型', '将工具分离到模块', '跨文件 import 并复用代码'], tip: '若函数做太多事，按职责拆分。', resources: { docs: '定义函数' } },
      'python-l4': { title: '列表、字典与集合', section: '模块 4', description: '什么是数据结构？它们有什么用途？您将学习为每个实际问题选择最合适的结构。', requirements: ['基础函数', '循环处理'], steps: ['用推导式创建和转换列表', '安全访问字典', '用集合去重', '按标准排序集合', '建模小型数据目录'], tip: '选对结构可能比事后优化更简化问题。', resources: { docs: 'Python 数据结构' } },
      'python-l5': { title: '文件、错误与最佳实践', section: '模块 5', description: '什么是文件和错误管理？它有什么用途？本课涵盖生产脚本中的稳健性和质量。', requirements: ['Python 中级知识', '数据结构练习'], steps: ['用上下文管理器读写文件', '捕获特定异常', '记录有助于调试的错误', '处理前验证输入', '在最终脚本中应用 PEP 8 风格'], tip: '处理预期错误；不要隐藏关键异常。', resources: { docs: '错误与异常' } },
    },
    quizSections: [
      { title: '语法、类型与变量', questions: [{ type: 'choice', text: '在数据脚本中，Python 动态类型配合显式验证有何优势？', options: ['避免任何运行时错误', '在受控灵活性下加速迭代', '替代单元测试', '消除文档需求'], ans: 1, explanation: '有意识验证时灵活性很有用。' }, { type: 'truefalse', text: 'f-string 比复杂拼接更易读。', ans: true, explanation: '便于清晰格式化和维护。', textFalse: '在组合多个变量时，用 + 拼接比使用 f-string 更易读。', explanationFalse: 'f-string 让文本和变量各就各位；用 + 拼接在变长后会变得难以阅读。'  }, { type: 'match', text: '匹配类型与常见用例：', pairs: [{ left: 'int', right: '离散计数' }, { left: 'float', right: '带小数测量' }, { left: 'str', right: '文本与标签' }, { left: 'bool', right: '逻辑状态' }], explanation: '选对类型减少语义错误。' }] },
      { title: '条件与循环', questions: [{ type: 'choice', text: '哪种模式避免输入处理中的无限循环？', options: ['无退出条件的 while True', '显式条件 + 受控 break', '移除验证', '到处用递归'], ans: 1, explanation: '稳健循环必须有退出控制。' }, { type: 'truefalse', text: 'continue 可提前丢弃无效情况，提高清晰度。', ans: true, explanation: '减少不必要的嵌套。', textFalse: 'continue 总是会降低循环的可读性，任何情况下都应避免使用。', explanationFalse: '用 continue 提前排除无效情况可以避免嵌套条件，使逻辑更扁平。'  }, { type: 'match', text: '匹配语句与效果：', pairs: [{ left: 'if', right: '条件决策' }, { left: 'for', right: '遍历集合' }, { left: 'while', right: '按条件重复' }, { left: 'break', right: '退出当前循环' }], explanation: '掌握流程是可维护逻辑的基础。' }] },
      { title: '函数与模块化', questions: [{ type: 'choice', text: '哪种设计更利于业务函数的可测试性？', options: ['每个函数内 print', '返回数据并将 I/O 与逻辑分离', '使用级联全局变量', '写一个巨大函数'], ans: 1, explanation: '分离逻辑与展示便于测试。' }, { type: 'truefalse', text: '单一职责的函数通常更易维护。', ans: true, explanation: '降低耦合和认知复杂度。', textFalse: '把多个职责合并到一个函数里更便于维护。', explanationFalse: '承担多个职责的函数更难测试，也更难在不影响其他部分的情况下修改。'  }, { type: 'match', text: '匹配实践与益处：', pairs: [{ left: 'Docstring', right: '说明目的与契约' }, { left: '清晰参数', right: '可预测的函数使用' }, { left: '独立模块', right: '逻辑复用' }, { left: '显式 import', right: '透明依赖' }], explanation: '模块化减少技术债务。' }] },
      { title: '列表、字典与集合', questions: [{ type: 'choice', text: '若需按唯一键快速访问，哪种结构最合适？', options: ['无索引元组列表', '字典', '文本字符串', '无限 while 循环'], ans: 1, explanation: '字典高效建模键值关系。' }, { type: 'truefalse', text: '集合无需额外逻辑即可去重。', ans: true, explanation: '唯一性是集合的原生属性。', textFalse: '去重必须用循环遍历列表，因为 set 无法解决这个问题。', explanationFalse: 'set() 天然去重：它不允许重复元素。'  }, { type: 'match', text: '匹配结构与优势：', pairs: [{ left: '列表', right: '顺序与顺序遍历' }, { left: '字典', right: '按键访问' }, { left: '集合', right: '元素唯一性' }, { left: '元组', right: '轻量不可变' }], explanation: '每种结构优化一种使用模式。' }] },
      { title: '文件、错误与最佳实践', questions: [{ type: 'choice', text: '生产脚本中哪种错误处理更专业？', options: ['每个块 except: pass', '捕获特定异常并记录上下文', '忽略输入验证', '无消息停止进程'], ans: 1, explanation: '可观测性是软件质量的一部分。' }, { type: 'truefalse', text: 'with open(...) 即使异常也保证关闭文件。', ans: true, explanation: '上下文管理器安全管理资源。', textFalse: '使用 with open(...) 时，如果发生异常仍需手动调用 close()。', explanationFalse: 'with 代码块在退出时会关闭文件，无论正常结束还是抛出异常。'  }, { type: 'match', text: '匹配技术与结果：', pairs: [{ left: '特定 try/except', right: '受控失败处理' }, { left: 'logging', right: '后续诊断' }, { left: '预先验证', right: '预防可避免错误' }, { left: 'PEP 8', right: '可读性与团队标准' }], explanation: '稳健性结合预防、捕获和可追溯性。' }] },
    ],
    examSections: [
      { title: '业务问题解决', questions: [{ type: 'choice', text: '您需处理含不完整数据的每日 CSV。哪种架构最小化失败？', options: ['全部读取并假设格式完美', '验证行、记录错误并继续有效数据', '首个错误即中止无报告', '每天手动改源文件'], ans: 1, explanation: '运营韧性需要验证和可追溯性。' }, { type: 'truefalse', text: '将解析、转换和导出分离为独立函数可提高可维护性。', ans: true, explanation: '便于测试和流水线演进。', textFalse: '把解析、转换和导出写在同一个函数里更便于维护脚本。', explanationFalse: '分离各阶段可以独立测试和修改；合并在一起会让整个流程耦合。'  }, { type: 'match', text: '匹配阶段与目标：', pairs: [{ left: '解析', right: '解释输入数据' }, { left: '验证', right: '保证最低质量' }, { left: '转换', right: '应用业务规则' }, { left: '输出', right: '持久可靠结果' }], explanation: '清晰流水线减少生产事故。' }] },
      { title: '质量与安全运行', questions: [{ type: 'choice', text: '若关键脚本在生产失败，什么证据最有助诊断？', options: ['仅「错误」消息', '带上下文、时间戳和具体原因的日志', '孤立截图', '不分析直接重启服务器'], ans: 1, explanation: '无上下文时恢复慢且不确定。' }, { type: 'truefalse', text: '静默关键异常增加数据损坏风险。', ans: true, explanation: '隐藏失败阻止早期响应。', textFalse: '用空的 except 捕获所有异常是好做法，因为可以避免脚本中断。', explanationFalse: '静默错误会让损坏的数据悄悄通过；这比明显地失败更糟糕。'  }, { type: 'match', text: '匹配实践与运营影响：', pairs: [{ left: '单元测试', right: '减少逻辑回归' }, { left: 'Lint', right: '风格统一与早期错误' }, { left: '异常处理', right: '对失败受控响应' }, { left: '模式验证', right: '避免无效数据' }], explanation: '技术质量是预防性的，非反应性的。' }] },
    ],
  },
  javascript: {
    title: 'JavaScript',
    requirements: ['现代浏览器', '代码编辑器', '基础 HTML/CSS 知识'],
    certModules: ['JS 基础', '函数与异步', 'DOM 与事件', 'API 集成'],
    docs: { label: 'MDN JavaScript' },
    lessons: {
      'javascript-l1': { title: '变量、类型与作用域', section: '模块 1', description: '什么是 JavaScript？它有什么用途？您将理解其在交互式 Web 中的角色，以及如何安全管理状态。', requirements: ['现代浏览器', '代码编辑器'], steps: ['区分 var、let 和 const', '用 typeof 检查类型', '练习块级和函数作用域', '避免混淆的重复声明', '编写不含全局变量的简单脚本'], tip: '默认使用 const，仅在确实需要重新赋值时使用 let。', resources: { docs: 'JS 变量与作用域' } },
      'javascript-l2': { title: '函数与现代模式', section: '模块 2', description: '什么是函数？它们有什么用途？本课涵盖前端中的逻辑封装、清晰度和复用。', requirements: ['JS 变量基础', '浏览器控制台练习'], steps: ['定义声明式和箭头函数', '将函数作为参数传递', '创建简单闭包', '对数组应用 map/filter/reduce', '将重复代码块重构为可复用函数'], tip: '小函数便于调试和测试。', resources: { docs: 'JavaScript 函数' } },
      'javascript-l3': { title: 'DOM、事件与无障碍', section: '模块 3', description: '什么是 DOM？它有什么用途？您将学习稳健、无障碍地操作界面和事件。', requirements: ['基础 HTML/CSS 知识', '基础 JS 函数'], steps: ['用 querySelector 选择节点', '用 addEventListener 监听事件', '动态修改类和属性', '实现可见焦点和键盘支持', '构建小型交互组件'], tip: '不要只依赖点击；交互组件应支持键盘。', resources: { docs: 'DOM 简介' } },
      'javascript-l4': { title: 'Promise 与 async/await 异步', section: '模块 4', description: '什么是异步？它有什么用途？您将了解如何协调非阻塞任务并处理网络错误。', requirements: ['JS 函数', '基础 HTTP 概念'], steps: ['创建 Promise 并处理 resolve/reject', '用 then/catch 消费 Promise', '用 async/await 重写流程', '在请求上应用 try/catch', '展示加载、成功和错误状态'], tip: '始终处理网络错误和不成功响应。', resources: { docs: 'JavaScript Promise' } },
      'javascript-l5': { title: 'API 集成与客户端架构', section: '模块 5', description: '什么是 API 集成？它有什么用途？您将学习以清晰契约和状态管理消费外部服务。', requirements: ['async/await 异步', '基础 JSON 知识'], steps: ['用 fetch 消费 REST 端点', '验证 response.ok 并解析 JSON', '渲染前规范化数据', '简单缓存关键响应', '应用服务模式分离逻辑'], tip: '分离数据层和 UI 层以便更好扩展。', resources: { docs: 'MDN Fetch API' } },
    },
    quizSections: [
      { title: '变量、类型与作用域', questions: [{ type: 'choice', text: '在现代 JavaScript 中，哪种做法最能减少重复声明错误？', options: ['到处使用 var', '优先使用 const/let 与块级作用域', '将状态存在 window 上', '避免使用函数'], ans: 1, explanation: 'const/let 减少歧义和作用域泄漏。' }, { type: 'truefalse', text: 'let/const 的块级作用域有助于隔离临时状态。', ans: true, explanation: '避免不必要的副作用。', textFalse: 'let 和 const 与 var 一样是函数作用域，因此无法限定临时状态。', explanationFalse: 'let 和 const 是块级作用域：只在声明它们的花括号内存在。'  }, { type: 'match', text: '匹配声明与行为：', pairs: [{ left: 'const', right: '不允许绑定重新赋值' }, { left: 'let', right: '可重新赋值且为块级作用域' }, { left: 'var', right: '函数作用域与传统提升' }, { left: 'typeof', right: '运行时检查类型' }], explanation: '了解变量语义可避免细微错误。' }] },
      { title: '函数与现代模式', questions: [{ type: 'choice', text: '哪种模式能在数组处理中复用逻辑而不重复？', options: ['每个界面嵌套 for', 'map/filter/reduce 配合纯函数', '每个模块复制代码', '冗长 if 链'], ans: 1, explanation: '函数式编程减少噪音和错误。' }, { type: 'truefalse', text: '闭包可在多次调用间保留私有状态。', ans: true, explanation: '有助于封装行为。', textFalse: '闭包在创建它的函数执行结束后就会丢失状态。', explanationFalse: '闭包保留了它被创建时的环境，因此能在多次调用之间保持状态。'  }, { type: 'match', text: '匹配方法与用途：', pairs: [{ left: 'map', right: '转换每个元素' }, { left: 'filter', right: '选择子集' }, { left: 'reduce', right: '累积单一结果' }, { left: 'forEach', right: '对每个元素产生副作用' }], explanation: '选对方法可提高可读性。' }] },
      { title: 'DOM、事件与无障碍', questions: [{ type: 'choice', text: '在动态列表中，哪种技术减少冗余监听器？', options: ['为每个新节点添加监听器', '在父容器上使用事件委托', '每次点击后刷新页面', '在 HTML 中使用内联 onclick'], ans: 1, explanation: '委托更适合动态内容扩展。' }, { type: 'truefalse', text: '在交互组件中添加键盘支持可改善无障碍。', ans: true, explanation: '并非所有用户都用鼠标操作。', textFalse: '只要组件能用鼠标操作，增加键盘支持对无障碍没有帮助。', explanationFalse: '很多人只用键盘或读屏软件浏览；没有键盘支持，组件对他们就无法使用。'  }, { type: 'match', text: '匹配 API 与用途：', pairs: [{ left: 'querySelector', right: '选择首个匹配节点' }, { left: 'classList.toggle', right: '切换视觉状态' }, { left: 'addEventListener', right: '注册用户交互' }, { left: 'setAttribute', right: '更新节点元数据' }], explanation: '有目的地操作 DOM 可避免 UI 不一致。' }] },
      { title: 'Promise 与 async/await 异步', questions: [{ type: 'choice', text: 'async/await 相比长 then 链的主要优势是什么？', options: ['消除错误处理需求', '提高异步流程的顺序可读性', '将代码转为真正同步', '避免所有网络延迟'], ans: 1, explanation: '仍是异步，但语法更清晰。' }, { type: 'truefalse', text: 'try/catch 也能捕获 async 函数中 await 抛出的错误。', ans: true, explanation: '可集中处理失败。', textFalse: 'try/catch 无法捕获 await 抛出的错误，必须改用 .catch()。', explanationFalse: '在 async 函数内部，await 会抛出异常，try/catch 可以正常捕获。'  }, { type: 'match', text: '匹配概念与功能：', pairs: [{ left: 'Promise', right: '表示未来结果' }, { left: 'await', right: '在 async 内暂停逻辑' }, { left: 'catch', right: '处理异步错误' }, { left: 'finally', right: '执行最终清理' }], explanation: '稳健的异步流程需考虑成功与失败。' }] },
      { title: 'API 集成与客户端架构', questions: [{ type: 'choice', text: '哪种做法防止 UI 直接依赖原始 API 格式？', options: ['在屏幕上渲染原始响应', '在服务层规范化数据', '在每个组件重复 fetch', '忽略 API 契约'], ans: 1, explanation: '规范化解耦后端与展示。' }, { type: 'truefalse', text: '解析 JSON 前验证 response.ok 可避免静默错误。', ans: true, explanation: '并非每个 HTTP 响应都表示成功。', textFalse: '当服务器返回 404 或 500 时，fetch 会自动抛出异常。', explanationFalse: 'fetch 只在网络错误时失败：404 或 500 会作为响应返回，因此必须检查 response.ok。'  }, { type: 'match', text: '匹配策略与益处：', pairs: [{ left: '服务层', right: '复用数据访问' }, { left: '加载状态', right: '清晰用户反馈' }, { left: '简单缓存', right: '减少重复延迟' }, { left: '错误回退', right: '失败时保持 UX' }], explanation: '稳健的客户端架构提高韧性。' }] },
    ],
    examSections: [
      { title: '真实前端实现', questions: [{ type: 'choice', text: '您需构建查询三个端点且结果相互依赖的面板。哪种设计更易维护？', options: ['全部放在一个巨大全局函数中', '分离服务 + async/await 编排 + 集中错误处理', '无失败控制的嵌套请求', '任何错误都刷新页面'], ans: 1, explanation: '分离职责便于演进和诊断。' }, { type: 'truefalse', text: '缺少加载和错误状态会给终端用户带来模糊体验。', ans: true, explanation: '稳健 UX 始终传达正在发生什么。', textFalse: '只要请求很快完成，就没有必要显示加载和错误状态。', explanationFalse: '没有可见状态，用户无法判断应用是在工作、失败还是已完成；延迟从来无法保证。'  }, { type: 'match', text: '匹配问题与技术缓解：', pairs: [{ left: '竞态条件', right: '取消过时请求' }, { left: 'API 缓慢', right: '显示加载状态' }, { left: '500 错误', right: '回退与清晰消息' }, { left: '数据不完整', right: '渲染前防御性验证' }], explanation: '前端工程需要运营韧性。' }] },
      { title: '代码质量与可扩展性', questions: [{ type: 'choice', text: '代码审查中，哪种信号表明架构性技术债务？', options: ['单一职责的小函数', 'UI 与 fetch 在多处强耦合', '一致的错误处理', '语义化模块命名'], ans: 1, explanation: '分散耦合使维护困难。' }, { type: 'truefalse', text: '异步流程的集成测试可减少生产回归。', ans: true, explanation: '验证层与服务间的协调。', textFalse: '单元测试足以覆盖异步流程及其集成。', explanationFalse: '单元测试隔离各个部分；异步流程的问题往往出现在它们之间的集成上。'  }, { type: 'match', text: '匹配实践与业务结果：', pairs: [{ left: '模块化架构', right: '更快交付新功能' }, { left: '一致错误处理', right: '更少可见用户事故' }, { left: '明确数据契约', right: '可预测的后端集成' }, { left: '规范的代码审查', right: '长期保持质量' }], explanation: '技术可扩展性直接影响产品。' }] },
    ],
  },
  html: {
    title: 'HTML',
    requirements: ['代码编辑器', '网页浏览器', '基础网络知识'],
    certModules: ['HTML5 结构', '语义与无障碍', '表单', 'SEO 最佳实践'],
    docs: { label: 'MDN HTML' },
    lessons: {
      'html-l1': { title: 'HTML5 基础结构', section: '模块 1', description: '什么是 HTML？它有什么用途？本课定义构建有效、清晰 Web 文档的最小结构。', requirements: ['代码编辑器', '网页浏览器'], steps: ['从零创建 HTML 文件', '添加 doctype、html、head 和 body', '配置 charset 和 viewport', '添加标题和基础元数据', '用标准工具验证结构'], tip: '从一开始就保持文档整洁，避免结构性债务。', resources: { docs: 'HTML 文档结构' } },
      'html-l2': { title: '语义内容与层级', section: '模块 2', description: '什么是 HTML 语义？它有什么用途？您将学习标记内容，以改善用户和搜索引擎的理解。', requirements: ['基础 HTML 结构', '理解标题层级'], steps: ['用 h1-h6 建立连贯层级', '用 section 和 article 分隔内容', '用 nav 定义导航', '在 footer 中包含上下文信息', '审查文档逻辑大纲'], tip: '语义不是美学，而是结构含义。', resources: { docs: '语义化 HTML' } },
      'html-l3': { title: '链接、多媒体与列表', section: '模块 3', description: '什么是内容元素？它们有什么用途？您将了解如何用最佳实践构建信息丰富、可导航的页面。', requirements: ['HTML 语义基础', '准备好的内容资源'], steps: ['创建安全的内部和外部链接', '插入带描述性 alt 的图片', '添加带原生控件的音频/视频', '正确使用有序和无序列表', '检查加载和资源回退'], tip: '每个链接应传达目的地，不依赖视觉上下文。', resources: { docs: 'HTML 多媒体元素' } },
      'html-l4': { title: '无障碍表单', section: '模块 4', description: '什么是无障碍表单？它有什么用途？您将学习以清晰验证和良好用户体验收集数据。', requirements: ['有效 HTML 结构', '基础 input 知识'], steps: ['构建带关联 label 的表单', '使用合适的 input 类型', '应用原生 required 验证', '用 fieldset 和 legend 分组字段', '测试完整键盘导航'], tip: '表单错误应说明要改什么以及如何改。', resources: { docs: 'HTML 表单' } },
      'html-l5': { title: '技术 SEO 与结构质量', section: '模块 5', description: '什么是为 SEO 优化 HTML？它有什么用途？本课连接结构、性能与搜索引擎可发现性。', requirements: ['掌握结构与语义', '基础元数据知识'], steps: ['配置有用的 title 和 meta description', '按搜索意图审查标题', '添加 loading 等性能属性', '检测结构与内容重复', '用技术 SEO 清单审计文档'], tip: '技术 SEO 始于语义化且快速的 HTML。', resources: { docs: 'HTML 最佳实践' } },
    },
    quizSections: [
      { title: 'HTML5 基础结构', questions: [{ type: 'choice', text: '哪个元素定义对用户不可见但对渲染和 SEO 关键的元数据？', options: ['body', 'head', 'main', 'footer'], ans: 1, explanation: 'head 封装文档元数据。' }, { type: 'truefalse', text: '正确的 doctype 帮助浏览器使用标准模式。', ans: true, explanation: '避免引擎间渲染不一致。', textFalse: '省略 doctype 不会改变浏览器解析文档的方式。', explanationFalse: '没有 doctype，浏览器会进入怪异模式，套用会破坏布局的旧规则。'  }, { type: 'match', text: '匹配标签与用途：', pairs: [{ left: '<html>', right: '文档根' }, { left: '<head>', right: '页面元数据' }, { left: '<body>', right: '可见内容' }, { left: '<title>', right: '标签页标题与基础 SEO' }], explanation: '坚实基础保证兼容性。' }] },
      { title: '语义内容与层级', questions: [{ type: 'choice', text: '哪种语义错误最影响屏幕阅读器理解？', options: ['使用外部 CSS', '无逻辑地跳过标题层级', '包含 footer', '使用有序列表'], ans: 1, explanation: '层级引导辅助导航。' }, { type: 'truefalse', text: 'article 应用于可独立理解的自主内容。', ans: true, explanation: '其语义表示块独立性。', textFalse: 'article 只是通用容器，在任何情况下都可以与 div 互换。', explanationFalse: 'article 表示内容可以独立成立；div 不携带任何语义。'  }, { type: 'match', text: '匹配标签与功能：', pairs: [{ left: '<nav>', right: '主导航链接' }, { left: '<section>', right: '主题内容分组' }, { left: '<article>', right: '独立内容单元' }, { left: '<aside>', right: '补充内容' }], explanation: '语义改善结构与维护。' }] },
      { title: '链接、多媒体与列表', questions: [{ type: 'choice', text: '在新标签页打开外部链接时，哪种做法更安全？', options: ['仅 target="_blank"', '添加 rel="noopener noreferrer"', '移除 href 属性', '将链接转为无效按钮'], ans: 1, explanation: '防止目标页访问原页面上下文。' }, { type: 'truefalse', text: 'alt 属性应描述图像的信息功能。', ans: true, explanation: '对有内容价值的图像并非可选。', textFalse: 'alt 属性应重复图片文件名，以提升搜索排名。', explanationFalse: 'alt 描述图片传达的信息；重复文件名对读屏用户毫无帮助。'  }, { type: 'match', text: '匹配元素与正确用法：', pairs: [{ left: '<a>', right: '资源间导航' }, { left: '<img>', right: '显示带替代文本的图像' }, { left: '<ul>', right: '无优先顺序的列表' }, { left: '<ol>', right: '有明确顺序的序列' }], explanation: '元素应匹配内容含义。' }] },
      { title: '无障碍表单', questions: [{ type: 'choice', text: '哪种组合改善邮箱字段的可用性与基础验证？', options: ['input type="text"', 'input type="email" + 关联 label', '无 label 的 placeholder', '带 contenteditable 的 div'], ans: 1, explanation: '正确类型启用验证和优化键盘。' }, { type: 'truefalse', text: 'placeholder 不能替代无障碍 label。', ans: true, explanation: 'label 保持持久上下文。', textFalse: 'placeholder 与 label 作用相同，因此可以省略 label。', explanationFalse: 'placeholder 在输入时会消失，许多读屏软件也不会朗读它：label 仍然必不可少。'  }, { type: 'match', text: '匹配组件与益处：', pairs: [{ left: 'label for', right: '字段与文字显式关联' }, { left: 'required', right: '最低原生验证' }, { left: 'fieldset', right: '逻辑字段分组' }, { left: 'aria-describedby', right: '额外帮助/错误上下文' }], explanation: '表单无障碍依赖语义结构。' }] },
      { title: '技术 SEO 与结构质量', questions: [{ type: 'choice', text: '哪种做法直接影响索引与主题理解？', options: ['无标准地使用多个 h1', 'title 与标题对齐搜索意图', '总是移除 meta description', '将所有文字藏在图片中'], ans: 1, explanation: '语义连贯帮助引擎和用户。' }, { type: 'truefalse', text: '语义化且轻量的 HTML 有助于感知性能。', ans: true, explanation: '清晰结构便于解析与渲染。', textFalse: 'HTML 的语义纯粹是外观问题，不影响感知性能。', explanationFalse: '简洁的标记能更快被解析和绘制，也让浏览器更好地安排内容优先级。'  }, { type: 'match', text: '匹配技术信号与 SEO 效果：', pairs: [{ left: '清晰的 meta description', right: '结果中更好的上下文' }, { left: '有序标题', right: '层级内容理解' }, { left: '优化图像', right: '更快页面加载' }, { left: '语义地标', right: '更强结构无障碍' }], explanation: '技术 SEO 与无障碍相互加强。' }] },
    ],
    examSections: [
      { title: '企业页面构建', questions: [{ type: 'choice', text: '您需发布面向转化的无障碍落地页。哪种工作顺序更扎实？', options: ['先设计样式无结构', '定义语义结构，再内容，再技术优化', '粘贴自动生成 HTML 不审查', '优先动画而非内容'], ans: 1, explanation: '语义基础便于无障碍、SEO 和维护。' }, { type: 'truefalse', text: '若表单缺少可见或等效 label，用户错误会增加。', ans: true, explanation: '缺少上下文影响表单完成率。', textFalse: '去掉表单中的 label 可以简化表单，减少填写者的错误。', explanationFalse: '没有 label，用户只能猜测要填什么，录入错误反而增加。'  }, { type: 'match', text: '匹配审查与目标：', pairs: [{ left: 'HTML 验证器', right: '检测无效结构' }, { left: '键盘测试', right: '验证无障碍导航' }, { left: '元数据审计', right: '改善可发现性' }, { left: '媒体优化', right: '减少加载时间' }], explanation: '最终质量依赖具体技术控制。' }] },
      { title: 'Web 质量治理', questions: [{ type: 'choice', text: '持续维护中，哪种做法减少结构性回归？', options: ['不经审查直接改生产', '使用语义清单与同行评审', '移除标记文档', '用大量内嵌脚本混合结构'], ans: 1, explanation: '标准化避免渐进退化。' }, { type: 'truefalse', text: '层级不当的标题可同时影响无障碍和 SEO。', ans: true, explanation: '两者都依赖清晰结构。', textFalse: '标题级别只是改变文字大小，既不影响无障碍也不影响搜索排名。', explanationFalse: '标题构成文档大纲：读屏软件和搜索引擎都依靠它来导航。'  }, { type: 'match', text: '匹配风险与缓解：', pairs: [{ left: '无上下文内容', right: '正确标题与地标' }, { left: '模糊字段', right: '清晰 label 与错误消息' }, { left: '加载缓慢', right: '多媒体资源优化' }, { left: '语义不一致', right: '共享标记指南' }], explanation: '技术治理维持长期质量。' }] },
    ],
  },
  css: {
    title: 'CSS',
    requirements: ['基础 HTML 知识', '代码编辑器', '带 DevTools 的浏览器'],
    certModules: ['基础与特异性', '盒模型', 'Flexbox/Grid', '响应式与动画'],
    docs: { label: 'MDN CSS' },
    lessons: {
      'css-l1': { title: '选择器与层叠', section: '模块 1', description: '什么是 CSS？它有什么用途？您将理解如何通过选择器、继承和层叠应用样式。', requirements: ['基础 HTML 知识', '代码编辑器'], steps: ['按标签、类和 id 应用规则', '比较选择器特异性', '避免滥用 !important', '按组件组织样式', '在 DevTools 中检查规则'], tip: '最佳特异性是所需的最小值。', resources: { docs: 'CSS 选择器' } },
      'css-l2': { title: '盒模型与视觉流', section: '模块 2', description: '什么是盒模型？它有什么用途？您将学习控制尺寸、间距和可靠的视觉分布。', requirements: ['基础选择器', '可用 DevTools'], steps: ['配置全局 box-sizing', '区分 margin、border 和 padding', '调整组件宽高', '检测 margin 折叠', '构建间距一致的卡片'], tip: 'border-box 在几乎所有布局中简化计算。', resources: { docs: 'CSS 盒模型' } },
      'css-l3': { title: 'Flexbox 一维布局', section: '模块 3', description: '什么是 Flexbox？它有什么用途？您将掌握可适应行/列中元素的对齐与分布。', requirements: ['掌握盒模型', 'UI 组件练习'], steps: ['创建基础 flex 容器', '调整主轴与交叉轴', '配置 grow/shrink/basis', '应用 gap 与换行', '解决响应式导航布局'], tip: '先想清楚轴向，再动对齐属性。', resources: { docs: 'Flexbox 指南' } },
      'css-l4': { title: 'Grid 复杂结构', section: '模块 4', description: '什么是 CSS Grid？它有什么用途？本课涵盖现代界面的稳健二维布局。', requirements: ['Flexbox 知识', '基础布局完成'], steps: ['用 fr 和 minmax 定义行列', '用 grid-template-areas 放置区域', '结合 grid 与自动放置', '设计含主区域的面板', '在断点调整行为'], tip: 'Grid 管宏观结构；Flexbox 管内部组件。', resources: { docs: 'CSS Grid 简介' } },
      'css-l5': { title: '响应式、状态与微交互', section: '模块 5', description: '什么是响应式设计？它有什么用途？您将学习适配界面、过渡与运动无障碍。', requirements: ['Flexbox 与 Grid', '基础无障碍概念'], steps: ['应用移动优先媒体查询', '使用 rem、clamp 等流体单位', '定义清晰的 hover/focus/active 状态', '添加有目的的过渡', '尊重 prefers-reduced-motion'], tip: '切勿为视觉动画牺牲无障碍。', resources: { docs: 'CSS 响应式设计' } },
    },
    quizSections: [
      { title: '选择器与层叠', questions: [{ type: 'choice', text: '大型项目中哪种选择器策略减少脆弱性？', options: ['深层层次的长选择器', '面向组件的语义类', '大量 id', '每个节点内联样式'], ans: 1, explanation: '组件类扩展时耦合更少。' }, { type: 'truefalse', text: '滥用 !important 通常表明样式架构问题。', ans: true, explanation: '这是特异性战争的症状。', textFalse: '系统性地使用 !important 是解决样式冲突的推荐做法。', explanationFalse: '!important 只是掩盖症状并破坏层叠；真正的冲突在于优先级和组织方式。'  }, { type: 'match', text: '匹配选择器与相对特异性：', pairs: [{ left: '#id', right: '高特定优先级' }, { left: '.class', right: '可复用且可控' }, { left: 'element', right: '全局样式基础' }, { left: ':root', right: '全局变量上下文' }], explanation: '了解特异性避免混乱覆盖。' }] },
      { title: '盒模型与视觉流', questions: [{ type: 'choice', text: '组件在定义宽度后仍溢出容器，应先检查什么？', options: ['字体类型', '盒模型与累积的 padding/border', '背景色', '类名'], ans: 1, explanation: '无 border-box 时 padding 和 border 改变总尺寸。' }, { type: 'truefalse', text: 'margin 控制外部空间；padding 控制内部空间。', ans: true, explanation: '区分二者是稳定构图的关键。', textFalse: 'margin 控制元素内部的空间，padding 控制它与其他元素之间的距离。', explanationFalse: '正好相反：padding 是边框与内容之间的内部空间；margin 是与外部的间隔。'  }, { type: 'match', text: '匹配属性与效果：', pairs: [{ left: 'margin', right: '元素间外部分离' }, { left: 'padding', right: '内容内部留白' }, { left: 'border', right: '视觉块边界' }, { left: 'box-sizing', right: '尺寸计算模型' }], explanation: '盒模型影响布局与可读性。' }] },
      { title: 'Flexbox 一维布局', questions: [{ type: 'choice', text: '哪个属性控制主轴上的项目分布？', options: ['align-items', 'justify-content', 'z-index', 'font-weight'], ans: 1, explanation: 'justify-content 作用于主轴。' }, { type: 'truefalse', text: 'flex 中的 gap 可在不用侧 margin 技巧的情况下分隔元素。', ans: true, explanation: '简化视觉维护。', textFalse: 'gap 属性只在 Grid 中有效，因此在 Flexbox 中必须用 margin 来设置间距。', explanationFalse: 'Flexbox 同样支持 gap，可以省去两侧 margin 和经典的 :last-child 修正。'  }, { type: 'match', text: '匹配属性与结果：', pairs: [{ left: 'display:flex', right: '激活弹性上下文' }, { left: 'flex-wrap', right: '允许项目换行' }, { left: 'align-items', right: '交叉轴对齐' }, { left: 'flex-grow', right: '分配剩余空间' }], explanation: 'Flexbox 解决大多数线性布局。' }] },
      { title: 'Grid 复杂结构', questions: [{ type: 'choice', text: 'Grid 相比 Flexbox 在仪表板上的主要优势？', options: ['更好的默认排版', '明确的二维行列控制', '避免任何媒体查询', '替代语义 HTML'], ans: 1, explanation: 'Grid 精确建模二维。' }, { type: 'truefalse', text: 'grid-template-areas 提高复杂布局可读性。', ans: true, explanation: '可声明式可视化结构。', textFalse: '相比按线号定位每个元素，grid-template-areas 让布局更难读懂。', explanationFalse: '为区域命名等于在 CSS 中画出布局；线号则迫使你在脑中重建布局。'  }, { type: 'match', text: '匹配 Grid 概念与用法：', pairs: [{ left: 'fr', right: '可用空间分数' }, { left: 'minmax', right: '可适应尺寸范围' }, { left: 'auto-fit', right: '自动响应式列' }, { left: 'grid-area', right: '分配到命名区域' }], explanation: '这些工具支持抗变更设计。' }] },
      { title: '响应式、状态与微交互', questions: [{ type: 'choice', text: '多设备下哪种响应式方法更可持续？', options: ['无断点的刚性桌面优先', '内容驱动断点的移动优先', '一切固定宽度', '只为 1920px 设计'], ans: 1, explanation: '断点应响应内容，而非孤立设备。' }, { type: 'truefalse', text: '动画无障碍应考虑 prefers-reduced-motion。', ans: true, explanation: '尊重对运动的敏感。', textFalse: '动画应始终以同样方式播放，无需理会减少动态效果的偏好设置。', explanationFalse: '动态效果会让部分人感到眩晕或偏头痛；prefers-reduced-motion 让你可以尊重这一点。'  }, { type: 'match', text: '匹配模式与 UX 益处：', pairs: [{ left: ':focus-visible', right: '清晰键盘导航' }, { left: 'clamp()', right: '流体排版尺度' }, { left: 'transition', right: '渐进视觉变化' }, { left: 'media query', right: '上下文布局适配' }], explanation: '响应式与无障碍应一并设计。' }] },
    ],
    examSections: [
      { title: '可适配界面设计', questions: [{ type: 'choice', text: '您需实现手机、平板、桌面均可用且不重复代码的界面。采用哪种策略？', options: ['三个无共同系统的孤立 CSS 文件', '移动优先架构与 token 和可复用组件', '固定布局加横向滚动', '每屏内联样式'], ans: 1, explanation: '系统化复用减少维护与错误。' }, { type: 'truefalse', text: 'token 化间距系统改善跨团队视觉一致。', ans: true, explanation: '定义共享可预测规则。', textFalse: '在每个页面凭感觉选择间距值，比使用设计令牌得到的结果更一致。', explanationFalse: '令牌确立统一的比例尺；没有它，每个页面会积累不同数值，整体显得杂乱。'  }, { type: 'match', text: '匹配布局问题与解法：', pairs: [{ left: '按钮未对齐', right: 'Flex 对齐与一致 gap' }, { left: '移动端列断裂', right: 'Grid minmax 与媒体查询' }, { left: '文字比例失调', right: 'clamp 排版尺度' }, { left: '焦点不可见', right: '无障碍 focus-visible 样式' }], explanation: '视觉质量来自结构决策。' }] },
      { title: '前端设计运营', questions: [{ type: 'choice', text: '若团队报告各模块样式不一致，哪种行动解决根因？', options: ['每条规则加 !important', '定义 CSS 架构约定并审查样式 PR', '从其他项目复制 CSS', '移除可复用组件'], ans: 1, explanation: '样式治理防止持续回归。' }, { type: 'truefalse', text: '缺少 CSS 命名约定会增加冲突与技术债务。', ans: true, explanation: '模糊名称导致意外覆盖。', textFalse: '只要每个人都用描述性名称，没有命名规范的 CSS 同样能健康增长。', explanationFalse: '没有规范，两个人会用同一个名称表示不同的东西，样式因此冲突。'  }, { type: 'match', text: '匹配质量控制与目标：', pairs: [{ left: 'CSS lint', right: '早期错误检测' }, { left: '设计 token', right: '全局视觉一致' }, { left: '响应式审查', right: '各视口正确行为' }, { left: '无障碍清单', right: '包容 UX 标准合规' }], explanation: '专业 CSS 运营需要清晰技术标准。' }] },
    ],
  },
  github: {
    title: 'GitHub',
    requirements: ['GitHub 账户', '本地已安装 Git', '基础终端'],
    certModules: ['Git 基础', '分支与协作', 'Pull Request', 'Actions 自动化'],
    docs: { label: 'GitHub 官方文档' },
    lessons: {
      'github-l1': { title: 'Git 与远程仓库', section: '模块 1', description: '什么是 GitHub？它有什么用途？您将学习版本控制基础和在远程仓库上的协作。', requirements: ['GitHub 账户', '本地已安装 Git'], steps: ['在 Git 中配置身份', '初始化本地仓库', '用清晰消息创建首次提交', '在 GitHub 连接远程', '安全发布 main 分支'], tip: '清晰的提交消息减少审查和支持时间。', resources: { docs: 'GitHub 简介' } },
      'github-l2': { title: '分支与工作流', section: '模块 2', description: '什么是分支？它们有什么用途？您将了解如何隔离变更，在不破坏 main 稳定性的情况下开发。', requirements: ['已创建初始仓库', '提交知识'], steps: ['创建功能分支', '实现隔离变更', 'rebase 或与 main 同步', '解决基础冲突', '为审查准备干净历史'], tip: '小分支审查更快、风险更低。', resources: { docs: '关于分支' } },
      'github-l3': { title: 'Pull Request 与技术审查', section: '模块 3', description: '什么是 Pull Request？它有什么用途？您将学习提出可追溯变更并进行有效技术讨论。', requirements: ['基础分支工作流', '能解决简单冲突'], steps: ['用上下文和目标打开 PR', '添加可复现测试计划', '回应审查评论', '应用变更并更新分支', '按仓库策略完成合并'], tip: '说明变更原因，而不只是做了什么。', resources: { docs: '关于 Pull Request' } },
      'github-l4': { title: 'Issue 管理与可追溯性', section: '模块 4', description: '什么是工作可追溯性？它有什么用途？本课连接 issue、提交和 PR，实现透明管理。', requirements: ['PR 知识', '明确的团队工作流'], steps: ['用业务上下文创建 issue', '标注优先级和工作类型', '将分支/PR 关联 issue', '用解决方案证据关闭 issue', '生成冲刺进度报告'], tip: '写得好的 issue 可节省数小时理解时间。', resources: { docs: 'GitHub Issues' } },
      'github-l5': { title: 'GitHub Actions 入门 CI/CD', section: '模块 5', description: '什么是 GitHub Actions？它有什么用途？您将学习自动化测试和部署以保障持续质量。', requirements: ['仓库与 PR 知识', '终端与脚本基础'], steps: ['在 .github/workflows 创建工作流', '配置 push 和 pull_request 触发器', '在流水线运行 lint 和测试', '发布构建产物', '流水线失败时阻止合并'], tip: '先自动化重复且业务关键的任务。', resources: { docs: 'GitHub Actions' } },
    },
    quizSections: [
      { title: 'Git 与远程仓库', questions: [{ type: 'choice', text: '频繁提交版本变更有何业务益处？', options: ['消除文档需求', '审计决策并以较低影响回滚事故', '加速服务器硬件', '避免代码审查'], ans: 1, explanation: '历史是运营与技术日志。' }, { type: 'truefalse', text: '集中式远程仓库便于协作和历史备份。', ans: true, explanation: '降低丢失和碎片化风险。', textFalse: '只使用本地仓库同样安全，因为 Git 已经保存了完整历史。', explanationFalse: '本地历史会随设备一起消失；远程仓库才提供备份和协作。'  }, { type: 'match', text: '匹配命令与功能：', pairs: [{ left: 'git init', right: '初始化本地仓库' }, { left: 'git add', right: '暂存变更以待提交' }, { left: 'git commit', right: '保存版本快照' }, { left: 'git push', right: '发布变更到远程' }], explanation: '基础流程支撑有序协作。' }] },
      { title: '分支与工作流', questions: [{ type: 'choice', text: '在功能分支上开发的主要原因？', options: ['避免文档', '隔离变更并保护稳定分支', '直接发布到 main', '消除测试'], ans: 1, explanation: '隔离降低运营风险。' }, { type: 'truefalse', text: '合并前用 main 更新功能分支可减少后期冲突。', ans: true, explanation: '逐步集成变更。', textFalse: '最好在最后再动 feature 分支，以避免与 main 产生冲突。', explanationFalse: '同步拖得越久，分支分歧越大，最终冲突也越严重。'  }, { type: 'match', text: '匹配术语与用途：', pairs: [{ left: '功能分支', right: '实现隔离变更' }, { left: 'main 分支', right: '稳定集成基线' }, { left: '合并冲突', right: '同时变更碰撞' }, { left: 'rebase', right: '在新历史上重放提交' }], explanation: '理解分支提高开发可预测性。' }] },
      { title: 'Pull Request 与技术审查', questions: [{ type: 'choice', text: 'PR 中哪项元素提高审查质量？', options: ['空描述', '上下文、范围与可验证测试计划', '无说明的单一巨大提交', '无关混合变更'], ans: 1, explanation: '清晰减少审查摩擦。' }, { type: 'truefalse', text: '用技术证据回应评论可加速 PR 批准。', ans: true, explanation: '有效协作减少周期。', textFalse: '直接改完代码而不回复评论可以加快 PR 的通过。', explanationFalse: '审查者需要知道改了什么、为什么改；没有回复，他们只能从头重建上下文。'  }, { type: 'match', text: '匹配产物与价值：', pairs: [{ left: 'PR 描述', right: '传达变更意图' }, { left: 'CI 检查', right: '验证自动质量' }, { left: '审查评论', right: '改进拟议方案' }, { left: '合并策略', right: '保护 main 分支' }], explanation: '结构良好的 PR 提高代码可靠性。' }] },
      { title: 'Issue 管理与可追溯性', questions: [{ type: 'choice', text: '哪种做法最好连接报告问题与技术方案？', options: ['无上下文或步骤的 issue', '关联 issue、分支和 PR 并显式引用', '在仓库外解决', '无工单直接改生产'], ans: 1, explanation: '可追溯便于审计与学习。' }, { type: 'truefalse', text: 'issue 上的标签和优先级有助于按价值规划工作。', ans: true, explanation: '按影响与紧急度排序待办。', textFalse: '给 issue 打标签和排优先级只是官僚流程，不影响工作规划。', explanationFalse: '标签和优先级正是按价值与影响排列待办事项的依据。'  }, { type: 'match', text: '匹配管理元素与功能：', pairs: [{ left: 'Issue', right: '已记录工作单元' }, { left: 'Label', right: '主题/优先级分类' }, { left: 'Milestone', right: '按时间目标分组' }, { left: 'Assignee', right: '执行负责人' }], explanation: '显式管理减少运营不确定性。' }] },
      { title: 'GitHub Actions 入门 CI/CD', questions: [{ type: 'choice', text: '每次 PR 用 Actions 运行测试的关键优势？', options: ['消除人工审查', '合并前发现回归', '增大提交体积', '避免 main 分支'], ans: 1, explanation: 'CI 在流程早期防止缺陷。' }, { type: 'truefalse', text: '失败流水线应在受保护分支阻止合并。', ans: true, explanation: '保证最低质量标准。', textFalse: '如果团队赶着交付，流水线亮红灯也可以照常合并。', explanationFalse: '带着失败的流水线合并，会把故障带进主分支并阻塞整个团队。'  }, { type: 'match', text: '匹配工作流阶段与目标：', pairs: [{ left: 'checkout', right: '从仓库获取代码' }, { left: 'install', right: '准备依赖' }, { left: 'test', right: '验证预期行为' }, { left: 'artifact', right: '保存构建结果' }], explanation: '结构化流水线加速安全交付。' }] },
    ],
    examSections: [
      { title: '协作功能交付', questions: [{ type: 'choice', text: '团队报告频繁冲突合并和缓慢 PR。哪种干预影响最大？', options: ['允许直接推送到 main', '缩小分支、标准化 PR 模板并启用强制检查', '为速度禁用审查', '每月集中变更'], ans: 1, explanation: '流程纪律减少系统性摩擦。' }, { type: 'truefalse', text: '清晰的提交历史便于事故时受控回滚。', ans: true, explanation: '可快速隔离并回滚问题。', textFalse: '即使提交很大、信息笼统，事故时回滚同样简单。', explanationFalse: '回滚需要定位出问题的改动；提交过大时会连同正常工作的部分一起回滚。'  }, { type: 'match', text: '匹配风险与推荐控制：', pairs: [{ left: '未审查变更', right: '带审查者的分支保护' }, { left: '跳过测试', right: 'PR 强制 CI' }, { left: '模糊上下文', right: '标准化 PR 模板' }, { left: '不可见工作', right: 'Issue 关联开发' }], explanation: '协作质量是流程设计。' }] },
      { title: 'GitHub DevOps 治理', questions: [{ type: 'choice', text: '哪种指标表明 GitHub 交付流程成熟度？', options: ['巨大且稀少的提交', '短周期时间与低回滚率', '无变更文档', '可选流水线'], ans: 1, explanation: '衡量可持续的稳定与速度。' }, { type: 'truefalse', text: '在 CI 中自动化安全验证可降低发布漏洞风险。', ans: true, explanation: '早期安全检查减少暴露。', textFalse: '安全检查只需在每年发布前手动执行一次。', explanationFalse: '偶尔的人工审查会放过数月的变更；集成到 CI 后每次提交都会被验证。'  }, { type: 'match', text: '匹配实践与组织结果：', pairs: [{ left: 'Code owners', right: '领域专家审查' }, { left: 'Dependabot', right: '主动依赖更新' }, { left: '可复用 action', right: '流水线标准化' }, { left: 'Release 标签', right: '生产版本可追溯' }], explanation: '技术治理支撑团队扩展。' }] },
    ],
  },
  excel: {
    title: 'Excel',
    requirements: ['已安装 Microsoft Excel', '工作表练习数据', '基础单元格知识'],
    certModules: ['工作表基础', '关键公式', '查找与分析', '高管可视化'],
    docs: { label: 'Excel 官方帮助' },
    lessons: {
      'excel-l1': { title: '工作表结构与引用', section: '模块 1', description: '什么是 Excel？它有什么用途？本课建立组织数据和可靠引用的基础。', requirements: ['已安装 Microsoft Excel', '工作表练习数据'], steps: ['创建表头一致的数据表', '应用数字和日期格式', '区分相对/绝对引用', '命名关键工作区域', '以受控版本保存文件'], tip: '良好数据结构避免脆弱公式。', resources: { docs: 'Excel 简介' } },
      'excel-l2': { title: '核心业务公式', section: '模块 2', description: '什么是公式？它们有什么用途？您将学习自动化重复计算并减少手工错误。', requirements: ['已组织工作表结构', '基础函数知识'], steps: ['正确应用 SUM 和 AVERAGE', '用 IF 实现简单规则', '组合基础文本函数', '用正确引用复制公式', '用对照数据审计结果'], tip: '用边界情况验证后再认定公式正确。', resources: { docs: 'Excel 函数' } },
      'excel-l3': { title: 'VLOOKUP/XLOOKUP 与数据关系', section: '模块 3', description: '什么是跨表查找数据？它有什么用途？您将了解如何关联数据源而无需手工复制。', requirements: ['掌握基础公式', '可用参考表'], steps: ['准备干净主表', '应用 VLOOKUP 并识别局限', '在灵活场景实现 XLOOKUP', '用 IFERROR 处理错误', '与手工对照比较结果'], tip: '可用时优先 XLOOKUP 以获得更大灵活性。', resources: { docs: 'VLOOKUP 与 XLOOKUP' } },
      'excel-l4': { title: '数据透视表与切片', section: '模块 4', description: '什么是数据透视表？它有什么用途？您将学习汇总大量数据以快速决策。', requirements: ['干净表格数据', '筛选与排序知识'], steps: ['从干净源插入透视表', '配置行、列和值', '应用筛选器和切片器', '按期间创建对比指标', '新增数据时更新表'], tip: '源数据勿用空行，否则透视不稳定。', resources: { docs: 'Excel 数据透视表' } },
      'excel-l5': { title: '仪表板与高管沟通', section: '模块 5', description: '什么是 Excel 仪表板？它有什么用途？本课整合指标、可视化与叙事以支持高管决策。', requirements: ['可用透视表', '业务定义的指标'], steps: ['选择优先 KPI', '按指标选合适图表', '统一仪表板视觉风格', '添加筛选控件供探索', '与利益相关方验证一致性'], tip: '有用仪表板回答具体业务问题，而非展示一切。', resources: { docs: '创建图表与仪表板' } },
    },
    quizSections: [
      { title: '工作表结构与引用', questions: [{ type: 'choice', text: '复制公式时使用绝对引用可避免哪种操作错误？', options: ['系统语言变化', '关键单元格意外偏移', '网络故障', '文件锁定'], ans: 1, explanation: '绝对引用保留关键坐标。' }, { type: 'truefalse', text: '将区域转为表格可改善公式和筛选一致性。', ans: true, explanation: '结构化表格更稳健。', textFalse: '在普通区域上操作比转换成表格更能保持公式一致。', explanationFalse: '表格会在新增行时自动扩展公式和筛选；普通区域必须手动调整。'  }, { type: 'match', text: '匹配引用类型与行为：', pairs: [{ left: 'A1', right: '完全相对' }, { left: '$A$1', right: '完全绝对' }, { left: 'A$1', right: '固定行、相对列' }, { left: '$A1', right: '固定列、相对行' }], explanation: '理解引用是可靠模型的基础。' }] },
      { title: '核心业务公式', questions: [{ type: 'choice', text: '哪种方法减少复杂公式错误？', options: ['一行写完不验证', '分步构建并验证子结果', '从网上复制不改编', '只用手工值'], ans: 1, explanation: '增量验证提高精度。' }, { type: 'truefalse', text: 'IF 可在单元格中建模条件业务规则。', ans: true, explanation: '是决策逻辑的关键函数。', textFalse: 'IF 函数只能比较数字，无法用来表达业务规则。', explanationFalse: 'IF 可以判断任何逻辑条件（文本、日期、引用），并能串联业务规则。'  }, { type: 'match', text: '匹配函数与用法：', pairs: [{ left: 'SUM', right: '汇总数值' }, { left: 'AVERAGE', right: '求平均值' }, { left: 'IF', right: '条件求值' }, { left: 'CONCAT', right: '拼接文本' }], explanation: '基础函数覆盖大多数初始需求。' }] },
      { title: 'VLOOKUP/XLOOKUP 与数据关系', questions: [{ type: 'choice', text: 'XLOOKUP 在现代场景相比 VLOOKUP 有何优势？', options: ['仅适用于小表', '灵活左右查找与未找到处理', '替代透视表', '避免所有数据验证'], ans: 1, explanation: 'XLOOKUP 扩展场景并提高可读性。' }, { type: 'truefalse', text: '用明确策略处理 #N/A 可避免模糊报告。', ans: true, explanation: '未管理错误会扭曲决策。', textFalse: '最好让 #N/A 原样显示而不处理，这样报表更透明。', explanationFalse: '未加说明的 #N/A 会被误认为真正的缺失值；应使用 IFNA 处理并记录判断标准。'  }, { type: 'match', text: '匹配问题与解法：', pairs: [{ left: '键不存在', right: 'IFERROR 或 if_not_found' }, { left: '表无序', right: '使用精确查找' }, { left: '多数据源', right: '规范化主键' }, { left: '结果不一致', right: '审计查找范围' }], explanation: '数据质量决定分析质量。' }] },
      { title: '数据透视表与切片', questions: [{ type: 'choice', text: '更新时透视表不失败的关键要求？', options: ['鲜艳颜色', '源无空行或模糊表头', '多个隐藏表', '复杂条件格式'], ans: 1, explanation: '干净源决定汇总稳定性。' }, { type: 'truefalse', text: 'Excel 中无 HAVING，但切片器承担动态视觉筛选角色。', ans: true, explanation: '切片器改善非技术用户的数据探索。', textFalse: 'Excel 提供了与 SQL 等价的 HAVING 子句，用于在数据透视表中筛选分组。', explanationFalse: 'HAVING 属于 SQL；在 Excel 中交互式筛选靠切片器和数据透视表筛选器完成。'  }, { type: 'match', text: '匹配透视元素与功能：', pairs: [{ left: '行', right: '主分组维度' }, { left: '列', right: '次要轴对比' }, { left: '值', right: '聚合指标' }, { left: '筛选', right: '修剪分析数据集' }], explanation: '正确配置轴避免误读。' }] },
      { title: '仪表板与高管沟通', questions: [{ type: 'choice', text: '哪种标准使仪表板对高管更有用？', options: ['展示所有可能指标', '优先可行动 KPI 并附时间上下文', '使用装饰性 3D 图', '隐藏计算假设'], ans: 1, explanation: '仪表板应促进决策，而非仅展示数据。' }, { type: 'truefalse', text: '无 KPI 定义的仪表板可能导致矛盾解读。', ans: true, explanation: '指标需要共同含义。', textFalse: '只要图表清晰，是否书面定义 KPI 都不会改变仪表板的解读。', explanationFalse: '没有统一定义，各部门会各算各的指标，数字将失去可比性。'  }, { type: 'match', text: '匹配图表与推荐场景：', pairs: [{ left: '折线图', right: '时间演变' }, { left: '柱状图', right: '类别对比' }, { left: 'KPI 卡片', right: '当前关键值' }, { left: '切片器', right: '交互维度筛选' }], explanation: '选对可视化减少分析噪音。' }] },
    ],
    examSections: [
      { title: '商业分析案例', questions: [{ type: 'choice', text: '您需汇总 5 个区域代码不一致的销售。哪种顺序更扎实？', options: ['直接做图表', '标准化键、验证完整性再汇总指标', '只用条件格式', '逐表手工复制'], ans: 1, explanation: '无清洗与标准化则分析不可靠。' }, { type: 'truefalse', text: '若未先验证数据质量，透视表可掩盖源错误。', ans: true, explanation: '可视化不能修复缺陷数据。', textFalse: '数据透视表会自动发现并修正源数据中的错误。', explanationFalse: '数据透视表只是汇总它接收到的数据：源数据若有重复或类型错误，合计也会继承这些错误。'  }, { type: 'match', text: '匹配阶段与控制：', pairs: [{ left: '数据清洗', right: '消除源不一致' }, { left: '公式模型', right: '计算可重复指标' }, { left: '透视', right: '按维度汇总信息' }, { left: '仪表板', right: '传达高管发现' }], explanation: '完整链条保证可辩护的分析。' }] },
      { title: '报告质量治理', questions: [{ type: 'choice', text: '哪种做法减少月报的重复性错误？', options: ['每月手工改公式', '受控模板加验证与收尾清单', '移除绝对引用', '每周期改表结构'], ans: 1, explanation: '标准化提高运营可靠性。' }, { type: 'truefalse', text: '记录计算假设是分析可追溯性的一部分。', ans: true, explanation: '便于审计与工作延续。', textFalse: '只要公式写在表里，计算假设就无需记录。', explanationFalse: '公式展示的是怎么算而不是为什么这么算；没有假设说明，别人无法验证或复现分析。'  }, { type: 'match', text: '匹配风险与缓解：', pairs: [{ left: '数据不完整', right: '输入预先验证' }, { left: '指标模糊', right: '正式 KPI 定义' }, { left: '公式错误', right: '对照案例测试' }, { left: '个人依赖', right: '文档与共享模板' }], explanation: '报告质量是流程，而非单个文件。' }] },
    ],
  },
  powerpoint: {
    title: 'PowerPoint',
    requirements: ['Microsoft PowerPoint', '明确的演示目标', '准备好的基础内容'],
    certModules: ['视觉叙事', '幻灯片设计', '有效动画', '高管演示'],
    docs: { label: 'PowerPoint 官方帮助' },
    lessons: {
      'powerpoint-l1': { title: '演示叙事结构', section: '模块 1', description: '什么是有效叙事？它有什么用途？您将学习组织观点以清晰引导决策。', requirements: ['Microsoft PowerPoint', '明确的演示目标'], steps: ['定义受众与预期结果', '用逻辑故事设计目录', '为每张幻灯片分配主信息', '删除冗余内容', '验证完整流程连贯性'], tip: '一张幻灯片应支撑一个主观点，而非五个。', resources: { docs: '创建有效演示' } },
      'powerpoint-l2': { title: '视觉设计与幻灯片母版', section: '模块 2', description: '什么是幻灯片母版？它有什么用途？您将了解如何在整套幻灯片中保持字体与视觉一致。', requirements: ['已定义叙事', '准备好的基础内容'], steps: ['配置颜色主题与字体', '用基础版式编辑幻灯片母版', '应用标题视觉层级', '用参考线对齐对象', '审查全局设计一致性'], tip: '若每张都改风格，会失去视觉可信度。', resources: { docs: '使用幻灯片母版' } },
      'powerpoint-l3': { title: '图表、数据与高管清晰度', section: '模块 3', description: '什么是幻灯片上的数据沟通？它有什么用途？您将学习把数字转化为可行动信息。', requirements: ['基础视觉设计', '来自 Excel 或源的结构化数据'], steps: ['按问题类型选图表', '用对比突出关键数据', '简化多余图例与坐标轴', '适当时链接数据', '为每张图添加明确结论'], tip: '无洞察的图表是装饰，不是沟通。', resources: { docs: '在 PowerPoint 中插入图表' } },
      'powerpoint-l4': { title: '有目的的动画与过渡', section: '模块 4', description: '什么是有效动画？它们有什么用途？本课避免干扰并改善讲解节奏。', requirements: ['结构化演示', '已组织视觉内容'], steps: ['在章节间应用一致过渡', '用简单动画揭示观点', '在动画面板控制顺序', '与演讲同步节奏', '在演示模式测试显示'], tip: '动画应强化信息，而非与之竞争。', resources: { docs: 'PowerPoint 动画' } },
      'powerpoint-l5': { title: '交付、排练与问答处理', section: '模块 5', description: '什么是娴熟演示？它有什么用途？您将学习有冲击力地收尾并用证据回答问题。', requirements: ['演示稿接近完成', '已完成基础排练'], steps: ['配置带备注的演讲者视图', '按章节排练时间安排', '准备备用幻灯片', '用具体数据回应异议', '以清晰行动号召收尾'], tip: '排练幻灯片间的口头过渡，而非孤立地练每张。', resources: { docs: '自信地演示幻灯片' } },
    },
    quizSections: [
      { title: '演示叙事结构', questions: [{ type: 'choice', text: '哪种做法提高高管受众的信息记忆留存？', options: ['以深度技术细节开场', '构建问题-影响-解决方案故事', '展示所有数字无综合', '避免明确结论'], ans: 1, explanation: '面向决策的叙事便于理解。' }, { type: 'truefalse', text: '设计幻灯片前先定义受众可改善内容聚焦。', ans: true, explanation: '可调整深度与语言。', textFalse: '最好先做幻灯片，等到彩排时再考虑受众。', explanationFalse: '受众决定详略程度和用语；事后才确定就得重做内容。'  }, { type: 'match', text: '匹配章节与叙事目标：', pairs: [{ left: '开场', right: '设定背景与目标' }, { left: '展开', right: '用证据支撑' }, { left: '结论', right: '提出决策或行动' }, { left: '问答', right: '解决关键疑问' }], explanation: '清晰故事减少沟通摩擦。' }] },
      { title: '视觉设计与幻灯片母版', questions: [{ type: 'choice', text: '长演示中使用幻灯片母版有何运营优势？', options: ['复制文件体积', '集中样式并避免幻灯片间不一致', '阻止文字编辑', '禁止使用图表'], ans: 1, explanation: '母版减少重复手工。' }, { type: 'truefalse', text: '保持一致的色板与字体提高专业感。', ans: true, explanation: '视觉连贯传达清晰与严谨。', textFalse: '每张幻灯片都变换配色和字体会让演示显得更专业。', explanationFalse: '不断变化会分散注意力并削弱可信度；一致性才会被视为专业。'  }, { type: 'match', text: '匹配设计元素与功能：', pairs: [{ left: '字体', right: '层级阅读' }, { left: '颜色', right: '优先视觉注意力' }, { left: '留白', right: '降低认知饱和' }, { left: '对齐', right: '构图秩序' }], explanation: '一致设计支撑叙事。' }] },
      { title: '图表、数据与高管清晰度', questions: [{ type: 'choice', text: '呈现复杂数据时的主要错误？', options: ['按问题选图', '展示无明确洞察的可视化', '突出关键指标', '比较同质期间'], ans: 1, explanation: '无解读的数据无法引导决策。' }, { type: 'truefalse', text: '图表应回答具体业务问题。', ans: true, explanation: '无目的可视化产生噪音。', textFalse: '好的图表应展示所有可用指标，让观众自己选择关注点。', explanationFalse: '什么都展示的图表等于什么都没传达；每张图都应回答一个具体问题。'  }, { type: 'match', text: '匹配图表与推荐用法：', pairs: [{ left: '折线', right: '时间趋势' }, { left: '柱状', right: '类别对比' }, { left: '面积', right: '累积演变' }, { left: 'KPI 卡片', right: '展示关键点数值' }], explanation: '选对视觉提高理解。' }] },
      { title: '有目的的动画与过渡', questions: [{ type: 'choice', text: '高管场景下专业动画的标准？', options: ['最大视觉复杂度', '支持讲解节奏而不分散注意', '每张换不同效果', '一切用默认效果'], ans: 1, explanation: '动画应功能性，非装饰性。' }, { type: 'truefalse', text: '过多不同过渡会降低受众对核心信息的专注。', ans: true, explanation: '一致性有助于保持认知注意。', textFalse: '使用的转场效果越多样，观众对内容的注意力就越集中。', explanationFalse: '特效会把注意力吸引到自身，与内容争夺关注；使用统一克制的转场更合适。'  }, { type: 'match', text: '匹配资源与预期效果：', pairs: [{ left: '淡入淡出', right: '观点间离散过渡' }, { left: '分块出现', right: '控制内容揭示' }, { left: 'Morph', right: '状态间视觉连续' }, { left: '无动画', right: '优先清晰静态内容' }], explanation: '选择取决于沟通意图。' }] },
      { title: '交付、排练与问答处理', questions: [{ type: 'choice', text: '哪种做法改善困难问题的表现？', options: ['照读幻灯片文字', '准备备用证据与异议场景', '无数据即兴', '避免问答环节'], ans: 1, explanation: '准备可预见沟通风险。' }, { type: 'truefalse', text: '按章节排练时间安排 可减少演示末尾过载。', ans: true, explanation: '管理节奏与内容覆盖。', textFalse: '只彩排总时长就足以避免最后时间不够。', explanationFalse: '总时长看不出延误积累在哪里；没有分段计时，最后几页只能匆匆带过。'  }, { type: 'match', text: '匹配阶段与准备重点：', pairs: [{ left: '预排练', right: '调整叙事与顺序' }, { left: '技术排练', right: '验证设备与格式' }, { left: '正式演示', right: '将信息与受众连接' }, { left: '会后', right: '收集反馈迭代' }], explanation: '讲好演示是迭代过程。' }] },
    ],
    examSections: [
      { title: '战略成果演示', questions: [{ type: 'choice', text: '您需在有限时间内向领导汇报季度成果。哪种方法影响最大？', options: ['展示所有运营细节', '综合关键发现、风险与建议决策', '只用炫目动画', '逐表完整朗读'], ans: 1, explanation: '领导需要清晰以快速决策。' }, { type: 'truefalse', text: '每节明确结论有助于受众记住关键信息。', ans: true, explanation: '结构与综合改善记忆留存。', textFalse: '让结论保持隐含，观众反而更容易记住关键信息。', explanationFalse: '结论不明说，每个人带走的理解都不同；明确表述才能固定信息。'  }, { type: 'match', text: '匹配挑战与专业回应：', pairs: [{ left: '时间缩短', right: '优先高影响信息' }, { left: '受众异质', right: '清晰语言加技术附录' }, { left: '数据异议', right: '可验证证据与来源' }, { left: '待定决策', right: '可执行最终建议' }], explanation: '演示价值在于促成决策。' }] },
      { title: '高管沟通质量', questions: [{ type: 'choice', text: '哪种信号表明团队演示治理良好？', options: ['每位作者风格不同', '模板、指南与标准化事前审查', '无版本控制', '最后一刻无记录变更'], ans: 1, explanation: '标准化保护质量与声誉。' }, { type: 'truefalse', text: '记录最终版与 PDF 备份可降低活动运营风险。', ans: true, explanation: '防止兼容性或误编辑导致失败。', textFalse: '参加活动演示时，只带云端的可编辑文件是最保险的做法。', explanationFalse: '没有网络或应用版本不同，文件可能打不开；PDF 备份才能保证演示进行。'  }, { type: 'match', text: '匹配控制与结果：', pairs: [{ left: '事前清单', right: '减少现场错误' }, { left: '视觉指南', right: '演讲者间一致' }, { left: '计时排练', right: '遵守时间' }, { left: '备用幻灯片', right: '扎实回答问题' }], explanation: '卓越演示靠流程构建。' }] },
    ],
  },
  sql: {
    title: 'SQL',
    requirements: ['可用 SQL 引擎（PostgreSQL/MySQL）', '练习数据集', 'SQL 编辑器或客户端'],
    certModules: ['基础查询', 'JOIN 与聚合', '子查询/CTE', '优化与安全'],
    docs: { label: 'PostgreSQL 文档' },
    lessons: {
      'sql-l1': { title: 'SELECT、筛选与排序', section: '模块 1', description: '什么是 SQL？它有什么用途？您将从用筛选和排序精确查询数据开始。', requirements: ['可用 SQL 引擎', '练习数据集'], steps: ['连接示例数据库', '用显式列执行 SELECT', '用 WHERE 和逻辑运算符筛选', '用 ORDER BY 排序', '限制结果以快速分析'], tip: '生产查询避免 SELECT *，以利清晰与性能。', resources: { docs: 'SQL 基础教程' } },
      'sql-l2': { title: 'JOIN 与表关系', section: '模块 2', description: '什么是合并表？它有什么用途？您将学习关联相关数据而不丢失业务上下文。', requirements: ['基础 SELECT 与 WHERE', '简单关系模型'], steps: ['识别主键与外键', '在基础案例应用 INNER JOIN', '用 LEFT JOIN 保留缺失行', '按基数检测重复', '用对照计数验证结果'], tip: '先理解表关系，再写 JOIN。', resources: { docs: 'PostgreSQL JOIN' } },
      'sql-l3': { title: 'GROUP BY 与聚合函数', section: '模块 3', description: '什么是聚合数据？它有什么用途？您将了解如何获得有用指标而不丢失可追溯性。', requirements: ['基础 JOIN', '筛选处理'], steps: ['按类别计算 COUNT、SUM、AVG', '区分行筛选与组筛选', '在聚合中使用 HAVING', '用 COALESCE 处理 null', '比较跨期指标'], tip: 'SELECT 中每个非聚合列必须在 GROUP BY 中。', resources: { docs: '聚合函数' } },
      'sql-l4': { title: '子查询与 CTE', section: '模块 4', description: '什么是 CTE？它们有什么用途？您将学习把复杂查询结构化为可读、可维护的块。', requirements: ['掌握 GROUP BY', '中级查询'], steps: ['构建筛选子查询', '用 WITH 将逻辑迁移到 CTE', '链式两个 CTE 做分析流水线', '比较可读性与初始性能', '为团队审查重构查询'], tip: 'CTE 为清晰，但大体积需验证执行计划。', resources: { docs: 'WITH 查询（CTE）' } },
      'sql-l5': { title: '优化、索引与安全', section: '模块 5', description: '什么是 SQL 优化？它有什么用途？本课涵盖性能、完整性与防 SQL 注入实践。', requirements: ['可用复杂查询', '测试环境可访问 EXPLAIN'], steps: ['用 EXPLAIN 解读计划', '在筛选列创建索引', '比较优化前后性能', '在应用中应用参数化查询', '审查最低用户权限'], tip: '用计划与计时证据优化，而非直觉。', resources: { docs: '索引与性能' } },
    },
    quizSections: [
      { title: 'SELECT、筛选与排序', questions: [{ type: 'choice', text: '哪种做法改善报表查询可维护性？', options: ['所有视图 SELECT *', '显式列与清晰别名', '总是按数字位置排序', '移除 WHERE'], ans: 1, explanation: '显式意图便于演进与审计。' }, { type: 'truefalse', text: 'WHERE 在任何聚合前筛选行。', ans: true, explanation: '在早期评估阶段应用。', textFalse: 'WHERE 在分组之后执行，因此可以对 SUM 或 COUNT 的结果进行筛选。', explanationFalse: 'WHERE 在 GROUP BY 之前执行；要筛选聚合结果需使用 HAVING。'  }, { type: 'match', text: '匹配子句与功能：', pairs: [{ left: 'SELECT', right: '定义输出列' }, { left: 'FROM', right: '指明数据源' }, { left: 'WHERE', right: '应用行筛选' }, { left: 'ORDER BY', right: '排序最终结果' }], explanation: '理解查询逻辑流至关重要。' }] },
      { title: 'JOIN 与表关系', questions: [{ type: 'choice', text: '未分析基数就 JOIN 表会出现什么风险？', options: ['自动更好性能', '意外行重复与指标失真', '数据压缩', 'SQL 引擎锁定'], ans: 1, explanation: '误解基数会扭曲结果。' }, { type: 'truefalse', text: 'LEFT JOIN 即使无匹配也保留左表所有行。', ans: true, explanation: '右列可能为 NULL。', textFalse: 'LEFT JOIN 会丢弃左表中在右表找不到匹配的行。', explanationFalse: '那是 INNER JOIN 的行为；LEFT JOIN 保留左表并用 NULL 填充。'  }, { type: 'match', text: '匹配 JOIN 类型与结果：', pairs: [{ left: 'INNER JOIN', right: '仅两表匹配行' }, { left: 'LEFT JOIN', right: '全部左行 + 右匹配' }, { left: 'RIGHT JOIN', right: '全部右行 + 左匹配' }, { left: 'CROSS JOIN', right: '行笛卡尔积' }], explanation: '选对 JOIN 避免误读。' }] },
      { title: 'GROUP BY 与聚合函数', questions: [{ type: 'choice', text: '何时用 HAVING 而非 WHERE？', options: ['筛选索引列', '按组筛选聚合结果', '降序排序', '创建索引'], ans: 1, explanation: 'HAVING 在聚合后操作。' }, { type: 'truefalse', text: 'COUNT(DISTINCT field) 有助于在大集合中衡量唯一性。', ans: true, explanation: '减少重复导致的过度计数。', textFalse: 'COUNT(DISTINCT 字段) 返回的是总行数，与 COUNT(*) 相同。', explanationFalse: 'COUNT(*) 统计行数；COUNT(DISTINCT 字段) 统计唯一值，这才是衡量唯一性的方式。'  }, { type: 'match', text: '匹配函数与分析目标：', pairs: [{ left: 'COUNT', right: '记录数量' }, { left: 'SUM', right: '数值累加' }, { left: 'AVG', right: '数值平均' }, { left: 'MAX', right: '观测最大值' }], explanation: '聚合函数回答关键业务问题。' }] },
      { title: '子查询与 CTE', questions: [{ type: 'choice', text: '冗长查询中 CTE 的主要优势？', options: ['在无限内存中执行', '将复杂逻辑分为可读块', '避免任何执行成本', '自动替代索引'], ans: 1, explanation: '可读性改善审查与维护。' }, { type: 'truefalse', text: '相关子查询若每行执行可能影响性能。', ans: true, explanation: '应评估执行计划。', textFalse: '相关子查询只执行一次，因此开销与数据量无关。', explanationFalse: '相关子查询会对外层每一行执行一次：开销随数据量增长。'  }, { type: 'match', text: '匹配技术与用法：', pairs: [{ left: 'CTE', right: '分步逻辑流水线' }, { left: '标量子查询', right: '派生单一值' }, { left: 'EXISTS', right: '高效验证存在' }, { left: 'IN', right: '与值集比较' }], explanation: '选对技术影响清晰度与性能。' }] },
      { title: '优化、索引与安全', questions: [{ type: 'choice', text: '哪种措施降低应用中的 SQL 注入风险？', options: ['在查询中拼接用户输入', '使用参数化查询', '给应用超级用户权限', '隐藏错误不记录'], ans: 1, explanation: '分离数据与指令可缓解注入。' }, { type: 'truefalse', text: '索引可加速读，但写操作也有维护成本。', ans: true, explanation: '每项优化都有权衡。', textFalse: '增加索引只有好处，因此最好为每一列都建索引。', explanationFalse: '每个索引都要在 INSERT、UPDATE、DELETE 时维护并占用空间：索引过多会拖慢写入。'  }, { type: 'match', text: '匹配实践与效果：', pairs: [{ left: 'EXPLAIN', right: '检查执行计划' }, { left: '索引', right: '加速常用筛选/连接' }, { left: '预处理语句', right: '查询安全与复用' }, { left: '最小权限', right: '缩小损害面' }], explanation: '性能与安全应共同演进。' }] },
    ],
    examSections: [
      { title: '关系数据分析', questions: [{ type: 'choice', text: '您需构建多维度大容量的月度销售报告。哪种方法更稳健？', options: ['无验证的单一非结构化查询', '分阶段 CTE、验证 JOIN 与审计聚合', '全部导出 Excel 不用 SQL', '每份报告复制表'], ans: 1, explanation: '结构化 SQL 流水线提高可靠性与可维护性。' }, { type: 'truefalse', text: '不验证 JOIN 基数，聚合指标可能被放大。', ans: true, explanation: '关系完整性对分析精度至关重要。', textFalse: '连接的基数不会影响合计，因为 SQL 会自动避免重复行。', explanationFalse: '一对多连接会复制左表的行并使求和虚高；必须验证基数。'  }, { type: 'match', text: '匹配问题与技术控制：', pairs: [{ left: '高延迟', right: '计划分析与合适索引' }, { left: '计数错误', right: '审查 JOIN 与 DISTINCT' }, { left: '安全失败', right: '参数与最低权限' }, { left: '难读查询', right: '用语义 CTE 重构' }], explanation: '良好 SQL 设计平衡精度、性能与安全。' }] },
      { title: '查询运营质量', questions: [{ type: 'choice', text: '哪种做法便于多分析师维护关键查询？', options: ['无别名无注释的查询', '风格标准、命名与同行评审', '每份报告改字段名', '排除验证测试'], ans: 1, explanation: '标准化减少对单人的依赖。' }, { type: 'truefalse', text: '在仓库中版本化 SQL 脚本可改善业务变更可追溯性。', ans: true, explanation: '便于审计与可靠回滚。', textFalse: '把 SQL 脚本放在共享文件夹中，与版本控制具有同样的可追溯性。', explanationFalse: '文件夹只保存当前文件；仓库记录了谁在何时、为何改动了什么。'  }, { type: 'match', text: '匹配产物与益处：', pairs: [{ left: '版本化脚本', right: '技术决策历史' }, { left: '测试数据集', right: '可复现验证' }, { left: 'QA 清单', right: '早期发现不一致' }, { left: '假设文档', right: '正确解读指标' }], explanation: '成熟分析运营需要工程纪律。' }] },
    ],
  },
  cybersecurity: {
    title: '网络安全',
    requirements: ['已更新浏览器', '测试邮箱账户', '基础网络与账户知识'],
    certModules: ['CIA 基础', '常见威胁', '预防控制', '事件响应'],
    docs: { label: 'OWASP Top 10' },
    lessons: {
      'cybersecurity-l1': { title: '数字安全基础', section: '模块 1', description: '什么是网络安全？它有什么用途？您将理解如何在数字环境中保护信息、系统与人员。', requirements: ['已更新浏览器', '基础网络与账户知识'], steps: ['定义机密性、完整性与可用性', '识别关键信息资产', '认识基本攻击面', '将风险与业务影响关联', '创建优先控制初始清单'], tip: '安全不是产品，而是持续实践。', resources: { docs: 'OWASP 简介' } },
      'cybersecurity-l2': { title: '钓鱼与社会工程', section: '模块 2', description: '社会工程在攻击中有什么用途？您将学习识别数字操纵的早期迹象。', requirements: ['测试邮箱账户', '关注欺诈模式'], steps: ['分析发件人与真实域名', '检测紧迫与操纵性语言', '打开前验证链接', '向官方渠道举报可疑消息', '模拟对欺诈尝试的安全响应'], tip: '若某事听起来紧迫又反常，请通过另一渠道核实。', resources: { docs: '反钓鱼指南' } },
      'cybersecurity-l3': { title: '密码、MFA 与访问控制', section: '模块 3', description: '什么是保护凭据？它有什么用途？本课降低个人与企业账户未授权访问风险。', requirements: ['基础数字账户知识', '可访问安全设置'], steps: ['创建唯一且足够长的密码', '配置密码管理器', '在关键服务启用 MFA', '审查活动会话与设备', '移除过时或不安全访问'], tip: '重复使用密码会放大单次泄露的影响。', resources: { docs: 'NIST 多因素认证' } },
      'cybersecurity-l4': { title: '恶意软件、勒索软件与终端防护', section: '模块 4', description: '恶意软件在攻击中有什么用途？您将了解如何预防感染并限制运营损害。', requirements: ['已更新设备', '可访问基础杀毒或 EDR'], steps: ['区分常见恶意软件类型', '配置自动更新', '审查安全下载策略', '定义已验证的备份策略', '练习感染初期响应'], tip: '未测试的备份只是恢复假设。', resources: { docs: 'CISA 最佳实践' } },
      'cybersecurity-l5': { title: '事件响应与安全文化', section: '模块 5', description: '什么是事件响应？它有什么用途？您将学习快速行动、控制影响并改进事后流程。', requirements: ['威胁与控制概念', '明确的内部沟通渠道'], steps: ['检测并分类报告的事件', '用即时行动控制范围', '按严重程度升级至合适团队', '记录证据与时间线', '进行回顾并制定预防改进'], tip: '速度重要，但文档也为未来运营节省时间。', resources: { docs: 'NIST 事件响应' } },
    },
    quizSections: [
      { title: '数字安全基础', questions: [{ type: 'choice', text: '哪种情况直接损害数据机密性？', options: ['加密备份副本', '未授权访问敏感信息', '操作系统更新', '可用性监控'], ans: 1, explanation: '不应看到数据者看到即违反机密性。' }, { type: 'truefalse', text: 'CIA 三元组是评估安全风险的基础。', ans: true, explanation: '可分类影响并优先控制。', textFalse: 'CIA 三要素指的是安全控制的成本、实施与审计。', explanationFalse: 'CIA 指机密性、完整性和可用性：评估风险的三大支柱。'  }, { type: 'match', text: '匹配支柱与重点：', pairs: [{ left: '机密性', right: '限制不当访问' }, { left: '完整性', right: '防止未授权篡改' }, { left: '可用性', right: '及时服务访问' }, { left: '风险', right: '概率乘以影响' }], explanation: '每个安全计划都从这些概念开始。' }] },
      { title: '钓鱼与社会工程', questions: [{ type: 'choice', text: '对索要凭据的紧急邮件，最佳首要响应？', options: ['立即回复以免锁定', '通过备用渠道验证真实性并举报', '在隐身模式打开链接', '转发给所有人确认'], ans: 1, explanation: '外部验证避免落入操纵。' }, { type: 'truefalse', text: '人为紧迫感是常见社会工程手段。', ans: true, explanation: '旨在降低受害者批判思考。', textFalse: '制造紧迫感的消息说明请求是合法的，来自官方渠道。', explanationFalse: '紧迫感正是阻止你核实的手段；遇到意外的紧急请求，应保持怀疑并通过其他渠道确认。'  }, { type: 'match', text: '匹配信号与相关风险：', pairs: [{ left: '可疑域名', right: '身份冒充' }, { left: '意外附件', right: '可能恶意软件' }, { left: '保密请求', right: '凭据窃取' }, { left: '书写错误', right: '可能欺诈活动' }], explanation: '识别早期信号可打断攻击链。' }] },
      { title: '密码、MFA 与访问控制', questions: [{ type: 'choice', text: '哪种做法最能降低撞库风险？', options: ['重复密码仅做小改', '唯一密码 + 管理器 + MFA', '一年只改一次密码', '通过内部聊天共享密码'], ans: 1, explanation: '组合控制降低自动化攻击成功率。' }, { type: 'truefalse', text: '即使密码泄露，MFA 仍有价值。', ans: true, explanation: '为未授权访问增加额外屏障。', textFalse: '一旦密码泄露，MFA 就不再提供任何保护。', explanationFalse: '这正是 MFA 发挥作用的场景：攻击者仍然缺少第二重验证。'  }, { type: 'match', text: '匹配控制与益处：', pairs: [{ left: '密码管理器', right: '长唯一密钥无需全记' }, { left: 'MFA', right: '第二认证因素' }, { left: '会话审查', right: '发现异常访问' }, { left: '最小权限原则', right: '降低被攻破账户影响' }], explanation: '身份保护需要互补层次。' }] },
      { title: '恶意软件、勒索软件与终端防护', questions: [{ type: 'choice', text: '哪种措施降低勒索软件的运营影响？', options: ['为速度关闭杀毒', '离线且定期测试的备份', '允许未知宏', '使用未打补丁软件'], ans: 1, explanation: '恢复依赖经验证完好的副本。' }, { type: 'truefalse', text: '给系统打补丁可降低已知漏洞暴露。', ans: true, explanation: '投机性攻击利用过时软件。', textFalse: '补丁应无限期推迟，因为每次更新带来的风险都大于它消除的风险。', explanationFalse: '已知漏洞是最常被利用的；打补丁才能关闭暴露窗口。'  }, { type: 'match', text: '匹配威胁与推荐控制：', pairs: [{ left: '勒索软件', right: '备份 + 分段 + 快速响应' }, { left: '木马', right: '仅可信来源下载' }, { left: '间谍软件', right: '终端检测与监控' }, { left: '恶意 U 盘', right: '设备策略与自动阻断' }], explanation: '预防与响应控制应并存。' }] },
      { title: '事件响应与安全文化', questions: [{ type: 'choice', text: '发现活跃事件时，哪项初始步骤关键？', options: ['不行动等待最终确认', '按定义严重程度控制并升级', '在社交媒体发布细节', '不保留证据重启一切'], ans: 1, explanation: '早期控制减少损害并便于调查。' }, { type: 'truefalse', text: '记录事件时间线有助于改进未来控制。', ans: true, explanation: '支持组织学习与审计。', textFalse: '事件一旦被控制，记录时间线对团队就不再有价值。', explanationFalse: '时间线揭示了检测与响应在哪里失效；没有它，同样的事件会再次发生。'  }, { type: 'match', text: '匹配响应阶段与目的：', pairs: [{ left: '检测', right: '识别可疑事件' }, { left: '控制', right: '限制影响扩散' }, { left: '根除', right: '消除根本原因' }, { left: '经验教训', right: '加强未来预防' }], explanation: '有效响应是循环的，每次事件都会改进。' }] },
    ],
    examSections: [
      { title: '真实事件场景', questions: [{ type: 'choice', text: '同事运行了可疑附件并报告异常行为。哪种顺序最正确？', options: ['忽略直到更多报告', '隔离设备、通知 SOC/IT、保留证据并评估范围', '无记录立即格式化', '分享给更多用户对比'], ans: 1, explanation: '早期控制与证据至关重要。' }, { type: 'truefalse', text: '无正式举报渠道会明显恶化事件响应时间。', ans: true, explanation: '沟通治理影响韧性。', textFalse: '通过非正式渠道上报事件比正式渠道响应更快。', explanationFalse: '没有正式渠道，警报会淹没在消息中且无人负责；响应时间会大幅拉长。'  }, { type: 'match', text: '匹配症状与初始行动：', pairs: [{ left: '异常网络活动', right: '隔离终端并监控流量' }, { left: '账户被攻破', right: '强制重置并撤销会话' }, { left: '大量文件被加密', right: '启动反勒索计划' }, { left: '内部欺诈邮件', right: '阻断活动并告警用户' }], explanation: '首次响应速度决定最终损害。' }] },
      { title: '组织网络安全成熟度', questions: [{ type: 'choice', text: '哪种做法反映组织更高安全成熟度？', options: ['可选年度培训无跟进', '持续培训、演练与基于事件的改进', '只买工具无流程', '有政策无明确负责人'], ans: 1, explanation: '文化与流程支撑技术控制。' }, { type: 'truefalse', text: '有效安全需要业务、IT 与用户共同负责。', ans: true, explanation: '不依赖单一孤立团队。', textFalse: '安全完全是 IT 部门的责任，与业务部门和用户无关。', explanationFalse: '大多数事件都源于用户或业务决策：责任是共担的。'  }, { type: 'match', text: '匹配能力与结果：', pairs: [{ left: '持续意识', right: '降低钓鱼成功率' }, { left: '已测试响应计划', right: '更快恢复' }, { left: '补丁管理', right: '降低已知 CVE 暴露' }, { left: '定期审计', right: '可见差距与合规' }], explanation: '成熟度靠持续运营纪律构建。' }] },
    ],
  },
};

if (typeof module !== 'undefined') module.exports = { LEVELS_ZH, CURRICULUM_ZH };


;/* --- src/js/services/I18n.js --- */
'use strict';



const I18n = (() => {



  const STORAGE_KEY = 'in4mind_locale';

  const DEFAULT = 'es';

  const SUPPORTED = ['es', 'en', 'zh'];

  const LABELS = { es: 'ES', en: 'EN', zh: '中' };

  let _locale = DEFAULT;



  const MOUNT_SLOTS = [

    { selector: '.topbar__actions', before: '.avatar, #avatar', variant: 'app' },

    { selector: '.ai-topbar__actions', before: '.avatar, #avatar', variant: 'app' },

    { selector: '.lp-header__actions', before: '.lp-btn--primary', variant: 'landing' },

    { selector: '.legal-header__actions', before: '.legal-btn-back', variant: 'auth' },

  ];



  function normalizeLocale(locale) {

    const code = String(locale || '').toLowerCase();

    if (code === 'en') return 'en';

    if (code === 'zh' || code === 'zh-cn' || code === 'cn') return 'zh';

    return 'es';

  }



  function _dict() {

    if (_locale === 'en' && typeof LOCALE_EN !== 'undefined') return LOCALE_EN;

    if (_locale === 'zh' && typeof LOCALE_ZH !== 'undefined') return LOCALE_ZH;

    return typeof LOCALE_ES !== 'undefined' ? LOCALE_ES : {};

  }



  function _lookup(obj, path) {

    return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);

  }



  function getLocale() {

    return _locale;

  }



  function t(key, params) {
    if (!key) return '';
    let val = _lookup(_dict(), key);
    // Fallbacks: never surface raw keys if ES/EN have a string.
    if (val == null && _locale !== 'es' && typeof LOCALE_ES !== 'undefined') {
      val = _lookup(LOCALE_ES, key);
    }
    if (val == null && _locale !== 'en' && typeof LOCALE_EN !== 'undefined') {
      val = _lookup(LOCALE_EN, key);
    }
    if (val == null && typeof LOCALE_ZH !== 'undefined') {
      val = _lookup(LOCALE_ZH, key);
    }
    if (val == null) return key;
    if (typeof val !== 'string') return val;
    if (params) {
      Object.keys(params).forEach(k => {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
    }
    return val;
  }



  function setLocale(locale, { reload = false, force = false } = {}) {

    const next = normalizeLocale(locale);

    if (!SUPPORTED.includes(next)) return;

    if (!force && next === _locale && !reload) return;

    _locale = next;

    localStorage.setItem(STORAGE_KEY, next);

    document.documentElement.lang = next === 'zh' ? 'zh-CN' : next;

    document.documentElement.setAttribute('data-locale', next);

    applyDom();

    _refreshAllLangSwitchers();

    window.dispatchEvent(new CustomEvent('in4mind-locale-change', { detail: { locale: next } }));

    if (reload) window.location.reload();

  }



  function _refreshAllLangSwitchers() {

    document.querySelectorAll('.lang-switcher').forEach(wrap => {

      wrap.setAttribute('aria-label', t('settings.language'));

      wrap.querySelectorAll('.lang-switcher__btn').forEach(btn => {

        const active = btn.dataset.lang === _locale;

        btn.classList.toggle('lang-switcher__btn--active', active);

        btn.setAttribute('aria-pressed', String(active));

        btn.setAttribute('aria-label', t('settings.languageSwitch', { lang: btn.textContent }));

      });

    });

  }



  function _applyToElement(el) {

    const key = el.getAttribute('data-i18n');

    if (!key) return;

    const attr = el.getAttribute('data-i18n-attr');

    const val = t(key);

    if (attr) {

      if (attr === 'html') el.innerHTML = val;

      else el.setAttribute(attr, val);

    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {

      if (el.hasAttribute('placeholder') || el.getAttribute('data-i18n-attr') === 'placeholder') {

        el.placeholder = val;

      } else {

        el.value = val;

      }

    } else {

      el.textContent = val;

    }

  }



  function applyDom(root) {

    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(_applyToElement);

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {

      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));

    });

    scope.querySelectorAll('[data-i18n-title]').forEach(el => {

      if (el === document.documentElement) return;

      el.title = t(el.getAttribute('data-i18n-title'));

    });

    document.documentElement.removeAttribute('title');

    scope.querySelectorAll('[data-i18n-aria]').forEach(el => {

      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));

    });

    document.title = t(document.documentElement.getAttribute('data-i18n-title') || 'meta.defaultTitle');

  }



  function _createLangBtn(code, label) {

    const btn = document.createElement('button');

    btn.type = 'button';

    btn.className = 'lang-switcher__btn';

    btn.dataset.lang = code;

    btn.textContent = label;

    btn.setAttribute('aria-pressed', String(_locale === code));

    btn.setAttribute('aria-label', t('settings.languageSwitch', { lang: label }));

    if (_locale === code) btn.classList.add('lang-switcher__btn--active');

    btn.addEventListener('click', () => {

      setLocale(code, { force: _locale === code });

    });

    return btn;

  }



  function mountLanguageSwitcher(container) {

    const wrap = document.createElement('div');

    wrap.className = 'lang-switcher';

    wrap.setAttribute('role', 'group');

    wrap.setAttribute('aria-label', t('settings.language'));

    SUPPORTED.forEach((code, i) => {

      if (i > 0) wrap.appendChild(document.createTextNode(' | '));

      wrap.appendChild(_createLangBtn(code, LABELS[code] || code.toUpperCase()));

    });

    if (container) {

      container.innerHTML = '';

      container.appendChild(wrap);

    }

    return wrap;

  }



  function mount() {

    document.querySelectorAll('[data-lang-switcher]').forEach(el => {

      if (!el.querySelector('.lang-switcher')) mountLanguageSwitcher(el);

    });

    MOUNT_SLOTS.forEach(({ selector, before }) => {

      const container = document.querySelector(selector);

      if (!container || container.querySelector('.lang-switcher')) return;

      const wrap = mountLanguageSwitcher();

      if (before) {

        const ref = container.querySelector(before);

        if (ref) container.insertBefore(wrap, ref);

        else container.appendChild(wrap);

      } else {

        container.appendChild(wrap);

      }

    });

  }



  function initEarly() {

    _locale = normalizeLocale(localStorage.getItem(STORAGE_KEY) || DEFAULT);

    document.documentElement.lang = _locale === 'zh' ? 'zh-CN' : _locale;

    document.documentElement.setAttribute('data-locale', _locale);

  }



  function init() {

    applyDom();

    mount();

  }



  return {

    t, getLocale, setLocale, applyDom, mount, mountLanguageSwitcher, initEarly, init,

    normalizeLocale, SUPPORTED,

  };



})();



if (typeof module !== 'undefined') module.exports = I18n;



;try {
  if (typeof ThemeController !== 'undefined' && ThemeController.initEarly) ThemeController.initEarly();
  if (typeof I18n !== 'undefined' && I18n.initEarly) I18n.initEarly();
} catch (e) { /* boot */ }
