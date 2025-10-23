/**
 * Category Hierarchy Selector Component - Phase 2 Stub
 *
 * Ce composant sera implémenté en Phase 2 (Catalogue complet).
 * Stub temporaire pour éviter erreurs TypeScript Phase 1.
 */

'use client'

export interface Category {
  id: string
  name: string
  parent_id?: string | null
  level?: number
  children?: Category[]
}

export interface CategoryHierarchySelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[], category?: Category | Category[]) => void
  multiple?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  maxLevel?: number
}

/**
 * Sélecteur hiérarchique de catégories (stub Phase 2)
 * @throws Error - Composant non implémenté Phase 1
 */
export function CategoryHierarchySelector({
  value,
  onChange,
  multiple = false,
  disabled = false,
  placeholder = 'Sélectionner une catégorie',
  className,
  maxLevel
}: CategoryHierarchySelectorProps) {
  throw new Error(
    'CategoryHierarchySelector : Composant Phase 2 - Not implemented yet. ' +
    'Ce composant sera développé lors du module Catalogue complet (Phase 2).'
  )
}

export default CategoryHierarchySelector
