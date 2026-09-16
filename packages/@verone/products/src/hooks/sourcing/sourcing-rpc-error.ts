/**
 * Messages des fonctions du cycle de vie sourcing (BO-SOURCING-P4-001).
 *
 * apply_product_lifecycle_action et request_sample_order renvoient des messages
 * rédigés en français pour l'utilisateur avec un code connu : on les affiche
 * tels quels. Toute autre erreur (réseau, base) reçoit un message générique.
 *
 * [BO-SOURCING-COMPLETUDE-001] Les refus pour champs manquants (VL004 côté
 * validation, VS002 côté échantillon) portent en plus, dans `details`, la liste
 * des clés manquantes produite par `sourcing_missing_fields`. On la retraduit
 * avec les MÊMES libellés que la checklist de la fiche, pour que l'écran et la
 * base disent exactement la même chose.
 */

import {
  requirementsFromKeys,
  type SourcingRequirement,
} from '../../utils/sourcing-completeness';

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

/** Codes dont `details` contient la liste des champs manquants. */
const MISSING_FIELD_CODES = new Set(['VL004', 'VS002']);

export interface SourcingRpcError {
  code?: string;
  message: string;
  details?: string | null;
}

/** Exigences manquantes renvoyées par la base, ou tableau vide. */
export function missingRequirementsFromRpcError(
  error: SourcingRpcError
): SourcingRequirement[] {
  if (!error.code || !MISSING_FIELD_CODES.has(error.code)) return [];
  if (typeof error.details !== 'string' || error.details.trim() === '') {
    return [];
  }
  return requirementsFromKeys(error.details.split(',').map(key => key.trim()));
}

export function readableRpcError(
  error: SourcingRpcError,
  fallback: string
): string {
  if (!error.code || !READABLE_CODES.has(error.code)) return fallback;

  const missing = missingRequirementsFromRpcError(error);
  if (missing.length > 0) {
    const labels = missing.map(r => r.label.toLowerCase());
    const list =
      labels.length === 1
        ? labels[0]
        : `${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`;
    return `${error.message} : ${list}.`;
  }

  return error.message;
}
