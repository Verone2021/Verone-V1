/**
 * TVA (French VAT) rates and utilities
 *
 * Standard French VAT rates as of 2025:
 * - 20% : Taux normal (most goods and services)
 * - 10% : Taux intermédiaire (restaurants, transport, renovation)
 * - 5.5% : Taux réduit (food, books, energy)
 * - 0% : Exonéré (certain medical, education)
 */

export type TvaRate = 0 | 5.5 | 10 | 20;

export interface TvaOption {
  value: TvaRate;
  label: string;
  description: string;
}

/**
 * Available TVA rates for selection
 */
export const TVA_RATES: TvaOption[] = [
  {
    value: 20,
    label: '20%',
    description: 'Taux normal',
  },
  {
    value: 10,
    label: '10%',
    description: 'Taux intermédiaire',
  },
  {
    value: 5.5,
    label: '5,5%',
    description: 'Taux réduit',
  },
  {
    value: 0,
    label: '0%',
    description: 'Exonéré',
  },
];

/**
 * Calculate HT (excluding VAT) from TTC (including VAT)
 */
export function calculateHT(ttc: number, tvaRate: TvaRate): number {
  return Math.round((ttc / (1 + tvaRate / 100)) * 100) / 100;
}

/**
 * Calculate VAT amount from TTC
 */
export function calculateVAT(ttc: number, tvaRate: TvaRate): number {
  const ht = calculateHT(ttc, tvaRate);
  return Math.round((ttc - ht) * 100) / 100;
}

/**
 * Calculate TTC (including VAT) from HT
 */
export function calculateTTC(ht: number, tvaRate: TvaRate): number {
  return Math.round(ht * (1 + tvaRate / 100) * 100) / 100;
}

/**
 * Format TVA rate for display
 */
export function formatTvaRate(rate: TvaRate): string {
  return rate === 5.5 ? '5,5%' : `${rate}%`;
}

/**
 * Get TVA option by value
 */
export function getTvaOption(rate: TvaRate): TvaOption | undefined {
  return TVA_RATES.find(option => option.value === rate);
}
