'use client'

import React from 'react'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { colors } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export interface QuickAction {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
  category: 'action' | 'consultation' | 'ajustement'
}

export interface QuickActionsListProps {
  actions: QuickAction[]
  className?: string
}

/**
 * QuickActionsList - Liste sobre d'actions rapides (Best Practices 2025)
 *
 * Inspiration : Linear, Notion, Dashboard modernes
 * - Design sobre avec séparation sémantique
 * - Lignes cliquables avec icône + texte
 * - Hover states subtils
 * - Catégories visuellement séparées
 *
 * Catégories :
 * - Actions : Créer, Ajouter
 * - Consultations : Voir, Analyser
 * - Ajustements : Modifier, Ajuster
 *
 * @see shadcn/ui patterns for modern dashboard interactions
 */
export function QuickActionsList({ actions, className }: QuickActionsListProps) {
  // Grouper par catégorie
  const actionsGroup = actions.filter((a) => a.category === 'action')
  const consultationsGroup = actions.filter((a) => a.category === 'consultation')
  const ajustementsGroup = actions.filter((a) => a.category === 'ajustement')

  const categoryLabels = {
    action: 'Actions',
    consultation: 'Consultations',
    ajustement: 'Ajustements',
  }

  const renderGroup = (group: QuickAction[], title: string, isLast: boolean = false) => {
    if (group.length === 0) return null

    return (
      <div key={title}>
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-1">
          {title}
        </h4>
        <div className="space-y-0.5">
          {group.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                'w-full flex items-center justify-between',
                'px-3 py-2.5 rounded-lg',
                'text-sm text-neutral-700 font-medium',
                'transition-all duration-150',
                'hover:bg-neutral-50 hover:text-neutral-900',
                'focus:outline-none focus:ring-2 focus:ring-primary-200',
                'group'
              )}
            >
              <div className="flex items-center gap-3">
                <action.icon
                  size={16}
                  className="text-neutral-400 group-hover:text-primary-600 transition-colors"
                  strokeWidth={2}
                />
                <span>{action.label}</span>
              </div>
              <ChevronRight
                size={14}
                className="text-neutral-300 group-hover:text-neutral-500 group-hover:translate-x-0.5 transition-all"
                strokeWidth={2}
              />
            </button>
          ))}
        </div>
        {!isLast && <Separator className="my-4" />}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 p-4',
        'shadow-sm',
        className
      )}
    >
      {renderGroup(actionsGroup, categoryLabels.action)}
      {renderGroup(consultationsGroup, categoryLabels.consultation)}
      {renderGroup(ajustementsGroup, categoryLabels.ajustement, true)}
    </div>
  )
}
