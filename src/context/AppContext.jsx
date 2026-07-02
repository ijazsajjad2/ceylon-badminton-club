import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { PLAYERS } from '../data/players.js'
import { MATCHES, SESSIONS, TODAY_SESSION, VIDEO_SEED } from '../data/seed.js'
import { SCOREKEEPER_USERNAME } from '../data/credentials.js'
import { load, save } from '../lib/storage.js'
import { getSupabase, hasSupabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const duoKey = (a, b) => [a, b].sort().join('~')

// Seed "last session pairs" from the most recent past session's real duos,
// so the very first generated pairing already tries to avoid them.
function seedLastPairs(matches) {
  const past = SESSIONS.filter((s) => s.status === 'past')
  const last = past[past.length - 1]
  if (!last) return []
  const keys = new Set()
  for (const m of matches) {
    if (m.sessionId === last.id && m.type === 'doubles') {
      keys.add(duoKey(m.teamA[0], m.teamA[1]))
      keys.add(duoKey(m.teamB[0], m.teamB[1]))
    }
  }
  return [...keys]
}

// Local <-> Supabase row shape for matches (snake_case columns, jsonb arrays).
function matchToRow(m) {
  return {
    id: m.id,
    session_id: m.sessionId,
    date: m.date,
    time: m.time,
    court: m.court,
    type: m.type,
    team_a: m.teamA,
    team_b: m.teamB,
    sets: m.sets,
    winner: m.winner,
    live: !!m.live,
    recorded_by: m.recordedBy || null,
    confirmed_by: m.confirmedBy || [],
    updated_at: new Date().toISOString(),
  }
}
function rowToMatch(r) {
  return {
    id: r.id,
    sessionId: r.session_id,
    date: r.date,
    time: r.time,
    court: r.court,
    type: r.type,
    teamA: r.team_a,
    teamB: r.team_b,
    sets: r.sets,
    winner: r.winner,
    live: !!r.live,
    recordedBy: r.recorded_by,
    confirmedBy: r.confirmed_by || [],
  }
}

function initState() {
  // Always use the canonical PLAYERS list as source of truth for built-in members.
  // Any player added via the UI (id not in canonical set) is preserved on top.
  const canonicalIds = new Set(PLAYERS.map((p) => p.id))
  const stored = load('players', null)
  const extraPlayers = stored ? stored.filter((p) => !canonicalIds.has(p.id)) : []
  const players = [...PLAYERS, ...extraPlayers]

  // Matches start from the (empty) seed and are recorded by the scorekeeper
  // from here on — persisted locally, and synced via Supabase if configured.
  const matches = load('matches', MATCHES)

  return {
    players,
    matches,
    // Sessions are always derived fresh from the seed so the schedule
    // auto-rolls to the real upcoming Wed/Sat (never frozen in localStorage).
    sessions: SESSIONS,
    going: load('going', Object.fromEntries(TODAY_SESSION.attendees.map((id) => [id, true]))),
    lastSessionPairs: load('lastSessionPairs', seedLastPairs(matches)),
    videos: load('videos', VIDEO_SEED),
    draw: load('draw', null),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_MATCH': {
      // Upsert by id — used both for optimistic local writes and realtime echoes.
      const exists = state.matches.some((m) => m.id === action.match.id)
      const matches = exists
        ? state.matches.map((m) => (m.id === action.match.id ? action.match : m))
        : [action.match, ...state.matches]
      return { ...state, matches }
    }
    case 'REPLACE_MATCHES':
      return { ...state, matches: action.matches }
    case 'CONFIRM_MATCH': {
      return {
        ...state,
        matches: state.matches.map((m) => {
          if (m.id !== action.matchId) return m
          if (m.confirmedBy && m.confirmedBy.includes(action.who)) return m
          return { ...m, confirmedBy: [...(m.confirmedBy || []), action.who] }
        }),
      }
    }
    case 'ADD_PLAYER':
      return { ...state, players: [...state.players, action.player] }
    case 'UPDATE_PLAYER':
      return { ...state, players: state.players.map((p) => p.id === action.id ? { ...p, ...action.updates } : p) }
    case 'ADD_VIDEO':
      return { ...state, videos: [action.video, ...state.videos] }
    case 'DELETE_VIDEO':
      return { ...state, videos: state.videos.filter((v) => v.id !== action.id) }
    case 'SET_DRAW':
      return { ...state, draw: action.draw }
    case 'TOGGLE_GOING': {
      const going = { ...state.going }
      if (going[action.id]) delete going[action.id]
      else going[action.id] = true
      return { ...state, going }
    }
    case 'SET_GOING': {
      // Idempotent set (used by RSVP + realtime sync — safe against echoes).
      const going = { ...state.going }
      if (action.value) going[action.id] = true
      else delete going[action.id]
      return { ...state, going }
    }
    case 'REPLACE_GOING':
      return { ...state, going: action.going }
    case 'SET_LAST_PAIRS':
      return { ...state, lastSessionPairs: action.keys }
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.session].sort((a, b) => a.date.localeCompare(b.date)),
      }
    case 'RESET':
      return initState()
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)
  const { user: authUser, isScorekeeper } = useAuth()

  // Persist slices (sessions intentionally NOT persisted — derived from seed)
  useEffect(() => save('players', state.players), [state.players])
  useEffect(() => save('matches', state.matches), [state.matches])
  useEffect(() => save('going', state.going), [state.going])
  useEffect(() => save('lastSessionPairs', state.lastSessionPairs), [state.lastSessionPairs])
  useEffect(() => save('videos', state.videos), [state.videos])
  useEffect(() => save('draw', state.draw), [state.draw])

  const pushToast = useCallback((message, kind = 'info') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3400)
  }, [])

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  // RSVP for a player. Updates local state immediately (optimistic), and — when
  // a Supabase project is configured — writes to the shared roster so every
  // device sees it. Any backend error is swallowed so the app stays usable.
  const rsvp = useCallback(async (playerId, value) => {
    dispatch({ type: 'SET_GOING', id: playerId, value })
    if (!hasSupabase) return
    try {
      const sb = await getSupabase()
      if (!sb) return
      await sb.from('attendance').upsert(
        { session_date: TODAY_SESSION.date, player_id: playerId, going: value, updated_at: new Date().toISOString() },
        { onConflict: 'session_date,player_id' }
      )
    } catch { /* stay local on any backend error */ }
  }, [])

  // Record a match score. Client-side gated to the scorekeeper account only
  // (SCOREKEEPER_USERNAME) — this is a convenience gate like the rest of the
  // login system, not server-enforced security. Writes locally, and syncs to
  // Supabase (if configured) so every member's device can see and confirm it.
  const recordMatch = useCallback(async (match) => {
    if (!authUser || authUser.username !== SCOREKEEPER_USERNAME) {
      pushToast('Only the club scorekeeper can record match scores.', 'error')
      return { ok: false }
    }
    const full = { ...match, confirmedBy: [], recordedBy: authUser.username }
    dispatch({ type: 'SET_MATCH', match: full })
    if (hasSupabase) {
      try {
        const sb = await getSupabase()
        if (sb) await sb.from('matches').upsert(matchToRow(full))
      } catch { /* stay local on any backend error */ }
    }
    return { ok: true }
  }, [authUser, pushToast])

  // Any signed-in member can confirm a recorded result actually happened as
  // scored. The ranking always includes every match regardless of
  // confirmation — this only marks the match itself as confirmed.
  const confirmMatch = useCallback(async (matchId) => {
    if (!authUser) return
    const who = authUser.username
    dispatch({ type: 'CONFIRM_MATCH', matchId, who })
    if (!hasSupabase) return
    try {
      const sb = await getSupabase()
      if (!sb) return
      const { data } = await sb.from('matches').select('confirmed_by').eq('id', matchId).maybeSingle()
      const current = (data && data.confirmed_by) || []
      if (!current.includes(who)) {
        await sb.from('matches').update({ confirmed_by: [...current, who], updated_at: new Date().toISOString() }).eq('id', matchId)
      }
    } catch { /* stay local on any backend error */ }
  }, [authUser])

  // When a shared backend is configured, load the live roster for today's
  // session and subscribe to realtime changes. No-op otherwise.
  useEffect(() => {
    if (!hasSupabase) return
    let channel = null
    let alive = true
    ;(async () => {
      try {
        const sb = await getSupabase()
        if (!sb || !alive) return
        const { data } = await sb
          .from('attendance')
          .select('player_id, going')
          .eq('session_date', TODAY_SESSION.date)
        if (data && alive) {
          const map = {}
          for (const row of data) if (row.going) map[row.player_id] = true
          dispatch({ type: 'REPLACE_GOING', going: map })
        }
        channel = sb
          .channel('attendance-' + TODAY_SESSION.date)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'attendance', filter: `session_date=eq.${TODAY_SESSION.date}` },
            (payload) => {
              const row = payload.new && payload.new.player_id ? payload.new : payload.old
              if (!row) return
              const value = payload.eventType !== 'DELETE' && !!(payload.new && payload.new.going)
              dispatch({ type: 'SET_GOING', id: row.player_id, value })
            }
          )
          .subscribe()
      } catch { /* stay local */ }
    })()
    return () => {
      alive = false
      try { channel && channel.unsubscribe() } catch { /* ignore */ }
    }
  }, [])

  // Same pattern for the shared match ledger: initial load + realtime upserts.
  useEffect(() => {
    if (!hasSupabase) return
    let channel = null
    let alive = true
    ;(async () => {
      try {
        const sb = await getSupabase()
        if (!sb || !alive) return
        const { data } = await sb.from('matches').select('*').order('date', { ascending: false })
        if (data && alive) {
          dispatch({ type: 'REPLACE_MATCHES', matches: data.map(rowToMatch) })
        }
        channel = sb
          .channel('matches-all')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'matches' },
            (payload) => {
              if (payload.eventType === 'DELETE') return
              dispatch({ type: 'SET_MATCH', match: rowToMatch(payload.new) })
            }
          )
          .subscribe()
      } catch { /* stay local */ }
    })()
    return () => {
      alive = false
      try { channel && channel.unsubscribe() } catch { /* ignore */ }
    }
  }, [])

  const playerById = useMemo(() => {
    const map = {}
    for (const p of state.players) map[p.id] = p
    return map
  }, [state.players])

  const goingIds = useMemo(() => Object.keys(state.going).filter((id) => state.going[id]), [state.going])

  const videosByMatch = useMemo(() => {
    const m = {}
    for (const v of state.videos) if (v.matchId) (m[v.matchId] ||= []).push(v)
    return m
  }, [state.videos])

  const value = useMemo(
    () => ({
      ...state, dispatch, rsvp, recordMatch, confirmMatch, isScorekeeper,
      sharedRoster: hasSupabase, toasts, pushToast, dismissToast, playerById, goingIds, videosByMatch,
    }),
    [state, rsvp, recordMatch, confirmMatch, isScorekeeper, toasts, pushToast, dismissToast, playerById, goingIds, videosByMatch]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
