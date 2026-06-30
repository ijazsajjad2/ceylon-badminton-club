import { useState } from 'react'
import { driveThumbUrl, driveOpenUrl } from '../lib/drive.js'

export function fmtDuration(sec) {
  if (sec == null) return null
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Drive poster still with a graceful fallback when the file isn't shared
// publicly (the #1 user mistake) — an instructive placeholder, not a broken img.
export default function VideoThumb({ video, width = 640, onPlay }) {
  const [err, setErr] = useState(false)
  const dur = fmtDuration(video.durationSec)

  return (
    <div className="video-frame thumb">
      {err ? (
        <div className="video-fallback">
          <span className="vf-icon">⚠</span>
          <span className="vf-msg">
            This clip isn't public yet.<br />
            On Drive: <b>Share → Anyone with the link</b>
          </span>
          <a
            className="vf-open"
            href={driveOpenUrl(video.fileId)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Open in Drive ↗
          </a>
        </div>
      ) : (
        <>
          <img
            src={driveThumbUrl(video.fileId, width)}
            alt={video.title}
            loading="lazy"
            onError={() => setErr(true)}
          />
          {onPlay && (
            <button className="vf-play" aria-label={`Play ${video.title}`} onClick={onPlay}>
              <span className="vf-play-icon">▶</span>
            </button>
          )}
        </>
      )}
      {dur && <span className="vf-dur mono">{dur}</span>}
    </div>
  )
}
