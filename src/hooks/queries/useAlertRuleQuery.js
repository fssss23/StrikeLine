import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../store/useUserStore';
import { toast } from 'sonner';

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();
  const session = useUserStore(state => state.session);

  return useMutation({
    mutationFn: async (payload) => {
      if (!session) throw new Error("Not authenticated");
      const { symbol, ...updates } = payload;
      
      const { data, error } = await supabase
        .from('alert_rules')
        .upsert({
          user_id: session.user.id,
          symbol,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,symbol' })
        .select()
        .single();
        
      if (error) throw error;
      return { symbol, data };
    },
    onSuccess: ({ symbol }) => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      toast.success(`Alert saved for ${symbol}`);
    },
    onError: (error) => {
      toast.error(`Failed to save alert: ${error.message}`);
    }
  });
};
