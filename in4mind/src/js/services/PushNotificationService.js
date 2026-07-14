'use strict';

/**
 * Web Push stub — solicita permiso cuando el usuario activa notificaciones en ajustes.
 */
const PushNotificationService = (() => {

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

  function showLocal(title, body, options = {}) {
    if (!isSupported() || Notification.permission !== 'granted') return;
    try {
      const reg = navigator.serviceWorker?.controller;
      if (reg) {
        reg.showNotification?.(title, { body, icon: options.icon, tag: options.tag || 'in4mind' });
      } else {
        new Notification(title, { body });
      }
    } catch { /* ignore */ }
  }

  return { isSupported, requestPermission, showLocal };

})();

if (typeof module !== 'undefined') module.exports = PushNotificationService;
