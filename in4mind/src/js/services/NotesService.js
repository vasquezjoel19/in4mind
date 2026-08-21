/**
 * IN4MIND — NotesService
 * Notas independientes + apuntes de lecciones unificados en un solo hub.
 */

'use strict';

const NotesService = (() => {

  const KEY = 'in4mind_user_notes';
  const FOLDERS_KEY = 'in4mind_note_folders';
  const DELETED_NOTES_KEY = 'in4mind_deleted_notes';
  const DELETED_FOLDERS_KEY = 'in4mind_deleted_folders';

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

  function _readMap(base) {
    _migrateLegacy(base);
    try {
      const parsed = JSON.parse(localStorage.getItem(_scopedKey(base)) || '{}');
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeMap(base, map, schedule = true) {
    try {
      localStorage.setItem(_scopedKey(base), JSON.stringify(map));
      if (schedule) _scheduleCloudPush();
      return true;
    } catch {
      return false;
    }
  }

  function _readNotes() { return _readMap(KEY); }
  function _writeNotes(map, schedule = true) { return _writeMap(KEY, map, schedule); }
  function _readFolders() { return _readMap(FOLDERS_KEY); }
  function _writeFolders(map, schedule = true) { return _writeMap(FOLDERS_KEY, map, schedule); }
  function _readDeletedNotes() { return _readMap(DELETED_NOTES_KEY); }
  function _readDeletedFolders() { return _readMap(DELETED_FOLDERS_KEY); }

  function _markDeleted(kind, ids) {
    const base = kind === 'folder' ? DELETED_FOLDERS_KEY : DELETED_NOTES_KEY;
    const map = _readMap(base);
    const now = Date.now();
    (Array.isArray(ids) ? ids : [ids]).forEach((id) => {
      if (id) map[id] = now;
    });
    _writeMap(base, map, false);
  }

  function _clearDeleted(kind, ids) {
    const base = kind === 'folder' ? DELETED_FOLDERS_KEY : DELETED_NOTES_KEY;
    const map = _readMap(base);
    (Array.isArray(ids) ? ids : [ids]).forEach((id) => { delete map[id]; });
    _writeMap(base, map, false);
  }

  function _blobPayload() {
    return {
      notes: _readNotes(),
      folders: _readFolders(),
      deletedNotes: _readDeletedNotes(),
      deletedFolders: _readDeletedFolders(),
    };
  }

  let _pushTimer = null;
  function _scheduleCloudPush() {
    if (typeof CloudBlobSync === 'undefined') return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => {
      void CloudBlobSync.pushBlob('notes', _blobPayload());
    }, 450);
  }

  async function flushCloud() {
    if (typeof CloudBlobSync === 'undefined') return { ok: false };
    clearTimeout(_pushTimer);
    return CloudBlobSync.pushBlob('notes', _blobPayload());
  }

  async function hydrateFromCloud() {
    if (typeof CloudBlobSync === 'undefined') return false;
    const remote = await CloudBlobSync.pullBlob('notes');
    if (!remote?.blob) return false;
    const localNotes = _readNotes();
    const localFolders = _readFolders();
    const localDelNotes = {
      ..._readDeletedNotes(),
      ...(remote.blob.deletedNotes || {}),
    };
    const localDelFolders = {
      ..._readDeletedFolders(),
      ...(remote.blob.deletedFolders || {}),
    };
    const remoteNotes = remote.blob.notes || {};
    const remoteFolders = remote.blob.folders || {};
    const mergedNotes = CloudBlobSync.mergeMaps(localNotes, remoteNotes, localDelNotes);
    const mergedFolders = CloudBlobSync.mergeMaps(localFolders, remoteFolders, localDelFolders);
    try {
      localStorage.setItem(_scopedKey(KEY), JSON.stringify(mergedNotes));
      localStorage.setItem(_scopedKey(FOLDERS_KEY), JSON.stringify(mergedFolders));
      localStorage.setItem(_scopedKey(DELETED_NOTES_KEY), JSON.stringify(localDelNotes));
      localStorage.setItem(_scopedKey(DELETED_FOLDERS_KEY), JSON.stringify(localDelFolders));
      void flushCloud();
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

    _clearDeleted('note', id);

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
    const snapshot = { ...map[id] };
    delete map[id];
    _markDeleted('note', id);
    _writeNotes(map);
    void flushCloud();
    return { ok: true, snapshot };
  }

  function restoreNote(snapshot) {
    if (!snapshot?.id) return null;
    _clearDeleted('note', snapshot.id);
    const map = _readNotes();
    map[snapshot.id] = { ...snapshot, updatedAt: Date.now() };
    _writeNotes(map);
    void flushCloud();
    return map[snapshot.id];
  }

  function moveNoteToFolder(noteId, folderId) {
    const note = getNote(noteId);
    if (!note || note.source === 'lesson') return null;
    return saveNote({ id: noteId, folderId: folderId || null });
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
    _clearDeleted('folder', id);
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

  /**
   * Borra carpeta + notas internas. Devuelve snapshot para Deshacer.
   */
  function deleteFolder(id) {
    const folders = _readFolders();
    const folder = folders[id];
    if (!folder) return { ok: false };
    const notes = _readNotes();
    const removedNotes = [];
    Object.keys(notes).forEach((nid) => {
      if (notes[nid].folderId === id) {
        removedNotes.push({ ...notes[nid] });
        delete notes[nid];
      }
    });
    delete folders[id];
    _markDeleted('folder', id);
    _markDeleted('note', removedNotes.map((n) => n.id));
    _writeFolders(folders, false);
    _writeNotes(notes, false);
    _scheduleCloudPush();
    void flushCloud();
    return {
      ok: true,
      removed: removedNotes.length,
      snapshot: { folder, notes: removedNotes },
    };
  }

  function restoreFolderSnapshot(snapshot) {
    if (!snapshot?.folder?.id) return false;
    const folders = _readFolders();
    folders[snapshot.folder.id] = { ...snapshot.folder, updatedAt: Date.now() };
    _clearDeleted('folder', snapshot.folder.id);
    const notes = _readNotes();
    (snapshot.notes || []).forEach((n) => {
      notes[n.id] = { ...n, updatedAt: Date.now() };
      _clearDeleted('note', n.id);
    });
    _writeFolders(folders, false);
    _writeNotes(notes, false);
    void flushCloud();
    return true;
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
    moveNoteToFolder,
    toggleFavorite,
    togglePin,
    getFolders,
    getFolder,
    saveFolder,
    deleteFolder,
    restoreFolderSnapshot,
    search,
    getByFolder,
    getRecent,
    hydrateFromCloud,
    flushCloud,
  };

})();

if (typeof module !== 'undefined') module.exports = NotesService;
