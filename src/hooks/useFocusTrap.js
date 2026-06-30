import { useEffect } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Traps Tab focus inside `containerRef`, restores focus to the previously
// active element on close, and marks the app shell `inert` so background
// content is unreachable by keyboard/AT. Used by Modal and PlayerSheet.
export default function useFocusTrap(containerRef, active = true) {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement
    const shell = document.querySelector('.app-shell')
    if (shell) shell.setAttribute('inert', '')

    // focus first focusable inside the container
    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null)
    const first = focusables()[0]
    if (first) setTimeout(() => first.focus(), 40)

    const onKey = (e) => {
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      if (shell) shell.removeAttribute('inert')
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus()
    }
  }, [containerRef, active])
}
