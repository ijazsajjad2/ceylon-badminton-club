import { computeStats } from './stats.js'

export const completedMatches = matches => matches.filter(match => !match.live && ['A', 'B'].includes(match.winner))
export const resultDates = matches => [...new Set(completedMatches(matches).map(match => match.date))].sort().reverse()
export const resultDateLabel = date => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Riyadh' }).format(new Date(`${date}T12:00:00+03:00`))

export function selectResults(matches, { date = '', type = 'all', playerId = '' } = {}) {
  return completedMatches(matches).filter(match => (!date || match.date === date) && (type === 'all' || match.type === type) && (!playerId || [...match.teamA, ...match.teamB].includes(playerId)))
    .sort((a, b) => `${b.date} ${b.time} ${b.id}`.localeCompare(`${a.date} ${a.time} ${a.id}`))
}

export function resultStandings(matches, players) {
  // Keep historical participants visible even if a roster entry is unavailable.
  const known = new Set(players.map(player => player.id))
  const missing = [...new Set(matches.flatMap(match => [...match.teamA, ...match.teamB]))].filter(id => !known.has(id))
  return computeStats(matches, [...players, ...missing.map(id => ({ id, name: `Player ${id}` }))]).filter(player => player.played > 0)
}

// Supabase caps each response. Fetch the complete ledger before replacing it,
// so an overall leaderboard never silently becomes a latest-1,000 ranking.
export async function readMatchLedger(client, pageSize = 500) {
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error, count } = await client.from('matches').select('*,match_confirmations(username)', { count: 'exact' })
      .order('date', { ascending: false }).order('time', { ascending: false }).order('id', { ascending: false }).range(from, from + pageSize - 1)
    if (error) throw error
    if (!data?.length) {
      if (count != null && rows.length < count) throw new Error('Match history was incomplete. Please refresh.')
      return rows
    }
    rows.push(...data)
    if (count != null ? rows.length >= count : data.length < pageSize) return rows
  }
}
