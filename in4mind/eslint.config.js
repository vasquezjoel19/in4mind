/**
 * IN4MIND — ESLint (configuración plana, ESLint 9+).
 *
 * El proyecto son scripts clásicos concatenados en bundles, no módulos ES: los
 * servicios se declaran como `const X = (() => {...})()` de nivel superior y se
 * ven entre sí por el ámbito global. Por eso `sourceType: 'script'` y por eso
 * los globales del propio proyecto van declarados: sin ellos, `no-undef`
 * marcaría cada referencia cruzada legítima y el resultado sería inservible.
 *
 * El objetivo es cazar errores, no imponer estilo. El formato lo lleva
 * Prettier, así que aquí no hay reglas de comas, comillas ni indentación.
 */
'use strict';

const globals = require('globals');

/** Módulos del proyecto que viven en el ámbito global entre bundles. */
const PROYECTO = [
  'I18n', 'LOCALE_ES', 'LOCALE_EN', 'LOCALE_ZH',
  'CURRICULUM_EN', 'CURRICULUM_ZH', 'LEVELS_EN', 'LEVELS_ZH',
  'DataService', 'AuthService', 'SessionStore', 'UserProfileService',
  'QuizProgressService', 'QuizRandomizer', 'GamificationService',
  'GlobalChatService', 'GlobalSearchService', 'NotificationService',
  'PushNotificationService', 'AccessibilityService', 'DataExportService',
  'SpacedRepetitionService', 'LearningPathService', 'WeeklyShareService',
  'OfflineCourseService', 'ProjectReviewService', 'EmployabilityService',
  'EmployabilityStarters', 'GroqService', 'AIUserContext', 'AIEngine',
  'ShareService', 'AuthGuard', 'ErrorReporter', 'SyncOutboxService',
  'ConnectivityService', 'CloudBlobSync', 'AuthSessionSync', 'LazyScriptLoader',
  'OnboardingService', 'AdaptiveQuizEngine', 'AppShell', 'AppFeatures',
  'ExtendedCourses', 'CourseCurriculum', 'GuidedProjectsData', 'CareerPathsData',
  'courseFactory', 'In4mindBulb',
  // Motor adaptativo y mascota.
  'AdaptiveLearningService', 'MicroQuiz', 'ReinforcementNote', 'SkillGraph3D',
  'InfyMascot', 'MascotService', 'Infy',
  'ThemeController', 'SidebarController', 'OtherMenuController',
  'SettingsController', 'DashboardController', 'TutorialController',
  'QuizzesController', 'AuthController', 'OnboardingController',
  'ProfileController', 'EmployabilityController', 'AIChatController',
  'GlobalChatController',
  // Generados en build o cargados por CDN.
  '_sbClient', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'supabase', 'GROQ_CONFIG',
  /* Los módulos de `src/js` son de doble uso: se cargan como script clásico
     en el navegador y con `require` desde los tests, y por eso todos acaban
     con la guarda `typeof module !== 'undefined'`. Sin declararlo aquí, esa
     línea da un `no-undef` en cada archivo del proyecto. */
  'module',
];

const globalesProyecto = Object.fromEntries(PROYECTO.map((n) => [n, 'writable']));

module.exports = [
  {
    ignores: [
      'src/js/dist/**',        // generado
      'src/js/config/*.config.js',
      'node_modules/**',
      'dist-vite/**',
    ],
  },

  // Código del navegador.
  {
    files: ['src/**/*.js', '*.html'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, ...globalesProyecto },
    },
    rules: {
      /* Errores de verdad. */
      'no-undef': 'error',
      'no-unused-vars': ['warn', {
        args: 'none',
        // `const { password, ...resto } = user` se usa para descartar campos:
        // la variable no se lee y es intencionado.
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
      }],
      'no-implicit-globals': 'error',
      'no-shadow-restricted-names': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-unsafe-negation': 'error',
      'no-fallthrough': 'error',
      'valid-typeof': 'error',
      'use-isnan': 'error',
      eqeqeq: ['warn', 'smart'],

      /* Seguridad: nada de evaluar cadenas ni de inyectar HTML sin pensarlo. */
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      /* Los `catch {}` vacíos son deliberados en varios sitios (almacenamiento
         bloqueado, JSON corrupto), pero deben llevar comentario. */
      'no-empty': ['warn', { allowEmptyCatch: true }],

      'no-console': 'off',
    },
  },

  // Funciones serverless y scripts de build: Node, no navegador.
  {
    files: ['../api/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      'no-eval': 'error',
      'no-console': 'off',
    },
  },

  // El service worker tiene sus propios globales.
  {
    files: ['sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker, ...globals.browser },
    },
  },
];
