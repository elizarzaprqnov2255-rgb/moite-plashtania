// Makes the app work fully offline. Everything it needs is stored on the phone
// the first time it opens. Bump VERSION after changing any file.
const VERSION = 'plashtania-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Offline first: answer from the phone at once; if there is internet,
// quietly fetch a newer copy for next time.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(cache =>
      cache.match(req, { ignoreSearch: true }).then(hit => {
        const update = fetch(req)
          .then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; })
          .catch(() => null);
        if (hit) { e.waitUntil(update); return hit; }
        return update.then(res => res || cache.match('./index.html'));
      })
    )
  );
});
