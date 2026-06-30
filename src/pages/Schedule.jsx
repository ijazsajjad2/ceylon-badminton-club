import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Modal from '../components/Modal.jsx'
import useCountdown from '../hooks/useCountdown.js'
import { VENUES } from '../data/seed.js'
import { fmtFullDate, dayName, DAYS, MONTHS } from '../lib/format.js'

function Countdown({ date, time = '20:00' }) {
  const cd = useCountdown(date, time)
  if (cd.done) return <span className="gold">Starting soon</span>
  return (
    <span className="mono gold">
      {cd.d > 0 && `${cd.d}d `}{String(cd.h).padStart(2, '0')}h {String(cd.m).padStart(2, '0')}m {String(cd.s).padStart(2, '0')}s
    </span>
  )
}

function ScheduleModal({ onClose }) {
  const { dispatch, pushToast, sessions } = useApp()
  const [form, setForm] = useState({ date: '2026-07-05', time: '20:00–22:00', venue: VENUES[0], courts: 2, notes: '' })
  const save = () => {
    if (!form.date) { pushToast('Pick a date', 'error'); return }
    if (sessions.some((s) => s.date === form.date)) { pushToast('A session already exists on that date', 'error'); return }
    dispatch({
      type: 'ADD_SESSION',
      session: { id: 's' + Date.now(), ...form, courts: Number(form.courts), day: dayName(form.date), status: 'upcoming', attendees: [] },
    })
    pushToast('Session scheduled 📅', 'success')
    onClose()
  }
  return (
    <Modal title="Schedule Session" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-gold" onClick={save}>Schedule</button></>}>
      <div className="field"><label>Date</label><input className="input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
      <div className="field"><label>Time</label><input className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
      <div className="field"><label>Venue</label>
        <select className="select" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })}>
          {VENUES.map((v) => <option key={v}>{v}</option>)}
        </select>
      </div>
      <div className="field"><label>Courts</label>
        <select className="select" value={form.courts} onChange={(e) => setForm({ ...form, courts: e.target.value })}>
          {[1, 2, 3, 4].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field"><label>Notes</label><input className="input" placeholder="optional" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </Modal>
  )
}

export default function Schedule() {
  const { sessions, matches, playerById, pushToast } = useApp()
  const { user, openLogin } = useAuth()
  const [showModal, setShowModal] = useState(false)

  const trySchedule = () => {
    if (!user) { pushToast('Sign in as a member to schedule a session 🔒', 'info'); return openLogin() }
    setShowModal(true)
  }

  const sessionByDate = useMemo(() => {
    const map = {}
    sessions.forEach((s) => (map[s.date] = s))
    return map
  }, [sessions])

  // MVP per session = most wins among that session's matches
  const mvpOf = (sessionId) => {
    const ms = matches.filter((m) => m.sessionId === sessionId && !m.live && m.winner)
    const wins = {}
    ms.forEach((m) => {
      const team = m.winner === 'A' ? m.teamA : m.teamB
      team.forEach((id) => (wins[id] = (wins[id] || 0) + 1))
    })
    const top = Object.entries(wins).sort((a, b) => b[1] - a[1])[0]
    return top ? { player: playerById[top[0]], wins: top[1] } : null
  }
  const matchCount = (sessionId) => matches.filter((m) => m.sessionId === sessionId).length

  const upcoming = sessions.filter((s) => s.status !== 'past').sort((a, b) => a.date.localeCompare(b.date))
  const past = sessions.filter((s) => s.status === 'past').sort((a, b) => b.date.localeCompare(a.date))

  // Dynamic "now" so the strip + calendar always reflect the current week/month.
  const now = new Date()
  const pad2 = (n) => String(n).padStart(2, '0')
  const isoOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
  const todayISO = isoOf(now)

  // Week strip: 14 days starting 5 days before today
  const weekDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 5 + i)
    return isoOf(d)
  })

  // Current-month calendar
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
  const monthFirst = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const startPad = monthFirst.getDay()
  const calCells = []
  for (let i = 0; i < startPad; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(`${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(d)}`)

  return (
    <div className="page-wrap">
      <div className="row spread wrap">
        <div>
          <h1 className="section-title" style={{ fontSize: 34, marginTop: 6 }}>Schedule 📅</h1>
          <p className="section-sub">Wednesday nights (8–10 PM) &amp; Saturday mornings (8–10 AM) at Green Badminton Club.</p>
        </div>
        <button className="btn btn-gold" onClick={trySchedule}>＋ Schedule Session</button>
      </div>

      {/* Week strip */}
      <div className="week-strip">
        {weekDays.map((d) => {
          const sess = sessionByDate[d]
          const isToday = d === todayISO
          return (
            <div key={d} className={`week-day ${sess ? 'has-session' : ''} ${isToday ? 'today' : ''}`}>
              <div className="wd-day">{dayName(d)}</div>
              <div className="wd-num display">{Number(d.slice(8))}</div>
              {sess && <div className="week-dot" />}
            </div>
          )
        })}
      </div>

      <div className="two-col" style={{ marginTop: 18 }}>
        {/* Calendar */}
        <div className="glass card-pad">
          <h3 className="display" style={{ fontSize: 22, margin: '0 0 12px' }}>{monthLabel}</h3>
          <div className="calendar">
            {DAYS.map((d) => <div key={d} className="cal-cell dow">{d[0]}</div>)}
            {calCells.map((d, i) => (
              <div key={i} className={`cal-cell ${d && sessionByDate[d] ? 'session' : ''} ${d === todayISO ? 'today-cell' : ''}`}>
                {d ? Number(d.slice(8)) : ''}
              </div>
            ))}
          </div>
          <p className="faint" style={{ fontSize: 11.5, marginTop: 12 }}>🔴 Highlighted cells are session days · outlined cell is today.</p>
        </div>

        {/* Upcoming */}
        <div>
          <h3 className="section-title" style={{ fontSize: 20, marginTop: 0 }}>Upcoming Sessions</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {upcoming.map((s) => (
              <div key={s.id} className="glass card-pad hoverable">
                <div className="row spread">
                  <span className="eyebrow">{s.status === 'today' ? '🔴 Today' : 'Upcoming'}</span>
                  <Countdown date={s.date} time={s.time.split('–')[0]} />
                </div>
                <div className="display" style={{ fontSize: 22, marginTop: 6 }}>{fmtFullDate(s.date)}</div>
                <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
                  <span className="hero-pill">📍 {s.venue}</span>
                  <span className="hero-pill">🕓 {s.time}</span>
                  <span className="hero-pill">🏟 {s.courts} courts</span>
                </div>
                <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>
                  {s.status === 'today' ? `${s.attendees.length} confirmed so far` : 'RSVP open'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past sessions */}
      <h2 className="section-title">Past Sessions</h2>
      <div className="pairs-grid">
        {past.map((s) => {
          const mvp = mvpOf(s.id)
          return (
            <div key={s.id} className="glass card-pad hoverable">
              <div className="row spread">
                <span className="display" style={{ fontSize: 20 }}>{fmtFullDate(s.date)}</span>
                <span className="badge badge-doubles">{matchCount(s.id)} matches</span>
              </div>
              <div className="faint" style={{ fontSize: 12, margin: '6px 0 10px' }}>📍 {s.venue} · {s.attendees.length} attended</div>
              <div className="row" style={{ marginBottom: 10 }}>
                {s.attendees.slice(0, 7).map((id, i) => (
                  <span key={id} style={{ marginLeft: i ? -10 : 0 }}><Avatar player={playerById[id]} size={28} /></span>
                ))}
                {s.attendees.length > 7 && <span className="faint" style={{ marginLeft: 6, fontSize: 12 }}>+{s.attendees.length - 7}</span>}
              </div>
              {mvp && mvp.player && (
                <div className="row" style={{ gap: 8, background: 'rgba(226,59,59,0.08)', padding: '8px 10px', borderRadius: 12 }}>
                  <span>🏅</span>
                  <span style={{ fontSize: 13 }}><b className="gold">MVP:</b> {mvp.player.name} ({mvp.wins} wins)</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showModal && <ScheduleModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
