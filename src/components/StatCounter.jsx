import { useEffect, useState } from 'react'

export default function StatCounter({ value, label, icon, duration = 1200 }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    let raf
    let startTs
    const from = 0
    const animate = (ts) => {
      if (!startTs) startTs = ts
      const p = Math.min(1, (ts - startTs) / duration)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setN(Math.round(from + eased * (value - from)))
      if (p < 1) raf = requestAnimationFrame(animate)
      else setN(value)
    }
    raf = requestAnimationFrame(animate)
    // Safety net: guarantee the final value lands even if rAF is throttled
    // (e.g. background/headless tabs throttle requestAnimationFrame).
    const settle = setTimeout(() => setN(value), duration + 120)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
    }
  }, [value, duration])

  return (
    <div className="glass stat-card hoverable">
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-num mono">{n}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
