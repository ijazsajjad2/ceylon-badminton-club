import { useLayoutEffect, useRef } from 'react'

/**
 * Desktop/tablet (>=1024px, motion allowed): pins the strip and translates it
 * horizontally as the page scrolls vertically past it — a classic scrollytelling
 * "photo reel" moment for the trophy cabinet. Below that breakpoint, reduced
 * motion, or if gsap fails to load, this stays exactly the plain responsive
 * grid from global.css (2-3 columns, no JS) — the `.reel-active` class (and
 * the CSS that switches the strip to an overflowing flex row) is only ever
 * added once GSAP has actually wired up the scroll-driven tween, so there's
 * no way for photos to end up clipped/unreachable without the JS to scroll
 * them into view.
 */
export default function MilestonesReel({ items, renderItem }) {
  const wrapRef = useRef(null)
  const trackRef = useRef(null)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const track = trackRef.current
    if (!wrap || !track) return
    let ctx
    let cancelled = false

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      .then(([{ default: gsap }, { ScrollTrigger }]) => {
        if (cancelled) return
        gsap.registerPlugin(ScrollTrigger)
        ctx = gsap.context(() => {
          ScrollTrigger.matchMedia({
            '(min-width: 1024px) and (prefers-reduced-motion: no-preference)': () => {
              // .reel-active must be applied BEFORE measuring: the strip only
              // overflows once the flex/nowrap CSS it gates kicks in — the
              // default grid layout never overflows its container, so
              // measuring first always (wrongly) reads a distance of 0.
              wrap.classList.add('reel-active')
              const distance = track.scrollWidth - wrap.clientWidth
              if (distance <= 0) { wrap.classList.remove('reel-active'); return undefined }
              const tween = gsap.to(track, {
                x: -distance,
                ease: 'none',
                scrollTrigger: {
                  trigger: wrap,
                  start: 'top top',
                  end: () => `+=${distance}`,
                  scrub: 0.6,
                  pin: true,
                  anticipatePin: 1,
                  invalidateOnRefresh: true,
                },
              })
              return () => {
                wrap.classList.remove('reel-active')
                tween.scrollTrigger?.kill()
                tween.kill()
              }
            },
          })
        }, wrapRef)
      })
      .catch(() => { /* gsap failed to load — the plain responsive grid stays in place */ })

    return () => { cancelled = true; ctx?.revert() }
  }, [items])

  return (
    <div className="milestones-pin-wrap" ref={wrapRef}>
      <div className="milestones-strip" ref={trackRef} role="list">
        {items.map(renderItem)}
      </div>
    </div>
  )
}
