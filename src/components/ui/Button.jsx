import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon: Icon,
  children,
  disabled,
  ...props
}, ref) => {

  const baseStyles = cn(
    'relative inline-flex items-center justify-center gap-2 font-semibold tracking-tightish whitespace-nowrap',
    'rounded-[10px] select-none tap-none',
    'transition-all duration-200 ease-swift',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2',
    'disabled:opacity-45 disabled:pointer-events-none',
    'active:scale-[0.975]'
  );

  const variants = {
    primary: 'bg-blue-gradient text-text-inverse shadow-cta hover:brightness-[1.06] hover:shadow-lifted',
    navy: 'bg-navy-gradient text-text-inverse shadow-ctaNavy hover:brightness-[1.12]',
    secondary: 'bg-surface-card text-text-primary border border-surface-border shadow-card hover:bg-surface-muted hover:border-slate-300',
    ghost: 'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary',
    danger: 'bg-signal-red text-text-inverse shadow-[0_1px_2px_rgba(220,38,38,0.24),0_6px_16px_-4px_rgba(220,38,38,0.35)] hover:brightness-110',
  };

  const sizes = {
    sm: 'h-9 px-3 text-[13px]',
    md: 'h-10 px-4 text-[13.5px]',
    lg: 'h-12 px-6 text-[15px]',
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="h-4 w-4 shrink-0" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";
