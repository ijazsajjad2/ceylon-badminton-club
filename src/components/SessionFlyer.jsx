import { useState } from 'react'
import { fmtFullDate } from '../lib/format.js'

// Generates a branded "next session" flyer as a PNG (1080×1350, WhatsApp-
// friendly) fully client-side on a canvas, then shares it via the Web Share
// API where available (mobile) or downloads it. No servers, no dependencies.

const W = 1080
const H = 1350

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

async function drawFlyer(session) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Navy backdrop with a soft red/blue wash (matches the site).
  ctx.fillStyle = '#0a1020'
  ctx.fillRect(0, 0, W, H)
  let g = ctx.createRadialGradient(W * 0.15, 0, 80, W * 0.15, 0, 900)
  g.addColorStop(0, 'rgba(226,59,59,0.22)'); g.addColorStop(1, 'transparent')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  g = ctx.createRadialGradient(W, H, 80, W, H, 1100)
  g.addColorStop(0, 'rgba(31,95,214,0.25)'); g.addColorStop(1, 'transparent')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)

  // Court lines, faint.
  ctx.strokeStyle = 'rgba(255,255,255,0.09)'
  ctx.lineWidth = 3
  ctx.strokeRect(70, 190, W - 140, H - 420)
  ctx.beginPath(); ctx.moveTo(70, H / 2 - 15); ctx.lineTo(W - 70, H / 2 - 15); ctx.stroke()
  ctx.setLineDash([10, 14])
  ctx.beginPath(); ctx.moveTo(W / 2, 190); ctx.lineTo(W / 2, H - 230); ctx.stroke()
  ctx.setLineDash([])

  // Crest.
  const crest = await loadImage('/logo.png')
  if (crest) {
    const cw = 240
    const ch = cw * (crest.height / crest.width)
    ctx.drawImage(crest, (W - cw) / 2, 90, cw, ch)
  }

  const display = '"Bebas Neue", "Arial Narrow", sans-serif'
  const body = 'Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'

  // Shrinks the font size until the text fits the given width — keeps the
  // layout correct even when the display webfont hasn't loaded yet.
  const fitText = (text, font, startPx, maxWidth) => {
    let px = startPx
    do {
      ctx.font = font(px)
      if (ctx.measureText(text).width <= maxWidth) break
      px -= 3
    } while (px > 24)
    return px
  }

  ctx.fillStyle = '#ffffff'
  fitText('CEYLON BADMINTON CLUB', (px) => `${px}px ${display}`, 86, W - 160)
  ctx.fillText('CEYLON BADMINTON CLUB', W / 2, 470)
  ctx.fillStyle = '#ff6b6b'
  ctx.font = `700 30px ${body}`
  ctx.fillText('RIYADH · SMASH IT TOGETHER', W / 2, 522)

  // Divider shuttle.
  ctx.font = '44px serif'
  ctx.fillText('🏸', W / 2, 610)

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = `800 28px ${body}`
  ctx.fillText('N E X T   S E S S I O N', W / 2, 690)

  ctx.fillStyle = '#ffffff'
  const dateText = fmtFullDate(session.date).toUpperCase()
  fitText(dateText, (px) => `${px}px ${display}`, 110, W - 160)
  ctx.fillText(dateText, W / 2, 800)

  ctx.fillStyle = '#ff6b6b'
  ctx.font = `72px ${display}`
  ctx.fillText(session.time, W / 2, 900)

  ctx.fillStyle = '#d4dce9'
  ctx.font = `600 34px ${body}`
  ctx.fillText(`📍 ${session.venue}, Riyadh`, W / 2, 980)
  ctx.fillText(`🏟 ${session.courts} courts · 🔀 Random doubles`, W / 2, 1036)

  // Footer band.
  const bandW = 800
  ctx.fillStyle = 'rgba(214,40,57,0.95)'
  ctx.beginPath()
  ctx.roundRect((W - bandW) / 2, 1130, bandW, 78, 39)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  const bandText = 'All members welcome — see you on court!'
  fitText(bandText, (px) => `800 ${px}px ${body}`, 32, bandW - 70)
  ctx.fillText(bandText, W / 2, 1180)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export default function SessionFlyer({ session, pushToast }) {
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    if (busy) return
    setBusy(true)
    try {
      const blob = await drawFlyer(session)
      if (!blob) throw new Error('canvas failed')
      const file = new File([blob], 'cbc-next-session.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Ceylon Badminton Club — next session' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cbc-next-session.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        pushToast?.('Flyer downloaded — share it to the WhatsApp group 📲', 'success')
      }
    } catch (e) {
      if (e?.name !== 'AbortError') pushToast?.('Could not create the flyer on this device.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button className="btn btn-maroon" onClick={generate} disabled={busy}>
      {busy ? 'Creating…' : '🖼 Session flyer'}
    </button>
  )
}
