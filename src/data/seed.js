import { buildSessions } from '../lib/sessions.js'
export const VENUES = ['Green Badminton Club']
export const SESSIONS = buildSessions()

// Leaderboards reset on 3 October 2026 at the owner's request.
export const MATCHES = []

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
