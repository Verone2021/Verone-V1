import * as React from 'react';

import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const statusDotVariants = cva('inline-block rounded-full shrink-0', {
  variants: {
    variant: {
      default: 'bg-slate-400',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
      info: 'bg-blue-500',
      active: 'bg-emerald-500',
    },
    size: {
      sm: 'h-1.5 w-1.5',
      md: 'h-2 w-2',
      lg: 'h-2.5 w-2.5',
    },
    pulse: {
      true: 'animate-pulse',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    pulse: false,
  },
});

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusDotVariants> {
  /** Label accessible (sr-only) */
  label?: string;
}

/**
 * StatusDot - Point coloré animé pour indiquer un statut live.
 *
 * Utilisable dans les tableaux, badges, ou à côté de texte
 * pour signaler visuellement un état (actif, en retard, etc.)
 */
const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, variant, size, pulse, label, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusDotVariants({ variant, size, pulse }), className)}
        role={label ? 'status' : undefined}
        aria-label={label}
        {...props}
      />
    );
  }
);
StatusDot.displayName = 'StatusDot';

export { StatusDot, statusDotVariants };
