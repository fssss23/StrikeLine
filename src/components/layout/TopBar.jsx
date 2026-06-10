import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { MarketStatusBadge } from '../ui/MarketStatusBadge';
import { useAlertStore } from '../../store/useAlertStore';
import { useUserStore } from '../../store/useUserStore';

const pageTitles = {
  '/': 'Dashboard',
  '/watchlist': 'Watchlist',
  '/alerts': 'Alerts',
  '/history': 'Alert History',
  '/settings': 'Settings',
};

export const TopBar = () => {
  const activeAlerts = useAlertStore((state) => state.activeAlerts);
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="h-16 bg-surface-card border-b border-surface-border px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex-1 flex items-center gap-4">
        <h1 className="text-lg font-bold text-text-primary hidden md:block">{pageTitle}</h1>
      </div>

      <div className="flex-1 flex justify-center items-center gap-3">
        <MarketStatusBadge />
        <span className="hidden md:inline-block text-text-secondary">|</span>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">KSE-100</span>
          <span className="text-sm font-bold tabular-nums text-text-primary">46,218.40</span>
          <span className="text-sm font-bold tabular-nums text-signal-green">▲ 0.42%</span>
        </div>
      </div>

      <div className="flex-1 flex justify-end items-center gap-4">
        <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
          <Bell className="w-5 h-5" />
          {activeAlerts > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-signal-red rounded-full"></span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-surface-muted border border-surface-border flex items-center justify-center">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
      </div>
    </header>
  );
};
