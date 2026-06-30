import { useEffect, useState } from 'react'
import { countdownTo } from '../lib/format.js'

// Live-updating countdown to a target date/time, ticking every second.
export default function useCountdown(targetIso, time = '16:00') {
  const [cd, setCd] = useState(() => countdownTo(targetIso, new Date(), time))
  useEffect(() => {
    const id = setInterval(() => setCd(countdownTo(targetIso, new Date(), time)), 1000)
    return () => clearInterval(id)
  }, [targetIso, time])
  return cd
}
