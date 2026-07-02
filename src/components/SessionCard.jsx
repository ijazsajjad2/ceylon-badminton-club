import Reveal from './Reveal.jsx'
import CourtLines from './CourtLines.jsx'
import AnimatedShuttlecock from './AnimatedShuttlecock.jsx'

// The two weekly practice sessions, shown as premium cards on a court-line
// backdrop with a shuttlecock rallying between them. The cards pulse softly on
// the same period as the shuttle so the glow lands as it arrives.
const RALLY_SECONDS = 9

export function SessionCard({ icon, title, time, note, side, onJoin }) {
  return (
    <div className={`glass session-card session-${side}`} style={{ animationDuration: `${RALLY_SECONDS}s` }}>
      <span className="session-ico" aria-hidden="true">{icon}</span>
      <h3 className="display session-title">{title}</h3>
      <div className="session-time mono">{time}</div>
      <div className="session-meta">
        <span>📍 Green Badminton Club</span>
        <span>🔀 Random doubles</span>
      </div>
      <p className="session-note">{note}</p>
      {onJoin && (
        <button className="btn btn-gold btn-sm session-join" onClick={onJoin}>Join this session</button>
      )}
    </div>
  )
}

export default function SessionsShowcase({ onJoin }) {
  return (
    <Reveal>
      <div className="sessions-stage">
        <CourtLines opacity={0.09} parallax={18} />
        <AnimatedShuttlecock mode="rally" size={38} duration={RALLY_SECONDS} className="sessions-shuttle" />
        <div className="sessions-grid">
          <SessionCard
            side="a"
            icon="🌙"
            title="Wednesday Night Doubles"
            time="8–10 PM"
            note="Mid-week rally under the lights — shake off the workday and get on court."
            onJoin={onJoin}
          />
          <SessionCard
            side="b"
            icon="🌅"
            title="Saturday Morning Doubles"
            time="8–10 AM"
            note="Weekend energy — fresh pairs, fast rallies and breakfast-earned bragging rights."
            onJoin={onJoin}
          />
        </div>
      </div>
    </Reveal>
  )
}
