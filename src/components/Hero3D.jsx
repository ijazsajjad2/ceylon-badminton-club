import { Suspense, lazy, useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { hasWebGL } from '../lib/webgl.ts'

// The R3F/three.js scene is a genuinely heavy chunk (~150KB gzip) — only
// import it when it'll actually render: desktop/tablet width, WebGL support,
// and motion allowed. Phones and reduced-motion visitors never fetch it.
const Hero3DScene = lazy(() => import('./Hero3DScene.jsx'))

export default function Hero3D() {
  const reduceMotion = useReducedMotion()
  const [eligible, setEligible] = useState(false)

  useEffect(() => {
    if (reduceMotion) return
    const mq = window.matchMedia('(min-width: 900px)')
    const check = () => setEligible(mq.matches && hasWebGL())
    check()
    mq.addEventListener('change', check)
    return () => mq.removeEventListener('change', check)
  }, [reduceMotion])

  if (!eligible) return null
  return (
    <div className="hero-3d-stage" aria-hidden="true">
      <Suspense fallback={null}>
        <Hero3DScene reduceMotion={!!reduceMotion} />
      </Suspense>
    </div>
  )
}
