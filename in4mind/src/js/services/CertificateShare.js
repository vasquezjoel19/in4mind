'use strict';

const CertificateShare = (() => {

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _userName() {
    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    return user?.name?.trim() || user?.email?.split('@')[0] || 'Usuario';
  }

  function buildCertHtml(cert) {
    const name = _userName();
    const date = cert.earnedAt
      ? new Date(cert.earnedAt).toLocaleDateString()
      : new Date().toLocaleDateString();
    const code = typeof CertVerificationService !== 'undefined'
      ? CertVerificationService.register(cert, name)
      : (cert.id || `IN4MIND-${cert.refId || 'CERT'}-${Date.now().toString(36).toUpperCase()}`);
    const verifyUrl = typeof CertVerificationService !== 'undefined'
      ? CertVerificationService.verifyUrl(code)
      : '';
    const qrSrc = verifyUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`
      : '';
    return `
      <div class="cert-share-card" id="cert-share-print">
        <div class="cert-share-card__ribbon" aria-hidden="true"></div>
        <p class="cert-share-card__eyebrow">IN4MIND</p>
        <h2 class="cert-share-card__title">${_t('cert.title', null, 'Certificado de finalización')}</h2>
        <p class="cert-share-card__name">${name}</p>
        <p class="cert-share-card__course">${cert.title || cert.refId}</p>
        <p class="cert-share-card__date">${_t('cert.issued', { date }, `Emitido el ${date}`)}</p>
        <p class="cert-share-card__code">${_t('cert.code', { code }, `Código: ${code}`)}</p>
        ${qrSrc ? `<img class="cert-share-card__qr" src="${qrSrc}" alt="QR verificación" width="120" height="120">` : ''}
      </div>`;
  }

  function openModal(cert) {
    let overlay = document.getElementById('cert-share-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cert-share-overlay';
      overlay.className = 'cert-share-overlay';
      overlay.innerHTML = `
        <div class="cert-share-modal" role="dialog" aria-modal="true" aria-labelledby="cert-share-heading">
          <button type="button" class="cert-share-modal__close" id="cert-share-close" aria-label="Cerrar">&times;</button>
          <div id="cert-share-body"></div>
          <div class="cert-share-modal__actions">
            <button type="button" class="prof-btn" id="cert-share-download">${_t('cert.download', null, 'Descargar')}</button>
            <button type="button" class="prof-btn prof-btn--primary" id="cert-share-copy">${_t('cert.copyLink', null, 'Copiar enlace')}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.hidden = true;
      });
      document.getElementById('cert-share-close')?.addEventListener('click', () => { overlay.hidden = true; });
    }

    const body = document.getElementById('cert-share-body');
    if (body) body.innerHTML = buildCertHtml(cert);

    const downloadBtn = document.getElementById('cert-share-download');
    const copyBtn = document.getElementById('cert-share-copy');
    if (downloadBtn) downloadBtn.replaceWith(downloadBtn.cloneNode(true));
    if (copyBtn) copyBtn.replaceWith(copyBtn.cloneNode(true));

    document.getElementById('cert-share-download')?.addEventListener('click', () => {
      const card = document.getElementById('cert-share-print');
      if (!card) return;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<!DOCTYPE html><html><head><title>IN4MIND Cert</title>
        <style>
          body{font-family:Georgia,serif;display:flex;justify-content:center;padding:40px;background:#f4f6fb}
          .cert-share-card{border:3px solid #1b273c;padding:48px;text-align:center;max-width:520px;background:#fff}
          .cert-share-card__eyebrow{letter-spacing:.2em;font-size:12px;color:#335071}
          .cert-share-card__title{margin:12px 0;font-size:1.5rem;color:#1b273c}
          .cert-share-card__name{font-size:1.8rem;margin:16px 0;font-weight:700}
          .cert-share-card__course{color:#335071;font-size:1.1rem}
          .cert-share-card__date,.cert-share-card__code{font-size:.85rem;color:#64748b;margin-top:12px}
        </style></head><body>${card.outerHTML}</body></html>`);
      w.document.close();
      w.print();
    });

    document.getElementById('cert-share-copy')?.addEventListener('click', async () => {
      const codeEl = document.querySelector('.cert-share-card__code');
      const code = codeEl?.textContent?.replace(/.*:\s*/, '') || '';
      const verifyUrl = typeof CertVerificationService !== 'undefined' && code
        ? CertVerificationService.verifyUrl(code.trim())
        : window.location.origin;
      const text = `${_t('cert.shareText', { course: cert.title, name: _userName() }, `Obtuve mi certificación en ${cert.title} con IN4MIND`)} — ${verifyUrl}`;
      try {
        await navigator.clipboard.writeText(text);
        if (typeof AppShell !== 'undefined') AppShell.showToast(_t('cert.copied', null, 'Enlace copiado'));
      } catch {
        if (typeof AppShell !== 'undefined') AppShell.showToast(_t('cert.copyFail', null, 'No se pudo copiar'));
      }
    });

    overlay.hidden = false;
  }

  return { openModal, buildCertHtml };

})();

if (typeof module !== 'undefined') module.exports = CertificateShare;
