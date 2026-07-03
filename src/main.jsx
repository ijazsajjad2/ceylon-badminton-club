import React from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted fonts (bundled into the build): guarantees the display
// typography renders everywhere, including the offline Android app where
// CDN-hosted fonts can never load.
import '@fontsource/bebas-neue/400.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initAnalytics } from './lib/analytics.js'
import './styles/global.css'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </React.StrictMode>
)

// Register the PWA service worker in production only (keeps dev/HMR clean).
// Auto-refresh once when a NEW version takes over, so visitors never get stuck
// on a stale cached build after a deploy. The first-ever claim on a fresh
// visit (no prior controller) must NOT reload — that would restart the page
// mid-boot for every new visitor.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let refreshing = false
  let firstClaim = !navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (firstClaim) { firstClaim = false; return }
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    // The SW calls skipWaiting()+clients.claim(), so an updated build takes
    // control right away and the handler above reloads to fresh assets.
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
