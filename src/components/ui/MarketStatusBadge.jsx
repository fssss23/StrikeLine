import React from 'react';
import { useMarketStatus } from '../../hooks/useMarketStatus';
import { cn } from '../../lib/utils';

export const MarketStatusBadge = ({ className }) => {
  const { status, label } = useMarketStatus();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-2 w-2">
        {status === 'open' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-green opacity-75"></span>
        )}
        <span className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          status === 'open' ? 'bg-signal-green' : status === 'pre-open' ? 'bg-signal-amber' : 'bg-text-secondary'
        )}></span>
      </div>
      <span className="text-sm font-medium text-text-primary">{label}</span>
    </div>
  );
};
