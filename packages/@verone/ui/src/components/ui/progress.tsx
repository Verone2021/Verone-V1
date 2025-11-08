'use client';

import * as React from 'react';

import { cn } from '@verone/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const variantStyles = {
  default: 'bg-blue-600',
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  danger: 'bg-red-500',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      variant = 'default',
      size = 'md',
      showValue = false,
      ...props
    },
    ref
  ) => (
    <div className="w-full">
      <div
        ref={ref}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-slate-200',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 transition-all duration-300 ease-in-out',
            variantStyles[variant]
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </div>
      {showValue && (
        <div className="mt-1 text-right text-xs text-slate-600">
          {Math.round(value)}%
        </div>
      )}
    </div>
  )
);
Progress.displayName = 'Progress';

export { Progress };
