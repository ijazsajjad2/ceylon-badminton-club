import { motion, useReducedMotion } from 'framer-motion'
import Avatar from './Avatar.jsx'

// Premium member card: avatar, name, level, real match stats, hover lift +
// border glow + shine sweep (CSS), staggered entrance via parent variants.
export default function MemberCard({ player, stat, index = 0 }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className="member-card glass"
      variants={
        reduce
          ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
          : { hidden: { opacity: 0, y: 18, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1 } }
      }
      transition={{ duration: 0.45, delay: (index % 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
    >
      <span className="member-card-shuttle" aria-hidden="true">🏸</span>
      <Avatar player={player} size={52} />
      <div className="member-card-name">{player.name}</div>
      <div className="member-card-level">{player.level}</div>
      <div className="member-card-stat mono">
        {stat ? `${stat.played} games · ${stat.winPct}% win` : 'New member'}
      </div>
    </motion.div>
  )
}
