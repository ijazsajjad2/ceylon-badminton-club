import { useMemo, useState } from 'react'
import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'
import { parseDriveVideo, driveThumbUrl, driveOpenUrl } from '../lib/drive.js'
import { fmtDate } from '../lib/format.js'
import { TODAY } from '../data/seed.js'

function matchLabel(m, playerById) {
  const a = m.teamA.map((id) => playerById[id]?.name.replace(/ .*/, '')).join('/')
  const b = m.teamB.map((id) => playerById[id]?.name.replace(/ .*/, '')).join('/')
  return `${fmtDate(m.date)} · ${a} vs ${b}`
}

function parseDuration(str) {
  if (!str) return null
  const m = str.match(/^(\d{1,2}):(\d{2})$/)
  if (m) return Number(m[1]) * 60 + Number(m[2])
  if (/^\d+$/.test(str)) return Number(str)
  return null
}

export default function AddVideoModal({ onClose, presetMatchId = null }) {
  const { players, matches, playerById, dispatch, pushToast } = useApp()
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [uploaderId, setUploaderId] = useState('')
  const [duration, setDuration] = useState('')
  const [date, setDate] = useState(TODAY)
  const [matchId, setMatchId] = useState(presetMatchId || '')
  const [showErr, setShowErr] = useState(false)
  const [thumbErr, setThumbErr] = useState(false)

  const parsed = useMemo(() => parseDriveVideo(url), [url])
  const recentMatches = useMemo(() => matches.filter((m) => !m.live).slice(0, 30), [matches])

  const canSave = parsed.ok && title.trim() && uploaderId

  const save = () => {
    setShowErr(true)
    if (!parsed.ok) {
      pushToast(parsed.error, 'error')
      return
    }
    if (!title.trim() || !uploaderId) {
      pushToast('Add a title and who filmed it', 'error')
      return
    }
    const m = matchId ? matches.find((x) => x.id === matchId) : null
    const video = {
      id: 'v' + Date.now(),
      fileId: parsed.id,
      title: title.trim(),
      uploaderId,
      date,
      durationSec: parseDuration(duration),
      matchId: matchId || null,
      sessionId: m ? m.sessionId : null,
      createdAt: Date.now(),
    }
    dispatch({ type: 'ADD_VIDEO', video })
    pushToast('Highlight added 🎬', 'success')
    onClose()
  }

  return (
    <Modal
      title="Add Highlight"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={save}>Add Highlight</button>
        </>
      }
    >
      <div className="field">
        <label>Google Drive share link</label>
        <input
          className={`input ${showErr && !parsed.ok && url ? 'err' : ''}`}
          placeholder="https://drive.google.com/file/d/…/view"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setThumbErr(false) }}
        />
        <div className="faint" style={{ fontSize: 11.5, marginTop: 5 }}>
          On Drive: right-click the video → <b>Share → Anyone with the link</b>, then paste it here.
        </div>
        {showErr && url && !parsed.ok && <div className="err-text">{parsed.error}</div>}
      </div>

      {/* Live thumbnail preview — confirm the right clip before saving */}
      {parsed.ok && (
        <div className="field">
          <label>Preview</label>
          <div className="video-frame">
            {thumbErr ? (
              <div className="video-fallback">
                <span className="vf-icon">⚠</span>
                <span className="vf-msg">Can't load a preview — make sure it's shared <b>Anyone with the link</b>.</span>
                <a className="vf-open" href={driveOpenUrl(parsed.id)} target="_blank" rel="noopener noreferrer">Open in Drive ↗</a>
              </div>
            ) : (
              <img src={driveThumbUrl(parsed.id, 640)} alt="preview" onError={() => setThumbErr(true)} />
            )}
          </div>
        </div>
      )}

      <div className="field">
        <label>Title</label>
        <input className={`input ${showErr && !title.trim() ? 'err' : ''}`} placeholder="e.g. 21–19 thriller, last-point smash" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="field-row">
        <div className="field">
          <label>Filmed by</label>
          <select className={`select ${showErr && !uploaderId ? 'err' : ''}`} value={uploaderId} onChange={(e) => setUploaderId(e.target.value)}>
            <option value="">— select —</option>
            {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Duration (m:ss)</label>
          <input className="input mono" placeholder="0:45" value={duration} onChange={(e) => setDuration(e.target.value.replace(/[^\d:]/g, '').slice(0, 5))} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>Date</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="field">
          <label>Attach to match (optional)</label>
          <select className="select" value={matchId} onChange={(e) => setMatchId(e.target.value)}>
            <option value="">— standalone highlight —</option>
            {recentMatches.map((m) => <option key={m.id} value={m.id}>{matchLabel(m, playerById)}</option>)}
          </select>
        </div>
      </div>
    </Modal>
  )
}
