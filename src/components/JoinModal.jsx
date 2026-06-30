import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { whatsappShare } from '../lib/format.js'

const LEVELS = ['Beginner', 'Improver', 'Intermediate', 'Advanced']
const DAYS = ['Wednesday night (8–10 PM)', 'Saturday morning (8–10 AM)', 'Either works']

// Lightweight "request to join" form. It doesn't post anywhere — it composes a
// friendly, pre-filled WhatsApp message so a new player can reach the club in
// one tap, which matches how the club already recruits.
export default function JoinModal({ onClose }) {
  const [name, setName] = useState('')
  const [level, setLevel] = useState(LEVELS[0])
  const [day, setDay] = useState(DAYS[2])

  const message = useMemo(() => {
    const who = name.trim() ? `I'm ${name.trim()}. ` : ''
    return `🏸 Hi! ${who}I'd love to join the Ceylon Badminton Club in Riyadh.\n• Level: ${level}\n• Prefer: ${day}\nWhen's the next session?`
  }, [name, level, day])

  const send = (e) => {
    e.preventDefault()
    whatsappShare(message)
    onClose()
  }

  return (
    <Modal title="🏸 Ask to join the club" onClose={onClose}>
      <form className="join-form" onSubmit={send}>
        <label className="join-field">
          <span>Your name <span className="join-opt">(optional)</span></span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nuwan"
            autoFocus
          />
        </label>

        <label className="join-field">
          <span>Your level</span>
          <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="join-field">
          <span>Which session suits you?</span>
          <select className="select" value={day} onChange={(e) => setDay(e.target.value)}>
            {DAYS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </label>

        <div className="join-preview" aria-label="Message preview">
          <span className="join-preview-label">We'll send:</span>
          {message}
        </div>

        <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
          <button type="submit" className="btn btn-wa">📲 Open WhatsApp</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
