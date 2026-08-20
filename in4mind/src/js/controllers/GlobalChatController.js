/**
 * IN4MIND — GlobalChatController
 *
 * Burbuja flotante con el chat global. Se monta desde `AppShell.initPage()`,
 * así que se inyecta sola en todas las páginas del shell sin tocar su HTML.
 *
 * Nada de lo que escribe un usuario se interpola en `innerHTML`: el texto, el
 * nombre y los enlaces se escriben con `textContent` sobre nodos ya creados.
 * Escapar a mano es fácil de olvidar en un sitio; así el XSS no depende de
 * acordarse.
 */

'use strict';

const GlobalChatController = (() => {

  const OPEN_KEY = 'in4mind_chat_open';
  /** Tras este hueco un mensaje del mismo autor vuelve a mostrar cabecera. */
  const GROUP_WINDOW_MS = 5 * 60 * 1000;
  /** Margen para considerar que el usuario está mirando el final del hilo. */
  const NEAR_BOTTOM_PX = 80;
  const MAX_RENDERED = 120;

  const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;

  let $root, $launcher, $panel, $messages, $input, $sendBtn, $statusText, $dot,
      $notice, $badge, $picker, $pickerList, $pickerSearch, $count;

  let _mounted = false;
  let _open = false;
  let _canPost = false;
  let _unread = 0;
  let _suppressed = false;
  let _openBeforeSuppress = false;
  let _lastMsg = null;
  let _noticeTimer = 0;
  let _cooldownTimer = 0;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _icon(paths, size = 18) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  }

  const ICONS = {
    chat: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    quiz: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  };

  // ── Montaje ──────────────────────────────────────────────────

  function _template() {
    return `
      <button class="gchat__launcher" id="gchat-launcher" type="button"
              aria-expanded="false" aria-controls="gchat-panel">
        <span class="gchat__launcher-icon">${_icon(ICONS.chat, 20)}</span>
        <span class="gchat__launcher-label"></span>
        <span class="gchat__unread" id="gchat-unread" hidden></span>
      </button>

      <section class="gchat__panel" id="gchat-panel" role="dialog"
               aria-labelledby="gchat-title" hidden>
        <header class="gchat__header">
          <div class="gchat__heading">
            <h2 class="gchat__title" id="gchat-title"></h2>
            <p class="gchat__status">
              <span class="gchat__dot" id="gchat-dot" aria-hidden="true"></span>
              <span class="gchat__status-text" id="gchat-status-text"></span>
              <span class="gchat__count" id="gchat-count" hidden></span>
            </p>
          </div>
          <div class="gchat__header-actions">
            <button class="gchat__icon-btn" id="gchat-quiz-btn" type="button"
                    aria-haspopup="true" aria-expanded="false">${_icon(ICONS.quiz)}</button>
            <button class="gchat__icon-btn" id="gchat-close" type="button">${_icon(ICONS.close)}</button>
          </div>
        </header>

        <div class="gchat__messages" id="gchat-messages" role="log"
             aria-live="polite" aria-relevant="additions" tabindex="0"></div>

        <div class="gchat__picker" id="gchat-picker" hidden>
          <input type="search" class="gchat__picker-search" id="gchat-picker-search"
                 autocomplete="off">
          <div class="gchat__picker-list" id="gchat-picker-list" role="listbox"></div>
        </div>

        <p class="gchat__notice" id="gchat-notice" role="status" hidden></p>

        <form class="gchat__composer" id="gchat-composer">
          <textarea class="gchat__input" id="gchat-input" rows="1"
                    maxlength="${GlobalChatService.MAX_LENGTH}"></textarea>
          <button class="gchat__send" id="gchat-send" type="submit">${_icon(ICONS.send)}</button>
        </form>
      </section>`;
  }

  function _mount() {
    if (_mounted) return;
    $root = document.createElement('aside');
    $root.className = 'gchat';
    $root.id = 'global-chat';
    $root.innerHTML = _template();
    document.body.appendChild($root);

    $launcher = $root.querySelector('#gchat-launcher');
    $panel = $root.querySelector('#gchat-panel');
    $messages = $root.querySelector('#gchat-messages');
    $input = $root.querySelector('#gchat-input');
    $sendBtn = $root.querySelector('#gchat-send');
    $statusText = $root.querySelector('#gchat-status-text');
    $dot = $root.querySelector('#gchat-dot');
    $notice = $root.querySelector('#gchat-notice');
    $badge = $root.querySelector('#gchat-unread');
    $picker = $root.querySelector('#gchat-picker');
    $pickerList = $root.querySelector('#gchat-picker-list');
    $pickerSearch = $root.querySelector('#gchat-picker-search');
    $count = $root.querySelector('#gchat-count');

    _mounted = true;
    _applyLabels();
  }

  /** Todo el texto fijo, en un solo sitio para poder recargarlo al cambiar idioma. */
  function _applyLabels() {
    if (!_mounted) return;
    const title = _t('chat.title', null, 'Chat global');
    $root.querySelector('#gchat-title').textContent = title;
    $root.querySelector('.gchat__launcher-label').textContent = title;
    $launcher.setAttribute('aria-label', _t('chat.openAria', null, 'Abrir el chat global'));
    $root.querySelector('#gchat-close').setAttribute('aria-label', _t('chat.minimize', null, 'Minimizar el chat'));
    $root.querySelector('#gchat-close').title = _t('chat.minimize', null, 'Minimizar el chat');
    const quizBtn = $root.querySelector('#gchat-quiz-btn');
    quizBtn.setAttribute('aria-label', _t('chat.shareQuiz', null, 'Compartir un quiz'));
    quizBtn.title = _t('chat.shareQuiz', null, 'Compartir un quiz');
    $sendBtn.setAttribute('aria-label', _t('chat.send', null, 'Enviar'));
    $sendBtn.title = _t('chat.send', null, 'Enviar');
    $pickerSearch.placeholder = _t('chat.quizSearch', null, 'Buscar un quiz…');
    $messages.setAttribute('aria-label', title);
    _applyComposerState();
    _renderStatus();
  }

  // ── Pintado de mensajes ──────────────────────────────────────

  function _initials(name) {
    const clean = String(name || '').trim();
    if (!clean) return '?';
    const parts = clean.split(/\s+/).slice(0, 2);
    return parts.map(p => p.charAt(0).toUpperCase()).join('');
  }

  function _timeLabel(ts) {
    try {
      return new Date(ts).toLocaleTimeString(document.documentElement.lang || undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }

  /**
   * Escribe texto libre repartiendo enlaces en anclas propias. Al no construir
   * HTML no hay nada que escapar: los trozos van como nodos de texto.
   *
   * Los enlaces internos navegan en la misma pestaña a propósito, porque las
   * páginas de la app llevan `data-requires-auth` y es AuthGuard quien manda a
   * login y devuelve al destino. Abrirlos en otra pestaña rompería ese vuelta.
   */
  function _appendRichText(target, text) {
    const value = String(text ?? '');
    let cursor = 0;
    URL_RE.lastIndex = 0;

    for (let match = URL_RE.exec(value); match; match = URL_RE.exec(value)) {
      if (match.index > cursor) {
        target.appendChild(document.createTextNode(value.slice(cursor, match.index)));
      }

      const href = match[0];
      let internal = false;
      try {
        internal = new URL(href).origin === window.location.origin;
      } catch { /* URL rara: se trata como externa */ }

      const a = document.createElement('a');
      a.className = 'gchat-msg__link';
      a.href = href;
      a.textContent = href;
      a.rel = 'noopener noreferrer';
      if (!internal) a.target = '_blank';
      target.appendChild(a);

      cursor = match.index + href.length;
    }

    if (cursor < value.length) {
      target.appendChild(document.createTextNode(value.slice(cursor)));
    }
  }

  function _quizCard(msg) {
    const att = msg.attachment || {};
    const safeUrl = typeof GlobalChatService.quizChallengeHref === 'function'
      ? GlobalChatService.quizChallengeHref(att)
      : GlobalChatService.sanitizeInternalUrl(att.url);
    if (!safeUrl) {
      const fallback = document.createElement('p');
      fallback.className = 'gchat-msg__text';
      _appendRichText(fallback, msg.body || att.title || '');
      return fallback;
    }

    const card = document.createElement('a');
    card.className = 'gchat-quiz';
    card.href = safeUrl;
    card.rel = 'noopener';
    if (att.quizId) card.dataset.quizId = att.quizId;
    card.addEventListener('click', (e) => {
      const quizId = att.quizId || '';
      try {
        if (quizId) sessionStorage.setItem('in4mind_open_quiz', quizId);
      } catch { /* ignore */ }
      if (typeof AuthGuard !== 'undefined' && AuthGuard.stashPendingRedirect) {
        AuthGuard.stashPendingRedirect(safeUrl);
        AuthGuard.setRedirect?.(safeUrl);
      }
      if (typeof AuthGuard !== 'undefined' && AuthGuard.hasSession && !AuthGuard.hasSession()) {
        e.preventDefault();
        const login = new URL('login.html', window.location.href);
        login.searchParams.set('next', safeUrl);
        window.location.replace(login.toString());
      }
    });

    const icon = document.createElement('span');
    icon.className = 'gchat-quiz__icon';
    icon.innerHTML = _icon(ICONS.quiz, 20);

    const copy = document.createElement('span');
    copy.className = 'gchat-quiz__copy';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'gchat-quiz__eyebrow';
    eyebrow.textContent = _t('chat.quizEyebrow', null, 'Reto de quiz');

    const topic = att.title || msg.body || att.quizId || '';
    const title = document.createElement('span');
    title.className = 'gchat-quiz__title';
    title.textContent = _t('chat.quizCardTitle', { topic },
      `¡Resuelve este quiz sobre ${topic}!`);

    copy.append(eyebrow, title);

    const cta = document.createElement('span');
    cta.className = 'gchat-quiz__cta';
    cta.textContent = _t('chat.quizCta', null, 'Resolver');

    card.append(icon, copy, cta);
    return card;
  }

  function _renderMessage(msg, ownId) {
    const grouped = _lastMsg
      && _lastMsg.userId === msg.userId
      && (msg.createdAt - _lastMsg.createdAt) < GROUP_WINDOW_MS;

    const row = document.createElement('article');
    row.className = 'gchat-msg';
    if (ownId && msg.userId === ownId) row.classList.add('gchat-msg--own');
    if (grouped) row.classList.add('gchat-msg--grouped');
    row.dataset.id = msg.id;

    const avatar = document.createElement('span');
    avatar.className = 'gchat-msg__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = _initials(msg.author);

    const body = document.createElement('div');
    body.className = 'gchat-msg__body';

    if (!grouped) {
      const meta = document.createElement('header');
      meta.className = 'gchat-msg__meta';

      const author = document.createElement('span');
      author.className = 'gchat-msg__author';
      author.textContent = msg.author;

      const role = document.createElement('span');
      role.className = 'gchat-msg__badge gchat-msg__badge--role';
      role.textContent = _t('chat.roleStudent', null, 'Estudiante');

      const badge = document.createElement('span');
      badge.className = 'gchat-msg__badge';
      badge.textContent = _t('chat.levelBadge', { n: msg.level }, `Nivel ${msg.level}`);

      const time = document.createElement('time');
      time.className = 'gchat-msg__time';
      time.dateTime = new Date(msg.createdAt).toISOString();
      time.textContent = _timeLabel(msg.createdAt);

      meta.append(author, role, badge, time);
      body.appendChild(meta);
    }

    if (msg.kind === 'quiz' && (msg.attachment?.quizId || msg.attachment?.url)) {
      body.appendChild(_quizCard(msg));
    } else {
      const text = document.createElement('p');
      text.className = 'gchat-msg__text';
      _appendRichText(text, msg.body);
      body.appendChild(text);
    }

    row.append(avatar, body);
    _lastMsg = msg;
    return row;
  }

  function _isNearBottom() {
    return $messages.scrollHeight - $messages.scrollTop - $messages.clientHeight < NEAR_BOTTOM_PX;
  }

  function _scrollToEnd(smooth = false) {
    $messages.scrollTo({
      top: $messages.scrollHeight,
      behavior: smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'smooth'
        : 'auto',
    });
  }

  function _ownId() {
    // El id de auth.users es el que firma cada fila; el de la sesión local
    // puede diferir si el usuario entró por el login demo sin Supabase Auth.
    return GlobalChatService.getAuthUserId()
      || (typeof UserProfileService !== 'undefined'
        ? UserProfileService.getCurrentUser()?.id
        : null)
      || null;
  }

  function _appendMessage(msg, { keepScroll = false } = {}) {
    const stick = keepScroll ? false : _isNearBottom();
    $messages.querySelector('.gchat__empty')?.remove();
    $messages.appendChild(_renderMessage(msg, _ownId()));

    while ($messages.children.length > MAX_RENDERED) {
      $messages.removeChild($messages.firstElementChild);
    }

    if (!keepScroll && (stick || msg.userId === _ownId())) _scrollToEnd(true);
  }

  function _renderEmpty() {
    const empty = document.createElement('p');
    empty.className = 'gchat__empty';
    empty.textContent = _t('chat.empty', null, 'Todavía no hay mensajes. Rompe el hielo.');
    $messages.appendChild(empty);
  }

  // ── Estado de conexión ───────────────────────────────────────

  function _renderStatus() {
    if (!_mounted) return;
    const state = GlobalChatService.getState();
    const online = state === GlobalChatService.STATE.ONLINE;
    const connecting = state === GlobalChatService.STATE.CONNECTING;

    $dot.classList.toggle('gchat__dot--online', online);
    $dot.classList.toggle('gchat__dot--connecting', connecting);

    $statusText.textContent = online
      ? _t('chat.online', null, 'En vivo')
      : connecting
        ? _t('chat.connecting', null, 'Conectando…')
        : _t('chat.offline', null, 'Sin conexión');

    const count = GlobalChatService.getOnlineCount();
    if (online && count > 0) {
      $count.hidden = false;
      $count.innerHTML = _icon(ICONS.users, 13);
      $count.appendChild(document.createTextNode(String(count)));
      $count.setAttribute('aria-label', _t('chat.onlineCount', { n: count }, `${count} en línea`));
    } else {
      $count.hidden = true;
    }
  }

  function _showNotice(text) {
    $notice.textContent = text;
    $notice.hidden = false;
    clearTimeout(_noticeTimer);
    _noticeTimer = setTimeout(() => { $notice.hidden = true; }, 3200);
  }

  function _applyComposerState() {
    if (!_mounted) return;
    const state = GlobalChatService.getState();
    const usable = _canPost && state === GlobalChatService.STATE.ONLINE;

    $input.disabled = !usable;
    $sendBtn.disabled = !usable;
    $root.querySelector('#gchat-quiz-btn').disabled = !usable;

    $input.placeholder = !_canPost
      ? _t('chat.needsAccount', null, 'Inicia sesión para escribir')
      : state === GlobalChatService.STATE.ONLINE
        ? _t('chat.placeholder', null, 'Escribe un mensaje…')
        : _t('chat.reconnecting', null, 'Sin conexión con el chat');
  }

  // ── Apertura y cierre ────────────────────────────────────────

  function _setOpen(open, { remember = true } = {}) {
    _open = open;
    $panel.hidden = !open;
    $root.classList.toggle('gchat--open', open);
    $launcher.setAttribute('aria-expanded', String(open));

    if (remember) {
      try { localStorage.setItem(OPEN_KEY, open ? '1' : '0'); } catch { /* ignore */ }
    }

    if (open) {
      _unread = 0;
      $badge.hidden = true;
      _scrollToEnd();
      if (!$input.disabled) $input.focus();
    }
  }

  function _bumpUnread() {
    _unread += 1;
    $badge.hidden = false;
    $badge.textContent = _unread > 9 ? '9+' : String(_unread);
  }

  // ── Selector de quiz ─────────────────────────────────────────

  /** Quiz que el usuario tiene delante, si está en la página de quizzes. */
  function _currentQuizId() {
    try {
      const ctx = typeof ShareService !== 'undefined' ? ShareService.getContext() : null;
      if (ctx?.page === 'quizzes.html' && ctx.params?.quiz) return String(ctx.params.quiz);
    } catch { /* ignore */ }
    return new URLSearchParams(window.location.search).get('quiz');
  }

  function _availableQuizzes() {
    let list = [];
    try {
      if (typeof DataService !== 'undefined') {
        list = DataService.getCourses().map(c => ({ id: c.id, title: c.title, icon: c.icon }));
      }
    } catch { /* sin catálogo: el selector queda vacío */ }

    // Compartir el quiz que se está viendo es el caso más probable.
    const current = _currentQuizId();
    if (!current) return list;
    const i = list.findIndex(q => q.id === current);
    return i > 0 ? [list[i], ...list.slice(0, i), ...list.slice(i + 1)] : list;
  }

  /** Ruta relativa portable; el receptor la resuelve en su propio origen. */
  function _quizUrl(quizId) {
    return `quizzes.html?quiz=${encodeURIComponent(quizId)}`;
  }

  function _renderPickerList(filter = '') {
    const needle = filter.trim().toLowerCase();
    const items = _availableQuizzes()
      .filter(q => !needle || q.title.toLowerCase().includes(needle))
      .slice(0, 40);

    $pickerList.textContent = '';

    if (!items.length) {
      const none = document.createElement('p');
      none.className = 'gchat__picker-empty';
      none.textContent = _t('chat.quizNone', null, 'Ningún quiz coincide.');
      $pickerList.appendChild(none);
      return;
    }

    items.forEach(quiz => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gchat__picker-item';
      btn.dataset.quizId = quiz.id;
      btn.setAttribute('role', 'option');

      if (quiz.icon) {
        const img = document.createElement('img');
        img.src = quiz.icon;
        img.alt = '';
        img.loading = 'lazy';
        img.width = 18;
        img.height = 18;
        btn.appendChild(img);
      }

      const label = document.createElement('span');
      label.textContent = quiz.title;
      btn.appendChild(label);

      $pickerList.appendChild(btn);
    });
  }

  function _togglePicker(force) {
    const open = force !== undefined ? force : $picker.hidden;
    $picker.hidden = !open;
    $root.querySelector('#gchat-quiz-btn').setAttribute('aria-expanded', String(open));
    if (open) {
      $pickerSearch.value = '';
      _renderPickerList();
      $pickerSearch.focus();
    }
  }

  async function _shareQuiz(quizId) {
    const quiz = _availableQuizzes().find(q => q.id === quizId);
    if (!quiz) return;

    _togglePicker(false);
    const res = await GlobalChatService.sendQuizCard({
      quizId: quiz.id,
      title: quiz.title,
      url: _quizUrl(quiz.id),
    });
    _reportSendResult(res);
  }

  // ── Envío ────────────────────────────────────────────────────

  function _reportSendResult(res) {
    if (res.ok) {
      _appendMessage(res.message);
      return;
    }
    if (res.reason === 'cooldown') {
      _showNotice(_t('chat.cooldown', null, 'Espera un momento antes de enviar otro mensaje.'));
      _lockBriefly(res.waitMs || GlobalChatService.COOLDOWN_MS);
      return;
    }
    if (res.reason === 'too_long') {
      _showNotice(_t('chat.tooLong', { n: GlobalChatService.MAX_LENGTH },
        `El mensaje supera los ${GlobalChatService.MAX_LENGTH} caracteres.`));
      return;
    }
    if (res.reason === 'unauthenticated') {
      _showNotice(_t('chat.needsAccount', null, 'Inicia sesión para escribir'));
      return;
    }
    if (res.reason !== 'empty') {
      _showNotice(_t('chat.sendFail', null, 'No se pudo enviar el mensaje.'));
    }
  }

  /** Desactiva el envío mientras dura el enfriamiento, en vez de solo avisar. */
  function _lockBriefly(ms) {
    $sendBtn.disabled = true;
    clearTimeout(_cooldownTimer);
    _cooldownTimer = setTimeout(() => { _applyComposerState(); }, ms);
  }

  async function _submit() {
    const text = $input.value;
    if (!text.trim()) return;

    $input.value = '';
    _autoGrow();
    const res = await GlobalChatService.send(text);
    if (!res.ok && res.reason !== 'empty') $input.value = text;
    _reportSendResult(res);
  }

  function _autoGrow() {
    $input.style.height = 'auto';
    $input.style.height = `${Math.min($input.scrollHeight, 120)}px`;
  }

  // ── Silencio durante un quiz ─────────────────────────────────

  /**
   * Un examen no debe competir con el chat por la atención. En vez de un
   * evento propio se observa la clase que ya marca la vista de quiz activa,
   * que es la única fuente de verdad que tiene QuizzesController.
   */
  function _watchQuizView() {
    const view = document.getElementById('quizzes-quiz-view');
    if (!view) return;

    const sync = () => setSuppressed(view.classList.contains('quiz-view--visible'));
    new MutationObserver(sync).observe(view, { attributes: true, attributeFilter: ['class'] });
    sync();
  }

  function setSuppressed(quiet) {
    if (!_mounted || _suppressed === quiet) return;
    _suppressed = quiet;

    if (quiet) {
      _openBeforeSuppress = _open;
      if (_open) _setOpen(false, { remember: false });
    }

    $root.classList.toggle('gchat--hidden', quiet);
    $root.setAttribute('aria-hidden', String(quiet));

    if (!quiet && _openBeforeSuppress) _setOpen(true, { remember: false });
  }

  // ── Arranque ─────────────────────────────────────────────────

  function _bind() {
    $launcher.addEventListener('click', () => _setOpen(!_open));
    $root.querySelector('#gchat-close').addEventListener('click', () => _setOpen(false));

    $root.querySelector('#gchat-composer').addEventListener('submit', e => {
      e.preventDefault();
      void _submit();
    });

    $input.addEventListener('keydown', e => {
      // Enter envía; Shift+Enter deja seguir escribiendo en varias líneas.
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void _submit();
      }
    });
    $input.addEventListener('input', _autoGrow);

    $root.querySelector('#gchat-quiz-btn').addEventListener('click', () => _togglePicker());
    $pickerSearch.addEventListener('input', () => _renderPickerList($pickerSearch.value));
    $pickerList.addEventListener('click', e => {
      const btn = e.target.closest('.gchat__picker-item');
      if (btn) void _shareQuiz(btn.dataset.quizId);
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      // Solo si el foco está dentro del chat: si no, Escape pertenece al
      // modal o al panel que el usuario tenga abierto encima.
      if (!$root.contains(document.activeElement)) return;
      if (!$picker.hidden) { _togglePicker(false); return; }
      if (_open) { _setOpen(false); $launcher.focus(); }
    });

    window.addEventListener('in4mind-locale-change', _applyLabels);
    window.addEventListener('in4mind-relocalize', _applyLabels);
  }

  async function init() {
    if (_mounted) return;
    if (typeof GlobalChatService === 'undefined') return;

    // Sin sesión no hay chat: help.html es pública y no debe mostrarlo.
    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    if (!user) return;

    _mount();
    _bind();
    _watchQuizView();

    let wantsOpen = false;
    try { wantsOpen = localStorage.getItem(OPEN_KEY) === '1'; } catch { /* ignore */ }
    // En móvil el panel tapa la pantalla: mejor que arranque plegado.
    if (wantsOpen && window.innerWidth > 640) _setOpen(true, { remember: false });

    GlobalChatService.on('status', () => { _renderStatus(); _applyComposerState(); });
    GlobalChatService.on('presence', _renderStatus);

    const { canPost } = await GlobalChatService.connect();
    _canPost = canPost;
    _applyComposerState();

    const history = await GlobalChatService.loadHistory();
    $messages.textContent = '';
    _lastMsg = null;
    if (history.length) {
      const ownId = _ownId();
      history.forEach(msg => $messages.appendChild(_renderMessage(msg, ownId)));
      _scrollToEnd();
    } else {
      _renderEmpty();
    }

    // El oyente se registra al final a propósito: pintar el historial vacía el
    // contenedor, y un mensaje que llegara entremedias se borraría de la vista
    // sin volver nunca, porque el servicio ya lo tendría por entregado.
    GlobalChatService.on('message', msg => {
      _appendMessage(msg);
      if (!_open && msg.userId !== _ownId()) _bumpUnread();
    });
  }

  /** Vacía el chat UI y cierra el panel (logout / cambio de sesión). */
  function teardown() {
    try { localStorage.removeItem(OPEN_KEY); } catch { /* ignore */ }
    _open = false;
    _unread = 0;
    _lastMsg = null;
    _canPost = false;
    _suppressed = false;
    if ($messages) $messages.innerHTML = '';
    if ($root) {
      try { $root.remove(); } catch { /* ignore */ }
    }
    $root = $launcher = $panel = $messages = $input = $sendBtn = null;
    $statusText = $dot = $notice = $badge = $picker = $pickerList = $pickerSearch = $count = null;
    _mounted = false;
  }

  return { init, setSuppressed, isOpen: () => _open, teardown };

})();

if (typeof module !== 'undefined') module.exports = GlobalChatController;
