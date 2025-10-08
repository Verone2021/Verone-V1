/**
 * Types TypeScript pour les règles business Vérone
 */

// Raisons pour lesquelles un échantillon ne peut pas être commandé
export type SampleRestrictionReason =
  | 'has_stock_history'      // Le produit a déjà eu des entrées de stock
  | 'already_in_stock'       // Le produit est actuellement en stock
  | 'technical_restriction'  // Restriction technique du produit
  | 'business_policy'        // Politique business (ex: produit sur-mesure)

// Résultat de la vérification d'éligibilité aux échantillons
export interface SampleEligibilityResult {
  isEligible: boolean
  reason?: SampleRestrictionReason
  message: string
  details?: {
    firstStockMovementDate?: string
    currentStock?: number
    totalMovements?: number
  }
}

// Statut de validation d'une règle business
export interface BusinessRuleValidation {
  isValid: boolean
  ruleName: string
  errorMessage?: string
  warningMessage?: string
  context?: Record<string, any>
}

// Configuration des règles business pour les échantillons
export interface SampleBusinessRuleConfig {
  // Si true, bloque complètement les échantillons pour les produits ayant un historique
  strictStockHistoryRule: boolean
  // Permet des exceptions pour certains types de produits
  allowExceptionsForProductTypes?: ('standard' | 'custom')[]
  // Seuil de stock au-dessus duquel les échantillons sont interdits
  stockThreshold?: number
}

// Règle business générique
export interface BusinessRule<T = any> {
  id: string
  name: string
  description: string
  isActive: boolean
  validate: (context: T) => BusinessRuleValidation
  priority: number // 1 = haute priorité
}

// Contexte pour la validation des échantillons
export interface SampleValidationContext {
  productId: string
  productName?: string
  productType?: 'standard' | 'custom'
  currentStock?: number
  hasStockHistory: boolean
  firstStockMovementDate?: string
  userAction: 'enable_sample' | 'disable_sample' | 'check_eligibility'
}

// Types pour l'historique des validations
export interface BusinessRuleAuditLog {
  id: string
  ruleId: string
  productId?: string
  userId: string
  action: string
  result: BusinessRuleValidation
  timestamp: string
  context: Record<string, any>
}