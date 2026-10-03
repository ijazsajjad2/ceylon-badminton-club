import useDeviceList from '../hooks/useDeviceList.js'

const ITEMS = [
  ['place', 'Confirm your place', 'Wait for the organiser or check your confirmed member booking.'],
  ['shoes', 'Pack your court shoes', 'Bring suitable sports shoes and comfortable clothing.'],
  ['water', 'Bring water and your racket', 'Need to borrow a racket? Check with the club in advance.'],
  ['travel', 'Plan your arrival', 'Open the venue directions and aim to arrive 10 minutes early.'],
]
export default function VisitChecklist() {
  const { items, toggle, reset, storageError } = useDeviceList('cbc.first-visit-checklist')
  const completed = ITEMS.filter(([id]) => items.includes(id)).length
  return <div className="visit-checklist">
    <div className="checklist-intro"><span className="eyebrow">YOUR COURTSIDE CHECKLIST</span><h3>A little prep.<br/>A better first game.</h3><p>Tick things off as you get ready. Your checklist stays on this browser.</p><div className="checklist-progress"><progress value={completed} max={ITEMS.length} aria-label="First visit preparation"/><span role="status">{completed === ITEMS.length ? 'All set. See you on court!' : `${completed} of ${ITEMS.length} ready`}</span></div>{completed > 0 && <button className="text-button" onClick={reset}>Reset checklist</button>}</div>
    <div className="checklist-items">{ITEMS.map(([id, title, detail]) => <label key={id} className={items.includes(id) ? 'is-done' : ''}><input type="checkbox" checked={items.includes(id)} onChange={() => toggle(id)}/><span><b>{title}</b><small>{detail}</small></span></label>)}</div>
    {storageError && <p role="status">Storage is unavailable. Your checklist will reset when you reload.</p>}
  </div>
}
