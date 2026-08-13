'use strict';

const LandingController = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _bindSearch() {
    const btn = document.querySelector('.lp-header__actions .lp-icon-btn[aria-label], .lp-header__actions button[data-lp-search]');
    const searchBtn = document.querySelector('.lp-header__actions .lp-icon-btn');
    const buttons = document.querySelectorAll('.lp-header__actions .lp-icon-btn');
    const searchTrigger = buttons[0];
    if (!searchTrigger) return;

    let overlay = document.getElementById('lp-search-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lp-search-overlay';
      overlay.className = 'lp-search-overlay';
      overlay.hidden = true;
      overlay.innerHTML = `
        <div class="lp-search-modal" role="dialog" aria-modal="true" aria-label="${_t('landing.search', null, 'Buscar')}">
          <input type="search" id="lp-search-input" class="lp-search-input"
                 placeholder="${_t('search.placeholder', null, 'Buscar cursos…')}" autocomplete="off">
          <ul id="lp-search-results" class="lp-search-results" role="listbox"></ul>
          <button type="button" class="lp-search-close" id="lp-search-close">${_t('common.close', null, 'Cerrar')}</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.hidden = true; });
      document.getElementById('lp-search-close')?.addEventListener('click', () => { overlay.hidden = true; });
      document.getElementById('lp-search-input')?.addEventListener('input', _onSearchInput);
      document.getElementById('lp-search-input')?.addEventListener('keydown', e => {
        if (e.key === 'Escape') overlay.hidden = true;
      });
    }

    searchTrigger.setAttribute('data-lp-search', '1');
    searchTrigger.addEventListener('click', () => {
      overlay.hidden = false;
      document.getElementById('lp-search-input')?.focus();
    });
  }

  function _onSearchInput(e) {
    const q = e.target.value.trim();
    const list = document.getElementById('lp-search-results');
    if (!list) return;
    if (!q || typeof DataService === 'undefined') {
      list.innerHTML = '';
      return;
    }
    const courses = DataService.getCourses(q).slice(0, 8);
    list.innerHTML = courses.map(c => `
      <li role="option">
        <a href="tutorial.html?preview=1&course=${_escapeHtml(c.id)}" class="lp-search-result">
          <img src="${_escapeHtml(c.icon)}" alt="" width="24" height="24" loading="lazy">
          <span><strong>${_escapeHtml(c.title)}</strong><small>${_escapeHtml(c.desc)}</small></span>
        </a>
      </li>`).join('') || `<li class="lp-search-empty">${_t('search.noResults', null, 'Sin resultados')}</li>`;
  }

  function _bindThemeToggle() {
    // Toggle unificado: ThemeController monta .theme-toggle--landing en el header.
    if (typeof ThemeController !== 'undefined' && ThemeController.mount) {
      ThemeController.mount();
    }
  }

  function _bindIntroModal() {
    const btn = document.getElementById('btn-watch-intro');
    if (!btn || btn.dataset.introBound) return;
    btn.dataset.introBound = '1';

    let modal = document.getElementById('lp-intro-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'lp-intro-modal';
      modal.className = 'lp-intro-modal';
      modal.hidden = true;
      modal.innerHTML = `
        <div class="lp-intro-modal__inner" role="dialog" aria-modal="true" aria-labelledby="lp-intro-title">
          <button type="button" class="lp-intro-modal__close" id="lp-intro-close" aria-label="${_t('common.close', null, 'Cerrar')}">&times;</button>
          <h2 id="lp-intro-title">${_t('landing.introTitle', null, 'Bienvenido a IN4MIND')}</h2>
          <p>${_t('landing.introBody', null, 'Cursos, quizzes, certificaciones y asistente IA en una plataforma accesible.')}</p>
          <ul class="lp-intro-modal__features">
            <li>${_t('nav.tutorials', null, 'Cursos')} interactivos</li>
            <li>${_t('nav.quizzes', null, 'Quizzes')} y certificaciones</li>
            <li>${_t('nav.ai', null, 'IA')} educativa integrada</li>
          </ul>
          <a href="login.html" class="lp-btn lp-btn--primary">${_t('landing.start', null, 'Comenzar')}</a>
        </div>`;
      document.body.appendChild(modal);
    }

    function openModal() {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
        document.getElementById('lp-intro-close')?.focus();
      });
    }

    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      window.setTimeout(() => {
        if (!modal.classList.contains('is-open')) modal.hidden = true;
      }, 280);
    }

    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.getElementById('lp-intro-close')?.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
    btn.addEventListener('click', openModal);
  }

  function _publicCatalogLinks() {
    document.querySelectorAll('[data-open-course]').forEach(el => {
      if (el.dataset.publicBound) return;
      el.dataset.publicBound = '1';
      const courseId = el.dataset.openCourse;
      if (el.tagName === 'A' && el.getAttribute('href') === 'login.html') {
        el.setAttribute('href', `tutorial.html?preview=1&course=${courseId}`);
        el.addEventListener('click', () => {
          sessionStorage.setItem('in4mind_open_course', courseId);
        });
      }
    });

    document.querySelectorAll('.course-banner-card[href="login.html"], .lp-course-card[href="login.html"]').forEach(el => {
      const courseId = el.dataset.openCourse;
      if (courseId) el.setAttribute('href', `tutorial.html?preview=1&course=${courseId}`);
    });
  }

  function _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('sw.js?v=20260813cards29').catch(() => {});
  }

  function init() {
    _bindThemeToggle();
    _bindIntroModal();
    _publicCatalogLinks();
    if (typeof CookieConsent !== 'undefined') CookieConsent.init();
    _registerServiceWorker();
    if (typeof I18n !== 'undefined') I18n.applyDom(document.body);
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = LandingController;
