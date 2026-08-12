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

  /** Scripts opcionales del dashboard/settings. */
  function loadPrivacyTools() {
    return loadMany([
      'src/js/services/DataExportService.js?v=20260812func',
      'src/js/services/CertVerificationService.js?v=20260812func',
    ]);
  }

  function loadPushOptional() {
    return load('src/js/services/PushNotificationService.js?v=20260812func');
  }

  return { load, loadMany, loadPrivacyTools, loadPushOptional };
})();

if (typeof module !== 'undefined') module.exports = LazyScriptLoader;
