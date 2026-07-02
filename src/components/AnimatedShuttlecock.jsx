import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// Reusable animated shuttlecock. Modes:
//   hero  — flies a looping rally path across its stage with a glowing trail.
//   rally — ping-pongs between two points (Weekly Sessions cards); cards can
//           pulse on the same period so the glow lands as it arrives.
//   float — gentle decorative bob.
// The stage is measured (ResizeObserver) and paths are animated with pure
// x/y transforms + opacity — no layout properties, GPU-friendly. All modes
// render a static low-opacity shuttle under prefers-reduced-motion.

export function ShuttleGlyph({ size = 44, glow = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"
      style={glow ? { filter: 'drop-shadow(0 0 10px rgba(242,201,76,0.55))' } : undefined}>
      <circle cx="32" cy="48" r="10" fill="#f2c94c" />
      <circle cx="32" cy="48" r="10" fill="none" stroke="#0a1020" strokeWidth="1.6" opacity="0.55" />
      <g stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.95">
        <path d="M32 40 L19 9" /><path d="M32 40 L26 7" /><path d="M32 40 L32 6" />
        <path d="M32 40 L38 7" /><path d="M32 40 L45 9" />
      </g>
      <path d="M21 15 L43 15" stroke="#f2c94c" strokeWidth="2" opacity="0.8" />
      <path d="M24 23 L40 23" stroke="#f2c94c" strokeWidth="2" opacity="0.8" />
    </svg>
  )
}

// Waypoints as fractions of the stage; converted to px transforms once measured.
const PATHS = {
  hero: {
    x: [-0.06, 0.18, 0.42, 0.66, 0.92, 1.04, 1.04, 0.8, 0.52, 0.24, -0.06, -0.06],
    y: [0.58, 0.18, 0.44, 0.1, 0.4, 0.62, 0.62, 0.24, 0.48, 0.16, 0.55, 0.58],
    rotate: [35, 80, 45, 85, 50, 30, 30, -60, -40, -70, -35, 35],
    opacity: [0, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0],
    times: [0, 0.1, 0.2, 0.3, 0.4, 0.47, 0.5, 0.62, 0.74, 0.86, 0.97, 1],
  },
  rally: {
    x: [0.06, 0.28, 0.48, 0.68, 0.88, 0.68, 0.48, 0.28, 0.06],
    y: [0.55, 0.12, 0.4, 0.12, 0.55, 0.12, 0.4, 0.12, 0.55],
    rotate: [45, 70, 55, 70, 40, -70, -55, -70, -45],
    opacity: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    times: undefined,
  },
}

function useStageSize() {
  const ref = useRef(null)
  const [size, setSize] = useState(null)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (r && r.width > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}

export default function AnimatedShuttlecock({
  mode = 'float',
  size = 44,
  duration = 12,
  delay = 0,
  className = '',
  style,
}) {
  const reduce = useReducedMotion()
  const [stageRef, stage] = useStageSize()

  if (reduce) {
    return (
      <span className={`shuttle-static ${className}`} style={style} aria-hidden="true">
        <ShuttleGlyph size={size} glow={false} />
      </span>
    )
  }

  if (mode === 'hero' || mode === 'rally') {
    const p = PATHS[mode]
    const frames = stage && {
      x: p.x.map((f) => Math.round(f * stage.w - size / 2)),
      y: p.y.map((f) => Math.round(f * stage.h - size / 2)),
      rotate: p.rotate,
      opacity: p.opacity,
    }
    const transition = { duration, delay, repeat: Infinity, ease: 'easeInOut', times: p.times }
    return (
      <div ref={stageRef} className={`shuttle-stage ${className}`} style={style} aria-hidden="true">
        {frames && mode === 'hero' &&
          [0.22, 0.13, 0.06].map((op, i) => (
            <motion.span
              key={`${stage.w}x${stage.h}-g${i}`}
              className="shuttle-flyer shuttle-ghost"
              animate={{ ...frames, opacity: frames.opacity.map((o) => o * op) }}
              transition={{ ...transition, delay: delay + (i + 1) * 0.09 }}
            >
              <ShuttleGlyph size={size} glow={false} />
            </motion.span>
          ))}
        {frames && (
          <motion.span
            key={`${stage.w}x${stage.h}`}
            className="shuttle-flyer"
            animate={frames}
            transition={transition}
          >
            <ShuttleGlyph size={size} />
          </motion.span>
        )}
      </div>
    )
  }

  // float
  return (
    <motion.span
      className={`shuttle-static ${className}`}
      style={style}
      aria-hidden="true"
      animate={{ y: [0, -14, 0], rotate: [0, 7, 0] }}
      transition={{ duration: 8, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ShuttleGlyph size={size} glow={false} />
    </motion.span>
  )
}
