import React from 'react';
import { cn } from '../../lib/utils';

export const Toggle = React.forwardRef(({ 
  checked, 
  onChange, 
  className,
  disabled,
  ...props 
}, ref) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-navy" : "bg-[#CBD5E1]",
        className
      )}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface-card shadow-sm transition duration-150 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
});
Toggle.displayName = "Toggle";
