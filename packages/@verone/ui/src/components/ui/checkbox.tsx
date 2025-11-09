import * as React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';

const checkboxVariants = cva(
  // Base styles
  'peer shrink-0 rounded ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 data-[state=checked]:text-white',
  {
    variants: {
      variant: {
        default: 'border',
        filled: 'border border-transparent data-[state=unchecked]:bg-slate-100',
        outlined: 'border-2',
        minimal: 'border-0 rounded-md',
      },
      checkboxSize: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
      state: {
        default:
          'border-slate-300 focus-visible:ring-blue-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
        error:
          'border-red-500 focus-visible:ring-red-500 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600',
        success:
          'border-green-500 focus-visible:ring-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600',
      },
    },
    compoundVariants: [
      {
        variant: 'filled',
        state: 'default',
        className:
          'data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600',
      },
      {
        variant: 'filled',
        state: 'error',
        className:
          'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600',
      },
      {
        variant: 'filled',
        state: 'success',
        className:
          'data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600',
      },
      {
        variant: 'minimal',
        state: 'default',
        className: 'data-[state=checked]:bg-blue-600',
      },
      {
        variant: 'minimal',
        state: 'error',
        className: 'data-[state=checked]:bg-red-600',
      },
      {
        variant: 'minimal',
        state: 'success',
        className: 'data-[state=checked]:bg-green-600',
      },
    ],
    defaultVariants: {
      variant: 'default',
      checkboxSize: 'md',
      state: 'default',
    },
  }
);

// Icon size mapping based on checkbox size
const iconSizeMap = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
} as const;

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  /**
   * Message d'erreur (affiche automatiquement state="error")
   */
  error?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, checkboxSize, state, error, ...props }, ref) => {
  // Auto-set state="error" if error prop is present
  const actualState = error ? 'error' : state;

  // Get icon size based on checkbox size
  const iconSize = checkboxSize ? iconSizeMap[checkboxSize] : iconSizeMap.md;

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        checkboxVariants({ variant, checkboxSize, state: actualState }),
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn('flex items-center justify-center text-current')}
      >
        <Check className={iconSize} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox, checkboxVariants };
