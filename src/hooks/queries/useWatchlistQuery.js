import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import { toast } from 'sonner';

export const useWatchlist = () => {
  const session = useUserStore(state => state.session);

  return useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      if (!session) return [];

      // alert_rules has no FK to watchlist_items, so it cannot be embedded —
      // fetch both by user and merge on symbol.
      const [watchlistResult, rulesResult] = await Promise.all([
        supabase
          .from('watchlist_items')
          .select('id, symbol, sort_order, securities(symbol, company_name, sector)')
          .eq('user_id', session.user.id)
          .order('sort_order'),
        supabase
          .from('alert_rules')
          .select('*')
          .eq('user_id', session.user.id)
      ]);

      if (watchlistResult.error) throw watchlistResult.error;
      if (rulesResult.error) console.error('Error fetching alert rules:', rulesResult.error.message);

      const watchlist = watchlistResult.data || [];
      if (watchlist.length === 0) return [];

      const ruleMap = {};
      for (const rule of rulesResult.data || []) {
        ruleMap[rule.symbol] = rule;
      }

      const symbols = watchlist.map(w => w.symbol);

      const { data: prices, error: pricesError } = await supabase
        .from('price_ticks')
        .select('symbol, last_price, change_pct, change_abs, open_price, scraped_at')
        .in('symbol', symbols)
        .order('scraped_at', { ascending: false })
        .limit(symbols.length * 3);

      if (pricesError) console.error('Error fetching prices:', pricesError.message);

      const priceMap = {};
      for (const p of prices || []) {
        if (!priceMap[p.symbol]) priceMap[p.symbol] = p;
      }

      return watchlist.map(item => {
        const price = priceMap[item.symbol];
        return {
          ...item,
          price: price?.last_price ?? null,
          change_pct: price?.change_pct ?? null,
          change_abs: price?.change_abs ?? null,
          open_price: price?.open_price ?? null,
          alert_rule: ruleMap[item.symbol] ?? null
        };
      });
    },
    enabled: !!session
  });
};

export const useAddToWatchlist = () => {
  const queryClient = useQueryClient();
  const session = useUserStore(state => state.session);

  return useMutation({
    mutationFn: async (symbol) => {
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('watchlist_items')
        .insert({ user_id: session.user.id, symbol })
        .select()
        .single();

      if (error) {
        // UNIQUE(user_id, symbol) — already watching is not a failure
        if (error.code === '23505') return { symbol, duplicate: true };
        throw error;
      }
      return data;
    },
    onSuccess: (_, symbol) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(`${symbol} added to watchlist`);
    },
    onError: (error) => {
      console.error('Add to watchlist failed:', error.message);
      toast.error(`Failed to add to watchlist: ${error.message}`);
    }
  });
};

export const useRemoveFromWatchlist = () => {
  const queryClient = useQueryClient();
  const session = useUserStore(state => state.session);

  return useMutation({
    mutationFn: async (symbol) => {
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('symbol', symbol)
        .eq('user_id', session.user.id);

      if (error) throw error;
      return symbol;
    },
    onSuccess: (symbol) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(`${symbol} removed from watchlist`);
    },
    onError: (error) => {
      console.error('Remove from watchlist failed:', error.message);
      toast.error(`Failed to remove from watchlist: ${error.message}`);
    }
  });
};
