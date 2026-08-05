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
