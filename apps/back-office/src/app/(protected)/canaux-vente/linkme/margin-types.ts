export interface MarginCalculationInput {
  basePriceHT: number;
  publicPriceHT: number;
  platformFeeRate: number;
  bufferRate?: number;
}

export interface MarginCalculationResult {
  minRate: number;
  maxRate: number;
  suggestedRate: number;
  isProductSellable: boolean;
  greenZoneEnd: number;
  orangeZoneEnd: number;
}

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
      minRate: 0.01,
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
    minRate: 0.01,
    maxRate: Math.round(maxRate * 10000) / 10000,
    suggestedRate: Math.round(suggestedRate * 10000) / 10000,
    isProductSellable: maxRate > 0.01,
    greenZoneEnd: suggestedRate,
    orangeZoneEnd: suggestedRate * 2,
  };
}

export function calculateFinalClientPrice(
  basePriceHT: number,
  platformFeeRate: number,
  affiliateMarginRate: number
): number {
  const priceWithMargin = basePriceHT * (1 + affiliateMarginRate);
  return priceWithMargin * (1 + platformFeeRate);
}

export function getMarginColor(
  marginRate: number,
  result: MarginCalculationResult
): 'green' | 'orange' | 'red' {
  if (marginRate <= result.greenZoneEnd) return 'green';
  if (marginRate <= result.orangeZoneEnd) return 'orange';
  return 'red';
}
