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

const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// The Mon–Sun week containing today, computed relative to the real "now".
function inWeek(date) {
  const now = new Date()
  const dow = (now.getDay() + 6) % 7 // Mon=0 .. Sun=6
  const mon = new Date(now); mon.setDate(now.getDate() - dow)
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  return date >= isoLocal(mon) && date <= isoLocal(sun)
}

function inMonth(date) {
  const now = new Date()
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return date.startsWith(prefix)
}

export default function Matches({ prefillMatch, clearPrefill }) {
  const { matches, pushToast } = useApp()
  const { user, openLogin, isScorekeeper } = useAuth()
  const [filter, setFilter] = useState('all')
  const [showRecord, setShowRecord] = useState(false)
  const [showSingles, setShowSingles] = useState(true)

  const tryRecord = () => {
    if (!user) { pushToast('Sign in as a member to record a match 🔒', 'info'); return openLogin() }
    if (!isScorekeeper) { pushToast('Only Ijaz (the club scorekeeper) can record match scores. 🏸', 'info'); return }
    setShowRecord(true)
  }

  // Open record modal if we arrived with a prefilled match from pairing
  // (scorekeeper only — a prefill from a non-scorekeeper session is dropped).
  useEffect(() => {
    if (prefillMatch && isScorekeeper) setShowRecord(true)
    else if (prefillMatch) { pushToast('Only Ijaz (the club scorekeeper) can record match scores. 🏸', 'info'); clearPrefill?.() }
  }, [prefillMatch, isScorekeeper, clearPrefill, pushToast])

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === 'doubles') return m.type === 'doubles'
      if (filter === 'singles') return m.type === 'singles'
      if (filter === 'today') return m.date === TODAY
      if (filter === 'week') return inWeek(m.date)
      if (filter === 'month') return inMonth(m.date)
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
