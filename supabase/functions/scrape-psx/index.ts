import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PSX_MARKET_WATCH_URL = 'https://dps.psx.com.pk/market-watch'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json, text/html, */*',
  'Referer': 'https://dps.psx.com.pk/',
  'X-Requested-With': 'XMLHttpRequest',
}

const PKT_OPEN  = { hour: 9,  minute: 15 }
const PKT_CLOSE = { hour: 15, minute: 30 }

function isMarketOpen(): boolean {
  const now = new Date()
  const pkt = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))
  const day = pkt.getDay()
  if (day === 0 || day === 6) return false
  const h = pkt.getHours(), m = pkt.getMinutes()
  const mins = h * 60 + m
  return mins >= PKT_OPEN.hour * 60 + PKT_OPEN.minute && 
         mins <= PKT_CLOSE.hour * 60 + PKT_CLOSE.minute
}

async function fetchAllPrices(): Promise<any[]> {
  const res = await fetch(PSX_MARKET_WATCH_URL, { headers: HEADERS })
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return Array.isArray(json) ? json : json.data ?? []
  } catch {
    const match = text.match(/window\.__NEXT_DATA__\s*=\s*(\{.+?\});/)
    if (match) {
      const data = JSON.parse(match[1])
      return data?.props?.pageProps?.data ?? []
    }
    return []
  }
}

Deno.serve(async () => {
  if (!isMarketOpen()) {
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
        JSON.stringify({ status: 'error', reason: 'no_data_parsed' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: securities } = await supabase.from('securities').select('symbol')
    const trackedSymbols = new Set(securities?.map(s => s.symbol) ?? [])

    const ticks = rawData
      .filter((row: any) => trackedSymbols.has(row.symbol ?? row.SYMBOL))
      .map((row: any) => ({
        symbol:      row.symbol     ?? row.SYMBOL,
        last_price:  parseFloat(row.ldcp ?? row.last ?? row.LDCP ?? 0),
        open_price:  parseFloat(row.open ?? row.OPEN ?? 0),
        high_price:  parseFloat(row.high ?? row.HIGH ?? 0),
        low_price:   parseFloat(row.low  ?? row.LOW  ?? 0),
        volume:      parseInt(row.volume ?? row.VOLUME ?? 0),
        change_abs:  parseFloat(row.change ?? row.CHANGE ?? 0),
        change_pct:  parseFloat(row.changep ?? row.CHANGEP ?? 0),
        scraped_at:  new Date().toISOString(),
      }))
      .filter(t => t.last_price > 0 && t.last_price < 100000)

    if (ticks.length === 0) {
      return new Response(
        JSON.stringify({ status: 'error', reason: 'no_valid_ticks' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { error } = await supabase.from('price_ticks').insert(ticks)
    if (error) throw error

    return new Response(
      JSON.stringify({ status: 'ok', ticks_inserted: ticks.length }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: 'error', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
