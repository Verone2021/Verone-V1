/**
 * Product Selector Component - Phase 2 Stub
 *
 * Ce composant sera implémenté en Phase 2 (Catalogue complet).
 * Stub temporaire pour éviter erreurs TypeScript Phase 1.
 */

'use client'

export interface ProductSelectorProps {
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  multiple?: boolean
  disabled?: boolean
  className?: string
}

/**
 * Sélecteur de produits (stub Phase 2)
 * @throws Error - Composant non implémenté Phase 1
 */
export function ProductSelector({
  value,
  onChange,
  multiple = false,
  disabled = false,
  className
}: ProductSelectorProps) {
  throw new Error(
    'ProductSelector : Composant Phase 2 - Not implemented yet. ' +
    'Ce composant sera développé lors du module Catalogue complet (Phase 2).'
  )
}

export default ProductSelector
