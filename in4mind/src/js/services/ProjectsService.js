/**
 * IN4MIND — ProjectsService
 * Proyectos de aprendizaje estilo ChatGPT Projects, vinculados al flujo IN4MIND.
 */

'use strict';

const ProjectsService = (() => {

  const KEY = 'in4mind_projects';

  const COLORS = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9'];

  function _userSuffix() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const email = raw ? (JSON.parse(raw).email || '') : '';
      return email.toLowerCase() || 'guest';
    } catch {
      return 'guest';
    }
  }

  function _scopedKey() {
    return `${KEY}:${_userSuffix()}`;
  }

  function _migrateLegacy() {
    const scoped = _scopedKey();
    try {
      if (localStorage.getItem(scoped)) return;
      const legacy = localStorage.getItem(KEY);
      if (!legacy) return;
      localStorage.setItem(scoped, legacy);
    } catch { /* ignore */ }
  }

  function _readAll() {
    _migrateLegacy();
    try {
      const parsed = JSON.parse(localStorage.getItem(_scopedKey()) || '{}');
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeAll(map) {
    try {
      localStorage.setItem(_scopedKey(), JSON.stringify(map));
      _scheduleCloudPush();
      return true;
    } catch {
      return false;
    }
  }

  let _pushTimer = null;
  function _scheduleCloudPush() {
    if (typeof CloudBlobSync === 'undefined') return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => {
      void CloudBlobSync.pushBlob('projects', _readAll());
    }, 450);
  }

  async function hydrateFromCloud() {
    if (typeof CloudBlobSync === 'undefined') return false;
    const remote = await CloudBlobSync.pullBlob('projects');
    if (!remote?.blob) return false;
    const merged = CloudBlobSync.mergeMaps(_readAll(), remote.blob || {});
    try {
      localStorage.setItem(_scopedKey(), JSON.stringify(merged));
      return true;
    } catch {
      return false;
    }
  }

  function _id() {
    return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function _taskId() {
    return `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function getAll(opts = {}) {
    const includeArchived = Boolean(opts.includeArchived);
    return Object.values(_readAll())
      .filter((p) => includeArchived || !p.archived)
      .sort((a, b) => {
        if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
        return (b.updatedAt || 0) - (a.updatedAt || 0);
      });
  }

  function get(id) {
    return _readAll()[id] || null;
  }

  function save(data) {
    const map = _readAll();
    const now = Date.now();
    const id = data.id || _id();
    const existing = map[id] || {};

    map[id] = {
      id,
      title:       (data.title || existing.title || 'Nuevo proyecto').trim(),
      description: (data.description ?? existing.description ?? '').trim(),
      color:       data.color || existing.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      icon:        data.icon || existing.icon || '📁',
      courseId:    data.courseId ?? existing.courseId ?? null,
      quizId:      data.quizId ?? existing.quizId ?? null,
      noteIds:     Array.isArray(data.noteIds) ? data.noteIds : (existing.noteIds || []),
      tasks:       Array.isArray(data.tasks) ? data.tasks : (existing.tasks || []),
      pinned:      Boolean(data.pinned ?? existing.pinned),
      archived:    Boolean(data.archived ?? existing.archived),
      createdAt:   existing.createdAt || now,
      updatedAt:   now,
    };
    _writeAll(map);
    return map[id];
  }

  function remove(id) {
    const map = _readAll();
    if (!(id in map)) return false;
    delete map[id];
    return _writeAll(map);
  }

  function togglePin(id) {
    const p = get(id);
    if (!p) return null;
    return save({ id, pinned: !p.pinned });
  }

  function archive(id, archived = true) {
    const p = get(id);
    if (!p) return null;
    return save({ id, archived: Boolean(archived), pinned: archived ? false : p.pinned });
  }

  function emptyTasks(id) {
    const p = get(id);
    if (!p) return null;
    return save({ id, tasks: [] });
  }

  function addTask(projectId, text) {
    const p = get(projectId);
    if (!p || !text?.trim()) return null;
    const tasks = [...(p.tasks || []), { id: _taskId(), text: text.trim(), done: false }];
    return save({ id: projectId, tasks });
  }

  function toggleTask(projectId, taskId) {
    const p = get(projectId);
    if (!p) return null;
    const tasks = (p.tasks || []).map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    return save({ id: projectId, tasks });
  }

  function removeTask(projectId, taskId) {
    const p = get(projectId);
    if (!p) return null;
    const tasks = (p.tasks || []).filter(t => t.id !== taskId);
    return save({ id: projectId, tasks });
  }

  function linkNote(projectId, noteId) {
    const p = get(projectId);
    if (!p || !noteId) return null;
    const noteIds = [...new Set([...(p.noteIds || []), noteId])];
    if (typeof NotesService !== 'undefined') {
      NotesService.saveNote({ id: noteId, projectId });
    }
    return save({ id: projectId, noteIds });
  }

  function search(query, opts = {}) {
    const q = String(query || '').trim().toLowerCase();
    const list = getAll(opts);
    if (!q) return list;
    return list.filter(p => {
      const hay = [p.title, p.description, ...(p.tasks || []).map(t => t.text)].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function getProgress(project) {
    const tasks = project?.tasks || [];
    if (!tasks.length) return 0;
    const done = tasks.filter(t => t.done).length;
    return Math.round((done / tasks.length) * 100);
  }

  return {
    COLORS,
    getAll,
    get,
    save,
    remove,
    togglePin,
    archive,
    emptyTasks,
    addTask,
    toggleTask,
    removeTask,
    linkNote,
    search,
    getProgress,
    hydrateFromCloud,
  };

})();

if (typeof module !== 'undefined') module.exports = ProjectsService;
