// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { validateSet, countdownTo } from './format.js'
import { validateMatchSets } from './matchValidation.js'
import { buildSessions, sessionCalendar } from './sessions.js'

describe('club scoring', () => {
  it('rejects impossible capped and fractional scores', () => {
    for (const pair of [[30,30],[30,0],[30,27],[21.5,19],[22,18],[-1,21]]) expect(validateSet(...pair).valid).toBe(false)
    for (const pair of [[21,0],[22,20],[30,28],[30,29]]) expect(validateSet(...pair).valid).toBe(true)
  })
  it('supports a single club set and a deciding third set', () => {
    expect(validateMatchSets([{a:'21',b:'18'}]).winner).toBe('A')
    expect(validateMatchSets([{a:'21',b:'18'},{a:'18',b:'21'},{a:'19',b:'21'}], 'best3').winner).toBe('B')
  })
  it('rejects a third set after a straight-sets win and incomplete scores', () => {
    expect(validateMatchSets([{a:'21',b:'18'},{a:'21',b:'19'},{a:'18',b:'21'}], 'best3').valid).toBe(false)
    expect(validateMatchSets([{a:'21',b:''}]).valid).toBe(false)
  })
})
describe('Riyadh sessions', () => {
  it('keeps the session active through its end, with stable IDs', () => {
    const before = buildSessions(new Date('2026-09-09T16:59:00Z'))
    const during = buildSessions(new Date('2026-09-09T18:00:00Z'))
    const after = buildSessions(new Date('2026-09-09T19:00:00Z'))
    expect(before.find((s) => s.date === '2026-09-09').status).toBe('upcoming')
    expect(during.find((s) => s.date === '2026-09-09').status).toBe('live')
    expect(after.find((s) => s.date === '2026-09-09').status).toBe('past')
    expect(before.find((s) => s.date === '2026-09-12').id).toBe(after.find((s) => s.date === '2026-09-12').id)
  })
  it('counts down and exports the same Riyadh start time in other time zones', () => {
    expect(countdownTo('2026-09-09', new Date('2026-09-09T16:00:00Z'), '20:00').h).toBe(1)
    const session = buildSessions(new Date('2026-09-09T16:00:00Z')).find((s) => s.date === '2026-09-09')
    const calendar = sessionCalendar(session)
    expect(calendar).toContain('DTSTART:20260909T170000Z\r\n')
    expect(calendar).toContain('DTEND:20260909T190000Z\r\n')
  })
})
