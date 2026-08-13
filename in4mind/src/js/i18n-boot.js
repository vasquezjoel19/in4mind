/**
 * IN4MIND — Carga i18n en todas las páginas (después de locales e I18n.js).
 */
'use strict';

(function bootI18n() {
  if (typeof I18n === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    if (typeof ThemeController !== 'undefined' && ThemeController.mount) {
      ThemeController.mount();
    }
  });

  window.addEventListener('in4mind-locale-change', () => {
    const activeNav = document.querySelector('#sidebar .nav-item--active')?.dataset?.nav ?? null;
    if (typeof AppShell !== 'undefined' && document.getElementById('sidebar-nav')) {
      AppShell.renderSidebar(activeNav);
      AppShell.setupAvatar();
    }
    window.dispatchEvent(new CustomEvent('in4mind-relocalize'));
  });
})();
