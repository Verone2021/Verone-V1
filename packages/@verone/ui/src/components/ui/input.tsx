import * as React from 'react';

import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const inputVariants = cva(
  // Base styles
  'flex w-full transition-all duration-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
  {
    variants: {
      variant: {
        default: 'rounded-lg border bg-white',
        filled:
          'rounded-lg border border-transparent bg-slate-100 focus:bg-white',
        outlined: 'rounded-lg border-2 bg-white',
        underlined:
          'rounded-none border-0 border-b-2 bg-transparent px-0 focus:ring-0',
      },
      inputSize: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      state: {
        default:
          'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20',
        error: 'border-red-500 focus:border-red-600 focus:ring-red-500/20',
        success:
          'border-green-500 focus:border-green-600 focus:ring-green-500/20',
      },
    },
    compoundVariants: [
      {
        variant: 'filled',
        state: 'default',
        className: 'border-slate-200 focus:border-blue-500',
      },
      {
        variant: 'underlined',
        inputSize: 'sm',
        className: 'h-7',
      },
      {
        variant: 'underlined',
        inputSize: 'md',
        className: 'h-9',
      },
      {
        variant: 'underlined',
        inputSize: 'lg',
        className: 'h-11',
      },
    ],
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
      state: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * Icône à gauche du champ
   */
  iconLeft?: React.ReactNode;

  /**
   * Icône à droite du champ
   */
  iconRight?: React.ReactNode;

  /**
   * Message d'erreur (affiche automatiquement state="error")
   */
  error?: string;

  /**
   * Message d'aide
   */
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      state,
      iconLeft,
      iconRight,
      error,
      helperText,
      disabled,
      ...props
    },
    ref
  ) => {
    // Auto-set state="error" if error prop is present
    const actualState = error ? 'error' : state;

    return (
      <div className="w-full">
        <div className="relative">
          {iconLeft && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {iconLeft}
            </div>
          )}

          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize, state: actualState }),

              // Icon padding
              iconLeft && 'pl-10',
              iconRight && 'pr-10',

              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />

          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              {iconRight}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

        {/* Helper text */}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input, inputVariants };
