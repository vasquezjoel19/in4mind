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

  async function _copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        return true;
      } catch {
        return false;
      }
    }
  }

  function _downloadText(filename, content, mime = 'text/plain') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
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

  function _checklistHtml(checklist) {
    return `
      <ol class="employable-checklist" aria-label="${_esc(_t('employable.checklistTitle', null, 'Pasos de la ruta'))}">
        ${(checklist || []).map((step, i) => `
          <li class="employable-checklist__item ${step.done ? 'is-done' : ''}">
            <span class="employable-checklist__num" aria-hidden="true">${step.done ? '✓' : i + 1}</span>
            <span>${_esc(step.label)}</span>
          </li>`).join('')}
      </ol>`;
  }

  function _reqChecklistHtml(path) {
    const items = path?.submissionChecklist || [];
    if (!items.length) return '';
    const readme = path.readmeTemplate
      ? `<details class="employable-readme"><summary>${_esc(_t('employable.readmeToggle', null, 'Ver plantilla README'))}</summary><pre class="employable-readme__pre">${_esc(path.readmeTemplate)}</pre><button type="button" class="prof-btn" id="employable-copy-readme">${_esc(_t('employable.copyReadme', null, 'Copiar README'))}</button></details>`
      : '';
    return `
      <div class="employable-req" aria-label="${_esc(_t('employable.reqTitle', null, 'Checklist del proyecto'))}">
        <h3 class="employable-req__title">${_esc(_t('employable.reqTitle', null, 'Checklist del proyecto'))}</h3>
        <ul class="employable-req__list">
          ${items.map((item) => `<li>○ ${_esc(item.label)}</li>`).join('')}
        </ul>
        ${readme}
      </div>`;
  }

  async function _portfolioShareUrl() {
    const base = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}`;
    let userId = null;
    try {
      if (typeof UserProfileService !== 'undefined' && UserProfileService.getCurrentUserId) {
        userId = await UserProfileService.getCurrentUserId();
      }
    } catch { /* ignore */ }
    if (userId) return `${base}profile.html?u=${encodeURIComponent(userId)}`;
    return `${base}portfolio-public.html`;
  }

  function openModal(pathId, opts = {}) {
    if (typeof EmployabilityService === 'undefined') return;
    const modal = ensureModal();
    const body = document.getElementById('employable-modal-body');
    const progress = EmployabilityService.getPortfolioProgress(pathId, opts);
    const path = progress.path;
    EmployabilityService.setActivePath(progress.pathId);

    const d = progress.deliverables;
    const review = progress.record.projectReview;
    const hasProject = Boolean(progress.record.projectUrl);
    body.innerHTML = `
      <p class="employable-modal__lead">${_esc(path?.tagline || _t('employable.banner', null, 'No solo aprendes: sales con proyecto real, certificado verificable y perfil listo para aplicar.'))}</p>
      ${_checklistHtml(progress.checklist)}
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

      ${_reqChecklistHtml(path)}

      <form class="employable-form" id="employable-project-form">
        <label for="employable-project-url">${_esc(_t('employable.projectLabel', null, 'URL del proyecto final'))}</label>
        <input type="url" id="employable-project-url" required
               placeholder="${_esc(path?.projectHint || 'https://...')}"
               value="${_esc(progress.record.projectUrl || '')}">
        <p class="employable-form__hint" id="employable-url-hint">${_esc((path?.projectExamples || []).join(' · '))}</p>
        <p class="employable-form__warn" id="employable-url-warn" hidden role="status"></p>
        <button type="submit" class="btn--course">${_esc(_t('employable.submitProject', null, 'Enviar proyecto y emitir certificado'))}</button>
      </form>

      <div class="employable-cert" id="employable-cert-box" ${progress.record.certCode ? '' : 'hidden'}>
        <p><strong>${_esc(_t('employable.certReady', null, 'Certificado verificable'))}</strong></p>
        <p class="employable-cert__code">${_esc(progress.record.certCode || '')}</p>
        <a class="employable-cert__link" id="employable-cert-link" href="${progress.record.certCode && typeof CertVerificationService !== 'undefined' ? _esc(CertVerificationService.verifyUrl(progress.record.certCode)) : '#'}" target="_blank" rel="noopener">
          ${_esc(_t('employable.openVerify', null, 'Abrir verificación pública'))}
        </a>
      </div>

      <div class="employable-share" ${hasProject ? '' : 'hidden'}>
        <button type="button" class="btn--course" id="employable-copy-portfolio">
          ${_esc(_t('employable.copyPortfolio', null, 'Copiar enlace de mi Portafolio'))}
        </button>
      </div>

      <div class="employable-review" id="employable-review-box">
        <button type="button" class="btn--course btn--ghost" id="employable-review-btn"
          ${progress.record.projectUrl ? '' : 'disabled'}>
          ${_esc(_t('employable.reviewBtn', null, 'Revisar proyecto con IA (rúbrica junior)'))}
        </button>
        <div id="employable-review-out" class="employable-review__out" ${review ? '' : 'hidden'}>
          ${review ? `<p><strong>${_esc(_t('employable.reviewScore', { score: review.score }, `Puntaje: ${review.score}/100`))}</strong></p><p>${_esc(review.feedback || '')}</p>` : ''}
        </div>
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

    document.getElementById('employable-copy-readme')?.addEventListener('click', async () => {
      const ok = await _copyText(path?.readmeTemplate || '');
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(ok ? _t('employable.copied', null, 'Copiado') : _t('employable.copyFail', null, 'No se pudo copiar'), 2000);
      }
    });

    document.getElementById('employable-copy-portfolio')?.addEventListener('click', async () => {
      const url = await _portfolioShareUrl();
      const ok = await _copyText(url);
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(ok ? _t('employable.portfolioCopied', null, 'Enlace de portafolio copiado') : _t('employable.copyFail', null, 'No se pudo copiar'), 2400);
      }
    });

    const urlInput = document.getElementById('employable-project-url');
    const warnEl = document.getElementById('employable-url-warn');
    const updateWarn = () => {
      if (!urlInput || !warnEl) return;
      const hint = EmployabilityService.getUrlTrustHint(urlInput.value);
      if (urlInput.value.trim() && hint.warning && hint.ok && !hint.trusted) {
        warnEl.hidden = false;
        warnEl.textContent = hint.warning;
      } else if (urlInput.value.trim() && !hint.ok) {
        warnEl.hidden = false;
        warnEl.textContent = hint.warning;
      } else {
        warnEl.hidden = true;
        warnEl.textContent = '';
      }
    };
    urlInput?.addEventListener('input', updateWarn);
    updateWarn();

    document.getElementById('employable-project-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = document.getElementById('employable-project-url')?.value || '';
      const res = EmployabilityService.submitProject(progress.pathId, url);
      if (!res.ok) {
        if (typeof AppShell !== 'undefined') AppShell.showToast(res.error || 'Error', 2800);
        return;
      }
      if (res.urlHint && !res.urlHint.trusted && typeof AppShell !== 'undefined') {
        AppShell.showToast(res.urlHint.warning || _t('employable.urlSoftWarn', null, 'Asegúrate de que sea un enlace público válido.'), 3200);
      } else if (typeof AppShell !== 'undefined') {
        AppShell.showToast(_t('employable.projectSaved', null, 'Proyecto guardado y certificado emitido'), 2800);
      }
      void EmployabilityService.reviewSubmittedProject(progress.pathId).then(() => {
        openModal(progress.pathId, opts);
      });
      openModal(progress.pathId, opts);
      document.dispatchEvent(new CustomEvent('in4mind-employable-updated'));
    });

    document.getElementById('employable-review-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('employable-review-btn');
      if (btn) btn.disabled = true;
      const res = await EmployabilityService.reviewSubmittedProject(progress.pathId);
      if (btn) btn.disabled = false;
      if (!res.ok) {
        if (typeof AppShell !== 'undefined') AppShell.showToast(res.error || 'Error', 2800);
        return;
      }
      const out = document.getElementById('employable-review-out');
      if (out) {
        out.hidden = false;
        out.innerHTML = `<p><strong>${_esc(_t('employable.reviewScore', { score: res.review.score }, `Puntaje: ${res.review.score}/100`))}</strong></p><p>${_esc(res.review.feedback || '')}</p>`;
      }
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
      _renderPitch(res.pitch, path?.title);
      document.dispatchEvent(new CustomEvent('in4mind-employable-updated'));
    });

    if (progress.record.pitch) _renderPitch(progress.record.pitch, path?.title);
  }

  function _renderPitch(pitch, pathTitle) {
    const out = document.getElementById('employable-pitch-out');
    if (!out || !pitch) return;
    out.hidden = false;
    out.innerHTML = `
      <div class="employable-pitch__actions">
        <button type="button" class="prof-btn" data-copy="cv">${_esc(_t('employable.copyCv', null, 'Copiar CV'))}</button>
        <button type="button" class="prof-btn" data-copy="linkedin">${_esc(_t('employable.copyLinkedin', null, 'Copiar LinkedIn'))}</button>
        <button type="button" class="prof-btn" data-dl="txt">${_esc(_t('employable.downloadTxt', null, 'Descargar .txt'))}</button>
        <button type="button" class="prof-btn" data-dl="md">${_esc(_t('employable.downloadMd', null, 'Descargar .md'))}</button>
      </div>
      <h3>${_esc(_t('employable.cvTitle', null, 'Bullets de CV'))}</h3>
      <ul>${(pitch.cvBullets || []).map((b) => `<li>${_esc(b)}</li>`).join('')}</ul>
      <h3>${_esc(_t('employable.liHeadline', null, 'LinkedIn — titular'))}</h3>
      <p>${_esc(pitch.linkedinHeadline || '')}</p>
      <h3>${_esc(_t('employable.liSummary', null, 'LinkedIn — resumen'))}</h3>
      <p>${_esc(pitch.linkedinSummary || '')}</p>
      <h3>${_esc(_t('employable.interviewTitle', null, '5 preguntas de entrevista'))}</h3>
      <ol>${(pitch.interviewQA || []).map((qa) => `
        <li><strong>${_esc(qa.q)}</strong><br>${_esc(qa.a)}</li>`).join('')}</ol>`;

    const cvText = (pitch.cvBullets || []).map((b) => `• ${b}`).join('\n');
    const liText = `${pitch.linkedinHeadline || ''}\n\n${pitch.linkedinSummary || ''}`.trim();
    const full = typeof EmployabilityService !== 'undefined'
      ? EmployabilityService.formatPitchPlain(pitch, pathTitle)
      : `${cvText}\n\n${liText}`;

    out.querySelector('[data-copy="cv"]')?.addEventListener('click', async () => {
      const ok = await _copyText(cvText);
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(ok ? _t('employable.copied', null, 'Copiado') : _t('employable.copyFail', null, 'No se pudo copiar'), 2000);
      }
    });
    out.querySelector('[data-copy="linkedin"]')?.addEventListener('click', async () => {
      const ok = await _copyText(liText);
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(ok ? _t('employable.copied', null, 'Copiado') : _t('employable.copyFail', null, 'No se pudo copiar'), 2000);
      }
    });
    out.querySelector('[data-dl="txt"]')?.addEventListener('click', () => {
      _downloadText(`in4mind-pitch-${(pathTitle || 'ruta').replace(/\s+/g, '-').toLowerCase()}.txt`, full);
    });
    out.querySelector('[data-dl="md"]')?.addEventListener('click', () => {
      _downloadText(`in4mind-pitch-${(pathTitle || 'ruta').replace(/\s+/g, '-').toLowerCase()}.md`, full, 'text/markdown');
    });
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
      ${_checklistHtml(progress.checklist)}
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
      </div>
      <p class="employable-public-link">
        <a href="portfolio-public.html">${_esc(_t('employable.publicProfile', null, 'Ver / compartir perfil público de portfolio'))}</a>
      </p>`;

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
    const checklist = path && typeof EmployabilityService !== 'undefined'
      ? EmployabilityService.getChecklist(path.id)
      : [];
    container.innerHTML = `
      <div class="employable-course-banner">
        <div>
          <p class="employable-course-banner__eyebrow">${_esc(_t('employable.eyebrow', null, 'Ruta Empleable IN4MIND'))}</p>
          <p class="employable-course-banner__text">${_esc(_t('employable.banner', null, 'No solo aprendes: sales con proyecto real, certificado verificable y perfil listo para aplicar.'))}</p>
          ${path ? `<p class="employable-course-banner__path">${_esc(_t('employable.thisCourseIn', { path: path.title }, `Este curso forma parte de: ${path.title}`))}</p>` : ''}
          ${checklist.length ? _checklistHtml(checklist) : ''}
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
