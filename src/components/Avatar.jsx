import { initials } from '../data/players.js'

export default function Avatar({ player, size = 38, ring = false }) {
  if (!player) return null
  const [c1, c2] = player.gradient || ['#444', '#222']
  return (
    <span
      className={`avatar${ring ? ' avatar-ring' : ''}`}
      title={player.name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
      }}
    >
      {initials(player.name)}
    </span>
  )
}
