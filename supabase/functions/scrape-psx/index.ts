// scrape-psx — fetches PSX market-watch prices and inserts a tick for every
// symbol seeded in `securities`, then chains evaluate-alerts on fresh data.
//
// Schedule with Supabase cron every minute (the function self-guards market hours):
//   select cron.schedule(
//     'scrape-psx-minutely', '* * * * *',
//     $$ select net.http_post(
//          url := 'https://<project-ref>.supabase.co/functions/v1/scrape-psx',
//          headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb) $$);
//
// Pass ?force=true to bypass the market-hours guard for manual testing.
//
// PSX's firewall blocks some datacenter IPs (HTTP 462). If direct fetches
// fail, set PSX_PROXY_URL / PSX_PROXY_KEY to a relay (see
// cloudflare/psx-proxy-worker.js) and fetches fall back to it automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/html, */*',
  'Referer': 'https://dps.psx.com.pk/',
  'X-Requested-With': 'XMLHttpRequest',
}

// Direct fetch first; on any failure fall back to the proxy relay if configured
async function fetchPsx(path: string): Promise<Response> {
  let directStatus = 'error'
  try {
    const res = await fetch(`https://dps.psx.com.pk${path}`, { headers: HEADERS })
    if (res.ok) return res
    directStatus = String(res.status)
    console.error(`Direct PSX fetch ${path} returned ${res.status}`)
  } catch (err) {
    console.error(`Direct PSX fetch ${path} failed:`, err)
  }

  const proxyUrl = Deno.env.get('PSX_PROXY_URL')
  if (!proxyUrl) {
    throw new Error(`PSX ${path} returned ${directStatus} and no PSX_PROXY_URL is configured`)
  }

  const proxyKey = Deno.env.get('PSX_PROXY_KEY')
  const res = await fetch(`${proxyUrl}?path=${encodeURIComponent(path)}`, {
    headers: proxyKey ? { 'X-Proxy-Key': proxyKey } : {},
  })
  if (!res.ok) throw new Error(`PSX proxy returned ${res.status} for ${path} (direct: ${directStatus})`)
  return res
}

function pktNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
}

// PSX hours (PKT): Mon–Thu 09:15–15:30; Friday trades two sessions around
// the Jumma break, 09:15–12:00 and 14:30–16:30. A small tail is added so
// the closing tick is always captured.
function isMarketOpen(): boolean {
  const pkt = pktNow()
  const day = pkt.getDay()
  if (day === 0 || day === 6) return false
  const mins = pkt.getHours() * 60 + pkt.getMinutes()
  const open = 9 * 60 + 15
  if (day === 5) {
    return (mins >= open && mins <= 12 * 60 + 5) ||
           (mins >= 14 * 60 + 30 && mins <= 16 * 60 + 35)
  }
  return mins >= open && mins <= 15 * 60 + 35
}

function parseNumber(raw: unknown): number | null {
  if (raw == null) return null
  const cleaned = String(raw).replace(/[,%\s]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function cellText(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

interface Tick {
  symbol: string
  last_price: number | null
  open_price: number | null
  high_price: number | null
  low_price: number | null
  volume: number | null
  change_abs: number | null
  change_pct: number | null
  company_name?: string | null // parsed for auto-discovery; never inserted into price_ticks
  sector?: string | null       // parsed for securities (discovery + backfill); never in price_ticks
}

// Fallback parser for the server-rendered market-watch HTML table.
// Columns: SYMBOL | SECTOR | LISTED IN | LDCP | OPEN | HIGH | LOW | CURRENT | CHANGE | CHANGE (%) | VOLUME
function parseHtmlTable(html: string): Tick[] {
  const rows: Tick[] = []
  for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => cellText(m[1]))
    if (cells.length < 11) continue
    const symbol = cells[0].toUpperCase()
    if (!symbol || !/^[A-Z0-9.]+$/.test(symbol)) continue
    const companyName = rowMatch[1].match(/data-title="([^"]+)"/)?.[1]?.replace(/&amp;/g, '&') ?? null
    const sector = cells[1] && cells[1] !== '-' ? cells[1] : null // column 2 = SECTOR
    rows.push({
      symbol,
      company_name: companyName,
      sector,
      open_price: parseNumber(cells[4]),
      high_price: parseNumber(cells[5]),
      low_price: parseNumber(cells[6]),
      last_price: parseNumber(cells[7]), // CURRENT — the live price, never LDCP
      change_abs: parseNumber(cells[8]),
      change_pct: parseNumber(cells[9]),
      volume: parseNumber(cells[10]),
    })
  }
  return rows
}

function normalizeJsonRow(row: any): Tick {
  return {
    symbol: String(row.symbol ?? row.SYMBOL ?? '').toUpperCase(),
    company_name: row.name ?? row.NAME ?? null,
    sector: row.sector ?? row.SECTOR ?? row.sectorName ?? null,
    // IMPORTANT: prefer the live price; LDCP is *yesterday's* close and only a last resort
    last_price: parseNumber(row.last ?? row.current ?? row.LAST ?? row.CURRENT ?? row.price ?? row.ldcp ?? row.LDCP),
    open_price: parseNumber(row.open ?? row.OPEN),
    high_price: parseNumber(row.high ?? row.HIGH),
    low_price: parseNumber(row.low ?? row.LOW),
    volume: parseNumber(row.volume ?? row.VOLUME),
    change_abs: parseNumber(row.change ?? row.CHANGE),
    change_pct: parseNumber(row.changep ?? row.CHANGEP ?? row.change_pct),
  }
}

async function fetchAllPrices(): Promise<Tick[]> {
  const res = await fetchPsx('/market-watch')
  const text = await res.text()

  // 1. JSON API response
  try {
    const json = JSON.parse(text)
    const arr = Array.isArray(json) ? json : json.data ?? []
    if (arr.length > 0) return arr.map(normalizeJsonRow)
  } catch { /* not JSON — fall through */ }

  // 2. Embedded __NEXT_DATA__ payload
  const match = text.match(/window\.__NEXT_DATA__\s*=\s*(\{.+?\});/)
  if (match) {
    try {
      const data = JSON.parse(match[1])
      const arr = data?.props?.pageProps?.data ?? []
      if (arr.length > 0) return arr.map(normalizeJsonRow)
    } catch { /* fall through */ }
  }

  // 3. Server-rendered HTML table
  return parseHtmlTable(text)
}

// Best-effort KSE-100 index value for the TopBar badge
async function fetchKse100(): Promise<Tick | null> {
  try {
    const res = await fetchPsx('/indices')
    const html = await res.text()
    for (const rowMatch of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => cellText(m[1]))
      if (cells.length < 4) continue
      const name = cells[0].toUpperCase()
      if (!name.includes('KSE100') && !name.includes('KSE-100')) continue
      const last = parseNumber(cells[1])
      if (last == null) continue
      return {
        symbol: 'KSE100',
        last_price: last,
        open_price: null,
        high_price: parseNumber(cells[2]),
        low_price: parseNumber(cells[3]),
        volume: null,
        change_abs: parseNumber(cells[4] ?? null),
        change_pct: parseNumber(cells[5] ?? null),
      }
    }
    return null
  } catch (err) {
    console.error('KSE-100 fetch failed (non-fatal):', err)
    return null
  }
}

Deno.serve(async (req: Request) => {
  const force = new URL(req.url).searchParams.get('force') === 'true'

  if (!force && !isMarketOpen()) {
    return new Response(
      JSON.stringify({ status: 'skipped', reason: 'market_closed' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const rawData = await fetchAllPrices()
    if (!rawData.length) {
      return new Response(
        JSON.stringify({ status: 'error', reason: 'no_data_parsed', hint: 'PSX page layout may have changed' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Tick strategy: every minute for "active" symbols (on a watchlist or an
    // alert rule) + KSE100; a FULL market snapshot every 30 minutes so every
    // security shows a reasonably fresh price without exploding row volume.
    const snapshot = force || pktNow().getMinutes() % 30 === 0

    const [secRes, wlRes, arRes] = await Promise.all([
      supabase.from('securities').select('symbol'),
      supabase.from('watchlist_items').select('symbol'),
      supabase.from('alert_rules').select('symbol'),
    ])
    if (secRes.error) throw secRes.error
    const trackedSymbols = new Set((secRes.data || []).map((s: { symbol: string }) => s.symbol))

    const activeSymbols = new Set<string>(['KSE100'])
    for (const r of wlRes.data || []) activeSymbols.add(r.symbol)
    for (const r of arRes.data || []) activeSymbols.add(r.symbol)

    // Auto-discovery (snapshot runs): any symbol PSX lists that we don't
    // know yet gets added to securities, so new listings appear in search.
    let discovered = 0
    if (snapshot) {
      const newSecurities = rawData
        .filter(t => !trackedSymbols.has(t.symbol) && t.company_name)
        .map(t => ({ symbol: t.symbol, company_name: t.company_name, sector: t.sector ?? null }))
      if (newSecurities.length > 0) {
        const { error: discError } = await supabase
          .from('securities')
          .upsert(newSecurities, { onConflict: 'symbol', ignoreDuplicates: true })
        if (discError) {
          console.error('Auto-discovery insert failed (non-fatal):', discError.message)
        } else {
          discovered = newSecurities.length
          for (const s of newSecurities) trackedSymbols.add(s.symbol)
        }
      }

      // Sector backfill (snapshot runs): the market-watch table carries a SECTOR
      // column that the original seed never captured, so most securities have a
      // null sector (shown as "—" in the UI). Upsert {symbol, sector} for every
      // tracked row that has one — ON CONFLICT only the sector column is touched,
      // so company_name is preserved.
      const sectorRows = rawData
        .filter(t => trackedSymbols.has(t.symbol) && t.sector)
        .map(t => ({ symbol: t.symbol, sector: t.sector }))
      if (sectorRows.length > 0) {
        const { error: sectorError } = await supabase
          .from('securities')
          .upsert(sectorRows, { onConflict: 'symbol' })
        if (sectorError) {
          console.error('Sector backfill failed (non-fatal):', sectorError.message)
        }
      }
    }

    const scrapedAt = new Date().toISOString()
    const ticks = rawData
      .filter(t => trackedSymbols.has(t.symbol))
      .filter(t => snapshot || activeSymbols.has(t.symbol))
      .filter(t => t.last_price != null && t.last_price > 0 && t.last_price < 1000000)
      .map(({ company_name: _name, sector: _sector, ...t }) => ({ ...t, scraped_at: scrapedAt }))

    // Index tick — only if KSE100 is seeded in securities (FK on price_ticks.symbol)
    if (trackedSymbols.has('KSE100')) {
      const kse = await fetchKse100()
      if (kse) {
        const { company_name: _n, ...kseTick } = kse
        ticks.push({ ...kseTick, scraped_at: scrapedAt })
      }
    }

    if (ticks.length === 0) {
      return new Response(
        JSON.stringify({ status: 'error', reason: 'no_valid_ticks', parsedRows: rawData.length }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase.from('price_ticks').insert(ticks)
    if (error) throw error

    // Chain alert evaluation so alerts fire immediately on fresh prices
    let alertsEvaluated = false
    try {
      const evalRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/evaluate-alerts`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }
        }
      )
      alertsEvaluated = evalRes.ok
    } catch (err) {
      console.error('evaluate-alerts chain call failed (non-fatal):', err)
    }

    return new Response(
      JSON.stringify({ status: 'ok', ticks_inserted: ticks.length, snapshot, discovered, alertsEvaluated, scrapedAt }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('scrape-psx failed:', err)
    return new Response(
      JSON.stringify({ status: 'error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
