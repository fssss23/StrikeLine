-- StrikeLine — admin panel + alert-control setup
-- Run in the Supabase SQL editor AFTER supabase/setup.sql. Idempotent.
--
-- This adds: admin/restriction flags on user_profiles, a global app_settings
-- table (WhatsApp kill switch + global pause), and a diagnostic for the stray
-- after-hours evaluate-alerts cron. All privileged reads/writes for the admin
-- panel go through the `admin-api` edge function (service role), so no broad
-- RLS changes to user_profiles are needed.

-- ============================================================
-- 1. Admin + restriction flags on user_profiles
--    is_admin  → can open the /admin panel and call admin-api
--    restricted→ blocked from the app; evaluate-alerts skips their alerts
-- ============================================================
alter table user_profiles add column if not exists is_admin   boolean not null default false;
alter table user_profiles add column if not exists restricted boolean not null default false;

-- ============================================================
-- 2. Global app settings (key/value). Read by evaluate-alerts (service role),
--    written only by admin-api (service role). RLS is enabled with NO policies
--    so the anon/auth client cannot read or write it directly.
--      whatsapp_enabled → global WhatsApp kill switch (admin "shut off" button)
--      alerts_paused    → halt ALL alert dispatch (panic switch)
-- ============================================================
create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

insert into app_settings (key, value) values
  ('whatsapp_enabled', 'true'::jsonb),
  ('alerts_paused',    'false'::jsonb)
on conflict (key) do nothing;

alter table app_settings enable row level security;
-- (intentionally no policies → only the service role can touch this table)

-- ============================================================
-- 3. Make yourself an admin. Add/remove emails as needed.
-- ============================================================
update user_profiles set is_admin = true
where id in (
  select id from auth.users
  where email in ('hammadjamal053@gmail.com', 'hammadjamal99@gmail.com')
);

-- ============================================================
-- 4. DIAGNOSTIC — find the stray after-hours alert cron
--    The repo only schedules `scrape-psx-minutely` (which self-guards market
--    hours). If alerts fire after close, a separate job is calling
--    evaluate-alerts directly. List all cron jobs:
-- ============================================================
-- select jobid, jobname, schedule, command from cron.job order by jobname;

-- If you see a job that POSTs to /functions/v1/evaluate-alerts, it is the
-- culprit. The evaluate-alerts function now self-guards market hours so this is
-- no longer harmful, but you can remove the standalone job to stop the wasted
-- invocations (the scrape-psx chain still evaluates alerts on fresh ticks):
--
--   select cron.unschedule('<that-jobname>');
--
-- Verify after: select jobname, schedule from cron.job order by jobname;
