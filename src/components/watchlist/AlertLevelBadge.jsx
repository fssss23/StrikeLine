import React from 'react';
import { cn } from '../../lib/utils';

const CONFIG = {
  support:    { prefix: 'S', on: 'bg-signal-greenBg text-signal-green ring-signal-green/18' },
  resistance: { prefix: 'R', on: 'bg-signal-redBg text-signal-red ring-signal-red/18' },
  breakout:   { prefix: 'B', on: 'bg-signal-amberBg text-signal-amber ring-signal-amber/18' },
};

export const AlertLevelBadge = ({ type, level, enabled, triggered }) => {
  const c = CONFIG[type] ?? CONFIG.breakout;
  const base = 'inline-flex items-center gap-1 px-2 h-[22px] rounded-pill text-[11px] font-semibold sl-num ring-1 ring-inset whitespace-nowrap';

  if (level === null || level === undefined) {
    return (
      <span
        className={cn(
          base,
          'bg-surface-muted/70 text-text-tertiary ring-slate-900/[0.05] border-dashed'
        )}
      >
        {c.prefix} <span className="opacity-70">—</span>
      </span>
    );
  }

  return (
    <span className={cn(base, c.on, !enabled && 'opacity-40 saturate-50')}>
      {triggered && <span aria-hidden="true">⚡</span>}
      <span className="font-bold">{c.prefix}</span>
      {level.toFixed(2)}
    </span>
  );
};
