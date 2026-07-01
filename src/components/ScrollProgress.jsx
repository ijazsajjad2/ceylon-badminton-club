import { motion, useScroll, useSpring } from 'framer-motion'

// Thin gold progress bar pinned to the very top of the page that fills as the
// visitor scrolls. Driven by scroll position (not a timed animation), so it
// stays meaningful even under prefers-reduced-motion; the spring just smooths it.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />
}
