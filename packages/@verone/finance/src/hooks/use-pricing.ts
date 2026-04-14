/**
 * Hook React: Pricing Intelligent Multi-Canaux & Clients - V2
 *
 * Gestion complète du calcul de prix avec waterfall priorités:
 * 1. Prix contrat client spécifique → PRIORITÉ MAX
 * 2. Prix groupe client (B2B Gold, VIP, etc.) → HAUTE PRIORITÉ
 * 3. Prix canal de vente (Retail, Wholesale, B2B) → PRIORITÉ NORMALE
 * 4. Prix catalogue base → FALLBACK
 */

// Re-export all types
export type {
  PricingResultV2,
  PricingResult,
  PricingParams,
  BatchPricingRequest,
  BatchPricingResult,
  SalesChannel,
  ChannelPricing,
  CustomerPricing,
  QuantityBreak,
  QuantityBreaksParams,
} from './pricing/types';

// Re-export hooks
export { useProductPrice, useBatchPricing } from './pricing/use-product-price';
export {
  useSalesChannels,
  useChannelPricing,
} from './pricing/use-channel-pricing';
export { useCustomerPricing } from './pricing/use-customer-pricing';
export { useQuantityBreaks } from './pricing/use-quantity-breaks';
export {
  formatPrice,
  calculateDiscountPercentage,
  useInvalidatePricing,
} from './pricing/pricing-utils';
