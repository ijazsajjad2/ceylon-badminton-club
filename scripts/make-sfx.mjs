// Synthesizes the short "smash" sound effect (public/smash.wav): a fast
// air-whoosh (band-swept noise) ending in a sharp shuttle "pop". Pure Node,
// no dependencies — run `node scripts/make-sfx.mjs` to regenerate.
import { writeFileSync } from 'node:fs'

const SR = 22050
const DUR = 0.34
const N = Math.floor(SR * DUR)
const samples = new Float32Array(N)

// Deterministic noise so the file is reproducible.
let seed = 20240614
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296 - 0.5
}

// Whoosh: noise through a resonant band-pass whose centre sweeps up 300→2400Hz,
// with a swelling-then-cut amplitude envelope.
let lp = 0, bp = 0
for (let i = 0; i < N; i++) {
  const t = i / N
  const f = 300 + 2100 * Math.pow(t, 1.6)
  const q = 0.12
  const coef = 2 * Math.PI * f / SR
  const x = rand()
  lp += coef * bp
  const hpv = x - lp - q * bp
  bp += coef * hpv
  const swell = Math.pow(Math.sin(Math.PI * Math.min(t / 0.82, 1)), 1.6)
  samples[i] = bp * swell * 0.75
}

// Impact "pop" at ~82% — a tight click + 1.2kHz ping decaying fast.
const hit = Math.floor(N * 0.82)
for (let i = hit; i < N; i++) {
  const t = (i - hit) / SR
  const decay = Math.exp(-t * 55)
  samples[i] += (Math.sin(2 * Math.PI * 1200 * t) * 0.5 + rand() * 0.6) * decay
}

// Normalize to -1..1 with headroom.
let peak = 0
for (const s of samples) peak = Math.max(peak, Math.abs(s))
const gain = 0.85 / peak

// 16-bit PCM mono WAV.
const data = Buffer.alloc(N * 2)
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i] * gain)) * 32767), i * 2)
}
const header = Buffer.alloc(44)
header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8)
header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20)
header.writeUInt16LE(1, 22); header.writeUInt32LE(SR, 24); header.writeUInt32LE(SR * 2, 28)
header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34)
header.write('data', 36); header.writeUInt32LE(data.length, 40)
writeFileSync('public/smash.wav', Buffer.concat([header, data]))
console.log(`public/smash.wav written (${((44 + data.length) / 1024).toFixed(1)} KB)`)
