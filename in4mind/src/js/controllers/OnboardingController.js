/**
 * IN4MIND — Post-signup onboarding UI (goal → first lesson).
 */
'use strict';

const OnboardingController = (() => {
  let _selected = null;
  let _finishing = false;
  let $step1;
  let $step2;
  let $goals;
  let $stepLabel;
  let $assignTitle;
  let $assignBody;
  let $startBtn;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _icon(name) {
    const icons = {
      code: '<path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/>',
      git: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
      globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/>',
      palette: '<circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/>',
      chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 4 3 5-7"/>',
      briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.code}</svg>`;
  }

  function _showStep(n) {
    if ($step1) $step1.hidden = n !== 1;
    if ($step2) $step2.hidden = n !== 2;
    if ($stepLabel) {
      $stepLabel.textContent = _t('signupOnboard.step', { n, total: 2 }, `Paso ${n} de 2`);
    }
  }

  function _renderGoals() {
    if (!$goals || typeof OnboardingService === 'undefined') return;
    const goals = OnboardingService.getGoals();
    const featured = goals.filter((g) => g.featured || g.careerPathId);
    const other = goals.filter((g) => !(g.featured || g.careerPathId));

    const card = (g, featuredClass = '') => `
      <button type="button" class="ob-goal ${featuredClass}" data-goal="${g.id}" aria-pressed="false">
        <span class="ob-goal__icon">${_icon(g.icon)}</span>
        <span class="ob-goal__text">
          <span class="ob-goal__title">${g.title}</span>
          <span class="ob-goal__desc">${g.desc}</span>
        </span>
      </button>`;

    $goals.innerHTML = `
      <p class="ob-goals__label">${_t('signupOnboard.tracksLabel', null, 'Elige tu Ruta Empleable')}</p>
      <div class="ob-goals__grid ob-goals__grid--featured" role="list">
        ${featured.map((g) => card(g, 'ob-goal--featured')).join('')}
      </div>
      ${other.length ? `
        <p class="ob-goals__label ob-goals__label--muted">${_t('signupOnboard.otherLabel', null, 'Otras opciones')}</p>
        <div class="ob-goals__grid" role="list">${other.map((g) => card(g)).join('')}</div>` : ''}`;

    $goals.querySelectorAll('.ob-goal').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (_finishing) return;
        _selected = btn.getAttribute('data-goal');
        $goals.querySelectorAll('.ob-goal').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('ob-goal--selected', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        void _goToStep2();
      });
    });
  }

  function _finishRedirect(fallbackHref) {
    let dest = fallbackHref || 'dashboard.html';
    if (typeof AuthGuard !== 'undefined' && AuthGuard.consumePendingRedirect) {
      const pending = AuthGuard.consumePendingRedirect();
      if (pending) dest = pending;
    }
    window.location.replace(dest);
  }

  async function _goToStep2() {
    if (!_selected || _finishing || typeof OnboardingService === 'undefined') return;
    _finishing = true;
    const goal = OnboardingService.getGoalById(_selected);
    if (!goal) {
      _finishing = false;
      return;
    }

    _showStep(2);

    const courseKey = `courses.${goal.courseId}.title`;
    let courseName = goal.title;
    if (typeof I18n !== 'undefined') {
      const localized = I18n.t(courseKey);
      if (localized && localized !== courseKey) courseName = localized;
    }

    if ($assignTitle) {
      $assignTitle.textContent = _t(
        'signupOnboard.assignTitle',
        { course: courseName },
        `Tu primer curso: ${courseName}`
      );
    }
    if ($assignBody) {
      const pending = typeof AuthGuard !== 'undefined' && AuthGuard.peekPendingRedirect
        ? AuthGuard.peekPendingRedirect()
        : null;
      $assignBody.textContent = pending
        ? _t(
          'signupOnboard.assignBodyResume',
          null,
          'Guardamos tu enlace. Al terminar te llevamos a donde ibas.'
        )
        : _t(
          'signupOnboard.assignBody',
          null,
          'Te llevamos a la Lección 1 para empezar ahora.'
        );
    }
    if ($startBtn) {
      $startBtn.disabled = true;
      $startBtn.textContent = _t('signupOnboard.starting', null, 'Abriendo lección…');
    }

    const result = await OnboardingService.completeWithGoal(_selected);
    window.setTimeout(() => {
      _finishRedirect(result.href || 'dashboard.html');
    }, 650);
  }

  async function init() {
    const page = document.getElementById('ob-page');
    if (page) page.classList.add('ob-booting');

    // Persist ?next= from shared links into durable storage
    if (typeof AuthGuard !== 'undefined' && AuthGuard.stashPendingRedirect) {
      const q = new URLSearchParams(window.location.search).get('next');
      if (q) AuthGuard.stashPendingRedirect(q);
    }

    if (typeof AuthGuard !== 'undefined') {
      const ok = await AuthGuard.requireAsync();
      if (!ok) return;
    } else if (!sessionStorage.getItem('in4mind_user')) {
      window.location.replace('login.html?next=dashboard.html');
      return;
    }

    if (typeof OnboardingService !== 'undefined') {
      await OnboardingService.hydrateFromCloud();
      if (OnboardingService.isCompleted()) {
        _finishRedirect('dashboard.html');
        return;
      }
    }

    $step1 = document.getElementById('ob-step-1');
    $step2 = document.getElementById('ob-step-2');
    $goals = document.getElementById('ob-goals');
    $stepLabel = document.getElementById('ob-step-label');
    $assignTitle = document.getElementById('ob-assign-title');
    $assignBody = document.getElementById('ob-assign-body');
    $startBtn = document.getElementById('ob-start-btn');

    const skip = document.getElementById('ob-skip');
    if (skip) {
      skip.addEventListener('click', (e) => {
        e.preventDefault();
        void (async () => {
          if (typeof OnboardingService !== 'undefined' && OnboardingService.finishWithoutGoal) {
            await OnboardingService.finishWithoutGoal();
          } else if (typeof OnboardingService !== 'undefined') {
            OnboardingService.markCompleted();
          }
          _finishRedirect('dashboard.html');
        })();
      });
    }

    if ($startBtn) {
      $startBtn.addEventListener('click', () => {
        if (!_selected) return;
        void _goToStep2();
      });
    }

    _renderGoals();
    _showStep(1);

    if (typeof I18n !== 'undefined' && I18n.apply) I18n.apply(document);

    if (page) {
      page.classList.remove('ob-booting');
      page.classList.add('ob-ready');
    }

    window.addEventListener('in4mind-relocalize', () => {
      if (typeof I18n !== 'undefined' && I18n.apply) I18n.apply(document);
      const kept = _selected;
      if ($step1 && !$step1.hidden) {
        _renderGoals();
        if (kept) {
          _selected = kept;
          $goals?.querySelectorAll('.ob-goal').forEach((b) => {
            const on = b.getAttribute('data-goal') === kept;
            b.classList.toggle('ob-goal--selected', on);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
        }
        _showStep(1);
      } else if ($step2 && !$step2.hidden && kept && !_finishing) {
        const goal = typeof OnboardingService !== 'undefined'
          ? OnboardingService.getGoalById(kept)
          : null;
        const courseKey = goal ? `courses.${goal.courseId}.title` : '';
        let courseName = goal?.title || '';
        if (goal && typeof I18n !== 'undefined') {
          const localized = I18n.t(courseKey);
          if (localized && localized !== courseKey) courseName = localized;
        }
        if ($assignTitle) {
          $assignTitle.textContent = _t(
            'signupOnboard.assignTitle',
            { course: courseName },
            `Tu primer curso: ${courseName}`
          );
        }
        if ($assignBody) {
          $assignBody.textContent = _t(
            'signupOnboard.assignBody',
            null,
            'Te llevamos a la Lección 1 para empezar ahora.'
          );
        }
        _showStep(2);
      }
    });
  }

  return { init };
})();

if (typeof module !== 'undefined') module.exports = OnboardingController;
