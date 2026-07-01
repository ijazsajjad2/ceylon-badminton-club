/**
 * Turn the uploaded crest PNG (which has a baked-in checkerboard "fake
 * transparency" background) into a real transparent logo, then emit the web
 * asset + all favicons / PWA icons from it.
 *
 * Background removal = flood-fill from the image borders, keying only light,
 * low-saturation (checkerboard) pixels. Because the crest's interior whites
 * (lion, lettering) are enclosed by dark shield pixels, the flood never reaches
 * them, so they're preserved.
 */
import sharp from 'sharp'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = (p) => resolve(root, 'public', p)
// Committed brand source of truth; override with `node scripts/make-logo.mjs <path>`.
const SRC = process.argv[2] || resolve(root, 'brand/lion-crest.png')
const NAVY = '#0b1533'

async function cutout() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const isBg = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const min = Math.min(r, g, b), max = Math.max(r, g, b)
    return min >= 224 && max - min <= 22 // light & near-neutral = checkerboard
  }
  const flooded = new Uint8Array(W * H)
  const stack = []
  const pushIf = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return
    const p = y * W + x
    if (flooded[p]) return
    if (!isBg(p * C)) return
    flooded[p] = 1
    stack.push(p)
  }
  for (let x = 0; x < W; x++) { pushIf(x, 0); pushIf(x, H - 1) }
  for (let y = 0; y < H; y++) { pushIf(0, y); pushIf(W - 1, y) }
  while (stack.length) {
    const p = stack.pop()
    const x = p % W, y = (p - x) / W
    pushIf(x + 1, y); pushIf(x - 1, y); pushIf(x, y + 1); pushIf(x, y - 1)
  }
  for (let p = 0; p < W * H; p++) if (flooded[p]) data[p * C + 3] = 0
  // Trim the now-transparent border and return a square-ish PNG buffer.
  return sharp(data, { raw: { width: W, height: H, channels: C } })
    .png()
    .trim({ threshold: 10 })
    .toBuffer()
}

async function main() {
  const cut = await cutout()

  // Master web logo (transparent), padded to a square so icons center nicely.
  const meta = await sharp(cut).metadata()
  const side = Math.max(meta.width, meta.height)
  const square = await sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: cut, gravity: 'center' }])
    .png()
    .toBuffer()

  await sharp(square).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(pub('logo.png'))
  await sharp(square).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 92 }).toFile(pub('logo.webp'))

  // Favicons + PWA icons (transparent "any")
  for (const size of [32, 192, 512]) {
    await sharp(square).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(pub(`icon-${size}.png`))
  }
  // Maskable + apple-touch: navy background, crest inside the safe zone.
  const inner = Math.round(512 * 0.82)
  const crest = await sharp(square).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: NAVY } })
    .composite([{ input: crest, gravity: 'center' }]).png().toFile(pub('icon-maskable-512.png'))
  const appleInner = Math.round(180 * 0.86)
  const appleCrest = await sharp(square).resize(appleInner, appleInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  await sharp({ create: { width: 180, height: 180, channels: 4, background: NAVY } })
    .composite([{ input: appleCrest, gravity: 'center' }]).png().toFile(pub('apple-touch-icon.png'))

  console.log('Logo + icons written:', side + 'px master, trimmed from', meta.width + 'x' + meta.height)
}

main()
