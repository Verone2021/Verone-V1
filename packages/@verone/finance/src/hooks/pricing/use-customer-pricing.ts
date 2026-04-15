import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type { CustomerPricing } from './types';

export function useCustomerPricing(
  customerId: string,
  customerType: 'organization' | 'individual'
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['customer-pricing', customerId, customerType],
    queryFn: async (): Promise<CustomerPricing[]> => {
      try {
        const { data, error } = await supabase
          .from('customer_pricing')
          .select('*')
          .eq('customer_id', customerId)
          .eq('customer_type', customerType)
          .eq('is_active', true)
          .eq('approval_status', 'approved')
          .order('valid_from', { ascending: false });

        if (error) {
          logger.error('Failed to fetch customer pricing', undefined, {
            operation: 'useCustomerPricing',
            customerId,
            customerType,
            error: error.message,
          });
          throw error;
        }

        logger.info('Customer pricing fetched successfully', {
          operation: 'useCustomerPricing',
          customerId,
          count: data?.length ?? 0,
        });
        return (data as unknown as CustomerPricing[]) ?? [];
      } catch (error) {
        logger.error('Exception in useCustomerPricing', undefined, {
          operation: 'useCustomerPricing',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
