// market-digest — one WhatsApp summary of a user's watchlist per session.
//
//   ?session=open   previous day's close  vs  today's open
//   ?session=close  today's open          vs  today's close
//
// Capped at 10 symbols, taken in the user's own watchlist order (sort_order).
// Opt-in only: user_profiles.market_digest_enabled defaults to false.
//
// WhatsApp is the only channel. A 10-row table is the wrong shape for a push
// banner, and email is sandbox-limited to one address until a domain is
// verified.
//
// Idempotent: digest_log has a (user_id, session, trade_date) primary key, so
// a cron misfire or manual re-invocation cannot double-send. Pass ?force=true
// to bypass the market-day guard for testing (it still will not double-send;
// use ?resend=true for that).
//
// Deploy: supabase functions deploy market-digest

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const MAX_SYMBOLS = 10

// ---------------------------------------------------------------------------
// PKT helpers. PSX runs on Asia/Karachi (UTC+5, no DST).
// ---------------------------------------------------------------------------
function pktNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
}

/** YYYY-MM-DD for the current PKT calendar day. */
function pktToday(): string {
  const p = pktNow()
  const mm = String(p.getMonth() + 1).padStart(2, '0')
  const dd = String(p.getDate()).padStart(2, '0')
  return `${p.getFullYear()}-${mm}-${dd}`
}

/** PSX is closed at weekends; digests only make sense on trading days. */
function isTradingDay(): boolean {
  const day = pktNow().getDay()
  return day !== 0 && day !== 6
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------
const fmt = (n: number | null | undefined): string =>
  n == null ? '—' : n.toFixed(2)

function pctChange(from: number | null, to: number | null): string {
  if (from == null || to == null || from === 0) return '—'
  const pct = ((to - from) / from) * 100
  // Anything that rounds to 0.00% is flat: an arrow next to "0.00%" reads as
  // a rendering bug (e.g. MARI moving 668.00 -> 667.98).
  if (Math.abs(pct) < 0.005) return '0.00%'
  const arrow = pct > 0 ? '▲' : '▼'
  return `${arrow}${Math.abs(pct).toFixed(2)}%`
}

interface Row {
  symbol: string
  before: number | null   // prev close (open session) | today's open (close session)
  after: number | null    // today's open (open session) | today's close (close session)
}

/**
 * WhatsApp renders text between triple backticks as monospace, which is the
 * only way to get columns to line up on a phone.
 */
function buildMessage(session: 'open' | 'close', rows: Row[], total: number, tradeDate: string): string {
  const [ty, tm, td] = tradeDate.split('-').map(Number)
  const p = new Date(ty, tm - 1, td)
  const dateStr = p.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  const title = session === 'open'
    ? '📈 StrikeLine — Market Open'
    : '🔔 StrikeLine — Market Close'

  const beforeLabel = session === 'open' ? 'Prev' : 'Open'
  const afterLabel = session === 'open' ? 'Open' : 'Close'

  // Widest symbol drives the column so nothing wraps
  const symWidth = Math.max(6, ...rows.map(r => r.symbol.length))

  const header =
    'SYM'.padEnd(symWidth) + ' ' +
    beforeLabel.padStart(9) + ' ' +
    afterLabel.padStart(9) + ' ' +
    'CHG'.padStart(8)

  const body = rows.map(r =>
    r.symbol.padEnd(symWidth) + ' ' +
    fmt(r.before).padStart(9) + ' ' +
    fmt(r.after).padStart(9) + ' ' +
    pctChange(r.before, r.after).padStart(8)
  ).join('\n')

  const truncated = total > rows.length
    ? `\n\nShowing ${rows.length} of ${total} watchlist symbols.`
    : ''

  return `${title}\n${dateStr}\n\n\`\`\`${header}\n${body}\`\`\`${truncated}`
}

// ---------------------------------------------------------------------------
// WhatsApp dispatch (Fonnte).
// Same contract as evaluate-alerts: the raw token in Authorization with NO
// "Bearer" prefix, and a form-encoded body.
// ---------------------------------------------------------------------------
async function sendWhatsApp(token: string, target: string, message: string): Promise<boolean> {
  try {
    const body = new URLSearchParams({ target, message, countryCode: '92' })
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { 'Authorization': token },
      body,
    })
    const result = await res.json()
    if (!res.ok || result.status === false) {
      console.error('Fonnte rejected the digest:', result)
      return false
    }
    return true
  } catch (err) {
    console.error('Error calling Fonnte:', err)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const session = url.searchParams.get('session') as 'open' | 'close' | null
    const force = url.searchParams.get('force') === 'true'
    const resend = url.searchParams.get('resend') === 'true'

    if (session !== 'open' && session !== 'close') {
      return json({ error: "session must be 'open' or 'close'" }, 400)
    }

    if (!isTradingDay() && !force) {
      return json({ skipped: 'not_a_trading_day', pkt: pktNow().toISOString() })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // --- Global kill switches (read defensively; table may predate this fn) ---
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['alerts_paused', 'whatsapp_enabled'])

    const settingMap = new Map((settings ?? []).map(s => [s.key, s.value]))
    if (settingMap.get('alerts_paused') === true) {
      return json({ skipped: 'alerts_paused' })
    }
    if (settingMap.get('whatsapp_enabled') === false) {
      return json({ skipped: 'whatsapp_globally_disabled' })
    }

    const fonnteToken = Deno.env.get('FONNTE_TOKEN')
    if (!fonnteToken) {
      console.error('FONNTE_TOKEN is not set')
      return json({ error: 'FONNTE_TOKEN missing' }, 500)
    }

    // --- Eligible recipients ---
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, whatsapp_number')
      .eq('market_digest_enabled', true)
      .eq('whatsapp_enabled', true)
      .eq('restricted', false)
      .not('whatsapp_number', 'is', null)

    if (profileError) {
      console.error('Failed to load profiles:', profileError.message)
      return json({ error: profileError.message }, 500)
    }

    const recipients = profiles ?? []
    if (recipients.length === 0) {
      return json({ session, sent: 0, note: 'no opted-in recipients' })
    }

    // ?date=YYYY-MM-DD replays a past session for testing. Gated behind
    // ?force=true so a stray query param can never retarget a live cron run.
    const dateParam = url.searchParams.get('date')
    const tradeDate = (force && dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam))
      ? dateParam
      : pktToday()

    let sent = 0, skipped = 0, failed = 0

    for (const profile of recipients) {
      // Idempotency: claim the slot BEFORE sending. If the row already exists
      // this user already got this digest today, so move on.
      if (!resend) {
        const { error: claimError } = await supabase
          .from('digest_log')
          .insert({ user_id: profile.id, session, trade_date: tradeDate, status: 'pending' })
        if (claimError) {
          skipped++
          continue
        }
      }

      // --- Watchlist, the user's own order, capped ---
      const { data: items } = await supabase
        .from('watchlist_items')
        .select('symbol, sort_order')
        .eq('user_id', profile.id)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('symbol', { ascending: true })

      const all = items ?? []
      const picked = all.slice(0, MAX_SYMBOLS)
      if (picked.length === 0) {
        await supabase.from('digest_log')
          .update({ status: 'empty_watchlist', symbols: 0 })
          .eq('user_id', profile.id).eq('session', session).eq('trade_date', tradeDate)
        skipped++
        continue
      }

      const symbols = picked.map(i => i.symbol)

      // --- Today's ticks: open_price and last_price come from the same row ---
      const { data: ticks } = await supabase
        .from('price_ticks')
        .select('symbol, open_price, last_price, scraped_at')
        .in('symbol', symbols)
        .gte('scraped_at', `${tradeDate}T00:00:00Z`)
        .order('scraped_at', { ascending: false })

      // First row per symbol wins — the query is newest-first
      const latest = new Map<string, { open_price: number | null; last_price: number | null }>()
      for (const t of ticks ?? []) {
        if (!latest.has(t.symbol)) latest.set(t.symbol, t)
      }

      let rows: Row[]

      if (session === 'open') {
        // Previous close comes from the nightly rollup, not from ticks: PSX
        // publishes LDCP but the scraper deliberately never stores it, and raw
        // ticks for the prior session may already be outside retention.
        const { data: candles } = await supabase
          .from('price_candles_daily')
          .select('symbol, trade_date, close_price')
          .in('symbol', symbols)
          .lt('trade_date', tradeDate)
          .order('trade_date', { ascending: false })

        const prevClose = new Map<string, number | null>()
        for (const c of candles ?? []) {
          if (!prevClose.has(c.symbol)) prevClose.set(c.symbol, c.close_price)
        }

        rows = symbols.map(s => ({
          symbol: s,
          before: prevClose.get(s) ?? null,
          // Fall back to last_price: ~3% of ticks carry a null open_price for
          // symbols that had not traded yet.
          after: latest.get(s)?.open_price ?? latest.get(s)?.last_price ?? null,
        }))
      } else {
        rows = symbols.map(s => ({
          symbol: s,
          before: latest.get(s)?.open_price ?? null,
          after: latest.get(s)?.last_price ?? null,
        }))
      }

      const message = buildMessage(session, rows, all.length, tradeDate)
      const ok = await sendWhatsApp(fonnteToken, profile.whatsapp_number!, message)

      await supabase.from('digest_log')
        .update({ status: ok ? 'sent' : 'failed', symbols: rows.length })
        .eq('user_id', profile.id).eq('session', session).eq('trade_date', tradeDate)

      if (ok) sent++; else failed++
    }

    return json({ session, trade_date: tradeDate, recipients: recipients.length, sent, skipped, failed })
  } catch (err) {
    console.error('market-digest error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})
