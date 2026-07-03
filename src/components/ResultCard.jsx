// One-tap shareable match-result card: renders the result onto a square
// canvas (WhatsApp-friendly 1080×1080) in club branding and shares it via the
// Web Share API where available (mobile) or downloads it. Same zero-dependency
// pattern as SessionFlyer.
import { useState } from 'react'
import { setsWon } from '../lib/stats.js'
import { fmtDate } from '../lib/format.js'

const W = 1080
const H = 1080

function drawResultCard(match, playerById) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Navy backdrop with a soft red glow, echoing the site
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#101527')
  bg.addColorStop(1, '#0a1020')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 190, 40, W / 2, 190, 560)
  glow.addColorStop(0, 'rgba(226,59,59,0.22)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Court line accents
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 3
  ctx.strokeRect(70, 70, W - 140, H - 140)
  ctx.beginPath(); ctx.moveTo(70, H / 2); ctx.lineTo(W - 70, H / 2); ctx.stroke()

  ctx.textAlign = 'center'
  ctx.fillStyle = '#ff6b6b'
  ctx.font = '700 30px Inter, sans-serif'
  ctx.fillText('CEYLON BADMINTON CLUB · RIYADH', W / 2, 150)

  ctx.fillStyle = '#f2f5fb'
  ctx.font = '400 92px "Bebas Neue", sans-serif'
  ctx.fillText('MATCH RESULT', W / 2, 250)

  const names = (ids) => ids.map((id) => playerById[id]?.name || '?').join(' & ')
  const { a, b } = setsWon(match)
  const winnerIds = match.winner === 'A' ? match.teamA : match.teamB
  const loserIds = match.winner === 'A' ? match.teamB : match.teamA
  const winSets = Math.max(a, b)
  const loseSets = Math.min(a, b)

  // Winner block
  ctx.fillStyle = '#ffd166'
  ctx.font = '400 40px "Bebas Neue", sans-serif'
  ctx.fillText('🏆 WINNERS', W / 2, 380)
  ctx.fillStyle = '#ffffff'
  ctx.font = '400 84px "Bebas Neue", sans-serif'
  ctx.fillText(names(winnerIds).toUpperCase(), W / 2, 470)

  // Big set score
  ctx.fillStyle = '#ff6b6b'
  ctx.font = '400 150px "Bebas Neue", sans-serif'
  ctx.fillText(`${winSets} – ${loseSets}`, W / 2, 640)

  // Loser block
  ctx.fillStyle = '#aab5c8'
  ctx.font = '400 34px "Bebas Neue", sans-serif'
  ctx.fillText('DEFEATED', W / 2, 720)
  ctx.font = '400 60px "Bebas Neue", sans-serif'
  ctx.fillStyle = '#d4dce9'
  ctx.fillText(names(loserIds).toUpperCase(), W / 2, 790)

  // Per-set pills
  const sets = match.sets.map(([sa, sb]) => (match.winner === 'A' ? `${sa}-${sb}` : `${sb}-${sa}`))
  ctx.font = '700 40px "JetBrains Mono", monospace'
  const pillW = 170
  const totalW = sets.length * pillW + (sets.length - 1) * 24
  let px = W / 2 - totalW / 2
  for (const s of sets) {
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.beginPath()
    ctx.roundRect(px, 840, pillW, 76, 18)
    ctx.fill()
    ctx.fillStyle = '#f2f5fb'
    ctx.fillText(s, px + pillW / 2, 892)
    px += pillW + 24
  }

  // Footer meta
  ctx.fillStyle = '#aab5c8'
  ctx.font = '600 28px Inter, sans-serif'
  ctx.fillText(
    `${fmtDate(match.date)}  ·  Court ${match.court}  ·  ${match.type === 'doubles' ? 'Doubles' : 'Singles'}`,
    W / 2, 990
  )

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export default function ResultCardButton({ match, playerById, pushToast }) {
  const [busy, setBusy] = useState(false)

  const share = async (e) => {
    e.stopPropagation()
    setBusy(true)
    try {
      const blob = await drawResultCard(match, playerById)
      const file = new File([blob], 'cbc-match-result.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ceylon Badminton Club — match result' })
      } else {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'cbc-match-result.png'
        a.click()
        URL.revokeObjectURL(a.href)
        pushToast?.('Result card downloaded — share it to the group 📲', 'success')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') pushToast?.('Could not create the result card.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className="btn btn-sm btn-ghost" onClick={share} disabled={busy}>
      {busy ? 'Preparing…' : '📤 Share result card'}
    </button>
  )
}
