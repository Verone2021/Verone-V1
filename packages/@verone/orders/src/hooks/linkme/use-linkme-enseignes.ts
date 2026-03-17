/**
 * Hook: useLinkMeEnseignes
 * Gestion des Enseignes pour les commandes LinkMe
 * Copie simplifiée pour le package @verone/orders
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

/**
 * Interface Enseigne avec statistiques
 */
export interface EnseigneWithStats {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Stats calculées
  organisations_count: number;
  affiliates_count: number;
  selections_count: number;
  orders_count: number;
  total_ca_ht: number;
  total_commissions: number;
}

// Internal row shapes for Supabase untyped queries
interface EnseigneRow {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  member_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface OrgRow {
  enseigne_id: string;
}

interface AffiliateRow {
  id: string;
  enseigne_id: string;
}

interface SelectionRow {
  affiliate_id: string;
}

/**
 * Fetch toutes les enseignes avec statistiques
 */
async function fetchEnseignesWithStats(): Promise<EnseigneWithStats[]> {
  const supabase = createClient();

  // Fetch enseignes
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  const { data: enseignes, error } = await (supabase as any)
    .from('enseignes')
    .select('*')
    .order('name');
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

  if (error) {
    console.error('Erreur fetch enseignes:', error);
    throw error;
  }

  const typedEnseignes = enseignes as EnseigneRow[] | null;

  if (!typedEnseignes || typedEnseignes.length === 0) {
    return [];
  }

  const enseigneIds = typedEnseignes.map(e => e.id);

  // Requêtes parallèles pour les stats
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
  const [orgsResult, affiliatesResult, selectionsResult] = await Promise.all([
    (supabase as any)
      .from('organisations')
      .select('enseigne_id')
      .in('enseigne_id', enseigneIds),
    (supabase as any)
      .from('linkme_affiliates')
      .select('id, enseigne_id')
      .in('enseigne_id', enseigneIds),
    (supabase as any).from('linkme_selections').select('affiliate_id'),
  ]);
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

  // Compter organisations par enseigne
  const orgsCountMap = new Map<string, number>();
  const typedOrgs = (orgsResult as { data: OrgRow[] | null }).data ?? [];
  typedOrgs.forEach(o => {
    orgsCountMap.set(o.enseigne_id, (orgsCountMap.get(o.enseigne_id) ?? 0) + 1);
  });

  // Compter affiliates par enseigne + créer map affiliate->enseigne
  const affiliatesCountMap = new Map<string, number>();
  const affiliateToEnseigneMap = new Map<string, string>();
  const typedAffiliates =
    (affiliatesResult as { data: AffiliateRow[] | null }).data ?? [];
  typedAffiliates.forEach(a => {
    affiliatesCountMap.set(
      a.enseigne_id,
      (affiliatesCountMap.get(a.enseigne_id) ?? 0) + 1
    );
    affiliateToEnseigneMap.set(a.id, a.enseigne_id);
  });

  // Compter sélections par enseigne
  const selectionsCountMap = new Map<string, number>();
  const typedSelections =
    (selectionsResult as { data: SelectionRow[] | null }).data ?? [];
  typedSelections.forEach(s => {
    const enseigneId = affiliateToEnseigneMap.get(s.affiliate_id);
    if (enseigneId) {
      selectionsCountMap.set(
        enseigneId,
        (selectionsCountMap.get(enseigneId) ?? 0) + 1
      );
    }
  });

  // Mapper les résultats
  return typedEnseignes.map(enseigne => ({
    id: enseigne.id,
    name: enseigne.name,
    description: enseigne.description,
    logo_url: enseigne.logo_url,
    member_count: enseigne.member_count ?? 0,
    is_active: enseigne.is_active ?? true,
    created_at: enseigne.created_at,
    updated_at: enseigne.updated_at,
    created_by: enseigne.created_by,
    organisations_count: orgsCountMap.get(enseigne.id) ?? 0,
    affiliates_count: affiliatesCountMap.get(enseigne.id) ?? 0,
    selections_count: selectionsCountMap.get(enseigne.id) ?? 0,
    orders_count: 0,
    total_ca_ht: 0,
    total_commissions: 0,
  }));
}

/**
 * Hook: récupère toutes les enseignes avec stats
 */
export function useLinkMeEnseignes() {
  return useQuery({
    queryKey: ['linkme-enseignes'],
    queryFn: fetchEnseignesWithStats,
    staleTime: 300_000, // 5 minutes (was 30s - trop agressif)
    refetchOnWindowFocus: false,
  });
}
