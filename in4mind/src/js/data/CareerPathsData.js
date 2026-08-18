/**
 * IN4MIND — Rutas Estrella "Ruta Empleable".
 * Outcome: proyecto real + certificado verificable + pitch/CV listo para aplicar.
 */
'use strict';

const CareerPathsData = (() => {

  const PATHS = [
    {
      id: 'web-junior',
      icon: 'globe',
      accent: '#38bdf8',
      courseIds: ['html', 'css', 'javascript', 'github'],
      guidedProjectIds: ['gp-html-landing', 'gp-css-card', 'gp-js-todo', 'gp-git-flow'],
      projectHint: 'https://github.com/tu-usuario/tu-repo  o  URL del deploy',
      projectExamples: ['GitHub repo', 'GitHub Pages', 'Netlify / Vercel'],
      readmeTemplate: `# Proyecto Web Junior — IN4MIND

## Descripción
Landing / app web junior desplegada en producción.

## Stack
- HTML, CSS, JavaScript
- Repo en GitHub + deploy (Pages / Vercel / Netlify)

## Cómo verlo
1. Abre la URL en vivo
2. Revisa el README y la estructura del repo

## Checklist de entrega
- [ ] URL en vivo pública
- [ ] Repo GitHub visible
- [ ] Responsive en móvil
`,
      submissionChecklist: [
        { id: 'live', labelKey: 'employable.req.web.live', fallback: 'URL en vivo pública (Pages / Vercel / Netlify)' },
        { id: 'repo', labelKey: 'employable.req.web.repo', fallback: 'Repo GitHub con código y README' },
        { id: 'responsive', labelKey: 'employable.req.web.responsive', fallback: 'Diseño responsive en móvil' },
        { id: 'semantic', labelKey: 'employable.req.web.semantic', fallback: 'HTML semántico y estilos organizados' },
      ],
    },
    {
      id: 'data-analyst-jr',
      icon: 'chart',
      accent: '#22c55e',
      courseIds: ['excel', 'sql', 'powerbi'],
      guidedProjectIds: ['gp-python-csv', 'gp-sql-report'],
      projectHint: 'URL pública del dashboard Power BI / Excel Online / informe',
      projectExamples: ['Power BI publish', 'Excel Online', 'Looker Studio'],
      readmeTemplate: `# Dashboard Analista Jr — IN4MIND

## Objetivo
Dashboard interactivo listo para compartir con reclutadores.

## Requisitos mínimos
- Al menos 3 visualizaciones interactivas
- 1 filtro global
- Enlace de vista pública

## Cómo acceder
Pega aquí el link de publicación (Power BI / Looker / Excel Online).
`,
      submissionChecklist: [
        { id: 'charts', labelKey: 'employable.req.data.charts', fallback: 'Al menos 3 gráficos interactivos' },
        { id: 'filter', labelKey: 'employable.req.data.filter', fallback: '1 filtro global funcional' },
        { id: 'public', labelKey: 'employable.req.data.public', fallback: 'Enlace de vista pública (sin login)' },
        { id: 'story', labelKey: 'employable.req.data.story', fallback: 'Narrativa clara: pregunta → insight → acción' },
      ],
    },
    {
      id: 'office365-automation',
      icon: 'briefcase',
      accent: '#a855f7',
      courseIds: ['powerapps', 'sharepoint', 'outlook', 'onedrive'],
      guidedProjectIds: [],
      projectHint: 'URL de la app Power Apps / sitio SharePoint / demo',
      projectExamples: ['Power Apps share link', 'SharePoint site', 'Flow demo'],
      readmeTemplate: `# Automatización Office 365 — IN4MIND

## Qué entregas
App Power Apps / flujo / sitio SharePoint demostrable.

## Acceso para revisión
1. Comparte el enlace con permiso de lectura
2. Incluye pasos cortos para probar la automatización

## Checklist
- [ ] App o flujo funcional
- [ ] Instrucciones de acceso
- [ ] Caso de uso de negocio claro
`,
      submissionChecklist: [
        { id: 'functional', labelKey: 'employable.req.office.functional', fallback: 'App / flujo funcional de punta a punta' },
        { id: 'access', labelKey: 'employable.req.office.access', fallback: 'Instrucciones de acceso (permiso de lectura)' },
        { id: 'usecase', labelKey: 'employable.req.office.usecase', fallback: 'Caso de uso de negocio documentado' },
        { id: 'share', labelKey: 'employable.req.office.share', fallback: 'Link compartible Power Apps / SharePoint / Flow' },
      ],
    },
  ];

  function _t(key, fallback) {
    if (typeof I18n !== 'undefined') {
      const out = I18n.t(key);
      if (out && out !== key) return out;
    }
    return fallback;
  }

  function getPaths() {
    return PATHS.map((path) => ({
      ...path,
      title: _t(`employable.paths.${path.id}.title`, path.id),
      desc: _t(`employable.paths.${path.id}.desc`, ''),
      tagline: _t(`employable.paths.${path.id}.tagline`, ''),
      submissionChecklist: (path.submissionChecklist || []).map((item) => ({
        ...item,
        label: _t(item.labelKey, item.fallback),
      })),
    }));
  }

  function getPathById(id) {
    return getPaths().find((p) => p.id === id) || null;
  }

  function getPathForCourse(courseId) {
    if (!courseId) return null;
    return getPaths().find((p) => (p.courseIds || []).includes(courseId)) || null;
  }

  return { PATHS, getPaths, getPathById, getPathForCourse };
})();

if (typeof module !== 'undefined') module.exports = CareerPathsData;
