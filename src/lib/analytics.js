// Google Analytics 4 (gtag.js).
//
// GA4 Measurement IDs are public — they ship in the client bundle — so it's
// safe to keep the ID here. Paste yours below (or provide VITE_GA_ID at build
// time). Leave it blank to disable analytics entirely. Analytics only load in
// production builds, so local dev never sends hits.

// 👉 Your GA4 Measurement ID, e.g. 'G-XXXXXXXXXX'
const GA_MEASUREMENT_ID = ''

const GA_ID = import.meta.env.VITE_GA_ID || GA_MEASUREMENT_ID

let loaded = false

// Load gtag.js once and start a GA4 session. No-op until an ID is configured.
export function initAnalytics() {
  if (loaded || !GA_ID || typeof document === 'undefined') return
  if (import.meta.env.DEV) return // never track local development
  loaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  function gtag() { window.dataLayer.push(arguments) }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_ID)
}

// GA4 event names must be snake_case (letters, digits, underscores; <= 40 chars).
const toEventName = (name) =>
  String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40)

// Record a custom event. Safe to call whether or not analytics is enabled.
export function track(event, props) {
  if (!GA_ID || typeof window === 'undefined' || typeof window.gtag !== 'function') return
  try {
    window.gtag('event', toEventName(event), props || {})
  } catch {
    /* never let analytics break the UI */
  }
}
