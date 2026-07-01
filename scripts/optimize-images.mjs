/**
 * One-off image pipeline (run locally with `npm run optimize:images`).
 * Requires the `sharp` devDependency. It:
 *   1. Re-encodes every gallery thumbnail (`-sm.jpg`) to a properly sized 600px
 *      JPEG — several shipped larger than their full-size originals.
 *   2. Emits a WebP of the hero photo for the CSS image-set() (jpg stays the
 *      universal fallback).
 *   3. Builds a 1200x630 branded Open Graph share card (badged with the crest).
 *
 * Favicons / PWA icons come from the club crest via scripts/make-logo.mjs.
 * Outputs are committed to the repo; this script is not part of the build.
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = (p) => resolve(root, 'public', p)
const pad = (n) => String(n).padStart(2, '0')

async function reencodeThumbnails() {
  let saved = 0
  for (let n = 1; n <= 25; n++) {
    const full = pub(`gallery/club-${pad(n)}.jpg`)
    const sm = pub(`gallery/club-${pad(n)}-sm.jpg`)
    try {
      await sharp(full)
        .resize({ width: 600, withoutEnlargement: true })
        .jpeg({ quality: 70, mozjpeg: true })
        .toFile(sm + '.tmp')
      const { writeFile, rename, stat } = await import('node:fs/promises')
      const before = (await stat(sm)).size
      const after = (await stat(sm + '.tmp')).size
      await rename(sm + '.tmp', sm)
      saved += before - after
      void writeFile
    } catch (e) {
      console.warn(`  thumb ${n}: ${e.message}`)
    }
  }
  console.log(`Thumbnails re-encoded. ~${Math.round(saved / 1024)} KB saved.`)
}

async function heroWebp() {
  await sharp(pub('gallery/club-08.jpg'))
    .webp({ quality: 78 })
    .toFile(pub('gallery/club-08.webp'))
  console.log('Hero WebP written.')
}

async function ogCover() {
  const W = 1200
  const H = 630
  const base = await sharp(pub('gallery/club-11.jpg'))
    .resize(W, H, { fit: 'cover', position: 'attention' })
    .toBuffer()
  const overlay = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0F1117" stop-opacity="0.35"/>
          <stop offset="0.55" stop-color="#0F1117" stop-opacity="0.72"/>
          <stop offset="1" stop-color="#0F1117" stop-opacity="0.95"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#shade)"/>
      <text x="80" y="330" font-family="sans-serif" font-size="28" font-weight="700" letter-spacing="5" fill="#ff6b6b">PRIVATE SRI LANKAN CLUB · RIYADH</text>
      <text x="76" y="430" font-family="sans-serif" font-size="84" font-weight="800" fill="#ffffff">Ceylon Badminton Club</text>
      <text x="80" y="492" font-family="sans-serif" font-size="32" font-weight="600" fill="#e6ecf5">Random doubles, twice a week — smash it together.</text>
    </svg>`)
  // The club crest, if it's been generated, badged onto the right side.
  const layers = [{ input: overlay }]
  try {
    const crest = await sharp(pub('logo.png')).resize(250, 250, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
    layers.push({ input: crest, top: 34, left: W - 290 })
  } catch { /* logo not generated yet — text-only card */ }
  await sharp(base)
    .composite(layers)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(pub('og-cover.jpg'))
  console.log('OG cover written.')
}

await reencodeThumbnails()
await heroWebp()
await ogCover()
console.log('Done.')
