// Tiny opt-in sound-effects manager. OFF by default; the choice persists in
// localStorage. Audio is only fetched/decoded after the user enables it, and
// playback runs through Web Audio (no <audio> element, no autoplay issues).
const KEY = 'cbc.sfx'

let ctx = null
let smashBuf = null
let loading = null

export function sfxEnabled() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function setSfxEnabled(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* private mode */ }
  if (on) preload() // warm the buffer so the first smash isn't late
}

function preload() {
  if (smashBuf || loading) return loading
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
  loading = fetch('/smash.wav')
    .then((r) => r.arrayBuffer())
    .then((b) => ctx.decodeAudioData(b))
    .then((buf) => { smashBuf = buf; return buf })
    .catch(() => null)
  return loading
}

export function playSmash() {
  if (!sfxEnabled()) return
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const start = (buf) => {
      if (!buf) return
      const src = ctx.createBufferSource()
      const gain = ctx.createGain()
      gain.gain.value = 0.5
      src.buffer = buf
      src.connect(gain).connect(ctx.destination)
      src.start()
    }
    if (smashBuf) start(smashBuf)
    else preload()?.then(start)
  } catch { /* never let sound break the UI */ }
}
