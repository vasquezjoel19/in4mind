/**
 * IN4MIND — SessionStore
 *
 * Decide dónde vive la sesión del usuario:
 *  - sin "Recordar datos" → sessionStorage (se pierde al cerrar la pestaña)
 *  - con "Recordar datos" → además localStorage, y al abrir la app se rehidrata
 *
 * Decisión de seguridad: la contraseña solo se guarda si el usuario marca
 * "Recordar mis datos", codificada en localStorage del dispositivo (no en la nube).
 *
 * El resto del código sigue leyendo `sessionStorage.getItem('in4mind_user')`
 * como siempre: `restore()` se ejecuta al arrancar y repuebla esa clave, así no
 * hay que tocar cada punto de lectura.
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
   * Rehidrata la sesión desde localStorage al abrir la app.
   * Debe llamarse lo antes posible, antes de que los controladores comprueben
   * si hay sesión activa.
   */
  function restore() {
    try {
      if (sessionStorage.getItem(USER_KEY)) return true;
      if (!isRemembered()) return false;
      const saved = localStorage.getItem(USER_KEY);
      if (!saved) return false;
      JSON.parse(saved); // valida que no esté corrupto
      sessionStorage.setItem(USER_KEY, saved);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Guarda la sesión activa.
   * @param {object} user
   * @param {boolean|null} remember  null = conservar la preferencia actual
   */
  /**
   * @param {object} user
   * @param {boolean|null} remember
   * @param {string|null} [password] solo se guarda si remember es true
   */
  function persist(user, remember = null, password = null) {
    if (!user) return;
    const raw = JSON.stringify(user);
    try {
      sessionStorage.setItem(USER_KEY, raw);
    } catch { /* almacenamiento bloqueado */ }

    const keep = remember === null ? isRemembered() : Boolean(remember);
    try {
      if (keep) {
        localStorage.setItem(REMEMBER_KEY, '1');
        localStorage.setItem(USER_KEY, raw);
        if (user.email) localStorage.setItem(EMAIL_KEY, user.email);
        if (password) localStorage.setItem(PWD_KEY, _encodePwd(password));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem(PWD_KEY);
      }
    } catch { /* sin espacio: la sesión de pestaña sigue funcionando */ }
  }

  /** Cierre de sesión: borra la sesión persistida pero conserva el correo. */
  function clear({ keepEmail = true, keepPassword = true } = {}) {
    try {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      if (!keepEmail) localStorage.removeItem(EMAIL_KEY);
      if (!keepPassword) localStorage.removeItem(PWD_KEY);
    } catch { /* ignore */ }
  }

  return {
    restore, persist, clear, isRemembered,
    getRememberedEmail, getRememberedPassword, USER_KEY,
  };

})();

// Rehidratar cuanto antes: este script se carga antes que los controladores.
if (typeof window !== 'undefined') SessionStore.restore();

if (typeof module !== 'undefined') module.exports = SessionStore;
