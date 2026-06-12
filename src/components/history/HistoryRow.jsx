import { Smartphone, CheckCircle2, XCircle } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { motion } from 'framer-motion';

export function HistoryRow({ alert, isExpanded, onToggle }) {
  const alertDate = new Date(alert.triggered_at);
  const timeStr = isToday(alertDate)
    ? `Today ${format(alertDate, 'HH:mm')}`
    : format(alertDate, 'EEE dd MMM · HH:mm');

  const typeColors = {
    support: 'bg-signal-greenBg text-signal-green',
    resistance: 'bg-signal-redBg text-signal-red',
    breakout: 'bg-signal-amberBg text-signal-amber'
  };

  const failed = alert.push_status === 'failed' || alert.push_status === 'error';
  const level = alert.level_value ?? 0;
  const actualPrice = alert.actual_price ?? 0;

  return (
    <>
      <div
        onClick={onToggle}
        className={`grid grid-cols-[140px_1fr_120px_140px_140px_120px_120px] gap-4 px-5 py-4 border-b border-surface-border last:border-b-0 cursor-pointer transition-colors ${
          isExpanded ? 'bg-surface-page' : 'hover:bg-surface-page'
        }`}
      >
        <div className="text-[13px] text-text-secondary self-center">{timeStr}</div>

        <div className="flex flex-col justify-center">
          <span className="text-[14px] font-bold text-text-primary">{alert.company_name}</span>
          <span className="text-[10px] font-bold text-brand-navy bg-surface-muted px-1.5 py-0.5 rounded w-max mt-1">{alert.symbol}</span>
        </div>

        <div className="self-center">
          <span className={`px-2 py-0.5 rounded-pill text-[11px] font-semibold uppercase ${typeColors[alert.level_type] || 'bg-surface-muted text-text-secondary'}`}>
            {alert.level_type}
          </span>
        </div>

        <div className="self-center text-[14px] font-bold tabular-nums text-text-primary">
          PKR {level.toFixed(2)}
        </div>

        <div className="self-center flex flex-col">
          <span className="text-[14px] font-bold tabular-nums text-text-primary">PKR {actualPrice.toFixed(2)}</span>
          <span className="text-[11px] text-text-secondary mt-0.5">
            {actualPrice > level ? '↓ came from above' : '↑ came from below'}
          </span>
        </div>

        <div className="self-center flex gap-2 text-text-secondary">
          <Smartphone size={16} />
        </div>

        <div className="self-center">
          {failed ? (
            <div className="flex items-center gap-1.5 text-signal-red">
              <XCircle size={16} />
              <span className="text-[13px] font-medium">Failed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-signal-green">
              <CheckCircle2 size={16} />
              <span className="text-[13px] font-medium">Delivered</span>
            </div>
          )}
        </div>
      </div>

      <HistoryRowExpanded isExpanded={isExpanded} alert={alert} failed={failed} />
    </>
  );
}

function HistoryRowExpanded({ isExpanded, alert, failed }) {
  if (!isExpanded) return null;

  const level = alert.level_value ?? 0;
  const actualPrice = alert.actual_price ?? 0;
  const deltaPct = level !== 0 ? (((actualPrice - level) / level) * 100).toFixed(2) : '0.00';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="overflow-hidden border-b border-surface-border bg-surface-muted"
    >
      <div className="px-5 py-4 grid grid-cols-3 gap-6 text-[12px]">
        <div>
          <h4 className="font-semibold mb-2 uppercase text-[10px] tracking-wider text-text-secondary">Delivery</h4>
          <div className="space-y-1.5 text-text-primary">
            <div>
              <span className="text-text-secondary">Push Notification:</span>{' '}
              {failed ? 'Failed ✕' : `Delivered at ${format(new Date(alert.triggered_at), 'HH:mm:ss')} PKT ✓`}
            </div>
            {alert.push_status && (
              <div><span className="text-text-secondary">Status:</span> <span className="capitalize">{alert.push_status}</span></div>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2 uppercase text-[10px] tracking-wider text-text-secondary">Alert Rule at Trigger</h4>
          <div className="space-y-1.5 text-text-primary">
            <div className="capitalize"><span className="text-text-secondary">{alert.level_type}:</span> PKR {level.toFixed(2)}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2 uppercase text-[10px] tracking-wider text-text-secondary">Engine Evaluation</h4>
          <div className="space-y-1.5 text-text-primary">
            <div><span className="text-text-secondary">Tick Time:</span> {format(new Date(alert.triggered_at), 'dd MMM HH:mm:ss')} PKT</div>
            <div><span className="text-text-secondary">Price:</span> PKR {actualPrice.toFixed(2)}</div>
            <div><span className="text-text-secondary">Delta:</span> {deltaPct}% from level</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
