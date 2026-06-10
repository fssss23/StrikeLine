import React from 'react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export const AlertLevelBadge = ({ type, level, enabled, triggered }) => {
  if (level === null || level === undefined) {
    const label = type === 'support' ? 'S' : type === 'resistance' ? 'R' : 'B';
    return (
      <button className="px-2 py-0.5 rounded-pill text-[11px] font-medium border border-transparent bg-surface-muted text-text-secondary hover:border-surface-border transition-colors">
        + Set {label}
      </button>
    );
  }

  const baseClasses = "px-2 py-0.5 rounded-pill text-[11px] font-medium border tabular-nums flex items-center gap-1";
  
  let typeClasses = "";
  let prefix = type === 'support' ? 'S' : type === 'resistance' ? 'R' : 'B';

  if (type === 'support') {
    typeClasses = "bg-signal-greenBg text-signal-green border-signal-green/20";
  } else if (type === 'resistance') {
    typeClasses = "bg-signal-redBg text-signal-red border-signal-red/20";
  } else {
    typeClasses = "bg-signal-amberBg text-signal-amber border-signal-amber/20";
  }

  return (
    <div className={cn(baseClasses, typeClasses, !enabled && "opacity-40")}>
      {triggered && <span>⚡</span>}
      {prefix} {level.toFixed(2)}
    </div>
  );
};
