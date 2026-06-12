import { List, Bell, Zap, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useWatchlist } from '../../hooks/queries/useWatchlistQuery';
import { useAlertHistory } from '../../hooks/queries/useAlertHistoryQuery';
import { useMarketStatus } from '../../hooks/useMarketStatus';

function countEnabledLevels(rule) {
  if (!rule) return 0;
  return (rule.support_enabled ? 1 : 0)
    + (rule.resistance_enabled ? 1 : 0)
    + (rule.breakout_enabled ? 1 : 0);
}

function Card({ label, icon, value, valueClass, caption }) {
  return (
    <div className="bg-surface-card rounded-[12px] shadow-card p-5 md:p-6 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">{label}</span>
        <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary">
          {icon}
        </div>
      </div>
      <div>
        <div className={`text-[28px] leading-none font-bold mb-1 ${valueClass || 'text-text-primary'}`}>{value}</div>
        <div className="text-xs text-text-secondary">{caption}</div>
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
    ? `last: ${lastTriggered.symbol} · ${formatDistanceToNow(new Date(lastTriggered.triggered_at), { addSuffix: true })}`
    : 'no alerts triggered yet';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
      <Card
        label="Securities Watched"
        icon={<List className="w-4 h-4" />}
        value={items.length}
        caption={sectorCount > 0 ? `across ${sectorCount} sector${sectorCount > 1 ? 's' : ''}` : 'add securities to get started'}
      />
      <Card
        label="Active Alerts"
        icon={<Bell className="w-4 h-4" />}
        value={activeAlerts}
        valueClass="text-signal-amber"
        caption="across your watchlist"
      />
      <Card
        label="Triggered This Week"
        icon={<Zap className="w-4 h-4" />}
        value={triggeredThisWeek}
        valueClass="text-signal-green"
        caption={lastTriggeredCaption}
      />
      <Card
        label="Market Status"
        icon={<Clock className="w-4 h-4" />}
        value={<span className="capitalize">{status}</span>}
        caption={`${nextEvent} at ${nextEventTime}`}
      />
    </div>
  );
};
