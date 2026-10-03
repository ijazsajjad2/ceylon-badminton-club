import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadSession } from '../lib/sessions.js'

export default function SessionBrowser({ sessions, onJoin }) {
  const { i18n } = useTranslation()
  const ar = i18n.language === 'ar'
  const text = (en, arabic) => ar ? arabic : en
  const [day, setDay] = useState('all')
  const upcoming = sessions.filter(session => session.status !== 'past' && !session.cancelled)
  const visible = upcoming.filter(session => day === 'all' || session.day === day).slice(0, 4)
  const dateLabel = date => new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory' : 'en-GB', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Riyadh',
  }).format(new Date(`${date}T12:00:00+03:00`))

  return <div className="session-browser">
    <div className="session-browser-toolbar">
      <div className="session-filters" role="group" aria-label={text('Filter sessions by day', 'تصفية الحصص حسب اليوم')}>
        {[
          ['all', text('All sessions', 'جميع الحصص')],
          ['Wed', text('Wednesday evenings', 'مساء الأربعاء')],
          ['Sat', text('Saturday mornings', 'صباح السبت')],
        ].map(([value, label]) => <button key={value} type="button" aria-pressed={day === value} onClick={() => setDay(value)}>{label}</button>)}
      </div>
      <span className="session-timezone">{text('All times · Riyadh (GMT+3)', 'جميع الأوقات · الرياض (GMT+3)')}</span>
    </div>
    <p className="sr-only" role="status">{text(`${visible.length} upcoming sessions shown`, `عدد الحصص المعروضة: ${visible.length}`)}</p>
    <div className="session-browser-grid">
      {visible.map((session, index) => <article className="session-option" key={session.id}>
        <div className="session-option-top">
          <span className="session-date-tile" aria-hidden="true"><b>{Number(session.date.slice(8))}</b><span>{new Intl.DateTimeFormat(ar ? 'ar-SA-u-ca-gregory' : 'en', { month: 'short', timeZone: 'Asia/Riyadh' }).format(new Date(`${session.date}T12:00:00+03:00`))}</span></span>
          <span className={`session-label ${session.status === 'live' ? 'is-live' : ''}`}>{session.status === 'live' ? text('On court now', 'في الملعب الآن') : index === 0 ? text('Next up', 'الحصة القادمة') : text('Upcoming', 'قريباً')}</span>
        </div>
        <h3>{dateLabel(session.date)}</h3>
        <p className="session-option-time"><bdi dir="ltr">{session.time}</bdi></p>
        <p className="session-option-venue">{session.venue}</p>
        <div className="session-option-meta"><span>{text(`${session.courts} courts`, `${session.courts} ملاعب`)}</span><span>{text('Mixed partners', 'شراكات متغيرة')}</span></div>
        {session.fee_cents != null && <p>{new Intl.NumberFormat(ar ? 'ar-SA' : 'en-SA', { style: 'currency', currency: 'SAR' }).format(session.fee_cents / 100)}</p>}
        {session.notes && <p className="session-option-note">{session.notes}</p>}
        <div className="session-option-actions"><button className="btn btn-gold" onClick={() => onJoin(session)}>{text('Ask to join', 'اطلب الانضمام')} <span aria-hidden="true">↗</span></button><button className="session-calendar" aria-label={text(`Add ${dateLabel(session.date)} to calendar`, `أضف ${dateLabel(session.date)} إلى التقويم`)} onClick={() => downloadSession(session)}>{text('Calendar +', 'التقويم +')}</button></div>
      </article>)}
    </div>
    {!visible.length && <p className="session-empty">{text('No sessions are listed for this day yet. Please check another day.', 'لا توجد حصص لهذا اليوم حالياً. اختر يوماً آخر.')}</p>}
    <p className="session-booking-note">{text('New here? Ask to join and wait for confirmation. Members can reserve a place after signing in.', 'جديد هنا؟ اطلب الانضمام وانتظر التأكيد. يمكن للأعضاء حجز مكان بعد تسجيل الدخول.')}</p>
  </div>
}
