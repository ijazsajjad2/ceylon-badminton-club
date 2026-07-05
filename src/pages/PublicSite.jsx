import { Suspense, lazy, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Reveal from '../components/Reveal.jsx'
import CountUp from '../components/CountUp.jsx'
import BrandLockup from '../components/BrandLockup.jsx'
import ScrollProgress from '../components/ScrollProgress.jsx'
import BackToTop from '../components/BackToTop.jsx'
import PublicNav from '../components/PublicNav.jsx'
import SectionHeading from '../components/SectionHeading.jsx'
import GlassCard from '../components/GlassCard.jsx'
import StatTile from '../components/StatTile.jsx'
import SessionsShowcase from '../components/SessionCard.jsx'
import SessionCountdown from '../components/SessionCountdown.jsx'
import MemberCard from '../components/MemberCard.jsx'
import EventCard from '../components/EventCard.jsx'
import CTASection from '../components/CTASection.jsx'
import JoinModal from '../components/JoinModal.jsx'
import AnimatedShuttlecock from '../components/AnimatedShuttlecock.jsx'
import CourtLines from '../components/CourtLines.jsx'
import ShuttleParticles from '../components/ShuttleParticles.jsx'
import Hero3D from '../components/Hero3D.jsx'
import ScrollTiltIn from '../components/ScrollTiltIn.jsx'
import MilestonesReel from '../components/MilestonesReel.jsx'
import PushOptIn from '../components/PushOptIn.jsx'
import useScrollSpy from '../hooks/useScrollSpy.js'
import RotatingGreeting from '../components/RotatingGreeting.jsx'
import { computeStats, setsWon } from '../lib/stats.js'
import { track } from '../lib/analytics.js'
import { playSmash } from '../lib/sfx.js'
import SoundToggle from '../components/SoundToggle.jsx'
import { TODAY_SESSION } from '../data/seed.js'
import { fmtFullDate, fmtDate, dayName } from '../lib/format.js'
import { HERO_SLIDES, MILESTONES, FACTS_PHOTO } from '../data/gallery.js'
import NavIcon from '../components/Icons.jsx'
import HeroBackdrop from '../components/HeroBackdrop.jsx'
import { TESTIMONIALS } from '../data/testimonials.js'
import {
  whatsappJoin, MAP_EMBED_URL, MAP_DIRECTIONS_URL, MAP_SHARE_URL, INSTAGRAM_URL,
} from '../lib/contact.js'

// Gallery pulls in react-photo-album (and, in turn, the lightbox) — lazy-loaded
// so the landing page paints without it.
const AdvancedGallery = lazy(() => import('../components/AdvancedGallery.jsx'))

const NAV_IDS = ['about', 'sessions', 'gallery', 'results', 'members', 'faq']
const FEATURE_ICONS = ['shuffle', 'calendar', 'users', 'trophy']
const FAQ_IDS = ['q1', 'q2', 'q3', 'q4', 'q5']

const first = (name) => (name || '?').replace(/ .*/, '')

function buildResult(m, playerById, t) {
  const a = m.teamA.map((id) => first(playerById[id]?.name)).join(' & ')
  const b = m.teamB.map((id) => first(playerById[id]?.name)).join(' & ')
  const { a: sa, b: sb } = setsWon(m)
  const sample = m.sets[0] || [21, 18]
  return {
    id: m.id,
    win: m.winner === 'A' ? a : b,
    lose: m.winner === 'A' ? b : a,
    score: `${sample[0]}–${sample[1]}`,
    sets: m.sets.length > 1 ? `${Math.max(sa, sb)}–${Math.min(sa, sb)} ${t('results.sets')}` : t('results.straightSets'),
    type: m.type,
    date: m.date,
    confirmed: (m.confirmedBy || []).length > 0,
  }
}

export default function PublicSite() {
  const { t } = useTranslation()
  const { openLogin } = useAuth()
  const { players, sessions, matches, playerById } = useApp()
  const active = useScrollSpy(NAV_IDS)
  const reduce = useReducedMotion()
  const [joinOpen, setJoinOpen] = useState(false)

  const NAV = NAV_IDS.map((id) => [id, t(`nav.${id}`)])
  const FEATURES = FEATURE_ICONS.map((icon, i) => ({
    icon, title: t(`play.f${i + 1}Title`), text: t(`play.f${i + 1}Text`),
  }))
  const FAQ = FAQ_IDS.map((id, i) => ({ id, q: t(`faq.q${i + 1}`), a: t(`faq.a${i + 1}`) }))

  const memberCount = players.length
  const matchesPlayed = matches.length
  const year = new Date().getFullYear()

  const nextSession = useMemo(
    () => sessions.find((s) => s.status === 'upcoming') || TODAY_SESSION,
    [sessions]
  )
  const upcoming = useMemo(() => sessions.filter((s) => s.status === 'upcoming').slice(0, 2), [sessions])
  const statById = useMemo(() => {
    const map = {}
    for (const s of computeStats(matches)) map[s.id] = s
    return map
  }, [matches])
  const recentResults = useMemo(
    () => matches.filter((m) => !m.live && m.winner).slice(0, 5).map((m) => buildResult(m, playerById, t)),
    [matches, playerById, t]
  )
  const leaders = useMemo(
    () => computeStats(matches).filter((r) => r.played > 0).slice(0, 3),
    [matches]
  )

  const openJoin = () => { track('Join opened'); playSmash(); setJoinOpen(true) }
  const sayHello = () => { track('WhatsApp join'); whatsappJoin() }
  const handleLogin = () => { track('Member login clicked'); openLogin() }

  // Hero entrance choreography.
  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
  const item = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } }

  return (
    <div className="public-site">
      <ScrollProgress />
      <PublicNav nav={NAV} active={active} onLogin={handleLogin} />

      {/* ─────────── Hero ─────────── */}
      <section className="public-hero" id="top">
        <HeroBackdrop photos={HERO_SLIDES} />
        <div className="hero-net" aria-hidden="true" />
        <CourtLines className="hero-court" opacity={0.12} parallax={34} />
        <ShuttleParticles />
        <AnimatedShuttlecock mode="hero" size={46} duration={13} className="hero-shuttle" />
        <Hero3D />

        <motion.div className="public-hero-inner" variants={stagger} initial="hidden" animate="show">
          <div className="hero-main">
            <motion.div className="hero-badges" variants={item}>
              <span className="hero-badge"><NavIcon name="pin" size={13} /> {t('hero.location')}</span>
              <span className="hero-badge hero-badge-gold">{t('hero.est')}</span>
              <span className="hero-badge"><NavIcon name="users" size={13} /> {t('hero.members', { count: memberCount })}</span>
            </motion.div>
            <motion.h1 className="public-hero-title" variants={item}>
              <span className="l1">{t('hero.title1')}</span>
              <span className="l2">{t('hero.title2')}</span>
            </motion.h1>
            <motion.p className="hero-tagline" variants={item}>
              <RotatingGreeting /> — {t('hero.taglineSuffix')}
            </motion.p>
            <motion.p className="public-hero-sub" variants={item}>
              <Trans i18nKey="hero.sub" components={[<b key="0" />, <b key="1" />, <b key="2" />]} />
            </motion.p>
            <motion.div className="public-hero-cta" variants={item}>
              <button className="btn btn-gold btn-lg btn-smash" onClick={openJoin}>
                <span className="smash-trail" aria-hidden="true" />
                <NavIcon name="shuttle" size={17} /> {t('hero.ctaJoin')}
              </button>
              <a className="btn btn-ghost" href="#members">{t('hero.ctaMembers')}</a>
              <a className="btn btn-ghost" href="#sessions">{t('hero.ctaSessions')}</a>
            </motion.div>
            <motion.div className="public-hero-stats" variants={item}>
              <div className="phs-item"><b><CountUp value={memberCount} /></b><span>{t('hero.statMembers')}</span></div>
              <span className="phs-div" />
              <div className="phs-item"><b>2×</b><span>{t('hero.statPerWeek')}</span></div>
              <span className="phs-div" />
              <div className="phs-item"><b>2024</b><span>{t('hero.statEstablished')}</span></div>
              <span className="phs-div" />
              {matchesPlayed > 0 ? (
                <div className="phs-item"><b><CountUp value={matchesPlayed} suffix="+" /></b><span>{t('hero.statMatches')}</span></div>
              ) : (
                <div className="phs-item"><b>2</b><span>{t('hero.statCourts')}</span></div>
              )}
            </motion.div>
          </div>
          {/* Desktop-only session ticket: puts the next session (with a live
              countdown) in the hero's otherwise-empty right half. */}
          <motion.aside className="hero-session-card glass halftone" variants={item} aria-label={t('hero.nextSession')}>
            <span className="eyebrow">{t('hero.nextSession')}</span>
            <div className="display hero-session-day">{fmtFullDate(nextSession.date)}</div>
            <div className="hero-session-meta mono">{nextSession.time} · {nextSession.courts} {t('results.courts')} · {nextSession.venue}</div>
            <SessionCountdown dateIso={nextSession.date} time={nextSession.time.split('–')[0]} />
            <button className="btn btn-gold btn-sm btn-smash" onClick={openJoin}>
              <span className="smash-trail" aria-hidden="true" />
              {t('hero.playThisOne')}
            </button>
          </motion.aside>
        </motion.div>
        <a className="hero-scroll" href="#about" aria-label="Scroll to learn more"><span>{t('hero.scroll')}</span><i>↓</i></a>
      </section>

      {/* ─────────── About ─────────── */}
      <section id="about" className="band">
        <div className="public-section about-grid2">
          <Reveal className="glass card-pad about-card">
            <span className="eyebrow">{t('about.eyebrow')}</span>
            <h2 className="display about-headline">{t('about.headline')}</h2>
            <p className="about-text">{t('about.p1')}</p>
            <p className="about-text">
              {t('about.p2')}
            </p>
            <ul className="about-points">
              <li><span className="ap-ico"><NavIcon name="shuffle" size={17} /></span><span>{t('about.point1')}</span></li>
              <li><span className="ap-ico"><NavIcon name="flag" size={17} /></span><span>{t('about.point2')}</span></li>
              <li><span className="ap-ico"><NavIcon name="trophy" size={17} /></span><span>{t('about.point3')}</span></li>
            </ul>
            <button className="btn btn-gold btn-smash" style={{ marginTop: 18 }} onClick={openJoin}>
              <span className="smash-trail" aria-hidden="true" />
              {t('about.cta')}
            </button>
          </Reveal>
          <Reveal delay={0.1} className="glass card-pad facts-card halftone">
            <figure className="facts-photo">
              <img src={FACTS_PHOTO.src} alt={`Ceylon Badminton Club — ${FACTS_PHOTO.cap}`} loading="lazy" decoding="async" />
            </figure>
            <span className="eyebrow">{t('about.factsEyebrow')}</span>
            <div className="fact-rows">
              <div className="fact-row"><span className="fact-k"><NavIcon name="flag" size={15} /> {t('about.factsEstablished')}</span><span className="fact-v">2024</span></div>
              <div className="fact-row"><span className="fact-k"><NavIcon name="pin" size={15} /> {t('about.factsVenue')}</span><span className="fact-v">{t('about.factsVenueValue')}</span></div>
              <div className="fact-row"><span className="fact-k"><NavIcon name="calendar" size={15} /> {t('about.factsPlays')}</span><span className="fact-v">{t('about.factsPlaysValue')}</span></div>
              <div className="fact-row"><span className="fact-k"><NavIcon name="clock" size={15} /> {t('about.factsHours')}</span><span className="fact-v">{t('about.factsHoursValue')}</span></div>
              <div className="fact-row"><span className="fact-k"><NavIcon name="users" size={15} /> {t('about.factsMembers')}</span><span className="fact-v">{memberCount}</span></div>
              <div className="fact-row"><span className="fact-k"><NavIcon name="shuttle" size={15} /> {t('about.factsFormat')}</span><span className="fact-v">{t('about.factsFormatValue')}</span></div>
            </div>
            <button className="btn btn-wa facts-cta" onClick={sayHello}><NavIcon name="chat" size={16} /> {t('about.factsCta')}</button>
          </Reveal>
        </div>
      </section>

      {/* ─────────── Weekly sessions ─────────── */}
      <section id="sessions" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('sessions.eyebrow')}
            title={t('sessions.title')}
            accent={t('sessions.accent')}
            lead={t('sessions.lead')}
          />
          <SessionsShowcase onJoin={openJoin} />
          <Reveal delay={0.15}>
            <div className="next-session-strip glass">
              <span className="eyebrow">{t('sessions.nextSession')}</span>
              <span className="display next-strip-date">{fmtFullDate(nextSession.date)}</span>
              <span className="next-strip-meta mono">{nextSession.time} · {nextSession.courts} {t('results.courts')}</span>
              <a className="btn btn-ghost btn-sm" href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer"><NavIcon name="compass" size={15} /> {t('sessions.directions')}</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── How we play ─────────── */}
      <section id="play" className="band">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('play.eyebrow')}
            title={t('play.title')}
            accent={t('play.accent')}
            lead={t('play.lead')}
          />
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.icon} delay={i * 0.08}>
                <GlassCard className="feature-card">
                  <span className="feature-num display" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="feature-ico"><NavIcon name={f.icon} size={26} /></span>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-text">{f.text}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── Club stats ─────────── */}
      <section id="stats" className="band tint stats-band">
        <CourtLines opacity={0.06} parallax={20} />
        <div className="public-section">
          <SectionHeading eyebrow={t('stats.eyebrow')} title={t('stats.title')} accent={t('stats.accent')} />
          <ScrollTiltIn className="stats-grid">
            <StatTile icon={<NavIcon name="flag" size={24} />} text="2024" label={t('stats.established')} delay={0} />
            <StatTile icon={<NavIcon name="users" size={24} />} value={memberCount} label={t('stats.members')} delay={0.06} />
            <StatTile icon={<NavIcon name="calendar" size={24} />} text={t('stats.wedSat')} label={t('stats.sessionsWeekly')} delay={0.12} />
            {matchesPlayed > 0 ? (
              <StatTile icon={<NavIcon name="shuttle" size={24} />} value={matchesPlayed} suffix="+" label={t('stats.matchesTracked')} delay={0.18} />
            ) : (
              <StatTile icon={<NavIcon name="court" size={24} />} text={t('stats.courts2')} label={t('stats.everySession')} delay={0.18} />
            )}
            <StatTile icon={<NavIcon name="shuffle" size={24} />} text={t('stats.doubles')} label={t('stats.randomFormat')} delay={0.24} />
          </ScrollTiltIn>
        </div>
      </section>

      {/* ─────────── Gallery ─────────── */}
      <section id="gallery" className="band">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('gallery.eyebrow')}
            title={t('gallery.title')}
            accent={t('gallery.accent')}
            lead={t('gallery.lead')}
          />
          <Reveal>
            <Suspense fallback={<div className="gallery-loading">{t('gallery.loading')}</div>}>
              <AdvancedGallery />
            </Suspense>
          </Reveal>
        </div>
      </section>

      {/* ─────────── Results & upcoming ─────────── */}
      <section id="results" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('results.eyebrow')}
            title={t('results.title')}
            accent={t('results.accent')}
            lead={t('results.lead')}
          />
          <div className="events-cols">
            <div className="events-col">
              <h3 className="events-col-h display">{t('results.recentResults')}</h3>
              {recentResults.map((r, i) => (
                <EventCard
                  key={r.id}
                  dateBadge={fmtDate(r.date)}
                  title={<><b className="gold">{r.win}</b> {t('results.beat')} {r.lose}</>}
                  meta={[
                    `${r.score} · ${r.sets}`,
                    r.type === 'doubles' ? t('results.doubles') : t('results.singles'),
                    r.confirmed
                      ? <><NavIcon name="check" size={12} /> {t('results.confirmed')}</>
                      : <><NavIcon name="hourglass" size={12} /> {t('results.pending')}</>,
                  ]}
                  status={r.score}
                  tone="result"
                  delay={i * 0.05}
                />
              ))}
              {recentResults.length === 0 && (
                <GlassCard className="dim center">{t('results.emptyResults')}</GlassCard>
              )}
            </div>
            <div className="events-col">
              <h3 className="events-col-h display">{t('results.upcomingSessions')}</h3>
              {upcoming.map((s, i) => (
                <EventCard
                  key={s.id}
                  dateBadge={fmtDate(s.date)}
                  title={dayName(s.date) === 'Wed' ? t('results.wedNightDoubles') : t('results.satMorningDoubles')}
                  meta={[
                    <><NavIcon name="clock" size={12} /> {s.time}</>,
                    <><NavIcon name="pin" size={12} /> {s.venue}</>,
                    <><NavIcon name="court" size={12} /> {s.courts} {t('results.courts')}</>,
                  ]}
                  status={t('results.open')}
                  tone="upcoming"
                  delay={i * 0.05}
                />
              ))}
              <Reveal delay={0.15}>
                <button className="btn btn-gold btn-smash" style={{ width: '100%', justifyContent: 'center' }} onClick={openJoin}>
                  <span className="smash-trail" aria-hidden="true" />
                  {t('results.playNext')}
                </button>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Club leaders ─────────── */}
      {leaders.length > 0 && (
        <section id="leaders" className="band">
          <div className="public-section">
            <SectionHeading
              eyebrow={t('leaders.eyebrow')}
              title={t('leaders.title')}
              accent={t('leaders.accent')}
              lead={t('leaders.lead')}
            />
            <div className="leaders-grid">
              {leaders.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}>
                  <div className={`glass card-pad leader-card leader-rank-${i + 1}`}>
                    <div className="leader-medal">{['🥇', '🥈', '🥉'][i] || `#${p.rank}`}</div>
                    <Avatar player={p} size={64} ring />
                    <div className="leader-name">{p.name}</div>
                    <div className="leader-points mono">{p.points}<span> {t('leaders.pts')}</span></div>
                    <div className="leader-meta">{p.won}W · {p.lost}L · {p.winPct}% {t('leaders.win')}</div>
                    {p.form.length > 0 && (
                      <div className="leader-form" aria-label="Recent form">
                        {p.form.map((r, idx) => (
                          <span key={idx} className={`form-dot form-${r}`} title={r === 'W' ? t('leaders.win') : t('leaders.loss')}>{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── Milestones (real trophy moments) ─────────── */}
      <section id="milestones" className="band band-trophy">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('milestones.eyebrow')}
            title={t('milestones.title')}
            accent={t('milestones.accent')}
            lead={t('milestones.lead')}
          />
          <MilestonesReel
            items={MILESTONES}
            renderItem={(m, i) => (
              <Reveal key={m.src} delay={i * 0.06}>
                <figure className="milestone-card glass" role="listitem">
                  <img src={m.src} alt={`Ceylon Badminton Club — ${m.title}`} width={m.width} height={m.height} loading="lazy" decoding="async" />
                  <figcaption>
                    <span className="milestone-ico" aria-hidden="true"><NavIcon name="trophy" size={15} /></span>
                    {m.title}
                  </figcaption>
                </figure>
              </Reveal>
            )}
          />
        </div>
      </section>

      {/* ─────────── Member voices (renders only with real quotes) ─────────── */}
      {TESTIMONIALS.length > 0 && (
        <section id="voices" className="band">
          <div className="public-section">
            <SectionHeading
              eyebrow={t('voices.eyebrow')}
              title={t('voices.title')}
              accent={t('voices.accent')}
            />
            <div className="voices-grid">
              {TESTIMONIALS.map((quote, i) => (
                <Reveal key={quote.name + i} delay={i * 0.08}>
                  <blockquote className="glass card-pad voice-card">
                    <p>“{quote.quote}”</p>
                    <footer><b>{quote.name}</b>{quote.role && <span> · {quote.role}</span>}</footer>
                  </blockquote>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── Members ─────────── */}
      <section id="members" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('members.eyebrow')}
            title={t('members.title')}
            accent={t('members.accent')}
            lead={t('members.lead', { count: memberCount })}
          />
          <motion.div
            className="members-grid"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
          >
            {players.map((p, i) => (
              <MemberCard key={p.id} player={p} stat={statById[p.id]} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────── Visit / map ─────────── */}
      <section id="visit" className="band band-blue">
        <div className="public-section">
          <div className="visit-grid">
            <Reveal className="glass card-pad visit-card halftone">
              <span className="eyebrow">{t('visit.eyebrow')}</span>
              <h2 className="display about-headline">{t('visit.title')}</h2>
              <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
                <span className="hero-pill"><NavIcon name="moon" size={14} /> {t('visit.wedPill')}</span>
                <span className="hero-pill"><NavIcon name="sunrise" size={14} /> {t('visit.satPill')}</span>
                <span className="hero-pill"><NavIcon name="pin" size={14} /> {nextSession.venue}, {t('visit.riyadh')}</span>
              </div>
              <div className="next-session">
                <span className="eyebrow">{t('visit.nextSession')}</span>
                <div className="display next-date">{fmtFullDate(nextSession.date)}</div>
                <div className="faint" style={{ fontSize: 13 }}>{nextSession.time} · {nextSession.courts} {t('results.courts')} · {t('visit.randomDoublesSuffix')}</div>
              </div>
              <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
                <button className="btn btn-wa" onClick={sayHello}><NavIcon name="chat" size={16} /> {t('visit.waCta')}</button>
                <a className="btn btn-ghost" href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer"><NavIcon name="compass" size={16} /> {t('visit.directions')}</a>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="glass map-card">
              <iframe
                title={t('visit.mapTitle')}
                className="venue-map"
                src={MAP_EMBED_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <a className="map-open" href={MAP_SHARE_URL} target="_blank" rel="noopener noreferrer"><NavIcon name="pin" size={14} /> {t('visit.openMaps')}</a>
            </Reveal>
          </div>
          <PushOptIn />
        </div>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section id="faq" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow={t('faq.eyebrow')}
            title={t('faq.title')}
            accent={t('faq.accent')}
            lead={t('faq.lead')}
          />
          <Reveal className="faq-list">
            {FAQ.map((item2) => (
              <details className="faq-item glass" key={item2.id}>
                <summary>{item2.q}<span className="faq-plus">+</span></summary>
                <p>{item2.a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ─────────── Join CTA ─────────── */}
      <CTASection onJoin={openJoin} onLogin={handleLogin} />

      {/* ─────────── Footer ─────────── */}
      <footer className="public-footer">
        <div className="footer-net" aria-hidden="true" />
        <div className="public-footer-grid">
          <div className="footer-brand">
            <BrandLockup size="sm" sub="Riyadh · Est. 2024" />
            <p className="footer-tag">{t('footer.tagline')}</p>
            <div className="footer-socials">
              <button className="footer-social" onClick={sayHello} aria-label="Contact us on WhatsApp"><NavIcon name="chat" size={14} /> {t('footer.whatsapp')}</button>
              {INSTAGRAM_URL && <a className="footer-social" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><NavIcon name="camera" size={14} /> {t('footer.instagram')}</a>}
              <a className="footer-social" href={MAP_SHARE_URL} target="_blank" rel="noopener noreferrer"><NavIcon name="pin" size={14} /> {t('footer.map')}</a>
            </div>
          </div>
          <div className="footer-col">
            <span className="footer-h">{t('footer.explore')}</span>
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </div>
          <div className="footer-col">
            <span className="footer-h">{t('footer.playWithUs')}</span>
            <span className="footer-line"><NavIcon name="calendar" size={14} /> {t('footer.schedule')}</span>
            <span className="footer-line"><NavIcon name="pin" size={14} /> {t('footer.venue')}</span>
            <a href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer"><NavIcon name="compass" size={14} /> {t('footer.getDirections')}</a>
            <button className="footer-portal" onClick={handleLogin}><NavIcon name="key" size={14} /> {t('footer.portal')}</button>
          </div>
        </div>
        <div className="public-footer-base">
          <span>{t('footer.copyright', { year })}</span>
          <span className="faint">{t('footer.madeWith')}</span>
        </div>
      </footer>

      <BackToTop />
      <SoundToggle />
      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} />}
    </div>
  )
}
