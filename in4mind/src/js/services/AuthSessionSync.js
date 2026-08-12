/**
 * IN4MIND — Sync de sesión entre pestañas + aviso de expiración.
 */
'use strict';

const AuthSessionSync = (() => {
  const CHANNEL = 'in4mind_auth';
  const STORAGE_KEY = 'in4mind_auth_broadcast';
  let _bc = null;
  let _bound = false;

  function _t(k, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _post(type, payload = {}) {
    const msg = { type, payload, at: Date.now() };
    try {
      if (_bc) _bc.postMessage(msg);
    } catch { /* ignore */ }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
      // limpia para permitir el mismo evento otra vez
      setTimeout(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
      }, 50);
    } catch { /* ignore */ }
  }

  function broadcastLogout() {
    _post('logout');
  }

  function broadcastLogin(user) {
    _post('login', { email: user?.email || null });
  }

  function _handle(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'logout') {
      if (typeof SessionStore !== 'undefined') SessionStore.clear({ keepEmail: true });
      else sessionStorage.removeItem('in4mind_user');
      if (typeof AppShell !== 'undefined') AppShell.showToast(_t('auth.sessionEnded', 'Sesión cerrada en otra pestaña.'), 2800);
      setTimeout(() => {
        if (!/login\.html$/i.test(location.pathname)) {
          window.location.replace('login.html');
        }
      }, 400);
    }
    if (msg.type === 'login') {
      // Otra pestaña inició sesión: refrescar avatar / perfil si aplica
      window.dispatchEvent(new CustomEvent('in4mind-profile-updated'));
    }
  }

  async function checkSessionHealth() {
    const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
    if (!sb) return { ok: true, reason: 'local' };
    try {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      const session = data?.session;
      if (!session) {
        const local = sessionStorage.getItem('in4mind_user');
        if (local) {
          // Sesión local huérfana: limpiar y pedir login
          if (typeof SessionStore !== 'undefined') SessionStore.clear({ keepEmail: true });
          else sessionStorage.removeItem('in4mind_user');
          if (typeof AppShell !== 'undefined') {
            AppShell.showToast(_t('auth.sessionExpired', 'Tu sesión expiró. Vuelve a iniciar sesión.'), 3600);
          }
          if (document.documentElement.hasAttribute('data-requires-auth')) {
            setTimeout(() => { window.location.replace('login.html'); }, 600);
          }
          return { ok: false, reason: 'expired' };
        }
        return { ok: false, reason: 'none' };
      }
      // Renovar proactivamente si queda poco
      const expiresAt = (session.expires_at || 0) * 1000;
      if (expiresAt && expiresAt - Date.now() < 5 * 60 * 1000) {
        try { await sb.auth.refreshSession(); } catch { /* ignore */ }
      }
      return { ok: true, reason: 'ok' };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('session_health', { message: err?.message || String(err) });
      }
      return { ok: false, reason: 'error' };
    }
  }

  function init() {
    if (_bound) return;
    _bound = true;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        _bc = new BroadcastChannel(CHANNEL);
        _bc.onmessage = (ev) => _handle(ev.data);
      }
    } catch { _bc = null; }

    window.addEventListener('storage', (ev) => {
      if (ev.key !== STORAGE_KEY || !ev.newValue) return;
      try { _handle(JSON.parse(ev.newValue)); } catch { /* */ }
    });

    // Chequeo al volver a la pestaña
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void checkSessionHealth();
    });

    const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb) => setTimeout(cb, 800);
    idle(() => { void checkSessionHealth(); });
  }

  return { init, broadcastLogout, broadcastLogin, checkSessionHealth };
})();

if (typeof module !== 'undefined') module.exports = AuthSessionSync;
