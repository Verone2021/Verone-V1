/**
 * Consultation Line Status — vocabulaire des statuts de ligne
 *
 * Aucun import React, Supabase ou navigateur.
 *
 * Source unique du sens de chaque statut, partagée par le calcul
 * (`consultation-economics`), la répartition des frais
 * (`consultation-supplier-costs`) et les gardes de commande/devis
 * (`consultation-order-guards`).
 *
 * Le statut `candidate` a été ajouté en base par BO-CONSULT-P9-001 sans que le
 * code le connaisse : une option candidate aurait été comptée dans le chiffre
 * d'affaires et dans la marge, mise au devis, et aurait bloqué la création du
 * devis en tant que « prix à fixer ». Ce fichier neutralise ce piège avant
 * toute exposition des besoins à l'écran (BO-CONSULT-MULTI-001).
 *
 * Miroir du CHECK `consultation_products_status_check`.
 */

export const CONSULTATION_LINE_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'revision_needed',
  'ordered',
  'candidate',
] as const;

export type ConsultationLineStatus =
  (typeof CONSULTATION_LINE_STATUSES)[number];

/** Ligne écartée par l'utilisateur. */
export function isRejectedLine(status: string): boolean {
  return status === 'rejected';
}

/**
 * Option en cours de comparaison pour un besoin : proposée au client, mais
 * pas encore retenue. Ni chiffre d'affaires, ni marge, ni devis, ni commande.
 */
export function isCandidateLine(status: string): boolean {
  return status === 'candidate';
}

/**
 * Ligne retenue : comptée dans les totaux, les documents et les commandes.
 * Tout ce qui n'est ni refusé ni encore à l'état d'option.
 */
export function isRetainedLine(status: string): boolean {
  return !isRejectedLine(status) && !isCandidateLine(status);
}
