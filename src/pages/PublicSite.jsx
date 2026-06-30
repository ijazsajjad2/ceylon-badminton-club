import { useEffect, useMemo, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Reveal from '../components/Reveal.jsx'
import CountUp from '../components/CountUp.jsx'
import ScrollProgress from '../components/ScrollProgress.jsx'
import BackToTop from '../components/BackToTop.jsx'
import SessionCountdown from '../components/SessionCountdown.jsx'
import AdvancedGallery from '../components/AdvancedGallery.jsx'
import { ShuttleLogo, ShuttleDeco } from '../components/Shuttle.jsx'
import { TODAY_SESSION } from '../data/seed.js'
import { fmtFullDate, whatsappShare } from '../lib/format.js'
import { HERO_PHOTO } from '../data/gallery.js'

const FEATURES = [
  { icon: '🔀', title: 'Random doubles', text: 'No fixed partners, no permanent teams. Every session we shuffle fresh pairs, so you share a court with someone new each time.' },
  { icon: '🗓', title: 'Twice every week', text: 'We hit the courts every Wednesday night (8–10 PM) and Saturday morning (8–10 AM) at Green Badminton Club, Riyadh.' },
  { icon: '🤝', title: 'Everyone plays', text: 'Beginners to advanced, all welcome. A fair sit-out rotation means nobody is benched for long.' },
  { icon: '🏆', title: 'Friendly stakes', text: 'Every match is tracked on a personal leaderboard — bragging rights, MVPs and highlight reels included.' },
]

export default function PublicSite() {
  const { openLogin } = useAuth()
  const { players, sessions, matches } = useApp()
  const reduce = useReducedMotion()
  const heroRef = useRef(null)

  const memberCount = players.length
  const matchesPlayed = matches.length
  const nextSession = useMemo(
    () => sessions.find((s) => s.status === 'today') || sessions.find((s) => s.status === 'upcoming') || TODAY_SESSION,
    [sessions]
  )
  // Start time for the live countdown — the first half of e.g. "20:00–22:00".
  const nextStart = (nextSession.time || '20:00').split('–')[0].trim()

  const sayHello = () =>
    whatsappShare("🏸 Hi! I'd love to join the Ceylon Badminton Club in Riyadh — when's the next session?")

  // Gentle pointer parallax for the hero: track the cursor's offset from centre
  // as -1..1 and expose it as CSS vars the decorations read. Skipped entirely
  // for reduced-motion and on coarse (touch) pointers.
  useEffect(() => {
    const el = heroRef.current
    if (!el || reduce) return
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const px = ((e.clientX - r.left) / r.width - 0.5) * 2
        const py = ((e.clientY - r.top) / r.height - 0.5) * 2
        el.style.setProperty('--px', px.toFixed(3))
        el.style.setProperty('--py', py.toFixed(3))
      })
    }
    const onLeave = () => {
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [reduce])

  // Staggered hero entrance choreography.
  const heroStagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
  }
  const heroItem = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }

  return (
    <div className="public-site">
      <ScrollProgress />
      {/* ─────────── Public top nav ─────────── */}
      <header className="public-nav">
        <a href="#top" className="brand">
          <span className="brand-logo"><ShuttleLogo size={26} /></span>
          <span className="brand-text">
            <span className="brand-name">Ceylon Badminton Club</span>
            <span className="brand-sub">Riyadh Chapter · <span className="brand-motto">Smash It Together 🏸</span></span>
          </span>
        </a>
        <nav className="public-links" aria-label="Sections">
          <a href="#about">About</a>
          <a href="#play">How we play</a>
          <a href="#gallery">Gallery</a>
          <a href="#members">Members</a>
          <a href="#visit">Sessions</a>
        </nav>
        <button className="btn btn-gold btn-sm public-login" onClick={openLogin}>🔑 Member Login</button>
      </header>

      {/* ─────────── Hero ─────────── */}
      <section className="public-hero" id="top" ref={heroRef}>
        <div className="public-hero-bg" style={{ backgroundImage: `url(${HERO_PHOTO})` }} />
        <div className="shuttle-parallax" style={{ top: 90, right: 60, '--depth': 1 }}>
          <ShuttleDeco size={150} className="shuttle-float" />
        </div>
        <div className="shuttle-parallax" style={{ top: 220, right: 220, '--depth': 1.8 }}>
          <ShuttleDeco size={90} className="shuttle-float" style={{ animationDelay: '1.4s' }} />
        </div>
        <motion.div
          className="public-hero-inner"
          variants={heroStagger}
          initial="hidden"
          animate="show"
        >
          <motion.span className="eyebrow" variants={heroItem}>Private Sri Lankan Club · Riyadh, KSA</motion.span>
          <motion.h1 className="public-hero-title" variants={heroItem}>
            <span className="l1">Ceylon</span>
            <span className="l2">Badminton Club</span>
          </motion.h1>
          <motion.p className="public-hero-sub" variants={heroItem}>
            A Sri Lankan badminton community in Riyadh. We meet twice a week, shuffle fresh random
            doubles every session, and play for the love of the game. Show up, get matched —
            <b> smash it together.</b>
          </motion.p>
          <motion.div className="public-hero-cta" variants={heroItem}>
            <button className="btn btn-gold" onClick={openLogin}>🔑 Member Login</button>
            <a className="btn btn-ghost" href="#play">How we play →</a>
          </motion.div>
          <motion.div className="public-hero-stats" variants={heroItem}>
            <div className="phs-item"><b><CountUp value={memberCount} /></b><span>Members</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>2×</b><span>Per week</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>2024</b><span>Established</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b><CountUp value={matchesPlayed} suffix="+" /></b><span>Matches</span></div>
          </motion.div>
        </motion.div>
        <a href="#about" className="hero-scroll-cue" aria-label="Scroll to learn more">
          <span className="hsc-mouse"><span className="hsc-dot" /></span>
        </a>
      </section>

      {/* ─────────── About ─────────── */}
      <section id="about" className="public-section">
        <Reveal>
          <div className="glass card-pad about-card" style={{ maxWidth: 860, margin: '0 auto' }}>
            <span className="eyebrow">Who we are</span>
            <h2 className="display about-headline">A home for Sri Lankan badminton in Riyadh</h2>
            <p className="about-text">
              Ceylon Badminton Club brings together Sri Lankans across Riyadh who share one thing —
              a love for badminton. What started as a few friends booking a court has grown into a
              tight community that plays, competes and celebrates together every week.
            </p>
            <p className="about-text">
              There are no fixed partners and no permanent teams here. Every session we shuffle fresh
              random pairs, so you always play with — and against — someone new. It keeps the games
              friendly, the rallies sharp, and the whole club close-knit.
            </p>
            <ul className="about-points">
              <li><span className="ap-ico">🗓</span><span><b>Twice a week</b> — Wednesday nights (8–10 PM) &amp; Saturday mornings (8–10 AM)</span></li>
              <li><span className="ap-ico">📍</span><span>Green Badminton Club, Riyadh</span></li>
              <li><span className="ap-ico">🇱🇰</span><span>A proudly Sri Lankan community, all skill levels welcome</span></li>
            </ul>
          </div>
        </Reveal>
      </section>

      {/* ─────────── How we play ─────────── */}
      <section id="play" className="public-section">
        <Reveal className="public-head center">
          <span className="eyebrow">The Ceylon Way</span>
          <h2 className="display public-h2">How We <span className="accent">Play</span></h2>
          <p className="public-lead">Simple, social and fair — the format that keeps everyone coming back.</p>
        </Reveal>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="glass card-pad feature-card">
                <span className="feature-ico">{f.icon}</span>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-text">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────── Gallery (real photos + lightbox) ─────────── */}
      <section id="gallery" className="public-section">
        <Reveal className="public-head center">
          <span className="eyebrow">In action</span>
          <h2 className="display public-h2">Life at the <span className="accent">Club</span> 🏸</h2>
          <p className="public-lead">Real moments from our sessions, tournaments and trophy nights — tap any photo to view full screen.</p>
        </Reveal>
        <Reveal>
          <AdvancedGallery />
        </Reveal>
      </section>

      {/* ─────────── Our members (real photo + full roster) ─────────── */}
      <section id="members" className="public-section">
        <Reveal className="public-head center">
          <span className="eyebrow">The squad</span>
          <h2 className="display public-h2">Our <span className="accent">Members</span> 👥</h2>
          <p className="public-lead">{memberCount} players make up the club — partners rotate every session, so everyone plays with everyone.</p>
        </Reveal>
        <motion.div
          className="members-roster"
          variants={{ show: { transition: { staggerChildren: 0.035 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {players.map((p) => (
            <motion.div
              className="member-chip"
              key={p.id}
              variants={
                reduce
                  ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                  : { hidden: { opacity: 0, y: 14, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }
              }
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Avatar player={p} size={40} />
              <span className="member-chip-name">{p.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─────────── Sessions / visit ─────────── */}
      <section id="visit" className="public-section">
        <div className="visit-grid">
          <div className="glass card-pad visit-card">
            <span className="eyebrow">When &amp; where</span>
            <h2 className="display about-headline">Come play with us</h2>
            <div className="row wrap" style={{ gap: 10, marginTop: 4 }}>
              <span className="hero-pill">🌙 Wed 8–10 PM</span>
              <span className="hero-pill">🌅 Sat 8–10 AM</span>
              <span className="hero-pill">📍 {nextSession.venue}, Riyadh</span>
            </div>
            <div className="next-session">
              <span className="eyebrow">Next session starts in</span>
              <SessionCountdown dateIso={nextSession.date} time={nextStart} />
              <div className="display next-date">{fmtFullDate(nextSession.date)}</div>
              <div className="faint" style={{ fontSize: 13 }}>{nextSession.time} · {nextSession.courts} courts · random doubles</div>
            </div>
            <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
              <button className="btn btn-wa" onClick={sayHello}>📲 Ask to join on WhatsApp</button>
              <button className="btn btn-ghost" onClick={openLogin}>Member login →</button>
            </div>
          </div>

          <div className="glass card-pad members-preview">
            <span className="eyebrow">New here?</span>
            <h3 className="display" style={{ fontSize: 26, margin: '4px 0 8px' }}>Your first game is on us</h3>
            <p className="dim" style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
              Just show up — we’ll lend you a racket, pair you with the regulars and get you on court.
              No commitment and no fees to come try a session.
            </p>
            <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
              <button className="btn btn-wa" onClick={sayHello}>📲 Message us</button>
              <a className="btn btn-ghost" href="#members">Meet the members →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Join CTA ─────────── */}
      <section className="public-cta">
        <Reveal className="glass card-pad public-cta-card">
          <ShuttleDeco size={160} className="shuttle-float" style={{ top: -20, right: 20, opacity: 0.08 }} />
          <span className="eyebrow">Sri Lankan &amp; in Riyadh?</span>
          <h2 className="display public-cta-title">Grab a racket. Join the club.</h2>
          <p className="public-cta-sub">
            New faces are always welcome — beginners included. Message us and we’ll get you on court
            this week. Already a member? Sign in to RSVP, record scores and check the leaderboard.
          </p>
          <div className="row wrap center" style={{ gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-wa" onClick={sayHello}>📲 Say hello on WhatsApp</button>
            <button className="btn btn-gold" onClick={openLogin}>🔑 Member Login</button>
          </div>
        </Reveal>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="public-footer">
        <div className="brand">
          <span className="brand-logo"><ShuttleLogo size={22} /></span>
          <span className="brand-text">
            <span className="brand-name">Ceylon Badminton Club</span>
            <span className="brand-sub">Riyadh Chapter</span>
          </span>
        </div>
        <span className="public-footer-mid">Smash It Together 🏸🇱🇰 · Riyadh, Saudi Arabia</span>
        <button className="public-footer-link" onClick={openLogin}>Members portal →</button>
      </footer>

      <BackToTop />
    </div>
  )
}
