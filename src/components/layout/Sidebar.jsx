import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bookmark, Clock, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { StrikeLineLogo } from '../logo/StrikeLineLogo';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import { useMarketStatus } from '../../hooks/useMarketStatus';
import { useUserStore } from '../../store/useUserStore';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export const Sidebar = ({ className }) => {
  const activeAlerts = useActiveAlerts();
  const user = useUserStore(state => state.user);
  const location = useLocation();
  const { status, label, nextEvent, nextEventTime } = useMarketStatus();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Logout failed:', err.message);
      toast.error('Failed to sign out — please try again');
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'History', path: '/history', icon: Clock, badge: activeAlerts },
    { name: 'Settings', path: '/settings', icon: Settings },
    ...(user?.is_admin ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
  ];

  const displayName = user?.display_name || user?.email?.split('@')[0] || 'User';

  return (
    <aside className={cn('bg-navy-gradient w-[248px] flex-col h-full hidden md:flex relative', className)}>
      {/* Faint top-light so the navy panel reads as a lit surface, not a slab */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-60"
        style={{ background: 'radial-gradient(120% 70% at 20% 0%, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0) 70%)' }}
      />

      <div className="h-16 flex items-center px-6 border-b border-white/[0.08] shrink-0 relative">
        <StrikeLineLogo variant="inverse" />
      </div>

      <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto relative">
        <span className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.11em] text-white/35">
          Navigate
        </span>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={cn(
                'group relative flex items-center gap-3 h-11 px-3.5 rounded-[10px] transition-colors duration-200',
                isActive ? 'text-text-inverse' : 'text-sidebar-textInactive hover:text-text-inverse hover:bg-white/[0.05]'
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-[10px] bg-white/[0.09] ring-1 ring-inset ring-white/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-bar"
                  className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-brand-blueLight"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <item.icon
                className="w-[18px] h-[18px] relative shrink-0 transition-transform duration-200 group-hover:scale-105"
                strokeWidth={isActive ? 2.3 : 2}
              />
              <span className="relative font-medium text-[13.5px] tracking-tightish flex-1">{item.name}</span>
              {item.badge > 0 && (
                <span className="relative bg-signal-red min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white tabular-nums">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="mt-auto pt-6">
          <div className="mx-1 rounded-[12px] bg-white/[0.04] ring-1 ring-inset ring-white/[0.07] px-3.5 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-1.5 w-1.5">
                {status === 'open' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-green opacity-75" />
                )}
                <span className={cn(
                  'relative inline-flex rounded-full h-1.5 w-1.5',
                  status === 'open' ? 'bg-signal-green' : status === 'pre-open' ? 'bg-signal-amber' : 'bg-white/40'
                )} />
              </span>
              <span className="text-[11px] font-semibold text-white/85 tracking-tightish">{label}</span>
            </div>
            <p className="text-[11px] text-white/40 tabular-nums">{nextEvent} {nextEventTime}</p>
          </div>
        </div>
      </nav>

      <div className="p-3 border-t border-white/[0.08] relative">
        <div className="flex items-center gap-3 rounded-[12px] px-2.5 py-2.5 hover:bg-white/[0.05] transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blueLight to-brand-blue flex items-center justify-center text-text-inverse font-bold text-[12px] shrink-0 ring-1 ring-white/20">
            {displayName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-text-inverse truncate tracking-tightish">{displayName}</p>
            <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-white/40 hover:text-text-inverse hover:bg-white/10 rounded-lg transition-colors shrink-0 p-1.5"
            aria-label="Sign out"
          >
            <LogOut className="w-[17px] h-[17px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};
