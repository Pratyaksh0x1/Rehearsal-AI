'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  name,
}: SegmentedControlProps<T>) {
  const generatedName = React.useId();
  const groupName = name || generatedName;

  const sizeClasses = {
    sm: 'p-0.5 text-xs h-7',
    md: 'p-1 text-xs sm:text-sm h-9',
  };

  const itemSizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
  };

  return (
    <div
      role="radiogroup"
      className={cn(
        'inline-flex items-center rounded-lg bg-bg-subtle border border-border text-text-muted select-none',
        sizeClasses[size],
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all focus-ring whitespace-nowrap',
              itemSizeClasses[size],
              isSelected
                ? 'bg-surface text-text-primary shadow-sm font-semibold border border-border/50'
                : 'hover:text-text-primary hover:bg-surface-hover/50 text-text-muted'
            )}
          >
            {option.icon && <span className="shrink-0">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

