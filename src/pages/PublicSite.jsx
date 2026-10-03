import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PublicNav from '../components/PublicNav.jsx';
import BrandLockup from '../components/BrandLockup.jsx';
import JoinModal from '../components/JoinModal.jsx';
import SessionBrowser from '../components/SessionBrowser.jsx';
import SessionCountdown from '../components/SessionCountdown.jsx';
import useScrollSpy from '../hooks/useScrollSpy.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { FEATURED, HERO_PHOTO, HERO_WEBP } from '../data/gallery.js';
import { TESTIMONIALS } from '../data/testimonials.js';
import { downloadSession } from '../lib/sessions.js';
import { MAP_DIRECTIONS_URL, MAP_SHARE_URL, SESSION_FEE } from '../lib/contact.js';
import { track } from '../lib/analytics.js';
const Gallery = lazy(() => import('../components/AdvancedGallery.jsx'));
const NAV = [['sessions', 'Sessions'], ['first-visit', 'First visit'], ['gallery', 'Gallery'], ['visit', 'Find us'], ['faq', 'FAQ']];
const NAV_IDS = NAV.map(([id]) => id);
export default function PublicSite() {
    const { t } = useTranslation();
    const { openLogin } = useAuth();
    const { sessions, players } = useApp();
    const active = useScrollSpy(NAV_IDS);
    const [joinOpen, setJoinOpen] = useState(false);
    const [joinSession, setJoinSession] = useState(null);
    const formatDate = date => new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Riyadh' }).format(new Date(`${date}T12:00:00+03:00`));
    const [fullGallery, setFullGallery] = useState(false);
    const next = sessions.find((s) => s.status === 'live' || s.status === 'upcoming');
    const openJoin = (session) => { setJoinSession(session?.date ? session : null); track('Join opened'); setJoinOpen(true); };
    return (<div className="public-site club-refresh">
      <a className="skip-link" href="#main-content">{"Skip to content"}</a>
      <PublicNav nav={NAV} active={active} onLogin={openLogin}/>
      <main id="main-content">
        <section className="club-hero" id="top" aria-labelledby="club-title">
          <picture className="club-hero-photo"><source srcSet={HERO_WEBP} type="image/webp"/><img src={HERO_PHOTO} alt="Ceylon Badminton Club players enjoying doubles on court" fetchpriority="high" width="1600" height="739"/></picture>
          <div className="club-hero-shade"/>
          <div className="club-hero-content">
            <div className="club-intro">
              <p className="eyebrow">{"RIYADH, SAUDI ARABIA"}<span className="accent-dot">●</span>{"EST. 2024"}</p>
              <h1 id="club-title">{"CEYLON"}<br /><span>{"BADMINTON CLUB"}</span></h1>
              <p className="club-manifesto">{"Good games."}<br />{"Even better company."}</p>
              <p className="club-intro-copy">{"A Sri Lankan community in Riyadh, open to everyone. Find your people on court, two sessions a week."}</p>
              <div className="mobile-next-summary">{next && <a href="#next-game">{'Next game'} · {formatDate(next.date)}<br /><b><bdi dir="ltr">{next.time}</bdi> · {"Riyadh time"}</b> ↓</a>}</div>
              <div className="club-actions"><button className="btn btn-gold btn-lg" onClick={openJoin}>{"Join the club"}<span aria-hidden="true">↗</span></button><a className="btn btn-ghost" href="#first-visit">{"Your first session"}</a></div>
              <div className="club-proof"><span>{players.length} {'club members'}</span><span>{"All levels welcome"}</span><span>{"Random doubles"}</span></div>
            </div>
            {next && <aside id="next-game" className="next-play-card" aria-label="Next session">
              <div className="next-play-top"><span className="eyebrow">{next.status === 'live' ? "ON COURT NOW" : "YOUR NEXT GAME"}</span><span className="session-dot" aria-hidden="true"/></div>
              <h2>{next.day === 'Wed' ? "Wednesday" : "Saturday"}<br /><span>{next.day === 'Wed' ? "night doubles." : "morning doubles."}</span></h2>
              <p className="next-play-date">{formatDate(next.date)}</p>
              <dl className="session-facts">
                <div><dt>{"Time"}</dt><dd><bdi dir="ltr">{next.time}</bdi> <small>{"Riyadh time"}</small></dd></div>
                <div><dt>{"Where"}</dt><dd>{next.venue}</dd></div>
                <div><dt>{"Session fee"}</dt><dd>{next.fee_cents != null ? new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(next.fee_cents / 100) : SESSION_FEE || "Ask the club for the current rate"}</dd></div>
                <div><dt>{"Your place"}</dt><dd>{"Confirm with the club before arriving"}</dd></div>
              </dl>
              {next.status !== 'live' && <SessionCountdown dateIso={next.date} time={next.time.split('–')[0]}/>}
              <button className="btn btn-gold next-play-join" onClick={() => openJoin(next)}>{"Ask to join this session ↗"}</button>
              <div className="next-play-links"><a href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">{"Get directions ↗"}</a><button onClick={() => downloadSession(next)}>{"Add to calendar +"}</button></div>
            </aside>}
          </div>
        </section>
        <section id="sessions" className="club-section">
          <div className="club-section-heading"><div><p className="eyebrow">{"MAKE IT A WEEKLY THING"}</p><h2>{"Two sessions."}<br /><span>{"One good routine."}</span></h2></div><p>{"Random partners, friendly rallies, and room to improve. All times are local to Riyadh."}</p></div>
          <SessionBrowser sessions={sessions} onJoin={openJoin}/>
        </section>
        <section id="first-visit" className="club-section first-visit-section">
          <div className="club-section-heading"><div><p className="eyebrow">{"NEW HERE? YOU BELONG."}</p><h2>{"Your first session,"}<br /><span>{"made simple."}</span></h2></div><p>{"You don’t need a partner or tournament experience. Come for a game and get to know the club."}</p></div>
          <div className="first-visit-grid">
            <article><span className="step-number">01</span><h3>{"Say hello"}</h3><p>{"Tell us your name, playing level, and preferred day. The club will confirm your place and the current fee."}</p></article>
            <article><span className="step-number">02</span><h3>{"Pack the basics"}</h3><p>{"Bring sports shoes, water, and your racket if you have one. Ask about borrowing equipment when you get in touch."}</p></article>
            <article><span className="step-number">03</span><h3>{"Meet us on court"}</h3><p>{"Aim to arrive 10 minutes early to meet the group and warm up. We mix doubles partners so you can join in."}</p></article>
          </div>
          <div className="first-visit-note"><span>{"Beginners and experienced players are welcome. Bring a friend, too."}</span><button className="text-button" onClick={openJoin}>{"Let’s play ↗"}</button></div>
        </section>
        <section id="gallery" className="club-section">
          <div className="club-section-heading"><div><p className="eyebrow">{"THE PEOPLE. THE RALLIES. THE MEMORIES."}</p><h2>{"This is"} <span>{"our club."}</span></h2></div><p>{"From weeknight doubles to tournament days. Real moments from the Ceylon Badminton Club community."}</p></div>
          {fullGallery ? <Suspense fallback={<p role="status">{"Loading club photos…"}</p>}><Gallery /></Suspense> : <div className="club-photo-grid">{FEATURED.slice(0, 4).map((photo) => <figure key={photo.src}><img src={photo.src} alt={photo.caption} width={photo.width} height={photo.height} loading="lazy" decoding="async"/><figcaption>{photo.caption}</figcaption></figure>)}</div>}
          <button className="btn btn-ghost gallery-expand" onClick={() => setFullGallery((value) => !value)} aria-expanded={fullGallery}>{fullGallery ? "Show fewer photos" : "Explore all club photos"} ↗</button>
        </section>
        {TESTIMONIALS.length > 0 && <section className="club-section club-voices" aria-label="Member stories"><p className="eyebrow">{"FROM THE PEOPLE WHO PLAY"}</p><div className="voices-grid">{TESTIMONIALS.map((quote) => <blockquote className="glass card-pad voice-card" key={quote.name}><p>“{quote.quote}”</p><footer>{quote.name}{quote.role && ` · ${quote.role}`}</footer></blockquote>)}</div></section>}
        <section id="visit" className="club-section club-visit"><div><p className="eyebrow">{"SEE YOU ON COURT"}</p><h2>{"Green Badminton Club."}<br /><span>{"Riyadh."}</span></h2><p>{"Wednesday 8–10 PM · Saturday 8–10 AM"}</p><p className="faint">{"Confirm your place before travelling. Open the club’s map pin for the precise location."}</p><div className="club-actions"><a className="btn btn-gold" href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">{"Get directions ↗"}</a><a className="btn btn-ghost" href={MAP_SHARE_URL} target="_blank" rel="noopener noreferrer">{"View map"}</a></div></div><div className="venue-graphic" aria-hidden="true"><div className="venue-court"><span>CBC</span></div><p>24.6267° N &nbsp; 46.7966° E</p></div></section>
        <section id="faq" className="club-section club-faq"><div><p className="eyebrow">{"BEFORE YOU PICK UP A RACKET"}</p><h2>{"A few"} <span>{"answers."}</span></h2></div><div className="faq-list">{[1, 2, 3, 4, 5].map((n) => <details className="faq-item" key={n}><summary>{t(`faq.q${n}`)}<span className="faq-plus" aria-hidden="true">+</span></summary><p>{n === 3 ? (SESSION_FEE ? `The current session fee is ${SESSION_FEE}. Confirm your place with the club before attending.` : "Contact the club for the current court contribution and first-session arrangements before you come.") : n === 4 ? "Bring sports shoes, water, and a racket if you have one. If you need to borrow equipment, ask the club before your first visit." : t(`faq.a${n}`)}</p></details>)}</div></section>
        <section className="club-section club-final"><p className="eyebrow">{"YOUR NEXT GOOD GAME STARTS HERE"}</p><h2>{"Come for badminton."}<br /><span>{"Stay for the people."}</span></h2><button className="btn btn-gold btn-lg" onClick={openJoin}>{"Join the club ↗"}</button><p>{"Already a member?"}<button className="text-button" onClick={openLogin}>{"Sign in for RSVPs, scores & rankings"}</button></p></section>
      </main>
      <footer className="club-footer"><BrandLockup size="sm" sub="Riyadh · Est. 2024"/><span>© {new Date().getFullYear()} Ceylon Badminton Club</span><a href="#top">{"Back to top ↑"}</a></footer>
      <div className="mobile-join-bar"><a href={MAP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer">{"Directions ↗"}</a><button className="btn btn-gold" onClick={openJoin}>{"Join a session ↗"}</button></div>
      {joinOpen && <JoinModal preferredSession={joinSession} onClose={() => setJoinOpen(false)}/>}
    </div>);
}
