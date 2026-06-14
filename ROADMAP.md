# StrikeLine Roadmap

Prioritized future work. Items at the top unlock the most value.
✅ = code is in the repo; the item may still need a deploy / SQL run / secret (see OPERATOR CHECKLIST below).

## P0 — Required for the product to deliver alerts end-to-end

- [ ] **Deploy and schedule `scrape-psx`** — the function exists (`supabase/functions/scrape-psx`). Deploy it (`supabase functions deploy scrape-psx`) and run section 4 of `supabase/setup.sql` to create the cron job. Without this there are no live prices and no alerts. Test manually first with `?force=true`.
- [ ] **Seed `KSE100` into `securities`** — SQL ready in `supabase/setup.sql` section 1. Run it.
- [ ] **Verify Fonnte WhatsApp delivery** — `evaluate-alerts` uses the correct raw-token auth and form body. Send a real test against a verified device number.

## P1 — Notification completeness

- [x] ✅ **`send-push` edge function (FCM)** — implemented at `supabase/functions/send-push/index.ts` using the FCM HTTP v1 API (OAuth via service-account JWT, token cached across warm invocations, stale device tokens auto-cleared). `evaluate-alerts` now dispatches push alongside WhatsApp, and the drawer's "Send test notification" button calls it for real. **Needs**: Firebase project, `FIREBASE_SERVICE_ACCOUNT` secret, deploy.
- [x] ✅ **`firebase-messaging-sw.js` service worker** — template in `public/`; fill in the Firebase web config placeholders (service workers can't read Vite env vars). Handles background notifications + click-through to /history.
- [ ] **WhatsApp number verification (OTP)** — small edge function that sends a one-time code via Fonnte and a `whatsapp_verified` flag on `user_profiles`. The Settings UI currently accepts any number unverified.
- [ ] **Email alerts via Resend** — `email_alerts_enabled` is already stored; add a Resend dispatch branch in `evaluate-alerts` plus an unsubscribe link handler.

## P2 — Product depth

- [x] ✅ **Track `last_triggered` per level** — derived from `alert_events` (no schema change): `useLastTriggeredQuery.js` fetches the latest event per level type and `AlertLevelRow` now shows real "Last triggered: X ago" data.
- [x] ✅ **Percent-from-level indicator** — watchlist rows show "2.3% above support" under the price (amber when within 1%), so users can see which alerts are close to firing.
- [x] ✅ **Price-tick retention policy** — `supabase/setup.sql` section 3 creates `price_candles_daily`, a nightly `rollup_price_ticks()` rollup, and 30-day raw-tick retention. **Needs**: run the SQL. (Follow-up: point the chart's long timeframes at `price_candles_daily` once it accumulates history.)
- [ ] **Drag-to-reorder watchlist** — `watchlist_items.sort_order` exists and the drag handle is already rendered in `WatchlistRow`; wire up Framer Motion `Reorder` + a `sort_order` update mutation. (Take care to preserve the `React.memo` comparator on `WatchlistRow`.)
- [ ] **Alert previews on chart** — let users drag the S/R/B reference lines on the candlestick chart to set levels visually.

## P3 — Platform & polish

- [x] ✅ **Realtime channel for `alert_events`** — `useRealtimeAlerts.js` (mounted in AppShell) toasts in-app the moment an alert fires and refreshes History. **Needs**: `supabase/setup.sql` section 2 (adds `alert_events` to the realtime publication).
- [x] ✅ **Account deletion server-side** — `supabase/functions/delete-account/index.ts` deletes all user data + the auth user (caller can only delete themselves). Settings falls back to client-side data deletion if the function isn't deployed. **Needs**: deploy.
- [ ] **iOS push support** — Safari PWA web push (iOS 16.4+); needs the PWA installed to home screen, the existing manifest (done) and the service worker (template done — fill config).
- [x] ✅ **Admin / scraper health dashboard** — `/admin` page (admin-only via `user_profiles.is_admin`), backed by the `admin-api` edge function. Shows system stats, scraper health (last scrape, ticks/run, stall detection), global alert kill switches (WhatsApp + pause-all, stored in `app_settings`), a searchable users table (emails, channels, restrict/unrestrict, grant admin), and a recent-alerts feed. **Needs**: run `supabase/admin-setup.sql`, deploy `admin-api`, redeploy `evaluate-alerts`.
- [ ] **E2E smoke tests** — Playwright: login → search → open drawer → add to watchlist → set alert → verify rule row in DB.

## OPERATOR CHECKLIST (manual steps — in order)

1. **Run `supabase/setup.sql`** in the Supabase SQL editor (fill in `<project-ref>` + `<service-role-key>` in section 4 first). Covers: KSE100 seed, realtime publication, candles/retention, cron jobs.
2. **Deploy functions**: `supabase functions deploy scrape-psx evaluate-alerts send-push delete-account admin-api`

### Admin panel + after-hours alert fix (June 14, 2026)

1. **Run `supabase/admin-setup.sql`** — adds `is_admin`/`restricted` columns, the `app_settings` table (+ seeds the WhatsApp/pause switches), and makes the owner an admin. Edit the email in section 3 if needed.
2. **Redeploy `evaluate-alerts`** — now self-guards market hours + tick freshness, so it never fires on the frozen closing price after the market closes (this was the 3 AM "THCCL hit support" spam). Also honours the global kill switches and skips restricted users.
3. **Deploy `admin-api`** — `supabase functions deploy admin-api`.
4. **Remove the stray cron (optional but recommended)** — run the diagnostic in `admin-setup.sql` §4: `select jobname, schedule, command from cron.job;`. If a job POSTs to `/functions/v1/evaluate-alerts` directly, that's what fired alerts after hours. The function now self-guards so it's harmless, but `select cron.unschedule('<jobname>');` stops the wasted invocations — the `scrape-psx` chain still evaluates alerts on fresh ticks.
3. **Smoke-test the scraper**: `curl -X POST "https://<project-ref>.supabase.co/functions/v1/scrape-psx?force=true" -H "Authorization: Bearer <service-role-key>"` then check `price_ticks` has fresh rows.
   - **If PSX returns 462** (its firewall blocks Supabase egress IPs): deploy `cloudflare/psx-proxy-worker.js` as a free Cloudflare Worker (instructions in the file header), then set `PSX_PROXY_URL` + `PSX_PROXY_KEY` as Supabase secrets and redeploy `scrape-psx`. The function tries direct first and falls back to the proxy automatically.
4. **Fonnte**: `supabase secrets set FONNTE_TOKEN=...`, enable WhatsApp on your profile with your number, set a level that's guaranteed to trigger, confirm the message arrives and History shows `sent`.
5. **Firebase (push)**: create a Firebase project → enable Cloud Messaging → generate a Web Push certificate (VAPID key) → fill the `VITE_FIREBASE_*` vars in `.env` and Vercel → fill the same config into `public/firebase-messaging-sw.js` → download a service-account JSON → `supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)"` → redeploy `send-push`. Test with the drawer's "Send test notification" button.

## Known intentional gaps

- Candlestick volume is the PSX cumulative daily figure captured per bucket, not per-bucket traded volume.
- KSE-100 badge hides itself when no `KSE100` ticks exist (by design — no fake data).
- The chart still buckets from raw `price_ticks`; once `price_candles_daily` has history, 1M+ timeframes should read from it.
