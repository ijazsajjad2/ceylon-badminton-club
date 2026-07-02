// Minimal drifting "feather" particles — pure CSS animation (no JS per frame),
// deterministic layout, transform/opacity only, hidden for reduced motion via
// the global media query on .particle. Keep the count tiny for battery life.
const PARTICLES = [
  { left: '8%', top: '22%', s: 5, d: 16, delay: 0 },
  { left: '22%', top: '68%', s: 4, d: 21, delay: 3 },
  { left: '38%', top: '14%', s: 6, d: 18, delay: 6 },
  { left: '55%', top: '76%', s: 4, d: 23, delay: 1.5 },
  { left: '70%', top: '30%', s: 5, d: 17, delay: 8 },
  { left: '84%', top: '62%', s: 4, d: 20, delay: 4.5 },
  { left: '93%', top: '18%', s: 3, d: 24, delay: 10 },
]

export default function ShuttleParticles({ className = '' }) {
  return (
    <div className={`particles ${className}`} aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.s,
            height: p.s,
            animationDuration: `${p.d}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
