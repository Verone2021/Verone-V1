/**
 * Consultation Order Guards — filtres purs pour lignes de commande/devis
 *
 * Aucun import React, Supabase ou navigateur.
 * Exécutable côté serveur, dans les tests et dans les Server Components.
 *
 * Sprint BO-CONSULT-P2-001 — 2026-09-12
 */

// ---------------------------------------------------------------------------
// Type minimal pour les fonctions de garde
// ---------------------------------------------------------------------------

/** Champs requis sur un item pour les fonctions de filtrage */
interface OrderGuardable {
  status: string;
  is_free: boolean;
  unit_price: number | null;
  /** Produit de la ligne : retiré si archived_at est rempli (BO-PRODUCTS-P8-001) */
  product?: { archived_at?: string | null } | null;
}

/**
 * Décision D5 (audit sourcing 12/09) : une ligne dont le produit est retiré garde
 * un badge « Retiré », n'est ni commandable ni facturable, et sort du PDF client.
 */
export function isWithdrawnItem(item: OrderGuardable): boolean {
  return Boolean(item.product?.archived_at);
}

// ---------------------------------------------------------------------------
// Fonctions pures
// ---------------------------------------------------------------------------

/**
 * Items facturables : non refusés, non gratuits, avec prix de vente renseigné.
 * Le type de retour est un type predicate — unit_price est garanti `number`.
 * Utilisé pour créer les lignes de commande/devis et calculer les totaux.
 */
export function filterBillableItems<T extends OrderGuardable>(
  items: T[]
): (T & { unit_price: number })[] {
  return items.filter(
    (item): item is T & { unit_price: number } =>
      item.status !== 'rejected' &&
      !isWithdrawnItem(item) &&
      !item.is_free &&
      item.unit_price !== null
  );
}

/**
 * Compte les lignes non refusées, non gratuites, SANS prix de vente.
 * Retourne 0 si tous les prix sont renseignés.
 * Utilisé pour refuser la création d'un devis avec des prix manquants.
 */
export function countUnpricedLines(items: OrderGuardable[]): number {
  return items.filter(
    item =>
      item.status !== 'rejected' &&
      !isWithdrawnItem(item) &&
      !item.is_free &&
      item.unit_price === null
  ).length;
}

/** Lignes montrées au client (PDF client) : ni refusées ni retirées. */
export function filterClientVisibleItems<T extends OrderGuardable>(
  items: T[]
): T[] {
  return items.filter(
    item => item.status !== 'rejected' && !isWithdrawnItem(item)
  );
}

/**
 * Items non refusés (toutes catégories : gratuit, sample, avec prix ou sans).
 * Utilisé pour l'affichage dans les PDFs (filtre les lignes « Refusé »).
 */
export function filterActiveItems<T extends OrderGuardable>(items: T[]): T[] {
  return items.filter(item => item.status !== 'rejected');
}
