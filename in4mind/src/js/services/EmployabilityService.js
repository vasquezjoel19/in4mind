/**
 * IN4MIND — Ruta Empleable: progreso de portfolio (proyecto + cert + pitch).
 * Persistencia local-first; sync opcional vía CloudBlobSync si existe tabla.
 */
'use strict';

const EmployabilityService = (() => {

  const STORAGE_KEY = 'in4mind_employability_v1';
  const BLOB_KIND = 'employability';

  function _t(key, params, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key, params);
      if (out && out !== key) return out;
    }
    return fallback ?? '';
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

  function _write(state) {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof CloudBlobSync !== 'undefined' && CloudBlobSync.TABLES?.[BLOB_KIND]) {
      CloudBlobSync.pushBlob(BLOB_KIND, state).catch(() => {});
    }
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

  function _learningPct(path, quizProgress = {}, certifications = []) {
    if (!path || typeof LearningPathService === 'undefined') return 0;
    const fake = { courseIds: path.courseIds || [] };
    const prog = LearningPathService.getPathProgress(fake, quizProgress, certifications);
    return prog?.pct || 0;
  }

  /**
   * Portfolio progress toward 3 job-ready deliverables.
   * Path learning never counts as 100% completion without project submission.
   * @param {string} [pathId]
   * @param {{ quizProgress?: object, certifications?: array }} [opts]
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
    // Cap learning contribution; require deliverables for full completion.
    const learningShare = Math.round(Math.min(learningPct, 70) * 0.5); // max 35
    const deliverableShare = Math.round((doneCount / 3) * 65);
    let portfolioPct = Math.min(100, learningShare + deliverableShare);
    if (doneCount < 3) portfolioPct = Math.min(portfolioPct, 99);
    if (doneCount === 3 && learningPct >= 40) portfolioPct = 100;

    const isComplete = doneCount === 3;
    const isLearningOnlyComplete = learningPct >= 95 && !hasProject;

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
      next: !hasProject
        ? 'project'
        : !hasCert
          ? 'certificate'
          : !hasPitch
            ? 'pitch'
            : 'done',
    };
  }

  function submitProject(pathId, url) {
    const trimmed = String(url || '').trim();
    if (!_isValidUrl(trimmed)) {
      return { ok: false, error: _t('employable.invalidUrl', null, 'URL inválida. Usa http:// o https://') };
    }
    const id = pathId || getActivePathId();
    if (!id) return { ok: false, error: 'no_path' };

    const state = _read();
    const rec = _pathRec(state, id);
    rec.projectUrl = trimmed;
    rec.projectSubmittedAt = Date.now();
    rec.updatedAt = Date.now();
    // Reset dependent deliverables if project changes
    if (rec.certCode) {
      /* keep previous cert but allow re-issue */
    }
    _write(state);

    const cert = issueCertificate(id);
    return { ok: true, record: getPathRecord(id), cert };
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

  async function hydrateFromCloud() {
    if (typeof CloudBlobSync === 'undefined' || !CloudBlobSync.TABLES?.[BLOB_KIND]) return false;
    try {
      const remote = await CloudBlobSync.pullBlob(BLOB_KIND);
      const blob = remote?.blob;
      if (!blob || typeof blob !== 'object') return false;
      const local = _read();
      if ((blob.updatedAt || 0) >= (local.updatedAt || 0)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  return {
    getState,
    setActivePath,
    getActivePathId,
    getPathRecord,
    getPortfolioProgress,
    submitProject,
    issueCertificate,
    generatePitch,
    hydrateFromCloud,
    isValidUrl: _isValidUrl,
  };
})();

if (typeof module !== 'undefined') module.exports = EmployabilityService;
