// Subir la versión invalida el precaché tras cada despliegue: si no, los
// usuarios que ya tienen el service worker instalado seguirían con el HTML
// anterior y no recibirían los scripts nuevos.
const CACHE_NAME = 'in4mind-v6';
const CONTENT_CACHE = 'in4mind-content-v1';

const PRECACHE = [
  './',
  './index.html',
  './login.html',
  './verify.html',
  './dashboard.html',
  './tutorial.html',
  './quizzes.html',
  './notes.html',
  './projects.html',
  './ai.html',
  './profile.html',
  './help.html',
  './manifest.json',
  './content/courses-manifest.json',
  './src/css/tokens.css',
  './src/css/base.css',
  './src/css/dashboard.css',
  './src/css/theme.css',
  './src/css/bulb-icon.css',
  './src/css/notes.css',
  './src/css/projects.css',
  './src/css/accessibility.css',
  './src/css/app-features.css',
  './src/img/brand/in4mind-logo.png',
  './src/img/brand/in4mind-logo-black.png',
  './src/img/brand/in4mind-logo-white.png',
  './src/img/brand/favicon-64.png',
  './src/js/a11y-boot.js',
  './src/js/components/In4mindBulb.js',
  './src/js/services/DataService.js',
  './src/js/services/AppShell.js',
  './src/js/services/ContentLoader.js',
];

function isCourseJsonRequest(url) {
  return url.pathname.includes('/content/') && url.pathname.endsWith('.json');
}

async function cacheFirstContent(request) {
  const cache = await caches.open(CONTENT_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached;
  }
}

async function networkFirstWithCache(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('offline');
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE).catch(() => {})),
      caches.open(CONTENT_CACHE).then((cache) =>
        cache.add('./content/courses-manifest.json').catch(() => {})
      ),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== CONTENT_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isCourseJsonRequest(url)) {
    event.respondWith(cacheFirstContent(event.request));
    return;
  }

  event.respondWith(networkFirstWithCache(event.request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_COURSE_JSON' && event.data.url) {
    event.waitUntil(
      caches.open(CONTENT_CACHE).then((cache) =>
        fetch(event.data.url)
          .then((res) => {
            if (res.ok) return cache.put(event.data.url, res);
          })
          .catch(() => {})
      )
    );
  }
});
