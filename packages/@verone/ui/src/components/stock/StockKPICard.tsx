'use client';

/**
 * StockKPICard - Compatibility wrapper for KPICardUnified
 * Maps old StockKPICard props to new KPICardUnified format
 *
 * @deprecated Use KPICardUnified directly from @verone/ui
 */

import { KPICardUnified } from '../ui/kpi-card-unified';
import type { LucideIcon } from 'lucide-react';

type StockKPIVariant = 'default' | 'success' | 'warning' | 'danger';

export interface StockKPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  subtitle?: string;
  variant?: StockKPIVariant;
  className?: string;
}

/**
 * Compatibility wrapper - maps old props to KPICardUnified
 */
export function StockKPICard({
  title,
  value,
  icon,
  trend,
  subtitle,
  variant = 'default',
  className,
}: StockKPICardProps) {
  // Map trend to new format
  const trendFormatted = trend
    ? {
        value: trend.value,
        isPositive: trend.direction === 'up',
      }
    : undefined;

  return (
    <KPICardUnified
      variant="compact"
      title={title}
      value={value}
      icon={icon}
      trend={trendFormatted}
      description={subtitle}
      className={className}
    />
  );
}
