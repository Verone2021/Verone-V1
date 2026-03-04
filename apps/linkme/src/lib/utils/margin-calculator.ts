/**
 * LinkMe Margin Calculator
 * Calcul des marges et zones de couleur (feu tricolore)
 * Source: back-office/canaux-vente/linkme/types.ts (logique dupliquée)
 *
 * @module margin-calculator
 * @since 2026-02
 */

import { MIN_MARGIN } from '@verone/utils';

export interface MarginCalculationResult {
  /** Marge minimum en decimal (MIN_MARGIN / 100) */
  minRate: number;
  /** Marge maximum calculee en decimal */
  maxRate: number;
  /** Marge suggeree en decimal (maxRate / 3) */
  suggestedRate: number;
  /** True si le produit est vendable (maxRate > minRate) */
  isProductSellable: boolean;
  /** Fin de la zone verte (0 -> suggestedRate) */
  greenZoneEnd: number;
  /** Fin de la zone orange (suggestedRate -> orangeZoneEnd) */
  orangeZoneEnd: number;
}

interface MarginCalculationInput {
  basePriceHT: number;
  publicPriceHT: number;
  platformFeeRate: number;
  bufferRate?: number;
}

/**
 * Calcule les marges LinkMe a partir du prix de vente et du tarif public
 *
 * FORMULE:
 * - prixClientLinkMe = basePriceHT * (1 + platformFeeRate)
 * - prixPlafond = publicPriceHT * (1 - bufferRate)
 * - maxRate = (prixPlafond - prixClient) / prixClient
 * - suggestedRate = maxRate / 3
 *
 * ZONES:
 * - VERT (competitif): 0% -> maxRate/3
 * - ORANGE (correct): maxRate/3 -> 2*maxRate/3
 * - ROUGE (proche public): 2*maxRate/3 -> maxRate
 */
export function calculateLinkMeMargins(
  input: MarginCalculationInput
): MarginCalculationResult {
  const {
    basePriceHT,
    publicPriceHT,
    platformFeeRate,
    bufferRate = 0.05,
  } = input;

  if (
    !publicPriceHT ||
    publicPriceHT <= 0 ||
    !basePriceHT ||
    basePriceHT <= 0
  ) {
    return {
      minRate: MIN_MARGIN / 100,
      maxRate: 0,
      suggestedRate: 0,
      isProductSellable: false,
      greenZoneEnd: 0,
      orangeZoneEnd: 0,
    };
  }

  const prixClientLinkMe = basePriceHT * (1 + platformFeeRate);
  const prixPlafondSecurite = publicPriceHT * (1 - bufferRate);

  const maxRate = Math.max(
    0,
    (prixPlafondSecurite - prixClientLinkMe) / prixClientLinkMe
  );

  const suggestedRate = maxRate / 3;

  return {
    minRate: MIN_MARGIN / 100,
    maxRate: Math.round(maxRate * 10000) / 10000,
    suggestedRate: Math.round(suggestedRate * 10000) / 10000,
    isProductSellable: maxRate > MIN_MARGIN / 100,
    greenZoneEnd: suggestedRate,
    orangeZoneEnd: suggestedRate * 2,
  };
}

/**
 * Determine la couleur d'une marge dans le systeme de feux tricolores
 */
export function getMarginColor(
  marginRate: number,
  result: MarginCalculationResult
): 'green' | 'orange' | 'red' {
  if (marginRate <= result.greenZoneEnd) return 'green';
  if (marginRate <= result.orangeZoneEnd) return 'orange';
  return 'red';
}
