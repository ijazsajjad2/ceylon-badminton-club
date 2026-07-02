import { useState } from 'react'
import { sfxEnabled, setSfxEnabled, playSmash } from '../lib/sfx.js'

// Small fixed pill that opts the visitor in/out of the smash sound effect.
// Off by default; plays a preview when switched on so the choice is audible.
export default function SoundToggle() {
  const [on, setOn] = useState(sfxEnabled)
  const toggle = () => {
    const next = !on
    setOn(next)
    setSfxEnabled(next)
    if (next) setTimeout(playSmash, 120)
  }
  return (
    <button
      type="button"
      className={`sound-toggle ${on ? 'on' : ''}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn sound effects off' : 'Turn sound effects on'}
      title={on ? 'Sound effects on' : 'Sound effects off'}
    >
      {on ? '🔊' : '🔇'}
    </button>
  )
}
