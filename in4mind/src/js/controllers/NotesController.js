/**
 * IN4MIND — NotesController
 * Hub de notas con carpetas navegables, tarjetas y editor modal.
 */

'use strict';

const NotesController = (() => {

  let _filter = 'all';
  let _period = 'week';
  let _query = '';
  let _editingId = null;
  let _activeFolderId = null;
  let _folderMenuCleanup = null;
  let _moveMenuCleanup = null;

  let $grid, $foldersGrid, $foldersSection, $search, $filterNav, $editorOverlay;
  let $editorTitle, $editorContent, $editorTags, $editorColor, $editorFolder;
  let $folderBanner;

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

  function _activeFolder() {
    return _activeFolderId && typeof NotesService !== 'undefined'
      ? NotesService.getFolder(_activeFolderId)
      : null;
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
      params: noteId ? { note: noteId } : (_activeFolderId ? { folder: _activeFolderId } : {}),
      title: _t('notes.pageTitle', null, 'Mis Notas — IN4MIND'),
    });
  }

  function _enterFolder(folderId) {
    if (!folderId || !NotesService.getFolder(folderId)) return;
    _activeFolderId = folderId;
    _filter = `folder:${folderId}`;
    _syncFolderUrl();
    _renderAll();
  }

  function _exitFolder() {
    _activeFolderId = null;
    if (_filter.startsWith('folder:')) _filter = 'all';
    _syncFolderUrl();
    _renderAll();
  }

  function _syncFolderUrl() {
    try {
      const url = new URL(window.location.href);
      if (_activeFolderId) url.searchParams.set('folder', _activeFolderId);
      else url.searchParams.delete('folder');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    } catch { /* ignore */ }
  }

  function _closeFolderMenus() {
    document.querySelectorAll('.notes-folder-menu').forEach(el => el.remove());
    if (_folderMenuCleanup) {
      _folderMenuCleanup();
      _folderMenuCleanup = null;
    }
  }

  function _closeMoveMenus() {
    document.querySelectorAll('.notes-move-menu').forEach(el => el.remove());
    if (_moveMenuCleanup) {
      _moveMenuCleanup();
      _moveMenuCleanup = null;
    }
  }

  function _bindMenuA11y(menu, { onClose, trigger } = {}) {
    const items = () => Array.from(menu.querySelectorAll('[role="menuitem"]:not([disabled])'));
    const focusItem = (idx) => {
      const list = items();
      if (!list.length) return;
      const i = ((idx % list.length) + list.length) % list.length;
      list[i].focus();
    };

    const onKey = (e) => {
      if (!document.body.contains(menu)) return;
      const list = items();
      const current = list.indexOf(document.activeElement);

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
        trigger?.focus();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusItem(current < 0 ? 0 : current + 1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusItem(current < 0 ? list.length - 1 : current - 1);
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        focusItem(0);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        focusItem(list.length - 1);
        return;
      }
      if (e.key === 'Tab') {
        if (!list.length) return;
        e.preventDefault();
        if (e.shiftKey) focusItem(current <= 0 ? list.length - 1 : current - 1);
        else focusItem(current < 0 || current >= list.length - 1 ? 0 : current + 1);
      }
    };

    const onDoc = (e) => {
      if (menu.contains(e.target) || trigger?.contains?.(e.target)) return;
      onClose?.();
    };

    document.addEventListener('keydown', onKey, true);
    setTimeout(() => document.addEventListener('click', onDoc, true), 0);

    const cleanup = () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onDoc, true);
    };

    setTimeout(() => focusItem(0), 0);
    return cleanup;
  }

  async function _renameFolder(folderId) {
    const folder = NotesService.getFolder(folderId);
    const name = await _promptDialog({
      title: _t('notes.renameFolder', null, 'Renombrar'),
      message: _t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'),
      value: folder?.name || '',
    });
    if (name == null || !String(name).trim()) return;
    NotesService.saveFolder({ id: folderId, name: String(name).trim(), color: folder?.color });
    if (_activeFolderId === folderId) _renderFolderBanner();
    _renderFolders();
    AppShell.showToast(_t('notes.folderRenamed', null, 'Carpeta renombrada'));
  }

  async function _deleteFolderWithUndo(folderId) {
    const ok = await _confirmDialog({
      title: _t('common.delete', null, 'Eliminar'),
      message: _t(
        'notes.deleteFolderConfirm',
        null,
        '¿Eliminar esta carpeta y todas las notas que contiene? Las notas fuera de la carpeta no se borran. Tendrás unos segundos para deshacer.'
      ),
      danger: true,
    });
    if (!ok) return;

    const result = NotesService.deleteFolder(folderId);
    if (!result?.ok) return;

    if (_activeFolderId === folderId) _exitFolder();
    else _renderAll();

    const snapshot = result.snapshot;
    AppShell.showToast(
      _t('notes.folderDeleted', null, 'Carpeta y sus notas eliminadas'),
      8000,
      {
        onUndo: () => {
          NotesService.restoreFolderSnapshot(snapshot);
          _renderAll();
        },
      }
    );
  }

  async function _deleteNoteWithUndo(noteId) {
    const ok = await _confirmDialog({
      title: _t('common.delete', null, 'Eliminar'),
      message: _t('notes.deleteConfirm', null, '¿Eliminar esta nota?'),
      danger: true,
    });
    if (!ok) return;

    const result = NotesService.deleteNote(noteId);
    if (_editingId === noteId) _closeEditor();
    _renderAll();

    const snapshot = result && typeof result === 'object' ? result.snapshot : null;
    AppShell.showToast(
      _t('notes.deleted', null, 'Nota eliminada'),
      8000,
      snapshot
        ? {
            onUndo: () => {
              NotesService.restoreNote(snapshot);
              _renderAll();
            },
          }
        : {}
    );
  }

  function _openFolderMenu(btn, folderId) {
    _closeFolderMenus();
    _closeMoveMenus();
    const menu = document.createElement('div');
    menu.className = 'notes-folder-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', _t('notes.folderOptions', null, 'Opciones de carpeta'));
    menu.innerHTML = `
      <button type="button" class="notes-folder-menu__item" data-folder-action="rename" role="menuitem">
        ${_escape(_t('notes.renameFolder', null, 'Renombrar'))}
      </button>
      <button type="button" class="notes-folder-menu__item notes-folder-menu__item--danger" data-folder-action="delete" role="menuitem">
        ${_escape(_t('common.delete', null, 'Eliminar'))}
      </button>`;

    const rect = btn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 180)}px`;
    document.body.appendChild(menu);

    menu.querySelector('[data-folder-action="rename"]')?.addEventListener('click', () => {
      _closeFolderMenus();
      void _renameFolder(folderId);
    });

    menu.querySelector('[data-folder-action="delete"]')?.addEventListener('click', () => {
      _closeFolderMenus();
      void _deleteFolderWithUndo(folderId);
    });

    _folderMenuCleanup = _bindMenuA11y(menu, {
      onClose: _closeFolderMenus,
      trigger: btn,
    });
  }

  function _openMoveMenu(btn, noteId) {
    _closeMoveMenus();
    _closeFolderMenus();
    const note = NotesService.getNote(noteId);
    if (!note || note.source === 'lesson') return;

    const folders = NotesService.getFolders();
    const menu = document.createElement('div');
    menu.className = 'notes-folder-menu notes-move-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', _t('notes.moveToFolder', null, 'Mover a carpeta'));

    const folderItems = folders.map(f => `
      <button type="button" class="notes-folder-menu__item" role="menuitem"
              data-move-folder="${_escape(f.id)}"
              ${note.folderId === f.id ? 'aria-current="true"' : ''}>
        ${_escape(f.name)}
      </button>`).join('');

    menu.innerHTML = `
      <button type="button" class="notes-folder-menu__item" role="menuitem" data-move-folder=""
              ${!note.folderId ? 'aria-current="true"' : ''}>
        ${_escape(_t('notes.noFolderShort', null, 'Sin carpeta'))}
      </button>
      ${folderItems}`;

    const rect = btn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.left = `${Math.min(rect.left, window.innerWidth - 200)}px`;
    document.body.appendChild(menu);

    menu.querySelectorAll('[data-move-folder]').forEach(item => {
      item.addEventListener('click', () => {
        const folderId = item.getAttribute('data-move-folder') || null;
        _closeMoveMenus();
        NotesService.moveNoteToFolder(noteId, folderId || null);
        _renderAll();
        AppShell.showToast(_t('notes.moved', null, 'Nota movida'));
      });
    });

    _moveMenuCleanup = _bindMenuA11y(menu, {
      onClose: _closeMoveMenus,
      trigger: btn,
    });
  }

  function _renderFolderBanner() {
    if (!$folderBanner) return;
    const folder = _activeFolder();
    if (!folder) {
      $folderBanner.hidden = true;
      $folderBanner.innerHTML = '';
      if ($foldersSection) $foldersSection.hidden = false;
      return;
    }

    if ($foldersSection) $foldersSection.hidden = true;
    const count = NotesService.getByFolder(folder.id).length;
    $folderBanner.hidden = false;
    $folderBanner.innerHTML = `
      <button type="button" class="btn--back notes-folder-banner__back" id="notes-folder-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        ${_escape(_t('notes.backToNotes', null, 'Todas las notas'))}
      </button>
      <div class="notes-folder-banner__card" style="--folder-color:${folder.color}">
        <span class="notes-folder-banner__icon" aria-hidden="true">📁</span>
        <div class="notes-folder-banner__copy">
          <h2 class="notes-folder-banner__title">${_escape(folder.name)}</h2>
          <p class="notes-folder-banner__meta">${_escape(_t('notes.notesCount', { n: count }, '{n} notas'))} · ${_formatDate(folder.updatedAt)}</p>
        </div>
        <div class="notes-folder-banner__actions">
          <button type="button" class="btn--course" id="notes-folder-new">${_escape(_t('notes.newNoteInFolder', null, 'Nueva nota aquí'))}</button>
          <button type="button" class="btn--danger-outline" id="notes-folder-delete">${_escape(_t('common.delete', null, 'Eliminar'))}</button>
        </div>
      </div>`;

    document.getElementById('notes-folder-back')?.addEventListener('click', _exitFolder);
    document.getElementById('notes-folder-new')?.addEventListener('click', () => _openEditor(null, { folderId: folder.id }));
    document.getElementById('notes-folder-delete')?.addEventListener('click', () => {
      void _deleteFolderWithUndo(folder.id);
    });
  }

  function _renderFolders() {
    if (!$foldersGrid) return;
    if (_activeFolderId) {
      $foldersGrid.innerHTML = '';
      return;
    }

    const folders = NotesService.getFolders();
    const cards = folders.map(f => {
      const count = NotesService.getByFolder(f.id).length;
      return `
        <article class="notes-folder-card" style="--folder-color:${f.color}"
                 data-folder-id="${f.id}" role="button" tabindex="0"
                 aria-label="${_escape(f.name)}">
          <div class="notes-folder-card__top">
            <span class="notes-folder-card__icon" aria-hidden="true">📁</span>
            <button type="button" class="notes-folder-card__menu" data-folder-menu="${f.id}"
                    aria-label="${_escape(_t('notes.folderOptions', null, 'Opciones de carpeta'))}"
                    aria-haspopup="menu">⋯</button>
          </div>
          <h3 class="notes-folder-card__title">${_escape(f.name)}</h3>
          <p class="notes-folder-card__meta">${_formatDate(f.updatedAt)} · ${_escape(_t('notes.notesCount', { n: count }, '{n} notas'))}</p>
        </article>`;
    }).join('');

    $foldersGrid.innerHTML = `
      ${cards}
      <button type="button" class="notes-folder-card notes-folder-card--new" id="notes-new-folder">
        <span class="notes-folder-card__icon" aria-hidden="true">＋</span>
        <span>${_escape(_t('notes.newFolder', null, 'Nueva carpeta'))}</span>
      </button>`;

    $foldersGrid.querySelectorAll('[data-folder-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-folder-menu]')) return;
        _enterFolder(el.dataset.folderId);
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          _enterFolder(el.dataset.folderId);
        }
      });

      el.addEventListener('dragover', e => {
        if (!e.dataTransfer?.types?.includes('application/x-in4mind-note')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        el.classList.add('notes-folder-card--drop');
      });
      el.addEventListener('dragleave', e => {
        if (!el.contains(e.relatedTarget)) el.classList.remove('notes-folder-card--drop');
      });
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('notes-folder-card--drop');
        const noteId = e.dataTransfer.getData('application/x-in4mind-note')
          || e.dataTransfer.getData('text/plain');
        if (!noteId) return;
        NotesService.moveNoteToFolder(noteId, el.dataset.folderId);
        _renderAll();
        AppShell.showToast(_t('notes.moved', null, 'Nota movida'));
      });
    });

    $foldersGrid.querySelectorAll('[data-folder-menu]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _openFolderMenu(btn, btn.dataset.folderMenu);
      });
    });

    document.getElementById('notes-new-folder')?.addEventListener('click', async () => {
      const name = await _promptDialog({
        title: _t('notes.newFolder', null, 'Nueva carpeta'),
        message: _t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'),
      });
      if (name == null || !String(name).trim()) return;
      const folder = NotesService.saveFolder({ name: String(name).trim() });
      _renderFolders();
      if (folder?.id) _enterFolder(folder.id);
    });
  }

  function _renderFilterNav() {
    if (!$filterNav) return;
    if (_activeFolderId) {
      $filterNav.innerHTML = '';
      return;
    }

    const items = [
      { id: 'all',       label: _t('notes.allNotes', null, 'Todas') },
      { id: 'favorites', label: _t('notes.favorites', null, 'Favoritas') },
      { id: 'recent',    label: _t('notes.recent', null, 'Recientes') },
      { id: 'lesson',    label: _t('notes.fromLessons', null, 'De lecciones') },
    ];
    $filterNav.innerHTML = items.map(it => `
      <button type="button" class="notes-filter ${it.id === _filter ? 'notes-filter--active' : ''}"
              data-filter="${it.id}">${_escape(it.label)}</button>
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
    const folder = _activeFolder();

    if (!notes.length) {
      $grid.innerHTML = `
        <div class="empty-state empty-state--hero notes-empty">
          <div class="empty-state__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="12" y2="17"/>
            </svg>
          </div>
          <h3 class="empty-state__title">${_escape(folder
            ? _t('notes.emptyFolderTitle', null, 'Esta carpeta está vacía')
            : _t('notes.emptyTitle', null, 'Aún no tienes notas'))}</h3>
          <p class="empty-state__desc">${_escape(folder
            ? _t('notes.emptyFolder', null, 'Crea una nota dentro de esta carpeta.')
            : _t('notes.empty', null, 'Aún no tienes notas. ¡Crea la primera!'))}</p>
          <button type="button" class="btn--course btn--lg empty-state__action" id="notes-empty-create">${_escape(_t('notes.newNote', null, 'Nueva nota'))}</button>
        </div>`;
      document.getElementById('notes-empty-create')?.addEventListener('click', () =>
        _openEditor(null, { folderId: _activeFolderId || undefined })
      );
      return;
    }

    $grid.innerHTML = notes.map(note => {
      const canMove = note.source !== 'lesson';
      return `
      <article class="notes-card ${note.pinned ? 'notes-card--pinned' : ''}"
               style="--note-color:${note.color}" data-note-id="${note.id}"
               role="button" tabindex="0" aria-label="${_escape(note.title)}"
               ${canMove ? 'draggable="true"' : ''}>
        <div class="notes-card__inner">
          <header class="notes-card__head">
            <span class="notes-card__date">${_formatDate(note.updatedAt)}</span>
            <div class="notes-card__actions">
              ${note.pinned ? '<span class="notes-card__pin" aria-hidden="true">★</span>' : ''}
              ${note.favorite ? '<span class="notes-card__star" aria-hidden="true">♥</span>' : ''}
              ${canMove ? `<button type="button" class="notes-card__move" data-move-note="${note.id}" aria-label="${_escape(_t('notes.moveToFolder', null, 'Mover'))}" aria-haspopup="menu">${_escape(_t('notes.moveShort', null, 'Mover'))}</button>` : ''}
              <button type="button" class="notes-card__edit" data-edit-note="${note.id}" aria-label="${_escape(_t('common.edit', null, 'Editar'))}">✎</button>
              ${canMove ? `<button type="button" class="notes-card__delete" data-delete-note="${note.id}" aria-label="${_escape(_t('common.delete', null, 'Eliminar'))}">🗑</button>` : ''}
            </div>
          </header>
          <h3 class="notes-card__title">${_escape(note.title)}</h3>
          <p class="notes-card__preview">${_escape(note.preview || note.content)}</p>
          ${(note.tags || []).length ? `<div class="notes-card__tags">${note.tags.map(t => `<span class="notes-tag">${_escape(t)}</span>`).join('')}</div>` : ''}
          <footer class="notes-card__foot">
            <span>🕐 ${_formatTime(note.updatedAt)}</span>
            ${note.source === 'lesson' ? `<a class="notes-card__link" href="tutorial.html?course=${note.courseId}&lesson=${note.lessonId}">${_escape(_t('notes.openLesson', null, 'Ver lección'))}</a>` : ''}
          </footer>
        </div>
      </article>`;
    }).join('') + `
      <button type="button" class="notes-card notes-card--new" id="notes-grid-new">
        <span class="notes-card--new__icon" aria-hidden="true">＋</span>
        <span>${_escape(_t('notes.newNote', null, 'Nueva nota'))}</span>
      </button>`;

    $grid.querySelectorAll('[data-note-id]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('[data-edit-note], [data-delete-note], [data-move-note], .notes-card__link')) return;
        _openEditor(el.dataset.noteId);
      });

      if (el.getAttribute('draggable') === 'true') {
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('application/x-in4mind-note', el.dataset.noteId);
          e.dataTransfer.setData('text/plain', el.dataset.noteId);
          e.dataTransfer.effectAllowed = 'move';
          el.classList.add('notes-card--dragging');
        });
        el.addEventListener('dragend', () => {
          el.classList.remove('notes-card--dragging');
          document.querySelectorAll('.notes-folder-card--drop').forEach(c =>
            c.classList.remove('notes-folder-card--drop')
          );
        });
      }
    });

    $grid.querySelectorAll('[data-edit-note]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _openEditor(btn.dataset.editNote);
      });
    });

    $grid.querySelectorAll('[data-move-note]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _openMoveMenu(btn, btn.dataset.moveNote);
      });
    });

    $grid.querySelectorAll('[data-delete-note]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        void _deleteNoteWithUndo(btn.dataset.deleteNote);
      });
    });

    document.getElementById('notes-grid-new')?.addEventListener('click', () =>
      _openEditor(null, { folderId: _activeFolderId || undefined })
    );
  }

  function _fillFolderSelect(selectedId) {
    if (!$editorFolder) return;
    const folders = NotesService.getFolders();
    $editorFolder.innerHTML = `
      <option value="">${_escape(_t('notes.noFolder', null, '— Sin carpeta —'))}</option>
      ${folders.map(f => `
        <option value="${_escape(f.id)}" ${selectedId === f.id ? 'selected' : ''}>${_escape(f.name)}</option>
      `).join('')}`;
  }

  function _openEditor(noteId = null, opts = {}) {
    _editingId = noteId;
    const note = noteId ? NotesService.getNote(noteId) : null;

    if (note?.source === 'lesson') {
      window.location.href = `tutorial.html?course=${note.courseId}&lesson=${note.lessonId}`;
      return;
    }

    if ($editorTitle) $editorTitle.value = note?.title || '';
    if ($editorContent) $editorContent.value = note?.content || '';
    if ($editorTags) $editorTags.value = (note?.tags || []).join(', ');
    _fillFolderSelect(note?.folderId || opts.folderId || _activeFolderId || '');

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

    const deleteBtn = document.getElementById('notes-editor-delete');
    if (deleteBtn) deleteBtn.hidden = !noteId;

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
    const folderId = $editorFolder?.value || null;
    NotesService.saveNote({
      id:       _editingId || undefined,
      title:    $editorTitle?.value || _t('notes.untitled', null, 'Sin título'),
      content:  $editorContent?.value || '',
      tags,
      color:    colorBtn?.dataset.color || NotesService.COLORS[0],
      folderId: folderId || null,
    });
    _closeEditor();
    _renderAll();
    AppShell.showToast(_t('notes.saved', null, 'Nota guardada'));
  }

  async function _deleteEditor() {
    if (!_editingId) return;
    await _deleteNoteWithUndo(_editingId);
  }

  function _renderAll() {
    _closeFolderMenus();
    _closeMoveMenus();
    _renderFolderBanner();
    _renderFolders();
    _renderFilterNav();
    _renderGrid();
    _publishShareContext();
  }

  function _bindPeriodTabs() {
    document.querySelectorAll('[data-notes-period]').forEach(btn => {
      btn.addEventListener('click', () => {
        _period = btn.dataset.notesPeriod;
        document.querySelectorAll('[data-notes-period]').forEach(b =>
          b.classList.toggle('notes-period--active', b === btn)
        );
        if (_filter === 'recent') _renderGrid();
        if (!_activeFolderId) _renderFolders();
      });
    });
  }

  function init() {
    $grid = document.getElementById('notes-grid');
    $foldersGrid = document.getElementById('notes-folders-grid');
    $foldersSection = document.getElementById('notes-folders-section');
    $folderBanner = document.getElementById('notes-folder-banner');
    $search = document.getElementById('notes-search');
    $filterNav = document.getElementById('notes-filter-nav');
    $editorOverlay = document.getElementById('notes-editor-overlay');
    $editorTitle = document.getElementById('notes-editor-title');
    $editorContent = document.getElementById('notes-editor-content');
    $editorTags = document.getElementById('notes-editor-tags');
    $editorColor = document.getElementById('notes-editor-colors');
    $editorFolder = document.getElementById('notes-editor-folder');

    _bindPeriodTabs();

    const params = new URLSearchParams(window.location.search);
    const openFolder = params.get('folder');
    const openNote = params.get('note');
    if (openFolder && NotesService.getFolder(openFolder)) {
      _activeFolderId = openFolder;
      _filter = `folder:${openFolder}`;
    }

    _renderAll();
    if (openNote) _openEditor(openNote);

    document.getElementById('notes-new-btn')?.addEventListener('click', () =>
      _openEditor(null, { folderId: _activeFolderId || undefined })
    );
    document.getElementById('notes-editor-save')?.addEventListener('click', _saveEditor);
    document.getElementById('notes-editor-delete')?.addEventListener('click', () => { void _deleteEditor(); });
    document.getElementById('notes-editor-cancel')?.addEventListener('click', _closeEditor);
    document.getElementById('notes-btn-share')?.addEventListener('click', () => ShareService?.share());

    $editorOverlay?.addEventListener('click', e => {
      if (e.target === $editorOverlay) _closeEditor();
    });

    $search?.addEventListener('input', () => {
      _query = $search.value.trim();
      _renderGrid();
    });

    window.addEventListener('in4mind-locale-change', _renderAll);
    window.addEventListener('in4mind-relocalize', _renderAll);
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = NotesController;
