import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { validateSet } from '../lib/format.js'
import { TODAY } from '../data/seed.js'

function ToggleSwitch({ value, onChange }) {
  const isDoubles = value === 'doubles'
  return (
    <div className="toggle-switch" role="tablist" aria-label="Match type">
      <span className="toggle-knob" style={{ left: isDoubles ? 4 : '50%', width: 'calc(50% - 4px)' }} />
      <button role="tab" aria-selected={isDoubles} className={isDoubles ? 'on' : ''} onClick={() => onChange('doubles')}>DOUBLES</button>
      <button role="tab" aria-selected={!isDoubles} className={!isDoubles ? 'on' : ''} onClick={() => onChange('singles')}>SINGLES</button>
    </div>
  )
}

export default function RecordMatchModal({ onClose, prefill }) {
  const { players, dispatch, pushToast } = useApp()
  const [type, setType] = useState(prefill?.type || 'doubles')
  const [sel, setSel] = useState(
    prefill?.players || { a1: '', a2: '', b1: '', b2: '' }
  )
  const [sets, setSets] = useState([
    { a: '', b: '' },
    { a: '', b: '' },
    { a: '', b: '' },
  ])
  const [date, setDate] = useState(prefill?.date || TODAY)
  const [time, setTime] = useState(prefill?.time || '17:00')
  const [court, setCourt] = useState(prefill?.court || 1)
  const [showErr, setShowErr] = useState(false)

  const selected = type === 'doubles' ? [sel.a1, sel.a2, sel.b1, sel.b2] : [sel.a1, sel.b1]
  const chosen = selected.filter(Boolean)
  const allDifferent = new Set(chosen).size === chosen.length
  const playersComplete = type === 'doubles' ? chosen.length === 4 : chosen.length === 2

  // Validate sets and compute winner
  const { validSets, setsA, setsB, setError } = useMemo(() => {
    let sA = 0, sB = 0
    const valid = []
    let err = null
    for (let i = 0; i < sets.length; i++) {
      const s = sets[i]
      const empty = s.a === '' && s.b === ''
      if (empty) {
        if (i === 2) continue // 3rd set optional
        if (i < 2) { err = err || `Set ${i + 1} is required`; continue }
      }
      const v = validateSet(s.a, s.b)
      if (!v.valid) {
        if (!v.empty) err = err || `Set ${i + 1}: ${v.reason || 'invalid score'}`
        continue
      }
      valid.push([Number(s.a), Number(s.b)])
      if (Number(s.a) > Number(s.b)) sA++
      else sB++
    }
    return { validSets: valid, setsA: sA, setsB: sB, setError: err }
  }, [sets])

  const winner = setsA > setsB ? 'A' : setsB > setsA ? 'B' : null
  const decided = (setsA === 2 || setsB === 2) && validSets.length >= 2
  const canSave = playersComplete && allDifferent && decided && !setError && winner

  const dropdown = (key, label, exclude) => (
    <div className="field">
      <label>{label}</label>
      <select
        className="select"
        value={sel[key]}
        onChange={(e) => setSel((s) => ({ ...s, [key]: e.target.value }))}
      >
        <option value="">— select —</option>
        {players.map((p) => (
          <option key={p.id} value={p.id} disabled={exclude.includes(p.id) && sel[key] !== p.id}>
            {p.name} · {p.level}
          </option>
        ))}
      </select>
    </div>
  )

  const usedExcept = (selfKey) => Object.entries(sel).filter(([k]) => k !== selfKey).map(([, v]) => v).filter(Boolean)

  const save = () => {
    setShowErr(true)
    if (!canSave) {
      pushToast(setError || 'Please complete all required fields', 'error')
      return
    }
    const match = {
      id: 'm' + Date.now(),
      sessionId: null,
      date,
      time,
      court: Number(court),
      type,
      teamA: type === 'doubles' ? [sel.a1, sel.a2] : [sel.a1],
      teamB: type === 'doubles' ? [sel.b1, sel.b2] : [sel.b1],
      sets: validSets,
      winner,
      live: false,
    }
    dispatch({ type: 'ADD_MATCH', match })
    const aNames = match.teamA.map((id) => players.find((p) => p.id === id)?.name).join(' & ')
    const bNames = match.teamB.map((id) => players.find((p) => p.id === id)?.name).join(' & ')
    pushToast(`Saved: ${winner === 'A' ? aNames : bNames} won ${Math.max(setsA, setsB)}–${Math.min(setsA, setsB)} 🏸`, 'success')
    onClose()
  }

  return (
    <Modal
      title="Record Match"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={save} disabled={false}>Save Match</button>
        </>
      }
    >
      <div className="field row spread">
        <ToggleSwitch value={type} onChange={(t) => { setType(t); }} />
        {winner && decided && (
          <span className="badge badge-doubles">Winner: Team {winner} ({setsA}–{setsB})</span>
        )}
      </div>

      {type === 'doubles' ? (
        <>
          <div className="eyebrow" style={{ marginTop: 6 }}>Team A</div>
          <div className="field-row">
            {dropdown('a1', 'Player 1', usedExcept('a1'))}
            {dropdown('a2', 'Player 2', usedExcept('a2'))}
          </div>
          <div className="eyebrow">Team B</div>
          <div className="field-row">
            {dropdown('b1', 'Player 3', usedExcept('b1'))}
            {dropdown('b2', 'Player 4', usedExcept('b2'))}
          </div>
        </>
      ) : (
        <div className="field-row">
          {dropdown('a1', 'Player A', usedExcept('a1'))}
          {dropdown('b1', 'Player B', usedExcept('b1'))}
        </div>
      )}
      {showErr && !allDifferent && <div className="err-text">All players must be different.</div>}

      <div className="eyebrow" style={{ marginTop: 14 }}>Set Scores · first to 21, win by 2, max 30</div>
      {sets.map((s, i) => {
        const v = validateSet(s.a, s.b)
        const showSetErr = showErr && !v.valid && !v.empty
        return (
          <div key={i}>
            <div className="score-row">
              <input
                className={`input mono ${showSetErr ? 'err' : ''}`}
                inputMode="numeric" placeholder="A" value={s.a}
                onChange={(e) => setSets((p) => p.map((x, j) => (j === i ? { ...x, a: e.target.value.replace(/\D/g, '').slice(0, 2) } : x)))}
                aria-label={`Set ${i + 1} Team A score`}
              />
              <span className="faint mono">SET {i + 1}{i === 2 ? ' (opt)' : ''}</span>
              <input
                className={`input mono ${showSetErr ? 'err' : ''}`}
                inputMode="numeric" placeholder="B" value={s.b}
                onChange={(e) => setSets((p) => p.map((x, j) => (j === i ? { ...x, b: e.target.value.replace(/\D/g, '').slice(0, 2) } : x)))}
                aria-label={`Set ${i + 1} Team B score`}
              />
              <span style={{ width: 18 }}>{s.a !== '' && s.b !== '' && v.valid ? (Number(s.a) > Number(s.b) ? '🅐' : '🅑') : ''}</span>
            </div>
            {showSetErr && <div className="err-text">{v.reason}</div>}
          </div>
        )
      })}
      {showErr && setError && <div className="err-text">{setError}</div>}

      <div className="field-row" style={{ marginTop: 12 }}>
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Time</label>
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Court</label>
        <select className="select" value={court} onChange={(e) => setCourt(e.target.value)}>
          <option value={1}>Court 1</option>
          <option value={2}>Court 2</option>
        </select>
      </div>
    </Modal>
  )
}
