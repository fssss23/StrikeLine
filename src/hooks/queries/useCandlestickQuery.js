import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const TIMEFRAMES = {
  '1D': { days: 1, bucketMs: 5 * 60 * 1000 },
  '1W': { days: 7, bucketMs: 60 * 60 * 1000 },
  '1M': { days: 30, bucketMs: 4 * 60 * 60 * 1000 }
};

export const useCandlestickQuery = (symbol, timeframe = '1D') => {
  return useQuery({
    queryKey: ['candlesticks', symbol, timeframe],
    queryFn: async () => {
      if (!symbol) return [];
      
      const config = TIMEFRAMES[timeframe];
      const startDate = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000).toISOString();

      const { data: ticks, error } = await supabase
        .from('price_ticks')
        .select('last_price, scraped_at')
        .eq('symbol', symbol)
        .gte('scraped_at', startDate)
        .order('scraped_at', { ascending: true });

      if (error) throw error;
      if (!ticks || ticks.length === 0) return [];

      // Group into buckets
      const buckets = new Map();
      
      ticks.forEach(tick => {
        const timestamp = new Date(tick.scraped_at).getTime();
        const bucketTime = Math.floor(timestamp / config.bucketMs) * config.bucketMs;
        const price = tick.last_price;
        
        if (!buckets.has(bucketTime)) {
          buckets.set(bucketTime, {
            bucketTime,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: Math.floor(Math.random() * 5000) + 1000 // mock volume as it's not in DB
          });
        } else {
          const b = buckets.get(bucketTime);
          b.high = Math.max(b.high, price);
          b.low = Math.min(b.low, price);
          b.close = price;
        }
      });

      const result = Array.from(buckets.values()).map(b => {
        const d = new Date(b.bucketTime);
        let timeStr = '';
        if (timeframe === '1D') {
          timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (timeframe === '1W') {
          timeStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short'})} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
        } else {
          timeStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short'})}`;
        }
        
        return {
          time: timeStr,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume
        };
      });

      return result;
    },
    enabled: !!symbol
  });
};
