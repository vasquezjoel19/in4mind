'use strict';

const HelpData = (() => {

  const FAQ_IDS = [
    'what-is-in4mind',
    'create-account',
    'free',
    'save-tutorials',
    'mobile',
    'progress',
    'payment',
    'support',
  ];

  const FAQ_KEYS = [
    ['q1', 'a1'],
    ['q2', 'a2'],
    ['q3', 'a3'],
    ['q4', 'a4'],
    ['q5', 'a5'],
    ['q6', 'a6'],
    ['q7', 'a7'],
    ['q8', 'a8'],
  ];

  function _buildFaq() {
    return FAQ_IDS.map((id, i) => {
      const [qk, ak] = FAQ_KEYS[i];
      const question = typeof I18n !== 'undefined' ? I18n.t(`faq.${qk}`) : '';
      const answer = typeof I18n !== 'undefined' ? I18n.t(`faq.${ak}`) : '';
      return { id, question, answer };
    });
  }

  function getFaq() {
    return _buildFaq();
  }

  function searchFaq(query) {
    const q = (query || '').trim().toLowerCase();
    const items = getFaq();
    if (!q) return items;
    return items.filter(item =>
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q)
    );
  }

  return { getFaq, searchFaq, FAQ_IDS };

})();

if (typeof module !== 'undefined') module.exports = HelpData;
