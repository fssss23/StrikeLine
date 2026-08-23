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
        'relative inline-flex h-[26px] w-[46px] shrink-0 cursor-pointer items-center rounded-full',
        'tap-none transition-all duration-250 ease-swift',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'bg-navy-gradient shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]'
          : 'bg-slate-200 shadow-[inset_0_1px_2px_rgba(15,23,42,0.10)]',
        className
      )}
      ref={ref}
      {...props}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white',
          'shadow-[0_1px_3px_rgba(15,23,42,0.25)] transition-transform duration-250 ease-spring',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        )}
      />
    </button>
  );
});
Toggle.displayName = "Toggle";
