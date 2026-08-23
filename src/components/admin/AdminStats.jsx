import { Users, Bell, Zap, Ban, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { cn } from '../../lib/utils';

const TONES = {
  neutral: { plate: 'bg-surface-muted text-text-secondary', value: 'text-text-primary' },
  amber:   { plate: 'bg-signal-amberBg text-signal-amber',  value: 'text-signal-amber' },
  green:   { plate: 'bg-signal-greenBg text-signal-green',  value: 'text-signal-green' },
  red:     { plate: 'bg-signal-redBg text-signal-red',      value: 'text-signal-red' },
};

function StatCard({ label, icon, value, tone = 'neutral', caption }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <div className="sl-card p-3.5 md:p-5 flex flex-col justify-between min-h-[104px] md:min-h-[128px]">
      <div className="flex justify-between items-start gap-2">
        <span className="sl-eyebrow leading-[1.35] pt-0.5">{label}</span>
        <div className={cn('w-7 h-7 md:w-8 md:h-8 rounded-[9px] flex items-center justify-center shrink-0', t.plate)}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className={cn('text-[24px] md:text-[30px] leading-none font-bold sl-num tracking-tighter', t.value)}>
          {value}
        </div>
        <div className="text-[11.5px] md:text-xs text-text-secondary mt-1.5 leading-snug">{caption}</div>
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

  const healthRows = [
    {
      label: 'Last Scrape',
      value: sc.lastScrapedAt ? formatDistanceToNow(new Date(sc.lastScrapedAt), { addSuffix: true }) : '—',
    },
    { label: 'Ticks Last Run', value: sc.ticksLastRun ?? '—' },
    { label: 'Market', value: null, badge: { variant: sc.marketOpen ? 'green' : 'grey', text: sc.marketOpen ? 'Open' : 'Closed' } },
    { label: 'Server (PKT)', value: sc.serverPkt ? new Date(sc.serverPkt).toISOString().slice(11, 16) : '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Total Users"
          icon={<Users className="w-[15px] h-[15px]" />}
          value={s.totalUsers ?? '—'}
          caption={`${s.admins ?? 0} admin${s.admins === 1 ? '' : 's'}`}
        />
        <StatCard
          label="Active Alert Levels"
          icon={<Bell className="w-[15px] h-[15px]" />}
          value={s.activeRules ?? '—'}
          tone="amber"
          caption={`${s.watchlistItems ?? 0} watchlist items`}
        />
        <StatCard
          label="Alerts Today"
          icon={<Zap className="w-[15px] h-[15px]" />}
          value={s.eventsToday ?? '—'}
          tone="green"
          caption={`${s.sentToday ?? 0} sent · ${s.failedToday ?? 0} failed`}
        />
        <StatCard
          label="Restricted Users"
          icon={<Ban className="w-[15px] h-[15px]" />}
          value={s.restricted ?? '—'}
          tone={s.restricted > 0 ? 'red' : 'neutral'}
          caption="blocked from the app"
        />
      </div>

      <Card>
        <CardHeader
          icon={Activity}
          title="Scraper Health"
          action={<Badge variant={health.variant}>{health.label}</Badge>}
        />
        <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {healthRows.map(r => (
            <div key={r.label}>
              <div className="sl-eyebrow mb-1.5">{r.label}</div>
              {r.badge ? (
                <Badge variant={r.badge.variant}>{r.badge.text}</Badge>
              ) : (
                <div className="text-[13.5px] text-text-primary font-semibold sl-num">{r.value}</div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
