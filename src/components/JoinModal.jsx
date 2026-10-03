import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal.jsx'
import { whatsappJoin, HAS_CLUB_CONTACT } from '../lib/contact.js'
import { track } from '../lib/analytics.js'

// Stable keys (language-independent) for state/analytics — display labels are
// looked up via t() so the <select> options and the composed WhatsApp message
// both follow the site's current language.
const LEVEL_KEYS = ['beginner', 'improver', 'intermediate', 'advanced']
const DAY_KEYS = ['wed', 'sat', 'either']

// Lightweight "request to join" form. It doesn't post anywhere — it composes a
// friendly, pre-filled WhatsApp message so a new player can reach the club in
// one tap, which matches how the club already recruits.
export default function JoinModal({ onClose, preferredSession }) {
  const { t, i18n } = useTranslation()
  const ar = i18n.language === 'ar'
  const text = (en, arabic) => ar ? arabic : en
  const [copyStatus, setCopyStatus] = useState('')
  const [name, setName] = useState('')
  const [level, setLevel] = useState(LEVEL_KEYS[0])
  const [day, setDay] = useState(preferredSession?.day === 'Wed' ? 'wed' : preferredSession?.day === 'Sat' ? 'sat' : DAY_KEYS[2])

  const levelLabel = (key) => t(`joinModal.level${key.charAt(0).toUpperCase()}${key.slice(1)}`)
  const dayLabel = (key) => t(`joinModal.day${key.charAt(0).toUpperCase()}${key.slice(1)}`)

  const message = useMemo(() => {
    const trimmed = name.trim()
    const key = trimmed ? 'messageWithName' : 'messageNoName'
    const chosenDate = preferredSession && day === (preferredSession.day === 'Wed' ? 'wed' : 'sat') ? ` (\u2066${preferredSession.date}, ${preferredSession.time}\u2069)` : ''
    return t(`joinModal.${key}`, { name: trimmed, level: levelLabel(level), day: dayLabel(day) + chosenDate })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, level, day, t, preferredSession])

  const send = (e) => {
    e.preventDefault()
    track('Join WhatsApp opened', { level, day })
    whatsappJoin(message)
    onClose()
  }

  return (
    <Modal title={t('joinModal.title')} onClose={onClose}>
      <form className="join-form" onSubmit={send}>
        <p className="join-explainer">{text('Choose your day and introduce yourself. Opening WhatsApp does not book a place; wait for the club to confirm.', 'اختر يومك وعرّف بنفسك. فتح واتساب لا يحجز مكاناً؛ انتظر تأكيد النادي.')}</p>
        {!HAS_CLUB_CONTACT && <p className="join-contact-note" role="status">{text('Share this message with a club organiser you know. You can also copy it and send it using your preferred messaging app.', 'شارك هذه الرسالة مع منظم تعرفه في النادي. يمكنك نسخها وإرسالها عبر تطبيق المراسلة المفضل لديك.')}</p>}
        <label className="join-field">
          <span>{t('joinModal.nameLabel')} <span className="join-opt">{t('joinModal.nameOptional')}</span></span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('joinModal.namePlaceholder')}
            maxLength={100}
            autoComplete="given-name"
            autoFocus
          />
        </label>

        <label className="join-field">
          <span>{t('joinModal.levelLabel')}</span>
          <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVEL_KEYS.map((k) => (
              <option key={k} value={k}>{levelLabel(k)}</option>
            ))}
          </select>
        </label>

        <label className="join-field">
          <span>{t('joinModal.dayLabel')}</span>
          <select className="select" value={day} onChange={(e) => setDay(e.target.value)}>
            {DAY_KEYS.map((k) => (
              <option key={k} value={k}>{dayLabel(k)}</option>
            ))}
          </select>
        </label>

        <div className="join-preview" aria-label="Message preview">
          <span className="join-preview-label">{t('joinModal.previewLabel')}</span>
          {message}
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
          <button type="submit" className="btn btn-wa">{HAS_CLUB_CONTACT ? text('Continue to WhatsApp ↗', 'متابعة إلى واتساب ↗') : text('Share on WhatsApp ↗', 'مشاركة عبر واتساب ↗')}</button>
          <button type="button" className="btn btn-ghost" onClick={async () => { try { await navigator.clipboard.writeText(message); setCopyStatus(text('Message copied. Share it with your organiser.', 'تم نسخ الرسالة. شاركها مع المنظم.')) } catch { setCopyStatus(text('Select and copy the message above.', 'حدد الرسالة أعلاه وانسخها.')) } }}>{text('Copy message', 'نسخ الرسالة')}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('joinModal.cancel')}</button>
        </div>
        <p role="status" className="join-explainer">{copyStatus}</p>
      </form>
    </Modal>
  )
}
