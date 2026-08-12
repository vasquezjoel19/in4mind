/**
 * IN4MIND — GuidedProjectsService
 *
 * Progreso de proyectos guiados en localStorage (por usuario) y regla de
 * desbloqueo: el quiz del tema debe superar el 80 % (bestPct > 80).
 */

'use strict';

const GuidedProjectsService = (() => {

  const KEY = 'in4mind_guided_projects';
  const UNLOCK_PCT = (typeof GuidedProjectsData !== 'undefined' && GuidedProjectsData.UNLOCK_PCT) || 80;

  function _userSuffix() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const email = raw ? (JSON.parse(raw).email || '') : '';
      return email.toLowerCase() || 'guest';
    } catch {
      return 'guest';
    }
  }

  function _scopedKey() {
    return `${KEY}:${_userSuffix()}`;
  }

  function _readAll() {
    try {
      const parsed = JSON.parse(localStorage.getItem(_scopedKey()) || '{}');
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeAll(map) {
    try {
      localStorage.setItem(_scopedKey(), JSON.stringify(map));
      _scheduleCloudPush();
      return true;
    } catch {
      return false;
    }
  }

  let _pushTimer = null;
  function _scheduleCloudPush() {
    if (typeof CloudBlobSync === 'undefined') return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => {
      void CloudBlobSync.pushBlob('guided', _readAll());
    }, 450);
  }

  async function hydrateFromCloud() {
    if (typeof CloudBlobSync === 'undefined') return false;
    const remote = await CloudBlobSync.pullBlob('guided');
    if (!remote?.blob) return false;
    const merged = CloudBlobSync.mergeMaps(_readAll(), remote.blob || {});
    try {
      localStorage.setItem(_scopedKey(), JSON.stringify(merged));
      return true;
    } catch {
      return false;
    }
  }

  function _emptyProgress(projectId) {
    return {
      projectId,
      currentStep: 0,
      completedSteps: {},
      responses: {},
      startedAt: null,
      updatedAt: null,
      completedAt: null,
    };
  }

  function getProgress(projectId) {
    const all = _readAll();
    return all[projectId] || _emptyProgress(projectId);
  }

  function getAllProgress() {
    return _readAll();
  }

  function saveProgress(projectId, patch) {
    const all = _readAll();
    const prev = all[projectId] || _emptyProgress(projectId);
    const next = {
      ...prev,
      ...patch,
      projectId,
      completedSteps: patch.completedSteps || prev.completedSteps || {},
      responses: patch.responses || prev.responses || {},
      updatedAt: Date.now(),
      startedAt: prev.startedAt || Date.now(),
    };
    all[projectId] = next;
    _writeAll(all);
    return next;
  }

  function saveStepResponse(projectId, stepId, text) {
    const prev = getProgress(projectId);
    const responses = { ...prev.responses, [stepId]: String(text ?? '') };
    return saveProgress(projectId, { responses });
  }

  function completeStep(projectId, stepId, stepIndex, totalSteps) {
    const prev = getProgress(projectId);
    const completedSteps = { ...prev.completedSteps, [stepId]: true };
    const doneCount = Object.keys(completedSteps).length;
    const nextIndex = Math.min(Math.max(stepIndex + 1, prev.currentStep), Math.max(totalSteps - 1, 0));
    const finished = doneCount >= totalSteps;
    return saveProgress(projectId, {
      completedSteps,
      currentStep: finished ? totalSteps - 1 : nextIndex,
      completedAt: finished ? (prev.completedAt || Date.now()) : null,
    });
  }

  function setCurrentStep(projectId, stepIndex) {
    return saveProgress(projectId, { currentStep: Math.max(0, stepIndex) });
  }

  function getCompletionPct(projectId, totalSteps) {
    if (!totalSteps) return 0;
    const prog = getProgress(projectId);
    const done = Object.keys(prog.completedSteps || {}).length;
    return Math.round((done / totalSteps) * 100);
  }

  /**
   * Mejor porcentaje conocido del quiz (espejo local + caché de perfil).
   * @returns {number}
   */
  function getQuizBestPct(quizId) {
    if (!quizId) return 0;
    let best = 0;

    if (typeof UserProfileService !== 'undefined') {
      try {
        // getQuizProgress es async; usamos el resultado si ya está cacheado vía llamada sync previa.
        // También leemos el espejo local del servicio si expone progreso sincronizado.
        const sync = UserProfileService.getStatsSync?.();
        void sync;
      } catch { /* ignore */ }
    }

    try {
      const keySuffix = (() => {
        try {
          const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
          const email = raw ? (JSON.parse(raw).email || '') : '';
          return email.toLowerCase() || 'guest';
        } catch {
          return 'guest';
        }
      })();
      const local = JSON.parse(localStorage.getItem(`in4mind_quiz_results_${keySuffix}`) || '{}');
      const row = local[quizId];
      if (row) best = Math.max(best, row.bestPct || row.pct || 0);
    } catch { /* ignore */ }

    if (typeof QuizProgressService !== 'undefined') {
      const attempt = QuizProgressService.get(quizId);
      if (attempt?.completed) best = Math.max(best, attempt.scorePct || 0);
    }

    return best;
  }

  /** @returns {Promise<number>} */
  async function getQuizBestPctAsync(quizId) {
    let best = getQuizBestPct(quizId);
    if (typeof UserProfileService !== 'undefined' && UserProfileService.getQuizProgress) {
      try {
        const map = await UserProfileService.getQuizProgress();
        const row = map?.[quizId];
        if (row) best = Math.max(best, row.bestPct || row.pct || 0);
      } catch { /* local basta */ }
    }
    return best;
  }

  /** Desbloqueo estricto: puntaje > 80. */
  function isUnlockedSync(quizId) {
    return getQuizBestPct(quizId) > UNLOCK_PCT;
  }

  async function isUnlocked(quizId) {
    return (await getQuizBestPctAsync(quizId)) > UNLOCK_PCT;
  }

  return {
    UNLOCK_PCT,
    getProgress,
    getAllProgress,
    saveProgress,
    saveStepResponse,
    completeStep,
    setCurrentStep,
    getCompletionPct,
    getQuizBestPct,
    getQuizBestPctAsync,
    isUnlockedSync,
    isUnlocked,
    hydrateFromCloud,
  };

})();

if (typeof module !== 'undefined') module.exports = GuidedProjectsService;
