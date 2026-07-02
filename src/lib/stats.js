// All ranking is INDIVIDUAL. Partners change every session, so wins/losses and
// points are credited to each player personally — never to a pair.
//
// Points: Win = 10, +0.5 per point scored across all sets, close loss (lost the
// match but final margin within 3 in the deciding/closest set) = +2.

import { PLAYERS } from '../data/players.js'

export function teamOf(match, side) {
  return side === 'A' ? match.teamA : match.teamB
}
export function playerSide(match, playerId) {
  if (match.teamA.includes(playerId)) return 'A'
  if (match.teamB.includes(playerId)) return 'B'
  return null
}
export function partnersOf(match, playerId) {
  const side = playerSide(match, playerId)
  if (!side) return []
  const team = teamOf(match, side)
  return team.filter((id) => id !== playerId)
}
export function opponentsOf(match, playerId) {
  const side = playerSide(match, playerId)
  if (!side) return []
  return teamOf(match, side === 'A' ? 'B' : 'A')
}

function pointsScoredBy(match, side) {
  return match.sets.reduce((sum, [a, b]) => sum + (side === 'A' ? a : b), 0)
}

function closestMargin(match) {
  let m = 99
  for (const [a, b] of match.sets) m = Math.min(m, Math.abs(a - b))
  return m
}

export function setsWon(match) {
  let a = 0,
    b = 0
  for (const [x, y] of match.sets) {
    if (x > y) a++
    else if (y > x) b++
  }
  return { a, b }
}

export function computeStats(matches) {
  const table = {}
  for (const p of PLAYERS) {
    table[p.id] = {
      id: p.id,
      name: p.name,
      level: p.level,
      gradient: p.gradient,
      played: 0,
      doubles: 0,
      singles: 0,
      won: 0,
      lost: 0,
      points: 0,
      pointsScored: 0,
      partners: {}, // partnerId -> { w, l }
      rivals: {}, // oppId -> count
      results: [], // chronological 'W'/'L'
      monthly: {}, // 'YYYY-MM' -> wins
    }
  }

  // chronological (oldest first) for streak/form
  const ordered = [...matches]
    .filter((m) => !m.live && m.winner)
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))

  for (const m of ordered) {
    for (const side of ['A', 'B']) {
      const team = teamOf(m, side)
      const isWin = m.winner === side
      const scored = pointsScoredBy(m, side)
      const month = m.date.slice(0, 7)
      for (const pid of team) {
        const s = table[pid]
        if (!s) continue
        s.played++
        if (m.type === 'doubles') s.doubles++
        else s.singles++
        s.pointsScored += scored
        s.points += scored * 0.5
        if (isWin) {
          s.won++
          s.points += 10
          s.results.push('W')
          s.monthly[month] = (s.monthly[month] || 0) + 1
        } else {
          s.lost++
          s.results.push('L')
          if (closestMargin(m) <= 3) s.points += 2 // close loss bonus
        }
        // partners (doubles only)
        if (m.type === 'doubles') {
          for (const partner of team) {
            if (partner === pid) continue
            if (!s.partners[partner]) s.partners[partner] = { w: 0, l: 0 }
            if (isWin) s.partners[partner].w++
            else s.partners[partner].l++
          }
        }
        // rivals
        const opp = teamOf(m, side === 'A' ? 'B' : 'A')
        for (const o of opp) s.rivals[o] = (s.rivals[o] || 0) + 1
      }
    }
  }

  const rows = Object.values(table).map((s) => {
    s.points = Math.round(s.points * 10) / 10
    s.winPct = s.played ? Math.round((s.won / s.played) * 100) : 0
    s.partnerCount = Object.keys(s.partners).length
    s.form = s.results.slice(-5)
    s.streak = currentStreak(s.results)
    return s
  })

  rows.sort((a, b) => b.points - a.points || b.won - a.won || b.winPct - a.winPct)
  rows.forEach((r, i) => (r.rank = i + 1))
  return rows
}

function currentStreak(results) {
  if (!results.length) return { type: '-', count: 0 }
  const last = results[results.length - 1]
  let count = 0
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === last) count++
    else break
  }
  return { type: last, count }
}

export function filterByPeriod(matches, period) {
  if (period === 'all') return matches
  const now = new Date()
  if (period === 'month') {
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return matches.filter((m) => m.date.startsWith(prefix))
  }
  if (period === 'season') {
    // Last ~90 days, relative to today.
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 90)
    const iso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`
    return matches.filter((m) => m.date >= iso)
  }
  return matches
}
