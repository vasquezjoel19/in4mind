/**
 * IN4MIND — NotesController
 * Hub de notas con carpetas, tarjetas coloridas y editor modal.
 */

'use strict';

const NotesController = (() => {

  let _filter = 'all';
  let _period = 'week';
  let _query = '';
  let _editingId = null;

  let $grid, $foldersGrid, $search, $filterNav, $editorOverlay;
  let $editorTitle, $editorContent, $editorTags, $editorColor;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') return I18n.t(k, p);
    return fb ?? '';
  }

  function _escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function _formatDate(ts) {
    if (!ts) return '';
    try {
      return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(ts));
    } catch {
      return '';
    }
  }

  function _formatTime(ts) {
    if (!ts) return '';
    try {
      return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', weekday: 'short' }).format(new Date(ts));
    } catch {
      return '';
    }
  }

  function _filteredNotes() {
    let notes = NotesService.search(_query);
    if (_filter === 'favorites') notes = notes.filter(n => n.favorite);
    else if (_filter === 'recent') notes = NotesService.getRecent(_period === 'today' ? 1 : _period === 'month' ? 30 : 7);
    else if (_filter === 'lesson') notes = notes.filter(n => n.source === 'lesson');
    else if (_filter.startsWith('folder:')) notes = NotesService.getByFolder(_filter.slice(7));
    notes.sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) return b.pinned ? 1 : -1;
      return (b.updatedAt || 0) - (a.updatedAt || 0);
    });
    return notes;
  }

  function _publishShareContext(noteId = null) {
    if (typeof ShareService === 'undefined') return;
    ShareService.setContext({
      page: 'notes.html',
      params: noteId ? { note: noteId } : {},
      title: _t('notes.pageTitle', null, 'Mis Notas — IN4MIND'),
    });
  }

  function _renderFolders() {
    if (!$foldersGrid) return;
    const folders = NotesService.getFolders();
    const cards = folders.map(f => {
      const count = NotesService.getByFolder(f.id).length;
      return `
        <article class="notes-folder-card" style="--folder-color:${f.color}"
                 data-folder-id="${f.id}" role="button" tabindex="0">
          <div class="notes-folder-card__top">
            <span class="notes-folder-card__icon">📁</span>
            <button type="button" class="notes-folder-card__menu" data-folder-menu="${f.id}" aria-label="Opciones">⋯</button>
          </div>
          <h3 class="notes-folder-card__title">${_escape(f.name)}</h3>
          <p class="notes-folder-card__meta">${_formatDate(f.updatedAt)} · ${count} ${_t('notes.notesCount', { n: count }, 'notas')}</p>
        </article>`;
    }).join('');

    $foldersGrid.innerHTML = `
      ${cards}
      <button type="button" class="notes-folder-card notes-folder-card--new" id="notes-new-folder">
        <span class="notes-folder-card__icon">＋</span>
        <span>${_t('notes.newFolder', null, 'Nueva carpeta')}</span>
      </button>`;

    $foldersGrid.querySelectorAll('[data-folder-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-folder-menu]')) return;
        _filter = `folder:${el.dataset.folderId}`;
        _renderFilterNav();
        _renderGrid();
      });
    });

    document.getElementById('notes-new-folder')?.addEventListener('click', () => {
      const name = prompt(_t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'));
      if (!name?.trim()) return;
      NotesService.saveFolder({ name: name.trim() });
      _renderFolders();
    });
  }

  function _renderFilterNav() {
    if (!$filterNav) return;
    const items = [
      { id: 'all',       label: _t('notes.allNotes', null, 'Todas') },
      { id: 'favorites', label: _t('notes.favorites', null, 'Favoritas') },
      { id: 'recent',    label: _t('notes.recent', null, 'Recientes') },
      { id: 'lesson',    label: _t('notes.fromLessons', null, 'De lecciones') },
    ];
    $filterNav.innerHTML = items.map(it => `
      <button type="button" class="notes-filter ${it.id === _filter ? 'notes-filter--active' : ''}"
              data-filter="${it.id}">${it.label}</button>
    `).join('');

    $filterNav.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        _filter = btn.dataset.filter;
        _renderFilterNav();
        _renderGrid();
      });
    });
  }

  function _renderGrid() {
    if (!$grid) return;
    const notes = _filteredNotes();

    if (!notes.length) {
      $grid.innerHTML = `
        <div class="empty-state notes-empty">
          <div class="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="12" y2="17"/>
            </svg>
          </div>
          <h3 class="empty-state__title">${_t('notes.emptyTitle', null, 'Aún no tienes notas')}</h3>
          <p class="empty-state__desc">${_t('notes.empty', null, 'Aún no tienes notas. ¡Crea la primera!')}</p>
          <button type="button" class="btn--course empty-state__action" id="notes-empty-create">${_t('notes.newNote', null, 'Nueva nota')}</button>
        </div>`;
      document.getElementById('notes-empty-create')?.addEventListener('click', () => _openEditor());
      return;
    }

    $grid.innerHTML = notes.map(note => `
      <article class="notes-card ${note.pinned ? 'notes-card--pinned' : ''}"
               style="--note-color:${note.color}" data-note-id="${note.id}"
               role="button" tabindex="0" aria-label="${_escape(note.title)}">
        <div class="notes-card__inner">
          <header class="notes-card__head">
            <span class="notes-card__date">${_formatDate(note.updatedAt)}</span>
            <div class="notes-card__actions">
              ${note.pinned ? '<span class="notes-card__pin" aria-hidden="true">★</span>' : ''}
              ${note.favorite ? '<span class="notes-card__star" aria-hidden="true">♥</span>' : ''}
              <button type="button" class="notes-card__edit" data-edit-note="${note.id}" aria-label="Editar">✎</button>
            </div>
          </header>
          <h3 class="notes-card__title">${_escape(note.title)}</h3>
          <p class="notes-card__preview">${_escape(note.preview || note.content)}</p>
          ${(note.tags || []).length ? `<div class="notes-card__tags">${note.tags.map(t => `<span class="notes-tag">${_escape(t)}</span>`).join('')}</div>` : ''}
          <footer class="notes-card__foot">
            <span>🕐 ${_formatTime(note.updatedAt)}</span>
            ${note.source === 'lesson' ? `<a class="notes-card__link" href="tutorial.html?course=${note.courseId}&lesson=${note.lessonId}">${_t('notes.openLesson', null, 'Ver lección')}</a>` : ''}
          </footer>
        </div>
      </article>
    `).join('') + `
      <button type="button" class="notes-card notes-card--new" id="notes-grid-new">
        <span class="notes-card--new__icon">＋</span>
        <span>${_t('notes.newNote', null, 'Nueva nota')}</span>
      </button>`;

    $grid.querySelectorAll('[data-note-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-edit-note]')) return;
        _openEditor(el.dataset.noteId);
      });
    });

    $grid.querySelectorAll('[data-edit-note]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _openEditor(btn.dataset.editNote);
      });
    });

    document.getElementById('notes-grid-new')?.addEventListener('click', () => _openEditor());
  }

  function _openEditor(noteId = null) {
    _editingId = noteId;
    const note = noteId ? NotesService.getNote(noteId) : null;

    if (note?.source === 'lesson') {
      window.location.href = `tutorial.html?course=${note.courseId}&lesson=${note.lessonId}`;
      return;
    }

    if ($editorTitle) $editorTitle.value = note?.title || '';
    if ($editorContent) $editorContent.value = note?.content || '';
    if ($editorTags) $editorTags.value = (note?.tags || []).join(', ');
    if ($editorColor) {
      $editorColor.innerHTML = NotesService.COLORS.map(c =>
        `<button type="button" class="notes-color-swatch ${note?.color === c ? 'is-active' : ''}"
                 data-color="${c}" style="background:${c}" aria-label="Color"></button>`
      ).join('');
      $editorColor.querySelectorAll('[data-color]').forEach(btn => {
        btn.addEventListener('click', () => {
          $editorColor.querySelectorAll('.is-active').forEach(el => el.classList.remove('is-active'));
          btn.classList.add('is-active');
        });
      });
    }

    if ($editorOverlay) {
      $editorOverlay.hidden = false;
      $editorTitle?.focus();
    }
    _publishShareContext(noteId);
  }

  function _closeEditor() {
    if ($editorOverlay) $editorOverlay.hidden = true;
    _editingId = null;
    _publishShareContext();
  }

  function _saveEditor() {
    const colorBtn = $editorColor?.querySelector('.is-active');
    const tags = ($editorTags?.value || '').split(',').map(t => t.trim()).filter(Boolean);
    NotesService.saveNote({
      id:      _editingId || undefined,
      title:   $editorTitle?.value || _t('notes.untitled', null, 'Sin título'),
      content: $editorContent?.value || '',
      tags,
      color:   colorBtn?.dataset.color || NotesService.COLORS[0],
    });
    _closeEditor();
    _renderGrid();
    _renderFolders();
    AppShell.showToast(_t('notes.saved', null, 'Nota guardada'));
  }

  function _deleteEditor() {
    if (!_editingId) return;
    if (!confirm(_t('notes.deleteConfirm', null, '¿Eliminar esta nota?'))) return;
    NotesService.deleteNote(_editingId);
    _closeEditor();
    _renderGrid();
    AppShell.showToast(_t('notes.deleted', null, 'Nota eliminada'));
  }

  function _bindPeriodTabs() {
    document.querySelectorAll('[data-notes-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        _period = btn.dataset.notesPeriod;
        document.querySelectorAll('[data-notes-period]').forEach(b =>
          b.classList.toggle('notes-period--active', b === btn)
        );
        if (_filter === 'recent') _renderGrid();
        _renderFolders();
      });
    });
  }

  function init() {
    $grid = document.getElementById('notes-grid');
    $foldersGrid = document.getElementById('notes-folders-grid');
    $search = document.getElementById('notes-search');
    $filterNav = document.getElementById('notes-filter-nav');
    $editorOverlay = document.getElementById('notes-editor-overlay');
    $editorTitle = document.getElementById('notes-editor-title');
    $editorContent = document.getElementById('notes-editor-content');
    $editorTags = document.getElementById('notes-editor-tags');
    $editorColor = document.getElementById('notes-editor-colors');

    _renderFilterNav();
    _renderFolders();
    _renderGrid();
    _bindPeriodTabs();
    _publishShareContext();

    const params = new URLSearchParams(window.location.search);
    const openNote = params.get('note');
    if (openNote) _openEditor(openNote);

    document.getElementById('notes-new-btn')?.addEventListener('click', () => _openEditor());
    document.getElementById('notes-editor-save')?.addEventListener('click', _saveEditor);
    document.getElementById('notes-editor-delete')?.addEventListener('click', _deleteEditor);
    document.getElementById('notes-editor-cancel')?.addEventListener('click', _closeEditor);
    document.getElementById('notes-btn-share')?.addEventListener('click', () => ShareService?.share());

    $editorOverlay?.addEventListener('click', e => {
      if (e.target === $editorOverlay) _closeEditor();
    });

    $search?.addEventListener('input', () => {
      _query = $search.value.trim();
      _renderGrid();
    });

    window.addEventListener('in4mind-locale-change', () => {
      _renderFilterNav();
      _renderFolders();
      _renderGrid();
    });
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = NotesController;
