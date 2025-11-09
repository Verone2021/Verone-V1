'use client';

/**
 * 🎨 StockKPICard Component
 *
 * KPI Card réutilisable ultra-compact pour métriques stock
 * Design System V2 - Best Practices 2025
 *
 * @example
 * ```tsx
 * import { Package } from 'lucide-react'
 *
 * <StockKPICard
 *   title="Total Stock"
 *   value={1250}
 *   icon={Package}
 *   variant="success"
 *   trend={{ value: 12.5, direction: 'up' }}
 * />
 * ```
 */

import * as React from 'react';

import { Card } from '@verone/ui';
import { cn } from '@verone/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

import { KPI_VARIANT_CONFIG, type KPIVariant, type LucideIcon } from './types';

export interface StockKPICardProps {
  /**
   * Titre de la métrique
   */
  title: string;

  /**
   * Valeur de la métrique (nombre ou string formaté)
   */
  value: number | string;

  /**
   * Icône Lucide React
   */
  icon: LucideIcon;

  /**
   * Tendance optionnelle
   */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };

  /**
   * Sous-titre ou badge descriptif (affiché sous la valeur)
   * @since Phase 3.3 - Migration Dashboard
   * @example "15 produits en stock"
   */
  subtitle?: string;

  /**
   * Variante visuelle
   * @default "default"
   */
  variant?: KPIVariant;

  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * KPI Card ultra-compact pour métriques stock
 *
 * Features:
 * - Height fixe 80px (ultra-compact)
 * - Flex layout horizontal: [Icon] [Content]
 * - Icon 40x40 rounded-full avec bg selon variant
 * - 4 variants: default, success, warning, danger
 * - Tendance optionnelle avec flèche
 * - Responsive mobile-first
 * - Accessibility compliant
 * - Performance optimisée (<100ms render)
 */
export function StockKPICard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  variant = 'default',
  className,
}: StockKPICardProps) {
  const config = KPI_VARIANT_CONFIG[variant];

  /**
   * Formater la valeur
   */
  const formatValue = (val: number | string): string => {
    if (typeof val === 'number') {
      // Format nombre avec espaces pour milliers
      return val.toLocaleString('fr-FR');
    }
    return val;
  };

  return (
    <Card
      role="region"
      aria-label={`KPI ${title}`}
      className={cn(
        'h-20 overflow-hidden transition-all duration-200',
        'hover:shadow-md',
        className
      )}
    >
      <div className="h-full p-4 flex items-center gap-4">
        {/* Icon Circle */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            config.iconBgColor
          )}
          aria-hidden="true"
        >
          <Icon className={cn('w-5 h-5', config.iconTextColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <p className="text-sm text-gray-500 truncate">{title}</p>

          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 truncate">
              {formatValue(value)}
            </p>

            {/* Trend */}
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-0.5 text-xs font-medium',
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                )}
                aria-label={`Tendance ${trend.direction === 'up' ? 'hausse' : 'baisse'} de ${trend.value}%`}
              >
                {trend.direction === 'up' ? (
                  <ArrowUp className="w-3 h-3" aria-hidden="true" />
                ) : (
                  <ArrowDown className="w-3 h-3" aria-hidden="true" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Type export pour usage externe
 */
StockKPICard.displayName = 'StockKPICard';
