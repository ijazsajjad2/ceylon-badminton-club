import Reveal from './Reveal.jsx'

/**
 * Standard public-section heading: eyebrow, display title, lead — revealed
 * on scroll. `accent` wraps part of the title in the gold accent span.
 * @param {{ eyebrow?: string | null, title: string, accent?: string | null, lead?: string | null, center?: boolean }} props
 */
export default function SectionHeading({ eyebrow = null, title, accent = null, lead = null, center = true }) {
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
