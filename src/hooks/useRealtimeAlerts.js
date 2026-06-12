import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../store/useUserStore';

const LEVEL_LABELS = {
  support: 'support',
  resistance: 'resistance',
  breakout: 'breakout',
};

// In-app toast the moment an alert fires — users see it without waiting for
// WhatsApp/push. Subscribes to alert_events INSERTs for the current user.
export const useRealtimeAlerts = () => {
  const session = useUserStore(state => state.session);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('alert_events_live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'alert_events',
        filter: `user_id=eq.${session.user.id}`
      }, (payload) => {
        const { symbol, level_type, level_value, actual_price } = payload.new;
        const label = LEVEL_LABELS[level_type] ?? level_type;

        toast(`⚡ ${symbol} hit your ${label} level`, {
          description: `Price PKR ${Number(actual_price).toFixed(2)} · Level PKR ${Number(level_value).toFixed(2)}`,
          duration: 8000,
        });

        queryClient.invalidateQueries({ queryKey: ['alert-history'] });
        queryClient.invalidateQueries({ queryKey: ['last-triggered', symbol] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, queryClient]);
};
