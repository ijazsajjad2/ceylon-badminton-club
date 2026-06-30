import { motion, useReducedMotion } from 'framer-motion'

// Lightweight scroll-reveal wrapper. Fades + lifts content into view once,
// and becomes a no-op when the user prefers reduced motion.
export default function Reveal({ children, delay = 0, y = 26, className, as = 'div' }) {
  const reduce = useReducedMotion()
  const MotionTag = motion[as] || motion.div

  if (reduce) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
