import { useState } from 'react'
import Modal from './Modal.jsx'
import Avatar from './Avatar.jsx'
import { useApp } from '../context/AppContext.jsx'
import { driveEmbedUrl, driveOpenUrl } from '../lib/drive.js'
import { fmtDate } from '../lib/format.js'
import { fmtDuration } from './VideoThumb.jsx'

// Branded in-app player. Reuses Modal (→ portal, Escape, scroll-lock, focus trap).
export default function VideoLightbox({ video, onClose }) {
  const { playerById, matches } = useApp()
  const [loaded, setLoaded] = useState(false)
  const uploader = playerById[video.uploaderId]
  const match = video.matchId ? matches.find((m) => m.id === video.matchId) : null
  const dur = fmtDuration(video.durationSec)

  return (
    <Modal title={video.title} onClose={onClose}>
      <div className={`video-frame player ${loaded ? 'loaded' : ''}`}>
        {!loaded && <div className="skel video-skel" aria-hidden="true" />}
        <iframe
          src={driveEmbedUrl(video.fileId)}
          title={video.title}
          allow="autoplay; fullscreen"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="row spread wrap" style={{ marginTop: 14, gap: 10 }}>
        <div className="row" style={{ gap: 10 }}>
          {uploader && <Avatar player={uploader} size={30} />}
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{uploader ? uploader.name : 'Club'}</div>
            <div className="faint" style={{ fontSize: 11.5 }}>
              📅 {fmtDate(video.date)}{dur ? ` · ${dur}` : ''}
            </div>
          </div>
        </div>
        <a className="btn btn-sm btn-ghost" href={driveOpenUrl(video.fileId)} target="_blank" rel="noopener noreferrer">
          Open in Drive ↗
        </a>
      </div>

      {match && (
        <div className="glass card-pad" style={{ marginTop: 12, background: 'rgba(226,59,59,0.06)' }}>
          <span className="eyebrow">From this match</span>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginTop: 4 }}>
            {match.teamA.map((id) => playerById[id]?.name).join(' & ')}
            <span className="faint"> vs </span>
            {match.teamB.map((id) => playerById[id]?.name).join(' & ')}
          </div>
          <div className="faint mono" style={{ fontSize: 12, marginTop: 2 }}>
            {match.sets.map((s) => `${s[0]}-${s[1]}`).join('  ·  ')}
          </div>
        </div>
      )}
    </Modal>
  )
}
