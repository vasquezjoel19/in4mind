/**
 * IN4MIND — Quién puede usar las funciones serverless.
 *
 * `/api/groq/chat` era un proxy de LLM abierto: sin origen ni sesión, cualquiera
 * con la URL podía gastar la cuota de Groq del proyecto desde un script. Los
 * límites que ya había (tamaño y número de mensajes) encarecen el abuso, pero no
 * lo impiden.
 *
 * Dos comprobaciones, en este orden:
 *   1. Origen — barata, descarta el tráfico que no viene del sitio.
 *   2. Sesión de Supabase — la que de verdad manda: un `Origin` se falsifica
 *      trivialmente desde fuera de un navegador, un token válido no.
 *
 * Vercel no enruta ficheros que empiezan por `_`, así que esto se despliega como
 * dependencia y nunca como endpoint.
 */
'use strict';

/* Mismos valores por defecto que `scripts/generate-config.js`: si las variables
   no estuvieran disponibles en tiempo de ejecución, la verificación seguiría
   funcionando en vez de dejar la puerta abierta o tirar el asistente. La clave
   anónima es pública por diseño — es la que viaja al navegador. */
const SUPABASE_URL = (process.env.SUPABASE_URL || 'https://opocfwypcucpbrbpdixi.supabase.co').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wb2Nmd3lwY3VjcGJyYnBkaXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzcyMTUsImV4cCI6MjA5NzIxMzIxNX0.-rKhtMGBnhF0uBS4B0hmvpMfGkQ5K_if52SonLWEm1o';

const AUTH_TIMEOUT_MS = 5000;

/* Positivos en caché: un token válido lo sigue siendo durante su vigencia, y sin
   esto cada mensaje añadiría una ida y vuelta a Supabase. Los negativos no se
   cachean, para que revocar una sesión surta efecto de inmediato. */
const TOKEN_TTL_MS = 60 * 1000;
const MAX_CACHE = 500;
const _tokenCache = new Map();   // token -> { at, userId }

function _cacheGet(token) {
  const hit = _tokenCache.get(token);
  if (!hit) return null;
  if (Date.now() - hit.at > TOKEN_TTL_MS) {
    _tokenCache.delete(token);
    return null;
  }
  return hit;
}

function _cacheSet(token, userId) {
  // Map conserva el orden de inserción: el primero es el más antiguo.
  if (_tokenCache.size >= MAX_CACHE) {
    _tokenCache.delete(_tokenCache.keys().next().value);
  }
  _tokenCache.set(token, { at: Date.now(), userId });
}

/** Orígenes permitidos: el propio despliegue, los alias configurados y dev. */
function _allowedOrigins(req) {
  const list = new Set();

  const extra = String(process.env.ALLOWED_ORIGINS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  extra.forEach(o => list.add(o.replace(/\/+$/, '')));

  // El dominio con el que ha llegado la petición: cubre producción, las
  // previsualizaciones de cada rama y los dominios propios sin configurar nada.
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    list.add(`${proto}://${host}`);
  }
  if (process.env.VERCEL_URL) list.add(`https://${process.env.VERCEL_URL}`);

  // Desarrollo local contra el mismo backend.
  ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://127.0.0.1:8100']
    .forEach(o => list.add(o));

  return list;
}

/**
 * @returns {{ ok: boolean, reason?: string, origin?: string }}
 */
function checkOrigin(req) {
  const origin = req.headers.origin
    || (req.headers.referer ? _originOf(req.headers.referer) : '');

  // Sin `Origin` ni `Referer` no se puede afirmar que venga del sitio. Los
  // navegadores mandan `Origin` en toda petición POST con CORS o same-origin,
  // así que la ausencia apunta a un cliente que no es un navegador.
  if (!origin) return { ok: false, reason: 'ORIGIN_MISSING' };

  const allowed = _allowedOrigins(req);
  if (!allowed.has(origin.replace(/\/+$/, ''))) {
    return { ok: false, reason: 'ORIGIN_NOT_ALLOWED', origin };
  }
  return { ok: true, origin };
}

function _originOf(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

function _bearer(req) {
  const raw = req.headers.authorization || req.headers.Authorization || '';
  const m = /^Bearer\s+(.+)$/i.exec(String(raw).trim());
  return m ? m[1].trim() : '';
}

/**
 * Comprueba la sesión contra Supabase.
 *
 * Se pregunta a `/auth/v1/user` en vez de validar la firma aquí: no hace falta
 * guardar el secreto JWT en otra variable más, y además respeta las sesiones
 * revocadas, cosa que una verificación de firma local no vería.
 *
 * @returns {Promise<{ ok: boolean, reason?: string, userId?: string }>}
 */
async function verifySession(req) {
  const token = _bearer(req);
  if (!token) return { ok: false, reason: 'AUTH_TOKEN_MISSING' };

  const cached = _cacheGet(token);
  if (cached) return { ok: true, userId: cached.userId, cached: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, reason: 'AUTH_TOKEN_INVALID' };
    }
    if (!res.ok) {
      // Si Supabase falla, no se puede confirmar la sesión. Se rechaza: dejar
      // pasar "por si acaso" convertiría una caída suya en una puerta abierta.
      return { ok: false, reason: 'AUTH_UNAVAILABLE' };
    }

    const data = await res.json().catch(() => null);
    if (!data?.id) return { ok: false, reason: 'AUTH_TOKEN_INVALID' };

    _cacheSet(token, data.id);
    return { ok: true, userId: data.id };
  } catch (err) {
    return {
      ok: false,
      reason: err && err.name === 'AbortError' ? 'AUTH_TIMEOUT' : 'AUTH_UNAVAILABLE',
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Puerta completa para un endpoint. Devuelve `null` si la petición pasa, o el
 * objeto de error ya listo para responder.
 *
 * @returns {Promise<null | { status: number, body: object }>}
 */
async function guard(req) {
  const origin = checkOrigin(req);
  if (!origin.ok) {
    return { status: 403, body: { error: 'FORBIDDEN_ORIGIN', reason: origin.reason } };
  }

  const session = await verifySession(req);
  if (!session.ok) {
    const transient = session.reason === 'AUTH_UNAVAILABLE' || session.reason === 'AUTH_TIMEOUT';
    return {
      status: transient ? 503 : 401,
      body: { error: transient ? 'AUTH_UNAVAILABLE' : 'UNAUTHENTICATED', reason: session.reason },
    };
  }

  return null;
}

module.exports = { guard, checkOrigin, verifySession, SUPABASE_URL };
