import { useQueryClient } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';

export function formatPrice(
  price: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function calculateDiscountPercentage(
  originalPrice: number,
  finalPrice: number
): number {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

export function useInvalidatePricing() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pricing-v2'] }),
        queryClient.invalidateQueries({ queryKey: ['channel-pricing'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-pricing'] }),
        queryClient.invalidateQueries({ queryKey: ['quantity-breaks'] }),
      ]);
      logger.info('All pricing caches invalidated (V2)', {
        operation: 'invalidatePricing',
      });
    },
    invalidateProduct: async (productId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['pricing-v2', { productId }],
        }),
        queryClient.invalidateQueries({
          queryKey: ['channel-pricing', productId],
        }),
        queryClient.invalidateQueries({
          queryKey: ['quantity-breaks', productId],
        }),
      ]);
      logger.info('Product pricing cache invalidated (V2)', {
        operation: 'invalidatePricing',
        productId,
      });
    },
    invalidateCustomer: async (customerId: string) => {
      await queryClient.invalidateQueries({
        queryKey: ['customer-pricing', customerId],
      });
      logger.info('Customer pricing cache invalidated (V2)', {
        operation: 'invalidatePricing',
        customerId,
      });
    },
  };
}
