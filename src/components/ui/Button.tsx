import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary:
        'bg-accent text-accent-foreground hover:bg-accent-hover active:opacity-90 shadow-sm',
      secondary:
        'bg-surface-hover text-text-primary hover:bg-surface-active border border-border',
      ghost:
        'text-text-muted hover:text-text-primary hover:bg-surface-hover',
      danger:
        'bg-danger text-danger-foreground hover:opacity-90 active:opacity-80 shadow-sm',
      outline:
        'border border-border text-text-primary hover:bg-surface-hover hover:border-border-strong',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

