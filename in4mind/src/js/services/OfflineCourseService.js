/**
 * IN4MIND — Precache de un curso para estudio offline (Service Worker).
 */
'use strict';

const OfflineCourseService = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _urlsForCourse(courseId) {
    const urls = [
      new URL('content/courses-manifest.json', window.location.href).href,
      new URL(`tutorial.html?course=${encodeURIComponent(courseId)}`, window.location.href).href,
      new URL(`quizzes.html?quiz=${encodeURIComponent(courseId)}`, window.location.href).href,
    ];
    // JSON por curso si existe convención
    urls.push(new URL(`content/courses/${courseId}.json`, window.location.href).href);
    urls.push(new URL(`content/${courseId}.json`, window.location.href).href);
    return urls;
  }

  async function _cacheUrls(urls) {
    if (!('caches' in window)) return { ok: false, reason: 'no_caches' };
    const cache = await caches.open('in4mind-content-v1');
    let ok = 0;
    for (const url of urls) {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res.ok) {
          await cache.put(url, res.clone());
          ok += 1;
        }
      } catch { /* recurso opcional */ }
    }
    if (navigator.serviceWorker?.controller) {
      urls.forEach(url => {
        navigator.serviceWorker.controller.postMessage({ type: 'CACHE_COURSE_JSON', url });
      });
    }
    return { ok: ok > 0, cached: ok, total: urls.length };
  }

  async function downloadCourse(courseId) {
    if (!courseId) return { ok: false, reason: 'no_course' };
    const urls = _urlsForCourse(courseId);
    const result = await _cacheUrls(urls);
    try {
      const map = JSON.parse(localStorage.getItem('in4mind_offline_courses') || '{}');
      map[courseId] = { at: Date.now(), cached: result.cached || 0 };
      localStorage.setItem('in4mind_offline_courses', JSON.stringify(map));
    } catch { /* ignore */ }

    if (typeof AppShell !== 'undefined') {
      AppShell.showToast(
        result.ok
          ? _t('offline.ready', { course: courseId }, 'Curso listo para estudiar sin conexión.')
          : _t('offline.fail', null, 'No se pudo descargar todo el curso. Inténtalo con red estable.'),
        3200
      );
    }
    return result;
  }

  function isDownloaded(courseId) {
    try {
      const map = JSON.parse(localStorage.getItem('in4mind_offline_courses') || '{}');
      return Boolean(map[courseId]);
    } catch {
      return false;
    }
  }

  function listDownloaded() {
    try {
      return JSON.parse(localStorage.getItem('in4mind_offline_courses') || '{}');
    } catch {
      return {};
    }
  }

  return { downloadCourse, isDownloaded, listDownloaded };
})();

if (typeof module !== 'undefined') module.exports = OfflineCourseService;
