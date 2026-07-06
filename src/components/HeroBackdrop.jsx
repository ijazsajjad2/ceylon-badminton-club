import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

// Slow Ken Burns crossfade of real club photos behind the hero. The first
// slide is the preloaded hero JPEG (paints immediately); the rest mount a few
// seconds later so they never compete with the first paint. Reduced motion
// gets the single static photo.
export default function HeroBackdrop({ photos, interval = 9000 }) {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [warm, setWarm] = useState(false) // extra slides mounted (and loading)

  useEffect(() => {
    if (reduce || photos.length < 2) return
    let cancelled = false
    // Give the first paint a head start, then pre-decode the other slides so
    // the first crossfade never lands on a half-loaded image.
    const warmT = setTimeout(() => {
      Promise.allSettled(
        photos.slice(1).map((src) => new Promise((res, rej) => {
          const img = new Image()
          img.onload = res
          img.onerror = rej
          img.src = src
        }))
      ).then(() => { if (!cancelled) setWarm(true) })
    }, 3000)
    return () => { cancelled = true; clearTimeout(warmT) }
  }, [reduce, photos])

  useEffect(() => {
    if (!warm) return
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), interval)
    return () => clearInterval(t)
  }, [warm, photos.length, interval])

  const slides = warm ? photos : photos.slice(0, 1)
  return (
    <div className="hero-backdrop" aria-hidden="true">
      {slides.map((src, i) => (
        <div
          key={src}
          className={`hero-slide ${i === idx ? 'on' : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  )
}
