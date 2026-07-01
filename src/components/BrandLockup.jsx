// Horizontal brand lockup: the lion-shield crest + the "Ceylon Badminton Club"
// wordmark set in the site's display font (live text, so it stays crisp at any
// size and always matches the site typography). Used in the public navbar,
// footer, members navbar and login header. The shield alone (logo.png) is still
// used for favicons / PWA icons.
export default function BrandLockup({ size = 'md', sub = 'Riyadh Chapter', className = '' }) {
  return (
    <span className={`brand-lockup brand-lockup-${size} ${className}`.trim()}>
      <img className="brand-lockup-mark" src="/logo.png" alt="Ceylon Badminton Club crest" />
      <span className="brand-lockup-divider" aria-hidden="true" />
      <span className="brand-lockup-text">
        <span className="brand-lockup-name">Ceylon Badminton Club</span>
        {sub && <span className="brand-lockup-sub">{sub}</span>}
      </span>
    </span>
  )
}
