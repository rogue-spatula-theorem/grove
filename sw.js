/* ============================================================
   Grove Service Worker — v4
   Strategy:
     - HTML / navigations: network-first, fall back to cache
       (ensures a fresh index.html wins on every online load)
     - Other GET assets: cache-first, populate on miss
     - Install uses `cache: 'reload'` to bypass HTTP cache and
       pull authoritative copies from the network.
     - skipWaiting + clients.claim so an updated SW takes over
       the next time the PWA is opened (no manual refresh needed
       once a previous SW version has registered this one).
   ============================================================ */
const CACHE = 'grove-v4';
const SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache: 'reload' forces a bypass of the HTTP cache so we
    // never install stale assets on first run.
    await Promise.all(
      SHELL.map(url =>
        fetch(new Request(url, { cache: 'reload' }))
          .then(res => res && res.ok ? cache.put(url, res) : null)
          .catch(() => null)
      )
    );
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isHTMLRequest(req) {
  if (req.mode === 'navigate') return true;
  const accept = req.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Network-first for HTML / navigations — so fresh index.html wins
  if (isHTMLRequest(req)) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        if (fresh && fresh.ok) {
          const clone = fresh.clone();
          caches.open(CACHE).then(c => c.put('./index.html', clone)).catch(() => {});
        }
        return fresh;
      } catch (err) {
        const cached = await caches.match('./index.html');
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Cache-first for everything else
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
      }
      return res;
    } catch (err) {
      return new Response('', { status: 504, statusText: 'Gateway Timeout' });
    }
  })());
});

// Allow the page to ping the SW and trigger an immediate activation
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
