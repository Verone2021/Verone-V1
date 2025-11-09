'use client';

import * as React from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Circle } from 'lucide-react';

const radioGroupVariants = cva('flex', {
  variants: {
    orientation: {
      vertical: 'flex-col',
      horizontal: 'flex-row flex-wrap',
    },
    spacing: {
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
    spacing: 'sm',
  },
});

export interface RadioGroupProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
      'orientation'
    >,
    VariantProps<typeof radioGroupVariants> {}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation, spacing, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn(radioGroupVariants({ orientation, spacing }), className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const radioGroupItemVariants = cva(
  // Base styles
  'aspect-square rounded-full shrink-0 ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border',
        filled: 'border border-transparent data-[state=unchecked]:bg-slate-100',
        outlined: 'border-2',
        minimal: 'border-0',
      },
      radioSize: {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
        lg: 'h-5 w-5',
      },
      state: {
        default:
          'border-slate-300 focus-visible:ring-blue-500 data-[state=checked]:border-blue-600 data-[state=checked]:text-blue-600',
        error:
          'border-red-500 focus-visible:ring-red-500 data-[state=checked]:border-red-600 data-[state=checked]:text-red-600',
        success:
          'border-green-500 focus-visible:ring-green-500 data-[state=checked]:border-green-600 data-[state=checked]:text-green-600',
      },
    },
    compoundVariants: [
      {
        variant: 'filled',
        state: 'default',
        className: 'data-[state=checked]:bg-blue-50',
      },
      {
        variant: 'filled',
        state: 'error',
        className: 'data-[state=checked]:bg-red-50',
      },
      {
        variant: 'filled',
        state: 'success',
        className: 'data-[state=checked]:bg-green-50',
      },
      {
        variant: 'minimal',
        state: 'default',
        className: 'data-[state=checked]:bg-blue-100',
      },
      {
        variant: 'minimal',
        state: 'error',
        className: 'data-[state=checked]:bg-red-100',
      },
      {
        variant: 'minimal',
        state: 'success',
        className: 'data-[state=checked]:bg-green-100',
      },
    ],
    defaultVariants: {
      variant: 'default',
      radioSize: 'md',
      state: 'default',
    },
  }
);

// Icon size mapping based on radio size
const iconSizeMap = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
} as const;

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>,
    VariantProps<typeof radioGroupItemVariants> {
  /**
   * Auto-set state="error"
   */
  error?: boolean;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, radioSize, state, error, ...props }, ref) => {
  // Auto-set state="error" if error prop is present
  const actualState = error ? 'error' : state;

  // Get icon size based on radio size
  const iconSize = radioSize ? iconSizeMap[radioSize] : iconSizeMap.md;

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        radioGroupItemVariants({ variant, radioSize, state: actualState }),
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className={cn(iconSize, 'fill-current text-current')} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export {
  RadioGroup,
  RadioGroupItem,
  radioGroupVariants,
  radioGroupItemVariants,
};
