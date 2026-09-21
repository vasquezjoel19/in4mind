/**
 * IN4MIND — configuración de ESLint (flat config).
 *
 * El código del navegador son *scripts clásicos*, no módulos: cada archivo
 * declara su objeto en el ámbito global (`const DataService = (() => {…})()`)
 * y el resto de páginas lo usa por nombre. Por eso:
 *
 *   - `sourceType: 'script'` en todo src/ (con 'module' cada archivo sería su
 *     propio ámbito y `no-undef` marcaría cientos de falsos positivos).
 *   - Los símbolos que declara el propio proyecto se registran como globals.
 *     La lista se deriva del código para no tener que mantenerla a mano: al
 *     añadir un servicio nuevo, el linter se entera solo.
 *   - `no-redeclare` con `builtinGlobals: false`, porque cada módulo declara
 *     el mismo nombre que exporta como global.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const js = require('@eslint/js');
const globals = require('globals');

const APP = path.join(__dirname, 'in4mind', 'src', 'js');

/** Nombres que el proyecto publica en el ámbito global. */
function projectGlobals() {
  const found = new Set([
    // Vienen de fuera del árbol escaneado.
    'supabase',      // UMD de @supabase/supabase-js (CDN)
    '_sbClient',     // cliente creado en src/js/config/supabase.config.js
    'GroqConfig',    // generado en build
    'IN4MIND_ASSET_V',
  ]);

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'dist') walk(full);
        continue;
      }
      if (!entry.name.endsWith('.js')) continue;
      const code = fs.readFileSync(full, 'utf8');
      for (const m of code.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm)) found.add(m[1]);
      for (const m of code.matchAll(/^window\.([A-Za-z_$][\w$]*)\s*=/gm)) found.add(m[1]);
    }
  };
  walk(APP);

  return Object.fromEntries([...found].map(name => [name, 'writable']));
}

const BROWSER_GLOBALS = {
  ...globals.browser,
  ...projectGlobals(),
  // Los módulos terminan con `if (typeof module !== 'undefined') module.exports = X;`
  // para poder cargarse también desde los tests de Node.
  module: 'readonly',
  require: 'readonly',
  process: 'readonly',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'in4mind/node_modules/**',
      'in4mind/src/js/dist/**',
      'in4mind/src/js/config/groq.config.js',
    ],
  },

  // ── Navegador: la app ────────────────────────────────────────────────────
  {
    files: ['in4mind/src/**/*.js', 'in4mind/sw.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: { ...BROWSER_GLOBALS, ...globals.serviceworker },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-redeclare': ['error', { builtinGlobals: false }],
      // Cada módulo declara el nombre que exporta; no siempre lo usa dentro.
      'no-unused-vars': ['error', {
        args: 'after-used',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
        varsIgnorePattern: '^[A-Z]',
      }],
      // `catch { /* ignore */ }` es un patrón deliberado en todo el código.
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Deuda conocida: quedan 10 confirm/prompt/alert nativos en controladores
      // que ya tienen UiDialog disponible. Migrarlos cambia código síncrono por
      // asíncrono, así que va aparte; mientras tanto el linter los recuerda sin
      // bloquear el build.
      'no-alert': 'warn',
      // Seguridad: nada de evaluar cadenas ni de escribir en el documento.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-document-write': 'off',
    },
  },

  // ── Node: funciones serverless, scripts de build y tests ─────────────────
  {
    files: ['api/**/*.js', 'in4mind/scripts/**/*.js', 'in4mind/tests/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },

  // src/js/config/*: existen solo para publicar globales que consumen otras
  // páginas (`_sbClient`, `GroqConfig`). Dentro del archivo nadie los usa.
  {
    files: ['in4mind/src/js/config/*.js'],
    rules: { 'no-unused-vars': 'off' },
  },

  // Los tests declaran dobles del navegador en `global`.
  {
    files: ['in4mind/tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
