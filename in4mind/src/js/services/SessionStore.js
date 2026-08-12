/**
 * IN4MIND — SessionStore
 *
 * Sesión activa: solo en sessionStorage (se pierde al cerrar la pestaña).
 *
 * "Recordar mis datos" guarda únicamente correo/contraseña para precargar el
 * formulario de login. NO rehidrata la sesión automáticamente: el usuario debe
 * iniciar sesión de nuevo (o tener sesión válida de Supabase Auth).
 */

'use strict';

const SessionStore = (() => {

  const USER_KEY     = 'in4mind_user';
  const REMEMBER_KEY = 'in4mind_remember';
  const EMAIL_KEY    = 'in4mind_remember_email';
  const PWD_KEY      = 'in4mind_remember_pwd';

  function _encodePwd(pwd) {
    try { return btoa(unescape(encodeURIComponent(pwd))); } catch { return ''; }
  }

  function _decodePwd(raw) {
    try { return decodeURIComponent(escape(atob(raw))); } catch { return ''; }
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

  /** Contraseña recordada (solo si el usuario marcó "Recordar mis datos"). */
  function getRememberedPassword() {
    if (!isRemembered()) return '';
    try {
      const raw = localStorage.getItem(PWD_KEY);
      return raw ? _decodePwd(raw) : '';
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
    return Boolean(sessionStorage.getItem(USER_KEY));
  }

  /**
   * Guarda la sesión activa en la pestaña y, si aplica, credenciales recordadas.
   * @param {object} user
   * @param {boolean|null} remember
   * @param {string|null} [password]
   */
  function persist(user, remember = null, password = null) {
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
        if (password) localStorage.setItem(PWD_KEY, _encodePwd(password));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem(PWD_KEY);
      }
    } catch { /* sin espacio: la sesión de pestaña sigue funcionando */ }
  }

  /** Cierre de sesión: borra la sesión; el correo recordado es opcional. */
  function clear({ keepEmail = true, keepPassword = true } = {}) {
    try {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      if (!keepEmail || !keepPassword) {
        localStorage.removeItem(REMEMBER_KEY);
      }
      if (!keepEmail) localStorage.removeItem(EMAIL_KEY);
      if (!keepPassword) localStorage.removeItem(PWD_KEY);
      // Si se borra la contraseña pero se quiere conservar el correo, mantener flag.
      if (keepEmail && !keepPassword && getRememberedEmail()) {
        localStorage.setItem(REMEMBER_KEY, '1');
      }
    } catch { /* ignore */ }
  }

  return {
    restore, persist, clear, isRemembered,
    getRememberedEmail, getRememberedPassword, USER_KEY,
  };

})();

// Limpia legacy de auto-login al cargar.
if (typeof window !== 'undefined') SessionStore.restore();

if (typeof module !== 'undefined') module.exports = SessionStore;
