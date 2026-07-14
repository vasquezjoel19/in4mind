'use strict';

(function () {
  function boot() {
    if (typeof OtherMenuController !== 'undefined') OtherMenuController.init();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
