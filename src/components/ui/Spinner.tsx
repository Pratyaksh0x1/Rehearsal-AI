import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function Spinner({ size = 'md', label = 'Loading...', className, ...props }: SpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn('inline-flex items-center justify-center text-accent', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin', sizeMap[size])} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

