/**
 * IN4MIND — Observabilidad mínima: captura errores JS y eventos de app.
 */
'use strict';

const ErrorReporter = (() => {
  const KEY = 'in4mind_error_log';
  const MAX = 40;
  let _bound = false;

  function _read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function _write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    } catch { /* ignore */ }
  }

  function capture(type, detail = {}) {
    const entry = {
      type: String(type || 'error'),
      detail: detail && typeof detail === 'object' ? detail : { message: String(detail) },
      href: typeof location !== 'undefined' ? location.pathname : '',
      at: new Date().toISOString(),
    };
    const list = _read();
    list.push(entry);
    _write(list);
    if (typeof console !== 'undefined') {
      console.warn('[IN4MIND]', entry.type, entry.detail);
    }
    return entry;
  }

  function getLog() {
    return _read();
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function init() {
    if (_bound || typeof window === 'undefined') return;
    _bound = true;
    window.addEventListener('error', (ev) => {
      capture('window_error', {
        message: ev.message,
        source: ev.filename,
        line: ev.lineno,
        col: ev.colno,
      });
    });
    window.addEventListener('unhandledrejection', (ev) => {
      const reason = ev.reason;
      capture('unhandled_rejection', {
        message: reason?.message || String(reason),
      });
    });
  }

  return { init, capture, getLog, clear };
})();

if (typeof module !== 'undefined') module.exports = ErrorReporter;
