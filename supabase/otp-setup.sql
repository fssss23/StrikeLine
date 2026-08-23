-- StrikeLine — WhatsApp OTP verification setup
-- Run in the Supabase SQL editor AFTER supabase/setup.sql and
-- supabase/admin-setup.sql. Idempotent — safe to re-run.
--
-- Adds: a whatsapp_verified flag on user_profiles, a service-role-only
-- otp_codes table, phone normalisation for existing rows, and a nightly
-- cleanup job. All OTP reads/writes go through the `whatsapp-otp` edge
-- function (service role) — the client never sees a code or a hash.

-- ============================================================
-- 1. Verification state on user_profiles
--    whatsapp_verified → the number was confirmed by an OTP we sent.
--    evaluate-alerts refuses to dispatch WhatsApp unless this is true, so a
--    typo'd number can never silently send someone else's alerts to a stranger.
-- ============================================================
alter table user_profiles add column if not exists whatsapp_verified    boolean not null default false;
alter table user_profiles add column if not exists whatsapp_verified_at timestamptz;

-- ============================================================
-- 2. Normalise existing numbers to the canonical Fonnte target format.
--    Canonical = 10 digits, '3' + 9 more (Pakistani mobile, no country code,
--    no leading zero). Fonnte is called with countryCode: '92' alongside it.
--    Anything that can't be normalised is left alone and simply won't verify.
-- ============================================================
update user_profiles
set whatsapp_number = sub.normalised
from (
  select
    id,
    case
      when regexp_replace(whatsapp_number, '\D', '', 'g') ~ '^00923\d{9}$'
        then substring(regexp_replace(whatsapp_number, '\D', '', 'g') from 5)
      when regexp_replace(whatsapp_number, '\D', '', 'g') ~ '^923\d{9}$'
        then substring(regexp_replace(whatsapp_number, '\D', '', 'g') from 3)
      when regexp_replace(whatsapp_number, '\D', '', 'g') ~ '^03\d{9}$'
        then substring(regexp_replace(whatsapp_number, '\D', '', 'g') from 2)
      when regexp_replace(whatsapp_number, '\D', '', 'g') ~ '^3\d{9}$'
        then regexp_replace(whatsapp_number, '\D', '', 'g')
      else null
    end as normalised
  from user_profiles
  where whatsapp_number is not null and whatsapp_number <> ''
) as sub
where user_profiles.id = sub.id
  and sub.normalised is not null
  and user_profiles.whatsapp_number is distinct from sub.normalised;

-- ============================================================
-- 3. GRANDFATHER CLAUSE — runs exactly once, ever.
--    Accounts that already had WhatsApp switched on with a usable number were
--    receiving alerts before verification existed. Flipping them to unverified
--    would silently cut off live alerts, so they are trusted once here.
--
--    Guarded by an app_settings marker rather than a "remember to delete this"
--    comment: on any later re-run the marker already exists and the update is
--    skipped, so a newly-added unverified number can never be granted a free
--    pass by someone replaying this file.
-- ============================================================
do $$
begin
  if not exists (select 1 from app_settings where key = 'otp_grandfathered') then

    update user_profiles
    set whatsapp_verified = true,
        whatsapp_verified_at = coalesce(whatsapp_verified_at, now())
    where whatsapp_enabled = true
      and whatsapp_number ~ '^3\d{9}$'
      and whatsapp_verified = false;

    raise notice 'Grandfathered % existing WhatsApp number(s) as verified', (
      select count(*) from user_profiles where whatsapp_verified = true
    );

    insert into app_settings (key, value)
    values ('otp_grandfathered', 'true'::jsonb)
    on conflict (key) do nothing;

  else
    raise notice 'Grandfather clause already applied — skipping';
  end if;
end $$;

-- ============================================================
-- 4. OTP codes
--    Codes are never stored in plaintext — code_hash is a SHA-256 of
--    "<pepper>:<purpose>:<user_id>:<code>" computed inside the edge function.
--    RLS is enabled with NO policies, so anon/authenticated clients cannot read
--    or write this table at all; only the service role can.
-- ============================================================
create table if not exists otp_codes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  purpose     text not null check (purpose in ('whatsapp_verify', 'password_reset', 'password_change')),
  phone       text not null,
  code_hash   text not null,
  attempts    int  not null default 0,
  consumed_at timestamptz,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Newest-first lookup per (user, purpose) — the only read pattern there is
create index if not exists otp_codes_lookup_idx on otp_codes (user_id, purpose, created_at desc);
-- Send-throttle window checks
create index if not exists otp_codes_phone_idx  on otp_codes (phone, created_at desc);
-- Cleanup sweep
create index if not exists otp_codes_expiry_idx on otp_codes (expires_at);

alter table otp_codes enable row level security;
-- (intentionally no policies → service role only, like app_settings)

-- ============================================================
-- 5. Retention — codes are short-lived; keep nothing older than a day.
-- ============================================================
create or replace function cleanup_otp_codes()
returns void
language sql
security definer
set search_path = public
as $$
  delete from otp_codes where created_at < now() - interval '24 hours';
$$;

-- Nightly at 00:45 PKT (19:45 UTC), just after the price rollup
select cron.schedule(
  'cleanup-otp-codes-nightly',
  '45 19 * * *',
  $$ select cleanup_otp_codes(); $$
);

-- ============================================================
-- Useful checks after setup
-- ============================================================
-- select id, whatsapp_number, whatsapp_enabled, whatsapp_verified from user_profiles;
-- select purpose, phone, attempts, consumed_at, expires_at from otp_codes order by created_at desc limit 20;
-- select jobname, schedule from cron.job order by jobname;
