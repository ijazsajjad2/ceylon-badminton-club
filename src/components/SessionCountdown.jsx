import { useTranslation } from 'react-i18next'
import useCountdown from '../hooks/useCountdown.js'

// Live ticking countdown to the next session's start. `time` is the session's
// start in 24h "HH:MM" (e.g. Wednesday 20:00, Saturday 08:00).
export default function SessionCountdown({ dateIso, time = '20:00' }) {
  const { i18n } = useTranslation()
  const ar = i18n.language === 'ar'
  const cd = useCountdown(dateIso, time)

  if (cd.done) {
    return <div className="cd-live">{ar ? '🏸 الحصة جارية الآن' : '🏸 Session in progress'}</div>
  }

  const cells = [
    { v: cd.d, l: ar ? 'أيام' : 'days' },
    { v: cd.h, l: ar ? 'ساعات' : 'hrs' },
    { v: cd.m, l: ar ? 'دقائق' : 'min' },
    { v: cd.s, l: ar ? 'ثوانٍ' : 'sec' },
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
