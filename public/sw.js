// Service worker: installable PWA + offline shell.
// Stale-while-revalidate for same-origin GETs; failed navigations fall back to
// the cached app shell, then the branded offline page. Bump CACHE to evict old
// entries when the caching strategy changes.
const CACHE = 'cbc-v2'
const OFFLINE_URL = '/offline.html'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL, '/'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return

  const isNav = req.mode === 'navigate'
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(async () => {
          if (cached) return cached
          if (isNav) {
            return (await caches.match('/')) || (await caches.match(OFFLINE_URL))
          }
          return Response.error()
        })
      return cached || network
    })
  )
})
