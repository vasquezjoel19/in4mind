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

  async function _upsertProfile(user, name) {
    if (!_sb || !user?.id) return { name };
    try {
      await _sb.from('profiles').upsert({
        id: user.id,
        email: user.email?.toLowerCase(),
        name: name || user.user_metadata?.name || user.email?.split('@')[0],
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    } catch { /* tabla opcional */ }
    return { name: name || user.user_metadata?.name };
  }

  async function _persistSession(user) {
    sessionStorage.setItem('in4mind_user', JSON.stringify(user));
    if (typeof UserProfileService !== 'undefined') {
      UserProfileService.mergeGuestIntoUser(user.email);
      UserProfileService.migrateSessionQuizProgress();
    }
  }

  async function login(email, password) {
    const em = email.trim().toLowerCase();

    if (_sb) {
      try {
        const { data, error } = await _sb.auth.signInWithPassword({ email: em, password });
        if (!error && data?.user) {
          const meta = await _upsertProfile(data.user);
          const user = _sessionUser(data.user, meta.name);
          await _persistSession(user);
          return { ok: true, user };
        }
        if (error?.message?.includes('Invalid login')) {
          return { ok: false, error: _t('auth.errLogin', null, 'Credenciales incorrectas.') };
        }
      } catch { /* fallback demo */ }
    }

    const result = await DataService.login(em, password);
    if (result.ok) await _persistSession(result.user);
    return result;
  }

  async function register(name, email, password) {
    const em = email.trim().toLowerCase();
    const displayName = name.trim();

    if (_sb) {
      try {
        const { data, error } = await _sb.auth.signUp({
          email: em,
          password,
          options: { data: { name: displayName } },
        });
        if (!error && data?.user) {
          await _upsertProfile(data.user, displayName);
          const user = _sessionUser(data.user, displayName);
          await _persistSession(user);
          return { ok: true, user };
        }
        if (error?.message?.includes('already registered')) {
          return { ok: false, error: _t('auth.errEmailTaken', null, 'Este correo ya está registrado.') };
        }
      } catch { /* fallback */ }
    }

    const result = await DataService.register(displayName, em, password);
    if (result.ok) await _persistSession(result.user);
    return result;
  }

  async function requestPasswordReset(email) {
    const em = email.trim().toLowerCase();

    if (_sb) {
      try {
        const redirectTo = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}login.html`;
        const { error } = await _sb.auth.resetPasswordForEmail(em, { redirectTo });
        if (!error) return { ok: true, email: em };
      } catch { /* fallback */ }
    }

    return DataService.requestPasswordReset(em);
  }

  async function resetPassword(email, password, confirm) {
    const em = email.trim().toLowerCase();

    if (_sb) {
      try {
        const { error } = await _sb.auth.updateUser({ password });
        if (!error) return { ok: true, email: em };
      } catch { /* fallback */ }
    }

    return DataService.resetPassword(em, password, confirm);
  }

  async function updateDisplayName(name) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: _t('settingsModal.nameRequired', null, 'El nombre es obligatorio.') };

    const stored = sessionStorage.getItem('in4mind_user');
    let user = stored ? JSON.parse(stored) : null;
    if (!user) return { ok: false, error: _t('auth.errLogin', null, 'Sin sesión.') };

    user = { ...user, name: trimmed };
    sessionStorage.setItem('in4mind_user', JSON.stringify(user));

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
    sessionStorage.removeItem('in4mind_user');
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
