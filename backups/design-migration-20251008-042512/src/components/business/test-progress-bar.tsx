"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertCircle, Clock, TrendingUp, TrendingDown } from "lucide-react"

interface TestProgressData {
  completed: number
  failed: number
  warning: number
  pending: number
  total: number
}

interface TestProgressBarProps {
  data: TestProgressData
  title?: string
  showLabels?: boolean
  showTrend?: boolean
  previousData?: TestProgressData
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'detailed' | 'card'
  className?: string
  animated?: boolean
  onProgressChange?: (progress: number) => void
}

export function TestProgressBar({
  data,
  title,
  showLabels = true,
  showTrend = false,
  previousData,
  size = 'md',
  variant = 'detailed',
  className,
  animated = true,
  onProgressChange
}: TestProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const { completed, failed, warning, pending, total } = data
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0

  // Animation de progression
  useEffect(() => {
    setIsVisible(true)
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progressPercent)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setDisplayProgress(progressPercent)
    }
  }, [progressPercent, animated])

  // Callback onChange
  useEffect(() => {
    onProgressChange?.(progressPercent)
  }, [progressPercent, onProgressChange])

  // Calcul des tendances
  const getTrend = () => {
    if (!previousData || !showTrend) return null

    const prevProgress = previousData.total > 0 ?
      Math.round((previousData.completed / previousData.total) * 100) : 0
    const diff = progressPercent - prevProgress

    if (Math.abs(diff) < 1) return null

    return {
      value: diff,
      isPositive: diff > 0,
      icon: diff > 0 ? TrendingUp : TrendingDown
    }
  }

  const trend = getTrend()

  // Configuration des tailles
  const sizeConfig = {
    sm: {
      height: 'h-1',
      text: 'text-xs',
      badge: 'text-xs px-1.5 py-0.5'
    },
    md: {
      height: 'h-2',
      text: 'text-sm',
      badge: 'text-sm px-2 py-1'
    },
    lg: {
      height: 'h-3',
      text: 'text-base',
      badge: 'text-sm px-2.5 py-1'
    }
  }

  const config = sizeConfig[size]

  // Rendu minimal
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Progress
          value={displayProgress}
          className={cn("flex-1", config.height)}
        />
        <span className={cn("font-medium text-black", config.text)}>
          {displayProgress}%
        </span>
      </div>
    )
  }

  // Rendu détaillé
  return (
    <div
      className={cn(
        "space-y-2",
        variant === 'card' && "p-4 border border-gray-200 rounded-lg bg-white",
        className
      )}
    >
      {/* Header avec titre et métriques */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className={cn("font-medium text-black", config.text)}>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {trend && (
              <div className={cn(
                "flex items-center gap-1",
                trend.isPositive ? "text-black" : "text-gray-600",
                config.text
              )}>
                <trend.icon className="h-3 w-3" />
                <span className="font-medium">
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
            <Badge
              variant="outline"
              className={cn(
                "border-black text-black",
                config.badge
              )}
            >
              {displayProgress}% complété
            </Badge>
          </div>
        </div>
      )}

      {/* Barre de progression principale */}
      <div className="space-y-1">
        <Progress
          value={displayProgress}
          className={cn(
            config.height,
            animated && "transition-all duration-500 ease-out"
          )}
        />

        {/* Labels de progression */}
        {showLabels && (
          <div className="flex justify-between text-xs text-gray-600">
            <span>{completed} / {total} tests</span>
            <span>
              {total - completed} restants
            </span>
          </div>
        )}
      </div>

      {/* Détail des statuts */}
      {variant === 'detailed' && (
        <div className="grid grid-cols-4 gap-2">
          {/* Tests validés */}
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-black" />
            <div className="text-xs">
              <div className="font-medium text-black">{completed}</div>
              <div className="text-gray-600">Validés</div>
            </div>
          </div>

          {/* Tests échoués */}
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <div className="text-xs">
              <div className="font-medium text-black">{failed}</div>
              <div className="text-gray-600">Échoués</div>
            </div>
          </div>

          {/* Tests attention */}
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <div className="text-xs">
              <div className="font-medium text-black">{warning}</div>
              <div className="text-gray-600">Attention</div>
            </div>
          </div>

          {/* Tests en attente */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-gray-400" />
            <div className="text-xs">
              <div className="font-medium text-black">{pending}</div>
              <div className="text-gray-600">En attente</div>
            </div>
          </div>
        </div>
      )}

      {/* Métriques de qualité */}
      {variant === 'detailed' && failureRate > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Taux d'échec:</span>
            <span className={cn(
              "font-medium",
              failureRate > 10 ? "text-red-600" :
              failureRate > 5 ? "text-yellow-600" : "text-gray-600"
            )}>
              {failureRate}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour affichage en grid de plusieurs barres
interface TestProgressGridProps {
  sections: Array<{
    id: string
    title: string
    icon?: string
    data: TestProgressData
    isLocked?: boolean
  }>
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function TestProgressGrid({
  sections,
  columns = 2,
  className
}: TestProgressGridProps) {
  const gridConfig = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  return (
    <div className={cn(
      "grid gap-4",
      gridConfig[columns],
      className
    )}>
      {sections.map((section) => (
        <div key={section.id} className="relative">
          <TestProgressBar
            data={section.data}
            title={section.title}
            variant="card"
            size="md"
            animated
          />
          {section.isLocked && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                Verrouillé
              </Badge>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// Composant compact pour sidebar
interface TestProgressSidebarProps {
  data: TestProgressData
  title: string
  onClick?: () => void
  isActive?: boolean
  className?: string
}

export function TestProgressSidebar({
  data,
  title,
  onClick,
  isActive = false,
  className
}: TestProgressSidebarProps) {
  const progressPercent = data.total > 0 ?
    Math.round((data.completed / data.total) * 100) : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left rounded-lg border transition-colors",
        isActive
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white text-black hover:border-gray-300 hover:bg-gray-50",
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{title}</span>
          <span className={cn(
            "text-xs",
            isActive ? "text-white" : "text-gray-600"
          )}>
            {progressPercent}%
          </span>
        </div>

        <Progress
          value={progressPercent}
          className={cn(
            "h-1",
            isActive && "[&>div]:bg-white"
          )}
        />

        <div className={cn(
          "text-xs",
          isActive ? "text-gray-200" : "text-gray-500"
        )}>
          {data.completed}/{data.total} tests
        </div>
      </div>
    </button>
  )
}