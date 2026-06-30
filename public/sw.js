// Conservative service worker for the Ceylon Badminton Club site.
// - HTML/navigations: network-first (always try fresh, fall back to cache offline)
// - hashed build assets (/assets/*) & images: cache-first (safe — Vite fingerprints them)
// Bump CACHE when the caching strategy changes to evict old entries.
const CACHE = 'cbc-v1'
const ASSET_RE = /\/assets\/|\.(?:css|js|woff2?|png|jpe?g|svg|webp|avif)$/

self.addEventListener('install', (e) => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  const isNav = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')

  if (isNav) {
    // Network-first for pages so content is never stale when online.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
          return res
        })
        .catch(() => caches.match(req).then((m) => m || caches.match('/')))
    )
    return
  }

  if (ASSET_RE.test(url.pathname)) {
    // Cache-first for fingerprinted assets.
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
            return res
          })
      )
    )
  }
})
