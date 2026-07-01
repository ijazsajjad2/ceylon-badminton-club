import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useApp } from '../context/AppContext.jsx'
import Avatar from '../components/Avatar.jsx'
import Reveal from '../components/Reveal.jsx'
import AdvancedGallery from '../components/AdvancedGallery.jsx'
import BrandLockup from '../components/BrandLockup.jsx'
import ScrollProgress from '../components/ScrollProgress.jsx'
import BackToTop from '../components/BackToTop.jsx'
import { ShuttleDeco } from '../components/Shuttle.jsx'
import useScrollSpy from '../hooks/useScrollSpy.js'
import { computeStats, setsWon } from '../lib/stats.js'
import { track } from '../lib/analytics.js'
import { TODAY_SESSION } from '../data/seed.js'
import { fmtFullDate, fmtDate } from '../lib/format.js'
import { HERO_PHOTO } from '../data/gallery.js'
import {
  whatsappJoin, MAP_EMBED_URL, MAP_DIRECTIONS_URL, MAP_SHARE_URL, INSTAGRAM_URL,
} from '../lib/contact.js'

const NAV = [
  ['about', 'About'], ['play', 'How we play'], ['gallery', 'Gallery'],
  ['results', 'Results'], ['members', 'Members'], ['visit', 'Sessions'],
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

  const memberCount = players.length
  const matchesPlayed = matches.length
  const year = new Date().getFullYear()

  const nextSession = useMemo(
    () => sessions.find((s) => s.status === 'upcoming') || TODAY_SESSION,
    [sessions]
  )
  const statById = useMemo(() => {
    const map = {}
    for (const s of computeStats(matches)) map[s.id] = s
    return map
  }, [matches])

  const recentResults = useMemo(
    () => matches.filter((m) => !m.live && m.winner).slice(0, 6).map((m) => buildResult(m, playerById)),
    [matches, playerById]
  )
  // Top players by leaderboard points, for the public "Club Leaders" podium.
  const leaders = useMemo(
    () => computeStats(matches).filter((r) => r.played > 0).slice(0, 3),
    [matches]
  )

  const sayHello = () => { track('WhatsApp join'); whatsappJoin() }

  return (
    <div className="public-site">
      <ScrollProgress />
      {/* ─────────── Public top nav ─────────── */}
      <header className="public-nav">
        <a href="#top" className="brand-link" aria-label="Ceylon Badminton Club — home">
          <BrandLockup size="md" sub="Riyadh Chapter · Smash It Together" />
        </a>
        <nav className="public-links" aria-label="Sections">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''}>{label}</a>
          ))}
        </nav>
        <button className="btn btn-gold btn-sm public-login" onClick={openLogin}>🔑 Member Login</button>
      </header>

      {/* ─────────── Hero ─────────── */}
      <section className="public-hero" id="top">
        <div className="public-hero-bg" style={{ backgroundImage: `url(${HERO_PHOTO})` }} />
        <ShuttleDeco size={150} className="shuttle-float" style={{ top: 90, right: 60 }} />
        <ShuttleDeco size={90} className="shuttle-float" style={{ top: 220, right: 220, animationDelay: '1.4s' }} />
        <div className="public-hero-inner">
          <span className="eyebrow">Private Sri Lankan Club · Riyadh, KSA</span>
          <h1 className="public-hero-title">
            <span className="l1">Ceylon</span>
            <span className="l2">Badminton Club</span>
          </h1>
          <p className="public-hero-sub">
            A Sri Lankan badminton community in Riyadh. We meet twice a week, shuffle fresh random
            doubles every session, and play for the love of the game. Show up, get matched —
            <b> smash it together.</b>
          </p>
          <div className="public-hero-cta">
            <button className="btn btn-wa" onClick={sayHello}>📲 Come play with us</button>
            <button className="btn btn-ghost" onClick={openLogin}>🔑 Member Login</button>
          </div>
          <div className="public-hero-stats">
            <div className="phs-item"><b>{memberCount}</b><span>Members</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>2×</b><span>Per week</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>2024</b><span>Established</span></div>
            <span className="phs-div" />
            <div className="phs-item"><b>{matchesPlayed}+</b><span>Matches</span></div>
          </div>
        </div>
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
              tight community that plays, competes and celebrates together every week.
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
          </Reveal>
          <Reveal delay={0.1} className="glass card-pad facts-card">
            <span className="eyebrow">Quick facts</span>
            <div className="fact-row"><span className="fact-k">📅 Established</span><span className="fact-v">2024</span></div>
            <div className="fact-row"><span className="fact-k">📍 Venue</span><span className="fact-v">Green Badminton Club</span></div>
            <div className="fact-row"><span className="fact-k">🗓 Plays</span><span className="fact-v">Wed &amp; Sat</span></div>
            <div className="fact-row"><span className="fact-k">🕓 Hours</span><span className="fact-v">8–10 PM / 8–10 AM</span></div>
            <div className="fact-row"><span className="fact-k">👥 Members</span><span className="fact-v">{memberCount}</span></div>
            <div className="fact-row"><span className="fact-k">🏸 Format</span><span className="fact-v">Random doubles</span></div>
            <button className="btn btn-wa" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={sayHello}>📲 Ask to join</button>
          </Reveal>
        </div>
      </section>

      {/* ─────────── How we play ─────────── */}
      <section id="play" className="band tint">
        <div className="public-section">
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
        </div>
      </section>

      {/* ─────────── Gallery ─────────── */}
      <section id="gallery" className="band">
        <div className="public-section">
          <Reveal className="public-head center">
            <span className="eyebrow">In action</span>
            <h2 className="display public-h2">Life at the <span className="accent">Club</span> 🏸</h2>
            <p className="public-lead">Real moments from our sessions, tournaments and trophy nights — tap any photo to view full screen.</p>
          </Reveal>
          <Reveal><AdvancedGallery /></Reveal>
        </div>
      </section>

      {/* ─────────── Recent results ─────────── */}
      <section id="results" className="band tint">
        <div className="public-section">
          <Reveal className="public-head center">
            <span className="eyebrow">On the scoreboard</span>
            <h2 className="display public-h2">Recent <span className="accent">Results</span></h2>
            <p className="public-lead">The latest scores straight from the courts.</p>
          </Reveal>
          <Reveal className="results-list">
            {recentResults.map((r) => (
              <div className="result-row glass" key={r.id}>
                <span className={`badge ${r.type === 'doubles' ? 'badge-doubles' : 'badge-singles'}`}>{r.type === 'doubles' ? 'Doubles' : 'Singles'}</span>
                <span className="result-text"><b className="gold">{r.win}</b> beat {r.lose}</span>
                <span className="result-score mono">{r.score}</span>
                <span className="result-meta faint">{r.sets} · {fmtDate(r.date)}</span>
              </div>
            ))}
            {recentResults.length === 0 && <div className="glass card-pad dim center">Scores will appear here after the next session.</div>}
          </Reveal>
        </div>
      </section>

      {/* ─────────── Club leaders (top players) ─────────── */}
      {leaders.length > 0 && (
        <section id="leaders" className="band">
          <div className="public-section">
            <Reveal className="public-head center">
              <span className="eyebrow">On the leaderboard</span>
              <h2 className="display public-h2">Club <span className="accent">Leaders</span> 🏆</h2>
              <p className="public-lead">Our top players by points — every win, partner and point is tracked across the season.</p>
            </Reveal>
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

      {/* ─────────── Our members ─────────── */}
      <section id="members" className="band">
        <div className="public-section">
          <Reveal className="public-head center">
            <span className="eyebrow">The squad</span>
            <h2 className="display public-h2">Our <span className="accent">Members</span> 👥</h2>
            <p className="public-lead">{memberCount} players make up the club — partners rotate every session, so everyone plays with everyone.</p>
          </Reveal>
          <div className="members-roster">
            {players.map((p) => {
              const s = statById[p.id]
              return (
                <div className="member-chip" key={p.id}>
                  <Avatar player={p} size={40} />
                  <div className="member-chip-text">
                    <span className="member-chip-name">{p.name}</span>
                    <span className="member-chip-stat">{s ? `${s.played} games · ${s.winPct}% win` : 'New member'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─────────── Sessions / visit + map ─────────── */}
      <section id="visit" className="band tint">
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
      <section id="faq" className="band">
        <div className="public-section">
          <Reveal className="public-head center">
            <span className="eyebrow">Good to know</span>
            <h2 className="display public-h2">Frequently <span className="accent">Asked</span></h2>
            <p className="public-lead">New to the club? Here’s what most people want to know.</p>
          </Reveal>
          <Reveal className="faq-list">
            {FAQ.map((item) => (
              <details className="faq-item glass" key={item.q}>
                <summary>{item.q}<span className="faq-plus">+</span></summary>
                <p>{item.a}</p>
              </details>
            ))}
          </Reveal>
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
            this week. Your first session is on us.
          </p>
          <div className="row wrap center" style={{ gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-wa btn-lg" onClick={sayHello}>📲 Say hello on WhatsApp</button>
          </div>
        </Reveal>
      </section>

      {/* ─────────── Footer ─────────── */}
      <footer className="public-footer">
        <div className="public-footer-grid">
          <div className="footer-brand">
            <BrandLockup size="sm" sub="Riyadh Chapter · Est. 2024" />
            <p className="footer-tag">Smash It Together 🏸🇱🇰 — a Sri Lankan badminton community in Riyadh.</p>
            <div className="footer-socials">
              <button className="footer-social" onClick={sayHello} aria-label="WhatsApp">📲 WhatsApp</button>
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
            <button className="footer-portal" onClick={openLogin}>🔑 Members portal →</button>
          </div>
        </div>
        <div className="public-footer-base">
          <span>© {year} Ceylon Badminton Club · Riyadh</span>
          <span className="faint">Made with 🏸 in Riyadh, KSA</span>
        </div>
      </footer>

      <BackToTop />
    </div>
  )
}
