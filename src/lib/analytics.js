// Privacy-friendly, cookie-free analytics shim.
//
// It targets Plausible (https://plausible.io) but stays a no-op until a domain
// is configured at build time via VITE_PLAUSIBLE_DOMAIN, so nothing is loaded
// or sent by default. No personal data is ever collected — only event names.

const DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN
const SRC = import.meta.env.VITE_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'

let loaded = false

// Inject the Plausible script once, only in the browser and only when enabled.
export function initAnalytics() {
  if (loaded || !DOMAIN || typeof document === 'undefined') return
  loaded = true
  window.plausible =
    window.plausible ||
    function () {
      ;(window.plausible.q = window.plausible.q || []).push(arguments)
    }
  const s = document.createElement('script')
  s.defer = true
  s.src = SRC
  s.setAttribute('data-domain', DOMAIN)
  document.head.appendChild(s)
}

// Record a custom event. Safe to call whether or not analytics is enabled.
export function track(event, props) {
  if (!DOMAIN || typeof window === 'undefined') return
  try {
    window.plausible?.(event, props ? { props } : undefined)
  } catch {
    /* never let analytics break the UI */
  }
}
