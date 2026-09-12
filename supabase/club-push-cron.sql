create extension if not exists pg_net;
select cron.schedule('cbc-push-dispatch','*/5 * * * *',$job$
 select net.http_post(url:='https://bxlfkdroglotfueigczh.supabase.co/functions/v1/cbc-club-ops',headers:=jsonb_build_object('Content-Type','application/json','x-cbc-job-key',(select value from public.cbc_backend_settings where key='push_job_key')),body:='{"action":"dispatch-push"}'::jsonb,timeout_milliseconds:=30000);
$job$);
