import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import PlayerSheet from '../components/PlayerSheet.jsx'
import { computeStats, filterByPeriod } from '../lib/stats.js'
import { TODAY_SESSION } from '../data/seed.js'

const PERIODS = [
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
  { key: 'season', label: 'This Season' },
]

function RankDelta({ delta }) {
  if (delta > 0) return <span className="rank-up">↑{delta}</span>
  if (delta < 0) return <span className="rank-down">↓{-delta}</span>
  return <span className="rank-same">→</span>
}

export default function Leaderboard() {
  const { matches } = useApp()
  const [period, setPeriod] = useState('month')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const periodMatches = useMemo(() => filterByPeriod(matches, period), [matches, period])
  const stats = useMemo(() => computeStats(periodMatches), [periodMatches])

  // Rank change: compare vs ranking BEFORE today's session.
  const prevRank = useMemo(() => {
    const before = periodMatches.filter((m) => m.sessionId !== TODAY_SESSION.id)
    const map = {}
    computeStats(before).forEach((p) => (map[p.id] = p.rank))
    return map
  }, [periodMatches])

  const ranked = stats.filter((p) => p.played > 0)
  const podium = ranked.slice(0, 3)
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) // 2nd, 1st, 3rd

  const filtered = ranked.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  // Most varied partnerships
  const mostVaried = [...stats].sort((a, b) => b.partnerCount - a.partnerCount)[0]

  return (
    <div className="page-wrap">
      <h1 className="section-title" style={{ fontSize: 34, marginTop: 6 }}>Leaderboard 🏆</h1>
      <p className="section-sub">
        <b className="gold">Individual Rankings</b> — partners change every session, so wins & points are credited to each player personally.
        Scores are recorded by the club scorekeeper; every match counts here whether or not it's been confirmed yet — open a match on the{' '}
        <b>Matches</b> page and tap <b>Confirm</b> to mark it verified.
      </p>

      <div className="row spread wrap" style={{ gap: 10 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          {PERIODS.map((p) => (
            <button key={p.key} className={`chip ${period === p.key ? 'active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
        <input className="input" style={{ maxWidth: 220 }} placeholder="🔍 Search player…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {/* Most varied partnerships */}
      {mostVaried && mostVaried.partnerCount > 0 && (
        <div className="glass card-pad" style={{ marginTop: 16, borderColor: 'rgba(226,59,59,0.3)' }}>
          <div className="row" style={{ gap: 12 }}>
            <span style={{ fontSize: 28 }}>🤝</span>
            <div>
              <div className="eyebrow">Most Varied Partnerships</div>
              <div style={{ fontWeight: 700, marginTop: 2 }}>
                <span className="gold">{mostVaried.name}</span> has partnered <span className="num gold">{mostVaried.partnerCount}</span> different players — the club's ultimate team player.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Podium */}
      {podium.length === 3 && (
        <div className="podium">
          {podiumOrder.map((p) => {
            const place = p.rank
            return (
              <div key={p.id} className={`glass podium-card podium-anim podium-${place}`} onClick={() => setOpenId(p.id)} style={{ cursor: 'pointer', animationDelay: `${place * 0.1}s` }}>
                {place === 1 && <span className="podium-crown" aria-hidden="true">👑</span>}
                <div className="medal">{place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}</div>
                <Avatar player={p} size={place === 1 ? 64 : 50} ring={place === 1} />
                <div className="podium-name">{p.name}</div>
                <div className="podium-pts mono">{p.points} pts</div>
                <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{p.won}W · {p.winPct}%</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th><th>Player</th>
              <th className="lb-hide">Dbl</th><th className="lb-hide">Sgl</th>
              <th>P</th><th>W</th><th>L</th><th>Win%</th><th>Pts</th>
              <th className="lb-hide">Streak</th><th className="lb-hide">Form</th><th>±</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const delta = prevRank[p.id] ? prevRank[p.id] - p.rank : 0
              return (
                <tr className="lb-row" key={p.id} onClick={() => setOpenId(p.id)} tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter') && setOpenId(p.id)}>
                  <td className="lb-rank">{p.rank}</td>
                  <td>
                    <span className="lb-player"><Avatar player={p} size={32} />{p.name}</span>
                  </td>
                  <td className="lb-hide num">{p.doubles}</td>
                  <td className="lb-hide num">{p.singles}</td>
                  <td className="num">{p.played}</td>
                  <td className="num" style={{ color: 'var(--green-bright)' }}>{p.won}</td>
                  <td className="num" style={{ color: '#ff7a7a' }}>{p.lost}</td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="num" style={{ fontSize: 12 }}>{p.winPct}%</span>
                      <div className="winpct-bar"><div className="winpct-fill" style={{ width: p.winPct + '%' }} /></div>
                    </div>
                  </td>
                  <td className="num gold">{p.points}</td>
                  <td className="lb-hide">
                    {p.streak.type !== '-' && <span className={`streak-tag ${p.streak.type}`}>{p.streak.count}{p.streak.type}</span>}
                  </td>
                  <td className="lb-hide">
                    <div className="form-dots">
                      {p.form.map((f, i) => <span key={i} className={`form-dot ${f}`}>{f}</span>)}
                    </div>
                  </td>
                  <td><RankDelta delta={delta} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="glass card-pad dim center">
            {ranked.length === 0
              ? 'No ranked players yet — rankings begin with the first recorded match. 🏸'
              : `No players match "${query}".`}
          </div>
        )}
      </div>

      {openId && <PlayerSheet playerId={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}
