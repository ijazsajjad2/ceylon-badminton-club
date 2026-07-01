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
