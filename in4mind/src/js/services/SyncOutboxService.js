/**
 * IN4MIND — Cola offline de escrituras a la nube.
 * Guarda operaciones fallidas en localStorage y las reintenta al volver online.
 */
'use strict';

const SyncOutboxService = (() => {
  const KEY = 'in4mind_sync_outbox';
  const MAX_ITEMS = 80;
  const MAX_ATTEMPTS = 8;
  const EVENT = 'in4mind-outbox-changed';

  function _read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function _write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ITEMS)));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { count: list.length } }));
      return true;
    } catch {
      return false;
    }
  }

  function enqueue(op) {
    if (!op || !op.table || !op.action) return false;
    const list = _read();
    const id = op.id || `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    // Dedup por table+action+conflictKey
    const key = op.conflictKey || null;
    const next = key
      ? list.filter(x => !(x.table === op.table && x.action === op.action && x.conflictKey === key))
      : list;
    next.push({
      id,
      table: op.table,
      action: op.action, // upsert | insert | delete | replace_blob
      payload: op.payload || {},
      match: op.match || null,
      conflict: op.conflict || null,
      conflictKey: key,
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return _write(next);
  }

  function size() {
    return _read().length;
  }

  function peek() {
    return _read();
  }

  async function _runOne(item, sb) {
    if (item.action === 'upsert') {
      const q = sb.from(item.table).upsert(item.payload, item.conflict ? { onConflict: item.conflict } : undefined);
      const { error } = await q;
      if (error) throw error;
      return;
    }
    if (item.action === 'insert') {
      const { error } = await sb.from(item.table).insert(item.payload);
      if (error) throw error;
      return;
    }
    if (item.action === 'delete') {
      let q = sb.from(item.table).delete();
      Object.entries(item.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (error) throw error;
      return;
    }
    if (item.action === 'replace_blob') {
      // payload: { user_id, blob, updated_at }
      const { error } = await sb.from(item.table).upsert(item.payload, {
        onConflict: item.conflict || 'user_id',
      });
      if (error) throw error;
      return;
    }
    throw new Error(`unknown_action:${item.action}`);
  }

  async function flush() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ok: false, reason: 'offline', flushed: 0, remaining: size() };
    }
    const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
    if (!sb) return { ok: false, reason: 'no_supabase', flushed: 0, remaining: size() };

    const list = _read();
    if (!list.length) return { ok: true, flushed: 0, remaining: 0 };

    const kept = [];
    let flushed = 0;

    for (const item of list) {
      try {
        await _runOne(item, sb);
        flushed += 1;
      } catch (err) {
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = String(err?.message || err);
        item.updatedAt = Date.now();
        if (item.attempts < MAX_ATTEMPTS) kept.push(item);
        else if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('outbox_drop', { table: item.table, error: item.lastError });
        }
      }
    }

    _write(kept);
    return { ok: kept.length === 0, flushed, remaining: kept.length };
  }

  return { enqueue, flush, size, peek, EVENT };
})();

if (typeof module !== 'undefined') module.exports = SyncOutboxService;
