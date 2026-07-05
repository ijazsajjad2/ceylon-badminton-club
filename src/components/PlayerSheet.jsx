import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import useFocusTrap from '../hooks/useFocusTrap.js'
import Avatar from './Avatar.jsx'
import MatchCard from './MatchCard.jsx'
import { computeStats } from '../lib/stats.js'
import { LEVELS } from '../data/players.js'
import MonthlyWinsChart from './charts/MonthlyWinsChart.tsx'

export default function PlayerSheet({ playerId, onClose }) {
  const { matches, playerById, dispatch } = useApp()
  const { user } = useAuth()
  const isAdmin = user?.username === 'admin'
  const sheetRef = useRef(null)
  useFocusTrap(sheetRef)
  const stats = useMemo(() => computeStats(matches), [matches])
  const s = stats.find((x) => x.id === playerId)
  const player = playerById[playerId]

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const recent = useMemo(
    () =>
      matches
        .filter((m) => m.teamA.includes(playerId) || m.teamB.includes(playerId))
        .filter((m) => !m.live)
        .slice(0, 4),
    [matches, playerId]
  )

  if (!s || !player) return null

  const partners = Object.entries(s.partners)
    .map(([id, wl]) => ({ id, ...wl, total: wl.w + wl.l }))
    .sort((a, b) => b.total - a.total)
  const rivals = Object.entries(s.rivals)
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const lv = LEVELS[player.level]

  return createPortal(
    <>
      <div className="sheet-overlay" onClick={onClose} />
      <aside className="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label={`${player.name} profile`}>
        <div className="sheet-head">
          <div className="row spread">
            <span className="eyebrow">Player Profile · Rank #{s.rank}</span>
            <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div className="profile-hero" style={{ marginTop: 12 }}>
            <Avatar player={player} size={70} ring />
            <div>
              <div className="display" style={{ fontSize: 30 }}>{player.name}</div>
              <div className="row" style={{ gap: 8, marginTop: 4, alignItems: 'center' }}>
                {isAdmin ? (
                  <select
                    className="select admin-level-select"
                    value={player.level}
                    onChange={(e) => dispatch({ type: 'UPDATE_PLAYER', id: player.id, updates: { level: e.target.value } })}
                  >
                    {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                ) : (
                  <span className="level-badge" style={{ background: lv.glow, color: lv.color }}>{player.level}</span>
                )}
                <span className="num gold">{s.points} pts</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sheet-body">
          <div className="mini-stats">
            <div className="mini-stat"><div className="v mono">{s.played}</div><div className="l">Total Matches</div></div>
            <div className="mini-stat"><div className="v mono">{s.won}</div><div className="l">Won</div></div>
            <div className="mini-stat"><div className="v mono">{s.winPct}%</div><div className="l">Win Rate</div></div>
            <div className="mini-stat"><div className="v mono">{s.doubles}</div><div className="l">Doubles</div></div>
            <div className="mini-stat"><div className="v mono">{s.singles}</div><div className="l">Singles</div></div>
            <div className="mini-stat"><div className="v mono">{s.streak.count}{s.streak.type !== '-' ? s.streak.type : ''}</div><div className="l">Streak</div></div>
          </div>

          {/* Partners — emphasises random rotation */}
          <h3 className="section-title" style={{ fontSize: 19, marginTop: 8 }}>🔀 Partners I've Played With <span className="accent">({partners.length})</span></h3>
          <p className="section-sub">Different partner almost every match — that's the Ceylon way.</p>
          <div className="glass card-pad">
            {partners.length ? partners.map((p) => (
              <div className="partner-row" key={p.id}>
                <Avatar player={playerById[p.id]} size={30} />
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{playerById[p.id]?.name}</span>
                <span className="wl"><span className="w">{p.w}W</span> · <span className="l">{p.l}L</span></span>
              </div>
            )) : <span className="dim">No doubles partners recorded yet.</span>}
          </div>

          {/* Rivals */}
          <h3 className="section-title" style={{ fontSize: 19 }}>⚔️ Most-Faced Rivals</h3>
          <div className="glass card-pad">
            {rivals.length ? rivals.map((r) => (
              <div className="partner-row" key={r.id}>
                <Avatar player={playerById[r.id]} size={30} />
                <span style={{ fontWeight: 600, fontSize: 13.5 }}>{playerById[r.id]?.name}</span>
                <span className="wl">
                  <span className="w">{r.w}W</span> · <span className="l">{r.l}L</span>
                  <span className="faint" style={{ marginLeft: 8, fontSize: 11 }}>{r.count}× faced</span>
                </span>
              </div>
            )) : <span className="dim">No opponents recorded yet.</span>}
          </div>

          {/* Monthly wins */}
          <h3 className="section-title" style={{ fontSize: 19 }}>📊 Monthly Wins</h3>
          <div className="glass card-pad chart-card">
            <MonthlyWinsChart monthly={s.monthly} />
          </div>

          {/* Recent matches */}
          <h3 className="section-title" style={{ fontSize: 19 }}>🏸 Recent Matches</h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {recent.length ? recent.map((m) => <MatchCard key={m.id} match={m} expandable={false} />)
              : <span className="dim">No matches yet.</span>}
          </div>
        </div>
      </aside>
    </>,
    document.body
  )
}
