/**
 * IN4MIND — ShareService + AuthGuard
 *
 * Antes, "Compartir" no tenía ningún manejador y la navegación interna vivía en
 * sessionStorage (`in4mind_open_course`, `in4mind_open_quiz`), así que ninguna
 * URL apuntaba a contenido concreto: compartir era imposible.
 *
 * Ahora cada vista publica su contexto con `setContext()` y el enlace generado
 * apunta exactamente a lo que el usuario está viendo. Al abrirlo sin sesión,
 * `AuthGuard` manda a login guardando el destino y luego devuelve ahí.
 */

'use strict';

const ShareService = (() => {

  /** Contexto de lo que se está viendo ahora mismo. */
  let _context = null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  /**
   * Declara qué contenido se está viendo, para que el botón de compartir sepa
   * qué enlace construir.
   * @param {{page?:string, params?:Object<string,string|number>, title?:string, text?:string}} ctx
   */
  function setContext(ctx) {
    _context = ctx || null;
  }

  function getContext() {
    return _context;
  }

  /** Base absoluta del sitio, incluyendo subcarpeta si la hubiera. */
  function _baseUrl() {
    const path = window.location.pathname.replace(/[^/]*$/, '');
    return `${window.location.origin}${path}`;
  }

  /**
   * URL absoluta del contenido actual.
   * Sin contexto declarado se comparte la página tal cual está en la barra.
   */
  function buildUrl(ctx = _context) {
    if (!ctx || !ctx.page) return window.location.href;
    const url = new URL(ctx.page, _baseUrl());
    Object.entries(ctx.params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    return url.toString();
  }

  /**
   * Comparte el contenido actual: usa el diálogo nativo si existe y si no
   * copia el enlace al portapapeles.
   */
  async function share(ctx = _context) {
    const url = buildUrl(ctx);
    const title = ctx?.title || document.title || 'IN4MIND';
    const text = ctx?.text || title;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return { ok: true, method: 'native', url };
      } catch (err) {
        // El usuario canceló: no es un error que deba avisarse.
        if (err && err.name === 'AbortError') return { ok: false, cancelled: true, url };
      }
    }

    const copied = await copy(url);
    if (typeof AppShell !== 'undefined') {
      AppShell.showToast(copied
        ? _t('share.copied', null, 'Enlace copiado al portapapeles')
        : _t('share.copyFail', null, 'No se pudo copiar el enlace'));
    }
    return { ok: copied, method: 'clipboard', url };
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Contextos sin permiso de portapapeles (http, iframe sin allow).
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  /**
   * Conecta cualquier botón marcado con `[data-share]` mediante delegación,
   * así funciona también con contenido renderizado después.
   */
  function bind() {
    if (bind._bound) return;
    bind._bound = true;
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-share]');
      if (!btn) return;
      e.preventDefault();

      // Un botón puede declarar su propio destino con data-share-page/params.
      const page = btn.dataset.sharePage;
      if (page) {
        let params = {};
        try {
          params = btn.dataset.shareParams ? JSON.parse(btn.dataset.shareParams) : {};
        } catch { /* params inválidos: se comparte sin ellos */ }
        void share({ page, params, title: btn.dataset.shareTitle });
        return;
      }
      void share();
    });
  }

  return { setContext, getContext, buildUrl, share, copy, bind };

})();

/**
 * AuthGuard — protege las páginas de contenido.
 *
 * Si no hay sesión, guarda la URL destino y redirige a login; tras entrar,
 * `consumeRedirect()` devuelve al usuario exactamente a donde iba.
 *
 * Si hace falta onboarding, `stashPendingRedirect` / `consumePendingRedirect`
 * conservan el deep-link hasta terminar la Ruta Empleable (IN4MIND_NEXT_REDIRECT).
 */
const AuthGuard = (() => {

  const NEXT_KEY = 'in4mind_next';
  const PENDING_KEY = 'IN4MIND_NEXT_REDIRECT';

  function _hasSession() {
    try {
      if (typeof SessionStore !== 'undefined') SessionStore.restore();
      return Boolean(sessionStorage.getItem('in4mind_user'));
    } catch {
      return false;
    }
  }

  /** Sólo se aceptan destinos internos: un `next` externo sería open redirect. */
  function _isSafe(target) {
    try {
      const url = new URL(target, window.location.origin);
      if (url.origin !== window.location.origin) return false;
      if (url.username || url.password) return false;
      const href = String(target).trim();
      if (/^(javascript|data|vbscript):/i.test(href)) return false;
      if ((url.pathname || '').includes('..')) return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normaliza a ruta relativa de la app (pathname + search + hash), o null.
   * Ej: "tutorial.html?course=python&lesson=1"
   */
  function sanitizeNext(raw) {
    if (raw == null) return null;
    const trimmed = String(raw).trim();
    if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return null;
    try {
      const url = new URL(trimmed, window.location.origin);
      if (!_isSafe(url.href)) return null;
      let path = url.pathname || '/';
      // Static hosting: allow /foo.html or /folder/foo.html under same origin
      const leaf = path.split('/').filter(Boolean).pop() || '';
      if (leaf && !/\.html$/i.test(leaf)) return null;
      if (!leaf) return 'dashboard.html';
      // Prefer site-relative path without leading slash for window.location.replace
      const relPath = path.replace(/^\//, '');
      return `${relPath}${url.search || ''}${url.hash || ''}`;
    } catch {
      return null;
    }
  }

  function _redirectToLogin() {
    const target = window.location.href;
    try {
      if (_isSafe(target)) sessionStorage.setItem(NEXT_KEY, target);
    } catch { /* ignore */ }

    try {
      const current = new URL(target);
      const quiz = current.searchParams.get('quiz');
      const exam = current.searchParams.get('exam');
      if (quiz) sessionStorage.setItem('in4mind_open_quiz', quiz);
      if (exam) sessionStorage.setItem('in4mind_open_exam', exam);
      stashPendingRedirect(current.pathname.replace(/^\//, '') + current.search + current.hash);
    } catch { /* ignore */ }

    const login = new URL('login.html', window.location.href);
    try {
      const here = new URL(target);
      login.searchParams.set('next', here.pathname.replace(/^\//, '') + here.search);
    } catch {
      login.searchParams.set('next', new URL(target).pathname + new URL(target).search);
    }
    window.location.replace(login.toString());
  }

  function require() {
    if (_hasSession()) return true;
    _redirectToLogin();
    return false;
  }

  async function requireAsync() {
    if (_hasSession()) return true;
    if (typeof AuthService !== 'undefined' && AuthService.restoreOAuthSession) {
      try {
        const oauth = await AuthService.restoreOAuthSession();
        if (oauth?.ok) return true;
      } catch { /* sin sesión cloud */ }
    }
    _redirectToLogin();
    return false;
  }

  function consumeRedirect() {
    let target = null;
    try {
      target = sessionStorage.getItem(NEXT_KEY);
      sessionStorage.removeItem(NEXT_KEY);
    } catch { /* ignore */ }

    if (!target) {
      const fromQuery = new URLSearchParams(window.location.search).get('next');
      if (fromQuery) target = new URL(fromQuery, window.location.origin).toString();
    }

    return target && _isSafe(target) ? target : null;
  }

  function setRedirect(target) {
    try {
      if (_isSafe(target)) sessionStorage.setItem(NEXT_KEY, new URL(target, window.location.href).toString());
    } catch { /* ignore */ }
  }

  /** Guarda destino post-onboarding (localStorage + opcionalmente durable). */
  function stashPendingRedirect(target) {
    const rel = sanitizeNext(target);
    if (!rel) return null;
    try {
      localStorage.setItem(PENDING_KEY, rel);
    } catch { /* ignore */ }
    return rel;
  }

  function clearPendingRedirect() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch { /* ignore */ }
  }

  /**
   * Lee y limpia destino pendiente (query ?next= o IN4MIND_NEXT_REDIRECT).
   * @returns {string|null} ruta relativa segura
   */
  function consumePendingRedirect() {
    let raw = null;
    try {
      raw = new URLSearchParams(window.location.search).get('next');
    } catch { /* ignore */ }
    if (!raw) {
      try {
        raw = localStorage.getItem(PENDING_KEY);
      } catch { /* ignore */ }
    }
    clearPendingRedirect();

    return sanitizeNext(raw);
  }

  function peekPendingRedirect() {
    let raw = null;
    try {
      raw = new URLSearchParams(window.location.search).get('next');
    } catch { /* ignore */ }
    if (!raw) {
      try {
        raw = localStorage.getItem(PENDING_KEY);
      } catch { /* ignore */ }
    }
    return sanitizeNext(raw);
  }

  function onboardingUrlWithPending(pendingRel) {
    const rel = pendingRel || peekPendingRedirect();
    if (!rel) return 'onboarding.html';
    return `onboarding.html?next=${encodeURIComponent(rel)}`;
  }

  return {
    require,
    requireAsync,
    consumeRedirect,
    setRedirect,
    hasSession: _hasSession,
    NEXT_KEY,
    PENDING_KEY,
    sanitizeNext,
    stashPendingRedirect,
    clearPendingRedirect,
    consumePendingRedirect,
    peekPendingRedirect,
    onboardingUrlWithPending,
  };

})();

/**
 * Las páginas protegidas se marcan con `data-requires-auth` en <html>.
 * Se espera a que carguen AuthService/SessionStore (scripts posteriores) antes
 * de decidir el redirect, para poder rehidratar JWT de Supabase.
 */
if (typeof document !== 'undefined') {
  const html = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.get('preview') === '1';

  if (html.hasAttribute('data-requires-auth') && !isPreview) {
    if (!AuthGuard.hasSession()) {
      html.style.visibility = 'hidden';
      const gate = () => {
        void AuthGuard.requireAsync().then(ok => {
          if (ok) html.style.visibility = '';
        });
      };
      // AuthService suele cargarse después de este archivo: esperar al final del parseo.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', gate);
      } else {
        setTimeout(gate, 0);
      }
    }
  }

  const boot = () => ShareService.bind();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = { ShareService, AuthGuard };
