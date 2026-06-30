import { createContext, useContext, useState, useCallback } from 'react'
import { CREDENTIALS, USERNAME_TO_PLAYER } from '../data/credentials.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('cbc.session')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  // The login screen is now an optional overlay — guests browse freely and
  // only see it when they choose to sign in or attempt a members-only action.
  const [loginOpen, setLoginOpen] = useState(false)

  const login = (username, password) => {
    const key = username.toLowerCase().trim()
    if (CREDENTIALS[key] !== undefined && CREDENTIALS[key] === password) {
      const auth = { username: key, playerId: USERNAME_TO_PLAYER[key] || null }
      setUser(auth)
      localStorage.setItem('cbc.session', JSON.stringify(auth))
      setLoginOpen(false)
      return { ok: true }
    }
    return { ok: false, error: 'Wrong username or password.' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('cbc.session')
  }

  const openLogin = useCallback(() => setLoginOpen(true), [])
  const closeLogin = useCallback(() => setLoginOpen(false), [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loginOpen, openLogin, closeLogin }}>
      {children}
    </AuthContext.Provider>
  )
}
