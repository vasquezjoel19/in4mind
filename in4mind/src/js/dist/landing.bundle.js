/*! IN4MIND bundle 20260820ux1 — 2026-08-20T20:31:57.742362+00:00 */

;/* --- src/js/components/In4mindBulb.js --- */
'use strict';

/**
 * IN4MIND — Logo oficial (imagen de marca).
 *
 * El logo vive como PNG en `src/img/brand/`. En pantalla se pinta con
 * `mask-image` + `background-color: currentColor` (ver `bulb-icon.css`), así que
 * una sola imagen sirve para las tres variantes de marca —navy sobre claro,
 * blanco sobre oscuro, teal de respaldo— sin mantener copias por tema ni idioma.
 */
const In4mindBulb = (() => {

  const BRAND_DIR = 'src/img/brand';
  const FAVICON   = `${BRAND_DIR}/favicon-64.png`;
  const TOUCH_ICON = `${BRAND_DIR}/apple-touch-icon.png`;

  /**
   * Marca como elemento enmascarado. El tamaño viaja en custom properties, no
   * en `width`/`height` en línea, para que cualquier regla CSS del contexto
   * (p. ej. `.ai-welcome__logo .ai-welcome__bulb`) siga teniendo prioridad.
   */
  function _mark(extraClass, w, h) {
    const cls = ['in4mind-bulb', extraClass].filter(Boolean).join(' ');
    const style = (w && h) ? ` style="--bulb-w:${w}px;--bulb-h:${h}px"` : '';
    return `<span class="${cls}"${style} aria-hidden="true"></span>`;
  }

  function large(extraClass = '') {
    return _mark(['in4mind-bulb--lg', extraClass].filter(Boolean).join(' '));
  }

  function medium(extraClass = '') {
    return _mark(['in4mind-bulb--md', extraClass].filter(Boolean).join(' '));
  }

  function small(extraClass = '', w = 28, h = 35) {
    return _mark(['in4mind-bulb--sm', extraClass].filter(Boolean).join(' '), w, h);
  }

  /** Ruta del favicon. Se mantiene el nombre histórico por compatibilidad. */
  function faviconDataUri() {
    return FAVICON;
  }

  /**
   * Sustituye el marcador de cada contexto por la marca.
   * Es idempotente: si ya se montó, no vuelve a tocar el nodo.
   */
  function _replaceMark(selector, factory) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.classList.contains('in4mind-bulb')) return;
      const target = el.tagName.toLowerCase() === 'svg'
        ? el
        : el.querySelector('svg, .in4mind-bulb');
      if (!target || target.classList.contains('in4mind-bulb')) return;
      target.outerHTML = factory();
    });
  }

  function wordmarkHtml() {
    return 'IN<span class="in4mind-wordmark__four">4</span>MIND';
  }

  function _injectWordmark(el) {
    if (el.querySelector('.in4mind-wordmark__four')) return;

    if (el.classList.contains('sidebar__brand-name')) {
      el.innerHTML = wordmarkHtml();
      return;
    }

    for (const node of [...el.childNodes]) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const text = node.textContent.replace(/\s/g, '');
      if (text.toUpperCase() !== 'IN4MIND') continue;
      const wrap = document.createElement('span');
      wrap.className = 'in4mind-wordmark';
      wrap.innerHTML = wordmarkHtml();
      el.replaceChild(wrap, node);
      return;
    }
  }

  function mountWordmarks() {
    document.querySelectorAll('.sidebar__brand-name').forEach(_injectWordmark);
    document.querySelectorAll('.lp-logo, .auth-topbar__brand, .legal-header__brand, .lp-footer__logo, .verify-topbar__brand')
      .forEach(_injectWordmark);
  }

  /** Favicon e icono de pantalla de inicio apuntando a los PNG de marca. */
  function mountIcons() {
    let fav = document.querySelector('link[rel="icon"]');
    if (!fav) {
      fav = document.createElement('link');
      fav.rel = 'icon';
      document.head.appendChild(fav);
    }
    fav.type = 'image/png';
    fav.href = FAVICON;

    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const touch = document.createElement('link');
      touch.rel = 'apple-touch-icon';
      touch.href = TOUCH_ICON;
      document.head.appendChild(touch);
    }
  }

  function mount() {
    _replaceMark('.sidebar__brand-icon', () => small('sidebar__brand-icon', 28, 35));
    _replaceMark('.lp-logo__icon', () => small('lp-logo__icon', 34, 42));
    _replaceMark('.auth-topbar__brand svg', () => small('', 28, 35));
    _replaceMark('.legal-header__brand svg', () => small('', 26, 33));
    _replaceMark('.verify-topbar__brand svg', () => small('', 26, 33));
    _replaceMark('.lp-footer__logo svg', () => small('', 28, 35));
    _replaceMark('.lp-loader__icon', () => small('lp-loader__icon', 36, 45));

    _replaceMark('.welcome-section__bulb', () => large('welcome-section__bulb'));
    _replaceMark('.lp-hero-illustration__bulb', () => large('lp-hero-illustration__bulb'));
    _replaceMark('.help-hero__bulb', () => large('help-hero__bulb help-hero__svg'));

    _replaceMark('.auth-panel-left__icon', () => large('auth-panel-left__icon'));
    _replaceMark('.quiz-banner__graphic svg', () => medium('quiz-banner__bulb'));
    _replaceMark('.ai-welcome__bulb', () => small('ai-welcome__bulb', 34, 42));

    mountIcons();
    mountWordmarks();
  }

  return { large, medium, small, faviconDataUri, wordmarkHtml, mountWordmarks, mountIcons, mount };

})();

if (typeof document !== 'undefined') {
  const run = () => { if (typeof In4mindBulb !== 'undefined') In4mindBulb.mount(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
}

if (typeof module !== 'undefined') module.exports = In4mindBulb;


;/* --- src/js/data/courseFactory.js --- */
'use strict';

/**
 * IN4MIND ? Generador de cursos con estructura est?ndar (5 m?dulos, quizzes y examen).
 */
const CourseFactory = (() => {

  const LEVEL_CYCLE = ['BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'INTERMEDIATE', 'ADVANCED'];
  const DURATIONS = ['12 min', '13 min', '14 min', '14 min', '15 min'];

  function _normLocale(loc) {
    if (loc === 'en' || loc === 'zh') return loc;
    return 'es';
  }

  const QUIZ_PACK = {
    es: {
      choiceQ: (t) => `En un flujo profesional con ${t}, ?qu? pr?ctica aporta m?s valor?`,
      choiceOpts: (ans) => [
        'Evitar documentaci?n del proceso',
        ans,
        'Saltarse validaciones de calidad',
        'Duplicar trabajo manual innecesario',
      ],
      choiceAns: 'Aplicar el concepto del m?dulo con criterio y revisi?n',
      choiceExp: (mod, t) => `Dominar ${mod.toLowerCase()} mejora resultados con ${t}.`,
      tfQ: (mod, t) => `${mod} es relevante para usar ${t} de forma efectiva en contexto real.`,
      tfExp: 'Los fundamentos s?lidos reducen errores y retrabajo.',
      tfExpFalse: 'Los pasos del módulo son la práctica concreta: omitirlos deja el aprendizaje sin aplicación real.',
      matchQ: (t) => `Relaciona concepto y funci?n en ${t}:`,
      matchPairs: [
        { left: 'Planificaci?n', right: 'Definir objetivo y alcance' },
        { left: 'Ejecuci?n', right: 'Aplicar pasos del m?dulo' },
        { left: 'Validaci?n', right: 'Verificar resultado esperado' },
        { left: 'Mejora', right: 'Iterar con feedback' },
      ],
      matchExp: 'Cada fase aporta calidad al flujo de trabajo.',
    },
    en: {
      choiceQ: (t) => `In a professional workflow with ${t}, which practice adds the most value?`,
      choiceOpts: (ans) => [
        'Avoid documenting the process',
        ans,
        'Skip quality validations',
        'Duplicate unnecessary manual work',
      ],
      choiceAns: 'Apply the module concept with criteria and review',
      choiceExp: (mod, t) => `Mastering ${mod.toLowerCase()} improves outcomes with ${t}.`,
      tfQ: (mod, t) => `${mod} is relevant for using ${t} effectively in real-world contexts.`,
      tfExp: 'Solid fundamentals reduce errors and rework.',
      tfExpFalse: 'The module steps are the hands-on part: skipping them leaves the learning without real application.',
      matchQ: (t) => `Match concept and function in ${t}:`,
      matchPairs: [
        { left: 'Planning', right: 'Define goal and scope' },
        { left: 'Execution', right: 'Apply module steps' },
        { left: 'Validation', right: 'Verify expected outcome' },
        { left: 'Improvement', right: 'Iterate with feedback' },
      ],
      matchExp: 'Each phase adds quality to the workflow.',
    },
    zh: {
      choiceQ: (t) => `\u5728\u4f7f\u7528 ${t} \u7684\u4e13\u4e1a\u5de5\u4f5c\u6d41\u7a0b\u4e2d\uff0c\u54ea\u79cd\u505a\u6cd5\u6700\u6709\u4ef7\u503c\uff1f`,
      choiceOpts: (ans) => [
        '\u907f\u514d\u8bb0\u5f55\u6d41\u7a0b',
        ans,
        '\u8df3\u8fc7\u8d28\u91cf\u9a8c\u8bc1',
        '\u91cd\u590d\u4e0d\u5fc5\u8981\u7684\u624b\u5de5\u5de5\u4f5c',
      ],
      choiceAns: '\u4ee5\u6807\u51c6\u4e0e\u590d\u6838\u7684\u65b9\u5f0f\u5e94\u7528\u6a21\u5757\u6982\u5ff5',
      choiceExp: (mod, t) => `\u6388\u63a7${mod}\u53ef\u63d0\u5347\u4f7f\u7528 ${t} \u7684\u6548\u679c\u3002`,
      tfQ: (mod, t) => `${mod} \u5bf9\u4e8e\u5728\u5b9e\u9645\u73af\u5883\u4e2d\u6709\u6548\u4f7f\u7528 ${t} \u5f88\u91cd\u8981\u3002`,
      tfExp: '\u624e\u5b9e\u7684\u57fa\u7840\u53ef\u51cf\u5c11\u9519\u8bef\u548c\u8fd4\u5de5\u3002',
      tfExpFalse: '\u6a21\u5757\u4e2d\u7684\u6b65\u9aa4\u662f\u5177\u4f53\u5b9e\u8df5\uff1a\u8df3\u8fc7\u5b83\u4eec\u4f1a\u4f7f\u5b66\u4e60\u65e0\u6cd5\u843d\u5730\u3002',
      matchQ: (t) => `\u5c06 ${t} \u4e2d\u7684\u6982\u5ff5\u4e0e\u529f\u80fd\u914d\u5bf9\uff1a`,
      matchPairs: [
        { left: '\u89c4\u5212', right: '\u5b9a\u4e49\u76ee\u6807\u4e0e\u8303\u56f4' },
        { left: '\u6267\u884c', right: '\u5e94\u7528\u6a21\u5757\u6b65\u9aa4' },
        { left: '\u9a8c\u8bc1', right: '\u786e\u8ba4\u9884\u671f\u7ed3\u679c' },
        { left: '\u6539\u8fdb', right: '\u6839\u636e\u53cd\u9988\u8fed\u4ee3' },
      ],
      matchExp: '\u6bcf\u4e2a\u9636\u6bb5\u90fd\u4e3a\u5de5\u4f5c\u6d41\u7a0b\u589e\u52a0\u8d28\u91cf\u3002',
    },
  };

  const EXAM_PACK = {
    es: {
      sec1Title: (t) => `Caso pr?ctico con ${t}`,
      sec2Title: (t) => `Operaci?n profesional con ${t}`,
      c1q: (t) => `Debes entregar un proyecto con ${t} bajo plazo ajustado. ?Qu? secuencia es m?s s?lida?`,
      c1opts: ['Improvisar sin plan', 'Planificar, ejecutar con est?ndares y validar entregables', 'Copiar sin adaptar contexto', 'Omitir pruebas finales'],
      c1exp: 'La planificaci?n y validaci?n reducen riesgo en entregas reales.',
      tf1q: (t) => `Documentar decisiones al trabajar con ${t} facilita mantenimiento y colaboraci?n.`,
      tf1qFalse: (t) => `Documentar decisiones al trabajar con ${t} sólo ralentiza al equipo y no aporta al mantenimiento.`,
      tf1exp: 'La trazabilidad es clave en entornos profesionales.',
      tf1expFalse: 'Sin documentar decisiones, cada cambio obliga a reconstruir el contexto desde cero.',
      m1q: 'Relaciona etapa y control de calidad:',
      m1pairs: [
        { left: 'Requisitos', right: 'Alinear expectativas' },
        { left: 'Implementaci?n', right: 'Aplicar buenas pr?cticas' },
        { left: 'Prueba', right: 'Detectar desv?os' },
        { left: 'Entrega', right: 'Cerrar con evidencia' },
      ],
      m1exp: 'Un flujo completo garantiza resultados defendibles.',
      c2q: (t) => `Si el equipo reporta inconsistencias usando ${t}, ?qu? acci?n ataca la causa ra?z?`,
      c2opts: ['Ignorar el problema', 'Estandarizar proceso, plantillas y revisi?n por pares', 'Cambiar herramienta sin an?lisis', 'Eliminar controles de calidad'],
      c2exp: 'La estandarizaci?n reduce variabilidad entre personas y proyectos.',
      tf2q: 'La mejora continua requiere medir resultados y ajustar el proceso.',
      tf2qFalse: 'La mejora continua se basa en la intuición del equipo, sin necesidad de medir resultados.',
      tf2exp: 'Sin m?tricas no hay mejora objetiva.',
      tf2expFalse: 'Sin medir resultados no hay forma de saber si el cambio mejoró o empeoró el proceso.',
      m2q: 'Relaciona pr?ctica y beneficio:',
      m2pairs: [
        { left: 'Checklist', right: 'Reducir omisiones' },
        { left: 'Plantillas', right: 'Acelerar trabajo repetible' },
        { left: 'Capacitaci?n', right: 'Subir nivel del equipo' },
        { left: 'Retrospectiva', right: 'Aprender de cada ciclo' },
      ],
      m2exp: 'La madurez operativa se construye con h?bitos repetibles.',
    },
    en: {
      sec1Title: (t) => `Practical case with ${t}`,
      sec2Title: (t) => `Professional operations with ${t}`,
      c1q: (t) => `You must deliver a project with ${t} under a tight deadline. Which sequence is strongest?`,
      c1opts: ['Improvise without a plan', 'Plan, execute with standards, and validate deliverables', 'Copy without adapting to context', 'Skip final testing'],
      c1exp: 'Planning and validation reduce risk in real deliveries.',
      tf1q: (t) => `Documenting decisions when working with ${t} makes maintenance and collaboration easier.`,
      tf1qFalse: (t) => `Documenting decisions when working with ${t} only slows the team down and does not help maintenance.`,
      tf1exp: 'Traceability is key in professional environments.',
      tf1expFalse: 'Without documented decisions, every change forces the team to rebuild the context from scratch.',
      m1q: 'Match stage and quality control:',
      m1pairs: [
        { left: 'Requirements', right: 'Align expectations' },
        { left: 'Implementation', right: 'Apply best practices' },
        { left: 'Testing', right: 'Detect deviations' },
        { left: 'Delivery', right: 'Close with evidence' },
      ],
      m1exp: 'A complete flow ensures defensible results.',
      c2q: (t) => `If the team reports inconsistencies using ${t}, which action addresses the root cause?`,
      c2opts: ['Ignore the problem', 'Standardize process, templates, and peer review', 'Change tools without analysis', 'Remove quality controls'],
      c2exp: 'Standardization reduces variability across people and projects.',
      tf2q: 'Continuous improvement requires measuring results and adjusting the process.',
      tf2qFalse: 'Continuous improvement relies on the team intuition, with no need to measure results.',
      tf2exp: 'Without metrics there is no objective improvement.',
      tf2expFalse: 'Without measuring results there is no way to tell whether a change improved or hurt the process.',
      m2q: 'Match practice and benefit:',
      m2pairs: [
        { left: 'Checklist', right: 'Reduce omissions' },
        { left: 'Templates', right: 'Speed up repeatable work' },
        { left: 'Training', right: 'Raise team skill level' },
        { left: 'Retrospective', right: 'Learn from each cycle' },
      ],
      m2exp: 'Operational maturity is built with repeatable habits.',
    },
    zh: {
      sec1Title: (t) => `${t} \u5b9e\u8df5\u6848\u4f8b`,
      sec2Title: (t) => `${t} \u4e13\u4e1a\u8fd0\u8425`,
      c1q: (t) => `\u4f60\u9700\u8981\u5728\u7d27\u8feb\u671f\u9650\u5185\u4f7f\u7528 ${t} \u4ea4\u4ed8\u9879\u76ee\u3002\u54ea\u79cd\u987a\u5e8f\u6700\u53ef\u9760\uff1f`,
      c1opts: ['\u65e0\u8ba1\u5212\u5373\u5174\u53d1\u6325', '\u89c4\u5212\u3001\u6309\u6807\u51c6\u6267\u884c\u5e76\u9a8c\u8bc1\u4ea4\u4ed8\u7269', '\u7167\u642c\u800c\u4e0d\u7ed3\u5408\u60c5\u5883', '\u8df3\u8fc7\u6700\u7ec8\u6d4b\u8bd5'],
      c1exp: '\u89c4\u5212\u4e0e\u9a8c\u8bc1\u53ef\u964d\u4f4e\u771f\u5b9e\u4ea4\u4ed8\u4e2d\u7684\u98ce\u9669\u3002',
      tf1q: (t) => `\u5728\u4f7f\u7528 ${t} \u65f6\u8bb0\u5f55\u51b3\u7b56\u6709\u52a9\u4e8e\u7ef4\u62a4\u4e0e\u534f\u4f5c\u3002`,
      tf1qFalse: (t) => `\u5728\u4f7f\u7528 ${t} \u65f6\uff0c\u8bb0\u5f55\u51b3\u7b56\u53ea\u4f1a\u62d6\u6162\u56e2\u961f\uff0c\u5bf9\u7ef4\u62a4\u6ca1\u6709\u5e2e\u52a9\u3002`,
      tf1exp: '\u53ef\u8ffd\u6eaf\u6027\u5728\u4e13\u4e1a\u73af\u5883\u4e2d\u81f3\u5173\u91cd\u8981\u3002',
      tf1expFalse: '\u4e0d\u8bb0\u5f55\u51b3\u7b56\uff0c\u6bcf\u6b21\u53d8\u66f4\u90fd\u9700\u8981\u4ece\u5934\u91cd\u5efa\u4e0a\u4e0b\u6587\u3002',
      m1q: '\u5c06\u9636\u6bb5\u4e0e\u8d28\u91cf\u63a7\u5236\u914d\u5bf9\uff1a',
      m1pairs: [
        { left: '\u9700\u6c42', right: '\u5bf9\u9f50\u671f\u671b' },
        { left: '\u5b9e\u73b0', right: '\u5e94\u7528\u6700\u4f73\u5b9e\u8df5' },
        { left: '\u6d4b\u8bd5', right: '\u53d1\u73b0\u504f\u5dee' },
        { left: '\u4ea4\u4ed8', right: '\u4ee5\u8bc1\u636e\u6536\u5c3e' },
      ],
      m1exp: '\u5b8c\u6574\u6d41\u7a0b\u786e\u4fdd\u7ed3\u679c\u7ecf\u5f97\u8d77\u68c0\u9a8c\u3002',
      c2q: (t) => `\u82e5\u56e2\u961f\u5728\u4f7f\u7528 ${t} \u65f6\u51fa\u73b0\u4e0d\u4e00\u81f4\uff0c\u54ea\u9879\u884c\u52a8\u9488\u5bf9\u6839\u672c\u539f\u56e0\uff1f`,
      c2opts: ['\u5ffd\u7565\u95ee\u9898', '\u6807\u51c6\u5316\u6d41\u7a0b\u3001\u6a21\u677f\u4e0e\u540c\u884c\u8bc4\u5ba1', '\u672a\u5206\u6790\u5c31\u66f4\u6362\u5de5\u5177', '\u53d6\u6d88\u8d28\u91cf\u63a7\u5236'],
      c2exp: '\u6807\u51c6\u5316\u53ef\u51cf\u5c11\u4eba\u5458\u4e0e\u9879\u76ee\u4e4b\u95f4\u7684\u5dee\u5f02\u3002',
      tf2q: '\u6301\u7eed\u6539\u8fdb\u9700\u8981\u8861\u91cf\u7ed3\u679c\u5e76\u8c03\u6574\u6d41\u7a0b\u3002',
      tf2qFalse: '\u6301\u7eed\u6539\u8fdb\u53ea\u9760\u76f4\u89c9\u5373\u53ef\uff0c\u65e0\u9700\u8861\u91cf\u7ed3\u679c\u3002',
      tf2exp: '\u6ca1\u6709\u6307\u6807\u5c31\u6ca1\u6709\u5ba2\u89c2\u6539\u8fdb\u3002',
      tf2expFalse: '\u4e0d\u8861\u91cf\u7ed3\u679c\uff0c\u5c31\u65e0\u6cd5\u5224\u65ad\u53d8\u66f4\u662f\u6539\u5584\u8fd8\u662f\u6076\u5316\u4e86\u6d41\u7a0b\u3002',
      m2q: '\u5c06\u5b9e\u8df5\u4e0e\u6536\u76ca\u914d\u5bf9\uff1a',
      m2pairs: [
        { left: '\u68c0\u67e5\u6e05\u5355', right: '\u51cf\u5c11\u9057\u6f0f' },
        { left: '\u6a21\u677f', right: '\u52a0\u901f\u53ef\u91cd\u590d\u5de5\u4f5c' },
        { left: '\u57f9\u8bad', right: '\u63d0\u5347\u56e2\u961f\u6c34\u5e73' },
        { left: '\u56de\u987e', right: '\u4ece\u6bcf\u4e2a\u5468\u671f\u4e2d\u5b66\u4e60' },
      ],
      m2exp: '\u8fd0\u8425\u6210\u719f\u5ea6\u9760\u53ef\u91cd\u590d\u7684\u4e60\u60ef\u5efa\u7acb\u3002',
    },
  };

  const EXAM_Q_PACK = {
    es: {
      c1q: (t) => `En un escenario profesional con ${t}, ?qu? enfoque maximiza calidad de entrega?`,
      c1opts: ['Sin planificaci?n', 'Definir objetivo, ejecutar con est?ndares y validar', 'Evitar revisiones', 'Trabajar aislado sin feedback'],
      c1exp: 'La disciplina de proceso reduce errores costosos.',
      m1q: (t) => `Relaciona fase y resultado con ${t}:`,
      m1pairs: [
        { left: 'An?lisis', right: 'Entender necesidad' },
        { left: 'Dise?o', right: 'Planificar soluci?n' },
        { left: 'Ejecuci?n', right: 'Construir entregable' },
        { left: 'Cierre', right: 'Validar y documentar' },
      ],
      m1exp: 'Un ciclo completo asegura aprendizaje y calidad.',
      tf1q: (t) => `${t} aporta m?s valor cuando se integra en un flujo de trabajo documentado.`,
      tf1qFalse: (t) => `Usar ${t} basta por sí solo, sin necesidad de integrarlo en un flujo de trabajo documentado.`,
      tf1exp: 'La herramienta sola no sustituye buenas pr?cticas.',
      tf1expFalse: 'Sin documentar decisiones, cada cambio obliga a reconstruir el contexto desde cero.',
      c2q: (t) => `Debes capacitar a un equipo nuevo en ${t}. ?Qu? estrategia es m?s efectiva?`,
      c2opts: ['Solo documentaci?n sin pr?ctica', 'Plantillas, ejercicios guiados y revisi?n por pares', 'Dejar que cada uno improvise', 'Saltar fundamentos'],
      c2exp: 'La pr?ctica estructurada acelera adopci?n homog?nea.',
      m2q: 'Relaciona control y beneficio operativo:',
      m2pairs: [
        { left: 'Checklist', right: 'Reducir omisiones' },
        { left: 'Plantillas', right: 'Estandarizar entregables' },
        { left: 'Validaci?n', right: 'Detectar desv?os temprano' },
        { left: 'Retrospectiva', right: 'Mejorar el proceso' },
      ],
      m2exp: 'Controles ligeros sostienen calidad sin burocracia excesiva.',
      c3q: (t) => `Ante un error recurrente con ${t}, ?qu? acci?n ataca la causa ra?z?`,
      c3opts: ['Parchear solo el s?ntoma', 'Estandarizar proceso y revisar con el equipo', 'Cambiar herramienta sin an?lisis', 'Ignorar hasta escalar'],
      c3exp: 'La estandarizaci?n y revisi?n reducen variabilidad entre personas.',
    },
    en: {
      c1q: (t) => `In a professional scenario with ${t}, which approach maximizes delivery quality?`,
      c1opts: ['No planning', 'Define goal, execute with standards, and validate', 'Avoid reviews', 'Work in isolation without feedback'],
      c1exp: 'Process discipline reduces costly errors.',
      m1q: (t) => `Match phase and outcome with ${t}:`,
      m1pairs: [
        { left: 'Analysis', right: 'Understand the need' },
        { left: 'Design', right: 'Plan the solution' },
        { left: 'Execution', right: 'Build the deliverable' },
        { left: 'Closure', right: 'Validate and document' },
      ],
      m1exp: 'A complete cycle ensures learning and quality.',
      tf1q: (t) => `${t} adds more value when integrated into a documented workflow.`,
      tf1qFalse: (t) => `Using ${t} is enough on its own, with no need to integrate it into a documented workflow.`,
      tf1exp: 'The tool alone does not replace good practices.',
      tf1expFalse: 'The tool alone does not organise the work: value appears when it is part of a documented workflow.',
      c2q: (t) => `You must train a new team on ${t}. Which strategy is most effective?`,
      c2opts: ['Documentation only, no practice', 'Templates, guided exercises, and peer review', 'Let everyone improvise', 'Skip fundamentals'],
      c2exp: 'Structured practice accelerates consistent adoption.',
      m2q: 'Match control and operational benefit:',
      m2pairs: [
        { left: 'Checklist', right: 'Reduce omissions' },
        { left: 'Templates', right: 'Standardize deliverables' },
        { left: 'Validation', right: 'Detect deviations early' },
        { left: 'Retrospective', right: 'Improve the process' },
      ],
      m2exp: 'Light controls sustain quality without excessive bureaucracy.',
      c3q: (t) => `Facing a recurring error with ${t}, which action addresses the root cause?`,
      c3opts: ['Patch only the symptom', 'Standardize the process and review with the team', 'Change tools without analysis', 'Ignore until it escalates'],
      c3exp: 'Standardization and review reduce variability across people.',
    },
    zh: {
      c1q: (t) => `\u5728 ${t} \u7684\u4e13\u4e1a\u573a\u666f\u4e2d\uff0c\u54ea\u79cd\u65b9\u6cd5\u80fd\u6700\u5927\u5316\u4ea4\u4ed8\u8d28\u91cf\uff1f`,
      c1opts: ['\u4e0d\u505a\u89c4\u5212', '\u660e\u786e\u76ee\u6807\u3001\u6309\u6807\u51c6\u6267\u884c\u5e76\u9a8c\u8bc1', '\u907f\u514d\u8bc4\u5ba1', '\u5b64\u7acb\u5de5\u4f5c\u3001\u65e0\u53cd\u9988'],
      c1exp: '\u6d41\u7a0b\u7eaa\u5f8b\u53ef\u51cf\u5c11\u4ee3\u4ef7\u9ad8\u6602\u7684\u9519\u8bef\u3002',
      m1q: (t) => `\u5c06 ${t} \u7684\u9636\u6bb5\u4e0e\u7ed3\u679c\u914d\u5bf9\uff1a`,
      m1pairs: [
        { left: '\u5206\u6790', right: '\u7406\u89e3\u9700\u6c42' },
        { left: '\u8bbe\u8ba1', right: '\u89c4\u5212\u65b9\u6848' },
        { left: '\u6267\u884c', right: '\u6784\u5efa\u4ea4\u4ed8\u7269' },
        { left: '\u6536\u5c3e', right: '\u9a8c\u8bc1\u5e76\u6587\u6863\u5316' },
      ],
      m1exp: '\u5b8c\u6574\u5468\u671f\u786e\u4fdd\u5b66\u4e60\u4e0e\u8d28\u91cf\u3002',
      tf1q: (t) => `${t} \u878d\u5165\u6709\u6587\u6863\u7684\u5de5\u4f5c\u6d41\u7a0b\u65f6\u4ef7\u503c\u66f4\u9ad8\u3002`,
      tf1qFalse: (t) => `\u53ea\u8981\u4f7f\u7528 ${t}\uff0c\u5c31\u4e0d\u9700\u8981\u6709\u6587\u6863\u7684\u5de5\u4f5c\u6d41\u7a0b\u3002`,
      tf1exp: '\u5de5\u5177\u672c\u8eab\u65e0\u6cd5\u66ff\u4ee3\u826f\u597d\u5b9e\u8df5\u3002',
      tf1expFalse: '\u4e0d\u8bb0\u5f55\u51b3\u7b56\uff0c\u6bcf\u6b21\u53d8\u66f4\u90fd\u9700\u8981\u4ece\u5934\u91cd\u5efa\u4e0a\u4e0b\u6587\u3002',
      c2q: (t) => `\u4f60\u9700\u8981\u57f9\u8bad\u65b0\u56e2\u961f\u4f7f\u7528 ${t}\u3002\u54ea\u79cd\u7b56\u7565\u6700\u6709\u6548\uff1f`,
      c2opts: ['\u53ea\u6709\u6587\u6863\u3001\u6ca1\u6709\u7ec3\u4e60', '\u6a21\u677f\u3001\u5f15\u5bfc\u7ec3\u4e60\u4e0e\u540c\u884c\u8bc4\u5ba1', '\u8ba9\u6bcf\u4eba\u5373\u5174\u53d1\u6325', '\u8df3\u8fc7\u57fa\u7840'],
      c2exp: '\u7ed3\u6784\u5316\u7ec3\u4e60\u53ef\u52a0\u901f\u4e00\u81f4\u91c7\u7528\u3002',
      m2q: '\u5c06\u63a7\u5236\u63aa\u65bd\u4e0e\u8fd0\u8425\u6536\u76ca\u914d\u5bf9\uff1a',
      m2pairs: [
        { left: '\u68c0\u67e5\u6e05\u5355', right: '\u51cf\u5c11\u9057\u6f0f' },
        { left: '\u6a21\u677f', right: '\u6807\u51c6\u5316\u4ea4\u4ed8\u7269' },
        { left: '\u9a8c\u8bc1', right: '\u53ca\u65e9\u53d1\u73b0\u504f\u5dee' },
        { left: '\u56de\u987e', right: '\u6539\u8fdb\u6d41\u7a0b' },
      ],
      m2exp: '\u8f7b\u91cf\u63a7\u5236\u53ef\u5728\u4e0d\u8fc7\u5ea6\u5b98\u50da\u7684\u60c5\u51b5\u4e0b\u7ef4\u6301\u8d28\u91cf\u3002',
      c3q: (t) => `\u9762\u5bf9 ${t} \u7684\u53cd\u590d\u51fa\u9519\uff0c\u54ea\u9879\u884c\u52a8\u9488\u5bf9\u6839\u672c\u539f\u56e0\uff1f`,
      c3opts: ['\u53ea\u4fee\u8865\u75c7\u72b6', '\u6807\u51c6\u5316\u6d41\u7a0b\u5e76\u4e0e\u56e2\u961f\u590d\u76d8', '\u672a\u5206\u6790\u5c31\u6362\u5de5\u5177', '\u5ffd\u7565\u76f4\u5230\u5347\u7ea7'],
      c3exp: '\u6807\u51c6\u5316\u4e0e\u590d\u76d8\u53ef\u51cf\u5c11\u4eba\u5458\u4e4b\u95f4\u7684\u5dee\u5f02\u3002',
    },
  };

  function buildQuizBlock(module, toolName, locale = 'es') {
    const loc = _normLocale(locale);
    const p = QUIZ_PACK[loc];
    const t = toolName;
    const ansText = module.quizAnsText || p.choiceAns;
    const keyStep = module.steps?.[1] || module.steps?.[0];
    const wrongOpts = loc === 'en'
      ? ['Skip quality checks', 'Avoid documenting the process', 'Duplicate unnecessary manual work']
      : loc === 'zh'
        ? ['跳过质量验证', '避免记录流程', '重复不必要的手工工作']
        : ['Saltarse validaciones de calidad', 'Evitar documentar el proceso', 'Duplicar trabajo manual innecesario'];

    const choiceQ = module.quizChoice || (keyStep
      ? (loc === 'en'
        ? `In the module «${module.title}» (${t}), which practice adds the most value?`
        : loc === 'zh'
          ? `在「${module.title}」（${t}）模块中，哪种做法最有价值？`
          : `En el módulo «${module.title}» (${t}), ¿qué práctica aporta más valor?`)
      : p.choiceQ(t));

    const choiceOpts = module.quizOpts || (keyStep
      ? [wrongOpts[0], keyStep, wrongOpts[1], wrongOpts[2]]
      : p.choiceOpts(ansText));

    const tfQ = module.quizTf || (loc === 'en'
      ? `The steps in «${module.title}» are relevant for using ${t} effectively.`
      : loc === 'zh'
        ? `「${module.title}」中的步骤对有效使用 ${t} 很重要。`
        : `Los pasos de «${module.title}» son relevantes para usar ${t} de forma efectiva.`);

    // Variante falsa del mismo enunciado: permite que la respuesta correcta
    // alterne entre Verdadero y Falso en lugar de ser siempre Verdadero.
    const tfQFalse = module.quizTfFalse || (loc === 'en'
      ? `The steps in «${module.title}» are decorative and can be skipped when using ${t}.`
      : loc === 'zh'
        ? `「${module.title}」中的步骤只是装饰，使用 ${t} 时可以跳过。`
        : `Los pasos de «${module.title}» son decorativos y pueden omitirse al usar ${t}.`);

    let matchPairs = module.quizPairs;
    if (!matchPairs && Array.isArray(module.steps) && module.steps.length >= 4) {
      matchPairs = module.steps.slice(0, 4).map((step, i) => {
        const hint = step.split(/\s+/).slice(0, 3).join(' ');
        const left = loc === 'en' ? `Step ${i + 1}: ${hint}…` : loc === 'zh' ? `步骤 ${i + 1}：${hint}…` : `Paso ${i + 1}: ${hint}…`;
        return { left, right: step };
      });
    }
    if (!matchPairs) matchPairs = p.matchPairs;

    return {
      title: module.title,
      questions: [
        {
          type: 'choice',
          q: choiceQ,
          opts: choiceOpts,
          ans: module.quizAns ?? (keyStep ? 1 : 1),
          exp: module.quizExp || (keyStep
            ? (loc === 'en' ? `«${keyStep}» is a key step in this module.` : loc === 'zh' ? `「${keyStep}」是本模块的关键步骤。` : `«${keyStep}» es un paso clave de este módulo.`)
            : p.choiceExp(module.title, t)),
        },
        {
          type: 'truefalse',
          q: tfQ,
          ans: module.quizTfAns !== false,
          exp: module.quizTfExp || p.tfExp,
          qFalse: tfQFalse,
          expFalse: module.quizTfExpFalse || p.tfExpFalse,
        },
        {
          type: 'match',
          q: module.quizMatchQ || p.matchQ(t),
          pairs: matchPairs,
          exp: module.quizMatchExp || p.matchExp,
        },
      ],
    };
  }

  function buildExamSections(title, toolName, locale = 'es') {
    const loc = _normLocale(locale);
    const p = EXAM_PACK[loc];
    const t = toolName || title;
    return [
      {
        title: p.sec1Title(t),
        questions: [
          { type: 'choice', q: p.c1q(t), opts: p.c1opts, ans: 1, exp: p.c1exp },
          { type: 'truefalse', q: p.tf1q(t), ans: true, exp: p.tf1exp,
            qFalse: p.tf1qFalse(t), expFalse: p.tf1expFalse },
          { type: 'match', q: p.m1q, pairs: p.m1pairs, exp: p.m1exp },
        ],
      },
      {
        title: p.sec2Title(t),
        questions: [
          { type: 'choice', q: p.c2q(t), opts: p.c2opts, ans: 1, exp: p.c2exp },
          { type: 'truefalse', q: p.tf2q, ans: true, exp: p.tf2exp,
            qFalse: p.tf2qFalse, expFalse: p.tf2expFalse },
          { type: 'match', q: p.m2q, pairs: p.m2pairs, exp: p.m2exp },
        ],
      },
    ];
  }

  function build(LEVELS, spec) {
    const {
      id, title, category, icon, requirements, docs, certModules, modules, videos,
    } = spec;

    const lessons = modules.map((mod, i) => ({
      id: `${id}-l${i + 1}`,
      title: mod.title,
      section: `M?dulo ${i + 1}`,
      duration: mod.duration || DURATIONS[i],
      level: LEVELS[LEVEL_CYCLE[i]] || LEVELS.BEGINNER,
      description: mod.description,
      requirements: mod.requirements || requirements.slice(0, 2),
      steps: mod.steps,
      resources: {
        docs: mod.docs || docs.label,
        docsUrl: mod.docsUrl || docs.url,
        ...((videos?.[i] || mod.video) ? { video: videos[i] || mod.video } : {}),
      },
      tip: mod.tip || `Practica ${mod.title.toLowerCase()} con un caso real de tu entorno.`,
    }));

    const quizSections = modules.map(mod => buildQuizBlock(mod, title));
    const examSections = buildExamSections(title, title);

    return {
      title,
      category,
      icon,
      requirements,
      docs,
      certModules: certModules || modules.map(m => m.title),
      lessons,
      quizSections,
      examSections,
    };
  }

  function buildExamQuestions(toolName, locale = 'es') {
    const loc = _normLocale(locale);
    const p = EXAM_Q_PACK[loc];
    const t = toolName;
    return [
      { type: 'choice', q: p.c1q(t), opts: p.c1opts, ans: 1, exp: p.c1exp },
      { type: 'match', q: p.m1q(t), pairs: p.m1pairs, exp: p.m1exp },
      { type: 'truefalse', q: p.tf1q(t), ans: true, exp: p.tf1exp,
            qFalse: p.tf1qFalse(t), expFalse: p.tf1expFalse },
      { type: 'choice', q: p.c2q(t), opts: p.c2opts, ans: 1, exp: p.c2exp },
      { type: 'match', q: p.m2q, pairs: p.m2pairs, exp: p.m2exp },
      { type: 'choice', q: p.c3q(t), opts: p.c3opts, ans: 1, exp: p.c3exp },
    ];
  }

  return { build, buildExamQuestions, buildQuizBlock, buildExamSections };

})();

if (typeof module !== 'undefined') module.exports = CourseFactory;


;/* --- src/js/data/extendedCourses.js --- */
'use strict';

/** IN4MIND ? Cat?logo extendido de herramientas y tecnolog?as. */
const ExtendedCourses = (() => {

  const ICON = {
    flowchart: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
    os: 'https://cdn-icons-png.flaticon.com/512/888/888882.png',
    powerapps: 'https://cdn-icons-png.flaticon.com/512/5968/5968557.png',
    sharepoint: 'https://cdn-icons-png.flaticon.com/512/2991/2991110.png',
    outlook: 'https://cdn-icons-png.flaticon.com/512/732/732223.png',
    onedrive: 'https://cdn-icons-png.flaticon.com/512/2991/2991143.png',
    scrum: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
    scratch: 'https://cdn-icons-png.flaticon.com/512/5968/5968242.png',
    video: 'https://cdn-icons-png.flaticon.com/512/2991/2991108.png',
    django: 'https://cdn-icons-png.flaticon.com/512/5968/5968350.png',
    powerbi: 'src/img/courses/powerbi.svg?v=20260713',
    prompt: 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png',
    engineering: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
    game: 'https://cdn-icons-png.flaticon.com/512/686/686589.png',
  };

  /** Videos YouTube por curso (uno por m�dulo). Se rellenan hasta 5 si hay menos enlaces. */
  const VIDEOS_RAW = {
    flowchart: ['zuCHSKLIibo', '0G0-kIwDggE', 'aFZX20Cb9S8'],
    os: ['1C8x3nn-u_w', 'ccKNxlKpe_Q'],
    powerapps: ['bihOpGpdJMs', 'bAhVEmU1aIs', 'lG46zdgn6pU'],
    sharepoint: ['uAsv3ofcb5U', 'cDfQ-o9hny0', '6zZecoftVmA'],
    outlook: ['-Ntmp7BugP4', 'Sro03l1jlbQ', '2wUf3hdFhzk'],
    onedrive: ['FDnEIvadlv4', 'uoUVhMu0CKM', 'FTPbEoHJpWU'],
    scrum: ['sLexw-z13Fo', '7HeEAgmu-GY', 'ExTUJHwiuoU'],
    scratch: ['a5DOIvjxiQ0', '5OUb91fDKXw', 'D-nW4jvzRr8'],
    'video-editing': ['Gk8IKZoK3l8', 'o5QRf-nLTQo', '9B6W6kOcopt', 'Q44v1ouc_mY', 'a13oF00IqEk'],
    django: ['srkMntDfil4', '7XO1AzwkPPE'],
    powerbi: ['pwJuFbyhZFE', 'U86tOaQCgVI', 'C8HatpMK9Hw'],
    'prompt-engineering': ['Rbws9lbVNAM', '7f5xF-I-S3c'],
    engineering: ['W8KQJ1KcEk0', 'whylUwZjbVk', 'OV6LKjrrcu4', 'Q78KbL7N7UQ', 'IG-SuxoV6e4'],
    'game-editing': ['j48BhgjGmN0', 'Ben-Xe36htj8', 'MOiRVfddhZA', 'Gp0enaj0zxc', '6YnzoBkJl1s'],
  };

  function _padVideoIds(ids, count = 5) {
    if (!ids?.length) return [];
    const out = [];
    for (let i = 0; i < count; i += 1) out.push(ids[i % ids.length]);
    return out;
  }

  const VIDEOS = Object.fromEntries(
    Object.entries(VIDEOS_RAW).map(([id, list]) => [id, _padVideoIds(list)])
  );

  function _youtuVideos(courseId) {
    return (VIDEOS[courseId] || []).map((id) => `https://youtu.be/${id}`);
  }

  function _watchVideos(courseId) {
    return (VIDEOS[courseId] || []).map((id) => `https://www.youtube.com/watch?v=${id}`);
  }

  function _mod(title, description, steps, extra = {}) {
    return { title, description, steps, ...extra };
  }

  function getCourses(LEVELS) {
    const F = (spec) => CourseFactory.build(LEVELS, {
      ...spec,
      videos: _watchVideos(spec.id),
    });

    return {
      flowchart: F({
        id: 'flowchart', title: 'Diagrama de flujo', category: 'tools', icon: ICON.flowchart,
        requirements: ['Editor de diagramas', 'Proceso a documentar'],
        docs: { label: 'Diagramas de flujo', url: 'https://www.lucidchart.com/pages/es/que-es-un-diagrama-de-flujo' },
        modules: [
          _mod('S?mbolos y notaci?n', 'Aprende la notaci?n est?ndar para representar procesos.', ['Identificar inicio, fin, proceso y decisi?n', 'Usar conectores y direcci?n de flujo', 'Evitar cruces innecesarios', 'Aplicar lectura top-down', 'Exportar diagrama compartible']),
          _mod('Proceso actual (AS-IS)', 'Documenta el flujo real antes de mejorar.', ['Entrevistar actores clave', 'Dibujar flujo sin idealizar', 'Marcar esperas y retrabajo', 'Cuantificar tiempos por etapa', 'Validar con el equipo']),
          _mod('Decisiones y excepciones', 'Modela ramificaciones y caminos alternativos.', ['Preguntas s?/no en decisiones', 'Representar bucles con salida clara', 'Documentar excepciones', 'Balancear detalle', 'Verificar cierre de caminos']),
          _mod('Proceso objetivo (TO-BE)', 'Dise?a el flujo mejorado.', ['Detectar cuellos de botella', 'Proponer simplificaci?n', 'Definir responsables', 'Estimar impacto', 'Comparar AS-IS vs TO-BE']),
          _mod('Documentaci?n viva', 'Mant?n diagramas actualizados.', ['Asignar due?o', 'Versionar cambios', 'Vincular a SOPs', 'Programar revisiones', 'Archivar obsoletos']),
        ],
      }),
      os: F({
        id: 'os', title: 'Sistema operativo', category: 'tools', icon: ICON.os,
        requirements: ['PC con Windows, macOS o Linux', 'Usuario con permisos b?sicos'],
        docs: { label: 'Windows', url: 'https://learn.microsoft.com/es-es/windows/' },
        modules: [
          _mod('Archivos y escritorio', 'Navega y organiza el sistema con eficiencia.', ['Explorar carpetas y rutas', 'Crear y mover archivos', 'Usar b?squeda del SO', 'Configurar vistas', 'Recuperar desde papelera']),
          _mod('Usuarios y permisos', 'Configura cuentas y seguridad local.', ['Usuario est?ndar vs admin', 'Permisos de lectura/escritura', 'Bloqueo de pantalla', 'Actualizaciones de seguridad', 'Copia de seguridad b?sica']),
          _mod('Procesos y rendimiento', 'Diagnostica uso de recursos.', ['Administrador de tareas', 'Identificar procesos pesados', 'Liberar espacio en disco', 'Finalizar apps bloqueadas', 'Reiniciar cuando convenga']),
          _mod('Red y conectividad', 'Resuelve problemas de conexi?n comunes.', ['Conectar Wi-Fi segura', 'Diagn?stico de red', 'Olvidar redes problem?ticas', 'Distinguir fallo local vs ISP', 'Probar con otro dispositivo']),
          _mod('Productividad diaria', 'Atajos y automatizaci?n del SO.', ['Atajos de ventana', 'Espacios virtuales', 'Tareas programadas', 'Sync con nube', 'Documentar tu setup']),
        ],
      }),
      powerapps: F({
        id: 'powerapps', title: 'Power Apps', category: 'office', icon: ICON.powerapps,
        requirements: ['Cuenta Microsoft 365', 'Licencia Power Apps'],
        docs: { label: 'Power Apps', url: 'https://learn.microsoft.com/es-es/power-apps/' },
        modules: [
          _mod('Introducci?n a Power Apps', 'Crea apps low-code conectadas a datos.', ['Explorar Power Apps Studio', 'Canvas vs model-driven', 'Conectar SharePoint o Excel', 'Controles b?sicos', 'Publicar app de prueba']),
          _mod('F?rmulas y UX', 'Power Fx y navegaci?n entre pantallas.', ['Botones y entradas', 'F?rmulas Filter y LookUp', 'Validar formularios', 'Navegar entre pantallas', 'Tema coherente']),
          _mod('Datos y conectores', 'Integra fuentes empresariales.', ['Elegir conector', 'Mapear campos', 'Crear y editar registros', 'Manejar errores', 'Probar con datos reales']),
          _mod('Power Automate', 'Automatiza desde la app.', ['Flujo al enviar formulario', 'Notificaci?n Teams/email', 'Flujo de aprobaci?n', 'Registrar en SharePoint', 'Prueba end-to-end']),
          _mod('Publicaci?n y gobernanza', 'Despliega en entornos corporativos.', ['Entorno dev vs prod', 'Permisos por rol', 'Documentar dependencias', 'Versionar cambios', 'Feedback de usuarios']),
        ],
      }),
      sharepoint: F({
        id: 'sharepoint', title: 'SharePoint', category: 'office', icon: ICON.sharepoint,
        requirements: ['Cuenta Microsoft 365', 'Sitio de equipo'],
        docs: { label: 'SharePoint', url: 'https://support.microsoft.com/es-es/sharepoint' },
        modules: [
          _mod('Sitios y bibliotecas', 'Organiza documentos en la nube.', ['Acceder a sitio de equipo', 'Subir a biblioteca', 'Crear lista con columnas', 'Vistas filtradas', 'Compartir con permisos']),
          _mod('Coautor?a', 'Edita en equipo con versionado.', ['Coeditar en navegador', 'Historial de versiones', 'Restaurar versi?n', 'Comentarios', 'Checkout si aplica']),
          _mod('Permisos', 'Control de acceso seguro.', ['Lectura vs edici?n', 'Grupos M365', 'Herencia de permisos', 'Auditar accesos', 'Revocar enlaces']),
          _mod('P?ginas e intranet', 'Comunica en el sitio.', ['P?gina de noticias', 'Web parts', 'Publicar contenido', 'Navegaci?n del sitio', 'Medir uso b?sico']),
          _mod('Integraci?n M365', 'Teams, Outlook y Power Platform.', ['Biblioteca en Teams', 'Sync OneDrive', 'Listas en Automate', 'Calendario del sitio', 'Flujo documental']),
        ],
      }),
      outlook: F({
        id: 'outlook', title: 'Outlook', category: 'office', icon: ICON.outlook,
        requirements: ['Cuenta Microsoft 365 o Outlook.com'],
        docs: { label: 'Outlook', url: 'https://support.microsoft.com/es-es/outlook' },
        modules: [
          _mod('Correo profesional', 'Redacta y gestiona mensajes.', ['Firma y respuestas auto', 'Asunto accionable', 'Para/CC/CCO', 'Adjuntos y enlaces', 'Programar env?o']),
          _mod('Organizaci?n', 'Carpetas y reglas autom?ticas.', ['Carpetas por proyecto', 'Reglas de entrada', 'Categor?as de color', 'Seguimiento', 'Archivar con criterio']),
          _mod('Calendario', 'Reuniones y disponibilidad.', ['Evento con agenda', 'Invitar y Teams', 'Recordatorios', 'Zonas horarias', 'Sala de reuniones']),
          _mod('Tareas integradas', 'Del correo a la acci?n.', ['Marcar seguimiento', 'Crear tarea', 'Microsoft To Do', 'Cerrar pendientes', 'Priorizar bloques']),
          _mod('Seguridad', 'Phishing y datos sensibles.', ['Se?ales de phishing', 'Adjuntos sospechosos', 'Cifrado', 'Reportar fraude', 'Pol?tica de retenci?n']),
        ],
      }),
      onedrive: F({
        id: 'onedrive', title: 'OneDrive', category: 'office', icon: ICON.onedrive,
        requirements: ['Cuenta Microsoft 365', 'Cliente OneDrive'],
        docs: { label: 'OneDrive', url: 'https://support.microsoft.com/es-es/onedrive' },
        modules: [
          _mod('Sync y almacenamiento', 'Archivos en la nube con espejo local.', ['Instalar cliente', 'Elegir carpetas sync', 'Subir y organizar', 'Estado de sync', 'Archivos bajo demanda']),
          _mod('Compartir seguro', 'Enlaces con permisos y expiraci?n.', ['Enlace vista/edici?n', 'Fecha de expiraci?n', 'Revocar acceso', 'Carpeta de equipo', 'Evitar enlaces abiertos']),
          _mod('Coedici?n Office', 'Trabajo simult?neo en documentos.', ['Office web', 'Coedici?n tiempo real', 'Comentarios', 'Resolver conflictos', 'Versi?n final']),
          _mod('Recuperaci?n', 'Versiones y papelera.', ['Historial de versiones', 'Papelera OneDrive', 'Known Folder Move', 'Backup m?vil', 'Prueba de restore']),
          _mod('Gobernanza', 'Pol?ticas corporativas.', ['OneDrive vs SharePoint', 'Etiquetas sensibilidad', 'DLP', 'Sin credenciales en texto', 'Estructura de carpetas']),
        ],
      }),
      scrum: F({
        id: 'scrum', title: 'Scrum', category: 'tools', icon: ICON.scrum,
        requirements: ['Proyecto o equipo', 'Tablero (Jira, Trello, Azure Boards)'],
        docs: { label: 'Scrum Guide', url: 'https://scrumguides.org/scrum-guide.html' },
        modules: [
          _mod('Roles y eventos', 'Framework ?gil en sprints.', ['PO, SM y Developers', 'Duraci?n de sprint', 'Sprint Planning', 'Daily Scrum', 'Review y Retro']),
          _mod('User stories', 'INVEST y criterios de aceptaci?n.', ['Formato Como/Quiero/Para', 'Criterios verificables', 'Estimaci?n', 'Priorizaci?n', 'Refinar backlog']),
          _mod('Tablero Kanban', 'Flujo visual del sprint.', ['Columnas To Do/Doing/Done', 'L?mite WIP', 'Mover con criterio', 'Detectar bloqueos', 'Burndown simple']),
          _mod('Definition of Done', 'Acuerdo de calidad del equipo.', ['Definir DoD', 'Incluir pruebas', 'Aplicar en cada ?tem', 'Deuda en retro', 'Evolucionar DoD']),
          _mod('Mejora continua', 'M?tricas y retrospectiva.', ['Velocity para planificar', 'Acciones en retro', 'Escalar impedimentos', 'Cultura de inspecci?n', 'Adaptar cada sprint']),
        ],
      }),
      scratch: F({
        id: 'scratch', title: 'Scratch', category: 'programming', icon: ICON.scratch,
        requirements: ['Navegador web', 'Cuenta Scratch opcional'],
        docs: { label: 'Scratch Ideas', url: 'https://scratch.mit.edu/ideas' },
        modules: [
          _mod('Sprites y bloques', 'Programaci?n visual sin sintaxis.', ['Escenario y sprites', 'Movimiento b?sico', 'Apariencia y sonido', 'Guardar proyecto', 'Remixar de comunidad']),
          _mod('Eventos y bucles', 'Reaccionar a acciones del usuario.', ['Banderita verde', 'Teclas', 'Bucles repeat/forever', 'Condiciones if', 'Depurar paso a paso']),
          _mod('Variables y mensajes', 'Puntuaci?n y comunicaci?n.', ['Variable de score', 'Actualizar en eventos', 'Broadcast entre sprites', 'Sincronizar animaciones', 'Probar casos l?mite']),
          _mod('Mini-juego', 'Proyecto interactivo completo.', ['Reglas y victoria', 'Dificultad progresiva', 'Feedback visual', 'Prueba con usuario', 'Iterar dise?o']),
          _mod('Comunidad Scratch', 'Compartir con responsabilidad.', ['Notas del proyecto', 'Atribuir assets', 'Publicar', 'Comentar constructivo', 'Reflexionar aprendizaje']),
        ],
      }),
      'video-editing': F({
        id: 'video-editing', title: 'Edici?n de videos', category: 'design', icon: ICON.video,
        requirements: ['Editor de video', 'Clips de pr?ctica'],
        docs: { label: 'Edici?n de video', url: 'https://www.youtube.com/results?search_query=video+editing+basics' },
        modules: [
          _mod('Timeline y cortes', 'Montaje b?sico con ritmo.', ['Importar clips', 'Cortar y ordenar', 'Ajustar in/out', 'Eliminar sobrantes', 'Exportar borrador']),
          _mod('Audio', 'Voz, m?sica y niveles.', ['Normalizar di?logo', 'M?sica de fondo', 'Fade in/out', 'Cortes al ritmo', 'Reducir ruido']),
          _mod('T?tulos y transiciones', 'Guiar al espectador.', ['Lower thirds', 'Transiciones suaves', 'Evitar distracciones', 'Marca visual', 'Legibilidad m?vil']),
          _mod('Color y export', 'Look profesional y formatos.', ['Exposici?n y contraste', 'Preset/LUT ligero', 'Codec por plataforma', 'Export YouTube/IG', 'Verificar en destino']),
          _mod('Flujo de trabajo', 'Organizaci?n y revisi?n.', ['Carpetas de proyecto', 'Nombres consistentes', 'Checklist de revisi?n', 'Feedback cliente', 'Archivar proyecto']),
        ],
      }),
      django: F({
        id: 'django', title: 'Django', category: 'programming', icon: ICON.django,
        requirements: ['Python instalado', 'Terminal b?sica'],
        docs: { label: 'Django docs', url: 'https://docs.djangoproject.com/es/5.0/' },
        modules: [
          _mod('Proyecto MVT', 'Framework web en Python.', ['Entorno virtual', 'Crear proyecto y app', 'settings y urls', 'Servidor dev', 'Vista y plantilla']),
          _mod('Modelos ORM', 'Persistencia y migraciones.', ['Definir modelo', 'Migraciones', 'Admin', 'Datos de prueba', 'Shell Django']),
          _mod('Vistas y templates', 'P?ginas din?micas.', ['URL a vista', 'Contexto a template', 'base.html', 'Lista y detalle', 'Enlaces entre p?ginas']),
          _mod('Formularios', 'Entrada de usuario segura.', ['ModelForm', 'Validaci?n servidor', 'Errores en template', 'Token CSRF', 'Redirect tras guardar']),
          _mod('API y deploy', 'DRF intro y producci?n.', ['REST framework b?sico', 'Serializar modelo', 'Probar endpoint', 'DEBUG y ALLOWED_HOSTS', 'Checklist seguridad']),
        ],
      }),
      powerbi: F({
        id: 'powerbi', title: 'Power BI', category: 'data', icon: ICON.powerbi,
        requirements: ['Power BI Desktop', 'Datos Excel o CSV'],
        docs: { label: 'Power BI', url: 'https://learn.microsoft.com/es-es/power-bi/' },
        modules: [
          _mod('Power Query', 'Importar y limpiar datos.', ['Conectar origen', 'Editor Power Query', 'Tipos y nulos', 'Transformaciones', 'Cargar al modelo']),
          _mod('Modelado', 'Relaciones y estrella.', ['Claves primarias', 'Relaci?n 1:N', 'Evitar ambig?edad', 'Ocultar columnas', 'Documentar tablas']),
          _mod('DAX esencial', 'KPIs con medidas.', ['SUM ventas', 'Variaci?n YoY', 'DIVIDE seguro', 'CALCULATE', 'Validar n?meros']),
          _mod('Visuales', 'Informes accionables.', ['Visual por pregunta', 'Segmentadores', 'Filtros sincronizados', 'Formato de marca', 'Tooltips claros']),
          _mod('Publicaci?n', 'Service y refresh.', ['Publicar workspace', 'Refresh programado', 'Permisos', 'Export PDF', 'Monitorear fallos']),
        ],
      }),
      'prompt-engineering': F({
        id: 'prompt-engineering', title: 'Prompt Engineering', category: 'tools', icon: ICON.prompt,
        requirements: ['Asistente de IA', 'Casos de uso definidos'],
        docs: { label: 'Prompt engineering', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
        modules: [
          _mod('Anatom?a del prompt', 'Contexto, tarea y formato.', ['Rol y contexto', 'Formato de salida', 'Few-shot', 'Tono y audiencia', 'Iterar una variable']),
          _mod('Razonamiento', 'Chain-of-thought y descomposici?n.', ['Paso a paso', 'Subpreguntas', 'Verificar supuestos', 'Comparar enfoques', 'Detectar alucinaciones']),
          _mod('Productividad', 'Correos, res?menes y tablas.', ['Resumen con l?mite', 'Notas a informe', 'Borrador de email', 'Tabla Markdown', 'Validar salida']),
          _mod('C?digo y datos', 'Asistencia t?cnica segura.', ['Stack y versi?n', 'Error completo al depurar', 'Pedir tests', 'Sin API keys', 'Explicar complejidad']),
          _mod('Evaluaci?n', 'Plantillas y pol?ticas.', ['Criterios de ?xito', 'Guardar plantillas', 'Pol?tica de datos', 'Revisar sesgos', 'Actualizar con modelo']),
        ],
      }),
      engineering: F({
        id: 'engineering', title: 'Ingenier?a de software', category: 'programming', icon: ICON.engineering,
        requirements: ['Bases de programaci?n', 'Trabajo en equipo'],
        docs: { label: 'Ingenier?a de software', url: 'https://martinfowler.com/' },
        modules: [
          _mod('Requisitos', 'Del problema al alcance.', ['Funcionales y NFR', 'Priorizar valor', 'Casos de uso', 'Validar alcance', 'Criterios aceptaci?n']),
          _mod('Arquitectura', 'Modularidad y capas.', ['Separar m?dulos', 'Capas UI/l?gica/datos', 'Patrones b?sicos', 'Diagrama componentes', 'Cohesi?n y acoplamiento']),
          _mod('Pruebas y CI', 'Calidad automatizada.', ['Tests unitarios', 'Suite en CI', 'Cobertura con criterio', 'Code review', 'Regresiones']),
          _mod('DevOps', 'Entrega y monitoreo.', ['Build reproducible', 'Pipeline deploy', 'Secretos seguros', 'Logs y m?tricas', 'Plan rollback']),
          _mod('Mantenimiento', 'Deuda t?cnica y evoluci?n.', ['Identificar deuda', 'Refactor incremental', 'ADR ligero', 'Est?ndares equipo', 'Features vs estabilidad']),
        ],
      }),
      'game-editing': F({
        id: 'game-editing', title: 'Edici\u00f3n de videojuegos', category: 'design', icon: ICON.game,
        requirements: ['Motor de juego (Unity, Unreal o Godot)', 'PC con requisitos m\u00ednimos del editor'],
        docs: { label: 'Unity Learn', url: 'https://learn.unity.com/' },
        modules: [
          _mod('Introducci\u00f3n al editor', 'Conoce el entorno de creaci\u00f3n de videojuegos.', ['Abrir proyecto de ejemplo', 'Explorar escena, jerarqu\u00eda e inspector', 'Navegar vista Scene y Game', 'Guardar escena y proyecto', 'Probar Play mode']),
          _mod('Assets y prefabs', 'Organiza recursos reutilizables del juego.', ['Importar modelos, sprites y audio', 'Crear prefabs desde objetos', 'Aplicar materiales y texturas', 'Organizar carpetas del proyecto', 'Instanciar prefabs en escena']),
          _mod('F\u00edsica y colisiones', 'Simula interacci\u00f3n entre objetos.', ['A\u00f1adir Rigidbody y Colliders', 'Configurar capas de colisi\u00f3n', 'Detectar triggers y contactos', 'Ajustar gravedad y fricci\u00f3n', 'Depurar colisiones en runtime']),
          _mod('UI y jugabilidad', 'Pantallas, HUD y feedback al jugador.', ['Crear Canvas y botones', 'Mostrar puntuaci\u00f3n y vidas', 'Conectar eventos UI a l\u00f3ica', 'A\u00f1adir sonidos de feedback', 'Probar flujo de men\u00fa a partida']),
          _mod('Build y publicaci\u00f3n', 'Exporta y prueba tu juego.', ['Configurar Player Settings', 'Elegir plataforma objetivo', 'Generar build de prueba', 'Probar en dispositivo o ventana', 'Documentar versi\u00f3n y cambios']),
        ],
      }),
    };
  }

  function getCatalogEntries() {
    return [
      { id: 'flowchart', title: 'Diagrama de flujo', desc: 'Modela procesos con notaci?n clara y decisiones trazables.', icon: ICON.flowchart, color: 'var(--clr-flowchart)', category: 'tools', tags: ['diagrama', 'flujo', 'procesos'] },
      { id: 'os', title: 'Sistema operativo', desc: 'Domina archivos, permisos, red y productividad en tu SO.', icon: ICON.os, color: 'var(--clr-os)', category: 'tools', tags: ['windows', 'linux', 'sistema operativo'] },
      { id: 'powerapps', title: 'Power Apps', desc: 'Apps empresariales low-code con Microsoft 365.', icon: ICON.powerapps, color: 'var(--clr-powerapps)', category: 'office', tags: ['power apps', 'microsoft', 'low-code'] },
      { id: 'sharepoint', title: 'SharePoint', desc: 'Colaboraci?n en documentos e intranet de equipo.', icon: ICON.sharepoint, color: 'var(--clr-sharepoint)', category: 'office', tags: ['sharepoint', 'microsoft'] },
      { id: 'outlook', title: 'Outlook', desc: 'Correo, calendario y tareas profesionales.', icon: ICON.outlook, color: 'var(--clr-outlook)', category: 'office', tags: ['outlook', 'correo', 'microsoft'] },
      { id: 'onedrive', title: 'OneDrive', desc: 'Almacena, sincroniza y comparte en la nube.', icon: ICON.onedrive, color: 'var(--clr-onedrive)', category: 'office', tags: ['onedrive', 'nube'] },
      { id: 'scrum', title: 'Scrum', desc: 'Framework ?gil con sprints y mejora continua.', icon: ICON.scrum, color: 'var(--clr-scrum)', category: 'tools', tags: ['scrum', 'agile', 'sprint'] },
      { id: 'scratch', title: 'Scratch', desc: 'Programaci?n visual por bloques para aprender l?gica.', icon: ICON.scratch, color: 'var(--clr-scratch)', category: 'programming', tags: ['scratch', 'programaci?n', 'educaci?n'] },
      { id: 'video-editing', title: 'Edici?n de videos', desc: 'Monta y exporta videos para web y redes.', icon: ICON.video, color: 'var(--clr-video)', category: 'design', tags: ['video', 'edici?n', 'montaje'] },
      { id: 'django', title: 'Django', desc: 'Desarrollo web con Python y patr?n MVT.', icon: ICON.django, color: 'var(--clr-django)', category: 'programming', tags: ['django', 'python', 'web'] },
      { id: 'powerbi', title: 'Power BI', desc: 'Dashboards e informes interactivos de negocio.', icon: ICON.powerbi, color: 'var(--clr-powerbi)', category: 'data', tags: ['power bi', 'dax', 'datos'] },
      { id: 'prompt-engineering', title: 'Prompt Engineering', desc: 'Prompts efectivos para IA generativa.', icon: ICON.prompt, color: 'var(--clr-prompt)', category: 'tools', tags: ['prompt', 'ia', 'chatgpt'] },
      { id: 'engineering', title: 'Ingenier?a de software', desc: 'Requisitos, arquitectura, pruebas y entrega.', icon: ICON.engineering, color: 'var(--clr-engineering)', category: 'programming', tags: ['ingenier?a', 'software', 'devops'] },
      { id: 'game-editing', title: 'Edici\u00f3n de videojuegos', desc: 'Crea y edita juegos con motores, assets y builds.', icon: ICON.game, color: 'var(--clr-game-editing)', category: 'design', tags: ['videojuegos', 'unity', 'unreal', 'game dev', 'dise\u00f1o'] },
    ];
  }

  function getLessonVideos() {
    const out = {};
    Object.keys(VIDEOS).forEach((id) => { out[id] = _youtuVideos(id); });
    return out;
  }

  function getTutorialRaw() {
    const b = (r, rev, short, extra, topics) => ({
      rating: r, reviews: rev, quizzes: 5, aboutShort: short, aboutExtra: extra,
      videos: topics.slice(0, 5), topics, timeline: ['B?sico', 'Intermedio', 'Avanzado', 'Experto'],
    });
    return {
      flowchart: b('4.6', 142, 'Diagramas de flujo documentan procesos con s?mbolos est?ndar.', 'Usados en negocio y TI para alinear equipos.', ['S?mbolos', 'AS-IS', 'Decisiones', 'TO-BE', 'Mantenimiento']),
      os: b('4.7', 198, 'El SO gestiona hardware, archivos y aplicaciones.', 'Mejora productividad y seguridad.', ['Archivos', 'Permisos', 'Procesos', 'Red', 'Atajos']),
      powerapps: b('4.5', 156, 'Power Apps crea apps empresariales low-code.', 'Integrado con Microsoft 365.', ['Studio', 'F?rmulas', 'Conectores', 'Automate', 'Deploy']),
      sharepoint: b('4.6', 178, 'SharePoint colabora en documentos y listas.', 'Plataforma de contenido M365.', ['Sitios', 'Coautor?a', 'Permisos', 'P?ginas', 'Integraci?n']),
      outlook: b('4.5', 203, 'Outlook unifica correo y calendario.', 'Productividad profesional.', ['Correo', 'Reglas', 'Calendario', 'Tareas', 'Seguridad']),
      onedrive: b('4.6', 189, 'OneDrive sincroniza archivos en la nube.', 'Compartir con control.', ['Sync', 'Enlaces', 'Coedici?n', 'Versiones', 'IT']),
      scrum: b('4.7', 224, 'Scrum entrega valor en sprints.', 'Framework ?gil.', ['Roles', 'Stories', 'Tablero', 'DoD', 'Retro']),
      scratch: b('4.8', 312, 'Scratch ense?a programaci?n visual.', 'Ideal para educaci?n.', ['Sprites', 'Eventos', 'Variables', 'Juegos', 'Comunidad']),
      'video-editing': b('4.6', 167, 'Edici?n de video: narrativa y ritmo.', 'Web y redes sociales.', ['Timeline', 'Audio', 'T?tulos', 'Export', 'Flujo']),
      django: b('4.7', 245, 'Django acelera web con Python.', 'ORM y admin incluidos.', ['MVT', 'Modelos', 'Vistas', 'Forms', 'API']),
      powerbi: b('4.8', 276, 'Power BI para decisiones con datos.', 'DAX y dashboards.', ['Query', 'Modelo', 'DAX', 'Visuales', 'Service']),
      'prompt-engineering': b('4.7', 198, 'Prompt engineering optimiza IA.', 'T?cnicas reproducibles.', ['Anatom?a', 'Razonamiento', 'Productividad', 'C?digo', 'Evaluaci?n']),
      engineering: b('4.8', 289, 'Ingenier?a de software sistematiza el desarrollo.', 'De requisitos a operaci?n.', ['Requisitos', 'Arquitectura', 'Tests', 'DevOps', 'Deuda']),
      'game-editing': b('4.7', 231, 'La edici\u00f3n de videojuegos une dise\u00f1o, l\u00f3gica y publicaci\u00f3n.', 'Motores como Unity o Unreal facilitan prototipos jugables.', ['Editor', 'Assets', 'F\u00edsica', 'UI', 'Build']),
    };
  }

  function getExamQuestions() {
    const exams = {};
    getCatalogEntries().forEach(c => { exams[c.id] = CourseFactory.buildExamQuestions(c.title); });
    return exams;
  }

  return { getCourses, getCatalogEntries, getLessonVideos, getTutorialRaw, getExamQuestions };
})();

if (typeof module !== 'undefined') module.exports = ExtendedCourses;


;/* --- src/js/locales/extended-course-locales.js --- */
'use strict';

const EXTENDED_COURSE_LOCALE_DATA = {
  en: {
    "flowchart": {
      title: "Flowchart",
      requirements: ["Diagram editor", "Process to document"],
      docs: { label: "Flowcharts" },
      modules: [
        { title: "Symbols and notation", description: "Learn standard notation to represent processes.", steps: ["Identify start, end, process, and decision", "Use connectors and flow direction", "Avoid unnecessary crossings", "Apply top-down reading", "Export a shareable diagram"] },
        { title: "Current process (AS-IS)", description: "Document the real flow before improving.", steps: ["Interview key stakeholders", "Draw the flow without idealizing", "Mark waits and rework", "Quantify time per stage", "Validate with the team"] },
        { title: "Decisions and exceptions", description: "Model branches and alternative paths.", steps: ["Yes/no questions at decisions", "Represent loops with clear exits", "Document exceptions", "Balance detail level", "Verify all paths close"] },
        { title: "Target process (TO-BE)", description: "Design the improved flow.", steps: ["Detect bottlenecks", "Propose simplification", "Define owners", "Estimate impact", "Compare AS-IS vs TO-BE"] },
        { title: "Living documentation", description: "Keep diagrams up to date.", steps: ["Assign an owner", "Version changes", "Link to SOPs", "Schedule reviews", "Archive obsolete versions"] },
      ],
      tutorial: {
        aboutShort: "Flowcharts document processes with standard symbols.",
        aboutExtra: "Used in business and IT to align teams.",
        topics: ["Symbols", "AS-IS", "Decisions", "TO-BE", "Maintenance"],
      },
    },
    "os": {
      title: "Operating System",
      requirements: ["PC with Windows, macOS, or Linux", "User with basic permissions"],
      docs: { label: "Windows" },
      modules: [
        { title: "Files and desktop", description: "Navigate and organize the system efficiently.", steps: ["Browse folders and paths", "Create and move files", "Use OS search", "Configure views", "Recover from recycle bin"] },
        { title: "Users and permissions", description: "Configure accounts and local security.", steps: ["Standard user vs admin", "Read/write permissions", "Screen lock", "Security updates", "Basic backup"] },
        { title: "Processes and performance", description: "Diagnose resource usage.", steps: ["Task Manager", "Identify heavy processes", "Free disk space", "End unresponsive apps", "Restart when appropriate"] },
        { title: "Network and connectivity", description: "Resolve common connection issues.", steps: ["Connect to secure Wi-Fi", "Network diagnostics", "Forget problematic networks", "Distinguish local vs ISP failure", "Test with another device"] },
        { title: "Daily productivity", description: "OS shortcuts and automation.", steps: ["Window shortcuts", "Virtual desktops", "Scheduled tasks", "Cloud sync", "Document your setup"] },
      ],
      tutorial: {
        aboutShort: "The OS manages hardware, files, and applications.",
        aboutExtra: "Improves productivity and security.",
        topics: ["Files", "Permissions", "Processes", "Network", "Shortcuts"],
      },
    },
    "powerapps": {
      title: "Power Apps",
      requirements: ["Microsoft 365 account", "Power Apps license"],
      docs: { label: "Power Apps" },
      modules: [
        { title: "Introduction to Power Apps", description: "Build low-code apps connected to data.", steps: ["Explore Power Apps Studio", "Canvas vs model-driven", "Connect SharePoint or Excel", "Basic controls", "Publish a test app"] },
        { title: "Formulas and UX", description: "Power Fx and screen navigation.", steps: ["Buttons and inputs", "Filter and LookUp formulas", "Validate forms", "Navigate between screens", "Consistent theme"] },
        { title: "Data and connectors", description: "Integrate enterprise data sources.", steps: ["Choose a connector", "Map fields", "Create and edit records", "Handle errors", "Test with real data"] },
        { title: "Power Automate", description: "Automate from the app.", steps: ["Flow on form submit", "Teams/email notification", "Approval flow", "Log to SharePoint", "End-to-end test"] },
        { title: "Publishing and governance", description: "Deploy in corporate environments.", steps: ["Dev vs prod environment", "Role-based permissions", "Document dependencies", "Version changes", "User feedback"] },
      ],
      tutorial: {
        aboutShort: "Power Apps builds enterprise low-code applications.",
        aboutExtra: "Integrated with Microsoft 365.",
        topics: ["Studio", "Formulas", "Connectors", "Automate", "Deploy"],
      },
    },
    "sharepoint": {
      title: "SharePoint",
      requirements: ["Microsoft 365 account", "Team site"],
      docs: { label: "SharePoint" },
      modules: [
        { title: "Sites and libraries", description: "Organize documents in the cloud.", steps: ["Access team site", "Upload to library", "Create list with columns", "Filtered views", "Share with permissions"] },
        { title: "Co-authoring", description: "Team editing with versioning.", steps: ["Co-edit in browser", "Version history", "Restore version", "Comments", "Check out if needed"] },
        { title: "Permissions", description: "Secure access control.", steps: ["Read vs edit", "M365 groups", "Permission inheritance", "Audit access", "Revoke links"] },
        { title: "Pages and intranet", description: "Communicate on the site.", steps: ["News page", "Web parts", "Publish content", "Site navigation", "Basic usage metrics"] },
        { title: "M365 integration", description: "Teams, Outlook, and Power Platform.", steps: ["Library in Teams", "OneDrive sync", "Lists in Automate", "Site calendar", "Document workflow"] },
      ],
      tutorial: {
        aboutShort: "SharePoint collaborates on documents and lists.",
        aboutExtra: "Microsoft 365 content platform.",
        topics: ["Sites", "Co-authoring", "Permissions", "Pages", "Integration"],
      },
    },
    "outlook": {
      title: "Outlook",
      requirements: ["Microsoft 365 or Outlook.com account"],
      docs: { label: "Outlook" },
      modules: [
        { title: "Professional email", description: "Compose and manage messages.", steps: ["Signature and auto-replies", "Actionable subject lines", "To/CC/BCC", "Attachments and links", "Schedule send"] },
        { title: "Organization", description: "Folders and automatic rules.", steps: ["Folders by project", "Inbox rules", "Color categories", "Follow-up flags", "Archive with criteria"] },
        { title: "Calendar", description: "Meetings and availability.", steps: ["Event with agenda", "Invite and Teams", "Reminders", "Time zones", "Meeting rooms"] },
        { title: "Integrated tasks", description: "From email to action.", steps: ["Flag for follow-up", "Create task", "Microsoft To Do", "Close pending items", "Prioritize time blocks"] },
        { title: "Security", description: "Phishing and sensitive data.", steps: ["Phishing signals", "Suspicious attachments", "Encryption", "Report fraud", "Retention policy"] },
      ],
      tutorial: {
        aboutShort: "Outlook unifies email and calendar.",
        aboutExtra: "Professional productivity.",
        topics: ["Email", "Rules", "Calendar", "Tasks", "Security"],
      },
    },
    "onedrive": {
      title: "OneDrive",
      requirements: ["Microsoft 365 account", "OneDrive client"],
      docs: { label: "OneDrive" },
      modules: [
        { title: "Sync and storage", description: "Cloud files with local mirror.", steps: ["Install client", "Choose sync folders", "Upload and organize", "Sync status", "Files on demand"] },
        { title: "Secure sharing", description: "Links with permissions and expiration.", steps: ["View/edit link", "Expiration date", "Revoke access", "Team folder", "Avoid open links"] },
        { title: "Office co-editing", description: "Simultaneous document work.", steps: ["Office web", "Real-time co-editing", "Comments", "Resolve conflicts", "Final version"] },
        { title: "Recovery", description: "Versions and recycle bin.", steps: ["Version history", "OneDrive recycle bin", "Known Folder Move", "Mobile backup", "Restore test"] },
        { title: "Governance", description: "Corporate policies.", steps: ["OneDrive vs SharePoint", "Sensitivity labels", "DLP", "No credentials in plain text", "Folder structure"] },
      ],
      tutorial: {
        aboutShort: "OneDrive syncs files in the cloud.",
        aboutExtra: "Share with control.",
        topics: ["Sync", "Links", "Co-editing", "Versions", "IT"],
      },
    },
    "scrum": {
      title: "Scrum",
      requirements: ["Project or team", "Board (Jira, Trello, Azure Boards)"],
      docs: { label: "Scrum Guide" },
      modules: [
        { title: "Roles and events", description: "Agile framework in sprints.", steps: ["PO, SM, and Developers", "Sprint length", "Sprint Planning", "Daily Scrum", "Review and Retro"] },
        { title: "User stories", description: "INVEST and acceptance criteria.", steps: ["As/I want/So that format", "Verifiable criteria", "Estimation", "Prioritization", "Refine backlog"] },
        { title: "Kanban board", description: "Visual sprint flow.", steps: ["To Do/Doing/Done columns", "WIP limit", "Move with criteria", "Detect blockers", "Simple burndown"] },
        { title: "Definition of Done", description: "Team quality agreement.", steps: ["Define DoD", "Include tests", "Apply to every item", "Debt in retro", "Evolve DoD"] },
        { title: "Continuous improvement", description: "Metrics and retrospective.", steps: ["Velocity for planning", "Retro action items", "Escalate impediments", "Inspection culture", "Adapt each sprint"] },
      ],
      tutorial: {
        aboutShort: "Scrum delivers value in sprints.",
        aboutExtra: "Agile framework.",
        topics: ["Roles", "Stories", "Board", "DoD", "Retro"],
      },
    },
    "scratch": {
      title: "Scratch",
      requirements: ["Web browser", "Scratch account optional"],
      docs: { label: "Scratch Ideas" },
      modules: [
        { title: "Sprites and blocks", description: "Visual programming without syntax.", steps: ["Stage and sprites", "Basic movement", "Looks and sound", "Save project", "Remix from community"] },
        { title: "Events and loops", description: "React to user actions.", steps: ["Green flag", "Key presses", "Repeat/forever loops", "If conditions", "Debug step by step"] },
        { title: "Variables and messages", description: "Score and communication.", steps: ["Score variable", "Update on events", "Broadcast between sprites", "Sync animations", "Test edge cases"] },
        { title: "Mini-game", description: "Complete interactive project.", steps: ["Rules and win condition", "Progressive difficulty", "Visual feedback", "User testing", "Iterate design"] },
        { title: "Scratch community", description: "Share responsibly.", steps: ["Project notes", "Attribute assets", "Publish", "Constructive comments", "Reflect on learning"] },
      ],
      tutorial: {
        aboutShort: "Scratch teaches visual programming.",
        aboutExtra: "Ideal for education.",
        topics: ["Sprites", "Events", "Variables", "Games", "Community"],
      },
    },
    "video-editing": {
      title: "Video Editing",
      requirements: ["Video editor", "Practice clips"],
      docs: { label: "Video editing" },
      modules: [
        { title: "Timeline and cuts", description: "Basic editing with rhythm.", steps: ["Import clips", "Cut and order", "Adjust in/out points", "Remove excess", "Export draft"] },
        { title: "Audio", description: "Voice, music, and levels.", steps: ["Normalize dialogue", "Background music", "Fade in/out", "Cut to the beat", "Reduce noise"] },
        { title: "Titles and transitions", description: "Guide the viewer.", steps: ["Lower thirds", "Smooth transitions", "Avoid distractions", "Visual branding", "Mobile readability"] },
        { title: "Color and export", description: "Professional look and formats.", steps: ["Exposure and contrast", "Light preset/LUT", "Codec by platform", "Export YouTube/IG", "Verify on target"] },
        { title: "Workflow", description: "Organization and review.", steps: ["Project folders", "Consistent naming", "Review checklist", "Client feedback", "Archive project"] },
      ],
      tutorial: {
        aboutShort: "Video editing: narrative and pacing.",
        aboutExtra: "For web and social media.",
        topics: ["Timeline", "Audio", "Titles", "Export", "Workflow"],
      },
    },
    "django": {
      title: "Django",
      requirements: ["Python installed", "Basic terminal"],
      docs: { label: "Django docs" },
      modules: [
        { title: "MVT project", description: "Python web framework.", steps: ["Virtual environment", "Create project and app", "settings and urls", "Dev server", "View and template"] },
        { title: "ORM models", description: "Persistence and migrations.", steps: ["Define model", "Migrations", "Admin", "Test data", "Django shell"] },
        { title: "Views and templates", description: "Dynamic pages.", steps: ["URL to view", "Context to template", "base.html", "List and detail", "Links between pages"] },
        { title: "Forms", description: "Secure user input.", steps: ["ModelForm", "Server validation", "Errors in template", "CSRF token", "Redirect after save"] },
        { title: "API and deploy", description: "DRF intro and production.", steps: ["Basic REST framework", "Serialize model", "Test endpoint", "DEBUG and ALLOWED_HOSTS", "Security checklist"] },
      ],
      tutorial: {
        aboutShort: "Django accelerates web with Python.",
        aboutExtra: "ORM and admin included.",
        topics: ["MVT", "Models", "Views", "Forms", "API"],
      },
    },
    "powerbi": {
      title: "Power BI",
      requirements: ["Power BI Desktop", "Excel or CSV data"],
      docs: { label: "Power BI" },
      modules: [
        { title: "Power Query", description: "Import and clean data.", steps: ["Connect source", "Power Query editor", "Types and nulls", "Transformations", "Load to model"] },
        { title: "Modeling", description: "Relationships and star schema.", steps: ["Primary keys", "1:N relationship", "Avoid ambiguity", "Hide columns", "Document tables"] },
        { title: "Essential DAX", description: "KPIs with measures.", steps: ["SUM sales", "YoY change", "Safe DIVIDE", "CALCULATE", "Validate numbers"] },
        { title: "Visuals", description: "Actionable reports.", steps: ["Visual per question", "Slicers", "Synced filters", "Brand formatting", "Clear tooltips"] },
        { title: "Publishing", description: "Service and refresh.", steps: ["Publish to workspace", "Scheduled refresh", "Permissions", "Export PDF", "Monitor failures"] },
      ],
      tutorial: {
        aboutShort: "Power BI for data-driven decisions.",
        aboutExtra: "DAX and dashboards.",
        topics: ["Query", "Model", "DAX", "Visuals", "Service"],
      },
    },
    "prompt-engineering": {
      title: "Prompt Engineering",
      requirements: ["AI assistant", "Defined use cases"],
      docs: { label: "Prompt engineering" },
      modules: [
        { title: "Prompt anatomy", description: "Context, task, and format.", steps: ["Role and context", "Output format", "Few-shot", "Tone and audience", "Iterate one variable"] },
        { title: "Reasoning", description: "Chain-of-thought and decomposition.", steps: ["Step by step", "Sub-questions", "Verify assumptions", "Compare approaches", "Detect hallucinations"] },
        { title: "Productivity", description: "Emails, summaries, and tables.", steps: ["Summary with limit", "Notes to report", "Email draft", "Markdown table", "Validate output"] },
        { title: "Code and data", description: "Safe technical assistance.", steps: ["Stack and version", "Full error when debugging", "Request tests", "No API keys", "Explain complexity"] },
        { title: "Evaluation", description: "Templates and policies.", steps: ["Success criteria", "Save templates", "Data policy", "Review bias", "Update with model"] },
      ],
      tutorial: {
        aboutShort: "Prompt engineering optimizes AI.",
        aboutExtra: "Reproducible techniques.",
        topics: ["Anatomy", "Reasoning", "Productivity", "Code", "Evaluation"],
      },
    },
    "engineering": {
      title: "Software Engineering",
      requirements: ["Programming basics", "Teamwork"],
      docs: { label: "Software engineering" },
      modules: [
        { title: "Requirements", description: "From problem to scope.", steps: ["Functional and NFR", "Prioritize value", "Use cases", "Validate scope", "Acceptance criteria"] },
        { title: "Architecture", description: "Modularity and layers.", steps: ["Separate modules", "UI/logic/data layers", "Basic patterns", "Component diagram", "Cohesion and coupling"] },
        { title: "Testing and CI", description: "Automated quality.", steps: ["Unit tests", "CI suite", "Coverage with criteria", "Code review", "Regressions"] },
        { title: "DevOps", description: "Delivery and monitoring.", steps: ["Reproducible build", "Deploy pipeline", "Secure secrets", "Logs and metrics", "Rollback plan"] },
        { title: "Maintenance", description: "Technical debt and evolution.", steps: ["Identify debt", "Incremental refactor", "Light ADR", "Team standards", "Features vs stability"] },
      ],
      tutorial: {
        aboutShort: "Software engineering systematizes development.",
        aboutExtra: "From requirements to operations.",
        topics: ["Requirements", "Architecture", "Tests", "DevOps", "Debt"],
      },
    },
    "game-editing": {
      title: "Game Editing",
      requirements: ["Game engine (Unity, Unreal, or Godot)", "PC meeting editor minimum requirements"],
      docs: { label: "Unity Learn" },
      modules: [
        { title: "Editor introduction", description: "Learn the game creation environment.", steps: ["Open sample project", "Explore scene, hierarchy, and inspector", "Navigate Scene and Game views", "Save scene and project", "Test Play mode"] },
        { title: "Assets and prefabs", description: "Organize reusable game resources.", steps: ["Import models, sprites, and audio", "Create prefabs from objects", "Apply materials and textures", "Organize project folders", "Instantiate prefabs in scene"] },
        { title: "Physics and collisions", description: "Simulate interaction between objects.", steps: ["Add Rigidbody and Colliders", "Configure collision layers", "Detect triggers and contacts", "Adjust gravity and friction", "Debug collisions at runtime"] },
        { title: "UI and gameplay", description: "Screens, HUD, and player feedback.", steps: ["Create Canvas and buttons", "Display score and lives", "Connect UI events to logic", "Add feedback sounds", "Test menu-to-gameplay flow"] },
        { title: "Build and publishing", description: "Export and test your game.", steps: ["Configure Player Settings", "Choose target platform", "Generate test build", "Test on device or window", "Document version and changes"] },
      ],
      tutorial: {
        aboutShort: "Game editing combines design, logic, and publishing.",
        aboutExtra: "Engines like Unity or Unreal make playable prototypes accessible.",
        topics: ["Editor", "Assets", "Physics", "UI", "Build"],
      },
    },
  },
  zh: {
    "flowchart": {
      title: "流程图",
      requirements: ["流程图编辑器", "待记录的流程"],
      docs: { label: "流程图" },
      modules: [
        { title: "符号与标注", description: "学习表示流程的标准符号。", steps: ["识别开始、结束、流程与决策", "使用连接线与流向", "避免不必要的交叉", "采用自上而下阅读", "导出可分享的流程图"] },
        { title: "现状流程（AS-IS）", description: "在改进前记录真实流程。", steps: ["访谈关键参与者", "绘制未理想化的流程", "标注等待与返工", "估算各阶段时间", "与团队验证"] },
        { title: "决策与例外", description: "建模分支与替代路径。", steps: ["在决策点使用是/否问题", "用明确出口表示循环", "记录例外情况", "平衡细节程度", "验证路径闭合"] },
        { title: "目标流程（TO-BE）", description: "设计改进后的流程。", steps: ["识别瓶颈", "提出简化方案", "定义负责人", "估算影响", "对比 AS-IS 与 TO-BE"] },
        { title: "活文档", description: "保持流程图更新。", steps: ["指定负责人", "版本化变更", "链接到 SOP", "安排定期审查", "归档过时版本"] },
      ],
      tutorial: {
        aboutShort: "流程图用标准符号记录流程。",
        aboutExtra: "广泛用于商业与 IT，帮助团队对齐。",
        topics: ["符号", "AS-IS", "决策", "TO-BE", "维护"],
      },
    },
    "os": {
      title: "操作系统",
      requirements: ["装有 Windows、macOS 或 Linux 的 PC", "具有基本权限的用户"],
      docs: { label: "Windows" },
      modules: [
        { title: "文件与桌面", description: "高效浏览与整理系统。", steps: ["浏览文件夹与路径", "创建与移动文件", "使用系统搜索", "配置视图", "从回收站恢复"] },
        { title: "用户与权限", description: "配置账户与本地安全。", steps: ["标准用户 vs 管理员", "读/写权限", "屏幕锁定", "安全更新", "基本备份"] },
        { title: "进程与性能", description: "诊断资源使用。", steps: ["任务管理器", "识别高占用进程", "释放磁盘空间", "结束无响应应用", "必要时重启"] },
        { title: "网络与连接", description: "解决常见连接问题。", steps: ["连接安全 Wi-Fi", "网络诊断", "忘记问题网络", "区分本地故障与 ISP", "用其他设备测试"] },
        { title: "日常效率", description: "系统快捷方式与自动化。", steps: ["窗口快捷键", "虚拟桌面", "计划任务", "云同步", "记录你的配置"] },
      ],
      tutorial: {
        aboutShort: "操作系统管理硬件、文件与应用。",
        aboutExtra: "提升效率与安全性。",
        topics: ["文件", "权限", "进程", "网络", "快捷方式"],
      },
    },
    "powerapps": {
      title: "Power Apps",
      requirements: ["Microsoft 365 账户", "Power Apps 许可证"],
      docs: { label: "Power Apps" },
      modules: [
        { title: "Power Apps 入门", description: "创建连接数据的低代码应用。", steps: ["探索 Power Apps Studio", "Canvas vs 模型驱动", "连接 SharePoint 或 Excel", "基础控件", "发布测试应用"] },
        { title: "公式与 UX", description: "Power Fx 与屏幕导航。", steps: ["按钮与输入", "Filter 与 LookUp 公式", "验证表单", "屏幕间导航", "一致的主题"] },
        { title: "数据与连接器", description: "集成企业数据源。", steps: ["选择连接器", "映射字段", "创建与编辑记录", "处理错误", "用真实数据测试"] },
        { title: "Power Automate", description: "从应用自动化。", steps: ["提交表单触发流", "Teams/邮件通知", "审批流", "写入 SharePoint", "端到端测试"] },
        { title: "发布与治理", description: "在企业环境中部署。", steps: ["开发 vs 生产环境", "按角色授权", "记录依赖", "版本化变更", "收集用户反馈"] },
      ],
      tutorial: {
        aboutShort: "Power Apps 构建企业低代码应用。",
        aboutExtra: "与 Microsoft 365 深度集成。",
        topics: ["Studio", "公式", "连接器", "Automate", "部署"],
      },
    },
    "sharepoint": {
      title: "SharePoint",
      requirements: ["Microsoft 365 账户", "团队站点"],
      docs: { label: "SharePoint" },
      modules: [
        { title: "站点与库", description: "在云端组织文档。", steps: ["访问团队站点", "上传到文档库", "创建带列的列表", "筛选视图", "按权限共享"] },
        { title: "协同编辑", description: "带版本控制的团队编辑。", steps: ["浏览器中共同编辑", "版本历史", "恢复版本", "评论", "必要时签出"] },
        { title: "权限", description: "安全访问控制。", steps: ["只读 vs 编辑", "M365 组", "权限继承", "审计访问", "撤销链接"] },
        { title: "页面与内网", description: "在站点上沟通。", steps: ["新闻页", "Web 部件", "发布内容", "站点导航", "基本使用统计"] },
        { title: "M365 集成", description: "Teams、Outlook 与 Power Platform。", steps: ["Teams 中的库", "OneDrive 同步", "Automate 中的列表", "站点日历", "文档流"] },
      ],
      tutorial: {
        aboutShort: "SharePoint 协作处理文档与列表。",
        aboutExtra: "Microsoft 365 内容平台。",
        topics: ["站点", "协同", "权限", "页面", "集成"],
      },
    },
    "outlook": {
      title: "Outlook",
      requirements: ["Microsoft 365 或 Outlook.com 账户"],
      docs: { label: "Outlook" },
      modules: [
        { title: "专业邮件", description: "撰写与管理消息。", steps: ["签名与自动回复", "可执行的标题", "收件人/抄送/密送", "附件与链接", "定时发送"] },
        { title: "整理", description: "文件夹与自动规则。", steps: ["按项目建文件夹", "收件规则", "颜色类别", "跟进标记", "有策略地归档"] },
        { title: "日历", description: "会议与可用性。", steps: ["带议程的事件", "邀请与 Teams", "提醒", "时区", "会议室"] },
        { title: "集成任务", description: "从邮件到行动。", steps: ["标记跟进", "创建任务", "Microsoft To Do", "关闭待办", "优先时间块"] },
        { title: "安全", description: "钓鱼与敏感数据。", steps: ["识别钓鱼信号", "可疑附件", "加密", "举报欺诈", "保留策略"] },
      ],
      tutorial: {
        aboutShort: "Outlook 统一邮件与日历。",
        aboutExtra: "提升专业效率。",
        topics: ["邮件", "规则", "日历", "任务", "安全"],
      },
    },
    "onedrive": {
      title: "OneDrive",
      requirements: ["Microsoft 365 账户", "OneDrive 客户端"],
      docs: { label: "OneDrive" },
      modules: [
        { title: "同步与存储", description: "云端文件与本地镜像。", steps: ["安装客户端", "选择同步文件夹", "上传与整理", "同步状态", "按需文件"] },
        { title: "安全共享", description: "带权限与过期的链接。", steps: ["查看/编辑链接", "过期日期", "撤销访问", "团队文件夹", "避免公开链接"] },
        { title: "Office 协同", description: "文档同时编辑。", steps: ["Office 网页版", "实时协同", "评论", "解决冲突", "最终版本"] },
        { title: "恢复", description: "版本与回收站。", steps: ["版本历史", "OneDrive 回收站", "Known Folder Move", "移动备份", "恢复测试"] },
        { title: "治理", description: "企业策略。", steps: ["OneDrive vs SharePoint", "敏感度标签", "DLP", "勿在正文中放凭据", "文件夹结构"] },
      ],
      tutorial: {
        aboutShort: "OneDrive 在云端同步文件。",
        aboutExtra: "可控共享。",
        topics: ["同步", "链接", "协同", "版本", "IT"],
      },
    },
    "scrum": {
      title: "Scrum",
      requirements: ["项目或团队", "看板（Jira、Trello、Azure Boards）"],
      docs: { label: "Scrum Guide" },
      modules: [
        { title: "角色与事件", description: "冲刹中的敏捷框架。", steps: ["PO、SM 与 Developers", "冲刹长度", "Sprint Planning", "Daily Scrum", "Review 与 Retro"] },
        { title: "用户故事", description: "INVEST 与验收标准。", steps: ["作为/想要/以便格式", "可验证标准", "估算", "优先级", "精炼待办"] },
        { title: "Kanban 看板", description: "冲刹的可视化流。", steps: ["To Do/Doing/Done 列", "WIP 限制", "按标准移动", "发现阻塞", "简单燃尽"] },
        { title: "完成的定义", description: "团队质量共识。", steps: ["定义 DoD", "包含测试", "每项应用", "回顾中处理债务", "演进 DoD"] },
        { title: "持续改进", description: "指标与回顾。", steps: ["速度用于规划", "回顾行动项", "升级障碍", "检视文化", "每冲刹调整"] },
      ],
      tutorial: {
        aboutShort: "Scrum 在冲刹中交付价值。",
        aboutExtra: "敏捷框架。",
        topics: ["角色", "故事", "看板", "DoD", "回顾"],
      },
    },
    "scratch": {
      title: "Scratch",
      requirements: ["网页浏览器", "Scratch 账户（可选）"],
      docs: { label: "Scratch Ideas" },
      modules: [
        { title: "角色与积木", description: "无语法可视化编程。", steps: ["舞台与角色", "基础移动", "外观与声音", "保存项目", "社区 remix"] },
        { title: "事件与循环", description: "响应用户操作。", steps: ["绿旗", "按键", "repeat/forever 循环", "if 条件", "逐步调试"] },
        { title: "变量与消息", description: "得分与通信。", steps: ["分数变量", "事件中更新", "角色间广播", "同步动画", "测试边界"] },
        { title: "迷你游戏", description: "完整互动项目。", steps: ["规则与胜利", "渐进难度", "视觉反馈", "用户测试", "迭代设计"] },
        { title: "Scratch 社区", description: "负责任地分享。", steps: ["项目说明", "注明素材来源", "发布", "建设性评论", "反思学习"] },
      ],
      tutorial: {
        aboutShort: "Scratch 教授可视化编程。",
        aboutExtra: "适合教育场景。",
        topics: ["角色", "事件", "变量", "游戏", "社区"],
      },
    },
    "video-editing": {
      title: "视频编辑",
      requirements: ["视频编辑器", "练习素材"],
      docs: { label: "视频编辑" },
      modules: [
        { title: "时间线与剪辑", description: "有节奏的基础剪辑。", steps: ["导入片段", "剪切与排序", "调整入出点", "删除多余", "导出草稿"] },
        { title: "音频", description: "旁白、音乐与电平。", steps: ["标准化对白", "背景音乐", "淡入淡出", "卡点剪辑", "降噪"] },
        { title: "标题与转场", description: "引导观众。", steps: ["下三分之一", "柔和转场", "避免干扰", "视觉品牌", "移动端可读性"] },
        { title: "调色与导出", description: "专业观感与格式。", steps: ["曝光与对比", "轻量 LUT", "按平台编码", "导出 YouTube/IG", "在目标端验证"] },
        { title: "工作流程", description: "组织与审片。", steps: ["项目文件夹", "一致命名", "审片清单", "客户反馈", "归档项目"] },
      ],
      tutorial: {
        aboutShort: "视频编辑：叙事与节奏。",
        aboutExtra: "面向网页与社交媒体。",
        topics: ["时间线", "音频", "标题", "导出", "流程"],
      },
    },
    "django": {
      title: "Django",
      requirements: ["已安装 Python", "基础终端操作"],
      docs: { label: "Django 文档" },
      modules: [
        { title: "MVT 项目", description: "Python Web 框架。", steps: ["虚拟环境", "创建项目与应用", "settings 与 urls", "开发服务器", "视图与模板"] },
        { title: "ORM 模型", description: "持久化与迁移。", steps: ["定义模型", "迁移", "Admin", "测试数据", "Django shell"] },
        { title: "视图与模板", description: "动态页面。", steps: ["URL 到视图", "上下文到模板", "base.html", "列表与详情", "页面间链接"] },
        { title: "表单", description: "安全的用户输入。", steps: ["ModelForm", "服务端验证", "模板中的错误", "CSRF 令牌", "保存后重定向"] },
        { title: "API 与部署", description: "DRF 入门与生产。", steps: ["REST framework 基础", "序列化模型", "测试端点", "DEBUG 与 ALLOWED_HOSTS", "安全清单"] },
      ],
      tutorial: {
        aboutShort: "Django 用 Python 加速 Web 开发。",
        aboutExtra: "内置 ORM 与 admin。",
        topics: ["MVT", "模型", "视图", "表单", "API"],
      },
    },
    "powerbi": {
      title: "Power BI",
      requirements: ["Power BI Desktop", "Excel 或 CSV 数据"],
      docs: { label: "Power BI" },
      modules: [
        { title: "Power Query", description: "导入与清洗数据。", steps: ["连接数据源", "Power Query 编辑器", "类型与空值", "转换", "加载到模型"] },
        { title: "建模", description: "关系与星型模式。", steps: ["主键", "1:N 关系", "避免歧义", "隐藏列", "记录表结构"] },
        { title: "DAX 基础", description: "用度量值做 KPI。", steps: ["SUM 销售", "同比变化", "安全 DIVIDE", "CALCULATE", "验证数字"] },
        { title: "可视化", description: "可行动的报表。", steps: ["一图一问题", "切片器", "同步筛选", "品牌格式", "清晰工具提示"] },
        { title: "发布", description: "Service 与刷新。", steps: ["发布到工作区", "计划刷新", "权限", "导出 PDF", "监控失败"] },
      ],
      tutorial: {
        aboutShort: "Power BI 用数据驱动决策。",
        aboutExtra: "DAX 与仪表盘。",
        topics: ["Query", "模型", "DAX", "可视化", "Service"],
      },
    },
    "prompt-engineering": {
      title: "提示工程",
      requirements: ["AI 助手", "明确的用例"],
      docs: { label: "提示工程" },
      modules: [
        { title: "提示结构", description: "上下文、任务与格式。", steps: ["角色与上下文", "输出格式", "Few-shot", "语气与受众", "单变量迭代"] },
        { title: "推理", description: "思维链与分解。", steps: ["逐步推理", "子问题", "验证假设", "比较方法", "发现幻觉"] },
        { title: "生产力", description: "邮件、摘要与表格。", steps: ["限长摘要", "笔记转报告", "邮件草稿", "Markdown 表格", "验证输出"] },
        { title: "代码与数据", description: "安全的技术辅助。", steps: ["技术栈与版本", "完整错误信息", "要求测试", "勿含 API 密钥", "解释复杂度"] },
        { title: "评估", description: "模板与策略。", steps: ["成功标准", "保存模板", "数据策略", "审查偏见", "随模型更新"] },
      ],
      tutorial: {
        aboutShort: "提示工程优化 AI 使用。",
        aboutExtra: "可复现的技巧。",
        topics: ["结构", "推理", "生产力", "代码", "评估"],
      },
    },
    "engineering": {
      title: "软件工程",
      requirements: ["编程基础", "团队协作"],
      docs: { label: "软件工程" },
      modules: [
        { title: "需求", description: "从问题到范围。", steps: ["功能与非功能", "价值优先级", "用例", "验证范围", "验收标准"] },
        { title: "架构", description: "模块化与分层。", steps: ["分离模块", "UI/逻辑/数据层", "基础模式", "组件图", "内聚与耦合"] },
        { title: "测试与 CI", description: "自动化质量。", steps: ["单元测试", "CI 套件", "有标准的覆盖率", "代码评审", "回归"] },
        { title: "DevOps", description: "交付与监控。", steps: ["可复现构建", "部署流水线", "安全密钥", "日志与指标", "回滚计划"] },
        { title: "维护", description: "技术债与演进。", steps: ["识别债务", "增量重构", "轻量 ADR", "团队标准", "功能 vs 稳定"] },
      ],
      tutorial: {
        aboutShort: "软件工程系统化开发过程。",
        aboutExtra: "从需求到运维。",
        topics: ["需求", "架构", "测试", "DevOps", "债务"],
      },
    },
    "game-editing": {
      title: "游戏编辑",
      requirements: ["游戏引擎（Unity、Unreal 或 Godot）", "满足编辑器最低要求的 PC"],
      docs: { label: "Unity Learn" },
      modules: [
        { title: "编辑器入门", description: "了解游戏创作环境。", steps: ["打开示例项目", "探索场景、层级与检查器", "Scene 与 Game 视图", "保存场景与项目", "测试 Play 模式"] },
        { title: "资源与预制体", description: "组织可复用游戏资源。", steps: ["导入模型、精灵与音频", "从对象创建预制体", "应用材质与纹理", "整理项目文件夹", "在场景中实例化预制体"] },
        { title: "物理与碰撞", description: "模拟对象交互。", steps: ["添加 Rigidbody 与 Collider", "配置碰撞层", "检测触发与接触", "调整重力与摩擦", "运行时调试碰撞"] },
        { title: "UI 与玩法", description: "界面、HUD 与玩家反馈。", steps: ["创建 Canvas 与按钮", "显示分数与生命", "UI 事件连接逻辑", "添加反馈音效", "测试菜单到对局流程"] },
        { title: "构建与发布", description: "导出并测试游戏。", steps: ["配置 Player Settings", "选择目标平台", "生成测试构建", "在设备或窗口测试", "记录版本与变更"] },
      ],
      tutorial: {
        aboutShort: "游戏编辑融合设计、逻辑与发布。",
        aboutExtra: "Unity 或 Unreal 等引擎便于制作可玩原型。",
        topics: ["编辑器", "资源", "物理", "UI", "构建"],
      },
    },
  },
};


;/* --- src/js/data/extendedCourseLocales.js --- */
'use strict';

const ExtendedCourseLocales = (() => {
  const IDS = [
    'flowchart', 'os', 'powerapps', 'sharepoint', 'outlook', 'onedrive',
    'scrum', 'scratch', 'video-editing', 'django', 'powerbi',
    'prompt-engineering', 'engineering', 'game-editing',
  ];

  function _locale() {
    return typeof I18n !== 'undefined' ? I18n.getLocale() : 'es';
  }

  function _sectionLabel(i, locale) {
    if (locale === 'zh') return `\u6a21\u5757 ${i + 1}`;
    if (locale === 'en') return `Module ${i + 1}`;
    return `M\u00f3dulo ${i + 1}`;
  }

  function _tip(mod, title, locale) {
    const topic = mod.title.toLowerCase();
    if (locale === 'zh') return `\u7528\u771f\u5b9e\u6848\u4f8b\u7ec3\u4e60\u300c${mod.title}\u300d\u3002`;
    if (locale === 'en') return `Practice ${topic} with a real case from your environment.`;
    return `Practica ${topic} con un caso real de tu entorno.`;
  }

  function buildOverlay(courseId, course, locale) {
    if (!locale || locale === 'es') return null;
    const data = EXTENDED_COURSE_LOCALE_DATA[locale]?.[courseId];
    if (!data) return null;

    const overlay = {
      title: data.title,
      requirements: data.requirements,
      docs: data.docs,
      certModules: data.modules.map(m => m.title),
      lessons: {},
      quizSections: [],
      examSections: [],
    };

    course.lessons.forEach((lesson, i) => {
      const mod = data.modules[i];
      if (!mod) return;
      overlay.lessons[lesson.id] = {
        title: mod.title,
        section: _sectionLabel(i, locale),
        description: mod.description,
        requirements: data.requirements.slice(0, 2),
        steps: mod.steps,
        tip: _tip(mod, data.title, locale),
        resources: { docs: data.docs.label },
      };
      overlay.quizSections.push(
        CourseFactory.buildQuizBlock({ title: mod.title }, data.title, locale),
      );
    });

    overlay.examSections = CourseFactory.buildExamSections(data.title, data.title, locale);
    return overlay;
  }

  function getTutorialMeta(courseId, locale) {
    const loc = locale || _locale();
    if (!loc || loc === 'es') return null;
    const data = EXTENDED_COURSE_LOCALE_DATA[loc]?.[courseId];
    if (!data?.tutorial) return null;
    return data.tutorial;
  }

  function isExtendedId(id) {
    return IDS.includes(id);
  }

  return { buildOverlay, getTutorialMeta, isExtendedId, IDS };
})();

if (typeof module !== 'undefined') module.exports = ExtendedCourseLocales;


;/* --- src/js/services/QuizProgressService.js --- */
/**
 * IN4MIND — QuizProgressService
 *
 * Persiste el avance de un quiz *en curso* (no solo el resultado final) para que
 * el usuario pueda cerrar la pestaña o la sesión y retomar donde lo dejó.
 *
 * Se guarda en localStorage y se particiona por usuario, de modo que el progreso
 * sobreviva al cierre de sesión (sessionStorage se limpia en `AppShell.logout`).
 *
 * Cada entrada guarda además la `seed` con la que se barajaron opciones, pareos y
 * la polaridad de Verdadero/Falso. Al reanudar se regenera exactamente la misma
 * presentación, así el usuario no ve otras preguntas ni otro orden de respuestas.
 */

'use strict';

const QuizProgressService = (() => {

  const KEY_PREFIX = 'in4mind_quiz_state';
  /** Estados más antiguos que esto se descartan al leer. */
  const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 días

  function _userKey() {
    let email = '';
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      email = raw ? (JSON.parse(raw).email || '') : '';
    } catch { /* sesión ilegible → invitado */ }
    return `${KEY_PREFIX}:${email.toLowerCase() || 'guest'}`;
  }

  function _readAll() {
    try {
      const raw = localStorage.getItem(_userKey());
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function _writeAll(map) {
    try {
      localStorage.setItem(_userKey(), JSON.stringify(map));
      _scheduleCloudPush();
      return true;
    } catch {
      // Cuota llena o almacenamiento bloqueado: el quiz debe seguir funcionando.
      return false;
    }
  }

  let _pushTimer = null;
  function _scheduleCloudPush() {
    if (typeof CloudBlobSync === 'undefined') return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(() => {
      void CloudBlobSync.pushBlob('quizAttempts', _readAll());
    }, 500);
  }

  async function hydrateFromCloud() {
    if (typeof CloudBlobSync === 'undefined') return false;
    const remote = await CloudBlobSync.pullBlob('quizAttempts');
    if (!remote?.blob) return false;
    const local = _readAll();
    const merged = { ...(remote.blob || {}) };
    Object.entries(local).forEach(([id, entry]) => {
      const remoteEntry = merged[id];
      if (!remoteEntry || (entry.updatedAt || 0) >= (remoteEntry.updatedAt || 0)) {
        merged[id] = entry;
      }
    });
    try {
      localStorage.setItem(_userKey(), JSON.stringify(merged));
      return true;
    } catch {
      return false;
    }
  }

  function _isFresh(entry) {
    return Boolean(entry) && (Date.now() - (entry.updatedAt || 0)) < MAX_AGE_MS;
  }

  /** Semilla aleatoria para una nueva partida. */
  function newSeed() {
    return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  }

  /**
   * Todos los estados vigentes del usuario actual.
   * @returns {Object<string, object>}
   */
  function getAll() {
    const map = _readAll();
    const out = {};
    let pruned = false;
    Object.keys(map).forEach(id => {
      if (_isFresh(map[id])) out[id] = map[id];
      else pruned = true;
    });
    if (pruned) _writeAll(out);
    return out;
  }

  function get(quizId) {
    const entry = _readAll()[quizId];
    return _isFresh(entry) ? entry : null;
  }

  /**
   * Guarda el avance de un intento en curso.
   * @param {string} quizId
   * @param {{seed:number, currentIdx:number, total:number, answers:Array, isCertExam?:boolean, title?:string, icon?:string}} state
   */
  function save(quizId, state) {
    if (!quizId || !state || !state.total) return false;
    const map = _readAll();
    const answered = (state.answers || []).length;
    const correct = (state.answers || []).filter(a => a && a.correct).length;

    map[quizId] = {
      quizId,
      seed:        state.seed,
      currentIdx:  state.currentIdx || 0,
      total:       state.total,
      answers:     state.answers || [],
      answered,
      correct,
      /** % de preguntas contestadas — es lo que alimenta la barra de la tarjeta. */
      completionPct: Math.round((answered / state.total) * 100),
      /** % de aciertos sobre lo contestado hasta ahora. */
      scorePct:    answered > 0 ? Math.round((correct / answered) * 100) : 0,
      isCertExam:  Boolean(state.isCertExam),
      title:       state.title || quizId,
      icon:        state.icon || '',
      completed:   answered >= state.total,
      /** Orden adaptativo (uids) + meta del AdaptiveQuizEngine. */
      adaptiveOrder: Array.isArray(state.adaptiveOrder) ? state.adaptiveOrder : undefined,
      adaptiveMeta:  state.adaptiveMeta && typeof state.adaptiveMeta === 'object'
        ? state.adaptiveMeta
        : undefined,
      updatedAt:   Date.now(),
    };
    return _writeAll(map);
  }

  /** Elimina el avance de un quiz (al reiniciar o al terminarlo). */
  function clear(quizId) {
    const map = _readAll();
    if (!(quizId in map)) return false;
    delete map[quizId];
    return _writeAll(map);
  }

  function clearAll() {
    return _writeAll({});
  }

  /**
   * ¿Hay un intento a medias que valga la pena retomar?
   * Un quiz terminado no es reanudable: se vuelve a empezar.
   */
  function isResumable(quizId) {
    const entry = get(quizId);
    return Boolean(entry) && !entry.completed && entry.answered > 0 && entry.answered < entry.total;
  }

  /** % completado (0 si no hay avance guardado). */
  function getCompletionPct(quizId) {
    return get(quizId)?.completionPct ?? 0;
  }

  /**
   * Migra el progreso de invitado a la cuenta recién iniciada, sin pisar
   * intentos que la cuenta ya tuviera más avanzados.
   */
  function mergeGuestInto(email) {
    if (!email) return;
    const guestKey = `${KEY_PREFIX}:guest`;
    let guest;
    try {
      guest = JSON.parse(localStorage.getItem(guestKey) || '{}');
    } catch {
      return;
    }
    if (!guest || !Object.keys(guest).length) return;

    const userKey = `${KEY_PREFIX}:${email.toLowerCase()}`;
    let mine;
    try {
      mine = JSON.parse(localStorage.getItem(userKey) || '{}');
    } catch {
      mine = {};
    }

    Object.entries(guest).forEach(([id, entry]) => {
      const existing = mine[id];
      if (!existing || (entry.updatedAt || 0) > (existing.updatedAt || 0)) mine[id] = entry;
    });

    try {
      localStorage.setItem(userKey, JSON.stringify(mine));
      localStorage.removeItem(guestKey);
    } catch { /* sin espacio: se conserva el de invitado */ }
  }

  return {
    newSeed,
    getAll,
    get,
    save,
    clear,
    clearAll,
    isResumable,
    getCompletionPct,
    mergeGuestInto,
    hydrateFromCloud,
  };

})();

if (typeof module !== 'undefined') module.exports = QuizProgressService;


;/* --- src/js/services/QuizRandomizer.js --- */
/**
 * IN4MIND — QuizRandomizer
 *
 * Una sola pasada Fisher–Yates semillada al cargar el intento. El resultado
 * queda congelado en cada pregunta (`options`, `answerId`, `tfOrder`, `pairs`,
 * `rights`), así re-renderizar o reanudar no vuelve a barajar.
 *
 * Qué se aleatoriza (siempre con la misma semilla):
 *  - Orden de las preguntas (y con él la secuencia de tipos/metodologías).
 *  - Opciones de opción múltiple (identidad estable por `id`, no por índice).
 *  - Filas y definiciones de pareos.
 *  - Polaridad V/F y posición de los botones Verdadero/Falso.
 */

'use strict';

const QuizRandomizer = (() => {

  /**
   * PRNG determinista (mulberry32). Math.random() no sirve: no se puede
   * sembrar y la presentación debe ser reproducible al reanudar.
   * @param {number} seed
   * @returns {() => number} [0, 1)
   */
  function _rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Fisher–Yates con RNG inyectado. Devuelve una copia. */
  function _shuffle(arr, rand) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _autoNegateStatement(text) {
    const base = String(text || '').trim().replace(/\?+$/, '').trim();
    if (!base) return text;
    const lower = base.charAt(0).toLowerCase() + base.slice(1);
    return `No es cierto que ${lower}.`;
  }

  /**
   * Opción múltiple: cada opción lleva un `id` estable (`o0`… desde el
   * contenido fuente). Tras el shuffle la validación usa `answerId`, nunca
   * la posición en pantalla.
   */
  function _randomizeChoice(q, rand) {
    const raw = Array.isArray(q.opts) ? q.opts : [];
    if (!raw.length) return { ...q, options: [], answerId: null };

    const options = raw.map((text, i) => ({
      id: `o${i}`,
      text: String(text),
    }));
    const answerId = options[Number.isInteger(q.ans) ? q.ans : 0]?.id || options[0].id;
    const shuffled = _shuffle(options, rand);

    return {
      ...q,
      options: shuffled,
      /** @deprecated preferir `options` + `answerId`; se mantiene por compat. */
      opts: shuffled.map(o => o.text),
      answerId,
      ans: shuffled.findIndex(o => o.id === answerId),
    };
  }

  /**
   * V/F: polaridad del enunciado + orden de los botones, ambos en el estado
   * de la pregunta para no recolocar "Verdadero" siempre a la izquierda.
   */
  function _randomizeTrueFalse(q, rand) {
    const hasVariant = typeof q.qFalse === 'string' && q.qFalse.trim().length > 0;
    let next = { ...q, polarity: 'original' };

    if (hasVariant && q.ans === true) {
      if (rand() >= 0.5) {
        next = {
          ...q,
          q: q.qFalse,
          ans: false,
          exp: q.expFalse || q.exp,
          polarity: 'negated',
        };
      }
    } else if (rand() >= 0.5) {
      next = {
        ...q,
        q: q.qFalse || _autoNegateStatement(q.q),
        ans: !q.ans,
        exp: q.expFalse || q.exp,
        polarity: 'flipped',
      };
    }

    next.tfOrder = _shuffle([true, false], rand);
    return next;
  }

  /** Pareos: filas y desplegable de definiciones, cada fila con `id` estable. */
  function _randomizeMatch(q, rand) {
    const pairs = Array.isArray(q.pairs) ? q.pairs : [];
    const tagged = pairs.map((p, i) => ({
      id: `p${i}`,
      left: p.left,
      right: p.right,
    }));

    if (tagged.length < 2) {
      return { ...q, pairs: tagged, rights: tagged.map(p => p.right) };
    }

    const rows = _shuffle(tagged, rand);
    return {
      ...q,
      pairs: rows,
      rights: _shuffle(rows.map(p => p.right), rand),
    };
  }

  function _randomizeQuestion(q, rand) {
    if (q.type === 'truefalse') return _randomizeTrueFalse(q, rand);
    if (q.type === 'match') return _randomizeMatch(q, rand);
    if (q.type === 'choice') return _randomizeChoice(q, rand);
    return { ...q };
  }

  /**
   * Aplana el quiz, aleatoriza cada pregunta y baraja el orden global.
   * Una sola llamada por intento: el array resultante es el estado local.
   *
   * @param {object} quiz  definición con `sections[].questions[]`
   * @param {number} seed  semilla; la misma semilla da la misma presentación
   * @returns {Array<object>}
   */
  function prepare(quiz, seed) {
    const rand = _rng(seed);
    const flat = [];

    (quiz?.sections || []).forEach((sec, si) => {
      (sec.questions || []).forEach((q, qi) => {
        flat.push({
          ..._randomizeQuestion(q, rand),
          sectionTitle: sec.title,
          sectionIndex: si,
          sourceIndex: qi,
          // Identidad estable para depuración / review; no depende del shuffle.
          uid: `${si}:${qi}:${q.type}`,
        });
      });
    });

    // El orden de preguntas (y por tanto la secuencia de metodologías) también
    // queda fijado en este array: nadie debe volver a llamar a prepare.
    return _shuffle(flat, rand);
  }

  return { prepare, _rng, _shuffle };

})();

if (typeof module !== 'undefined') module.exports = QuizRandomizer;


;/* --- src/js/services/SessionStore.js --- */
/**
 * IN4MIND — SessionStore
 *
 * Sesión activa: solo en sessionStorage (se pierde al cerrar la pestaña).
 *
 * "Recordar mis datos" guarda únicamente correo/contraseña para precargar el
 * formulario de login. NO rehidrata la sesión automáticamente: el usuario debe
 * iniciar sesión de nuevo (o tener sesión válida de Supabase Auth).
 */

'use strict';

const SessionStore = (() => {

  const USER_KEY     = 'in4mind_user';
  const REMEMBER_KEY = 'in4mind_remember';
  const EMAIL_KEY    = 'in4mind_remember_email';
  const PWD_KEY      = 'in4mind_remember_pwd';

  function _encodePwd(pwd) {
    try { return btoa(unescape(encodeURIComponent(pwd))); } catch { return ''; }
  }

  function _decodePwd(raw) {
    try { return decodeURIComponent(escape(atob(raw))); } catch { return ''; }
  }

  function isRemembered() {
    try {
      return localStorage.getItem(REMEMBER_KEY) === '1';
    } catch {
      return false;
    }
  }

  /** Correo recordado para precargar el formulario de login. */
  function getRememberedEmail() {
    try {
      return localStorage.getItem(EMAIL_KEY) || '';
    } catch {
      return '';
    }
  }

  /** Contraseña recordada (solo si el usuario marcó "Recordar mis datos"). */
  function getRememberedPassword() {
    if (!isRemembered()) return '';
    try {
      const raw = localStorage.getItem(PWD_KEY);
      return raw ? _decodePwd(raw) : '';
    } catch {
      return '';
    }
  }

  /**
   * Limpia restos de versiones anteriores que auto-iniciaban sesión desde
   * localStorage. Ya no se restaura `in4mind_user` automáticamente.
   */
  function restore() {
    try {
      // Legacy: había un auto-login copiando localStorage → sessionStorage.
      localStorage.removeItem(USER_KEY);
    } catch { /* ignore */ }
    return Boolean(sessionStorage.getItem(USER_KEY));
  }

  /**
   * Guarda la sesión activa en la pestaña y, si aplica, credenciales recordadas.
   * @param {object} user
   * @param {boolean|null} remember
   * @param {string|null} [password]
   */
  function persist(user, remember = null, password = null) {
    if (!user) return;
    const raw = JSON.stringify(user);
    try {
      sessionStorage.setItem(USER_KEY, raw);
    } catch { /* almacenamiento bloqueado */ }

    const keep = remember === null ? isRemembered() : Boolean(remember);
    try {
      // Nunca persistir el objeto de sesión en localStorage (evita saltarse login).
      localStorage.removeItem(USER_KEY);

      if (keep) {
        localStorage.setItem(REMEMBER_KEY, '1');
        if (user.email) localStorage.setItem(EMAIL_KEY, user.email);
        if (password) localStorage.setItem(PWD_KEY, _encodePwd(password));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem(PWD_KEY);
      }
    } catch { /* sin espacio: la sesión de pestaña sigue funcionando */ }
  }

  /** Cierre de sesión: borra la sesión; el correo recordado es opcional. */
  function clear({ keepEmail = true, keepPassword = true } = {}) {
    try {
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      if (!keepEmail || !keepPassword) {
        localStorage.removeItem(REMEMBER_KEY);
      }
      if (!keepEmail) localStorage.removeItem(EMAIL_KEY);
      if (!keepPassword) localStorage.removeItem(PWD_KEY);
      // Si se borra la contraseña pero se quiere conservar el correo, mantener flag.
      if (keepEmail && !keepPassword && getRememberedEmail()) {
        localStorage.setItem(REMEMBER_KEY, '1');
      }
    } catch { /* ignore */ }
  }

  return {
    restore, persist, clear, isRemembered,
    getRememberedEmail, getRememberedPassword, USER_KEY,
  };

})();

// Limpia legacy de auto-login al cargar.
if (typeof window !== 'undefined') SessionStore.restore();

if (typeof module !== 'undefined') module.exports = SessionStore;


;/* --- src/js/services/UiDialog.js --- */
/**
 * IN4MIND — Diálogos temáticos (reemplazan alert / confirm / prompt).
 */
'use strict';

const UiDialog = (() => {

  let _open = null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function _ensureRoot() {
    let root = document.getElementById('ui-dialog-root');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'ui-dialog-root';
    document.body.appendChild(root);
    return root;
  }

  function close() {
    const root = document.getElementById('ui-dialog-root');
    if (root) {
      root.innerHTML = '';
      root.hidden = true;
    }
    const resolve = _open;
    _open = null;
    document.removeEventListener('keydown', _onKey, true);
    if (resolve) resolve(null);
  }

  function _onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const root = document.getElementById('ui-dialog-root');
    const focusable = root?.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function _mount({ title, bodyHtml, actions, danger, focusSelector }) {
    const root = _ensureRoot();
    root.hidden = false;
    root.innerHTML = `
      <div class="ui-dialog-backdrop" data-ui-dialog-dismiss>
        <div class="ui-dialog ${danger ? 'ui-dialog--danger' : ''}" role="dialog" aria-modal="true" aria-labelledby="ui-dialog-title">
          <h2 class="ui-dialog__title" id="ui-dialog-title">${_esc(title)}</h2>
          <div class="ui-dialog__body">${bodyHtml}</div>
          <div class="ui-dialog__actions">${actions}</div>
        </div>
      </div>`;
    document.addEventListener('keydown', _onKey, true);
    root.querySelector('[data-ui-dialog-dismiss]')?.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-ui-dialog-dismiss')) close();
    });
    const focusEl = root.querySelector(focusSelector || '.ui-dialog__actions button, .ui-dialog input');
    setTimeout(() => focusEl?.focus(), 20);
    return root;
  }

  function alert({ title, message } = {}) {
    return new Promise((resolve) => {
      close();
      _open = resolve;
      const root = _mount({
        title: title || _t('common.confirm', null, 'Aviso'),
        bodyHtml: `<p class="ui-dialog__text">${_esc(message || '')}</p>`,
        actions: `<button type="button" class="btn--course" data-ui-ok>${_esc(_t('common.confirm', null, 'Aceptar'))}</button>`,
      });
      root.querySelector('[data-ui-ok]')?.addEventListener('click', () => {
        const done = _open;
        _open = null;
        document.getElementById('ui-dialog-root').innerHTML = '';
        document.getElementById('ui-dialog-root').hidden = true;
        document.removeEventListener('keydown', _onKey, true);
        if (done) done(true);
      });
    });
  }

  function confirm({ title, message, danger, confirmLabel, cancelLabel } = {}) {
    return new Promise((resolve) => {
      close();
      _open = resolve;
      const okLabel = confirmLabel || (danger
        ? _t('common.delete', null, 'Eliminar')
        : _t('common.confirm', null, 'Confirmar'));
      const root = _mount({
        title: title || _t('common.confirm', null, 'Confirmar'),
        danger: Boolean(danger),
        bodyHtml: `<p class="ui-dialog__text">${_esc(message || '')}</p>`,
        actions: `
          <button type="button" class="btn--outline" data-ui-cancel>${_esc(cancelLabel || _t('common.cancel', null, 'Cancelar'))}</button>
          <button type="button" class="${danger ? 'btn--danger' : 'btn--course'}" data-ui-ok>${_esc(okLabel)}</button>`,
      });
      const finish = (value) => {
        const done = _open;
        _open = null;
        const el = document.getElementById('ui-dialog-root');
        if (el) { el.innerHTML = ''; el.hidden = true; }
        document.removeEventListener('keydown', _onKey, true);
        if (done) done(value);
      };
      root.querySelector('[data-ui-cancel]')?.addEventListener('click', () => finish(false));
      root.querySelector('[data-ui-ok]')?.addEventListener('click', () => finish(true));
    });
  }

  function prompt({ title, message, value, placeholder, confirmLabel } = {}) {
    return new Promise((resolve) => {
      close();
      _open = resolve;
      const root = _mount({
        title: title || _t('common.confirm', null, 'Nombre'),
        bodyHtml: `
          ${message ? `<p class="ui-dialog__text">${_esc(message)}</p>` : ''}
          <input class="ui-dialog__input" id="ui-dialog-input" type="text" maxlength="120"
                 value="${_esc(value || '')}" placeholder="${_esc(placeholder || '')}">`,
        actions: `
          <button type="button" class="btn--outline" data-ui-cancel>${_esc(_t('common.cancel', null, 'Cancelar'))}</button>
          <button type="button" class="btn--course" data-ui-ok>${_esc(confirmLabel || _t('common.save', null, 'Guardar'))}</button>`,
        focusSelector: '#ui-dialog-input',
      });
      const input = root.querySelector('#ui-dialog-input');
      const finish = (val) => {
        const done = _open;
        _open = null;
        const el = document.getElementById('ui-dialog-root');
        if (el) { el.innerHTML = ''; el.hidden = true; }
        document.removeEventListener('keydown', _onKey, true);
        if (done) done(val);
      };
      root.querySelector('[data-ui-cancel]')?.addEventListener('click', () => finish(null));
      root.querySelector('[data-ui-ok]')?.addEventListener('click', () => finish(input?.value ?? ''));
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(input.value);
        }
      });
    });
  }

  return { alert, confirm, prompt, close, danger: (opts) => confirm({ ...opts, danger: true }) };
})();

if (typeof module !== 'undefined') module.exports = UiDialog;


;/* --- src/js/services/ShareService.js --- */
/**
 * IN4MIND — ShareService + AuthGuard
 *
 * Antes, "Compartir" no tenía ningún manejador y la navegación interna vivía en
 * sessionStorage (`in4mind_open_course`, `in4mind_open_quiz`), así que ninguna
 * URL apuntaba a contenido concreto: compartir era imposible.
 *
 * Ahora cada vista publica su contexto con `setContext()` y el enlace generado
 * apunta exactamente a lo que el usuario está viendo. Al abrirlo sin sesión,
 * `AuthGuard` manda a login guardando el destino y luego devuelve ahí.
 */

'use strict';

const ShareService = (() => {

  /** Contexto de lo que se está viendo ahora mismo. */
  let _context = null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  /**
   * Declara qué contenido se está viendo, para que el botón de compartir sepa
   * qué enlace construir.
   * @param {{page?:string, params?:Object<string,string|number>, title?:string, text?:string}} ctx
   */
  function setContext(ctx) {
    _context = ctx || null;
  }

  function getContext() {
    return _context;
  }

  /** Base absoluta del sitio, incluyendo subcarpeta si la hubiera. */
  function _baseUrl() {
    const path = window.location.pathname.replace(/[^/]*$/, '');
    return `${window.location.origin}${path}`;
  }

  /**
   * URL absoluta del contenido actual.
   * Sin contexto declarado se comparte la página tal cual está en la barra.
   */
  function buildUrl(ctx = _context) {
    if (!ctx || !ctx.page) return window.location.href;
    const url = new URL(ctx.page, _baseUrl());
    Object.entries(ctx.params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
    return url.toString();
  }

  /**
   * Comparte el contenido actual: usa el diálogo nativo si existe y si no
   * copia el enlace al portapapeles.
   */
  async function share(ctx = _context) {
    const url = buildUrl(ctx);
    const title = ctx?.title || document.title || 'IN4MIND';
    const text = ctx?.text || title;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return { ok: true, method: 'native', url };
      } catch (err) {
        // El usuario canceló: no es un error que deba avisarse.
        if (err && err.name === 'AbortError') return { ok: false, cancelled: true, url };
      }
    }

    const copied = await copy(url);
    if (typeof AppShell !== 'undefined') {
      AppShell.showToast(copied
        ? _t('share.copied', null, 'Enlace copiado al portapapeles')
        : _t('share.copyFail', null, 'No se pudo copiar el enlace'));
    }
    return { ok: copied, method: 'clipboard', url };
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Contextos sin permiso de portapapeles (http, iframe sin allow).
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch {
        return false;
      }
    }
  }

  /**
   * Conecta cualquier botón marcado con `[data-share]` mediante delegación,
   * así funciona también con contenido renderizado después.
   */
  function bind() {
    if (bind._bound) return;
    bind._bound = true;
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-share]');
      if (!btn) return;
      e.preventDefault();

      // Un botón puede declarar su propio destino con data-share-page/params.
      const page = btn.dataset.sharePage;
      if (page) {
        let params = {};
        try {
          params = btn.dataset.shareParams ? JSON.parse(btn.dataset.shareParams) : {};
        } catch { /* params inválidos: se comparte sin ellos */ }
        void share({ page, params, title: btn.dataset.shareTitle });
        return;
      }
      void share();
    });
  }

  return { setContext, getContext, buildUrl, share, copy, bind };

})();

/**
 * AuthGuard — protege las páginas de contenido.
 *
 * Si no hay sesión, guarda la URL destino y redirige a login; tras entrar,
 * `consumeRedirect()` devuelve al usuario exactamente a donde iba.
 *
 * Si hace falta onboarding, `stashPendingRedirect` / `consumePendingRedirect`
 * conservan el deep-link hasta terminar la Ruta Empleable (IN4MIND_NEXT_REDIRECT).
 */
const AuthGuard = (() => {

  const NEXT_KEY = 'in4mind_next';
  const PENDING_KEY = 'IN4MIND_NEXT_REDIRECT';

  function _hasSession() {
    try {
      if (typeof SessionStore !== 'undefined') SessionStore.restore();
      return Boolean(sessionStorage.getItem('in4mind_user'));
    } catch {
      return false;
    }
  }

  /** Sólo se aceptan destinos internos: un `next` externo sería open redirect. */
  function _isSafe(target) {
    try {
      const url = new URL(target, window.location.origin);
      if (url.origin !== window.location.origin) return false;
      if (url.username || url.password) return false;
      const href = String(target).trim();
      if (/^(javascript|data|vbscript):/i.test(href)) return false;
      if ((url.pathname || '').includes('..')) return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normaliza a ruta relativa de la app (pathname + search + hash), o null.
   * Ej: "tutorial.html?course=python&lesson=1"
   */
  function sanitizeNext(raw) {
    if (raw == null) return null;
    const trimmed = String(raw).trim();
    if (!trimmed || /^(javascript|data|vbscript):/i.test(trimmed)) return null;
    try {
      const url = new URL(trimmed, window.location.origin);
      if (!_isSafe(url.href)) return null;
      let path = url.pathname || '/';
      // Static hosting: allow /foo.html or /folder/foo.html under same origin
      const leaf = path.split('/').filter(Boolean).pop() || '';
      if (leaf && !/\.html$/i.test(leaf)) return null;
      if (!leaf) return 'dashboard.html';
      // Prefer site-relative path without leading slash for window.location.replace
      const relPath = path.replace(/^\//, '');
      return `${relPath}${url.search || ''}${url.hash || ''}`;
    } catch {
      return null;
    }
  }

  function _redirectToLogin() {
    const target = window.location.href;
    try {
      if (_isSafe(target)) sessionStorage.setItem(NEXT_KEY, target);
    } catch { /* ignore */ }

    try {
      const current = new URL(target);
      const quiz = current.searchParams.get('quiz');
      const exam = current.searchParams.get('exam');
      if (quiz) sessionStorage.setItem('in4mind_open_quiz', quiz);
      if (exam) sessionStorage.setItem('in4mind_open_exam', exam);
      stashPendingRedirect(current.pathname.replace(/^\//, '') + current.search + current.hash);
    } catch { /* ignore */ }

    const login = new URL('login.html', window.location.href);
    try {
      const here = new URL(target);
      login.searchParams.set('next', here.pathname.replace(/^\//, '') + here.search);
    } catch {
      login.searchParams.set('next', new URL(target).pathname + new URL(target).search);
    }
    window.location.replace(login.toString());
  }

  function require() {
    if (_hasSession()) return true;
    _redirectToLogin();
    return false;
  }

  async function requireAsync() {
    if (_hasSession()) return true;
    if (typeof AuthService !== 'undefined' && AuthService.restoreOAuthSession) {
      try {
        const oauth = await AuthService.restoreOAuthSession();
        if (oauth?.ok) return true;
      } catch { /* sin sesión cloud */ }
    }
    _redirectToLogin();
    return false;
  }

  function consumeRedirect() {
    let target = null;
    try {
      target = sessionStorage.getItem(NEXT_KEY);
      sessionStorage.removeItem(NEXT_KEY);
    } catch { /* ignore */ }

    if (!target) {
      const fromQuery = new URLSearchParams(window.location.search).get('next');
      if (fromQuery) target = new URL(fromQuery, window.location.origin).toString();
    }

    return target && _isSafe(target) ? target : null;
  }

  function setRedirect(target) {
    try {
      if (_isSafe(target)) sessionStorage.setItem(NEXT_KEY, new URL(target, window.location.href).toString());
    } catch { /* ignore */ }
  }

  /** Guarda destino post-onboarding (localStorage + opcionalmente durable). */
  function stashPendingRedirect(target) {
    const rel = sanitizeNext(target);
    if (!rel) return null;
    try {
      localStorage.setItem(PENDING_KEY, rel);
    } catch { /* ignore */ }
    return rel;
  }

  function clearPendingRedirect() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch { /* ignore */ }
  }

  /**
   * Lee y limpia destino pendiente (query ?next= o IN4MIND_NEXT_REDIRECT).
   * @returns {string|null} ruta relativa segura
   */
  function consumePendingRedirect() {
    let raw = null;
    try {
      raw = new URLSearchParams(window.location.search).get('next');
    } catch { /* ignore */ }
    if (!raw) {
      try {
        raw = localStorage.getItem(PENDING_KEY);
      } catch { /* ignore */ }
    }
    clearPendingRedirect();

    return sanitizeNext(raw);
  }

  function peekPendingRedirect() {
    let raw = null;
    try {
      raw = new URLSearchParams(window.location.search).get('next');
    } catch { /* ignore */ }
    if (!raw) {
      try {
        raw = localStorage.getItem(PENDING_KEY);
      } catch { /* ignore */ }
    }
    return sanitizeNext(raw);
  }

  function onboardingUrlWithPending(pendingRel) {
    const rel = pendingRel || peekPendingRedirect();
    if (!rel) return 'onboarding.html';
    return `onboarding.html?next=${encodeURIComponent(rel)}`;
  }

  return {
    require,
    requireAsync,
    consumeRedirect,
    setRedirect,
    hasSession: _hasSession,
    NEXT_KEY,
    PENDING_KEY,
    sanitizeNext,
    stashPendingRedirect,
    clearPendingRedirect,
    consumePendingRedirect,
    peekPendingRedirect,
    onboardingUrlWithPending,
  };

})();

/**
 * Las páginas protegidas se marcan con `data-requires-auth` en <html>.
 * Se espera a que carguen AuthService/SessionStore (scripts posteriores) antes
 * de decidir el redirect, para poder rehidratar JWT de Supabase.
 */
if (typeof document !== 'undefined') {
  const html = document.documentElement;
  const params = new URLSearchParams(window.location.search);
  const isPreview = params.get('preview') === '1';

  if (html.hasAttribute('data-requires-auth') && !isPreview) {
    if (!AuthGuard.hasSession()) {
      html.style.visibility = 'hidden';
      const gate = () => {
        void AuthGuard.requireAsync().then(ok => {
          if (ok) html.style.visibility = '';
        });
      };
      // AuthService suele cargarse después de este archivo: esperar al final del parseo.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', gate);
      } else {
        setTimeout(gate, 0);
      }
    }
  }

  const boot = () => ShareService.bind();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined') module.exports = { ShareService, AuthGuard };


;/* --- src/js/services/DataService.js --- */
/**
 * IN4MIND — Capa de Datos (Data Service)
 * Fuente de verdad central para toda la información de la aplicación.
 * En producción, estos datos vendrían de una API REST.
 */

'use strict';

const DataService = (() => {

  const COURSES = [
    { id: 'canvas',      title: 'Canvas',      desc: 'Diseño visual profesional y creación de contenido gráfico.',       icon: 'src/img/courses/canva.svg?v=20260713', color: 'var(--clr-canvas)',  category: 'design',      tags: ['diseño', 'gráfico', 'canva', 'canvas', 'visual'] },
    { id: 'figma',       title: 'Figma',        desc: 'Diseño de interfaces y prototipos colaborativos.',                 icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968705.png', color: 'var(--clr-figma)',   category: 'design',      tags: ['ui', 'ux', 'figma', 'prototipo'] },
    { id: 'python',      title: 'Python',       desc: 'Programación versátil para automatización y datos.',              icon: 'src/img/courses/python.svg', color: 'var(--clr-python)',  category: 'programming', tags: ['python', 'programación', 'scripts', 'automatización'] },
    { id: 'javascript',  title: 'JavaScript',   desc: 'Interactividad y dinamismo para la web moderna.',                 icon: 'src/img/courses/javascript.svg', color: 'var(--clr-js)',      category: 'web',         tags: ['js', 'javascript', 'web', 'frontend'] },
    { id: 'html',        title: 'HTML',         desc: 'Estructura y semántica de páginas web.',                          icon: 'src/img/courses/html.svg', color: 'var(--clr-html)',    category: 'web',         tags: ['html', 'web', 'estructura', 'marcado'] },
    { id: 'css',         title: 'CSS',          desc: 'Estilos, animaciones y diseño responsivo.',                       icon: 'https://cdn-icons-png.flaticon.com/512/732/732190.png',   color: 'var(--clr-css)',     category: 'web',         tags: ['css', 'estilos', 'web', 'diseño'] },
    { id: 'github',      title: 'GitHub',       desc: 'Control de versiones y colaboración en proyectos.',               icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',     color: 'var(--clr-github)',  category: 'tools',       tags: ['github', 'git', 'versiones', 'repositorio'] },
    { id: 'excel',       title: 'Excel',        desc: 'Gestión y análisis de datos con hojas de cálculo.',               icon: 'https://cdn-icons-png.flaticon.com/512/732/732220.png',   color: 'var(--clr-excel)',   category: 'office',      tags: ['excel', 'datos', 'fórmulas', 'tablas'] },
    { id: 'powerpoint',  title: 'PowerPoint',   desc: 'Presentaciones visuales de impacto corporativo.',                 icon: 'https://cdn-icons-png.flaticon.com/512/732/732224.png',   color: 'var(--clr-pptx)',    category: 'office',      tags: ['powerpoint', 'presentaciones', 'slides'] },
    { id: 'sql',         title: 'SQL',          desc: 'Consultas y gestión de bases de datos relacionales.',             icon: 'src/img/courses/sql.svg', color: 'var(--clr-sql)',     category: 'data',        tags: ['sql', 'bases de datos', 'consultas', 'datos'] },
    { id: 'cybersecurity', title: 'Ciberseguridad', desc: 'Protege sistemas, datos y usuarios frente a amenazas digitales.', icon: 'src/img/courses/security.svg', color: 'var(--clr-security)', category: 'security', tags: ['ciberseguridad', 'seguridad', 'phishing', 'malware', 'contraseñas', 'hacking'] },
    ...(typeof ExtendedCourses !== 'undefined' ? ExtendedCourses.getCatalogEntries() : []),
  ];

  const RECENT_ITEMS = [
    { id: 'r1', courseId: 'python',     title: 'Bases de Python',     subtitle: 'Fundamentos',          timeLabel: 'Visto hace 2 min' },
    { id: 'r2', courseId: 'canvas',     title: 'Iniciando Canvas',    subtitle: 'Uso básico',           timeLabel: 'Hace 15 min'     },
    { id: 'r3', courseId: 'excel',      title: 'Principios de Excel', subtitle: 'Funciones esenciales', timeLabel: 'Hace 1 hora'     },
    { id: 'r4', courseId: 'javascript', title: 'Lógica de JS',        subtitle: 'Introducción',         timeLabel: 'Ayer'            },
    { id: 'r5', courseId: 'html',       title: 'Etiquetas HTML',      subtitle: 'Estructura web',       timeLabel: 'Ayer'            },
    { id: 'r6', courseId: 'github',     title: 'Git básico',          subtitle: 'Control de versiones', timeLabel: 'Hace 2 días'     },
    { id: 'r7', courseId: 'figma',      title: 'UI con Figma',        subtitle: 'Prototipos',           timeLabel: 'Hace 3 días'     },
    { id: 'r8', courseId: 'sql',        title: 'Consultas SQL',       subtitle: 'SELECT y JOINs',       timeLabel: 'Hace 1 semana'   },
    { id: 'r9', courseId: 'cybersecurity', title: 'Fundamentos de ciberseguridad', subtitle: 'Phishing y contraseñas', timeLabel: 'Hace 4 días' },
  ];

  const NAV_ITEMS = [
    { id: 'home',      label: 'Inicio',     icon: 'home', href: 'dashboard.html' },
    { id: 'tutorials', label: 'Cursos', icon: 'book', href: 'tutorial.html'  },
    { id: 'quizzes',   label: 'Quizzes',    icon: 'quiz', href: 'quizzes.html'   },
    { id: 'ai',        label: 'IA',         icon: 'bot',  href: 'ai.html'        },
  ];

  const NAV_FOOTER = [
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
    { id: 'other',    label: 'Otros',   icon: 'more'     },
  ];

  // ── Almacén de usuarios (persistido en localStorage para demo) ──
  const USERS_KEY = 'in4mind_users';
  const RESET_KEY = 'in4mind_reset';

  function _loadUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  let _users = _loadUsers();

  function _localizedCourses() {
    return COURSES.map(c => {
      const loc = typeof I18n !== 'undefined' ? I18n.t(`courses.${c.id}`) : null;
      if (loc && typeof loc === 'object') {
        return { ...c, title: loc.title || c.title, desc: loc.desc || c.desc };
      }
      return { ...c };
    });
  }

  function _localizedRecent() {
    return RECENT_ITEMS.map(r => {
      const loc = typeof I18n !== 'undefined' ? I18n.t(`recent.${r.id}`) : null;
      if (loc && typeof loc === 'object') {
        return { ...r, title: loc.title, subtitle: loc.subtitle, timeLabel: loc.time };
      }
      return { ...r };
    });
  }

  function getCourses(query = '') {
    let list = _localizedCourses();
    if (typeof ContentLoader !== 'undefined') {
      list = ContentLoader.applyOverlay(list);
    }
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q)  ||
      c.tags.some(t => t.includes(q))
    );
  }

  function getCoursesByCategory(category) {
    return _localizedCourses().filter(c => c.category === category);
  }

  function getRecentItems() { return _localizedRecent(); }

  function getNavItems() {
    return [
      { id: 'home',      label: typeof I18n !== 'undefined' ? I18n.t('nav.home') : 'Inicio',     icon: 'home',     href: 'dashboard.html' },
      { id: 'tutorials', label: typeof I18n !== 'undefined' ? I18n.t('nav.tutorials') : 'Cursos', icon: 'book',     href: 'tutorial.html'  },
      { id: 'notes',     label: typeof I18n !== 'undefined' ? I18n.t('nav.notes') : 'Notas',     icon: 'notes',    href: 'notes.html'     },
      { id: 'projects',  label: typeof I18n !== 'undefined' ? I18n.t('nav.projects') : 'Proyectos', icon: 'projects', href: 'projects.html'  },
      { id: 'guided',    label: typeof I18n !== 'undefined' ? I18n.t('nav.guided') : 'Guiados',  icon: 'guided',   href: 'guided-projects.html' },
      { id: 'quizzes',   label: typeof I18n !== 'undefined' ? I18n.t('nav.quizzes') : 'Quizzes',    icon: 'quiz',     href: 'quizzes.html'   },
      { id: 'ai',        label: typeof I18n !== 'undefined' ? I18n.t('nav.ai') : 'IA',         icon: 'bot',      href: 'ai.html'        },
    ];
  }

  function getNavFooter() {
    return [
      { id: 'settings', label: typeof I18n !== 'undefined' ? I18n.t('nav.settings') : 'Ajustes', icon: 'settings' },
      { id: 'other',    label: typeof I18n !== 'undefined' ? I18n.t('nav.other') : 'Otros',   icon: 'more'     },
    ];
  }

  /**
   * Simula login local (solo si Supabase no está disponible).
   * Exige un usuario registrado en este dispositivo; ya no acepta credenciales arbitrarias.
   */
  function login(email, password) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!email || password.length < 6) {
          resolve({ ok: false, error: typeof I18n !== 'undefined' ? I18n.t('auth.invalidCreds') : 'Credenciales inválidas.' });
          return;
        }
        const registered = _users[email.toLowerCase()];
        if (!registered) {
          resolve({
            ok: false,
            error: typeof I18n !== 'undefined'
              ? I18n.t('auth.errLogin')
              : 'Credenciales incorrectas. Regístrate o usa una cuenta válida.',
          });
          return;
        }
        if (registered.password !== password) {
          resolve({ ok: false, error: typeof I18n !== 'undefined' ? I18n.t('auth.wrongPassword') : 'Contraseña incorrecta.' });
          return;
        }
        resolve({ ok: true, user: { name: registered.name, email } });
      }, 800);
    });
  }

  /**
   * Simula registro. Guarda usuario en memoria para que el login lo encuentre.
   */
  function register(name, email, password) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (!name || !email || password.length < 6) {
          resolve({ ok: false, error: 'Por favor completa todos los campos.' });
          return;
        }
        // Guardar en memoria para que login lo recupere
        _users[email.toLowerCase()] = { name, password };
        _saveUsers(_users);
        resolve({ ok: true, user: { name, email } });
      }, 800);
    });
  }

  /**
   * Solicita recuperación de contraseña (simula envío de correo).
   * Genera un token de restablecimiento válido 30 minutos.
   */
  function requestPasswordReset(email) {
    return new Promise(resolve => {
      setTimeout(() => {
        const normalized = email.trim().toLowerCase();
        if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
          resolve({ ok: false, error: 'Introduce un correo electrónico válido.' });
          return;
        }

        const token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        const payload = {
          email: normalized,
          token,
          expires: Date.now() + 30 * 60 * 1000,
        };
        localStorage.setItem(RESET_KEY, JSON.stringify(payload));

        resolve({
          ok: true,
          email: normalized,
          // El token se entrega para que AuthService pueda incluirlo en el
          // enlace del correo que envía la función serverless.
          token,
          registered: Boolean(_users[normalized]),
        });
      }, 900);
    });
  }

  /**
   * Restablece la contraseña con el token generado.
   */
  function resetPassword(email, newPassword, confirmPassword) {
    return new Promise(resolve => {
      setTimeout(() => {
        const normalized = email.trim().toLowerCase();

        if (!newPassword || newPassword.length < 6) {
          resolve({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
          return;
        }
        if (newPassword !== confirmPassword) {
          resolve({ ok: false, error: 'Las contraseñas no coinciden.' });
          return;
        }
        if (!/^[\x20-\x7E]+$/.test(newPassword)) {
          resolve({ ok: false, error: 'Usa solo caracteres estándar (sin emojis).' });
          return;
        }

        let resetData;
        try {
          resetData = JSON.parse(localStorage.getItem(RESET_KEY) || 'null');
        } catch {
          resetData = null;
        }

        if (!resetData || resetData.email !== normalized) {
          resolve({ ok: false, error: 'Solicita un nuevo enlace de recuperación.' });
          return;
        }
        if (Date.now() > resetData.expires) {
          localStorage.removeItem(RESET_KEY);
          resolve({ ok: false, error: 'El enlace ha expirado. Solicita uno nuevo.' });
          return;
        }

        const existing = _users[normalized];
        if (existing) {
          _users[normalized] = { ...existing, password: newPassword };
        } else {
          const name = normalized.split('@')[0];
          _users[normalized] = { name, password: newPassword };
        }
        _saveUsers(_users);
        localStorage.removeItem(RESET_KEY);

        resolve({ ok: true, email: normalized });
      }, 800);
    });
  }

  return {
    getCourses, getCoursesByCategory, getRecentItems, getNavItems, getNavFooter,
    login, register, requestPasswordReset, resetPassword,
  };

})();

if (typeof module !== 'undefined') module.exports = DataService;


;/* --- src/js/controllers/OtherMenuController.js --- */
'use strict';

/**
 * IN4MIND — Menú «Otros» del sidebar (enlaces secundarios y acciones de cuenta).
 */
const OtherMenuController = (() => {

  let _bound = false;
  let _prevFocus = null;
  let _focusTrapHandler = null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  function _themePreference() {
    if (typeof ThemeController !== 'undefined' && ThemeController.getPreference) {
      return ThemeController.getPreference();
    }
    const saved = localStorage.getItem('in4mind_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
    return 'system';
  }

  function _syncThemeCards(pref) {
    const preference = pref || _themePreference();
    document.querySelectorAll('#other-overlay [data-theme-pref]').forEach((b) => {
      const active = b.dataset.themePref === preference;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
  }

  function _appearanceBlock() {
    const pref = _themePreference();
    const label = _t('otherMenu.appearance', null, 'Apariencia');
    const hint = _t('otherMenu.appearanceHint', null, 'Elige el modo visual de IN4MIND');
    const light = _t('otherMenu.themeLight', null, 'Claro');
    const dark = _t('otherMenu.themeDark', null, 'Oscuro');
    const system = _t('otherMenu.themeSystem', null, 'Sistema');
    return `
      <div class="other-menu__appearance" role="group" aria-label="${label}">
        <div class="other-menu__appearance-head">
          <span class="other-menu__section-label">${label}</span>
          <span class="other-menu__hint">${hint}</span>
        </div>
        <div class="settings-theme-grid other-menu__theme-grid" role="radiogroup" aria-label="${label}">
          <button type="button" class="settings-theme-card ${pref === 'light' ? 'is-active' : ''}" data-theme-pref="light" role="radio" aria-checked="${pref === 'light'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--light" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
            </div>
            <span class="settings-theme-card__label">${light}</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'dark' ? 'is-active' : ''}" data-theme-pref="dark" role="radio" aria-checked="${pref === 'dark'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--dark" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label">${dark}</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'system' ? 'is-active' : ''}" data-theme-pref="system" role="radio" aria-checked="${pref === 'system'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--system" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label">${system}</span>
          </button>
        </div>
      </div>
      <div class="other-menu__divider" role="separator"></div>`;
  }

  function _items() {
    const items = [
      { type: 'link', href: 'help.html', icon: 'help', label: _t('otherMenu.help', null, 'Centro de ayuda'), hint: _t('otherMenu.helpHint', null, 'FAQ y asistente') },
      { type: 'link', href: 'profile.html', icon: 'profile', label: _t('otherMenu.profile', null, 'Mi perfil'), hint: _t('otherMenu.profileHint', null, 'Certificados y progreso') },
      { type: 'link', href: 'verify.html', icon: 'verify', label: _t('otherMenu.verify', null, 'Verificar certificado') },
      { type: 'divider' },
      { type: 'link', href: 'privacidad.html', icon: 'privacy', label: _t('otherMenu.privacy', null, 'Privacidad') },
      { type: 'link', href: 'terminos.html', icon: 'terms', label: _t('otherMenu.terms', null, 'Términos de uso') },
      { type: 'link', href: 'cookies.html', icon: 'cookies', label: _t('otherMenu.cookies', null, 'Cookies') },
    ];

    const actions = [];
    if (typeof AppFeatures !== 'undefined') {
      actions.push({ type: 'action', action: 'search', icon: 'search', label: _t('otherMenu.shortcuts', null, 'Búsqueda rápida'), hint: _t('otherMenu.shortcutsHint', null, 'Ctrl+K') });
    }
    if (typeof DataExportService !== 'undefined') {
      actions.push({ type: 'action', action: 'export', icon: 'export', label: _t('otherMenu.export', null, 'Exportar mis datos') });
    }
    if (typeof AuthService !== 'undefined') {
      actions.push({ type: 'action', action: 'logout', icon: 'logout', label: _t('otherMenu.logout', null, 'Cerrar sesión'), danger: true });
    }
    if (actions.length) {
      items.push({ type: 'divider' }, ...actions);
    }

    items.push(
      { type: 'divider' },
      { type: 'link', href: 'index.html', icon: 'home', label: _t('otherMenu.home', null, 'Volver al inicio') }
    );
    return items;
  }

  function _icon(name) {
    const icons = {
      help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      profile: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      verify: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
      privacy: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
      terms: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>',
      cookies: '<circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9.5" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none"/>',
      search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
      export: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
      logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
      home: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
  }

  function _renderList() {
    const links = _items().map(item => {
      if (item.type === 'divider') return '<div class="other-menu__divider" role="separator"></div>';
      const arrow = '<svg class="other-menu__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>';
      const hint = item.hint ? `<span class="other-menu__hint">${item.hint}</span>` : '';
      const danger = item.danger ? ' other-menu__item--danger' : '';

      if (item.type === 'link') {
        return `
          <a class="other-menu__item${danger}" href="${item.href}">
            <span class="other-menu__icon">${_icon(item.icon)}</span>
            <span class="other-menu__text">
              <span class="other-menu__label">${item.label}</span>
              ${hint}
            </span>
            ${arrow}
          </a>`;
      }

      return `
        <button type="button" class="other-menu__item${danger}" data-other-action="${item.action}">
          <span class="other-menu__icon">${_icon(item.icon)}</span>
          <span class="other-menu__text">
            <span class="other-menu__label">${item.label}</span>
            ${hint}
          </span>
          ${arrow}
        </button>`;
    }).join('');

    return _appearanceBlock() + links;
  }

  function _buildModal() {
    if (document.getElementById('other-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'other-overlay';
    overlay.className = 'settings-overlay other-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = `
      <div class="settings-modal other-modal" role="dialog" aria-modal="true" aria-labelledby="other-modal-title">
        <header class="settings-modal__header">
          <h2 class="settings-modal__title" id="other-modal-title">${_t('otherMenu.title', null, 'Otros')}</h2>
          <button type="button" class="settings-modal__close" id="other-close" aria-label="${_t('otherMenu.close', null, 'Cerrar')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <nav class="other-menu__list" id="other-menu-list" aria-label="${_t('otherMenu.title', null, 'Otros')}">
          ${_renderList()}
        </nav>
      </div>`;

    document.body.appendChild(overlay);
  }

  function _refreshList() {
    const list = document.getElementById('other-menu-list');
    if (list) list.innerHTML = _renderList();
    const title = document.getElementById('other-modal-title');
    if (title) title.textContent = _t('otherMenu.title', null, 'Otros');
  }

  function _lockBackground() {
    document.body.classList.add('other-modal-open');
    document.documentElement.classList.add('other-modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'other-overlay') el.setAttribute('inert', '');
    });
  }

  function _unlockBackground() {
    document.body.classList.remove('other-modal-open');
    document.documentElement.classList.remove('other-modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'other-overlay') el.removeAttribute('inert');
    });
  }

  function _activateFocusTrap() {
    const modal = document.querySelector('#other-overlay .other-modal');
    if (!modal) return;
    _focusTrapHandler = e => {
      if (e.key !== 'Tab' || !document.getElementById('other-overlay')?.classList.contains('is-open')) return;
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', _focusTrapHandler);
  }

  function _deactivateFocusTrap() {
    if (_focusTrapHandler) {
      document.removeEventListener('keydown', _focusTrapHandler);
      _focusTrapHandler = null;
    }
  }

  function close() {
    const overlay = document.getElementById('other-overlay');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    _deactivateFocusTrap();
    _unlockBackground();
    if (_prevFocus && typeof _prevFocus.focus === 'function') {
      _prevFocus.focus();
    }
    _prevFocus = null;
  }

  function open() {
    if (typeof SettingsController !== 'undefined' && SettingsController.close) {
      SettingsController.close();
    }
    _buildModal();
    _refreshList();
    const overlay = document.getElementById('other-overlay');
    if (!overlay) return;
    _prevFocus = document.activeElement;
    overlay.hidden = false;
    overlay.classList.add('is-open');
    _lockBackground();
    _activateFocusTrap();
    document.getElementById('other-close')?.focus();
  }

  async function _runAction(action) {
    if (action === 'search') {
      close();
      if (typeof AppFeatures !== 'undefined' && AppFeatures.openSearch) {
        AppFeatures.openSearch();
      }
      return;
    }
    if (action === 'export') {
      if (typeof DataExportService !== 'undefined') {
        DataExportService.downloadJson();
      }
      close();
      return;
    }
    if (action === 'logout') {
      const msg = _t('profile.logoutConfirm', null, '¿Cerrar sesión?');
      const ok = typeof UiDialog !== 'undefined'
        ? await UiDialog.confirm({ title: msg, message: msg })
        : window.confirm(msg);
      if (!ok) return;
      close();
      if (typeof AppShell !== 'undefined') AppShell.logout();
      else if (typeof AuthService !== 'undefined') {
        await AuthService.logout();
        window.location.replace('login.html');
      } else location.href = 'index.html';
    }
  }

  function _handleOtherNav(e) {
    const otherNav = e.target.closest(
      '#sidebar .nav-item[data-nav="other"], #sidebar-footer .nav-item[data-nav="other"], [data-open-other-menu]'
    );
    if (!otherNav) return false;
    e.preventDefault();
    e.stopPropagation();
    open();
    if (typeof SidebarController !== 'undefined') SidebarController.closeMobile?.();
    return true;
  }

  function _bindGlobal() {
    if (_bound) return;
    _bound = true;

    document.addEventListener('click', e => {
      if (_handleOtherNav(e)) return;

      const themeBtn = e.target.closest('#other-overlay [data-theme-pref]');
      if (themeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const pref = themeBtn.dataset.themePref;
        if (typeof ThemeController !== 'undefined' && ThemeController.setPreference) {
          ThemeController.setPreference(pref);
        }
        _syncThemeCards(pref);
        return;
      }

      const actionBtn = e.target.closest('[data-other-action]');
      if (actionBtn) {
        e.preventDefault();
        void _runAction(actionBtn.dataset.otherAction);
        return;
      }
      if (e.target.closest('#other-close')) {
        e.preventDefault();
        close();
        return;
      }
      if (e.target.id === 'other-overlay') {
        close();
      }
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('other-overlay')?.classList.contains('is-open')) {
        close();
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      _handleOtherNav(e);
    }, true);

    window.addEventListener('in4mind-relocalize', () => {
      if (document.getElementById('other-overlay')?.classList.contains('is-open')) {
        _refreshList();
      }
    });

    window.addEventListener('in4mind-theme-change', (e) => {
      const pref = e.detail?.preference || _themePreference();
      _syncThemeCards(pref);
    });
  }

  function init() {
    _buildModal();
    _bindGlobal();
  }

  return { init, open, close };

})();

if (typeof module !== 'undefined') module.exports = OtherMenuController;


;/* --- src/js/i18n-boot.js --- */
/**
 * IN4MIND — Carga i18n en todas las páginas (después de locales e I18n.js).
 */
'use strict';

(function bootI18n() {
  if (typeof I18n === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    I18n.init();
    if (typeof ThemeController !== 'undefined' && ThemeController.mount) {
      ThemeController.mount();
    }
  });

  window.addEventListener('in4mind-locale-change', () => {
    const activeNav = document.querySelector('#sidebar .nav-item--active')?.dataset?.nav ?? null;
    if (typeof AppShell !== 'undefined' && document.getElementById('sidebar-nav')) {
      AppShell.renderSidebar(activeNav);
      AppShell.setupAvatar();
    }
    window.dispatchEvent(new CustomEvent('in4mind-relocalize'));
  });
})();

