import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { PLAYERS } from '../data/players.js'
import { MATCHES, SESSIONS, TODAY_SESSION, VIDEO_SEED } from '../data/seed.js'
import { load, save } from '../lib/storage.js'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const duoKey = (a, b) => [a, b].sort().join('~')

// Seed "last session pairs" from the most recent past session's real duos,
// so the very first generated pairing already tries to avoid them.
function seedLastPairs() {
  const past = SESSIONS.filter((s) => s.status === 'past')
  const last = past[past.length - 1]
  if (!last) return []
  const keys = new Set()
  for (const m of MATCHES) {
    if (m.sessionId === last.id && m.type === 'doubles') {
      keys.add(duoKey(m.teamA[0], m.teamA[1]))
      keys.add(duoKey(m.teamB[0], m.teamB[1]))
    }
  }
  return [...keys]
}

function initState() {
  // Always use the canonical PLAYERS list as source of truth for built-in members.
  // Any player added via the UI (id not in canonical set) is preserved on top.
  const canonicalIds = new Set(PLAYERS.map((p) => p.id))
  const stored = load('players', null)
  const extraPlayers = stored ? stored.filter((p) => !canonicalIds.has(p.id)) : []
  const players = [...PLAYERS, ...extraPlayers]

  return {
    players,
    // Sessions & matches are always derived fresh from the seed so the schedule
    // auto-rolls to the real upcoming Wed/Sat (never frozen in localStorage).
    matches: MATCHES,
    sessions: SESSIONS,
    going: load('going', Object.fromEntries(TODAY_SESSION.attendees.map((id) => [id, true]))),
    lastSessionPairs: load('lastSessionPairs', seedLastPairs()),
    videos: load('videos', VIDEO_SEED),
    draw: load('draw', null),
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_MATCH':
      return { ...state, matches: [action.match, ...state.matches] }
    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map((m) => (m.id === action.match.id ? action.match : m)),
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

  // Persist slices (matches & sessions intentionally NOT persisted — derived from seed)
  useEffect(() => save('players', state.players), [state.players])
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
    () => ({ ...state, dispatch, toasts, pushToast, dismissToast, playerById, goingIds, videosByMatch }),
    [state, toasts, pushToast, dismissToast, playerById, goingIds, videosByMatch]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
