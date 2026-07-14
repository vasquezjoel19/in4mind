'use strict';

const CookieConsent = (() => {

  const KEY = 'in4mind_cookie_consent';

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function hasConsent() {
    return localStorage.getItem(KEY) === '1';
  }

  function _accept() {
    localStorage.setItem(KEY, '1');
    document.getElementById('cookie-consent')?.remove();
    window.dispatchEvent(new CustomEvent('in4mind-cookie-consent', { detail: { accepted: true } }));
  }

  function init() {
    if (hasConsent()) return;

    const bar = document.createElement('div');
    bar.id = 'cookie-consent';
    bar.className = 'cookie-consent';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', _t('cookies.bannerTitle', null, 'Cookies'));
    bar.innerHTML = `
      <div class="cookie-consent__inner">
        <p class="cookie-consent__text">
          ${_t('cookies.bannerText', null, 'Usamos cookies y almacenamiento local para recordar preferencias y mejorar tu experiencia.')}
          <a href="cookies.html">${_t('cookies.learnMore', null, 'Más información')}</a>
        </p>
        <div class="cookie-consent__actions">
          <button type="button" class="cookie-consent__btn cookie-consent__btn--ghost" id="cookie-decline">
            ${_t('cookies.decline', null, 'Solo esenciales')}
          </button>
          <button type="button" class="cookie-consent__btn cookie-consent__btn--primary" id="cookie-accept">
            ${_t('cookies.accept', null, 'Aceptar')}
          </button>
        </div>
      </div>`;
    document.body.appendChild(bar);

    document.getElementById('cookie-accept')?.addEventListener('click', _accept);
    document.getElementById('cookie-decline')?.addEventListener('click', () => {
      localStorage.setItem(KEY, 'essential');
      bar.remove();
    });
  }

  return { init, hasConsent };

})();

if (typeof module !== 'undefined') module.exports = CookieConsent;
