import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bookmark, Clock, Settings } from 'lucide-react';
import { useActiveAlerts } from '../../hooks/useActiveAlerts';
import { cn } from '../../lib/utils';

export const MobileNav = () => {
  const activeAlerts = useActiveAlerts();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'History', path: '/history', icon: Clock, badge: activeAlerts },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-surface-border pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "relative p-3 flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-brand-blue" : "text-text-secondary"
            )}
          >
            <item.icon className="w-6 h-6" />
            {item.badge > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-signal-red rounded-full"></span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
