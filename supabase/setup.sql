-- StrikeLine — one-time Supabase setup
-- Run in the Supabase SQL editor. Each section is idempotent (safe to re-run).
-- Replace <project-ref> and <service-role-key> in section 4 before running it.

-- ============================================================
-- 1. Seed the KSE-100 index row
--    Required for the TopBar index badge: price_ticks.symbol has an FK to
--    securities, so KSE100 ticks are silently dropped without this row.
-- ============================================================
insert into securities (symbol, company_name, sector)
values ('KSE100', 'KSE-100 Index', 'Index')
on conflict (symbol) do nothing;

-- ============================================================
-- 2. Realtime publication
--    price_ticks → live prices in the UI (useRealtimePrices)
--    alert_events → in-app alert toasts (useRealtimeAlerts)
-- ============================================================
do $$
begin
  alter publication supabase_realtime add table price_ticks;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table alert_events;
exception when duplicate_object then null;
end $$;

-- ============================================================
-- 3. Daily candles + tick retention
--    A per-minute scraper for 40+ symbols generates ~12k rows/day. Nightly,
--    roll completed days into price_candles_daily and drop raw ticks older
--    than 30 days. This also gives charts real long-range history.
-- ============================================================
create table if not exists price_candles_daily (
  symbol      text not null references securities(symbol),
  trade_date  date not null,
  open_price  float,
  high_price  float,
  low_price   float,
  close_price float,
  volume      bigint,
  primary key (symbol, trade_date)
);

alter table price_candles_daily enable row level security;

drop policy if exists "Authenticated users can read daily candles" on price_candles_daily;
create policy "Authenticated users can read daily candles"
  on price_candles_daily for select
  to authenticated
  using (true);

create or replace function rollup_price_ticks()
returns void
language plpgsql
security definer
as $$
begin
  -- Roll every completed PKT day into one OHLC row per symbol
  insert into price_candles_daily (symbol, trade_date, open_price, high_price, low_price, close_price, volume)
  select
    symbol,
    (scraped_at at time zone 'Asia/Karachi')::date              as trade_date,
    (array_agg(open_price order by scraped_at desc))[1]         as open_price,
    max(high_price)                                             as high_price,
    min(low_price)                                              as low_price,
    (array_agg(last_price order by scraped_at desc))[1]         as close_price,
    max(volume)                                                 as volume   -- PSX volume is cumulative daily
  from price_ticks
  where (scraped_at at time zone 'Asia/Karachi')::date
        < (now() at time zone 'Asia/Karachi')::date
  group by symbol, (scraped_at at time zone 'Asia/Karachi')::date
  on conflict (symbol, trade_date) do nothing;

  -- Keep 30 days of raw ticks for the intraday charts
  delete from price_ticks where scraped_at < now() - interval '30 days';
end;
$$;

-- ============================================================
-- 4. Cron jobs (requires the pg_cron + pg_net extensions, enabled by
--    default on Supabase). REPLACE the placeholders before running.
-- ============================================================
-- Scrape every minute — the function self-guards PSX market hours,
-- so this is safe to leave running 24/7.
select cron.schedule(
  'scrape-psx-minutely',
  '* * * * *',
  $$ select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/scrape-psx',
       headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb) $$
);

-- Nightly rollup + retention at 00:30 PKT (19:30 UTC)
select cron.schedule(
  'rollup-price-ticks-nightly',
  '30 19 * * *',
  $$ select rollup_price_ticks(); $$
);

-- ============================================================
-- Useful checks after setup
-- ============================================================
-- select * from cron.job;                                          -- cron jobs registered?
-- select symbol, max(scraped_at) from price_ticks group by 1;      -- ticks arriving?
-- select * from cron.job_run_details order by start_time desc limit 10;  -- runs succeeding?
