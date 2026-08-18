/**
 * IN4MIND — Perfil de usuario con Supabase
 * Favoritos, guardados, visitas, quizzes, lecciones y certificaciones
 * se guardan en la nube en vez de localStorage.
 */

'use strict';

const UserProfileService = (() => {

  // ── Supabase client (usa _sbClient de supabase.config.js si está cargado) ──
  const _sb = typeof _sbClient !== 'undefined'
    ? _sbClient
    : supabase.createClient(
        typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '',
        typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : ''
      );

  // ── Constantes (igual que antes) ─────────────────────────────
  const EVENT               = 'in4mind-profile-updated';
  const MAX_VISITS          = 24;
  const CERT_MIN_PCT        = 70;
  const EXAM_CERT_MIN_PCT   = 80;
  const LESSON_EXAM_UNLOCK_AVG = 80;
  const QUIZ_UNLOCK_EXAM_PCT   = 70;

  // ── Cache local para evitar llamadas repetidas ───────────────
  let _cache = {
    favorites:      null,
    saved:          null,
    visits:         null,
    quizProgress:   null,
    lessonProgress: null,
    certifications: null,
    certificationsCloud: null,
  };

  let _userIdResolved = undefined;
  let _userIdPromise  = null;
  let _prefetchPromise = null;
  let _certSyncPromise = null;

  function _invalidateUserIdCache() {
    _userIdResolved = undefined;
    _userIdPromise = null;
  }

  function _clearCache() {
    Object.keys(_cache).forEach(k => { _cache[k] = null; });
    _prefetchPromise = null;
  }

  function _notify() {
    const user = getCurrentUser();
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { email: user?.email } }));
  }

  // ── Usuario actual ───────────────────────────────────────────
  function getCurrentUser() {
    try {
      // sessionStorage primero (compatibilidad con AuthController existente);
      // localStorage después, porque con «recordar datos» esa es la copia que
      // existe hasta que SessionStore.restore() repuebla la sesión, y las
      // claves locales de progreso se calculan a partir del correo.
      const stored = sessionStorage.getItem('in4mind_user')
        || localStorage.getItem('in4mind_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async function getCurrentUserId() {
    if (_userIdResolved !== undefined) return _userIdResolved;
    if (_userIdPromise) return _userIdPromise;

    _userIdPromise = (async () => {
      const { data } = await _sb.auth.getUser();
      if (data?.user) {
        _userIdResolved = data.user.id;
        return _userIdResolved;
      }

      const local = getCurrentUser();
      if (!local?.email) {
        _userIdResolved = null;
        return null;
      }

      const { data: profile } = await _sb
        .from('profiles')
        .select('id')
        .eq('email', local.email.toLowerCase())
        .single();

      _userIdResolved = profile?.id || null;
      return _userIdResolved;
    })();

    try {
      return await _userIdPromise;
    } finally {
      _userIdPromise = null;
    }
  }

  /** Vista instantánea desde localStorage (sin red). */
  function hydrateCacheFromLocal() {
    const favKey = _profileStorageKey('favorites');
    const savedKey = _profileStorageKey('saved');
    if (favKey && _cache.favorites === null) {
      _cache.favorites = _readLocalList(favKey).map(_normalizeItem);
    }
    if (savedKey && _cache.saved === null) {
      _cache.saved = _readLocalList(savedKey).map(_normalizeItem);
    }
  }

  /** Estadísticas síncronas si el caché ya está poblado. */
  function getStatsSync() {
    hydrateCacheFromLocal();
    const saved = _cache.saved || [];
    const favorites = _cache.favorites || [];
    const quizzes = _cache.quizProgress || {};
    const certifications = _cache.certifications || [];
    return {
      saved:          saved.length,
      favorites:      favorites.length,
      quizzes:        Object.keys(quizzes).length,
      certifications: certifications.length,
    };
  }

  /** Precarga paralela de favoritos, guardados, quizzes y certificaciones. */
  function prefetchProfileData() {
    if (_prefetchPromise) return _prefetchPromise;
    hydrateCacheFromLocal();
    _prefetchPromise = Promise.all([
      getSaved(),
      getFavorites(),
      getQuizProgress(),
      getCertifications(),
    ]).finally(() => { _prefetchPromise = null; });
    return _prefetchPromise;
  }

  // ── Helpers de item ──────────────────────────────────────────
  function buildCourseItem(course) {
    return {
      id:        `course-${course.id}`,
      type:      'course',
      refId:     course.id,
      title:     course.title,
      desc:      course.desc,
      icon:      course.icon,
      color:     course.color || '',
      visitedAt: Date.now(),
    };
  }

  function buildQuizItem(quiz) {
    return {
      id:        `quiz-${quiz.id}`,
      type:      'quiz',
      refId:     quiz.id,
      title:     quiz.title,
      desc:      quiz.desc || 'Quiz completado',
      icon:      quiz.icon || '',
      visitedAt: Date.now(),
    };
  }

  // ════════════════════════════════════════════════════════════
  // FAVORITOS
  // ════════════════════════════════════════════════════════════

  /**
   * Clave local por usuario. Sin sesión se cae a `guest` en vez de devolver
   * null: así el avance de quien aún no ha entrado no se pierde, y al iniciar
   * sesión sigue existiendo un espejo del que tirar.
   */
  function _profileStorageKey(suffix) {
    const email = getCurrentUser()?.email?.toLowerCase();
    return `in4mind_${suffix}_${email || 'guest'}`;
  }

  function _readLocalList(key) {
    if (!key) return [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _writeLocalList(key, list) {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list));
  }

  function _normalizeItem(item) {
    return {
      id:        item.id || `${item.type}-${item.refId}`,
      type:      item.type,
      refId:     item.refId,
      title:     item.title || '',
      desc:      item.desc  || '',
      icon:      item.icon  || '',
      color:     item.color || '',
      savedAt:   item.savedAt   || Date.now(),
      visitedAt: item.visitedAt || Date.now(),
    };
  }

  async function getFavorites() {
    if (_cache.favorites) return _cache.favorites;
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await _sb
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (!error) {
        _cache.favorites = (data || []).map(_rowToItem);
        return _cache.favorites;
      }
      console.error('getFavorites:', error);
    }

    const key = _profileStorageKey('favorites');
    _cache.favorites = _readLocalList(key).map(_normalizeItem);
    return _cache.favorites;
  }

  async function isFavorite(refId, type = 'course') {
    const favs = await getFavorites();
    return favs.some(f => f.refId === refId && f.type === type);
  }

  async function toggleFavorite(item) {
    const userId = await getCurrentUserId();
    const normalized = _normalizeItem(item);
    const already = await isFavorite(normalized.refId, normalized.type);

    if (userId) {
      if (already) {
        await _sb.from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('ref_id',  normalized.refId)
          .eq('type',    normalized.type);
      } else {
        await _sb.from('favorites').insert({
          user_id:     userId,
          ref_id:      normalized.refId,
          type:        normalized.type,
          title:       normalized.title || '',
          description: normalized.desc  || '',
          icon_url:    normalized.icon  || '',
          color_var:   normalized.color || '',
          saved_at:    new Date().toISOString(),
        });
      }
      _cache.favorites = null;
      _notify();
      return !already;
    }

    const key = _profileStorageKey('favorites');
    if (!key) return false;

    let favs = _readLocalList(key).map(_normalizeItem);
    if (already) {
      favs = favs.filter(f => !(f.refId === normalized.refId && f.type === normalized.type));
      _writeLocalList(key, favs);
      _cache.favorites = favs;
      _notify();
      return false;
    }

    favs.unshift(normalized);
    _writeLocalList(key, favs);
    _cache.favorites = favs;
    _notify();
    return true;
  }

  async function removeFavorite(id) {
    const userId = await getCurrentUserId();
    const refId = id.replace(/^(course|quiz)-/, '');

    if (userId) {
      await _sb.from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('ref_id', refId);
    }

    const key = _profileStorageKey('favorites');
    if (key) {
      const favs = _readLocalList(key)
        .map(_normalizeItem)
        .filter(f => f.id !== id && f.refId !== refId);
      _writeLocalList(key, favs);
      _cache.favorites = favs;
    } else {
      _cache.favorites = null;
    }
    _notify();
  }

  // ════════════════════════════════════════════════════════════
  // GUARDADOS
  // ════════════════════════════════════════════════════════════

  async function getSaved() {
    if (_cache.saved) return _cache.saved;
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await _sb
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (!error) {
        _cache.saved = (data || []).map(_rowToItem);
        return _cache.saved;
      }
      console.error('getSaved:', error);
    }

    const key = _profileStorageKey('saved');
    _cache.saved = _readLocalList(key).map(_normalizeItem);
    return _cache.saved;
  }

  async function isSaved(refId, type = 'course') {
    const saved = await getSaved();
    return saved.some(s => s.refId === refId && s.type === type);
  }

  async function toggleSaved(item) {
    const userId = await getCurrentUserId();
    const normalized = _normalizeItem(item);
    const already = await isSaved(normalized.refId, normalized.type);

    if (userId) {
      if (already) {
        await _sb.from('saved_items')
          .delete()
          .eq('user_id', userId)
          .eq('ref_id',  normalized.refId)
          .eq('type',    normalized.type);
      } else {
        await _sb.from('saved_items').insert({
          user_id:     userId,
          ref_id:      normalized.refId,
          type:        normalized.type,
          title:       normalized.title || '',
          description: normalized.desc  || '',
          icon_url:    normalized.icon  || '',
          color_var:   normalized.color || '',
          saved_at:    new Date().toISOString(),
        });
      }
      _cache.saved = null;
      _notify();
      return !already;
    }

    const key = _profileStorageKey('saved');
    if (!key) return false;

    let saved = _readLocalList(key).map(_normalizeItem);
    if (already) {
      saved = saved.filter(s => !(s.refId === normalized.refId && s.type === normalized.type));
      _writeLocalList(key, saved);
      _cache.saved = saved;
      _notify();
      return false;
    }

    saved.unshift(normalized);
    _writeLocalList(key, saved);
    _cache.saved = saved;
    _notify();
    return true;
  }

  async function removeSaved(id) {
    const userId = await getCurrentUserId();
    const refId = id.replace(/^(course|quiz)-/, '');

    if (userId) {
      await _sb.from('saved_items')
        .delete()
        .eq('user_id', userId)
        .eq('ref_id', refId);
    }

    const key = _profileStorageKey('saved');
    if (key) {
      const saved = _readLocalList(key)
        .map(_normalizeItem)
        .filter(s => s.id !== id && s.refId !== refId);
      _writeLocalList(key, saved);
      _cache.saved = saved;
    } else {
      _cache.saved = null;
    }
    _notify();
  }

  // ════════════════════════════════════════════════════════════
  // HISTORIAL DE VISITAS
  // ════════════════════════════════════════════════════════════

  function _localVisits() {
    return _readLocalList(_profileStorageKey('visits')).map(_normalizeItem);
  }

  /** Deja constancia de la visita en el dispositivo antes de intentar la nube. */
  function _recordLocalVisit(item) {
    const key = _profileStorageKey('visits');
    const entry = _normalizeItem({ ...item, visitedAt: Date.now() });
    const rest = _localVisits()
      .filter(v => !(v.refId === entry.refId && v.type === entry.type));
    _writeLocalList(key, [entry, ...rest].slice(0, MAX_VISITS));
  }

  /** Une nube y dispositivo quedándose con la visita más reciente de cada ref. */
  function _mergeVisits(...lists) {
    const byRef = new Map();
    lists.flat().forEach(visit => {
      const refKey = `${visit.type}:${visit.refId}`;
      const current = byRef.get(refKey);
      if (!current || (visit.visitedAt || 0) > (current.visitedAt || 0)) byRef.set(refKey, visit);
    });
    return [...byRef.values()]
      .sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0))
      .slice(0, MAX_VISITS);
  }

  async function recordVisit(item) {
    _recordLocalVisit(item);
    _cache.visits = null;

    const userId = await getCurrentUserId();
    if (!userId) { _notify(); return; }

    // UPSERT: si ya existe la visita, actualiza visited_at
    await _sb.from('visit_history').upsert({
      user_id:     userId,
      ref_id:      item.refId,
      type:        item.type,
      title:       item.title || '',
      description: item.desc  || '',
      icon_url:    item.icon  || '',
      color_var:   item.color || '',
      visited_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,ref_id,type' });

    _cache.visits = null;
    _notify();
  }

  async function getRecentVisits(limit = 9) {
    if (_cache.visits) return _cache.visits.slice(0, limit);

    const local = _localVisits();
    const userId = await getCurrentUserId();
    let cloud = [];

    if (userId) {
      const { data, error } = await _sb
        .from('visit_history')
        .select('*')
        .eq('user_id', userId)
        .order('visited_at', { ascending: false })
        .limit(MAX_VISITS);

      if (error) console.error('getRecentVisits:', error);
      else {
        cloud = (data || []).map(row => ({
          ..._rowToItem(row),
          visitedAt: new Date(row.visited_at).getTime(),
        }));
      }
    }

    // Sin sesión en la nube, o con ella caída, el historial local es el único
    // que queda: devolverlo vacío borraba de la vista cursos ya empezados.
    _cache.visits = _mergeVisits(cloud, local);
    return _cache.visits.slice(0, limit);
  }

  // ════════════════════════════════════════════════════════════
  // PROGRESO DE QUIZZES
  // ════════════════════════════════════════════════════════════

  function _localQuizProgress() {
    try {
      return JSON.parse(localStorage.getItem(_profileStorageKey('quiz_results')) || '{}') || {};
    } catch {
      return {};
    }
  }

  function _mergeLocalQuiz(quizId, entry) {
    const all = _localQuizProgress();
    all[quizId] = { ...(all[quizId] || {}), ...entry };
    try {
      localStorage.setItem(_profileStorageKey('quiz_results'), JSON.stringify(all));
    } catch { /* ignore */ }
    return all[quizId];
  }

  async function saveQuizProgress(quizId, correct, total, meta = {}) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const title = meta.title || quizId;

    // El resultado se ancla en el dispositivo antes de tocar la red. Si la
    // sesión de Supabase no resuelve, el intento seguía existiendo para el
    // usuario pero no dejaba rastro en ninguna parte de la app.
    const localPrev = _localQuizProgress()[quizId];
    const localBest = Math.max(localPrev?.bestPct || 0, pct);
    const localAttempts = (localPrev?.attempts || 0) + 1;
    _mergeLocalQuiz(quizId, {
      correct,
      total,
      pct,
      bestPct:     localBest,
      attempts:    localAttempts,
      title,
      icon:        meta.icon || localPrev?.icon || '',
      completedAt: Date.now(),
    });
    _cache.quizProgress = null;

    const userId = await getCurrentUserId();
    if (!userId) {
      _notify();
      return { correct, total, pct, bestPct: localBest, attempts: localAttempts, title, icon: meta.icon || '' };
    }

    // Obtener mejor pct anterior
    const { data: prev } = await _sb
      .from('quiz_progress')
      .select('best_pct, attempts')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .single();

    const bestPct  = Math.max(prev?.best_pct || 0, pct, localBest);
    const attempts = Math.max((prev?.attempts || 0) + 1, localAttempts);

    const row = {
      user_id:      userId,
      quiz_id:      quizId,
      title,
      icon_url:     meta.icon  || '',
      correct,
      total,
      pct,
      best_pct:     bestPct,
      attempts,
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    };

    await _sb.from('quiz_progress')
      .upsert(row, { onConflict: 'user_id,quiz_id' })
      .then(({ error }) => {
        if (error) throw error;
      })
      .catch((err) => {
        if (typeof SyncOutboxService !== 'undefined') {
          SyncOutboxService.enqueue({
            table: 'quiz_progress',
            action: 'upsert',
            payload: row,
            conflict: 'user_id,quiz_id',
            conflictKey: `quiz_progress:${userId}:${quizId}`,
          });
        }
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('quiz_progress_upsert_fail', { message: err?.message || String(err) });
        }
        if (typeof AppShell !== 'undefined') {
          AppShell.showToast('Progreso guardado en este dispositivo. Se sincronizará al recuperar la conexión.', 2800);
        }
      });

    _mergeLocalQuiz(quizId, { bestPct, attempts, completedAt: Date.now() });
    _cache.quizProgress = null;
    _notify();

    return { correct, total, pct, bestPct, attempts, title: row.title, icon: row.icon_url };
  }

  async function getQuizProgress() {
    if (_cache.quizProgress) return _cache.quizProgress;

    // El espejo local es la base; la nube solo pisa lo que tenga mejor marca.
    const map = { ..._localQuizProgress() };
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await _sb
        .from('quiz_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) console.error('getQuizProgress:', error);
      else {
        (data || []).forEach(row => {
          const local = map[row.quiz_id];
          map[row.quiz_id] = {
            correct:     row.correct,
            total:       row.total,
            pct:         row.pct,
            bestPct:     Math.max(row.best_pct || 0, local?.bestPct || 0),
            attempts:    Math.max(row.attempts || 0, local?.attempts || 0),
            title:       row.title,
            icon:        row.icon_url,
            completedAt: new Date(row.completed_at).getTime(),
          };
        });
      }
    }

    _cache.quizProgress = map;
    return map;
  }

  async function getCompletedQuizCount() {
    const progress = await getQuizProgress();
    return Object.keys(progress).length;
  }

  async function getQuizScoreForCourse(courseId) {
    const progress = await getQuizProgress();
    const data = progress[courseId];
    return data?.bestPct ?? data?.pct ?? 0;
  }

  async function isQuizPassedForCert(courseId) {
    const score = await getQuizScoreForCourse(courseId);
    return score >= QUIZ_UNLOCK_EXAM_PCT;
  }

  // ════════════════════════════════════════════════════════════
  // PROGRESO DE LECCIONES
  // ════════════════════════════════════════════════════════════

  /** Por usuario: dos cuentas en el mismo equipo no comparten lecciones. */
  function _lessonLocalKey() {
    return _profileStorageKey('lesson_local');
  }

  function _getLessonLocal() {
    try {
      return JSON.parse(localStorage.getItem(_lessonLocalKey()) || '{}') || {};
    } catch {
      return {};
    }
  }

  function _mergeLessonLocal(courseId, map) {
    const all = _getLessonLocal();
    all[courseId] = { ...(all[courseId] || {}), ...map };
    try {
      localStorage.setItem(_lessonLocalKey(), JSON.stringify(all));
    } catch { /* ignore */ }
  }

  /** Lectura síncrona del progreso de lecciones (caché local optimista). */
  function getLessonProgressSync(courseId) {
    return _getLessonLocal()[courseId] || {};
  }

  /**
   * Cursos con lecciones registradas en este dispositivo y su actividad más
   * reciente. Permite listar cursos a medias sin saber de antemano cuáles son,
   * que es lo que hace falta cuando la nube todavía no tiene las visitas.
   * @returns {Object<string, number>} courseId → timestamp
   */
  function getLessonProgressCourseIds() {
    const out = {};
    Object.entries(_getLessonLocal()).forEach(([courseId, lessons]) => {
      const stamps = Object.values(lessons || {}).map(lesson => lesson.completedAt || 0);
      out[courseId] = stamps.length ? Math.max(...stamps) : 0;
    });
    return out;
  }

  async function saveLessonProgress(courseId, lessonId, pct, meta = {}) {
    const score = Math.max(0, Math.min(100, Math.round(pct)));
    const title = meta.title || lessonId;

    // Primero el espejo local. Antes esta función salía aquí mismo cuando no
    // había usuario de Supabase, así que una lección terminada sin sesión en
    // la nube no quedaba registrada en ningún sitio y el panel de «continúa
    // donde lo dejaste» se veía vacío pese a haber avance real.
    const localPrev = getLessonProgressSync(courseId)[lessonId];
    const localBest = Math.max(localPrev?.pct || 0, score);
    const localAttempts = (localPrev?.attempts || 0) + 1;
    _mergeLessonLocal(courseId, {
      [lessonId]: { pct: localBest, title, attempts: localAttempts, completedAt: Date.now() },
    });
    _cache.lessonProgress = null;

    const userId = await getCurrentUserId();
    if (!userId) {
      _notify();
      return { pct: localBest, attempts: localAttempts, title };
    }

    // Obtener pct anterior para no bajar el mejor resultado
    const { data: prev } = await _sb
      .from('lesson_progress')
      .select('pct, attempts')
      .eq('user_id',  userId)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .single();

    const bestPct  = Math.max(prev?.pct || 0, score, localBest);
    const attempts = Math.max((prev?.attempts || 0) + 1, localAttempts);

    const lessonRow = {
      user_id:      userId,
      course_id:    courseId,
      lesson_id:    lessonId,
      title,
      pct:          bestPct,
      attempts,
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    };

    try {
      const { error } = await _sb.from('lesson_progress').upsert(lessonRow, {
        onConflict: 'user_id,course_id,lesson_id',
      });
      if (error) throw error;
    } catch (err) {
      if (typeof SyncOutboxService !== 'undefined') {
        SyncOutboxService.enqueue({
          table: 'lesson_progress',
          action: 'upsert',
          payload: lessonRow,
          conflict: 'user_id,course_id,lesson_id',
          conflictKey: `lesson_progress:${userId}:${courseId}:${lessonId}`,
        });
      }
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('lesson_progress_upsert_fail', { message: err?.message || String(err) });
      }
    }

    _cache.lessonProgress = null;
    _mergeLessonLocal(courseId, {
      [lessonId]: { pct: bestPct, title, attempts, completedAt: Date.now() },
    });
    _notify();

    return { pct: bestPct, attempts, title };
  }

  async function getLessonProgress(courseId) {
    const local = getLessonProgressSync(courseId);
    const userId = await getCurrentUserId();
    if (!userId) return local;

    const { data, error } = await _sb
      .from('lesson_progress')
      .select('*')
      .eq('user_id',  userId)
      .eq('course_id', courseId);

    if (error) { console.error('getLessonProgress:', error); return local; }

    const map = {};
    (data || []).forEach(row => {
      map[row.lesson_id] = {
        pct:         row.pct,
        title:       row.title,
        attempts:    row.attempts,
        completedAt: new Date(row.completed_at).getTime(),
      };
    });

    _mergeLessonLocal(courseId, map);
    // La nube manda donde hay fila, pero lo que solo existe aquí no se tira.
    return { ...local, ...map };
  }

  async function getCourseLessonStats(courseId, totalLessons = 0) {
    const lessons  = await getLessonProgress(courseId);
    const entries  = Object.values(lessons);
    const completed = entries.length;
    const avg = completed
      ? Math.round(entries.reduce((sum, l) => sum + (l.pct || 0), 0) / completed)
      : 0;
    const allComplete = totalLessons > 0 && completed >= totalLessons;
    const unlocked    = allComplete && avg >= LESSON_EXAM_UNLOCK_AVG;

    return { completed, total: totalLessons, avg, allComplete, unlocked };
  }

  // ════════════════════════════════════════════════════════════
  // CERTIFICACIONES
  // ════════════════════════════════════════════════════════════

  async function getCertifications() {
    if (_cache.certificationsCloud == null) {
      const userId = await getCurrentUserId();
      let cloud = [];

      if (userId) {
        const { data, error } = await _sb
          .from('certifications')
          .select('*')
          .eq('user_id', userId)
          .order('earned_at', { ascending: false });

        if (error) {
          console.error('getCertifications:', error);
        } else {
          cloud = (data || []).map(row => {
            const isEmployable = row.type === 'employable';
            const projectUrl = isEmployable && Array.isArray(row.modules) && row.modules[0]
              ? row.modules[0]
              : '';
            const pathId = isEmployable && String(row.ref_id || '').startsWith('employable:')
              ? String(row.ref_id).slice('employable:'.length)
              : (isEmployable ? row.ref_id : '');
            return {
              id:            row.id,
              refId:         row.ref_id,
              type:          row.type,
              title:         row.title,
              desc:          row.description,
              icon:          row.icon_url,
              pct:           row.pct,
              modules:       row.modules       || [],
              levelsCovered: row.levels_covered || [],
              lessonCount:   row.lesson_count  || 0,
              earnedAt:      new Date(row.earned_at).getTime(),
              projectUrl,
              pathId,
            };
          });
        }
      }
      _cache.certificationsCloud = cloud;
    }

    _cache.certifications = _mergeEmployableIntoList(_cache.certificationsCloud || []);
    return _cache.certifications;
  }

  async function tryAwardCertification(quizId, meta = {}) {
    const pct = meta.pct ?? 0;
    if (pct < CERT_MIN_PCT) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const cert = {
      user_id:     userId,
      ref_id:      quizId,
      type:        'quiz',
      title:       meta.title || `Certificado: ${quizId}`,
      description: meta.desc  || `Aprobado con ${pct}% de aciertos`,
      icon_url:    meta.icon  || '',
      pct,
      earned_at:   new Date().toISOString(),
    };

    // Solo actualiza si el nuevo pct es mayor
    const { data: existing } = await _sb
      .from('certifications')
      .select('pct')
      .eq('user_id', userId)
      .eq('ref_id',  quizId)
      .eq('type',    'quiz')
      .single();

    if (existing && pct <= existing.pct) return null;

    await _sb.from('certifications')
      .upsert(cert, { onConflict: 'user_id,ref_id,type' });

    _cache.certifications = null;
    _cache.certificationsCloud = null;
    _notify();
    return cert;
  }

  async function tryAwardExamCertification(courseId, meta = {}) {
    const pct = meta.pct ?? 0;
    if (pct < EXAM_CERT_MIN_PCT) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const cert = {
      user_id:        userId,
      ref_id:         courseId,
      type:           'exam',
      title:          meta.title || `Certificación profesional: ${courseId}`,
      description:    meta.desc  || `Examen práctico aprobado con ${pct}%`,
      icon_url:       meta.icon  || '',
      pct,
      modules:        meta.modules       || [],
      levels_covered: meta.levelsCovered || [],
      lesson_count:   meta.lessonCount   || 0,
      earned_at:      new Date().toISOString(),
    };

    const { data: existing } = await _sb
      .from('certifications')
      .select('pct')
      .eq('user_id', userId)
      .eq('ref_id',  courseId)
      .eq('type',    'exam')
      .single();

    if (existing && pct <= existing.pct) return null;

    await _sb.from('certifications')
      .upsert(cert, { onConflict: 'user_id,ref_id,type' });

    _cache.certifications = null;
    _cache.certificationsCloud = null;
    _notify();
    return cert;
  }

  /**
   * Ruta Empleable → mismo listado de Perfil → Certificaciones (type distinto a quiz/exam).
   * ref_id estable: employable:{pathId}
   */
  async function tryAwardEmployableCertification(pathId, meta = {}) {
    if (!pathId) return null;
    const refId = String(meta.refId || `employable:${pathId}`);
    const userId = await getCurrentUserId();
    if (!userId) {
      _cache.certifications = null;
      _cache.certificationsCloud = null;
      return null;
    }

    const earnedAt = meta.earnedAt
      ? new Date(meta.earnedAt).toISOString()
      : new Date().toISOString();

    const cert = {
      user_id:     userId,
      ref_id:      refId,
      type:        'employable',
      title:       meta.title || `Ruta Empleable: ${pathId}`,
      description: meta.desc || 'Proyecto real + certificado verificable IN4MIND',
      icon_url:    meta.icon || '',
      pct:         meta.pct ?? 100,
      modules:     meta.projectUrl ? [meta.projectUrl] : [],
      earned_at:   earnedAt,
    };

    try {
      await _sb.from('certifications')
        .upsert(cert, { onConflict: 'user_id,ref_id,type' });
    } catch (err) {
      console.error('tryAwardEmployableCertification:', err);
      return null;
    }

    _cache.certifications = null;
    _cache.certificationsCloud = null;
    _notify();
    return {
      refId,
      type: 'employable',
      title: cert.title,
      desc: cert.description,
      pct: cert.pct,
      earnedAt: new Date(earnedAt).getTime(),
      verifyCode: meta.verifyCode || '',
      projectUrl: meta.projectUrl || '',
      pathId,
    };
  }

  function _localEmployableCerts() {
    if (typeof EmployabilityService === 'undefined') return [];
    const state = EmployabilityService.getState?.() || { paths: {} };
    return Object.values(state.paths || {})
      .filter((rec) => rec && rec.certCode)
      .map((rec) => {
        const path = typeof CareerPathsData !== 'undefined'
          ? CareerPathsData.getPathById(rec.pathId)
          : null;
        const projectUrl = rec.projectUrl || '';
        return {
          id: `employable-${rec.pathId}`,
          refId: `employable:${rec.pathId}`,
          type: 'employable',
          title: path?.title || rec.pathId,
          desc: projectUrl
            ? `Proyecto: ${projectUrl}`
            : 'Ruta Empleable — certificado verificable',
          icon: '',
          pct: 100,
          modules: projectUrl ? [projectUrl] : [],
          earnedAt: rec.certIssuedAt || rec.updatedAt || Date.now(),
          verifyCode: rec.certCode,
          projectUrl,
          pathId: rec.pathId,
        };
      });
  }

  function _mergeEmployableIntoList(cloudList) {
    const map = new Map();
    for (const c of cloudList || []) {
      map.set(`${c.type || 'quiz'}:${c.refId}`, c);
    }
    for (const local of _localEmployableCerts()) {
      const key = `employable:${local.refId}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, local);
      } else {
        map.set(key, {
          ...existing,
          verifyCode: local.verifyCode || existing.verifyCode,
          projectUrl: local.projectUrl || existing.projectUrl,
          pathId: local.pathId || existing.pathId,
          modules: (local.modules && local.modules.length) ? local.modules : existing.modules,
          desc: existing.desc || local.desc,
        });
      }
    }
    return [...map.values()].sort((a, b) => (b.earnedAt || 0) - (a.earnedAt || 0));
  }

  async function syncEmployableCertifications() {
    const locals = _localEmployableCerts();
    if (!locals.length) return;
    await Promise.all(locals.map((c) => tryAwardEmployableCertification(c.pathId, {
      refId: c.refId,
      title: c.title,
      desc: c.desc,
      pct: 100,
      projectUrl: c.projectUrl,
      verifyCode: c.verifyCode,
      earnedAt: c.earnedAt,
    })));
  }

  async function hasExamCertification(courseId) {
    const certs = await getCertifications();
    return certs.some(c => c.refId === courseId && c.type === 'exam');
  }

  async function syncCertificationsFromQuizzes() {
    if (_certSyncPromise) return _certSyncPromise;
    _certSyncPromise = _syncCertificationsFromQuizzesImpl().finally(() => {
      _certSyncPromise = null;
    });
    return _certSyncPromise;
  }

  async function _syncCertificationsFromQuizzesImpl() {
    const progress = await getQuizProgress();
    const eligible = Object.entries(progress).filter(([, data]) => (data.pct || 0) >= CERT_MIN_PCT);
    if (!eligible.length) return;

    const userId = await getCurrentUserId();
    if (!userId) return;

    const { data: existing } = await _sb
      .from('certifications')
      .select('ref_id, pct')
      .eq('user_id', userId)
      .eq('type', 'quiz');

    const bestByRef = new Map((existing || []).map(row => [row.ref_id, row.pct || 0]));
    const pending = eligible.filter(([quizId, data]) => {
      const prev = bestByRef.get(quizId) ?? 0;
      return (data.pct || 0) > prev;
    });
    if (!pending.length) return;

    await Promise.all(pending.map(([quizId, data]) => tryAwardCertification(quizId, {
      title: `Certificado: ${data.title || quizId}`,
      icon:  data.icon,
      pct:   data.pct,
      desc:  `Aprobado con ${data.pct}% de aciertos`,
    })));
  }

  // ════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ════════════════════════════════════════════════════════════

  async function getStats() {
    const [saved, favorites, quizzes, certifications] = await Promise.all([
      getSaved(),
      getFavorites(),
      getQuizProgress(),
      getCertifications(),
    ]);
    return {
      saved:          saved.length,
      favorites:      favorites.length,
      quizzes:        Object.keys(quizzes).length,
      certifications: certifications.length,
    };
  }

  // ════════════════════════════════════════════════════════════
  // REQUISITOS DE CERTIFICACIÓN
  // ════════════════════════════════════════════════════════════

  async function getCertificationRequirements(courseId, totalLessons = 0) {
    if (!totalLessons && typeof TutorialData !== 'undefined') {
      totalLessons = TutorialData.getLessons(courseId).length;
    }
    const lessonStats  = await getCourseLessonStats(courseId, totalLessons);
    const quizPct      = await getQuizScoreForCourse(courseId);
    const quizPassed   = quizPct >= QUIZ_UNLOCK_EXAM_PCT;
    const examUnlocked = lessonStats.unlocked && quizPassed;

    return {
      lessonStats,
      quizPct,
      quizPassed,
      examUnlocked,
      lessonMinAvg: LESSON_EXAM_UNLOCK_AVG,
      quizMinPct:   QUIZ_UNLOCK_EXAM_PCT,
      examMinPct:   EXAM_CERT_MIN_PCT,
    };
  }

  async function isExamUnlocked(courseId, totalLessons = 0) {
    const req = await getCertificationRequirements(courseId, totalLessons);
    return req.examUnlocked;
  }

  function getExamId(courseId) {
    return `${courseId}-cert-exam`;
  }

  // ════════════════════════════════════════════════════════════
  // NOMBRE / PERFIL
  // ════════════════════════════════════════════════════════════

  async function updateDisplayName(name) {
    const trimmed = name?.trim();
    if (!trimmed) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Actualiza en Supabase
    const { error } = await _sb
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) { console.error('updateDisplayName:', error); return false; }

    // Actualiza también en sessionStorage para compatibilidad
    try {
      const user = getCurrentUser();
      if (user) {
        user.name = trimmed;
        sessionStorage.setItem('in4mind_user', JSON.stringify(user));
      }
    } catch { /* ignore */ }

    _notify();
    return true;
  }

  // ════════════════════════════════════════════════════════════
  // COMPATIBILIDAD — funciones que el resto del código llama
  // pero que con Supabase ya no son necesarias
  // ════════════════════════════════════════════════════════════

  async function mergeGuestIntoUser() {
    // Con Supabase Auth la sesión de invitado se maneja automáticamente.
    // Se mantiene la función para no romper el AuthController.
  }

  async function migrateSessionQuizProgress() {
    // Ya no es necesario migrar desde sessionStorage.
    // Se mantiene para no romper QuizzesController.
  }

  // ════════════════════════════════════════════════════════════
  // UTILIDADES
  // ════════════════════════════════════════════════════════════

  /** Convierte una fila de la BD al formato que usa el resto de la app */
  function _rowToItem(row) {
    return {
      id:        `${row.type}-${row.ref_id}`,
      type:      row.type,
      refId:     row.ref_id,
      title:     row.title       || '',
      desc:      row.description || '',
      icon:      row.icon_url    || '',
      color:     row.color_var   || '',
      savedAt:   row.saved_at   ? new Date(row.saved_at).getTime()   : Date.now(),
      visitedAt: row.visited_at ? new Date(row.visited_at).getTime() : Date.now(),
    };
  }

  function _visitT(key, params) {
    if (typeof I18n !== 'undefined') return I18n.t(`visit.${key}`, params);
    const fallbacks = {
      recent: 'Reciente',
      moment: 'Visto hace un momento',
      mins: `Visitado hace ${params?.n ?? 0} min`,
      hours: `Visitado hace ${params?.n ?? 0} h`,
      days: `Visitado hace ${params?.n ?? 0} días`,
      yesterday: 'Ayer',
    };
    return fallbacks[key] ?? '';
  }

  function formatVisitDate(ts) {
    if (!ts) return _visitT('recent');
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return _visitT('moment');
    if (mins < 60) return _visitT('mins', { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return _visitT('hours', { n: hours });
    const days = Math.floor(hours / 24);
    if (days === 1) return _visitT('yesterday');
    if (days < 7)   return _visitT('days', { n: days });
    const d = new Date(ts);
    const months = typeof I18n !== 'undefined'
      ? (I18n.t('visit.months') || [])
      : ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthLabel = Array.isArray(months) ? months[d.getMonth()] : months;
    return `${monthLabel} ${d.getDate()}`;
  }

  // ════════════════════════════════════════════════════════════
  // API PÚBLICA — misma interfaz que antes para no romper nada
  // ════════════════════════════════════════════════════════════
  return {
    // Usuario
    getCurrentUser,
    getCurrentUserId,
    updateDisplayName,
    mergeGuestIntoUser,
    migrateSessionQuizProgress,

    // Builders
    buildCourseItem,
    buildQuizItem,

    // Favoritos
    isFavorite,
    toggleFavorite,
    removeFavorite,
    getFavorites,

    // Guardados
    isSaved,
    toggleSaved,
    removeSaved,
    getSaved,

    // Visitas
    recordVisit,
    getRecentVisits,
    formatVisitDate,

    // Quizzes
    saveQuizProgress,
    getQuizProgress,
    getCompletedQuizCount,
    getQuizScoreForCourse,
    isQuizPassedForCert,

    // Lecciones
    saveLessonProgress,
    getLessonProgress,
    getLessonProgressSync,
    getLessonProgressCourseIds,
    getCourseLessonStats,

    // Certificaciones
    getCertifications,
    tryAwardCertification,
    tryAwardExamCertification,
    tryAwardEmployableCertification,
    hasExamCertification,
    syncCertificationsFromQuizzes,
    syncEmployableCertifications,
    getExamId,

    // Requisitos
    getCertificationRequirements,
    isExamUnlocked,

    // Estadísticas
    getStats,
    getStatsSync,
    hydrateCacheFromLocal,
    prefetchProfileData,

    // Constantes (otros controllers las usan)
    CERT_MIN_PCT,
    EXAM_CERT_MIN_PCT,
    LESSON_EXAM_UNLOCK_AVG,
    QUIZ_UNLOCK_EXAM_PCT,
    EVENT,
  };

})();

if (typeof module !== 'undefined') module.exports = UserProfileService;
