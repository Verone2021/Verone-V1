"use client"

import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '../../lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'stable'
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variantStyles = {
  default: 'border-black',
  success: 'border-green-300 bg-green-50',
  warning: 'border-gray-300 bg-gray-50',
  danger: 'border-red-300 bg-red-50',
  info: 'border-blue-300 bg-blue-50'
}

const iconColorMap = {
  green: 'text-green-600',
  orange: 'text-black',
  red: 'text-red-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  gray: 'text-gray-600'
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'gray',
  trend,
  variant = 'default',
  className
}: KPICardProps) {
  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      case 'stable': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  const getTrendSymbol = () => {
    switch (trend?.direction) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
      default: return ''
    }
  }

  return (
    <Card className={cn(variantStyles[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn('h-4 w-4', iconColorMap[iconColor as keyof typeof iconColorMap])} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-black">
          {value}
        </div>

        <div className="flex items-center justify-between mt-1">
          {subtitle && (
            <p className="text-xs text-gray-600">
              {subtitle}
            </p>
          )}

          {trend && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                getTrendColor(),
                'border-current'
              )}
            >
              {getTrendSymbol()} {trend.value}% {trend.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Composants spécialisés pour les différents types de KPIs
export function StockKPICard({
  title,
  currentValue,
  targetValue,
  unit = 'unités',
  ...props
}: Omit<KPICardProps, 'value' | 'subtitle'> & {
  currentValue: number
  targetValue?: number
  unit?: string
}) {
  const percentage = targetValue ? Math.round((currentValue / targetValue) * 100) : undefined
  const variant = targetValue
    ? currentValue >= targetValue ? 'success'
    : currentValue >= targetValue * 0.8 ? 'warning'
    : 'danger'
    : 'default'

  return (
    <KPICard
      {...props}
      title={title}
      value={currentValue}
      subtitle={targetValue ? `${unit} (${percentage}% de l'objectif)` : unit}
      variant={variant}
    />
  )
}

export function PerformanceKPICard({
  title,
  value,
  unit = 'ms',
  threshold,
  ...props
}: Omit<KPICardProps, 'subtitle' | 'variant'> & {
  value: number
  unit?: string
  threshold?: number
}) {
  const variant = threshold
    ? value <= threshold ? 'success'
    : value <= threshold * 1.5 ? 'warning'
    : 'danger'
    : 'default'

  const performance = threshold ? `${value <= threshold ? 'Excellent' : value <= threshold * 1.5 ? 'Acceptable' : 'Critique'}` : ''

  return (
    <KPICard
      {...props}
      title={title}
      value={`${value}${unit}`}
      subtitle={threshold ? `${performance} (seuil: ${threshold}${unit})` : undefined}
      variant={variant}
    />
  )
}

export function AlertKPICard({
  title,
  activeAlerts,
  totalAlerts,
  ...props
}: Omit<KPICardProps, 'value' | 'subtitle' | 'variant'> & {
  activeAlerts: number
  totalAlerts: number
}) {
  const variant = activeAlerts === 0 ? 'success'
    : activeAlerts <= totalAlerts * 0.3 ? 'warning'
    : 'danger'

  return (
    <KPICard
      {...props}
      title={title}
      value={activeAlerts}
      subtitle={`sur ${totalAlerts} total`}
      variant={variant}
    />
  )
}