import confetti from 'canvas-confetti'

// Club palette: jersey red + royal blue + gold, matching --gold-bright/
// --maroon-bright/--gold in global.css. Kept as plain hex since canvas-confetti
// draws to a <canvas>, outside the CSS cascade.
const PALETTE = ['#ff6b6b', '#e23b3b', '#2f7bf0', '#ffd166']

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Big celebratory burst from both bottom corners — match wins, big moments. */
export function fireWinConfetti() {
  if (reducedMotion()) return
  const shared = { colors: PALETTE, ticks: 220, disableForReducedMotion: true }
  confetti({ ...shared, particleCount: 70, spread: 68, origin: { x: 0.18, y: 0.75 }, angle: 60 })
  confetti({ ...shared, particleCount: 70, spread: 68, origin: { x: 0.82, y: 0.75 }, angle: 120 })
}

/** Smaller single-origin puff — lighter confirmations (RSVP, join request sent). */
export function firePuffConfetti(originX = 0.5) {
  if (reducedMotion()) return
  confetti({
    colors: PALETTE,
    particleCount: 32,
    spread: 55,
    startVelocity: 32,
    ticks: 160,
    origin: { x: originX, y: 0.7 },
    disableForReducedMotion: true,
  })
}
