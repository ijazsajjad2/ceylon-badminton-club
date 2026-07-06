import { describe, expect, it } from 'vitest'
import { PLAYERS } from '../data/players.js'
import { computeStats, opponentsOf, partnersOf, playerSide, setsWon } from './stats.js'

const p1 = PLAYERS[0].id
const p2 = PLAYERS[1].id
const p3 = PLAYERS[2].id
const p4 = PLAYERS[3].id

function doublesMatch(overrides = {}) {
  return {
    id: 'm1',
    type: 'doubles',
    date: '2026-01-05',
    time: '20:00',
    teamA: [p1, p2],
    teamB: [p3, p4],
    sets: [[21, 15], [21, 18]],
    winner: 'A',
    live: false,
    ...overrides,
  }
}

describe('setsWon', () => {
  it('counts sets won by each side', () => {
    const m = doublesMatch({ sets: [[21, 15], [18, 21], [21, 19]] })
    expect(setsWon(m)).toEqual({ a: 2, b: 1 })
  })
})

describe('playerSide / partnersOf / opponentsOf', () => {
  const m = doublesMatch()

  it('identifies which side a player is on', () => {
    expect(playerSide(m, p1)).toBe('A')
    expect(playerSide(m, p3)).toBe('B')
    expect(playerSide(m, 'nobody')).toBeNull()
  })

  it('returns teammates excluding the player themself', () => {
    expect(partnersOf(m, p1)).toEqual([p2])
  })

  it('returns the opposing team', () => {
    expect(opponentsOf(m, p1)).toEqual([p3, p4])
  })
})

describe('computeStats', () => {
  it('credits the win, points, and a W result to every player on the winning team', () => {
    const rows = computeStats([doublesMatch()])
    const winner = rows.find((r) => r.id === p1)
    expect(winner.played).toBe(1)
    expect(winner.won).toBe(1)
    expect(winner.lost).toBe(0)
    expect(winner.results).toEqual(['W'])
    // 10 (win) + 0.5 * (21+21) points scored across sets
    expect(winner.points).toBeCloseTo(10 + 0.5 * 42, 5)
  })

  it('gives the losing team a close-loss bonus only within a 3-point margin', () => {
    const close = computeStats([doublesMatch({ sets: [[21, 19]] })])
    const loser = close.find((r) => r.id === p3)
    expect(loser.points).toBeCloseTo(0.5 * 19 + 2, 5)

    const blowout = computeStats([doublesMatch({ sets: [[21, 5]] })])
    const loserBlowout = blowout.find((r) => r.id === p3)
    expect(loserBlowout.points).toBeCloseTo(0.5 * 5, 5)
  })

  it('ranks players by points, breaking ties by wins then win%', () => {
    const rows = computeStats([doublesMatch()])
    expect(rows[0].rank).toBe(1)
    // ranks should be a contiguous 1..N assignment
    const ranks = rows.map((r) => r.rank).sort((a, b) => a - b)
    expect(ranks).toEqual(PLAYERS.map((_, i) => i + 1))
  })

  it('tracks partner win/loss records for doubles', () => {
    const rows = computeStats([doublesMatch()])
    const p1row = rows.find((r) => r.id === p1)
    expect(p1row.partners[p2]).toEqual({ w: 1, l: 0 })
  })

  it('ignores live (in-progress) and winnerless matches', () => {
    const rows = computeStats([doublesMatch({ live: true }), doublesMatch({ winner: null })])
    const row = rows.find((r) => r.id === p1)
    expect(row.played).toBe(0)
  })
})
