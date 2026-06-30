import { PLAYERS } from './players.js'

// Deterministic PRNG so the seeded sample data is stable & well-distributed.
// (Live pairing on the Participation page uses Math.random per the spec.)
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260614)
const rint = (n) => Math.floor(rnd() * n)
const pick = (arr) => arr[rint(arr.length)]
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = rint(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const ids = PLAYERS.map((p) => p.id)
const duoKey = (a, b) => [a, b].sort().join('~')

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
  // every session a different random crowd shows up
  attendees: s.status === 'upcoming' ? [] : shuffle(ids).slice(0, 8 + rint(5)),
  notes: '',
}))

// ---- Realistic badminton set generator (first to 21, win by 2, cap 30) ----
function makeSet(winnerSide) {
  // winnerSide: 'A' or 'B'
  let w, l
  const r = rnd()
  if (r < 0.12) {
    // deuce battle
    const top = 22 + rint(8) // 22..29 (we keep <30 mostly)
    w = Math.min(top, 30)
    l = w - 2
  } else if (r < 0.4) {
    // tight finish
    w = 21
    l = 18 + rint(2) // 18..19
  } else {
    // comfortable
    w = 21
    l = 11 + rint(6) // 11..16
  }
  return winnerSide === 'A' ? [w, l] : [l, w]
}

function makeMatchScore() {
  // Decide overall winner, then build best-of-3
  const winner = rnd() < 0.5 ? 'A' : 'B'
  const straight = rnd() < 0.58
  const sets = []
  if (straight) {
    sets.push(makeSet(winner))
    sets.push(makeSet(winner))
  } else {
    const other = winner === 'A' ? 'B' : 'A'
    // loser steals one set
    const order = shuffle([winner, other, winner])
    // ensure winner takes 2 of 3
    sets.push(makeSet(order[0]))
    sets.push(makeSet(order[1]))
    sets.push(makeSet(order[2]))
  }
  return { winner, sets }
}

// ---- Build a varied match history with NO repeating same-team duo ----
const usedDuos = new Set()
let matchSeq = 0

function tryDoubles(attendees) {
  // attempt to form a doubles match using only fresh same-team duos
  for (let attempt = 0; attempt < 40; attempt++) {
    const four = shuffle(attendees).slice(0, 4)
    if (four.length < 4) return null
    const a = [four[0], four[1]]
    const b = [four[2], four[3]]
    const ka = duoKey(a[0], a[1])
    const kb = duoKey(b[0], b[1])
    if (ka === kb || usedDuos.has(ka) || usedDuos.has(kb)) continue
    usedDuos.add(ka)
    usedDuos.add(kb)
    return { teamA: a, teamB: b }
  }
  return null
}

function buildMatch(session, { live = false } = {}) {
  const attendees = session.attendees
  const wantDoubles = rnd() < 0.78 && attendees.length >= 4
  let type, teamA, teamB
  if (wantDoubles) {
    const d = tryDoubles(attendees)
    if (!d) return null
    type = 'doubles'
    teamA = d.teamA
    teamB = d.teamB
  } else {
    const two = shuffle(attendees).slice(0, 2)
    if (two.length < 2) return null
    type = 'singles'
    teamA = [two[0]]
    teamB = [two[1]]
  }
  const { winner, sets } = makeMatchScore()
  const court = 1 + rint(session.courts)
  // Match times fall inside the session's own 2-hour window (Wed 20–22, Sat 08–10).
  const startH = parseInt(session.time, 10)
  const hour = startH + rint(2)
  const min = pick(['00', '15', '30', '45'])
  matchSeq++
  return {
    id: 'm' + matchSeq,
    sessionId: session.id,
    date: session.date,
    time: `${String(hour).padStart(2, '0')}:${min}`,
    court,
    type,
    teamA,
    teamB,
    sets: live ? sets.slice(0, 1).map(([a, b]) => [Math.min(a, 15 + rint(5)), Math.min(b, 14 + rint(5))]) : sets,
    winner: live ? null : winner,
    live,
  }
}

const built = []
for (const session of SESSIONS) {
  if (session.status === 'upcoming') continue
  const count =
    session.status === 'today' ? 3 : 2 + rint(2) // today gets a few, past 2-3
  for (let i = 0; i < count; i++) {
    const live = session.status === 'today' && i === 0
    const m = buildMatch(session, { live })
    if (m) built.push(m)
  }
}

// Make sure we have 20+ matches; top up from past sessions if needed.
let guard = 0
while (built.length < 22 && guard < 200) {
  guard++
  const session = pick(SESSIONS.filter((s) => s.status === 'past'))
  const m = buildMatch(session)
  if (m) built.push(m)
}

export const MATCHES = built.sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return a.time < b.time ? 1 : -1
})

// "Featured" session = the next upcoming one (always in the future), so
// countdowns count down and nothing reads as live.
export const TODAY_SESSION =
  SESSIONS.find((s) => s.status === 'upcoming') || SESSIONS[SESSIONS.length - 1]
export const TODAY = TODAY_SESSION.date
// Start time of the next session (e.g. '20:00') — used by the countdowns.
export const TODAY_SESSION_START = TODAY_SESSION.time.split('–')[0]

// ---- Sample match-video highlights (Google Drive) ----
// fileIds below are clearly-demo placeholders: they gracefully trigger the
// "make this public on Drive" fallback so the feature is visible on first run.
// The club replaces them by pasting real Drive share links via "Add Highlight".
const _clipMatches = MATCHES.filter((m) => m.type === 'doubles' && !m.live).slice(0, 3)
export const VIDEO_SEED = [
  {
    id: 'v1',
    fileId: '1AbCdEfGhIjKlMnOpQrStUvWxYz012345DEMO',
    title: '21–19 thriller — match-point smash',
    uploaderId: 'p1',
    date: _clipMatches[0]?.date || TODAY,
    durationSec: 47,
    matchId: _clipMatches[0]?.id || null,
    sessionId: _clipMatches[0]?.sessionId || null,
    createdAt: 0,
  },
  {
    id: 'v2',
    fileId: '1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654DEMO',
    title: 'Net battle of the night 🪶',
    uploaderId: 'p7',
    date: _clipMatches[1]?.date || TODAY,
    durationSec: 32,
    matchId: _clipMatches[1]?.id || null,
    sessionId: _clipMatches[1]?.sessionId || null,
    createdAt: 0,
  },
  {
    id: 'v3',
    fileId: '1QwErTyUiOpAsDfGhJkLzXcVbNm135790DEMO',
    title: 'Best rallies — June sessions reel',
    uploaderId: 'p3',
    date: TODAY,
    durationSec: 96,
    matchId: null,
    sessionId: null,
    createdAt: 0,
  },
]
