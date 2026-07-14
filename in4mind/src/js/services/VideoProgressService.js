'use strict';

const VideoProgressService = (() => {

  const KEY = 'in4mind_video_progress';

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

  function getResumeLabel(courseId, lessonId, videoId) {
    const pos = getPosition(courseId, lessonId, videoId);
    if (!pos || pos.seconds < 5) return null;
    const t = typeof I18n !== 'undefined'
      ? I18n.t('video.resumeAt', { time: formatTime(pos.seconds) })
      : `Continuar en ${formatTime(pos.seconds)}`;
    return t;
  }

  return {
    savePosition,
    getPosition,
    formatTime,
    getResumeLabel,
  };

})();

if (typeof module !== 'undefined') module.exports = VideoProgressService;
