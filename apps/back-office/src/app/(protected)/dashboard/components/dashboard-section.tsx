/**
 * DashboardSection Component
 * Collapsible section for dashboard with icon, badge, and smooth animations
 *
 * Pattern inspired by ProductDetailAccordion
 * Uses shadcn/ui Collapsible component
 *
 * Features:
 * - Icon + Badge + Chevron rotate
 * - State persisted in localStorage
 * - Smooth animations (duration-300)
 * - Semantic colors for badges
 *
 * @example
 * ```tsx
 * <DashboardSection
 *   title="Ventes & Commandes"
 *   icon={ShoppingCart}
 *   badge={{ label: '3 urgentes', variant: 'warning' }}
 *   defaultOpen={true}
 * >
 *   <KPIsGrid />
 *   <RevenueChart />
 * </DashboardSection>
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { cn } from '@verone/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@verone/ui/components/ui/collapsible';

interface DashboardSectionProps {
  /**
   * Section title
   */
  title: string;
  /**
   * Lucide icon component
   */
  icon: LucideIcon;
  /**
   * Default open state (only used on first mount)
   */
  defaultOpen?: boolean;
  /**
   * Optional badge to display next to title
   */
  badge?: {
    label: string;
    variant: 'default' | 'warning' | 'danger' | 'success';
  };
  /**
   * Section content (KPIs, charts, widgets)
   */
  children: React.ReactNode;
  /**
   * Optional className for custom styling
   */
  className?: string;
  /**
   * Unique storage key for localStorage persistence
   * If not provided, defaults to title.toLowerCase().replace(/\s/g, '-')
   */
  storageKey?: string;
}

export function DashboardSection({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
  className,
  storageKey,
}: DashboardSectionProps) {
  // Generate storage key from title if not provided
  const key =
    storageKey ||
    `dashboard-section-${title.toLowerCase().replace(/\s/g, '-')}`;

  // Initialize state with defaultOpen (SSR-safe)
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Load state from localStorage after hydration (client-only)
  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      setIsOpen(stored === 'true');
    }
  }, [key]);

  // Persist state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(key, String(isOpen));
  }, [isOpen, key]);

  // Badge color variants
  const badgeVariants = {
    default: 'bg-neutral-100 text-neutral-700',
    warning: 'bg-orange-100 text-orange-700',
    danger: 'bg-red-100 text-red-700',
    success: 'bg-green-100 text-green-700',
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        'rounded-lg border border-neutral-200 bg-white overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors duration-200">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-neutral-100">
              <Icon size={18} className="text-neutral-600" strokeWidth={2} />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-neutral-900">
              {title}
            </h3>

            {/* Badge */}
            {badge && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-md',
                  badgeVariants[badge.variant]
                )}
              >
                {badge.label}
              </span>
            )}
          </div>

          {/* Chevron */}
          <ChevronDown
            size={20}
            className={cn(
              'text-neutral-500 transition-transform duration-300',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent className="transition-all duration-300 ease-in-out">
        <div className="p-4 pt-0 space-y-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
