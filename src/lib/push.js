// Optional Web Push (session reminders) via OneSignal's free tier.
//
// Paste your OneSignal Web Push App ID below (or set VITE_ONESIGNAL_APP_ID at
// build time). Leave blank and this whole feature is inert — no SDK is
// fetched, no service worker is registered, nothing changes for visitors.
// See PUSH_NOTIFICATIONS_SETUP.md for the one-time OneSignal setup + how the
// actual "starts in 1 hour" reminders get sent (Supabase Edge Function).
//
// The OneSignal SDK is loaded from their CDN only when configured — it can't
// be self-hosted the way this project's fonts are, so it needs network access
// (unlike the rest of the site, this one feature won't work in the fully
// offline Android app build until OneSignal's own SDK adds that).
export const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || ''

export const hasPush = !!ONESIGNAL_APP_ID

let initPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.defer = true
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}

// Initializes the OneSignal SDK once. Safe to call repeatedly (subsequent
// calls reuse the same promise). Resolves to the global OneSignal instance,
// or null if unconfigured / the SDK fails to load (never throws).
export function initPush() {
  if (!hasPush) return Promise.resolve(null)
  if (initPromise) return initPromise
  initPromise = loadScript('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js')
    .then(
      () =>
        new Promise((resolve) => {
          window.OneSignalDeferred = window.OneSignalDeferred || []
          window.OneSignalDeferred.push(async (OneSignal) => {
            await OneSignal.init({
              appId: ONESIGNAL_APP_ID,
              allowLocalhostAsSecureOrigin: true,
              // This site already ships its own service worker (public/sw.js)
              // for offline support — OneSignal's push handling must be merged
              // into that SAME file (see PUSH_NOTIFICATIONS_SETUP.md) rather
              // than registering its default separate worker, or the two would
              // fight over the same scope and the offline shell would break.
              serviceWorkerParam: { scope: '/' },
              serviceWorkerPath: 'sw.js',
            })
            resolve(OneSignal)
          })
        })
    )
    .catch(() => null)
  return initPromise
}

// Prompts the visitor for notification permission and subscribes them.
// Returns true/false for whether they ended up subscribed.
export async function subscribeToReminders() {
  const OneSignal = await initPush()
  if (!OneSignal) return false
  try {
    await OneSignal.Notifications.requestPermission()
    return OneSignal.Notifications.permission
  } catch {
    return false
  }
}

export async function isSubscribed() {
  const OneSignal = await initPush()
  if (!OneSignal) return false
  try {
    return !!OneSignal.Notifications.permission
  } catch {
    return false
  }
}
