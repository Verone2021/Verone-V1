'use client';

import * as React from 'react';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@verone/utils';

interface ProductDetailAccordionProps {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  badge?: string | number;
  children: React.ReactNode;
  className?: string;
}

export function ProductDetailAccordion({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
  className,
}: ProductDetailAccordionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <CollapsiblePrimitive.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'border border-neutral-200 rounded-lg bg-white shadow-sm',
        'transition-all duration-150',
        isOpen && 'shadow-md',
        className
      )}
    >
      <CollapsiblePrimitive.Trigger asChild>
        <button
          className={cn(
            'flex w-full items-center justify-between',
            'px-3 py-2.5 text-left',
            'transition-colors duration-150',
            'hover:bg-neutral-50',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
            'rounded-lg',
            isOpen && 'bg-neutral-50/50'
          )}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Icon
              className={cn(
                'h-4 w-4 flex-shrink-0 transition-colors duration-150',
                isOpen ? 'text-primary-600' : 'text-neutral-500'
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                'text-sm font-medium transition-colors duration-150',
                isOpen ? 'text-neutral-900' : 'text-neutral-700'
              )}
            >
              {title}
            </span>
            {badge !== undefined && badge !== null && (
              <Badge
                variant="secondary"
                className="ml-auto mr-2 text-xs px-2 py-0.5 bg-primary-50 text-primary-700 border-primary-200"
              >
                {badge}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 flex-shrink-0 text-neutral-500',
              'transition-transform duration-200',
              isOpen && 'rotate-180 text-primary-600'
            )}
            aria-hidden="true"
          />
        </button>
      </CollapsiblePrimitive.Trigger>

      <CollapsiblePrimitive.Content
        className={cn(
          'overflow-hidden',
          'data-[state=closed]:animate-accordion-up',
          'data-[state=open]:animate-accordion-down'
        )}
      >
        <div className="px-3 py-3 border-t border-neutral-100">{children}</div>
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  );
}
