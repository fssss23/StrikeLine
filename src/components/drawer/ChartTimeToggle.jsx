import React from 'react';
import { cn } from '../../lib/utils';

export function ChartTimeToggle({ activeTimeframe, onChange }) {
  const timeframes = ['1D', '1W', '1M'];

  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <span className="sl-eyebrow">Price action</span>
      <div className="flex gap-0.5 bg-surface-muted p-0.5 rounded-[10px] ring-1 ring-inset ring-slate-900/[0.04]">
        {timeframes.map(tf => {
          const isActive = activeTimeframe === tf;
          return (
            <button
              key={tf}
              type="button"
              onClick={() => onChange(tf)}
              className={cn(
                'sl-tap px-2.5 h-7 rounded-[8px] text-[12px] font-semibold transition-all duration-200 sl-num',
                isActive
                  ? 'bg-surface-card text-brand-navy shadow-card'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {tf}
            </button>
          );
        })}
      </div>
    </div>
  );
}
