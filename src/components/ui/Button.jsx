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
  
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-sm";
  
  const variants = {
    primary: "bg-brand-blue text-text-inverse hover:bg-brand-blue/90",
    secondary: "bg-surface-muted text-text-primary hover:bg-surface-border",
    ghost: "bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary",
    danger: "bg-signal-red text-text-inverse hover:bg-signal-red/90",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
});
Button.displayName = "Button";
