import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

// Thin wrapper around the admin-api edge function. Every call carries the
// logged-in user's JWT automatically (supabase.functions.invoke), and the
// function enforces is_admin server-side.
async function invokeAdmin(action, body = {}) {
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: { action, ...body },
  });
  if (error) {
    // Surface the JSON { error } message from a non-2xx response when present
    let message = error.message;
    try {
      const parsed = await error.context?.json?.();
      if (parsed?.error) message = parsed.error;
    } catch { /* ignore */ }
    throw new Error(message || 'Admin request failed');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => invokeAdmin('overview'),
    refetchInterval: 60_000, // keep scraper health / stats reasonably live
  });
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => invokeAdmin('list_users'),
  });
}

export function useAdminRecentEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => invokeAdmin('recent_events'),
    refetchInterval: 60_000,
  });
}

// Toggle a per-user flag (restricted / is_admin)
export function useSetUserFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ user_id, field, value }) => invokeAdmin('set_user_flag', { user_id, field, value }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
      const label = vars.field === 'restricted'
        ? (vars.value ? 'User restricted' : 'User unrestricted')
        : (vars.value ? 'Admin granted' : 'Admin revoked');
      toast.success(label);
    },
    onError: (err) => toast.error(err.message),
  });
}

// Flip a global setting (whatsapp_enabled / alerts_paused)
export function useSetSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }) => invokeAdmin('set_setting', { key, value }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
    onError: (err) => toast.error(err.message),
  });
}
