// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const member = '00000000-0000-0000-0000-000000000001'
const other = '00000000-0000-0000-0000-000000000002'
const keeper = '00000000-0000-0000-0000-000000000003'
let db
const as = async (id) => { await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${id}'`) }
const insertMatch = (id, scores = '[[21,18]]', winner = 'A') => db.query(`insert into public.matches (id,date,time,court,type,team_a,team_b,sets,winner,recorded_by) values ($1,'2026-09-09','20:00',1,'doubles','["p1","p2"]','["p3","p4"]',$2,$3,'keeper')`, [id, scores, winner])

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth,public to anon,authenticated;
    insert into auth.users values ('${member}'),('${other}'),('${keeper}');`)
  const schema = readFileSync(new URL('../../supabase/schema.sql', import.meta.url), 'utf8').replace(/^\uFEFF/, '')
  await db.exec(schema)
  await db.exec(schema)
  await db.exec(`insert into public.member_profiles values ('${member}','member','p1','member'),('${other}','other','p2','member'),('${keeper}','keeper','p3','scorekeeper');`)
}, 30000)
afterAll(async () => { await db?.close() })

describe('database access boundaries', () => {
  it('denies anonymous writes', async () => {
    await db.exec('reset role; set role anon')
    await expect(db.exec("insert into public.attendance values ('2026-09-09','p1',true,now())")).rejects.toThrow(/permission denied/)
  })
  it('shows only the current member profile and prevents privilege changes', async () => {
    await as(member)
    expect((await db.query('select username from public.member_profiles')).rows).toEqual([{ username: 'member' }])
    await expect(db.exec("update public.member_profiles set role='scorekeeper'")).rejects.toThrow(/permission denied/)
  })
  it('allows only your own RSVP, including upserts', async () => {
    await as(member)
    await db.exec("insert into public.attendance values ('2026-09-09','p1',true,now()) on conflict (session_date,player_id) do update set going=true")
    await expect(db.exec("insert into public.attendance values ('2026-09-09','p2',true,now())")).rejects.toThrow(/row-level security/)
    await as(other)
    await db.exec("update public.attendance set going=false where player_id='p1'")
    expect((await db.query("select going from public.attendance where player_id='p1'")).rows[0].going).toBe(true)
  })
  it('rejects ordinary member scores and accepts a scorekeeper result', async () => {
    await as(member)
    await expect(insertMatch('unauthorized')).rejects.toThrow(/row-level security/)
    await as(keeper)
    await insertMatch('real-result')
  })
  it('validates scores and winners on the server', async () => {
    await as(keeper)
    for (const scores of ['[[30,30]]', '[[30,15]]', '[[21.5,18]]', '[[21,18],[21,19],[18,21]]']) {
      await expect(insertMatch('invalid', scores)).rejects.toThrow(/cbc_match_valid/)
    }
    await expect(insertMatch('wrong-winner', '[[21,18]]', 'B')).rejects.toThrow(/cbc_match_valid/)
  })
  it('keeps confirmations independent and prevents impersonation', async () => {
    await as(member)
    await db.query("insert into public.match_confirmations (match_id,user_id,username) values ('real-result',$1,'member')", [member])
    await expect(db.query("insert into public.match_confirmations (match_id,user_id,username) values ('real-result',$1,'other')", [other])).rejects.toThrow(/row-level security/)
    await as(other)
    await db.query("insert into public.match_confirmations (match_id,user_id,username) values ('real-result',$1,'other')", [other])
    expect((await db.query("select count(*)::int as count from public.match_confirmations where match_id='real-result'")).rows[0].count).toBe(2)
  })
})
