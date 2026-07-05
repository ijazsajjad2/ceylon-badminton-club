import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal.jsx'
import { whatsappJoin } from '../lib/contact.js'
import { track } from '../lib/analytics.js'
import { firePuffConfetti } from '../lib/confetti.ts'

// Stable keys (language-independent) for state/analytics — display labels are
// looked up via t() so the <select> options and the composed WhatsApp message
// both follow the site's current language.
const LEVEL_KEYS = ['beginner', 'improver', 'intermediate', 'advanced']
const DAY_KEYS = ['wed', 'sat', 'either']

// Lightweight "request to join" form. It doesn't post anywhere — it composes a
// friendly, pre-filled WhatsApp message so a new player can reach the club in
// one tap, which matches how the club already recruits.
export default function JoinModal({ onClose }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(LEVEL_KEYS[0])
  const [day, setDay] = useState(DAY_KEYS[2])

  const levelLabel = (key) => t(`joinModal.level${key.charAt(0).toUpperCase()}${key.slice(1)}`)
  const dayLabel = (key) => t(`joinModal.day${key.charAt(0).toUpperCase()}${key.slice(1)}`)

  const message = useMemo(() => {
    const trimmed = name.trim()
    const key = trimmed ? 'messageWithName' : 'messageNoName'
    return t(`joinModal.${key}`, { name: trimmed, level: levelLabel(level), day: dayLabel(day) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, level, day, t])

  const send = (e) => {
    e.preventDefault()
    track('Join WhatsApp sent', { level, day })
    firePuffConfetti()
    whatsappJoin(message)
    onClose()
  }

  return (
    <Modal title={t('joinModal.title')} onClose={onClose}>
      <form className="join-form" onSubmit={send}>
        <label className="join-field">
          <span>{t('joinModal.nameLabel')} <span className="join-opt">{t('joinModal.nameOptional')}</span></span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('joinModal.namePlaceholder')}
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
          <button type="submit" className="btn btn-wa">📲 {t('joinModal.send')}</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>{t('joinModal.cancel')}</button>
        </div>
      </form>
    </Modal>
  )
}
