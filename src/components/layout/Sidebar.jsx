import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bookmark, Bell, Clock, Settings, LogOut } from 'lucide-react';
import { StrikeLineLogo } from '../logo/StrikeLineLogo';
import { useAlertStore } from '../../store/useAlertStore';
import { useUserStore } from '../../store/useUserStore';
import { cn } from '../../lib/utils';

export const Sidebar = ({ className }) => {
  const activeAlerts = useAlertStore((state) => state.activeAlerts);
  const { user, logout } = useUserStore();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: activeAlerts },
    { name: 'History', path: '/history', icon: Clock, badge: activeAlerts },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn("bg-brand-navy w-[240px] flex-col h-full hidden md:flex", className)}>
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <StrikeLineLogo variant="inverse" />
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 h-11 px-4 rounded-sm transition-colors border-l-[3px]",
              isActive 
                ? "text-text-inverse border-brand-blue bg-white/5" 
                : "text-sidebar-textInactive border-transparent hover:bg-white/5 hover:text-text-inverse"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm flex-1">{item.name}</span>
            {item.badge > 0 && (
              <span className="bg-signal-red w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-navyLight flex items-center justify-center text-text-inverse font-semibold text-sm shrink-0">
            {(user?.name || user?.email || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-inverse truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-sidebar-textInactive truncate">{user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="text-sidebar-textInactive hover:text-text-inverse transition-colors shrink-0 p-1"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
