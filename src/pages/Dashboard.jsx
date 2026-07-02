import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import StatCounter from '../components/StatCounter.jsx'
import MatchCard from '../components/MatchCard.jsx'
import Avatar from '../components/Avatar.jsx'
import RecordMatchModal from '../components/RecordMatchModal.jsx'
import { ShuttleDeco } from '../components/Shuttle.jsx'
import { computeStats, setsWon } from '../lib/stats.js'
import { TODAY, TODAY_SESSION, TODAY_SESSION_START } from '../data/seed.js'
import { fmtFullDate } from '../lib/format.js'
import useCountdown from '../hooks/useCountdown.js'

const HERO_IMG = 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1400'

function resultLine(match, playerById) {
  const a = match.teamA.map((id) => playerById[id]?.name.replace(/ .*/, '') || '?').join(' & ')
  const b = match.teamB.map((id) => playerById[id]?.name.replace(/ .*/, '') || '?').join(' & ')
  const { a: sa, b: sb } = setsWon(match)
  const winNames = match.winner === 'A' ? a : b
  const loseNames = match.winner === 'A' ? b : a
  const big = Math.max(sa, sb), small = Math.min(sa, sb)
  const sample = match.sets[0] || [21, 18]
  return `${winNames} beat ${loseNames} ${sample[0]}-${sample[1]}${match.sets.length > 1 ? ` (${big}-${small} sets)` : ''}`
}

const RANK_MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function Dashboard({ navigate }) {
  const { matches, players, sessions, playerById, goingIds, pushToast } = useApp()
  const { user, openLogin, isScorekeeper } = useAuth()
  const [showRecord, setShowRecord] = useState(false)
  const cd = useCountdown(TODAY_SESSION.date, TODAY_SESSION_START)

  const tryRecord = () => {
    if (!user) { pushToast('Sign in as a member to record a score 🔒', 'info'); return openLogin() }
    if (!isScorekeeper) { pushToast('Only Ijaz (the club scorekeeper) can record match scores. 🏸', 'info'); return }
    setShowRecord(true)
  }

  const liveMatches = matches.filter((m) => m.live)

  const stats = useMemo(() => computeStats(matches), [matches])
  const top5 = stats.slice(0, 5)

  const playersToday = goingIds.length
  const monthPrefix = (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}` })()
  const sessionsThisMonth = sessions.filter((s) => s.date.startsWith(monthPrefix) && s.status !== 'upcoming').length
  const myStats = user?.playerId ? stats.find((s) => s.id === user.playerId) : null

  const recent = useMemo(
    () => matches.filter((m) => !m.live && m.winner).slice(0, 6),
    [matches]
  )
  const latest = recent.slice(0, 3)

  const tickerItems = useMemo(() => {
    const base = [...liveMatches, ...matches.filter((m) => !m.live).slice(0, 8)]
    return base.map((m) => {
      const a = m.teamA.map((id) => playerById[id]?.name.replace(/ .*/, '')).join('/')
      const b = m.teamB.map((id) => playerById[id]?.name.replace(/ .*/, '')).join('/')
      const s = m.sets[0] || [0, 0]
      return { id: m.id, live: m.live, a, b, score: `${s[0]}-${s[1]}` }
    })
  }, [matches, liveMatches, playerById])

  return (
    <div className="page-wrap">
      {/* Ticker */}
      <div className="ticker" aria-label="Live match ticker">
        <div className="ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span className="ticker-item" key={i}>
              {t.live && <span className="live-dot" />}
              {t.live && <b style={{ color: 'var(--red-live)' }}>LIVE</b>}
              <b>{t.a}</b> vs <b>{t.b}</b>
              <span className="ticker-score">{t.score}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(${HERO_IMG})` }} />
        <ShuttleDeco size={160} className="shuttle-float" style={{ top: 10, right: 30 }} />
        <ShuttleDeco size={90} className="shuttle-float" style={{ top: 120, right: 180, animationDelay: '1.2s' }} />
        <div className="hero-content">
          <span className="eyebrow">Private Sri Lankan Club · Riyadh, KSA</span>
          <h1 className="hero-title">
            <span className="l1">Ceylon</span>
            <span className="l2">Badminton Club</span>
          </h1>
          <div className="hero-meta">
            <span className="hero-pill">📍 {TODAY_SESSION.venue}</span>
            <span className="hero-pill">🗓 {fmtFullDate(TODAY_SESSION.date)}</span>
            <span className="hero-pill">🕓 {TODAY_SESSION.time}</span>
            <span className="hero-pill">🔀 Random doubles every session</span>
          </div>
          <div className="countdown-box" aria-label="Countdown to the next session">
            {cd.done ? (
              <div className="cd-cell" style={{ minWidth: 200 }}>
                <div className="cd-num" style={{ fontSize: 20 }}>STARTING SOON 🏸</div>
              </div>
            ) : (
              [['d', cd.d], ['h', cd.h], ['m', cd.m], ['s', cd.s]].map(([l, v]) => (
                <div className="cd-cell" key={l}>
                  <div className="cd-num">{String(v).padStart(2, '0')}</div>
                  <div className="cd-lbl">{{ d: 'Days', h: 'Hrs', m: 'Min', s: 'Sec' }[l]}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stat-grid" style={{ marginTop: 18 }}>
        <StatCounter value={playersToday} label="Going to Next" icon="🏸" />
        <StatCounter value={matches.length} label="Matches Played" icon="⚔️" />
        <StatCounter value={players.length} label="Active Members" icon="👥" />
        <StatCounter value={sessionsThisMonth} label="Sessions This Month" icon="📅" />
      </div>

      <div className="dash-cols" style={{ marginTop: 22 }}>
        <div>
          <h2 className="section-title">Latest <span className="accent">Matches</span> 🏸</h2>
          {latest.length ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {latest.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          ) : (
            <div className="glass card-pad dim">No matches yet — record one after the next session!</div>
          )}

          <h2 className="section-title" style={{ fontSize: 20 }}>Recent Activity</h2>
          <div className="glass card-pad">
            {recent.map((m) => (
              <div className="activity-item" key={m.id}>
                <span className="activity-emoji">{m.type === 'doubles' ? '🏸' : '🎯'}</span>
                <span style={{ fontSize: 13.5 }}>{resultLine(m, playerById)}</span>
                <span className="faint" style={{ marginLeft: 'auto', fontSize: 11 }}>{m.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini leaderboard */}
        <div>
          <h2 className="section-title">Top <span className="accent">5</span> 🏆</h2>
          <div className="glass card-pad">
            {top5.map((p, i) => (
              <div className="activity-item" key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate('leaderboard')}>
                <span style={{ width: 28, textAlign: 'center', fontSize: i < 3 ? 18 : 15, flexShrink: 0 }}>
                  {RANK_MEDAL[i + 1] || <span className="num gold" style={{ fontSize: 13 }}>{i + 1}</span>}
                </span>
                <Avatar player={p} size={34} />
                <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {p.name}
                    {p.id === user?.playerId && <span className="me-tag" style={{ marginLeft: 6 }}>you</span>}
                  </div>
                  <div className="faint" style={{ fontSize: 11 }}>{p.won}W · {p.lost}L · {p.winPct}%</div>
                </div>
                <span className="num gold" style={{ marginLeft: 'auto', fontSize: 13 }}>{p.points} pts</span>
              </div>
            ))}
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => navigate('leaderboard')}>
              View full leaderboard →
            </button>
          </div>

          {myStats && (
            <div className="glass card-pad my-stats-card" style={{ marginTop: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Your Stats · {playerById[user.playerId]?.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, textAlign: 'center' }}>
                <div>
                  <div className="num gold display" style={{ fontSize: 26 }}>{myStats.rank}</div>
                  <div className="faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Rank</div>
                </div>
                <div>
                  <div className="num display" style={{ fontSize: 26 }}>{myStats.winPct}%</div>
                  <div className="faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Win Rate</div>
                </div>
                <div>
                  <div className="num display" style={{ fontSize: 26 }}>{myStats.points}</div>
                  <div className="faint" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Points</div>
                </div>
              </div>
            </div>
          )}

          <div className="glass card-pad ceylon-way-card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>🇱🇰</span>
              <span className="eyebrow" style={{ fontSize: 10.5 }}>The Ceylon Way</span>
            </div>
            <p style={{ fontSize: 13, margin: 0, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              No fixed partners. No named teams. Every session we shuffle fresh pairs — show up, get matched, <b style={{ color: 'var(--gold-bright)' }}>smash it together</b>.
            </p>
          </div>
        </div>
      </div>

      {/* Quick-action FABs */}
      <div className="fab-stack">
        <button className="fab fab-green" onClick={() => navigate('participation')}>🏸 I'm Playing Today</button>
        <button className="fab" onClick={tryRecord}>＋ Add Score</button>
      </div>

      {showRecord && <RecordMatchModal onClose={() => setShowRecord(false)} />}
    </div>
  )
}
