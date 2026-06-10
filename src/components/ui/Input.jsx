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
        <label className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <LeftIcon className="h-5 w-5" />
          </div>
        )}
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm font-medium">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "flex h-10 w-full rounded-input border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-primary transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-text-secondary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:border-brand-blue focus-visible:shadow-focus",
            "disabled:cursor-not-allowed disabled:opacity-50",
            LeftIcon ? "pl-10" : "",
            prefix ? "pl-12" : "",
            RightIcon ? "pr-10" : "",
            error ? "border-signal-red focus-visible:ring-signal-red focus-visible:border-signal-red" : "",
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">
            <RightIcon className="h-5 w-5" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-signal-red">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  );
});
Input.displayName = "Input";
