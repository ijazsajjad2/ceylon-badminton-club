import { validateSet } from './format.js'

export function validateMatchSets(input, format = 'single') {
  const sets = []
  let a = 0, b = 0
  const needed = format === 'single' ? 1 : 2
  for (const [index, score] of input.slice(0, format === 'single' ? 1 : 3).entries()) {
    if (a === needed || b === needed) {
      if (score.a !== '' || score.b !== '') return { valid: false, error: 'Remove scores entered after the match was already won.' }
      continue
    }
    const result = validateSet(score.a, score.b)
    if (!result.valid) return { valid: false, error: `Set ${index + 1}: ${result.reason || 'enter both scores'}.` }
    const pair = [Number(score.a), Number(score.b)]
    sets.push(pair)
    if (pair[0] > pair[1]) a++; else b++
  }
  if (a !== needed && b !== needed) return { valid: false, error: 'Complete the deciding set.' }
  return { valid: true, sets, winner: a > b ? 'A' : 'B' }
}
