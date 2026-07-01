import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import BrandLockup from '../components/BrandLockup.jsx'

export default function Login() {
  const { login, closeLogin } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!username.trim() || !password) { setError('Enter your username and password.'); return }
    setError('')
    setLoading(true)
    setTimeout(() => {
      const res = login(username, password)
      if (!res.ok) setError(res.error)
      setLoading(false)
    }, 380)
  }

  return (
    <div className="login-bg login-overlay" role="dialog" aria-modal="true" aria-label="Member sign in">
      <button className="login-close" onClick={closeLogin} aria-label="Close sign in">✕</button>
      <div className="login-wrap">

        {/* Brand header */}
        <BrandLockup size="lg" sub="Riyadh Chapter · Members Portal" className="login-brand" />

        {/* Card */}
        <div className="glass login-card">
          <h2 className="login-title">Welcome back 🏸</h2>
          <p className="login-desc">Sign in with your member username and password.</p>

          <form className="login-form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="un">Username</label>
              <input
                id="un"
                className="input"
                placeholder="e.g. tharindu"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="field">
              <label htmlFor="pw">Password</label>
              <div className="pwd-wrap">
                <input
                  id="pw"
                  className="input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="pwd-eye"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <div className="login-err" role="alert">{error}</div>}

            <button
              className="btn btn-gold login-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-hint">
            <span>🔒 Each member has a personal password — ask the club admin if you’ve lost yours.</span>
          </div>

          <button type="button" className="login-guest-link" onClick={closeLogin}>
            ← Back to club website
          </button>
        </div>

        <p className="login-footer">Ceylon Badminton Club Riyadh · Members sign in to RSVP &amp; record scores</p>
      </div>
    </div>
  )
}
