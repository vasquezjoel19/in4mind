/**
 * IN4MIND — Sync de blobs de usuario (notas, proyectos, intentos de quiz).
 * Local-first + upsert a Supabase; si falla, encola en SyncOutboxService.
 */
'use strict';

const CloudBlobSync = (() => {
  const TABLES = {
    notes: 'user_notes',
    projects: 'user_projects',
    quizAttempts: 'quiz_attempts',
  };

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

  async function pushBlob(kind, blob) {
    const table = TABLES[kind];
    if (!table) return { ok: false, reason: 'unknown_kind' };

    const userId = await _userId();
    if (!userId) return { ok: false, reason: 'no_user' };

    const payload = {
      user_id: userId,
      blob: blob || {},
      updated_at: new Date().toISOString(),
    };

    const sb = _sb();
    if (!sb || (typeof ConnectivityService !== 'undefined' && !ConnectivityService.isOnline())) {
      if (typeof SyncOutboxService !== 'undefined') {
        SyncOutboxService.enqueue({
          table,
          action: 'replace_blob',
          payload,
          conflict: 'user_id',
          conflictKey: `${table}:${userId}`,
        });
      }
      return { ok: false, queued: true, reason: 'offline_or_no_sb' };
    }

    try {
      const { error } = await sb.from(table).upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      if (typeof SyncOutboxService !== 'undefined') {
        SyncOutboxService.enqueue({
          table,
          action: 'replace_blob',
          payload,
          conflict: 'user_id',
          conflictKey: `${table}:${userId}`,
        });
      }
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('cloud_blob_push_fail', { kind, message: err?.message || String(err) });
      }
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(
          typeof I18n !== 'undefined'
            ? (I18n.t('connectivity.saveLocal') !== 'connectivity.saveLocal'
              ? I18n.t('connectivity.saveLocal')
              : 'Guardado en este dispositivo. Se sincronizará al recuperar la conexión.')
            : 'Guardado en este dispositivo. Se sincronizará al recuperar la conexión.',
          2800
        );
      }
      return { ok: false, queued: true, reason: err?.message || 'upsert_failed' };
    }
  }

  async function pullBlob(kind) {
    const table = TABLES[kind];
    if (!table) return null;
    const userId = await _userId();
    const sb = _sb();
    if (!userId || !sb) return null;
    try {
      const { data, error } = await sb.from(table).select('blob, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('cloud_blob_pull_fail', { kind, message: err?.message || String(err) });
      }
      return null;
    }
  }

  /**
   * Fusiona blob remoto con local por updatedAt (última escritura gana por id).
   * `tombstones` evita que un id borrado localmente "reviva" desde la nube.
   * @param {Record<string, object>} localMap
   * @param {Record<string, object>} remoteMap
   * @param {Record<string, number>} [tombstones]
   */
  function mergeMaps(localMap, remoteMap, tombstones) {
    const out = { ...(remoteMap || {}) };
    Object.entries(localMap || {}).forEach(([id, local]) => {
      const remote = out[id];
      if (!remote || (local.updatedAt || 0) >= (remote.updatedAt || 0)) {
        out[id] = local;
      }
    });
    Object.entries(tombstones || {}).forEach(([id, ts]) => {
      const remote = out[id];
      if (!remote || Number(ts || 0) >= (remote.updatedAt || 0)) {
        delete out[id];
      }
    });
    return out;
  }

  function mergeTombstones(localTs, remoteTs) {
    const out = { ...(remoteTs || {}) };
    Object.entries(localTs || {}).forEach(([id, ts]) => {
      out[id] = Math.max(Number(out[id] || 0), Number(ts || 0));
    });
    return out;
  }

  return { pushBlob, pullBlob, mergeMaps, mergeTombstones, TABLES };
})();

if (typeof module !== 'undefined') module.exports = CloudBlobSync;
