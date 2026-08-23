import { Smartphone, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const TYPE_STYLES = {
  support: 'bg-signal-greenBg text-signal-green ring-signal-green/15',
  resistance: 'bg-signal-redBg text-signal-red ring-signal-red/15',
  breakout: 'bg-signal-amberBg text-signal-amber ring-signal-amber/15',
};

function TypePill({ type, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-pill text-[10.5px] font-bold uppercase tracking-[0.05em] ring-1 ring-inset',
        TYPE_STYLES[type] || 'bg-surface-muted text-text-secondary ring-slate-900/[0.05]',
        className
      )}
    >
      {type}
    </span>
  );
}

function DeliveryStatus({ failed, compact }) {
  return failed ? (
    <span className="inline-flex items-center gap-1.5 text-signal-red">
      <XCircle size={compact ? 14 : 16} />
      <span className={compact ? 'text-[12px] font-semibold' : 'text-[13px] font-medium'}>Failed</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-signal-green">
      <CheckCircle2 size={compact ? 14 : 16} />
      <span className={compact ? 'text-[12px] font-semibold' : 'text-[13px] font-medium'}>Delivered</span>
    </span>
  );
}

export function HistoryRow({ alert, isExpanded, onToggle }) {
  const alertDate = new Date(alert.triggered_at);
  const timeStr = isToday(alertDate)
    ? `Today ${format(alertDate, 'HH:mm')}`
    : format(alertDate, 'EEE dd MMM · HH:mm');

  const failed = alert.push_status === 'failed' || alert.push_status === 'error';
  const level = alert.level_value ?? 0;
  const actualPrice = alert.actual_price ?? 0;
  const direction = actualPrice > level ? '↓ came from above' : '↑ came from below';

  return (
    <div
      className={cn(
        'transition-colors',
        // Mobile: standalone card. Desktop: flush row inside the table card.
        'bg-surface-card rounded-xcard border border-surface-hairline shadow-card',
        'md:rounded-none md:border-0 md:border-b md:border-surface-hairline md:shadow-none md:last:border-b-0',
        isExpanded && 'md:bg-surface-page'
      )}
    >
      {/* ---------------- Mobile ---------------- */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="md:hidden w-full text-left p-3.5 tap-none"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <TypePill type={alert.level_type} />
          <span className="text-[11.5px] text-text-tertiary sl-num shrink-0">{timeStr}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-text-primary truncate tracking-tightish">
              {alert.company_name}
            </p>
            <p className="text-[11.5px] font-bold text-brand-navy mt-0.5">{alert.symbol}</p>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-tertiary shrink-0 mt-0.5 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-surface-hairline">
          <div>
            <p className="sl-eyebrow mb-1">Level</p>
            <p className="text-[14px] font-bold sl-num text-text-primary">{level.toFixed(2)}</p>
          </div>
          <div>
            <p className="sl-eyebrow mb-1">Actual</p>
            <p className="text-[14px] font-bold sl-num text-text-primary">{actualPrice.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-3">
          <DeliveryStatus failed={failed} compact />
          <span className="text-[11px] text-text-tertiary">{direction}</span>
        </div>
      </button>

      {/* ---------------- Desktop ---------------- */}
      <div
        onClick={onToggle}
        className={cn(
          'hidden md:grid grid-cols-[132px_1fr_112px_128px_140px_88px_116px] gap-4 px-5 py-3.5',
          'cursor-pointer transition-colors',
          !isExpanded && 'hover:bg-surface-page'
        )}
      >
        <div className="text-[12.5px] text-text-secondary self-center sl-num">{timeStr}</div>

        <div className="flex flex-col justify-center min-w-0">
          <span className="text-[13.5px] font-semibold text-text-primary truncate tracking-tightish">
            {alert.company_name}
          </span>
          <span className="text-[11px] font-bold text-brand-navy mt-0.5">{alert.symbol}</span>
        </div>

        <div className="self-center"><TypePill type={alert.level_type} /></div>

        <div className="self-center text-[13.5px] font-bold sl-num text-text-primary">
          <span className="text-text-tertiary font-medium text-[11px] mr-1">PKR</span>{level.toFixed(2)}
        </div>

        <div className="self-center flex flex-col">
          <span className="text-[13.5px] font-bold sl-num text-text-primary">
            <span className="text-text-tertiary font-medium text-[11px] mr-1">PKR</span>{actualPrice.toFixed(2)}
          </span>
          <span className="text-[11px] text-text-tertiary mt-0.5">{direction}</span>
        </div>

        <div className="self-center flex gap-2 text-text-tertiary">
          <Smartphone size={16} />
        </div>

        <div className="self-center"><DeliveryStatus failed={failed} /></div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && <HistoryRowExpanded alert={alert} failed={failed} />}
      </AnimatePresence>
    </div>
  );
}

function HistoryRowExpanded({ alert, failed }) {
  const level = alert.level_value ?? 0;
  const actualPrice = alert.actual_price ?? 0;
  const deltaPct = level !== 0 ? (((actualPrice - level) / level) * 100).toFixed(2) : '0.00';

  const blocks = [
    {
      title: 'Delivery',
      rows: [
        ['Push notification', failed ? 'Failed' : `Delivered ${format(new Date(alert.triggered_at), 'HH:mm:ss')} PKT`],
        ...(alert.push_status ? [['Status', alert.push_status]] : []),
      ],
    },
    {
      title: 'Alert rule at trigger',
      rows: [[alert.level_type, `PKR ${level.toFixed(2)}`]],
    },
    {
      title: 'Engine evaluation',
      rows: [
        ['Tick time', `${format(new Date(alert.triggered_at), 'dd MMM HH:mm:ss')} PKT`],
        ['Price', `PKR ${actualPrice.toFixed(2)}`],
        ['Delta', `${deltaPct}% from level`],
      ],
    },
  ];

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden bg-surface-sunken border-t border-surface-hairline"
    >
      <div className="px-4 md:px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-5 text-[12px]">
        {blocks.map(block => (
          <div key={block.title}>
            <h4 className="sl-eyebrow mb-2">{block.title}</h4>
            <div className="space-y-1.5">
              {block.rows.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 sm:block">
                  <span className="text-text-tertiary capitalize shrink-0">{label}</span>{' '}
                  <span className="text-text-primary font-medium capitalize text-right sm:text-left">{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
