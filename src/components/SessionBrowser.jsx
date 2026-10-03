import { useState } from 'react'
import { downloadSession } from '../lib/sessions.js'
import useDeviceList from '../hooks/useDeviceList.js'

const dateLabel = date => new Intl.DateTimeFormat('en-GB', {
  weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh',
}).format(new Date(`${date}T12:00:00+03:00`))

export default function SessionBrowser({ sessions, onJoin }) {
  const [day, setDay] = useState('all')
  const [savedOnly, setSavedOnly] = useState(false)
  const [limit, setLimit] = useState(4)
  const [notice, setNotice] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [sharedDate, setSharedDate] = useState(() => new URLSearchParams(window.location.search).get('session'))
  const { items: saved, toggle, storageError } = useDeviceList('cbc.saved-session-plans')
  const upcoming = sessions.filter(session => session.status !== 'past' && !session.cancelled)
  const savedCount = upcoming.filter(session => saved.includes(session.date)).length
  const filtered = upcoming.filter(session => (day === 'all' || session.day === day) && (!savedOnly || saved.includes(session.date)) && (!sharedDate || session.date === sharedDate))
  const visible = filtered.slice(0, limit)

  const clearShared = () => {
    setSharedDate(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('session')
    window.history.replaceState(null, '', url)
  }
  const share = async session => {
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('session', session.date)
    url.hash = 'sessions'
    setNotice(''); setShareUrl('')
    const details = { title: 'Play with Ceylon Badminton Club', text: `${dateLabel(session.date)} · ${session.time} Riyadh time · ${session.venue}. Confirm your place with the club.`, url: url.href }
    try {
      if (navigator.share) { await navigator.share(details); return }
      await navigator.clipboard.writeText(`${details.text}\n${details.url}`)
      setNotice('Session details and link copied. Send them to a friend.')
    } catch (error) {
      if (error.name === 'AbortError') return
      setShareUrl(url.href)
      setNotice('Copy the session link below to share it.')
    }
  }

  return <div className="session-browser">
    <div className="session-browser-toolbar">
      <div className="session-filters" role="group" aria-label="Filter sessions by day">
        {[['all', 'All sessions'], ['Wed', 'Wednesday evenings'], ['Sat', 'Saturday mornings']].map(([value, label]) => <button key={value} type="button" aria-pressed={day === value} onClick={() => { setDay(value); setLimit(4); clearShared() }}>{label}</button>)}
      </div>
      <button className="saved-plans-button" aria-pressed={savedOnly} onClick={() => { setSavedOnly(!savedOnly); setLimit(4); clearShared() }}>♡ Saved plans <span>{savedCount}</span></button>
    </div>
    {sharedDate && <div className="shared-session-notice">A session was shared with you. <button className="text-button" onClick={clearShared}>Browse all dates</button></div>}
    <div className="session-browser-caption"><span>All times · Riyadh (GMT+3)</span><span role="status">{visible.length} of {filtered.length} sessions</span></div>
    <div className="session-browser-grid">
      {visible.map((session, index) => <article className={`session-option ${saved.includes(session.date) ? 'is-saved' : ''}`} key={session.id}>
        <div className="session-option-top">
          <span className="session-date-tile" aria-hidden="true"><b>{Number(session.date.slice(8))}</b><span>{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(`${session.date}T12:00:00+03:00`))}</span></span>
          <button className="session-save" aria-pressed={saved.includes(session.date)} aria-label={`Save ${dateLabel(session.date)} to my plans`} onClick={() => toggle(session.date)}>{saved.includes(session.date) ? '♥' : '♡'}</button>
        </div>
        <span className={`session-label ${session.status === 'live' ? 'is-live' : ''}`}>{session.status === 'live' ? 'On court now' : index === 0 ? 'Next up' : 'Upcoming'}</span>
        <h3>{dateLabel(session.date)}</h3>
        <p className="session-option-time">{session.time}</p>
        <p className="session-option-venue">{session.venue}</p>
        <div className="session-option-meta"><span>{session.courts} courts</span><span>Mixed partners</span></div>
        {session.fee_cents != null && <p>{new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(session.fee_cents / 100)}</p>}
        {session.notes && <p className="session-option-note">{session.notes}</p>}
        <div className="session-option-actions"><button className="btn btn-gold" onClick={() => onJoin(session)}>Ask to join <span aria-hidden="true">↗</span></button><div className="session-secondary-actions"><button className="session-calendar" aria-label={`Add ${dateLabel(session.date)} to calendar`} onClick={() => downloadSession(session)}>Calendar +</button><button className="session-calendar" aria-label={`Share ${dateLabel(session.date)}`} onClick={() => share(session)}>Share ↗</button></div></div>
      </article>)}
    </div>
    {!visible.length && <div className="session-empty"><h3>{sharedDate ? 'This session is no longer listed.' : savedOnly ? 'Your next game starts with a plan.' : 'No sessions match this filter.'}</h3><p>{savedOnly ? 'Tap the heart on a session to keep it here. Saving does not reserve a place.' : 'Try another day or browse all upcoming sessions.'}</p><button className="btn btn-ghost" onClick={() => { setDay('all'); setSavedOnly(false); clearShared() }}>Browse all sessions</button></div>}
    {filtered.length > visible.length && <button className="btn btn-ghost session-load-more" onClick={() => setLimit(limit + 4)}>Show more dates ↓</button>}
    <p className="session-booking-note">Saved plans stay on this browser; they are not bookings. Ask to join and wait for confirmation, or sign in to reserve your place.</p>
    {storageError && <p role="status">Browser storage is unavailable. Your saved plans will last until this page is reloaded.</p>}
    <p className="session-share-status" role="status">{notice}</p>
    {shareUrl && <label className="share-link-field">Session link<input readOnly value={shareUrl} onFocus={event => event.target.select()} /></label>}
  </div>
}
