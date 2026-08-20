/**
 * IN4MIND — NotesService
 * Notas independientes + apuntes de lecciones unificados en un solo hub.
 */

'use strict';

const NotesService = (() => {

  const KEY = 'in4mind_user_notes';
  const FOLDERS_KEY = 'in4mind_note_folders';
  const TOMB_KEY = 'in4mind_note_tombstones';

  const COLORS = [
    '#FFE066', '#FF8A80', '#80DEEA', '#B39DDB', '#A5D6A7', '#FFCC80', '#90CAF9', '#F48FB1',
  ];

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

  /** Datos antiguos sin sufijo → cuenta actual (una sola vez por clave). */
  function _migrateLegacy(base) {
    const scoped = _scopedKey(base);
    try {
      if (localStorage.getItem(scoped)) return;
      const legacy = localStorage.getItem(base);
      if (!legacy) return;
      localStorage.setItem(scoped, legacy);
    } catch { /* ignore */ }
  }

  function _readNotes() {
    _migrateLegacy(KEY);
    try {
      const parsed = JSON.parse(localStorage.getItem(_scopedKey(KEY)) || '{}');
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeNotes(map) {
    try {
      localStorage.setItem(_scopedKey(KEY), JSON.stringify(map));
      _scheduleCloudPush();
      return true;
    } catch {
      return false;
    }
  }

  function _readFolders() {
    _migrateLegacy(FOLDERS_KEY);
    try {
      const parsed = JSON.parse(localStorage.getItem(_scopedKey(FOLDERS_KEY)) || '{}');
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeFolders(map) {
    try {
      localStorage.setItem(_scopedKey(FOLDERS_KEY), JSON.stringify(map));
      _scheduleCloudPush();
      return true;
    } catch {
      return false;
    }
  }

  function _readTombstones() {
    try {
      const parsed = JSON.parse(localStorage.getItem(_scopedKey(TOMB_KEY)) || '{}');
      return parsed && typeof parsed === 'object'
        ? { notes: parsed.notes || {}, folders: parsed.folders || {} }
        : { notes: {}, folders: {} };
    } catch {
      return { notes: {}, folders: {} };
    }
  }

  function _writeTombstones(data) {
    try {
      localStorage.setItem(_scopedKey(TOMB_KEY), JSON.stringify({
        notes: data.notes || {},
        folders: data.folders || {},
      }));
    } catch { /* ignore */ }
  }

  function _markTombstones(kind, ids) {
    const tombs = _readTombstones();
    const now = Date.now();
    (ids || []).forEach((id) => {
      if (id) tombs[kind][id] = now;
    });
    _writeTombstones(tombs);
    return tombs;
  }

  function _clearTombstone(kind, id) {
    const tombs = _readTombstones();
    if (tombs[kind]?.[id]) {
      delete tombs[kind][id];
      _writeTombstones(tombs);
    }
  }

  let _pushTimer = null;
  function _blobPayload() {
    return {
      notes: _readNotes(),
      folders: _readFolders(),
      tombstones: _readTombstones(),
      revisedAt: Date.now(),
    };
  }

  function _scheduleCloudPush(immediate = false) {
    if (typeof CloudBlobSync === 'undefined') return;
    clearTimeout(_pushTimer);
    const run = () => { void CloudBlobSync.pushBlob('notes', _blobPayload()); };
    if (immediate) run();
    else _pushTimer = setTimeout(run, 450);
  }

  function flushCloud() {
    _scheduleCloudPush(true);
  }

  async function hydrateFromCloud() {
    if (typeof CloudBlobSync === 'undefined') return false;
    const remote = await CloudBlobSync.pullBlob('notes');
    if (!remote?.blob) return false;
    const localNotes = _readNotes();
    const localFolders = _readFolders();
    const localTombs = _readTombstones();
    const remoteNotes = remote.blob.notes || {};
    const remoteFolders = remote.blob.folders || {};
    const remoteTombs = remote.blob.tombstones || { notes: {}, folders: {} };
    const tombs = typeof CloudBlobSync.mergeTombstones === 'function'
      ? {
          notes: CloudBlobSync.mergeTombstones(localTombs.notes, remoteTombs.notes),
          folders: CloudBlobSync.mergeTombstones(localTombs.folders, remoteTombs.folders),
        }
      : {
          notes: { ...remoteTombs.notes, ...localTombs.notes },
          folders: { ...remoteTombs.folders, ...localTombs.folders },
        };
    const mergedNotes = CloudBlobSync.mergeMaps(localNotes, remoteNotes, tombs.notes);
    const mergedFolders = CloudBlobSync.mergeMaps(localFolders, remoteFolders, tombs.folders);
    try {
      localStorage.setItem(_scopedKey(KEY), JSON.stringify(mergedNotes));
      localStorage.setItem(_scopedKey(FOLDERS_KEY), JSON.stringify(mergedFolders));
      _writeTombstones(tombs);
    } catch { return false; }
    return true;
  }

  function _id() {
    return `note_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function _folderId() {
    return `folder_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function _preview(text, max = 120) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
  }

  /** Apuntes de lecciones (LessonNotesService) como notas enlazadas — ya scoped por usuario. */
  function _lessonNotesAsEntries() {
    if (typeof LessonNotesService === 'undefined' || typeof CourseCurriculum === 'undefined') return [];
    const raw = typeof LessonNotesService.getAll === 'function'
      ? LessonNotesService.getAll()
      : {};
    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

    return Object.entries(raw).map(([key, content]) => {
      const [courseId, lessonId] = key.split('::');
      const lessons = CourseCurriculum.getLessons?.(courseId) || [];
      const lesson = lessons.find(l => String(l.id) === String(lessonId));
      const course = courseMap[courseId];
      if (!content?.trim()) return null;
      return {
        id:          `lesson::${key}`,
        title:       lesson?.title || `Lección ${lessonId}`,
        content:     content.trim(),
        preview:     _preview(content),
        color:       '#90CAF9',
        tags:        ['Lección', course?.title || courseId].filter(Boolean),
        favorite:    false,
        folderId:    null,
        courseId,
        lessonId,
        projectId:   null,
        source:      'lesson',
        pinned:      false,
        createdAt:   0,
        updatedAt:   Date.now(),
      };
    }).filter(Boolean);
  }

  function getAllNotes() {
    const standalone = Object.values(_readNotes());
    const linked = _lessonNotesAsEntries();
    const seen = new Set();
    const merged = [];

    [...standalone, ...linked].forEach(note => {
      if (!note?.id || seen.has(note.id)) return;
      seen.add(note.id);
      merged.push(note);
    });

    return merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function getNote(id) {
    if (String(id).startsWith('lesson::')) {
      return _lessonNotesAsEntries().find(n => n.id === id) || null;
    }
    return _readNotes()[id] || null;
  }

  function saveNote(data) {
    const map = _readNotes();
    const now = Date.now();
    const id = data.id || _id();
    const existing = map[id] || {};

    if (String(id).startsWith('lesson::')) return null;

    map[id] = {
      id,
      title:     (data.title || existing.title || 'Sin título').trim(),
      content:   (data.content ?? existing.content ?? '').trim(),
      preview:   _preview(data.content ?? existing.content ?? ''),
      color:     data.color || existing.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      tags:      Array.isArray(data.tags) ? data.tags : (existing.tags || []),
      favorite:  Boolean(data.favorite ?? existing.favorite),
      folderId:  data.folderId ?? existing.folderId ?? null,
      courseId:  data.courseId ?? existing.courseId ?? null,
      lessonId:  data.lessonId ?? existing.lessonId ?? null,
      projectId: data.projectId ?? existing.projectId ?? null,
      source:    'user',
      pinned:    Boolean(data.pinned ?? existing.pinned),
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };
    _writeNotes(map);
    return map[id];
  }

  function restoreNote(note) {
    if (!note?.id || String(note.id).startsWith('lesson::')) return null;
    _clearTombstone('notes', note.id);
    const map = _readNotes();
    map[note.id] = { ...note, updatedAt: Date.now() };
    _writeNotes(map);
    return map[note.id];
  }

  function restoreFolder(folder, notes = []) {
    if (!folder?.id) return false;
    _clearTombstone('folders', folder.id);
    const fmap = _readFolders();
    fmap[folder.id] = { ...folder, updatedAt: Date.now() };
    _writeFolders(fmap);
    (notes || []).forEach((n) => restoreNote({ ...n, folderId: folder.id }));
    return true;
  }

  function deleteNote(id) {
    if (String(id).startsWith('lesson::')) {
      const key = id.replace(/^lesson::/, '');
      const [courseId, lessonId] = key.split('::');
      if (typeof LessonNotesService !== 'undefined') {
        LessonNotesService.saveNote(courseId, lessonId, '');
      }
      return true;
    }
    const map = _readNotes();
    if (!(id in map)) return false;
    delete map[id];
    _markTombstones('notes', [id]);
    return _writeNotes(map);
  }

  function toggleFavorite(id) {
    const note = getNote(id);
    if (!note || note.source === 'lesson') {
      if (note) return note;
      return null;
    }
    return saveNote({ id, favorite: !note.favorite });
  }

  function togglePin(id) {
    const note = getNote(id);
    if (!note || note.source === 'lesson') return note;
    return saveNote({ id, pinned: !note.pinned });
  }

  function getFolders() {
    return Object.values(_readFolders()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function getFolder(id) {
    if (!id) return null;
    return _readFolders()[id] || null;
  }

  function saveFolder(data) {
    const map = _readFolders();
    const now = Date.now();
    const id = data.id || _folderId();
    map[id] = {
      id,
      name:      (data.name || 'Carpeta').trim(),
      color:     data.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: map[id]?.createdAt || now,
      updatedAt: now,
    };
    _writeFolders(map);
    return map[id];
  }

  function deleteFolder(id) {
    const map = _readFolders();
    if (!(id in map)) return false;
    const removedIds = [];
    const notes = _readNotes();
    Object.keys(notes).forEach((nid) => {
      if (notes[nid].folderId === id) {
        delete notes[nid];
        removedIds.push(nid);
      }
    });
    delete map[id];
    _writeFolders(map);
    _markTombstones('folders', [id]);
    if (removedIds.length) {
      _markTombstones('notes', removedIds);
      _writeNotes(notes);
    } else {
      _scheduleCloudPush(true);
    }
    return { ok: true, removed: removedIds.length, removedIds };
  }

  function moveToFolder(noteId, folderId) {
    const note = getNote(noteId);
    if (!note || note.source === 'lesson') return null;
    return saveNote({ id: noteId, folderId: folderId || null });
  }

  function search(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return getAllNotes();
    return getAllNotes().filter(n => {
      const hay = [n.title, n.content, n.preview, ...(n.tags || [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function getByFolder(folderId) {
    return getAllNotes().filter(n => n.folderId === folderId);
  }

  function getRecent(days = 7) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return getAllNotes().filter(n => (n.updatedAt || 0) >= cutoff);
  }

  return {
    COLORS,
    getAllNotes,
    getNote,
    saveNote,
    deleteNote,
    restoreNote,
    restoreFolder,
    moveToFolder,
    flushCloud,
    toggleFavorite,
    togglePin,
    getFolders,
    getFolder,
    saveFolder,
    deleteFolder,
    search,
    getByFolder,
    getRecent,
    hydrateFromCloud,
  };

})();

if (typeof module !== 'undefined') module.exports = NotesService;
