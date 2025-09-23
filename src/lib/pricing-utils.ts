/**
 * Utilitaires de calcul de prix pour Vérone Back Office
 *
 * Logique métier:
 * - supplier_cost_price: Prix d'achat fournisseur
 * - margin_percentage: Marge minimum en pourcentage (ex: 50 = 50%)
 * - minimum_selling_price: Prix minimum de vente calculé automatiquement
 */

export interface PricingCalculation {
  supplierCostPrice: number;
  marginPercentage: number;
  minimumSellingPrice: number;
}

/**
 * Calcule le prix minimum de vente basé sur le prix d'achat et la marge
 *
 * @param supplierCostPrice Prix d'achat fournisseur en euros
 * @param marginPercentage Marge en pourcentage (ex: 50 pour 50%)
 * @returns Prix minimum de vente en euros
 */
export function calculateMinimumSellingPrice(
  supplierCostPrice: number,
  marginPercentage: number
): number {
  if (supplierCostPrice <= 0 || marginPercentage < 0) {
    return 0;
  }

  // Formule: Prix d'achat × (1 + marge/100)
  // Exemple: 100€ × (1 + 50/100) = 100€ × 1.5 = 150€
  return supplierCostPrice * (1 + marginPercentage / 100);
}

/**
 * Calcule la marge réalisée entre le prix de vente et le prix d'achat
 *
 * @param sellingPrice Prix de vente réel
 * @param supplierCostPrice Prix d'achat fournisseur
 * @returns Marge en pourcentage
 */
export function calculateActualMargin(
  sellingPrice: number,
  supplierCostPrice: number
): number {
  if (supplierCostPrice <= 0) {
    return 0;
  }

  // Formule: ((Prix vente - Prix achat) / Prix achat) × 100
  return ((sellingPrice - supplierCostPrice) / supplierCostPrice) * 100;
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
 * Calcule toutes les métriques de prix pour un produit
 */
export function calculatePricingMetrics(
  supplierCostPrice: number,
  marginPercentage: number
): PricingCalculation {
  const minimumSellingPrice = calculateMinimumSellingPrice(
    supplierCostPrice,
    marginPercentage
  );

  return {
    supplierCostPrice,
    marginPercentage,
    minimumSellingPrice,
  };
}

/**
 * Valide que les prix sont cohérents
 */
export function validatePricing(
  supplierCostPrice: number,
  marginPercentage: number
): string[] {
  const errors: string[] = [];

  if (supplierCostPrice <= 0) {
    errors.push('Le prix d\'achat fournisseur doit être supérieur à 0€');
  }

  if (marginPercentage < 0) {
    errors.push('La marge ne peut pas être négative');
  }

  if (marginPercentage > 1000) {
    errors.push('La marge ne peut pas dépasser 1000%');
  }

  return errors;
}