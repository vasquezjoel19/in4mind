/**
 * IN4MIND — SessionStore
 *
 * Sesión activa: solo en sessionStorage (se pierde al cerrar la pestaña).
 *
 * "Recordar mis datos" guarda **únicamente el correo** para precargar el
 * formulario de login. La sesión persistente entre visitas es responsabilidad
 * exclusiva de Supabase Auth (`persistSession`), que guarda un token con
 * caducidad y refresco — no la credencial.
 *
 * Antes se guardaba también la contraseña en localStorage codificada en Base64.
 * Base64 no es cifrado: es una transformación reversible sin secreto, así que
 * cualquier XSS, extensión del navegador o persona con acceso al equipo podía
 * leer la contraseña en claro. Y como la gente reutiliza contraseñas, el daño
 * no se limitaba a esta aplicación.
 */

'use strict';

const SessionStore = (() => {

  const USER_KEY     = 'in4mind_user';
  const REMEMBER_KEY = 'in4mind_remember';
  const EMAIL_KEY    = 'in4mind_remember_email';

  /* Solo para borrarla: hay navegadores con la contraseña ya guardada de
     versiones anteriores. Dejar de escribirla no la elimina de quien ya la
     tiene, así que se purga en cada arranque. */
  const LEGACY_PWD_KEY = 'in4mind_remember_pwd';

  function _purgeLegacyPassword() {
    try { localStorage.removeItem(LEGACY_PWD_KEY); } catch { /* ignore */ }
    try { sessionStorage.removeItem(LEGACY_PWD_KEY); } catch { /* ignore */ }
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
   * Limpia restos de versiones anteriores: el auto-login que copiaba
   * localStorage → sessionStorage y la contraseña recordada.
   */
  function restore() {
    try {
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
    _purgeLegacyPassword();
    return Boolean(sessionStorage.getItem(USER_KEY));
  }

  /**
   * Guarda la sesión activa en la pestaña y, si aplica, el correo recordado.
   *
   * Acepta un tercer argumento por compatibilidad con llamadas antiguas, pero
   * se ignora deliberadamente: ninguna credencial debe llegar al almacenamiento
   * del navegador.
   *
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
      _purgeLegacyPassword();

      if (keep) {
        localStorage.setItem(REMEMBER_KEY, '1');
        if (user.email) localStorage.setItem(EMAIL_KEY, user.email);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
    } catch { /* sin espacio: la sesión de pestaña sigue funcionando */ }
  }

  /** Cierre de sesión: borra la sesión; el correo recordado es opcional. */
  function clear({ keepEmail = true } = {}) {
    try {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      _purgeLegacyPassword();
      if (!keepEmail) {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
      }
    } catch { /* ignore */ }
  }

  return {
    restore, persist, clear, isRemembered,
    getRememberedEmail, USER_KEY,
  };

})();

// Limpia legacy (auto-login y contraseña recordada) al cargar.
if (typeof window !== 'undefined') SessionStore.restore();

if (typeof module !== 'undefined') module.exports = SessionStore;
