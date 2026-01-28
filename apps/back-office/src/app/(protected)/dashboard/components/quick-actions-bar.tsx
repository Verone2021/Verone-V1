/**
 * QuickActionsBar Component
 * Horizontal scrollable bar with 4 essential quick actions
 *
 * Design: Inline buttons with icon + label (not grid 4×2)
 * Pattern: Horizontal scroll on mobile, inline on desktop
 *
 * Replaces: quick-actions-grid.tsx (vertical grid with 8 actions)
 *
 * NOTE: Server Component (no 'use client') to avoid icon serialization issues
 *
 * @example
 * ```tsx
 * <QuickActionsBar
 *   actions={[
 *     {
 *       id: 'new-product',
 *       label: 'Nouveau Produit',
 *       icon: Plus,
 *       href: '/produits/nouveau',
 *     },
 *     // ...
 *   ]}
 * />
 * ```
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@verone/utils';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@verone/ui/components/ui/button';

interface QuickAction {
  /**
   * Unique action ID
   */
  id: string;
  /**
   * Action label
   */
  label: string;
  /**
   * Lucide icon
   */
  icon: LucideIcon;
  /**
   * Link href
   */
  href: string;
  /**
   * Optional variant (default: outline)
   */
  variant?: 'default' | 'outline' | 'secondary';
}

interface QuickActionsBarProps {
  /**
   * Array of quick actions (recommended: 4 essential actions)
   */
  actions: QuickAction[];
  /**
   * Optional className
   */
  className?: string;
}

export function QuickActionsBar({ actions, className }: QuickActionsBarProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent',
        className
      )}
    >
      {actions.map(action => (
        <Link key={action.id} href={action.href}>
          <Button
            variant={action.variant ?? 'outline'}
            size="sm"
            className="shrink-0 h-9"
          >
            <action.icon className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
