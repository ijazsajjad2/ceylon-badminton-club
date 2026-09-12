-- Club operations: invoker functions are service-role-only unless explicitly granted.
begin;
create table public.club_players (
 id text primary key, name text not null check(length(name) between 1 and 100),
 level text not null check(level in ('Beginner','Intermediate','Advanced','Expert')),
 join_date date not null default current_date, photo text, gradient jsonb not null default '["#e23b3b","#8b0e1a"]',
 updated_at timestamptz not null default now()
);
alter table public.club_players enable row level security;
grant select on public.club_players to anon,authenticated;
grant insert,update on public.club_players to authenticated;
create policy "club players read" on public.club_players for select to anon,authenticated using(true);
create policy "club player add" on public.club_players for insert to authenticated with check(exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));
create policy "club player edit" on public.club_players for update to authenticated using(id=(select player_id from public.member_profiles where user_id=auth.uid()) or exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper')) with check(id=(select player_id from public.member_profiles where user_id=auth.uid()) or exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));

create table public.club_sessions (
 date date primary key, starts_at timestamptz not null, ends_at timestamptz not null,
 capacity int not null default 20 check(capacity between 4 and 100),
 courts int not null default 2 check(courts between 1 and 2),
 cancellation_hours int not null default 2 check(cancellation_hours between 0 and 48),
 cancelled boolean not null default false, venue text not null default 'Green Badminton Club',
 fee_cents int check(fee_cents between 0 and 100000), notes text not null default '',
 check(ends_at > starts_at)
);
alter table public.club_sessions enable row level security;
grant select on public.club_sessions to anon,authenticated;
create policy "club sessions read" on public.club_sessions for select to anon,authenticated using(true);

alter table public.attendance add column booking_status text not null default 'cancelled' check(booking_status in ('confirmed','waitlisted','cancelled'));
alter table public.attendance add column queued_at timestamptz not null default now();
update public.attendance set booking_status=case when going then 'confirmed' else 'cancelled' end;
revoke insert,update on public.attendance from authenticated;

create table public.club_highlights (id text primary key,owner_id uuid not null references auth.users(id),data jsonb not null,created_at timestamptz not null default now());
alter table public.club_highlights enable row level security;
grant select,insert,delete on public.club_highlights to authenticated;
create policy "highlights members read" on public.club_highlights for select to authenticated using(exists(select 1 from public.member_profiles where user_id=auth.uid()));
create policy "highlights own insert" on public.club_highlights for insert to authenticated with check(owner_id=auth.uid() and exists(select 1 from public.member_profiles where user_id=auth.uid()));
create policy "highlights own delete" on public.club_highlights for delete to authenticated using(owner_id=auth.uid() or exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));

create table public.club_rounds (id uuid primary key default gen_random_uuid(), session_date date not null references public.club_sessions(date), round_no int not null, assignments jsonb not null, waiting jsonb not null default '[]', status text not null default 'playing' check(status in ('playing','completed')),started_at timestamptz not null default now(),ended_at timestamptz,unique(session_date,round_no));
create unique index one_active_round on public.club_rounds(session_date) where status='playing';
alter table public.club_rounds enable row level security;
grant select on public.club_rounds to authenticated;
create policy "rounds read" on public.club_rounds for select to authenticated using(exists(select 1 from public.member_profiles where user_id=auth.uid()));

create table public.club_notifications (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,kind text not null,title text not null,body text not null,session_date date,created_at timestamptz not null default now(),read_at timestamptz,pushed_at timestamptz,dedupe_key text unique);
alter table public.club_notifications enable row level security;
grant select on public.club_notifications to authenticated;
grant update(read_at) on public.club_notifications to authenticated;
create policy "notification read" on public.club_notifications for select to authenticated using(user_id=auth.uid());
create policy "notification mark read" on public.club_notifications for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create table public.club_preferences (user_id uuid primary key references auth.users(id) on delete cascade,reminders boolean not null default false,reminder_hours int not null default 1 check(reminder_hours in (1,3,24)),cancellations boolean not null default true);
alter table public.club_preferences enable row level security;
grant select,insert,update on public.club_preferences to authenticated;
create policy "preferences read" on public.club_preferences for select to authenticated using(user_id=auth.uid());
create policy "preferences create" on public.club_preferences for insert to authenticated with check(user_id=auth.uid());
create policy "preferences update" on public.club_preferences for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create table public.club_contributions (id uuid primary key default gen_random_uuid(),player_id text not null references public.club_players(id),session_date date not null,kind text not null check(kind in ('charge','payment','credit')),amount_cents int not null check(amount_cents between 1 and 10000000),note text not null default '' check(length(note)<=300),recorded_by uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.club_contributions enable row level security;
grant select,insert on public.club_contributions to authenticated;
create policy "contributions read" on public.club_contributions for select to authenticated using(player_id=(select player_id from public.member_profiles where user_id=auth.uid()) or exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));
create policy "contributions record" on public.club_contributions for insert to authenticated with check(recorded_by=auth.uid() and exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));

alter table public.matches add column revision int not null default 1;
alter table public.matches add column edit_base_version int not null default 0;
alter table public.matches add column edit_reason text;
create table public.club_match_audit (id bigint generated always as identity primary key,match_id text not null references public.matches(id),actor_id uuid references auth.users(id),reason text not null,old_result jsonb not null,new_result jsonb not null,created_at timestamptz not null default now());
alter table public.club_match_audit enable row level security;
grant select,insert on public.club_match_audit to authenticated;
grant usage on sequence public.club_match_audit_id_seq to authenticated;
create policy "audit read" on public.club_match_audit for select to authenticated using(exists(select 1 from public.member_profiles where user_id=auth.uid()));
create policy "audit insert" on public.club_match_audit for insert to authenticated with check(actor_id=auth.uid() and exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));
grant delete on public.match_confirmations to authenticated;
create policy "scorekeeper invalidates confirmations" on public.match_confirmations for delete to authenticated using(exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));
create function public.cbc_audit_score() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if row(new.sets,new.team_a,new.team_b,new.winner,new.date,new.time,new.court,new.type) is distinct from row(old.sets,old.team_a,old.team_b,old.winner,old.date,old.time,old.court,old.type) then
  if new.edit_base_version <> old.revision then raise exception 'Result changed on another device. Refresh before editing.'; end if;
  if length(trim(coalesce(new.edit_reason,''))) < 4 then raise exception 'Explain the score correction.'; end if;
  new.revision:=old.revision+1; new.confirmed_by:='[]';
  insert into public.club_match_audit(match_id,actor_id,reason,old_result,new_result) values(old.id,auth.uid(),new.edit_reason,to_jsonb(old),to_jsonb(new));
  delete from public.match_confirmations where match_id=old.id;
 else new.revision:=old.revision;
 end if;
 return new;
end $$;
create trigger audit_club_score before update on public.matches for each row execute function public.cbc_audit_score();

create table public.club_seasons (id uuid primary key default gen_random_uuid(),name text not null,start_date date not null,end_date date not null,check(end_date>=start_date));
alter table public.club_seasons enable row level security;
grant select on public.club_seasons to anon,authenticated;
grant insert,update on public.club_seasons to authenticated;
create policy "seasons read" on public.club_seasons for select to anon,authenticated using(true);
create policy "seasons create" on public.club_seasons for insert to authenticated with check(exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));
create policy "seasons update" on public.club_seasons for update to authenticated using(exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper')) with check(exists(select 1 from public.member_profiles where user_id=auth.uid() and role='scorekeeper'));
insert into public.club_seasons(name,start_date,end_date) values('2026 season','2026-01-01','2026-12-31');

create table public.cbc_backend_settings (key text primary key,value text not null);
alter table public.cbc_backend_settings enable row level security;
revoke all on public.cbc_backend_settings from public,anon,authenticated;
create table public.cbc_backups (id bigint generated always as identity primary key,created_at timestamptz not null default now(),data jsonb not null);
alter table public.cbc_backups enable row level security;
revoke all on public.cbc_backups from public,anon,authenticated;
create table public.club_errors (id bigint generated always as identity primary key,user_id uuid references auth.users(id),component text not null,created_at timestamptz not null default now());
alter table public.club_errors enable row level security;
revoke all on public.club_errors from public,anon,authenticated;
create table public.club_push_subscriptions (endpoint text primary key,user_id uuid not null references auth.users(id) on delete cascade,p256dh text not null,auth text not null,created_at timestamptz not null default now());
alter table public.club_push_subscriptions enable row level security;
revoke all on public.club_push_subscriptions from public,anon,authenticated;
grant all on public.club_players,public.club_sessions,public.club_highlights,public.club_rounds,public.club_notifications,public.club_preferences,public.club_contributions,public.club_match_audit,public.club_seasons,public.cbc_backend_settings,public.cbc_backups,public.club_errors,public.club_push_subscriptions to service_role;
grant usage,select on all sequences in schema public to service_role;

create function public.cbc_ensure_sessions() returns void language sql security invoker set search_path='' as $$
 insert into public.club_sessions(date,starts_at,ends_at)
 select d::date,(d::date+case when extract(dow from d)=3 then time '20:00' else time '08:00' end) at time zone 'Asia/Riyadh',(d::date+case when extract(dow from d)=3 then time '22:00' else time '10:00' end) at time zone 'Asia/Riyadh'
 from generate_series((now() at time zone 'Asia/Riyadh')::date,((now() at time zone 'Asia/Riyadh')::date+90),interval '1 day') d
 where extract(dow from d) in(3,6) on conflict(date) do nothing;
$$;
select public.cbc_ensure_sessions();

create function public.cbc_book_session(actor uuid,session_day date,wants_place boolean) returns jsonb language plpgsql security invoker set search_path='' as $$
declare s public.club_sessions; p public.member_profiles; existing public.attendance; places int; promoted text; result_status text;
begin
 select * into p from public.member_profiles where user_id=actor;
 if p.player_id is null then raise exception 'A linked member account is required'; end if;
 select * into s from public.club_sessions where date=session_day for update;
 if not found then raise exception 'Session not found'; end if;
 select * into existing from public.attendance where session_date=session_day::text and player_id=p.player_id;
 if wants_place then
  if s.cancelled or s.starts_at<=now() then raise exception 'This session is closed for bookings'; end if;
  if existing.booking_status in('confirmed','waitlisted') then return jsonb_build_object('status',existing.booking_status); end if;
  select count(*) into places from public.attendance where session_date=session_day::text and booking_status='confirmed';
  result_status:=case when places<s.capacity then 'confirmed' else 'waitlisted' end;
  insert into public.attendance(session_date,player_id,going,booking_status,queued_at,updated_at) values(session_day::text,p.player_id,result_status='confirmed',result_status,now(),now()) on conflict(session_date,player_id) do update set going=excluded.going,booking_status=excluded.booking_status,queued_at=excluded.queued_at,updated_at=now();
 else
  if existing.booking_status='cancelled' or existing.player_id is null then return jsonb_build_object('status','cancelled'); end if;
  if existing.booking_status='confirmed' and now()>s.starts_at-make_interval(hours=>s.cancellation_hours) and p.role<>'scorekeeper' then raise exception 'Cancellation cutoff passed. Contact the organiser.'; end if;
  update public.attendance set going=false,booking_status='cancelled',updated_at=now() where session_date=session_day::text and player_id=p.player_id;
  result_status:='cancelled';
  if existing.booking_status='confirmed' and not s.cancelled and s.starts_at>now() then
   select player_id into promoted from public.attendance where session_date=session_day::text and booking_status='waitlisted' order by queued_at,player_id limit 1 for update;
   if promoted is not null then
    update public.attendance set going=true,booking_status='confirmed',updated_at=now() where session_date=session_day::text and player_id=promoted;
    insert into public.club_notifications(user_id,kind,title,body,session_date) select user_id,'promotion','Your place is confirmed','A place opened for '||session_day||'. You have moved from the waiting list.',session_day from public.member_profiles where player_id=promoted;
   end if;
  end if;
 end if;
 return jsonb_build_object('status',result_status);
end $$;

create function public.cbc_configure_session(actor uuid,session_day date,new_capacity int,new_cutoff int,new_cancelled boolean,new_fee int,new_notes text) returns void language plpgsql security invoker set search_path='' as $$
declare s public.club_sessions; booked int; promoted text;
begin
 if not exists(select 1 from public.member_profiles where user_id=actor and role='scorekeeper') then raise exception 'Administrator required'; end if;
 select * into s from public.club_sessions where date=session_day for update;
 if not found then raise exception 'Session not found'; end if;
 select count(*) into booked from public.attendance where session_date=session_day::text and booking_status='confirmed';
 if not new_cancelled and new_capacity<booked then raise exception 'Capacity cannot be below confirmed attendance'; end if;
 update public.club_sessions set capacity=new_capacity,cancellation_hours=new_cutoff,cancelled=new_cancelled,fee_cents=new_fee,notes=left(new_notes,500) where date=session_day;
 if new_cancelled and not s.cancelled then
  insert into public.club_notifications(user_id,kind,title,body,session_date) select p.user_id,'cancellation','Session cancelled','The club session on '||session_day||' has been cancelled.',session_day from public.member_profiles p join public.attendance a on a.player_id=p.player_id where a.session_date=session_day::text and a.booking_status in('confirmed','waitlisted');
  update public.attendance set going=false,booking_status='cancelled',updated_at=now() where session_date=session_day::text;
 end if;
 if not new_cancelled and s.starts_at>now() then
  for promoted in select player_id from public.attendance where session_date=session_day::text and booking_status='waitlisted' order by queued_at,player_id limit greatest(new_capacity-booked,0) for update loop
   update public.attendance set going=true,booking_status='confirmed',updated_at=now() where session_date=session_day::text and player_id=promoted;
   insert into public.club_notifications(user_id,kind,title,body,session_date) select user_id,'promotion','Your place is confirmed','A place opened for '||session_day,session_day from public.member_profiles where player_id=promoted;
  end loop;
 end if;
end $$;

create function public.cbc_start_round(actor uuid,session_day date,expected_round int,court_assignments jsonb,waiting_players jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.club_sessions; next_round int; rid uuid; ids text[];
begin
 if not exists(select 1 from public.member_profiles where user_id=actor and role='scorekeeper') then raise exception 'Administrator required'; end if;
 select * into s from public.club_sessions where date=session_day for update;
 if not found or s.cancelled then raise exception 'Session unavailable'; end if;
 if exists(select 1 from public.club_rounds where session_date=session_day and status='playing') then raise exception 'Finish the current round first'; end if;
 select coalesce(max(round_no),0)+1 into next_round from public.club_rounds where session_date=session_day;
 if next_round<>expected_round then raise exception 'Court state changed. Refresh and retry.'; end if;
 if jsonb_array_length(court_assignments)<1 or jsonb_array_length(court_assignments)>s.courts then raise exception 'Invalid court count'; end if;
 select array_agg(v.value) into ids from jsonb_array_elements(court_assignments) a cross join lateral jsonb_array_elements_text((a->'teamA')||(a->'teamB')) v;
 if cardinality(ids)<>4*jsonb_array_length(court_assignments) or (select count(distinct x) from unnest(ids)x)<>cardinality(ids) then raise exception 'Each court requires four different players'; end if;
 if exists(select 1 from unnest(ids)x where not exists(select 1 from public.attendance where session_date=session_day::text and player_id=x and booking_status='confirmed')) then raise exception 'Only confirmed players can enter the court'; end if;
 insert into public.club_rounds(session_date,round_no,assignments,waiting) values(session_day,next_round,court_assignments,waiting_players) returning id into rid;
 return rid;
end $$;

create function public.cbc_maintenance() returns void language plpgsql security invoker set search_path='' as $$
begin
 perform public.cbc_ensure_sessions();
 insert into public.club_notifications(user_id,kind,title,body,session_date,dedupe_key)
 select p.user_id,'reminder','Your badminton session is coming up','Your confirmed session starts at '||to_char(s.starts_at at time zone 'Asia/Riyadh','HH24:MI')||' Riyadh time.',s.date,'reminder:'||p.user_id||':'||s.date
 from public.club_preferences p join public.member_profiles m on m.user_id=p.user_id join public.attendance a on a.player_id=m.player_id and a.booking_status='confirmed' join public.club_sessions s on s.date::text=a.session_date
 where p.reminders and not s.cancelled and s.starts_at>now() and s.starts_at<=now()+make_interval(hours=>p.reminder_hours) on conflict(dedupe_key) do nothing;
 if not exists(select 1 from public.cbc_backups where created_at>now()-interval '23 hours') then
 insert into public.cbc_backups(data) select jsonb_build_object('version',1,'players',(select coalesce(jsonb_agg(p),'[]') from public.club_players p),'sessions',(select coalesce(jsonb_agg(s),'[]') from public.club_sessions s),'attendance',(select coalesce(jsonb_agg(a),'[]') from public.attendance a),'matches',(select coalesce(jsonb_agg(m),'[]') from public.matches m),'confirmations',(select coalesce(jsonb_agg(c),'[]') from public.match_confirmations c),'contributions',(select coalesce(jsonb_agg(c),'[]') from public.club_contributions c),'highlights',(select coalesce(jsonb_agg(h),'[]') from public.club_highlights h),'rounds',(select coalesce(jsonb_agg(r),'[]') from public.club_rounds r),'audit',(select coalesce(jsonb_agg(a),'[]') from public.club_match_audit a),'profiles',(select coalesce(jsonb_agg(p),'[]') from public.member_profiles p),'seasons',(select coalesce(jsonb_agg(s),'[]') from public.club_seasons s));
 end if;
 delete from public.cbc_backups where created_at<now()-interval '30 days';
 delete from public.club_errors where created_at<now()-interval '30 days';
end $$;
revoke all on function public.cbc_ensure_sessions(),public.cbc_book_session(uuid,date,boolean),public.cbc_configure_session(uuid,date,int,int,boolean,int,text),public.cbc_start_round(uuid,date,int,jsonb,jsonb),public.cbc_maintenance() from public,anon,authenticated;
grant execute on function public.cbc_ensure_sessions(),public.cbc_book_session(uuid,date,boolean),public.cbc_configure_session(uuid,date,int,int,boolean,int,text),public.cbc_start_round(uuid,date,int,jsonb,jsonb),public.cbc_maintenance() to service_role;
grant all on public.club_players,public.club_sessions,public.club_highlights,public.club_rounds,public.club_notifications,public.club_preferences,public.club_contributions,public.club_match_audit,public.club_seasons,public.cbc_backend_settings,public.cbc_backups,public.club_errors,public.club_push_subscriptions to service_role;
insert into public.club_players(id,name,level,join_date,photo,gradient) values ('p1','Tharindu','Advanced','2023-01-15',null,'["#E23B3B","#8B0E1A"]'),('p2','Iresh','Advanced','2022-09-04',null,'["#2F7BF0","#13357A"]'),('p3','Muditha','Advanced','2023-06-11',null,'["#E0303F","#2F6FE0"]'),('p4','Kitha','Advanced','2022-11-22',null,'["#1F5FD6","#0E2A66"]'),('p5','PJ','Advanced','2022-07-30',null,'["#FF5A5A","#C1121F"]'),('p6','Edward','Advanced','2023-08-14',null,'["#3B82F6","#1E40AF"]'),('p7','Fahami','Advanced','2023-10-05',null,'["#D62839","#6A0D14"]'),('p8','Minshi','Advanced','2023-03-19',null,'["#2563EB","#1E3A8A"]'),('p9','Ramzeen','Advanced','2024-01-08',null,'["#EF3E4D","#1841A8"]'),('p10','Nihad D','Advanced','2024-02-17',null,'["#1D4ED8","#0B1E4D"]'),('p11','Fazil','Advanced','2023-12-03',null,'["#FF6B6B","#B00D20"]'),('p12','Mali Fedo','Advanced','2023-05-28',null,'["#4D8BFF","#1F5FD6"]'),('p13','Buddi','Advanced','2024-04-10',null,'["#C81E2C","#3A0A10"]'),('p14','Gayan','Advanced','2022-12-01',null,'["#2F7BF0","#9E0C1A"]'),('p15','Ijaz','Advanced','2022-08-20',null,'["#6098F5","#13357A"]'),('p16','Richy','Advanced','2024-05-06',null,'["#E23B3B","#1F5FD6"]');
commit;
