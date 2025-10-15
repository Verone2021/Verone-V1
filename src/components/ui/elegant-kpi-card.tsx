'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { colors, componentShadows } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export interface ElegantKpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  onClick?: () => void
  className?: string
}

/**
 * ElegantKpiCard - KPI Card élégante (shadcn/ui inspired)
 *
 * Améliorations vs MediumKpiCard :
 * - Plus grande : hauteur ~96px (vs 65px)
 * - Fond blanc neutre (SANS couleurs vives)
 * - Typography plus claire et aérée
 * - Icône subtile sans fond coloré
 * - Trend indicator discret
 * - Description optionnelle
 *
 * Inspiration : shadcn/ui dashboard example, shadcnuikit.com stat cards
 *
 * @see /src/lib/design-system pour tokens
 */
export function ElegantKpiCard({
  label,
  value,
  icon: Icon,
  trend,
  description,
  onClick,
  className,
}: ElegantKpiCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col gap-3 p-6',
        'bg-white rounded-xl border border-neutral-200',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:border-neutral-300 hover:shadow-md',
        className
      )}
      style={{
        minHeight: '96px',
        boxShadow: componentShadows.card,
      }}
    >
      {/* Header: Label + Icon */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium text-neutral-600"
          style={{ fontSize: '13px' }}
        >
          {label}
        </span>
        <Icon
          size={18}
          className="text-neutral-400"
          strokeWidth={2}
        />
      </div>

      {/* Value + Trend */}
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold text-neutral-900 tracking-tight"
          style={{
            fontSize: '28px',
            lineHeight: '1.2',
          }}
        >
          {value}
        </span>

        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md',
              trend.isPositive
                ? 'bg-success-50 text-success-700'
                : 'bg-danger-50 text-danger-700'
            )}
            style={{
              backgroundColor: trend.isPositive ? colors.success[50] : colors.danger[50],
              color: trend.isPositive ? colors.success[700] : colors.danger[700],
            }}
          >
            {trend.isPositive ? (
              <ArrowUp size={12} strokeWidth={2.5} />
            ) : (
              <ArrowDown size={12} strokeWidth={2.5} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>

      {/* Description (optionnelle) */}
      {description && (
        <p
          className="text-xs text-neutral-500 leading-tight"
          style={{ fontSize: '12px' }}
        >
          {description}
        </p>
      )}
    </div>
  )
}
