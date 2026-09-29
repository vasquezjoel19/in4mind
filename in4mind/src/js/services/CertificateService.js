/**
 * IN4MIND — Emisión y verificación de certificados.
 *
 * Capa pública sobre `CertVerificationService`, que ya guardaba y verificaba
 * certificados y tiene códigos emitidos en circulación. Aquí se añade lo que
 * faltaba para que sean *verificables de verdad*:
 *
 *   - un hash criptográfico (UUID v4) además del código legible,
 *   - el vínculo con el usuario dueño,
 *   - una verificación que distingue "válido", "no encontrado" y "no se pudo
 *     comprobar", que no son lo mismo.
 *
 * No sustituye al servicio anterior: lo envuelve. Cambiar el que ya está en
 * uso rompería los QR impresos y las tres pantallas que lo llaman.
 */

'use strict';

const CertificateService = (() => {

  const TABLA = 'cert_verifications';

  /* Resultados posibles de una verificación. Se distinguen a propósito: decir
     "no válido" cuando en realidad se cayó la red sería acusar a alguien de
     falsificar un certificado correcto. */
  const ESTADO = Object.freeze({
    VALIDO: 'valido',
    NO_ENCONTRADO: 'no_encontrado',
    NO_VERIFICABLE: 'no_verificable',
  });

  function _sb() {
    return typeof _sbClient !== 'undefined' ? _sbClient : null;
  }

  /**
   * UUID v4 con el generador criptográfico del navegador.
   *
   * `crypto.randomUUID` no existe en contextos no seguros ni en navegadores
   * antiguos, de ahí el respaldo — que sigue usando `getRandomValues`, nunca
   * `Math.random()`: un identificador de certificado adivinable no acredita
   * nada.
   */
  function generarHash() {
    if (typeof crypto === 'undefined') return '';
    if (crypto.randomUUID) return crypto.randomUUID();
    if (!crypto.getRandomValues) return '';

    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;   // versión 4
    b[8] = (b[8] & 0x3f) | 0x80;   // variante RFC 4122
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  /** URL pública que codifica el QR. No debe cambiar: hay QR ya impresos. */
  function verifyUrl(codigo) {
    if (typeof CertVerificationService !== 'undefined') {
      return CertVerificationService.verifyUrl(codigo);
    }
    const base = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}`;
    return `${base}verify.html?id=${encodeURIComponent(codigo)}`;
  }

  /**
   * Emite el certificado de un curso terminado.
   *
   * @param {{refId: string, title: string, type?: string, pct?: number,
   *          projectUrl?: string, pathId?: string, earnedAt?: number}} curso
   * @param {string} nombreAlumno
   * @returns {Promise<{ok: boolean, code?: string, hash?: string,
   *                    url?: string, sincronizado?: boolean, error?: string}>}
   */
  async function issue(curso, nombreAlumno) {
    if (!curso || !curso.refId) {
      return { ok: false, error: 'Falta el curso.' };
    }

    /* El registro local lo lleva el servicio anterior, que además devuelve el
       código: así el certificado existe y se puede enseñar aunque la nube no
       responda. */
    let code = '';
    if (typeof CertVerificationService !== 'undefined') {
      /* `soloLocal`: la escritura en la nube la hace esta función más abajo,
         con el hash y el dueño incluidos. Sin la opción se escribía dos veces
         la misma fila y la primera iba sin hash. */
      code = CertVerificationService.register(curso, nombreAlumno, { soloLocal: true });
    } else {
      code = curso.verifyCode || `IN4MIND-${curso.refId}-${Date.now().toString(36).toUpperCase()}`;
    }

    const hash = generarHash();
    const sb = _sb();
    if (!sb) {
      // Sin Supabase el certificado vale en local pero nadie externo puede
      // comprobarlo; se dice con claridad en vez de fingir que sí.
      return { ok: true, code, hash, url: verifyUrl(code), sincronizado: false };
    }

    try {
      /* `user_id` y `hash` los fija el trigger del servidor a partir de
         `auth.uid()`. Se mandan igualmente por claridad, pero lo que llegue
         desde aquí se descarta: si el cliente pudiera elegirlos, cualquiera
         emitiría certificados a nombre de otra persona. */
      const { error } = await sb.from(TABLA).upsert({
        code,
        hash,
        course_title: curso.title || curso.refId,
        ref_id: curso.refId,
        user_name: nombreAlumno || 'Usuario',
        earned_at: new Date(curso.earnedAt || Date.now()).toISOString(),
        pct: curso.pct ?? null,
        project_url: curso.projectUrl || null,
        path_id: curso.pathId || null,
      }, { onConflict: 'code' });

      if (error) {
        return { ok: true, code, hash, url: verifyUrl(code), sincronizado: false, error: error.message };
      }
      return { ok: true, code, hash, url: verifyUrl(code), sincronizado: true };
    } catch (err) {
      return {
        ok: true, code, hash, url: verifyUrl(code), sincronizado: false,
        error: err?.message || String(err),
      };
    }
  }

  /**
   * Comprueba un certificado por su código o por su hash.
   *
   * @param {string} identificador
   * @returns {Promise<{estado: string, certificado?: object}>}
   */
  async function verify(identificador) {
    const id = String(identificador || '').trim();
    if (!id) return { estado: ESTADO.NO_ENCONTRADO };

    const sb = _sb();
    if (sb) {
      try {
        // Un UUID entra por `hash`; cualquier otra cosa, por `code`.
        const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        const { data, error } = await sb
          .from(TABLA)
          .select('code, hash, course_title, ref_id, user_name, earned_at, pct, project_url, path_id')
          .eq(esUuid ? 'hash' : 'code', id)
          .maybeSingle();

        if (error) return { estado: ESTADO.NO_VERIFICABLE };
        if (!data) return { estado: ESTADO.NO_ENCONTRADO };

        return {
          estado: ESTADO.VALIDO,
          certificado: {
            code: data.code,
            hash: data.hash,
            course: data.course_title,
            refId: data.ref_id,
            userName: data.user_name,
            earnedAt: data.earned_at ? new Date(data.earned_at).getTime() : null,
            pct: data.pct,
            projectUrl: data.project_url || '',
            pathId: data.path_id || '',
          },
        };
      } catch {
        return { estado: ESTADO.NO_VERIFICABLE };
      }
    }

    /* Sin Supabase solo queda el registro local, que sirve para que el propio
       alumno vea su certificado pero no acredita nada ante un tercero: está en
       su navegador y él podría haberlo escrito. */
    if (typeof CertVerificationService !== 'undefined') {
      try {
        const local = await CertVerificationService.verify(id);
        if (local) return { estado: ESTADO.VALIDO, certificado: local, soloLocal: true };
      } catch { /* sin registro local */ }
    }
    return { estado: ESTADO.NO_VERIFICABLE };
  }

  return { issue, verify, verifyUrl, generarHash, ESTADO };

})();

if (typeof module !== 'undefined') module.exports = CertificateService;
