import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/utils';

/** Empty state — soft dashed surface with a tinted icon plate. */
export const EmptyState = ({ icon: Icon, title, description, action, className, tone = 'blue' }) => {
  const tones = {
    blue: 'bg-brand-blueSoft text-brand-blue',
    grey: 'bg-surface-muted text-text-tertiary',
    green: 'bg-signal-greenBg text-signal-green',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'py-12 md:py-16 px-6 rounded-xcard border border-dashed border-surface-border bg-surface-card/60',
        className
      )}
    >
      {Icon && (
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', tones[tone])}>
          <Icon className="w-[22px] h-[22px]" />
        </div>
      )}
      <h3 className="text-[16px] font-bold text-text-primary tracking-tighter mb-1.5">{title}</h3>
      {description && (
        <p className="text-[13.5px] text-text-secondary max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

/** Error state with a retry affordance. */
export const ErrorState = ({ title = "Something went wrong", message, onRetry, className }) => (
  <div className={cn('sl-card p-8 md:p-10 flex flex-col items-center text-center', className)}>
    <div className="w-12 h-12 rounded-2xl bg-signal-redBg text-signal-red flex items-center justify-center mb-4">
      <AlertTriangle className="w-[22px] h-[22px]" />
    </div>
    <h3 className="text-[16px] font-bold text-text-primary tracking-tighter mb-1.5">{title}</h3>
    {message && <p className="text-[13.5px] text-text-secondary mb-5 max-w-sm">{message}</p>}
    {onRetry && <Button variant="navy" size="sm" onClick={onRetry}>Try again</Button>}
  </div>
);
