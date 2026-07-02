// ---- Sessions: Wednesday nights (8–10 PM) & Saturday mornings (8–10 AM)
//      at Green Badminton Club. Dates roll automatically off the real "now",
//      so the schedule always shows recent + upcoming Wed/Sat and nothing is
//      ever shown as live / in-session. ----
export const VENUES = ['Green Badminton Club']

const TIME_BY_DAY = { Wed: '20:00–22:00', Sat: '08:00–10:00' }
const SLOT_DOW = { 3: 'Wed', 6: 'Sat' } // JS day-of-week: 3 = Wed, 6 = Sat
const startHour = (day) => (day === 'Wed' ? 20 : 8)
const isoLocal = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// A session is "past" once its start time has passed; the rest are "upcoming".
function buildSessions(now = new Date()) {
  const upcoming = []
  for (let add = 0; add < 35 && upcoming.length < 4; add++) {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + add)
    const day = SLOT_DOW[d.getDay()]
    if (!day) continue
    const start = new Date(d); start.setHours(startHour(day), 0, 0, 0)
    if (start > now) upcoming.push({ date: isoLocal(d), day })
  }
  const past = []
  for (let sub = 0; sub < 80 && past.length < 8; sub++) {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - sub)
    const day = SLOT_DOW[d.getDay()]
    if (!day) continue
    const start = new Date(d); start.setHours(startHour(day), 0, 0, 0)
    if (start <= now) past.unshift({ date: isoLocal(d), day }) // oldest → newest
  }
  return [
    ...past.map((s) => ({ ...s, status: 'past' })),
    ...upcoming.map((s) => ({ ...s, status: 'upcoming' })),
  ]
}

const SESSION_DEFS = buildSessions()

export const SESSIONS = SESSION_DEFS.map((s, i) => ({
  id: 's' + (i + 1),
  date: s.date,
  day: s.day,
  time: TIME_BY_DAY[s.day],
  venue: VENUES[0],
  courts: 2,
  status: s.status,
  // Reset: no fake attendance history — real RSVPs build this up from here on.
  attendees: [],
  notes: '',
}))

// Reset: the club is starting its tracked history fresh. Real matches are
// recorded by the scorekeeper going forward (see AppContext.recordMatch) and
// persisted locally / synced via the optional Supabase backend — nothing here
// is seeded or invented.
export const MATCHES = []

// "Featured" session = the next upcoming one (always in the future), so
// countdowns count down and nothing reads as live.
export const TODAY_SESSION =
  SESSIONS.find((s) => s.status === 'upcoming') || SESSIONS[SESSIONS.length - 1]
export const TODAY = TODAY_SESSION.date
// Start time of the next session (e.g. '20:00') — used by the countdowns.
export const TODAY_SESSION_START = TODAY_SESSION.time.split('–')[0]

// Reset: no seeded highlight reels. Members add real clips via "Add Highlight"
// once real matches exist.
export const VIDEO_SEED = []
