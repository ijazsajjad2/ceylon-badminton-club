import { useState } from 'react'
import Avatar from './Avatar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { setsWon } from '../lib/stats.js'
import { fmtDate } from '../lib/format.js'
import VideoThumb from './VideoThumb.jsx'

function Team({ ids, side, isWinner }) {
  const { playerById } = useApp()
  const players = ids.map((id) => playerById[id]).filter(Boolean)
  return (
    <div className={`team ${side} ${isWinner ? 'winner' : ''}`}>
      <div className="team-avatars">
        {players.map((p) => (
          <Avatar key={p.id} player={p} size={42} />
        ))}
      </div>
      <div className="team-names">
        {players.map((p) => (
          <span key={p.id} className="team-name">{p.name}</span>
        ))}
        {players.length === 1 && side && <span className="faint" style={{ fontSize: 11 }}>singles</span>}
      </div>
    </div>
  )
}

// Any signed-in member can confirm a recorded result. The ranking always
// includes every match regardless — this only marks the match itself.
function MatchConfirm({ match }) {
  const { user } = useAuth()
  const { confirmMatch } = useApp()
  const confirmedBy = match.confirmedBy || []
  const isConfirmed = confirmedBy.length > 0
  const iConfirmed = !!user && confirmedBy.includes(user.username)

  return (
    <span className="match-confirm-wrap">
      <span className={`badge ${isConfirmed ? 'badge-confirmed' : 'badge-pending'}`}>
        {isConfirmed ? `✅ Confirmed${confirmedBy.length > 1 ? ` ×${confirmedBy.length}` : ''}` : '⏳ Pending confirmation'}
      </span>
      {user && !iConfirmed && (
        <button
          type="button"
          className="btn btn-sm btn-ghost match-confirm-btn"
          onClick={(e) => { e.stopPropagation(); confirmMatch(match.id) }}
        >
          Confirm
        </button>
      )}
    </span>
  )
}

export default function MatchCard({ match, expandable = true, onPlayClip }) {
  const [open, setOpen] = useState(false)
  const [activeClip, setActiveClip] = useState(null)
  const { playerById, videosByMatch } = useApp()
  const clips = videosByMatch?.[match.id] || []
  const { a, b } = match.live ? { a: 0, b: 0 } : setsWon(match)
  const isDoubles = match.type === 'doubles'

  const liveScore = match.live && match.sets[0] ? match.sets[0] : null

  return (
    <div
      className={`glass hoverable ${match.live ? 'match-live' : ''}`}
      role={expandable ? 'button' : undefined}
      tabIndex={expandable ? 0 : undefined}
      onClick={() => expandable && setOpen((o) => !o)}
      onKeyDown={(e) => expandable && (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen((o) => !o))}
      aria-expanded={expandable ? open : undefined}
    >
      <div className={isDoubles ? 'match-doubles' : 'match-singles'}>
        <Team ids={match.teamA} side="left" isWinner={match.winner === 'A'} />

        <div className="vs-block">
          <div className="vs-badge">VS</div>
          {match.live ? (
            <div className="match-score mono">
              <span className="sa">{liveScore ? liveScore[0] : 0}</span>
              <span className="sep">·</span>
              <span className="sa">{liveScore ? liveScore[1] : 0}</span>
            </div>
          ) : (
            <div className="match-score mono">
              <span className="sa" style={{ color: match.winner === 'A' ? 'var(--gold-bright)' : undefined }}>{a}</span>
              <span className="sep">–</span>
              <span className="sa" style={{ color: match.winner === 'B' ? 'var(--gold-bright)' : undefined }}>{b}</span>
            </div>
          )}
          <div className="match-sets">
            {match.sets.map((s, i) => (
              <span key={i} className={`set-pill ${!match.live && ((match.winner === 'A' && s[0] > s[1]) || (match.winner === 'B' && s[1] > s[0])) ? 'won' : ''}`}>
                {s[0]}-{s[1]}
              </span>
            ))}
          </div>
        </div>

        <Team ids={match.teamB} side="right" isWinner={match.winner === 'B'} />
      </div>

      <div className="match-meta-row">
        <span className={`badge ${isDoubles ? 'badge-doubles' : 'badge-singles'}`}>{isDoubles ? 'Doubles' : 'Singles'}</span>
        {match.live && <span className="badge badge-live"><span className="live-dot" />LIVE</span>}
        <span>📅 {fmtDate(match.date)}</span>
        <span>🕓 {match.time}</span>
        <span>🏟 Court {match.court}</span>
        {clips.length > 0 && <span className="badge badge-doubles" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setOpen(true) }}>🎥 {clips.length} clip{clips.length > 1 ? 's' : ''}</span>}
        {!match.live && match.winner && <MatchConfirm match={match} />}
        {expandable && <span className="faint">{open ? '▲ hide' : '▼ scorecard'}</span>}
      </div>

      {expandable && (
        <div className={`scorecard ${open ? 'open' : ''}`}>
          <div className="scorecard-inner">
            {clips.length > 0 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
                {clips.map((v) => (
                  <div key={v.id} style={{ flexShrink: 0, width: 160, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onPlayClip?.(v) }}>
                    <VideoThumb video={v} width={320} onPlay={() => onPlayClip?.(v)} />
                    <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 5, fontWeight: 600, lineHeight: 1.3 }}>{v.title}</div>
                  </div>
                ))}
              </div>
            )}
            <table className="sc-table">
              <thead>
                <tr>
                  <th className="team-cell" style={{ textAlign: 'left' }}>Team</th>
                  {match.sets.map((_, i) => (
                    <th key={i}>Set {i + 1}</th>
                  ))}
                  <th>Sets</th>
                </tr>
              </thead>
              <tbody>
                <tr className={match.winner === 'A' ? 'win' : ''}>
                  <td className="team-cell">{match.teamA.map((id) => playerById[id]?.name).join(' & ')}{match.winner === 'A' && ' 🏆'}</td>
                  {match.sets.map((s, i) => (<td key={i}>{s[0]}</td>))}
                  <td>{a}</td>
                </tr>
                <tr className={match.winner === 'B' ? 'win' : ''}>
                  <td className="team-cell">{match.teamB.map((id) => playerById[id]?.name).join(' & ')}{match.winner === 'B' && ' 🏆'}</td>
                  {match.sets.map((s, i) => (<td key={i}>{s[1]}</td>))}
                  <td>{b}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
