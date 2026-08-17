/*! IN4MIND bundle 20260817nobanners34 — 2026-08-17T18:36:22.267156+00:00 */

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


;/* --- src/js/services/ErrorReporter.js --- */
/**
 * IN4MIND — Observabilidad mínima: captura errores JS y eventos de app.
 */
'use strict';

const ErrorReporter = (() => {
  const KEY = 'in4mind_error_log';
  const MAX = 40;
  let _bound = false;

  function _read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function _write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    } catch { /* ignore */ }
  }

  function capture(type, detail = {}) {
    const entry = {
      type: String(type || 'error'),
      detail: detail && typeof detail === 'object' ? detail : { message: String(detail) },
      href: typeof location !== 'undefined' ? location.pathname : '',
      at: new Date().toISOString(),
    };
    const list = _read();
    list.push(entry);
    _write(list);
    if (typeof console !== 'undefined') {
      console.warn('[IN4MIND]', entry.type, entry.detail);
    }
    return entry;
  }

  function getLog() {
    return _read();
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function init() {
    if (_bound || typeof window === 'undefined') return;
    _bound = true;
    window.addEventListener('error', (ev) => {
      capture('window_error', {
        message: ev.message,
        source: ev.filename,
        line: ev.lineno,
        col: ev.colno,
      });
    });
    window.addEventListener('unhandledrejection', (ev) => {
      const reason = ev.reason;
      capture('unhandled_rejection', {
        message: reason?.message || String(reason),
      });
    });
  }

  return { init, capture, getLog, clear };
})();

if (typeof module !== 'undefined') module.exports = ErrorReporter;


;/* --- src/js/services/SyncOutboxService.js --- */
/**
 * IN4MIND — Cola offline de escrituras a la nube.
 * Guarda operaciones fallidas en localStorage y las reintenta al volver online.
 */
'use strict';

const SyncOutboxService = (() => {
  const KEY = 'in4mind_sync_outbox';
  const MAX_ITEMS = 80;
  const MAX_ATTEMPTS = 8;
  const EVENT = 'in4mind-outbox-changed';

  function _read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function _write(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_ITEMS)));
      window.dispatchEvent(new CustomEvent(EVENT, { detail: { count: list.length } }));
      return true;
    } catch {
      return false;
    }
  }

  function enqueue(op) {
    if (!op || !op.table || !op.action) return false;
    const list = _read();
    const id = op.id || `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    // Dedup por table+action+conflictKey
    const key = op.conflictKey || null;
    const next = key
      ? list.filter(x => !(x.table === op.table && x.action === op.action && x.conflictKey === key))
      : list;
    next.push({
      id,
      table: op.table,
      action: op.action, // upsert | insert | delete | replace_blob
      payload: op.payload || {},
      match: op.match || null,
      conflict: op.conflict || null,
      conflictKey: key,
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return _write(next);
  }

  function size() {
    return _read().length;
  }

  function peek() {
    return _read();
  }

  async function _runOne(item, sb) {
    if (item.action === 'upsert') {
      const q = sb.from(item.table).upsert(item.payload, item.conflict ? { onConflict: item.conflict } : undefined);
      const { error } = await q;
      if (error) throw error;
      return;
    }
    if (item.action === 'insert') {
      const { error } = await sb.from(item.table).insert(item.payload);
      if (error) throw error;
      return;
    }
    if (item.action === 'delete') {
      let q = sb.from(item.table).delete();
      Object.entries(item.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      if (error) throw error;
      return;
    }
    if (item.action === 'replace_blob') {
      // payload: { user_id, blob, updated_at }
      const { error } = await sb.from(item.table).upsert(item.payload, {
        onConflict: item.conflict || 'user_id',
      });
      if (error) throw error;
      return;
    }
    throw new Error(`unknown_action:${item.action}`);
  }

  async function flush() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ok: false, reason: 'offline', flushed: 0, remaining: size() };
    }
    const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
    if (!sb) return { ok: false, reason: 'no_supabase', flushed: 0, remaining: size() };

    const list = _read();
    if (!list.length) return { ok: true, flushed: 0, remaining: 0 };

    const kept = [];
    let flushed = 0;

    for (const item of list) {
      try {
        await _runOne(item, sb);
        flushed += 1;
      } catch (err) {
        item.attempts = (item.attempts || 0) + 1;
        item.lastError = String(err?.message || err);
        item.updatedAt = Date.now();
        if (item.attempts < MAX_ATTEMPTS) kept.push(item);
        else if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('outbox_drop', { table: item.table, error: item.lastError });
        }
      }
    }

    _write(kept);
    return { ok: kept.length === 0, flushed, remaining: kept.length };
  }

  return { enqueue, flush, size, peek, EVENT };
})();

if (typeof module !== 'undefined') module.exports = SyncOutboxService;


;/* --- src/js/services/ConnectivityService.js --- */
/**
 * IN4MIND — Conectividad: banner offline + flush de cola al volver online.
 */
'use strict';

const ConnectivityService = (() => {
  const BANNER_ID = 'in4mind-offline-banner';
  let _bound = false;

  function _t(k, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function isOnline() {
    return typeof navigator === 'undefined' || navigator.onLine !== false;
  }

  function _ensureBanner() {
    let el = document.getElementById(BANNER_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = BANNER_ID;
    el.className = 'offline-banner';
    el.setAttribute('role', 'status');
    el.hidden = true;
    el.innerHTML = `<span class="offline-banner__text"></span>
      <button type="button" class="offline-banner__retry" id="offline-banner-retry">Reintentar</button>`;
    document.body.appendChild(el);
    document.getElementById('offline-banner-retry')?.addEventListener('click', () => {
      void flushNow(true);
    });
    return el;
  }

  function _setBanner(visible, text) {
    const el = _ensureBanner();
    const label = el.querySelector('.offline-banner__text');
    if (label) label.textContent = text || '';
    el.hidden = !visible;
  }

  function _toast(msg) {
    if (typeof AppShell !== 'undefined' && AppShell.showToast) AppShell.showToast(msg, 3200);
  }

  async function flushNow(manual = false) {
    if (!isOnline()) {
      _setBanner(true, _t('connectivity.offline', 'Sin conexión. Tus cambios se guardan en este dispositivo.'));
      if (manual) _toast(_t('connectivity.stillOffline', 'Sigues sin conexión.'));
      return { ok: false, reason: 'offline' };
    }

    _setBanner(false);

    if (typeof SyncOutboxService === 'undefined') return { ok: true };

    const result = await SyncOutboxService.flush();
    if (result.flushed > 0) {
      _toast(_t('connectivity.synced', `Se sincronizaron ${result.flushed} cambio(s).`).replace('{n}', String(result.flushed)));
    } else if (manual && result.remaining === 0) {
      _toast(_t('connectivity.upToDate', 'Todo está sincronizado.'));
    } else if (result.remaining > 0) {
      _setBanner(true, _t('connectivity.pending', `Hay ${result.remaining} cambio(s) pendientes de sincronizar.`).replace('{n}', String(result.remaining)));
    }
    return result;
  }

  function _onOffline() {
    _setBanner(true, _t('connectivity.offline', 'Sin conexión. Tus cambios se guardan en este dispositivo.'));
    if (typeof ErrorReporter !== 'undefined') ErrorReporter.capture('offline');
  }

  function _onOnline() {
    void flushNow(false);
  }

  function init() {
    if (_bound || typeof document === 'undefined') return;
    _bound = true;

    // Estilos mínimos si ui-polish no los tiene aún
    if (!document.getElementById('offline-banner-style')) {
      const style = document.createElement('style');
      style.id = 'offline-banner-style';
      style.textContent = `
        .offline-banner{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + var(--shell-pad-bottom,0px));z-index:1250;display:flex;gap:12px;align-items:center;max-width:min(560px,92vw);padding:10px 14px;border-radius:12px;background:#1b273c;color:#f2f2f2;font-size:.85rem;box-shadow:0 10px 30px rgba(0,0,0,.28)}
        .offline-banner[hidden]{display:none!important}
        .offline-banner__retry{border:1px solid rgba(255,255,255,.28);background:transparent;color:inherit;border-radius:999px;padding:6px 12px;cursor:pointer;font-weight:600}
        .offline-banner__retry:hover{background:rgba(255,255,255,.08)}
      `;
      document.head.appendChild(style);
    }

    window.addEventListener('offline', _onOffline);
    window.addEventListener('online', _onOnline);

    if (!isOnline()) _onOffline();
    else {
      // Flush suave tras idle
      const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb) => setTimeout(cb, 600);
      idle(() => { void flushNow(false); });
    }

    if (typeof SyncOutboxService !== 'undefined') {
      window.addEventListener(SyncOutboxService.EVENT, () => {
        if (SyncOutboxService.size() > 0 && isOnline()) void flushNow(false);
      });
    }
  }

  return { init, isOnline, flushNow };
})();

if (typeof module !== 'undefined') module.exports = ConnectivityService;


;/* --- src/js/services/CloudBlobSync.js --- */
/**
 * IN4MIND — Sync de blobs de usuario (notas, proyectos, intentos de quiz).
 * Local-first + upsert a Supabase; si falla, encola en SyncOutboxService.
 */
'use strict';

const CloudBlobSync = (() => {
  const TABLES = {
    notes: 'user_notes',
    projects: 'user_projects',
    quizAttempts: 'quiz_attempts',
    guided: 'guided_progress',
  };

  function _sb() {
    return typeof _sbClient !== 'undefined' ? _sbClient : null;
  }

  async function _userId() {
    if (typeof UserProfileService !== 'undefined' && UserProfileService.getCurrentUserId) {
      return UserProfileService.getCurrentUserId();
    }
    const sb = _sb();
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getUser();
      return data?.user?.id || null;
    } catch {
      return null;
    }
  }

  async function pushBlob(kind, blob) {
    const table = TABLES[kind];
    if (!table) return { ok: false, reason: 'unknown_kind' };

    const userId = await _userId();
    if (!userId) return { ok: false, reason: 'no_user' };

    const payload = {
      user_id: userId,
      blob: blob || {},
      updated_at: new Date().toISOString(),
    };

    const sb = _sb();
    if (!sb || (typeof ConnectivityService !== 'undefined' && !ConnectivityService.isOnline())) {
      if (typeof SyncOutboxService !== 'undefined') {
        SyncOutboxService.enqueue({
          table,
          action: 'replace_blob',
          payload,
          conflict: 'user_id',
          conflictKey: `${table}:${userId}`,
        });
      }
      return { ok: false, queued: true, reason: 'offline_or_no_sb' };
    }

    try {
      const { error } = await sb.from(table).upsert(payload, { onConflict: 'user_id' });
      if (error) throw error;
      return { ok: true };
    } catch (err) {
      if (typeof SyncOutboxService !== 'undefined') {
        SyncOutboxService.enqueue({
          table,
          action: 'replace_blob',
          payload,
          conflict: 'user_id',
          conflictKey: `${table}:${userId}`,
        });
      }
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('cloud_blob_push_fail', { kind, message: err?.message || String(err) });
      }
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(
          typeof I18n !== 'undefined'
            ? (I18n.t('connectivity.saveLocal') !== 'connectivity.saveLocal'
              ? I18n.t('connectivity.saveLocal')
              : 'Guardado en este dispositivo. Se sincronizará al recuperar la conexión.')
            : 'Guardado en este dispositivo. Se sincronizará al recuperar la conexión.',
          2800
        );
      }
      return { ok: false, queued: true, reason: err?.message || 'upsert_failed' };
    }
  }

  async function pullBlob(kind) {
    const table = TABLES[kind];
    if (!table) return null;
    const userId = await _userId();
    const sb = _sb();
    if (!userId || !sb) return null;
    try {
      const { data, error } = await sb.from(table).select('blob, updated_at').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('cloud_blob_pull_fail', { kind, message: err?.message || String(err) });
      }
      return null;
    }
  }

  /**
   * Fusiona blob remoto con local por updatedAt (última escritura gana por id).
   * @param {Record<string, object>} localMap
   * @param {Record<string, object>} remoteMap
   */
  function mergeMaps(localMap, remoteMap) {
    const out = { ...(remoteMap || {}) };
    Object.entries(localMap || {}).forEach(([id, local]) => {
      const remote = out[id];
      if (!remote || (local.updatedAt || 0) >= (remote.updatedAt || 0)) {
        out[id] = local;
      }
    });
    return out;
  }

  return { pushBlob, pullBlob, mergeMaps, TABLES };
})();

if (typeof module !== 'undefined') module.exports = CloudBlobSync;


;/* --- src/js/services/AuthSessionSync.js --- */
/**
 * IN4MIND — Sync de sesión entre pestañas + aviso de expiración.
 */
'use strict';

const AuthSessionSync = (() => {
  const CHANNEL = 'in4mind_auth';
  const STORAGE_KEY = 'in4mind_auth_broadcast';
  let _bc = null;
  let _bound = false;

  function _t(k, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _post(type, payload = {}) {
    const msg = { type, payload, at: Date.now() };
    try {
      if (_bc) _bc.postMessage(msg);
    } catch { /* ignore */ }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msg));
      // limpia para permitir el mismo evento otra vez
      setTimeout(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
      }, 50);
    } catch { /* ignore */ }
  }

  function broadcastLogout() {
    _post('logout');
  }

  function broadcastLogin(user) {
    _post('login', { email: user?.email || null });
  }

  function _handle(msg) {
    if (!msg || !msg.type) return;
    if (msg.type === 'logout') {
      if (typeof SessionStore !== 'undefined') SessionStore.clear({ keepEmail: true });
      else sessionStorage.removeItem('in4mind_user');
      if (typeof AppShell !== 'undefined') AppShell.showToast(_t('auth.sessionEnded', 'Sesión cerrada en otra pestaña.'), 2800);
      setTimeout(() => {
        if (!/login\.html$/i.test(location.pathname)) {
          window.location.replace('login.html');
        }
      }, 400);
    }
    if (msg.type === 'login') {
      // Otra pestaña inició sesión: refrescar avatar / perfil si aplica
      window.dispatchEvent(new CustomEvent('in4mind-profile-updated'));
    }
  }

  async function checkSessionHealth() {
    const sb = typeof _sbClient !== 'undefined' ? _sbClient : null;
    if (!sb) return { ok: true, reason: 'local' };
    try {
      const { data, error } = await sb.auth.getSession();
      if (error) throw error;
      const session = data?.session;
      if (!session) {
        const local = sessionStorage.getItem('in4mind_user');
        if (local) {
          // Sesión local huérfana: limpiar y pedir login
          if (typeof SessionStore !== 'undefined') SessionStore.clear({ keepEmail: true });
          else sessionStorage.removeItem('in4mind_user');
          if (typeof AppShell !== 'undefined') {
            AppShell.showToast(_t('auth.sessionExpired', 'Tu sesión expiró. Vuelve a iniciar sesión.'), 3600);
          }
          if (document.documentElement.hasAttribute('data-requires-auth')) {
            setTimeout(() => { window.location.replace('login.html'); }, 600);
          }
          return { ok: false, reason: 'expired' };
        }
        return { ok: false, reason: 'none' };
      }
      // Renovar proactivamente si queda poco
      const expiresAt = (session.expires_at || 0) * 1000;
      if (expiresAt && expiresAt - Date.now() < 5 * 60 * 1000) {
        try { await sb.auth.refreshSession(); } catch { /* ignore */ }
      }
      return { ok: true, reason: 'ok' };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('session_health', { message: err?.message || String(err) });
      }
      return { ok: false, reason: 'error' };
    }
  }

  function init() {
    if (_bound) return;
    _bound = true;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        _bc = new BroadcastChannel(CHANNEL);
        _bc.onmessage = (ev) => _handle(ev.data);
      }
    } catch { _bc = null; }

    window.addEventListener('storage', (ev) => {
      if (ev.key !== STORAGE_KEY || !ev.newValue) return;
      try { _handle(JSON.parse(ev.newValue)); } catch { /* */ }
    });

    // Chequeo al volver a la pestaña
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void checkSessionHealth();
    });

    const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb) => setTimeout(cb, 800);
    idle(() => { void checkSessionHealth(); });
  }

  return { init, broadcastLogout, broadcastLogin, checkSessionHealth };
})();

if (typeof module !== 'undefined') module.exports = AuthSessionSync;


;/* --- src/js/services/LazyScriptLoader.js --- */
/**
 * IN4MIND — Carga diferida de scripts no críticos.
 */
'use strict';

const LazyScriptLoader = (() => {
  const _loaded = new Set();

  function load(src) {
    if (!src || _loaded.has(src)) return Promise.resolve(true);
    if (document.querySelector(`script[src="${src}"]`)) {
      _loaded.add(src);
      return Promise.resolve(true);
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => { _loaded.add(src); resolve(true); };
      s.onerror = () => {
        if (typeof ErrorReporter !== 'undefined') ErrorReporter.capture('lazy_script_fail', { src });
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(s);
    });
  }

  function loadMany(srcs) {
    return Promise.all(srcs.map(src => load(src).catch(() => false)));
  }

  /** Scripts opcionales del dashboard/settings. */
  function loadPrivacyTools() {
    return loadMany([
      'src/js/services/DataExportService.js?v=20260812func',
      'src/js/services/CertVerificationService.js?v=20260812func',
    ]);
  }

  function loadPushOptional() {
    return load('src/js/services/PushNotificationService.js?v=20260812func');
  }

  return { load, loadMany, loadPrivacyTools, loadPushOptional };
})();

if (typeof module !== 'undefined') module.exports = LazyScriptLoader;


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
 */
const AuthGuard = (() => {

  const NEXT_KEY = 'in4mind_next';

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
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function _redirectToLogin() {
    const target = window.location.href;
    try {
      if (_isSafe(target)) sessionStorage.setItem(NEXT_KEY, target);
    } catch { /* ignore */ }

    const login = new URL('login.html', window.location.href);
    login.searchParams.set('next', new URL(target).pathname + new URL(target).search);
    window.location.replace(login.toString());
  }

  /**
   * Exige sesión para ver la página actual.
   * @returns {boolean} true si puede continuar (síncrono; si hay que esperar
   *   a Supabase, `requireAsync` se usa en el boot).
   */
  function require() {
    if (_hasSession()) return true;
    _redirectToLogin();
    return false;
  }

  /**
   * Igual que require(), pero intenta rehidratar desde Supabase Auth
   * (p. ej. pestaña nueva con JWT vigente).
   */
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

  /**
   * Destino pendiente tras iniciar sesión, si lo hay. Lo consume.
   * @returns {string|null}
   */
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

  /** Guarda un destino explícito (p. ej. antes de mandar a login desde un enlace). */
  function setRedirect(target) {
    try {
      if (_isSafe(target)) sessionStorage.setItem(NEXT_KEY, new URL(target, window.location.href).toString());
    } catch { /* ignore */ }
  }

  return { require, requireAsync, consumeRedirect, setRedirect, hasSession: _hasSession, NEXT_KEY };

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


;/* --- src/js/services/UserProfileService.js --- */
/**
 * IN4MIND — Perfil de usuario con Supabase
 * Favoritos, guardados, visitas, quizzes, lecciones y certificaciones
 * se guardan en la nube en vez de localStorage.
 */

'use strict';

const UserProfileService = (() => {

  // ── Supabase client (usa _sbClient de supabase.config.js si está cargado) ──
  const _sb = typeof _sbClient !== 'undefined'
    ? _sbClient
    : supabase.createClient(
        typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '',
        typeof SUPABASE_ANON_KEY !== 'undefined' ? SUPABASE_ANON_KEY : ''
      );

  // ── Constantes (igual que antes) ─────────────────────────────
  const EVENT               = 'in4mind-profile-updated';
  const MAX_VISITS          = 24;
  const CERT_MIN_PCT        = 70;
  const EXAM_CERT_MIN_PCT   = 80;
  const LESSON_EXAM_UNLOCK_AVG = 80;
  const QUIZ_UNLOCK_EXAM_PCT   = 70;

  // ── Cache local para evitar llamadas repetidas ───────────────
  let _cache = {
    favorites:      null,
    saved:          null,
    visits:         null,
    quizProgress:   null,
    lessonProgress: null,
    certifications: null,
  };

  let _userIdResolved = undefined;
  let _userIdPromise  = null;
  let _prefetchPromise = null;
  let _certSyncPromise = null;

  function _invalidateUserIdCache() {
    _userIdResolved = undefined;
    _userIdPromise = null;
  }

  function _clearCache() {
    Object.keys(_cache).forEach(k => { _cache[k] = null; });
    _prefetchPromise = null;
  }

  function _notify() {
    const user = getCurrentUser();
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { email: user?.email } }));
  }

  // ── Usuario actual ───────────────────────────────────────────
  function getCurrentUser() {
    try {
      // sessionStorage primero (compatibilidad con AuthController existente);
      // localStorage después, porque con «recordar datos» esa es la copia que
      // existe hasta que SessionStore.restore() repuebla la sesión, y las
      // claves locales de progreso se calculan a partir del correo.
      const stored = sessionStorage.getItem('in4mind_user')
        || localStorage.getItem('in4mind_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async function getCurrentUserId() {
    if (_userIdResolved !== undefined) return _userIdResolved;
    if (_userIdPromise) return _userIdPromise;

    _userIdPromise = (async () => {
      const { data } = await _sb.auth.getUser();
      if (data?.user) {
        _userIdResolved = data.user.id;
        return _userIdResolved;
      }

      const local = getCurrentUser();
      if (!local?.email) {
        _userIdResolved = null;
        return null;
      }

      const { data: profile } = await _sb
        .from('profiles')
        .select('id')
        .eq('email', local.email.toLowerCase())
        .single();

      _userIdResolved = profile?.id || null;
      return _userIdResolved;
    })();

    try {
      return await _userIdPromise;
    } finally {
      _userIdPromise = null;
    }
  }

  /** Vista instantánea desde localStorage (sin red). */
  function hydrateCacheFromLocal() {
    const favKey = _profileStorageKey('favorites');
    const savedKey = _profileStorageKey('saved');
    if (favKey && _cache.favorites === null) {
      _cache.favorites = _readLocalList(favKey).map(_normalizeItem);
    }
    if (savedKey && _cache.saved === null) {
      _cache.saved = _readLocalList(savedKey).map(_normalizeItem);
    }
  }

  /** Estadísticas síncronas si el caché ya está poblado. */
  function getStatsSync() {
    hydrateCacheFromLocal();
    const saved = _cache.saved || [];
    const favorites = _cache.favorites || [];
    const quizzes = _cache.quizProgress || {};
    const certifications = _cache.certifications || [];
    return {
      saved:          saved.length,
      favorites:      favorites.length,
      quizzes:        Object.keys(quizzes).length,
      certifications: certifications.length,
    };
  }

  /** Precarga paralela de favoritos, guardados, quizzes y certificaciones. */
  function prefetchProfileData() {
    if (_prefetchPromise) return _prefetchPromise;
    hydrateCacheFromLocal();
    _prefetchPromise = Promise.all([
      getSaved(),
      getFavorites(),
      getQuizProgress(),
      getCertifications(),
    ]).finally(() => { _prefetchPromise = null; });
    return _prefetchPromise;
  }

  // ── Helpers de item ──────────────────────────────────────────
  function buildCourseItem(course) {
    return {
      id:        `course-${course.id}`,
      type:      'course',
      refId:     course.id,
      title:     course.title,
      desc:      course.desc,
      icon:      course.icon,
      color:     course.color || '',
      visitedAt: Date.now(),
    };
  }

  function buildQuizItem(quiz) {
    return {
      id:        `quiz-${quiz.id}`,
      type:      'quiz',
      refId:     quiz.id,
      title:     quiz.title,
      desc:      quiz.desc || 'Quiz completado',
      icon:      quiz.icon || '',
      visitedAt: Date.now(),
    };
  }

  // ════════════════════════════════════════════════════════════
  // FAVORITOS
  // ════════════════════════════════════════════════════════════

  /**
   * Clave local por usuario. Sin sesión se cae a `guest` en vez de devolver
   * null: así el avance de quien aún no ha entrado no se pierde, y al iniciar
   * sesión sigue existiendo un espejo del que tirar.
   */
  function _profileStorageKey(suffix) {
    const email = getCurrentUser()?.email?.toLowerCase();
    return `in4mind_${suffix}_${email || 'guest'}`;
  }

  function _readLocalList(key) {
    if (!key) return [];
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _writeLocalList(key, list) {
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list));
  }

  function _normalizeItem(item) {
    return {
      id:        item.id || `${item.type}-${item.refId}`,
      type:      item.type,
      refId:     item.refId,
      title:     item.title || '',
      desc:      item.desc  || '',
      icon:      item.icon  || '',
      color:     item.color || '',
      savedAt:   item.savedAt   || Date.now(),
      visitedAt: item.visitedAt || Date.now(),
    };
  }

  async function getFavorites() {
    if (_cache.favorites) return _cache.favorites;
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await _sb
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (!error) {
        _cache.favorites = (data || []).map(_rowToItem);
        return _cache.favorites;
      }
      console.error('getFavorites:', error);
    }

    const key = _profileStorageKey('favorites');
    _cache.favorites = _readLocalList(key).map(_normalizeItem);
    return _cache.favorites;
  }

  async function isFavorite(refId, type = 'course') {
    const favs = await getFavorites();
    return favs.some(f => f.refId === refId && f.type === type);
  }

  async function toggleFavorite(item) {
    const userId = await getCurrentUserId();
    const normalized = _normalizeItem(item);
    const already = await isFavorite(normalized.refId, normalized.type);

    if (userId) {
      if (already) {
        await _sb.from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('ref_id',  normalized.refId)
          .eq('type',    normalized.type);
      } else {
        await _sb.from('favorites').insert({
          user_id:     userId,
          ref_id:      normalized.refId,
          type:        normalized.type,
          title:       normalized.title || '',
          description: normalized.desc  || '',
          icon_url:    normalized.icon  || '',
          color_var:   normalized.color || '',
          saved_at:    new Date().toISOString(),
        });
      }
      _cache.favorites = null;
      _notify();
      return !already;
    }

    const key = _profileStorageKey('favorites');
    if (!key) return false;

    let favs = _readLocalList(key).map(_normalizeItem);
    if (already) {
      favs = favs.filter(f => !(f.refId === normalized.refId && f.type === normalized.type));
      _writeLocalList(key, favs);
      _cache.favorites = favs;
      _notify();
      return false;
    }

    favs.unshift(normalized);
    _writeLocalList(key, favs);
    _cache.favorites = favs;
    _notify();
    return true;
  }

  async function removeFavorite(id) {
    const userId = await getCurrentUserId();
    const refId = id.replace(/^(course|quiz)-/, '');

    if (userId) {
      await _sb.from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('ref_id', refId);
    }

    const key = _profileStorageKey('favorites');
    if (key) {
      const favs = _readLocalList(key)
        .map(_normalizeItem)
        .filter(f => f.id !== id && f.refId !== refId);
      _writeLocalList(key, favs);
      _cache.favorites = favs;
    } else {
      _cache.favorites = null;
    }
    _notify();
  }

  // ════════════════════════════════════════════════════════════
  // GUARDADOS
  // ════════════════════════════════════════════════════════════

  async function getSaved() {
    if (_cache.saved) return _cache.saved;
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await _sb
        .from('saved_items')
        .select('*')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (!error) {
        _cache.saved = (data || []).map(_rowToItem);
        return _cache.saved;
      }
      console.error('getSaved:', error);
    }

    const key = _profileStorageKey('saved');
    _cache.saved = _readLocalList(key).map(_normalizeItem);
    return _cache.saved;
  }

  async function isSaved(refId, type = 'course') {
    const saved = await getSaved();
    return saved.some(s => s.refId === refId && s.type === type);
  }

  async function toggleSaved(item) {
    const userId = await getCurrentUserId();
    const normalized = _normalizeItem(item);
    const already = await isSaved(normalized.refId, normalized.type);

    if (userId) {
      if (already) {
        await _sb.from('saved_items')
          .delete()
          .eq('user_id', userId)
          .eq('ref_id',  normalized.refId)
          .eq('type',    normalized.type);
      } else {
        await _sb.from('saved_items').insert({
          user_id:     userId,
          ref_id:      normalized.refId,
          type:        normalized.type,
          title:       normalized.title || '',
          description: normalized.desc  || '',
          icon_url:    normalized.icon  || '',
          color_var:   normalized.color || '',
          saved_at:    new Date().toISOString(),
        });
      }
      _cache.saved = null;
      _notify();
      return !already;
    }

    const key = _profileStorageKey('saved');
    if (!key) return false;

    let saved = _readLocalList(key).map(_normalizeItem);
    if (already) {
      saved = saved.filter(s => !(s.refId === normalized.refId && s.type === normalized.type));
      _writeLocalList(key, saved);
      _cache.saved = saved;
      _notify();
      return false;
    }

    saved.unshift(normalized);
    _writeLocalList(key, saved);
    _cache.saved = saved;
    _notify();
    return true;
  }

  async function removeSaved(id) {
    const userId = await getCurrentUserId();
    const refId = id.replace(/^(course|quiz)-/, '');

    if (userId) {
      await _sb.from('saved_items')
        .delete()
        .eq('user_id', userId)
        .eq('ref_id', refId);
    }

    const key = _profileStorageKey('saved');
    if (key) {
      const saved = _readLocalList(key)
        .map(_normalizeItem)
        .filter(s => s.id !== id && s.refId !== refId);
      _writeLocalList(key, saved);
      _cache.saved = saved;
    } else {
      _cache.saved = null;
    }
    _notify();
  }

  // ════════════════════════════════════════════════════════════
  // HISTORIAL DE VISITAS
  // ════════════════════════════════════════════════════════════

  function _localVisits() {
    return _readLocalList(_profileStorageKey('visits')).map(_normalizeItem);
  }

  /** Deja constancia de la visita en el dispositivo antes de intentar la nube. */
  function _recordLocalVisit(item) {
    const key = _profileStorageKey('visits');
    const entry = _normalizeItem({ ...item, visitedAt: Date.now() });
    const rest = _localVisits()
      .filter(v => !(v.refId === entry.refId && v.type === entry.type));
    _writeLocalList(key, [entry, ...rest].slice(0, MAX_VISITS));
  }

  /** Une nube y dispositivo quedándose con la visita más reciente de cada ref. */
  function _mergeVisits(...lists) {
    const byRef = new Map();
    lists.flat().forEach(visit => {
      const refKey = `${visit.type}:${visit.refId}`;
      const current = byRef.get(refKey);
      if (!current || (visit.visitedAt || 0) > (current.visitedAt || 0)) byRef.set(refKey, visit);
    });
    return [...byRef.values()]
      .sort((a, b) => (b.visitedAt || 0) - (a.visitedAt || 0))
      .slice(0, MAX_VISITS);
  }

  async function recordVisit(item) {
    _recordLocalVisit(item);
    _cache.visits = null;

    const userId = await getCurrentUserId();
    if (!userId) { _notify(); return; }

    // UPSERT: si ya existe la visita, actualiza visited_at
    await _sb.from('visit_history').upsert({
      user_id:     userId,
      ref_id:      item.refId,
      type:        item.type,
      title:       item.title || '',
      description: item.desc  || '',
      icon_url:    item.icon  || '',
      color_var:   item.color || '',
      visited_at:  new Date().toISOString(),
    }, { onConflict: 'user_id,ref_id,type' });

    _cache.visits = null;
    _notify();
  }

  async function getRecentVisits(limit = 9) {
    if (_cache.visits) return _cache.visits.slice(0, limit);

    const local = _localVisits();
    const userId = await getCurrentUserId();
    let cloud = [];

    if (userId) {
      const { data, error } = await _sb
        .from('visit_history')
        .select('*')
        .eq('user_id', userId)
        .order('visited_at', { ascending: false })
        .limit(MAX_VISITS);

      if (error) console.error('getRecentVisits:', error);
      else {
        cloud = (data || []).map(row => ({
          ..._rowToItem(row),
          visitedAt: new Date(row.visited_at).getTime(),
        }));
      }
    }

    // Sin sesión en la nube, o con ella caída, el historial local es el único
    // que queda: devolverlo vacío borraba de la vista cursos ya empezados.
    _cache.visits = _mergeVisits(cloud, local);
    return _cache.visits.slice(0, limit);
  }

  // ════════════════════════════════════════════════════════════
  // PROGRESO DE QUIZZES
  // ════════════════════════════════════════════════════════════

  function _localQuizProgress() {
    try {
      return JSON.parse(localStorage.getItem(_profileStorageKey('quiz_results')) || '{}') || {};
    } catch {
      return {};
    }
  }

  function _mergeLocalQuiz(quizId, entry) {
    const all = _localQuizProgress();
    all[quizId] = { ...(all[quizId] || {}), ...entry };
    try {
      localStorage.setItem(_profileStorageKey('quiz_results'), JSON.stringify(all));
    } catch { /* ignore */ }
    return all[quizId];
  }

  async function saveQuizProgress(quizId, correct, total, meta = {}) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const title = meta.title || quizId;

    // El resultado se ancla en el dispositivo antes de tocar la red. Si la
    // sesión de Supabase no resuelve, el intento seguía existiendo para el
    // usuario pero no dejaba rastro en ninguna parte de la app.
    const localPrev = _localQuizProgress()[quizId];
    const localBest = Math.max(localPrev?.bestPct || 0, pct);
    const localAttempts = (localPrev?.attempts || 0) + 1;
    _mergeLocalQuiz(quizId, {
      correct,
      total,
      pct,
      bestPct:     localBest,
      attempts:    localAttempts,
      title,
      icon:        meta.icon || localPrev?.icon || '',
      completedAt: Date.now(),
    });
    _cache.quizProgress = null;

    const userId = await getCurrentUserId();
    if (!userId) {
      _notify();
      return { correct, total, pct, bestPct: localBest, attempts: localAttempts, title, icon: meta.icon || '' };
    }

    // Obtener mejor pct anterior
    const { data: prev } = await _sb
      .from('quiz_progress')
      .select('best_pct, attempts')
      .eq('user_id', userId)
      .eq('quiz_id', quizId)
      .single();

    const bestPct  = Math.max(prev?.best_pct || 0, pct, localBest);
    const attempts = Math.max((prev?.attempts || 0) + 1, localAttempts);

    const row = {
      user_id:      userId,
      quiz_id:      quizId,
      title,
      icon_url:     meta.icon  || '',
      correct,
      total,
      pct,
      best_pct:     bestPct,
      attempts,
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    };

    await _sb.from('quiz_progress')
      .upsert(row, { onConflict: 'user_id,quiz_id' })
      .then(({ error }) => {
        if (error) throw error;
      })
      .catch((err) => {
        if (typeof SyncOutboxService !== 'undefined') {
          SyncOutboxService.enqueue({
            table: 'quiz_progress',
            action: 'upsert',
            payload: row,
            conflict: 'user_id,quiz_id',
            conflictKey: `quiz_progress:${userId}:${quizId}`,
          });
        }
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('quiz_progress_upsert_fail', { message: err?.message || String(err) });
        }
        if (typeof AppShell !== 'undefined') {
          AppShell.showToast('Progreso guardado en este dispositivo. Se sincronizará al recuperar la conexión.', 2800);
        }
      });

    _mergeLocalQuiz(quizId, { bestPct, attempts, completedAt: Date.now() });
    _cache.quizProgress = null;
    _notify();

    return { correct, total, pct, bestPct, attempts, title: row.title, icon: row.icon_url };
  }

  async function getQuizProgress() {
    if (_cache.quizProgress) return _cache.quizProgress;

    // El espejo local es la base; la nube solo pisa lo que tenga mejor marca.
    const map = { ..._localQuizProgress() };
    const userId = await getCurrentUserId();

    if (userId) {
      const { data, error } = await _sb
        .from('quiz_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) console.error('getQuizProgress:', error);
      else {
        (data || []).forEach(row => {
          const local = map[row.quiz_id];
          map[row.quiz_id] = {
            correct:     row.correct,
            total:       row.total,
            pct:         row.pct,
            bestPct:     Math.max(row.best_pct || 0, local?.bestPct || 0),
            attempts:    Math.max(row.attempts || 0, local?.attempts || 0),
            title:       row.title,
            icon:        row.icon_url,
            completedAt: new Date(row.completed_at).getTime(),
          };
        });
      }
    }

    _cache.quizProgress = map;
    return map;
  }

  async function getCompletedQuizCount() {
    const progress = await getQuizProgress();
    return Object.keys(progress).length;
  }

  async function getQuizScoreForCourse(courseId) {
    const progress = await getQuizProgress();
    const data = progress[courseId];
    return data?.bestPct ?? data?.pct ?? 0;
  }

  async function isQuizPassedForCert(courseId) {
    const score = await getQuizScoreForCourse(courseId);
    return score >= QUIZ_UNLOCK_EXAM_PCT;
  }

  // ════════════════════════════════════════════════════════════
  // PROGRESO DE LECCIONES
  // ════════════════════════════════════════════════════════════

  /** Por usuario: dos cuentas en el mismo equipo no comparten lecciones. */
  function _lessonLocalKey() {
    return _profileStorageKey('lesson_local');
  }

  function _getLessonLocal() {
    try {
      return JSON.parse(localStorage.getItem(_lessonLocalKey()) || '{}') || {};
    } catch {
      return {};
    }
  }

  function _mergeLessonLocal(courseId, map) {
    const all = _getLessonLocal();
    all[courseId] = { ...(all[courseId] || {}), ...map };
    try {
      localStorage.setItem(_lessonLocalKey(), JSON.stringify(all));
    } catch { /* ignore */ }
  }

  /** Lectura síncrona del progreso de lecciones (caché local optimista). */
  function getLessonProgressSync(courseId) {
    return _getLessonLocal()[courseId] || {};
  }

  /**
   * Cursos con lecciones registradas en este dispositivo y su actividad más
   * reciente. Permite listar cursos a medias sin saber de antemano cuáles son,
   * que es lo que hace falta cuando la nube todavía no tiene las visitas.
   * @returns {Object<string, number>} courseId → timestamp
   */
  function getLessonProgressCourseIds() {
    const out = {};
    Object.entries(_getLessonLocal()).forEach(([courseId, lessons]) => {
      const stamps = Object.values(lessons || {}).map(lesson => lesson.completedAt || 0);
      out[courseId] = stamps.length ? Math.max(...stamps) : 0;
    });
    return out;
  }

  async function saveLessonProgress(courseId, lessonId, pct, meta = {}) {
    const score = Math.max(0, Math.min(100, Math.round(pct)));
    const title = meta.title || lessonId;

    // Primero el espejo local. Antes esta función salía aquí mismo cuando no
    // había usuario de Supabase, así que una lección terminada sin sesión en
    // la nube no quedaba registrada en ningún sitio y el panel de «continúa
    // donde lo dejaste» se veía vacío pese a haber avance real.
    const localPrev = getLessonProgressSync(courseId)[lessonId];
    const localBest = Math.max(localPrev?.pct || 0, score);
    const localAttempts = (localPrev?.attempts || 0) + 1;
    _mergeLessonLocal(courseId, {
      [lessonId]: { pct: localBest, title, attempts: localAttempts, completedAt: Date.now() },
    });
    _cache.lessonProgress = null;

    const userId = await getCurrentUserId();
    if (!userId) {
      _notify();
      return { pct: localBest, attempts: localAttempts, title };
    }

    // Obtener pct anterior para no bajar el mejor resultado
    const { data: prev } = await _sb
      .from('lesson_progress')
      .select('pct, attempts')
      .eq('user_id',  userId)
      .eq('course_id', courseId)
      .eq('lesson_id', lessonId)
      .single();

    const bestPct  = Math.max(prev?.pct || 0, score, localBest);
    const attempts = Math.max((prev?.attempts || 0) + 1, localAttempts);

    const lessonRow = {
      user_id:      userId,
      course_id:    courseId,
      lesson_id:    lessonId,
      title,
      pct:          bestPct,
      attempts,
      completed_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    };

    try {
      const { error } = await _sb.from('lesson_progress').upsert(lessonRow, {
        onConflict: 'user_id,course_id,lesson_id',
      });
      if (error) throw error;
    } catch (err) {
      if (typeof SyncOutboxService !== 'undefined') {
        SyncOutboxService.enqueue({
          table: 'lesson_progress',
          action: 'upsert',
          payload: lessonRow,
          conflict: 'user_id,course_id,lesson_id',
          conflictKey: `lesson_progress:${userId}:${courseId}:${lessonId}`,
        });
      }
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('lesson_progress_upsert_fail', { message: err?.message || String(err) });
      }
    }

    _cache.lessonProgress = null;
    _mergeLessonLocal(courseId, {
      [lessonId]: { pct: bestPct, title, attempts, completedAt: Date.now() },
    });
    _notify();

    return { pct: bestPct, attempts, title };
  }

  async function getLessonProgress(courseId) {
    const local = getLessonProgressSync(courseId);
    const userId = await getCurrentUserId();
    if (!userId) return local;

    const { data, error } = await _sb
      .from('lesson_progress')
      .select('*')
      .eq('user_id',  userId)
      .eq('course_id', courseId);

    if (error) { console.error('getLessonProgress:', error); return local; }

    const map = {};
    (data || []).forEach(row => {
      map[row.lesson_id] = {
        pct:         row.pct,
        title:       row.title,
        attempts:    row.attempts,
        completedAt: new Date(row.completed_at).getTime(),
      };
    });

    _mergeLessonLocal(courseId, map);
    // La nube manda donde hay fila, pero lo que solo existe aquí no se tira.
    return { ...local, ...map };
  }

  async function getCourseLessonStats(courseId, totalLessons = 0) {
    const lessons  = await getLessonProgress(courseId);
    const entries  = Object.values(lessons);
    const completed = entries.length;
    const avg = completed
      ? Math.round(entries.reduce((sum, l) => sum + (l.pct || 0), 0) / completed)
      : 0;
    const allComplete = totalLessons > 0 && completed >= totalLessons;
    const unlocked    = allComplete && avg >= LESSON_EXAM_UNLOCK_AVG;

    return { completed, total: totalLessons, avg, allComplete, unlocked };
  }

  // ════════════════════════════════════════════════════════════
  // CERTIFICACIONES
  // ════════════════════════════════════════════════════════════

  async function getCertifications() {
    if (_cache.certifications) return _cache.certifications;
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const { data, error } = await _sb
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });

    if (error) { console.error('getCertifications:', error); return []; }

    _cache.certifications = (data || []).map(row => ({
      id:            row.id,
      refId:         row.ref_id,
      type:          row.type,
      title:         row.title,
      desc:          row.description,
      icon:          row.icon_url,
      pct:           row.pct,
      modules:       row.modules       || [],
      levelsCovered: row.levels_covered || [],
      lessonCount:   row.lesson_count  || 0,
      earnedAt:      new Date(row.earned_at).getTime(),
    }));

    return _cache.certifications;
  }

  async function tryAwardCertification(quizId, meta = {}) {
    const pct = meta.pct ?? 0;
    if (pct < CERT_MIN_PCT) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const cert = {
      user_id:     userId,
      ref_id:      quizId,
      type:        'quiz',
      title:       meta.title || `Certificado: ${quizId}`,
      description: meta.desc  || `Aprobado con ${pct}% de aciertos`,
      icon_url:    meta.icon  || '',
      pct,
      earned_at:   new Date().toISOString(),
    };

    // Solo actualiza si el nuevo pct es mayor
    const { data: existing } = await _sb
      .from('certifications')
      .select('pct')
      .eq('user_id', userId)
      .eq('ref_id',  quizId)
      .eq('type',    'quiz')
      .single();

    if (existing && pct <= existing.pct) return null;

    await _sb.from('certifications')
      .upsert(cert, { onConflict: 'user_id,ref_id,type' });

    _cache.certifications = null;
    _notify();
    return cert;
  }

  async function tryAwardExamCertification(courseId, meta = {}) {
    const pct = meta.pct ?? 0;
    if (pct < EXAM_CERT_MIN_PCT) return null;

    const userId = await getCurrentUserId();
    if (!userId) return null;

    const cert = {
      user_id:        userId,
      ref_id:         courseId,
      type:           'exam',
      title:          meta.title || `Certificación profesional: ${courseId}`,
      description:    meta.desc  || `Examen práctico aprobado con ${pct}%`,
      icon_url:       meta.icon  || '',
      pct,
      modules:        meta.modules       || [],
      levels_covered: meta.levelsCovered || [],
      lesson_count:   meta.lessonCount   || 0,
      earned_at:      new Date().toISOString(),
    };

    const { data: existing } = await _sb
      .from('certifications')
      .select('pct')
      .eq('user_id', userId)
      .eq('ref_id',  courseId)
      .eq('type',    'exam')
      .single();

    if (existing && pct <= existing.pct) return null;

    await _sb.from('certifications')
      .upsert(cert, { onConflict: 'user_id,ref_id,type' });

    _cache.certifications = null;
    _notify();
    return cert;
  }

  async function hasExamCertification(courseId) {
    const certs = await getCertifications();
    return certs.some(c => c.refId === courseId && c.type === 'exam');
  }

  async function syncCertificationsFromQuizzes() {
    if (_certSyncPromise) return _certSyncPromise;
    _certSyncPromise = _syncCertificationsFromQuizzesImpl().finally(() => {
      _certSyncPromise = null;
    });
    return _certSyncPromise;
  }

  async function _syncCertificationsFromQuizzesImpl() {
    const progress = await getQuizProgress();
    const eligible = Object.entries(progress).filter(([, data]) => (data.pct || 0) >= CERT_MIN_PCT);
    if (!eligible.length) return;

    const userId = await getCurrentUserId();
    if (!userId) return;

    const { data: existing } = await _sb
      .from('certifications')
      .select('ref_id, pct')
      .eq('user_id', userId)
      .eq('type', 'quiz');

    const bestByRef = new Map((existing || []).map(row => [row.ref_id, row.pct || 0]));
    const pending = eligible.filter(([quizId, data]) => {
      const prev = bestByRef.get(quizId) ?? 0;
      return (data.pct || 0) > prev;
    });
    if (!pending.length) return;

    await Promise.all(pending.map(([quizId, data]) => tryAwardCertification(quizId, {
      title: `Certificado: ${data.title || quizId}`,
      icon:  data.icon,
      pct:   data.pct,
      desc:  `Aprobado con ${data.pct}% de aciertos`,
    })));
  }

  // ════════════════════════════════════════════════════════════
  // ESTADÍSTICAS
  // ════════════════════════════════════════════════════════════

  async function getStats() {
    const [saved, favorites, quizzes, certifications] = await Promise.all([
      getSaved(),
      getFavorites(),
      getQuizProgress(),
      getCertifications(),
    ]);
    return {
      saved:          saved.length,
      favorites:      favorites.length,
      quizzes:        Object.keys(quizzes).length,
      certifications: certifications.length,
    };
  }

  // ════════════════════════════════════════════════════════════
  // REQUISITOS DE CERTIFICACIÓN
  // ════════════════════════════════════════════════════════════

  async function getCertificationRequirements(courseId, totalLessons = 0) {
    if (!totalLessons && typeof TutorialData !== 'undefined') {
      totalLessons = TutorialData.getLessons(courseId).length;
    }
    const lessonStats  = await getCourseLessonStats(courseId, totalLessons);
    const quizPct      = await getQuizScoreForCourse(courseId);
    const quizPassed   = quizPct >= QUIZ_UNLOCK_EXAM_PCT;
    const examUnlocked = lessonStats.unlocked && quizPassed;

    return {
      lessonStats,
      quizPct,
      quizPassed,
      examUnlocked,
      lessonMinAvg: LESSON_EXAM_UNLOCK_AVG,
      quizMinPct:   QUIZ_UNLOCK_EXAM_PCT,
      examMinPct:   EXAM_CERT_MIN_PCT,
    };
  }

  async function isExamUnlocked(courseId, totalLessons = 0) {
    const req = await getCertificationRequirements(courseId, totalLessons);
    return req.examUnlocked;
  }

  function getExamId(courseId) {
    return `${courseId}-cert-exam`;
  }

  // ════════════════════════════════════════════════════════════
  // NOMBRE / PERFIL
  // ════════════════════════════════════════════════════════════

  async function updateDisplayName(name) {
    const trimmed = name?.trim();
    if (!trimmed) return false;

    const userId = await getCurrentUserId();
    if (!userId) return false;

    // Actualiza en Supabase
    const { error } = await _sb
      .from('profiles')
      .update({ name: trimmed, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) { console.error('updateDisplayName:', error); return false; }

    // Actualiza también en sessionStorage para compatibilidad
    try {
      const user = getCurrentUser();
      if (user) {
        user.name = trimmed;
        sessionStorage.setItem('in4mind_user', JSON.stringify(user));
      }
    } catch { /* ignore */ }

    _notify();
    return true;
  }

  // ════════════════════════════════════════════════════════════
  // COMPATIBILIDAD — funciones que el resto del código llama
  // pero que con Supabase ya no son necesarias
  // ════════════════════════════════════════════════════════════

  async function mergeGuestIntoUser() {
    // Con Supabase Auth la sesión de invitado se maneja automáticamente.
    // Se mantiene la función para no romper el AuthController.
  }

  async function migrateSessionQuizProgress() {
    // Ya no es necesario migrar desde sessionStorage.
    // Se mantiene para no romper QuizzesController.
  }

  // ════════════════════════════════════════════════════════════
  // UTILIDADES
  // ════════════════════════════════════════════════════════════

  /** Convierte una fila de la BD al formato que usa el resto de la app */
  function _rowToItem(row) {
    return {
      id:        `${row.type}-${row.ref_id}`,
      type:      row.type,
      refId:     row.ref_id,
      title:     row.title       || '',
      desc:      row.description || '',
      icon:      row.icon_url    || '',
      color:     row.color_var   || '',
      savedAt:   row.saved_at   ? new Date(row.saved_at).getTime()   : Date.now(),
      visitedAt: row.visited_at ? new Date(row.visited_at).getTime() : Date.now(),
    };
  }

  function _visitT(key, params) {
    if (typeof I18n !== 'undefined') return I18n.t(`visit.${key}`, params);
    const fallbacks = {
      recent: 'Reciente',
      moment: 'Visto hace un momento',
      mins: `Visitado hace ${params?.n ?? 0} min`,
      hours: `Visitado hace ${params?.n ?? 0} h`,
      days: `Visitado hace ${params?.n ?? 0} días`,
      yesterday: 'Ayer',
    };
    return fallbacks[key] ?? '';
  }

  function formatVisitDate(ts) {
    if (!ts) return _visitT('recent');
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return _visitT('moment');
    if (mins < 60) return _visitT('mins', { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return _visitT('hours', { n: hours });
    const days = Math.floor(hours / 24);
    if (days === 1) return _visitT('yesterday');
    if (days < 7)   return _visitT('days', { n: days });
    const d = new Date(ts);
    const months = typeof I18n !== 'undefined'
      ? (I18n.t('visit.months') || [])
      : ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const monthLabel = Array.isArray(months) ? months[d.getMonth()] : months;
    return `${monthLabel} ${d.getDate()}`;
  }

  // ════════════════════════════════════════════════════════════
  // API PÚBLICA — misma interfaz que antes para no romper nada
  // ════════════════════════════════════════════════════════════
  return {
    // Usuario
    getCurrentUser,
    getCurrentUserId,
    updateDisplayName,
    mergeGuestIntoUser,
    migrateSessionQuizProgress,

    // Builders
    buildCourseItem,
    buildQuizItem,

    // Favoritos
    isFavorite,
    toggleFavorite,
    removeFavorite,
    getFavorites,

    // Guardados
    isSaved,
    toggleSaved,
    removeSaved,
    getSaved,

    // Visitas
    recordVisit,
    getRecentVisits,
    formatVisitDate,

    // Quizzes
    saveQuizProgress,
    getQuizProgress,
    getCompletedQuizCount,
    getQuizScoreForCourse,
    isQuizPassedForCert,

    // Lecciones
    saveLessonProgress,
    getLessonProgress,
    getLessonProgressSync,
    getLessonProgressCourseIds,
    getCourseLessonStats,

    // Certificaciones
    getCertifications,
    tryAwardCertification,
    tryAwardExamCertification,
    hasExamCertification,
    syncCertificationsFromQuizzes,
    getExamId,

    // Requisitos
    getCertificationRequirements,
    isExamUnlocked,

    // Estadísticas
    getStats,
    getStatsSync,
    hydrateCacheFromLocal,
    prefetchProfileData,

    // Constantes (otros controllers las usan)
    CERT_MIN_PCT,
    EXAM_CERT_MIN_PCT,
    LESSON_EXAM_UNLOCK_AVG,
    QUIZ_UNLOCK_EXAM_PCT,
    EVENT,
  };

})();

if (typeof module !== 'undefined') module.exports = UserProfileService;


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


;/* --- src/js/services/GamificationService.js --- */
'use strict';

const GamificationService = (() => {

  const STORAGE_KEY = 'in4mind_gamification';
  const ACTIVITY_KEY = 'in4mind_activity_log';
  const GOALS_KEY = 'in4mind_weekly_goals';
  const DAY_MS = 86400000;

  const BADGES = [
    { id: 'first_lesson', type: 'lesson', count: 1, icon: '📘' },
    { id: 'first_quiz', type: 'quiz', count: 1, icon: '✅' },
    { id: 'streak_7', streak: 7, icon: '🔥' },
    { id: 'streak_30', streak: 30, icon: '💎' },
    { id: 'xp_100', xp: 100, icon: '⭐' },
    { id: 'xp_500', xp: 500, icon: '🏆' },
  ];

  const XP_MAP = { lesson: 15, quiz: 25, cert: 50, exam: 80 };

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _read() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _write(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  function _readActivity() {
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function _writeActivity(log) {
    const trimmed = log.slice(-90);
    try {
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(trimmed));
    } catch { /* ignore */ }
  }

  function _dayKey(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function _weekKey(ts = Date.now()) {
    const d = new Date(ts);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${week}`;
  }

  function recordActivity(type, meta = {}) {
    const log = _readActivity();
    log.push({ type, at: Date.now(), ...meta });
    _writeActivity(log);

    const data = _read();
    const today = _dayKey();
    const lastDay = data.lastActiveDay;
    let streak = data.streak || 0;

    if (lastDay === today) {
      /* same day */
    } else if (lastDay) {
      const yesterday = _dayKey(Date.now() - 86400000);
      streak = lastDay === yesterday ? streak + 1 : 1;
    } else {
      streak = 1;
    }

    data.lastActiveDay = today;
    data.streak = streak;
    data.totalActivities = (data.totalActivities || 0) + 1;
    data.xp = (data.xp || 0) + (XP_MAP[type] || 10);
    if (type === 'lesson') data.lessonsCompleted = (data.lessonsCompleted || 0) + 1;
    if (type === 'quiz') data.quizzesCompleted = (data.quizzesCompleted || 0) + 1;
    data.badges = _computeBadges(data);
    _write(data);
    window.dispatchEvent(new CustomEvent('in4mind-gamification-updated'));
  }

  function _getGoals() {
    try {
      const g = JSON.parse(localStorage.getItem(GOALS_KEY) || '{}');
      return {
        lessons: g.lessons || 2,
        quizzes: g.quizzes || 1,
      };
    } catch {
      return { lessons: 2, quizzes: 1 };
    }
  }

  function setWeeklyGoals(lessons, quizzes) {
    localStorage.setItem(GOALS_KEY, JSON.stringify({
      lessons: Math.max(1, lessons || 2),
      quizzes: Math.max(1, quizzes || 1),
    }));
    window.dispatchEvent(new CustomEvent('in4mind-gamification-updated'));
  }

  function _computeBadges(data) {
    const earned = new Set(data.badges || []);
    BADGES.forEach(b => {
      if (b.streak && (data.streak || 0) >= b.streak) earned.add(b.id);
      if (b.xp && (data.xp || 0) >= b.xp) earned.add(b.id);
      if (b.type === 'lesson' && (data.lessonsCompleted || 0) >= b.count) earned.add(b.id);
      if (b.type === 'quiz' && (data.quizzesCompleted || 0) >= b.count) earned.add(b.id);
    });
    return [...earned];
  }

  function getBadges() {
    const data = _read();
    const ids = _computeBadges(data);
    return ids.map(id => BADGES.find(b => b.id === id)).filter(Boolean);
  }

  function getXp() {
    return _read().xp || 0;
  }

  function getLevel() {
    const xp = getXp();
    return Math.floor(xp / 100) + 1;
  }

  function getStreak() {
    const data = _read();
    const today = _dayKey();
    const yesterday = _dayKey(Date.now() - 86400000);
    if (data.lastActiveDay === today || data.lastActiveDay === yesterday) {
      return data.streak || 0;
    }
    return 0;
  }

  function getWeeklyProgress() {
    const goals = _getGoals();
    const week = _weekKey();
    const log = _readActivity().filter(e => _weekKey(e.at) === week);
    const lessons = log.filter(e => e.type === 'lesson').length;
    const quizzes = log.filter(e => e.type === 'quiz').length;
    return {
      lessons,
      quizzes,
      lessonGoal: goals.lessons,
      quizGoal: goals.quizzes,
      lessonPct: Math.min(100, Math.round((lessons / goals.lessons) * 100)),
      quizPct: Math.min(100, Math.round((quizzes / goals.quizzes) * 100)),
    };
  }

  function getActivityByWeek(weeks = 6) {
    const log = _readActivity();
    const buckets = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const ts = Date.now() - i * 7 * 86400000;
      const key = _weekKey(ts);
      const count = log.filter(e => _weekKey(e.at) === key).length;
      buckets.push({ key, label: _t('analytics.weekShort', { n: weeks - i }, `S${weeks - i}`), count });
    }
    return buckets;
  }

  function getSummary() {
    const data = _read();
    const weekly = getWeeklyProgress();
    return {
      streak: getStreak(),
      weekly,
      totalActivities: data.totalActivities || 0,
      xp: data.xp || 0,
      level: getLevel(),
      badges: getBadges(),
    };
  }

  function isStreakAtRisk() {
    const data = _read();
    const today = _dayKey();
    const yesterday = _dayKey(Date.now() - DAY_MS);
    return (data.streak || 0) >= 1 && data.lastActiveDay === yesterday && data.lastActiveDay !== today;
  }

  function wasActiveToday() {
    return _read().lastActiveDay === _dayKey();
  }

  return {
    recordActivity,
    getStreak,
    getWeeklyProgress,
    getActivityByWeek,
    getSummary,
    isStreakAtRisk,
    wasActiveToday,
    setWeeklyGoals,
    getBadges,
    getXp,
    getLevel,
    BADGES,
  };

})();

if (typeof module !== 'undefined') module.exports = GamificationService;


;/* --- src/js/services/GlobalSearchService.js --- */
'use strict';

const GlobalSearchService = (() => {

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  }

  function _match(text, q) {
    return _norm(text).includes(_norm(q));
  }

  function _lessonResults(q) {
    const out = [];
    if (typeof CourseCurriculum === 'undefined') return out;
    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    courses.forEach(course => {
      const lessons = CourseCurriculum.getLessons?.(course.id) || [];
      lessons.forEach(lesson => {
        const hay = [lesson.title, lesson.description, lesson.section, ...(lesson.steps || [])].join(' ');
        if (_match(hay, q)) {
          out.push({
            type: 'lesson',
            id: `${course.id}-${lesson.id}`,
            title: lesson.title,
            subtitle: course.title,
            courseId: course.id,
            lessonId: lesson.id,
            route: 'tutorial.html',
          });
        }
      });
    });
    return out;
  }

  function _courseResults(q) {
    if (typeof DataService === 'undefined') return [];
    return DataService.getCourses(q).map(course => ({
      type: 'course',
      id: course.id,
      title: course.title,
      subtitle: course.desc,
      courseId: course.id,
      route: 'tutorial.html',
    }));
  }

  function _quizResults(q) {
    const out = [];
    if (typeof CourseCurriculum === 'undefined') return out;
    const quizzes = CourseCurriculum.getAllQuizzes?.() || [];
    quizzes.forEach(quiz => {
      const sections = quiz.sections || [];
      sections.forEach((mod, i) => {
        const hay = [mod.title, quiz.title].join(' ');
        if (_match(hay, q)) {
          out.push({
            type: 'quiz',
            id: `quiz-${quiz.id}-${i}`,
            title: mod.title || _t('search.quizModule', { course: quiz.title }, `Quiz de ${quiz.title}`),
            subtitle: quiz.title,
            courseId: quiz.id,
            quizId: quiz.id,
            route: 'quizzes.html',
          });
        }
      });
      if (!sections.length && _match(quiz.title + ' ' + (quiz.desc || ''), q)) {
        out.push({
          type: 'quiz',
          id: `quiz-${quiz.id}`,
          title: quiz.title,
          subtitle: _t('search.groupQuizzes', null, 'Quizzes'),
          courseId: quiz.id,
          quizId: quiz.id,
          route: 'quizzes.html',
        });
      }
    });
    return out;
  }

  function _helpResults(q) {
    if (typeof HelpData === 'undefined') return [];
    return HelpData.searchFaq(q).map(item => ({
      type: 'help',
      id: item.id,
      title: item.question,
      subtitle: _t('search.helpArticle', null, 'Centro de ayuda'),
      route: 'help.html',
      hash: `#faq-${item.id}`,
    }));
  }

  function _notesResults(q) {
    if (typeof NotesService === 'undefined') return [];
    return NotesService.search(q).slice(0, 5).map(note => ({
      type: 'note',
      id: note.id,
      title: note.title,
      subtitle: _t('nav.notes', null, 'Notas'),
      route: 'notes.html',
      noteId: note.id,
    }));
  }

  function _projectsResults(q) {
    if (typeof ProjectsService === 'undefined') return [];
    return ProjectsService.search(q).slice(0, 5).map(proj => ({
      type: 'project',
      id: proj.id,
      title: proj.title,
      subtitle: _t('nav.projects', null, 'Proyectos'),
      route: 'projects.html',
      projectId: proj.id,
    }));
  }

  function _guidedResults(q) {
    if (typeof GuidedProjectsData === 'undefined') return [];
    return GuidedProjectsData.getAll()
      .filter(p => _match([p.title, p.summary, p.quizId, p.difficulty].join(' '), q))
      .slice(0, 5)
      .map(p => ({
        type: 'guided',
        id: p.id,
        title: p.title,
        subtitle: _t('nav.guided', null, 'Guiados'),
        route: `guided-projects.html?project=${encodeURIComponent(p.id)}`,
        projectId: p.id,
      }));
  }

  function search(query, limitPerGroup = 5) {
    const q = (query || '').trim();
    if (!q || q.length < 2) {
      return { courses: [], lessons: [], quizzes: [], help: [], notes: [], projects: [], guided: [] };
    }

    return {
      courses:  _courseResults(q).slice(0, limitPerGroup),
      lessons:  _lessonResults(q).slice(0, limitPerGroup),
      quizzes:  _quizResults(q).slice(0, limitPerGroup),
      help:     _helpResults(q).slice(0, limitPerGroup),
      notes:    _notesResults(q),
      projects: _projectsResults(q),
      guided:   _guidedResults(q),
    };
  }

  function flatten(results) {
    return [
      ...results.courses,
      ...results.lessons,
      ...results.quizzes,
      ...results.help,
      ...(results.notes || []),
      ...(results.projects || []),
      ...(results.guided || []),
    ];
  }

  function groupLabel(type) {
    const map = {
      course:  _t('search.groupCourses', null, 'Cursos'),
      lesson:  _t('search.groupLessons', null, 'Lecciones'),
      quiz:    _t('search.groupQuizzes', null, 'Quizzes'),
      help:    _t('search.groupHelp', null, 'Ayuda'),
      note:    _t('nav.notes', null, 'Notas'),
      project: _t('nav.projects', null, 'Proyectos'),
      guided:  _t('nav.guided', null, 'Guiados'),
    };
    return map[type] || type;
  }

  return { search, flatten, groupLabel };

})();

if (typeof module !== 'undefined') module.exports = GlobalSearchService;


;/* --- src/js/services/NotificationService.js --- */
'use strict';

const NotificationService = (() => {

  const READ_KEY = 'in4mind_notif_read';
  const SNOOZE_KEY = 'in4mind_notif_snooze';
  const EVENT = 'in4mind-notifications-updated';
  const DAY_MS = 86400000;

  const TYPE_PRIORITY = {
    cert: 92,
    streak_risk: 88,
    resume: 82,
    study: 80,
    review: 78,
    lesson: 76,
    quiz: 72,
    path: 66,
    weekly: 54,
    streak: 48,
    announce: 42,
    discover: 34,
  };

  const MAX_BY_TYPE = {
    cert: 2,
    streak_risk: 1,
    resume: 2,
    lesson: 2,
    quiz: 2,
    review: 2,
    study: 1,
    path: 1,
    weekly: 1,
    streak: 1,
    announce: 2,
    discover: 1,
  };

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _readIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]'));
    } catch {
      return new Set();
    }
  }

  function _writeIds(set) {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify([...set]));
    } catch { /* ignore */ }
  }

  function _readSnoozes() {
    try {
      return JSON.parse(localStorage.getItem(SNOOZE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _isSnoozed(id) {
    const until = _readSnoozes()[id];
    return until && until > Date.now();
  }

  function _id(item) {
    return item.id || `${item.type}-${item.at}`;
  }

  function _daysSince(ts) {
    if (!ts) return 0;
    return Math.floor((Date.now() - ts) / DAY_MS);
  }

  function _courseById(courses, id) {
    return courses.find(c => c.id === id) || null;
  }

  function _hasCert(certifications, courseId) {
    return certifications.some(c => c.refId === courseId);
  }

  /** @param {object} raw */
  function _finalize(raw) {
    const base = TYPE_PRIORITY[raw.type] ?? 50;
    let priority = base + (raw.priorityBoost || 0);

    if (raw.daysSinceVisit) {
      priority += Math.min(18, raw.daysSinceVisit * 2);
    }
    if (raw.pct != null) {
      if (raw.type === 'cert') priority += Math.min(12, (raw.pct - 65) / 2);
      if (raw.type === 'quiz') priority += Math.min(8, (70 - raw.pct) / 4);
    }
    if (raw.lessonCount) {
      priority += Math.min(10, raw.lessonCount * 2);
    }

    const day = new Date().getDay();
    if (raw.type === 'weekly' && (day === 0 || day === 5 || day === 6)) {
      priority += 8;
    }

    return {
      ...raw,
      priority: Math.round(priority),
      at: raw.at || Date.now(),
    };
  }

  function _pickBestPerCourse(candidates) {
    const byCourse = new Map();
    const withoutCourse = [];

    candidates.forEach((item) => {
      if (!item.courseId) {
        withoutCourse.push(item);
        return;
      }
      const prev = byCourse.get(item.courseId);
      if (!prev || item.priority > prev.priority) {
        byCourse.set(item.courseId, item);
      }
    });

    return [...withoutCourse, ...byCourse.values()];
  }

  function _applyTypeLimits(sorted) {
    const counts = {};
    return sorted.filter((item) => {
      const type = item.type;
      counts[type] = (counts[type] || 0) + 1;
      return counts[type] <= (MAX_BY_TYPE[type] ?? 2);
    });
  }

  async function buildNotifications() {
    const now = Date.now();

    if (typeof UserProfileService === 'undefined') return [];

    if (typeof ContentLoader !== 'undefined') {
      await ContentLoader.load();
    }

    const [visits, quizProgress, certifications, favorites, saved] = await Promise.all([
      UserProfileService.getRecentVisits(12),
      UserProfileService.getQuizProgress(),
      UserProfileService.getCertifications(),
      UserProfileService.getFavorites(),
      UserProfileService.getSaved(),
    ]);

    const courses = typeof DataService !== 'undefined' ? DataService.getCourses() : [];
    const candidates = [];
    const certIds = new Set(certifications.map(c => c.refId));

    visits
      .filter(v => v.type === 'course' && v.refId)
      .forEach((v) => {
        const days = _daysSince(v.visitedAt);
        if (days < 2) return;
        const course = _courseById(courses, v.refId);
        candidates.push(_finalize({
          id: `resume-${v.refId}`,
          type: 'resume',
          title: _t('notif.resumeTitle', { course: course?.title || v.title }, `Retoma ${course?.title || v.title}`),
          body: days >= 7
            ? _t('notif.resumeBodyLong', { days }, `Llevas ${days} días sin continuar.`)
            : _t('notif.resumeBody', null, 'Hace tiempo que no continúas este curso.'),
          at: v.visitedAt || now,
          courseId: v.refId,
          route: 'tutorial.html',
          daysSinceVisit: days,
          priorityBoost: days >= 7 ? 6 : 0,
        }));
      });

    Object.entries(quizProgress || {}).forEach(([courseId, quiz]) => {
      const pct = quiz.bestPct ?? quiz.pct ?? 0;
      const course = _courseById(courses, courseId);
      if (!course) return;

      if (pct >= 70 && !certIds.has(courseId)) {
        candidates.push(_finalize({
          id: `cert-near-${courseId}`,
          type: 'cert',
          title: _t('notif.certNearTitle', { course: course.title }, `Casi certificado en ${course.title}`),
          body: _t('notif.certNearBody', { pct }, `Tu mejor score es ${pct}%. Completa el examen final.`),
          at: quiz.completedAt || now,
          courseId,
          pct,
          route: 'quizzes.html',
          priorityBoost: pct >= 85 ? 6 : 0,
        }));
      } else if (pct >= 40 && pct < 70) {
        const attempts = quiz.attempts || 1;
        candidates.push(_finalize({
          id: `quiz-improve-${courseId}`,
          type: 'quiz',
          title: _t('notif.quizImproveTitle', { course: course.title }, `Mejora tu quiz de ${course.title}`),
          body: _t('notif.quizImproveBody', { pct }, `Llevas ${pct}%. Un repaso más y subes.`),
          at: quiz.completedAt || now,
          courseId,
          pct,
          route: 'quizzes.html',
          priorityBoost: attempts >= 2 ? 4 : 0,
        }));
      }
    });

    courses.forEach((course) => {
      if (certIds.has(course.id)) return;
      const lessons = UserProfileService.getLessonProgressSync(course.id);
      const lessonEntries = Object.values(lessons);
      if (!lessonEntries.length) return;
      const quiz = quizProgress?.[course.id];
      const quizPct = quiz?.bestPct ?? quiz?.pct ?? 0;
      if (quizPct >= 70) return;

      candidates.push(_finalize({
        id: `lesson-progress-${course.id}`,
        type: 'lesson',
        title: _t('notif.lessonTitle', { course: course.title }, `Sigue con ${course.title}`),
        body: _t('notif.lessonBody', { n: lessonEntries.length }, `Tienes ${lessonEntries.length} lecciones registradas. Completa el módulo.`),
        at: Math.max(...lessonEntries.map(l => l.completedAt || 0), 0) || now,
        courseId: course.id,
        route: 'tutorial.html',
        lessonCount: lessonEntries.length,
      }));
    });

    if (typeof LearningPathsData !== 'undefined' && typeof GamificationService !== 'undefined') {
      LearningPathsData.getPaths().forEach((path) => {
        let done = 0;
        path.courseIds.forEach((id) => {
          const q = quizProgress?.[id];
          if (q && (q.bestPct ?? q.pct ?? 0) >= 70) done += 1;
          else if (Object.keys(UserProfileService.getLessonProgressSync(id)).length >= 2) done += 0.5;
        });
        const pct = Math.round((done / Math.max(path.courseIds.length, 1)) * 100);
        if (pct < 20 || pct >= 100) return;
        const nextId = path.courseIds.find((id) => {
          const q = quizProgress?.[id];
          return !(q && (q.bestPct ?? q.pct ?? 0) >= 70);
        });
        const nextCourse = nextId ? _courseById(courses, nextId) : null;
        if (!nextCourse) return;

        candidates.push(_finalize({
          id: `path-${path.id}`,
          type: 'path',
          title: _t('notif.pathTitle', { path: path.title }, `Ruta: ${path.title}`),
          body: _t('notif.pathBody', { course: nextCourse.title, pct }, `${pct}% de la ruta · sigue con ${nextCourse.title}`),
          at: now,
          courseId: nextCourse.id,
          route: 'tutorial.html',
          priorityBoost: pct >= 50 ? 5 : 0,
        }));
      });
    }

    if (typeof SpacedRepetitionService !== 'undefined') {
      SpacedRepetitionService.getDueTopics(3).forEach((topic, i) => {
        candidates.push(_finalize({
          id: `srs-${topic.topicKey}`,
          type: 'review',
          title: _t('notif.srsTitle', null, 'Repaso espaciado'),
          body: _t('notif.srsBody', { topic: topic.label, days: topic.overdueDays }, `Repasa «${topic.label}» (${topic.overdueDays}d de retraso)`),
          at: topic.dueAt || now - i,
          courseId: topic.quizId,
          route: 'quizzes.html',
          priorityBoost: Math.min(12, topic.overdueDays),
        }));
      });
    }

    // Recordatorio de estudio diario (si no hubo actividad hoy)
    if (typeof GamificationService !== 'undefined' && !GamificationService.wasActiveToday?.()) {
      const hour = new Date().getHours();
      if (hour >= 9) {
        candidates.push(_finalize({
          id: 'study-today',
          type: 'study',
          title: _t('notif.studyTitle', null, 'Momento de estudiar'),
          body: _t('notif.studyBody', null, 'Dedica 15 minutos hoy: una lección o un quiz corto.'),
          at: now,
          route: 'dashboard.html',
          priorityBoost: hour >= 18 ? 6 : 0,
        }));
      }
    }

    if (typeof GamificationService !== 'undefined') {
      const g = GamificationService.getSummary();

      if (GamificationService.isStreakAtRisk()) {
        candidates.push(_finalize({
          id: 'streak-risk',
          type: 'streak_risk',
          title: _t('notif.streakRiskTitle', { n: g.streak }, `No pierdas tu racha de ${g.streak} días`),
          body: _t('notif.streakRiskBody', null, 'Completa una lección o quiz hoy para mantenerla.'),
          at: now,
          route: 'tutorial.html',
          priorityBoost: 10,
        }));
      } else if (g.streak >= 3) {
        candidates.push(_finalize({
          id: `streak-${g.streak}`,
          type: 'streak',
          title: _t('notif.streakTitle', { n: g.streak }, `Racha de ${g.streak} días`),
          body: _t('notif.streakBody', null, 'Sigue aprendiendo para mantenerla.'),
          at: now,
          route: 'dashboard.html',
        }));
      }

      const w = g.weekly;
      const remaining = Math.max(0, w.lessonGoal - w.lessons);
      if (remaining > 0) {
        candidates.push(_finalize({
          id: `weekly-goal-${w.lessons}`,
          type: 'weekly',
          title: _t('notif.weeklyGoalTitle', null, 'Meta semanal'),
          body: _t('notif.weeklyGoalBody', { done: w.lessons, goal: w.lessonGoal }, `${w.lessons}/${w.lessonGoal} lecciones esta semana.`),
          at: now,
          route: 'tutorial.html',
          priorityBoost: remaining === 1 ? 6 : 0,
        }));
      }
    }

    if (typeof ContentLoader !== 'undefined') {
      ContentLoader.getAnnouncements().forEach((a, i) => {
        const age = a.expiresAt ? a.expiresAt - now : null;
        if (age != null && age < 0) return;
        candidates.push(_finalize({
          id: `announce-${a.id || i}`,
          type: 'announce',
          title: a.title,
          body: a.body || '',
          at: a.at || now - i,
          route: a.route || 'dashboard.html',
          priorityBoost: a.priority || 0,
        }));
      });
    }

    const engagedIds = new Set([
      ...visits.filter(v => v.type === 'course').map(v => v.refId),
      ...Object.keys(quizProgress || {}),
    ]);

    [...favorites, ...saved]
      .filter(item => item.type === 'course' && item.refId && !engagedIds.has(item.refId))
      .slice(0, 1)
      .forEach((f) => {
        const course = _courseById(courses, f.refId);
        if (!course) return;
        candidates.push(_finalize({
          id: `fav-${f.refId}`,
          type: 'discover',
          title: _t('notif.favTitle', { course: course.title }, `Tu favorito: ${course.title}`),
          body: _t('notif.favBody', null, 'Continúa donde lo dejaste.'),
          at: f.visitedAt || f.savedAt || now,
          courseId: f.refId,
          route: 'tutorial.html',
        }));
      });

    const filtered = candidates
      .filter(item => !_isSnoozed(_id(item)))
      .sort((a, b) => b.priority - a.priority || (b.at || 0) - (a.at || 0));

    const deduped = _pickBestPerCourse(filtered);
    const limited = _applyTypeLimits(
      deduped.sort((a, b) => b.priority - a.priority || (b.at || 0) - (a.at || 0))
    );

    return limited.slice(0, 10);
  }

  function getUnreadCount(notifications) {
    const read = _readIds();
    return notifications.filter(n => !read.has(_id(n))).length;
  }

  function markRead(notification) {
    const read = _readIds();
    read.add(_id(notification));
    _writeIds(read);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  function snooze(notification, hours = 24) {
    const snoozes = _readSnoozes();
    snoozes[_id(notification)] = Date.now() + hours * 3600000;
    try {
      localStorage.setItem(SNOOZE_KEY, JSON.stringify(snoozes));
    } catch { /* ignore */ }
    markRead(notification);
  }

  function markAllRead(notifications) {
    const read = _readIds();
    notifications.forEach(n => read.add(_id(n)));
    _writeIds(read);
    window.dispatchEvent(new CustomEvent(EVENT));
  }

  function isRead(notification) {
    return _readIds().has(_id(notification));
  }

  function isHighPriority(notification) {
    return (notification?.priority ?? 0) >= 80;
  }

  return {
    EVENT,
    buildNotifications,
    getUnreadCount,
    markRead,
    markAllRead,
    snooze,
    isRead,
    isHighPriority,
  };

})();

if (typeof module !== 'undefined') module.exports = NotificationService;


;/* --- src/js/services/PushNotificationService.js --- */
'use strict';

/**
 * Notificaciones locales del navegador (permiso + recordatorios de estudio/SRS).
 */
const PushNotificationService = (() => {
  const LAST_KEY = 'in4mind_local_push_last';
  const COOLDOWN_MS = 6 * 60 * 60 * 1000;

  function isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  async function requestPermission() {
    if (!isSupported()) return { ok: false, reason: 'unsupported' };
    if (Notification.permission === 'granted') return { ok: true };
    if (Notification.permission === 'denied') return { ok: false, reason: 'denied' };
    const result = await Notification.requestPermission();
    return { ok: result === 'granted' };
  }

  function _pushEnabled() {
    try {
      const prefs = JSON.parse(localStorage.getItem('in4mind_notif_prefs') || '{}');
      return prefs.push !== false;
    } catch {
      return true;
    }
  }

  function showLocal(title, body, options = {}) {
    if (!isSupported() || Notification.permission !== 'granted') return false;
    if (!_pushEnabled()) return false;
    try {
      const opts = {
        body,
        icon: options.icon || './src/img/brand/favicon-64.png',
        tag: options.tag || 'in4mind',
        data: options.data || {},
      };
      if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification?.(title, opts).catch(() => {
            try { new Notification(title, opts); } catch { /* ignore */ }
          });
        });
      } else {
        new Notification(title, opts);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Emite 1 notificación local prioritaria (SRS / estudio / racha) con cooldown.
   * @param {Array<{id:string,type:string,title:string,body:string}>} notifications
   */
  function syncUsefulReminders(notifications = []) {
    if (!isSupported() || Notification.permission !== 'granted' || !_pushEnabled()) return;
    try {
      const last = JSON.parse(localStorage.getItem(LAST_KEY) || '{}');
      const now = Date.now();
      if (last.at && now - last.at < COOLDOWN_MS) return;

      const priority = ['streak_risk', 'review', 'study', 'weekly'];
      const pick = notifications.find(n => priority.includes(n.type) && n.id !== last.id);
      if (!pick) return;

      const ok = showLocal(pick.title, pick.body, { tag: `in4mind-${pick.type}`, data: { id: pick.id } });
      if (ok) {
        localStorage.setItem(LAST_KEY, JSON.stringify({ id: pick.id, at: now }));
      }
    } catch { /* ignore */ }
  }

  return { isSupported, requestPermission, showLocal, syncUsefulReminders };

})();

if (typeof module !== 'undefined') module.exports = PushNotificationService;


;/* --- src/js/services/AccessibilityService.js --- */
'use strict';

const AccessibilityService = (() => {

  const KEY = 'in4mind_a11y_prefs';

  function _read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _write(prefs) {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }

  function _apply(prefs) {
    if (typeof window.In4mindA11y !== 'undefined') {
      window.In4mindA11y.apply(prefs);
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('a11y-large-text', prefs.largeText === true);
    root.classList.toggle('a11y-high-contrast', prefs.highContrast === true);
    root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion === true);
    if (prefs.reduceMotion) {
      root.style.setProperty('--motion-duration', '0.01ms');
    } else {
      root.style.removeProperty('--motion-duration');
    }
  }

  function getPrefs() {
    const stored = _read();
    const systemReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return {
      largeText: stored.largeText === true,
      highContrast: stored.highContrast === true,
      reduceMotion: stored.reduceMotion === true || (stored.reduceMotion == null && systemReduce),
      fontScale: stored.fontScale || 100,
    };
  }

  function setPref(key, value) {
    const prefs = _read();
    prefs[key] = value;
    _write(prefs);
    _apply(getPrefs());
    window.dispatchEvent(new CustomEvent('in4mind-a11y-updated'));
  }

  function initEarly() {
    if (typeof window.In4mindA11y !== 'undefined') {
      window.In4mindA11y.apply(getPrefs());
      return;
    }
    _apply(getPrefs());
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
      if (_read().reduceMotion == null) _apply(getPrefs());
    });
  }

  function renderPanel(container) {
    if (!container) return;
    const p = getPrefs();
    container.innerHTML = `
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.largeText') : 'Texto grande'}</p>
          <p class="settings-row__hint">${typeof I18n !== 'undefined' ? I18n.t('a11y.largeTextHint') : 'Aumenta el tamaño de fuente global.'}</p>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" id="a11y-large-text" ${p.largeText ? 'checked' : ''}>
          <span class="settings-toggle__track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.highContrast') : 'Alto contraste'}</p>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" id="a11y-high-contrast" ${p.highContrast ? 'checked' : ''}>
          <span class="settings-toggle__track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.reduceMotion') : 'Reducir animaciones'}</p>
        </div>
        <label class="settings-toggle">
          <input type="checkbox" id="a11y-reduce-motion" ${p.reduceMotion ? 'checked' : ''}>
          <span class="settings-toggle__track"></span>
        </label>
      </div>
      <div class="settings-row">
        <div class="settings-row__text">
          <p class="settings-row__label">${typeof I18n !== 'undefined' ? I18n.t('a11y.shortcuts') : 'Atajos de teclado'}</p>
          <p class="settings-row__hint">Ctrl+K · ${typeof I18n !== 'undefined' ? I18n.t('search.placeholder') : 'Búsqueda'}</p>
        </div>
      </div>`;

    container.querySelector('#a11y-large-text')?.addEventListener('change', e => setPref('largeText', e.target.checked));
    container.querySelector('#a11y-high-contrast')?.addEventListener('change', e => setPref('highContrast', e.target.checked));
    container.querySelector('#a11y-reduce-motion')?.addEventListener('change', e => setPref('reduceMotion', e.target.checked));
  }

  return { initEarly, getPrefs, setPref, renderPanel };

})();

if (typeof module !== 'undefined') module.exports = AccessibilityService;


;/* --- src/js/services/AuthService.js --- */
'use strict';

/**
 * IN4MIND — Autenticación unificada: Supabase Auth con fallback demo (DataService).
 */
const AuthService = (() => {

  const _sb = typeof _sbClient !== 'undefined' ? _sbClient : null;

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? k;
  }

  function _sessionUser(user, name) {
    return {
      id: user?.id || null,
      email: (user?.email || '').toLowerCase(),
      name: name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario',
    };
  }

  function _mapAuthError(error, fallbackKey, fallbackMsg) {
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already exists')) {
      return _t('auth.errEmailTaken', null, 'Este correo ya está registrado.');
    }
    if (msg.includes('invalid login') || msg.includes('invalid credentials')) {
      return _t('auth.errLogin', null, 'Credenciales incorrectas.');
    }
    if (msg.includes('email not confirmed')) {
      return _t('auth.errEmailNotConfirmed', null, 'Confirma tu correo antes de iniciar sesión.');
    }
    if (msg.includes('password')) {
      return error.message || _t(fallbackKey, null, fallbackMsg);
    }
    return error?.message || _t(fallbackKey, null, fallbackMsg);
  }

  async function _upsertProfile(user, name) {
    if (!_sb || !user?.id) return { ok: true, name };
    const displayName = name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';
    try {
      const { error } = await _sb.from('profiles').upsert({
        id: user.id,
        email: user.email?.toLowerCase(),
        name: displayName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) {
        if (typeof ErrorReporter !== 'undefined') {
          ErrorReporter.capture('profile_upsert_fail', { message: error.message });
        }
        // El trigger handle_new_user suele crear la fila; no bloqueamos el login.
        return { ok: false, name: displayName, error: error.message };
      }
      return { ok: true, name: displayName };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('profile_upsert_fail', { message: err?.message || String(err) });
      }
      return { ok: false, name: displayName, error: err?.message || String(err) };
    }
  }

  /**
   * @param {object} user
   * @param {boolean|null} remember  true si el usuario marcó "Recordar datos"
   */
  async function _persistSession(user, remember = null, password = null) {
    if (typeof SessionStore !== 'undefined') {
      SessionStore.persist(user, remember, password);
    } else {
      sessionStorage.setItem('in4mind_user', JSON.stringify(user));
    }
    if (typeof QuizProgressService !== 'undefined') {
      QuizProgressService.mergeGuestInto(user.email);
    }
    if (typeof AdaptiveQuizEngine !== 'undefined') {
      AdaptiveQuizEngine.mergeGuestInto(user.email);
    }
    if (typeof UserProfileService !== 'undefined') {
      UserProfileService.mergeGuestIntoUser(user.email);
      UserProfileService.migrateSessionQuizProgress();
    }
  }

  async function login(email, password, remember = false) {
    const em = String(email || '').trim().toLowerCase();
    const pass = String(password || '');

    if (_sb) {
      try {
        const { data, error } = await _sb.auth.signInWithPassword({ email: em, password: pass });
        if (!error && data?.user && data?.session) {
          const meta = await _upsertProfile(data.user);
          const user = _sessionUser(data.user, meta.name);
          await _persistSession(user, remember, pass);
          if (typeof OnboardingService !== 'undefined') {
            await OnboardingService.hydrateFromCloud(user.email);
          }
          if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.broadcastLogin(user);
          return { ok: true, user };
        }
        return {
          ok: false,
          error: _mapAuthError(error, 'auth.errLogin', 'Credenciales incorrectas.'),
        };
      } catch {
        return {
          ok: false,
          error: _t('auth.errLogin', null, 'No se pudo iniciar sesión. Inténtalo de nuevo.'),
        };
      }
    }

    const result = await DataService.login(em, pass);
    if (result.ok) await _persistSession(result.user, remember, pass);
    return result;
  }

  async function register(name, email, password, remember = false) {
    const em = String(email || '').trim().toLowerCase();
    const pass = String(password || '');
    const displayName = String(name || '').trim();

    if (_sb) {
      try {
        const { data, error } = await _sb.auth.signUp({
          email: em,
          password: pass,
          options: { data: { name: displayName } },
        });

        if (error) {
          return {
            ok: false,
            error: _mapAuthError(error, 'auth.errRegister', 'No se pudo crear la cuenta.'),
          };
        }

        const user = data?.user;
        if (!user) {
          return {
            ok: false,
            error: _t('auth.errRegister', null, 'No se pudo crear la cuenta.'),
          };
        }

        // Supabase anti-enumeration: usuario sin identities = correo ya registrado.
        if (Array.isArray(user.identities) && user.identities.length === 0) {
          return {
            ok: false,
            error: _t('auth.errEmailTaken', null, 'Este correo ya está registrado.'),
          };
        }

        // Confirmación de email activa: hay user pero aún no hay sesión JWT.
        if (!data.session) {
          if (typeof OnboardingService !== 'undefined') OnboardingService.markIncomplete(em);
          return {
            ok: true,
            needsEmailConfirmation: true,
            email: em,
            user: _sessionUser(user, displayName),
          };
        }

        await _upsertProfile(user, displayName);
        const sessionUser = _sessionUser(user, displayName);
        await _persistSession(sessionUser, remember, pass);
        if (typeof OnboardingService !== 'undefined') {
          OnboardingService.markIncomplete(em);
          try {
            await _sb.from('profiles').update({
              onboarding_completed: false,
              updated_at: new Date().toISOString(),
            }).eq('id', user.id);
          } catch { /* optional column */ }
        }
        if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.broadcastLogin(sessionUser);
        return { ok: true, user: sessionUser };
      } catch {
        return {
          ok: false,
          error: _t('auth.errRegister', null, 'No se pudo crear la cuenta. Inténtalo de nuevo.'),
        };
      }
    }

    const result = await DataService.register(displayName, em, pass);
    if (result.ok) {
      await _persistSession(result.user, remember, pass);
      if (typeof OnboardingService !== 'undefined') OnboardingService.markIncomplete(em);
    }
    return result;
  }

  /**
   * Envía el correo de recuperación a la dirección que escribió el usuario.
   */
  async function requestPasswordReset(email) {
    const em = String(email || '').trim().toLowerCase();

    if (_sb) {
      try {
        const base = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}`;
        const redirectTo = `${base}login.html?view=reset`;
        const { error } = await _sb.auth.resetPasswordForEmail(em, { redirectTo });
        if (!error) return { ok: true, email: em, delivered: true, via: 'supabase' };
      } catch { /* se intenta el endpoint propio */ }
    }

    const local = await DataService.requestPasswordReset(em);
    if (!local.ok) return local;

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, token: local.token }),
      });
      if (res.ok) return { ok: true, email: em, delivered: true, via: 'api' };

      const data = await res.json().catch(() => ({}));
      if (data.error === 'RESET_EMAIL_NOT_CONFIGURED' || res.status === 404) {
        return { ok: true, email: em, delivered: false, reason: 'not_configured' };
      }
      return { ok: true, email: em, delivered: false, reason: 'send_failed' };
    } catch {
      return { ok: true, email: em, delivered: false, reason: 'offline' };
    }
  }

  async function resetPassword(email, password, confirm) {
    const em = String(email || '').trim().toLowerCase();

    if (_sb) {
      try {
        const { error } = await _sb.auth.updateUser({ password });
        if (!error) return { ok: true, email: em };
      } catch { /* fallback */ }
    }

    return DataService.resetPassword(em, password, confirm);
  }

  async function updateDisplayName(name) {
    const trimmed = String(name || '').trim();
    if (!trimmed) return { ok: false, error: _t('settingsModal.nameRequired', null, 'El nombre es obligatorio.') };

    const stored = sessionStorage.getItem('in4mind_user');
    let user = stored ? JSON.parse(stored) : null;
    if (!user) return { ok: false, error: _t('auth.errLogin', null, 'Sin sesión.') };

    user = { ...user, name: trimmed };
    if (typeof SessionStore !== 'undefined') SessionStore.persist(user);
    else sessionStorage.setItem('in4mind_user', JSON.stringify(user));

    if (_sb) {
      try {
        await _sb.auth.updateUser({ data: { name: trimmed } });
        if (user.id) {
          await _sb.from('profiles').upsert({
            id: user.id,
            email: user.email,
            name: trimmed,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      } catch { /* local ok */ }
    }

    window.dispatchEvent(new CustomEvent('in4mind-profile-updated', { detail: { email: user.email } }));
    return { ok: true, user };
  }

  async function logout() {
    if (_sb) {
      try { await _sb.auth.signOut(); } catch { /* ignore */ }
    }
    if (typeof SessionStore !== 'undefined') {
      SessionStore.clear({ keepEmail: true });
    } else {
      sessionStorage.removeItem('in4mind_user');
    }
    if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.broadcastLogout();
  }

  async function getSession() {
    if (_sb) {
      try {
        const { data } = await _sb.auth.getSession();
        if (data?.session?.user) {
          const u = data.session.user;
          return _sessionUser(u, u.user_metadata?.name);
        }
      } catch { /* ignore */ }
    }
    try {
      const raw = sessionStorage.getItem('in4mind_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function restoreOAuthSession() {
    if (!_sb) return { ok: false };
    try {
      const { data, error } = await _sb.auth.getSession();
      if (error || !data?.session?.user) return { ok: false };
      const meta = await _upsertProfile(data.session.user);
      const user = _sessionUser(data.session.user, meta.name);
      await _persistSession(user);
      if (typeof OnboardingService !== 'undefined') {
        await OnboardingService.hydrateFromCloud(user.email);
      }
      return { ok: true, user };
    } catch {
      return { ok: false };
    }
  }

  async function signInWithGoogle() {
    if (!_sb) {
      return {
        ok: false,
        error: _t('auth.oauthUnavailable', null, 'Usa email y contraseña en modo demo, o configura Supabase.'),
      };
    }
    try {
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await _sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) return { ok: false, error: error.message };
      return { ok: true, redirecting: true };
    } catch (e) {
      return { ok: false, error: e?.message || _t('auth.errLogin', null, 'No se pudo iniciar sesión.') };
    }
  }

  return {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    updateDisplayName,
    logout,
    getSession,
    restoreOAuthSession,
    signInWithGoogle,
    isSupabaseEnabled: () => !!_sb,
  };

})();

if (typeof module !== 'undefined') module.exports = AuthService;


;/* --- src/js/services/DataExportService.js --- */
'use strict';

const DataExportService = (() => {

  function _t(k, p, fb) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb ?? '';
  }

  async function collectUserData() {
    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;

    const [favorites, saved, visits, quizProgress, certifications] = await Promise.all([
      UserProfileService?.getFavorites?.() ?? [],
      UserProfileService?.getSaved?.() ?? [],
      UserProfileService?.getRecentVisits?.(50) ?? [],
      UserProfileService?.getQuizProgress?.() ?? {},
      UserProfileService?.getCertifications?.() ?? [],
    ]);

    let gamification = {};
    let activity = [];
    let aiGuest = [];
    try { gamification = JSON.parse(localStorage.getItem('in4mind_gamification') || '{}'); } catch { /* */ }
    try { activity = JSON.parse(localStorage.getItem('in4mind_activity_log') || '[]'); } catch { /* */ }
    try { aiGuest = JSON.parse(localStorage.getItem('in4mind_ai_guest_history') || '[]'); } catch { /* */ }

    return {
      exportedAt: new Date().toISOString(),
      platform: 'IN4MIND',
      version: 2,
      user,
      favorites,
      saved,
      visits,
      quizProgress,
      certifications,
      gamification,
      activity,
      aiGuestHistory: aiGuest,
      locale: typeof I18n !== 'undefined' ? I18n.getLocale() : 'es',
      theme: localStorage.getItem('in4mind_theme'),
      notes: typeof NotesService !== 'undefined' ? {
        notes: NotesService.getAllNotes().filter(n => n.source !== 'lesson'),
        folders: NotesService.getFolders(),
      } : null,
      projects: typeof ProjectsService !== 'undefined' ? ProjectsService.getAll() : null,
      guided: typeof GuidedProjectsService !== 'undefined' ? GuidedProjectsService.getAllProgress() : null,
      quizAttempts: typeof QuizProgressService !== 'undefined' ? QuizProgressService.getAll() : null,
      errorLog: typeof ErrorReporter !== 'undefined' ? ErrorReporter.getLog() : [],
    };
  }

  async function downloadJson() {
    const data = await collectUserData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `in4mind-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true };
  }

  function _userSuffix() {
    try {
      const raw = sessionStorage.getItem('in4mind_user') || localStorage.getItem('in4mind_user');
      const email = raw ? (JSON.parse(raw).email || '') : '';
      return (email || 'guest').toLowerCase();
    } catch {
      return 'guest';
    }
  }

  /**
   * Restaura un export JSON (local-first). No borra datos no incluidos.
   * @param {object|string} raw
   */
  async function importJson(raw) {
    let data = raw;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch {
        return { ok: false, error: 'invalid_json' };
      }
    }
    if (!data || data.platform !== 'IN4MIND') {
      return { ok: false, error: 'invalid_export' };
    }

    const suffix = _userSuffix();
    try {
      if (data.theme) localStorage.setItem('in4mind_theme', data.theme);
      if (data.locale && typeof I18n !== 'undefined' && I18n.setLocale) {
        try { I18n.setLocale(data.locale); } catch { /* */ }
      }
      if (data.gamification) localStorage.setItem('in4mind_gamification', JSON.stringify(data.gamification));
      if (data.activity) localStorage.setItem('in4mind_activity_log', JSON.stringify(data.activity));
      if (data.aiGuestHistory) localStorage.setItem('in4mind_ai_guest_history', JSON.stringify(data.aiGuestHistory));

      if (data.quizProgress) {
        localStorage.setItem(`in4mind_quiz_results_${suffix}`, JSON.stringify(data.quizProgress));
      }
      if (data.quizAttempts) {
        localStorage.setItem(`in4mind_quiz_state:${suffix}`, JSON.stringify(data.quizAttempts));
      }
      if (data.guided) {
        localStorage.setItem(`in4mind_guided_projects:${suffix}`, JSON.stringify(data.guided));
      }
      if (data.projects) {
        const map = {};
        (Array.isArray(data.projects) ? data.projects : Object.values(data.projects || {})).forEach(p => {
          if (p?.id) map[p.id] = p;
        });
        localStorage.setItem(`in4mind_projects:${suffix}`, JSON.stringify(map));
      }
      if (data.notes) {
        const notesArr = Array.isArray(data.notes.notes) ? data.notes.notes : Object.values(data.notes.notes || {});
        const noteMap = {};
        notesArr.forEach(n => { if (n?.id) noteMap[n.id] = n; });
        localStorage.setItem(`in4mind_user_notes:${suffix}`, JSON.stringify(noteMap));
        const foldersArr = Array.isArray(data.notes.folders) ? data.notes.folders : Object.values(data.notes.folders || {});
        const folderMap = {};
        foldersArr.forEach(f => { if (f?.id) folderMap[f.id] = f; });
        localStorage.setItem(`in4mind_note_folders:${suffix}`, JSON.stringify(folderMap));
      }

      // Empuja blobs a la nube si hay sesión
      if (typeof CloudBlobSync !== 'undefined') {
        void CloudBlobSync.pushBlob('notes', {
          notes: JSON.parse(localStorage.getItem(`in4mind_user_notes:${suffix}`) || '{}'),
          folders: JSON.parse(localStorage.getItem(`in4mind_note_folders:${suffix}`) || '{}'),
        });
        void CloudBlobSync.pushBlob('projects', JSON.parse(localStorage.getItem(`in4mind_projects:${suffix}`) || '{}'));
        void CloudBlobSync.pushBlob('quizAttempts', JSON.parse(localStorage.getItem(`in4mind_quiz_state:${suffix}`) || '{}'));
        void CloudBlobSync.pushBlob('guided', JSON.parse(localStorage.getItem(`in4mind_guided_projects:${suffix}`) || '{}'));
      }

      window.dispatchEvent(new CustomEvent('in4mind-profile-updated'));
      if (typeof AppShell !== 'undefined') {
        AppShell.showToast(
          typeof I18n !== 'undefined' && I18n.t('privacy.importOk') !== 'privacy.importOk'
            ? I18n.t('privacy.importOk')
            : 'Datos restaurados en este dispositivo.',
          3200
        );
      }
      return { ok: true };
    } catch (err) {
      if (typeof ErrorReporter !== 'undefined') {
        ErrorReporter.capture('import_fail', { message: err?.message || String(err) });
      }
      return { ok: false, error: err?.message || 'import_failed' };
    }
  }

  async function importFromFile(file) {
    if (!file) return { ok: false, error: 'no_file' };
    const text = await file.text();
    return importJson(text);
  }

  async function deleteAllLocalData() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith('in4mind_')) keys.push(k);
    }
    keys.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
    return { ok: true };
  }

  async function deleteAccount() {
    if (!confirm(_t('privacy.deleteConfirm', null, '¿Eliminar todos tus datos locales y cerrar sesión? Esta acción no se puede deshacer.'))) {
      return { ok: false, cancelled: true };
    }

    if (typeof AuthService !== 'undefined') await AuthService.logout();
    else if (typeof AppShell !== 'undefined') AppShell.logout();
    await deleteAllLocalData();

    if (typeof _sbClient !== 'undefined') {
      try {
        const { data } = await _sbClient.auth.getUser();
        if (data?.user) {
          await _sbClient.from('ai_chat_history').delete().eq('user_id', data.user.id);
        }
      } catch { /* ignore */ }
    }

    window.location.href = 'index.html';
    return { ok: true };
  }

  function clearAiHistory() {
    localStorage.removeItem('in4mind_ai_guest_history');
    if (typeof _sbClient !== 'undefined') {
      _sbClient.auth.getUser().then(({ data }) => {
        if (data?.user?.id) {
          _sbClient.from('ai_chat_history').delete().eq('user_id', data.user.id);
        }
      }).catch(() => {});
    }
    return { ok: true };
  }

  return { collectUserData, downloadJson, importJson, importFromFile, deleteAllLocalData, deleteAccount, clearAiHistory };

})();

if (typeof module !== 'undefined') module.exports = DataExportService;


;/* --- src/js/controllers/AppFeatures.js --- */
'use strict';

/**
 * IN4MIND — Funciones globales de la app: notificaciones, búsqueda, bottom nav, onboarding, PWA.
 */
const AppFeatures = (() => {

  const ONBOARD_KEY = 'in4mind_onboarding_done';
  let _activeNav = null;
  let _notifOpen = false;
  let _searchOpen = false;
  let _notifications = [];

  function _t(k, p, fb = '') {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(k, p);
      if (out && out !== k) return out;
    }
    return fb;
  }

  function _navigateItem(item) {
    if (!item) return;

    if (item.type === 'note' && item.noteId) {
      window.location.href = `notes.html?note=${encodeURIComponent(item.noteId)}`;
      return;
    }
    if (item.type === 'project' && item.projectId) {
      window.location.href = `projects.html?project=${encodeURIComponent(item.projectId)}`;
      return;
    }
    if (item.type === 'guided' && item.route) {
      window.location.href = item.route;
      return;
    }
    if (item.type === 'quiz') {
      if (item.quizId) sessionStorage.setItem('in4mind_open_quiz', item.quizId);
      else if (item.courseId) sessionStorage.setItem('in4mind_open_quiz', item.courseId);
      const q = item.quizId || item.courseId;
      window.location.href = q
        ? `quizzes.html?quiz=${encodeURIComponent(q)}`
        : 'quizzes.html';
      return;
    }
    if (item.type === 'lesson' && item.courseId) {
      sessionStorage.setItem('in4mind_open_course', item.courseId);
      const lesson = item.lessonId ? `&lesson=${encodeURIComponent(item.lessonId)}` : '';
      window.location.href = `tutorial.html?course=${encodeURIComponent(item.courseId)}${lesson}`;
      return;
    }
    if (item.courseId) sessionStorage.setItem('in4mind_open_course', item.courseId);
    if (item.route) {
      let url = item.hash ? `${item.route}${item.hash}` : item.route;
      if (item.type === 'course' && item.courseId && !/[?&]course=/.test(url)) {
        url = `tutorial.html?course=${encodeURIComponent(item.courseId)}`;
      }
      window.location.href = url;
    }
  }

  // ── Notificaciones ───────────────────────────────────────────

  function _ensureNotifPanel() {
    let panel = document.getElementById('app-notif-panel');
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = 'app-notif-panel';
    panel.className = 'app-notif-panel';
    panel.hidden = true;
    panel.innerHTML = `
      <div class="app-notif-panel__head">
        <h2 class="app-notif-panel__title">${_t('notif.panelTitle', null, 'Notificaciones')}</h2>
        <button type="button" class="app-notif-panel__mark" id="app-notif-mark-all">${_t('notif.markAll', null, 'Marcar leídas')}</button>
      </div>
      <ul class="app-notif-panel__list" id="app-notif-list" role="list"></ul>
      <p class="app-notif-panel__empty" id="app-notif-empty" hidden>${_t('notif.empty', null, 'No hay notificaciones nuevas.')}</p>`;
    document.body.appendChild(panel);
    document.getElementById('app-notif-mark-all')?.addEventListener('click', () => {
      NotificationService.markAllRead(_notifications);
      void _refreshNotifications();
    });
    return panel;
  }

  function _renderNotifList() {
    const list = document.getElementById('app-notif-list');
    const empty = document.getElementById('app-notif-empty');
    if (!list) return;
    if (!_notifications.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = _notifications.map(n => {
      const read = NotificationService.isRead(n);
      const high = NotificationService.isHighPriority(n);
      return `
      <li class="app-notif-item ${read ? 'app-notif-item--read' : ''} ${high ? 'app-notif-item--priority' : ''}"
          data-notif-id="${n.id}" role="listitem" tabindex="0">
        <span class="app-notif-item__dot" aria-hidden="true"></span>
        <div class="app-notif-item__content">
          <p class="app-notif-item__title">${n.title}</p>
          <p class="app-notif-item__body">${n.body}</p>
        </div>
        <button type="button" class="app-notif-item__snooze" data-snooze="${n.id}"
                aria-label="${_t('notif.snooze', null, 'Recordar mañana')}">⏱</button>
      </li>`;
    }).join('');
    list.querySelectorAll('.app-notif-item').forEach((el, i) => {
      const notif = _notifications[i];
      const open = () => {
        NotificationService.markRead(notif);
        _notifOpen = false;
        _ensureNotifPanel().hidden = true;
        _updateNotifBadge();
        _navigateItem(notif);
      };
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-snooze]')) return;
        open();
      });
      el.querySelector('[data-snooze]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        NotificationService.snooze(notif, 24);
        void _refreshNotifications();
      });
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          if (ev.target.closest('[data-snooze]')) return;
          ev.preventDefault();
          open();
        }
      });
    });
  }

  function _updateNotifBadge() {
    const unread = NotificationService.getUnreadCount(_notifications);
    document.querySelectorAll('[data-notifications-btn]').forEach(btn => {
      let badge = btn.querySelector('.icon-btn__badge');
      if (unread > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'icon-btn__badge';
          badge.setAttribute('aria-hidden', 'true');
          btn.appendChild(badge);
        }
        badge.textContent = unread > 9 ? '9+' : String(unread);
        badge.hidden = false;
      } else if (badge) {
        badge.hidden = true;
      }
    });
  }

  async function _refreshNotifications() {
    if (typeof NotificationService === 'undefined') return;
    _notifications = await NotificationService.buildNotifications();
    _renderNotifList();
    _updateNotifBadge();
    if (typeof PushNotificationService !== 'undefined') {
      PushNotificationService.syncUsefulReminders(_notifications);
    }
  }

  function _toggleNotifPanel() {
    const panel = _ensureNotifPanel();
    _notifOpen = !_notifOpen;
    panel.hidden = !_notifOpen;
    if (_notifOpen) void _refreshNotifications();
  }

  function _bindNotifications() {
    document.querySelectorAll('.topbar__actions .icon-btn[aria-label], [data-notifications-btn]').forEach(btn => {
      const label = btn.getAttribute('aria-label') || '';
      const isNotif = btn.hasAttribute('data-notifications-btn')
        || /notific/i.test(label)
        || (typeof I18n !== 'undefined' && label === I18n.t('shell.notifications'));
      if (!isNotif || btn.dataset.notifBound) return;
      btn.dataset.notifBound = '1';
      btn.setAttribute('data-notifications-btn', '');
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        _toggleNotifPanel();
      });
    });
    document.addEventListener('click', e => {
      if (!_notifOpen) return;
      const panel = document.getElementById('app-notif-panel');
      const btn = e.target.closest('[data-notifications-btn]');
      if (panel && !panel.contains(e.target) && !btn) {
        _notifOpen = false;
        panel.hidden = true;
      }
    });
    window.addEventListener(NotificationService?.EVENT || 'in4mind-notifications-updated', () => {
      void _refreshNotifications();
    });
    if (typeof UserProfileService !== 'undefined') {
      window.addEventListener(UserProfileService.EVENT, () => void _refreshNotifications());
    }
  }

  // ── Búsqueda global ──────────────────────────────────────────

  function _ensureSearchModal() {
    let modal = document.getElementById('global-search-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'global-search-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="global-search-modal__backdrop" data-close-search></div>
      <div class="global-search-modal__dialog" role="dialog" aria-modal="true" aria-label="${_t('search.title', null, 'Búsqueda global')}">
        <div class="global-search-modal__input-wrap">
          <input type="search" id="global-search-input" class="global-search-modal__input"
                 placeholder="${_t('search.placeholder', null, 'Buscar cursos, lecciones, quizzes…')}"
                 autocomplete="off" />
          <kbd class="global-search-modal__kbd">Esc</kbd>
        </div>
        <div class="global-search-modal__results" id="global-search-results"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-close-search]')?.addEventListener('click', _closeSearch);
    const input = document.getElementById('global-search-input');
    let timer = null;
    input?.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => _renderSearchResults(input.value), 120);
    });
    input?.addEventListener('keydown', e => {
      if (e.key === 'Escape') _closeSearch();
    });
    return modal;
  }

  function _renderSearchResults(query) {
    const root = document.getElementById('global-search-results');
    if (!root || typeof GlobalSearchService === 'undefined') return;
    const q = (query || '').trim();
    if (q.length < 2) {
      root.innerHTML = `<p class="global-search-modal__hint">${_t('search.hint', null, 'Escribe al menos 2 caracteres. Atajo: / o Ctrl+K')}</p>`;
      return;
    }
    const results = GlobalSearchService.search(q);
    const groups = ['courses', 'lessons', 'quizzes', 'notes', 'projects', 'guided', 'help'];
    const typeMap = {
      courses: 'course', lessons: 'lesson', quizzes: 'quiz', help: 'help',
      notes: 'note', projects: 'project', guided: 'guided',
    };
    let html = '';
    groups.forEach(g => {
      const items = results[g];
      if (!items?.length) return;
      html += `<div class="global-search-group"><h3 class="global-search-group__title">${GlobalSearchService.groupLabel(typeMap[g])}</h3><ul role="list">`;
      items.forEach(item => {
        html += `<li class="global-search-item" data-search-item tabindex="0" role="listitem">
          <span class="global-search-item__title">${item.title}</span>
          <span class="global-search-item__sub">${item.subtitle || ''}</span>
        </li>`;
      });
      html += '</ul></div>';
    });
    root.innerHTML = html || `<p class="global-search-modal__hint">${_t('common.noResults', null, 'Sin resultados.')}</p>`;
    // Flatten in the same group order used above
    const flat = groups.flatMap(g => results[g] || []);
    root.querySelectorAll('[data-search-item]').forEach((el, i) => {
      const item = flat[i];
      if (!item) return;
      const go = () => { _closeSearch(); _navigateItem(item); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
      });
    });
  }

  function _openSearch(prefill = '') {
    const modal = _ensureSearchModal();
    modal.hidden = false;
    _searchOpen = true;
    const input = document.getElementById('global-search-input');
    if (input) {
      input.value = prefill;
      _renderSearchResults(prefill);
      setTimeout(() => input.focus(), 50);
    }
  }

  function _closeSearch() {
    const modal = document.getElementById('global-search-modal');
    if (modal) modal.hidden = true;
    _searchOpen = false;
  }

  function _bindGlobalSearch() {
    document.addEventListener('keydown', e => {
      if ((e.key === '/' && !/input|textarea/i.test(e.target.tagName)) || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        _openSearch();
      }
    });
    document.querySelectorAll('#search-input, .search-bar__input').forEach(input => {
      if (input.dataset.globalSearchBound) return;
      if (input.dataset.helpAssistant) return;
      input.dataset.globalSearchBound = '1';
      input.addEventListener('focus', () => {
        if (typeof GlobalSearchService !== 'undefined') _openSearch(input.value);
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.target.value.trim().length >= 2) {
          e.preventDefault();
          _openSearch(e.target.value);
        }
      });
    });
  }

  // ── Bottom navigation (móvil) ────────────────────────────────

  function _renderBottomNav(activeId) {
    if (!document.querySelector('.dashboard, .main-area')) return;
    let nav = document.getElementById('app-bottom-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'app-bottom-nav';
      nav.className = 'app-bottom-nav';
      nav.setAttribute('aria-label', _t('shell.mainNav', null, 'Navegación principal'));
      document.body.appendChild(nav);
    }
    const items = [
      { id: 'home', label: _t('nav.home', null, 'Inicio'), icon: 'home', href: 'dashboard.html' },
      { id: 'tutorials', label: _t('nav.tutorials', null, 'Cursos'), icon: 'book', href: 'tutorial.html' },
      { id: 'quizzes', label: _t('nav.quizzes', null, 'Quizzes'), icon: 'quiz', href: 'quizzes.html' },
      { id: 'ai', label: _t('nav.ai', null, 'IA'), icon: 'bot', href: 'ai.html' },
      { id: 'profile', label: _t('shell.myProfile', null, 'Perfil'), icon: 'user', href: 'profile.html' },
    ];
    nav.innerHTML = items.map(it => `
      <a href="${it.href}" class="app-bottom-nav__item ${activeId === it.id ? 'app-bottom-nav__item--active' : ''}"
         ${activeId === it.id ? 'aria-current="page"' : ''}>
        ${typeof AppShell !== 'undefined' ? AppShell.navIcon(it.icon) : ''}
        <span>${it.label}</span>
      </a>`).join('');
  }

  // ── Onboarding ───────────────────────────────────────────────

  const ONBOARD_STEPS = [
    { sel: '#resume-grid, .resume-section', key: 'onboard.resume' },
    { sel: '#quick-actions-grid, .quick-actions-section', key: 'onboard.quick' },
    { sel: '#recommended-track, .recommended-section', key: 'onboard.recommend' },
    { sel: 'a[href="ai.html"], [data-nav="ai"]', key: 'onboard.ai' },
  ];

  function _startOnboarding() {
    if (localStorage.getItem(ONBOARD_KEY) === '1') return;
    if (!document.getElementById('resume-grid') && !document.querySelector('.quick-actions-section')) return;

    let step = 0;
    let overlay = document.getElementById('onboard-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'onboard-overlay';
      overlay.className = 'onboard-overlay';
      overlay.innerHTML = `
        <div class="onboard-card" role="dialog" aria-modal="true">
          <p class="onboard-card__step" id="onboard-step-label"></p>
          <h2 class="onboard-card__title" id="onboard-title"></h2>
          <p class="onboard-card__body" id="onboard-body"></p>
          <div class="onboard-card__actions">
            <button type="button" class="prof-btn" id="onboard-skip">${_t('onboard.skip', null, 'Omitir')}</button>
            <button type="button" class="prof-btn prof-btn--primary" id="onboard-next">${_t('onboard.next', null, 'Siguiente')}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.getElementById('onboard-skip')?.addEventListener('click', _finishOnboarding);
      document.getElementById('onboard-next')?.addEventListener('click', () => {
        step += 1;
        if (step >= ONBOARD_STEPS.length) _finishOnboarding();
        else _showOnboardStep(step);
      });
    }

    function _showOnboardStep(idx) {
      const s = ONBOARD_STEPS[idx];
      document.getElementById('onboard-step-label').textContent = _t('onboard.step', { n: idx + 1, total: ONBOARD_STEPS.length }, `Paso ${idx + 1} de ${ONBOARD_STEPS.length}`);
      document.getElementById('onboard-title').textContent = _t(`${s.key}Title`, null, '');
      document.getElementById('onboard-body').textContent = _t(`${s.key}Body`, null, '');
      document.querySelector(s.sel)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function _finishOnboarding() {
      localStorage.setItem(ONBOARD_KEY, '1');
      overlay?.remove();
    }

    overlay.hidden = false;
    _showOnboardStep(0);
  }

  // ── PWA ──────────────────────────────────────────────────────

  function _registerPWA() {
    if (!('serviceWorker' in navigator)) return;
    const isAppPage = /dashboard|tutorial|quizzes|ai|profile|help/.test(window.location.pathname);
    if (!isAppPage) return;
    navigator.serviceWorker.register('sw.js?v=20260817nobanners34').catch(() => {});
  }

  function _injectManifest() {
    if (document.querySelector('link[rel="manifest"]')) return;
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'manifest.json';
    document.head.appendChild(link);
  }

  // ── Init ───────────────────────────────────────────────────

  function init(activeNavId = null) {
    _activeNav = activeNavId;
    if (typeof AccessibilityService !== 'undefined') AccessibilityService.initEarly();
    if (typeof CookieConsent !== 'undefined') CookieConsent.init();
    _bindNotifications();
    _bindGlobalSearch();
    _renderBottomNav(activeNavId === 'home' ? 'home' : activeNavId);
    _injectManifest();
    _registerPWA();
    void _refreshNotifications();

    if (typeof ContentLoader !== 'undefined') void ContentLoader.load();

    if (activeNavId === 'home') {
      setTimeout(_startOnboarding, 800);
    }
  }

  return {
    init,
    refreshNotifications: _refreshNotifications,
    openSearch: _openSearch,
    closeSearch: _closeSearch,
  };

})();

if (typeof module !== 'undefined') module.exports = AppFeatures;


;/* --- src/js/services/GlobalChatService.js --- */
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


;/* --- src/js/controllers/GlobalChatController.js --- */
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
    const safeUrl = GlobalChatService.sanitizeInternalUrl(msg.attachment?.url);
    if (!safeUrl) {
      const fallback = document.createElement('p');
      fallback.className = 'gchat-msg__text';
      _appendRichText(fallback, msg.body || msg.attachment?.title || '');
      return fallback;
    }

    const card = document.createElement('a');
    card.className = 'gchat-quiz';
    card.href = safeUrl;
    card.rel = 'noopener';

    const icon = document.createElement('span');
    icon.className = 'gchat-quiz__icon';
    icon.innerHTML = _icon(ICONS.quiz, 20);

    const copy = document.createElement('span');
    copy.className = 'gchat-quiz__copy';

    const eyebrow = document.createElement('span');
    eyebrow.className = 'gchat-quiz__eyebrow';
    eyebrow.textContent = _t('chat.quizEyebrow', null, 'Reto de quiz');

    const title = document.createElement('span');
    title.className = 'gchat-quiz__title';
    title.textContent = _t('chat.quizCardTitle', { topic: msg.attachment.title || msg.body },
      `¡Resuelve este quiz sobre ${msg.attachment.title || msg.body}!`);

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

    if (msg.kind === 'quiz' && msg.attachment?.url) {
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

  function _quizUrl(quizId) {
    const base = window.location.href.replace(/[^/]*$/, '');
    const url = new URL('quizzes.html', base);
    url.searchParams.set('quiz', quizId);
    return url.toString();
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

  return { init, setSuppressed, isOpen: () => _open };

})();

if (typeof module !== 'undefined') module.exports = GlobalChatController;


;/* --- src/js/services/AppShell.js --- */
/**
 * IN4MIND — Utilidades compartidas del shell de la app
 */

'use strict';

const AppShell = (() => {

  const SESSION_KEYS = [
    'in4mind_user',
    'in4mind_open_course',
    'in4mind_open_quiz',
    'in4mind_open_destination',
    'in4mind_ai_recent',
    'in4mind_quiz_progress',
  ];

  const PROFILE_HREF = 'profile.html';
  const HELP_HREF = 'help.html';
  let _avatarBound = false;
  let _helpBound = false;

  function clearSession() {
    SESSION_KEYS.forEach(k => sessionStorage.removeItem(k));
    if (typeof SessionStore !== 'undefined') {
      const remembered = SessionStore.isRemembered();
      SessionStore.clear({ keepEmail: true, keepPassword: remembered });
    }
  }

  function logout() {
    if (typeof GlobalChatService !== 'undefined') {
      try {
        GlobalChatService.disconnect();
        GlobalChatService.resetAuth();
      } catch { /* ignore */ }
    }
    if (typeof AuthService !== 'undefined') {
      // Cierra también la sesión de Supabase; no se espera para no bloquear.
      Promise.resolve(AuthService.logout()).catch(() => {});
    }
    clearSession();
    window.location.replace('login.html');
  }

  function showToast(message, duration = 2600) {
    let el = document.getElementById('app-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'app-toast';
      el.className = 'app-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('app-toast--visible');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('app-toast--visible'), duration);
  }

  function _goToProfile() {
    navigateTo(PROFILE_HREF);
  }

  /**
   * Navegación con crossfade suave entre páginas de la app.
   * @param {string} href
   */
  function navigateTo(href) {
    if (!href) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      window.location.assign(href);
      return;
    }
    const main = document.querySelector('.main-area') || document.body;
    if (main.classList.contains('page-exit')) {
      window.location.assign(href);
      return;
    }
    main.classList.add('page-exit');
    window.setTimeout(() => {
      window.location.assign(href);
    }, 220);
  }

  /** Delegación global: avatar → perfil (fase capture, antes que otros handlers). */
  function _bindAvatarNavigation() {
    if (_avatarBound) return;
    _avatarBound = true;

    document.addEventListener('click', e => {
      const avatar = e.target.closest('#avatar, a.avatar');
      if (!avatar) return;
      e.preventDefault();
      e.stopPropagation();
      _goToProfile();
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const avatar = e.target.closest('#avatar, a.avatar');
      if (!avatar) return;
      e.preventDefault();
      _goToProfile();
    });
  }

  /** Delegación global: icono de ayuda → centro de ayuda. */
  function _bindHelpNavigation() {
    if (_helpBound) return;
    _helpBound = true;

    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-help-link], a.icon-btn[href="help.html"], button.icon-btn[aria-label="Ayuda"], a[href="help.html"]');
      if (!trigger) return;
      if (trigger.closest('#sidebar')) return;
      e.preventDefault();
      navigateTo(HELP_HREF);
    }, true);
  }

  function setupAvatar() {
    _bindAvatarNavigation();
    _bindHelpNavigation();
    _bindAvatarNavigation();

    const $avatar = document.getElementById('avatar');
    if (!$avatar) return;

    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    const label = user?.name?.trim() || user?.email?.split('@')[0] ||
      (typeof I18n !== 'undefined' ? I18n.t('shell.user') : 'Usuario');

    if ($avatar.tagName !== 'A') {
      const link = document.createElement('a');
      link.id = 'avatar';
      link.className = $avatar.className || 'avatar';
      link.href = PROFILE_HREF;
      link.textContent = label.charAt(0).toUpperCase();
      $avatar.replaceWith(link);
      return setupAvatar();
    }

    $avatar.href = PROFILE_HREF;
    $avatar.textContent = label.charAt(0).toUpperCase();
    $avatar.setAttribute('aria-label', typeof I18n !== 'undefined'
      ? I18n.t('shell.profileLabel', { name: label })
      : `Mi perfil — ${label}`);
    $avatar.removeAttribute('title');
    $avatar.style.cursor = 'pointer';
  }

  function navIcon(iconId) {
    const ICONS = {
      home:      '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
      book:      '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
      notes:     '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
      projects:  '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
      guided:    '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
      quiz:      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      bot:       '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>',
      user:      '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>',
      more:      '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[iconId] || ''}</svg>`;
  }

  function renderNavItem(item, isActive = false) {
    const href = item.href || '';
    const inner = `${navIcon(item.icon)}<span>${item.label}</span>`;
    if (!href) {
      return `
        <li class="nav-item ${isActive ? 'nav-item--active' : ''}"
            data-nav="${item.id}" data-label="${item.label}" role="button" tabindex="0">
          ${inner}
        </li>`;
    }
    return `
      <li role="none">
        <a class="nav-item ${isActive ? 'nav-item--active' : ''}"
           href="${href}" data-nav="${item.id}" data-label="${item.label}">
          ${inner}
        </a>
      </li>`;
  }

  function renderSidebar(activeId) {
    const navMain   = DataService.getNavItems();
    const navFooter = DataService.getNavFooter();
    const $nav   = document.getElementById('sidebar-nav');
    const $footer = document.getElementById('sidebar-footer');
    if ($nav) {
      $nav.innerHTML = navMain.map(it => renderNavItem(it, activeId ? it.id === activeId : false)).join('');
    }
    if ($footer) {
      $footer.innerHTML = navFooter.map(it => renderNavItem(it, false)).join('');
    }
    SidebarController.init();
  }

  /**
   * Inicialización común de todas las páginas de la app.
   * @param {string|null} activeNavId — 'home' | 'tutorials' | 'quizzes' | 'ai' | null
   */
  function initPage(activeNavId = null) {
    _bindAvatarNavigation();
    _bindHelpNavigation();

    if (typeof ErrorReporter !== 'undefined') ErrorReporter.init();
    if (typeof ConnectivityService !== 'undefined') ConnectivityService.init();
    if (typeof AuthSessionSync !== 'undefined') AuthSessionSync.init();

    if (typeof UserProfileService !== 'undefined') {
      const user = UserProfileService.getCurrentUser();
      if (user?.email) {
        UserProfileService.mergeGuestIntoUser(user.email);
      }
      UserProfileService.migrateSessionQuizProgress();
    }

    renderSidebar(activeNavId);
    setupAvatar();

    if (typeof SettingsController !== 'undefined') {
      SettingsController.init();
    }

    if (typeof OtherMenuController !== 'undefined') {
      OtherMenuController.init();
    }

    if (typeof AppFeatures !== 'undefined') {
      AppFeatures.init(activeNavId);
    }

    const idle = typeof requestIdleCallback === 'function'
      ? requestIdleCallback
      : (cb) => setTimeout(cb, 280);

    // Decorativo / secundario: no bloquea el primer paint.
    idle(() => {
      if (typeof CursorSpotlight !== 'undefined') {
        CursorSpotlight.init({ intensity: 'app' });
      }
      if (typeof GlobalChatController !== 'undefined') {
        void GlobalChatController.init();
      }
      // Hidrata blobs desde la nube (notas/proyectos/intentos)
      void (async () => {
        try {
          if (typeof NotesService?.hydrateFromCloud === 'function') await NotesService.hydrateFromCloud();
          if (typeof ProjectsService?.hydrateFromCloud === 'function') await ProjectsService.hydrateFromCloud();
          if (typeof GuidedProjectsService?.hydrateFromCloud === 'function') await GuidedProjectsService.hydrateFromCloud();
          if (typeof QuizProgressService?.hydrateFromCloud === 'function') await QuizProgressService.hydrateFromCloud();
          if (typeof ConnectivityService !== 'undefined') await ConnectivityService.flushNow(false);
        } catch (err) {
          if (typeof ErrorReporter !== 'undefined') {
            ErrorReporter.capture('hydrate_fail', { message: err?.message || String(err) });
          }
        }
      })();
      if (typeof LazyScriptLoader !== 'undefined') {
        void LazyScriptLoader.loadPushOptional().catch(() => {});
      }
    });

    const main = document.querySelector('.main-area');
    if (main && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      requestAnimationFrame(() => main.classList.add('page-enter'));
    } else if (main) {
      main.classList.add('page-enter');
    }
  }

  return {
    clearSession,
    logout,
    setupAvatar,
    renderSidebar,
    initPage,
    navigateTo,
    showToast,
    navIcon,
    renderNavItem,
  };

})();

if (typeof document !== 'undefined') {
  const boot = () => {
    if (typeof AppShell !== 'undefined') {
      AppShell.setupAvatar();
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}

if (typeof module !== 'undefined') module.exports = AppShell;


;/* --- src/js/controllers/SidebarController.js --- */
/**
 * IN4MIND — SidebarController
 * Sidebar colapsable (navbar de iconos) en escritorio + drawer en móvil.
 * Adaptado a pantalla dividida (Snap / ventanas estrechas).
 */

'use strict';

const SidebarController = (() => {

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : '';
  }

  const STORAGE_KEY = 'in4mind_sidebar_collapsed';
  const DESKTOP_BP  = '(min-width: 901px)';
  const COMPACT_MAX = 1280;

  const NAV_ROUTES = {
    home:      'dashboard.html',
    tutorials: 'tutorial.html',
    notes:     'notes.html',
    projects:  'projects.html',
    guided:    'guided-projects.html',
    quizzes:   'quizzes.html',
    ai:        'ai.html',
  };

  let _desktopMq;
  let _coreBound = false;
  let _userPinnedExpanded = false;
  let _resizeTimer = null;

  function _isDesktop() {
    return _desktopMq?.matches ?? window.innerWidth > 900;
  }

  function _isCompactDesktop() {
    const w = window.innerWidth;
    return w > 900 && w <= COMPACT_MAX;
  }

  function _isCollapsed() {
    return document.documentElement.classList.contains('sidebar-collapsed');
  }

  function _navHref(el) {
    if (!el) return '';
    return el.getAttribute('href') || el.dataset.href || NAV_ROUTES[el.dataset.nav] || '';
  }

  function _syncNavLabels() {
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.label) return;
      const label = el.querySelector('span')?.textContent?.trim();
      if (label) el.dataset.label = label;
    });
  }

  function _updateToggleUi(collapsed) {
    const btn = document.getElementById('sidebar-collapse');
    if (btn) {
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.setAttribute('aria-label', collapsed ? _t('shell.expandMenu') : _t('shell.collapseMenu'));
    }
  }

  function _setCompactViewClass() {
    document.documentElement.classList.toggle('compact-view', _isCompactDesktop());
  }

  function _applyCollapsed(collapsed, { persist = true } = {}) {
    if (!_isDesktop()) {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.getElementById('sidebar')?.classList.remove('sidebar--collapsed');
      return;
    }

    document.documentElement.classList.toggle('sidebar-collapsed', collapsed);
    document.getElementById('sidebar')?.classList.toggle('sidebar--collapsed', collapsed);
    _updateToggleUi(collapsed);

    if (persist && !_isCompactDesktop()) {
      try {
        localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
      } catch (_) { /* ignore */ }
    }
  }

  function _restoreFromStorage() {
    try {
      if (_isDesktop() && localStorage.getItem(STORAGE_KEY) === '1') {
        _applyCollapsed(true, { persist: false });
      }
    } catch (_) { /* ignore */ }
  }

  function _syncLayoutForViewport() {
    _setCompactViewClass();

    if (!_isDesktop()) {
      closeMobile();
      return;
    }

    closeMobile();

    if (_isCompactDesktop()) {
      if (!_userPinnedExpanded && !_isCollapsed()) {
        _applyCollapsed(true, { persist: false });
      }
    } else {
      _userPinnedExpanded = false;
      _restoreFromStorage();
    }

    _updateToggleUi(_isCollapsed());
  }

  function toggleCollapse() {
    if (!_isDesktop()) return;

    const willExpand = _isCollapsed();

    if (_isCompactDesktop()) {
      _userPinnedExpanded = willExpand;
      _applyCollapsed(!willExpand, { persist: false });
    } else {
      _applyCollapsed(!_isCollapsed(), { persist: true });
    }
  }

  function openMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggle  = document.getElementById('menu-toggle');
    sidebar?.classList.add('is-open');
    overlay?.classList.add('is-visible');
    toggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggle  = document.getElementById('menu-toggle');
    sidebar?.classList.remove('is-open');
    overlay?.classList.remove('is-visible');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function _onBreakpointChange(e) {
    if (e.matches) {
      _syncLayoutForViewport();
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
      document.documentElement.classList.remove('compact-view');
      document.getElementById('sidebar')?.classList.remove('sidebar--collapsed');
      _userPinnedExpanded = false;
      closeMobile();
    }
  }

  function _onResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(_syncLayoutForViewport, 120);
  }

  function _bindCoreOnce() {
    if (_coreBound) return;
    _coreBound = true;

    document.getElementById('sidebar-collapse')?.addEventListener('click', () => {
      if (!_isDesktop()) {
        closeMobile();
        return;
      }
      toggleCollapse();
    });
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      if (sidebar?.classList.contains('is-open')) closeMobile();
      else openMobile();
    });
    document.getElementById('sidebar-overlay')?.addEventListener('click', closeMobile);

    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!_isDesktop() && document.getElementById('sidebar')?.classList.contains('is-open')) {
        closeMobile();
      }
    });

    _desktopMq.addEventListener('change', _onBreakpointChange);
    window.addEventListener('resize', _onResize);
  }

  function _setupNavDelegation() {
    if (document.documentElement.dataset.navBound === '1') return;
    document.documentElement.dataset.navBound = '1';

    document.addEventListener('click', e => {
      const item = e.target.closest('#sidebar a.nav-item[href], #sidebar .nav-item[data-href], #sidebar .nav-item[data-nav]');
      if (!item) return;

      if (item.dataset.nav === 'settings') return;

      const href = _navHref(item);
      if (!href) return;

      e.preventDefault();
      if (!_isDesktop()) closeMobile();
      if (typeof AppShell !== 'undefined' && AppShell.navigateTo) {
        AppShell.navigateTo(href);
      } else {
        window.location.href = href;
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest('#sidebar a.nav-item[href], #sidebar .nav-item[data-href], #sidebar .nav-item[data-nav]');
      if (!item) return;

      if (item.dataset.nav === 'settings') return;

      const href = _navHref(item);
      if (!href) return;

      e.preventDefault();
      if (!_isDesktop()) closeMobile();
      if (typeof AppShell !== 'undefined' && AppShell.navigateTo) {
        AppShell.navigateTo(href);
      } else {
        window.location.href = href;
      }
    });
  }

  function init() {
    _desktopMq = window.matchMedia(DESKTOP_BP);
    closeMobile();
    _syncNavLabels();
    _syncLayoutForViewport();
    _bindCoreOnce();
    _setupNavDelegation();
  }

  // Estado inicial antes de pintar (script al final del body)
  try {
    const w = window.innerWidth;
    if (w > 900 && w <= COMPACT_MAX) {
      document.documentElement.classList.add('sidebar-collapsed', 'compact-view');
    } else if (w > COMPACT_MAX && localStorage.getItem(STORAGE_KEY) === '1') {
      document.documentElement.classList.add('sidebar-collapsed');
    }
  } catch (_) { /* ignore */ }

  return { init, toggleCollapse, openMobile, closeMobile, isCollapsed: _isCollapsed };

})();

if (typeof module !== 'undefined') module.exports = SidebarController;


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
      if (!confirm(msg)) return;
      close();
      if (typeof AuthService !== 'undefined') await AuthService.logout();
      if (typeof AppShell !== 'undefined') AppShell.logout();
      else location.href = 'index.html';
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


;/* --- src/js/controllers/SettingsController.js --- */
'use strict';

/**
 * IN4MIND — Modal flotante de Ajustes (estilo banner Copilot + secciones IN4MIND)
 */
const SettingsController = (() => {

  const NOTIF_KEY = 'in4mind_notif_prefs';
  let _panel = 'general';
  let _bound = false;
  let _prevFocus = null;
  let _focusTrapHandler = null;

  function _t(k, p) {
    return typeof I18n !== 'undefined' ? I18n.t(k, p) : k;
  }

  function _icon(name) {
    const icons = {
      general: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
      account: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      notifications: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
      appearance: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>',
      language: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>',
      privacy: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    };
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || ''}</svg>`;
  }

  function _navItems() {
    return [
      { id: 'general', icon: 'general', label: _t('settingsModal.navGeneral') },
      { id: 'account', icon: 'account', label: _t('settingsModal.navAccount') },
      { id: 'notifications', icon: 'notifications', label: _t('settingsModal.navNotifications') },
      { id: 'appearance', icon: 'appearance', label: _t('settingsModal.navAppearance') },
      { id: 'language', icon: 'language', label: _t('settingsModal.navLanguage') },
      { id: 'accessibility', icon: 'appearance', label: _t('settingsModal.navAccessibility', null, 'Accesibilidad') },
      { id: 'privacy', icon: 'privacy', label: _t('settingsModal.navPrivacy') },
    ];
  }

  function _getNotifPrefs() {
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function _saveNotifPrefs(prefs) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs));
  }

  function _themePreference() {
    if (typeof ThemeController !== 'undefined' && ThemeController.getPreference) {
      return ThemeController.getPreference();
    }
    const saved = localStorage.getItem('in4mind_theme');
    if (saved === 'system') return 'system';
    return saved === 'dark' ? 'dark' : 'light';
  }

  function _syncThemeCards(pref) {
    const preference = pref || _themePreference();
    document.querySelectorAll('#settings-overlay [data-theme-pref]').forEach((b) => {
      const active = b.dataset.themePref === preference;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
  }

  function _isProfilePage() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return /(?:^|\/)profile\.html$/i.test(path) || /\/profile\/?$/i.test(path);
  }

  function _resetModalState() {
    document.body.classList.remove('settings-modal-open');
    document.documentElement.classList.remove('settings-modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'settings-overlay') el.removeAttribute('inert');
    });
    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.hidden = true;
    }
    _deactivateFocusTrap();
    _prevFocus = null;
  }

  function _ensureOverlay() {
    let overlay = document.getElementById('settings-overlay');
    if (!overlay) {
      _buildModal();
      overlay = document.getElementById('settings-overlay');
    }
    if (overlay) document.body.appendChild(overlay);
    return overlay;
  }

  function _buildModal() {
    if (document.getElementById('settings-overlay')) return;

    const navHtml = _navItems().map(n => `
      <button type="button" class="settings-nav__btn ${_panel === n.id ? 'is-active' : ''}"
              data-settings-panel="${n.id}">
        ${_icon(n.icon)}
        <span data-i18n="settingsModal.nav${n.id.charAt(0).toUpperCase() + n.id.slice(1)}">${n.label}</span>
      </button>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'settings-overlay';
    overlay.hidden = true;
    overlay.setAttribute('role', 'presentation');
    overlay.innerHTML = `
      <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <header class="settings-modal__header">
          <h2 class="settings-modal__title" id="settings-modal-title" data-i18n="settingsModal.title">Ajustes</h2>
          <button type="button" class="settings-modal__close" id="settings-close" aria-label="Cerrar" data-i18n-aria="settingsModal.close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <div class="settings-modal__body">
          <nav class="settings-modal__nav" aria-label="Secciones de ajustes" data-i18n-aria="settingsModal.navAria">${navHtml}</nav>
          <div class="settings-modal__content" id="settings-panels"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  function _renderPanels() {
    const wrap = document.getElementById('settings-panels');
    if (!wrap) return;

    const user = typeof UserProfileService !== 'undefined'
      ? UserProfileService.getCurrentUser()
      : null;
    const name = user?.name?.trim() || _t('shell.user');
    const email = user?.email || '—';
    const initial = name.charAt(0).toUpperCase();
    const pref = _themePreference();
    const notif = _getNotifPrefs();
    const emailOn = notif.email !== false;
    const pushOn = notif.push !== false;

    wrap.innerHTML = `
      <section class="settings-panel ${_panel === 'general' ? 'is-active' : ''}" data-panel="general">
        <h3 class="settings-panel__title" data-i18n="settingsModal.generalTitle">General</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.generalSub">Preferencias generales de IN4MIND: idioma, tema y ayuda.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.about">Acerca de IN4MIND</p>
            <p class="settings-row__hint" data-i18n="settingsModal.aboutHint">Plataforma educativa de tecnología.</p>
          </div>
          <a class="settings-row__action" href="help.html" data-i18n="settingsModal.viewHelp">Ver ayuda →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.version">Versión</p>
          </div>
          <span class="settings-row__value">in4mind.2026.07</span>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.weeklyGoals">Metas semanales</p>
            <p class="settings-row__hint" data-i18n="settingsModal.weeklyGoalsHint">Lecciones y quizzes por semana.</p>
          </div>
          <div class="settings-goals-inputs">
            <label><span data-i18n="analytics.weeklyLessons">Lecciones</span>
              <input type="number" id="settings-goal-lessons" min="1" max="20" value="2"></label>
            <label><span data-i18n="analytics.weeklyQuizzes">Quizzes</span>
              <input type="number" id="settings-goal-quizzes" min="1" max="20" value="1"></label>
          </div>
        </div>
        <button type="button" class="settings-btn" id="settings-reset-onboard" data-i18n="settingsModal.resetOnboard">Repetir tour de bienvenida</button>
      </section>

      <section class="settings-panel ${_panel === 'account' ? 'is-active' : ''}" data-panel="account">
        <h3 class="settings-panel__title" data-i18n="settingsModal.accountTitle">Cuenta</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.accountSub">Información de tu perfil y sesión.</p>
        <div class="settings-account__head">
          <div class="settings-account__avatar" id="settings-avatar">${initial}</div>
          <div>
            <p class="settings-account__name" id="settings-name">${name}</p>
            <p class="settings-account__email" id="settings-email">${email}</p>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.editName">Nombre</p>
          </div>
          <div class="settings-row__inline">
            <input type="text" class="settings-input" id="settings-edit-name" value="${name}" maxlength="60">
            <button type="button" class="settings-btn settings-btn--primary" id="settings-save-name" data-i18n="settingsModal.saveName">Guardar</button>
          </div>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.profile">Mi perfil</p>
            <p class="settings-row__hint" data-i18n="settingsModal.profileHint">Guardados, favoritos, quizzes y certificaciones.</p>
          </div>
          <a class="settings-row__action" href="profile.html" data-settings-go-profile data-i18n="settingsModal.openProfile">Abrir →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="profile.logout">Cerrar sesión</p>
          </div>
          <button type="button" class="settings-btn settings-btn--danger" id="settings-logout" data-i18n="profile.logout">Cerrar sesión</button>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'notifications' ? 'is-active' : ''}" data-panel="notifications">
        <h3 class="settings-panel__title" data-i18n="settingsModal.notifTitle">Notificaciones</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.notifSub">Elige cómo quieres recibir avisos.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.emailNotif">Notificaciones por correo</p>
            <p class="settings-row__hint" data-i18n="settingsModal.emailNotifHint">Resumen de progreso y certificaciones.</p>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="settings-notif-email" ${emailOn ? 'checked' : ''}>
            <span class="settings-toggle__track"></span>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.pushNotif">Notificaciones en la app</p>
            <p class="settings-row__hint" data-i18n="settingsModal.pushNotifHint">Recordatorios de lecciones y quizzes.</p>
          </div>
          <label class="settings-toggle">
            <input type="checkbox" id="settings-notif-push" ${pushOn ? 'checked' : ''}>
            <span class="settings-toggle__track"></span>
          </label>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'appearance' ? 'is-active' : ''}" data-panel="appearance">
        <h3 class="settings-panel__title" data-i18n="settingsModal.appearanceTitle">Apariencia</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.appearanceSub">Personaliza el aspecto visual de IN4MIND.</p>
        <div class="settings-appearance__hero">
          <div class="settings-appearance__bulb-wrap">
            <div class="settings-appearance__bulb-glow"></div>
            <div id="settings-bulb-slot"></div>
          </div>
          <div class="settings-appearance__intro">
            <h3 data-i18n="settingsModal.bulbTitle">Diseño IN4MIND</h3>
            <p data-i18n="settingsModal.bulbSub">El foco con circuito representa ideas, tecnología y claridad mental.</p>
          </div>
        </div>
        <p class="settings-row__label" style="margin-bottom:10px" data-i18n="settingsModal.theme">Tema</p>
        <div class="settings-theme-grid" role="radiogroup" aria-label="Tema" data-i18n-aria="settingsModal.theme">
          <button type="button" class="settings-theme-card ${pref === 'light' ? 'is-active' : ''}" data-theme-pref="light" role="radio" aria-checked="${pref === 'light'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--light" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
            </div>
            <span class="settings-theme-card__label" data-i18n="settingsModal.themeLight">Claro</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'dark' ? 'is-active' : ''}" data-theme-pref="dark" role="radio" aria-checked="${pref === 'dark'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--dark" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label" data-i18n="settingsModal.themeDark">Oscuro</span>
          </button>
          <button type="button" class="settings-theme-card ${pref === 'system' ? 'is-active' : ''}" data-theme-pref="system" role="radio" aria-checked="${pref === 'system'}">
            <span class="settings-theme-card__check">✓</span>
            <div class="settings-theme-card__preview settings-theme-card__preview--system" aria-hidden="true">
              <span class="settings-theme-mock settings-theme-mock--light"></span>
              <span class="settings-theme-mock settings-theme-mock--dark"></span>
            </div>
            <span class="settings-theme-card__label" data-i18n="settingsModal.themeSystem">Sistema</span>
          </button>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'language' ? 'is-active' : ''}" data-panel="language">
        <h3 class="settings-panel__title" data-i18n="settingsModal.languageTitle">Idioma</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.languageSub">El idioma se aplica en toda la aplicación.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="profile.language">Idioma de la interfaz</p>
          </div>
          <div data-lang-switcher></div>
        </div>
      </section>

      <section class="settings-panel ${_panel === 'accessibility' ? 'is-active' : ''}" data-panel="accessibility">
        <h3 class="settings-panel__title" data-i18n="settingsModal.accessibilityTitle">Accesibilidad</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.accessibilitySub">Ajustes de lectura y movimiento.</p>
        <div id="settings-a11y-panel"></div>
      </section>

      <section class="settings-panel ${_panel === 'privacy' ? 'is-active' : ''}" data-panel="privacy">
        <h3 class="settings-panel__title" data-i18n="settingsModal.privacyTitle">Privacidad</h3>
        <p class="settings-panel__sub" data-i18n="settingsModal.privacySub">Documentos legales y datos de tu cuenta.</p>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.privacyPolicy">Política de privacidad</p>
          </div>
          <a class="settings-row__action" href="privacidad.html" data-i18n="settingsModal.read">Leer →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.cookies">Cookies</p>
          </div>
          <a class="settings-row__action" href="cookies.html" data-i18n="settingsModal.read">Leer →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="settingsModal.terms">Términos de uso</p>
          </div>
          <a class="settings-row__action" href="terminos.html" data-i18n="settingsModal.read">Leer →</a>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.exportData">Exportar mis datos</p>
            <p class="settings-row__hint" data-i18n="privacy.exportHint">Descarga JSON con tu progreso.</p>
          </div>
          <button type="button" class="settings-btn" id="settings-export-data" data-i18n="privacy.exportBtn">Exportar</button>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.importData">Restaurar datos</p>
            <p class="settings-row__hint" data-i18n="privacy.importHint">Importa un JSON exportado previamente.</p>
          </div>
          <label class="settings-btn" style="cursor:pointer">
            <span data-i18n="privacy.importBtn">Importar</span>
            <input type="file" id="settings-import-data" accept="application/json,.json" hidden>
          </label>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.clearAi">Borrar historial IA</p>
          </div>
          <button type="button" class="settings-btn" id="settings-clear-ai" data-i18n="privacy.clearAiBtn">Borrar</button>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="privacy.deleteAccount">Eliminar cuenta y datos</p>
          </div>
          <button type="button" class="settings-btn settings-btn--danger" id="settings-delete-account" data-i18n="privacy.deleteBtn">Eliminar</button>
        </div>
        <div class="settings-row">
          <div class="settings-row__text">
            <p class="settings-row__label" data-i18n="cert.verifyTitle">Verificar certificado</p>
          </div>
          <a class="settings-row__action" href="verify.html" data-i18n="cert.verifyBtn">Verificar →</a>
        </div>
      </section>`;

    if (typeof I18n !== 'undefined') I18n.applyDom(wrap);

    const bulbSlot = document.getElementById('settings-bulb-slot');
    if (bulbSlot && typeof In4mindBulb !== 'undefined') {
      bulbSlot.innerHTML = In4mindBulb.medium('settings-appearance-bulb');
    }

    if (typeof I18n !== 'undefined') {
      const langWrap = wrap.querySelector('[data-lang-switcher]');
      if (langWrap && !langWrap.querySelector('.lang-switcher')) {
        I18n.mountLanguageSwitcher(langWrap);
      }
    }

    if (typeof AccessibilityService !== 'undefined') {
      AccessibilityService.renderPanel(document.getElementById('settings-a11y-panel'));
    }

    if (typeof GamificationService !== 'undefined') {
      const g = GamificationService.getWeeklyProgress();
      const gl = document.getElementById('settings-goal-lessons');
      const gq = document.getElementById('settings-goal-quizzes');
      if (gl) gl.value = g.lessonGoal;
      if (gq) gq.value = g.quizGoal;
    }

    _bindPanelEvents();
  }

  function _saveWeeklyGoals() {
    const lessons = parseInt(document.getElementById('settings-goal-lessons')?.value, 10) || 2;
    const quizzes = parseInt(document.getElementById('settings-goal-quizzes')?.value, 10) || 1;
    if (typeof GamificationService !== 'undefined') {
      GamificationService.setWeeklyGoals(lessons, quizzes);
    }
  }

  function _bindPanelEvents() {
    document.getElementById('settings-notif-email')?.addEventListener('change', e => {
      const prefs = _getNotifPrefs();
      prefs.email = e.target.checked;
      _saveNotifPrefs(prefs);
    });
    document.getElementById('settings-notif-push')?.addEventListener('change', async e => {
      const prefs = _getNotifPrefs();
      prefs.push = e.target.checked;
      _saveNotifPrefs(prefs);
      if (e.target.checked && typeof PushNotificationService !== 'undefined') {
        await PushNotificationService.requestPermission();
      }
    });
    document.getElementById('settings-logout')?.addEventListener('click', async () => {
      const msg = typeof I18n !== 'undefined' ? I18n.t('profile.logoutConfirm') : '¿Cerrar sesión?';
      if (!confirm(msg)) return;
      close();
      if (typeof AuthService !== 'undefined') await AuthService.logout();
      if (typeof AppShell !== 'undefined') AppShell.logout();
    });
    document.getElementById('settings-save-name')?.addEventListener('click', async () => {
      const input = document.getElementById('settings-edit-name');
      if (!input || typeof AuthService === 'undefined') return;
      const result = await AuthService.updateDisplayName(input.value);
      if (result.ok) {
        const nameEl = document.getElementById('settings-name');
        const avEl = document.getElementById('settings-avatar');
        if (nameEl) nameEl.textContent = result.user.name;
        if (avEl) avEl.textContent = result.user.name.charAt(0).toUpperCase();
        if (typeof AppShell !== 'undefined') AppShell.setupAvatar();
      }
    });
    document.getElementById('settings-goal-lessons')?.addEventListener('change', _saveWeeklyGoals);
    document.getElementById('settings-goal-quizzes')?.addEventListener('change', _saveWeeklyGoals);
    document.getElementById('settings-reset-onboard')?.addEventListener('click', () => {
      localStorage.removeItem('in4mind_onboarding_done');
      alert(typeof I18n !== 'undefined' ? I18n.t('settingsModal.onboardReset') : 'Tour reiniciado.');
    });
    document.getElementById('settings-export-data')?.addEventListener('click', async () => {
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') DataExportService.downloadJson();
    });
    document.getElementById('settings-import-data')?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') {
        const result = await DataExportService.importFromFile(file);
        if (!result.ok) {
          alert(typeof I18n !== 'undefined' ? I18n.t('privacy.importFail') : 'No se pudo importar el archivo.');
        }
      }
      e.target.value = '';
    });
    document.getElementById('settings-clear-ai')?.addEventListener('click', async () => {
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') DataExportService.clearAiHistory();
    });
    document.getElementById('settings-delete-account')?.addEventListener('click', async () => {
      if (typeof LazyScriptLoader !== 'undefined') await LazyScriptLoader.loadPrivacyTools();
      if (typeof DataExportService !== 'undefined') DataExportService.deleteAccount();
    });
    document.querySelector('[data-settings-go-profile]')?.addEventListener('click', e => {
      if (_isProfilePage()) {
        e.preventDefault();
        close();
      }
    });
    document.querySelectorAll('[data-theme-pref]').forEach(btn => {
      btn.addEventListener('click', () => {
        const pref = btn.dataset.themePref;
        if (typeof ThemeController !== 'undefined' && ThemeController.setPreference) {
          ThemeController.setPreference(pref);
        }
        _syncThemeCards(pref);
      });
    });
  }

  function _setPanel(id) {
    _panel = id;
    document.querySelectorAll('.settings-nav__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.settingsPanel === id);
    });
    document.querySelectorAll('.settings-panel').forEach(p => {
      p.classList.toggle('is-active', p.dataset.panel === id);
    });
    if (id === 'appearance') {
      const slot = document.getElementById('settings-bulb-slot');
      if (slot && !slot.innerHTML && typeof In4mindBulb !== 'undefined') {
        slot.innerHTML = In4mindBulb.medium('settings-appearance-bulb');
      }
    }
    if (id === 'accessibility') {
      const a11y = document.getElementById('settings-a11y-panel');
      if (a11y && typeof AccessibilityService !== 'undefined' && !a11y.children.length) {
        AccessibilityService.renderPanel(a11y);
      }
    }
    if (id === 'language') {
      const langWrap = document.querySelector('#settings-panels [data-lang-switcher]');
      if (langWrap && typeof I18n !== 'undefined' && !langWrap.querySelector('.lang-switcher')) {
        I18n.mountLanguageSwitcher(langWrap);
      }
    }
  }

  function _lockBackground() {
    document.body.classList.add('settings-modal-open');
    document.documentElement.classList.add('settings-modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'settings-overlay') el.setAttribute('inert', '');
    });
  }

  function _unlockBackground() {
    document.body.classList.remove('settings-modal-open');
    document.documentElement.classList.remove('settings-modal-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    Array.from(document.body.children).forEach(el => {
      if (el.id !== 'settings-overlay') el.removeAttribute('inert');
    });
  }

  function _activateFocusTrap() {
    const modal = document.querySelector('#settings-overlay .settings-modal');
    if (!modal) return;

    _focusTrapHandler = e => {
      if (e.key !== 'Tab' || !document.getElementById('settings-overlay')?.classList.contains('is-open')) return;
      const focusable = modal.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  function _handleSettingsNav(e) {
    const settingsNav = e.target.closest('#sidebar .nav-item[data-nav="settings"], #sidebar-footer .nav-item[data-nav="settings"]');
    if (!settingsNav) return false;
    e.preventDefault();
    e.stopPropagation();
    open('general');
    if (typeof SidebarController !== 'undefined') SidebarController.closeMobile?.();
    return true;
  }

  function open(panel = 'general') {
    if (typeof OtherMenuController !== 'undefined') OtherMenuController.close();
    _ensureOverlay();
    _panel = panel;
    _renderPanels();
    document.querySelectorAll('.settings-nav__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.settingsPanel === panel);
    });
    const overlay = document.getElementById('settings-overlay');
    if (!overlay) return;

    _prevFocus = document.activeElement;
    overlay.hidden = false;
    overlay.classList.add('is-open');
    _lockBackground();
    _activateFocusTrap();
    if (typeof I18n !== 'undefined') I18n.applyDom(overlay);
    document.getElementById('settings-close')?.focus();
  }

  function close() {
    const overlay = document.getElementById('settings-overlay');
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

  function _bindGlobal() {
    if (_bound) return;
    _bound = true;

    document.addEventListener('click', e => {
      if (_handleSettingsNav(e)) return;
      if (e.target.closest('#settings-close')) {
        e.preventDefault();
        close();
        return;
      }
      if (e.target.id === 'settings-overlay') {
        close();
        return;
      }
      const navBtn = e.target.closest('[data-settings-panel]');
      if (navBtn) {
        _setPanel(navBtn.dataset.settingsPanel);
      }
    }, true);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('settings-overlay')?.classList.contains('is-open')) {
        close();
        return;
      }
      if (e.key !== 'Enter' && e.key !== ' ') return;
      _handleSettingsNav(e);
    }, true);

    window.addEventListener('pageshow', e => {
      if (e.persisted) _resetModalState();
    });

    window.addEventListener('beforeunload', () => {
      if (document.getElementById('settings-overlay')?.classList.contains('is-open')) {
        _resetModalState();
      }
    });

    window.addEventListener('in4mind-relocalize', () => {
      if (document.getElementById('settings-overlay')?.classList.contains('is-open')) {
        _renderPanels();
      }
    });

    window.addEventListener('in4mind-theme-change', (e) => {
      const pref = e.detail?.preference || _themePreference();
      _syncThemeCards(pref);
    });
  }

  function init() {
    if (!document.getElementById('sidebar')) return;
    _resetModalState();
    if (typeof ThemeController !== 'undefined' && ThemeController.mount) {
      ThemeController.mount();
    }
    _ensureOverlay();
    _bindGlobal();
    if (window.location.hash === '#settings') {
      open('general');
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  return { init, open, close };

})();

if (typeof module !== 'undefined') module.exports = SettingsController;

