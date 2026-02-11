/**
 * Types partagés pour les filtres avancés (ventes + achats)
 */

// --- Commandes Clients (Sales) ---

export interface SalesAdvancedFilters {
  /** Multi-select statuts commande */
  statuses: string[];
  /** Type client: all | individual | professional | organisation | enseigne */
  customerType: string;
  /** ID enseigne spécifique */
  enseigneId: string | null;
  /** ID organisation spécifique */
  organisationId: string | null;
  /** Période rapide */
  period: 'all' | 'month' | 'quarter' | 'year';
  /** Montant TTC min */
  amountMin: number | null;
  /** Montant TTC max */
  amountMax: number | null;
  /** Canal de vente ID */
  channelId: string | null;
  /** Rapprochement bancaire */
  matching: 'all' | 'matched' | 'unmatched';
}

export const DEFAULT_SALES_FILTERS: SalesAdvancedFilters = {
  statuses: [],
  customerType: 'all',
  enseigneId: null,
  organisationId: null,
  period: 'all',
  amountMin: null,
  amountMax: null,
  channelId: null,
  matching: 'all',
};

// --- Commandes Fournisseurs (Purchase) ---

export interface PurchaseAdvancedFilters {
  /** Multi-select statuts commande */
  statuses: string[];
  /** ID fournisseur spécifique */
  supplierId: string | null;
  /** Période rapide */
  period: 'all' | 'month' | 'quarter' | 'year';
  /** Montant HT min */
  amountMin: number | null;
  /** Montant HT max */
  amountMax: number | null;
  /** Rapprochement bancaire */
  matching: 'all' | 'matched' | 'unmatched';
}

export const DEFAULT_PURCHASE_FILTERS: PurchaseAdvancedFilters = {
  statuses: [],
  supplierId: null,
  period: 'all',
  amountMin: null,
  amountMax: null,
  matching: 'all',
};

/** Compte le nombre de filtres actifs */
export function countActiveFilters(
  filters: SalesAdvancedFilters | PurchaseAdvancedFilters,
  defaults: SalesAdvancedFilters | PurchaseAdvancedFilters
): number {
  let count = 0;
  for (const key of Object.keys(filters)) {
    const k = key as keyof typeof filters;
    const current = filters[k];
    const defaultVal = defaults[k];

    if (Array.isArray(current)) {
      if (current.length > 0) count++;
    } else if (current !== defaultVal) {
      count++;
    }
  }
  return count;
}
