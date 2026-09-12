import { createClient } from 'npm:@supabase/supabase-js@2.110.0'
import webpush from 'npm:web-push@3.6.7'
import { rotateCourts } from './courtRotation.js'
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Content-Type':'application/json'}
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers})
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers})
 if(req.method!=='POST')return reply({error:'POST required'},405)
 try {
  const raw=await req.text();if(raw.length>12000)return reply({error:'Request too large'},413)
  const body=JSON.parse(raw)
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}})
  if(body.action==='dispatch-push'){
   const {data:settings,error}=await db.from('cbc_backend_settings').select('*');if(error)throw error
   const keys=Object.fromEntries(settings.map(k=>[k.key,k.value]))
   if(!keys.push_job_key||req.headers.get('x-cbc-job-key')!==keys.push_job_key)return reply({error:'Unauthorized'},401)
   webpush.setVapidDetails('https://ceylonbadminton.com',keys.vapid_public,keys.vapid_private)
   const {data:notifications,error:queueError}=await db.from('club_notifications').select('*').is('pushed_at',null).gte('created_at',new Date(Date.now()-86400000).toISOString()).order('created_at').limit(20)
   if(queueError)throw queueError
   let sent=0
   for(const n of notifications){
    const {data:pref}=await db.from('club_preferences').select('*').eq('user_id',n.user_id).maybeSingle()
    const permitted=n.kind==='reminder'?pref?.reminders:n.kind==='cancellation'?pref?.cancellations!==false:true
    const {data:subs,error:subError}=await db.from('club_push_subscriptions').select('*').eq('user_id',n.user_id);if(subError)throw subError
    let success=true
    if(permitted)for(const sub of subs){try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({id:n.id,title:n.title,body:n.body}),{TTL:3600,timeout:5000});sent++}catch(error){if([404,410].includes(error.statusCode))await db.from('club_push_subscriptions').delete().eq('endpoint',sub.endpoint);else success=false}}
    if(success)await db.from('club_notifications').update({pushed_at:new Date().toISOString()}).eq('id',n.id)
   }
   return reply({data:{sent}})
  }
  const token=(req.headers.get('authorization')||'').replace(/^Bearer /i,'')
  const {data:{user},error:authError}=await db.auth.getUser(token)
  if(authError||!user)return reply({error:'Sign in required'},401)
  const {data:profile}=await db.from('member_profiles').select('*').eq('user_id',user.id).single()
  if(!profile)return reply({error:'Club membership required'},403)
  const admin=profile.role==='scorekeeper'
  const adminActions=['configure','start-round','finish-round','backup','health']
  if(adminActions.includes(body.action)&&!admin)return reply({error:'Administrator required'},403)
  let result:any
  if(body.action==='push-key'){
   result=await db.from('cbc_backend_settings').select('value').eq('key','vapid_public').single()
  }else if(body.action==='subscribe'){
   const sub=body.subscription,url=new URL(sub?.endpoint)
   const allowed=url.hostname==='fcm.googleapis.com'||url.hostname.endsWith('.push.services.mozilla.com')||url.hostname.endsWith('.notify.windows.com')||url.hostname==='web.push.apple.com'
   if(!allowed||url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||sub.endpoint.length>2000||!/^[A-Za-z0-9_-]{80,100}$/.test(sub.keys?.p256dh)||!/^[A-Za-z0-9_-]{20,30}$/.test(sub.keys?.auth))return reply({error:'Invalid push subscription'},400)
   result=await db.from('club_push_subscriptions').upsert({endpoint:sub.endpoint,user_id:user.id,p256dh:sub.keys.p256dh,auth:sub.keys.auth})
  }else if(body.action==='unsubscribe'){
   result=await db.from('club_push_subscriptions').delete().eq('endpoint',body.endpoint).eq('user_id',user.id)
  }else if(body.action==='book') {
   if(typeof body.going!=='boolean')return reply({error:'Invalid booking'},400)
   result=await db.rpc('cbc_book_session',{actor:user.id,session_day:body.date,wants_place:body.going})
  }else if(body.action==='configure'){
   result=await db.rpc('cbc_configure_session',{actor:user.id,session_day:body.date,new_capacity:body.capacity,new_cutoff:body.cutoff,new_cancelled:body.cancelled,new_fee:body.fee??null,new_notes:body.notes||''})
  }else if(body.action==='start-round'){
   const [a,r,s]=await Promise.all([db.from('attendance').select('player_id').eq('session_date',body.date).eq('booking_status','confirmed'),db.from('club_rounds').select('*').eq('session_date',body.date).order('round_no'),db.from('club_sessions').select('courts').eq('date',body.date).single()])
   if(a.error||r.error||s.error)throw new Error('Could not load court attendance')
   const {data:players,error}=await db.from('club_players').select('*').in('id',a.data.map(p=>p.player_id));if(error)throw error
   const draw=rotateCourts(players,r.data,s.data.courts)
   result=await db.rpc('cbc_start_round',{actor:user.id,session_day:body.date,expected_round:r.data.length+1,court_assignments:draw.assignments,waiting_players:draw.waiting})
  }else if(body.action==='finish-round'){
   result=await db.from('club_rounds').update({status:'completed',ended_at:new Date().toISOString()}).eq('id',body.id).eq('status','playing')
  }else if(body.action==='backup'){
   const maintenance=await db.rpc('cbc_maintenance');if(maintenance.error)throw maintenance.error
   result=await db.from('cbc_backups').select('*').order('created_at',{ascending:false}).limit(1).single()
  }else if(body.action==='health'){
   const [backups,errors]=await Promise.all([db.from('cbc_backups').select('created_at').order('created_at',{ascending:false}).limit(1),db.from('club_errors').select('id',{count:'exact',head:true}).gte('created_at',new Date(Date.now()-86400000).toISOString())])
   if(backups.error||errors.error)throw new Error('Health check failed')
   return reply({data:{database:'reachable',lastBackup:backups.data[0]?.created_at||null,errors24h:errors.count}})
  }else if(body.action==='report-error'){
   const {count}=await db.from('club_errors').select('id',{count:'exact',head:true}).eq('user_id',user.id).gte('created_at',new Date(Date.now()-3600000).toISOString())
   if((count||0)>=20)return reply({error:'Rate limited'},429)
   result=await db.from('club_errors').insert({user_id:user.id,component:String(body.component||'App').replace(/[^a-zA-Z0-9 _.-]/g,'').slice(0,100)})
  }else return reply({error:'Unknown action'},400)
  if(result.error)return reply({error:result.error.message},400)
  return reply({data:result.data})
 }catch{return reply({error:'Unable to complete request'},400)}
})
