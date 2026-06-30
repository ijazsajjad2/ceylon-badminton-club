// Fade + lift content in on mount via a pure-CSS animation. Unlike a
// scroll/JS-observer reveal, this always completes — content can never get
// stuck invisible. Respects reduced motion; `delay` (seconds) staggers groups.
export default function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  return (
    <Tag
      className={`reveal-in ${className}`.trim()}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </Tag>
  )
}
