-- CBC member access and shared ledger. Safe to re-run; existing rows are retained.
-- Run as the database owner. Existing permissive policies are replaced below.
begin;
create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  player_id text unique,
  role text not null default 'member' check (role in ('member','scorekeeper'))
);
alter table public.member_profiles enable row level security;
revoke all on public.member_profiles from anon, authenticated;
grant select on public.member_profiles to authenticated;
drop policy if exists "members read own profile" on public.member_profiles;
create policy "members read own profile" on public.member_profiles for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.attendance (
  session_date text not null,
  player_id text not null,
  going boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (session_date, player_id)
);
alter table public.attendance enable row level security;
revoke all on public.attendance from anon, authenticated;
grant select on public.attendance to anon, authenticated;
grant insert, update on public.attendance to authenticated;
drop policy if exists "attendance read" on public.attendance;
drop policy if exists "attendance write" on public.attendance;
drop policy if exists "attendance update" on public.attendance;
create policy "attendance read" on public.attendance for select to anon, authenticated using (true);
create policy "attendance write" on public.attendance for insert to authenticated with check (
  player_id = (select player_id from public.member_profiles where user_id = (select auth.uid()))
);
create policy "attendance update" on public.attendance for update to authenticated using (
  player_id = (select player_id from public.member_profiles where user_id = (select auth.uid()))
) with check (
  player_id = (select player_id from public.member_profiles where user_id = (select auth.uid()))
);

create table if not exists public.matches (
  id text primary key,
  session_id text,
  date text not null,
  time text not null,
  court int not null default 1,
  type text not null check (type in ('doubles','singles')),
  team_a jsonb not null,
  team_b jsonb not null,
  sets jsonb not null,
  winner text,
  live boolean not null default false,
  recorded_by text,
  confirmed_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.matches enable row level security;
revoke all on public.matches from anon, authenticated;
grant select on public.matches to anon, authenticated;
grant insert, update on public.matches to authenticated;
drop policy if exists "matches read" on public.matches;
drop policy if exists "matches write" on public.matches;
drop policy if exists "matches update" on public.matches;
create policy "matches read" on public.matches for select to anon, authenticated using (true);
create policy "matches write" on public.matches for insert to authenticated with check (
  exists (select 1 from public.member_profiles where user_id = (select auth.uid()) and role = 'scorekeeper' and username = recorded_by)
);
create policy "matches update" on public.matches for update to authenticated using (
  exists (select 1 from public.member_profiles where user_id = (select auth.uid()) and role = 'scorekeeper')
) with check (
  exists (select 1 from public.member_profiles where user_id = (select auth.uid()) and role = 'scorekeeper' and username = recorded_by)
);

-- Separate rows prevent confirmations from overwriting other members' confirmations.
create table if not exists public.match_confirmations (
  match_id text not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  primary key (match_id, user_id)
);
alter table public.match_confirmations enable row level security;
revoke all on public.match_confirmations from anon, authenticated;
grant select on public.match_confirmations to anon, authenticated;
grant insert, update on public.match_confirmations to authenticated;
drop policy if exists "confirmations read" on public.match_confirmations;
drop policy if exists "confirmations insert" on public.match_confirmations;
drop policy if exists "confirmations update" on public.match_confirmations;
create policy "confirmations read" on public.match_confirmations for select to anon, authenticated using (true);
create policy "confirmations insert" on public.match_confirmations for insert to authenticated with check (
  user_id = (select auth.uid()) and username = (select username from public.member_profiles where user_id = (select auth.uid()))
);
create policy "confirmations update" on public.match_confirmations for update to authenticated using (
  user_id = (select auth.uid())
) with check (
  user_id = (select auth.uid()) and username = (select username from public.member_profiles where user_id = (select auth.uid()))
);

-- Enforce final score validity at the database boundary too.
create or replace function public.cbc_valid_match(game_type text, a_team jsonb, b_team jsonb, scores jsonb, winning_team text)
returns boolean language plpgsql immutable security invoker set search_path = '' as $$
declare
  pair jsonb; a int; b int; high_score int; low_score int;
  wins_a int := 0; wins_b int := 0; set_count int; player_count int;
begin
  if jsonb_typeof(a_team) <> 'array' or jsonb_typeof(b_team) <> 'array' or jsonb_typeof(scores) <> 'array' then return false; end if;
  player_count := case when game_type = 'doubles' then 2 when game_type = 'singles' then 1 else 0 end;
  if player_count = 0 or jsonb_array_length(a_team) <> player_count or jsonb_array_length(b_team) <> player_count then return false; end if;
  if exists (select 1 from jsonb_array_elements(a_team || b_team) item where jsonb_typeof(item) <> 'string' or item #>> '{}' = '') then return false; end if;
  if (select count(distinct value) from jsonb_array_elements_text(a_team || b_team)) <> player_count * 2 then return false; end if;
  set_count := jsonb_array_length(scores);
  if set_count < 1 or set_count > 3 then return false; end if;
  for pair in select value from jsonb_array_elements(scores) loop
    if wins_a = 2 or wins_b = 2 then return false; end if;
    if jsonb_typeof(pair) <> 'array' or jsonb_array_length(pair) <> 2 then return false; end if;
    if jsonb_typeof(pair->0) <> 'number' or jsonb_typeof(pair->1) <> 'number' then return false; end if;
    if (pair->>0) !~ '^[0-9]+$' or (pair->>1) !~ '^[0-9]+$' then return false; end if;
    a := (pair->>0)::int; b := (pair->>1)::int;
    high_score := greatest(a,b); low_score := least(a,b);
    if high_score < 21 or high_score > 30 or low_score < 0 then return false; end if;
    if high_score = 30 then
      if low_score not in (28,29) then return false; end if;
    elsif high_score = 21 then
      if low_score > 19 then return false; end if;
    elsif high_score - low_score <> 2 then return false;
    end if;
    if a > b then wins_a := wins_a + 1; else wins_b := wins_b + 1; end if;
  end loop;
  if set_count > 1 and greatest(wins_a,wins_b) <> 2 then return false; end if;
  return coalesce(winning_team = case when wins_a > wins_b then 'A' else 'B' end, false);
exception when others then return false;
end;
$$;
revoke all on function public.cbc_valid_match(text,jsonb,jsonb,jsonb,text) from public;
grant execute on function public.cbc_valid_match(text,jsonb,jsonb,jsonb,text) to authenticated;
-- NOT VALID preserves any historical rows needing review, but checks all new writes.
alter table public.matches drop constraint if exists cbc_match_valid;
alter table public.matches add constraint cbc_match_valid check (public.cbc_valid_match(type,team_a,team_b,sets,winner) and court in (1,2)) not valid;

-- Add realtime tables only if not already published (safe on repeat setup).
do $$
declare table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['attendance','matches','match_confirmations'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end $$;
commit;
