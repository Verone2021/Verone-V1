'use client';

import * as React from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const switchVariants = cva(
  // Base styles
  'peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        minimal: 'border-slate-300',
        accent: 'shadow-sm',
      },
      switchSize: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-13',
      },
      state: {
        default:
          'focus-visible:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-slate-200',
        error:
          'focus-visible:ring-red-500 data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-red-200',
        success:
          'focus-visible:ring-green-500 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-green-200',
      },
    },
    compoundVariants: [
      {
        variant: 'minimal',
        state: 'default',
        className:
          'data-[state=unchecked]:bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
      },
      {
        variant: 'minimal',
        state: 'error',
        className:
          'data-[state=unchecked]:bg-white data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600',
      },
      {
        variant: 'minimal',
        state: 'success',
        className:
          'data-[state=unchecked]:bg-white data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600',
      },
    ],
    defaultVariants: {
      variant: 'default',
      switchSize: 'md',
      state: 'default',
    },
  }
);

const switchThumbVariants = cva(
  // Base styles
  'pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform',
  {
    variants: {
      switchSize: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0',
      },
    },
    defaultVariants: {
      switchSize: 'md',
    },
  }
);

export interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  /**
   * Auto-set state="error"
   */
  error?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant, switchSize, state, error, ...props }, ref) => {
  // Auto-set state="error" if error prop is present
  const actualState = error ? 'error' : state;

  return (
    <SwitchPrimitives.Root
      className={cn(
        switchVariants({ variant, switchSize, state: actualState }),
        className
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(switchThumbVariants({ switchSize }))}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch, switchVariants, switchThumbVariants };
