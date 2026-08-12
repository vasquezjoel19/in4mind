/**
 * IN4MIND — Tarjeta semanal de progreso para compartir.
 */
'use strict';

const WeeklyShareService = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _userName() {
    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    return user?.name?.trim() || user?.email?.split('@')[0] || 'Estudiante';
  }

  function buildCardHtml() {
    const g = typeof GamificationService !== 'undefined'
      ? GamificationService.getSummary()
      : { streak: 0, weekly: { lessons: 0, lessonGoal: 2, quizzes: 0, quizGoal: 1 }, xp: 0, level: 1 };
    const due = typeof SpacedRepetitionService !== 'undefined'
      ? SpacedRepetitionService.getDueCount()
      : 0;
    const name = _userName();
    const weekLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return `
      <div class="weekly-share-card" id="weekly-share-print">
        <p class="weekly-share-card__eyebrow">IN4MIND · ${_t('share.weeklyEyebrow', null, 'Resumen semanal')}</p>
        <h2 class="weekly-share-card__title">${name}</h2>
        <p class="weekly-share-card__sub">${_t('share.weeklySub', { date: weekLabel }, `Semana del ${weekLabel}`)}</p>
        <div class="weekly-share-card__grid">
          <div><strong>${g.streak}</strong><span>${_t('analytics.streak', null, 'Racha')}</span></div>
          <div><strong>${g.weekly.lessons}/${g.weekly.lessonGoal}</strong><span>${_t('analytics.weeklyLessons', null, 'Lecciones')}</span></div>
          <div><strong>${g.weekly.quizzes}/${g.weekly.quizGoal}</strong><span>${_t('analytics.weeklyQuizzes', null, 'Quizzes')}</span></div>
          <div><strong>Nv.${g.level}</strong><span>${g.xp} XP</span></div>
        </div>
        ${due > 0 ? `<p class="weekly-share-card__due">${_t('share.dueTopics', { n: due }, `${due} temas por repasar`)}</p>` : ''}
        <p class="weekly-share-card__footer">in4mind.app</p>
      </div>`;
  }

  function buildShareText() {
    const g = typeof GamificationService !== 'undefined'
      ? GamificationService.getSummary()
      : { streak: 0, weekly: { lessons: 0, lessonGoal: 2, quizzes: 0, quizGoal: 1 }, level: 1, xp: 0 };
    return _t('share.weeklyText', {
      streak: g.streak,
      lessons: g.weekly.lessons,
      quizzes: g.weekly.quizzes,
      level: g.level,
    }, `Esta semana en IN4MIND: racha ${g.streak} días · ${g.weekly.lessons} lecciones · ${g.weekly.quizzes} quizzes · nivel ${g.level}. #IN4MIND`);
  }

  function openModal() {
    let overlay = document.getElementById('weekly-share-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'weekly-share-overlay';
      overlay.className = 'cert-share-overlay';
      overlay.innerHTML = `
        <div class="cert-share-modal" role="dialog" aria-modal="true">
          <button type="button" class="cert-share-modal__close" id="weekly-share-close" aria-label="Cerrar">&times;</button>
          <div id="weekly-share-body"></div>
          <div class="cert-share-modal__actions">
            <button type="button" class="prof-btn" id="weekly-share-print-btn">${_t('share.print', null, 'Imprimir / PDF')}</button>
            <button type="button" class="prof-btn prof-btn--primary" id="weekly-share-copy">${_t('share.copyText', null, 'Copiar texto')}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.hidden = true; });
      document.getElementById('weekly-share-close')?.addEventListener('click', () => { overlay.hidden = true; });
    }

    const body = document.getElementById('weekly-share-body');
    if (body) body.innerHTML = buildCardHtml();
    overlay.hidden = false;

    const printBtn = document.getElementById('weekly-share-print-btn');
    const copyBtn = document.getElementById('weekly-share-copy');
    if (printBtn) printBtn.onclick = () => {
      const card = document.getElementById('weekly-share-print');
      if (!card) return;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<html><head><title>IN4MIND</title><style>
        body{font-family:system-ui,sans-serif;padding:40px;background:#f4f6fb}
        .weekly-share-card{background:#1b273c;color:#fff;border-radius:20px;padding:28px;max-width:420px;margin:auto}
        .weekly-share-card__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:18px 0}
        .weekly-share-card__grid div{background:rgba(255,255,255,.08);border-radius:12px;padding:12px;text-align:center}
        .weekly-share-card__grid strong{display:block;font-size:1.4rem}
        .weekly-share-card__grid span{font-size:.75rem;opacity:.8}
      </style></head><body>${card.outerHTML}</body></html>`);
      w.document.close();
      w.focus();
      w.print();
    };
    if (copyBtn) copyBtn.onclick = async () => {
      const text = buildShareText();
      try {
        await navigator.clipboard.writeText(text);
        if (typeof AppShell !== 'undefined') AppShell.showToast(_t('share.copied', null, 'Texto copiado'));
      } catch {
        if (typeof ShareService !== 'undefined') ShareService.share({ title: 'IN4MIND', text });
      }
    };
  }

  return { openModal, buildCardHtml, buildShareText };
})();

if (typeof module !== 'undefined') module.exports = WeeklyShareService;
