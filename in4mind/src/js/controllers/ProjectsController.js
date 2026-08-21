/**
 * IN4MIND — ProjectsController
 * Proyectos de aprendizaje con tareas, notas vinculadas y progreso.
 */

'use strict';

const ProjectsController = (() => {

  let _query = '';
  let _activeId = null;
  let _showArchived = false;

  let $grid, $detail, $search, $listView, $detailView;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  async function _promptDialog({ title, message, value, placeholder } = {}) {
    if (typeof UiDialog !== 'undefined') {
      return UiDialog.prompt({ title, message, value, placeholder });
    }
    return window.prompt(message || title || '', value || '');
  }

  async function _confirmDialog({ title, message, danger } = {}) {
    if (typeof UiDialog !== 'undefined') {
      return danger
        ? UiDialog.danger({ title, message })
        : UiDialog.confirm({ title, message });
    }
    return window.confirm(message || title || '');
  }

  function _courseTitle(courseId) {
    if (!courseId || typeof DataService === 'undefined') return '';
    return DataService.getCourses().find(c => c.id === courseId)?.title || courseId;
  }

  function _publishShareContext(projectId = null) {
    if (typeof ShareService === 'undefined') return;
    ShareService.setContext({
      page: 'projects.html',
      params: projectId ? { project: projectId } : {},
      title: _t('projects.pageTitle', null, 'Mis Proyectos — IN4MIND'),
    });
  }

  function _showList() {
    _activeId = null;
    $listView?.classList.remove('projects-view--hidden');
    $detailView?.classList.add('projects-view--hidden');
    _publishShareContext();
    _renderGrid();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('project');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* ignore */ }
  }

  function _showDetail(id) {
    _activeId = id;
    $listView?.classList.add('projects-view--hidden');
    $detailView?.classList.remove('projects-view--hidden');
    _renderDetail(id);
    _publishShareContext(id);
    const url = new URL(window.location.href);
    url.searchParams.set('project', id);
    window.history.replaceState({}, '', url);
  }

  function _syncArchivedToggle() {
    const btn = document.getElementById('projects-archived-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', String(_showArchived));
    btn.textContent = _showArchived
      ? _t('projects.showActive', null, 'Ver activos')
      : _t('projects.showArchived', null, 'Ver archivados');
  }

  function _renderGrid() {
    if (!$grid) return;
    const projects = ProjectsService.search(_query, {
      includeArchived: _showArchived,
      archivedOnly: _showArchived,
    });

    if (!projects.length) {
      $grid.innerHTML = `
        <div class="projects-empty empty-state empty-state--hero">
          <div class="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
            </svg>
          </div>
          <h3 class="empty-state__title">${_t(
            _showArchived ? 'projects.emptyArchivedTitle' : 'projects.emptyTitle',
            null,
            _showArchived ? 'Sin proyectos archivados' : 'Sin proyectos todavía'
          )}</h3>
          <p class="empty-state__desc">${_t(
            _showArchived ? 'projects.emptyArchived' : 'projects.empty',
            null,
            _showArchived
              ? 'Los proyectos que archives aparecerán aquí.'
              : 'Organiza tu aprendizaje en proyectos con tareas y cursos vinculados.'
          )}</p>
          ${_showArchived ? '' : `<button type="button" class="btn--course btn--lg empty-state__action" id="projects-empty-create">${_t('projects.newProject', null, 'Nuevo proyecto')}</button>`}
        </div>`;
      document.getElementById('projects-empty-create')?.addEventListener('click', () => { void _createProject(); });
      return;
    }

    $grid.innerHTML = projects.map(p => {
      const pct = ProjectsService.getProgress(p);
      const taskCount = (p.tasks || []).length;
      return `
        <article class="projects-card ${p.archived ? 'projects-card--archived' : ''}" style="--proj-color:${p.color}"
                 data-project-id="${p.id}" role="button" tabindex="0">
          <div class="projects-card__top">
            <span class="projects-card__icon">${p.icon || '📁'}</span>
            <div class="projects-card__actions">
              ${p.pinned ? '<span class="projects-card__pin" aria-hidden="true">★</span>' : ''}
              ${p.archived ? `<span class="projects-card__archived-badge">${_escape(_t('projects.archivedBadge', null, 'Archivado'))}</span>` : ''}
              <button type="button" class="projects-card__delete" data-delete-project="${p.id}"
                      aria-label="${_escape(_t('common.delete', null, 'Eliminar'))}">🗑</button>
            </div>
          </div>
          <h3 class="projects-card__title">${_escape(p.title)}</h3>
          <p class="projects-card__desc">${_escape(p.description || _t('projects.noDesc', null, 'Sin descripción'))}</p>
          ${p.courseId ? `<span class="projects-card__course">${_escape(_courseTitle(p.courseId))}</span>` : ''}
          <div class="projects-card__progress">
            <div class="projects-card__progress-fill" style="width:${pct}%"></div>
          </div>
          <footer class="projects-card__foot">
            <span>${taskCount} ${_t('projects.tasks', null, 'tareas')}</span>
            <span>${pct}%</span>
          </footer>
        </article>`;
    }).join('') + (_showArchived ? '' : `
      <button type="button" class="projects-card projects-card--new" id="projects-grid-new">
        <span>＋</span>
        <span>${_t('projects.newProject', null, 'Nuevo proyecto')}</span>
      </button>`);

    $grid.querySelectorAll('[data-project-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-delete-project]')) return;
        _showDetail(el.dataset.projectId);
      });
    });
    $grid.querySelectorAll('[data-delete-project]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = await _confirmDialog({
          title: _t('common.delete', null, 'Eliminar'),
          message: _t('projects.deleteConfirm', null, '¿Eliminar este proyecto?'),
          danger: true,
        });
        if (!ok) return;
        ProjectsService.remove(btn.dataset.deleteProject);
        if (_activeId === btn.dataset.deleteProject) _showList();
        else _renderGrid();
        AppShell.showToast(_t('projects.deleted', null, 'Proyecto eliminado'));
      });
    });
    document.getElementById('projects-grid-new')?.addEventListener('click', () => { void _createProject(); });
  }

  function _renderDetail(id) {
    const p = ProjectsService.get(id);
    if (!p || !$detail) return;

    const pct = ProjectsService.getProgress(p);
    const linkedNotes = (p.noteIds || [])
      .map(nid => typeof NotesService !== 'undefined' ? NotesService.getNote(nid) : null)
      .filter(Boolean);

    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    const courseOptions = courses.map(c =>
      `<option value="${c.id}" ${p.courseId === c.id ? 'selected' : ''}>${_escape(c.title)}</option>`
    ).join('');

    const hasTasks = (p.tasks || []).length > 0;

    $detail.innerHTML = `
      <header class="projects-detail__head">
        <button type="button" class="btn--back" id="projects-back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          ${_t('projects.back', null, 'Volver')}
        </button>
        <button type="button" class="btn--quiz-share" id="projects-detail-share" data-share aria-label="Compartir">↗</button>
      </header>

      <div class="projects-detail__hero" style="--proj-color:${p.color}">
        <span class="projects-detail__icon">${p.icon || '📁'}</span>
        <input class="projects-detail__title" id="proj-title" value="${_escape(p.title)}" aria-label="Título">
        <textarea class="projects-detail__desc" id="proj-desc" rows="2" placeholder="${_t('projects.descPlaceholder', null, 'Describe tu proyecto…')}">${_escape(p.description)}</textarea>
        <div class="projects-detail__meta">
          <label class="projects-detail__label">${_t('projects.linkedCourse', null, 'Curso vinculado')}</label>
          <select id="proj-course" class="projects-detail__select">
            <option value="">${_t('projects.noCourse', null, '— Ninguno —')}</option>
            ${courseOptions}
          </select>
        </div>
        <div class="projects-detail__progress">
          <div class="projects-detail__progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="projects-detail__pct">${pct}% ${_t('projects.complete', null, 'completado')}</span>
      </div>

      <section class="projects-detail__section">
        <div class="projects-detail__section-head">
          <h2>${_t('projects.tasksTitle', null, 'Tareas')}</h2>
        </div>
        <ul class="projects-tasks" id="proj-tasks">
          ${(p.tasks || []).map(t => `
            <li class="projects-task ${t.done ? 'projects-task--done' : ''}" data-task-id="${t.id}">
              <button type="button" class="projects-task__check" aria-label="Completar">${t.done ? '✓' : ''}</button>
              <span class="projects-task__text">${_escape(t.text)}</span>
              <button type="button" class="projects-task__remove" aria-label="Eliminar">×</button>
            </li>`).join('')}
        </ul>
        <form class="projects-task-form" id="proj-task-form">
          <input type="text" id="proj-task-input" placeholder="${_t('projects.addTask', null, 'Añadir tarea…')}" maxlength="200">
          <button type="submit" class="btn--course">${_t('common.add', null, 'Añadir')}</button>
        </form>
      </section>

      <section class="projects-detail__section">
        <div class="projects-detail__section-head">
          <h2>${_t('projects.notesTitle', null, 'Notas del proyecto')}</h2>
          <button type="button" class="btn--course" id="proj-add-note">${_t('notes.newNote', null, 'Nueva nota')}</button>
        </div>
        <div class="projects-notes-grid" id="proj-notes">
          ${linkedNotes.length
            ? linkedNotes.map(n => `
              <a class="projects-note-chip" href="notes.html?note=${n.id}" style="--note-color:${n.color}">
                <strong>${_escape(n.title)}</strong>
                <span>${_escape(n.preview || '')}</span>
              </a>`).join('')
            : `<p class="projects-notes-empty">${_t('projects.noNotes', null, 'Sin notas vinculadas.')}</p>`}
        </div>
      </section>

      <div class="projects-detail__actions">
        <button type="button" class="btn--course" id="proj-save">${_t('common.save', null, 'Guardar')}</button>
        ${p.courseId ? `<a class="btn--outline" href="tutorial.html?course=${p.courseId}">${_t('projects.openCourse', null, 'Abrir curso')}</a>` : ''}
        <button type="button" class="btn--outline" id="proj-archive">
          ${p.archived
            ? _t('projects.unarchive', null, 'Desarchivar')
            : _t('projects.archive', null, 'Archivar proyecto')}
        </button>
        <button type="button" class="btn--outline" id="proj-empty-tasks" ${hasTasks ? '' : 'disabled'}>
          ${_t('projects.emptyProject', null, 'Vaciar proyecto')}
        </button>
        <button type="button" class="btn--danger projects-detail__delete" id="proj-delete">${_t('common.delete', null, 'Eliminar')}</button>
      </div>`;

    document.getElementById('projects-back')?.addEventListener('click', _showList);

    document.getElementById('proj-task-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('proj-task-input');
      if (!input?.value.trim()) return;
      ProjectsService.addTask(id, input.value.trim());
      input.value = '';
      _renderDetail(id);
      _renderGrid();
    });

    $detail.querySelectorAll('.projects-task__check').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.closest('[data-task-id]')?.dataset.taskId;
        if (taskId) {
          ProjectsService.toggleTask(id, taskId);
          _renderDetail(id);
          _renderGrid();
        }
      });
    });

    $detail.querySelectorAll('.projects-task__remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.closest('[data-task-id]')?.dataset.taskId;
        if (taskId) {
          ProjectsService.removeTask(id, taskId);
          _renderDetail(id);
          _renderGrid();
        }
      });
    });

    document.getElementById('proj-save')?.addEventListener('click', () => {
      ProjectsService.save({
        id,
        title: document.getElementById('proj-title')?.value,
        description: document.getElementById('proj-desc')?.value,
        courseId: document.getElementById('proj-course')?.value || null,
      });
      AppShell.showToast(_t('projects.saved', null, 'Proyecto guardado'));
      _renderGrid();
    });

    document.getElementById('proj-archive')?.addEventListener('click', () => {
      const next = !p.archived;
      ProjectsService.setArchived(id, next);
      AppShell.showToast(
        next
          ? _t('projects.archived', null, 'Proyecto archivado')
          : _t('projects.unarchived', null, 'Proyecto restaurado')
      );
      if (next && !_showArchived) _showList();
      else {
        _renderDetail(id);
        _renderGrid();
      }
    });

    document.getElementById('proj-empty-tasks')?.addEventListener('click', async () => {
      const ok = await _confirmDialog({
        title: _t('projects.emptyProject', null, 'Vaciar proyecto'),
        message: _t('projects.emptyConfirm', null, '¿Quitar todas las tareas de este proyecto?'),
        danger: true,
      });
      if (!ok) return;
      ProjectsService.emptyTasks(id);
      AppShell.showToast(_t('projects.emptied', null, 'Proyecto vaciado'));
      _renderDetail(id);
      _renderGrid();
    });

    document.getElementById('proj-delete')?.addEventListener('click', async () => {
      const ok = await _confirmDialog({
        title: _t('common.delete', null, 'Eliminar'),
        message: _t('projects.deleteConfirm', null, '¿Eliminar este proyecto?'),
        danger: true,
      });
      if (!ok) return;
      ProjectsService.remove(id);
      _showList();
      AppShell.showToast(_t('projects.deleted', null, 'Proyecto eliminado'));
    });

    document.getElementById('proj-add-note')?.addEventListener('click', () => {
      if (typeof NotesService === 'undefined') return;
      const note = NotesService.saveNote({
        title: `${p.title} — ${_t('notes.untitled', null, 'Nota')}`,
        content: '',
        projectId: id,
        courseId: p.courseId,
      });
      if (note) {
        ProjectsService.linkNote(id, note.id);
        window.location.href = `notes.html?note=${note.id}`;
      }
    });
  }

  async function _createProject() {
    const title = await _promptDialog({
      title: _t('projects.newProject', null, 'Nuevo proyecto'),
      message: _t('projects.namePrompt', null, 'Nombre del proyecto:'),
    });
    if (title == null || !String(title).trim()) return;
    const p = ProjectsService.save({ title: String(title).trim(), description: '', icon: '🚀' });
    _showDetail(p.id);
    _renderGrid();
  }

  function init() {
    $grid = document.getElementById('projects-grid');
    $detail = document.getElementById('projects-detail');
    $search = document.getElementById('projects-search');
    $listView = document.getElementById('projects-list-view');
    $detailView = document.getElementById('projects-detail-view');

    const actions = document.querySelector('.workspace-page-header__actions');
    if (actions && !document.getElementById('projects-archived-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'btn--outline';
      toggle.id = 'projects-archived-toggle';
      toggle.setAttribute('aria-pressed', 'false');
      actions.insertBefore(toggle, actions.firstChild);
    }
    _syncArchivedToggle();
    document.getElementById('projects-archived-toggle')?.addEventListener('click', () => {
      _showArchived = !_showArchived;
      _syncArchivedToggle();
      _renderGrid();
    });

    _renderGrid();
    _publishShareContext();

    const params = new URLSearchParams(window.location.search);
    const openProject = params.get('project');
    if (openProject && ProjectsService.get(openProject)) _showDetail(openProject);

    document.getElementById('projects-new-btn')?.addEventListener('click', () => { void _createProject(); });
    document.getElementById('projects-btn-share')?.addEventListener('click', () => ShareService?.share());

    $search?.addEventListener('input', () => {
      _query = $search.value.trim();
      _renderGrid();
    });

    window.addEventListener('in4mind-locale-change', () => {
      _syncArchivedToggle();
      if (_activeId) _renderDetail(_activeId);
      else _renderGrid();
    });
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = ProjectsController;
