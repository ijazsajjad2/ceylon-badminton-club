// Opt-in sound-effects manager. OFF by default; the choice persists in
// localStorage. Sample playback (the smash effect) goes through Howler,
// which handles the HTML5/Web-Audio fallback and the mobile "first user
// gesture" unlock dance more robustly than a hand-rolled <audio> or
// AudioContext call — useful both on iOS Safari and inside the Android
// WebView the site is also shipped in. The win/pop chimes have no source
// file to play, so they're synthesized directly via Web Audio oscillators.
import { Howl } from 'howler'

const KEY = 'cbc.sfx'

let smashHowl = null
let synthCtx = null

export function sfxEnabled() {
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function setSfxEnabled(on) {
  try { localStorage.setItem(KEY, on ? '1' : '0') } catch { /* private mode */ }
  if (on) preloadSmash() // warm the buffer so the first smash isn't late
}

function preloadSmash() {
  if (!smashHowl) smashHowl = new Howl({ src: ['/smash.wav'], volume: 0.5, preload: true })
  return smashHowl
}

export function playSmash() {
  if (!sfxEnabled()) return
  try { preloadSmash().play() } catch { /* never let sound break the UI */ }
}

function getSynthCtx() {
  synthCtx = synthCtx || new (window.AudioContext || window.webkitAudioContext)()
  if (synthCtx.state === 'suspended') synthCtx.resume()
  return synthCtx
}

function tone(ctx, freq, startTime, duration, peakGain) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.02)
}

/** Ascending three-note major chime (C5-E5-G5) — match win, big celebrations. */
export function playWin() {
  if (!sfxEnabled()) return
  try {
    const ctx = getSynthCtx()
    const t0 = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => tone(ctx, freq, t0 + i * 0.09, 0.28, 0.16))
  } catch { /* never let sound break the UI */ }
}

/** Short, soft blip — light confirmations (RSVP toggle on). */
export function playPop() {
  if (!sfxEnabled()) return
  try {
    const ctx = getSynthCtx()
    tone(ctx, 880, ctx.currentTime, 0.09, 0.12)
  } catch { /* never let sound break the UI */ }
}
