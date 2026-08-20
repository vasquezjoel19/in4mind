/**
 * IN4MIND — Diálogos temáticos (reemplazan alert / confirm / prompt).
 */
'use strict';

const UiDialog = (() => {

  let _open = null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function _ensureRoot() {
    let root = document.getElementById('ui-dialog-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'ui-dialog-root';
    document.body.appendChild(root);
    return root;
  }

  function close() {
    const root = document.getElementById('ui-dialog-root');
    if (root) {
      root.innerHTML = '';
      root.hidden = true;
    }
    const resolve = _open;
    _open = null;
    document.removeEventListener('keydown', _onKey, true);
    if (resolve) resolve(null);
  }

  function _onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const root = document.getElementById('ui-dialog-root');
    const focusable = root?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function _mount({ title, bodyHtml, actions, danger, focusSelector }) {
    const root = _ensureRoot();
    root.hidden = false;
    root.innerHTML = `
      <div class="ui-dialog-backdrop" data-ui-dialog-dismiss>
        <div class="ui-dialog ${danger ? 'ui-dialog--danger' : ''}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <h2 class="ui-dialog__title" id="ui-dialog-title">${_esc(title)}</h2>
          <div class="ui-dialog__body">${bodyHtml}</div>
          <div class="ui-dialog__actions">${actions}</div>
        </div>
      </div>`;
    document.addEventListener('keydown', _onKey, true);
    root.querySelector('[data-ui-dialog-dismiss]')?.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-ui-dialog-dismiss')) close();
    });
    const focusEl = root.querySelector(focusSelector || '.ui-dialog__actions button, .ui-dialog input');
    setTimeout(() => focusEl?.focus(), 20);
    return root;
  }

  function alert({ title, message } = {}) {
    return new Promise((resolve) => {
      close();
      _open = resolve;
      const root = _mount({
        title: title || _t('common.confirm', null, 'Aviso'),
        bodyHtml: `<p class="ui-dialog__text">${_esc(message || '')}</p>`,
        actions: `<button type="button" class="btn--course" data-ui-ok>${_esc(_t('common.confirm', null, 'Aceptar'))}</button>`,
      });
      root.querySelector('[data-ui-ok]')?.addEventListener('click', () => {
        const done = _open;
        _open = null;
        document.getElementById('ui-dialog-root').innerHTML = '';
        document.getElementById('ui-dialog-root').hidden = true;
        document.removeEventListener('keydown', _onKey, true);
        if (done) done(true);
      });
    });
  }

  function confirm({ title, message, danger, confirmLabel, cancelLabel } = {}) {
    return new Promise((resolve) => {
      close();
      _open = resolve;
      const okLabel = confirmLabel || (danger
        ? _t('common.delete', null, 'Eliminar')
        : _t('common.confirm', null, 'Confirmar'));
      const root = _mount({
        title: title || _t('common.confirm', null, 'Confirmar'),
        danger: Boolean(danger),
        bodyHtml: `<p class="ui-dialog__text">${_esc(message || '')}</p>`,
        actions: `
          <button type="button" class="btn--outline" data-ui-cancel>${_esc(cancelLabel || _t('common.cancel', null, 'Cancelar'))}</button>
          <button type="button" class="${danger ? 'btn--danger' : 'btn--course'}" data-ui-ok>${_esc(okLabel)}</button>`,
      });
      const finish = (value) => {
        const done = _open;
        _open = null;
        const el = document.getElementById('ui-dialog-root');
        if (el) { el.innerHTML = ''; el.hidden = true; }
        document.removeEventListener('keydown', _onKey, true);
        if (done) done(value);
      };
      root.querySelector('[data-ui-cancel]')?.addEventListener('click', () => finish(false));
      root.querySelector('[data-ui-ok]')?.addEventListener('click', () => finish(true));
    });
  }

  function prompt({ title, message, value, placeholder, confirmLabel } = {}) {
    return new Promise((resolve) => {
      close();
      _open = resolve;
      const root = _mount({
        title: title || _t('common.confirm', null, 'Nombre'),
        bodyHtml: `
          ${message ? `<p class="ui-dialog__text">${_esc(message)}</p>` : ''}
          <input class="ui-dialog__input" id="ui-dialog-input" type="text" maxlength="120"
                 value="${_esc(value || '')}" placeholder="${_esc(placeholder || '')}">`,
        actions: `
          <button type="button" class="btn--outline" data-ui-cancel>${_esc(_t('common.cancel', null, 'Cancelar'))}</button>
          <button type="button" class="btn--course" data-ui-ok>${_esc(confirmLabel || _t('common.save', null, 'Guardar'))}</button>`,
        focusSelector: '#ui-dialog-input',
      });
      const input = root.querySelector('#ui-dialog-input');
      const finish = (val) => {
        const done = _open;
        _open = null;
        const el = document.getElementById('ui-dialog-root');
        if (el) { el.innerHTML = ''; el.hidden = true; }
        document.removeEventListener('keydown', _onKey, true);
        if (done) done(val);
      };
      root.querySelector('[data-ui-cancel]')?.addEventListener('click', () => finish(null));
      root.querySelector('[data-ui-ok]')?.addEventListener('click', () => finish(input?.value ?? ''));
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(input.value);
        }
      });
    });
  }

  return { alert, confirm, prompt, close, danger: (opts) => confirm({ ...opts, danger: true }) };
})();

if (typeof module !== 'undefined') module.exports = UiDialog;
