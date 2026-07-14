'use strict';

const LearningPathsData = (() => {

  const PATHS = [
    {
      id: 'web-dev',
      icon: 'globe',
      courseIds: ['html', 'css', 'javascript'],
      category: 'web',
    },
    {
      id: 'programming',
      icon: 'code',
      courseIds: ['python', 'javascript', 'sql'],
      category: 'programming',
    },
    {
      id: 'office',
      icon: 'briefcase',
      courseIds: ['excel', 'powerpoint'],
      category: 'office',
    },
    {
      id: 'design',
      icon: 'palette',
      courseIds: ['canvas', 'figma'],
      category: 'design',
    },
    {
      id: 'devops',
      icon: 'git',
      courseIds: ['github', 'cybersecurity'],
      category: 'tools',
    },
  ];

  function getPaths() {
    return PATHS.map(path => ({
      ...path,
      title: typeof I18n !== 'undefined' ? I18n.t(`paths.${path.id}.title`) : path.id,
      desc: typeof I18n !== 'undefined' ? I18n.t(`paths.${path.id}.desc`) : '',
    }));
  }

  function getPathById(id) {
    return getPaths().find(p => p.id === id) || null;
  }

  return { getPaths, getPathById, PATHS };

})();

if (typeof module !== 'undefined') module.exports = LearningPathsData;
