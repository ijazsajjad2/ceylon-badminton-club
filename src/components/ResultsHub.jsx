import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { completedMatches, resultDates, resultDateLabel, resultStandings, selectResults } from '../lib/results.js'
import { matchPoints, setsWon } from '../lib/stats.js'
import Avatar from './Avatar.jsx'
import '../styles/results.css'

function Scorecard({ match, playerById }) {
  const sets = setsWon(match)
  const names = side => (side === 'A' ? match.teamA : match.teamB).map(id => playerById[id]?.name || `Player ${id}`).join(' & ')
  return <article className="result-scorecard">
    <div className="result-match-meta"><span>{match.type === 'doubles' ? 'Doubles' : 'Singles'} · Court {match.court}</span><time dateTime={`${match.date}T${match.time}+03:00`}>{match.time.slice(0, 5)} · Riyadh</time></div>
    <div className="result-team-head" aria-hidden="true"><span>Players</span><span>Sets won</span></div>
    {['A', 'B'].map(side => <div className={`result-team ${match.winner === side ? 'result-winner' : ''}`} key={side}><span>{names(side)}{match.winner === side && <small>Winner</small>}</span><strong aria-label={`${names(side)}: ${side === 'A' ? sets.a : sets.b} sets won`}>{side === 'A' ? sets.a : sets.b}</strong></div>)}
    <div className="result-set-list">{match.sets.map(([a, b], index) => <span key={index}><small>Set {index + 1}</small><b>{a}–{b}</b></span>)}</div>
    <details className="result-points"><summary>Points earned per player <span aria-hidden="true">+</span></summary>{['A', 'B'].map(side => { const pts = matchPoints(match, side); return <div key={side}><b>{names(side)}</b><span>{pts.win} win + {pts.scored} scoring + {pts.closeLoss} close-loss = <strong>{pts.total} pts each</strong></span></div> })}</details>
    <p className="result-confirmation">{match.confirmedBy?.length ? 'Member-confirmed result' : 'Recorded · awaiting member confirmation'}</p>
  </article>
}

export default function ResultsHub({ onRecord, onSignIn }) {
  const { matches, players, playerById, syncStatus, retrySync } = useApp()
  const [mode, setMode] = useState('day')
  const [chosenDate, setChosenDate] = useState('')
  const [historyDate, setHistoryDate] = useState('')
  const [type, setType] = useState('all')
  const [query, setQuery] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [limit, setLimit] = useState(6)
  const dates = useMemo(() => resultDates(matches), [matches])
  const date = chosenDate || dates[0] || ''
  const dateIndex = dates.indexOf(date)
  const all = useMemo(() => completedMatches(matches), [matches])
  const scoped = useMemo(() => selectResults(matches, { date: mode === 'day' ? date : mode === 'history' ? historyDate : '', type }), [matches, mode, date, historyDate, type])
  const ranked = useMemo(() => resultStandings(scoped, players), [scoped, players])
  const filteredRanked = ranked.filter(player => player.name.toLowerCase().includes(query.trim().toLowerCase()))
  const history = useMemo(() => selectResults(scoped, { playerId }), [scoped, playerId])
  const summaryMatches = mode === 'history' ? history : scoped
  const summaryRanked = useMemo(() => resultStandings(summaryMatches, players), [summaryMatches, players])
  const visibleHistory = history.slice(0, limit)
  const groups = [...new Set(visibleHistory.map(match => match.date))]
  const participants = useMemo(() => resultStandings(all, players).sort((a, b) => a.name.localeCompare(b.name)), [all, players])
  const scored = summaryMatches.reduce((total, match) => total + match.sets.reduce((sum, [a, b]) => sum + a + b, 0), 0)
  const changeMode = next => { setMode(next); setPlayerId(''); setQuery(''); setLimit(6) }
  const showDay = next => { setChosenDate(next); changeMode('day') }
  const showPlayer = id => { setHistoryDate(mode === 'day' ? date : ''); setMode('history'); setPlayerId(id); setLimit(6); setQuery('') }

  return <div className="results-hub">
    <div className="results-topline"><span className="results-kicker">THE CLUB SCOREBOARD</span><div className="results-actions">{onRecord && <button className="btn btn-gold btn-sm" onClick={onRecord}>Record a result +</button>}{onSignIn && <button className="text-button" onClick={onSignIn}>Member sign-in ↗</button>}</div></div>
    <div className="results-tabs" role="group" aria-label="Results view">{[['day', 'Daily leaderboard'], ['all', 'Full leaderboard'], ['history', 'Match history']].map(([key, label]) => <button key={key} aria-pressed={mode === key} onClick={() => changeMode(key)}>{label}</button>)}</div>
    {syncStatus === 'loading' && <p className="results-status" role="status">Loading recorded club results…</p>}
    {['offline', 'failed', 'pending', 'unconfigured'].includes(syncStatus) && <p className="results-status" role="status">{syncStatus === 'offline' ? 'Offline: showing results saved on this device.' : syncStatus === 'pending' ? 'Some results are still syncing. Rankings may change.' : 'The latest results could not be verified. Showing available saved results.'} {syncStatus !== 'offline' && <button className="text-button" onClick={retrySync}>Retry sync</button>}</p>}
    <div className="results-filters">
      {mode === 'day' && <div className="results-day-picker"><button aria-label="Previous playing day" disabled={dateIndex < 0 || dateIndex >= dates.length - 1} onClick={() => showDay(dates[dateIndex + 1])}>←</button><label>Playing day<select value={date} onChange={event => showDay(event.target.value)} disabled={!dates.length}>{!dates.length && <option value="">No recorded dates</option>}{dates.map(day => <option key={day} value={day}>{resultDateLabel(day)}</option>)}</select></label><button aria-label="Next playing day" disabled={dateIndex <= 0} onClick={() => showDay(dates[dateIndex - 1])}>→</button></div>}
      {mode === 'history' && <><label>Playing day<select value={historyDate} onChange={event => { setHistoryDate(event.target.value); setLimit(6) }}><option value="">All recorded dates</option>{dates.map(day => <option key={day} value={day}>{resultDateLabel(day)}</option>)}</select></label><label>Player<select value={playerId} onChange={event => { setPlayerId(event.target.value); setLimit(6) }}><option value="">All players</option>{participants.map(player => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label></>}
      {mode === 'all' && <div className="results-all-label"><b>Every recorded playing day</b><span>{dates.length} {dates.length === 1 ? 'day' : 'days'}{dates.length > 0 && ` · ${resultDateLabel(dates[dates.length - 1])} onwards`}</span></div>}
      <label>Match format<select value={type} onChange={event => { setType(event.target.value); setLimit(6) }}><option value="all">All formats</option><option value="doubles">Doubles</option><option value="singles">Singles</option></select></label>
    </div>
    <div className="results-summary"><div><strong>{summaryMatches.length}</strong><span>Completed matches</span></div><div><strong>{summaryRanked.length}</strong><span>Players on court</span></div><div><strong>{scored}</strong><span>Rally points played</span></div><div><strong>{summaryRanked[0]?.points ?? '—'}</strong><span>Leading ranking points</span></div></div>
    {mode !== 'history' && <>
      <div className="results-heading"><div><p className="results-kicker">{mode === 'day' ? 'ONE DAY. EVERY PLAYER.' : 'THE COMPLETE CLUB RECORD.'}</p><h3>{mode === 'day' ? (date ? resultDateLabel(date) : 'Daily standings') : 'All-time standings'}</h3></div><label className="results-search">Find a player<input type="search" placeholder="Search names…" value={query} onChange={event => setQuery(event.target.value)}/></label></div>
      {ranked.length > 0 && <div className="results-podium">{ranked.slice(0, 3).map(player => <button key={player.id} className={`results-podium-card place-${player.rank}`} onClick={() => showPlayer(player.id)}><span className="results-place">#{player.rank}</span><Avatar player={playerById[player.id] || player} size={44}/><span className="results-podium-name">{player.name}<small>{player.won} wins · {player.played} played</small></span><b>{player.points}<small>points</small></b></button>)}</div>}
      <div className="results-table-scroll" tabIndex={0} role="region" aria-label="Player standings, scroll horizontally for all statistics"><table className="results-table"><caption>{mode === 'day' ? 'Daily' : 'All-time'} player standings. Select a player to see their matches.</caption><thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Played</th><th scope="col">Won</th><th scope="col">Lost</th><th scope="col">Win %</th><th scope="col">Scored</th><th scope="col">Against</th><th scope="col">Points</th></tr></thead><tbody>{filteredRanked.map(player => <tr key={player.id}><td>{player.rank}</td><th scope="row"><button onClick={() => showPlayer(player.id)}>{player.name} <span aria-hidden="true">↗</span></button></th><td>{player.played}</td><td>{player.won}</td><td>{player.lost}</td><td>{player.winPct}%</td><td>{player.pointsScored}</td><td>{player.pointsAgainst}</td><td className="results-total">{player.points}</td></tr>)}</tbody></table></div>
      {!filteredRanked.length && <div className="results-empty">{ranked.length ? 'No players match that name.' : syncStatus === 'loading' ? 'Standings will appear once results load.' : 'No completed matches in this view yet.'}</div>}
      <details className="results-rules"><summary>How are points calculated?</summary><p>Rankings belong to individual players. Each player receives <b>10 points per match win</b>, plus <b>0.5 points for each rally point their team scores</b> across all sets. A match loss earns a <b>2-point close-loss bonus</b> if any set finishes within three points.</p><p>Example: a 21–19 game earns each winner 20.5 points and each losing player 11.5 points. Ranking ties are ordered by wins, then win percentage, then player name. Live and unfinished matches do not count. Completed recorded matches count while awaiting member confirmation.</p></details>
    </>}
    {mode === 'all' ? <button className="btn btn-ghost results-history-link" onClick={() => { setHistoryDate(''); changeMode('history') }}>Browse all match scores ↗</button> : <>
      <div className="results-heading"><div><p className="results-kicker">EVERY GAME TELLS A STORY</p><h3>{playerId ? `${playerById[playerId]?.name || 'Player'}’s matches` : 'Previous match scores'}</h3></div><span className="results-count" role="status">{visibleHistory.length} of {history.length} matches</span></div>
      {playerId && <button className="text-button" onClick={() => { setPlayerId(''); setLimit(6) }}>Clear player filter ×</button>}
      {groups.map(day => <section className="results-day-group" key={day} aria-label={`Scores for ${resultDateLabel(day)}`}><div className="results-date-heading"><h4>{resultDateLabel(day)}</h4>{mode === 'history' && <button className="text-button" onClick={() => showDay(day)}>Day’s leaderboard ↗</button>}</div><div className="results-score-grid">{visibleHistory.filter(match => match.date === day).map(match => <Scorecard key={match.id} match={match} playerById={playerById}/>)}</div></section>)}
      {!history.length && <div className="results-empty"><b>No match scores in this view.</b><p>Choose another date, player or format. New results appear after the scorekeeper records them.</p>{(playerId || type !== 'all' || historyDate) && <button className="btn btn-ghost" onClick={() => { setPlayerId(''); setType('all'); setHistoryDate(''); changeMode('history') }}>Show all recorded matches</button>}</div>}
      {history.length > visibleHistory.length && <button className="btn btn-ghost results-history-link" onClick={() => setLimit(limit + 6)}>Load more scores ↓</button>}
    </>}
  </div>
}
