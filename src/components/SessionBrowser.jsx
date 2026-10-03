import { useState } from 'react';
import { downloadSession } from '../lib/sessions.js';
export default function SessionBrowser({ sessions, onJoin }) {
    const [day, setDay] = useState('all');
    const upcoming = sessions.filter(session => session.status !== 'past' && !session.cancelled);
    const visible = upcoming.filter(session => day === 'all' || session.day === day).slice(0, 4);
    const dateLabel = date => new Intl.DateTimeFormat('en-GB', {
        weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh',
    }).format(new Date(`${date}T12:00:00+03:00`));
    return <div className="session-browser">
    <div className="session-browser-toolbar">
      <div className="session-filters" role="group" aria-label={'Filter sessions by day'}>
        {[
            ['all', 'All sessions'],
            ['Wed', 'Wednesday evenings'],
            ['Sat', 'Saturday mornings'],
        ].map(([value, label]) => <button key={value} type="button" aria-pressed={day === value} onClick={() => setDay(value)}>{label}</button>)}
      </div>
      <span className="session-timezone">{'All times · Riyadh (GMT+3)'}</span>
    </div>
    <p className="sr-only" role="status">{`${visible.length} upcoming sessions shown`}</p>
    <div className="session-browser-grid">
      {visible.map((session, index) => <article className="session-option" key={session.id}>
        <div className="session-option-top">
          <span className="session-date-tile" aria-hidden="true"><b>{Number(session.date.slice(8))}</b><span>{new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(`${session.date}T12:00:00+03:00`))}</span></span>
          <span className={`session-label ${session.status === 'live' ? 'is-live' : ''}`}>{session.status === 'live' ? 'On court now' : index === 0 ? 'Next up' : 'Upcoming'}</span>
        </div>
        <h3>{dateLabel(session.date)}</h3>
        <p className="session-option-time"><bdi dir="ltr">{session.time}</bdi></p>
        <p className="session-option-venue">{session.venue}</p>
        <div className="session-option-meta"><span>{`${session.courts} courts`}</span><span>{'Mixed partners'}</span></div>
        {session.fee_cents != null && <p>{new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(session.fee_cents / 100)}</p>}
        {session.notes && <p className="session-option-note">{session.notes}</p>}
        <div className="session-option-actions"><button className="btn btn-gold" onClick={() => onJoin(session)}>{'Ask to join'} <span aria-hidden="true">↗</span></button><button className="session-calendar" aria-label={`Add ${dateLabel(session.date)} to calendar`} onClick={() => downloadSession(session)}>{'Calendar +'}</button></div>
      </article>)}
    </div>
    {!visible.length && <p className="session-empty">{'No sessions are listed for this day yet. Please check another day.'}</p>}
    <p className="session-booking-note">{'New here? Ask to join and wait for confirmation. Members can reserve a place after signing in.'}</p>
  </div>;
}
