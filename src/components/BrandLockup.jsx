// Brand mark: the full detailed club crest (which already contains the
// "CEYLON BADMINTON CLUB · RIYADH" wordmark), shown on its own so the name
// isn't duplicated. Used in the public navbar, footer, members navbar and
// login header. The simplified lion-shield (logo icons) is used for favicons.
export default function BrandLockup({ size = 'md', className = '' }) {
  return (
    <img
      className={`brand-crest brand-crest-${size} ${className}`.trim()}
      src="/logo.png"
      alt="Ceylon Badminton Club crest"
    />
  )
}
