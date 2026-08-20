/**
 * IN4MIND — Claves de localStorage aisladas por cuenta.
 * Formato: `in4mind_{kind}:{account}` (email o id). Migra valores legacy sin sufijo.
 */
'use strict';

const UserScopedStorage = (() => {

  function accountId() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const user = raw ? JSON.parse(raw) : null;
      const id = user?.id || user?.email || '';
      return String(id || 'guest').toLowerCase();
    } catch {
      return 'guest';
    }
  }

  function key(base) {
    return `${base}:${accountId()}`;
  }

  function migrate(base) {
    const scoped = key(base);
    try {
      if (localStorage.getItem(scoped) != null) return scoped;
      const legacy = localStorage.getItem(base);
      if (legacy != null) localStorage.setItem(scoped, legacy);
    } catch { /* ignore */ }
    return scoped;
  }

  function getItem(base) {
    try {
      return localStorage.getItem(migrate(base));
    } catch {
      return null;
    }
  }

  function setItem(base, value) {
    try {
      localStorage.setItem(key(base), value);
      return true;
    } catch {
      return false;
    }
  }

  function getJson(base, fallback) {
    try {
      const raw = getItem(base);
      if (raw == null || raw === '') return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function setJson(base, value) {
    try {
      return setItem(base, JSON.stringify(value));
    } catch {
      return false;
    }
  }

  function removeItem(base) {
    try {
      localStorage.removeItem(key(base));
      return true;
    } catch {
      return false;
    }
  }

  return { accountId, key, migrate, getItem, setItem, getJson, setJson, removeItem };
})();

if (typeof module !== 'undefined') module.exports = UserScopedStorage;
