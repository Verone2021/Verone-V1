'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CompactQuickAction {
  id: string
  label: string
  icon: LucideIcon
  onClick: () => void
}

export interface CompactQuickActionsProps {
  actions: CompactQuickAction[]
  className?: string
}

/**
 * CompactQuickActions - Actions rapides en grid compact horizontal (2025 Best Practices)
 *
 * Optimisations vs QuickActionsList :
 * - Réduction hauteur : 300px → 80px (-73%)
 * - Grid responsive : 3 cols desktop → 2 cols tablette → 1 col mobile
 * - Pas de séparateurs, pas de headers catégories
 * - Lecture horizontale naturelle (F-pattern)
 *
 * Inspiration : Dashboards modernes (Linear, Notion), shadcn/ui grids
 *
 * @see /src/lib/design-system pour tokens
 */
export function CompactQuickActions({ actions, className }: CompactQuickActionsProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-neutral-200 p-3',
        'shadow-sm',
        className
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={cn(
              'flex items-center gap-2',
              'px-3 py-2 rounded-lg',
              'text-sm text-neutral-700 font-medium',
              'transition-all duration-150',
              'hover:bg-neutral-50 hover:text-neutral-900',
              'focus:outline-none focus:ring-2 focus:ring-primary-200',
              'group',
              'text-left'
            )}
          >
            <action.icon
              size={16}
              className="text-neutral-400 group-hover:text-primary-600 transition-colors flex-shrink-0"
              strokeWidth={2}
            />
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
