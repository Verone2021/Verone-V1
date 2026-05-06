/**
 * Types du module finance-totals
 *
 * Source de vérité unique pour le calcul des totaux financiers.
 * Sprint BO-FIN-046 — 2026-05-06
 */

// ---------------------------------------------------------------------------
// Constante de version de formule
// ---------------------------------------------------------------------------

/** Version de la formule utilisée — à inclure dans financial_document_items.formula_version */
export const FORMULA_VERSION = 'round-per-line-v1' as const;
export type FormulaVersion = typeof FORMULA_VERSION;

// ---------------------------------------------------------------------------
// Taux TVA autorisés
// ---------------------------------------------------------------------------

/** Taux TVA valides en France (décimal). */
export type TaxRate = 0 | 0.021 | 0.055 | 0.085 | 0.1 | 0.2;

// ---------------------------------------------------------------------------
// Entrées du module
// ---------------------------------------------------------------------------

/**
 * Un article à inclure dans le calcul.
 *
 * - `tax_rate` : taux en décimal (0.2 = 20%). NULL/undefined REJETÉ en mode strict.
 * - `discount_percentage` : remise sur la ligne (0-100).
 * - `eco_tax` : écotaxe unitaire HT (ajoutée à la base avant TVA).
 */
export interface FinancialItem {
  quantity: number;
  unit_price_ht: number;
  /** Taux TVA décimal. Obligatoire (null/undefined → Error en mode strict). */
  tax_rate: number | null | undefined;
  discount_percentage?: number;
  eco_tax?: number;
  description?: string;
}

/**
 * Frais annexes de la commande.
 * Tous les frais partagent le même taux de TVA `fees_vat_rate`.
 */
export interface FinancialFees {
  shipping_cost_ht: number;
  handling_cost_ht: number;
  insurance_cost_ht: number;
  fees_vat_rate: number;
}

// ---------------------------------------------------------------------------
// Options du module
// ---------------------------------------------------------------------------

export interface ComputeOptions {
  /**
   * Mode strict (défaut : true).
   * - true  : tax_rate NULL → Error explicite
   * - false : tax_rate NULL → fallback 0 (mode permissif pour migration)
   */
  strict?: boolean;
}

// ---------------------------------------------------------------------------
// Résultat du calcul
// ---------------------------------------------------------------------------

/**
 * Totaux calculés par `computeFinancialTotals`.
 *
 * - `itemsHt` : somme HT des articles uniquement (sans frais)
 * - `feesHt`  : somme HT des frais uniquement
 * - `totalHt` : itemsHt + feesHt
 * - `vatByRate` : TVA par taux, clé = taux décimal stringifié (ex: "0.20")
 * - `totalVat` : somme de vatByRate
 * - `totalTtc` : totalHt + totalVat (calculé round-per-line, pas round-sur-total)
 * - `formulaVersion` : toujours "round-per-line-v1"
 */
export interface FinancialTotals {
  itemsHt: number;
  feesHt: number;
  totalHt: number;
  vatByRate: Record<string, number>;
  totalVat: number;
  totalTtc: number;
  formulaVersion: FormulaVersion;
}

// ---------------------------------------------------------------------------
// Type pour la ligne Qonto
// ---------------------------------------------------------------------------

/**
 * Ligne formatée pour l'API Qonto.
 * `unit_price` et `vat_rate` sont des strings (contrat API Qonto).
 */
export interface QontoLine {
  title: string;
  description?: string;
  quantity: string;
  unit: string;
  unitPrice: {
    value: string;
    currency: 'EUR';
  };
  vatRate: string;
  /** Pour usage interne persistance locale */
  unit_price_ht: number;
  quantity_num: number;
  vat_rate_num: number;
  product_id?: string;
}
