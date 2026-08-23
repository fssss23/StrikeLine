import React from 'react';
import { useMarketStatus } from '../../hooks/useMarketStatus';
import { cn } from '../../lib/utils';

export const MarketStatusBadge = ({ className, size = 'sm' }) => {
  const { status, label, nextEvent, nextEventTime } = useMarketStatus();

  const dot = status === 'open'
    ? 'bg-signal-green'
    : status === 'pre-open' ? 'bg-signal-amber' : 'bg-text-tertiary';

  return (
    <div className={cn('flex items-center gap-1.5 min-w-0', className)}>
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {status === 'open' && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dot)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dot)} />
      </span>
      <span
        className={cn(
          'font-semibold text-text-secondary tracking-tightish truncate',
          size === 'xs' ? 'text-[11px]' : 'text-[13px]'
        )}
      >
        {label}
      </span>
      {size !== 'xs' && (
        <span className="text-[12px] text-text-tertiary tabular-nums whitespace-nowrap">
          · {nextEvent} {nextEventTime}
        </span>
      )}
    </div>
  );
};
