'use strict';

const DataExportService = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  async function collectUserData() {
    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;

    const [favorites, saved, visits, quizProgress, certifications] = await Promise.all([
      UserProfileService?.getFavorites?.() ?? [],
      UserProfileService?.getSaved?.() ?? [],
      UserProfileService?.getRecentVisits?.(50) ?? [],
      UserProfileService?.getQuizProgress?.() ?? {},
      UserProfileService?.getCertifications?.() ?? [],
    ]);

    let gamification = {};
    let activity = [];
    let aiGuest = [];
    try { gamification = JSON.parse(localStorage.getItem('in4mind_gamification') || '{}'); } catch { /* */ }
    try { activity = JSON.parse(localStorage.getItem('in4mind_activity_log') || '[]'); } catch { /* */ }
    try { aiGuest = JSON.parse(localStorage.getItem('in4mind_ai_guest_history') || '[]'); } catch { /* */ }

    return {
      exportedAt: new Date().toISOString(),
      platform: 'IN4MIND',
      version: 2,
      user,
      favorites,
      saved,
      visits,
      quizProgress,
      certifications,
      gamification,
      activity,
      aiGuestHistory: aiGuest,
      locale: typeof I18n !== 'undefined' ? I18n.getLocale() : 'es',
      theme: localStorage.getItem('in4mind_theme'),
      notes: typeof NotesService !== 'undefined' ? {
        notes: NotesService.getAllNotes().filter(n => n.source !== 'lesson'),
        folders: NotesService.getFolders(),
      } : null,
      projects: typeof ProjectsService !== 'undefined' ? ProjectsService.getAll() : null,
      guided: typeof GuidedProjectsService !== 'undefined' ? GuidedProjectsService.getAllProgress() : null,
      quizAttempts: typeof QuizProgressService !== 'undefined' ? QuizProgressService.getAll() : null,
      errorLog: typeof ErrorReporter !== 'undefined' ? ErrorReporter.getLog() : [],
    };
  }

  async function downloadJson() {
    const data = await collectUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `in4mind-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true };
  }

  function _userSuffix() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const email = raw ? (JSON.parse(raw).email || '') : '';
      return (email || 'guest').toLowerCase();
    } catch {
      return 'guest';
    }
  }

  /**
   * Restaura un export JSON (local-first). No borra datos no incluidos.
   * @param {object|string} raw
   */
  async function importJson(raw) {
    let data = raw;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch {
        return { ok: false, error: 'invalid_json' };
      }
    }
    if (!data || data.platform !== 'IN4MIND') {
      return { ok: false, error: 'invalid_export' };
    }

    const suffix = _userSuffix();
    try {
      if (data.theme) localStorage.setItem('in4mind_theme', data.theme);
      if (data.locale && typeof I18n !== 'undefined' && I18n.setLocale) {
        try { I18n.setLocale(data.locale); } catch { /* */ }
      }
      if (data.gamification) localStorage.setItem('in4mind_gamification', JSON.stringify(data.gamification));
      if (data.activity) localStorage.setItem('in4mind_activity_log', JSON.stringify(data.activity));
      if (data.aiGuestHistory) localStorage.setItem('in4mind_ai_guest_history', JSON.stringify(data.aiGuestHistory));

      if (data.quizProgress) {
        localStorage.setItem(`in4mind_quiz_results_${suffix}`, JSON.stringify(data.quizProgress));
      }
      if (data.quizAttempts) {
        localStorage.setItem(`in4mind_quiz_state:${suffix}`, JSON.stringify(data.quizAttempts));
      }
      if (data.guided) {
        localStorage.setItem(`in4mind_guided_projects:${suffix}`, JSON.stringify(data.guided));
      }
      if (data.projects) {
        const map = {};
        (Array.isArray(data.projects) ? data.projects : Object.values(data.projects || {})).forEach(p => {
          if (p?.id) map[p.id] = p;
        });
        localStorage.setItem(`in4mind_projects:${suffix}`, JSON.stringify(map));
      }
      if (data.notes) {
        const notesArr = Array.isArray(data.notes.notes) ? data.notes.notes : Object.values(data.notes.notes || {});
        const noteMap = {};
        notesArr.forEach(n => { if (n?.id) noteMap[n.id] = n; });
        localStorage.setItem(`in4mind_user_notes:${suffix}`, JSON.stringify(noteMap));
        const foldersArr = Array.isArray(data.notes.folders) ? data.notes.folders : Object.values(data.notes.folders || {});
        const folderMap = {};
        foldersArr.forEach(f => { if (f?.id) folderMap[f.id] = f; });
        localStorage.setItem(`in4mind_note_folders:${suffix}`, JSON.stringify(folderMap));
      }

      // Empuja blobs a la nube si hay sesión
      if (typeof CloudBlobSync !== 'undefined') {
        void CloudBlobSync.pushBlob('notes', {
          notes: JSON.parse(localStorage.getItem(`in4mind_user_notes:${suffix}`) || '{}'),
          folders: JSON.parse(localStorage.getItem(`in4mind_note_folders:${suffix}`) || '{}'),
        });
        void CloudBlobSync.pushBlob('projects', JSON.parse(localStorage.getItem(`in4mind_projects:${suffix}`) || '{}'));
        void CloudBlobSync.pushBlob('quizAttempts', JSON.parse(localStorage.getItem(`in4mind_quiz_state:${suffix}`) || '{}'));
        void CloudBlobSync.pushBlob('guided', JSON.parse(localStorage.getItem(`in4mind_guided_projects:${suffix}`) || '{}'));
      }

      window.dispatchEvent(new CustomEvent('in4mind-profile-updated'));
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(
          typeof I18n !== 'undefined' && I18n.t('privacy.importOk') !== 'privacy.importOk'
            ? I18n.t('privacy.importOk')
            : 'Datos restaurados en este dispositivo.',
          3200
        );
      }
      return { ok: true };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('import_fail', { message: err?.message || String(err) });
      }
      return { ok: false, error: err?.message || 'import_failed' };
    }
  }

  async function importFromFile(file) {
    if (!file) return { ok: false, error: 'no_file' };
    const text = await file.text();
    return importJson(text);
  }

  async function deleteAllLocalData() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('in4mind_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    return { ok: true };
  }

  async function deleteAccount() {
    if (!confirm(_t('privacy.deleteConfirm', null, '¿Eliminar todos tus datos locales y cerrar sesión? Esta acción no se puede deshacer.'))) {
      return { ok: false, cancelled: true };
    }

    if (typeof AuthService !== 'undefined') await AuthService.logout();
    else if (typeof AppShell !== 'undefined') AppShell.logout();
    await deleteAllLocalData();

    if (typeof _sbClient !== 'undefined') {
      try {
        const { data } = await _sbClient.auth.getUser();
        if (data?.user) {
          await _sbClient.from('ai_chat_history').delete().eq('user_id', data.user.id);
        }
      } catch { /* ignore */ }
    }

    window.location.href = 'index.html';
    return { ok: true };
  }

  function clearAiHistory() {
    localStorage.removeItem('in4mind_ai_guest_history');
    if (typeof _sbClient !== 'undefined') {
      _sbClient.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          _sbClient.from('ai_chat_history').delete().eq('user_id', data.user.id);
        }
      }).catch(() => {});
    }
    return { ok: true };
  }

  return { collectUserData, downloadJson, importJson, importFromFile, deleteAllLocalData, deleteAccount, clearAiHistory };

})();

if (typeof module !== 'undefined') module.exports = DataExportService;
