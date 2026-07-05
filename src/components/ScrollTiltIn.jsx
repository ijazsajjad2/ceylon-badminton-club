import { useLayoutEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

/**
 * Scroll-scrubbed entrance: the wrapped element tilts up out of a slight 3D
 * dip as the section scrolls into view, tied directly to scroll position
 * (not a fixed-duration animation) — scroll slowly and it unfurls slowly,
 * scroll back up and it retreats. Layered alongside (not replacing) the
 * existing Framer Motion / Reveal fade-ins on the children inside.
 *
 * Content always renders immediately/visibly — gsap + ScrollTrigger are
 * dynamically imported after mount so this below-the-fold effect's ~45KB
 * gzip doesn't sit in the critical initial bundle for a page whose hero is
 * the actual first impression.
 */
export default function ScrollTiltIn({ children, className = '' }) {
  const ref = useRef(null)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    if (reduce) return
    const el = ref.current
    if (!el) return
    let ctx
    let cancelled = false

    Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ default: gsap }, { ScrollTrigger }]) => {
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      ctx = gsap.context(() => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 64, rotateX: -14, transformPerspective: 800, transformOrigin: '50% 100%' },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 42%', scrub: 0.6 },
          }
        )
      }, ref)
    })

    return () => { cancelled = true; ctx?.revert() }
  }, [reduce])

  return (
    <div ref={ref} className={className} style={reduce ? undefined : { willChange: 'transform, opacity' }}>
      {children}
    </div>
  )
}
