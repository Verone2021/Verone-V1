'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { colors, componentSpacing, componentTypography, componentShadows } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export interface MediumKpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'accent' | 'danger'
  sparklineData?: number[]
  onClick?: () => void
  className?: string
}

/**
 * MediumKpiCard - KPI Card optimisée (65px hauteur, max 220px largeur)
 *
 * Améliorations vs CompactKpiCard (40px) :
 * - Hauteur augmentée : 65px (lisibilité ++, espace visuel équilibré)
 * - Largeur contrainte : max 220px (pas d'étirement excessif)
 * - Typography plus grande : text-lg (value), text-sm (label)
 * - Couleurs solides design-system (sans gradients)
 * - Icon plus grande : 36x36px (vs 28x28)
 *
 * @see /src/lib/design-system pour tokens
 */
export function MediumKpiCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  sparklineData,
  onClick,
  className,
}: MediumKpiCardProps) {
  // Couleurs solides du design system (sans gradients)
  const colorMap = {
    primary: colors.primary.DEFAULT,
    success: colors.success.DEFAULT,
    warning: colors.warning.DEFAULT,
    accent: colors.accent.DEFAULT,
    danger: colors.danger.DEFAULT,
  }

  const bgColorMap = {
    primary: colors.primary[50],
    success: colors.success[50],
    warning: colors.warning[50],
    accent: colors.accent[50],
    danger: colors.danger[50],
  }

  const iconColor = colorMap[color]
  const bgColor = bgColorMap[color]

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3',
        'bg-white rounded-lg border border-neutral-200',
        'transition-all duration-200',
        'w-full max-w-[220px]', // Largeur contrainte !
        onClick && 'cursor-pointer hover:border-neutral-300',
        className
      )}
      style={{
        height: componentSpacing.heights.kpiCard, // 65px
        boxShadow: onClick ? componentShadows.card : componentShadows.card,
      }}
    >
      {/* Icône plus grande (36x36 vs 28x28) */}
      <div
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          width: '36px',
          height: '36px',
          backgroundColor: bgColor,
        }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>

      {/* Contenu avec typography améliorée */}
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div
          className="font-bold text-neutral-900 leading-tight"
          style={{
            fontSize: componentTypography.kpi.value.fontSize, // text-lg
            fontWeight: componentTypography.kpi.value.fontWeight,
          }}
        >
          {value}
        </div>
        <div
          className="text-neutral-600 leading-tight truncate"
          style={{
            fontSize: componentTypography.kpi.label.fontSize, // text-xs
            fontWeight: componentTypography.kpi.label.fontWeight,
          }}
        >
          {label}
        </div>
      </div>

      {/* Trend badge (si présent) */}
      {trend && (
        <div
          className={cn(
            'text-[10px] font-medium px-2 py-1 rounded flex-shrink-0',
            trend.isPositive ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
          )}
          style={{
            backgroundColor: trend.isPositive ? colors.success[50] : colors.danger[50],
            color: trend.isPositive ? colors.success[700] : colors.danger[700],
          }}
        >
          {trend.isPositive ? '+' : ''}
          {trend.value}%
        </div>
      )}

      {/* Mini sparkline (optionnel) */}
      {sparklineData && sparklineData.length > 0 && (
        <svg width="45" height="25" className="flex-shrink-0">
          <MiniSparkline data={sparklineData} color={iconColor} />
        </svg>
      )}
    </div>
  )
}

// Mini sparkline component interne
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const width = 45
  const height = 25
  const padding = 2

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <polyline
      points={points}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.8"
    />
  )
}
