import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'outline'
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'rank-bronze'
    | 'rank-silver'
    | 'rank-gold'
    | 'rank-platinum'
    | 'rank-diamond'
    | 'rank-crown'
    | 'rank-conqueror';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const variants = {
    default: 'bg-surface-hover text-text-primary border border-border',
    secondary: 'bg-bg-subtle text-text-muted border border-border',
    outline: 'border border-border text-text-primary',
    accent: 'bg-accent-subtle text-accent border border-accent/20',
    success: 'bg-success-subtle text-success border border-success/20',
    warning: 'bg-warning-subtle text-warning border border-warning/20',
    danger: 'bg-danger-subtle text-danger border border-danger/20',
    /* Rank Tier Artwork Badges */
    'rank-bronze': 'bg-rank-bronze/15 text-rank-bronze border border-rank-bronze/30',
    'rank-silver': 'bg-surface-hover text-text-muted border border-border-strong',
    'rank-gold': 'bg-rank-gold/15 text-rank-gold border border-rank-gold/30',
    'rank-platinum': 'bg-rank-platinum/15 text-rank-platinum border border-rank-platinum/30',
    'rank-diamond': 'bg-rank-diamond/15 text-rank-diamond border border-rank-diamond/30',
    'rank-crown': 'bg-rank-crown/15 text-rank-crown border border-rank-crown/30',
    'rank-conqueror': 'bg-rank-conqueror/15 text-rank-conqueror border border-rank-conqueror/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props} />;
};
Badge.displayName = 'Badge';
