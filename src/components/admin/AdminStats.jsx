import { Users, Bell, Zap, Ban, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/Badge';

function StatCard({ label, icon, value, valueClass, caption }) {
  return (
    <div className="bg-surface-card rounded-[12px] shadow-card p-5 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</span>
        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-[28px] leading-none font-bold mb-1 tabular-nums ${valueClass || 'text-text-primary'}`}>{value}</div>
        <div className="text-xs text-text-secondary">{caption}</div>
      </div>
    </div>
  );
}

// Stale if the last scrape is older than ~3 minutes during market hours
function scrapeHealth(lastScrapedAt, marketOpen) {
  if (!lastScrapedAt) return { variant: 'grey', label: 'No data' };
  const ageMs = Date.now() - new Date(lastScrapedAt).getTime();
  if (marketOpen && ageMs > 3 * 60 * 1000) return { variant: 'red', label: 'Stalled' };
  if (ageMs > 35 * 60 * 1000) return { variant: 'grey', label: 'Idle' };
  return { variant: 'green', label: 'Healthy' };
}

export function AdminStats({ stats, scraper }) {
  const s = stats || {};
  const sc = scraper || {};
  const health = scrapeHealth(sc.lastScrapedAt, sc.marketOpen);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          icon={<Users className="w-4 h-4" />}
          value={s.totalUsers ?? '—'}
          caption={`${s.admins ?? 0} admin${s.admins === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Active Alert Levels"
          icon={<Bell className="w-4 h-4" />}
          value={s.activeRules ?? '—'}
          valueClass="text-signal-amber"
          caption={`${s.watchlistItems ?? 0} watchlist items`}
        />
        <StatCard
          label="Alerts Today"
          icon={<Zap className="w-4 h-4" />}
          value={s.eventsToday ?? '—'}
          valueClass="text-signal-green"
          caption={`${s.sentToday ?? 0} sent · ${s.failedToday ?? 0} failed`}
        />
        <StatCard
          label="Restricted Users"
          icon={<Ban className="w-4 h-4" />}
          value={s.restricted ?? '—'}
          valueClass={s.restricted > 0 ? 'text-signal-red' : undefined}
          caption="blocked from the app"
        />
      </div>

      <div className="bg-white border border-surface-border rounded-[12px] shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-text-primary" />
          <h3 className="text-[15px] font-bold text-text-primary">Scraper Health</h3>
          <Badge variant={health.variant} className="ml-auto">{health.label}</Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">Last Scrape</div>
            <div className="text-text-primary font-medium tabular-nums">
              {sc.lastScrapedAt ? formatDistanceToNow(new Date(sc.lastScrapedAt), { addSuffix: true }) : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">Ticks Last Run</div>
            <div className="text-text-primary font-medium tabular-nums">{sc.ticksLastRun ?? '—'}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">Market</div>
            <div className="text-text-primary font-medium">
              <Badge variant={sc.marketOpen ? 'green' : 'grey'}>{sc.marketOpen ? 'Open' : 'Closed'}</Badge>
            </div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-text-secondary mb-1">Server (PKT)</div>
            <div className="text-text-primary font-medium tabular-nums">
              {sc.serverPkt ? new Date(sc.serverPkt).toISOString().slice(11, 16) : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
