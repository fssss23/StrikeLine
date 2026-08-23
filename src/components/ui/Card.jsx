import React from 'react';
import { cn } from '../../lib/utils';

/** Standard content surface. `flush` removes body padding for tables/lists. */
export const Card = ({ className, children, ...props }) => (
  <div className={cn('sl-card overflow-hidden', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ icon: Icon, title, subtitle, action, className }) => (
  <div
    className={cn(
      'px-4 md:px-5 py-4 border-b border-surface-hairline flex items-center gap-3',
      className
    )}
  >
    {Icon && (
      <div className="w-8 h-8 rounded-[10px] bg-surface-muted text-text-secondary flex items-center justify-center shrink-0">
        <Icon size={16} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h3 className="text-[15px] font-bold text-text-primary tracking-tighter truncate">{title}</h3>
      {subtitle && <p className="text-[12.5px] text-text-secondary truncate mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
  </div>
);

export const CardBody = ({ className, children }) => (
  <div className={cn('p-4 md:p-5', className)}>{children}</div>
);
