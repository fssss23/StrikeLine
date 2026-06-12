import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';

// Latest alert_events timestamp per level type for one symbol, so
// AlertLevelRow can show real "Last triggered: X ago" data.
// alert_events.symbol has no FK — plain filter, no embeds.
export const useLastTriggered = (symbol) => {
  const session = useUserStore(state => state.session);

  return useQuery({
    queryKey: ['last-triggered', symbol, session?.user?.id],
    queryFn: async () => {
      if (!session || !symbol) return {};

      const { data, error } = await supabase
        .from('alert_events')
        .select('level_type, triggered_at')
        .eq('user_id', session.user.id)
        .eq('symbol', symbol)
        .order('triggered_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching last-triggered events:', error.message);
        return {};
      }

      // first-wins: rows are newest-first, keep the latest per level_type
      const latest = {};
      for (const e of data || []) {
        if (!latest[e.level_type]) latest[e.level_type] = e.triggered_at;
      }
      return latest;
    },
    enabled: !!session && !!symbol,
    staleTime: 60_000
  });
};
