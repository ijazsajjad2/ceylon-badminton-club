import { useState } from 'react'

// Three-step orientation shown once per device on a member's first login.
// Kept as a simple centered card (not anchored spotlights) so it works at any
// viewport and can't break when the layout changes.
const STEPS = [
  {
    icon: '🔀',
    title: 'Mark yourself in',
    text: 'Playing this week? Open the Sessions tab and tap "I\'m Playing" — everyone sees who\'s coming, and teams are drawn randomly on court.',
  },
  {
    icon: '✅',
    title: 'Confirm results',
    text: 'Ijaz records the scores after each session. Any member can tap Confirm on a match to mark the result verified.',
  },
  {
    icon: '🏆',
    title: 'Climb the board',
    text: 'Every match counts toward your personal ranking — wins, points and streaks. Partners change every session, so it\'s all you.',
  },
]

const KEY = 'cbc.tourDone'

export default function WelcomeTour() {
  const [step, setStep] = useState(0)
  const [open, setOpen] = useState(() => {
    try { return !localStorage.getItem(KEY) } catch { return false }
  })

  if (!open) return null

  const finish = () => {
    try { localStorage.setItem(KEY, '1') } catch { /* private mode */ }
    setOpen(false)
  }
  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish())
  const s = STEPS[step]

  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-label="Welcome tour">
      <div className="glass tour-card">
        <span className="tour-icon" aria-hidden="true">{s.icon}</span>
        <div className="display tour-title">{s.title}</div>
        <p className="tour-text">{s.text}</p>
        <div className="tour-dots" aria-hidden="true">
          {STEPS.map((_, i) => <span key={i} className={`tour-dot ${i === step ? 'on' : ''}`} />)}
        </div>
        <div className="row" style={{ gap: 10, justifyContent: 'center', marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={finish}>Skip</button>
          <button className="btn btn-gold btn-sm" onClick={next}>
            {step < STEPS.length - 1 ? 'Next →' : "Let's go 🏸"}
          </button>
        </div>
      </div>
    </div>
  )
}
