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
    },
    {
      id: 'data-analyst-jr',
      icon: 'chart',
      accent: '#22c55e',
      courseIds: ['excel', 'sql', 'powerbi'],
      guidedProjectIds: ['gp-python-csv', 'gp-sql-report'],
      projectHint: 'URL pública del dashboard Power BI / Excel Online / informe',
      projectExamples: ['Power BI publish', 'Excel Online', 'Looker Studio'],
    },
    {
      id: 'office365-automation',
      icon: 'briefcase',
      accent: '#a855f7',
      courseIds: ['powerapps', 'sharepoint', 'outlook', 'onedrive'],
      guidedProjectIds: [],
      projectHint: 'URL de la app Power Apps / sitio SharePoint / demo',
      projectExamples: ['Power Apps share link', 'SharePoint site', 'Flow demo'],
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
