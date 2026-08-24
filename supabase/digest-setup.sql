-- StrikeLine — market open/close watchlist digest
-- Run in the Supabase SQL editor AFTER supabase/setup.sql. Idempotent.
--
-- Sends ONE WhatsApp message per user per session summarising their watchlist:
--   open  → previous day's close vs today's open
--   close → today's open vs today's close
-- Capped at 10 symbols, taken in the user's own watchlist order.

-- ============================================================
-- 1. Opt-in flag. Default FALSE on purpose: two unsolicited WhatsApp
--    messages every trading day is a lot for someone who only signed up for
--    price-level alerts, and each one costs Fonnte quota.
-- ============================================================
alter table user_profiles
  add column if not exists market_digest_enabled boolean not null default false;

-- ============================================================
-- 2. Idempotency + audit.
--    The primary key is (user_id, session, trade_date), so a cron misfire, a
--    retry, or a manual invocation can never send the same digest twice.
--    RLS enabled with NO policies → service role only, like app_settings.
-- ============================================================
create table if not exists digest_log (
  user_id    uuid not null references auth.users(id) on delete cascade,
  session    text not null check (session in ('open', 'close')),
  trade_date date not null,
  symbols    int  not null default 0,
  status     text not null default 'sent',
  sent_at    timestamptz not null default now(),
  primary key (user_id, session, trade_date)
);

create index if not exists digest_log_recent_idx on digest_log (sent_at desc);

alter table digest_log enable row level security;
-- (intentionally no policies → only the service role can touch this table)

-- ============================================================
-- 3. Retention — this is an operational log, not user data.
-- ============================================================
create or replace function cleanup_digest_log()
returns void
language sql
security definer
set search_path = public
as $$
  delete from digest_log where sent_at < now() - interval '90 days';
$$;

-- ============================================================
-- 4. Cron.
--    PSX (PKT = UTC+5, no DST):
--      Mon-Thu  09:15-15:30
--      Friday   09:15-12:00 and 14:30-16:30  (Jumma break)
--
--    Open digest runs 09:20 PKT - five minutes after the bell so the scraper
--    has published at least one tick carrying today's open price.
--    Close digest runs five minutes after each session's final bell, which is
--    a DIFFERENT time on Friday. Hence two separate close jobs rather than one
--    job with a weekday check inside it.
--
--    Each command is DERIVED from the existing psx-scraper-cron job rather
--    than written out, so the service-role key is copied inside the database
--    and never has to be pasted into this file.
-- ============================================================
select cron.schedule(
  'market-digest-open', '20 4 * * 1-5',                 -- 09:20 PKT, Mon-Fri
  (select replace(command, '/functions/v1/scrape-psx',
                  '/functions/v1/market-digest?session=open')
   from cron.job where jobname = 'psx-scraper-cron')
);

select cron.schedule(
  'market-digest-close-mon-thu', '35 10 * * 1-4',       -- 15:35 PKT, Mon-Thu
  (select replace(command, '/functions/v1/scrape-psx',
                  '/functions/v1/market-digest?session=close')
   from cron.job where jobname = 'psx-scraper-cron')
);

select cron.schedule(
  'market-digest-close-fri', '35 11 * * 5',             -- 16:35 PKT, Friday
  (select replace(command, '/functions/v1/scrape-psx',
                  '/functions/v1/market-digest?session=close')
   from cron.job where jobname = 'psx-scraper-cron')
);

select cron.schedule(
  'cleanup-digest-log-monthly', '50 19 1 * *',          -- 00:50 PKT on the 1st
  $$ select cleanup_digest_log(); $$
);

-- ============================================================
-- Testing
-- ============================================================
-- The function replays a past session when ?date=YYYY-MM-DD is passed
-- alongside ?force=true (the date is ignored without force, so a stray query
-- param can never retarget a live cron run):
--
--   POST /functions/v1/market-digest?session=open&force=true&date=2026-08-21
--
-- It will still refuse to double-send; add &resend=true to override that.

-- ============================================================
-- Useful checks after setup
-- ============================================================
-- select jobname, schedule from cron.job order by jobname;
-- select * from digest_log order by sent_at desc limit 20;
-- select id, market_digest_enabled, whatsapp_enabled, whatsapp_number
--   from user_profiles where market_digest_enabled;
