/**
 * Validator Complet - Commandes Ventes (Sales Orders)
 *
 * Responsabilités:
 * - FSM validation (transitions status autorisées)
 * - Business rules validation (règles métier)
 * - Data integrity validation (cohérence données)
 * - Channel validation (canal vente valide si fourni)
 *
 * @module order-status-validator
 * @since Phase 2.4 - 2025-10-31
 *
 * @example
 * // Valider transition status
 * validateStatusTransition('draft', 'confirmed') // ✅ OK
 * validateStatusTransition('delivered', 'shipped') // ❌ Throws Error
 *
 * @example
 * // Valider commande complète
 * const result = await validateSalesOrder(orderData, supabase)
 * if (!result.valid) {
 *   console.error('Erreurs:', result.errors)
 * }
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Statuts commandes ventes (sync avec DB enum)
 */
export type SalesOrderStatus = 'draft' | 'confirmed' | 'partially_shipped' | 'shipped' | 'delivered' | 'cancelled'

/**
 * Statuts paiement
 */
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'overdue'

/**
 * Contexte validation (infos complémentaires)
 */
export interface ValidationContext {
  supabase?: SupabaseClient
  userId?: string
  checkStock?: boolean        // Vérifier stock disponible (default: true)
  checkChannel?: boolean      // Vérifier channel_id valide (default: true)
  strictMode?: boolean        // Mode strict: bloquer warnings (default: false)
}

/**
 * Résultat validation
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]            // Erreurs bloquantes
  warnings: string[]          // Avertissements non-bloquants
}

/**
 * Données commande minimales pour validation
 */
export interface SalesOrderData {
  id?: string
  status: SalesOrderStatus
  customer_id: string
  customer_type: 'organization' | 'individual'
  channel_id?: string | null
  payment_status?: PaymentStatus
  total_ht: number
  total_ttc: number
  items?: Array<{
    product_id: string
    quantity: number
    unit_price_ht: number
  }>
}

// ============================================================================
// FSM - FINITE STATE MACHINE
// ============================================================================

/**
 * Machine à états finis - Transitions autorisées
 *
 * Workflow standard: draft → confirmed → partially_shipped → shipped → delivered
 * Annulation: possible depuis draft, confirmed, partially_shipped, shipped
 * États finaux: delivered, cancelled (pas de retour arrière)
 */
const STATUS_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['partially_shipped', 'shipped', 'delivered', 'cancelled'],
  partially_shipped: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],  // État final - SAV géré séparément
  cancelled: []   // État final
}

/**
 * Labels humains pour statuts (i18n-ready)
 */
export const STATUS_LABELS: Record<SalesOrderStatus, string> = {
  draft: 'Brouillon',
  confirmed: 'Confirmée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée'
}

/**
 * Couleurs status (pour badges UI)
 */
export const STATUS_COLORS: Record<SalesOrderStatus, 'gray' | 'blue' | 'yellow' | 'green' | 'red'> = {
  draft: 'gray',
  confirmed: 'blue',
  partially_shipped: 'yellow',
  shipped: 'green',
  delivered: 'green',
  cancelled: 'red'
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valider transition status selon FSM
 * @throws Error si transition invalide
 */
export function validateStatusTransition(
  currentStatus: SalesOrderStatus,
  newStatus: SalesOrderStatus
): void {
  // Cas spécial: même status autorisé (idempotence)
  if (currentStatus === newStatus) {
    return
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus]

  if (!allowedTransitions.includes(newStatus)) {
    const allowed = allowedTransitions.length > 0
      ? allowedTransitions.map(s => STATUS_LABELS[s]).join(', ')
      : 'aucune'

    throw new Error(
      `Transition invalide: "${STATUS_LABELS[currentStatus]}" → "${STATUS_LABELS[newStatus]}". ` +
      `Transitions autorisées: ${allowed}`
    )
  }
}

/**
 * Obtenir transitions autorisées depuis un status
 */
export function getAllowedTransitions(status: SalesOrderStatus): SalesOrderStatus[] {
  return STATUS_TRANSITIONS[status] || []
}

/**
 * Vérifier si status est final (pas de transition possible)
 */
export function isFinalStatus(status: SalesOrderStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0
}

/**
 * Vérifier si status permet modification items
 */
export function canEditItems(status: SalesOrderStatus): boolean {
  return status === 'draft'
}

/**
 * Vérifier si status permet annulation
 */
export function canCancel(status: SalesOrderStatus): boolean {
  return STATUS_TRANSITIONS[status].includes('cancelled')
}

/**
 * Vérifier si status permet confirmation
 */
export function canConfirm(status: SalesOrderStatus): boolean {
  return status === 'draft'
}

/**
 * Vérifier si status permet expédition
 */
export function canShip(status: SalesOrderStatus): boolean {
  return ['confirmed', 'partially_shipped'].includes(status)
}

/**
 * Vérifier si status permet marquage livraison
 */
export function canDeliver(status: SalesOrderStatus): boolean {
  return ['confirmed', 'partially_shipped', 'shipped'].includes(status)
}

// ============================================================================
// BUSINESS RULES VALIDATION
// ============================================================================

/**
 * Valider commande avant création
 */
export async function validateSalesOrderCreation(
  data: SalesOrderData,
  context: ValidationContext = {}
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. Validation données obligatoires
  if (!data.customer_id) {
    errors.push('customer_id requis')
  }

  if (!data.customer_type) {
    errors.push('customer_type requis (organization|individual)')
  }

  if (!data.items || data.items.length === 0) {
    errors.push('Commande doit contenir au moins 1 item')
  }

  // 2. Validation montants
  if (data.total_ht < 0) {
    errors.push('total_ht ne peut pas être négatif')
  }

  if (data.total_ttc < 0) {
    errors.push('total_ttc ne peut pas être négatif')
  }

  if (data.total_ttc < data.total_ht) {
    errors.push('total_ttc doit être >= total_ht (TVA)')
  }

  // 3. Validation items
  if (data.items) {
    data.items.forEach((item, idx) => {
      if (item.quantity <= 0) {
        errors.push(`Item ${idx + 1}: quantité doit être > 0`)
      }

      if (item.unit_price_ht < 0) {
        errors.push(`Item ${idx + 1}: prix unitaire ne peut pas être négatif`)
      }
    })
  }

  // 4. Validation channel_id si fourni
  if (data.channel_id && context.checkChannel !== false && context.supabase) {
    const channelValid = await validateChannelId(data.channel_id, context.supabase)
    if (!channelValid) {
      errors.push(`channel_id "${data.channel_id}" invalide ou inactif`)
    }
  }

  // 5. Validation stock si demandé
  if (context.checkStock !== false && context.supabase && data.items) {
    const stockIssues = await checkStockAvailability(data.items, context.supabase)
    if (stockIssues.length > 0) {
      if (context.strictMode) {
        errors.push(...stockIssues)
      } else {
        warnings.push(...stockIssues.map(issue => `⚠️ ${issue}`))
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Valider transition status avec business rules
 */
export async function validateStatusChange(
  currentStatus: SalesOrderStatus,
  newStatus: SalesOrderStatus,
  orderData: SalesOrderData,
  context: ValidationContext = {}
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  // 1. FSM validation (base)
  try {
    validateStatusTransition(currentStatus, newStatus)
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Transition invalide')
    return { valid: false, errors, warnings }
  }

  // 2. Business rules selon transition
  switch (newStatus) {
    case 'confirmed':
      // Vérifier items et stock
      if (!orderData.items || orderData.items.length === 0) {
        errors.push('Impossible de confirmer: commande sans items')
      }

      if (context.checkStock !== false && context.supabase && orderData.items) {
        const stockIssues = await checkStockAvailability(orderData.items, context.supabase)
        if (stockIssues.length > 0) {
          if (context.strictMode) {
            errors.push(...stockIssues)
          } else {
            warnings.push('⚠️ Stock insuffisant pour certains items (backorder créé)')
          }
        }
      }
      break

    case 'shipped':
      // Vérifier que commande confirmée
      if (currentStatus === 'draft') {
        errors.push('Impossible d\'expédier une commande non confirmée')
      }
      break

    case 'delivered':
      // Vérifier que commande expédiée ou partiellement expédiée
      if (!['shipped', 'partially_shipped', 'confirmed'].includes(currentStatus)) {
        errors.push('Commande doit être expédiée avant livraison')
      }
      break

    case 'cancelled':
      // Vérifier que commande pas payée
      if (orderData.payment_status === 'paid') {
        warnings.push('⚠️ Commande payée - Remboursement nécessaire')
      }

      if (currentStatus === 'delivered') {
        errors.push('Impossible d\'annuler une commande livrée (SAV séparé)')
      }
      break
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valider channel_id existe et est actif
 */
async function validateChannelId(
  channelId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sales_channels')
      .select('id, is_active')
      .eq('id', channelId)
      .single()

    if (error || !data) return false

    return data.is_active === true
  } catch {
    return false
  }
}

/**
 * Vérifier stock disponible pour items
 */
async function checkStockAvailability(
  items: Array<{ product_id: string; quantity: number }>,
  supabase: SupabaseClient
): Promise<string[]> {
  const issues: string[] = []

  for (const item of items) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('name, sku, stock_real, stock_forecasted_out')
        .eq('id', item.product_id)
        .single()

      if (error || !product) {
        issues.push(`Produit ${item.product_id} introuvable`)
        continue
      }

      const stockAvailable = (product.stock_real || 0) - (product.stock_forecasted_out || 0)

      if (stockAvailable < item.quantity) {
        issues.push(
          `Stock insuffisant pour "${product.name}" (SKU: ${product.sku}): ` +
          `demandé ${item.quantity}, disponible ${stockAvailable}`
        )
      }
    } catch (err) {
      issues.push(`Erreur vérification stock pour ${item.product_id}`)
    }
  }

  return issues
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validateStatusTransition,
  validateSalesOrderCreation,
  validateStatusChange,
  getAllowedTransitions,
  isFinalStatus,
  canEditItems,
  canCancel,
  canConfirm,
  canShip,
  canDeliver,
  STATUS_LABELS,
  STATUS_COLORS
}
