/**
 * Calculs de marge LinkMe - SOURCE UNIQUE (SSOT)
 *
 * IMPORTANT: Ce fichier est la SEULE source de calcul de marge.
 * NE JAMAIS dupliquer ces formules ailleurs !
 *
 * Formule utilisée: TAUX DE MARQUE (cohérent avec la colonne GENERATED en DB)
 * - selling_price = base_price / (1 - margin_rate/100)
 * - gain = selling_price - base_price
 *
 * Cette formule est identique à celle de la migration:
 * 20251216_001_taux_de_marque_formula.sql
 *
 * @module margin-calculation
 * @since 2026-01-20
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MarginCalculationInput {
  /** Prix de base HT (prix d'achat ou prix catalogue) */
  basePriceHt: number;
  /** Taux de marge en pourcentage (ex: 15 pour 15%) */
  marginRate: number;
}

export interface MarginCalculationResult {
  /** Prix de vente HT calculé avec le taux de marque */
  sellingPriceHt: number;
  /** Gain affilié en euros (selling_price - base_price) */
  gainEuros: number;
  /** Taux de marge en % (retourné pour cohérence) */
  marginRate: number;
}

export interface AffiliateCommissionInput {
  /** Prix de vente HT du produit affilié */
  sellingPriceHt: number;
  /** Taux de commission prélevée par Vérone (ex: 15 pour 15%) */
  commissionRate: number;
}

export interface AffiliateCommissionResult {
  /** Commission prélevée par Vérone en euros */
  commissionEuros: number;
  /** Montant que l'affilié reçoit après prélèvement */
  affiliateReceives: number;
  /** Taux de commission en % */
  commissionRate: number;
}

// ============================================================================
// CALCULS PRODUITS CATALOGUE (marge = gain)
// ============================================================================

/**
 * Calcule le prix de vente et le gain affilié pour un produit CATALOGUE
 *
 * Utilise la formule TAUX DE MARQUE:
 * - selling_price_ht = base_price_ht / (1 - margin_rate/100)
 * - gain_euros = selling_price_ht - base_price_ht
 *
 * Exemple avec base=100€ et marge=15%:
 * - selling_price = 100 / (1 - 0.15) = 100 / 0.85 = 117.65€
 * - gain = 117.65 - 100 = 17.65€
 *
 * @param input - Prix de base et taux de marge
 * @returns Prix de vente, gain en euros, et taux de marge
 */
export function calculateMargin(input: MarginCalculationInput): MarginCalculationResult {
  const { basePriceHt, marginRate } = input;

  // Validation
  if (basePriceHt < 0) {
    throw new Error('Le prix de base ne peut pas être négatif');
  }
  if (marginRate < 0 || marginRate >= 100) {
    throw new Error('Le taux de marge doit être entre 0 et 100 (exclus)');
  }

  // Cas spécial: margin_rate = 0 → pas de marge
  if (marginRate === 0) {
    return {
      sellingPriceHt: roundToTwoDecimals(basePriceHt),
      gainEuros: 0,
      marginRate: 0,
    };
  }

  // Formule TAUX DE MARQUE (identique à la DB)
  // selling_price_ht = base_price_ht / (1 - margin_rate/100)
  const sellingPriceHt = basePriceHt / (1 - marginRate / 100);
  const gainEuros = sellingPriceHt - basePriceHt;

  return {
    sellingPriceHt: roundToTwoDecimals(sellingPriceHt),
    gainEuros: roundToTwoDecimals(gainEuros),
    marginRate,
  };
}

/**
 * Calcule le gain depuis selling_price_ht (lecture directe DB)
 *
 * Utilisé quand on lit directement depuis linkme_selection_items
 * où selling_price_ht est une colonne GENERATED.
 *
 * @param basePriceHt - Prix de base HT
 * @param sellingPriceHt - Prix de vente HT (depuis DB)
 * @returns Gain en euros
 */
export function calculateGainFromSellingPrice(
  basePriceHt: number,
  sellingPriceHt: number
): number {
  return roundToTwoDecimals(sellingPriceHt - basePriceHt);
}

/**
 * Calcule le taux de marge depuis les prix (reverse engineering)
 *
 * Formule inverse du taux de marque:
 * margin_rate = 1 - (base_price / selling_price)
 *
 * @param basePriceHt - Prix de base HT
 * @param sellingPriceHt - Prix de vente HT
 * @returns Taux de marge en pourcentage
 */
export function calculateMarginRateFromPrices(
  basePriceHt: number,
  sellingPriceHt: number
): number {
  if (sellingPriceHt <= 0) {
    throw new Error('Le prix de vente doit être positif');
  }
  if (basePriceHt < 0) {
    throw new Error('Le prix de base ne peut pas être négatif');
  }
  if (basePriceHt >= sellingPriceHt) {
    return 0;
  }

  const marginRate = (1 - basePriceHt / sellingPriceHt) * 100;
  return roundToTwoDecimals(marginRate);
}

// ============================================================================
// CALCULS PRODUITS AFFILIÉS (commission = prélèvement)
// ============================================================================

/**
 * Calcule la commission prélevée sur un produit AFFILIÉ (revendeur)
 *
 * Pour les produits créés par l'affilié (pas du catalogue Vérone),
 * Vérone prélève une commission sur le prix de vente.
 *
 * Exemple avec prix=500€ et commission=15%:
 * - commission = 500 × 0.15 = 75€
 * - affilié reçoit = 500 - 75 = 425€
 *
 * @param input - Prix de vente et taux de commission
 * @returns Commission prélevée, montant reçu par l'affilié
 */
export function calculateAffiliateCommission(
  input: AffiliateCommissionInput
): AffiliateCommissionResult {
  const { sellingPriceHt, commissionRate } = input;

  // Validation
  if (sellingPriceHt < 0) {
    throw new Error('Le prix de vente ne peut pas être négatif');
  }
  if (commissionRate < 0 || commissionRate > 100) {
    throw new Error('Le taux de commission doit être entre 0 et 100');
  }

  const commissionEuros = sellingPriceHt * (commissionRate / 100);
  const affiliateReceives = sellingPriceHt - commissionEuros;

  return {
    commissionEuros: roundToTwoDecimals(commissionEuros),
    affiliateReceives: roundToTwoDecimals(affiliateReceives),
    commissionRate,
  };
}

// ============================================================================
// CALCULS PANIER / TOTAUX
// ============================================================================

export interface CartItemForCalculation {
  /** Prix de base HT */
  basePriceHt: number;
  /** Taux de marge en % */
  marginRate: number;
  /** Quantité */
  quantity: number;
  /** Est-ce un produit affilié (revendeur) ? */
  isAffiliateProduct?: boolean;
  /** Taux de commission pour produits affiliés */
  affiliateCommissionRate?: number | null;
  /** Taux TVA spécifique pour cet item (optionnel, sinon utilise defaultTaxRate) */
  taxRate?: number;
}

export interface CartTotalsResult {
  /** Total HT du panier (somme des selling_price × quantity) */
  totalHT: number;
  /** Total TVA */
  totalTVA: number;
  /** Total TTC */
  totalTTC: number;
  /** Commission totale affilié (gains sur produits catalogue) */
  totalCommission: number;
  /** Nombre total d'articles */
  itemsCount: number;
  /** Taux TVA effectif utilisé (pour affichage) */
  effectiveTaxRate: number;
}

/**
 * Calcule les totaux du panier avec la commission affilié
 *
 * @param items - Items du panier avec basePriceHt
 * @param defaultTaxRate - Taux TVA par défaut (0.20 pour France, 0 pour export). Défaut: 0.20
 * @returns Totaux HT, TVA, TTC et commission
 */
export function calculateCartTotals(
  items: CartItemForCalculation[],
  defaultTaxRate: number = 0.20
): CartTotalsResult {
  let totalHT = 0;
  let totalTVA = 0;
  let totalCommission = 0;
  let itemsCount = 0;

  for (const item of items) {
    const { basePriceHt, marginRate, quantity, isAffiliateProduct, affiliateCommissionRate, taxRate } = item;

    // Utiliser le taux spécifique de l'item ou le taux par défaut de l'organisation
    const effectiveItemTaxRate = taxRate ?? defaultTaxRate;

    // Calcul du prix de vente avec la formule TAUX DE MARQUE
    const { sellingPriceHt, gainEuros } = calculateMargin({ basePriceHt, marginRate });

    // Total HT
    const lineHT = sellingPriceHt * quantity;
    totalHT += lineHT;

    // TVA par ligne (permet des taux différents par item si nécessaire)
    totalTVA += lineHT * effectiveItemTaxRate;

    itemsCount += quantity;

    // Commission
    if (isAffiliateProduct && affiliateCommissionRate) {
      // Produit affilié: commission = prélèvement Vérone (négatif pour l'affilié)
      // Note: on ne l'ajoute pas ici car c'est un prélèvement, pas un gain
      // La commission est déjà incluse dans le prix de vente
    } else {
      // Produit catalogue: gain = marge de l'affilié
      totalCommission += gainEuros * quantity;
    }
  }

  const totalTTC = totalHT + totalTVA;

  return {
    totalHT: roundToTwoDecimals(totalHT),
    totalTVA: roundToTwoDecimals(totalTVA),
    totalTTC: roundToTwoDecimals(totalTTC),
    totalCommission: roundToTwoDecimals(totalCommission),
    itemsCount,
    effectiveTaxRate: defaultTaxRate,
  };
}

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Arrondit un nombre à 2 décimales
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formate un montant en euros pour l'affichage
 */
export function formatEuros(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formate un pourcentage pour l'affichage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
