'use strict';



(function () {

  let _esBodyHtml = null;



  function _legalBodies(locale) {

    if (locale === 'en' && typeof LEGAL_BODIES_EN !== 'undefined') return LEGAL_BODIES_EN;

    if (locale === 'zh' && typeof LEGAL_BODIES_ZH !== 'undefined') return LEGAL_BODIES_ZH;

    return null;

  }



  function initLegalPage() {

    if (typeof I18n === 'undefined') return;

    I18n.applyDom();

    I18n.mount();



    const main = document.getElementById('legal-body');

    if (!main) return;



    if (!_esBodyHtml) _esBodyHtml = main.innerHTML;



    const page = main.dataset.legalPage;

    const locale = I18n.getLocale();

    const bodies = _legalBodies(locale);

    const html = bodies?.[page];



    if (html) {

      main.innerHTML = html;

    } else {

      main.innerHTML = _esBodyHtml;

    }



    document.title = I18n.t(

      page === 'terms' ? 'legal.termsTitle'

        : page === 'privacy' ? 'legal.privacyTitle'

          : 'legal.cookiesTitle'

    ) + ' — IN4MIND';

  }



  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', initLegalPage);

  } else {

    initLegalPage();

  }



  window.addEventListener('in4mind-locale-change', initLegalPage);

})();

