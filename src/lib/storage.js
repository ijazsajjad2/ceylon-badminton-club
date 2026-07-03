// Bump this version to invalidate stale cached app data (e.g. after a schedule/
// venue change) so every visitor picks up the new seed. Login session is stored
// separately under 'cbc.session', so bumping this does not sign anyone out.
const PREFIX = 'cbc.v4.'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full / unavailable — ignore */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}
