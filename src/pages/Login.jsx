import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'

export default function Login() {
  const { login, closeLogin, authError, authConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError('')
    try {
      const result = await login(email, password)
      if (!result.ok) setError(result.error)
    } finally { setBusy(false) }
  }
  return <Modal title="Member sign in" onClose={closeLogin}>
    <p className="join-explainer">Sign in with your login name and password to RSVP and see the shared club results.</p>
    {!authConfigured && <p className="join-contact-note" role="status">Member sign-in is being set up. Contact the club organiser for access.</p>}
    <form className="login-form" onSubmit={submit}>
      <div className="field"><label htmlFor="member-email">Login name or email</label><input id="member-email" className="input" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} disabled={busy || !authConfigured} onChange={(e) => setEmail(e.target.value)} placeholder="ijaz, iresh or priyan" /></div>
      <div className="field"><label htmlFor="member-password">Password</label><div className="pwd-wrap"><input id="member-password" className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} disabled={busy || !authConfigured} onChange={(e) => setPassword(e.target.value)} /><button className="pwd-eye" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></div>
      {(error || authError) && <p className="login-err" role="alert">{error || authError}</p>}
      <button className="btn btn-gold" type="submit" disabled={busy || !authConfigured}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="join-explainer">Need access or a password reset? Contact the club organiser. Each account is linked to a club member before it can access the portal.</p>
  </Modal>
}
