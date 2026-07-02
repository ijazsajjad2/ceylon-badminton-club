import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

// Decorative badminton court lines with a very subtle scroll parallax.
// Renders as a low-opacity SVG behind section content (aria-hidden).
// Transform-only; static under prefers-reduced-motion.
export default function CourtLines({ className = '', opacity = 0.1, parallax = 26 }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [-parallax, parallax])

  const svg = (
    <svg viewBox="0 0 610 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <g fill="none" stroke="#f2c94c" strokeWidth="2" opacity="0.55">
        {/* outer boundary + doubles sidelines */}
        <rect x="5" y="10" width="600" height="300" rx="2" />
        <line x1="5" y1="32" x2="605" y2="32" />
        <line x1="5" y1="288" x2="605" y2="288" />
        {/* long service lines (doubles) */}
        <line x1="40" y1="10" x2="40" y2="310" />
        <line x1="570" y1="10" x2="570" y2="310" />
        {/* short service lines */}
        <line x1="240" y1="10" x2="240" y2="310" />
        <line x1="370" y1="10" x2="370" y2="310" />
        {/* centre lines to the short service lines */}
        <line x1="5" y1="160" x2="240" y2="160" />
        <line x1="370" y1="160" x2="605" y2="160" />
        {/* the net */}
        <line x1="305" y1="0" x2="305" y2="320" strokeWidth="3" stroke="#ffffff" opacity="0.5" strokeDasharray="3 6" />
      </g>
    </svg>
  )

  if (reduce) {
    return <div ref={ref} className={`court-lines ${className}`} style={{ opacity }}>{svg}</div>
  }
  return (
    <motion.div ref={ref} className={`court-lines ${className}`} style={{ opacity, y }}>
      {svg}
    </motion.div>
  )
}
