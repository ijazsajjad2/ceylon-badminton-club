import Reveal from './Reveal.jsx'

// Event / result card: date badge, title, meta chips, status. Used for the
// real upcoming practice sessions and recent match results (no invented data).
export default function EventCard({ dateBadge, title, meta = [], status, tone = 'default', delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <div className={`glass event-card event-${tone}`}>
        <div className="event-date display" aria-hidden="true">{dateBadge}</div>
        <div className="event-body">
          <div className="event-title">{title}</div>
          <div className="event-meta">
            {meta.map((m, i) => <span key={i}>{m}</span>)}
          </div>
        </div>
        {status && <span className={`event-status event-status-${tone}`}>{status}</span>}
      </div>
    </Reveal>
  )
}
