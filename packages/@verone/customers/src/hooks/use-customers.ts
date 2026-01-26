'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';

export type CustomerType = 'professional' | 'individual';

export interface UnifiedCustomer {
  id: string;
  type: CustomerType;
  displayName: string;
  email: string | null;

  // Données spécifiques selon le type
  // Pour professional (organisations)
  name?: string;
  siret?: string | null;
  vat_number?: string | null;
  billing_address_line1?: string | null;
  billing_city?: string | null;
  billing_postal_code?: string | null;
  billing_country?: string | null;
  shipping_address_line1?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  shipping_country?: string | null;
  has_different_shipping_address?: boolean | null;

  // Pour individual
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  region?: string | null;
  country?: string | null;
  billing_address_line1_individual?: string | null;
  billing_city_individual?: string | null;
  billing_postal_code_individual?: string | null;
  billing_country_individual?: string | null;
  has_different_billing_address?: boolean | null;
}

export interface CustomerFilters {
  customerType?: CustomerType | 'all';
  search?: string;
  is_active?: boolean;
}

// Query keys factory for cache management
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: CustomerFilters) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string, type: CustomerType) =>
    [...customerKeys.details(), id, type] as const,
};

/**
 * Fetch customers from Supabase
 * Combines organisations (professional) and individual_customers
 */
async function fetchCustomers(
  filters?: CustomerFilters
): Promise<UnifiedCustomer[]> {
  const supabase = createClient();
  let allCustomers: UnifiedCustomer[] = [];

  const customerType = filters?.customerType;

  // Fetch professional customers (organisations)
  if (
    !customerType ||
    customerType === 'all' ||
    customerType === 'professional'
  ) {
    let orgQuery = supabase
      .from('organisations')
      .select('*')
      .eq('type', 'customer')
      .eq('is_active', filters?.is_active ?? true)
      .is('archived_at', null)
      .order('legal_name', { ascending: true });

    if (filters?.search) {
      orgQuery = orgQuery.or(
        `legal_name.ilike.%${filters.search}%,trade_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data: orgData, error: orgError } = await orgQuery;

    if (orgError) {
      console.error('Error fetching organisations:', orgError);
      throw orgError;
    }

    const professionalCustomers: UnifiedCustomer[] = (orgData || []).map(
      org => ({
        id: org.id,
        type: 'professional' as CustomerType,
        displayName: getOrganisationDisplayName(org),
        email: org.email,
        name: getOrganisationDisplayName(org),
        siret: org.siret,
        vat_number: org.vat_number,
        billing_address_line1: org.billing_address_line1,
        billing_city: org.billing_city,
        billing_postal_code: org.billing_postal_code,
        billing_country: org.billing_country,
        shipping_address_line1: org.shipping_address_line1,
        shipping_city: org.shipping_city,
        shipping_postal_code: org.shipping_postal_code,
        shipping_country: org.shipping_country,
        has_different_shipping_address: org.has_different_shipping_address,
      })
    );

    allCustomers = [...allCustomers, ...professionalCustomers];
  }

  // Fetch individual customers
  if (
    !customerType ||
    customerType === 'all' ||
    customerType === 'individual'
  ) {
    let individualQuery = supabase
      .from('individual_customers')
      .select('*')
      .eq('is_active', filters?.is_active ?? true)
      .order('last_name', { ascending: true });

    if (filters?.search) {
      individualQuery = individualQuery.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    const { data: individualData, error: individualError } =
      await individualQuery;

    if (individualError) {
      console.error('Error fetching individual_customers:', individualError);
      throw individualError;
    }

    const individualCustomers: UnifiedCustomer[] = (individualData || []).map(
      individual => ({
        id: individual.id,
        type: 'individual' as CustomerType,
        displayName:
          `${individual.first_name || ''} ${individual.last_name || ''}`.trim() ||
          'Client particulier',
        email: individual.email,
        first_name: individual.first_name,
        last_name: individual.last_name,
        phone: individual.phone,
        address_line1: individual.address_line1,
        address_line2: individual.address_line2,
        city: individual.city,
        postal_code: individual.postal_code,
        region: individual.region,
        country: individual.country,
        billing_address_line1_individual: individual.billing_address_line1,
        billing_city_individual: individual.billing_city,
        billing_postal_code_individual: individual.billing_postal_code,
        billing_country_individual: individual.billing_country,
        has_different_billing_address: individual.has_different_billing_address,
      })
    );

    allCustomers = [...allCustomers, ...individualCustomers];
  }

  // Sort by display name
  allCustomers.sort((a, b) => a.displayName.localeCompare(b.displayName));

  return allCustomers;
}

/**
 * Fetch a single customer by ID and type
 */
async function fetchCustomerById(
  id: string,
  type: CustomerType
): Promise<UnifiedCustomer | null> {
  const supabase = createClient();

  if (type === 'professional') {
    const { data, error } = await supabase
      .from('organisations')
      .select('*')
      .eq('id', id)
      .eq('type', 'customer')
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: 'professional',
      displayName: getOrganisationDisplayName(data),
      email: data.email,
      name: getOrganisationDisplayName(data),
      siret: data.siret,
      vat_number: data.vat_number,
      billing_address_line1: data.billing_address_line1,
      billing_city: data.billing_city,
      billing_postal_code: data.billing_postal_code,
      billing_country: data.billing_country,
      shipping_address_line1: data.shipping_address_line1,
      shipping_city: data.shipping_city,
      shipping_postal_code: data.shipping_postal_code,
      shipping_country: data.shipping_country,
      has_different_shipping_address: data.has_different_shipping_address,
    };
  } else {
    const { data, error } = await supabase
      .from('individual_customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      type: 'individual',
      displayName: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      address_line1: data.address_line1,
      address_line2: data.address_line2,
      city: data.city,
      postal_code: data.postal_code,
      region: data.region,
      country: data.country,
      billing_address_line1_individual: data.billing_address_line1,
      billing_city_individual: data.billing_city,
      billing_postal_code_individual: data.billing_postal_code,
      billing_country_individual: data.billing_country,
      has_different_billing_address: data.has_different_billing_address,
    };
  }
}

/**
 * Hook to fetch and cache customers list
 *
 * Features:
 * - Automatic caching (5 min stale, 30 min gc)
 * - Deduplication of concurrent requests
 * - Background refetch on window focus (disabled)
 * - Automatic retry on failure
 */
export function useCustomers(filters?: CustomerFilters) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => fetchCustomers(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Wrapper for getCustomerById that uses the cache
  const getCustomerById = async (
    id: string,
    type: CustomerType
  ): Promise<UnifiedCustomer | null> => {
    try {
      // First check if we have it in the current list
      const cachedList = queryClient.getQueryData<UnifiedCustomer[]>(
        customerKeys.list(filters)
      );
      const cachedCustomer = cachedList?.find(
        c => c.id === id && c.type === type
      );
      if (cachedCustomer) {
        return cachedCustomer;
      }

      // Otherwise fetch it directly (and cache it)
      return await queryClient.fetchQuery({
        queryKey: customerKeys.detail(id, type),
        queryFn: () => fetchCustomerById(id, type),
        staleTime: 5 * 60 * 1000,
      });
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      return null;
    }
  };

  return {
    customers: query.data ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    getCustomerById,
    // Additional React Query states for advanced usage
    isRefetching: query.isRefetching,
    isFetching: query.isFetching,
    isStale: query.isStale,
  };
}

/**
 * Hook to fetch a single customer by ID
 * Uses React Query for caching
 */
export function useCustomer(id: string | null, type: CustomerType | null) {
  return useQuery({
    queryKey: customerKeys.detail(id!, type!),
    queryFn: () => fetchCustomerById(id!, type!),
    enabled: !!id && !!type,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Hook to invalidate customer cache
 * Useful after mutations (create, update, delete)
 */
export function useInvalidateCustomers() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: customerKeys.all }),
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() }),
    invalidateCustomer: (id: string, type: CustomerType) =>
      queryClient.invalidateQueries({
        queryKey: customerKeys.detail(id, type),
      }),
  };
}
