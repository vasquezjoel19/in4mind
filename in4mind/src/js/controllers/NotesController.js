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
  let _pendingOp = null;
  let _folderMenuCleanup = null;

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

  async function _renameFolder(folderId) {
    const folder = NotesService.getFolder(folderId);
    const name = typeof UiDialog !== 'undefined'
      ? await UiDialog.prompt({
          title: _t('notes.renameFolder', null, 'Renombrar'),
          message: _t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'),
          value: folder?.name || '',
        })
      : window.prompt(_t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'), folder?.name || '');
    if (!name?.trim()) return;
    NotesService.saveFolder({ id: folderId, name: name.trim(), color: folder?.color });
    _renderAll();
    AppShell.showToast(_t('notes.folderRenamed', null, 'Carpeta renombrada'));
  }

  function _scheduleFolderDelete(folderId) {
    const folder = NotesService.getFolder(folderId);
    if (!folder) return;
    const notes = NotesService.getByFolder(folderId).filter(n => n.source !== 'lesson');
    const result = NotesService.deleteFolder(folderId);
    if (_activeFolderId === folderId) {
      _activeFolderId = null;
      _filter = 'all';
      _syncFolderUrl();
    }
    _renderAll();
    _pendingOp = { type: 'folder' };
    if (typeof AppShell.showUndoToast === 'function') {
      AppShell.showUndoToast(_t('notes.folderDeletedUndo', null, 'Carpeta eliminada'), {
        duration: 8000,
        onUndo: () => {
          NotesService.restoreFolder(folder, notes);
          _pendingOp = null;
          _renderAll();
        },
        onCommit: () => {
          _pendingOp = null;
          NotesService.flushCloud?.();
        },
      });
    } else {
      NotesService.flushCloud?.();
    }
    return result;
  }

  function _scheduleNoteDelete(noteId) {
    const snapshot = NotesService.getNote(noteId);
    if (!snapshot) return;
    NotesService.deleteNote(noteId);
    _renderAll();
    if (typeof AppShell.showUndoToast === 'function') {
      AppShell.showUndoToast(_t('notes.deletedUndo', null, 'Nota eliminada'), {
        duration: 8000,
        onUndo: () => {
          NotesService.restoreNote(snapshot);
          _renderAll();
        },
        onCommit: () => NotesService.flushCloud?.(),
      });
    } else {
      NotesService.flushCloud?.();
    }
  }

  async function _confirmDeleteFolder(folderId) {
    const ok = typeof UiDialog !== 'undefined'
      ? await UiDialog.confirm({
          title: _t('common.delete', null, 'Eliminar'),
          message: _t('notes.deleteFolderConfirm', null, '¿Eliminar esta carpeta y todas las notas que contiene? Las notas fuera de la carpeta no se borran.'),
          danger: true,
        })
      : window.confirm(_t('notes.deleteFolderConfirm', null, '¿Eliminar esta carpeta?'));
    if (!ok) return;
    _scheduleFolderDelete(folderId);
  }

  function _openFolderMenu(btn, folderId) {
    _closeFolderMenus();
    const menu = document.createElement('div');
    menu.className = 'notes-folder-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('tabindex', '-1');
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
    btn.setAttribute('aria-expanded', 'true');

    const items = [...menu.querySelectorAll('[role="menuitem"]')];
    items[0]?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        _closeFolderMenus();
        btn.focus();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const i = items.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown'
          ? items[(i + 1) % items.length]
          : items[(i - 1 + items.length) % items.length];
        next?.focus();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const i = Math.max(0, items.indexOf(document.activeElement));
        const next = e.shiftKey
          ? items[(i - 1 + items.length) % items.length]
          : items[(i + 1) % items.length];
        next?.focus();
      }
      if (e.key === 'Home') {
        e.preventDefault();
        items[0]?.focus();
      }
      if (e.key === 'End') {
        e.preventDefault();
        items[items.length - 1]?.focus();
      }
    };

    const onDoc = (e) => {
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      _closeFolderMenus();
    };

    menu.addEventListener('keydown', onKey);
    document.addEventListener('click', onDoc, true);
    _folderMenuCleanup = () => {
      menu.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onDoc, true);
      btn.setAttribute('aria-expanded', 'false');
    };

    menu.querySelector('[data-folder-action="rename"]')?.addEventListener('click', () => {
      _closeFolderMenus();
      void _renameFolder(folderId);
    });

    menu.querySelector('[data-folder-action="delete"]')?.addEventListener('click', () => {
      _closeFolderMenus();
      void _confirmDeleteFolder(folderId);
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
      void _confirmDeleteFolder(folder.id);
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
                    aria-haspopup="menu" aria-expanded="false"
                    aria-label="${_escape(_t('notes.folderOptions', null, 'Opciones de carpeta'))}">⋯</button>
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
        e.preventDefault();
        el.classList.add('is-drop-target');
      });
      el.addEventListener('dragleave', () => el.classList.remove('is-drop-target'));
      el.addEventListener('drop', e => {
        e.preventDefault();
        el.classList.remove('is-drop-target');
        const noteId = e.dataTransfer.getData('text/in4mind-note') || e.dataTransfer.getData('text/plain');
        if (!noteId) return;
        NotesService.moveToFolder(noteId, el.dataset.folderId);
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
      const name = typeof UiDialog !== 'undefined'
        ? await UiDialog.prompt({
            title: _t('notes.newFolder', null, 'Nueva carpeta'),
            message: _t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'),
          })
        : window.prompt(_t('notes.folderNamePrompt', null, 'Nombre de la carpeta:'));
      if (!name?.trim()) return;
      const folder = NotesService.saveFolder({ name: name.trim() });
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
      const folders = NotesService.getFolders();
      const moveSelect = note.source === 'lesson' ? '' : `
            <label class="notes-card__move">
              <span class="visually-hidden">${_escape(_t('notes.moveToFolder', null, 'Mover a carpeta'))}</span>
              <select data-move-note="${note.id}" onclick="event.stopPropagation()">
                <option value="">${_escape(_t('notes.noFolder', null, '— Sin carpeta —'))}</option>
                ${folders.map(f => `<option value="${_escape(f.id)}" ${note.folderId === f.id ? 'selected' : ''}>${_escape(f.name)}</option>`).join('')}
              </select>
            </label>`;
      return `
      <article class="notes-card ${note.pinned ? 'notes-card--pinned' : ''}"
               style="--note-color:${note.color}" data-note-id="${note.id}"
               role="button" tabindex="0" aria-label="${_escape(note.title)}"
               ${note.source !== 'lesson' ? 'draggable="true"' : ''}>
        <div class="notes-card__inner">
          <header class="notes-card__head">
            <span class="notes-card__date">${_formatDate(note.updatedAt)}</span>
            <div class="notes-card__actions">
              ${note.pinned ? '<span class="notes-card__pin" aria-hidden="true">★</span>' : ''}
              ${note.favorite ? '<span class="notes-card__star" aria-hidden="true">♥</span>' : ''}
              <button type="button" class="notes-card__edit" data-edit-note="${note.id}" aria-label="${_escape(_t('common.edit', null, 'Editar'))}">✎</button>
              ${note.source !== 'lesson' ? `<button type="button" class="notes-card__delete" data-delete-note="${note.id}" aria-label="${_escape(_t('common.delete', null, 'Eliminar'))}">🗑</button>` : ''}
            </div>
          </header>
          <h3 class="notes-card__title">${_escape(note.title)}</h3>
          <p class="notes-card__preview">${_escape(note.preview || note.content)}</p>
          ${(note.tags || []).length ? `<div class="notes-card__tags">${note.tags.map(t => `<span class="notes-tag">${_escape(t)}</span>`).join('')}</div>` : ''}
          ${moveSelect}
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
          e.dataTransfer.setData('text/in4mind-note', el.dataset.noteId);
          e.dataTransfer.setData('text/plain', el.dataset.noteId);
          e.dataTransfer.effectAllowed = 'move';
          el.classList.add('is-dragging');
        });
        el.addEventListener('dragend', () => el.classList.remove('is-dragging'));
      }
    });

    $grid.querySelectorAll('[data-edit-note]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        _openEditor(btn.dataset.editNote);
      });
    });

    $grid.querySelectorAll('[data-delete-note]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const ok = typeof UiDialog !== 'undefined'
          ? await UiDialog.confirm({
              title: _t('common.delete', null, 'Eliminar'),
              message: _t('notes.deleteConfirm', null, '¿Eliminar esta nota?'),
              danger: true,
            })
          : window.confirm(_t('notes.deleteConfirm', null, '¿Eliminar esta nota?'));
        if (!ok) return;
        _scheduleNoteDelete(btn.dataset.deleteNote);
      });
    });

    $grid.querySelectorAll('[data-move-note]').forEach(sel => {
      sel.addEventListener('change', (e) => {
        e.stopPropagation();
        NotesService.moveToFolder(sel.dataset.moveNote, sel.value || null);
        _renderAll();
        AppShell.showToast(_t('notes.moved', null, 'Nota movida'));
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
    const ok = typeof UiDialog !== 'undefined'
      ? await UiDialog.confirm({
          title: _t('common.delete', null, 'Eliminar'),
          message: _t('notes.deleteConfirm', null, '¿Eliminar esta nota?'),
          danger: true,
        })
      : window.confirm(_t('notes.deleteConfirm', null, '¿Eliminar esta nota?'));
    if (!ok) return;
    const id = _editingId;
    _closeEditor();
    _scheduleNoteDelete(id);
  }

  function _renderAll() {
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
