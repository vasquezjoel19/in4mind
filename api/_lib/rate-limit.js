/**
 * IN4MIND — Límite de uso del proxy de IA, por usuario.
 *
 * Dos capas, porque ninguna sirve sola:
 *
 * 1. RÁFAGA (en memoria). Ventana deslizante por usuario dentro de la propia
 *    instancia. Cuesta cero y corta el bucle `while true` al instante. Su
 *    límite es real: en Vercel cada instancia tiene su memoria y puede haber
 *    varias vivas, así que el tope efectivo se multiplica por el número de
 *    instancias y se pierde en cada arranque en frío. Sirve contra el abuso
 *    accidental y el ruido, no contra alguien decidido.
 *
 * 2. CUOTA DIARIA (Supabase). Cuenta en la base, así que es la misma para
 *    todas las instancias y sobrevive a los reinicios. Es la que de verdad
 *    protege la cuota de Groq de la cuenta. Ver la migración
 *    supabase/migrations/20260921_ai_usage_quota.sql.
 *
 * Configuración (todo opcional, 0 desactiva):
 *   GROQ_RATE_LIMIT_PER_MIN   por defecto 15
 *   GROQ_RATE_LIMIT_PER_DAY   por defecto 200
 */
'use strict';

const DEFAULT_PER_MIN = 15;
const DEFAULT_PER_DAY = 200;

/** Tope de usuarios distintos en memoria; evita que el mapa crezca sin fin. */
const MAX_TRACKED_USERS = 5000;

const _hits = new Map(); // userId → number[] (marcas de tiempo, ms)

let _warnedQuota = false;

function _intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === '') return fallback;
  const parsed = Number(String(raw).trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(`[rate-limit] ${name}="${raw}" no es un número válido; se usan ${fallback}.`);
    return fallback;
  }
  return Math.floor(parsed);
}

function perMinuteLimit() {
  return _intEnv('GROQ_RATE_LIMIT_PER_MIN', DEFAULT_PER_MIN);
}

function perDayLimit() {
  return _intEnv('GROQ_RATE_LIMIT_PER_DAY', DEFAULT_PER_DAY);
}

/**
 * Capa 1: ventana deslizante en memoria.
 *
 * @param {string} userId
 * @param {{ limit?: number, windowMs?: number, now?: number }} [opts]
 * @returns {{ allowed: boolean, used: number, limit: number, retryAfter: number }}
 *   retryAfter en segundos (0 si se permite).
 */
function checkBurst(userId, opts = {}) {
  const limit = opts.limit ?? perMinuteLimit();
  const windowMs = opts.windowMs ?? 60_000;
  const now = opts.now ?? Date.now();

  if (!limit) return { allowed: true, used: 0, limit: 0, retryAfter: 0 };

  const since = now - windowMs;
  const previous = _hits.get(userId) || [];
  // Solo se conservan las marcas dentro de la ventana: la lista nunca crece
  // más allá del propio límite.
  const recent = previous.filter(ts => ts > since);

  if (recent.length >= limit) {
    _hits.set(userId, recent);
    const oldest = recent[0];
    return {
      allowed: false,
      used: recent.length,
      limit,
      retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  recent.push(now);

  if (!_hits.has(userId) && _hits.size >= MAX_TRACKED_USERS) {
    // Map conserva el orden de inserción: fuera el más antiguo.
    _hits.delete(_hits.keys().next().value);
  }
  _hits.set(userId, recent);

  return { allowed: true, used: recent.length, limit, retryAfter: 0 };
}

/** Solo para los tests: vacía el estado en memoria. */
function _resetBurst() {
  _hits.clear();
}

/**
 * Capa 2: cuota diaria compartida.
 *
 * Llama a la RPC `ai_usage_hit` con el JWT del propio usuario, así que no hace
 * falta la service_role key: la fila que inserta es suya y la política RLS no
 * le deja borrarla ni modificarla.
 *
 * @param {string} accessToken  JWT de la petición
 * @returns {Promise<{ allowed: boolean, used?: number, limit?: number,
 *                     retryAfter?: number, skipped?: string }>}
 */
async function checkDailyQuota(accessToken) {
  const limit = perDayLimit();
  if (!limit) return { allowed: true, skipped: 'disabled' };

  const url = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

  // Sin estas dos no hay forma de contar en la base. No se bloquea el
  // asistente por ello: la capa de ráfaga sigue activa y la sesión ya es
  // obligatoria, pero conviene que se vea en los logs y en /api/health.
  if (!url || !anonKey || !accessToken) {
    if (!_warnedQuota) {
      _warnedQuota = true;
      console.warn('[rate-limit] Sin SUPABASE_URL/SUPABASE_ANON_KEY no se aplica la cuota '
        + 'diaria compartida; queda solo el límite por instancia.');
    }
    return { allowed: true, skipped: 'not_configured' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${url}/rest/v1/rpc/ai_usage_hit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ window_minutes: 1440, max_calls: limit }),
      signal: controller.signal,
    });

    if (res.status === 404) {
      if (!_warnedQuota) {
        _warnedQuota = true;
        console.warn('[rate-limit] La RPC ai_usage_hit no existe: aplica la migración '
          + 'supabase/migrations/20260921_ai_usage_quota.sql para activar la cuota diaria.');
      }
      return { allowed: true, skipped: 'rpc_missing' };
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[rate-limit] ai_usage_hit', res.status, detail.slice(0, 200));
      // Un fallo de la base no puede dejar sin asistente a quien sí tiene cuota.
      return { allowed: true, skipped: `rpc_http_${res.status}` };
    }

    const data = await res.json().catch(() => null);
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') {
      return { allowed: true, skipped: 'rpc_bad_shape' };
    }

    if (row.allowed) return { allowed: true, used: row.used, limit };

    const resetAt = row.reset_at ? Date.parse(row.reset_at) : NaN;
    const retryAfter = Number.isFinite(resetAt)
      ? Math.max(60, Math.ceil((resetAt - Date.now()) / 1000))
      : 3600;

    return { allowed: false, used: row.used, limit, retryAfter };
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    console.error('[rate-limit] ai_usage_hit', aborted ? 'timeout' : err);
    return { allowed: true, skipped: aborted ? 'timeout' : 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/** ¿Puede aplicarse la cuota compartida en este despliegue? */
function isQuotaConfigured() {
  return Boolean(
    perDayLimit()
    && (process.env.SUPABASE_URL || '').trim()
    && (process.env.SUPABASE_ANON_KEY || '').trim()
  );
}

module.exports = {
  checkBurst,
  checkDailyQuota,
  isQuotaConfigured,
  perMinuteLimit,
  perDayLimit,
  _resetBurst,
};
