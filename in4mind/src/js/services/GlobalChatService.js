/**
 * IN4MIND — GlobalChatService
 *
 * Capa de datos del chat global: una sola sala compartida por toda la
 * plataforma. Es la primera parte de la app que usa Supabase Realtime.
 *
 * El transporte es `postgres_changes` sobre `chat_messages` en lugar de
 * `broadcast`: así enviar es únicamente insertar la fila, y todo lo que se ve
 * en pantalla está necesariamente guardado. Con broadcast habría que emitir e
 * insertar por separado, y cualquier fallo entre ambos dejaría mensajes que
 * unos ven y otros no.
 *
 * La presencia del mismo canal alimenta el contador de gente conectada.
 *
 * Este servicio no genera HTML: devuelve datos en crudo y quien los pinta se
 * encarga de escaparlos.
 */

'use strict';

const GlobalChatService = (() => {

  const _sb = typeof _sbClient !== 'undefined' ? _sbClient : null;

  const CHANNEL = 'in4mind-global-chat';
  const TABLE = 'chat_messages';

  /** Suficiente para dar contexto al abrir sin pagar una consulta pesada. */
  const HISTORY_LIMIT = 40;
  /** Debe ir por encima del intervalo del trigger para fallar aquí y no en la BD. */
  const COOLDOWN_MS = 1500;
  const MAX_LENGTH = 500;
  /** Tope del buffer en memoria; el DOM se poda aparte. */
  const MAX_BUFFER = 200;

  const STATE = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    ONLINE: 'online',
    OFFLINE: 'offline',
  };

  let _channel = null;
  let _state = STATE.IDLE;
  let _onlineCount = 0;
  let _lastSentAt = 0;
  let _authUser = null;
  let _connectPromise = null;
  /** ids ya emitidos: el eco del propio INSERT llega también por Realtime. */
  const _seenIds = new Set();
  const _listeners = { message: [], presence: [], status: [] };

  function _emit(event, payload) {
    (_listeners[event] || []).forEach(cb => {
      try { cb(payload); } catch { /* un oyente roto no tumba a los demás */ }
    });
  }

  function _setState(next) {
    if (_state === next) return;
    _state = next;
    _emit('status', { state: _state, onlineCount: _onlineCount });
  }

  /**
   * Usuario de Supabase Auth. Hace falta el id real de `auth.users` porque la
   * política de inserción exige `user_id = auth.uid()`; el id que guarda la
   * sesión local no sirve cuando se entró por el login demo.
   */
  async function _getAuthUser() {
    if (_authUser !== null) return _authUser;
    if (!_sb) { _authUser = false; return _authUser; }
    try {
      const { data } = await _sb.auth.getUser();
      _authUser = data?.user || false;
    } catch {
      _authUser = false;
    }
    return _authUser;
  }

  /** Nombre visible, con el mismo criterio que usa el avatar del shell. */
  function _displayName() {
    const local = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    const fromAuth = _authUser && _authUser !== false
      ? (_authUser.user_metadata?.name || _authUser.email?.split('@')[0])
      : null;
    return (local?.name || fromAuth || local?.email?.split('@')[0] || 'Usuario').slice(0, 80);
  }

  /** Nivel de gamificación propio, para acompañar al nombre como insignia. */
  function _authorLevel() {
    try {
      return typeof GamificationService !== 'undefined' ? GamificationService.getLevel() : 1;
    } catch {
      return 1;
    }
  }

  function _rowToMessage(row) {
    return {
      id: row.id,
      userId: row.user_id,
      author: row.author_name,
      level: row.author_level || 1,
      body: row.body,
      kind: row.kind || 'text',
      attachment: row.attachment || null,
      createdAt: new Date(row.created_at).getTime(),
    };
  }

  function _remember(id) {
    _seenIds.add(id);
    if (_seenIds.size > MAX_BUFFER) {
      // Set conserva el orden de inserción: el más viejo es el primero.
      _seenIds.delete(_seenIds.values().next().value);
    }
  }

  /** Últimos mensajes en orden cronológico ascendente. */
  async function loadHistory() {
    if (!_sb) return [];
    try {
      const { data, error } = await _sb
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(HISTORY_LIMIT);

      if (error) {
        console.error('GlobalChat.loadHistory:', error.message);
        return [];
      }

      const messages = (data || []).map(_rowToMessage).reverse();
      messages.forEach(m => _remember(m.id));
      return messages;
    } catch (err) {
      console.error('GlobalChat.loadHistory:', err);
      return [];
    }
  }

  function _handleInsert(payload) {
    const row = payload?.new;
    if (!row || _seenIds.has(row.id)) return;
    _remember(row.id);
    _emit('message', _rowToMessage(row));
  }

  function _handlePresenceSync() {
    if (!_channel) return;
    const state = _channel.presenceState() || {};
    _onlineCount = Object.keys(state).length;
    _emit('presence', { onlineCount: _onlineCount });
  }

  /**
   * Abre el canal. Es idempotente: llamadas simultáneas comparten la promesa.
   * @returns {Promise<{state:string, canPost:boolean}>}
   */
  function connect() {
    if (_connectPromise) return _connectPromise;

    _connectPromise = (async () => {
      if (!_sb) {
        _setState(STATE.OFFLINE);
        return { state: _state, canPost: false };
      }

      _setState(STATE.CONNECTING);
      const user = await _getAuthUser();

      _channel = _sb.channel(CHANNEL, {
        config: { presence: { key: user ? user.id : `anon-${Math.random().toString(36).slice(2)}` } },
      });

      _channel
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, _handleInsert)
        .on('presence', { event: 'sync' }, _handlePresenceSync)
        .on('presence', { event: 'join' }, _handlePresenceSync)
        .on('presence', { event: 'leave' }, _handlePresenceSync);

      await new Promise(resolve => {
        let settled = false;
        const done = () => { if (!settled) { settled = true; resolve(); } };

        _channel.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            _setState(STATE.ONLINE);
            if (user) {
              try {
                await _channel.track({ name: _displayName(), at: Date.now() });
              } catch { /* la presencia es decorativa: no bloquea el chat */ }
            }
            done();
            return;
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            _setState(STATE.OFFLINE);
            done();
          }
        });

        // Un proyecto pausado no responde ni con error: no dejar la UI colgada.
        setTimeout(() => {
          if (!settled) _setState(STATE.OFFLINE);
          done();
        }, 8000);
      });

      return { state: _state, canPost: Boolean(user) };
    })();

    return _connectPromise;
  }

  function disconnect() {
    if (_channel && _sb) {
      try { _sb.removeChannel(_channel); } catch { /* ignore */ }
    }
    _channel = null;
    _connectPromise = null;
    _onlineCount = 0;
    _setState(STATE.IDLE);
  }

  /** Colapsa espacios y quita controles invisibles usados para camuflar spam. */
  function _normalize(text) {
    return String(text ?? '')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function _cooldownLeft() {
    return Math.max(0, COOLDOWN_MS - (Date.now() - _lastSentAt));
  }

  async function _insert({ body, kind, attachment }) {
    const user = await _getAuthUser();
    if (!user) return { ok: false, reason: 'unauthenticated' };

    const waitMs = _cooldownLeft();
    if (waitMs > 0) return { ok: false, reason: 'cooldown', waitMs };

    // Se marca antes de la red para que dos envíos rápidos no la esquiven.
    _lastSentAt = Date.now();

    const row = {
      user_id: user.id,
      author_name: _displayName(),
      author_level: _authorLevel(),
      body,
      kind,
      attachment: attachment || null,
    };

    const { data, error } = await _sb.from(TABLE).insert(row).select().single();

    if (error) {
      // El trigger rechaza si otra pestaña envió hace menos de un segundo.
      const rateLimited = /rate_limited/.test(error.message || '');
      if (!rateLimited) _lastSentAt = 0;
      console.error('GlobalChat.send:', error.message);
      return { ok: false, reason: rateLimited ? 'cooldown' : 'error', waitMs: COOLDOWN_MS };
    }

    const message = _rowToMessage(data);
    _remember(message.id);
    return { ok: true, message };
  }

  /**
   * Envía un mensaje de texto.
   * @returns {Promise<{ok:boolean, message?:object, reason?:string, waitMs?:number}>}
   */
  async function send(text) {
    const body = _normalize(text);
    if (!body) return { ok: false, reason: 'empty' };
    if (body.length > MAX_LENGTH) return { ok: false, reason: 'too_long' };
    return _insert({ body, kind: 'text' });
  }

  /**
   * Comparte un quiz como tarjeta.
   * @param {{quizId:string, title:string, url:string}} quiz
   */
  async function sendQuizCard(quiz) {
    if (!quiz?.quizId || !quiz?.url) return { ok: false, reason: 'empty' };
    const safeUrl = sanitizeInternalUrl(quiz.url);
    if (!safeUrl) return { ok: false, reason: 'empty' };
    return _insert({
      body: _normalize(quiz.title || quiz.quizId).slice(0, MAX_LENGTH),
      kind: 'quiz',
      attachment: {
        quizId: String(quiz.quizId).slice(0, 80),
        title: String(quiz.title || quiz.quizId).slice(0, 200),
        url: safeUrl,
      },
    });
  }

  function on(event, cb) {
    if (!_listeners[event] || typeof cb !== 'function') return () => {};
    _listeners[event].push(cb);
    return () => {
      const i = _listeners[event].indexOf(cb);
      if (i >= 0) _listeners[event].splice(i, 1);
    };
  }

  async function canPost() {
    return Boolean(await _getAuthUser());
  }

  /** Id de auth.users, el mismo que firma cada fila de `chat_messages`. */
  function getAuthUserId() {
    return _authUser && _authUser !== false ? _authUser.id : null;
  }

  /**
   * Solo se aceptan URLs http(s) del propio origen. Un attachment malicioso
   * podría colar `javascript:` o un dominio externo disfrazado de quiz.
   */
  function sanitizeInternalUrl(raw) {
    try {
      const url = new URL(String(raw || ''), window.location.origin);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      if (url.origin !== window.location.origin) return null;
      return url.toString();
    } catch {
      return null;
    }
  }

  /** Invalida el usuario cacheado tras un login o logout. */
  function resetAuth() {
    _authUser = null;
  }

  return {
    connect,
    disconnect,
    loadHistory,
    send,
    sendQuizCard,
    on,
    canPost,
    getAuthUserId,
    sanitizeInternalUrl,
    resetAuth,
    getState: () => _state,
    getOnlineCount: () => _onlineCount,
    getCooldownLeft: _cooldownLeft,
    STATE,
    MAX_LENGTH,
    COOLDOWN_MS,
  };

})();

if (typeof module !== 'undefined') module.exports = GlobalChatService;
