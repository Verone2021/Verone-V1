'use client';

import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@verone/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva('inline-flex items-center gap-1', {
  variants: {
    variant: {
      default: 'h-10 justify-center rounded-lg bg-slate-100 p-1 text-slate-500',
      pills: 'gap-2 text-slate-600',
      underline: 'border-b border-slate-200 text-slate-600',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm',
        pills:
          'rounded-full px-4 py-2 text-sm font-medium border border-slate-200 hover:bg-slate-50 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900',
        underline:
          'px-4 py-2 text-sm font-medium border-b-2 border-transparent hover:border-slate-300 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-white',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
