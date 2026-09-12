// Deterministic rotation: fewest appearances, then longest rest, then balanced teams.
export function rotateCourts(players, rounds, courts = 2) {
 const played = Object.fromEntries(players.map(p => [p.id, { count: 0, last: -1 }]))
 const pairs = new Map()
 rounds.forEach((r, index) => (r.assignments || []).forEach(a => {
  for (const team of [a.teamA, a.teamB]) {
   for (const id of team) if (played[id]) { played[id].count++; played[id].last = index }
   const key = [...team].sort().join(':'); pairs.set(key, (pairs.get(key) || 0) + 1)
  }
 }))
 const ordered = [...players].sort((a,b) => played[a.id].count-played[b.id].count || played[a.id].last-played[b.id].last || a.id.localeCompare(b.id))
 const count = Math.min(courts, Math.floor(ordered.length/4))
 const selected = ordered.slice(0,count*4)
 const level = p => ({Beginner:1,Intermediate:2,Advanced:3,Expert:4}[p.level] || 2)
 const assignments=[]
 for(let c=0;c<count;c++) {
  const group=selected.slice(c*4,c*4+4)
  const options=[[0,1,2,3],[0,2,1,3],[0,3,1,2]].map(o=>{
   const a=[group[o[0]],group[o[1]]],b=[group[o[2]],group[o[3]]]
   const repeats=t=>pairs.get(t.map(p=>p.id).sort().join(':'))||0
   return {teamA:a.map(p=>p.id),teamB:b.map(p=>p.id),cost:4*(repeats(a)+repeats(b))+Math.abs(a.reduce((s,p)=>s+level(p),0)-b.reduce((s,p)=>s+level(p),0))}
  }).sort((a,b)=>a.cost-b.cost)
  assignments.push({court:c+1,teamA:options[0].teamA,teamB:options[0].teamB})
 }
 return {assignments,waiting:ordered.slice(count*4).map(p=>p.id)}
}
