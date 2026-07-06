-- Ceylon Badminton Club — scheduled session-reminder push notifications
-- Optional. Only run this AFTER completing PUSH_NOTIFICATIONS_SETUP.md
-- (OneSignal account + the send-session-reminder Edge Function deployed).
--
-- Riyadh is UTC+3 year-round (Saudi Arabia does not observe DST), so these
-- fixed UTC offsets are stable across the whole year — no seasonal changes
-- needed.
--   Wed 20:00 Riyadh session → reminder at 19:00 Riyadh = 16:00 UTC Wednesday
--   Sat 08:00 Riyadh session → reminder at 07:00 Riyadh = 04:00 UTC Saturday

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace <project-ref> and <anon-or-service-role-key> below with your own
-- project's values (Project Settings → API) before running.
select cron.schedule(
  'wed-session-reminder',
  '0 16 * * 3',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-session-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <anon-or-service-role-key>'),
    body := jsonb_build_object('session', 'wed')
  );
  $$
);

select cron.schedule(
  'sat-session-reminder',
  '0 4 * * 6',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-session-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <anon-or-service-role-key>'),
    body := jsonb_build_object('session', 'sat')
  );
  $$
);

-- To remove either schedule later:
--   select cron.unschedule('wed-session-reminder');
--   select cron.unschedule('sat-session-reminder');
