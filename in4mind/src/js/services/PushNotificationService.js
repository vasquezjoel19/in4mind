'use strict';

/**
 * Notificaciones locales del navegador (permiso + recordatorios de estudio/SRS).
 */
const PushNotificationService = (() => {
  const LAST_KEY = 'in4mind_local_push_last';
  const COOLDOWN_MS = 6 * 60 * 60 * 1000;

  function isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  async function requestPermission() {
    if (!isSupported()) return { ok: false, reason: 'unsupported' };
    if (Notification.permission === 'granted') return { ok: true };
    if (Notification.permission === 'denied') return { ok: false, reason: 'denied' };
    const result = await Notification.requestPermission();
    return { ok: result === 'granted' };
  }

  function _pushEnabled() {
    try {
      const prefs = JSON.parse(localStorage.getItem('in4mind_notif_prefs') || '{}');
      return prefs.push !== false;
    } catch {
      return true;
    }
  }

  function showLocal(title, body, options = {}) {
    if (!isSupported() || Notification.permission !== 'granted') return false;
    if (!_pushEnabled()) return false;
    try {
      const opts = {
        body,
        icon: options.icon || './src/img/brand/favicon-64.png',
        tag: options.tag || 'in4mind',
        data: options.data || {},
      };
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification?.(title, opts).catch(() => {
            try { new Notification(title, opts); } catch { /* ignore */ }
          });
        });
      } else {
        new Notification(title, opts);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Emite 1 notificación local prioritaria (SRS / estudio / racha) con cooldown.
   * @param {Array<{id:string,type:string,title:string,body:string}>} notifications
   */
  function syncUsefulReminders(notifications = []) {
    if (!isSupported() || Notification.permission !== 'granted' || !_pushEnabled()) return;
    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) || '{}');
      const now = Date.now();
      if (last.at && now - last.at < COOLDOWN_MS) return;

      const priority = ['streak_risk', 'review', 'study', 'weekly'];
      const pick = notifications.find(n => priority.includes(n.type) && n.id !== last.id);
      if (!pick) return;

      const ok = showLocal(pick.title, pick.body, { tag: `in4mind-${pick.type}`, data: { id: pick.id } });
      if (ok) {
        localStorage.setItem(LAST_KEY, JSON.stringify({ id: pick.id, at: now }));
      }
    } catch { /* ignore */ }
  }

  return { isSupported, requestPermission, showLocal, syncUsefulReminders };

})();

if (typeof module !== 'undefined') module.exports = PushNotificationService;
