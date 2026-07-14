'use strict';

/**
 * Resalta nombres propios, cursos y t�rminos IN4MIND en respuestas del asistente.
 */
const AIMarkdown = (() => {

  const STATIC_TERMS = [
    'IN4MIND Assistant', 'IN4MIND',
    'Ciberseguridad', 'Cybersecurity', '????',
    'JavaScript', 'PowerPoint', 'GitHub',
    'Canvas', 'Figma', 'Python', 'HTML', 'CSS', 'Excel', 'SQL',
    'Tutoriales', 'Tutorials', 'Cursos', 'Courses', '课程',
    'Quizzes', 'Quiz', '??',
    'Dashboard', '???',
    'Perfil', 'Profile', '????',
    'Certificaciones', 'Certifications', '??',
    'Asistente IA', 'AI Assistant',
    'Phishing', 'Malware', 'Ransomware',
    'Groq', 'Supabase', 'Canva',
  ];

  let _termsCache = null;

  function _collectTerms() {
    const terms = [...STATIC_TERMS];
    if (typeof DataService !== 'undefined') {
      DataService.getCourses().forEach(c => {
        if (c.title) terms.push(c.title);
      });
    }
    return [...new Set(terms)].sort((a, b) => b.length - a.length);
  }

  function _terms() {
    if (!_termsCache) _termsCache = _collectTerms();
    return _termsCache;
  }

  function _boldSegment(segment) {
    let out = segment;
    for (const term of _terms()) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(?<![\\w*/])(${escaped})(?![\\w*])`, 'gi');
      out = out.replace(re, '**$1**');
    }
    return out.replace(/\*\*(\*\*([^*]+)\*\*)\*\*/g, '**$2**');
  }

  function emphasizeNames(text) {
    if (!text || typeof text !== 'string') return text;
    return text.split(/(\*\*[^*]+\*\*)/g).map(part => (
      /^\*\*[^*]+\*\*$/.test(part) ? part : _boldSegment(part)
    )).join('');
  }

  function resetTermsCache() {
    _termsCache = null;
  }

  return { emphasizeNames, resetTermsCache };

})();

if (typeof module !== 'undefined') module.exports = AIMarkdown;
