/**
 * Hook: useLinkMeAffiliates
 * Récupère les affiliés LinkMe avec leur type (enseigne ou org_independante)
 * et filtre par ceux qui ont des utilisateurs LinkMe actifs
 */

'use client';
import type { Database } from '@verone/types';

// Types Supabase (reserved for future use)
type _LinkMeAffiliateRow =
  Database['public']['Tables']['linkme_affiliates']['Row'];
type _Organisation = Database['public']['Tables']['organisations']['Row'];

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Type d'affilié LinkMe
 */
export type AffiliateType = 'enseigne' | 'org_independante';

/**
 * Interface pour un affilié LinkMe
 */
export interface LinkMeAffiliate {
  id: string;
  display_name: string;
  slug: string;
  type: AffiliateType;
  enseigne_id: string | null;
  organisation_id: string | null;
  enseigne_name: string | null;
  organisation_name: string | null;
  logo_url: string | null;
  default_margin_rate: number | null;
  linkme_commission_rate: number | null;
  selections_count: number;
  is_active: boolean;
}

/**
 * Fetch tous les affiliés LinkMe avec leur type
 * @param type - Optionnel: filtrer par type d'affilié
 */
async function fetchLinkMeAffiliates(
  type?: AffiliateType
): Promise<LinkMeAffiliate[]> {
  const supabase = createClient();

  // Récupérer les affiliés avec les enseignes et organisations jointes
  const { data: affiliates, error } = await supabase
    .from('linkme_affiliates')
    .select(
      `
      id,
      display_name,
      slug,
      logo_url,
      enseigne_id,
      organisation_id,
      default_margin_rate,
      linkme_commission_rate,
      status,
      enseigne:enseignes(id, name),
      organisation:organisations!organisation_id(id, trade_name, legal_name)
    `
    )
    .eq('status', 'active')
    .order('display_name');

  if (error) {
    console.error('Erreur fetch affiliates:', error);
    throw error;
  }

  if (!affiliates || affiliates.length === 0) {
    return [];
  }

  // Récupérer les sélections pour compter par affilié
  const affiliateIds = affiliates.map(a => a.id);
  const { data: selections } = await supabase
    .from('linkme_selections')
    .select('affiliate_id')
    .in('affiliate_id', affiliateIds)
    .is('archived_at', null);

  // Compter les sélections par affilié
  const selectionsCountMap = new Map<string, number>();
  (selections ?? []).forEach(s => {
    selectionsCountMap.set(
      s.affiliate_id,
      (selectionsCountMap.get(s.affiliate_id) ?? 0) + 1
    );
  });

  // Mapper les résultats
  const result: LinkMeAffiliate[] = affiliates
    .map(affiliate => {
      // Déterminer le type basé sur enseigne_id ou organisation_id
      const affiliateType: AffiliateType = affiliate.enseigne_id
        ? 'enseigne'
        : 'org_independante';

      // Nom de l'enseigne ou organisation
      const enseigneName = affiliate.enseigne?.name ?? null;
      const organisationName =
        affiliate.organisation?.trade_name ??
        affiliate.organisation?.legal_name ??
        null;

      return {
        id: affiliate.id,
        display_name: affiliate.display_name,
        slug: affiliate.slug,
        type: affiliateType,
        enseigne_id: affiliate.enseigne_id,
        organisation_id: affiliate.organisation_id,
        enseigne_name: enseigneName,
        organisation_name: organisationName,
        logo_url: affiliate.logo_url,
        default_margin_rate: affiliate.default_margin_rate,
        linkme_commission_rate: affiliate.linkme_commission_rate,
        selections_count: selectionsCountMap.get(affiliate.id) ?? 0,
        is_active: affiliate.status === 'active',
      };
    })
    .filter((a: LinkMeAffiliate) => {
      // Filtrer par type si spécifié
      if (type) {
        return a.type === type;
      }
      return true;
    });

  return result;
}

/**
 * Fetch un affilié par ID
 */
async function fetchLinkMeAffiliateById(
  affiliateId: string
): Promise<LinkMeAffiliate | null> {
  const supabase = createClient();

  const { data: affiliate, error } = await supabase
    .from('linkme_affiliates')
    .select(
      `
      id,
      display_name,
      slug,
      logo_url,
      enseigne_id,
      organisation_id,
      default_margin_rate,
      linkme_commission_rate,
      status,
      enseigne:enseignes(id, name),
      organisation:organisations!organisation_id(id, trade_name, legal_name)
    `
    )
    .eq('id', affiliateId)
    .single();

  if (error) {
    console.error('Erreur fetch affiliate:', error);
    throw error;
  }

  if (!affiliate) return null;

  // Compter les sélections
  const { count: selectionsCount } = await supabase
    .from('linkme_selections')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .is('archived_at', null);

  const affiliateType: AffiliateType = affiliate.enseigne_id
    ? 'enseigne'
    : 'org_independante';

  return {
    id: affiliate.id,
    display_name: affiliate.display_name,
    slug: affiliate.slug,
    type: affiliateType,
    enseigne_id: affiliate.enseigne_id,
    organisation_id: affiliate.organisation_id,
    enseigne_name: affiliate.enseigne?.name ?? null,
    organisation_name:
      affiliate.organisation?.trade_name ??
      affiliate.organisation?.legal_name ??
      null,
    logo_url: affiliate.logo_url,
    default_margin_rate: affiliate.default_margin_rate,
    linkme_commission_rate: affiliate.linkme_commission_rate,
    selections_count: selectionsCount ?? 0,
    is_active: affiliate.status === 'active',
  };
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: récupère tous les affiliés LinkMe
 * @param type - Optionnel: filtrer par 'enseigne' ou 'org_independante'
 */
export function useLinkMeAffiliates(type?: AffiliateType) {
  return useQuery({
    queryKey: ['linkme-affiliates', type],
    queryFn: () => fetchLinkMeAffiliates(type),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: récupère un affilié par ID
 */
export function useLinkMeAffiliate(affiliateId: string | null) {
  return useQuery({
    queryKey: ['linkme-affiliate', affiliateId],
    queryFn: () => fetchLinkMeAffiliateById(affiliateId!),
    enabled: !!affiliateId,
    staleTime: 30000,
  });
}

/**
 * Hook: récupère les sélections d'un affilié
 * Réutilise le hook existant mais via affiliate_id
 */
export function useLinkMeSelectionsByAffiliate(affiliateId: string | null) {
  return useQuery({
    queryKey: ['linkme-selections-by-affiliate', affiliateId],
    queryFn: async () => {
      if (!affiliateId) return [];

      const supabase = createClient();
      const { data, error } = await supabase
        .from('linkme_selections')
        .select('id, name, slug, products_count, archived_at')
        .eq('affiliate_id', affiliateId)
        .is('archived_at', null)
        .order('name');

      if (error) {
        console.error('Erreur fetch selections:', error);
        throw error;
      }

      return data ?? [];
    },
    enabled: !!affiliateId,
    staleTime: 30000,
  });
}
