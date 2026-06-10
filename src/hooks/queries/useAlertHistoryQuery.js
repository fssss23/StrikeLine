import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';

export const useAlertHistory = (filters = {}) => {
  const session = useUserStore(state => state.session);

  return useQuery({
    queryKey: ['alert-history', filters],
    queryFn: async () => {
      if (!session) return [];

      const { data, error } = await supabase
        .from('alert_events')
        .select('*')
        .eq('user_id', session.user.id)
        .order('triggered_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (!data) return [];

      let result = data;

      if (filters.symbol && filters.symbol !== 'All') {
        result = result.filter(e => e.symbol === filters.symbol);
      }
      
      if (filters.levelType && filters.levelType !== 'All') {
        result = result.filter(e => e.level_type === filters.levelType.toLowerCase());
      }
      
      if (filters.dateRange && filters.dateRange !== 'All Time') {
        const now = new Date();
        const cutoff = new Date();
        if (filters.dateRange === 'Today') cutoff.setDate(now.getDate() - 1);
        if (filters.dateRange === 'Last 7 Days') cutoff.setDate(now.getDate() - 7);
        if (filters.dateRange === 'Last 30 Days') cutoff.setDate(now.getDate() - 30);
        
        result = result.filter(e => new Date(e.triggered_at) >= cutoff);
      }

      return result;
    },
    enabled: !!session
  });
};
