import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bookmark, Clock, Settings, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import { useUserStore } from '../../store/useUserStore';
import { cn } from '../../lib/utils';

/**
 * Floating pill navigation — the primary mobile chrome.
 *
 * Inactive destinations are icon-only; the active one expands into a navy
 * pill with its label. The pill itself is a single shared element animated
 * between destinations with `layoutId`, so switching tabs slides rather than
 * cuts. Sits clear of the iOS home indicator via env(safe-area-inset-bottom).
 */
export const MobileNav = () => {
  const activeAlerts = useActiveAlerts();
  const user = useUserStore(state => state.user);
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'History', path: '/history', icon: Clock, badge: activeAlerts },
    { name: 'Settings', path: '/settings', icon: Settings },
    ...(user?.is_admin ? [{ name: 'Admin', path: '/admin', icon: ShieldCheck }] : []),
  ];

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 z-30 pointer-events-none pb-safe"
      aria-label="Primary"
    >
      <div className="px-3 pb-3 pt-2 flex justify-center">
        <div
          className={cn(
            'pointer-events-auto sl-glass-strong shadow-pillnav',
            'rounded-pill border border-white/70 ring-1 ring-slate-900/[0.04]',
            'flex items-center gap-0.5 p-1.5',
            'max-w-full overflow-hidden'
          )}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                aria-label={item.name}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center justify-center gap-2 h-11 rounded-pill',
                  'tap-none select-none min-w-0 shrink',
                  'transition-[color,transform] duration-200',
                  isActive ? 'px-3.5 text-white' : 'px-2.5 text-text-secondary active:scale-95'
                )}
              >
                {/* One shared pill that travels between destinations */}
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-0 rounded-pill bg-navy-gradient shadow-ctaNavy"
                    transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
                  />
                )}

                <span className="relative flex items-center justify-center shrink-0">
                  <Icon
                    className={cn('w-[21px] h-[21px] transition-transform duration-200', isActive && 'scale-[1.04]')}
                    strokeWidth={isActive ? 2.3 : 2}
                  />
                  {item.badge > 0 && (
                    <span
                      className={cn(
                        'absolute -top-0.5 -right-1 w-[7px] h-[7px] rounded-full bg-signal-red',
                        isActive ? 'ring-2 ring-brand-navy' : 'ring-2 ring-white'
                      )}
                    />
                  )}
                </span>

                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="relative text-[12.5px] font-semibold tracking-tightish whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.span>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
