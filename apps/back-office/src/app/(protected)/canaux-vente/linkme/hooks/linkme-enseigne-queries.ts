import { createClient } from '@verone/utils/supabase/client';
import type {
  EnseigneWithStats,
  EnseigneOrganisation,
} from './linkme-enseigne-types';

export async function fetchEnseignesWithStats(): Promise<EnseigneWithStats[]> {
  const supabase = createClient();
  const { data: enseignes, error } = await supabase
    .from('enseignes')
    .select(
      'id, name, description, logo_url, member_count, is_active, created_at, updated_at, created_by'
    )
    .order('name');
  if (error) {
    console.error('Erreur fetch enseignes:', error);
    throw error;
  }
  if (!enseignes || enseignes.length === 0) return [];

  const enseigneIds = enseignes.map(e => e.id);
  const [orgsResult, affiliatesResult, selectionsResult] = await Promise.all([
    supabase
      .from('organisations')
      .select('enseigne_id')
      .in('enseigne_id', enseigneIds),
    supabase
      .from('linkme_affiliates')
      .select('id, enseigne_id')
      .in('enseigne_id', enseigneIds),
    supabase.from('linkme_selections').select('affiliate_id'),
  ]);

  const orgsCountMap = new Map<string, number>();
  (orgsResult.data ?? []).forEach(o => {
    if (o.enseigne_id)
      orgsCountMap.set(
        o.enseigne_id,
        (orgsCountMap.get(o.enseigne_id) ?? 0) + 1
      );
  });

  const affiliatesCountMap = new Map<string, number>();
  const affiliateToEnseigneMap = new Map<string, string>();
  (affiliatesResult.data ?? []).forEach(a => {
    if (a.enseigne_id) {
      affiliatesCountMap.set(
        a.enseigne_id,
        (affiliatesCountMap.get(a.enseigne_id) ?? 0) + 1
      );
      affiliateToEnseigneMap.set(a.id, a.enseigne_id);
    }
  });

  const selectionsCountMap = new Map<string, number>();
  (selectionsResult.data ?? []).forEach(s => {
    const enseigneId = affiliateToEnseigneMap.get(s.affiliate_id);
    if (enseigneId)
      selectionsCountMap.set(
        enseigneId,
        (selectionsCountMap.get(enseigneId) ?? 0) + 1
      );
  });

  return enseignes.map(enseigne => ({
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

export async function fetchEnseigneById(
  enseigneId: string
): Promise<EnseigneWithStats | null> {
  const supabase = createClient();
  const { data: enseigne, error } = await supabase
    .from('enseignes')
    .select(
      'id, name, description, logo_url, member_count, is_active, created_at, updated_at, created_by'
    )
    .eq('id', enseigneId)
    .single();
  if (error) {
    console.error('Erreur fetch enseigne:', error);
    throw error;
  }
  if (!enseigne) return null;

  const [orgsResult, affiliatesResult] = await Promise.all([
    supabase
      .from('organisations')
      .select('id', { count: 'exact', head: true })
      .eq('enseigne_id', enseigneId),
    supabase
      .from('linkme_affiliates')
      .select('id')
      .eq('enseigne_id', enseigneId),
  ]);

  const affiliateIds = (affiliatesResult.data ?? []).map(a => a.id);
  const { count: selectionsCount } =
    affiliateIds.length > 0
      ? await supabase
          .from('linkme_selections')
          .select('id', { count: 'exact', head: true })
          .in('affiliate_id', affiliateIds)
      : { count: 0 };

  return {
    id: enseigne.id,
    name: enseigne.name,
    description: enseigne.description,
    logo_url: enseigne.logo_url,
    member_count: enseigne.member_count ?? 0,
    is_active: enseigne.is_active ?? true,
    created_at: enseigne.created_at,
    updated_at: enseigne.updated_at,
    created_by: enseigne.created_by,
    organisations_count: orgsResult.count ?? 0,
    affiliates_count: affiliatesResult.data?.length ?? 0,
    selections_count: selectionsCount ?? 0,
    orders_count: 0,
    total_ca_ht: 0,
    total_commissions: 0,
  };
}

export async function fetchEnseigneOrganisations(
  enseigneId: string
): Promise<EnseigneOrganisation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('organisations')
    .select('id, legal_name, trade_name')
    .eq('enseigne_id', enseigneId)
    .order('legal_name');
  if (error) {
    console.error('Erreur fetch organisations enseigne:', error);
    throw error;
  }
  return (data ?? []).map(org => ({
    id: org.id,
    name: org.trade_name ?? org.legal_name,
    is_enseigne_parent: false,
    is_active: true,
    logo_url: null,
    created_at: null,
  }));
}
