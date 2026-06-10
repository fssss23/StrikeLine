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

      const { data: watchlist, error } = await supabase
        .from('watchlist_items')
        .select(`
          id, symbol, sort_order,
          securities(symbol, company_name, sector),
          alert_rules(*)
        `)
        .eq('user_id', session.user.id)
        .order('sort_order');

      if (error) throw error;
      if (!watchlist || watchlist.length === 0) return [];

      const symbols = watchlist.map(w => w.symbol);

      const { data: prices, error: pricesError } = await supabase
        .from('price_ticks')
        .select('symbol, last_price, change_pct, change_abs, open_price')
        .in('symbol', symbols)
        .order('scraped_at', { ascending: false })
        .limit(symbols.length); // Assuming we get the latest per symbol

      if (pricesError) console.error("Error fetching prices:", pricesError);

      const priceMap = {};
      if (prices) {
        prices.forEach(p => {
          if (!priceMap[p.symbol]) {
            priceMap[p.symbol] = p; // take the first (most recent)
          }
        });
      }

      return watchlist.map(item => {
        const price = priceMap[item.symbol];
        return {
          ...item,
          price: price?.last_price || null,
          change_pct: price?.change_pct || null,
          change_abs: price?.change_abs || null,
          open_price: price?.open_price || null,
          alert_rule: item.alert_rules?.[0] || null
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
      if (!session) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from('watchlist_items')
        .insert({ user_id: session.user.id, symbol })
        .select()
        .single();
        
      if (error) throw error;

      // Create an empty alert rule
      const { error: ruleError } = await supabase
        .from('alert_rules')
        .insert({
          user_id: session.user.id,
          watchlist_item_id: data.id,
          symbol
        });

      if (ruleError) console.error("Error creating alert rule:", ruleError);

      return data;
    },
    onSuccess: (_, symbol) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(`${symbol} added to watchlist`);
    },
    onError: (error) => {
      toast.error(`Failed to add to watchlist: ${error.message}`);
    }
  });
};

export const useRemoveFromWatchlist = () => {
  const queryClient = useQueryClient();
  const session = useUserStore(state => state.session);

  return useMutation({
    mutationFn: async (symbol) => {
      if (!session) throw new Error("Not authenticated");
      
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
      toast.error(`Failed to remove from watchlist: ${error.message}`);
    }
  });
};
