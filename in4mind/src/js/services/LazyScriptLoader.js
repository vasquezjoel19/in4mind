/**
 * IN4MIND — Carga diferida de scripts no críticos.
 */
'use strict';

const LazyScriptLoader = (() => {
  const _loaded = new Set();

  function load(src) {
    if (!src || _loaded.has(src)) return Promise.resolve(true);
    if (document.querySelector(`script[src="${src}"]`)) {
      _loaded.add(src);
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => { _loaded.add(src); resolve(true); };
      s.onerror = () => {
        if (typeof ErrorReporter !== 'undefined') ErrorReporter.capture('lazy_script_fail', { src });
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(s);
    });
  }

  function loadMany(srcs) {
    return Promise.all(srcs.map(src => load(src).catch(() => false)));
  }

  /**
   * Scripts opcionales de ajustes/privacidad.
   *
   * Solo entra aquí lo que NO está en app-shell.bundle.js. Cargar de nuevo un
   * archivo ya empaquetado redeclara su `const` de nivel superior y el
   * navegador aborta el script con "has already been declared": es lo que
   * pasaba con DataExportService y PushNotificationService, que ya viajan en
   * el bundle (ver scripts/bundle-shell.js).
   */
  function loadPrivacyTools() {
    return loadMany([
      'src/js/services/CertVerificationService.js?v=20260812func',
    ]);
  }

  return { load, loadMany, loadPrivacyTools };
})();

if (typeof module !== 'undefined') module.exports = LazyScriptLoader;
