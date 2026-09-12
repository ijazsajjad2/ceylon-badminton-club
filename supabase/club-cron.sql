-- Run only after club-operations.sql.
create extension if not exists pg_cron;
select cron.schedule('cbc-maintenance','*/15 * * * *','select public.cbc_maintenance()');
select public.cbc_maintenance();
