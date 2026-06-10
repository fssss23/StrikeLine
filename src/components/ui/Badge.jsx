import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({ children, variant = 'grey', size = 'sm', className }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-pill";
  
  const variants = {
    green: "bg-signal-greenBg text-signal-green border border-signal-green/20",
    red: "bg-signal-redBg text-signal-red border border-signal-red/20",
    amber: "bg-signal-amberBg text-signal-amber border border-signal-amber/20",
    navy: "bg-brand-navy text-text-inverse",
    grey: "bg-surface-muted text-text-secondary border border-surface-border",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};
