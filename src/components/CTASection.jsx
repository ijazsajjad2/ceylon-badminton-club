import Reveal from './Reveal.jsx'
import CourtLines from './CourtLines.jsx'
import AnimatedShuttlecock from './AnimatedShuttlecock.jsx'

// The closing join band. The primary button carries the "smash" micro-
// animation on hover (CSS .btn-smash: quick shake + glow pulse + trail burst).
export default function CTASection({ onJoin, onLogin }) {
  return (
    <section className="public-cta" aria-label="Join the club">
      <Reveal className="glass card-pad public-cta-card">
        <CourtLines opacity={0.07} parallax={14} />
        <AnimatedShuttlecock mode="float" size={120} className="cta-shuttle" delay={1} />
        <span className="eyebrow">Sri Lankan &amp; in Riyadh?</span>
        <h2 className="display public-cta-title">Grab a racket. Join the club.</h2>
        <p className="public-cta-sub">
          Want to play doubles with a Sri Lankan badminton community in Riyadh? Join our weekly
          sessions at Green Badminton Club — new faces welcome, beginners included, and your
          first session is on us.
        </p>
        <div className="row wrap center" style={{ gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-gold btn-lg btn-smash" onClick={onJoin}>
            <span className="smash-trail" aria-hidden="true" />
            🏸 Join the Club
          </button>
          <button className="btn btn-ghost btn-lg" onClick={onLogin}>🔑 Member Login</button>
        </div>
      </Reveal>
    </section>
  )
}
