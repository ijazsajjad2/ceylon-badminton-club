import { Suspense, lazy, useRef, useState } from 'react'
import { Navbar, BottomTabs, NAV_ITEMS } from './components/Navbar.jsx'
import Toasts from './components/Toasts.jsx'
import WelcomeTour from './components/WelcomeTour.jsx'
import Skeleton from './components/Skeleton.jsx'
import PublicSite from './pages/PublicSite.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { useApp } from './context/AppContext.jsx'
import SyncStatus from './components/SyncStatus.jsx'

// Member-portal pages (and Login) are behind a signed-in gate, so they're
// lazy-loaded — public-site visitors (the overwhelming majority) never pay
// for their JS, including the Recharts charts pulled in by Dashboard,
// Leaderboard and PlayerSheet.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Participation = lazy(() => import('./pages/Participation.jsx'))
const Matches = lazy(() => import('./pages/Matches.jsx'))
const Leaderboard = lazy(() => import('./pages/Leaderboard.jsx'))
const Schedule = lazy(() => import('./pages/Schedule.jsx'))
const Profiles = lazy(() => import('./pages/Profiles.jsx'))
const Highlights = lazy(() => import('./pages/Highlights.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const MemberAdmin = lazy(() => import('./components/MemberAdmin.jsx'))

const ORDER = NAV_ITEMS.map((n) => n.key)

export default function App() {
  const { user, authLoading } = useAuth()
  if (authLoading) return <div role="status" className="club-section">Checking member session…</div>
  // Members portal is shown only when signed in. Everyone else gets the
  // public club website (with the sign-in overlay available on demand).
  return user ? <MembersApp /> : <PublicShell />
}

function PublicShell() {
  const { loginOpen } = useAuth()
  return (
    <>
      <PublicSite />
      {loginOpen && (
        <Suspense fallback={null}>
          <Login />
        </Suspense>
      )}
    </>
  )
}

function MembersApp() {
  const { user, logout, authError, isScorekeeper } = useAuth()
  const [adminOpen, setAdminOpen] = useState(false)
  const { playerById } = useApp()
  const [loading] = useState(false)
  const [active, setActive] = useState('dashboard')
  const [dir, setDir] = useState('enter-right')
  const [prefillMatch, setPrefillMatch] = useState(null)
  const prevIndex = useRef(0)


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
        {isScorekeeper && <button className="user-bar-logout" onClick={() => setAdminOpen(true)}>Manage members</button>}
        <button className="user-bar-logout" onClick={() => navigate('schedule')}>Club tools & account</button>
        <button className="user-bar-logout" onClick={logout}>Sign out</button>
      </div>
      {authError && <p className="sync-banner" role="alert">{authError}</p>}
      <Toasts />
      <SyncStatus />
      <WelcomeTour />
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
            <Suspense fallback={<Skeleton />}>{renderPage()}</Suspense>
          </div>
        </div>
      )}
      <BottomTabs active={active} onNavigate={navigate} />
      {adminOpen && <Suspense fallback={null}><MemberAdmin onClose={() => setAdminOpen(false)} /></Suspense>}
    </div>
  )
}
