'use strict';

const LessonNotesService = (() => {

  const KEY = 'in4mind_lesson_notes';
  const RATINGS_KEY = 'in4mind_lesson_ratings';

  function _notes() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
    catch { return {}; }
  }

  function _ratings() {
    try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || '{}'); }
    catch { return {}; }
  }

  function _noteId(courseId, lessonId) {
    return `${courseId}::${lessonId}`;
  }

  function getNote(courseId, lessonId) {
    return _notes()[_noteId(courseId, lessonId)] || '';
  }

  function saveNote(courseId, lessonId, text) {
    const all = _notes();
    const id = _noteId(courseId, lessonId);
    if (!text.trim()) delete all[id];
    else all[id] = text.trim();
    localStorage.setItem(KEY, JSON.stringify(all));
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
    localStorage.setItem(RATINGS_KEY, JSON.stringify(all));
    return v;
  }

  return { getNote, saveNote, getRating, setRating };

})();

if (typeof module !== 'undefined') module.exports = LessonNotesService;
