import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { useUserStore } from '../store/useUserStore';

export const useRealtimePrices = () => {
  const updatePrice = useWatchlistStore(state => state.updatePrice);
  const session = useUserStore(state => state.session);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('price_ticks_live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'price_ticks'
      }, (payload) => {
        const { symbol, last_price, change_pct, change_abs } = payload.new;
        updatePrice(symbol, last_price, change_pct, change_abs);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, updatePrice]);
};
