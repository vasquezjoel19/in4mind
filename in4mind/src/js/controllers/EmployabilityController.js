/**
 * IN4MIND — UI Ruta Empleable (dashboard + modal de entregables).
 */
'use strict';

const EmployabilityController = (() => {

  function _t(key, params, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback ?? '';
  }

  function _esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function ensureModal() {
    let el = document.getElementById('employable-modal');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'employable-modal';
    el.className = 'employable-modal';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'employable-modal-title');
    el.innerHTML = `
      <div class="employable-modal__backdrop" data-close></div>
      <div class="employable-modal__panel">
        <header class="employable-modal__header">
          <h2 id="employable-modal-title">${_esc(_t('employable.modalTitle', null, 'Ruta Empleable'))}</h2>
          <button type="button" class="employable-modal__close" data-close aria-label="${_esc(_t('common.close', null, 'Cerrar'))}">×</button>
        </header>
        <div class="employable-modal__body" id="employable-modal-body"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) closeModal();
    });
    return el;
  }

  function closeModal() {
    const el = document.getElementById('employable-modal');
    if (el) el.hidden = true;
  }

  function openModal(pathId, opts = {}) {
    if (typeof EmployabilityService === 'undefined') return;
    const modal = ensureModal();
    const body = document.getElementById('employable-modal-body');
    const progress = EmployabilityService.getPortfolioProgress(pathId, opts);
    const path = progress.path;
    EmployabilityService.setActivePath(progress.pathId);

    const d = progress.deliverables;
    body.innerHTML = `
      <p class="employable-modal__lead">${_esc(path?.tagline || _t('employable.banner', null, 'No solo aprendes: sales con proyecto real, certificado verificable y perfil listo para aplicar.'))}</p>
      <div class="portfolio-progress portfolio-progress--modal" role="group" aria-label="${_esc(_t('employable.portfolioProgress', null, 'Progreso del portfolio'))}">
        <div class="portfolio-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.portfolioPct}">
          <span style="width:${progress.portfolioPct}%"></span>
        </div>
        <p class="portfolio-progress__pct">${progress.portfolioPct}% · ${progress.doneCount}/3 ${_esc(_t('employable.deliverables', null, 'entregables'))}</p>
        <ul class="portfolio-progress__list">
          ${d.map((item) => `
            <li class="portfolio-progress__item ${item.done ? 'is-done' : ''}">
              <span class="portfolio-progress__check" aria-hidden="true">${item.done ? '✓' : '○'}</span>
              <div>
                <strong>${_esc(item.label)}</strong>
                <p>${_esc(item.detail)}</p>
              </div>
            </li>`).join('')}
        </ul>
      </div>

      <form class="employable-form" id="employable-project-form">
        <label for="employable-project-url">${_esc(_t('employable.projectLabel', null, 'URL del proyecto final'))}</label>
        <input type="url" id="employable-project-url" required
               placeholder="${_esc(path?.projectHint || 'https://...')}"
               value="${_esc(progress.record.projectUrl || '')}">
        <p class="employable-form__hint">${_esc((path?.projectExamples || []).join(' · '))}</p>
        <button type="submit" class="btn--course">${_esc(_t('employable.submitProject', null, 'Enviar proyecto y emitir certificado'))}</button>
      </form>

      <div class="employable-cert" id="employable-cert-box" ${progress.record.certCode ? '' : 'hidden'}>
        <p><strong>${_esc(_t('employable.certReady', null, 'Certificado verificable'))}</strong></p>
        <p class="employable-cert__code">${_esc(progress.record.certCode || '')}</p>
        <a class="employable-cert__link" id="employable-cert-link" href="${progress.record.certCode && typeof CertVerificationService !== 'undefined' ? _esc(CertVerificationService.verifyUrl(progress.record.certCode)) : '#'}" target="_blank" rel="noopener">
          ${_esc(_t('employable.openVerify', null, 'Abrir verificación pública'))}
        </a>
      </div>

      <div class="employable-pitch">
        <button type="button" class="btn--course btn--ghost" id="employable-pitch-btn"
          ${progress.record.projectUrl ? '' : 'disabled'}>
          ${_esc(_t('employable.generatePitch', null, 'Generar pitch / CV / entrevista con IA'))}
        </button>
        <div id="employable-pitch-out" class="employable-pitch__out" ${progress.record.pitch ? '' : 'hidden'}></div>
      </div>

      ${progress.isLearningOnlyComplete ? `
        <p class="employable-gate" role="status">
          ${_esc(_t('employable.gateMsg', null, 'Aprendizaje casi listo: la ruta no se marca al 100% hasta enviar el proyecto final.'))}
        </p>` : ''}
    `;

    modal.hidden = false;

    document.getElementById('employable-project-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('employable-project-url')?.value || '';
      const res = EmployabilityService.submitProject(progress.pathId, url);
      if (!res.ok) {
        if (typeof AppShell !== 'undefined') AppShell.showToast(res.error || 'Error', 2800);
        return;
      }
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(_t('employable.projectSaved', null, 'Proyecto guardado y certificado emitido'), 2800);
      }
      openModal(progress.pathId, opts);
      document.dispatchEvent(new CustomEvent('in4mind-employable-updated'));
    });

    document.getElementById('employable-pitch-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('employable-pitch-btn');
      if (btn) btn.disabled = true;
      const res = await EmployabilityService.generatePitch(progress.pathId);
      if (btn) btn.disabled = false;
      if (!res.ok) {
        if (typeof AppShell !== 'undefined') AppShell.showToast(res.error || 'Error', 2800);
        return;
      }
      _renderPitch(res.pitch);
      document.dispatchEvent(new CustomEvent('in4mind-employable-updated'));
    });

    if (progress.record.pitch) _renderPitch(progress.record.pitch);
  }

  function _renderPitch(pitch) {
    const out = document.getElementById('employable-pitch-out');
    if (!out || !pitch) return;
    out.hidden = false;
    out.innerHTML = `
      <h3>${_esc(_t('employable.cvTitle', null, 'Bullets de CV'))}</h3>
      <ul>${(pitch.cvBullets || []).map((b) => `<li>${_esc(b)}</li>`).join('')}</ul>
      <h3>${_esc(_t('employable.liHeadline', null, 'LinkedIn — titular'))}</h3>
      <p>${_esc(pitch.linkedinHeadline || '')}</p>
      <h3>${_esc(_t('employable.liSummary', null, 'LinkedIn — resumen'))}</h3>
      <p>${_esc(pitch.linkedinSummary || '')}</p>
      <h3>${_esc(_t('employable.interviewTitle', null, '5 preguntas de entrevista'))}</h3>
      <ol>${(pitch.interviewQA || []).map((qa) => `
        <li><strong>${_esc(qa.q)}</strong><br>${_esc(qa.a)}</li>`).join('')}</ol>`;
  }

  function renderDashboardSection(container, opts = {}) {
    if (!container || typeof CareerPathsData === 'undefined' || typeof EmployabilityService === 'undefined') return;
    const paths = CareerPathsData.getPaths();
    const activeId = EmployabilityService.getActivePathId() || paths[0]?.id;
    const progress = EmployabilityService.getPortfolioProgress(activeId, opts);

    container.innerHTML = `
      <div class="employable-hero">
        <p class="employable-hero__eyebrow">${_esc(_t('employable.eyebrow', null, 'Ruta Empleable IN4MIND'))}</p>
        <h3 class="employable-hero__title">${_esc(_t('employable.heroTitle', null, 'De curso completado a evidencia para empleo'))}</h3>
        <p class="employable-hero__sub">${_esc(_t('employable.banner', null, 'No solo aprendes: sales con proyecto real, certificado verificable y perfil listo para aplicar.'))}</p>
      </div>
      <div class="portfolio-progress" id="portfolio-progress-root">
        <div class="portfolio-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.portfolioPct}">
          <span style="width:${progress.portfolioPct}%"></span>
        </div>
        <p class="portfolio-progress__pct">${progress.portfolioPct}% · ${progress.doneCount}/3 ${_esc(_t('employable.deliverables', null, 'entregables'))}</p>
        <ul class="portfolio-progress__list portfolio-progress__list--row">
          ${progress.deliverables.map((item) => `
            <li class="portfolio-progress__item ${item.done ? 'is-done' : ''}">
              <span class="portfolio-progress__check" aria-hidden="true">${item.done ? '✓' : '○'}</span>
              <strong>${_esc(item.label)}</strong>
            </li>`).join('')}
        </ul>
      </div>
      <div class="employable-paths" role="list">
        ${paths.map((p) => {
          const pp = EmployabilityService.getPortfolioProgress(p.id, opts);
          const active = p.id === progress.pathId;
          return `
            <article class="employable-path-card ${active ? 'is-active' : ''}" role="listitem" data-path-id="${_esc(p.id)}" tabindex="0"
              style="--emp-accent:${_esc(p.accent || '#0d9488')}">
              <h4>${_esc(p.title)}</h4>
              <p>${_esc(p.desc)}</p>
              <div class="employable-path-card__bar"><span style="width:${pp.portfolioPct}%"></span></div>
              <p class="employable-path-card__meta">${pp.portfolioPct}% · ${pp.doneCount}/3</p>
              <button type="button" class="btn--course" data-open-employable="${_esc(p.id)}">
                ${_esc(active
                  ? _t('employable.continue', null, 'Continuar entregables')
                  : _t('employable.choose', null, 'Elegir esta ruta'))}
              </button>
            </article>`;
        }).join('')}
      </div>`;

    container.querySelectorAll('[data-open-employable]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open-employable');
        EmployabilityService.setActivePath(id);
        openModal(id, opts);
        renderDashboardSection(container, opts);
      });
    });
  }

  function renderCourseBanner(container, courseId) {
    if (!container) return;
    const path = typeof CareerPathsData !== 'undefined'
      ? CareerPathsData.getPathForCourse(courseId)
      : null;
    container.hidden = false;
    container.innerHTML = `
      <div class="employable-course-banner">
        <div>
          <p class="employable-course-banner__eyebrow">${_esc(_t('employable.eyebrow', null, 'Ruta Empleable IN4MIND'))}</p>
          <p class="employable-course-banner__text">${_esc(_t('employable.banner', null, 'No solo aprendes: sales con proyecto real, certificado verificable y perfil listo para aplicar.'))}</p>
          ${path ? `<p class="employable-course-banner__path">${_esc(_t('employable.thisCourseIn', { path: path.title }, `Este curso forma parte de: ${path.title}`))}</p>` : ''}
        </div>
        <button type="button" class="btn--course" data-employable-open>
          ${_esc(_t('employable.openPanel', null, 'Ver entregables'))}
        </button>
      </div>`;
    container.querySelector('[data-employable-open]')?.addEventListener('click', () => {
      if (path) EmployabilityService.setActivePath(path.id);
      openModal(path?.id);
    });
  }

  return { renderDashboardSection, renderCourseBanner, openModal, closeModal, ensureModal };
})();

if (typeof module !== 'undefined') module.exports = EmployabilityController;
