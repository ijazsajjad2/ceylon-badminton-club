import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import MatchCard from '../components/MatchCard.jsx'
import RecordMatchModal from '../components/RecordMatchModal.jsx'
import { TODAY } from '../data/seed.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'doubles', label: 'Doubles' },
  { key: 'singles', label: 'Singles' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
]

function inWeek(date) {
  // week containing today's session, Wed 2026-06-17 (Mon–Sun 06-15..06-21)
  return date >= '2026-06-15' && date <= '2026-06-21'
}

export default function Matches({ prefillMatch, clearPrefill }) {
  const { matches, pushToast } = useApp()
  const { user, openLogin } = useAuth()
  const [filter, setFilter] = useState('all')
  const [showRecord, setShowRecord] = useState(false)
  const [showSingles, setShowSingles] = useState(true)

  const tryRecord = () => {
    if (!user) { pushToast('Sign in as a member to record a match 🔒', 'info'); return openLogin() }
    setShowRecord(true)
  }

  // Open record modal if we arrived with a prefilled match from pairing.
  useEffect(() => {
    if (prefillMatch) setShowRecord(true)
  }, [prefillMatch])

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === 'doubles') return m.type === 'doubles'
      if (filter === 'singles') return m.type === 'singles'
      if (filter === 'today') return m.date === TODAY
      if (filter === 'week') return inWeek(m.date)
      if (filter === 'month') return m.date.startsWith('2026-06')
      return true
    })
  }, [matches, filter])

  const live = filtered.filter((m) => m.live)
  const doubles = filtered.filter((m) => m.type === 'doubles' && !m.live)
  const singles = filtered.filter((m) => m.type === 'singles' && !m.live)

  const closeRecord = () => {
    setShowRecord(false)
    clearPrefill?.()
  }

  return (
    <div className="page-wrap">
      <h1 className="section-title" style={{ fontSize: 34, marginTop: 6 }}>Matches 🏸</h1>
      <p className="section-sub">Doubles take centre court. Whoever was paired that day — random every time.</p>

      <div className="row wrap" style={{ gap: 8, marginBottom: 6 }}>
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {live.length > 0 && (filter === 'all' || filter === 'today' || filter === 'doubles' || filter === 'singles') && (
        <>
          <h2 className="section-title" style={{ fontSize: 20 }}><span className="live-dot" /> Live Now</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {live.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        </>
      )}

      {(filter !== 'singles') && (
        <>
          <h2 className="section-title">Doubles <span className="accent">({doubles.length})</span></h2>
          {doubles.length ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {doubles.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          ) : (
            <div className="glass card-pad dim">No doubles matches in this view.</div>
          )}
        </>
      )}

      {(filter !== 'doubles') && singles.length > 0 && (
        <>
          <h2 className="section-title" style={{ fontSize: 20, cursor: 'pointer' }} onClick={() => setShowSingles((s) => !s)}>
            Singles <span className="accent">({singles.length})</span>
            <span className="faint" style={{ fontSize: 14 }}>{showSingles ? '▲ collapse' : '▼ expand'}</span>
          </h2>
          {showSingles && (
            <div style={{ display: 'grid', gap: 10 }}>
              {singles.map((m) => <MatchCard key={m.id} match={m} />)}
            </div>
          )}
        </>
      )}

      <div className="fab-stack">
        <button className="fab fab-round" onClick={tryRecord} aria-label="Record match">＋</button>
      </div>

      {showRecord && <RecordMatchModal onClose={closeRecord} prefill={prefillMatch} />}
    </div>
  )
}
