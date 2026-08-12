'use strict';

/**
 * IN4MIND — Autenticación unificada: Supabase Auth con fallback demo (DataService).
 */
const AuthService = (() => {

  const _sb = typeof _sbClient !== 'undefined' ? _sbClient : null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _sessionUser(user, name) {
    return {
      id: user?.id || null,
      email: (user?.email || '').toLowerCase(),
      name: name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario',
    };
  }

  function _mapAuthError(error, fallbackKey, fallbackMsg) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
      return _t('auth.errEmailTaken', null, 'Este correo ya está registrado.');
    }
    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return _t('auth.errLogin', null, 'Credenciales incorrectas.');
    }
    if (msg.includes('email not confirmed')) {
      return _t('auth.errEmailNotConfirmed', null, 'Confirma tu correo antes de iniciar sesión.');
    }
    if (msg.includes('password')) {
      return error.message || _t(fallbackKey, null, fallbackMsg);
    }
    return error?.message || _t(fallbackKey, null, fallbackMsg);
  }

  async function _upsertProfile(user, name) {
    if (!_sb || !user?.id) return { ok: true, name };
    const displayName = name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';
    try {
      const { error } = await _sb.from('profiles').upsert({
        id: user.id,
        email: user.email?.toLowerCase(),
        name: displayName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) {
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('profile_upsert_fail', { message: error.message });
        }
        // El trigger handle_new_user suele crear la fila; no bloqueamos el login.
        return { ok: false, name: displayName, error: error.message };
      }
      return { ok: true, name: displayName };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('profile_upsert_fail', { message: err?.message || String(err) });
      }
      return { ok: false, name: displayName, error: err?.message || String(err) };
    }
  }

  /**
   * @param {object} user
   * @param {boolean|null} remember  true si el usuario marcó "Recordar datos"
   */
  async function _persistSession(user, remember = null, password = null) {
    if (typeof SessionStore !== 'undefined') {
      SessionStore.persist(user, remember, password);
    } else {
      sessionStorage.setItem('in4mind_user', JSON.stringify(user));
    }
    if (typeof QuizProgressService !== 'undefined') {
      QuizProgressService.mergeGuestInto(user.email);
    }
    if (typeof AdaptiveQuizEngine !== 'undefined') {
      AdaptiveQuizEngine.mergeGuestInto(user.email);
    }
    if (typeof UserProfileService !== 'undefined') {
      UserProfileService.mergeGuestIntoUser(user.email);
      UserProfileService.migrateSessionQuizProgress();
    }
  }

  async function login(email, password, remember = false) {
    const em = String(email || '').trim().toLowerCase();
    const pass = String(password || '');

    if (_sb) {
      try {
        const { data, error } = await _sb.auth.signInWithPassword({ email: em, password: pass });
        if (!error && data?.user && data?.session) {
          const meta = await _upsertProfile(data.user);
          const user = _sessionUser(data.user, meta.name);
          await _persistSession(user, remember, pass);
          if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.broadcastLogin(user);
          return { ok: true, user };
        }
        return {
          ok: false,
          error: _mapAuthError(error, 'auth.errLogin', 'Credenciales incorrectas.'),
        };
      } catch {
        return {
          ok: false,
          error: _t('auth.errLogin', null, 'No se pudo iniciar sesión. Inténtalo de nuevo.'),
        };
      }
    }

    const result = await DataService.login(em, pass);
    if (result.ok) await _persistSession(result.user, remember, pass);
    return result;
  }

  async function register(name, email, password, remember = false) {
    const em = String(email || '').trim().toLowerCase();
    const pass = String(password || '');
    const displayName = String(name || '').trim();

    if (_sb) {
      try {
        const { data, error } = await _sb.auth.signUp({
          email: em,
          password: pass,
          options: { data: { name: displayName } },
        });

        if (error) {
          return {
            ok: false,
            error: _mapAuthError(error, 'auth.errRegister', 'No se pudo crear la cuenta.'),
          };
        }

        const user = data?.user;
        if (!user) {
          return {
            ok: false,
            error: _t('auth.errRegister', null, 'No se pudo crear la cuenta.'),
          };
        }

        // Supabase anti-enumeration: usuario sin identities = correo ya registrado.
        if (Array.isArray(user.identities) && user.identities.length === 0) {
          return {
            ok: false,
            error: _t('auth.errEmailTaken', null, 'Este correo ya está registrado.'),
          };
        }

        // Confirmación de email activa: hay user pero aún no hay sesión JWT.
        if (!data.session) {
          return {
            ok: true,
            needsEmailConfirmation: true,
            email: em,
            user: _sessionUser(user, displayName),
          };
        }

        await _upsertProfile(user, displayName);
        const sessionUser = _sessionUser(user, displayName);
        await _persistSession(sessionUser, remember, pass);
        if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.broadcastLogin(sessionUser);
        return { ok: true, user: sessionUser };
      } catch {
        return {
          ok: false,
          error: _t('auth.errRegister', null, 'No se pudo crear la cuenta. Inténtalo de nuevo.'),
        };
      }
    }

    const result = await DataService.register(displayName, em, pass);
    if (result.ok) await _persistSession(result.user, remember, pass);
    return result;
  }

  /**
   * Envía el correo de recuperación a la dirección que escribió el usuario.
   */
  async function requestPasswordReset(email) {
    const em = String(email || '').trim().toLowerCase();

    if (_sb) {
      try {
        const base = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}`;
        const redirectTo = `${base}login.html?view=reset`;
        const { error } = await _sb.auth.resetPasswordForEmail(em, { redirectTo });
        if (!error) return { ok: true, email: em, delivered: true, via: 'supabase' };
      } catch { /* se intenta el endpoint propio */ }
    }

    const local = await DataService.requestPasswordReset(em);
    if (!local.ok) return local;

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, token: local.token }),
      });
      if (res.ok) return { ok: true, email: em, delivered: true, via: 'api' };

      const data = await res.json().catch(() => ({}));
      if (data.error === 'RESET_EMAIL_NOT_CONFIGURED' || res.status === 404) {
        return { ok: true, email: em, delivered: false, reason: 'not_configured' };
      }
      return { ok: true, email: em, delivered: false, reason: 'send_failed' };
    } catch {
      return { ok: true, email: em, delivered: false, reason: 'offline' };
    }
  }

  async function resetPassword(email, password, confirm) {
    const em = String(email || '').trim().toLowerCase();

    if (_sb) {
      try {
        const { error } = await _sb.auth.updateUser({ password });
        if (!error) return { ok: true, email: em };
      } catch { /* fallback */ }
    }

    return DataService.resetPassword(em, password, confirm);
  }

  async function updateDisplayName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return { ok: false, error: _t('settingsModal.nameRequired', null, 'El nombre es obligatorio.') };

    const stored = sessionStorage.getItem('in4mind_user');
    let user = stored ? JSON.parse(stored) : null;
    if (!user) return { ok: false, error: _t('auth.errLogin', null, 'Sin sesión.') };

    user = { ...user, name: trimmed };
    if (typeof SessionStore !== 'undefined') SessionStore.persist(user);
    else sessionStorage.setItem('in4mind_user', JSON.stringify(user));

    if (_sb) {
      try {
        await _sb.auth.updateUser({ data: { name: trimmed } });
        if (user.id) {
          await _sb.from('profiles').upsert({
            id: user.id,
            email: user.email,
            name: trimmed,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      } catch { /* local ok */ }
    }

    window.dispatchEvent(new CustomEvent('in4mind-profile-updated', { detail: { email: user.email } }));
    return { ok: true, user };
  }

  async function logout() {
    if (_sb) {
      try { await _sb.auth.signOut(); } catch { /* ignore */ }
    }
    if (typeof SessionStore !== 'undefined') {
      SessionStore.clear({ keepEmail: true });
    } else {
      sessionStorage.removeItem('in4mind_user');
    }
    if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.broadcastLogout();
  }

  async function getSession() {
    if (_sb) {
      try {
        const { data } = await _sb.auth.getSession();
        if (data?.session?.user) {
          const u = data.session.user;
          return _sessionUser(u, u.user_metadata?.name);
        }
      } catch { /* ignore */ }
    }
    try {
      const raw = sessionStorage.getItem('in4mind_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function restoreOAuthSession() {
    if (!_sb) return { ok: false };
    try {
      const { data, error } = await _sb.auth.getSession();
      if (error || !data?.session?.user) return { ok: false };
      const meta = await _upsertProfile(data.session.user);
      const user = _sessionUser(data.session.user, meta.name);
      await _persistSession(user);
      return { ok: true, user };
    } catch {
      return { ok: false };
    }
  }

  async function signInWithGoogle() {
    if (!_sb) {
      return {
        ok: false,
        error: _t('auth.oauthUnavailable', null, 'Usa email y contraseña en modo demo, o configura Supabase.'),
      };
    }
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await _sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, redirecting: true };
    } catch (e) {
      return { ok: false, error: e?.message || _t('auth.errLogin', null, 'No se pudo iniciar sesión.') };
    }
  }

  return {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    updateDisplayName,
    logout,
    getSession,
    restoreOAuthSession,
    signInWithGoogle,
    isSupabaseEnabled: () => !!_sb,
  };

})();

if (typeof module !== 'undefined') module.exports = AuthService;
