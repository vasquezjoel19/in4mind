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

  return { collectUserData, downloadJson, deleteAllLocalData, deleteAccount, clearAiHistory };

})();

if (typeof module !== 'undefined') module.exports = DataExportService;
