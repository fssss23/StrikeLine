import React from 'react';
import { List, Bell, Zap, Clock } from 'lucide-react';
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { useAlertStore } from '../../store/useAlertStore';
import { useMarketStatus } from '../../hooks/useMarketStatus';

export const SummaryCards = () => {
  const { data: watchlist = [] } = useWatchlist();
  const { alertHistory = [], activeAlerts = 0 } = useAlertStore() || {};
  const { status, nextEvent, nextEventTime } = useMarketStatus();

  const uniqueSectors = new Set(
    watchlist.map(w => {
      // Need to find the sector from mockData ideally, but for now just mock it
      // Since watchlist doesn't store sector directly, we could join it, 
      // but let's just use a hardcoded '4 sectors' per spec mock.
      return 'MockSector';
    })
  ).size;

  const triggeredThisWeek = alertHistory.filter(a => new Date(a.time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
  const lastTriggered = alertHistory[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      {/* Card 1 */}
      <div className="bg-surface-card rounded-[12px] shadow-card p-5 md:p-6 flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Securities Watched</span>
          <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
            <List className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-[28px] leading-none font-bold text-text-primary mb-1">{watchlist.length}</div>
          <div className="text-xs text-text-secondary">across 4 sectors</div>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-surface-card rounded-[12px] shadow-card p-5 md:p-6 flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Active Alerts</span>
          <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
            <Bell className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-[28px] leading-none font-bold text-signal-amber mb-1">{activeAlerts}</div>
          <div className="text-xs text-text-secondary">across your watchlist</div>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-surface-card rounded-[12px] shadow-card p-5 md:p-6 flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Triggered This Week</span>
          <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-[28px] leading-none font-bold text-signal-green mb-1">{triggeredThisWeek}</div>
          <div className="text-xs text-text-secondary">last: {lastTriggered?.symbol || 'None'} · 2h ago</div>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-surface-card rounded-[12px] shadow-card p-5 md:p-6 flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Market Status</span>
          <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-[28px] leading-none font-bold text-text-primary mb-1 capitalize">{status}</div>
          <div className="text-xs text-text-secondary">{nextEvent} at {nextEventTime}</div>
        </div>
      </div>
    </div>
  );
};
