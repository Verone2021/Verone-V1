/**
 * Hook: useLinkMeAffiliatesForStorage
 * Récupère les affiliés LinkMe actifs pour le formulaire de stockage
 * Supporte les deux types: enseignes ET organisations indépendantes
 *
 * @module use-linkme-affiliates-for-storage
 * @since 2025-12-21
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

export type AffiliateType = 'enseigne' | 'org_independante';

export interface AffiliateForStorage {
  id: string;
  display_name: string;
  slug: string;
  affiliate_type: AffiliateType;
  // Enseigne (si type = enseigne)
  enseigne_id: string | null;
  enseigne_name: string | null;
  // Organisation (si type = org_independante)
  organisation_id: string | null;
  organisation_name: string | null;
}

/**
 * Hook: récupère les affiliés actifs qui ont au moins 1 utilisateur LinkMe
 * IMPORTANT: Utilise la RPC get_affiliates_with_users pour filtrer
 *            les affiliés sans utilisateur (ex: organisations back-office)
 */
export function useLinkMeAffiliatesForStorage() {
  return useQuery({
    queryKey: ['linkme-affiliates-for-storage'],
    queryFn: async (): Promise<AffiliateForStorage[]> => {
      const supabase = createClient();

      // ✅ RPC qui joint user_app_roles pour ne retourner que les affiliés
      // ayant au moins 1 utilisateur LinkMe actif
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)(
        'get_affiliates_with_users'
      );

      if (error) {
        console.warn('Error fetching affiliates with users:', error.message);
        return [];
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any[]) ?? []).map((a: any) => ({
        id: a.id,
        display_name: a.display_name ?? 'Sans nom',
        slug: a.slug ?? '',
        affiliate_type: a.affiliate_type as AffiliateType,
        enseigne_id: a.enseigne_id ?? null,
        enseigne_name: a.enseigne_name ?? null,
        organisation_id: a.organisation_id ?? null,
        organisation_name: a.organisation_name ?? null,
      }));
    },
    staleTime: 60000,
  });
}

/**
 * Get display name for affiliate (enseigne or organisation name)
 */
export function getAffiliateEntityName(affiliate: AffiliateForStorage): string {
  return affiliate.enseigne_name ?? affiliate.organisation_name ?? 'Inconnu';
}
