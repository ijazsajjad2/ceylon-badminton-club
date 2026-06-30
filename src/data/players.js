// 16 real CBC Riyadh members — partners change every session, nobody is fixed.

// Avatar gradients drawn from the club-jersey palette: navy base with red &
// royal-blue splashes (a couple of crimson/indigo variants for variety).
const GRADIENTS = [
  ['#E23B3B', '#8B0E1A'],
  ['#2F7BF0', '#13357A'],
  ['#E0303F', '#2F6FE0'],
  ['#1F5FD6', '#0E2A66'],
  ['#FF5A5A', '#C1121F'],
  ['#3B82F6', '#1E40AF'],
  ['#D62839', '#6A0D14'],
  ['#2563EB', '#1E3A8A'],
  ['#EF3E4D', '#1841A8'],
  ['#1D4ED8', '#0B1E4D'],
  ['#FF6B6B', '#B00D20'],
  ['#4D8BFF', '#1F5FD6'],
  ['#C81E2C', '#3A0A10'],
  ['#2F7BF0', '#9E0C1A'],
  ['#6098F5', '#13357A'],
  ['#E23B3B', '#1F5FD6'],
]

export const PLAYERS = [
  { id: 'p1',  name: 'Tharindu',  level: 'Advanced', joinDate: '2023-01-15' },
  { id: 'p2',  name: 'Iresh',     level: 'Advanced', joinDate: '2022-09-04' },
  { id: 'p3',  name: 'Muditha',   level: 'Advanced', joinDate: '2023-06-11' },
  { id: 'p4',  name: 'Kitha',     level: 'Advanced', joinDate: '2022-11-22' },
  { id: 'p5',  name: 'PJ',        level: 'Advanced', joinDate: '2022-07-30' },
  { id: 'p6',  name: 'Edward',    level: 'Advanced', joinDate: '2023-08-14' },
  { id: 'p7',  name: 'Fahami',    level: 'Advanced', joinDate: '2023-10-05' },
  { id: 'p8',  name: 'Minshi',    level: 'Advanced', joinDate: '2023-03-19' },
  { id: 'p9',  name: 'Ramzeen',   level: 'Advanced', joinDate: '2024-01-08' },
  { id: 'p10', name: 'Nihad D',   level: 'Advanced', joinDate: '2024-02-17' },
  { id: 'p11', name: 'Fazil',     level: 'Advanced', joinDate: '2023-12-03' },
  { id: 'p12', name: 'Mali Fedo', level: 'Advanced', joinDate: '2023-05-28' },
  { id: 'p13', name: 'Buddi',     level: 'Advanced', joinDate: '2024-04-10' },
  { id: 'p14', name: 'Gayan',     level: 'Advanced', joinDate: '2022-12-01' },
  { id: 'p15', name: 'Ijaz',      level: 'Advanced', joinDate: '2022-08-20' },
  { id: 'p16', name: 'Richy',     level: 'Advanced', joinDate: '2024-05-06' },
].map((p, i) => ({ ...p, gradient: GRADIENTS[i % GRADIENTS.length] }))

// Level-badge palette. Text colors are kept bright and the chip fill is a
// LOW-opacity tint of the same hue, so the colored label stays >= 4.5:1 on the
// dark glass cards (the old high-opacity same-hue fill dropped to ~2:1).
export const LEVELS = {
  Beginner:     { color: '#cfd6e2', glow: 'rgba(138,147,166,.16)' },
  Intermediate: { color: '#74c4ff', glow: 'rgba(45,156,223,.18)' },
  Advanced:     { color: '#c3a6ff', glow: 'rgba(155,108,240,.20)' },
  Expert:       { color: '#ff6b6b', glow: 'rgba(226,59,59,.20)' },
}

export function initials(name) {
  const parts = name.replace(/\./g, '').trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
