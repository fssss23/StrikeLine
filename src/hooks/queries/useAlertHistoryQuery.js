import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';

export const useAlertHistory = () => {
  const session = useUserStore(state => state.session);

  return useQuery({
    queryKey: ['alert-history'],
    queryFn: async () => {
      if (!session) return [];

      const { data: events, error } = await supabase
        .from('alert_events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('triggered_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      const items = events || [];
      if (items.length === 0) return [];

      // alert_events.symbol has no FK, so company names are merged manually
      const symbols = [...new Set(items.map(e => e.symbol))];
      const { data: securities, error: secError } = await supabase
        .from('securities')
        .select('symbol, company_name')
        .in('symbol', symbols);

      if (secError) console.error('Error fetching security names:', secError.message);

      const nameMap = {};
      for (const s of securities || []) {
        nameMap[s.symbol] = s.company_name;
      }

      return items.map(e => ({
        ...e,
        company_name: nameMap[e.symbol] ?? e.symbol
      }));
    },
    enabled: !!session,
    staleTime: 60_000
  });
};
