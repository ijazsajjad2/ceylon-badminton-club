import { useLayoutEffect, useRef, useState } from 'react'
import BrandLockup from './BrandLockup.jsx'
import NavIcon from './Icons.jsx'

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'participation', label: 'Sessions', icon: 'shuffle' },
  { key: 'matches', label: 'Matches', icon: 'shuttle' },
  { key: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar' },
  { key: 'profiles', label: 'Players', icon: 'users' },
  { key: 'highlights', label: 'Highlights', icon: 'film' },
]

export function Navbar({ active, onNavigate }) {
  const tabsRef = useRef(null)
  const [pill, setPill] = useState({ left: 5, width: 0 })

  useLayoutEffect(() => {
    const el = tabsRef.current?.querySelector(`[data-key="${active}"]`)
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active])

  return (
    <header className="navbar">
      <BrandLockup size="md" sub="Riyadh Chapter · Smash It Together" />

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
            <NavIcon name={item.icon} size={16} className="nav-ic" />
            {item.label}
          </button>
        ))}
      </nav>
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
        >
          <NavIcon name={item.icon} size={21} className="bt-ic" />
          {item.label}
        </button>
      ))}
    </nav>
  )
}
