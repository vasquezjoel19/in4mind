/**
 * IN4MIND — Verificación del JWT de Supabase en las funciones serverless.
 *
 * Vercel no enruta archivos ni carpetas que empiezan por `_`, así que este
 * módulo se despliega como dependencia pero nunca como endpoint.
 *
 * Por qué existe: `/api/groq/chat` era anónimo. El navegador no puede llamarlo
 * desde otro origen sin CORS, pero `curl` sí, así que cualquiera podía usar el
 * proxy —y la cuota de Groq de la cuenta— como un LLM gratuito. Ahora hay que
 * presentar el access token de una sesión real de Supabase Auth.
 *
 * Dos caminos, en este orden:
 *   1. SUPABASE_JWT_SECRET → verificación local HS256 (sin red, ~0 ms).
 *      Dashboard: Project Settings → API → JWT Secret.
 *   2. SUPABASE_URL + SUPABASE_ANON_KEY → se pregunta a `/auth/v1/user`.
 *      Es lo que funciona con las claves asimétricas (ES256/RS256) nuevas.
 *
 * La anon key es pública (va en el bundle del navegador), así que usarla aquí
 * no expone nada; el secreto real, si se configura, es el JWT secret.
 */
'use strict';

const crypto = require('crypto');

/* Mismos valores por defecto que scripts/generate-config.js, para que el
 * despliegue no se quede sin verificación si faltan las variables. Cualquier
 * valor en el entorno tiene prioridad. */
const DEFAULT_SUPABASE_URL = 'https://opocfwypcucpbrbpdixi.supabase.co';

/** Resultado cacheado de la verificación remota: evita un viaje por mensaje. */
const CACHE_TTL_MS = 60 * 1000;
const CACHE_MAX = 500;
const _cache = new Map(); // hash(token) → { at, user }

let _warned = false;

function _warnOnce(message) {
  if (_warned) return;
  _warned = true;
  console.warn(`[supabase-auth] ${message}`);
}

function _env(name) {
  const raw = process.env[name];
  return raw == null ? '' : String(raw).trim();
}

function _supabaseUrl() {
  return (_env('SUPABASE_URL') || DEFAULT_SUPABASE_URL).replace(/\/+$/, '');
}

/** Clave `apikey` que exige el endpoint /auth/v1/user (pública por diseño). */
function _anonKey() {
  return _env('SUPABASE_ANON_KEY');
}

/** Extrae el token del encabezado `Authorization: Bearer <jwt>`. */
function bearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(String(header).trim());
  return match ? match[1].trim() : '';
}

function _b64urlToBuffer(part) {
  const padded = String(part).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64');
}

function _decode(token) {
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  try {
    return {
      header: JSON.parse(_b64urlToBuffer(parts[0]).toString('utf8')),
      payload: JSON.parse(_b64urlToBuffer(parts[1]).toString('utf8')),
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: _b64urlToBuffer(parts[2]),
    };
  } catch {
    return null;
  }
}

/**
 * Verificación local HS256. Devuelve null si no aplica (algoritmo asimétrico,
 * secreto sin configurar) para que el llamador use la vía remota.
 */
function _verifyHs256(token) {
  const secret = _env('SUPABASE_JWT_SECRET');
  if (!secret) return null;

  const decoded = _decode(token);
  if (!decoded) return { ok: false, reason: 'malformed' };
  if (decoded.header?.alg !== 'HS256') return null; // claves asimétricas → remoto

  const expected = crypto.createHmac('sha256', secret).update(decoded.signingInput).digest();
  if (expected.length !== decoded.signature.length
      || !crypto.timingSafeEqual(expected, decoded.signature)) {
    return { ok: false, reason: 'bad_signature' };
  }

  const { payload } = decoded;
  const now = Math.floor(Date.now() / 1000);
  if (!payload?.sub) return { ok: false, reason: 'no_subject' };
  if (typeof payload.exp === 'number' && payload.exp <= now) {
    return { ok: false, reason: 'expired' };
  }
  // Solo sesiones de usuario: un token con role `anon` no es alguien con cuenta.
  if (payload.role && payload.role !== 'authenticated') {
    return { ok: false, reason: 'not_authenticated_role' };
  }

  return { ok: true, user: { id: payload.sub, email: payload.email || null } };
}

function _cacheKey(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function _cacheGet(key) {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    _cache.delete(key);
    return null;
  }
  return hit.user;
}

function _cacheSet(key, user) {
  if (_cache.size >= CACHE_MAX) {
    // Map conserva el orden de inserción: el primero es el más viejo.
    _cache.delete(_cache.keys().next().value);
  }
  _cache.set(key, { at: Date.now(), user });
}

/** Verificación contra Supabase. Sirve para HS256 y para claves asimétricas. */
async function _verifyRemote(token) {
  const anonKey = _anonKey();
  if (!anonKey) {
    _warnOnce(
      'Sin SUPABASE_JWT_SECRET ni SUPABASE_ANON_KEY no se puede validar la sesión: '
      + '/api/groq/chat responderá 503. Defínelas en Vercel → Settings → Environment Variables.'
    );
    return { ok: false, reason: 'not_configured' };
  }

  const key = _cacheKey(token);
  const cached = _cacheGet(key);
  if (cached) return { ok: true, user: cached, cached: true };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`${_supabaseUrl()}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) return { ok: false, reason: 'invalid' };
    if (!res.ok) return { ok: false, reason: `upstream_${res.status}` };

    const user = await res.json().catch(() => null);
    if (!user?.id) return { ok: false, reason: 'invalid' };

    const slim = { id: user.id, email: user.email || null };
    _cacheSet(key, slim);
    return { ok: true, user: slim };
  } catch (err) {
    return { ok: false, reason: err?.name === 'AbortError' ? 'timeout' : 'unreachable' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ¿Hay forma de verificar sesiones en este despliegue?
 * @returns {boolean}
 */
function isAuthConfigured() {
  return Boolean(_env('SUPABASE_JWT_SECRET') || _anonKey());
}

/**
 * Verifica el access token de Supabase Auth.
 *
 * @param {string} token
 * @returns {Promise<{ ok: boolean, user?: { id: string, email: string|null }, reason?: string }>}
 */
async function verifyAccessToken(token) {
  if (!token) return { ok: false, reason: 'missing' };

  const local = _verifyHs256(token);
  // null = este token no lo puede juzgar la vía local; false = lo juzgó y no vale.
  if (local) return local;

  return _verifyRemote(token);
}

/**
 * Exige sesión válida y responde el error correcto si no la hay.
 * Devuelve el usuario, o null cuando ya se ha respondido a la petición.
 */
async function requireUser(req, res) {
  if (!isAuthConfigured()) {
    // Sin poder verificar no se abre la puerta: fallar cerrado, no abierto.
    res.status(503).json({
      error: 'AUTH_NOT_CONFIGURED',
      hint: 'Define SUPABASE_JWT_SECRET (o SUPABASE_ANON_KEY) en las variables de entorno.',
    });
    return null;
  }

  const token = bearerToken(req);
  const result = await verifyAccessToken(token);

  if (!result.ok) {
    if (result.reason === 'timeout' || result.reason === 'unreachable') {
      res.status(503).json({ error: 'AUTH_UNAVAILABLE', reason: result.reason });
      return null;
    }
    // Caso real: hay JWT_SECRET pero el proyecto emite claves asimétricas, así
    // que la verificación tiene que ir por red y falta la anon key.
    if (result.reason === 'not_configured') {
      res.status(503).json({
        error: 'AUTH_NOT_CONFIGURED',
        hint: 'Este token necesita verificación remota: define SUPABASE_ANON_KEY.',
      });
      return null;
    }
    res.setHeader('WWW-Authenticate', 'Bearer realm="in4mind"');
    res.status(401).json({ error: 'AUTH_REQUIRED', reason: result.reason });
    return null;
  }

  return result.user;
}

module.exports = {
  bearerToken,
  verifyAccessToken,
  requireUser,
  isAuthConfigured,
};
