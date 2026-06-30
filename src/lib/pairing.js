// RANDOM doubles pairing. Nobody has a fixed partner — every call reshuffles.
// Guarantees: no player paired with two different people (each appears once),
// no duo repeats within the generated set, and it tries to avoid repeating any
// duo from last session (fairness shuffle). Warns if a repeat is unavoidable.

const duoKey = (a, b) => [a, b].sort().join('~')

function fisherYates(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildPairs(players) {
  // players: array of player objects (or ids). Returns { pairs, sitOut, trio }
  const shuffled = fisherYates(players)
  const pairs = []
  let sitOut = null
  let trio = null

  if (shuffled.length % 2 !== 0) {
    // Odd group: fairly rotate who is the "extra". 50/50 choose between a
    // 3-player rotation match or one player sitting out this round.
    if (shuffled.length >= 3 && Math.random() < 0.5) {
      trio = [shuffled.pop(), shuffled.pop(), shuffled.pop()]
    } else {
      sitOut = shuffled.pop()
    }
  }
  for (let i = 0; i < shuffled.length - 1; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]])
  }
  return { pairs, sitOut, trio }
}

/**
 * @param {Array} players  player objects who are "going" today
 * @param {Set<string>} lastDuoKeys  duo keys from last session to avoid
 */
export function generateRandomPairs(players, lastDuoKeys = new Set()) {
  if (players.length < 2) {
    return { pairs: [], matches: [], sitOut: null, trio: null, warnings: ['Need at least 2 players to generate pairs.'] }
  }

  let best = null
  // Re-roll a handful of times to dodge last session's duos when possible.
  for (let attempt = 0; attempt < 60; attempt++) {
    const res = buildPairs(players)
    const repeats = res.pairs.filter((p) =>
      p.length === 2 ? lastDuoKeys.has(duoKey(idOf(p[0]), idOf(p[1]))) : false
    ).length
    if (repeats === 0) {
      best = { ...res, repeats }
      break
    }
    if (!best || repeats < best.repeats) best = { ...res, repeats }
  }

  const warnings = []
  if (best.repeats > 0) {
    warnings.push(
      `⚠ Group too small to fully avoid last session's pairings — ${best.repeats} repeat${best.repeats > 1 ? 's' : ''} unavoidable.`
    )
  }
  if (best.sitOut) {
    warnings.push(`Odd number of players — ${nameOf(best.sitOut)} sits out this round (rotate next time).`)
  }
  if (best.trio) {
    warnings.push(`Odd number of players — ${best.trio.map(nameOf).join(', ')} play a 3-player (2v1) rotation match.`)
  }

  // Pair up consecutive pairs into matches: pairs[0] vs pairs[1], etc.
  const matches = []
  for (let i = 0; i < best.pairs.length - 1; i += 2) {
    matches.push({ teamA: best.pairs[i], teamB: best.pairs[i + 1] })
  }
  // Leftover single pair with no opponent → folds into a trio-style rotation
  const leftoverPair = best.pairs.length % 2 !== 0 ? best.pairs[best.pairs.length - 1] : null

  return { pairs: best.pairs, matches, leftoverPair, sitOut: best.sitOut, trio: best.trio, warnings }
}

export function duoKeysFromPairs(pairs) {
  const set = new Set()
  for (const p of pairs) {
    if (p.length === 2) set.add(duoKey(idOf(p[0]), idOf(p[1])))
  }
  return set
}

function idOf(p) {
  return typeof p === 'string' ? p : p.id
}
function nameOf(p) {
  return typeof p === 'string' ? p : p.name
}
