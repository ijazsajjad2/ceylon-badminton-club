import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, useCallback } from 'react'
import { PLAYERS } from '../data/players.js'
import { MATCHES, SESSIONS, TODAY_SESSION, VIDEO_SEED } from '../data/seed.js'
import { load, save } from '../lib/storage.js'
import { getSupabase, hasSupabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'
import { buildSessions } from '../lib/sessions.js'
import { readMatchLedger } from '../lib/results.js'

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
    ...(m.editReason ? { edit_reason: m.editReason, edit_base_version: m.revision || 1 } : {}),
    updated_at: new Date().toISOString(),
  }
}
function rowToMatch(r) {
  return {
    id: r.id,
    revision: r.revision || 1,
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
    confirmedBy: [...new Set([...(r.confirmed_by || []), ...(r.match_confirmations || []).map((c) => c.username)])],
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
  const matches = load('matches-reset-20261003', MATCHES)

  return {
    players,
    matches,
    // Sessions are always derived fresh from the seed so the schedule
    // auto-rolls to the real upcoming Wed/Sat (never frozen in localStorage).
    sessions: SESSIONS,
    going: load('going-' + TODAY_SESSION.date, {}),
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
    case 'REPLACE_PLAYERS': return { ...state, players: action.players }
    case 'REPLACE_VIDEOS': return { ...state, videos: action.videos }
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
  const [outbox, setOutbox] = useState(() => load('sync-outbox-v2', load('sync-outbox-v1', []).filter(item => item.kind === 'attendance')))
  const outboxRef = useRef(outbox)
  const busyRef = useRef(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [readStatus, setReadStatus] = useState(hasSupabase ? 'loading' : 'unconfigured')
  const [refreshKey, setRefreshKey] = useState(0)
  const [sessionSettings,setSessionSettings]=useState([])
  const [clock, setClock] = useState(() => Date.now())
  const sessions = useMemo(() => buildSessions(new Date(clock)).map(s=>({...s,...sessionSettings.find(row=>row.date===s.date)})).filter(s=>!s.cancelled), [clock,sessionSettings])
  const currentSession = sessions.find((s) => s.status !== 'past') || TODAY_SESSION
  const sessionDate = currentSession.date

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000)
    const onOnline = () => { setOnline(true); setRefreshKey((key) => key + 1) }
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { clearInterval(timer); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [])
  useEffect(() => { dispatch({ type: 'REPLACE_GOING', going: load('going-' + sessionDate, {}) }) }, [sessionDate])
  useEffect(() => save('players', state.players), [state.players])
  useEffect(() => save('matches-reset-20261003', state.matches), [state.matches])
  // Keep attendance scoped to its session; never carry an RSVP into next week.
  const attendanceDateRef = useRef(sessionDate)
  useEffect(() => {
    if (attendanceDateRef.current === sessionDate) save('going-' + sessionDate, state.going)
    attendanceDateRef.current = sessionDate
  }, [state.going, sessionDate])
  useEffect(() => save('lastSessionPairs', state.lastSessionPairs), [state.lastSessionPairs])
  useEffect(() => save('videos', state.videos), [state.videos])
  useEffect(() => save('draw', state.draw), [state.draw])

  const pushToast = useCallback((message, kind = 'info') => {
    const id = ++toastId.current
    setToasts((items) => [...items, { id, message, kind }])
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5000)
  }, [])
  const dismissToast = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), [])
  const updateOutbox = useCallback((update) => {
    const next = update(outboxRef.current)
    // Persist before acknowledging a local save, so a storage failure is visible.
    localStorage.setItem('cbc.v4.sync-outbox-v2', JSON.stringify(next))
    outboxRef.current = next
    setOutbox(next)
  }, [])
  const enqueue = useCallback((kind, payload) => {
    if (!authUser || !hasSupabase) return false
    try {
      updateOutbox((items) => [...items, { id: crypto.randomUUID(), actor: authUser.id, kind, payload, status: 'pending' }])
      return true
    } catch { pushToast('Could not save on this device. Free some browser storage and try again.', 'error'); return false }
  }, [authUser, updateOutbox, pushToast])

  const rsvp = useCallback(async (playerId, value) => {
    if (!authUser || authUser.playerId !== playerId) { pushToast('You can only change your own RSVP.', 'error'); return { ok: false } }
    const payload = { session_date: sessionDate, player_id: playerId, going: value, updated_at: new Date().toISOString() }
    if (!enqueue('attendance', payload)) return { ok: false }
    return { ok: true, pending: true }
  }, [authUser, sessionDate, enqueue, pushToast])

  const recordMatch = useCallback(async (match) => {
    if (!isScorekeeper || !authUser) { pushToast('Only the club scorekeeper can record scores.', 'error'); return { ok: false } }
    const full = { ...match, confirmedBy: [], recordedBy: authUser.username }
    if (!enqueue('match', matchToRow(full))) return { ok: false }
    dispatch({ type: 'SET_MATCH', match: full })
    return { ok: true, pending: true }
  }, [authUser, isScorekeeper, enqueue, pushToast])

  const confirmMatch = useCallback(async (matchId) => {
    if (!authUser) return
    const payload = { match_id: matchId, user_id: authUser.id, username: authUser.username }
    if (!enqueue('confirmation', payload)) return
    dispatch({ type: 'CONFIRM_MATCH', matchId, who: authUser.username })
  }, [authUser, enqueue])

  useEffect(() => {
    if (!online || !authUser || busyRef.current || !outbox.some((item) => item.actor === authUser.id && item.status === 'pending')) return
    const actor = authUser.id
    busyRef.current = true
    ;(async () => {
      try {
        const sb = await getSupabase()
        if (!sb) throw new Error('Sign-in service unavailable')
        const { data: { user }, error } = await sb.auth.getUser()
        if (error || user?.id !== actor) throw new Error('Please sign in again before retrying')
        // Writes are ordered; confirmation cannot overtake its match insert.
        for (const item of outboxRef.current.filter((entry) => entry.actor === actor && entry.status === 'pending')) {
          try {
            let result
            if (item.kind === 'attendance') result = await sb.functions.invoke('cbc-club-ops', { body: { action: 'book', date: item.payload.session_date, going: item.payload.going } })
            else if (item.kind === 'match') result = await sb.from('matches').upsert(item.payload)
            else result = await sb.from('match_confirmations').upsert(item.payload, { onConflict: 'match_id,user_id' })
            if (result.error || result.data?.error) throw result.error || new Error(result.data.error)
            updateOutbox((items) => items.filter((entry) => entry.id !== item.id))
          } catch (error) {
            updateOutbox((items) => items.map((entry) => entry.id === item.id ? { ...entry, status: 'failed', error: error.message || 'Could not save' } : entry))
          }
        }
      } catch {
        updateOutbox((items) => items.map((entry) => entry.actor === actor ? { ...entry, status: 'failed' } : entry))
      } finally { busyRef.current = false; setRefreshKey((key) => key + 1) }
    })()
  }, [outbox, online, authUser, updateOutbox, refreshKey])

  // Load the shared ledger and merge only this member's unsynced changes.
  useEffect(() => {
    if (!hasSupabase || !online) return
    let alive = true
    let channel
    let timer
    let generation = 0
    const read = async () => {
      const request = ++generation
      try {
        const sb = await getSupabase()
        if (!sb) throw new Error('Unavailable')
        const [attendance, ledger] = await Promise.all([
          sb.from('attendance').select('player_id,going').eq('session_date', sessionDate),
          readMatchLedger(sb),
        ])
        if (!alive || request !== generation) return
        if (attendance.error) throw new Error('Could not refresh')
        const going = Object.fromEntries(attendance.data.filter((row) => row.going).map((row) => [row.player_id, true]))
        const matches = new Map(ledger.map((row) => [row.id, rowToMatch(row)]))
        for (const item of outboxRef.current.filter((entry) => entry.actor === authUser?.id)) {
          if (item.kind === 'match' && !(item.status === 'failed' && item.payload.edit_reason)) matches.set(item.payload.id, rowToMatch(item.payload))
          if (item.kind === 'confirmation') {
            const match = matches.get(item.payload.match_id)
            if (match) match.confirmedBy = [...new Set([...match.confirmedBy, item.payload.username])]
          }
        }
        dispatch({ type: 'REPLACE_GOING', going })
        dispatch({ type: 'REPLACE_MATCHES', matches: [...matches.values()].sort((a,b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)) })
        setReadStatus('ready')
      } catch { if (alive && request === generation) setReadStatus('failed') }
    }
    read()
    getSupabase().then((sb) => {
      if (!alive || !sb) return
      const refresh = () => { clearTimeout(timer); timer = setTimeout(read, 150) }
      channel = sb.channel('club-shared-' + sessionDate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance', filter: `session_date=eq.${sessionDate}` }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, refresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'match_confirmations' }, refresh)
        .subscribe((status) => { if (alive && (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')) setReadStatus('failed') })
    })
    return () => { alive = false; clearTimeout(timer); channel?.unsubscribe() }
  }, [authUser?.id, online, sessionDate, refreshKey])

  const retrySync = useCallback(() => {
    try { updateOutbox((items) => items.map((entry) => entry.actor === authUser?.id ? { ...entry, status: 'pending' } : entry)) }
    catch { pushToast('Browser storage is unavailable. Please free space and retry.', 'error') }
    setRefreshKey((key) => key + 1)
  }, [authUser, updateOutbox, pushToast])
  const mine = outbox.filter((item) => item.actor === authUser?.id)
  const syncStatus = !online ? 'offline' : mine.some((item) => item.status === 'failed') ? 'failed' : mine.length ? 'pending' : readStatus
  const playerById = useMemo(() => Object.fromEntries(state.players.map((player) => [player.id, player])), [state.players])
  const goingIds = useMemo(() => Object.keys(state.going).filter((id) => state.going[id]), [state.going])
  const videosByMatch = useMemo(() => {
    const groups = {}
    for (const video of state.videos) if (video.matchId) (groups[video.matchId] ||= []).push(video)
    return groups
  }, [state.videos])
  const sharedDispatch = async (action) => {
    const shared = ['ADD_PLAYER','UPDATE_PLAYER','ADD_VIDEO','DELETE_VIDEO'].includes(action.type)
    if (!shared) { dispatch(action); return true }
    try {
      const sb = await getSupabase(); if (!sb || !authUser) throw new Error('Sign in to save shared club data')
      let result
      if (action.type === 'ADD_PLAYER') { const p=action.player; result=await sb.from('club_players').insert({id:p.id,name:p.name,level:p.level,join_date:p.joinDate,gradient:p.gradient,photo:p.photo||null}) }
      if (action.type === 'UPDATE_PLAYER') result=await sb.from('club_players').update(action.updates).eq('id',action.id)
      if (action.type === 'ADD_VIDEO') result=await sb.from('club_highlights').insert({id:action.video.id,owner_id:authUser.id,data:action.video})
      if (action.type === 'DELETE_VIDEO') result=await sb.from('club_highlights').delete().eq('id',action.id)
      if (result.error) throw result.error
      dispatch(action); setRefreshKey(key=>key+1); return true
    } catch(error) { pushToast(error.message || 'Could not save shared data','error'); return false }
  }
  useEffect(() => {
    let alive=true
    const readShared=async()=>{
      const sb=await getSupabase(); if(!sb)return
      const settings=await sb.from('club_sessions').select('*');if(alive&&!settings.error)setSessionSettings(settings.data||[])
      const roster=await sb.from('club_players').select('*')
      if(alive&&!roster.error&&roster.data?.length)dispatch({type:'REPLACE_PLAYERS',players:roster.data.map(p=>({...p,joinDate:p.join_date}))})
      if(authUser){const highlights=await sb.from('club_highlights').select('*');if(alive&&!highlights.error)dispatch({type:'REPLACE_VIDEOS',videos:(highlights.data||[]).map(h=>({...h.data,ownerId:h.owner_id}))})}
    }
    readShared().catch(()=>{});const timer=setInterval(()=>readShared().catch(()=>{}),15000)
    return()=>{alive=false;clearInterval(timer)}
  },[authUser?.id,refreshKey])
  const value = { ...state, sessions, currentSession, dispatch: sharedDispatch, rsvp, recordMatch, confirmMatch, isScorekeeper,
    sharedRoster: hasSupabase && readStatus === 'ready', syncStatus, pendingCount: mine.length, syncError: mine.find(item=>item.error)?.error, discardFailed: () => {updateOutbox(items=>items.filter(item=>item.actor!==authUser?.id||item.status!=='failed'));setRefreshKey(key=>key+1)}, retrySync,
    toasts, pushToast, dismissToast, playerById, goingIds, videosByMatch }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
