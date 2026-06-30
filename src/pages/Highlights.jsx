import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import VideoThumb from '../components/VideoThumb.jsx'
import VideoLightbox from '../components/VideoLightbox.jsx'
import AddVideoModal from '../components/AddVideoModal.jsx'
import { ShuttleDeco } from '../components/Shuttle.jsx'
import useReveal from '../hooks/useReveal.js'
import { fmtDate } from '../lib/format.js'
import { TODAY_SESSION } from '../data/seed.js'

export default function Highlights() {
  const { videos, players, playerById, dispatch, pushToast } = useApp()
  const { user, openLogin } = useAuth()
  const [filter, setFilter] = useState('all')
  const [playerFilter, setPlayerFilter] = useState('')
  const [active, setActive] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const tryAdd = () => {
    if (!user) { pushToast('Sign in as a member to add a highlight 🔒', 'info'); return openLogin() }
    setShowAdd(true)
  }

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (filter === 'session' && v.sessionId !== TODAY_SESSION.id) return false
      if (filter === 'match' && !v.matchId) return false
      if (playerFilter && v.uploaderId !== playerFilter) return false
      return true
    })
  }, [videos, filter, playerFilter])

  const revealRef = useReveal([filtered.length])

  const remove = (e, v) => {
    e.stopPropagation()
    if (!user) { pushToast('Sign in as a member to manage highlights 🔒', 'info'); return openLogin() }
    if (confirm(`Remove "${v.title}" from highlights?`)) {
      dispatch({ type: 'DELETE_VIDEO', id: v.id })
      pushToast('Highlight removed', 'info')
    }
  }

  return (
    <div className="page-wrap" ref={revealRef}>
      <div className="row spread wrap">
        <div>
          <h1 className="section-title" style={{ fontSize: 34, marginTop: 6 }}>Highlights 🎬</h1>
          <p className="section-sub">Match clips straight from the club's Google Drive — relive the rallies in-app.</p>
        </div>
        <button className="btn btn-gold" onClick={tryAdd}>＋ Add Highlight</button>
      </div>

      <div className="row spread wrap" style={{ gap: 10 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          {[
            { k: 'all', l: 'All' },
            { k: 'session', l: "Today's Session" },
            { k: 'match', l: 'Match Clips' },
          ].map((f) => (
            <button key={f.k} className={`chip ${filter === f.k ? 'active' : ''}`} onClick={() => setFilter(f.k)}>{f.l}</button>
          ))}
        </div>
        <select className="select" style={{ maxWidth: 200 }} value={playerFilter} onChange={(e) => setPlayerFilter(e.target.value)}>
          <option value="">All filmers</option>
          {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length ? (
        <div className="pairs-grid" style={{ marginTop: 16 }}>
          {filtered.map((v) => {
            const uploader = playerById[v.uploaderId]
            return (
              <div key={v.id} className="glass hoverable video-tile reveal" onClick={() => setActive(v)}>
                <VideoThumb video={v} onPlay={() => setActive(v)} />
                <div className="video-tile-body">
                  <div className="video-tile-title">{v.title}</div>
                  <div className="row spread" style={{ marginTop: 8 }}>
                    <span className="row" style={{ gap: 7 }}>
                      {uploader && <Avatar player={uploader} size={24} />}
                      <span className="faint" style={{ fontSize: 11.5 }}>{uploader?.name} · {fmtDate(v.date)}</span>
                    </span>
                    <button className="video-del" aria-label="Remove highlight" onClick={(e) => remove(e, v)}>✕</button>
                  </div>
                  {v.matchId && <span className="badge badge-doubles" style={{ marginTop: 8, display: 'inline-block' }}>🎥 match clip</span>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass card-pad empty-state" style={{ marginTop: 16 }}>
          <ShuttleDeco size={90} style={{ position: 'static', opacity: 0.25, margin: '0 auto 8px' }} />
          <div className="display" style={{ fontSize: 24 }}>No clips here yet</div>
          <p className="dim" style={{ fontSize: 13, margin: '6px 0 14px' }}>
            Paste a Google Drive link to add the first highlight reel. 🏸
          </p>
          <button className="btn btn-gold" onClick={tryAdd}>＋ Add Highlight</button>
        </div>
      )}

      <div className="fab-stack">
        <button className="fab fab-round" onClick={tryAdd} aria-label="Add highlight">＋</button>
      </div>

      {active && <VideoLightbox video={active} onClose={() => setActive(null)} />}
      {showAdd && <AddVideoModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
