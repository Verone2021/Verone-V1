import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * ButtonLuxury - Design System Vérone
 *
 * 4 Variants: primary, secondary, tertiary, ghost
 * Noir/Blanc pur, uppercase tracking-wide, transitions subtiles
 */

const buttonVariants = cva(
  // Base styles (communs à toutes variants)
  'inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verone-black focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        // Primary: Noir plein, texte blanc
        primary:
          'bg-verone-black text-verone-white hover:bg-verone-gray-800 shadow-md hover:shadow-luxury',

        // Secondary: Border noir, texte noir, hover rempli
        secondary:
          'border-2 border-verone-black text-verone-black bg-verone-white hover:bg-verone-black hover:text-verone-white',

        // Tertiary: Blanc border, texte blanc (pour fond noir)
        tertiary:
          'border-2 border-verone-white text-verone-white bg-transparent hover:bg-verone-white hover:text-verone-black',

        // Ghost: Transparent, hover gris clair
        ghost:
          'bg-transparent text-verone-gray-700 hover:text-verone-black hover:bg-verone-gray-100',
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-sm',
        xl: 'px-10 py-5 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonLuxuryProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const ButtonLuxury = forwardRef<HTMLButtonElement, ButtonLuxuryProps>(
  (
    { className, variant, size, loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

ButtonLuxury.displayName = 'ButtonLuxury';
