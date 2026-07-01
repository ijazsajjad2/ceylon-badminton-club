import React from 'react'
import { createRoot } from 'react-dom/client'
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
// Auto-refresh once when a new version takes over, so visitors never get stuck
// on a stale cached build after a deploy.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    // The SW calls skipWaiting()+clients.claim(), so a new build takes control
    // right away and the controllerchange handler above reloads to fresh assets.
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
