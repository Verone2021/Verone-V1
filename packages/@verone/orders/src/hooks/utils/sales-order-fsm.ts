/**
 * FSM - Finite State Machine pour validation transitions status commandes clients
 * Extracted from use-sales-orders.ts for modularity
 */

import type { SalesOrderStatus } from '../types/sales-order.types';

// ============================================================================
// FSM - Finite State Machine pour validation transitions status
// ============================================================================

/**
 * Machine à états finis (FSM) - Transitions autorisées
 * Workflow: draft → validated → partially_shipped → shipped → delivered
 * Annulation possible à tout moment (sauf delivered)
 * Dévalidation (validated → draft) autorisée si aucune expédition
 */
export const STATUS_TRANSITIONS: Record<SalesOrderStatus, SalesOrderStatus[]> =
  {
    pending_approval: ['draft', 'cancelled'],
    draft: ['validated', 'cancelled'],
    validated: ['draft', 'partially_shipped', 'shipped', 'cancelled'], // 'draft' pour dévalidation
    partially_shipped: ['shipped', 'cancelled'],
    shipped: [], // État final - futur: delivered via Packlink/Chronotruck
    cancelled: [], // État final
  };

/**
 * Valider transition status selon FSM
 * @throws Error si transition invalide
 */
export function validateStatusTransition(
  currentStatus: SalesOrderStatus,
  newStatus: SalesOrderStatus
): void {
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

  if (!allowedTransitions.includes(newStatus)) {
    throw new Error(
      `Transition invalide: ${currentStatus} → ${newStatus}. ` +
        `Transitions autorisées: ${allowedTransitions.join(', ') || 'aucune'}`
    );
  }
}

/**
 * Vérifier si status est final (pas de transition possible)
 */
export function isFinalStatus(status: SalesOrderStatus): boolean {
  return STATUS_TRANSITIONS[status].length === 0;
}

/**
 * Obtenir transitions autorisées depuis un status
 */
export function getAllowedTransitions(
  status: SalesOrderStatus
): SalesOrderStatus[] {
  return STATUS_TRANSITIONS[status];
}
