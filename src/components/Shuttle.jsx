// Decorative shuttlecock SVG used as a subtle low-opacity background flourish,
// and a compact logo variant for the navbar.

export function ShuttleLogo({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="slg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff6b6b" />
          <stop offset="1" stopColor="#e23b3b" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="48" r="11" fill="url(#slg)" />
      <circle cx="32" cy="48" r="11" fill="none" stroke="#1f5fd6" strokeWidth="2" />
      <g stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.95">
        <path d="M32 39 L18 8" /><path d="M32 39 L26 6" /><path d="M32 39 L32 5" />
        <path d="M32 39 L38 6" /><path d="M32 39 L46 8" />
      </g>
    </svg>
  )
}

export function ShuttleDeco({ size = 120, className = '', style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64"
      className={`shuttle-deco ${className}`} style={style} aria-hidden="true"
    >
      <circle cx="32" cy="48" r="11" fill="#e23b3b" />
      <g stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M32 39 L18 8" /><path d="M32 39 L26 6" /><path d="M32 39 L32 5" />
        <path d="M32 39 L38 6" /><path d="M32 39 L46 8" />
      </g>
      <path d="M20 14 L44 14" stroke="#e23b3b" strokeWidth="2" />
      <path d="M23 22 L41 22" stroke="#e23b3b" strokeWidth="2" />
    </svg>
  )
}
