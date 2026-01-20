/**
 * Hook: useAffiliateCommissionTotal
 *
 * Calcule la commission prélevée par Vérone sur les produits affiliés du panier.
 *
 * Logique métier:
 * - Produits CATALOGUE (Vérone): margin_rate représente la marge GAGNÉE par l'affilié
 * - Produits AFFILIÉ: margin_rate = 0%, mais Vérone PRÉLÈVE une commission (affiliate_commission_rate)
 *
 * Ce hook calcule uniquement la commission prélevée sur les produits affiliés.
 *
 * @module use-affiliate-commission
 * @since 2026-01-20
 */

import { useMemo } from 'react';

import type { CartItem } from '../../components/orders/schemas/order-form.schema';

/**
 * Résultat du calcul de commission affilié
 */
export interface AffiliateCommissionResult {
  /** Indique si le panier contient des produits affiliés */
  hasAffiliateProducts: boolean;
  /** Nombre de produits affiliés dans le panier */
  affiliateItemsCount: number;
  /** Commission totale prélevée (en € HT) */
  totalCommission: number;
}

/**
 * Hook pour calculer la commission prélevée sur les produits affiliés
 *
 * @param cartItems - Items du panier (doivent inclure isAffiliateProduct et affiliateCommissionRate)
 * @returns Résultat du calcul avec hasAffiliateProducts, affiliateItemsCount, totalCommission
 *
 * @example
 * ```tsx
 * const commission = useAffiliateCommissionTotal(formData.cart.items);
 *
 * if (commission.hasAffiliateProducts) {
 *   console.log(`Commission prélevée: -${commission.totalCommission} €`);
 * }
 * ```
 */
export function useAffiliateCommissionTotal(
  cartItems: Array<CartItem & { isAffiliateProduct?: boolean; affiliateCommissionRate?: number | null }>
): AffiliateCommissionResult {
  return useMemo(() => {
    // Filtrer les produits affiliés
    const affiliateItems = cartItems.filter((item) => item.isAffiliateProduct === true);

    if (affiliateItems.length === 0) {
      return {
        hasAffiliateProducts: false,
        affiliateItemsCount: 0,
        totalCommission: 0,
      };
    }

    // Calculer la commission prélevée
    // Commission = prix_vente × taux_commission × quantité
    const totalCommission = affiliateItems.reduce((sum, item) => {
      // Taux de commission par défaut: 15% si non défini
      const commissionRate = item.affiliateCommissionRate ?? 15;
      return sum + item.unitPriceHt * (commissionRate / 100) * item.quantity;
    }, 0);

    return {
      hasAffiliateProducts: true,
      affiliateItemsCount: affiliateItems.length,
      totalCommission,
    };
  }, [cartItems]);
}

export default useAffiliateCommissionTotal;
