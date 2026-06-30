// Pure-canvas confetti burst in club colours — no library, self-cleaning.
// Respects prefers-reduced-motion (no-op when the user opts out).

const CLUB_COLORS = ['#ff6b6b', '#e23b3b', '#1f5fd6', '#2FAE6B', '#ffffff']

export function fireConfetti({ x = 0.5, y = 0.35, count = 140, colors = CLUB_COLORS } = {}) {
  if (typeof window === 'undefined') return
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:400'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = (canvas.width = window.innerWidth * dpr)
  const H = (canvas.height = window.innerHeight * dpr)

  const ox = x * W
  const oy = y * H
  const G = 0.32 * dpr
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = (4 + Math.random() * 9) * dpr
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed * (0.6 + Math.random()),
      vy: Math.sin(angle) * speed - 6 * dpr,
      size: (5 + Math.random() * 6) * dpr,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      life: 1,
      shape: Math.random() < 0.5 ? 'rect' : 'circle',
    }
  })

  let frame = 0
  const maxFrames = 150
  function tick() {
    frame++
    ctx.clearRect(0, 0, W, H)
    for (const p of particles) {
      p.vy += G
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      p.life = Math.max(0, 1 - frame / maxFrames)
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    ctx.globalAlpha = 1
    if (frame < maxFrames) requestAnimationFrame(tick)
    else canvas.remove()
  }
  requestAnimationFrame(tick)
}
