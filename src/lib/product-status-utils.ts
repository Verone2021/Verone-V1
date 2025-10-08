/**
 * 🎯 Gestion Automatique des Statuts Produits - Vérone Back Office
 *
 * Logique métier pour statuts automatiques basés sur les niveaux de stock.
 * Seuls 'preorder' et 'discontinued' sont modifiables manuellement.
 */

export type ProductStatus =
  | 'in_stock'       // Automatique : stock_real > 0
  | 'out_of_stock'   // Automatique : stock_real = 0 ET stock_forecasted_in = 0
  | 'coming_soon'    // Automatique : stock_real = 0 MAIS stock_forecasted_in > 0
  | 'preorder'       // Manuel uniquement : précommande
  | 'discontinued'   // Manuel uniquement : produit arrêté
  | 'sourcing'       // Manuel uniquement : en cours de sourcing

export type AutomaticStatus = 'in_stock' | 'out_of_stock' | 'coming_soon'
export type ManualStatus = 'preorder' | 'discontinued' | 'sourcing'

/**
 * Statuts qui peuvent SEULEMENT être modifiés manuellement
 */
export const MANUAL_ONLY_STATUSES: ManualStatus[] = [
  'preorder',
  'discontinued',
  'sourcing'
]

/**
 * Statuts calculés automatiquement basés sur le stock
 */
export const AUTOMATIC_STATUSES: AutomaticStatus[] = [
  'in_stock',
  'out_of_stock',
  'coming_soon'
]

export interface StockLevels {
  stock_real: number
  stock_forecasted_in: number
  min_stock?: number
}

/**
 * Calcule le statut automatique d'un produit basé sur ses niveaux de stock
 *
 * RÈGLES MÉTIER VÉRONE :
 * - in_stock : stock réel > 0
 * - out_of_stock : stock réel = 0 ET aucun stock prévu en entrée
 * - coming_soon : stock réel = 0 MAIS stock prévu en entrée > 0
 *
 * @param stockLevels Niveaux de stock du produit
 * @returns Statut automatique calculé
 */
export function calculateAutomaticStatus(stockLevels: StockLevels): AutomaticStatus {
  const { stock_real, stock_forecasted_in } = stockLevels

  // Produit en stock : stock réel disponible
  if (stock_real > 0) {
    return 'in_stock'
  }

  // Produit bientôt disponible : pas de stock mais entrées prévues
  if (stock_real === 0 && stock_forecasted_in > 0) {
    return 'coming_soon'
  }

  // Produit en rupture : pas de stock et pas d'entrées prévues
  return 'out_of_stock'
}

/**
 * Détermine si un statut peut être modifié manuellement
 */
export function isManualStatus(status: ProductStatus): status is ManualStatus {
  return MANUAL_ONLY_STATUSES.includes(status as ManualStatus)
}

/**
 * Détermine si un statut est calculé automatiquement
 */
export function isAutomaticStatus(status: ProductStatus): status is AutomaticStatus {
  return AUTOMATIC_STATUSES.includes(status as AutomaticStatus)
}

/**
 * Valide qu'un changement de statut est autorisé selon les règles métier
 *
 * @param currentStatus Statut actuel du produit
 * @param newStatus Nouveau statut demandé
 * @param stockLevels Niveaux de stock actuels
 * @returns Résultat de validation avec message d'erreur si applicable
 */
export function validateStatusChange(
  currentStatus: ProductStatus,
  newStatus: ProductStatus,
  stockLevels: StockLevels
): { valid: boolean; error?: string } {
  // Changement vers un statut manuel : toujours autorisé
  if (isManualStatus(newStatus)) {
    return { valid: true }
  }

  // Changement vers un statut automatique : vérifier cohérence avec stock
  if (isAutomaticStatus(newStatus)) {
    const calculatedStatus = calculateAutomaticStatus(stockLevels)

    if (newStatus !== calculatedStatus) {
      return {
        valid: false,
        error: `Statut automatique incohérent. Avec stock_real=${stockLevels.stock_real} et stock_forecasted_in=${stockLevels.stock_forecasted_in}, le statut devrait être '${calculatedStatus}'`
      }
    }
  }

  return { valid: true }
}

/**
 * Détermine si un produit devrait avoir son statut recalculé automatiquement
 *
 * Un produit avec statut manuel ne devrait PAS être recalculé automatiquement
 * sauf si explicitement demandé.
 */
export function shouldRecalculateStatus(currentStatus: ProductStatus): boolean {
  return isAutomaticStatus(currentStatus)
}

/**
 * Met à jour le statut d'un produit selon les règles métier Vérone
 *
 * @param currentStatus Statut actuel
 * @param stockLevels Niveaux de stock
 * @param forceRecalculation Force le recalcul même pour statuts manuels
 * @returns Nouveau statut ou null si pas de changement nécessaire
 */
export function updateProductStatus(
  currentStatus: ProductStatus,
  stockLevels: StockLevels,
  forceRecalculation = false
): ProductStatus | null {
  // Si statut manuel et pas de force, ne pas recalculer
  if (isManualStatus(currentStatus) && !forceRecalculation) {
    return null
  }

  const newStatus = calculateAutomaticStatus(stockLevels)

  // Retourner nouveau statut seulement s'il a changé
  return newStatus !== currentStatus ? newStatus : null
}

/**
 * Formate un statut pour l'affichage utilisateur
 */
export function formatStatusForDisplay(status: ProductStatus): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  color: string
} {
  const statusConfig = {
    in_stock: {
      label: 'En stock',
      variant: 'default' as const,
      color: 'text-green-600'
    },
    out_of_stock: {
      label: 'Rupture de stock',
      variant: 'destructive' as const,
      color: 'text-red-600'
    },
    coming_soon: {
      label: 'Bientôt disponible',
      variant: 'outline' as const,
      color: 'text-blue-600'
    },
    preorder: {
      label: 'Précommande',
      variant: 'secondary' as const,
      color: 'text-black'
    },
    discontinued: {
      label: 'Produit arrêté',
      variant: 'outline' as const,
      color: 'text-gray-600'
    },
    sourcing: {
      label: 'En cours de sourcing',
      variant: 'outline' as const,
      color: 'text-purple-600'
    }
  }

  return statusConfig[status] || {
    label: status,
    variant: 'outline' as const,
    color: 'text-gray-500'
  }
}

/**
 * Génère un message d'explication pour l'utilisateur sur pourquoi
 * un statut a été calculé automatiquement
 */
export function getStatusExplanation(
  status: AutomaticStatus,
  stockLevels: StockLevels
): string {
  const { stock_real, stock_forecasted_in } = stockLevels

  switch (status) {
    case 'in_stock':
      return `Produit en stock (${stock_real} unités disponibles)`

    case 'coming_soon':
      return `Bientôt disponible (${stock_forecasted_in} unités prévues en entrée)`

    case 'out_of_stock':
      return `Rupture de stock (0 unité disponible, aucune entrée prévue)`

    default:
      return 'Statut calculé automatiquement'
  }
}