'use strict';

const HelpController = (() => {

  const MAX_HISTORY = 12;

  let _openId = 'what-is-in4mind';
  let _aiHistory = [];
  let _aiLoading = false;

  let $aiThread, $aiInput, $aiSend, $aiStatus;

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : '';
  }

  function _renderFaq(items) {
    const $list = document.getElementById('help-faq-list');
    const $empty = document.getElementById('help-faq-empty');
    if (!$list) return;

    if (!items.length) {
      $list.innerHTML = '';
      if ($empty) $empty.hidden = false;
      return;
    }

    if ($empty) $empty.hidden = true;

    $list.innerHTML = items.map(item => {
      const open = item.id === _openId;
      return `
        <article class="help-faq__item ${open ? 'help-faq__item--open' : ''}" data-faq-id="${item.id}">
          <h3 class="help-faq__heading">
            <button type="button" class="help-faq__trigger" aria-expanded="${open ? 'true' : 'false'}"
                    aria-controls="help-panel-${item.id}" id="help-trigger-${item.id}">
              <span class="help-faq__toggle" aria-hidden="true">${open ? '−' : '+'}</span>
              <span class="help-faq__question">${item.question}</span>
              <svg class="help-faq__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </h3>
          <div class="help-faq__panel" id="help-panel-${item.id}" role="region"
               aria-labelledby="help-trigger-${item.id}" ${open ? '' : 'hidden'}>
            <p class="help-faq__answer">${item.answer}</p>
          </div>
        </article>`;
    }).join('');

    $list.querySelectorAll('.help-faq__trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('[data-faq-id]')?.dataset.faqId;
        if (!id) return;
        _openId = _openId === id ? null : id;
        _renderFaq(typeof HelpData !== 'undefined' ? HelpData.searchFaq(_getFaqQuery()) : []);
      });
    });
  }

  function _getFaqQuery() {
    return document.getElementById('help-search')?.value || '';
  }

  function _attrEscape(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');
  }

  function _escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _formatReply(text) {
    const source = typeof AIMarkdown !== 'undefined'
      ? AIMarkdown.emphasizeNames(text)
      : text;
    return _escapeHtml(source)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  function _showThread() {
    if (!$aiThread) return;
    $aiThread.hidden = false;
  }

  function _appendTurn(role, content) {
    if (!$aiThread) return;
    _showThread();

    const isUser = role === 'user';
    const turn = document.createElement('div');
    turn.className = `help-ai__turn help-ai__turn--${isUser ? 'user' : 'ai'}`;
    if (isUser) {
      turn.innerHTML = `<div class="help-ai__bubble">${_escapeHtml(content)}</div>`;
    } else {
      const label = _t('ai.roleAi');
      turn.innerHTML = `
        <div class="help-ai__turn-label">${_escapeHtml(label)}</div>
        <div class="help-ai__bubble">${_formatReply(content)}</div>`;
    }
    $aiThread.appendChild(turn);
    turn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function _setTyping(show) {
    let row = document.getElementById('help-ai-typing');
    if (!show) {
      row?.remove();
      return;
    }
    if (row) return;
    _showThread();
    row = document.createElement('div');
    row.id = 'help-ai-typing';
    row.className = 'help-ai__typing';
    row.setAttribute('aria-live', 'polite');
    row.innerHTML = `<span></span><span></span><span></span>`;
    $aiThread?.appendChild(row);
    row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function _updateAiStatus() {
    if ($aiStatus && typeof AIEngine !== 'undefined') {
      $aiStatus.textContent = AIEngine.statusLabel();
    }
  }

  async function _localReply(trimmed) {
    if (typeof AIKnowledge !== 'undefined') return AIKnowledge.findResponse(trimmed);
    return _t('help.askEmpty');
  }

  async function _askAI(text) {
    const trimmed = (text || '').trim();
    if (!trimmed || _aiLoading) return;

    _aiLoading = true;
    if ($aiSend) $aiSend.disabled = true;
    if ($aiInput) $aiInput.value = '';
    if ($aiStatus) $aiStatus.textContent = _t('help.askGenerating');

    _appendTurn('user', trimmed);

    const engineReady = typeof AIEngine !== 'undefined';
    const offTopic = engineReady && AIEngine.isOffTopic(trimmed);

    if (!offTopic) {
      _aiHistory.push({ role: 'user', content: trimmed });
      if (_aiHistory.length > MAX_HISTORY) _aiHistory = _aiHistory.slice(-MAX_HISTORY);
    }

    _setTyping(true);

    try {
      let reply;
      if (!engineReady) {
        reply = await _localReply(trimmed);
      } else if (offTopic) {
        reply = AIEngine.offTopicResponse();
      } else {
        try {
          reply = await AIEngine.getReply(trimmed, _aiHistory.slice(0, -1));
        } catch (err) {
          console.warn('[Help AI] fallback local:', err);
          reply = await _localReply(trimmed);
        }
        _aiHistory.push({ role: 'assistant', content: reply });
      }
      _setTyping(false);
      _appendTurn('ai', reply);
    } catch (err) {
      _setTyping(false);
      if (!offTopic) _aiHistory.pop();
      const msg = engineReady ? AIEngine.formatError(err) : await _localReply(trimmed);
      _appendTurn('ai', msg);
      console.error('[Help AI]', err);
    } finally {
      _aiLoading = false;
      if ($aiSend) $aiSend.disabled = false;
      _updateAiStatus();
      $aiInput?.focus();
    }
  }

  function _focusHeroInput() {
    document.getElementById('help-hero-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => ($aiInput || document.getElementById('help-hero-search'))?.focus(), 200);
  }

  function _submitFromSearchInput(input) {
    const q = (input?.value || '').trim();
    if (!q) return;
    input.value = '';
    _focusHeroInput();
    void _askAI(q);
  }

  function _bindTopbarSearch() {
    const input = document.getElementById('search-input');
    if (!input || input.dataset.helpAssistantBound) return;
    input.dataset.helpAssistantBound = '1';

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        _submitFromSearchInput(input);
      }
    });
  }

  function _bindFaqSearch() {
    const $faqSearch = document.getElementById('help-search');
    if (!$faqSearch) return;

    const apply = () => {
      const q = _getFaqQuery();
      const items = typeof HelpData !== 'undefined' ? HelpData.searchFaq(q) : [];
      if (items.length && q && !_openId) _openId = items[0].id;
      if (q && items.length && !items.some(i => i.id === _openId)) _openId = items[0].id;
      _renderFaq(items);
    };

    $faqSearch.addEventListener('input', apply);
    $faqSearch.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        $faqSearch.value = '';
        apply();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const q = $faqSearch.value.trim();
        if (q) {
          _focusHeroInput();
          void _askAI(q);
        }
      }
    });
  }

  function _bindAI() {
    $aiThread = document.getElementById('help-ai-thread');
    $aiInput  = document.getElementById('help-hero-search');
    $aiSend   = document.getElementById('help-ai-send');
    $aiStatus = document.getElementById('help-ai-status');

    $aiSend?.addEventListener('click', () => _askAI($aiInput?.value));
    $aiInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        _askAI($aiInput.value);
      }
    });

    document.getElementById('help-ai-open-full')?.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = 'ai.html';
    });
  }

  function _renderChips() {
    const wrap = document.getElementById('help-ai-chips');
    if (!wrap) return;
    const chips = [
      { label: 'help.chipSave', msg: 'help.chipSaveMsg' },
      { label: 'help.chipPhishing', msg: 'help.chipPhishingMsg' },
      { label: 'help.chipCert', msg: 'help.chipCertMsg' },
    ];
    wrap.innerHTML = chips.map(c => `
      <button type="button" class="help-hero__chip" role="listitem" data-msg="${_attrEscape(_t(c.msg))}">
        ${_escapeHtml(_t(c.label))}
      </button>`).join('');
    wrap.querySelectorAll('.help-hero__chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const msg = chip.dataset.msg;
        if (msg) _askAI(msg);
      });
    });
  }

  async function init() {
    try {
      AppShell.initPage(null);
    } catch (err) {
      console.error('AppShell.initPage:', err);
      AppShell.setupAvatar();
    }

    if (typeof AIEngine !== 'undefined') {
      await AIEngine.init();
    }
    _updateAiStatus();

    _bindAI();
    _bindTopbarSearch();

    _renderFaq(typeof HelpData !== 'undefined' ? HelpData.getFaq() : []);
    _bindFaqSearch();
    _renderChips();

    document.getElementById('help-contact-link')?.addEventListener('click', e => {
      e.preventDefault();
      _focusHeroInput();
    });

    window.addEventListener('in4mind-relocalize', () => {
      _updateAiStatus();
      _renderChips();
      const items = typeof HelpData !== 'undefined' ? HelpData.searchFaq(_getFaqQuery()) : [];
      _renderFaq(items);
    });
  }

  return { init, askAI: _askAI };

})();

if (typeof module !== 'undefined') module.exports = HelpController;
