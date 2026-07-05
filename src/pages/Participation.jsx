import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { ShuttleDeco } from '../components/Shuttle.jsx'
import { generateRandomPairs } from '../lib/pairing.js'
import SessionFlyer from '../components/SessionFlyer.jsx'
import { TODAY, TODAY_SESSION } from '../data/seed.js'
import { fmtFullDate, whatsappShare } from '../lib/format.js'
import { firePuffConfetti } from '../lib/confetti.ts'
import { playPop } from '../lib/sfx.js'

const TARGET = 20

export default function Participation({ navigate }) {
  const { players, playerById, going, goingIds, lastSessionPairs, rsvp, sharedRoster, pushToast } = useApp()
  const { user, openLogin, isScorekeeper } = useAuth()
  const [result, setResult] = useState(null)
  const [revealKey, setRevealKey] = useState(0)

  // Each member RSVPs only for themselves. The organizer (admin, who has no
  // player profile) can still manage everyone's attendance.
  const myId = user?.playerId || null
  const isAdmin = !!user && !myId
  const imGoing = !!(myId && going[myId])
  const canToggle = (pid) => isAdmin || myId === pid

  // Members-only: changing the RSVP roster / recording scores requires sign-in.
  const requireAuth = (fn, msg) => {
    if (user) return fn()
    pushToast(msg || 'Sign in as a member to do that 🔒', 'info')
    openLogin()
  }

  const confirmed = goingIds.length
  const pct = Math.min(100, Math.round((confirmed / TARGET) * 100))

  const goingPlayers = useMemo(() => goingIds.map((id) => playerById[id]).filter(Boolean), [goingIds, playerById])

  const lastDuoKeys = useMemo(() => new Set(lastSessionPairs), [lastSessionPairs])

  const generate = () => {
    if (goingPlayers.length < 2) {
      pushToast('Mark at least 2 players as going first 🎲', 'error')
      return
    }
    const res = generateRandomPairs(goingPlayers, lastDuoKeys)
    setResult(res)
    setRevealKey((k) => k + 1)
    res.warnings.forEach((w) => pushToast(w, w.startsWith('⚠') ? 'error' : 'info'))
    pushToast(`Generated ${res.matches.length} match${res.matches.length !== 1 ? 'es' : ''} from ${goingPlayers.length} players 🔀`, 'success')
  }

  const toggleMe = () => requireAuth(() => {
    if (!myId) { pushToast('Your account has no player profile — ask the admin to link it.', 'info'); return }
    rsvp(myId, !imGoing)
    pushToast(!imGoing ? "You're in! See you on court 🏸" : 'Removed your RSVP', !imGoing ? 'success' : 'info')
    if (!imGoing) { firePuffConfetti(); playPop() } // only celebrate opting IN, not backing out
  }, 'Sign in as a member to RSVP 🔒')

  const trackMatch = (m) => requireAuth(() => {
    if (!isScorekeeper) { pushToast('Only Ijaz (the club scorekeeper) can record match scores. 🏸', 'info'); return }
    navigate('matches', {
      prefillMatch: {
        type: 'doubles',
        date: TODAY,
        players: { a1: m.teamA[0].id, a2: m.teamA[1].id, b1: m.teamB[0].id, b2: m.teamB[1].id },
      },
    })
  }, 'Sign in as a member to record a score 🔒')

  const shareWhatsApp = () => {
    let text = `🏸 *Ceylon Badminton Club — Riyadh*\n${fmtFullDate(TODAY_SESSION.date)}\n📍 ${TODAY_SESSION.venue} · ${TODAY_SESSION.time}\n✅ ${confirmed} confirmed\n`
    if (result) {
      text += `\n🔀 *Today's Random Pairs:*\n`
      result.matches.forEach((m, i) => {
        text += `Court match ${i + 1}: ${m.teamA.map((p) => p.name).join(' & ')}  🆚  ${m.teamB.map((p) => p.name).join(' & ')}\n`
      })
      if (result.trio) text += `3-player rotation: ${result.trio.map((p) => p.name).join(', ')}\n`
      if (result.sitOut) text += `Sitting out this round: ${result.sitOut.name}\n`
    }
    text += `\nSmash It Together 🏸🇱🇰`
    whatsappShare(text)
  }

  return (
    <div className="page-wrap">
      <h1 className="section-title" style={{ fontSize: 34, marginTop: 6 }}>Practice Sessions <span className="accent">🎲</span></h1>
      <p className="section-sub">Our <b style={{ color: 'var(--gold-bright)' }}>practice sessions</b> run twice a week — Wednesday nights (8–10 PM) &amp; Saturday mornings (8–10 AM) at Green Badminton Club. Everyone marks <b>themselves</b> as coming, then the app arranges <b>random teammates</b> — nobody has a fixed partner.</p>

      {/* Session hero card */}
      <div className="glass card-pad" style={{ position: 'relative', overflow: 'hidden' }}>
        <ShuttleDeco size={150} className="shuttle-float" style={{ top: -10, right: 10 }} />
        <div className="row spread wrap" style={{ position: 'relative' }}>
          <div>
            <span className="eyebrow">Next Session · Wed &amp; Sat each week</span>
            <div className="display" style={{ fontSize: 30, marginTop: 4 }}>{TODAY_SESSION.venue}</div>
            <div className="row wrap" style={{ marginTop: 10, gap: 10 }}>
              <span className="hero-pill">🗓 {fmtFullDate(TODAY_SESSION.date)}</span>
              <span className="hero-pill">🕓 {TODAY_SESSION.time}</span>
              <span className="hero-pill">🏟 {TODAY_SESSION.courts} Courts</span>
            </div>
            <div className="row wrap" style={{ marginTop: 12, gap: 10 }}>
              <SessionFlyer session={TODAY_SESSION} pushToast={pushToast} />
            </div>
          </div>
        </div>

        {/* Count me in — RSVP for yourself only */}
        {!isAdmin && (
          <>
            <button className={`cmi-btn ${imGoing ? 'in' : ''}`} style={{ marginTop: 18 }} onClick={toggleMe}>
              {imGoing ? "✓ I'M IN — SEE YOU THERE" : 'COUNT ME IN 🏸'}
            </button>
            {imGoing && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={toggleMe}>I'm out / undo</button>
            )}
          </>
        )}
        {isAdmin && (
          <p className="dim" style={{ marginTop: 16, fontSize: 13 }}>👑 Admin — you can mark anyone below. Members can only RSVP for themselves.</p>
        )}

        {/* Attendance progress */}
        <div style={{ marginTop: 18 }}>
          <div className="row spread" style={{ marginBottom: 7 }}>
            <span style={{ fontWeight: 700 }}>{confirmed} / {TARGET} confirmed</span>
            <span className="faint">{pct}%</span>
          </div>
          <div className="progress"><div className="progress-fill" style={{ width: pct + '%' }} /></div>
        </div>
      </div>

      {/* Player grid — everyone can see who's in; you can only toggle yourself */}
      <h2 className="section-title">Who's <span className="accent">Going?</span></h2>
      <p className="section-sub">
        {isAdmin
          ? 'As admin you can toggle anyone. Only “going” players get arranged into teams.'
          : 'Mark yourself with “Count me in” above. You can only RSVP for yourself — others mark themselves.'}
        {sharedRoster && <span style={{ color: 'var(--gold-bright)', fontWeight: 700 }}> · 🟢 Live across everyone’s devices</span>}
      </p>
      <div className="pgrid">
        {players.map((p) => {
          const isGoing = !!going[p.id]
          const isMe = myId === p.id
          const editable = canToggle(p.id)
          const onClick = () => {
            if (!user) return requireAuth(() => {}, 'Sign in to RSVP 🔒')
            if (editable) rsvp(p.id, !isGoing)
            else pushToast('You can only mark yourself — use “Count me in”. 🏸', 'info')
          }
          return (
            <button key={p.id} className={`pgrid-item ${isGoing ? 'going' : ''} ${isMe ? 'is-me' : ''} ${!editable && user ? 'locked' : ''}`}
              onClick={onClick}
              aria-pressed={isGoing}
              title={editable ? '' : `${p.name} marks their own attendance`}>
              <Avatar player={p} size={34} />
              <div style={{ lineHeight: 1.15, minWidth: 0 }}>
                <div className="pgrid-name">{p.name}{isMe && <span className="me-tag">me</span>}</div>
                <div className="faint" style={{ fontSize: 11 }}>{p.level}</div>
              </div>
              <span className="pgrid-status">{isGoing ? '✅' : '⚪'}</span>
            </button>
          )
        })}
      </div>

      {/* Generate pairs */}
      <div className="glass card-pad" style={{ marginTop: 22, position: 'relative', overflow: 'hidden' }}>
        <ShuttleDeco size={120} style={{ bottom: -10, left: 20 }} />
        <div className="row spread wrap" style={{ position: 'relative', gap: 12 }}>
          <div>
            <h2 className="display" style={{ fontSize: 26, margin: 0 }}>🎲 Arrange Random Teams</h2>
            <p className="dim" style={{ fontSize: 13, margin: '4px 0 0' }}>
              Practice session · {goingPlayers.length} players going · random teammates · avoids last session's duos
            </p>
          </div>
          <div className="row wrap">
            <button className="btn btn-gold" onClick={generate}>🎲 Arrange Teams</button>
            {result && <button className="btn btn-maroon" onClick={generate}>🔀 Reshuffle</button>}
            {result && <button className="btn btn-wa" onClick={shareWhatsApp}>📲 Share to WhatsApp</button>}
          </div>
        </div>

        {result && (
          <div key={revealKey} style={{ marginTop: 18 }}>
            <div className="pairs-grid">
              {result.matches.map((m, i) => (
                <div className="glass pair-match flip-card" key={i} style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flip-inner" style={{ animationDelay: `${i * 0.12}s` }}>
                    <div className="match-label">⚔️ Court Match {i + 1}</div>
                    <div className="pair-vs">
                      <div className="pair-team">
                        {m.teamA.map((p) => (
                          <span className="pair-player" key={p.id}><Avatar player={p} size={32} />{p.name}</span>
                        ))}
                      </div>
                      <div className="vs-badge display" style={{ fontSize: 18, color: '#ff8a8a' }}>VS</div>
                      <div className="pair-team" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                        {m.teamB.map((p) => (
                          <span className="pair-player" key={p.id} style={{ flexDirection: 'row-reverse' }}><Avatar player={p} size={32} />{p.name}</span>
                        ))}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-ghost" style={{ width: '100%', marginTop: 12 }} onClick={() => trackMatch(m)}>
                      ＋ Track this match's score →
                    </button>
                  </div>
                </div>
              ))}

              {result.trio && (
                <div className="glass pair-match flip-card" style={{ background: 'rgba(226,59,59,0.06)' }}>
                  <div className="flip-inner" style={{ animationDelay: `${result.matches.length * 0.12}s` }}>
                    <div className="match-label">🔁 3-Player Rotation (2v1)</div>
                    {result.trio.map((p) => (
                      <span className="pair-player" key={p.id} style={{ marginBottom: 6 }}><Avatar player={p} size={32} />{p.name}</span>
                    ))}
                    <p className="faint" style={{ fontSize: 11.5, margin: '6px 0 0' }}>Odd group — these three rotate fairly.</p>
                  </div>
                </div>
              )}

              {result.leftoverPair && !result.trio && (
                <div className="glass pair-match" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="match-label">⏳ Waiting for opponents</div>
                  {result.leftoverPair.map((p) => (
                    <span className="pair-player" key={p.id} style={{ marginBottom: 6 }}><Avatar player={p} size={32} />{p.name}</span>
                  ))}
                  <p className="faint" style={{ fontSize: 11.5 }}>This pair plays the winner of another court.</p>
                </div>
              )}

              {result.sitOut && (
                <div className="glass pair-match" style={{ background: 'rgba(31,95,214,0.08)' }}>
                  <div className="match-label">🪑 Sitting Out This Round</div>
                  <span className="pair-player"><Avatar player={result.sitOut} size={32} />{result.sitOut.name}</span>
                  <p className="faint" style={{ fontSize: 11.5, marginTop: 6 }}>Rotates in next round — fair sit-out.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!result && (
          <p className="dim center" style={{ marginTop: 18, fontSize: 13 }}>
            No pairs yet — hit <b className="gold">Generate Pairs</b> to shuffle the squad. 🏸
          </p>
        )}
      </div>
    </div>
  )
}
