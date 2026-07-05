import { useTranslation } from 'react-i18next'
import Reveal from './Reveal.jsx'
import CourtLines from './CourtLines.jsx'
import AnimatedShuttlecock from './AnimatedShuttlecock.jsx'
import NavIcon from './Icons.jsx'
import { CTA_PHOTO } from '../data/gallery.js'

// The closing join band: a duotone team photo under the glass ties the ask
// back to the real club. The primary button carries the "smash" micro-
// animation on hover (CSS .btn-smash: quick shake + glow pulse + trail burst).
export default function CTASection({ onJoin, onLogin }) {
  const { t } = useTranslation()
  return (
    <section className="public-cta" aria-label="Join the club">
      <Reveal className="glass card-pad public-cta-card">
        <div className="cta-photo" style={{ backgroundImage: `url(${CTA_PHOTO})` }} aria-hidden="true" />
        <CourtLines opacity={0.07} parallax={14} />
        <AnimatedShuttlecock mode="float" size={120} className="cta-shuttle" delay={1} />
        <div className="cta-content">
          <span className="eyebrow">{t('cta.eyebrow')}</span>
          <h2 className="display public-cta-title">{t('cta.title')}</h2>
          <p className="public-cta-sub">{t('cta.sub')}</p>
          <div className="row wrap center" style={{ gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-gold btn-lg btn-smash" onClick={onJoin}>
              <span className="smash-trail" aria-hidden="true" />
              <NavIcon name="shuttle" size={17} /> {t('cta.join')}
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onLogin}><NavIcon name="key" size={16} /> {t('cta.login')}</button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
