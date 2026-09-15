'use client';

/**
 * useAffiliatesList / useAffiliateSelections — hooks de navigation
 * pour les filtres des analytics LinkMe.
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

export function useAffiliatesList() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'affiliates-list'],
    queryFn: async (): Promise<
      { id: string; displayName: string; slug: string }[]
    > => {
      const { data, error } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, slug')
        .eq('status', 'active')
        .order('display_name');

      if (error) throw error;

      return (data ?? []).map(a => ({
        id: a.id,
        displayName: a.display_name,
        slug: a.slug ?? '',
      }));
    },
    staleTime: 60000, // 1 minute cache
  });
}

export function useAffiliateSelections(affiliateId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme', 'affiliate-selections', affiliateId],
    queryFn: async (): Promise<
      { id: string; name: string; slug: string; productsCount: number }[]
    > => {
      if (!affiliateId) return [];

      const { data, error } = await supabase
        .from('linkme_selections')
        .select('id, name, slug, products_count')
        .eq('affiliate_id', affiliateId)
        .is('archived_at', null)
        .order('name');

      if (error) throw error;

      return (data ?? []).map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug ?? '',
        productsCount: s.products_count ?? 0,
      }));
    },
    enabled: !!affiliateId,
    staleTime: 60000,
  });
}
