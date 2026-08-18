/**
 * IN4MIND — Ruta Empleable: progreso de portfolio (proyecto + cert + pitch).
 * Local-first + sync a Supabase employability_progress (por path_id).
 */
'use strict';

const EmployabilityService = (() => {

  const STORAGE_KEY = 'in4mind_employability_v1';
  const NUDGE_KEY = 'in4mind_employable_nudge_v1';
  const TRUSTED_HOST_HINTS = [
    'github.com', 'github.io', 'gitlab.com', 'bitbucket.org',
    'vercel.app', 'netlify.app', 'pages.dev',
    'powerbi.com', 'app.powerbi.com',
    'sharepoint.com', 'apps.powerapps.com', 'make.powerautomate.com',
    'lookerstudio.google.com', 'datastudio.google.com',
    'replit.app', 'glitch.me', 'codesandbox.io', 'stackblitz.io',
  ];

  function _t(key, params, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback ?? '';
  }

  function _sb() {
    return typeof _sbClient !== 'undefined' ? _sbClient : null;
  }

  async function _userId() {
    if (typeof UserProfileService !== 'undefined' && UserProfileService.getCurrentUserId) {
      return UserProfileService.getCurrentUserId();
    }
    const sb = _sb();
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getUser();
      return data?.user?.id || null;
    } catch {
      return null;
    }
  }

  function _emptyState() {
    return {
      activePathId: null,
      updatedAt: 0,
      paths: {},
    };
  }

  function _emptyPathRecord(pathId) {
    return {
      pathId,
      projectUrl: '',
      projectSubmittedAt: 0,
      certCode: '',
      certIssuedAt: 0,
      pitch: null,
      pitchGeneratedAt: 0,
      projectReview: null,
      updatedAt: 0,
    };
  }

  function _read() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return _emptyState();
      if (!raw.paths) raw.paths = {};
      return raw;
    } catch {
      return _emptyState();
    }
  }

  function _rowPayload(pathId, rec) {
    const pitch = rec.pitch || {};
    const cvPitch = Array.isArray(pitch.cvBullets)
      ? pitch.cvBullets.map((b) => `• ${b}`).join('\n')
      : '';
    return {
      path_id: pathId,
      project_url: rec.projectUrl || null,
      cv_pitch: cvPitch || null,
      linkedin_summary: pitch.linkedinSummary || pitch.linkedinHeadline || null,
      completed_steps: {
        hasProject: Boolean(rec.projectUrl && rec.projectSubmittedAt),
        hasCert: Boolean(rec.certCode),
        hasPitch: Boolean(rec.pitch),
        certCode: rec.certCode || '',
        pitch,
        projectReview: rec.projectReview || null,
        projectSubmittedAt: rec.projectSubmittedAt || 0,
        certIssuedAt: rec.certIssuedAt || 0,
        pitchGeneratedAt: rec.pitchGeneratedAt || 0,
      },
      updated_at: new Date(rec.updatedAt || Date.now()).toISOString(),
    };
  }

  async function _syncPathToCloud(pathId, rec) {
    const sb = _sb();
    const userId = await _userId();
    if (!sb || !userId || !pathId) return;
    try {
      const payload = {
        user_id: userId,
        ..._rowPayload(pathId, rec),
      };
      await sb.from('employability_progress').upsert(payload, { onConflict: 'user_id,path_id' });
    } catch {
      /* local-first: ignore cloud errors */
    }
  }

  function _write(state) {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const active = state.activePathId;
    if (active && state.paths[active]) {
      void _syncPathToCloud(active, state.paths[active]);
    }
    Object.keys(state.paths || {}).forEach((pid) => {
      if (pid !== active) void _syncPathToCloud(pid, state.paths[pid]);
    });
    return state;
  }

  function _pathRec(state, pathId) {
    if (!state.paths[pathId]) state.paths[pathId] = _emptyPathRecord(pathId);
    return state.paths[pathId];
  }

  function getState() {
    return _read();
  }

  function setActivePath(pathId) {
    const state = _read();
    state.activePathId = pathId || null;
    _pathRec(state, pathId);
    return _write(state);
  }

  function getActivePathId() {
    const state = _read();
    if (state.activePathId) return state.activePathId;
    return typeof CareerPathsData !== 'undefined'
      ? (CareerPathsData.getPaths()?.[0]?.id || null)
      : null;
  }

  function getPathRecord(pathId) {
    const id = pathId || getActivePathId();
    if (!id) return _emptyPathRecord('unknown');
    return { ..._pathRec(_read(), id) };
  }

  function _isValidUrl(url) {
    try {
      const u = new URL(String(url || '').trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /** Soft hint: known public hosting domains. Never blocks submit. */
  function getUrlTrustHint(url) {
    if (!_isValidUrl(url)) {
      return {
        ok: false,
        trusted: false,
        warning: _t('employable.invalidUrl', null, 'URL inválida. Usa http:// o https://'),
      };
    }
    try {
      const host = new URL(String(url).trim()).hostname.toLowerCase();
      const trusted = TRUSTED_HOST_HINTS.some((h) => host === h || host.endsWith(`.${h}`));
      return {
        ok: true,
        trusted,
        warning: trusted
          ? ''
          : _t('employable.urlSoftWarn', null, 'Asegúrate de que sea un enlace público válido.'),
      };
    } catch {
      return {
        ok: false,
        trusted: false,
        warning: _t('employable.invalidUrl', null, 'URL inválida. Usa http:// o https://'),
      };
    }
  }

  function _learningPct(path, quizProgress = {}, certifications = []) {
    if (!path || typeof LearningPathService === 'undefined') return 0;
    const fake = { courseIds: path.courseIds || [] };
    const prog = LearningPathService.getPathProgress(fake, quizProgress, certifications);
    return prog?.pct || 0;
  }

  function _buildChecklist(rec, learningPct) {
    const lessonsDone = learningPct >= 70;
    const projectBuilt = lessonsDone; // proxy: learning done implies project work stage
    return [
      {
        id: 'lessons',
        label: _t('employable.checklist.lessons', null, 'Completar lecciones'),
        done: lessonsDone,
      },
      {
        id: 'build',
        label: _t('employable.checklist.build', null, 'Crear proyecto'),
        done: projectBuilt || Boolean(rec.projectUrl),
      },
      {
        id: 'link',
        label: _t('employable.checklist.link', null, 'Pegar enlace'),
        done: Boolean(rec.projectUrl && rec.projectSubmittedAt),
      },
      {
        id: 'cert',
        label: _t('employable.checklist.cert', null, 'Descargar certificado'),
        done: Boolean(rec.certCode),
      },
      {
        id: 'cv',
        label: _t('employable.checklist.cv', null, 'Generar CV'),
        done: Boolean(rec.pitch),
      },
    ];
  }

  function getChecklist(pathId, opts = {}) {
    return getPortfolioProgress(pathId, opts).checklist;
  }

  /**
   * Portfolio progress toward 3 job-ready deliverables.
   */
  function getPortfolioProgress(pathId, opts = {}) {
    const id = pathId || getActivePathId();
    const path = typeof CareerPathsData !== 'undefined' ? CareerPathsData.getPathById(id) : null;
    const rec = getPathRecord(id);
    const quizProgress = opts.quizProgress || {};
    const certifications = opts.certifications || [];
    const learningPct = _learningPct(path, quizProgress, certifications);

    const hasProject = Boolean(rec.projectUrl && rec.projectSubmittedAt);
    const hasCert = Boolean(rec.certCode && rec.certIssuedAt);
    const hasPitch = Boolean(rec.pitch && rec.pitchGeneratedAt);

    const deliverables = [
      {
        id: 'project',
        done: hasProject,
        label: _t('employable.deliverable.project', null, 'Proyecto real'),
        detail: hasProject ? rec.projectUrl : _t('employable.deliverable.projectHint', null, 'Envía la URL de tu proyecto final'),
      },
      {
        id: 'certificate',
        done: hasCert,
        label: _t('employable.deliverable.certificate', null, 'Certificado verificable'),
        detail: hasCert
          ? (typeof CertVerificationService !== 'undefined'
            ? CertVerificationService.verifyUrl(rec.certCode)
            : rec.certCode)
          : _t('employable.deliverable.certHint', null, 'Se emite al validar el proyecto'),
      },
      {
        id: 'pitch',
        done: hasPitch,
        label: _t('employable.deliverable.pitch', null, 'Pitch / CV / entrevista'),
        detail: hasPitch
          ? _t('employable.deliverable.pitchReady', null, 'Perfil listo para aplicar')
          : _t('employable.deliverable.pitchHint', null, 'Genera tu pitch con IA'),
      },
    ];

    const doneCount = deliverables.filter((d) => d.done).length;
    const learningShare = Math.round(Math.min(learningPct, 70) * 0.5);
    const deliverableShare = Math.round((doneCount / 3) * 65);
    let portfolioPct = Math.min(100, learningShare + deliverableShare);
    if (doneCount < 3) portfolioPct = Math.min(portfolioPct, 99);
    if (doneCount === 3 && learningPct >= 40) portfolioPct = 100;

    const isComplete = doneCount === 3;
    const isLearningOnlyComplete = learningPct >= 95 && !hasProject;

    let nextAction = 'lessons';
    if (!hasProject && learningPct >= 70) nextAction = 'project';
    else if (hasProject && !hasCert) nextAction = 'certificate';
    else if (hasCert && !hasPitch) nextAction = 'pitch';
    else if (isComplete) nextAction = 'done';
    else if (learningPct < 70) nextAction = 'lessons';

    return {
      pathId: id,
      path,
      learningPct,
      portfolioPct,
      deliverables,
      doneCount,
      isComplete,
      isLearningOnlyComplete,
      record: rec,
      checklist: _buildChecklist(rec, learningPct),
      nextAction,
      next: !hasProject
        ? 'project'
        : !hasCert
          ? 'certificate'
          : !hasPitch
            ? 'pitch'
            : 'done',
    };
  }

  function getNextCareerStep(opts = {}) {
    const paths = typeof CareerPathsData !== 'undefined' ? CareerPathsData.getPaths() : [];
    const activeId = getActivePathId() || paths[0]?.id;
    if (!activeId) return null;
    const progress = getPortfolioProgress(activeId, opts);
    const title = progress.path?.title || activeId;
    const map = {
      lessons: {
        cta: _t('employable.next.lessons', { path: title }, `Continúa las lecciones de ${title}`),
        route: progress.path?.courseIds?.[0]
          ? `tutorial.html?course=${encodeURIComponent(progress.path.courseIds[0])}`
          : 'dashboard.html#employable-root',
      },
      project: {
        cta: _t('employable.next.project', { path: title }, `Envía tu proyecto ${title}`),
        route: 'dashboard.html#employable-root',
        openModal: true,
      },
      certificate: {
        cta: _t('employable.next.cert', { path: title }, `Abre tu certificado ${title}`),
        route: progress.record.certCode && typeof CertVerificationService !== 'undefined'
          ? CertVerificationService.verifyUrl(progress.record.certCode)
          : 'dashboard.html#employable-root',
        openModal: !progress.record.certCode,
      },
      pitch: {
        cta: _t('employable.next.pitch', { path: title }, `Genera tu CV / pitch de ${title}`),
        route: 'dashboard.html#employable-root',
        openModal: true,
      },
      done: {
        cta: _t('employable.next.done', { path: title }, `Ver portfolio de ${title}`),
        route: 'portfolio-public.html',
      },
    };
    const step = map[progress.nextAction] || map.project;
    return {
      pathId: activeId,
      pathTitle: title,
      nextAction: progress.nextAction,
      portfolioPct: progress.portfolioPct,
      ...step,
    };
  }

  function submitProject(pathId, url) {
    const trimmed = String(url || '').trim();
    if (!_isValidUrl(trimmed)) {
      return { ok: false, error: _t('employable.invalidUrl', null, 'URL inválida. Usa http:// o https://') };
    }
    const id = pathId || getActivePathId();
    if (!id) return { ok: false, error: 'no_path' };

    const hint = getUrlTrustHint(trimmed);
    const state = _read();
    const rec = _pathRec(state, id);
    rec.projectUrl = trimmed;
    rec.projectSubmittedAt = Date.now();
    rec.updatedAt = Date.now();
    _write(state);

    const cert = issueCertificate(id);
    return { ok: true, record: getPathRecord(id), cert, urlHint: hint };
  }

  function issueCertificate(pathId) {
    const id = pathId || getActivePathId();
    const path = typeof CareerPathsData !== 'undefined' ? CareerPathsData.getPathById(id) : null;
    const state = _read();
    const rec = _pathRec(state, id);
    if (!rec.projectUrl) {
      return { ok: false, error: _t('employable.needProjectFirst', null, 'Envía el proyecto antes del certificado') };
    }

    let userName = 'Usuario IN4MIND';
    try {
      const session = typeof SessionStore !== 'undefined' ? SessionStore.restore?.() : null;
      userName = session?.user?.user_metadata?.full_name
        || session?.user?.email
        || session?.email
        || userName;
    } catch { /* ignore */ }

    const certPayload = {
      refId: `employable:${id}`,
      title: path?.title || id,
      type: 'employable',
      earnedAt: Date.now(),
      pct: 100,
      projectUrl: rec.projectUrl,
      pathId: id,
    };

    let code = rec.certCode;
    if (typeof CertVerificationService !== 'undefined') {
      code = CertVerificationService.register(certPayload, userName);
    } else {
      code = `IN4-EMP-${Date.now().toString(36).toUpperCase()}`;
    }

    rec.certCode = code;
    rec.certIssuedAt = Date.now();
    rec.updatedAt = Date.now();
    _write(state);

    if (typeof UserProfileService !== 'undefined' && UserProfileService.tryAwardEmployableCertification) {
      void UserProfileService.tryAwardEmployableCertification(id, {
        refId: `employable:${id}`,
        title: path?.title || id,
        desc: rec.projectUrl
          ? `Proyecto: ${rec.projectUrl}`
          : 'Ruta Empleable — certificado verificable',
        pct: 100,
        projectUrl: rec.projectUrl,
        verifyCode: code,
        earnedAt: rec.certIssuedAt,
      });
    }

    return {
      ok: true,
      code,
      verifyUrl: typeof CertVerificationService !== 'undefined'
        ? CertVerificationService.verifyUrl(code)
        : `verify.html?id=${encodeURIComponent(code)}`,
    };
  }

  function _fallbackPitch(path, projectUrl) {
    const title = path?.title || 'Ruta Empleable';
    return {
      cvBullets: [
        `Completé la ruta ${title} en IN4MIND con proyecto publicable.`,
        `Entregué un entregable real: ${projectUrl}`,
        'Apliqué prácticas de calidad, documentación y verificación de resultados.',
        'Listo para aportar en un rol junior con evidencia demostrable.',
      ],
      linkedinHeadline: `${title} | Portfolio verificable IN4MIND`,
      linkedinSummary: `Acabo de cerrar la ruta ${title} en IN4MIND. No solo estudié: publiqué un proyecto real (${projectUrl}) y obtuve un certificado verificable. Busco mi primera oportunidad junior donde pueda aportar con entrega, claridad y ganas de aprender.`,
      interviewQA: [
        { q: '¿Qué construiste en esta ruta?', a: `Un proyecto real alineado a ${title}, publicado en ${projectUrl}.` },
        { q: '¿Cómo validaste la calidad?', a: 'Con lecciones, quizzes y un entregable público que cualquiera puede revisar.' },
        { q: '¿Qué harías en tu primera semana?', a: 'Entender el stack del equipo, documentar, y proponer una mejora pequeña medible.' },
        { q: '¿Cómo manejas bloqueos?', a: 'Reproduzco el problema, busco evidencia, pido ayuda con contexto y dejo registro.' },
        { q: '¿Por qué IN4MIND?', a: 'Porque me obliga a terminar con evidencia: proyecto, certificado y pitch listos para aplicar.' },
      ],
    };
  }

  function formatPitchPlain(pitch, pathTitle) {
    const p = pitch || {};
    const lines = [
      `IN4MIND — Ruta Empleable${pathTitle ? `: ${pathTitle}` : ''}`,
      '',
      '## CV bullets',
      ...(p.cvBullets || []).map((b) => `- ${b}`),
      '',
      '## LinkedIn headline',
      p.linkedinHeadline || '',
      '',
      '## LinkedIn summary',
      p.linkedinSummary || '',
      '',
      '## Interview Q&A',
      ...(p.interviewQA || []).flatMap((qa, i) => [`${i + 1}. ${qa.q}`, `   ${qa.a}`, '']),
    ];
    return lines.join('\n').trim() + '\n';
  }

  async function generatePitch(pathId) {
    const id = pathId || getActivePathId();
    const path = typeof CareerPathsData !== 'undefined' ? CareerPathsData.getPathById(id) : null;
    const rec = getPathRecord(id);
    if (!rec.projectUrl) {
      return { ok: false, error: _t('employable.needProjectFirst', null, 'Envía el proyecto antes del pitch') };
    }

    let pitch = _fallbackPitch(path, rec.projectUrl);

    if (typeof GroqService !== 'undefined') {
      try {
        await GroqService.init?.();
        if (GroqService.isConfigured?.()) {
          const prompt = `Eres coach de carrera. Genera JSON estricto (sin markdown) con keys:
cvBullets (array de 4 strings en español),
linkedinHeadline (string),
linkedinSummary (string 80-120 palabras),
interviewQA (array de 5 objetos {q,a} en español).
Ruta: ${path?.title || id}
Proyecto: ${rec.projectUrl}
Cursos: ${(path?.courseIds || []).join(', ')}
Tono profesional, concreto, junior-friendly.`;
          const reply = await GroqService.chat([
            { role: 'system', content: 'Responde solo JSON válido.' },
            { role: 'user', content: prompt },
          ]);
          const text = typeof reply === 'string' ? reply : String(reply?.content || reply?.message || '');
          const match = text.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            if (parsed.cvBullets && parsed.linkedinHeadline && parsed.interviewQA) {
              pitch = {
                cvBullets: parsed.cvBullets.slice(0, 6),
                linkedinHeadline: String(parsed.linkedinHeadline),
                linkedinSummary: String(parsed.linkedinSummary || ''),
                interviewQA: (parsed.interviewQA || []).slice(0, 5),
              };
            }
          }
        }
      } catch {
        /* fallback pitch */
      }
    }

    const state = _read();
    const row = _pathRec(state, id);
    row.pitch = pitch;
    row.pitchGeneratedAt = Date.now();
    row.updatedAt = Date.now();
    _write(state);

    return { ok: true, pitch };
  }

  async function reviewSubmittedProject(pathId) {
    const id = pathId || getActivePathId();
    const path = typeof CareerPathsData !== 'undefined' ? CareerPathsData.getPathById(id) : null;
    const rec = getPathRecord(id);
    if (!rec.projectUrl) {
      return { ok: false, error: _t('employable.needProjectFirst', null, 'Envía el proyecto antes de la revisión') };
    }

    let review = {
      score: 70,
      feedback: _t('employable.reviewFallback', null, 'Buen avance: asegúrate de que el enlace sea público, documentado y demuestre el stack de la ruta.'),
      source: 'local',
    };

    if (typeof ProjectReviewService !== 'undefined' && ProjectReviewService.reviewEmployableProject) {
      try {
        review = await ProjectReviewService.reviewEmployableProject({
          path,
          projectUrl: rec.projectUrl,
        });
      } catch { /* keep local */ }
    }

    const state = _read();
    const row = _pathRec(state, id);
    row.projectReview = review;
    row.updatedAt = Date.now();
    _write(state);
    return { ok: true, review };
  }

  function maybeNudgeProjectSubmission(opts = {}) {
    const progress = getPortfolioProgress(getActivePathId(), opts);
    if (!progress.isLearningOnlyComplete && progress.learningPct < 95) return null;
    if (progress.record.projectUrl) return null;

    let shown = {};
    try {
      shown = JSON.parse(localStorage.getItem(NUDGE_KEY) || '{}');
    } catch { /* ignore */ }
    const key = progress.pathId || 'default';
    const last = shown[key] || 0;
    if (Date.now() - last < 12 * 3600000) return null;
    shown[key] = Date.now();
    try {
      localStorage.setItem(NUDGE_KEY, JSON.stringify(shown));
    } catch { /* ignore */ }

    const msg = _t(
      'employable.nudgeMsg',
      null,
      '¡Casi terminas! Solo te falta subir tu proyecto para obtener tu certificado.'
    );
    if (typeof AppShell !== 'undefined' && AppShell.showToast) {
      AppShell.showToast(msg, 4200);
    }
    return { message: msg, pathId: progress.pathId };
  }

  async function hydrateFromCloud() {
    const sb = _sb();
    const userId = await _userId();
    if (!sb || !userId) return false;
    try {
      const { data, error } = await sb
        .from('employability_progress')
        .select('*')
        .eq('user_id', userId);
      if (error) throw error;
      if (!data?.length) return false;

      const local = _read();
      let changed = false;
      data.forEach((row) => {
        const pathId = row.path_id;
        if (!pathId) return;
        const remoteAt = row.updated_at ? new Date(row.updated_at).getTime() : 0;
        const rec = _pathRec(local, pathId);
        if (remoteAt <= (rec.updatedAt || 0)) return;
        const steps = row.completed_steps || {};
        rec.projectUrl = row.project_url || rec.projectUrl || '';
        rec.projectSubmittedAt = steps.projectSubmittedAt || (rec.projectUrl ? remoteAt : 0);
        rec.certCode = steps.certCode || rec.certCode || '';
        rec.certIssuedAt = steps.certIssuedAt || (rec.certCode ? remoteAt : 0);
        rec.pitch = steps.pitch || rec.pitch;
        rec.pitchGeneratedAt = steps.pitchGeneratedAt || (rec.pitch ? remoteAt : 0);
        rec.projectReview = steps.projectReview || rec.projectReview;
        rec.updatedAt = remoteAt;
        changed = true;
      });
      if (changed) {
        local.updatedAt = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(local));
      }
      return changed;
    } catch {
      return false;
    }
  }

  async function getPublicPortfolio(userId) {
    const sb = _sb();
    if (!sb || !userId) return null;
    try {
      // Prefer recruiter-safe view (no email). Fall back to local-only if denied.
      const [{ data: profile }, { data: rows }] = await Promise.all([
        sb.from('public_portfolio_profiles').select('id, name, public_bio, public_slug, avatar_url').eq('id', userId).maybeSingle(),
        sb.from('employability_progress')
          .select('path_id, project_url, cv_pitch, linkedin_summary, completed_steps, updated_at')
          .eq('user_id', userId)
          .not('project_url', 'is', null),
      ]);
      return {
        profile: profile || null,
        paths: (rows || []).filter((r) => r.project_url),
        certifications: [],
      };
    } catch {
      return null;
    }
  }

  async function getPortfolioShareUrl() {
    const base = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}`;
    const userId = await _userId();
    if (userId) return `${base}profile.html?u=${encodeURIComponent(userId)}`;
    return `${base}portfolio-public.html`;
  }

  return {
    getState,
    setActivePath,
    getActivePathId,
    getPathRecord,
    getPortfolioProgress,
    getChecklist,
    getNextCareerStep,
    submitProject,
    issueCertificate,
    generatePitch,
    formatPitchPlain,
    reviewSubmittedProject,
    maybeNudgeProjectSubmission,
    hydrateFromCloud,
    getPublicPortfolio,
    getPortfolioShareUrl,
    isValidUrl: _isValidUrl,
    getUrlTrustHint,
  };
})();

if (typeof module !== 'undefined') module.exports = EmployabilityService;
