/**
 * Turn the uploaded crest PNGs (which have a baked-in checkerboard "fake
 * transparency" background) into real transparent brand assets:
 *   - LOGO  (public/logo.png + logo.webp)  ← the DETAILED crest, shown on-page
 *   - ICONS (favicons / PWA icons)         ← the SIMPLIFIED shield, legible tiny
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
const LOGO_SRC = resolve(root, 'brand/lion-crest-detailed.png') // full crest w/ wordmark
const ICON_SRC = resolve(root, 'brand/lion-crest.png') // simplified lion-shield
const NAVY = '#0b1533'

// Remove the checkerboard background and return a trimmed, transparent PNG buffer.
async function cutout(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
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
  return sharp(data, { raw: { width: W, height: H, channels: C } }).png().trim({ threshold: 10 }).toBuffer()
}

// Pad a cutout to a transparent square so it centres cleanly at any size.
async function squareOf(cut) {
  const meta = await sharp(cut).metadata()
  const side = Math.max(meta.width, meta.height)
  return sharp({ create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: cut, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function main() {
  // ── Logo (detailed crest) ──
  const logoSquare = await squareOf(await cutout(LOGO_SRC))
  await sharp(logoSquare).resize(640, 640, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(pub('logo.png'))
  await sharp(logoSquare).resize(640, 640, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 92 }).toFile(pub('logo.webp'))

  // ── Favicons + PWA icons (simplified shield) ──
  const iconSquare = await squareOf(await cutout(ICON_SRC))
  for (const size of [32, 192, 512]) {
    await sharp(iconSquare).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(pub(`icon-${size}.png`))
  }
  const inner = Math.round(512 * 0.82)
  const shield = await sharp(iconSquare).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: NAVY } })
    .composite([{ input: shield, gravity: 'center' }]).png().toFile(pub('icon-maskable-512.png'))
  const appleInner = Math.round(180 * 0.86)
  const appleShield = await sharp(iconSquare).resize(appleInner, appleInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  await sharp({ create: { width: 180, height: 180, channels: 4, background: NAVY } })
    .composite([{ input: appleShield, gravity: 'center' }]).png().toFile(pub('apple-touch-icon.png'))

  console.log('Logo (detailed crest) + icons (simplified shield) written.')
}

main()
