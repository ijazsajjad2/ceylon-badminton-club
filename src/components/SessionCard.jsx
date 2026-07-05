import { useTranslation } from 'react-i18next'
import Reveal from './Reveal.jsx'
import CourtLines from './CourtLines.jsx'
import AnimatedShuttlecock from './AnimatedShuttlecock.jsx'
import NavIcon from './Icons.jsx'

// The two weekly practice sessions, shown as premium cards on a court-line
// backdrop with a shuttlecock rallying between them. The cards pulse softly on
// the same period as the shuttle so the glow lands as it arrives.
const RALLY_SECONDS = 9

export function SessionCard({ icon, title, time, note, side, onJoin }) {
  const { t } = useTranslation()
  return (
    <div className={`glass session-card session-${side} halftone`} style={{ animationDuration: `${RALLY_SECONDS}s` }}>
      <span className="session-ico" aria-hidden="true"><NavIcon name={icon} size={30} /></span>
      <h3 className="display session-title">{title}</h3>
      <div className="session-time mono">{time}</div>
      <div className="session-meta">
        <span><NavIcon name="pin" size={13} /> {t('sessions.venue')}</span>
        <span><NavIcon name="shuffle" size={13} /> {t('sessions.format')}</span>
      </div>
      <p className="session-note">{note}</p>
      {onJoin && (
        <button className="btn btn-gold btn-sm session-join" onClick={onJoin}>{t('sessions.joinSession')}</button>
      )}
    </div>
  )
}

export default function SessionsShowcase({ onJoin }) {
  const { t } = useTranslation()
  return (
    <Reveal>
      <div className="sessions-stage">
        <CourtLines opacity={0.09} parallax={18} />
        <AnimatedShuttlecock mode="rally" size={38} duration={RALLY_SECONDS} className="sessions-shuttle" />
        <div className="sessions-grid">
          <SessionCard
            side="a"
            icon="moon"
            title={t('sessions.wedTitle')}
            time={t('sessions.wedTime')}
            note={t('sessions.wedNote')}
            onJoin={onJoin}
          />
          <SessionCard
            side="b"
            icon="sunrise"
            title={t('sessions.satTitle')}
            time={t('sessions.satTime')}
            note={t('sessions.satNote')}
            onJoin={onJoin}
          />
        </div>
      </div>
    </Reveal>
  )
}
