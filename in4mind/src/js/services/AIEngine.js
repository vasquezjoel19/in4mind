/**
 * IN4MIND — Motor compartido del asistente (Groq + AIKnowledge).
 */
'use strict';

const AIEngine = (() => {

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : '';
  }

  async function init() {
    /* Detecta si el backend tiene la clave (proxy) antes de consultar isConfigured(). */
    if (typeof GroqService !== 'undefined') await GroqService.init();
  }

  function isOffTopic(message) {
    return typeof AIKnowledge !== 'undefined' && !AIKnowledge.isInScope(message);
  }

  function offTopicResponse() {
    if (typeof AIKnowledge !== 'undefined') return AIKnowledge.getOffTopicResponse();
    return _t('ai.offTopic');
  }

  /**
   * @param {string} userMessage
   * @param {{ role: string, content: string }[]} history
   */
  async function getReply(userMessage, history = []) {
    const trimmed = (userMessage || '').trim();
    if (!trimmed) return _t('ai.emptyPrompt');

    if (isOffTopic(trimmed)) return offTopicResponse();

    const fullHistory = [...history, { role: 'user', content: trimmed }];

    if (typeof GroqService !== 'undefined' && GroqService.isConfigured()) {
      try {
        return await GroqService.chat(fullHistory);
      } catch (err) {
        console.warn('[AIEngine] Groq fallback:', err);
        if (typeof AIKnowledge !== 'undefined') return AIKnowledge.findResponse(trimmed);
        throw err;
      }
    }

    if (typeof AIKnowledge !== 'undefined') return AIKnowledge.findResponse(trimmed);
    throw new Error('NO_ENGINE');
  }

  function statusLabel() {
    if (typeof GroqService !== 'undefined' && GroqService.isConfigured()) return _t('ai.connected');
    if (typeof AIKnowledge !== 'undefined') return _t('ai.assistantReady');
    return _t('ai.localMode');
  }

  function formatError(err) {
    const code = err?.message || '';
    if (code === 'GROQ_API_KEY_MISSING') return _t('ai.errNoKey');
    if (code === 'GROQ_API_KEY_INVALID') return _t('ai.errInvalidKey');
    if (code.startsWith('GROQ_HTTP_')) return _t('ai.errUnavailable');
    if (code === 'NO_ENGINE') return _t('ai.errNoKey');
    return _t('ai.errGeneric');
  }

  return {
    init,
    isOffTopic,
    offTopicResponse,
    getReply,
    statusLabel,
    formatError,
  };

})();

if (typeof module !== 'undefined') module.exports = AIEngine;
