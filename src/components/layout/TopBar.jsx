import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MarketStatusBadge } from '../ui/MarketStatusBadge';
import { StrikeLineLogo } from '../logo/StrikeLineLogo';
import { usePriceFlash } from '../../hooks/usePriceFlash';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

const pageTitles = {
  '/': 'Dashboard',
  '/watchlist': 'Watchlist',
  '/alerts': 'Alerts',
  '/history': 'Alert History',
  '/settings': 'Settings',
  '/admin': 'Admin',
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

/** KSE-100 readout. `compact` drops the absolute level and keeps the delta. */
function KseChip({ kse, compact }) {
  const { flashClass } = usePriceFlash(kse?.last_price);
  if (kse?.last_price == null) return null;

  const pct = typeof kse.change_pct === 'number' ? kse.change_pct : null;
  const up = (pct ?? 0) >= 0;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-pill border border-surface-hairline bg-surface-card',
        'shadow-card px-2.5 h-9 shrink-0 transition-colors',
        flashClass
      )}
    >
      <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-text-tertiary leading-none">
        KSE<span className="hidden sm:inline">-100</span>
      </span>
      {!compact && (
        <span className="text-[13px] font-bold sl-num text-text-primary leading-none">
          {kse.last_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
      {pct != null && (
        <span
          className={cn(
            'text-[12px] font-bold sl-num leading-none',
            up ? 'text-signal-green' : 'text-signal-red'
          )}
        >
          {up ? '▲' : '▼'}{Math.abs(pct).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

export const TopBar = ({ variant = 'desktop' }) => {
  const activeAlerts = useActiveAlerts();
  const { data: kse } = useKseIndex();
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  const initial = (user?.display_name || user?.email || '?').charAt(0).toUpperCase();

  const avatar = (
    <button
      onClick={() => navigate('/settings')}
      title={user?.display_name || user?.email}
      aria-label="Account settings"
      className="sl-tap w-9 h-9 rounded-full bg-gradient-to-br from-brand-navyLight to-brand-navy text-white text-[13px] font-bold flex items-center justify-center shrink-0 ring-1 ring-slate-900/10 shadow-card"
    >
      {initial !== '?' ? initial : <User className="w-4 h-4" />}
    </button>
  );

  const bell = (
    <button
      onClick={() => navigate('/history')}
      className="sl-tap relative w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors shrink-0"
      aria-label="Alert history"
    >
      <Bell className="w-[18px] h-[18px]" />
      {activeAlerts > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-signal-red rounded-full ring-2 ring-white" />
      )}
    </button>
  );

  if (variant === 'mobile') {
    // Sticky INSIDE the scroll container so content passes under the frost.
    return (
      <header className="md:hidden sticky top-0 z-20 sl-glass border-b border-surface-hairline/80 pt-safe">
        <div className="h-[58px] px-4 flex items-center gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <StrikeLineLogo variant="mark" className="shrink-0 scale-[0.78] -ml-1" />
            <div className="min-w-0">
              <h1 className="text-[16px] font-bold text-text-primary tracking-tighter leading-[1.15] truncate">
                {pageTitle}
              </h1>
              <MarketStatusBadge className="mt-0.5" size="xs" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <KseChip kse={kse} compact />
            {bell}
            {avatar}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="hidden md:flex h-16 bg-surface-card border-b border-surface-hairline px-6 lg:px-8 items-center justify-between shrink-0">
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <h1 className="text-[19px] font-bold text-text-primary tracking-tighter truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <MarketStatusBadge />
        <span className="w-px h-5 bg-surface-border" />
        <KseChip kse={kse} />
      </div>

      <div className="flex-1 flex justify-end items-center gap-2">
        {bell}
        {avatar}
      </div>
    </header>
  );
};
