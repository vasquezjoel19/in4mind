/**
 * Concatena el shell común (IIFEs) en un solo archivo para precarga / CI.
 * No reemplaza los <script> por página: es un artefacto opcional.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'src/js/dist');
const outFile = path.join(outDir, 'app-shell.bundle.js');

const FILES = [
  'src/js/services/SessionStore.js',
  'src/js/services/ErrorReporter.js',
  'src/js/services/SyncOutboxService.js',
  'src/js/services/ConnectivityService.js',
  'src/js/services/CloudBlobSync.js',
  'src/js/services/AuthSessionSync.js',
  'src/js/services/LazyScriptLoader.js',
  'src/js/services/ShareService.js',
  'src/js/services/DataService.js',
  'src/js/services/UserProfileService.js',
  'src/js/services/GamificationService.js',
  'src/js/services/NotificationService.js',
  'src/js/services/PushNotificationService.js',
  'src/js/services/AppShell.js',
];

fs.mkdirSync(outDir, { recursive: true });

const banner = `/*! IN4MIND app-shell bundle — generated ${new Date().toISOString()} */\n`;
const body = FILES.map((rel) => {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing shell file: ${rel}`);
  }
  return `\n;/* --- ${rel} --- */\n${fs.readFileSync(full, 'utf8')}\n`;
}).join('');

fs.writeFileSync(outFile, banner + body, 'utf8');
console.log(`Wrote ${path.relative(root, outFile)} (${Math.round(Buffer.byteLength(banner + body) / 1024)} KB)`);
