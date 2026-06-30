import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Modal from '../components/Modal.jsx'
import PlayerSheet from '../components/PlayerSheet.jsx'
import { computeStats } from '../lib/stats.js'
import { LEVELS } from '../data/players.js'
import useReveal from '../hooks/useReveal.js'

const LEVEL_KEYS = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
const GRADS = [['#e23b3b', '#8b0e1a'], ['#2f7bf0', '#13357a'], ['#e0303f', '#2f6fe0'], ['#1f5fd6', '#0e2a66'], ['#ff5a5a', '#c1121f']]

function AddMemberModal({ onClose }) {
  const { dispatch, pushToast, players } = useApp()
  const [form, setForm] = useState({ name: '', level: 'Intermediate', joinDate: '2026-06-14' })
  const save = () => {
    if (!form.name.trim()) { pushToast('Enter a name', 'error'); return }
    const player = {
      id: 'p' + Date.now(),
      name: form.name.trim(),
      level: form.level,
      joinDate: form.joinDate,
      gradient: GRADS[players.length % GRADS.length],
    }
    dispatch({ type: 'ADD_PLAYER', player })
    pushToast(`${player.name} joined the club 🏸`, 'success')
    onClose()
  }
  return (
    <Modal title="Add Member" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-gold" onClick={save}>Add Member</button></>}>
      <div className="field"><label>Name</label><input className="input" placeholder="e.g. Nimal P." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div className="field"><label>Skill Level</label>
        <select className="select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
          {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div className="field"><label>Join Date</label><input className="input" type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} /></div>
    </Modal>
  )
}

export default function Profiles() {
  const { players, matches } = useApp()
  const { user } = useAuth()
  const isAdmin = user?.username === 'admin'
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All')
  const [openId, setOpenId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const stats = useMemo(() => computeStats(matches), [matches])
  const statById = useMemo(() => Object.fromEntries(stats.map((s) => [s.id, s])), [stats])

  const filtered = players.filter((p) =>
    (level === 'All' || p.level === level) && p.name.toLowerCase().includes(query.toLowerCase())
  )

  const revealRef = useReveal([filtered.length, level, query])

  const expertCount = players.filter((p) => p.level === 'Expert').length
  const advancedCount = players.filter((p) => p.level === 'Advanced').length

  return (
    <div className="page-wrap">

      {/* ── Premium "Our Club Members" hero ── */}
      <div className="members-hero glass card-pad">
        <div className="members-hero-inner">
          <div>
            <span className="eyebrow">Ceylon Badminton Club · Riyadh, KSA</span>
            <h1 className="display" style={{ fontSize: 34, marginTop: 6, marginBottom: 6 }}>
              Our Club <span className="accent">Members</span> 👥
            </h1>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              Meet the {players.length} players who make our badminton community strong. Partners rotate every session — that's the Ceylon way.
            </p>
          </div>
          <div className="members-stats-row">
            <div className="ms-stat">
              <span className="ms-num">{players.length}</span>
              <span className="ms-lbl">Members</span>
            </div>
            <div className="ms-divider" />
            <div className="ms-stat">
              <span className="ms-num">2×</span>
              <span className="ms-lbl">Per Week</span>
            </div>
            <div className="ms-divider" />
            <div className="ms-stat">
              <span className="ms-num">{expertCount + advancedCount}</span>
              <span className="ms-lbl">Advanced+</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-gold" style={{ marginTop: 18 }} onClick={() => setShowAdd(true)}>＋ Add Member</button>
        )}
      </div>

      <div className="row spread wrap" style={{ gap: 10, marginTop: 24 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          {LEVEL_KEYS.map((l) => (
            <button key={l} className={`chip ${level === l ? 'active' : ''}`} onClick={() => setLevel(l)}>{l}</button>
          ))}
        </div>
        <input className="input" style={{ maxWidth: 220 }} placeholder="🔍 Search member…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div ref={revealRef} className="pgrid" style={{ marginTop: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {filtered.map((p, i) => {
          const s = statById[p.id]
          const lv = LEVELS[p.level]
          const memberNum = players.indexOf(p) + 1
          return (
            <button key={p.id} className="glass hoverable card-pad member-card reveal" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpenId(p.id)}>
              <div className="row spread" style={{ marginBottom: 10, alignItems: 'center' }}>
                <span className="member-num">#{String(memberNum).padStart(2, '0')}</span>
              </div>
              <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <Avatar player={p} size={52} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, color: '#ffffff' }}>{p.name}</div>
                  <div className="row wrap" style={{ gap: 5, marginTop: 5 }}>
                    <span className="level-badge" style={{ background: lv.glow, color: lv.color }}>{p.level}</span>
                    <span className="member-badge">Club Member</span>
                  </div>
                </div>
              </div>
              <div className="row spread" style={{ marginTop: 14 }}>
                <div>
                  <div className="num gold display" style={{ fontSize: 22 }}>{s?.winPct ?? 0}%</div>
                  <div className="faint" style={{ fontSize: 10.5 }}>WIN RATE</div>
                </div>
                <div className="center">
                  <div className="num display" style={{ fontSize: 22 }}>{s?.played ?? 0}</div>
                  <div className="faint" style={{ fontSize: 10.5 }}>PLAYED</div>
                </div>
                <div className="center">
                  <div className="num display" style={{ fontSize: 22 }}>{s?.partnerCount ?? 0}</div>
                  <div className="faint" style={{ fontSize: 10.5 }}>PARTNERS</div>
                </div>
              </div>
              <div className="winpct-bar" style={{ marginTop: 12 }}><div className="winpct-fill" style={{ width: (s?.winPct ?? 0) + '%' }} /></div>
            </button>
          )
        })}
      </div>
      {filtered.length === 0 && <div className="glass card-pad dim center" style={{ marginTop: 16 }}>No members found.</div>}

      {openId && <PlayerSheet playerId={openId} onClose={() => setOpenId(null)} />}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
