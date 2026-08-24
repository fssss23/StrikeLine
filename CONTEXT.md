# StrikeLine — Complete Architecture & Context Documentation

> Last updated: June 13, 2026 (post-launch: pipeline live, WhatsApp verified, FCM deployed). This document describes how every part of StrikeLine is connected and how data flows through the system. Read this first before changing anything.

---

## 1. What StrikeLine Is

StrikeLine is a premium, light-theme fintech web app for **real-time price alerts on the Pakistan Stock Exchange (PSX)**. Users:

1. Search PSX securities and add them to a personal **watchlist**
2. Configure **support / resistance / breakout** price levels per security
3. Get notified (WhatsApp now; push/email planned) the moment a live price crosses a level

Live site: https://strike-line.vercel.app/

---

## 2. System Overview

```
                    ┌─────────────────────────────────────────────┐
                    │                 SUPABASE                     │
                    │                                             │
 ┌──────────┐ cron  │  ┌──────────────┐      ┌────────────────┐  │
 │ PSX DPS  │◄──────┼──│ scrape-psx   │─────►│  price_ticks   │  │
 │ website  │ fetch │  │ (edge fn)    │ insert└───────┬────────┘  │
 └──────────┘       │  └──────┬───────┘              │ realtime   │
                    │         │ chains               │ INSERT     │
                    │         ▼                      │ event      │
                    │  ┌──────────────┐              │            │
                    │  │evaluate-     │              │            │
 ┌──────────┐       │  │alerts        │──┐           │            │
 │ Fonnte   │◄──────┼──│ (edge fn)    │  │ insert    │            │
 │ WhatsApp │ send  │  └──────────────┘  ▼           │            │
 └──────────┘       │            ┌──────────────┐    │            │
                    │            │ alert_events │    │            │
                    │            └──────────────┘    │            │
                    │  ┌─────────────────────────┐   │            │
                    │  │ Postgres + RLS + Auth   │   │            │
                    │  └─────────────────────────┘   │            │
                    └────────────────┬───────────────┼────────────┘
                                     │ supabase-js   │ websocket
                                     ▼               ▼
                    ┌─────────────────────────────────────────────┐
                    │        REACT FRONTEND (Vite, Vercel)         │
                    │  React Query (server state) + Zustand (UI)  │
                    └─────────────────────────────────────────────┘
```

There is **no custom API server**. The frontend talks directly to Supabase (Postgres via PostgREST, Auth, Realtime). All writes are protected by Row Level Security. Background work happens in Supabase Edge Functions (Deno) triggered by cron.

**One extra hop not shown above**: PSX's firewall blocks AWS / most US-datacenter egress with HTTP 462, which includes Supabase. `scrape-psx` therefore fetches PSX through a tiny Cloudflare Worker relay (`cloudflare/psx-proxy-worker.js`). The worker tries its local colo first and falls back to a **Durable Object pinned to Western Europe** (`locationHint: 'weur'`, landed in Amsterdam — verified allowed by PSX). See §5.5.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Build | Vite 7 (strict ESM — **no `require()` anywhere**) |
| UI | React 19, React Router v6, TailwindCSS v3, Framer Motion |
| Charts | Recharts (custom candlestick rendering) |
| Forms | React Hook Form + Zod |
| Server state | TanStack React Query v5 |
| UI state | Zustand v5 |
| Toasts | Sonner |
| Icons | Lucide React (**only icon library permitted**) |
| Dates | date-fns |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) |
| Scrape relay | Cloudflare Worker + Durable Object (`cloudflare/`, deployed via wrangler) |
| Push | Firebase Cloud Messaging (HTTP v1 via `send-push` edge fn — **live**) |
| WhatsApp | Fonnte (PKR 500/month) — **live, verified end-to-end** |
| Email | Resend — **live** (`evaluate-alerts` → api.resend.com). Sandbox sender until a domain is verified: delivers only to the Resend account owner (`hammadjamal99@gmail.com`); every other recipient 403s. Set `RESEND_FROM` after verifying a domain. |
| Hosting | Vercel (frontend, GitHub auto-deploy) + Supabase (everything else) |

---

## 4. Database Schema

All tables live in Supabase Postgres with **RLS enabled**. Users only see their own rows; `securities` and `price_ticks` are readable by all authenticated users. A trigger (`on_auth_user_created`) auto-creates a `user_profiles` row on signup.

```sql
securities (
  symbol        text PK,          -- FULL PSX listing (~795 rows incl. 'KSE100');
  company_name  text,             -- seeded from dps.psx.com.pk/symbols, new listings
  sector        text              -- auto-discovered by scrape-psx snapshot runs
)

watchlist_items (
  id          uuid PK,
  user_id     uuid → auth.users,
  symbol      text → securities,
  sort_order  int,
  created_at  timestamptz,
  UNIQUE(user_id, symbol)
)

alert_rules (
  id                 uuid PK,
  user_id            uuid → auth.users,
  symbol             text → securities,
  support_level      float,  support_enabled    bool,
  resistance_level   float,  resistance_enabled bool,
  breakout_level     float,  breakout_enabled   bool,
  buffer_pct         float DEFAULT 0.5,
  cooldown_minutes   int   DEFAULT 240,
  updated_at         timestamptz,
  UNIQUE(user_id, symbol)
)

alert_events (
  id           uuid PK,
  user_id      uuid → auth.users,
  symbol       text,              -- NO FK (plain text)
  level_type   text,              -- 'support' | 'resistance' | 'breakout'
  level_value  float,
  actual_price float,
  push_status  text,              -- 'pending' | 'sent' | 'failed' | 'skipped'
  triggered_at timestamptz
)

price_ticks (
  symbol      text → securities,
  last_price  float,
  change_pct  float,
  change_abs  float,
  volume      bigint,             -- PSX cumulative daily volume
  open_price  float,
  high_price  float,
  low_price   float,
  scraped_at  timestamptz,
  PRIMARY KEY(symbol, scraped_at)
)
-- Tick cadence is TIERED (see §5.1): per-minute only for symbols on a
-- watchlist or alert rule (+KSE100); full-market snapshot every 30 min.

price_candles_daily (              -- nightly rollup target (supabase/setup.sql)
  symbol      text → securities,
  trade_date  date,
  open_price  float, high_price float, low_price float, close_price float,
  volume      bigint,
  PRIMARY KEY(symbol, trade_date)
)
-- rollup_price_ticks() runs nightly at 00:30 PKT: rolls completed days into
-- price_candles_daily and deletes raw ticks older than 30 days.

user_profiles (
  id                    uuid PK → auth.users,
  display_name          text,
  fcm_token             text,
  push_enabled          bool DEFAULT true,
  whatsapp_enabled      bool DEFAULT false,
  whatsapp_number       text,
  email_alerts_enabled  bool DEFAULT false,
  timezone              text DEFAULT 'Asia/Karachi',
  cooldown_minutes      int  DEFAULT 240,
  buffer_pct            float DEFAULT 0.5,
  market_digest_enabled bool DEFAULT false,   -- opt-in to the open/close WhatsApp digest
  is_admin              bool DEFAULT false,   -- can open /admin + call admin-api
  restricted            bool DEFAULT false    -- locked out of app; alerts skipped
)

digest_log (                      -- one row per user/session/day; service role only
  user_id     uuid → auth.users,
  session     text,              -- 'open' | 'close'
  trade_date  date,
  symbols     int, status text, sent_at timestamptz,
  PRIMARY KEY(user_id, session, trade_date)   -- this PK IS the double-send guard
)

app_settings (                    -- global flags, written ONLY by admin-api (service role)
  key         text PK,            -- 'whatsapp_enabled' | 'alerts_paused'
  value       jsonb,              -- boolean
  updated_at  timestamptz
)
-- RLS enabled with NO policies → invisible to clients; service-role functions
-- (evaluate-alerts reads, admin-api writes) bypass RLS. Seeded by
-- supabase/admin-setup.sql.
```

### ⚠️ Critical schema gotchas (these caused real production bugs)

1. **There is NO foreign key between `watchlist_items` and `alert_rules`.** PostgREST embeds like `watchlist_items.select('*, alert_rules(*)')` **fail with a 400** and kill the whole query. Always fetch `alert_rules` separately by `user_id` and merge on `symbol` in JS. (`useWatchlistQuery.js` does this correctly.)
2. **`alert_events.symbol` is plain text with no FK** — same rule: no embeds; company names are merged manually (`useAlertHistoryQuery.js`).
3. **`alert_events` column names**: `actual_price` (not `trigger_price`), `triggered_at` (not `created_at`), no `rule_id` column.
4. `watchlist_items → securities` FK **does** exist, so `securities(symbol, company_name, sector)` embeds are fine there.

---

## 5. Backend: Edge Functions (Deno, `supabase/functions/`)

### 5.1 `scrape-psx` — the data backbone

**Pipeline start.** Fetches https://dps.psx.com.pk/market-watch (via the relay when blocked, see §5.5) and inserts `price_ticks` rows, then chains `evaluate-alerts`.

- **Market-hours guard**: Mon–Thu 09:15–15:35 PKT; **Friday is dual-session** 09:15–12:05 and 14:30–16:35 (Jumma break). Override with `?force=true` for testing (force also implies a full snapshot).
- **Tiered tick strategy** (keeps free-tier row volume sane with ~795 securities):
  - every minute: ticks only for **active symbols** = anyone's `watchlist_items` ∪ `alert_rules` symbols + `KSE100`
  - every 30 minutes (PKT minute % 30 == 0): **full-market snapshot** (~490 ticks) so every stock shows a ≤30-min-fresh price in search/drawer
  - consequence: a stock nobody watches has up to 30 min price staleness until it's added to a watchlist
- **Auto-discovery**: snapshot runs upsert any PSX symbol not yet in `securities` (symbol + company name from the table's `data-title`, sector null) — new listings appear in search automatically
- **Triple-fallback parsing**: JSON response → embedded `__NEXT_DATA__` → server-rendered HTML `<table>` (column order: SYMBOL | SECTOR | LISTED IN | LDCP | OPEN | HIGH | LOW | **CURRENT** | CHANGE | CHANGE% | VOLUME)
- **`last_price` comes from CURRENT, never LDCP** — LDCP is *yesterday's* close; using it makes alerts evaluate stale prices
- Only inserts symbols that exist in `securities` (FK constraint on `price_ticks.symbol`)
- Best-effort fetches the **KSE-100 index** from https://dps.psx.com.pk/indices every run
- **Chains `evaluate-alerts`** at the end of every successful run so alerts fire on fresh data

**Cron jobs live in production**: `psx-scraper-cron` (minutely), `rollup-price-ticks-nightly`, `market-digest-open` / `-close-mon-thu` / `-close-fri`, `cleanup-digest-log-monthly`.

**Cron is already scheduled and live** (`psx-scraper-cron`, every minute — the function self-guards market hours). The SQL lives in `supabase/setup.sql` §4, which also schedules the nightly `rollup_price_ticks()` retention job at 00:30 PKT.

### 5.2 `evaluate-alerts` — the alert engine

Runs after each scrape (chained) or on its own schedule. **Self-guards** so it is safe to invoke any time:

- **Market-hours guard** (mirrors `scrape-psx`'s `isMarketOpen()`): returns `skipped/market_closed` outside PSX hours. *This is the fix for the after-hours WhatsApp spam* — previously a standalone `evaluate-alerts` cron kept re-evaluating the frozen closing price, re-firing the same alert every time the 4h cooldown lapsed (3 AM "THCCL hit support" messages).
- **Tick-freshness guard**: only considers ticks scraped within the last `FRESH_MINUTES` (15). A stale price can never trigger an alert even if the function is somehow called off-hours or the scraper stalls.
- **Global kill switches** (from `app_settings`, read defensively): `alerts_paused` halts everything; `whatsapp_enabled=false` skips WhatsApp dispatch globally (push/in-app unaffected). Toggled from the admin panel.
- **Restricted users** (`user_profiles.restricted`) are filtered out before evaluation — no events, no alerts.
- `?force=true` bypasses the market-hours + freshness guards (and the pause switch) for manual testing.

1. Loads all `alert_rules` with at least one level enabled (minus restricted users)
2. Loads the **latest fresh tick per symbol** (order by `scraped_at` desc, first-wins map)
3. Trigger conditions (buffer makes alerts fire as price *approaches* the level):
   - **Support**: `price <= support_level * (1 + buffer_pct/100)`
   - **Resistance**: `price >= resistance_level * (1 - buffer_pct/100)`
   - **Breakout**: `price >= breakout_level * (1 - buffer_pct/100)`
4. **Cooldown check**: skips if an `alert_events` row for the same user+symbol+level_type exists within `cooldown_minutes` (filter on `triggered_at`)
5. Inserts the `alert_events` row with `push_status: 'pending'`
6. Dispatches per enabled channel:
   - **WhatsApp via Fonnte** — `Authorization` header is the **raw token, no "Bearer" prefix**; body is **form-encoded** (`URLSearchParams`), `countryCode: '92'`. **Verified delivering end-to-end.**
   - **Web push via `send-push`** — invoked with the service role when the profile has `push_enabled` + an `fcm_token`
7. Sets the event's final `push_status`: `sent` if **any** channel delivered, `failed` if all attempted channels failed, `skipped` if no channel was enabled — the History page surfaces this

### 5.2b `market-digest` — open/close watchlist summary (WhatsApp)

One message per user per session, capped at 10 symbols in the user's own
watchlist order (`sort_order`).

- `?session=open` — previous day's close (from `price_candles_daily`) vs today's open (`price_ticks.open_price`)
- `?session=close` — today's open vs today's close (`price_ticks.last_price`)
- **Opt-in**: `user_profiles.market_digest_enabled`, default `false`. Also requires `whatsapp_enabled`, a number, and not `restricted`.
- **WhatsApp only.** A 10-row table is the wrong shape for a push banner, and email is sandbox-limited.
- **Idempotent**: `digest_log` has PK `(user_id, session, trade_date)` and the row is claimed *before* sending, so a cron misfire cannot double-send.
- Honours the `alerts_paused` and `whatsapp_enabled` global kill switches.
- Testing: `?force=true` skips the trading-day guard; `&date=YYYY-MM-DD` replays a past session (ignored without `force`); `&resend=true` overrides the double-send guard.
- Previous close comes from the rollup, never LDCP — the scraper deliberately never stores LDCP, and raw ticks for the prior session may be outside the 30-day retention.

### 5.3 `send-push` — FCM web push (HTTP v1)

- Implements Google OAuth itself (service-account JWT → access token, cached across warm invocations) and POSTs to `fcm.googleapis.com/v1/.../messages:send`
- Two callers: `evaluate-alerts` (service role, `{user_id, title, body}`) and the logged-in client (`{test: true}` — the drawer's "Send test notification" button, which is real now)
- Auto-clears expired device tokens (`UNREGISTERED`) from `user_profiles.fcm_token`
- Secret: `FIREBASE_SERVICE_ACCOUNT` = the full service-account JSON (set)

### 5.4 `delete-account` — true account deletion

Verifies the caller's JWT, deletes all their rows (`alert_events`, `alert_rules`, `watchlist_items`, `user_profiles`), then `auth.admin.deleteUser`. Users can only delete themselves. `AccountSection` calls it and falls back to client-side data deletion if undeployed.

### 5.5 PSX relay — `cloudflare/psx-proxy-worker.js`

PSX's firewall returns **HTTP 462** to AWS and most US-datacenter IPs — that killed direct fetches from Supabase **and** a Vercel function relay (`api/psx-proxy.js`, kept in the repo but unusable since Vercel = AWS). Cloudflare's European colos are allowed (verified MRS + AMS → 200), but a Worker runs in the colo nearest its *caller*, so calls from Supabase still egressed from blocked US IPs.

**Solution**: the worker tries PSX from its local colo first; on failure it relays through a **Durable Object created with `locationHint: 'weur'`** (sticky per name — currently in AMS). `?debug=1` (with key) reports ingress/exec colos and PSX status per hop. Managed by `cloudflare/wrangler.jsonc` (Smart Placement also enabled), deployed with `npx wrangler deploy --config cloudflare/wrangler.jsonc`. Access control is an `X-Proxy-Key` header — the worker secret `PROXY_KEY` must equal the Supabase secret `PSX_PROXY_KEY` (gotcha: two different names, one value). `scrape-psx` only uses the relay when `PSX_PROXY_URL` is set and the direct fetch fails.

Secrets summary (all set): `FONNTE_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`, `PSX_PROXY_URL`, `PSX_PROXY_KEY` (Supabase) · `PROXY_KEY` (Cloudflare worker).

### 5.6 `admin-api` — privileged backend for the admin panel

Single action-routed function (service role). Verifies the caller's JWT, checks `user_profiles.is_admin`, and 403s non-admins. It's the **only** way the frontend can read user emails (they live in `auth.users`, never exposed to clients) and write `app_settings` (RLS-locked). Actions (`POST { action, ... }`):

- `overview` — stats (users/admins/restricted, active levels, watchlist items, alerts today + sent/failed), scraper health (last scrape time, ticks in last run, market-open, server PKT), and current global settings
- `list_users` — every user merged from `auth.admin.listUsers()` + `user_profiles` + per-user watchlist/level counts and last alert
- `set_user_flag` — `{ user_id, field: 'restricted'|'is_admin', value }` (cannot change your own flags — anti-lockout)
- `set_setting` — `{ key: 'whatsapp_enabled'|'alerts_paused', value }` (the global kill switches)
- `recent_events` — last 50 `alert_events` across all users, with email

Deploy: `npx supabase functions deploy scrape-psx evaluate-alerts send-push delete-account admin-api --project-ref <ref> --use-api`

---

## 6. Frontend Architecture

### 6.1 Source layout (`src/`)

```
main.jsx                 Entry: ErrorBoundary → App
App.jsx                  QueryClientProvider → Router → routes + SecurityDrawer + Toaster
index.css                Tailwind + custom keyframes (price flash, sliders)

lib/
  supabase.js            Supabase client (VITE_SUPABASE_URL / _ANON_KEY)
  firebase.js            FCM init with guards (push pending)
  queryClient.js         React Query config (1min staleTime, no refetch-on-focus)
  utils.js               cn() = clsx + tailwind-merge

store/  (Zustand — UI state ONLY, never server data)
  useUserStore.js        session/user/auth listener + refreshProfile()
  useWatchlistStore.js   drawer open/symbol + updatePrice() cache patcher

hooks/
  useDrawer.js           Drawer state + per-symbol security query
  useActiveAlerts.js     Count of enabled levels across the watchlist
  useRealtimePrices.js   Supabase Realtime subscription on price_ticks INSERT
  useRealtimeAlerts.js   Realtime alert_events INSERT → in-app Sonner toast
                         + invalidates ['alert-history'] / ['last-triggered']
  usePriceFlash.js       Green/red flash class on price change (800ms)
  useMarketStatus.js     PSX open/pre-open/closed clock logic
  usePushNotifications.js Mounted in AppShell: silent FCM token refresh when
                         permission already granted; exports registerPushDevice()
                         (permission prompt + token save) used by the Settings
                         push toggle
  queries/
    useWatchlistQuery.js     useWatchlist + add/remove mutations
    useAlertRuleQuery.js     useUpdateAlertRule (upsert on user_id,symbol)
    useAlertHistoryQuery.js  alert_events + merged company names
    useCandlestickQuery.js   price_ticks → OHLC buckets per timeframe
    useLastTriggeredQuery.js latest alert_event per level type for one symbol
                             (feeds the real "Last triggered: X ago" rows)
    useAdminQuery.js         admin-api calls (overview/users/events queries +
                             set_user_flag / set_setting mutations)

components/
  layout/      AppShell (auth guard, realtime, page titles, restricted-account
               lockout screen, route-enter animation, pb-nav scroll padding),
               Sidebar (navy gradient, layoutId active pill + rail, market-status
               footer), TopBar (SEPARATE mobile + desktop headers — mobile is a
               frosted title-led bar, desktop is the classic row; both share the
               KSE-100 chip / bell / avatar), MobileNav (floating pill navbar —
               see §6.8). Admin entry shown only when user.is_admin
  admin/       AdminStats (stat cards + scraper-health), AdminControls (global
               WhatsApp + pause kill switches), AdminUsersTable (search, restrict,
               grant admin — cards on mobile, table on md+), AdminRecentEvents (same)
  search/      SearchBar (debounced ilike query, clear button, inline spinner),
               SearchDropdown
  watchlist/   WatchlistTable (skeleton/error/empty + desktop column header),
               WatchlistRow (React.memo; renders a mobile CARD and a desktop
               TABLE ROW from one component; shows "% above/below nearest level",
               amber when within 1%), AlertLevelBadge, WatchlistEmpty
  drawer/      SecurityDrawer (480px rail on desktop / 93dvh sheet with
               flick-to-dismiss on mobile), DrawerHeader (price + real
               Open/High/Low/Volume from the latest tick), CandlestickChart,
               ChartTimeToggle, AlertConfigForm (sticky in-drawer save bar),
               AlertLevelRow, DrawerOverlay
  dashboard/   SummaryCards (4 live-stat cards; 2-col on mobile, 4-col on xl)
  history/     HistoryFilterBar (segmented controls + collapsible advanced panel
               on mobile), HistoryTable (cards on mobile / grid table on md+,
               windowed pagination), HistoryRow (expandable)
  settings/    NotificationChannels, AlertDefaults, AccountSection (all controlled)
  ticker/      MarketTicker (signed-out brand strip — symbols only, never prices)
  ui/          PRIMITIVES — Button, Input, Badge, Toggle, PriceChange, Skeleton,
               MarketStatusBadge, Card/CardHeader/CardBody, PageHeader,
               States (EmptyState + ErrorState), Modal (portalled; centred on
               desktop, bottom sheet on mobile)
  logo/        StrikeLineLogo (full | mark | inverse)
  ErrorBoundary.jsx   Root-level fallback (retry / reload / show details)

pages/
  LoginPage    DashboardPage    WatchlistPage    AlertHistoryPage    SettingsPage
  AdminPage    (admin-only, gated by <AdminRoute> + user.is_admin)
```

### 6.2 State management split (important)

- **React Query owns ALL server data.** Query keys: `['watchlist']`, `['drawer-security', symbol, userId]`, `['alert-history']`, `['candlesticks', symbol, timeframe]`, `['kse-100']`.
- **Zustand owns UI state only**: which drawer is open (`useWatchlistStore`) and the auth session (`useUserStore`).
- Live prices arrive via Realtime and are **patched into React Query caches** (`useWatchlistStore.updatePrice`) — they never live in Zustand themselves.

### 6.3 Auth flow (three-state pattern)

`useUserStore.session` has three meaningful values:

| Value | Meaning | UI |
|---|---|---|
| `undefined` | still loading | full-screen spinner (App.jsx) |
| `null` | logged out | redirect to `/login` |
| `Session` object | logged in | render app |

`initializeAuth()` runs once from `App.jsx`: gets the initial session, then subscribes to `onAuthStateChange`. `setSession()` also fetches the `user_profiles` row and merges it into `user` (so `user.display_name`, `user.whatsapp_enabled`, etc. are always available). `AppShell` has a second listener that redirects to `/login` on sign-out. Logout = `supabase.auth.signOut()` (Sidebar).

### 6.4 Routing

```
/login        LoginPage (redirects to / when already authed)
/             AppShell (auth-guarded layout: Sidebar + TopBar + MobileNav)
  ├─ index    DashboardPage   (search, summary cards, watchlist)
  ├─ watchlist WatchlistPage  (full watchlist + search)
  ├─ history  AlertHistoryPage (filterable event log + CSV export)
  ├─ settings SettingsPage    (channels, defaults, account)
  └─ admin    AdminPage       (admin-only via <AdminRoute>; non-admins → /)
*             redirect to /
```

`SecurityDrawer` is mounted **once at the App root, outside `<Routes>`** — it can open from any page without remounting.

### 6.5 The core UX flow: search → drawer → watchlist → alerts

1. **`SearchBar`** debounces 300ms, queries `securities` with `ilike` on symbol/company name, enriches results with latest `price_ticks`. Clicking a result **only opens the drawer** (never auto-adds to watchlist).
2. **`useDrawer`** fires three parallel queries for the symbol: security row, latest tick, and the user's `alert_rule` — so the drawer works for **any** symbol, watched or not.
3. **`SecurityDrawer`** (Framer Motion: right slide-in desktop / bottom sheet mobile with drag-to-dismiss) shows:
   - `DrawerHeader` — name, symbol, sector, live price with flash animation
   - **Watchlist toggle** — checks `useWatchlist` for membership; insert/delete on `watchlist_items`
   - `CandlestickChart` — real OHLC bucketed from `price_ticks` (1D=5min, 1W=1h, 1M=4h buckets) with S/R/B reference lines from the alert rule
   - `AlertConfigForm` — React Hook Form + Zod (cross-field: R > S, B > R); pre-filled from `alert_rule` via `reset()` when the data loads; saves with an **upsert on `(user_id, symbol)`**, then invalidates `['watchlist']` and `['drawer-security', symbol]`
4. **Watchlist rows** click-through back to the same drawer.

### 6.6 Live price pipeline (frontend side)

```
price_ticks INSERT (from scraper)
  → Supabase Realtime websocket (useRealtimePrices, subscribed in AppShell)
    → useWatchlistStore.updatePrice(symbol, price, pct, abs)
      → patches ['watchlist'] rows
      → patches ['drawer-security', symbol] (open drawer updates live)
      → patches ['kse-100'] when symbol === 'KSE100'
        → usePriceFlash detects the change → green/red flash for 800ms
```

### 6.7 Error handling & loading conventions

- Every Supabase call is wrapped (try/catch in mutations, `error` from useQuery); failures log `error.message` and show a Sonner toast
- Lists show **skeleton loaders** while fetching and an **error card with "Try Again"** (refetch) on failure
- Root `ErrorBoundary` catches render crashes with a retry button
- Supabase responses are never trusted to be arrays: always `data || []` / `?.` before `.map/.some/.filter`
- Empty / error states come from `ui/States.jsx` (`EmptyState`, `ErrorState`) so every screen fails the same way

### 6.8 Mobile shell (the pill navbar)

Mobile is the primary surface, so the chrome is purpose-built rather than a squeezed desktop layout:

```
┌─────────────────────────────────┐
│ ⎯/ Watchlist        KSE ▲0.4% 🔔 ●│  frosted header (58px + safe-top)
│    ● PSX Open                    │
├─────────────────────────────────┤
│                                  │
│   scrollable content (pb-nav)    │
│                                  │
│        ╭──────────────────────╮  │
│        │ ⌂  ▣ Watchlist  ⏱  ⚙ │  │  floating pill nav
│        ╰──────────────────────╯  │
└─────────────────────────────────┘
```

- `MobileNav` is a **floating frosted pill** (`sl-glass-strong` + `shadow-pillnav`), not a full-width bar. Inactive destinations are icon-only; the active one expands to icon + label inside a navy pill.
- That pill is a **single shared element animated with `layoutId="mobile-nav-pill"`**, so switching tabs slides rather than cuts. Do not give each item its own background.
- It clears the iOS home indicator via `pb-safe`; pages reserve room with `pb-nav` (`--pillnav-h: 76px`, defined in `index.css`).
- Z-order: mobile header `z-20` · pill nav `z-30` · drawer overlay `z-50` · drawer `z-[60]` · modals `z-[70]`. Sonner toasts are lifted with `mobileOffset` so they never land on the nav.
- Anything `position: fixed` inside a page (settings save bar, modals) must be **portalled to `document.body`** — page-enter animations transform the ancestor.

---

## 7. Design System (strict)

| Token | Value |
|---|---|
| Page bg | `#F8F9FB` · Card `#FFFFFF` · Border `#E4E7ED` |
| Primary navy | `#0D2F55` (hover `#1A4A7A`) · Accent blue `#2563EB` |
| Text | primary `#0F172A` · secondary `#64748B` |
| Signal green | `#16A34A` / bg `#F0FDF4` (support, up) |
| Signal red | `#DC2626` / bg `#FEF2F2` (resistance, down) |
| Signal amber | `#D97706` / bg `#FFFBEB` (breakout) |
| Radius | cards 16px (`rounded-xcard`) · inputs 10px · pills 999px |
| Font | Inter 400–800 (Google Fonts); **tabular-nums on every price** |
| Elevation | `shadow-card` → `raised` → `lifted` → `drawer` / `pillnav` (layered, low-opacity — never a single hard shadow) |
| Gradients | `bg-navy-gradient` (sidebar, active nav pill, navy CTAs) · `bg-blue-gradient` (primary CTAs) |

Logo: horizontal navy line struck through by a blue diagonal, square caps, no fills/gradients (`public/favicon.svg`, `StrikeLineLogo` component; inverse variant for navy backgrounds).

### Shared classes (`src/index.css`, `@layer components` / `@layer utilities`)

`sl-card` · `sl-card-interactive` · `sl-glass` / `sl-glass-strong` (frosted chrome)
`sl-eyebrow` (10px uppercase label) · `sl-num` (tabular + tight tracking) · `sl-tap` (44px-friendly press feedback)
`pt-safe` / `pb-safe` / `bottom-safe` (iOS insets) · `pb-nav` / `bottom-nav` (clear the floating pill nav) · `no-scrollbar`

⚠️ These are **component-layer classes, so `md:sl-card` does NOT compile** — write the responsive form out in raw utilities (see `WatchlistTable`).
⚠️ Tailwind animations use `animation-fill-mode: backwards`, never `both`: a retained `transform` turns the element into the containing block for any `position: fixed` descendant. Modals and the settings save bar are additionally portalled to `document.body`.

### Hard rules (never violate)

1. **Light theme only** — no dark mode, no `dark:` classes
2. **`import.meta.env.VITE_*` only** — never `process.env`
3. **No `<form>` elements** — submit via onClick (`handleSubmit(onSubmit)` from RHF works fine on a button)
4. **No axios** — all HTTP through supabase-js
5. **Lucide is the only icon library**
6. **`WatchlistRow` stays wrapped in `React.memo`** with a custom comparator (symbol/price/change_pct/alert_rule)
7. No localStorage (except Supabase's own session persistence)
8. No mock data in production paths (the only generated value left is none — chart volume is real)
9. Functional components only (ErrorBoundary excepted)
10. **Mobile is a first-class target, not a breakpoint.** Every tappable element clears ~44px, text inputs are ≥16px on mobile (iOS zooms below that), tables become cards, and nothing may sit under the floating pill nav — use `pb-nav` / `bottom-nav`
11. `index.html` must keep `viewport-fit=cover`, or every `env(safe-area-inset-*)` resolves to 0 and the pill nav collides with the home indicator

---

### 7.1 Supabase Auth URL configuration (bites hard when wrong)

```
site_url       https://strike-line.vercel.app
uri_allow_list https://strike-line.vercel.app/**,http://localhost:5173/**,http://localhost:3000/**
```

⚠️ **An empty `uri_allow_list` silently breaks every email link.** Supabase does
not error on a non-allow-listed `redirectTo` — it falls back to `site_url`.
Until 2026-08-24 the allow-list was empty and `site_url` was
`http://localhost:3000` (scaffold residue; Vite serves 5173), so every password
reset landed on a dead port no matter where it was requested from.

Read/write it with the Management API — the CLI's PAT lives in the Windows
Credential Manager under target `Supabase CLI:supabase` (UTF-8 blob, not UTF-16):

```
GET/PATCH https://api.supabase.com/v1/projects/<ref>/config/auth
```

`supabase config push` is NOT a safe substitute: with no local `config.toml` it
would reset every unspecified auth setting to CLI defaults.

⚠️ **Auth email is capped at 2 per hour** on Supabase's shared SMTP, and the cap
cannot be raised — `PATCH rate_limit_email_sent` returns
*"Custom SMTP required to configure RATE_LIMIT_EMAIL_SENT"*. This makes password
reset **look** broken while testing: the 3rd request in an hour silently sends
nothing. `smtp_max_frequency` was lowered 60s → 10s, which is all that can be
tuned without custom SMTP.

Removing the cap means pointing Supabase at Resend as custom SMTP — which needs
a **verified Resend domain** first, since the sandbox sender only delivers to
the Resend account owner. That one domain verification unlocks alert emails,
auth emails, and the rate cap together.

Recovery links are **single-use**. Clicking one twice logs
`403 "One-time token not found"`, which reads like a broken link but is not.

---

## 8. Environment Variables

Frontend (`.env`, all `VITE_`-prefixed, safe-to-expose keys; **restart the dev server after editing — Vite does not hot-reload .env**). All values are filled and live (Firebase project `strikeline-ee98e`); the same Firebase web config is **inlined in `public/firebase-messaging-sw.js`** because service workers can't read Vite env — keep the two in sync:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FIREBASE_API_KEY=...           (all Firebase vars set — push is live)
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

Note: `.env` is committed to the (private) repo and gitignored only for future changes; Vercel builds read it from the repo. The same vars are also set in Vercel project env settings.

Edge function secrets (server-side, `supabase secrets set` — **all set**):

```
FONNTE_TOKEN=...              # WhatsApp dispatch
RESEND_API_KEY=...            # email alerts (set 2026-08-24)
FIREBASE_SERVICE_ACCOUNT=...  # full service-account JSON for FCM HTTP v1
PSX_PROXY_URL=...             # Cloudflare worker relay URL
PSX_PROXY_KEY=...             # must equal the worker's PROXY_KEY secret
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected
```

---

## 9. Build, Run, Deploy

```bash
npm run dev          # http://localhost:5173
npm run build        # production build → dist/ (vendor-split chunks)
npm run preview      # preview the production build

# Edge functions (Supabase CLI is authenticated on this machine)
npx supabase functions deploy <name> --project-ref <ref> --use-api

# PSX relay worker (wrangler is authenticated on this machine)
npx wrangler deploy --config cloudflare/wrangler.jsonc

# Frontend (Vercel CLI authenticated; project linked in .vercel/)
npx vercel --prod --yes
```

- ✅ **Vercel DOES auto-deploy on push to `main`** (verified 2026-08-24 against the live bundle). The old "integration isn't connected" note was stale and caused wrong deploy advice — trust the live site, not this line.
- `vercel.json` pins functions to `bom1` and has the SPA rewrite; `api/psx-proxy.js` exists but is unused (PSX blocks AWS egress).
- One-time DB setup lives in `supabase/setup.sql` (KSE100 seed, realtime publication for `price_ticks` + `alert_events`, `price_candles_daily` + retention, cron jobs) — **already run in production**.
- Bundle is code-split via `manualChunks` in `vite.config.ts` (react / recharts / supabase / firebase / framer-motion vendors)
- `tsconfig.json` excludes `supabase/` — edge functions are Deno, not browser TS (`supabase/functions/deno.json` configures the Deno side); the IDE shows phantom `Deno`/esm.sh errors there — ignore them

---

## 10. PSX Market Facts

- Exchange: Pakistan Stock Exchange, Karachi · Index: KSE-100
- Trading (PKT, UTC+5, no DST): Mon–Thu 09:15–15:30 · **Friday dual session 09:15–12:00 and 14:30–16:30** (Jumma break) · Pre-open 09:00–09:15
- Currency: PKR, always 2 decimals, comma separators, tabular-nums
- Scrape sources: https://dps.psx.com.pk/market-watch (HTML table, ~490 active rows), /indices (KSE-100), /symbols (full listing JSON — used for the one-time seed)
- `securities` holds the **entire PSX listing** (~795 equities/ETFs, debt instruments excluded), auto-extended by scraper discovery
- ⚠️ PSX renames symbols: ENGRO→**ENGROH**, ICI→**LCI**, UNILEVER→**UPFL** already happened. A renamed symbol's old `securities` row goes dead (no more ticks) — the stale `ENGRO` row still exists.
- ⚠️ PSX firewall blocks AWS/US-datacenter IPs (HTTP 462) — never assume a new backend host can fetch dps.psx.com.pk directly; see §5.5

---

## 11. Where to Go Next

See **ROADMAP.md** for the prioritized backlog. **The pipeline is live end-to-end**: cron scrapes every minute through the Cloudflare relay, alerts evaluate on fresh data, and WhatsApp delivery is verified (`push_status: sent`). FCM push is fully deployed server-side; it activates per device when the user enables the Settings push toggle (browser permission → token saved to `user_profiles.fcm_token`).

Top remaining items: connect Vercel's GitHub integration (deploys are manual right now), WhatsApp OTP verification, point long chart timeframes at `price_candles_daily`, scraper health monitoring, drag-to-reorder watchlist.
