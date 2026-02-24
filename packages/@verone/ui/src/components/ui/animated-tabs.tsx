'use client';

import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@verone/utils';
import { motion } from 'motion/react';

/**
 * AnimatedTabs - Tabs avec indicateur animé.
 *
 * Utilise motion layoutId pour animer l'indicateur actif
 * entre les onglets. Wrap les Tabs Radix existants.
 */
const AnimatedTabs = TabsPrimitive.Root;

interface AnimatedTabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  /** Unique ID for layoutId animation scope */
  layoutId?: string;
}

const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  AnimatedTabsListProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'relative inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-slate-500',
      className
    )}
    {...props}
  />
));
AnimatedTabsList.displayName = 'AnimatedTabsList';

interface AnimatedTabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  /** Layout ID for the animated indicator (must match between triggers in same list) */
  layoutGroupId?: string;
}

const AnimatedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  AnimatedTabsTriggerProps
>(({ className, children, layoutGroupId = 'animated-tab', ...props }, ref) => {
  const [isActive, setIsActive] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const el = triggerRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      setIsActive(el.getAttribute('data-state') === 'active');
    });

    observer.observe(el, { attributes: true, attributeFilter: ['data-state'] });
    setIsActive(el.getAttribute('data-state') === 'active');

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={node => {
        triggerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        'relative z-10 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700',
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId={layoutGroupId}
          className="absolute inset-0 rounded-md bg-white shadow-sm"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
});
AnimatedTabsTrigger.displayName = 'AnimatedTabsTrigger';

const AnimatedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-white animate-in fade-in-0 duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
AnimatedTabsContent.displayName = 'AnimatedTabsContent';

export {
  AnimatedTabs,
  AnimatedTabsList,
  AnimatedTabsTrigger,
  AnimatedTabsContent,
};
