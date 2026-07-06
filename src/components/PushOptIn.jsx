import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { hasPush, isSubscribed, subscribeToReminders } from '../lib/push.js'
import NavIcon from './Icons.jsx'
import Reveal from './Reveal.jsx'

// Renders nothing at all unless VITE_ONESIGNAL_APP_ID is configured (see
// PUSH_NOTIFICATIONS_SETUP.md) — inert by default, so this ships with zero
// visual or behavioral change until the club sets up their own OneSignal app.
export default function PushOptIn() {
  const { t } = useTranslation()
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!hasPush) return
    isSubscribed().then(setSubscribed)
  }, [])

  if (!hasPush) return null

  const enable = async () => {
    setBusy(true)
    const ok = await subscribeToReminders()
    setSubscribed(!!ok)
    setBusy(false)
  }

  return (
    <Reveal className="glass card-pad push-optin">
      <span className="eyebrow">{t('push.eyebrow')}</span>
      <h3 className="display push-optin-title">{t('push.title')}</h3>
      <p className="push-optin-desc">{t('push.desc')}</p>
      <button className={`btn ${subscribed ? 'btn-green' : 'btn-gold'}`} onClick={enable} disabled={busy || subscribed}>
        <NavIcon name={subscribed ? 'check' : 'clock'} size={16} />
        {subscribed ? t('push.enabled') : t('push.enable')}
      </button>
    </Reveal>
  )
}
