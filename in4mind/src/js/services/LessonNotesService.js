'use strict';

/**
 * IN4MIND — LessonNotesService
 * Apuntes y valoraciones de lecciones, aislados por cuenta de usuario.
 */

const LessonNotesService = (() => {

  const KEY = 'in4mind_lesson_notes';
  const RATINGS_KEY = 'in4mind_lesson_ratings';

  function _userSuffix() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const email = raw ? (JSON.parse(raw).email || '') : '';
      return email.toLowerCase() || 'guest';
    } catch {
      return 'guest';
    }
  }

  function _scopedKey(base) {
    return `${base}:${_userSuffix()}`;
  }

  /** Migra datos legacy sin sufijo de usuario a la cuenta actual (una vez). */
  function _migrateLegacy(base) {
    const scoped = _scopedKey(base);
    try {
      if (localStorage.getItem(scoped)) return;
      const legacy = localStorage.getItem(base);
      if (!legacy) return;
      localStorage.setItem(scoped, legacy);
    } catch { /* ignore */ }
  }

  function _notes() {
    _migrateLegacy(KEY);
    try { return JSON.parse(localStorage.getItem(_scopedKey(KEY)) || '{}'); }
    catch { return {}; }
  }

  function _ratings() {
    _migrateLegacy(RATINGS_KEY);
    try { return JSON.parse(localStorage.getItem(_scopedKey(RATINGS_KEY)) || '{}'); }
    catch { return {}; }
  }

  function _writeNotes(map) {
    localStorage.setItem(_scopedKey(KEY), JSON.stringify(map));
  }

  function _writeRatings(map) {
    localStorage.setItem(_scopedKey(RATINGS_KEY), JSON.stringify(map));
  }

  function _noteId(courseId, lessonId) {
    return `${courseId}::${lessonId}`;
  }

  function getAll() {
    return _notes();
  }

  function getNote(courseId, lessonId) {
    return _notes()[_noteId(courseId, lessonId)] || '';
  }

  function saveNote(courseId, lessonId, text) {
    const all = _notes();
    const id = _noteId(courseId, lessonId);
    if (!String(text || '').trim()) delete all[id];
    else all[id] = String(text).trim();
    _writeNotes(all);
    return all[id] || '';
  }

  function getRating(courseId, lessonId) {
    return _ratings()[_noteId(courseId, lessonId)] || 0;
  }

  function setRating(courseId, lessonId, value) {
    const all = _ratings();
    const id = _noteId(courseId, lessonId);
    const v = Math.max(0, Math.min(1, value));
    if (!v) delete all[id];
    else all[id] = v;
    _writeRatings(all);
    return v;
  }

  return { getNote, saveNote, getRating, setRating, getAll };

})();

if (typeof module !== 'undefined') module.exports = LessonNotesService;
