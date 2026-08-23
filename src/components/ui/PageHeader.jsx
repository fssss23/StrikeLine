import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Consistent page masthead. The eyebrow + tight title + muted subtitle
 * pattern is what gives every screen the same editorial rhythm.
 */
export const PageHeader = ({ eyebrow, title, subtitle, count, action, className }) => (
  <div className={cn('flex items-start justify-between gap-3 mb-5', className)}>
    <div className="min-w-0">
      {eyebrow && <p className="sl-eyebrow mb-1.5">{eyebrow}</p>}
      <div className="flex items-center gap-2.5">
        <h1 className="text-[21px] md:text-2xl font-bold text-text-primary tracking-tighter leading-tight">
          {title}
        </h1>
        {count != null && (
          <span className="bg-surface-muted text-text-secondary text-[11.5px] font-bold px-2 py-0.5 rounded-pill tabular-nums ring-1 ring-inset ring-slate-900/[0.05]">
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-[13px] md:text-sm text-text-secondary mt-1.5 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="shrink-0 pt-1">{action}</div>}
  </div>
);
