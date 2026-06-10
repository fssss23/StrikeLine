import React from 'react';
import { cn } from '../../lib/utils';

export function ChartTimeToggle({ activeTimeframe, onChange }) {
  const timeframes = ['1D', '1W', '1M'];

  return (
    <div className="flex flex-row justify-end gap-1.5 mb-3">
      {timeframes.map(tf => {
        const isActive = activeTimeframe === tf;
        return (
          <button
            key={tf}
            onClick={() => onChange(tf)}
            className={cn(
              "px-3 py-1 rounded-full text-[13px] font-medium transition-colors",
              isActive 
                ? "bg-brand-navy text-white" 
                : "bg-surface-muted text-text-secondary hover:bg-surface-border"
            )}
          >
            {tf}
          </button>
        );
      })}
    </div>
  );
}
