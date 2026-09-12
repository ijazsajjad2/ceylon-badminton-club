// Service worker: installable PWA + offline shell.
// Stale-while-revalidate for same-origin GETs; failed navigations fall back to
// the cached app shell, then the branded offline page. Bump CACHE to evict old
// entries when the caching strategy changes.
const CACHE = 'cbc-v4-operations'
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
      return isNav ? network : cached || network
    })
  )
})
self.addEventListener('push',event=>{
 let data={title:'Ceylon Badminton Club',body:'You have a club update.'}
 try{data={...data,...event.data.json()}}catch{}
 event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/icon-192.png',tag:data.id||'cbc-update',data:{url:'/'}}))
})
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window'}).then(windows=>{const open=windows.find(w=>w.url.startsWith(self.location.origin));return open?open.focus():self.clients.openWindow('/')}))})
