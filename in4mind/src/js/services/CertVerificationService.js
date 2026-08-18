'use strict';

const CertVerificationService = (() => {

  const REGISTRY_KEY = 'in4mind_cert_registry';

  function _readRegistry() {
    try { return JSON.parse(localStorage.getItem(REGISTRY_KEY) || '{}'); }
    catch { return {}; }
  }

  function _writeRegistry(reg) {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  }

  function generateCode(cert) {
    const base = `${cert.refId || 'CERT'}-${cert.earnedAt || Date.now()}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) hash = ((hash << 5) - hash) + base.charCodeAt(i);
    const code = `IN4-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
    return code;
  }

  function register(cert, userName) {
    const code = cert.verifyCode || cert.id || generateCode(cert);
    const reg = _readRegistry();
    reg[code] = {
      code,
      course: cert.title || cert.refId,
      refId: cert.refId,
      type: cert.type || 'practice',
      userName: userName || 'Usuario',
      earnedAt: cert.earnedAt || Date.now(),
      pct: cert.pct,
      projectUrl: cert.projectUrl || '',
      pathId: cert.pathId || '',
    };
    _writeRegistry(reg);

    if (typeof _sbClient !== 'undefined') {
      _sbClient.from('cert_verifications').upsert({
        code,
        course_title: cert.title || cert.refId,
        ref_id: cert.refId,
        user_name: userName,
        earned_at: new Date(cert.earnedAt || Date.now()).toISOString(),
        pct: cert.pct,
        project_url: cert.projectUrl || null,
        path_id: cert.pathId || null,
      }, { onConflict: 'code' }).catch(() => {});
    }

    return code;
  }

  async function verify(code) {
    const trimmed = (code || '').trim().toUpperCase();
    if (!trimmed) return null;

    const local = _readRegistry()[trimmed];
    if (local) return { ...local, source: 'local' };

    if (typeof _sbClient !== 'undefined') {
      try {
        const { data } = await _sbClient
          .from('cert_verifications')
          .select('*')
          .eq('code', trimmed)
          .single();
        if (data) {
          return {
            code: data.code,
            course: data.course_title,
            refId: data.ref_id,
            userName: data.user_name,
            earnedAt: new Date(data.earned_at).getTime(),
            pct: data.pct,
            projectUrl: data.project_url || '',
            pathId: data.path_id || '',
            source: 'cloud',
          };
        }
      } catch { /* ignore */ }
    }

    return null;
  }

  function verifyUrl(code) {
    const base = window.location.pathname.replace(/[^/]+$/, '');
    // Prefer ?id= for public Ruta Empleable links; ?code= remains supported.
    return `${window.location.origin}${base}verify.html?id=${encodeURIComponent(code)}`;
  }

  return { register, verify, verifyUrl, generateCode };

})();

if (typeof module !== 'undefined') module.exports = CertVerificationService;
