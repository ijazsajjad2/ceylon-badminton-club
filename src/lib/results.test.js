import { describe, expect, it, vi } from 'vitest'
import { resultDates, selectResults, resultStandings, readMatchLedger } from './results.js'
import { matchPoints } from './stats.js'

const players = [{id:'a',name:'Amal'}, {id:'b',name:'Bimal'}, {id:'c',name:'Chamal'}, {id:'d',name:'Dilan'}]
const game = { id:'old', sessionId:null, date:'2025-01-01', time:'20:00', type:'doubles', teamA:['a','b'], teamB:['c','d'], sets:[[21,19]], winner:'A', live:false }
const newer = { ...game, id:'new', date:'2026-07-08', type:'singles', teamA:['c'], teamB:['a'], sets:[[21,15]] }

describe('results history and rankings', () => {
  it('includes old dates with no session ID, newest first, and excludes unfinished games', () => {
    const matches = [game, newer, {...newer,id:'live',date:'2026-09-02',live:true}, {...newer,id:'draft',winner:null}]
    expect(resultDates(matches)).toEqual(['2026-07-08','2025-01-01'])
    expect(selectResults(matches,{date:'2025-01-01'})).toEqual([game])
    expect(selectResults(matches,{type:'singles',playerId:'c'})).toEqual([newer])
    expect(selectResults(matches,{type:'singles',playerId:'b'})).toEqual([])
  })
  it('sums daily points into overall points and credits partners individually', () => {
    const daily = resultStandings([game],players)
    const all = resultStandings([game,newer],players)
    expect(daily.find(p=>p.id==='a')).toMatchObject({points:20.5,played:1,won:1,pointsScored:21,pointsAgainst:19})
    expect(daily.find(p=>p.id==='b').points).toBe(20.5)
    expect(all.find(p=>p.id==='a')).toMatchObject({points:28,played:2,won:1,lost:1,winPoints:10,scorePoints:18,closeLossPoints:0})
    expect(all.find(p=>p.id==='c').points).toBe(32)
    expect(all[0].id).toBe('c')
  })
  it('exposes the same scorecard breakdown used in standings, including multiset close losses', () => {
    const match = {...game,sets:[[21,19],[21,10]]}
    expect(matchPoints(match,'A')).toEqual({win:10,scored:21,closeLoss:0,total:31})
    expect(matchPoints(match,'B')).toEqual({win:0,scored:14.5,closeLoss:2,total:16.5})
    expect(resultStandings([match],players).find(p=>p.id==='c').points).toBe(16.5)
    expect(matchPoints({...match,live:true},'A').total).toBe(0)
  })
  it('retains historical players missing from the current roster', () => {
    expect(resultStandings([game],players.slice(0,3)).find(p=>p.id==='d')).toMatchObject({name:'Player d',played:1,points:11.5})
  })
  it('uses player names as the final stable tie-break regardless of roster order', () => {
    expect(resultStandings([game],[...players].reverse()).slice(0,2).map(p=>p.name)).toEqual(['Amal','Bimal'])
  })
})

function clientFor(pages) {
  const range = vi.fn().mockImplementation(async (from) => pages[from / 500])
  const query = { select: () => query, order: () => query, range }
  return { client:{from:()=>query}, range }
}
describe('complete shared match ledger', () => {
  it('loads beyond the API row cap so every match counts', async () => {
    const data = Array.from({length:1003},(_,id)=>({id}))
    const {client,range}=clientFor([0,500,1000].map(start=>({data:data.slice(start,start+500),count:1003,error:null})))
    expect(await readMatchLedger(client)).toEqual(data)
    expect(range.mock.calls).toEqual([[0,499],[500,999],[1000,1499]])
  })
  it('does not return a partial leaderboard if a later page fails', async () => {
    const {client}=clientFor([{data:Array(500).fill(game),count:501,error:null},{data:null,error:new Error('offline')}])
    await expect(readMatchLedger(client)).rejects.toThrow('offline')
  })
})
