'use strict';

/**
 * Carga opcional de contenido desde JSON (CMS ligero).
 * Fusiona cursos del manifest con DataService sin romper el catálogo base.
 * Usa Service Worker cache como fallback offline.
 */
const ContentLoader = (() => {

  const MANIFEST_URL = 'content/courses-manifest.json';
  const CONTENT_CACHE = 'in4mind-content-v1';
  let _overlay = null;
  let _loaded = false;
  let _loadPromise = null;

  async function _readFromCache() {
    if (!('caches' in window)) return null;
    try {
      const cache = await caches.open(CONTENT_CACHE);
      const url = new URL(MANIFEST_URL, window.location.href).href;
      const res = await cache.match(url) || await cache.match(MANIFEST_URL);
      if (!res) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  async function _fetchManifest() {
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const url = new URL(MANIFEST_URL, window.location.href).href;
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_COURSE_JSON',
          url,
        });
      }
      return data;
    } catch {
      return _readFromCache();
    }
  }

  async function load() {
    if (_loaded) return _overlay;
    if (_loadPromise) return _loadPromise;

    _loadPromise = (async () => {
      const data = await _fetchManifest();
      _overlay = data;
      _loaded = true;
      return _overlay;
    })();

    try {
      return await _loadPromise;
    } finally {
      _loadPromise = null;
    }
  }

  function applyOverlay(courses) {
    if (!_overlay?.courses?.length) return courses;
    const map = new Map(courses.map(c => [c.id, { ...c }]));
    _overlay.courses.forEach(patch => {
      if (!patch.id) return;
      const base = map.get(patch.id);
      if (base) map.set(patch.id, { ...base, ...patch });
      else map.set(patch.id, patch);
    });
    return Array.from(map.values());
  }

  function getAnnouncements() {
    return _overlay?.announcements || [];
  }

  function isOfflineReady() {
    return _loaded && _overlay != null;
  }

  return { load, applyOverlay, getAnnouncements, isOfflineReady, MANIFEST_URL };

})();

if (typeof module !== 'undefined') module.exports = ContentLoader;
