import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createUntypedClient } from '@/lib/supabase/untyped-client';

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  first_name: string;
  last_name: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
}

export type AddressInput = Omit<
  CustomerAddress,
  'id' | 'user_id' | 'created_at'
>;

export function useCustomerAddresses(userId: string | undefined) {
  const supabase = createUntypedClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['customer-addresses', userId],
    queryFn: async (): Promise<CustomerAddress[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('customer_addresses')
        .select(
          'id, user_id, label, first_name, last_name, address, postal_code, city, country, phone, is_default, created_at'
        )
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('[useCustomerAddresses] fetch error:', error);
        throw error;
      }
      return (data ?? []) as CustomerAddress[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const addAddress = useMutation({
    mutationFn: async (input: AddressInput) => {
      // If setting as default, unset others first
      if (input.is_default && userId) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { error } = await supabase
        .from('customer_addresses')
        .insert({ ...input, user_id: userId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['customer-addresses', userId],
      });
    },
  });

  const updateAddress = useMutation({
    mutationFn: async ({ id, ...input }: AddressInput & { id: string }) => {
      if (input.is_default && userId) {
        await supabase
          .from('customer_addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { error } = await supabase
        .from('customer_addresses')
        .update(input)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['customer-addresses', userId],
      });
    },
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['customer-addresses', userId],
      });
    },
  });

  return {
    addresses: query.data ?? [],
    isLoading: query.isLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    defaultAddress: (query.data ?? []).find(a => a.is_default) ?? null,
  };
}
