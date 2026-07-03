import { initials, LEVELS } from '../data/players.js'

export default function Avatar({ player, size = 38, ring = false }) {
  if (!player) return null
  const [c1, c2] = player.gradient || ['#444', '#222']
  // Subtle skill-level ring (Beginner silver -> Expert red) so avatars carry
  // meaning at a glance across the leaderboard, players and match cards.
  const lv = LEVELS[player.level]
  const levelRing = !ring && lv && size >= 32
    ? `0 0 0 1.5px var(--bg-2), 0 0 0 3px ${lv.color}66`
    : undefined
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
      {initials(player.name)}
    </span>
  )
}
