import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

// ---------------------------------------------------------------------------
// IMPORTANT: `time` is the chart's X-axis dataKey (a Recharts *band* scale), so
// it MUST be unique per candle. Two buckets sharing a label collapse to one
// band position, xScale() stops resolving them, and CandlesticksLayer silently
// skips every bar — the chart renders axes with no candles at all.
//
// That is exactly what broke 1M: 4-hour buckets labelled by day only, so each
// trading day emitted two candles both called "21 Aug".
//
// Each timeframe below is therefore built so its label is unique by
// construction:
//   1D  5-minute buckets within ONE session  → "09:15"          unique
//   1W  hourly buckets across 7 days         → "21 Aug 09:00"   unique
//   1M  one candle per trading day           → "21 Aug"         unique
// ---------------------------------------------------------------------------

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketTicks(ticks, bucketMs) {
  const buckets = new Map();

  for (const tick of ticks) {
    const timestamp = new Date(tick.scraped_at).getTime();
    const bucketTime = Math.floor(timestamp / bucketMs) * bucketMs;
    const price = tick.last_price;

    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, {
        bucketTime,
        open: price,
        high: price,
        low: price,
        close: price,
        // PSX reports cumulative daily volume — keep the latest reading in the bucket
        volume: tick.volume ?? 0
      });
    } else {
      const b = buckets.get(bucketTime);
      b.high = Math.max(b.high, price);
      b.low = Math.min(b.low, price);
      b.close = price;
      b.volume = tick.volume ?? b.volume;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.bucketTime - b.bucketTime);
}

const hhmm = (d) =>
  d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

const dayMon = (d) =>
  `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

/**
 * 1D — the most recent SESSION, not a rolling 24 hours.
 *
 * PSX trades ~6 hours a day, so a rolling 24h window is empty every evening,
 * every morning before the open, and all weekend. Anchoring to the latest day
 * that actually has ticks means "1D" always shows the last session instead of
 * an empty chart.
 */
async function fetchIntradaySession(symbol) {
  const { data: latest, error: latestError } = await supabase
    .from('price_ticks')
    .select('scraped_at')
    .eq('symbol', symbol)
    .order('scraped_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) throw latestError;
  if (!latest?.scraped_at) return [];

  // Local-day bounds of that last session
  const anchor = new Date(latest.scraped_at);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const end = new Date(start.getTime() + DAY_MS);

  const { data: ticks, error } = await supabase
    .from('price_ticks')
    .select('last_price, volume, scraped_at')
    .eq('symbol', symbol)
    .gte('scraped_at', start.toISOString())
    .lt('scraped_at', end.toISOString())
    .order('scraped_at', { ascending: true });

  if (error) throw error;

  return bucketTicks(ticks || [], 5 * 60 * 1000).map(b => ({
    time: hhmm(new Date(b.bucketTime)),
    open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume
  }));
}

/** 1W — hourly buckets over the last 7 days, from raw ticks. */
async function fetchWeek(symbol) {
  const startDate = new Date(Date.now() - 7 * DAY_MS).toISOString();

  const { data: ticks, error } = await supabase
    .from('price_ticks')
    .select('last_price, volume, scraped_at')
    .eq('symbol', symbol)
    .gte('scraped_at', startDate)
    .order('scraped_at', { ascending: true });

  if (error) throw error;

  return bucketTicks(ticks || [], 60 * 60 * 1000).map(b => {
    const d = new Date(b.bucketTime);
    return {
      time: `${dayMon(d)} ${hhmm(d)}`,
      open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume
    };
  });
}

/**
 * 1M — real daily candles from price_candles_daily.
 *
 * Raw ticks are only retained for 30 days and bucketing them sub-daily
 * produced the duplicate-label bug. The nightly rollup already stores proper
 * daily OHLC, which is both correct and far cheaper to fetch.
 */
async function fetchMonth(symbol) {
  const start = new Date(Date.now() - 30 * DAY_MS).toISOString().slice(0, 10);

  const { data: candles, error } = await supabase
    .from('price_candles_daily')
    .select('trade_date, open_price, high_price, low_price, close_price, volume')
    .eq('symbol', symbol)
    .gte('trade_date', start)
    .order('trade_date', { ascending: true });

  if (error) throw error;

  return (candles || [])
    // A day with no real prices would render as a zero-height candle
    .filter(c => c.open_price != null && c.close_price != null)
    .map(c => {
      // trade_date is a plain date; parse as local midnight, not UTC
      const [y, m, d] = c.trade_date.split('-').map(Number);
      return {
        time: dayMon(new Date(y, m - 1, d)),
        open: c.open_price,
        high: c.high_price ?? Math.max(c.open_price, c.close_price),
        low: c.low_price ?? Math.min(c.open_price, c.close_price),
        close: c.close_price,
        volume: c.volume ?? 0
      };
    });
}

const FETCHERS = {
  '1D': fetchIntradaySession,
  '1W': fetchWeek,
  '1M': fetchMonth
};

export const useCandlestickQuery = (symbol, timeframe = '1D') => {
  return useQuery({
    queryKey: ['candlesticks', symbol, timeframe],
    queryFn: async () => {
      if (!symbol) return [];
      const fetcher = FETCHERS[timeframe] ?? FETCHERS['1D'];
      return fetcher(symbol);
    },
    enabled: !!symbol
  });
};
