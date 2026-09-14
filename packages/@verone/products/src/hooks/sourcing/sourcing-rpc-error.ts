/**
 * Messages des fonctions du cycle de vie sourcing (BO-SOURCING-P4-001).
 *
 * apply_product_lifecycle_action et request_sample_order renvoient des messages
 * rédigés en français pour l'utilisateur avec un code connu : on les affiche
 * tels quels. Toute autre erreur (réseau, base) reçoit un message générique.
 */

const READABLE_CODES = new Set([
  '42501',
  'P0002',
  'VL001',
  'VL002',
  'VL003',
  'VL004',
  'VS001',
  'VS002',
]);

export interface SourcingRpcError {
  code?: string;
  message: string;
}

export function readableRpcError(
  error: SourcingRpcError,
  fallback: string
): string {
  return error.code && READABLE_CODES.has(error.code)
    ? error.message
    : fallback;
}
