import {describe,it,expect} from 'vitest'
import {rotateCourts} from './courtRotation.js'
const players=Array.from({length:12},(_,i)=>({id:`p${i+1}`,level:i%2?'Advanced':'Beginner'}))
describe('fair court rotations',()=>{
 it('prioritises resting players and never duplicates a player',()=>{
  const first=rotateCourts(players,[],2)
  const next=rotateCourts(players,[first],2)
  const ids=next.assignments.flatMap(a=>[...a.teamA,...a.teamB])
  expect(new Set(ids).size).toBe(8)
  for(const id of first.waiting)expect(ids).toContain(id)
  expect(next.waiting).toHaveLength(4)
 })
 it('requires four players and balances skill when possible',()=>{
  expect(rotateCourts(players.slice(0,3),[],2).assignments).toEqual([])
  const draw=rotateCourts(players.slice(0,4),[],2)
  for(const a of draw.assignments)for(const team of [a.teamA,a.teamB])expect(new Set(team.map(id=>players.find(p=>p.id===id).level)).size).toBe(2)
 })
})
