import {useCallback,useEffect,useState} from 'react'
import {getSupabase} from '../lib/supabase.js'
import {useAuth} from '../context/AuthContext.jsx'
import {useApp} from '../context/AppContext.jsx'
import {riyadhDate} from '../lib/sessions.js'
import './ClubOperations.css'

async function call(action,body={}) {
 const sb=await getSupabase();if(!sb)throw new Error('Connection unavailable')
 const {data,error}=await sb.functions.invoke('cbc-club-ops',{body:{action,...body}})
 if(error){let detail;try{detail=await error.context?.json()}catch{}throw new Error(detail?.error||error.message)}
 if(data?.error)throw new Error(data.error)
 return data?.data
}
function download(data,name){const url=URL.createObjectURL(new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export default function ClubOperations({initialTab='bookings'}) {
 const {user,isScorekeeper}=useAuth();const {playerById}=useApp()
 const [tab,setTab]=useState(initialTab),[data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[date,setDate]=useState(''),[arabic,setArabic]=useState(false)
 const t=(en,ar)=>arabic?ar:en
 const refresh=useCallback(async()=>{
  const sb=await getSupabase();if(!sb)throw new Error('Connection unavailable')
  const tables=['club_sessions','attendance','club_rounds','club_notifications','club_preferences','club_contributions','club_players']
  const results=await Promise.all(tables.map(table=>sb.from(table).select('*')))
  if(results.some(r=>r.error))throw new Error('Could not load club data. Please retry.')
  const next=Object.fromEntries(tables.map((table,i)=>[table,results[i].data]));setData(next)
  setDate(d=>d||next.club_sessions.filter(s=>new Date(s.ends_at)>new Date()).sort((a,b)=>a.date.localeCompare(b.date))[0]?.date||'')
 },[])
 useEffect(()=>{let alive=true;const read=()=>refresh().catch(e=>alive&&setError(e.message));read();const timer=setInterval(read,15000);return()=>{alive=false;clearInterval(timer)}},[refresh])
 const run=async(fn,message='Saved')=>{setBusy(true);setError('');setNotice('');try{await fn();await refresh();if(message)setNotice(message)}catch(e){setError(e.message)}finally{setBusy(false)}}
 const names=ids=>ids.map(id=>data?.club_players.find(p=>p.id===id)?.name||playerById[id]?.name||id).join(' + ')
 const tabs=[['bookings','Bookings','الحجوزات'],['courts','Courts','الملاعب'],['contributions','Contributions','المساهمات'],['account','Account & alerts','الحساب والتنبيهات']]
 if(isScorekeeper)tabs.push(['operations','Operations','الإدارة'])
 const session=data?.club_sessions.find(s=>s.date===date)
 const rounds=(data?.club_rounds||[]).filter(r=>r.session_date===date).sort((a,b)=>a.round_no-b.round_no)
 const current=rounds.find(r=>r.status==='playing')
 const prefs=data?.club_preferences[0]||{user_id:user.id,reminders:false,reminder_hours:1,cancellations:true}
 return <section className="club-ops" dir={arabic?'rtl':'ltr'}>
  <header><div><span className="eyebrow">CBC · RIYADH</span><h1>{t('Your club, organised.','ناديك، بكل سهولة.')}</h1></div><button onClick={()=>setArabic(!arabic)}>{arabic?'English':'العربية'}</button></header>
  <nav aria-label="Club tools">{tabs.map(([id,en,ar])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{t(en,ar)}</button>)}</nav>
  {error&&<div role="alert" className="ops-error">{error} <button disabled={busy} onClick={()=>run(refresh,'Refreshed')}>Retry</button></div>}
  {notice&&<p role="status">{notice}</p>}
  {!data?<p role="status">{t('Loading club data…','جارٍ تحميل بيانات النادي…')}</p>:<>
  {tab==='bookings'&&<div className="ops-grid">{data.club_sessions.filter(s=>new Date(s.ends_at)>new Date()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,12).map(s=>{
   const list=data.attendance.filter(a=>a.session_date===s.date),mine=list.find(a=>a.player_id===user.playerId)
   const confirmed=list.filter(a=>a.booking_status==='confirmed').length
   const queue=list.filter(a=>a.booking_status==='waitlisted').sort((a,b)=>a.queued_at.localeCompare(b.queued_at)||a.player_id.localeCompare(b.player_id))
   const booked=mine&&mine.booking_status!=='cancelled'
   const closed=s.cancelled||new Date(s.starts_at)<=new Date()
   const cutoff=mine?.booking_status==='confirmed'&&Date.now()>new Date(s.starts_at).getTime()-s.cancellation_hours*3600000&&!isScorekeeper
   return <article key={s.date}><h2>{new Date(s.starts_at).toLocaleDateString(arabic?'ar-SA':'en-GB',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Riyadh'})}</h2>
    <p>{new Date(s.starts_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Riyadh'})} · {t('Riyadh time','بتوقيت الرياض')}</p><p>{s.venue}</p>
    <strong>{confirmed}/{s.capacity} {t('confirmed','مؤكد')} · {queue.length} {t('waiting','في الانتظار')}</strong>
    <p>{s.cancelled?t('Session cancelled','تم إلغاء الحصة'):mine?.booking_status==='waitlisted'?`${t('Waiting-list position','ترتيب الانتظار')}: ${queue.findIndex(a=>a.player_id===user.playerId)+1}`:mine?.booking_status==='confirmed'?t('Your place is confirmed','حجزك مؤكد'):t('Reserve your place','احجز مكانك')}</p>
    <p className="ops-muted">{t('Cancellation cutoff','آخر موعد للإلغاء')}: {s.cancellation_hours} {t('hours before start','ساعات قبل البداية')}{s.fee_cents!=null&&` · SAR ${(s.fee_cents/100).toFixed(2)}`}</p>{s.notes&&<p>{s.notes}</p>}
    <button disabled={busy||(!booked&&closed)||cutoff} onClick={()=>run(()=>call('book',{date:s.date,going:!booked}),t('Booking updated','تم تحديث الحجز'))}>{booked?t('Cancel reservation','إلغاء الحجز'):confirmed>=s.capacity?t('Join waiting list','الانضمام للانتظار'):t('Book session','احجز الحصة')}</button>
    {cutoff&&<p>{t('Contact the organiser to cancel after the cutoff.','تواصل مع المنظم للإلغاء بعد الموعد المحدد.')}</p>}
    {isScorekeeper&&<details><summary>{t('Session settings','إعدادات الحصة')}</summary><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);run(()=>call('configure',{date:s.date,capacity:Number(f.get('capacity')),cutoff:Number(f.get('cutoff')),cancelled:f.get('cancelled')==='on',fee:f.get('fee')===''?null:Math.round(Number(f.get('fee'))*100),notes:f.get('notes')}))}}>
     <label>Capacity<input name="capacity" type="number" min="4" max="100" defaultValue={s.capacity} required/></label><label>Cancellation hours<input name="cutoff" type="number" min="0" max="48" defaultValue={s.cancellation_hours} required/></label><label>Fee (SAR, optional)<input name="fee" type="number" min="0" max="1000" step="0.01" defaultValue={s.fee_cents==null?'':s.fee_cents/100}/></label><label>Notes<textarea name="notes" maxLength="500" defaultValue={s.notes}/></label><label><input name="cancelled" type="checkbox" defaultChecked={s.cancelled}/> Cancel session</label><button disabled={busy}>Save settings</button>
    </form></details>}
   </article>
  })}</div>}
  {tab==='courts'&&<><label>{t('Session','الحصة')}<select value={date} onChange={e=>setDate(e.target.value)}>{data.club_sessions.sort((a,b)=>a.date.localeCompare(b.date)).map(s=><option key={s.date}>{s.date}</option>)}</select></label>
   <p>{t('Rotations prioritise fewer games and longer rests, then avoid repeated partners and balance skill. Only confirmed players enter a draw.','تعطي القرعة الأولوية للأقل لعباً والأطول راحة، ثم توازن المستوى وتقلل تكرار الشراكات. القرعة للحجوزات المؤكدة فقط.')}</p>
   {current?<><h2>{t('Round','الجولة')} {current.round_no}</h2><div className="ops-grid">{current.assignments.map(a=><article key={a.court}><h3>{t('Court','الملعب')} {a.court}</h3><p>{names(a.teamA)}</p><span>VS</span><p>{names(a.teamB)}</p></article>)}</div><p>{t('Resting','استراحة')}: {names(current.waiting)||'—'}</p>{isScorekeeper&&<button disabled={busy} onClick={()=>run(()=>call('finish-round',{id:current.id}))}>{t('Finish round','إنهاء الجولة')}</button>}</>:<><p>{t('No round in progress.','لا توجد جولة جارية.')}</p>{isScorekeeper&&<button disabled={busy||!session||session.cancelled} onClick={()=>run(()=>call('start-round',{date}))}>{t('Start fair rotation','بدء قرعة متوازنة')}</button>}</>}
   <h2>{t('Completed rounds','الجولات المكتملة')}</h2>{rounds.filter(r=>r.status==='completed').map(r=><details key={r.id}><summary>{t('Round','الجولة')} {r.round_no}</summary>{r.assignments.map(a=><p key={a.court}>{names(a.teamA)} — {names(a.teamB)}</p>)}</details>)}
  </>}
  {tab==='contributions'&&<>
   <h2>{t('Contribution ledger','سجل المساهمات')}</h2><p>{t('Charges increase the balance; payments and credits reduce it. Entries remain in the record.','تزيد الرسوم الرصيد المستحق، وتخفضه الدفعات والأرصدة الدائنة. تبقى القيود محفوظة.')}</p>
   {(isScorekeeper?data.club_players:data.club_players.filter(p=>p.id===user.playerId)).map(p=>{const rows=data.club_contributions.filter(c=>c.player_id===p.id);return <article key={p.id}><h3>{p.name} · SAR {(rows.reduce((s,c)=>s+(c.kind==='charge'?1:-1)*c.amount_cents,0)/100).toFixed(2)}</h3>{rows.sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(c=><p key={c.id}>{c.session_date} · {c.kind} · SAR {(c.amount_cents/100).toFixed(2)} · {c.note} {c.kind==='payment'&&<button onClick={()=>download(`Ceylon Badminton Club\nContribution acknowledgement\nReceipt: ${c.id}\nMember: ${p.name}\nDate: ${c.session_date}\nAmount: SAR ${(c.amount_cents/100).toFixed(2)}\nNote: ${c.note}\nRecorded: ${c.created_at}`,`CBC-receipt-${c.id}.txt`)}>{t('Receipt','إيصال')}</button>}</p>)}</article>})}
   {isScorekeeper&&<form onSubmit={e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);run(async()=>{const sb=await getSupabase();const r=await sb.from('club_contributions').insert({player_id:f.get('player'),session_date:f.get('date'),kind:f.get('kind'),amount_cents:Math.round(Number(f.get('amount'))*100),note:f.get('note'),recorded_by:user.id});if(r.error)throw r.error;form.reset()})}}><h3>Record contribution</h3><label>Member<select name="player">{data.club_players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Date<input name="date" type="date" defaultValue={riyadhDate()} required/></label><label>Type<select name="kind"><option value="charge">Charge</option><option value="payment">Payment</option><option value="credit">Credit / adjustment</option></select></label><label>Amount (SAR)<input name="amount" type="number" min="0.01" max="100000" step="0.01" required/></label><label>Note<input name="note" maxLength="300" required/></label><button disabled={busy}>Record entry</button></form>}
  </>}
  {tab==='account'&&<>
   <h2>{t('Notifications','التنبيهات')}</h2>
   <p>{t('Enable notifications on this device to receive your selected alerts outside the app.','فعّل إشعارات هذا الجهاز لتلقي التنبيهات المختارة خارج التطبيق.')}</p>
   <button disabled={busy} onClick={()=>run(async()=>{
    if(!('serviceWorker' in navigator)||!('PushManager' in window))throw new Error('This browser does not support push. On iPhone, add the site to your Home Screen first.')
    const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Notification permission was not granted')
    const registration=await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready
    const key=await call('push-key'),raw=atob(key.value.replace(/-/g,'+').replace(/_/g,'/'))
    const subscription=await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:Uint8Array.from(raw,c=>c.charCodeAt(0))})
    await call('subscribe',{subscription:subscription.toJSON()})
   },'Device notifications enabled')}>{t('Enable device notifications','تفعيل إشعارات الجهاز')}</button>
   <button disabled={busy} onClick={()=>run(async()=>{const registration=await navigator.serviceWorker?.getRegistration();const sub=await registration?.pushManager.getSubscription();if(sub){await call('unsubscribe',{endpoint:sub.endpoint});await sub.unsubscribe()}},'Device notifications disabled')}>{t('Disable on this device','تعطيل على هذا الجهاز')}</button><form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);run(async()=>{const sb=await getSupabase();const r=await sb.from('club_preferences').upsert({user_id:user.id,reminders:f.get('reminders')==='on',reminder_hours:Number(f.get('hours')),cancellations:f.get('cancellations')==='on'});if(r.error)throw r.error})}}><label><input name="reminders" type="checkbox" defaultChecked={prefs.reminders}/>{t('Session reminders in the club inbox','تذكير الحصص في صندوق النادي')}</label><label>{t('Remind me before the session','ذكرني قبل الحصة')}<select name="hours" defaultValue={prefs.reminder_hours}>{[1,3,24].map(h=><option key={h} value={h}>{h} {t('hours','ساعات')}</option>)}</select></label><label><input name="cancellations" type="checkbox" defaultChecked={prefs.cancellations}/>{t('Show cancellation alerts','عرض تنبيهات الإلغاء')}</label><button disabled={busy}>{t('Save preferences','حفظ التفضيلات')}</button></form>
   {data.club_notifications.filter(n=>n.kind!=='cancellation'||prefs.cancellations).sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(n=><article key={n.id}><h3>{n.title}</h3><p>{n.body}</p>{!n.read_at&&<button disabled={busy} onClick={()=>run(async()=>{const sb=await getSupabase();const r=await sb.from('club_notifications').update({read_at:new Date().toISOString()}).eq('id',n.id);if(r.error)throw r.error})}>{t('Mark read','تحديد كمقروء')}</button>}</article>)}
   <h2>{t('Change password','تغيير كلمة المرور')}</h2><form onSubmit={e=>{e.preventDefault();const form=e.currentTarget,f=new FormData(form);run(async()=>{if(f.get('password')!==f.get('confirm'))throw new Error('Passwords do not match');const sb=await getSupabase();const r=await sb.auth.updateUser({password:String(f.get('password'))});if(r.error)throw r.error;form.reset()},'Password changed')}}><label>{t('New password','كلمة المرور الجديدة')}<input name="password" type="password" minLength="12" maxLength="128" autoComplete="new-password" required/></label><label>{t('Confirm password','تأكيد كلمة المرور')}<input name="confirm" type="password" minLength="12" maxLength="128" autoComplete="new-password" required/></label><button disabled={busy}>{t('Change password','تغيير كلمة المرور')}</button></form>
  </>}
  {tab==='operations'&&isScorekeeper&&<><h2>Club operations</h2><p>Daily snapshots retain 30 days of club records. Exports contain member data; store them securely. Authentication accounts require a separate Supabase project backup.</p><button disabled={busy} onClick={()=>run(async()=>download(await call('backup'),`cbc-backup-${riyadhDate()}.json`),'Backup downloaded')}>Export latest snapshot</button><button disabled={busy} onClick={()=>run(async()=>{const health=await call('health');setNotice(`Database: ${health.database}. Last snapshot: ${health.lastBackup||'none'}. Reported errors (24h): ${health.errors24h}`)},'')}>Check health</button></>}
  </>}
 </section>
}
