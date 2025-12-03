'use client';

import { useMemo } from 'react';

import { calculateLinkMeMargins, type MarginCalculationResult } from '../types';

/**
 * Configuration globale pour le calcul des marges LinkMe
 * Ces valeurs peuvent être surchargées par les paramètres du hook
 */
export const LINKME_MARGIN_DEFAULTS = {
  /** Marge de sécurité sous le prix public (5%) */
  bufferRate: 0.05,
  /** Commission LinkMe par défaut (5%) */
  defaultCommissionRate: 0.05,
  /** Marge minimum constante (1%) */
  minRate: 0.01,
} as const;

/**
 * Hook pour calculer automatiquement les marges LinkMe
 *
 * Le calcul se met à jour automatiquement (useMemo) dès qu'une des valeurs change :
 * - costPriceHT (prix d'achat)
 * - publicPriceHT (tarif public)
 * - commissionRate (commission LinkMe)
 * - bufferRate (marge de sécurité)
 *
 * @example
 * const marginResult = useCalculateLinkMeMargins(
 *   product.cost_price,
 *   formData.public_price_ht,
 *   formData.channel_commission_rate,
 *   config.bufferRate
 * );
 *
 * if (marginResult?.isProductSellable) {
 *   console.log('Max margin:', marginResult.maxRate * 100, '%');
 *   console.log('Suggested:', marginResult.suggestedRate * 100, '%');
 * }
 */
export function useCalculateLinkMeMargins(
  costPriceHT: number | null | undefined,
  publicPriceHT: number | null | undefined,
  commissionRatePercent: number | null | undefined,
  bufferRate: number = LINKME_MARGIN_DEFAULTS.bufferRate
): MarginCalculationResult | null {
  return useMemo(() => {
    // Validation des entrées requises
    if (!costPriceHT || costPriceHT <= 0) return null;
    if (!publicPriceHT || publicPriceHT <= 0) return null;

    // Conversion du taux de commission de % vers décimal
    // Si commissionRatePercent = 5, platformFeeRate = 0.05
    const platformFeeRate =
      commissionRatePercent !== null && commissionRatePercent !== undefined
        ? commissionRatePercent / 100
        : LINKME_MARGIN_DEFAULTS.defaultCommissionRate;

    return calculateLinkMeMargins({
      costPriceHT,
      publicPriceHT,
      platformFeeRate,
      bufferRate,
    });
  }, [costPriceHT, publicPriceHT, commissionRatePercent, bufferRate]);
}

/**
 * Convertit le résultat du calcul en valeurs pourcentage pour l'affichage UI
 */
export function marginResultToPercent(result: MarginCalculationResult): {
  minRatePercent: number;
  maxRatePercent: number;
  suggestedRatePercent: number;
  greenZoneEndPercent: number;
  orangeZoneEndPercent: number;
} {
  return {
    minRatePercent: Math.round(result.minRate * 100 * 10) / 10,
    maxRatePercent: Math.round(result.maxRate * 100 * 10) / 10,
    suggestedRatePercent: Math.round(result.suggestedRate * 100 * 10) / 10,
    greenZoneEndPercent: Math.round(result.greenZoneEnd * 100 * 10) / 10,
    orangeZoneEndPercent: Math.round(result.orangeZoneEnd * 100 * 10) / 10,
  };
}
