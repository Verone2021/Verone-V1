/**
 * 🏷️ Data Status Badge - Vérone
 *
 * Badge visuel pour identifier les données RÉELLES vs MOCK dans l'application.
 * Utilisé systématiquement pour documenter l'état d'implémentation des fonctionnalités.
 *
 * @example
 * ```tsx
 * // Données réelles (tracking actif)
 * <DataStatusBadge type="real" />
 *
 * // Données mockées (à développer)
 * <DataStatusBadge type="mock" />
 * ```
 */

"use client"

import React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

export type DataStatusType = 'real' | 'mock'

export interface DataStatusBadgeProps {
  /**
   * Type de données affichées
   * - "real": Vraies données depuis BDD/API
   * - "mock": Données mockées/calculées temporairement
   */
  type: DataStatusType

  /**
   * Classes CSS additionnelles (optionnel)
   */
  className?: string

  /**
   * Afficher en mode compact (icône seule, sans texte)
   * @default false
   */
  compact?: boolean
}

/**
 * Mapping type → configuration visuelle
 */
const STATUS_CONFIG = {
  real: {
    icon: CheckCircle2,
    label: 'Réel',
    bgColor: 'bg-white',
    borderColor: 'border-green-600',
    textColor: 'text-green-600',
    iconColor: 'text-green-600',
    title: 'Données réelles depuis la base de données'
  },
  mock: {
    icon: AlertCircle,
    label: 'Mock',
    bgColor: 'bg-white',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-500',
    iconColor: 'text-orange-500',
    title: 'Données mockées - fonctionnalité à développer'
  }
} as const

export function DataStatusBadge({
  type,
  className,
  compact = false
}: DataStatusBadgeProps) {
  const config = STATUS_CONFIG[type]
  const Icon = config.icon

  return (
    <span
      className={cn(
        // Base styles Vérone
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium',
        'border transition-colors',
        // Couleurs selon type
        config.bgColor,
        config.borderColor,
        config.textColor,
        // Custom className
        className
      )}
      title={config.title}
    >
      <Icon className={cn('h-3 w-3', config.iconColor)} />
      {!compact && <span>{config.label}</span>}
    </span>
  )
}

/**
 * Hook helper pour déterminer automatiquement le type de badge
 * selon la source de données
 *
 * @param dataSource - Source des données
 * @returns Type de badge approprié
 *
 * @example
 * ```tsx
 * const badgeType = useDataStatus(analytics.total_sessions > 0 ? 'database' : 'calculated')
 * <DataStatusBadge type={badgeType} />
 * ```
 */
export function useDataStatus(dataSource: 'database' | 'calculated' | 'api' | 'mock'): DataStatusType {
  switch (dataSource) {
    case 'database':
    case 'api':
      return 'real'
    case 'calculated':
    case 'mock':
      return 'mock'
    default:
      return 'mock'
  }
}
