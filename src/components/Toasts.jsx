import { useApp } from '../context/AppContext.jsx'

const ICONS = { success: '✓', info: '🏸', error: '⚠' }

export default function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismissToast(t.id)}>
          <span className="ti">{ICONS[t.kind] || '🏸'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
