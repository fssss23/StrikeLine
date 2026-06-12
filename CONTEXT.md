# StrikeLine — Complete Architecture & Context Documentation

> Last updated: June 2026. This document describes how every part of StrikeLine is connected and how data flows through the system. Read this first before changing anything.

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
| Push (planned) | Firebase Cloud Messaging |
| WhatsApp | Fonnte (PKR 500/month) |
| Email (planned) | Resend |
| Hosting | Vercel (frontend, GitHub auto-deploy) + Supabase (everything else) |

---

## 4. Database Schema

All tables live in Supabase Postgres with **RLS enabled**. Users only see their own rows; `securities` and `price_ticks` are readable by all authenticated users. A trigger (`on_auth_user_created`) auto-creates a `user_profiles` row on signup.

```sql
securities (
  symbol        text PK,          -- e.g. 'OGDC', 'LUCK' (40 seeded + optionally 'KSE100')
  company_name  text,
  sector        text
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
  buffer_pct            float DEFAULT 0.5
)
```

### ⚠️ Critical schema gotchas (these caused real production bugs)

1. **There is NO foreign key between `watchlist_items` and `alert_rules`.** PostgREST embeds like `watchlist_items.select('*, alert_rules(*)')` **fail with a 400** and kill the whole query. Always fetch `alert_rules` separately by `user_id` and merge on `symbol` in JS. (`useWatchlistQuery.js` does this correctly.)
2. **`alert_events.symbol` is plain text with no FK** — same rule: no embeds; company names are merged manually (`useAlertHistoryQuery.js`).
3. **`alert_events` column names**: `actual_price` (not `trigger_price`), `triggered_at` (not `created_at`), no `rule_id` column.
4. `watchlist_items → securities` FK **does** exist, so `securities(symbol, company_name, sector)` embeds are fine there.

---

## 5. Backend: Edge Functions (Deno, `supabase/functions/`)

### 5.1 `scrape-psx` — the data backbone

**Pipeline start.** Fetches https://dps.psx.com.pk/market-watch and inserts one `price_ticks` row per tracked symbol.

- **Market-hours guard**: skips outside Mon–Fri 09:15–15:35 PKT (override with `?force=true` for testing)
- **Triple-fallback parsing**: JSON response → embedded `__NEXT_DATA__` → server-rendered HTML `<table>` (column order: SYMBOL | SECTOR | LISTED IN | LDCP | OPEN | HIGH | LOW | **CURRENT** | CHANGE | CHANGE% | VOLUME)
- **`last_price` comes from CURRENT, never LDCP** — LDCP is *yesterday's* close; using it makes alerts evaluate stale prices
- Only inserts symbols that exist in `securities` (FK constraint on `price_ticks.symbol`)
- Best-effort fetches the **KSE-100 index** from https://dps.psx.com.pk/indices — only inserted if a `KSE100` row is seeded in `securities`
- **Chains `evaluate-alerts`** at the end of every successful run so alerts fire on fresh data

Cron setup (run once in the Supabase SQL editor):

```sql
select cron.schedule(
  'scrape-psx-minutely', '* * * * *',
  $$ select net.http_post(
       url := 'https://<project-ref>.supabase.co/functions/v1/scrape-psx',
       headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb) $$);
```

(The function self-guards market hours, so an every-minute schedule is safe.)

### 5.2 `evaluate-alerts` — the alert engine

Runs after each scrape (chained) or on its own schedule.

1. Loads all `alert_rules` with at least one level enabled
2. Loads the **latest tick per symbol** (order by `scraped_at` desc, first-wins map)
3. Trigger conditions (buffer makes alerts fire as price *approaches* the level):
   - **Support**: `price <= support_level * (1 + buffer_pct/100)`
   - **Resistance**: `price >= resistance_level * (1 - buffer_pct/100)`
   - **Breakout**: `price >= breakout_level * (1 - buffer_pct/100)`
4. **Cooldown check**: skips if an `alert_events` row for the same user+symbol+level_type exists within `cooldown_minutes` (filter on `triggered_at`)
5. Inserts the `alert_events` row with `push_status: 'pending'`
6. Dispatches WhatsApp via **Fonnte** if the user's profile has it enabled:
   - `Authorization` header is the **raw token — no "Bearer" prefix**
   - Body is **form-encoded** (`URLSearchParams`), `countryCode: '92'`
7. Updates the event's `push_status` to `sent` / `failed` / `skipped` — the History page surfaces this

Secrets needed: `FONNTE_TOKEN` (set via `supabase secrets set`). `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

Deploy: `supabase functions deploy scrape-psx evaluate-alerts`

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
  usePriceFlash.js       Green/red flash class on price change (800ms)
  useMarketStatus.js     PSX open/pre-open/closed clock logic
  usePushNotifications.js FCM permission/token (pending send-push fn)
  queries/
    useWatchlistQuery.js     useWatchlist + add/remove mutations
    useAlertRuleQuery.js     useUpdateAlertRule (upsert on user_id,symbol)
    useAlertHistoryQuery.js  alert_events + merged company names
    useCandlestickQuery.js   price_ticks → OHLC buckets per timeframe

components/
  layout/      AppShell (auth guard, realtime, page titles), Sidebar, TopBar, MobileNav
  search/      SearchBar (debounced ilike query), SearchDropdown
  watchlist/   WatchlistTable (skeleton/error/empty), WatchlistRow (React.memo), AlertLevelBadge
  drawer/      SecurityDrawer, DrawerHeader, CandlestickChart, ChartTimeToggle,
               AlertConfigForm, AlertLevelRow, DrawerOverlay
  dashboard/   SummaryCards (4 live-stat cards)
  history/     HistoryFilterBar, HistoryTable (pagination), HistoryRow (expandable)
  settings/    NotificationChannels, AlertDefaults, AccountSection (all controlled)
  ui/          Button, Input, Badge, Toggle, PriceChange, MarketStatusBadge, …
  logo/        StrikeLineLogo (full | mark | inverse)
  ErrorBoundary.jsx   Root-level "Try Again" fallback

pages/
  LoginPage    DashboardPage    WatchlistPage    AlertHistoryPage    SettingsPage
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
  └─ settings SettingsPage    (channels, defaults, account)
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
| Radius | cards 12px · inputs 8px · pills 999px |
| Font | Inter (Google Fonts); **tabular-nums on every price** |

Logo: horizontal navy line struck through by a blue diagonal, square caps, no fills/gradients (`public/favicon.svg`, `StrikeLineLogo` component; inverse variant for navy backgrounds).

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

---

## 8. Environment Variables

Frontend (`.env`, all `VITE_`-prefixed, safe-to-expose keys; **restart the dev server after editing — Vite does not hot-reload .env**):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_FIREBASE_API_KEY=            (push — pending)
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

Edge function secrets (server-side, `supabase secrets set`):

```
FONNTE_TOKEN=...        # WhatsApp dispatch
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected
```

---

## 9. Build, Run, Deploy

```bash
npm run dev          # http://localhost:5173
npm run build        # production build → dist/ (vendor-split chunks)
npm run preview      # preview the production build

supabase functions deploy scrape-psx evaluate-alerts
supabase secrets set FONNTE_TOKEN=...
# then create the cron job (SQL in scrape-psx/index.ts header)
```

- **Frontend deploys automatically** on push to `main` (Vercel + GitHub integration)
- Bundle is code-split via `manualChunks` in `vite.config.ts` (react / recharts / supabase / firebase / framer-motion vendors)
- `tsconfig.json` excludes `supabase/` — edge functions are Deno, not browser TS (`supabase/functions/deno.json` configures the Deno side)

---

## 10. PSX Market Facts

- Exchange: Pakistan Stock Exchange, Karachi · Index: KSE-100
- Trading: Mon–Fri 09:15–15:30 PKT (UTC+5, no DST) · Pre-open 09:00–09:15
- Currency: PKR, always 2 decimals, comma separators, tabular-nums
- Scrape source: https://dps.psx.com.pk/market-watch (HTML table) and /indices (KSE-100)
- 40 seeded securities: OGDC, LUCK, ENGRO, HBL, MARI, HUBC, PSO, PPL, UBL, MCB, NBP, BAFL, EFERT, FFC, MLCF, KOHC, CHCC, POL, TRG, SYS, NETSOL, AVN, MEBL, BAHL, FCCL, PIOC, DGKC, ACPL, COLG, NESTLE, UNILEVER, ICI, AICL, JLICL, KAPCO, NCPL, NPL, ATRL, NRL, PNSC

---

## 11. Where to Go Next

See **ROADMAP.md** for the prioritized backlog. The two launch blockers are scheduling `scrape-psx` (cron) and verifying Fonnte delivery end-to-end; everything else is depth.
