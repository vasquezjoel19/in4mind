/**
 * IN4MIND — Actividad diaria para el mapa de calor del panel.
 *
 * Dos fuentes, y ninguna sobra:
 *
 *  - Supabase (`lesson_progress.completed_at`, `cert_verifications.earned_at`)
 *    guarda una fila por lección y por certificado con su fecha. Es lo único
 *    que sobrevive a cambiar de dispositivo, así que es la base.
 *  - El registro local de `GamificationService` anota cada actividad con su
 *    instante y su tipo, incluidos quizzes y micro-quizzes, que en Supabase
 *    viven en tablas-blob de una fila por usuario y no dejan rastro por fecha.
 *
 * Se mezclan sin duplicar: una lección que aparece en ambas cuenta una vez.
 * Sin sesión, el mapa se dibuja igual con lo local; decir «inicia sesión para
 * ver tu actividad» cuando los datos están en el dispositivo sería mentir.
 */

'use strict';

const ActivityHeatmapService = (() => {

  const DIA_MS = 86400000;

  function _dia(ts) {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** XP de un tipo de actividad, preguntándoselo a quien lleva la cuenta. */
  function _xp(tipo) {
    if (typeof GamificationService !== 'undefined' && GamificationService.xpFor) {
      return GamificationService.xpFor(tipo);
    }
    return 10;
  }

  function _anota(mapa, dia, tipo, titulo, clave) {
    if (!dia) return;
    const d = mapa[dia] || (mapa[dia] = { dia, total: 0, xp: 0, tareas: [], claves: new Set() });
    // La misma lección contada por Supabase y por el registro local es una.
    if (clave && d.claves.has(clave)) return;
    if (clave) d.claves.add(clave);
    d.total += 1;
    d.xp += _xp(tipo);
    if (d.tareas.length < 6) d.tareas.push({ tipo, titulo: titulo || '' });
  }

  /** Finalizaciones guardadas en la nube. Devuelve [] si no hay sesión. */
  async function _desdeSupabase(desde) {
    const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
    if (!sb) return [];
    let userId = null;
    try {
      const { data } = await sb.auth.getSession();
      userId = data?.session?.user?.id || null;
    } catch { return []; }
    if (!userId) return [];

    const desdeIso = new Date(desde).toISOString();
    const filas = [];

    try {
      const { data } = await sb
        .from('lesson_progress')
        .select('lesson_id, title, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', desdeIso);
      for (const f of data || []) {
        filas.push({ at: f.completed_at, tipo: 'lesson', titulo: f.title, clave: `l:${f.lesson_id}` });
      }
    } catch { /* sin lecciones en la nube: queda lo local */ }

    try {
      const { data } = await sb
        .from('cert_verifications')
        // La columna se llama `course_title`; pidiendo `course` PostgREST
        // devolvía 400 y el catch de abajo lo convertía en «sin certificados»,
        // así que nunca aparecía ninguno en el mapa.
        .select('code, course_title, earned_at')
        .eq('user_id', userId)
        .gte('earned_at', desdeIso);
      for (const f of data || []) {
        filas.push({ at: f.earned_at, tipo: 'cert', titulo: f.course_title, clave: `c:${f.code}` });
      }
    } catch { /* idem */ }

    return filas;
  }

  /**
   * Actividades del dispositivo.
   *
   * Primero el archivo de IndexedDB, que guarda la historia entera; el log de
   * localStorage sólo conserva las últimas 90 entradas —entradas, no días—, y
   * con él solo el mapa mostraba medio año con los datos de tres semanas.
   * Se leen los dos y se juntan: el archivo puede estar recién creado y el log
   * tener algo que aún no llegó allí.
   */
  async function _desdeLocal(desde) {
    let archivo = [];
    if (typeof ActivityArchive !== 'undefined' && ActivityArchive.disponible()) {
      try {
        await ActivityArchive.importarLegado();
        archivo = await ActivityArchive.since(desde);
      } catch { archivo = []; }
    }

    let log = [];
    if (typeof GamificationService !== 'undefined' && GamificationService.getActivityLog) {
      try { log = GamificationService.getActivityLog() || []; } catch { log = []; }
    }

    return [...archivo, ...log]
      .filter(e => e && e.at >= desde)
      .map(e => ({
        at: e.at,
        tipo: e.type || 'otro',
        titulo: e.title || e.lessonId || e.courseId || '',
        /* Toda entrada lleva clave, no sólo las de lección: ahora llegan por
           dos caminos —archivo y log— y sin clave se contarían dos veces.
           Para las de lección se usa la misma que Supabase, y para el resto
           el tipo y el instante, que no se repiten. */
        clave: e.lessonId ? `l:${e.lessonId}` : `a:${e.type || 'otro'}:${e.at}`,
      }));
  }

  /**
   * Rejilla de los últimos `dias` días, del más antiguo a hoy.
   *
   * @returns {Promise<{dia:string, total:number, xp:number, tareas:object[]}[]>}
   */
  async function rejilla(dias = 182) {
    const desde = Date.now() - (dias - 1) * DIA_MS;
    const mapa = {};

    const [nube, local] = await Promise.all([
      _desdeSupabase(desde).catch(() => []),
      _desdeLocal(desde).catch(() => []),
    ]);

    // La nube primero: su título es el guardado, no el que haya en el caché.
    for (const f of [...nube, ...local]) {
      _anota(mapa, _dia(new Date(f.at).getTime()), f.tipo, f.titulo, f.clave);
    }

    const salida = [];
    for (let i = dias - 1; i >= 0; i -= 1) {
      const clave = _dia(Date.now() - i * DIA_MS);
      const d = mapa[clave];
      salida.push(d
        ? { dia: clave, total: d.total, xp: d.xp, tareas: d.tareas }
        : { dia: clave, total: 0, xp: 0, tareas: [] });
    }
    return salida;
  }

  return { rejilla };

})();

if (typeof module !== 'undefined') module.exports = ActivityHeatmapService;
