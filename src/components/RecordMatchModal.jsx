import { useRef, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { validateMatchSets } from '../lib/matchValidation.js'
import { riyadhDate } from '../lib/sessions.js'

export default function RecordMatchModal({ onClose, prefill }) {
  const { players, recordMatch, pushToast, sessions, currentSession } = useApp()
  const today = riyadhDate()
  const activeSession = sessions.filter((session) => session.date <= today).at(-1) || currentSession
  const [type, setType] = useState(prefill?.type || 'doubles')
  const [format, setFormat] = useState(prefill?.sets?.length > 1 ? 'best3' : 'single')
  const [editReason,setEditReason]=useState('')
  const [sel, setSel] = useState(prefill?.players || { a1: prefill?.teamA?.[0] || '', a2: prefill?.teamA?.[1] || '', b1: prefill?.teamB?.[0] || '', b2: prefill?.teamB?.[1] || '' })
  const [sets, setSets] = useState([0,1,2].map(i=>({a:prefill?.sets?.[i]?.[0] ?? '',b:prefill?.sets?.[i]?.[1] ?? ''})))
  const [history, setHistory] = useState([])
  const [date, setDate] = useState(prefill?.date || activeSession.date)
  const [time, setTime] = useState(prefill?.time || activeSession.time.split('–')[0])
  const [court, setCourt] = useState(prefill?.court || 1)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const matchId = useRef(prefill?.id || crypto.randomUUID())
  const selected = type === 'doubles' ? [sel.a1, sel.a2, sel.b1, sel.b2] : [sel.a1, sel.b1]
  const validation = validateMatchSets(sets, format)
  const updateScore = (index, team, value) => {
    setHistory((previous) => [...previous.slice(-49), sets.map((set) => ({ ...set }))])
    setSets((previous) => previous.map((set, i) => i === index ? { ...set, [team]: value } : set))
  }
  const undo = () => {
    if (!history.length) return
    setSets(history[history.length - 1])
    setHistory((previous) => previous.slice(0, -1))
  }
  const names = (team) => (team === 'A' ? selected.slice(0, type === 'doubles' ? 2 : 1) : selected.slice(type === 'doubles' ? 2 : 1)).map((id) => players.find((p) => p.id === id)?.name.split(' ')[0]).filter(Boolean).join(' & ')
  const save = async () => {
    if (savingRef.current) return
    if (selected.some((id) => !id) || new Set(selected).size !== selected.length) { setError('Choose a different player for each position.'); return }
    if (!validation.valid) { setError(validation.error); return }
    if (!date || !time || date > today) { setError('Recorded matches need a date today or earlier and a start time.'); return }
    if(prefill?.id && editReason.trim().length<4){setError('Explain the correction in at least four characters.');return}
    savingRef.current = true; setSaving(true); setError('')
    try {
      const result = await recordMatch({ id: matchId.current, sessionId: sessions.find((s) => s.date === date)?.id || null,
        ...(prefill?.id ? {editReason:editReason.trim(),revision:prefill.revision||1}:{}), date, time, court: Number(court), type, teamA: type === 'doubles' ? [sel.a1, sel.a2] : [sel.a1],
        teamB: type === 'doubles' ? [sel.b1, sel.b2] : [sel.b1], sets: validation.sets, winner: validation.winner, live: false })
      if (!result.ok) { setError('The result was not saved. Please try again.'); return }
      pushToast('Result saved on this device. Check the sync status for confirmation.', 'info')
      onClose()
    } catch { setError('Could not save. Your scores are still here; please try again.') }
    finally { savingRef.current = false; setSaving(false) }
  }
  const selectPlayer = (key, label) => <div className="field" key={key}><label htmlFor={`player-${key}`}>{label}</label><select id={`player-${key}`} className="select" value={sel[key]} onChange={(e) => setSel((previous) => ({ ...previous, [key]: e.target.value }))}><option value="">Select player</option>{players.map((player) => <option key={player.id} value={player.id} disabled={selected.includes(player.id) && sel[key] !== player.id}>{player.name}</option>)}</select></div>
  return <Modal title={prefill?.id ? "Correct result" : "Record a result"} onClose={saving ? () => {} : onClose} footer={<><button className="btn btn-ghost" disabled={saving} onClick={onClose}>Cancel</button><button className="btn btn-gold" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save result'}</button></>}>
    <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <div className="field-row"><div className="field"><label htmlFor="match-type">Players</label><select id="match-type" className="select" value={type} onChange={(e) => setType(e.target.value)}><option value="doubles">Doubles</option><option value="singles">Singles</option></select></div><div className="field"><label htmlFor="match-format">Format</label><select id="match-format" className="select" value={format} onChange={(e) => { setFormat(e.target.value); setError('') }}><option value="single">One set · club game</option><option value="best3">Best of three</option></select></div></div>
      <p className="eyebrow">Team A</p><div className="field-row">{selectPlayer('a1', 'Team A · player 1')}{type === 'doubles' && selectPlayer('a2', 'Team A · player 2')}</div>
      <p className="eyebrow">Team B</p><div className="field-row">{selectPlayer('b1', 'Team B · player 1')}{type === 'doubles' && selectPlayer('b2', 'Team B · player 2')}</div>
      <p className="join-explainer">First to 21, win by two, capped at 30. Type the final score or use the large + / − buttons.</p>
      {sets.slice(0, format === 'single' ? 1 : 3).map((set, i) => <div className="score-entry" key={i}>
        <div className="score-entry-heading"><b>Set {i + 1}</b>{i === 2 && <small className="faint">Only if tied 1–1</small>}</div>
        <div className="score-entry-teams">{['a', 'b'].map((team) => <div className="score-entry-team" key={team}><span>Team {team.toUpperCase()}</span><div className="score-stepper"><button type="button" aria-label={`Subtract Team ${team.toUpperCase()} set ${i + 1}`} disabled={!Number(set[team])} onClick={() => updateScore(i, team, String(Math.max(0, Number(set[team] || 0) - 1)))}>−</button><input className="input mono" aria-label={`Set ${i + 1} Team ${team.toUpperCase()} score`} inputMode="numeric" value={set[team]} placeholder="0" onChange={(e) => updateScore(i, team, e.target.value.replace(/\D/g, '').slice(0, 2))} /><button type="button" aria-label={`Add Team ${team.toUpperCase()} set ${i + 1}`} disabled={Number(set[team]) >= 30} onClick={() => updateScore(i, team, String(Math.min(30, Number(set[team] || 0) + 1)))}>+</button></div></div>)}</div>
      </div>)}
      <div className="score-actions"><button type="button" className="btn btn-ghost btn-sm" onClick={undo} disabled={!history.length}>Undo score change</button></div>
      {validation.valid && <div className="score-review" role="status"><b>{names(validation.winner) || `Team ${validation.winner}`} wins</b><br />{validation.sets.map((set) => set.join('–')).join(' / ')} · Court {court}</div>}
      <details><summary style={{ padding: '14px 0', cursor: 'pointer' }}>Session details · {date} · Court {court}</summary><div className="field-row"><div className="field"><label htmlFor="match-date">Date</label><input id="match-date" className="input" type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} /></div><div className="field"><label htmlFor="match-time">Time (Riyadh)</label><input id="match-time" className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div></div><div className="field"><label htmlFor="match-court">Court</label><select id="match-court" className="select" value={court} onChange={(e) => setCourt(e.target.value)}><option value="1">Court 1</option><option value="2">Court 2</option></select></div></details>
      {prefill?.id && <label className="field">Reason for correction<input className="input" value={editReason} onChange={e=>setEditReason(e.target.value)} minLength={4} maxLength={300}/><small>Changes are audited and previous confirmations are cleared.</small></label>}
      {error && <p className="login-err" role="alert">{error}</p>}
    </fieldset>
  </Modal>
}
