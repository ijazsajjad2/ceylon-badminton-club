import { useEffect, useState } from 'react'
import Modal from './Modal.jsx'
import { getSupabase } from '../lib/supabase.js'
import { useApp } from '../context/AppContext.jsx'

export default function MemberAdmin({ onClose }) {
  const { players } = useApp()
  const [members, setMembers] = useState([])
  const [action, setAction] = useState('create-member')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const call = async (body) => {
    const sb = await getSupabase()
    if (!sb) throw new Error('Member services unavailable.')
    const { data, error: failure } = await sb.functions.invoke('cbc-member-admin', { body })
    if (failure) {
      const details = await failure.context?.json?.().catch(() => null)
      throw new Error(details?.error || 'Request failed. Check your connection and administrator access.')
    }
    if (data?.error) throw new Error(data.error)
    return data
  }
  useEffect(() => {
    let alive = true
    call({ action: 'list-members' }).then((data) => { if (alive) setMembers(data.members) }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [])
  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      await call({ action, email, username: username.toLowerCase().trim(), playerId, userId, password })
      setPassword('')
      setMessage(action === 'create-member' ? 'Account created. Share the email and initial password directly with the member.' : 'Password updated. Share the new password directly with the member.')
      const data = await call({ action: 'list-members' })
      setMembers(data.members)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return <Modal title="Manage member access" onClose={busy ? () => {} : onClose}>
    <p className="join-explainer">Create a login for an existing club player or help a member reset their password. These actions are checked by the server.</p>
    <form onSubmit={submit}>
      <fieldset disabled={busy} style={{ padding: 0, border: 0, minWidth: 0 }}>
        <div className="field"><label htmlFor="admin-action">Action</label><select id="admin-action" className="select" value={action} onChange={(e) => { setAction(e.target.value); setPassword(''); setError(''); setMessage('') }}><option value="create-member">Create member account</option><option value="reset-password">Reset member password</option></select></div>
        {action === 'create-member' ? <>
          <div className="field"><label htmlFor="admin-player">Club player</label><select id="admin-player" className="select" required value={playerId} onChange={(e) => setPlayerId(e.target.value)}><option value="">Choose player</option>{players.filter((player) => !members.some((member) => member.player_id === player.id)).map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></div>
          <div className="field"><label htmlFor="admin-username">Username</label><input id="admin-username" className="input" pattern="[a-z0-9_-]{2,32}" required value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} autoComplete="off" /></div>
          <div className="field"><label htmlFor="admin-email">Member email</label><input id="admin-email" type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></div>
        </> : <div className="field"><label htmlFor="admin-member">Member account</label><select id="admin-member" className="select" required value={userId} onChange={(e) => setUserId(e.target.value)}><option value="">Choose member</option>{members.map((member) => <option key={member.user_id} value={member.user_id}>{member.username}</option>)}</select></div>}
        <div className="field"><label htmlFor="admin-password">New password · at least 12 characters</label><input id="admin-password" type="password" className="input" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <button className="btn btn-gold" type="submit" disabled={busy}>{busy ? 'Saving…' : action === 'create-member' ? 'Create account' : 'Update password'}</button>
      </fieldset>
      {error && <p className="login-err" role="alert">{error}</p>}
      {message && <p className="join-explainer" role="status">{message}</p>}
    </form>
  </Modal>
}
