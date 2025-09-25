"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  Zap,
  Shield,
  Activity,
  Pause
} from "lucide-react"

export type TestStatus = 'pending' | 'completed' | 'failed' | 'warning'
export type SectionStatus = 'locked' | 'unlocked' | 'in_progress' | 'blocked'
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

interface TestStatusBadgeProps {
  status: TestStatus
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'minimal'
  showIcon?: boolean
  showText?: boolean
  count?: number
  className?: string
}

interface SectionStatusBadgeProps {
  status: SectionStatus
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'minimal'
  className?: string
}

interface PriorityBadgeProps {
  priority: PriorityLevel
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Configuration des statuts de test
const TEST_STATUS_CONFIG = {
  pending: {
    label: 'En attente',
    icon: Clock,
    colors: {
      default: 'bg-gray-200 text-gray-800 border-gray-300',
      outline: 'border-gray-300 text-gray-600 bg-transparent',
      minimal: 'text-gray-600'
    }
  },
  completed: {
    label: 'Validé',
    icon: CheckCircle,
    colors: {
      default: 'bg-black text-white border-black',
      outline: 'border-black text-black bg-transparent',
      minimal: 'text-black'
    }
  },
  failed: {
    label: 'Échoué',
    icon: XCircle,
    colors: {
      default: 'bg-gray-600 text-white border-gray-600',
      outline: 'border-gray-600 text-gray-600 bg-transparent',
      minimal: 'text-gray-600'
    }
  },
  warning: {
    label: 'Attention',
    icon: AlertTriangle,
    colors: {
      default: 'bg-gray-400 text-white border-gray-400',
      outline: 'border-gray-400 text-gray-600 bg-transparent',
      minimal: 'text-gray-600'
    }
  }
} as const

// Configuration des statuts de section
const SECTION_STATUS_CONFIG = {
  locked: {
    label: 'Verrouillé',
    icon: Lock,
    colors: 'bg-black text-white border-black'
  },
  unlocked: {
    label: 'Déverrouillé',
    icon: Unlock,
    colors: 'bg-gray-200 text-gray-800 border-gray-300'
  },
  in_progress: {
    label: 'En cours',
    icon: Activity,
    colors: 'bg-gray-600 text-white border-gray-600'
  },
  blocked: {
    label: 'Bloqué',
    icon: Pause,
    colors: 'bg-gray-400 text-white border-gray-400'
  }
} as const

// Configuration des priorités
const PRIORITY_CONFIG = {
  low: {
    label: 'Faible',
    colors: 'bg-gray-200 text-gray-600 border-gray-300'
  },
  medium: {
    label: 'Moyenne',
    colors: 'bg-gray-400 text-white border-gray-400'
  },
  high: {
    label: 'Élevée',
    colors: 'bg-gray-600 text-white border-gray-600'
  },
  urgent: {
    label: 'Urgente',
    colors: 'bg-black text-white border-black'
  }
} as const

// Configuration des tailles
const SIZE_CONFIG = {
  sm: {
    badge: 'text-xs px-1.5 py-0.5',
    icon: 'h-3 w-3'
  },
  md: {
    badge: 'text-sm px-2 py-1',
    icon: 'h-4 w-4'
  },
  lg: {
    badge: 'text-base px-3 py-1.5',
    icon: 'h-5 w-5'
  }
} as const

// Badge de statut de test principal
export function TestStatusBadge({
  status,
  size = 'md',
  variant = 'default',
  showIcon = true,
  showText = true,
  count,
  className
}: TestStatusBadgeProps) {
  const config = TEST_STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  const colors = config.colors[variant]

  return (
    <Badge
      className={cn(
        sizeConfig.badge,
        colors,
        "inline-flex items-center gap-1 font-medium transition-colors",
        className
      )}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      {showText && (
        <span>
          {config.label}
          {count !== undefined && ` (${count})`}
        </span>
      )}
    </Badge>
  )
}

// Badge de statut de section
export function SectionStatusBadge({
  status,
  size = 'md',
  variant = 'default',
  className
}: SectionStatusBadgeProps) {
  const config = SECTION_STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  return (
    <Badge
      className={cn(
        sizeConfig.badge,
        config.colors,
        variant === 'outline' && 'bg-transparent',
        "inline-flex items-center gap-1 font-medium",
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      <span>{config.label}</span>
    </Badge>
  )
}

// Badge de priorité
export function PriorityBadge({
  priority,
  size = 'md',
  className
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority]
  const sizeConfig = SIZE_CONFIG[size]

  return (
    <Badge
      className={cn(
        sizeConfig.badge,
        config.colors,
        "font-medium",
        className
      )}
    >
      {config.label}
    </Badge>
  )
}

// Badge avec métrique (ex: "15/20" ou "75%")
interface MetricBadgeProps {
  value: number
  total?: number
  format?: 'count' | 'percentage'
  size?: 'sm' | 'md' | 'lg'
  theme?: 'neutral' | 'success' | 'warning' | 'error'
  className?: string
}

export function MetricBadge({
  value,
  total,
  format = 'count',
  size = 'md',
  theme = 'neutral',
  className
}: MetricBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size]

  const displayValue = format === 'percentage'
    ? `${value}%`
    : total !== undefined
    ? `${value}/${total}`
    : `${value}`

  const themeColors = {
    neutral: 'bg-gray-200 text-gray-800 border-gray-300',
    success: 'bg-black text-white border-black',
    warning: 'bg-gray-400 text-white border-gray-400',
    error: 'bg-gray-600 text-white border-gray-600'
  }

  return (
    <Badge
      className={cn(
        sizeConfig.badge,
        themeColors[theme],
        "font-mono font-medium",
        className
      )}
    >
      {displayValue}
    </Badge>
  )
}

// Badge combiné pour les statuts groupés
interface StatusGroupBadgeProps {
  statuses: Array<{
    status: TestStatus
    count: number
  }>
  compact?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StatusGroupBadge({
  statuses,
  compact = false,
  size = 'sm',
  className
}: StatusGroupBadgeProps) {
  const filteredStatuses = statuses.filter(s => s.count > 0)

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {filteredStatuses.map(({ status, count }) => {
          const config = TEST_STATUS_CONFIG[status]
          const Icon = config.icon
          const sizeConfig = SIZE_CONFIG[size]

          return (
            <div
              key={status}
              className="flex items-center gap-0.5 text-xs text-gray-600"
              title={`${config.label}: ${count}`}
            >
              <Icon className={cn(sizeConfig.icon, "text-gray-500")} />
              <span className="font-mono">{count}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {filteredStatuses.map(({ status, count }) => (
        <TestStatusBadge
          key={status}
          status={status}
          size={size}
          variant="outline"
          count={count}
          showText={false}
        />
      ))}
    </div>
  )
}

// Badge interactif avec hover et actions
interface InteractiveBadgeProps {
  status: TestStatus
  onChange?: (newStatus: TestStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InteractiveBadge({
  status,
  onChange,
  disabled = false,
  size = 'md',
  className
}: InteractiveBadgeProps) {
  const config = TEST_STATUS_CONFIG[status]
  const sizeConfig = SIZE_CONFIG[size]
  const Icon = config.icon

  const handleClick = () => {
    if (disabled || !onChange) return

    const statusCycle: TestStatus[] = ['pending', 'completed', 'failed', 'warning']
    const currentIndex = statusCycle.indexOf(status)
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length]

    onChange(nextStatus)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        sizeConfig.badge,
        config.colors.default,
        "inline-flex items-center gap-1 font-medium transition-all duration-150 border",
        !disabled && onChange && "hover:scale-110 hover:shadow-sm cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={disabled ? config.label : `${config.label} - Cliquer pour changer`}
    >
      <Icon className={sizeConfig.icon} />
      <span>{config.label}</span>
    </button>
  )
}