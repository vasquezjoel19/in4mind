import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dev server estático + build opcional multi-página.
 * Las páginas HTML siguen usando <script> clásicos (IIFE).
 */
export default defineConfig({
  root: __dirname,
  publicDir: false,
  server: {
    port: 5173,
    open: '/dashboard.html',
  },
  build: {
    outDir: 'dist-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: path.resolve(__dirname, 'dashboard.html'),
        tutorial: path.resolve(__dirname, 'tutorial.html'),
        quizzes: path.resolve(__dirname, 'quizzes.html'),
        ai: path.resolve(__dirname, 'ai.html'),
        login: path.resolve(__dirname, 'login.html'),
        index: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
