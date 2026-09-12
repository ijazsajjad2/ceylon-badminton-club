// Isolated restore rehearsal; never connects to the production database.
import {readFileSync} from 'node:fs'
import {PGlite} from '@electric-sql/pglite'
const path=process.argv[2];if(!path)throw new Error('Usage: node scripts/verify-backup.mjs <snapshot.json>')
const file=JSON.parse(readFileSync(path,'utf8').replace(/^\uFEFF/,'')),data=file.data||file
if(data.version!==1)throw new Error('Unsupported snapshot version')
const tables={players:'club_players',profiles:'member_profiles',sessions:'club_sessions',attendance:'attendance',matches:'matches',confirmations:'match_confirmations',highlights:'club_highlights',rounds:'club_rounds',contributions:'club_contributions',audit:'club_match_audit',seasons:'club_seasons'}
for(const key of Object.keys(tables))if(!Array.isArray(data[key]))throw new Error(`Missing collection: ${key}`)
const db=new PGlite()
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;`)
 await db.exec(readFileSync('supabase/schema.sql','utf8'));await db.exec(readFileSync('supabase/club-operations.sql','utf8'))
 await db.exec('truncate '+Object.values(tables).map(t=>'public.'+t).join(',')+' cascade')
 const users=new Set([...data.profiles.map(p=>p.user_id),...data.confirmations.map(p=>p.user_id),...data.highlights.map(p=>p.owner_id),...data.contributions.map(p=>p.recorded_by),...data.audit.map(p=>p.actor_id)].filter(Boolean))
 for(const id of users)await db.query('insert into auth.users values($1)',[id])
 const counts={}
 for(const [key,table] of Object.entries(tables)){
  if(data[key].length)await db.query(`insert into public.${table} ${key==='audit'?'overriding system value':''} select * from jsonb_populate_recordset(null::public.${table},$1)`,[JSON.stringify(data[key])])
  const count=(await db.query(`select count(*)::int n from public.${table}`)).rows[0].n
  if(count!==data[key].length)throw new Error(`Row count mismatch: ${key}`)
  counts[key]=count
 }
 console.log(JSON.stringify({restored:true,isolated:true,counts,authenticationRestored:false},null,2))
}finally{await db.close()}
