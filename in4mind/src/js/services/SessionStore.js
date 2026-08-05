/**
 * IN4MIND — SessionStore
 *
 * Decide dónde vive la sesión del usuario:
 *  - sin "Recordar datos" → sessionStorage (se pierde al cerrar la pestaña)
 *  - con "Recordar datos" → además localStorage, y al abrir la app se rehidrata
 *
 * Decisión de seguridad: **nunca se guarda la contraseña**. Recordar los datos
 * persiste la *sesión* (y el correo, para precargar el formulario), que es lo
 * que hacen Gmail, GitHub o cualquier app seria. Guardar la contraseña en
 * localStorage la dejaría legible ante cualquier XSS o para quien tenga acceso
 * al equipo, sin ninguna ventaja funcional sobre persistir la sesión.
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
  function persist(user, remember = null) {
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
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
    } catch { /* sin espacio: la sesión de pestaña sigue funcionando */ }
  }

  /** Cierre de sesión: borra la sesión persistida pero conserva el correo. */
  function clear({ keepEmail = true } = {}) {
    try {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(REMEMBER_KEY);
      if (!keepEmail) localStorage.removeItem(EMAIL_KEY);
    } catch { /* ignore */ }
  }

  return { restore, persist, clear, isRemembered, getRememberedEmail, USER_KEY };

})();

// Rehidratar cuanto antes: este script se carga antes que los controladores.
if (typeof window !== 'undefined') SessionStore.restore();

if (typeof module !== 'undefined') module.exports = SessionStore;
