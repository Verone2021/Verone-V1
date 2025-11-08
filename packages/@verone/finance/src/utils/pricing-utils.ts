/**
 * Utilitaires de calcul de prix pour Vérone Back Office
 *
 * Logique métier Vérone:
 * - cost_price: Prix d'achat HT (base de calcul)
 * - target_margin_percentage: Marge cible en pourcentage (ex: 50 = 50%)
 * - minimum_selling_price: Prix minimum de vente = cost_price × (1 + target_margin_percentage/100)
 *
 * IMPORTANT: Pas de prix de vente fixe, pas de TVA, tout en HT
 */

export interface PricingCalculation {
  costPrice: number;
  targetMarginPercentage: number;
  minimumSellingPrice: number;
}

/**
 * Calcule le prix minimum de vente basé sur le prix d'achat et la marge cible
 *
 * @param costPrice Prix d'achat HT en euros
 * @param targetMarginPercentage Marge cible en pourcentage (ex: 100 pour 100%)
 * @returns Prix minimum de vente HT en euros
 */
export function calculateMinimumSellingPrice(
  costPrice: number,
  targetMarginPercentage: number
): number {
  if (costPrice <= 0 || targetMarginPercentage < 0) {
    return 0;
  }

  // Formule Vérone: Prix d'achat HT × (1 + marge_cible/100)
  // Exemple: 10€ HT × (1 + 100/100) = 10€ × 2 = 20€ HT minimum
  return costPrice * (1 + targetMarginPercentage / 100);
}

/**
 * Calcule le profit brut basé sur le prix minimum de vente
 *
 * @param minimumSellingPrice Prix minimum de vente calculé
 * @param costPrice Prix d'achat HT
 * @returns Profit brut en euros
 */
export function calculateGrossProfit(
  minimumSellingPrice: number,
  costPrice: number
): number {
  if (costPrice <= 0 || minimumSellingPrice <= 0) {
    return 0;
  }

  // Formule: Prix minimum de vente - Prix d'achat
  return minimumSellingPrice - costPrice;
}

/**
 * Formate un prix en euros avec 2 décimales
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Formate un pourcentage de marge
 */
export function formatMargin(margin: number): string {
  return `${margin.toFixed(1)}%`;
}

/**
 * Calcule toutes les métriques de prix pour un produit selon la logique Vérone
 */
export function calculatePricingMetrics(
  costPrice: number,
  targetMarginPercentage: number
): PricingCalculation {
  const minimumSellingPrice = calculateMinimumSellingPrice(
    costPrice,
    targetMarginPercentage
  );

  return {
    costPrice,
    targetMarginPercentage,
    minimumSellingPrice,
  };
}

/**
 * Valide que les prix sont cohérents selon la logique métier Vérone
 */
export function validatePricing(
  costPrice: number,
  targetMarginPercentage: number
): string[] {
  const errors: string[] = [];

  if (costPrice <= 0) {
    errors.push("Le prix d'achat HT doit être supérieur à 0€");
  }

  if (targetMarginPercentage < 0) {
    errors.push('La marge cible ne peut pas être négative');
  }

  if (targetMarginPercentage > 1000) {
    errors.push('La marge cible ne peut pas dépasser 1000%');
  }

  return errors;
}
