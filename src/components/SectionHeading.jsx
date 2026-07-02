import Reveal from './Reveal.jsx'

// Standard public-section heading: eyebrow, display title, lead — revealed on
// scroll. `accent` wraps part of the title in the gold accent span.
export default function SectionHeading({ eyebrow, title, accent, lead, center = true }) {
  return (
    <Reveal className={`public-head ${center ? 'center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="display public-h2">
        {title} {accent && <span className="accent">{accent}</span>}
      </h2>
      {lead && <p className="public-lead">{lead}</p>}
    </Reveal>
  )
}
