import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({ children, variant = 'grey', size = 'sm', className }) => {
  const baseStyles = 'inline-flex items-center justify-center gap-1 font-semibold rounded-pill whitespace-nowrap tracking-tightish';

  const variants = {
    green: 'bg-signal-greenBg text-signal-green ring-1 ring-inset ring-signal-green/15',
    red: 'bg-signal-redBg text-signal-red ring-1 ring-inset ring-signal-red/15',
    amber: 'bg-signal-amberBg text-signal-amber ring-1 ring-inset ring-signal-amber/15',
    blue: 'bg-brand-blueSoft text-brand-blue ring-1 ring-inset ring-brand-blue/15',
    navy: 'bg-brand-navy text-text-inverse',
    grey: 'bg-surface-muted text-text-secondary ring-1 ring-inset ring-slate-900/[0.05]',
    outline: 'bg-surface-card text-text-secondary ring-1 ring-inset ring-surface-border',
  };

  const sizes = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-[12.5px]',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
