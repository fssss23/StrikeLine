import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MarketStatusBadge } from '../ui/MarketStatusBadge';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../lib/supabase';

const pageTitles = {
  '/': 'Dashboard',
  '/watchlist': 'Watchlist',
  '/alerts': 'Alerts',
  '/history': 'Alert History',
  '/settings': 'Settings',
};

function useKseIndex() {
  return useQuery({
    queryKey: ['kse-100'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_ticks')
        .select('last_price, change_pct')
        .eq('symbol', 'KSE100')
        .order('scraped_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('Error fetching KSE-100:', error.message);
        return null;
      }
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000
  });
}

export const TopBar = () => {
  const activeAlerts = useActiveAlerts();
  const { data: kse } = useKseIndex();
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  const initial = (user?.display_name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-surface-card border-b border-surface-border px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-lg font-bold text-text-primary hidden md:block">{pageTitle}</h1>
      </div>

      <div className="flex-1 flex justify-center items-center gap-3">
        <MarketStatusBadge />
        {kse?.last_price != null && (
          <>
            <span className="hidden md:inline-block text-text-secondary">|</span>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">KSE-100</span>
              <span className="text-sm font-bold tabular-nums text-text-primary">
                {kse.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {typeof kse.change_pct === 'number' && (
                <span className={`text-sm font-bold tabular-nums ${kse.change_pct >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
                  {kse.change_pct >= 0 ? '▲' : '▼'} {Math.abs(kse.change_pct).toFixed(2)}%
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex justify-end items-center gap-4">
        <button
          onClick={() => navigate('/history')}
          className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Alert history"
        >
          <Bell className="w-5 h-5" />
          {activeAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-signal-red rounded-full"></span>
          )}
        </button>
        <div
          className="w-8 h-8 rounded-full bg-brand-navy text-white text-[13px] font-bold flex items-center justify-center cursor-pointer"
          onClick={() => navigate('/settings')}
          title={user?.display_name || user?.email}
        >
          {initial !== '?' ? initial : <User className="w-4 h-4" />}
        </div>
      </div>
    </header>
  );
};
