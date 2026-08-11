/**
 * IN4MIND — GuidedProjectsController
 * Lista de tarjetas + vista paso a paso (instrucciones | workspace).
 */

'use strict';

const GuidedProjectsController = (() => {

  let $listView, $stepView, $grid, $search;
  let $backBtn, $stepTitle, $stepMeta, $stepProgressFill, $stepProgLabel;
  let $stepList, $instructions, $hint, $workspace, $btnSave, $btnComplete, $btnPrev, $btnNext;
  let $lockBanner;

  let _projects = [];
  let _quizScores = {};
  let _current = null;
  let _stepIndex = 0;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _escape(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function _difficultyLabel(level) {
    const map = {
      beginner: _t('guided.diffBeginner', null, 'Principiante'),
      intermediate: _t('guided.diffIntermediate', null, 'Intermedio'),
      advanced: _t('guided.diffAdvanced', null, 'Avanzado'),
    };
    return map[level] || level;
  }

  function _topicTitle(project) {
    try {
      const course = typeof DataService !== 'undefined'
        ? DataService.getCourses().find(c => c.id === project.courseId || c.id === project.quizId)
        : null;
      return course?.title || project.quizId;
    } catch {
      return project.quizId;
    }
  }

  function _isUnlocked(project) {
    const pct = _quizScores[project.quizId] ?? GuidedProjectsService.getQuizBestPct(project.quizId);
    return pct > GuidedProjectsService.UNLOCK_PCT;
  }

  function _showList() {
    $listView?.classList.remove('gp-view--hidden');
    $stepView?.classList.add('gp-view--hidden');
    _current = null;
    if (typeof ShareService !== 'undefined') {
      ShareService.setContext({
        page: 'guided-projects.html',
        title: _t('guided.pageTitle', null, 'Proyectos guiados — IN4MIND'),
      });
    }
  }

  function _showStepView() {
    $listView?.classList.add('gp-view--hidden');
    $stepView?.classList.remove('gp-view--hidden');
  }

  function _renderCard(project) {
    const unlocked = _isUnlocked(project);
    const total = project.steps.length;
    const pct = GuidedProjectsService.getCompletionPct(project.id, total);
    const prog = GuidedProjectsService.getProgress(project.id);
    const started = Boolean(prog.startedAt) || pct > 0;
    const quizPct = _quizScores[project.quizId] ?? GuidedProjectsService.getQuizBestPct(project.quizId);
    const cta = !unlocked
      ? _t('guided.lockedCta', null, 'Bloqueado')
      : started
        ? _t('guided.continue', null, 'Continuar')
        : _t('guided.start', null, 'Empezar proyecto');

    return `
      <article class="gp-card ${unlocked ? '' : 'gp-card--locked'}" role="listitem"
               data-project-id="${_escape(project.id)}" tabindex="0"
               aria-label="${_escape(project.title)}">
        <div class="gp-card__top">
          <img class="gp-card__icon" src="${_escape(project.icon)}" alt="" width="28" height="28" loading="lazy">
          <span class="gp-card__diff gp-card__diff--${_escape(project.difficulty)}">${_escape(_difficultyLabel(project.difficulty))}</span>
        </div>
        <h3 class="gp-card__title">${_escape(project.title)}</h3>
        <p class="gp-card__summary">${_escape(project.summary)}</p>
        <div class="gp-card__meta">
          <span>${_escape(_topicTitle(project))}</span>
          <span>${_t('guided.estTime', { n: project.estimatedMinutes }, `${project.estimatedMinutes} min`)}</span>
        </div>
        <div class="gp-card__bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <div class="gp-card__footer">
          <span class="gp-card__pct">${pct}%</span>
          ${unlocked
            ? `<button type="button" class="btn--course gp-card__cta" data-action="open">${_escape(cta)}</button>`
            : `<span class="gp-card__lock">${_t('guided.unlockHint', { pct: GuidedProjectsService.UNLOCK_PCT, score: quizPct }, `Quiz >${GuidedProjectsService.UNLOCK_PCT}% (tienes ${quizPct}%)`)}</span>`}
        </div>
      </article>`;
  }

  function _renderGrid(filter = '') {
    if (!$grid) return;
    const needle = filter.trim().toLowerCase();
    const list = _projects.filter(p => {
      if (!needle) return true;
      return [p.title, p.summary, p.quizId, _topicTitle(p), p.difficulty]
        .join(' ').toLowerCase().includes(needle);
    });

    if (!list.length) {
      $grid.innerHTML = `<p class="gp-empty">${_t('guided.empty', null, 'No hay proyectos que coincidan.')}</p>`;
      return;
    }

    $grid.innerHTML = list.map(_renderCard).join('');
    $grid.querySelectorAll('.gp-card').forEach(card => {
      const open = () => {
        const id = card.dataset.projectId;
        const project = _projects.find(p => p.id === id);
        if (!project) return;
        if (!_isUnlocked(project)) {
          if (typeof AppShell !== 'undefined') {
            AppShell.showToast(_t('guided.lockedToast', {
              topic: _topicTitle(project),
              pct: GuidedProjectsService.UNLOCK_PCT,
            }, `Necesitas >${GuidedProjectsService.UNLOCK_PCT}% en el quiz de ${_topicTitle(project)}.`));
          }
          return;
        }
        _openProject(project);
      };
      card.addEventListener('click', e => {
        if (e.target.closest('[data-action="open"]') || e.target === card) open();
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    });
  }

  function _openProject(project) {
    _current = project;
    const prog = GuidedProjectsService.getProgress(project.id);
    if (!prog.startedAt) GuidedProjectsService.saveProgress(project.id, {});
    _stepIndex = Math.min(prog.currentStep || 0, project.steps.length - 1);
    _showStepView();
    _renderStep();
    if (typeof ShareService !== 'undefined') {
      ShareService.setContext({
        page: 'guided-projects.html',
        params: { project: project.id },
        title: project.title,
      });
    }
  }

  function _renderStepNav() {
    if (!$stepList || !_current) return;
    const prog = GuidedProjectsService.getProgress(_current.id);
    $stepList.innerHTML = _current.steps.map((step, i) => {
      const done = Boolean(prog.completedSteps?.[step.id]);
      const active = i === _stepIndex;
      return `
        <button type="button" class="gp-stepnav__item ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}"
                data-step-index="${i}">
          <span class="gp-stepnav__num">${i + 1}</span>
          <span class="gp-stepnav__label">${_escape(step.title)}</span>
        </button>`;
    }).join('');

    $stepList.querySelectorAll('[data-step-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        _persistWorkspace();
        _stepIndex = parseInt(btn.dataset.stepIndex, 10);
        GuidedProjectsService.setCurrentStep(_current.id, _stepIndex);
        _renderStep();
      });
    });
  }

  function _renderStep() {
    if (!_current) return;
    const step = _current.steps[_stepIndex];
    const total = _current.steps.length;
    const prog = GuidedProjectsService.getProgress(_current.id);
    const pct = GuidedProjectsService.getCompletionPct(_current.id, total);

    $stepTitle.textContent = _current.title;
    $stepMeta.textContent = _t('guided.stepOf', {
      n: _stepIndex + 1,
      total,
      title: step.title,
    }, `Paso ${_stepIndex + 1} de ${total}: ${step.title}`);
    $stepProgLabel.textContent = `${pct}%`;
    $stepProgressFill.style.width = `${pct}%`;

    $instructions.textContent = step.instructions;
    if (step.hint) {
      $hint.hidden = false;
      $hint.textContent = step.hint;
    } else {
      $hint.hidden = true;
      $hint.textContent = '';
    }

    $workspace.value = prog.responses?.[step.id] || '';
    $workspace.placeholder = step.placeholder || _t('guided.workspacePlaceholder', null, 'Escribe tu respuesta o código aquí…');
    $workspace.setAttribute('aria-label', step.workspaceType === 'code'
      ? _t('guided.workspaceCode', null, 'Área de código')
      : _t('guided.workspaceText', null, 'Área de respuesta'));

    $btnPrev.disabled = _stepIndex <= 0;
    $btnNext.disabled = _stepIndex >= total - 1;
    $btnComplete.textContent = prog.completedSteps?.[step.id]
      ? _t('guided.completedStep', null, 'Paso completado')
      : _t('guided.completeStep', null, 'Marcar paso como hecho');

    _renderStepNav();
    $workspace.focus();
  }

  function _persistWorkspace() {
    if (!_current) return;
    const step = _current.steps[_stepIndex];
    GuidedProjectsService.saveStepResponse(_current.id, step.id, $workspace.value);
  }

  function _completeCurrentStep() {
    if (!_current) return;
    _persistWorkspace();
    const step = _current.steps[_stepIndex];
    if (!$workspace.value.trim()) {
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(_t('guided.needResponse', null, 'Escribe tu respuesta antes de marcar el paso.'));
      }
      return;
    }
    GuidedProjectsService.completeStep(_current.id, step.id, _stepIndex, _current.steps.length);
    const prog = GuidedProjectsService.getProgress(_current.id);
    const done = Object.keys(prog.completedSteps || {}).length;
    if (done >= _current.steps.length && typeof AppShell !== 'undefined') {
      AppShell.showToast(_t('guided.projectDone', null, '¡Proyecto completado!'));
    }
    if (_stepIndex < _current.steps.length - 1) {
      _stepIndex += 1;
      GuidedProjectsService.setCurrentStep(_current.id, _stepIndex);
    }
    _renderStep();
  }

  async function _loadScores() {
    _quizScores = {};
    const ids = [...new Set(_projects.map(p => p.quizId))];
    await Promise.all(ids.map(async id => {
      _quizScores[id] = await GuidedProjectsService.getQuizBestPctAsync(id);
    }));
  }

  function _bind() {
    $search?.addEventListener('input', () => _renderGrid($search.value));
    $backBtn?.addEventListener('click', () => {
      _persistWorkspace();
      _showList();
      _renderGrid($search?.value || '');
    });
    $btnSave?.addEventListener('click', () => {
      _persistWorkspace();
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(_t('guided.saved', null, 'Progreso guardado'));
      }
    });
    $btnComplete?.addEventListener('click', _completeCurrentStep);
    $btnPrev?.addEventListener('click', () => {
      if (_stepIndex <= 0) return;
      _persistWorkspace();
      _stepIndex -= 1;
      GuidedProjectsService.setCurrentStep(_current.id, _stepIndex);
      _renderStep();
    });
    $btnNext?.addEventListener('click', () => {
      if (!_current || _stepIndex >= _current.steps.length - 1) return;
      _persistWorkspace();
      _stepIndex += 1;
      GuidedProjectsService.setCurrentStep(_current.id, _stepIndex);
      _renderStep();
    });

    // Autoguardado suave al escribir.
    let saveTimer = 0;
    $workspace?.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(_persistWorkspace, 600);
    });

    window.addEventListener('in4mind-locale-change', () => {
      _renderGrid($search?.value || '');
      if (_current) _renderStep();
    });
  }

  async function init() {
    $listView = document.getElementById('gp-list-view');
    $stepView = document.getElementById('gp-step-view');
    $grid = document.getElementById('gp-grid');
    $search = document.getElementById('gp-search');
    $backBtn = document.getElementById('gp-back');
    $stepTitle = document.getElementById('gp-step-title');
    $stepMeta = document.getElementById('gp-step-meta');
    $stepProgressFill = document.getElementById('gp-step-progress-fill');
    $stepProgLabel = document.getElementById('gp-step-prog-label');
    $stepList = document.getElementById('gp-step-list');
    $instructions = document.getElementById('gp-instructions');
    $hint = document.getElementById('gp-hint');
    $workspace = document.getElementById('gp-workspace');
    $btnSave = document.getElementById('gp-btn-save');
    $btnComplete = document.getElementById('gp-btn-complete');
    $btnPrev = document.getElementById('gp-btn-prev');
    $btnNext = document.getElementById('gp-btn-next');
    $lockBanner = document.getElementById('gp-lock-banner');

    if (!$grid || typeof GuidedProjectsData === 'undefined') return;

    _projects = GuidedProjectsData.getAll();
    _bind();
    await _loadScores();
    _renderGrid();
    _showList();

    // Deep link ?project=id
    try {
      const id = new URLSearchParams(window.location.search).get('project');
      const project = id ? _projects.find(p => p.id === id) : null;
      if (project && _isUnlocked(project)) {
        _openProject(project);
      } else if (project && $lockBanner) {
        $lockBanner.hidden = false;
        $lockBanner.textContent = _t('guided.lockedToast', {
          topic: _topicTitle(project),
          pct: GuidedProjectsService.UNLOCK_PCT,
        }, `Necesitas >${GuidedProjectsService.UNLOCK_PCT}% en el quiz de ${_topicTitle(project)}.`);
      }
    } catch { /* ignore */ }
  }

  return { init };

})();

if (typeof module !== 'undefined') module.exports = GuidedProjectsController;
