import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getSupabase, hasSupabase } from '../lib/supabase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(hasSupabase)
  const [authError, setAuthError] = useState('')
  const [loginOpen, setLoginOpen] = useState(false)

  useEffect(() => {
    // Never restore the old browser-controlled identity.
    try { localStorage.removeItem('cbc.session') } catch { /* storage may be disabled */ }
    if (!hasSupabase) return
    let alive = true
    let subscription
    let revision = 0
    const validate = async () => {
      const current = ++revision
      try {
        const sb = await getSupabase()
        if (!sb) throw new Error('Member sign-in is temporarily unavailable.')
        const { data: { user: verified }, error } = await sb.auth.getUser()
        if (!alive || current !== revision) return
        if (!verified || error) { setUser(null); if (error && error.name !== 'AuthSessionMissingError') setAuthError('Cannot verify your session. Check your connection and sign in again.'); return }
        const { data: profile, error: profileError } = await sb.from('member_profiles')
          .select('username, player_id, role').eq('user_id', verified.id).maybeSingle()
        if (!alive || current !== revision) return
        if (profileError || !profile) {
          setUser(null)
          setAuthError('Your email is verified, but club access is not ready. Ask the organiser to activate your membership.')
          setLoginOpen(true)
          return
        }
        setUser({ id: verified.id, username: profile.username, playerId: profile.player_id, role: profile.role })
        setAuthError('')
        setLoginOpen(false)
      } catch {
        if (alive && current === revision) { setUser(null); setAuthError('Cannot reach member sign-in. Check your connection and try again.') }
      } finally {
        if (alive && current === revision) setAuthLoading(false)
      }
    }
    getSupabase().then((sb) => {
      if (!alive || !sb) { if (alive) setAuthLoading(false); return }
      subscription = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') { revision++; setUser(null); setAuthLoading(false); return }
        // Do not await another auth call inside the auth event lock.
        setTimeout(() => { if (alive) validate() }, 0)
      }).data.subscription
    })
    return () => { alive = false; revision++; subscription?.unsubscribe() }
  }, [])

  const requestCode = useCallback(async (email) => {
    try {
      const sb = await getSupabase()
      if (!sb) return { ok: false, error: 'Member sign-in is being set up. Please contact the club organiser.' }
      const { error } = await sb.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: false } })
      if (error) return { ok: false, error: 'Unable to send a code. Check your member email, or wait a minute before trying again.' }
      setAuthError('')
      return { ok: true }
    } catch { return { ok: false, error: 'Connection failed. Please try again.' } }
  }, [])

  const verifyCode = useCallback(async (email, token) => {
    try {
      const sb = await getSupabase()
      if (!sb) return { ok: false, error: 'Member sign-in is unavailable.' }
      const { error } = await sb.auth.verifyOtp({ email: email.trim().toLowerCase(), token: token.trim(), type: 'email' })
      return error ? { ok: false, error: 'That code is invalid or expired. Try again or request a new code.' } : { ok: true }
    } catch { return { ok: false, error: 'Connection failed. Your code has not been verified.' } }
  }, [])

  const logout = useCallback(async () => {
    const sb = await getSupabase()
    if (sb) {
      const { error } = await sb.auth.signOut({ scope: 'local' })
      if (error) { setAuthError('Sign out failed. Please reconnect and try again.'); return }
    }
    setUser(null)
  }, [])
  const login = useCallback(async (email, password) => {
    try {
      const sb = await getSupabase()
      if (!sb) return { ok: false, error: 'Member sign-in is unavailable.' }
      const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) return { ok: false, error: 'Sign-in failed. Check your member email and password.' }
      setAuthError('')
      return { ok: true }
    } catch { return { ok: false, error: 'Connection failed. Please try again.' } }
  }, [])
  const openLogin = useCallback(() => setLoginOpen(true), [])
  const closeLogin = useCallback(() => setLoginOpen(false), [])
  const isScorekeeper = user?.role === 'scorekeeper'
  return <AuthContext.Provider value={{ user, authLoading, authError, authConfigured: hasSupabase, login, requestCode, verifyCode, logout, loginOpen, openLogin, closeLogin, isScorekeeper }}>{children}</AuthContext.Provider>
}
