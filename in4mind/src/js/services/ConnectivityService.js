/**
 * IN4MIND — Conectividad: banner offline + flush de cola al volver online.
 */
'use strict';

const ConnectivityService = (() => {
  const BANNER_ID = 'in4mind-offline-banner';
  let _bound = false;

  function _t(k, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function isOnline() {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  }

  function _ensureBanner() {
    let el = document.getElementById(BANNER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BANNER_ID;
    el.className = 'offline-banner';
    el.setAttribute('role', 'status');
    el.hidden = true;
    el.innerHTML = `<span class="offline-banner__text"></span>
      <button type="button" class="offline-banner__retry" id="offline-banner-retry">Reintentar</button>`;
    document.body.appendChild(el);
    document.getElementById('offline-banner-retry')?.addEventListener('click', () => {
      void flushNow(true);
    });
    return el;
  }

  function _setBanner(visible, text) {
    const el = _ensureBanner();
    const label = el.querySelector('.offline-banner__text');
    if (label) label.textContent = text || '';
    el.hidden = !visible;
  }

  function _toast(msg) {
    if (typeof AppShell !== 'undefined' && AppShell.showToast) AppShell.showToast(msg, 3200);
  }

  async function flushNow(manual = false) {
    if (!isOnline()) {
      _setBanner(true, _t('connectivity.offline', 'Sin conexión. Tus cambios se guardan en este dispositivo.'));
      if (manual) _toast(_t('connectivity.stillOffline', 'Sigues sin conexión.'));
      return { ok: false, reason: 'offline' };
    }

    _setBanner(false);

    if (typeof SyncOutboxService === 'undefined') return { ok: true };

    const result = await SyncOutboxService.flush();
    if (result.flushed > 0) {
      _toast(_t('connectivity.synced', `Se sincronizaron ${result.flushed} cambio(s).`).replace('{n}', String(result.flushed)));
    } else if (manual && result.remaining === 0) {
      _toast(_t('connectivity.upToDate', 'Todo está sincronizado.'));
    } else if (result.remaining > 0) {
      _setBanner(true, _t('connectivity.pending', `Hay ${result.remaining} cambio(s) pendientes de sincronizar.`).replace('{n}', String(result.remaining)));
    }
    return result;
  }

  function _onOffline() {
    _setBanner(true, _t('connectivity.offline', 'Sin conexión. Tus cambios se guardan en este dispositivo.'));
    if (typeof ErrorReporter !== 'undefined') ErrorReporter.capture('offline');
  }

  function _onOnline() {
    void flushNow(false);
  }

  function init() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;

    // Estilos mínimos si ui-polish no los tiene aún
    if (!document.getElementById('offline-banner-style')) {
      const style = document.createElement('style');
      style.id = 'offline-banner-style';
      style.textContent = `
        .offline-banner{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + var(--shell-pad-bottom,0px));z-index:1250;display:flex;gap:12px;align-items:center;max-width:min(560px,92vw);padding:10px 14px;border-radius:12px;background:#1b273c;color:#f2f2f2;font-size:.85rem;box-shadow:0 10px 30px rgba(0,0,0,.28)}
        .offline-banner[hidden]{display:none!important}
        .offline-banner__retry{border:1px solid rgba(255,255,255,.28);background:transparent;color:inherit;border-radius:999px;padding:6px 12px;cursor:pointer;font-weight:600}
        .offline-banner__retry:hover{background:rgba(255,255,255,.08)}
      `;
      document.head.appendChild(style);
    }

    window.addEventListener('offline', _onOffline);
    window.addEventListener('online', _onOnline);

    if (!isOnline()) _onOffline();
    else {
      // Flush suave tras idle
      const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb) => setTimeout(cb, 600);
      idle(() => { void flushNow(false); });
    }

    if (typeof SyncOutboxService !== 'undefined') {
      window.addEventListener(SyncOutboxService.EVENT, () => {
        if (SyncOutboxService.size() > 0 && isOnline()) void flushNow(false);
      });
    }
  }

  return { init, isOnline, flushNow };
})();

if (typeof module !== 'undefined') module.exports = ConnectivityService;
