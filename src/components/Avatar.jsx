import { useState } from 'react'
import { initials, LEVELS } from '../data/players.js'

export default function Avatar({ player, size = 38, ring = false }) {
  const [photoFailed, setPhotoFailed] = useState(false)
  if (!player) return null
  const [c1, c2] = player.gradient || ['#444', '#222']
  // Subtle skill-level ring (Beginner silver -> Expert red) so avatars carry
  // meaning at a glance across the leaderboard, players and match cards.
  const lv = LEVELS[player.level]
  const levelRing = !ring && lv && size >= 32
    ? `0 0 0 1.5px var(--bg-2), 0 0 0 3px ${lv.color}66`
    : undefined
  // Real member photo when provided (drop files in public/avatars/ and set
  // photo: '/avatars/<id>.jpg' in players.js) — falls back to initials if the
  // file is missing or fails to load.
  const showPhoto = player.photo && !photoFailed
  return (
    <span
      className={`avatar${ring ? ' avatar-ring' : ''}`}
      title={player.name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        ...(levelRing ? { boxShadow: levelRing } : {}),
      }}
    >
      {showPhoto ? (
        <img
          src={player.photo}
          alt={player.name}
          onError={() => setPhotoFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit', display: 'block' }}
        />
      ) : (
        initials(player.name)
      )}
    </span>
  )
}
