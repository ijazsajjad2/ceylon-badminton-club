import { lazy, Suspense, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import ResultsHub from '../components/ResultsHub.jsx'
import RecordMatchModal from '../components/RecordMatchModal.jsx'
const Analytics = lazy(() => import('./LeaderboardAnalytics.jsx'))

export default function Leaderboard() {
  const { isScorekeeper } = useAuth()
  const [recording, setRecording] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  return <div className="page-wrap"><h1 className="section-title">Results & leaderboards</h1><p className="section-sub">Past scores, daily points and the full club standings — all in one place.</p><ResultsHub onRecord={isScorekeeper ? () => setRecording(true) : undefined}/><button className="btn btn-ghost" style={{marginTop:28}} aria-expanded={analytics} onClick={() => setAnalytics(!analytics)}>{analytics ? 'Hide' : 'Explore'} monthly & season analytics</button>{analytics && <Suspense fallback={<p role="status">Loading analytics…</p>}><Analytics/></Suspense>}{recording && <RecordMatchModal onClose={() => setRecording(false)}/>}</div>
}
