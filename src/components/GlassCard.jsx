// Thin wrapper for the premium glass panel look. Keeps markup consistent and
// gives one place to evolve the treatment.
export default function GlassCard({ children, className = '', pad = true, ...rest }) {
  return (
    <div className={`glass ${pad ? 'card-pad' : ''} ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}
