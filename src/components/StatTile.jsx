import Reveal from './Reveal.jsx'
import CountUp from './CountUp.jsx'

// Premium club stat: icon, big display value (count-up when numeric), label.
// Pass either `value` (number, animated) or `text` (string, e.g. "Wed & Sat").
export default function StatTile({ icon, value, suffix = '', text, label, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <div className="glass stat-tile">
        <span className="stat-tile-ico" aria-hidden="true">{icon}</span>
        <div className="stat-tile-value display">
          {typeof value === 'number' ? <CountUp value={value} suffix={suffix} /> : text}
        </div>
        <div className="stat-tile-label">{label}</div>
      </div>
    </Reveal>
  )
}
