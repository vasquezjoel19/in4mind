/**
 * IN4MIND — AIChatController
 * Chat profesional con Groq IA (vista tipo Gemini).
 */

'use strict';

const AIChatController = (() => {

  const RECENT_KEY = 'in4mind_ai_recent';
  const MAX_RECENT = 6;
  const MAX_HISTORY = 20;

  let _history = [];
  let _isLoading = false;
  let $welcome, $thread, $typingRow, $scroll;
  let $input, $sendBtn, $status, $configBanner, $userInitial;

  const SUGGESTIONS = [
    { label: 'Plataforma IN4MIND', hint: 'Cursos, quizzes y perfil', msg: '¿Cómo utilizo la plataforma IN4MIND: cursos, quizzes, dashboard y perfil?' },
    { label: 'Cursos disponibles', hint: 'Catálogo educativo IN4MIND', msg: '¿Qué cursos puedo estudiar en IN4MIND?' },
    { label: 'Fundamentos de Python', hint: 'Curso IN4MIND de Python', msg: 'Explique los fundamentos de Python según el curso de IN4MIND.' },
    { label: 'Ciberseguridad', hint: 'Phishing, contraseñas y MFA', msg: '¿Qué es el phishing y cómo me protejo según IN4MIND?' },
  ];

  function _escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _renderMarkdown(text) {
    let html = _escapeHtml(text);

    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code>${code.trim()}</code></pre>`
    );

    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    const lines = html.split('\n');
    let out = '';
    let inUl = false;
    let inOl = false;

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        if (inUl) { out += '</ul>'; inUl = false; }
        if (inOl) { out += '</ol>'; inOl = false; }
        continue;
      }
      if (/^<h[34]>/.test(line) || /^<pre>/.test(line)) {
        if (inUl) { out += '</ul>'; inUl = false; }
        if (inOl) { out += '</ol>'; inOl = false; }
        out += line;
        continue;
      }
      if (/^[-•*]\s+/.test(line)) {
        if (!inUl) { if (inOl) { out += '</ol>'; inOl = false; } out += '<ul>'; inUl = true; }
        out += `<li>${line.replace(/^[-•*]\s+/, '')}</li>`;
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        if (!inOl) { if (inUl) { out += '</ul>'; inUl = false; } out += '<ol>'; inOl = true; }
        out += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
        continue;
      }
      if (inUl) { out += '</ul>'; inUl = false; }
      if (inOl) { out += '</ol>'; inOl = false; }
      out += `<p>${line}</p>`;
    }
    if (inUl) out += '</ul>';
    if (inOl) out += '</ol>';

    return `<div class="ai-md">${out}</div>`;
  }

  function _showThread() {
    if ($welcome) $welcome.style.display = 'none';
    if ($thread) $thread.style.display = 'flex';
  }

  function _appendTurn(role, content) {
    _showThread();

    const turn = document.createElement('article');
    turn.className = `ai-turn ai-turn--${role === 'user' ? 'user' : 'ai'}`;

    const avatar = document.createElement('div');
    avatar.className = `ai-turn__avatar ai-turn__avatar--${role === 'user' ? 'user' : 'ai'}`;
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = role === 'user' ? ($userInitial || 'U') : 'IA';

    const body = document.createElement('div');
    body.className = 'ai-turn__body';

    const roleLabel = document.createElement('div');
    roleLabel.className = 'ai-turn__role';
    roleLabel.textContent = role === 'user' ? 'Usted' : 'IN4MIND Assistant';

    const contentEl = document.createElement('div');
    contentEl.className = 'ai-turn__content';

    if (role === 'user') {
      contentEl.textContent = content;
    } else {
      contentEl.innerHTML = _renderMarkdown(content);
    }

    body.appendChild(roleLabel);
    body.appendChild(contentEl);
    turn.appendChild(avatar);
    turn.appendChild(body);

    $thread.insertBefore(turn, $typingRow);
    _scrollToBottom();
    return contentEl;
  }

  function _beginStreamingTurn() {
    _showThread();
    const contentEl = _appendTurn('ai', '');
    contentEl.innerHTML = '<span class="ai-cursor" aria-hidden="true"></span>';
    contentEl.classList.add('is-streaming');
    return contentEl;
  }

  function _updateStreamingContent(contentEl, text, done) {
    if (!contentEl) return;
    const html = _renderMarkdown(text || '');
    contentEl.innerHTML = done
      ? html
      : (html + '<span class="ai-cursor" aria-hidden="true"></span>');
    if (done) contentEl.classList.remove('is-streaming');
    _scrollToBottom();
  }

  async function _streamLocal(text, onChunk) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      onChunk(text);
      return text;
    }
    const parts = String(text).split(/(\s+)/);
    let out = '';
    for (const part of parts) {
      out += part;
      onChunk(out);
      await new Promise(r => setTimeout(r, part.trim() ? 18 : 8));
    }
    return text;
  }

  function _scrollToBottom() {
    requestAnimationFrame(() => {
      if ($scroll) $scroll.scrollTop = $scroll.scrollHeight;
    });
  }

  function _showTyping(show) {
    if (!$typingRow) return;
    $typingRow.style.display = show ? 'flex' : 'none';
    if (show) _scrollToBottom();
  }

  function _saveRecent(userMsg) {
    try {
      const list = JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]');
      const entry = {
        msg: userMsg.slice(0, 72),
        date: new Date().toLocaleDateString('es', { day: 'numeric', month: 'short' }),
      };
      const filtered = list.filter(r => r.msg !== entry.msg);
      filtered.unshift(entry);
      sessionStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, MAX_RECENT)));
      _renderRecentSidebar();
    } catch (_) { /* ignore */ }
  }

  function _renderRecentSidebar() {
    const wrap = document.getElementById('sidebar-recent');
    if (!wrap) return;

    let list = [];
    try {
      list = JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]');
    } catch (_) { /* ignore */ }

    const items = list.length ? list : SUGGESTIONS.slice(0, 3).map(s => ({
      msg: s.msg,
      date: 'Sugerido',
    }));

    wrap.innerHTML = `
      <p class="sidebar__recent-title">Conversaciones</p>
      ${items.map(item => `
        <div class="recent-item" data-msg="${item.msg.replace(/"/g, '&quot;')}" tabindex="0" role="button">
          <span class="recent-item__icon">◆</span>
          <div class="recent-item__meta">
            <h4>${item.msg.length > 36 ? item.msg.slice(0, 36) + '…' : item.msg}</h4>
            <p>${item.date}</p>
          </div>
        </div>
      `).join('')}
    `;

    wrap.querySelectorAll('.recent-item').forEach(el => {
      const go = () => { if (el.dataset.msg) _sendMessage(el.dataset.msg); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
      });
    });
  }

  function _renderSuggestions() {
    const wrap = document.getElementById('suggestions');
    if (!wrap) return;

    wrap.innerHTML = SUGGESTIONS.map(s => `
      <button type="button" class="ai-suggestion" data-msg="${s.msg.replace(/"/g, '&quot;')}">
        <div class="ai-suggestion__label">${s.label}</div>
        <div class="ai-suggestion__hint">${s.hint}</div>
      </button>
    `).join('');

    wrap.querySelectorAll('.ai-suggestion').forEach(el => {
      el.addEventListener('click', () => _sendMessage(el.dataset.msg));
    });
  }

  function _t(key, fallback) {
    const value = typeof I18n !== 'undefined' ? I18n.t(key) : '';
    return value && value !== key ? value : fallback;
  }

  function _statusText() {
    return GroqService.isConfigured()
      ? _t('ai.connected', 'Conectado a Groq IA')
      : _t('ai.localMode', 'Modo local');
  }

  function _checkConfigBanner() {
    $configBanner?.classList.toggle('is-visible', !GroqService.isConfigured());
    if ($status) $status.textContent = _statusText();
  }

  async function _getReply(userMessage) {
    if (typeof AIKnowledge !== 'undefined' && !AIKnowledge.isInScope(userMessage)) {
      return AIKnowledge.getOffTopicResponse();
    }
    if (GroqService.isConfigured()) {
      return GroqService.chat(_history);
    }
    if (typeof AIKnowledge !== 'undefined') {
      return AIKnowledge.findResponse(userMessage);
    }
    throw new Error('NO_ENGINE');
  }

  function _errorMessage(err) {
    const code = err?.message || '';
    if (code === 'GROQ_API_KEY_MISSING') {
      return '**Configuración requerida**\n\nPara activar Groq IA, defina la variable `GROQ_API_KEY` en Vercel (Settings → Environment Variables) y vuelva a desplegar.\n\n- Obtenga la clave en https://console.groq.com/keys\n- La clave permanece en el servidor: nunca se expone en el navegador\n- Recargue esta página con Ctrl + Shift + R';
    }
    if (code === 'GROQ_API_KEY_INVALID') {
      return '**Credencial no válida**\n\nLa API Key configurada fue rechazada. Verifique que la clave sea correcta y que no haya expirado en la consola de Groq.';
    }
    if (code.startsWith('GROQ_HTTP_')) {
      return '**Servicio temporalmente no disponible**\n\nNo fue posible completar la solicitud con Groq. Intente nuevamente en unos momentos.';
    }
    return '**Error de procesamiento**\n\nOcurrió un inconveniente al generar la respuesta. Reformule su consulta o verifique la conexión a internet.';
  }

  async function _sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || _isLoading) return;

    _isLoading = true;
    $sendBtn.disabled = true;
    $input.value = '';
    _autoResizeInput();
    if ($status) $status.textContent = _t('ai.generating', 'Generando respuesta…');

    _appendTurn('user', trimmed);
    _saveRecent(trimmed);

    const offTopic = typeof AIKnowledge !== 'undefined' && !AIKnowledge.isInScope(trimmed);

    if (!offTopic) {
      _history.push({ role: 'user', content: trimmed });
      if (_history.length > MAX_HISTORY) {
        _history = _history.slice(-MAX_HISTORY);
      }
    }

    _showTyping(true);

    try {
      let reply;
      const useStream = !offTopic && GroqService.isConfigured() && typeof GroqService.chatStream === 'function';

      if (useStream) {
        let contentEl = null;
        try {
          reply = await GroqService.chatStream(_history, (partial) => {
            if (!contentEl) {
              _showTyping(false);
              contentEl = _beginStreamingTurn();
            }
            _updateStreamingContent(contentEl, partial, false);
          });
          _showTyping(false);
          if (!contentEl) contentEl = _beginStreamingTurn();
          _updateStreamingContent(contentEl, reply, true);
        } catch (streamErr) {
          _showTyping(false);
          contentEl?.closest('.ai-turn')?.remove();
          throw streamErr;
        }
      } else {
        reply = offTopic
          ? AIKnowledge.getOffTopicResponse()
          : await _getReply(trimmed);
        _showTyping(false);
        if (offTopic || !GroqService.isConfigured()) {
          const contentEl = _beginStreamingTurn();
          await _streamLocal(reply, (partial) => _updateStreamingContent(contentEl, partial, false));
          _updateStreamingContent(contentEl, reply, true);
        } else {
          _appendTurn('ai', reply);
        }
      }

      if (!offTopic) {
        _history.push({ role: 'assistant', content: reply });
      }
      if ($status) $status.textContent = _statusText();
    } catch (err) {
      _showTyping(false);
      if (!offTopic) _history.pop();
      _appendTurn('ai', _errorMessage(err));
      if ($status) $status.textContent = _t('ai.error', 'Error en la solicitud');
      console.error('[IN4MIND IA / Groq]', err);
    } finally {
      _isLoading = false;
      $sendBtn.disabled = false;
      $input.focus();
    }
  }

  function _newChat() {
    _history = [];
    if ($thread) {
      $thread.querySelectorAll('.ai-turn').forEach(el => el.remove());
      $thread.style.display = 'none';
    }
    if ($welcome) $welcome.style.display = 'flex';
    if ($status) $status.textContent = _statusText();
    $input?.focus();
  }

  function _autoResizeInput() {
    if (!$input) return;
    $input.style.height = 'auto';
    $input.style.height = `${Math.min($input.scrollHeight, 140)}px`;
  }

  function init() {
    $welcome       = document.getElementById('chat-welcome');
    $thread        = document.getElementById('chat-thread');
    $typingRow     = document.getElementById('typing-row');
    $scroll        = document.getElementById('chat-scroll');
    $input         = document.getElementById('chat-input');
    $sendBtn       = document.getElementById('btn-send');
    $status        = document.getElementById('chat-status');
    $configBanner  = document.getElementById('config-banner');

    AppShell.initPage('ai');

    try {
      const userRaw = sessionStorage.getItem('in4mind_user');
      let user = null;
      if (userRaw) {
        try { user = JSON.parse(userRaw); } catch (_) { /* ignore */ }
      }
      $userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

      if ($status) $status.textContent = 'Verificando asistente…';
      GroqService.init().then(_checkConfigBanner).catch(_checkConfigBanner);
      _renderSuggestions();
      _renderRecentSidebar();

      try {
        const params = new URLSearchParams(window.location.search);
        const courseId = params.get('course');
        if (courseId) sessionStorage.setItem('in4mind_open_course', courseId);
      } catch { /* ignore */ }

      document.getElementById('btn-new-chat')?.addEventListener('click', _newChat);

      $sendBtn?.addEventListener('click', () => _sendMessage($input.value));

      $input?.addEventListener('input', _autoResizeInput);
      $input?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          _sendMessage($input.value);
        }
      });

      $input?.focus();
    } catch (err) {
      console.error('[IN4MIND IA] Error al inicializar chat:', err);
      if ($status) $status.textContent = 'Modo local — recargue la página';
    }
  }

  return { init, sendMessage: _sendMessage, newChat: _newChat };

})();

if (typeof module !== 'undefined') module.exports = AIChatController;
