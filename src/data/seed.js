import { buildSessions } from '../lib/sessions.js'
export const VENUES = ['Green Badminton Club']
export const SESSIONS = buildSessions()

// Real recorded results from the CBC (Ceylon Badminton Club) Wednesday session.
// Scores are entered by the club scorekeeper (see AppContext.recordMatch) and
// persisted locally / synced via the optional Supabase backend. Player id map:
//   PJ (Priyan) = p5 · Tharindu = p1 · Muditha = p3 · Richy = p16 ·
//   Gayan = p14 · Ijaz = p15 · Iresh = p2
// All doubles, first-to-21 (win by 2). Ordered by the time each was called.
export const MATCHES = [
  {
    id: 'm-2026-07-08-1', sessionId: null, date: '2026-07-08', time: '20:30', court: 1,
    type: 'doubles', teamA: ['p5', 'p1'], teamB: ['p3', 'p16'],
    sets: [[21, 15]], winner: 'A', live: false,
  },
  {
    id: 'm-2026-07-08-2', sessionId: null, date: '2026-07-08', time: '20:31', court: 1,
    type: 'doubles', teamA: ['p5', 'p1'], teamB: ['p3', 'p14'],
    sets: [[21, 10]], winner: 'A', live: false,
  },
  {
    id: 'm-2026-07-08-3', sessionId: null, date: '2026-07-08', time: '21:01', court: 1,
    type: 'doubles', teamA: ['p5', 'p3'], teamB: ['p14', 'p16'],
    sets: [[21, 8]], winner: 'A', live: false,
  },
  {
    id: 'm-2026-07-08-4', sessionId: null, date: '2026-07-08', time: '21:03', court: 1,
    type: 'doubles', teamA: ['p14', 'p16'], teamB: ['p3', 'p5'],
    sets: [[21, 17]], winner: 'A', live: false,
  },
  {
    id: 'm-2026-07-08-5', sessionId: null, date: '2026-07-08', time: '21:32', court: 1,
    type: 'doubles', teamA: ['p16', 'p3'], teamB: ['p1', 'p15'],
    sets: [[13, 21]], winner: 'B', live: false,
  },
  {
    id: 'm-2026-07-08-6', sessionId: null, date: '2026-07-08', time: '21:33', court: 1,
    type: 'doubles', teamA: ['p1', 'p15'], teamB: ['p16', 'p2'],
    sets: [[22, 20]], winner: 'A', live: false,
  },
  {
    id: 'm-2026-07-08-7', sessionId: null, date: '2026-07-08', time: '21:42', court: 1,
    type: 'doubles', teamA: ['p5', 'p2'], teamB: ['p1', 'p14'],
    sets: [[21, 15]], winner: 'A', live: false,
  },
  {
    id: 'm-2026-07-08-8', sessionId: null, date: '2026-07-08', time: '21:56', court: 1,
    type: 'doubles', teamA: ['p16', 'p3'], teamB: ['p1', 'p15'],
    sets: [[14, 21]], winner: 'B', live: false,
  },
]

// "Featured" session = the next upcoming one (always in the future), so
// countdowns count down and nothing reads as live.
export const TODAY_SESSION =
  SESSIONS.find((s) => s.status === 'live' || s.status === 'upcoming') || SESSIONS[SESSIONS.length - 1]
export const TODAY = TODAY_SESSION.date
// Start time of the next session (e.g. '20:00') — used by the countdowns.
export const TODAY_SESSION_START = TODAY_SESSION.time.split('–')[0]

// Reset: no seeded highlight reels. Members add real clips via "Add Highlight"
// once real matches exist.
export const VIDEO_SEED = []
