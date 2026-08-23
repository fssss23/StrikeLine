import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Percentage (and optional absolute) price delta.
 * `layout="inline"` puts both on one line — used in dense mobile rows.
 */
export const PriceChange = ({ value, absolute, className, layout = 'stacked', size = 'sm' }) => {
  const hasValue = typeof value === 'number' && !Number.isNaN(value);
  const isUp = hasValue && value > 0;
  const isDown = hasValue && value < 0;

  const tone = isUp ? 'text-signal-green' : isDown ? 'text-signal-red' : 'text-text-tertiary';
  const pctSize = size === 'lg' ? 'text-[15px]' : size === 'md' ? 'text-[14px]' : 'text-[13px]';

  if (!hasValue) {
    return <span className={cn('sl-num text-text-tertiary', pctSize, className)}>—</span>;
  }

  return (
    <div
      className={cn(
        layout === 'inline' ? 'flex items-baseline gap-1.5' : 'flex flex-col items-end',
        className
      )}
    >
      <span className={cn('sl-num font-bold', pctSize, tone)}>
        {isUp ? '▲' : isDown ? '▼' : ''} {Math.abs(value).toFixed(2)}%
      </span>
      {typeof absolute === 'number' && !Number.isNaN(absolute) && (
        <span className="sl-num text-[11.5px] text-text-tertiary">
          {isUp ? '+' : isDown ? '−' : ''}{Math.abs(absolute).toFixed(2)}
        </span>
      )}
    </div>
  );
};
