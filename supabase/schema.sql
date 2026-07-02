-- Ceylon Badminton Club — shared attendance roster
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
--
-- One row per (session_date, player_id). Members mark themselves "going" and
-- everyone sees the same live list across devices (realtime).

create table if not exists public.attendance (
  session_date text not null,           -- e.g. '2026-07-05' (the session day)
  player_id    text not null,           -- matches the app's player ids (p1..p16)
  going        boolean not null default true,
  updated_at   timestamptz not null default now(),
  primary key (session_date, player_id)
);

-- Realtime so clients get live updates.
alter publication supabase_realtime add table public.attendance;

-- Row-level security. This is a small private club app using the public anon
-- key, so we allow anonymous read + upsert of attendance rows only. No other
-- tables are exposed. Tighten later if you add real per-member auth.
alter table public.attendance enable row level security;

drop policy if exists "attendance read"   on public.attendance;
drop policy if exists "attendance write"  on public.attendance;
drop policy if exists "attendance update" on public.attendance;

create policy "attendance read"   on public.attendance for select using (true);
create policy "attendance write"  on public.attendance for insert with check (true);
create policy "attendance update" on public.attendance for update using (true) with check (true);

-- Ceylon Badminton Club — shared match ledger
-- One row per recorded match. The app's client-side gate restricts WHO can
-- insert a match to the "ijaz" account (the club scorekeeper) — the anon key
-- itself can't enforce that server-side without real per-user auth, same
-- caveat as the rest of this lightweight login system. Any signed-in member
-- can "confirm" a match by appending their username to confirmed_by.

create table if not exists public.matches (
  id            text primary key,       -- matches the app's local match id
  session_id    text,
  date          text not null,          -- 'YYYY-MM-DD'
  time          text not null,          -- 'HH:MM'
  court         int not null default 1,
  type          text not null check (type in ('doubles', 'singles')),
  team_a        jsonb not null,         -- array of player ids
  team_b        jsonb not null,         -- array of player ids
  sets          jsonb not null,         -- array of [scoreA, scoreB] pairs
  winner        text,                   -- 'A' | 'B'
  live          boolean not null default false,
  recorded_by   text,                   -- username of the scorekeeper who recorded it
  confirmed_by  jsonb not null default '[]'::jsonb, -- usernames who confirmed the result
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter publication supabase_realtime add table public.matches;

alter table public.matches enable row level security;

drop policy if exists "matches read"   on public.matches;
drop policy if exists "matches write"  on public.matches;
drop policy if exists "matches update" on public.matches;

create policy "matches read"   on public.matches for select using (true);
create policy "matches write"  on public.matches for insert with check (true);
create policy "matches update" on public.matches for update using (true) with check (true);
