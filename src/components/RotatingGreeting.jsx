import { useEffect, useState } from 'react'

// Cycles Sinhala / Tamil / English greetings — a small Sri Lankan identity
// touch in the hero. Glyphs render via the OS's Sinhala/Tamil system fonts
// (present on Android, iOS, Windows and macOS).
const GREETINGS = ['ආයුබෝවන්', 'வணக்கம்', 'Welcome']

export default function RotatingGreeting({ interval = 2600 }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % GREETINGS.length), interval)
    return () => clearInterval(t)
  }, [interval])
  return (
    <span className="greet-rotate" key={i} aria-hidden="true">
      {GREETINGS[i]}
    </span>
  )
}
