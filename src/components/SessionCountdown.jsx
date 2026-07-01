import useCountdown from '../hooks/useCountdown.js'

// Live ticking countdown to the next session's start. `time` is the session's
// start in 24h "HH:MM" (e.g. Wednesday 20:00, Saturday 08:00).
export default function SessionCountdown({ dateIso, time = '20:00' }) {
  const cd = useCountdown(dateIso, time)

  if (cd.done) {
    return <div className="cd-live">🏸 Session is on — come play!</div>
  }

  const cells = [
    { v: cd.d, l: 'days' },
    { v: cd.h, l: 'hrs' },
    { v: cd.m, l: 'min' },
    { v: cd.s, l: 'sec' },
  ]

  return (
    <div className="countdown" role="timer" aria-label="Time until next session">
      {cells.map((c) => (
        <div className="cd-cell" key={c.l}>
          <span className="cd-num mono">{String(c.v).padStart(2, '0')}</span>
          <span className="cd-lbl">{c.l}</span>
        </div>
      ))}
    </div>
  )
}
