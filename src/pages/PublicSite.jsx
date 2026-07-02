import { Suspense, lazy, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
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
import MemberCard from '../components/MemberCard.jsx'
import EventCard from '../components/EventCard.jsx'
import CTASection from '../components/CTASection.jsx'
import JoinModal from '../components/JoinModal.jsx'
import AnimatedShuttlecock from '../components/AnimatedShuttlecock.jsx'
import CourtLines from '../components/CourtLines.jsx'
import ShuttleParticles from '../components/ShuttleParticles.jsx'
import useScrollSpy from '../hooks/useScrollSpy.js'
import { computeStats, setsWon } from '../lib/stats.js'
import { track } from '../lib/analytics.js'
import { TODAY_SESSION } from '../data/seed.js'
import { fmtFullDate, fmtDate, dayName } from '../lib/format.js'
import { HERO_PHOTO } from '../data/gallery.js'
import {
  whatsappJoin, MAP_EMBED_URL, MAP_DIRECTIONS_URL, MAP_SHARE_URL, INSTAGRAM_URL,
} from '../lib/contact.js'

// Gallery pulls in react-photo-album (and, in turn, the lightbox) — lazy-loaded
// so the landing page paints without it.
const AdvancedGallery = lazy(() => import('../components/AdvancedGallery.jsx'))

const NAV = [
  ['about', 'About'], ['sessions', 'Sessions'], ['gallery', 'Gallery'],
  ['results', 'Results'], ['members', 'Members'], ['faq', 'FAQ'],
]

const FEATURES = [
  { icon: '🔀', title: 'Random doubles', text: 'No fixed partners, no permanent teams. Every session we shuffle fresh pairs, so you share a court with someone new each time.' },
  { icon: '🗓', title: 'Twice every week', text: 'We hit the courts every Wednesday night (8–10 PM) and Saturday morning (8–10 AM) at Green Badminton Club, Riyadh.' },
  { icon: '🤝', title: 'Everyone plays', text: 'Beginners to advanced, all welcome. A fair sit-out rotation means nobody is benched for long.' },
  { icon: '🏆', title: 'Friendly stakes', text: 'Every match is tracked on a personal leaderboard — bragging rights, MVPs and highlight reels included.' },
]

const FAQ = [
  { q: 'Do I need to be Sri Lankan to join?', a: 'It started as a Sri Lankan community, but everyone is welcome — bring a friend along.' },
  { q: 'What if I’m a beginner?', a: 'Perfect. Random doubles means you always get a mix of partners, and the regulars are happy to help you find your feet.' },
  { q: 'How much does it cost?', a: 'Your first session is on us. After that, members chip in for court costs — message us for the current rate.' },
  { q: 'What should I bring?', a: 'Just sports shoes and water. We can lend you a racket and shuttles for your first game.' },
  { q: 'When and where do you play?', a: 'Wednesday nights (8–10 PM) and Saturday mornings (8–10 AM) at Green Badminton Club, Riyadh.' },
]

const first = (name) => (name || '?').replace(/ .*/, '')

function buildResult(m, playerById) {
  const a = m.teamA.map((id) => first(playerById[id]?.name)).join(' & ')
  const b = m.teamB.map((id) => first(playerById[id]?.name)).join(' & ')
  const { a: sa, b: sb } = setsWon(m)
  const sample = m.sets[0] || [21, 18]
  return {
    id: m.id,
    win: m.winner === 'A' ? a : b,
    lose: m.winner === 'A' ? b : a,
    score: `${sample[0]}–${sample[1]}`,
    sets: m.sets.length > 1 ? `${Math.max(sa, sb)}–${Math.min(sa, sb)} sets` : 'straight sets',
    type: m.type,
    date: m.date,
  }
}

export default function PublicSite() {
  const { openLogin } = useAuth()
  const { players, sessions, matches, playerById } = useApp()
  const active = useScrollSpy(NAV.map((n) => n[0]))
  const reduce = useReducedMotion()
  const [joinOpen, setJoinOpen] = useState(false)

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
    () => matches.filter((m) => !m.live && m.winner).slice(0, 5).map((m) => buildResult(m, playerById)),
    [matches, playerById]
  )
  const leaders = useMemo(
    () => computeStats(matches).filter((r) => r.played > 0).slice(0, 3),
    [matches]
  )

  const openJoin = () => { track('Join opened'); setJoinOpen(true) }
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
        <div className="public-hero-bg" style={{ backgroundImage: `url(${HERO_PHOTO})` }} />
        <div className="hero-net" aria-hidden="true" />
        <CourtLines className="hero-court" opacity={0.12} parallax={34} />
        <ShuttleParticles />
        <AnimatedShuttlecock mode="hero" size={46} duration={13} className="hero-shuttle" />

        <motion.div className="public-hero-inner" variants={stagger} initial="hidden" animate="show">
          <motion.div className="hero-badges" variants={item}>
            <span className="hero-badge">📍 Riyadh, Saudi Arabia</span>
            <span className="hero-badge hero-badge-gold">Est. 2024</span>
            <span className="hero-badge">{memberCount} Members</span>
          </motion.div>
          <motion.h1 className="public-hero-title" variants={item}>
            <span className="l1">Ceylon</span>
            <span className="l2">Badminton Club</span>
          </motion.h1>
          <motion.p className="hero-tagline" variants={item}>
            Sri Lankan badminton community in Riyadh
          </motion.p>
          <motion.p className="public-hero-sub" variants={item}>
            Random doubles every <b>Wednesday night</b> and <b>Saturday morning</b> at Green
            Badminton Club. Show up, get matched — <b>smash it together.</b>
          </motion.p>
          <motion.div className="public-hero-cta" variants={item}>
            <button className="btn btn-gold btn-lg btn-smash" onClick={openJoin}>
              <span className="smash-trail" aria-hidden="true" />
              🏸 Join the Club
            </button>
            <a className="btn btn-ghost" href="#members">View Members</a>
            <a className="btn btn-ghost" href="#sessions">Weekly Sessions</a>
          </motion.div>
          <motion.div className="public-hero-stats" variants={item}>
            <div className="phs-item"><b><CountUp value={memberCount} /></b><span>Members</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>2×</b><span>Per week</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>2024</b><span>Established</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b><CountUp value={matchesPlayed} suffix="+" /></b><span>Matches</span></div>
          </motion.div>
        </motion.div>
        <a className="hero-scroll" href="#about" aria-label="Scroll to learn more"><span>Scroll</span><i>↓</i></a>
      </section>

      {/* ─────────── About ─────────── */}
      <section id="about" className="band">
        <div className="public-section about-grid2">
          <Reveal className="glass card-pad about-card">
            <span className="eyebrow">Who we are</span>
            <h2 className="display about-headline">A home for Sri Lankan badminton in Riyadh</h2>
            <p className="about-text">
              Ceylon Badminton Club brings together Sri Lankans across Riyadh who share one thing —
              a love for badminton. What started as a few friends booking a court has grown into a
              tight community built around fitness, friendship, discipline and competition.
            </p>
            <p className="about-text">
              There are no fixed partners and no permanent teams here. Every session we shuffle fresh
              random pairs, so you always play with — and against — someone new. It keeps the games
              friendly, the rallies sharp, and the whole club close-knit.
            </p>
            <ul className="about-points">
              <li><span className="ap-ico">🔀</span><span>Random doubles every session — nobody has a fixed partner</span></li>
              <li><span className="ap-ico">🇱🇰</span><span>A proudly Sri Lankan community, all skill levels welcome</span></li>
              <li><span className="ap-ico">🏆</span><span>Personal leaderboard, match history &amp; video highlights</span></li>
            </ul>
            <button className="btn btn-gold btn-smash" style={{ marginTop: 18 }} onClick={openJoin}>
              <span className="smash-trail" aria-hidden="true" />
              Come play with us
            </button>
          </Reveal>
          <Reveal delay={0.1} className="glass card-pad facts-card">
            <AnimatedShuttlecock mode="float" size={64} className="facts-shuttle" />
            <span className="eyebrow">Quick facts</span>
            <div className="fact-row"><span className="fact-k">📅 Established</span><span className="fact-v">2024</span></div>
            <div className="fact-row"><span className="fact-k">📍 Venue</span><span className="fact-v">Green Badminton Club</span></div>
            <div className="fact-row"><span className="fact-k">🗓 Plays</span><span className="fact-v">Wed &amp; Sat</span></div>
            <div className="fact-row"><span className="fact-k">🕓 Hours</span><span className="fact-v">8–10 PM / 8–10 AM</span></div>
            <div className="fact-row"><span className="fact-k">👥 Members</span><span className="fact-v">{memberCount}</span></div>
            <div className="fact-row"><span className="fact-k">🏸 Format</span><span className="fact-v">Random doubles</span></div>
            <button className="btn btn-wa" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={sayHello}>📲 Ask on WhatsApp</button>
          </Reveal>
        </div>
      </section>

      {/* ─────────── Weekly sessions ─────────── */}
      <section id="sessions" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow="Every single week"
            title="Weekly"
            accent="Sessions"
            lead="Two nights on court, one club. The shuttle doesn’t stop — and neither do we."
          />
          <SessionsShowcase onJoin={openJoin} />
          <Reveal delay={0.15}>
            <div className="next-session-strip glass">
              <span className="eyebrow">Next session</span>
              <span className="display next-strip-date">{fmtFullDate(nextSession.date)}</span>
              <span className="next-strip-meta mono">{nextSession.time} · {nextSession.courts} courts</span>
              <a className="btn btn-ghost btn-sm" href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">🧭 Directions</a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── How we play ─────────── */}
      <section id="play" className="band">
        <div className="public-section">
          <SectionHeading
            eyebrow="The Ceylon Way"
            title="How We"
            accent="Play"
            lead="Simple, social and fair — the format that keeps everyone coming back."
          />
          <div className="feature-grid">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.08}>
                <GlassCard className="feature-card">
                  <span className="feature-ico">{f.icon}</span>
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
          <SectionHeading eyebrow="The club in numbers" title="Club" accent="Stats" />
          <div className="stats-grid">
            <StatTile icon="📅" text="2024" label="Established" delay={0} />
            <StatTile icon="👥" value={memberCount} label="Members" delay={0.06} />
            <StatTile icon="🗓" text="Wed & Sat" label="Sessions weekly" delay={0.12} />
            <StatTile icon="⚔️" value={matchesPlayed} suffix="+" label="Matches tracked" delay={0.18} />
            <StatTile icon="🔀" text="Doubles" label="Random format" delay={0.24} />
          </div>
        </div>
      </section>

      {/* ─────────── Gallery ─────────── */}
      <section id="gallery" className="band">
        <div className="public-section">
          <SectionHeading
            eyebrow="In action"
            title="Life at the"
            accent="Club"
            lead="Real moments from our sessions, tournaments and trophy nights — tap any photo to view full screen."
          />
          <Reveal>
            <Suspense fallback={<div className="gallery-loading">Loading photos…</div>}>
              <AdvancedGallery />
            </Suspense>
          </Reveal>
        </div>
      </section>

      {/* ─────────── Results & upcoming ─────────── */}
      <section id="results" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow="On the scoreboard"
            title="Results &"
            accent="Events"
            lead="The latest scores straight from the courts, and what’s coming up next."
          />
          <div className="events-cols">
            <div className="events-col">
              <h3 className="events-col-h display">Recent results</h3>
              {recentResults.map((r, i) => (
                <EventCard
                  key={r.id}
                  dateBadge={fmtDate(r.date)}
                  title={<><b className="gold">{r.win}</b> beat {r.lose}</>}
                  meta={[`${r.score} · ${r.sets}`, r.type === 'doubles' ? 'Doubles' : 'Singles']}
                  status={r.score}
                  tone="result"
                  delay={i * 0.05}
                />
              ))}
              {recentResults.length === 0 && (
                <GlassCard className="dim center">Scores will appear here after the next session.</GlassCard>
              )}
            </div>
            <div className="events-col">
              <h3 className="events-col-h display">Upcoming sessions</h3>
              {upcoming.map((s, i) => (
                <EventCard
                  key={s.id}
                  dateBadge={fmtDate(s.date)}
                  title={`${dayName(s.date) === 'Wed' ? 'Wednesday Night' : 'Saturday Morning'} Doubles`}
                  meta={[`🕓 ${s.time}`, `📍 ${s.venue}`, `🏟 ${s.courts} courts`]}
                  status="Open"
                  tone="upcoming"
                  delay={i * 0.05}
                />
              ))}
              <Reveal delay={0.15}>
                <button className="btn btn-gold btn-smash" style={{ width: '100%', justifyContent: 'center' }} onClick={openJoin}>
                  <span className="smash-trail" aria-hidden="true" />
                  Play in the next one →
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
              eyebrow="On the leaderboard"
              title="Club"
              accent="Leaders"
              lead="Our top players by points — every win, partner and point is tracked across the season."
            />
            <div className="leaders-grid">
              {leaders.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.08}>
                  <div className={`glass card-pad leader-card leader-rank-${i + 1}`}>
                    <div className="leader-medal">{['🥇', '🥈', '🥉'][i] || `#${p.rank}`}</div>
                    <Avatar player={p} size={64} ring />
                    <div className="leader-name">{p.name}</div>
                    <div className="leader-points mono">{p.points}<span> pts</span></div>
                    <div className="leader-meta">{p.won}W · {p.lost}L · {p.winPct}% win</div>
                    {p.form.length > 0 && (
                      <div className="leader-form" aria-label="Recent form">
                        {p.form.map((r, idx) => (
                          <span key={idx} className={`form-dot form-${r}`} title={r === 'W' ? 'Win' : 'Loss'}>{r}</span>
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

      {/* ─────────── Members ─────────── */}
      <section id="members" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow="The squad"
            title="Our"
            accent="Members"
            lead={`${memberCount} players make up the club — partners rotate every session, so everyone plays with everyone.`}
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
      <section id="visit" className="band">
        <div className="public-section">
          <div className="visit-grid">
            <Reveal className="glass card-pad visit-card">
              <span className="eyebrow">When &amp; where</span>
              <h2 className="display about-headline">Come play with us</h2>
              <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
                <span className="hero-pill">🌙 Wed 8–10 PM</span>
                <span className="hero-pill">🌅 Sat 8–10 AM</span>
                <span className="hero-pill">📍 {nextSession.venue}, Riyadh</span>
              </div>
              <div className="next-session">
                <span className="eyebrow">Next session</span>
                <div className="display next-date">{fmtFullDate(nextSession.date)}</div>
                <div className="faint" style={{ fontSize: 13 }}>{nextSession.time} · {nextSession.courts} courts · random doubles</div>
              </div>
              <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
                <button className="btn btn-wa" onClick={sayHello}>📲 Ask to join on WhatsApp</button>
                <a className="btn btn-ghost" href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">🧭 Directions</a>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="glass map-card">
              <iframe
                title="Green Badminton Club location"
                className="venue-map"
                src={MAP_EMBED_URL}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <a className="map-open" href={MAP_SHARE_URL} target="_blank" rel="noopener noreferrer">📍 Open in Google Maps ↗</a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section id="faq" className="band tint">
        <div className="public-section">
          <SectionHeading
            eyebrow="Good to know"
            title="Frequently"
            accent="Asked"
            lead="New to the club? Here’s what most people want to know."
          />
          <Reveal className="faq-list">
            {FAQ.map((item2) => (
              <details className="faq-item glass" key={item2.q}>
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
            <p className="footer-tag">Smash It Together 🏸🇱🇰 — a Sri Lankan badminton community in Riyadh.</p>
            <div className="footer-socials">
              <button className="footer-social" onClick={sayHello} aria-label="Contact us on WhatsApp">📲 WhatsApp</button>
              {INSTAGRAM_URL && <a className="footer-social" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">📸 Instagram</a>}
              <a className="footer-social" href={MAP_SHARE_URL} target="_blank" rel="noopener noreferrer">📍 Map</a>
            </div>
          </div>
          <div className="footer-col">
            <span className="footer-h">Explore</span>
            {NAV.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </div>
          <div className="footer-col">
            <span className="footer-h">Play with us</span>
            <span className="footer-line">🗓 Wed 8–10 PM · Sat 8–10 AM</span>
            <span className="footer-line">📍 Green Badminton Club, Riyadh</span>
            <a href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">🧭 Get directions</a>
            <button className="footer-portal" onClick={handleLogin}>🔑 Members portal →</button>
          </div>
        </div>
        <div className="public-footer-base">
          <span>© {year} Ceylon Badminton Club · Riyadh</span>
          <span className="faint">Made with 🏸 in Riyadh, KSA</span>
        </div>
      </footer>

      <BackToTop />
      {joinOpen && <JoinModal onClose={() => setJoinOpen(false)} />}
    </div>
  )
}
