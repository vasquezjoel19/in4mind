'use strict';



const I18n = (() => {



  const STORAGE_KEY = 'in4mind_locale';

  const DEFAULT = 'es';

  const SUPPORTED = ['es', 'en', 'zh'];

  const LABELS = { es: 'ES', en: 'EN', zh: '中' };

  let _locale = DEFAULT;



  const MOUNT_SLOTS = [

    { selector: '.topbar__actions', before: '.avatar, #avatar', variant: 'app' },

    { selector: '.ai-topbar__actions', before: '.avatar, #avatar', variant: 'app' },

    { selector: '.lp-header__actions', before: '.lp-btn--primary', variant: 'landing' },

    { selector: '.legal-header__actions', before: '.legal-btn-back', variant: 'auth' },

  ];



  function normalizeLocale(locale) {

    const code = String(locale || '').toLowerCase();

    if (code === 'en') return 'en';

    if (code === 'zh' || code === 'zh-cn' || code === 'cn') return 'zh';

    return 'es';

  }



  function _dict() {

    if (_locale === 'en' && typeof LOCALE_EN !== 'undefined') return LOCALE_EN;

    if (_locale === 'zh' && typeof LOCALE_ZH !== 'undefined') return LOCALE_ZH;

    return typeof LOCALE_ES !== 'undefined' ? LOCALE_ES : {};

  }



  function _lookup(obj, path) {

    return path.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : null), obj);

  }



  function getLocale() {

    return _locale;

  }



  function t(key, params) {
    if (!key) return '';
    let val = _lookup(_dict(), key);
    // Fallbacks: never surface raw keys if ES/EN have a string.
    if (val == null && _locale !== 'es' && typeof LOCALE_ES !== 'undefined') {
      val = _lookup(LOCALE_ES, key);
    }
    if (val == null && _locale !== 'en' && typeof LOCALE_EN !== 'undefined') {
      val = _lookup(LOCALE_EN, key);
    }
    if (val == null && typeof LOCALE_ZH !== 'undefined') {
      val = _lookup(LOCALE_ZH, key);
    }
    if (val == null) return key;
    if (typeof val !== 'string') return val;
    if (params) {
      Object.keys(params).forEach(k => {
        val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
    }
    return val;
  }



  function setLocale(locale, { reload = false, force = false } = {}) {

    const next = normalizeLocale(locale);

    if (!SUPPORTED.includes(next)) return;

    if (!force && next === _locale && !reload) return;

    _locale = next;

    localStorage.setItem(STORAGE_KEY, next);

    document.documentElement.lang = next === 'zh' ? 'zh-CN' : next;

    document.documentElement.setAttribute('data-locale', next);

    applyDom();

    _refreshAllLangSwitchers();

    window.dispatchEvent(new CustomEvent('in4mind-locale-change', { detail: { locale: next } }));

    if (reload) window.location.reload();

  }



  function _refreshAllLangSwitchers() {

    document.querySelectorAll('.lang-switcher').forEach(wrap => {

      wrap.setAttribute('aria-label', t('settings.language'));

      wrap.querySelectorAll('.lang-switcher__btn').forEach(btn => {

        const active = btn.dataset.lang === _locale;

        btn.classList.toggle('lang-switcher__btn--active', active);

        btn.setAttribute('aria-pressed', String(active));

        btn.setAttribute('aria-label', t('settings.languageSwitch', { lang: btn.textContent }));

      });

    });

  }



  function _applyToElement(el) {

    const key = el.getAttribute('data-i18n');

    if (!key) return;

    const attr = el.getAttribute('data-i18n-attr');

    const val = t(key);

    if (attr) {

      if (attr === 'html') el.innerHTML = val;

      else el.setAttribute(attr, val);

    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {

      if (el.hasAttribute('placeholder') || el.getAttribute('data-i18n-attr') === 'placeholder') {

        el.placeholder = val;

      } else {

        el.value = val;

      }

    } else {

      el.textContent = val;

    }

  }



  function applyDom(root) {

    const scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(_applyToElement);

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => {

      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));

    });

    scope.querySelectorAll('[data-i18n-title]').forEach(el => {

      if (el === document.documentElement) return;

      el.title = t(el.getAttribute('data-i18n-title'));

    });

    document.documentElement.removeAttribute('title');

    scope.querySelectorAll('[data-i18n-aria]').forEach(el => {

      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));

    });

    document.title = t(document.documentElement.getAttribute('data-i18n-title') || 'meta.defaultTitle');

  }



  function _createLangBtn(code, label) {

    const btn = document.createElement('button');

    btn.type = 'button';

    btn.className = 'lang-switcher__btn';

    btn.dataset.lang = code;

    btn.textContent = label;

    btn.setAttribute('aria-pressed', String(_locale === code));

    btn.setAttribute('aria-label', t('settings.languageSwitch', { lang: label }));

    if (_locale === code) btn.classList.add('lang-switcher__btn--active');

    btn.addEventListener('click', () => {

      setLocale(code, { force: _locale === code });

    });

    return btn;

  }



  function mountLanguageSwitcher(container) {

    const wrap = document.createElement('div');

    wrap.className = 'lang-switcher';

    wrap.setAttribute('role', 'group');

    wrap.setAttribute('aria-label', t('settings.language'));

    SUPPORTED.forEach((code, i) => {

      if (i > 0) wrap.appendChild(document.createTextNode(' | '));

      wrap.appendChild(_createLangBtn(code, LABELS[code] || code.toUpperCase()));

    });

    if (container) {

      container.innerHTML = '';

      container.appendChild(wrap);

    }

    return wrap;

  }



  function mount() {

    document.querySelectorAll('[data-lang-switcher]').forEach(el => {

      if (!el.querySelector('.lang-switcher')) mountLanguageSwitcher(el);

    });

    MOUNT_SLOTS.forEach(({ selector, before }) => {

      const container = document.querySelector(selector);

      if (!container || container.querySelector('.lang-switcher')) return;

      const wrap = mountLanguageSwitcher();

      if (before) {

        const ref = container.querySelector(before);

        if (ref) container.insertBefore(wrap, ref);

        else container.appendChild(wrap);

      } else {

        container.appendChild(wrap);

      }

    });

  }



  function initEarly() {

    _locale = normalizeLocale(localStorage.getItem(STORAGE_KEY) || DEFAULT);

    document.documentElement.lang = _locale === 'zh' ? 'zh-CN' : _locale;

    document.documentElement.setAttribute('data-locale', _locale);

  }



  function init() {

    applyDom();

    mount();

  }



  return {

    t, getLocale, setLocale, applyDom, mount, mountLanguageSwitcher, initEarly, init,

    normalizeLocale, SUPPORTED,

  };



})();



if (typeof module !== 'undefined') module.exports = I18n;

