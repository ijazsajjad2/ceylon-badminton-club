import { useEffect, useRef, useState } from 'react'
import { Navbar, BottomTabs, NAV_ITEMS } from './components/Navbar.jsx'
import Toasts from './components/Toasts.jsx'
import Skeleton from './components/Skeleton.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Participation from './pages/Participation.jsx'
import Matches from './pages/Matches.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Schedule from './pages/Schedule.jsx'
import Profiles from './pages/Profiles.jsx'
import Highlights from './pages/Highlights.jsx'
import Login from './pages/Login.jsx'
import PublicSite from './pages/PublicSite.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useApp } from './context/AppContext.jsx'

const ORDER = NAV_ITEMS.map((n) => n.key)

export default function App() {
  const { user } = useAuth()
  // Members portal is shown only when signed in. Everyone else gets the
  // public club website (with the sign-in overlay available on demand).
  return user ? <MembersApp /> : <PublicShell />
}

function PublicShell() {
  const { loginOpen } = useAuth()
  return (
    <>
      <PublicSite />
      {loginOpen && <Login />}
    </>
  )
}

function MembersApp() {
  const { user, logout } = useAuth()
  const { playerById } = useApp()
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState('dashboard')
  const [dir, setDir] = useState('enter-right')
  const [prefillMatch, setPrefillMatch] = useState(null)
  const prevIndex = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 520) // simulated initial load
    return () => clearTimeout(t)
  }, [])

  const navigate = (key, payload) => {
    if (key === active && !payload) return
    const from = ORDER.indexOf(active)
    const to = ORDER.indexOf(key)
    setDir(to >= from ? 'enter-right' : 'enter-left')
    prevIndex.current = to
    if (payload?.prefillMatch) setPrefillMatch(payload.prefillMatch)
    setActive(key)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageProps = { navigate }

  const renderPage = () => {
    switch (active) {
      case 'dashboard': return <Dashboard {...pageProps} />
      case 'participation': return <Participation {...pageProps} />
      case 'matches': return <Matches {...pageProps} prefillMatch={prefillMatch} clearPrefill={() => setPrefillMatch(null)} />
      case 'leaderboard': return <Leaderboard {...pageProps} />
      case 'schedule': return <Schedule {...pageProps} />
      case 'profiles': return <Profiles {...pageProps} />
      case 'highlights': return <Highlights {...pageProps} />
      default: return null
    }
  }

  const me = user?.playerId ? playerById[user.playerId] : null
  const displayName = me ? me.name : user?.username

  return (
    <div className="app-shell">
      <Navbar active={active} onNavigate={navigate} />
      <div className="user-bar">
        <span className="user-bar-name">🏸 {displayName}</span>
        <button className="user-bar-logout" onClick={logout}>Sign out</button>
      </div>
      <Toasts />
      {loading ? (
        <Skeleton />
      ) : (
        <div className="page-viewport">
          <div
            key={active}
            className={`page ${dir}`}
            onAnimationEnd={(e) => {
              // Drop the lingering transform so position:fixed children (FABs)
              // are positioned against the viewport, not this transformed box.
              if (e.target === e.currentTarget) e.currentTarget.style.animation = 'none'
            }}
          >
            {renderPage()}
          </div>
        </div>
      )}
      <BottomTabs active={active} onNavigate={navigate} />
    </div>
  )
}
