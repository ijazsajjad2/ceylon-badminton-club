import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import BrandLockup from './BrandLockup.jsx'
import NavIcon from './Icons.jsx'

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', short: 'Home', icon: 'home' },
  { key: 'participation', label: 'Sessions', short: 'Sessions', icon: 'shuffle' },
  { key: 'matches', label: 'Matches', short: 'Matches', icon: 'shuttle' },
  { key: 'leaderboard', label: 'Leaderboard', short: 'Ranking', icon: 'trophy' },
  { key: 'schedule', label: 'Schedule', short: 'Schedule', icon: 'calendar' },
  { key: 'profiles', label: 'Players', short: 'Players', icon: 'users' },
  { key: 'highlights', label: 'Highlights', short: 'Clips', icon: 'film' },
]

const initialsOf = (name = '') => name.trim().slice(0, 2).toUpperCase() || 'ME'

// Signed-in account control: one compact button in the top bar that opens a
// small menu (club tools, member admin for scorekeepers, sign out).
function AccountMenu({ name, items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div className="account" ref={ref}>
      <button className="account-trigger" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="account-avatar" aria-hidden="true">{initialsOf(name)}</span>
        <span className="account-name">{name}</span>
        <svg className="account-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-head">Signed in as <b>{name}</b></div>
          {items.map((item) => (
            <button key={item.label} role="menuitem" className={`account-item ${item.danger ? 'is-danger' : ''}`} onClick={() => { setOpen(false); item.onSelect() }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Navbar({ active, onNavigate, userName, accountItems = [] }) {
  const tabsRef = useRef(null)
  const [pill, setPill] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const el = tabsRef.current?.querySelector(`[data-key="${active}"]`)
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active])

  return (
    <header className="navbar">
      <button className="navbar-brand" onClick={() => onNavigate('dashboard')} aria-label="Ceylon Badminton Club — dashboard">
        <BrandLockup size="md" />
        <span className="navbar-brand-text">Ceylon Badminton<small>Members</small></span>
      </button>

      <nav className="nav-tabs" ref={tabsRef} aria-label="Primary">
        <span className="nav-pill" style={{ left: pill.left, width: pill.width }} />
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            data-key={item.key}
            className={`nav-tab ${active === item.key ? 'active' : ''}`}
            onClick={() => onNavigate(item.key)}
            aria-current={active === item.key ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {userName && <AccountMenu name={userName} items={accountItems} />}
    </header>
  )
}

export function BottomTabs({ active, onNavigate }) {
  return (
    <nav className="bottom-tabs" aria-label="Primary mobile">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`bt-item ${active === item.key ? 'active' : ''}`}
          onClick={() => onNavigate(item.key)}
          aria-current={active === item.key ? 'page' : undefined}
          aria-label={item.label}
        >
          <NavIcon name={item.icon} size={20} className="bt-ic" />
          <span>{item.short}</span>
        </button>
      ))}
    </nav>
  )
}
