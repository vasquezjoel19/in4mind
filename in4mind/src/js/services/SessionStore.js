/**
 * IN4MIND — SessionStore
 *
 * Sesión activa de la app: solo en sessionStorage (se pierde al cerrar la
 * pestaña). La sesión *real* la mantiene Supabase Auth con su propio token
 * renovable (`persistSession: true`, ver src/js/config/supabase.config.js);
 * esto es únicamente la copia ligera que usan la UI y los guards.
 *
 * "Recordar mis datos" guarda SOLO el correo para precargar el formulario.
 * Nunca la contraseña: hasta la versión anterior se guardaba en localStorage
 * codificada en Base64 —que no es cifrado— y cualquier script de terceros,
 * extensión o XSS podía leerla en claro. La persistencia entre visitas es
 * ahora responsabilidad exclusiva del token de Supabase Auth.
 */

'use strict';

const SessionStore = (() => {

  const USER_KEY     = 'in4mind_user';
  const REMEMBER_KEY = 'in4mind_remember';
  const EMAIL_KEY    = 'in4mind_remember_email';

  /** Clave heredada: contraseñas guardadas por versiones anteriores. */
  const LEGACY_PWD_KEY = 'in4mind_remember_pwd';

  /**
   * Borra la contraseña que dejaron versiones previas en el navegador.
   * Se ejecuta en cada carga: el usuario no tiene otra forma de limpiarla.
   */
  function purgeLegacyCredentials() {
    try {
      localStorage.removeItem(LEGACY_PWD_KEY);
      sessionStorage.removeItem(LEGACY_PWD_KEY);
    } catch { /* almacenamiento bloqueado */ }
  }

  function isRemembered() {
    try {
      return localStorage.getItem(REMEMBER_KEY) === '1';
    } catch {
      return false;
    }
  }

  /** Correo recordado para precargar el formulario de login. */
  function getRememberedEmail() {
    try {
      return localStorage.getItem(EMAIL_KEY) || '';
    } catch {
      return '';
    }
  }

  /**
   * Limpia restos de versiones anteriores que auto-iniciaban sesión desde
   * localStorage. Ya no se restaura `in4mind_user` automáticamente.
   */
  function restore() {
    try {
      // Legacy: había un auto-login copiando localStorage → sessionStorage.
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
    purgeLegacyCredentials();
    return Boolean(sessionStorage.getItem(USER_KEY));
  }

  /**
   * Guarda la sesión activa en la pestaña y, si aplica, el correo recordado.
   * @param {object} user
   * @param {boolean|null} remember
   */
  function persist(user, remember = null) {
    if (!user) return;
    const raw = JSON.stringify(user);
    try {
      sessionStorage.setItem(USER_KEY, raw);
    } catch { /* almacenamiento bloqueado */ }

    const keep = remember === null ? isRemembered() : Boolean(remember);
    try {
      // Nunca persistir el objeto de sesión en localStorage (evita saltarse login).
      localStorage.removeItem(USER_KEY);

      if (keep) {
        localStorage.setItem(REMEMBER_KEY, '1');
        if (user.email) localStorage.setItem(EMAIL_KEY, user.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
      purgeLegacyCredentials();
    } catch { /* sin espacio: la sesión de pestaña sigue funcionando */ }
  }

  /** Cierre de sesión: borra la sesión; el correo recordado es opcional. */
  function clear({ keepEmail = true } = {}) {
    try {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      purgeLegacyCredentials();
      if (!keepEmail) {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
    } catch { /* ignore */ }
  }

  return {
    restore, persist, clear, isRemembered,
    getRememberedEmail, purgeLegacyCredentials, USER_KEY,
  };

})();

// Limpia legacy de auto-login (y contraseñas guardadas) al cargar.
if (typeof window !== 'undefined') SessionStore.restore();

if (typeof module !== 'undefined') module.exports = SessionStore;
