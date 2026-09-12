export const CLUB_TIMEZONE = 'Asia/Riyadh'
export function riyadhDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CLUB_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function buildSessions(now = new Date()) {
  const today = new Date(`${riyadhDate(now)}T12:00:00Z`)
  const sessions = []
  for (let offset = -28; offset <= 35; offset++) {
    const day = new Date(today)
    day.setUTCDate(day.getUTCDate() + offset)
    const dow = day.getUTCDay()
    if (dow !== 3 && dow !== 6) continue
    const date = day.toISOString().slice(0, 10)
    const time = dow === 3 ? '20:00–22:00' : '08:00–10:00'
    const start = new Date(`${date}T${time.split('–')[0]}:00+03:00`)
    const end = new Date(`${date}T${time.split('–')[1]}:00+03:00`)
    sessions.push({ id: `session-${date}`, date, day: dow === 3 ? 'Wed' : 'Sat', time,
      venue: 'Green Badminton Club', courts: 2, attendees: [], notes: '',
      status: end <= now ? 'past' : start <= now ? 'live' : 'upcoming' })
  }
  return sessions
}

export function sessionCalendar(session, now = new Date()) {
  const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const [start, end] = session.time.split('–')
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ceylon Badminton Club//Sessions//EN',
    'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:cbc-${session.date}@ceylonbadminton.com`,
    `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(new Date(`${session.date}T${start}:00+03:00`))}`,
    `DTEND:${stamp(new Date(`${session.date}T${end}:00+03:00`))}`,
    'SUMMARY:Ceylon Badminton Club session', 'LOCATION:Green Badminton Club - Riyadh',
    'DESCRIPTION:Confirm your place with the club before attending.',
    'URL:https://ceylonbadminton.com/', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n')
}

export function downloadSession(session) {
  const url = URL.createObjectURL(new Blob([sessionCalendar(session)], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `cbc-${session.date}.ics`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
