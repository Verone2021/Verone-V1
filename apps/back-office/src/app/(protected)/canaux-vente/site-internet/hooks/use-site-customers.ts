'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

export interface SiteCustomer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  is_active: boolean | null;
  created_at: string | null;
  auth_user_id: string | null;
  accepts_marketing: boolean | null;
  notes: string | null;
}

export function useSiteCustomers() {
  return useQuery({
    queryKey: ['site-internet-customers'],
    queryFn: async (): Promise<SiteCustomer[]> => {
      const { data, error } = await supabase
        .from('individual_customers')
        .select(
          'id, first_name, last_name, email, phone, city, postal_code, country, is_active, created_at, auth_user_id, accepts_marketing, notes'
        )
        .eq('is_active', true)
        .eq('source_type', 'site-internet')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[useSiteCustomers] Fetch error:', error);
        throw error;
      }

      return data ?? [];
    },
    staleTime: 300_000,
  });
}
