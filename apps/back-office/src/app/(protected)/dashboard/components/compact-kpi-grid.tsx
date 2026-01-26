/**
 * CompactKPIGrid Component
 * Hero section with 4 essential KPIs in compact format with gradients
 *
 * Design principles (2026 CRM best practices):
 * - Maximum 4-5 KPIs in hero section
 * - Compact variant (60px height) for minimal design
 * - Gradients + colored icons for visual hierarchy
 * - Hover effects (scale + shadow) for interactivity
 * - Responsive: 4 cols → 2 cols → 1 col
 *
 * NOTE: Server Component (no 'use client') to avoid icon serialization issues
 * For onClick handlers, wrap this component in a Client Component wrapper
 *
 * @example
 * ```tsx
 * <CompactKPIGrid
 *   kpis={[
 *     {
 *       title: 'Commandes en attente',
 *       value: 3,
 *       icon: ShoppingCart,
 *       color: 'warning',
 *       onClick: () => router.push('/commandes'),
 *     },
 *     // ...
 *   ]}
 * />
 * ```
 *
 * @see /docs/audits/2025-11/ARCHITECTURE-COMPOSANTS-GENERIQUES-V2.md
 */

import React from 'react';
import { cn } from '@verone/utils';
import type { LucideIcon } from 'lucide-react';

interface CompactKPI {
  /**
   * KPI title
   */
  title: string;
  /**
   * KPI value (number or formatted string)
   */
  value: string | number;
  /**
   * Lucide icon
   */
  icon: LucideIcon;
  /**
   * Semantic color for gradients and icon
   */
  color: 'primary' | 'success' | 'warning' | 'danger' | 'accent';
  /**
   * Optional description
   */
  description?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
}

interface CompactKPIGridProps {
  /**
   * Array of 4 essential KPIs
   */
  kpis: CompactKPI[];
  /**
   * Optional className
   */
  className?: string;
}

export function CompactKPIGrid({ kpis, className }: CompactKPIGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {kpis.map((kpi) => (
        <CompactKPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}

/**
 * CompactKPICard - Single KPI card with gradient background
 */
function CompactKPICard({
  title,
  value,
  icon: Icon,
  color,
  description,
  onClick,
}: CompactKPI) {
  // Gradient backgrounds with hover states
  const gradients = {
    primary:
      'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200',
    success:
      'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200',
    warning:
      'bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200',
    danger:
      'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200',
    accent:
      'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200',
  };

  // Icon colors
  const iconColors = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
    accent: 'text-purple-600',
  };

  // Value colors (darker for contrast)
  const valueColors = {
    primary: 'text-blue-700',
    success: 'text-green-700',
    warning: 'text-orange-700',
    danger: 'text-red-700',
    accent: 'text-purple-700',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base styles
        'relative flex flex-col gap-3 p-4 rounded-lg border border-neutral-200',
        'transition-all duration-300',
        // Gradient background
        gradients[color],
        // Hover effects
        'hover:scale-[1.02] hover:shadow-lg hover:border-neutral-300',
        // Cursor
        onClick && 'cursor-pointer'
      )}
    >
      {/* Icon + Title Row */}
      <div className="flex items-center gap-3">
        {/* Icon Container */}
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
          <Icon size={20} className={iconColors[color]} strokeWidth={2} />
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium text-neutral-700 leading-tight flex-1">
          {title}
        </h4>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn('text-3xl font-bold tracking-tight', valueColors[color])}
        >
          {value}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-neutral-600 leading-tight">{description}</p>
      )}
    </div>
  );
}
