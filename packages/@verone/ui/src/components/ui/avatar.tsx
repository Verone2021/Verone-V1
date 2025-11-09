import * as React from 'react';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      avatarSize: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      avatarSize: 'md',
      shape: 'circle',
    },
  }
);

const avatarFallbackVariants = cva(
  'flex h-full w-full items-center justify-center bg-slate-100 font-medium text-slate-600',
  {
    variants: {
      avatarSize: {
        xs: 'text-xs',
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-xl',
      },
    },
    defaultVariants: {
      avatarSize: 'md',
    },
  }
);

const statusIndicatorVariants = cva(
  'absolute bottom-0 right-0 block rounded-full border-2 border-white',
  {
    variants: {
      status: {
        online: 'bg-green-500',
        offline: 'bg-slate-300',
        busy: 'bg-red-500',
        away: 'bg-orange-400',
      },
      avatarSize: {
        xs: 'h-2 w-2',
        sm: 'h-2.5 w-2.5',
        md: 'h-3 w-3',
        lg: 'h-3.5 w-3.5',
        xl: 'h-4 w-4',
      },
    },
    defaultVariants: {
      status: 'online',
      avatarSize: 'md',
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  /**
   * Status indicator (online, offline, busy, away)
   */
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, avatarSize, shape, status, children, ...props }, ref) => {
  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(avatarVariants({ avatarSize, shape }), className)}
        {...props}
      >
        {children}
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(statusIndicatorVariants({ status, avatarSize }))}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, avatarSize, children, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ avatarSize }), className)}
    {...props}
  >
    {children}
  </AvatarPrimitive.Fallback>
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback, avatarVariants };
