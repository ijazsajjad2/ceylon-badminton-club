import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import BrandLockup from './BrandLockup.jsx'
import NavIcon from './Icons.jsx'

// Public site navbar: transparent over the hero, glass once scrolled; desktop
// links with animated underline + active section; animated hamburger + smooth
// slide-down panel on mobile.
export default function PublicNav({ nav, active, onLogin }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile panel when a link is chosen or the viewport grows.
  useEffect(() => {
    if (!open) return
    const onResize = () => window.innerWidth > 680 && setOpen(false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open])

  return (
    <header className={`public-nav ${scrolled ? 'is-scrolled' : 'is-top'}`}>
      <a href="#top" className="brand-link" aria-label="Ceylon Badminton Club — home">
        <BrandLockup size="md" sub="Riyadh · Smash It Together" />
      </a>

      <nav className="public-links" aria-label="Sections">
        {nav.map(([id, label]) => (
          <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'true' : undefined}>
            {label}
          </a>
        ))}
      </nav>

      <button className="btn btn-gold btn-sm public-login" onClick={onLogin}><NavIcon name="key" size={14} /> Member Login</button>

      <button
        className={`nav-burger ${open ? 'open' : ''}`}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      <AnimatePresence>
        {open && (
          <motion.nav
            className="mobile-menu"
            aria-label="Sections"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            {nav.map(([id, label], i) => (
              <motion.a
                key={id}
                href={`#${id}`}
                className={active === id ? 'is-active' : ''}
                onClick={() => setOpen(false)}
                initial={reduce ? {} : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.045, duration: 0.25 }}
              >
                {label}
              </motion.a>
            ))}
            <button className="btn btn-gold mobile-menu-login" onClick={() => { setOpen(false); onLogin() }}>
              <NavIcon name="key" size={15} /> Member Login
            </button>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
