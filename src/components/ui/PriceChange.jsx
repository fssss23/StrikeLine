import React from 'react';
import { cn } from '../../lib/utils';

export const PriceChange = ({ value, absolute, className }) => {
  const isUp = value > 0;
  const isDown = value < 0;
  
  return (
    <div className={cn("flex flex-col items-end", className)}>
      <span className={cn(
        "tabular-nums font-bold text-sm",
        isUp ? "text-signal-green" : isDown ? "text-signal-red" : "text-text-secondary"
      )}>
        {isUp ? '▲' : isDown ? '▼' : ''} {Math.abs(value).toFixed(2)}%
      </span>
      {absolute !== undefined && (
        <span className="tabular-nums text-xs text-text-secondary">
          {isUp ? '+' : isDown ? '-' : ''}{Math.abs(absolute).toFixed(2)}
        </span>
      )}
    </div>
  );
};
