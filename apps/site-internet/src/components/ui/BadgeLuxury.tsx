import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * BadgeLuxury - Design System Vérone
 *
 * 6 Variants: default, primary, success, error, warning, new
 * Minimaliste noir/blanc avec accents pour success/error/warning
 */

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200',
  {
    variants: {
      variant: {
        // Default: Gris clair
        default: 'bg-verone-gray-100 text-verone-gray-700',

        // Primary: Noir
        primary: 'bg-verone-black text-verone-white',

        // Success: Vert sobre
        success:
          'bg-verone-success/10 text-verone-success border border-verone-success/20',

        // Error: Rouge sobre
        error:
          'bg-verone-error/10 text-verone-error border border-verone-error/20',

        // Warning: Orange sobre
        warning:
          'bg-verone-warning/10 text-verone-warning border border-verone-warning/20',

        // New: Blanc border noir (pour "Nouveau")
        new: 'bg-verone-white text-verone-black border border-verone-black',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeLuxuryProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const BadgeLuxury = forwardRef<HTMLDivElement, BadgeLuxuryProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BadgeLuxury.displayName = 'BadgeLuxury';
