'use strict';

const VideoProgressService = (() => {

  const KEY = 'in4mind_video_progress';
  /** Por debajo de esto el vídeo apenas arrancó: no cuenta como pendiente. */
  const MIN_RESUME_SECONDS = 5;
  /** A partir de aquí se considera visto, aunque no llegara al final exacto. */
  const NEAR_END_RATIO = 0.95;

  function _read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _write(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map));
    } catch { /* ignore */ }
  }

  function _entryKey(courseId, lessonId, videoId) {
    return `${courseId}::${lessonId}::${videoId || 'default'}`;
  }

  function savePosition(courseId, lessonId, videoId, seconds, duration = 0) {
    if (!courseId || !lessonId) return;
    const map = _read();
    const key = _entryKey(courseId, lessonId, videoId);
    map[key] = {
      seconds: Math.max(0, Math.round(seconds)),
      duration: Math.max(0, Math.round(duration)),
      updatedAt: Date.now(),
    };
    _write(map);
  }

  function getPosition(courseId, lessonId, videoId) {
    const map = _read();
    return map[_entryKey(courseId, lessonId, videoId)] || null;
  }

  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, '0')}`;
  }

  /**
   * Cursos con algún vídeo empezado y sin terminar, con la marca de tiempo más
   * reciente de cada uno. El dashboard lo usa para poder ofrecer «continuar»
   * aunque la visita al curso nunca llegara a registrarse en la nube.
   * @returns {Object<string, number>} courseId → updatedAt
   */
  function getInProgressCourses() {
    const out = {};
    Object.entries(_read()).forEach(([key, entry]) => {
      if (!entry || (entry.seconds || 0) < MIN_RESUME_SECONDS) return;
      if (entry.duration && entry.seconds >= entry.duration * NEAR_END_RATIO) return;
      const courseId = key.split('::')[0];
      if (!courseId) return;
      out[courseId] = Math.max(out[courseId] || 0, entry.updatedAt || 0);
    });
    return out;
  }

  function getResumeLabel(courseId, lessonId, videoId) {
    const pos = getPosition(courseId, lessonId, videoId);
    if (!pos || pos.seconds < MIN_RESUME_SECONDS) return null;
    const t = typeof I18n !== 'undefined'
      ? I18n.t('video.resumeAt', { time: formatTime(pos.seconds) })
      : `Continuar en ${formatTime(pos.seconds)}`;
    return t;
  }

  return {
    savePosition,
    getPosition,
    getInProgressCourses,
    formatTime,
    getResumeLabel,
  };

})();

if (typeof module !== 'undefined') module.exports = VideoProgressService;
