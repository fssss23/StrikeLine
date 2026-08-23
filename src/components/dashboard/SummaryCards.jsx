import { List, Bell, Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { useAlertHistory } from '../../hooks/queries/useAlertHistoryQuery';
import { useMarketStatus } from '../../hooks/useMarketStatus';
import { cn } from '../../lib/utils';

function countEnabledLevels(rule) {
  if (!rule) return 0;
  return (rule.support_enabled ? 1 : 0)
    + (rule.resistance_enabled ? 1 : 0)
    + (rule.breakout_enabled ? 1 : 0);
}

const TONES = {
  neutral: { plate: 'bg-surface-muted text-text-secondary', value: 'text-text-primary' },
  amber:   { plate: 'bg-signal-amberBg text-signal-amber',  value: 'text-signal-amber' },
  green:   { plate: 'bg-signal-greenBg text-signal-green',  value: 'text-signal-green' },
  blue:    { plate: 'bg-brand-blueSoft text-brand-blue',    value: 'text-text-primary' },
};

function StatCard({ label, icon, value, caption, tone = 'neutral', delay = 0 }) {
  const t = TONES[tone] || TONES.neutral;

  return (
    <div
      className="sl-card-interactive p-3.5 md:p-5 flex flex-col justify-between min-h-[104px] md:min-h-[132px] animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
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
        <div className="text-[11.5px] md:text-xs text-text-secondary mt-1.5 leading-snug line-clamp-2">
          {caption}
        </div>
      </div>
    </div>
  );
}

export const SummaryCards = () => {
  const { data: watchlist } = useWatchlist();
  const { data: alertHistory } = useAlertHistory();
  const { status, nextEvent, nextEventTime } = useMarketStatus();

  const items = watchlist || [];
  const events = alertHistory || [];

  const sectorCount = new Set(
    items.map(w => w.securities?.sector).filter(Boolean)
  ).size;

  const activeAlerts = items.reduce((sum, w) => sum + countEnabledLevels(w.alert_rule), 0);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const triggeredThisWeek = events.filter(e => new Date(e.triggered_at).getTime() > weekAgo).length;
  const lastTriggered = events[0];
  const lastTriggeredCaption = lastTriggered
    ? `${lastTriggered.symbol} · ${formatDistanceToNow(new Date(lastTriggered.triggered_at), { addSuffix: true })}`
    : 'no alerts triggered yet';

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        label="Securities Watched"
        icon={<List className="w-[15px] h-[15px]" />}
        value={items.length}
        delay={0}
        caption={sectorCount > 0 ? `across ${sectorCount} sector${sectorCount > 1 ? 's' : ''}` : 'add securities to get started'}
      />
      <StatCard
        label="Active Alerts"
        icon={<Bell className="w-[15px] h-[15px]" />}
        value={activeAlerts}
        tone="amber"
        delay={50}
        caption="levels armed across your watchlist"
      />
      <StatCard
        label="Triggered This Week"
        icon={<Zap className="w-[15px] h-[15px]" />}
        value={triggeredThisWeek}
        tone="green"
        delay={100}
        caption={lastTriggeredCaption}
      />
      <StatCard
        label="Market Status"
        icon={<Clock className="w-[15px] h-[15px]" />}
        value={<span className="capitalize text-[20px] md:text-[26px]">{status}</span>}
        tone="blue"
        delay={150}
        caption={`${nextEvent} at ${nextEventTime}`}
      />
    </div>
  );
};
