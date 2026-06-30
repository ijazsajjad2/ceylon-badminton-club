import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import useFocusTrap from '../hooks/useFocusTrap.js'

export default function Modal({ title, onClose, children, footer }) {
  const ref = useRef(null)
  useFocusTrap(ref)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" ref={ref} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-head" style={{ borderTop: '1px solid var(--stroke)', borderBottom: 0 }}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
