/**
 * Hook: useUserAffiliate
 * Récupère l'affilié de l'utilisateur connecté
 *
 * @module use-user-affiliate
 * @since 2026-04-14 (extrait de use-user-selection.ts)
 */

import { useQuery } from '@tanstack/react-query';
import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_SELECTION_ITEM_MARGIN,
  PLATFORM_COMMISSION_RATE,
} from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '../../contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

export interface UserAffiliate {
  id: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  display_name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  bio: string | null;
  status: string;
  default_margin_rate: number;
  linkme_commission_rate: number;
}

interface LinkMeAffiliateRow {
  id: string;
  enseigne_id: string | null;
  organisation_id: string | null;
  display_name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  bio: string | null;
  status: string | null;
  default_margin_rate: number | null;
  linkme_commission_rate: number | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useUserAffiliate() {
  const { user, linkMeRole } = useAuth();

  return useQuery({
    queryKey: [
      'user-affiliate',
      user?.id,
      linkMeRole?.enseigne_id,
      linkMeRole?.organisation_id,
    ],
    queryFn: async (): Promise<UserAffiliate | null> => {
      if (!user || !linkMeRole) {
        console.error('❌ useUserAffiliate: user ou linkMeRole manquant');
        console.error('   user:', user?.id, user?.email);
        console.error('   linkMeRole:', linkMeRole);
        return null;
      }

      const supabase: SupabaseClient<Database> = createClient();
      let query = supabase
        .from('linkme_affiliates')
        .select(
          'id, enseigne_id, organisation_id, display_name, slug, email, phone, logo_url, bio, status, default_margin_rate, linkme_commission_rate'
        );
      let queryDescription = '';

      if (
        (linkMeRole.role === 'enseigne_admin' ||
          linkMeRole.role === 'enseigne_collaborateur') &&
        linkMeRole.enseigne_id
      ) {
        query = query.eq('enseigne_id', linkMeRole.enseigne_id);
        queryDescription = `enseigne_id = ${linkMeRole.enseigne_id}`;
      } else if (
        linkMeRole.role === 'organisation_admin' &&
        linkMeRole.organisation_id
      ) {
        query = query.eq('organisation_id', linkMeRole.organisation_id);
        queryDescription = `organisation_id = ${linkMeRole.organisation_id}`;
      } else {
        console.error(
          '❌ useUserAffiliate: rôle non supporté ou données manquantes',
          {
            role: linkMeRole.role,
            enseigne_id: linkMeRole.enseigne_id,
            organisation_id: linkMeRole.organisation_id,
          }
        );
        return null;
      }

      const { data, error } = await query.maybeSingle<LinkMeAffiliateRow>();

      if (error) {
        console.error('❌ Erreur fetch affiliate:', error);
        return null;
      }

      if (!data) {
        console.error(
          `❌ Aucun affiliate trouvé dans linkme_affiliates pour ${queryDescription}`
        );
        console.error(
          '   → Vérifier que la table linkme_affiliates a une entrée correspondante'
        );
        return null;
      }

      return {
        id: data.id,
        enseigne_id: data.enseigne_id,
        organisation_id: data.organisation_id,
        display_name: data.display_name ?? '',
        slug: data.slug ?? '',
        email: data.email,
        phone: data.phone,
        logo_url: data.logo_url,
        bio: data.bio,
        status: data.status ?? 'active',
        default_margin_rate:
          data.default_margin_rate ?? DEFAULT_SELECTION_ITEM_MARGIN,
        linkme_commission_rate:
          data.linkme_commission_rate ?? PLATFORM_COMMISSION_RATE,
      };
    },
    enabled: !!user && !!linkMeRole,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
