import { useEffect, useState } from 'react'

// Returns the id of the section currently in view, for nav highlighting.
export default function useScrollSpy(ids, offset = 96) {
  const [active, setActive] = useState(ids[0] || '')

  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!els.length) return
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: `-${offset}px 0px -55% 0px`, threshold: [0.05, 0.25, 0.5] }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [ids.join(','), offset])

  return active
}
