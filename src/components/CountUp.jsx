import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'

// Animated number that counts up from 0 to `value` the first time it scrolls
// into view (easeOutCubic). Honors prefers-reduced-motion by snapping straight
// to the final value, and has a timeout safety-net so throttled rAF (background
// tabs) still lands the real number.
export default function CountUp({ value, duration = 1400, suffix = '', className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()
  const [n, setN] = useState(0)

  useEffect(() => {
    if (reduce) { setN(value); return }
    if (!inView) return
    let raf
    let start
    const tick = (ts) => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setN(value)
    }
    raf = requestAnimationFrame(tick)
    const settle = setTimeout(() => setN(value), duration + 150)
    return () => { cancelAnimationFrame(raf); clearTimeout(settle) }
  }, [inView, value, duration, reduce])

  return <span ref={ref} className={className}>{n}{suffix}</span>
}
