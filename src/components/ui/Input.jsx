import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef(({
  className,
  label,
  error,
  hint,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  prefix,
  ...props
}, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-[13px] font-semibold text-text-primary tracking-tightish">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
            <LeftIcon className="h-[18px] w-[18px]" />
          </div>
        )}
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium pointer-events-none">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            // 16px base font on mobile stops iOS Safari zooming on focus; the
            // label/hint carry the smaller type instead.
            'flex h-11 w-full rounded-[10px] border border-surface-border bg-surface-card px-3.5',
            'text-[16px] md:text-[14px] text-text-primary shadow-inset',
            'transition-all duration-200 ease-swift',
            'placeholder:text-text-tertiary',
            'focus-visible:outline-none focus-visible:border-brand-blue focus-visible:shadow-focus',
            'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-surface-muted',
            LeftIcon ? 'pl-10' : '',
            prefix ? 'pl-12' : '',
            RightIcon ? 'pr-10' : '',
            error ? 'border-signal-red focus-visible:border-signal-red focus-visible:shadow-[0_0_0_3px_rgba(220,38,38,0.15)]' : '',
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            <RightIcon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      {error && <p className="text-[12px] font-medium text-signal-red">{error}</p>}
      {!error && hint && <p className="text-[12px] text-text-secondary">{hint}</p>}
    </div>
  );
});
Input.displayName = "Input";
