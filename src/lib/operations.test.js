// @vitest-environment node
import {it,expect} from 'vitest'
import {PGlite} from '@electric-sql/pglite'
import {readFileSync} from 'node:fs'
it('enforces capacity, waitlist promotion, cutoff and private ledger access',async()=>{
 const db=new PGlite()
 try {
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;`)
 await db.exec(readFileSync('supabase/schema.sql','utf8'))
 await db.exec(readFileSync('supabase/club-operations.sql','utf8'))
 const ids=Array.from({length:6},(_,i)=>`00000000-0000-0000-0000-00000000000${i+1}`)
 for(let i=0;i<6;i++)await db.query("insert into auth.users values($1);",[ids[i]])
 for(let i=0;i<6;i++)await db.query("insert into member_profiles values($1,$2,$3,$4)",[ids[i],'member'+i,'p'+(i+1),i===5?'scorekeeper':'member'])
 await db.exec("insert into club_sessions(date,starts_at,ends_at,capacity) values('2099-01-01','2099-01-01T17:00Z','2099-01-01T19:00Z',4)")
 for(let i=0;i<5;i++){
 const r=await db.query("select cbc_book_session($1,'2099-01-01',true) as result",[ids[i]])
 expect(r.rows[0].result.status).toBe(i<4?'confirmed':'waitlisted')
 }
 await db.query("select cbc_book_session($1,'2099-01-01',false)",[ids[0]])
 expect((await db.query("select booking_status from attendance where player_id='p5'")).rows[0].booking_status).toBe('confirmed')
 expect((await db.query('select count(*)::int n from club_notifications')).rows[0].n).toBe(1)
 await db.query("select cbc_start_round($1,'2099-01-01',1,$2,'[]')",[ids[5],JSON.stringify([{teamA:['p2','p3'],teamB:['p4','p5']}])])
 await expect(db.query("select cbc_start_round($1,'2099-01-01',2,$2,'[]')",[ids[5],JSON.stringify([{teamA:['p2','p3'],teamB:['p4','p5']}])])).rejects.toThrow(/Finish/)
 await db.exec(`set role authenticated;set request.jwt.claim.sub='${ids[0]}'`)
 await expect(db.exec("insert into attendance(session_date,player_id,going) values('2099-01-01','p1',true)")).rejects.toThrow(/permission denied/)
 await expect(db.query("select cbc_book_session($1,'2099-01-01',true)",[ids[0]])).rejects.toThrow(/permission denied/)
 expect((await db.query('select * from club_contributions')).rows).toEqual([])
 await db.exec('reset role')
 await db.exec("insert into club_contributions(player_id,session_date,kind,amount_cents,recorded_by) values('p2','2099-01-01','charge',2500,'"+ids[5]+"')")
 await db.exec("set role authenticated;set request.jwt.claim.sub='"+ids[0]+"'")
 expect((await db.query('select * from club_contributions')).rows).toHaveLength(0)
 await db.exec('reset role')
 await db.exec("update club_sessions set starts_at=now()+interval '1 hour',ends_at=now()+interval '3 hours' where date='2099-01-01'")
 await expect(db.query("select cbc_book_session($1,'2099-01-01',false)",[ids[1]])).rejects.toThrow(/cutoff/)
 await db.exec("insert into matches(id,date,time,court,type,team_a,team_b,sets,winner,recorded_by) values('audit-test','2026-01-01','20:00',1,'doubles','[\"p1\",\"p2\"]','[\"p3\",\"p4\"]','[[21,18]]','A','member5')")
 await db.exec("set role authenticated;set request.jwt.claim.sub='"+ids[5]+"'")
 await db.exec("update matches set sets='[[21,19]]',edit_base_version=1,edit_reason='Corrected scoreboard' where id='audit-test'")
 expect((await db.query("select revision from matches where id='audit-test'")).rows[0].revision).toBe(2)
 expect((await db.query("select * from club_match_audit where match_id='audit-test'")).rows).toHaveLength(1)
 await expect(db.exec("update matches set sets='[[21,17]]',edit_base_version=1,edit_reason='Another correction' where id='audit-test'")).rejects.toThrow(/another device/)
 await db.exec('reset role;select cbc_maintenance()')
 expect((await db.query('select data from cbc_backups')).rows[0].data.players).toHaveLength(16)
 }finally{await db.close()}
},30000)
