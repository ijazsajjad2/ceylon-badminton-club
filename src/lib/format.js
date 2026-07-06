export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** The last `n` calendar months as 'YYYY-MM' keys, oldest first, ending this month. */
export function lastNMonths(n, now = new Date()) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}
export function fmtFullDate(iso) {
  const dt = new Date(iso + 'T00:00:00')
  return `${DAYS[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`
}
export function dayName(iso) {
  const dt = new Date(iso + 'T00:00:00')
  return DAYS[dt.getDay()]
}

// Live-updating countdown to a target ISO date at a given time (default 16:00).
export function countdownTo(targetIso, now = new Date(), time = '16:00') {
  const [h, mi] = time.split(':').map(Number)
  const target = new Date(targetIso + 'T00:00:00')
  target.setHours(h, mi, 0, 0)
  let diff = Math.max(0, target.getTime() - now.getTime())
  const d = Math.floor(diff / 86400000)
  diff -= d * 86400000
  const hh = Math.floor(diff / 3600000)
  diff -= hh * 3600000
  const mm = Math.floor(diff / 60000)
  diff -= mm * 60000
  const ss = Math.floor(diff / 1000)
  return { d, h: hh, m: mm, s: ss, done: target.getTime() <= now.getTime() }
}

// Validate one badminton set. Returns {valid, reason}.
export function validateSet(a, b) {
  if (a === '' || b === '' || a == null || b == null) return { valid: false, empty: true }
  a = Number(a)
  b = Number(b)
  if (Number.isNaN(a) || Number.isNaN(b) || a < 0 || b < 0) return { valid: false, reason: 'Scores must be 0+' }
  if (a > 30 || b > 30) return { valid: false, reason: 'Max score is 30' }
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  if (hi < 21) return { valid: false, reason: 'A set is first to 21' }
  if (hi === 30) {
    if (lo !== 29 && lo < 29) {
      // 30 wins regardless once cap reached (30-29 or 30-28 via... actually cap is hard 30)
      if (lo > 29) return { valid: false, reason: 'Invalid 30-point cap score' }
    }
    return { valid: true }
  }
  if (hi - lo < 2) return { valid: false, reason: 'Must win a set by 2' }
  if (hi > 21 && hi - lo !== 2) return { valid: false, reason: 'Past 20-20 you can only win by exactly 2 (or 30)' }
  return { valid: true }
}

export function whatsappShare(text) {
  const url = 'https://wa.me/?text=' + encodeURIComponent(text)
  window.open(url, '_blank', 'noopener')
}
