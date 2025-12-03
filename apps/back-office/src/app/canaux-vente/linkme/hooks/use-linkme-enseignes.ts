/**
 * Hook: useLinkMeEnseignes
 * Gestion des Enseignes pour le CMS LinkMe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

/**
 * Interface Enseigne avec statistiques
 */
export interface EnseigneWithStats {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  city?: string | null;
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

/**
 * Interface pour création enseigne
 */
export interface CreateEnseigneInput {
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

/**
 * Interface pour mise à jour enseigne
 */
export interface UpdateEnseigneInput {
  name?: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

/**
 * Fetch toutes les enseignes avec statistiques
 */
async function fetchEnseignesWithStats(): Promise<EnseigneWithStats[]> {
  // Fetch enseignes
  const { data: enseignes, error } = await (supabase as any)
    .from('enseignes')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erreur fetch enseignes:', error);
    throw error;
  }

  if (!enseignes || enseignes.length === 0) {
    return [];
  }

  // Fetch stats pour chaque enseigne
  const enseigneIds = enseignes.map(e => e.id);

  // Fetch organisations count
  const { data: orgsCounts } = await (supabase as any)
    .from('organisations')
    .select('enseigne_id')
    .in('enseigne_id', enseigneIds);

  const orgsCountMap = new Map<string, number>();
  (orgsCounts || []).forEach((o: any) => {
    const current = orgsCountMap.get(o.enseigne_id) || 0;
    orgsCountMap.set(o.enseigne_id, current + 1);
  });

  // Fetch affiliates count
  const { data: affiliatesCounts } = await (supabase as any)
    .from('linkme_affiliates')
    .select('enseigne_id')
    .in('enseigne_id', enseigneIds);

  const affiliatesCountMap = new Map<string, number>();
  (affiliatesCounts || []).forEach((a: any) => {
    const current = affiliatesCountMap.get(a.enseigne_id) || 0;
    affiliatesCountMap.set(a.enseigne_id, current + 1);
  });

  // Fetch selections count via affiliates
  const { data: affiliatesForSelections } = await (supabase as any)
    .from('linkme_affiliates')
    .select('id, enseigne_id')
    .in('enseigne_id', enseigneIds);

  const affiliateIdsForSelections = (affiliatesForSelections || []).map(
    (a: any) => a.id
  );

  const { data: selectionsCounts } =
    affiliateIdsForSelections.length > 0
      ? await (supabase as any)
          .from('linkme_selections')
          .select('affiliate_id')
          .in('affiliate_id', affiliateIdsForSelections)
      : { data: [] };

  const selectionsCountMap = new Map<string, number>();
  (selectionsCounts || []).forEach((s: any) => {
    const affiliate = (affiliatesForSelections || []).find(
      (a: any) => a.id === s.affiliate_id
    );
    if (affiliate?.enseigne_id) {
      const current = selectionsCountMap.get(affiliate.enseigne_id) || 0;
      selectionsCountMap.set(affiliate.enseigne_id, current + 1);
    }
  });

  // Mapper les résultats
  return enseignes.map(enseigne => ({
    id: enseigne.id,
    name: enseigne.name,
    description: enseigne.description,
    logo_url: enseigne.logo_url,
    member_count: enseigne.member_count || 0,
    is_active: enseigne.is_active ?? true,
    created_at: enseigne.created_at,
    updated_at: enseigne.updated_at,
    created_by: enseigne.created_by,
    // Stats
    organisations_count: orgsCountMap.get(enseigne.id) || 0,
    affiliates_count: affiliatesCountMap.get(enseigne.id) || 0,
    selections_count: selectionsCountMap.get(enseigne.id) || 0,
    orders_count: 0, // TODO: Implémenter quand table orders sera liée
    total_ca_ht: 0, // TODO: Implémenter quand table orders sera liée
    total_commissions: 0, // TODO: Implémenter quand table commissions sera liée
  }));
}

/**
 * Fetch une enseigne par ID avec statistiques détaillées
 */
async function fetchEnseigneById(
  enseigneId: string
): Promise<EnseigneWithStats | null> {
  const { data: enseigne, error } = await (supabase as any)
    .from('enseignes')
    .select('*')
    .eq('id', enseigneId)
    .single();

  if (error) {
    console.error('Erreur fetch enseigne:', error);
    throw error;
  }

  if (!enseigne) return null;

  // Fetch organisations
  const { count: orgsCount } = await (supabase as any)
    .from('organisations')
    .select('id', { count: 'exact', head: true })
    .eq('enseigne_id', enseigneId);

  // Fetch affiliates
  const { count: affiliatesCount } = await (supabase as any)
    .from('linkme_affiliates')
    .select('id', { count: 'exact', head: true })
    .eq('enseigne_id', enseigneId);

  // Fetch selections count
  const { data: affiliatesData } = await (supabase as any)
    .from('linkme_affiliates')
    .select('id')
    .eq('enseigne_id', enseigneId);

  const affiliateIds = (affiliatesData || []).map((a: any) => a.id);

  const { count: selectionsCount } =
    affiliateIds.length > 0
      ? await (supabase as any)
          .from('linkme_selections')
          .select('id', { count: 'exact', head: true })
          .in('affiliate_id', affiliateIds)
      : { count: 0 };

  return {
    id: enseigne.id,
    name: enseigne.name,
    description: enseigne.description,
    logo_url: enseigne.logo_url,
    member_count: enseigne.member_count || 0,
    is_active: enseigne.is_active ?? true,
    created_at: enseigne.created_at,
    updated_at: enseigne.updated_at,
    created_by: enseigne.created_by,
    organisations_count: orgsCount || 0,
    affiliates_count: affiliatesCount || 0,
    selections_count: selectionsCount || 0,
    orders_count: 0,
    total_ca_ht: 0,
    total_commissions: 0,
  };
}

/**
 * Fetch organisations d'une enseigne
 */
export interface EnseigneOrganisation {
  id: string;
  name: string;
  is_enseigne_parent: boolean;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
}

async function fetchEnseigneOrganisations(
  enseigneId: string
): Promise<EnseigneOrganisation[]> {
  const { data, error } = await (supabase as any)
    .from('organisations')
    .select('id, name, is_enseigne_parent, is_active, logo_url, created_at')
    .eq('enseigne_id', enseigneId)
    .order('is_enseigne_parent', { ascending: false })
    .order('name');

  if (error) {
    console.error('Erreur fetch organisations enseigne:', error);
    throw error;
  }

  return (data || []).map((org: any) => ({
    id: org.id,
    name: org.name,
    is_enseigne_parent: org.is_enseigne_parent ?? false,
    is_active: org.is_active ?? true,
    logo_url: org.logo_url,
    created_at: org.created_at,
  }));
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: récupère toutes les enseignes avec stats
 */
export function useLinkMeEnseignes() {
  return useQuery({
    queryKey: ['linkme-enseignes'],
    queryFn: fetchEnseignesWithStats,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: récupère une enseigne par ID
 */
export function useLinkMeEnseigne(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-enseigne', enseigneId],
    queryFn: () => fetchEnseigneById(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 30000,
  });
}

/**
 * Hook: récupère les organisations d'une enseigne
 */
export function useLinkMeEnseigneOrganisations(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-enseigne-organisations', enseigneId],
    queryFn: () => fetchEnseigneOrganisations(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 30000,
  });
}

/**
 * Hook: créer une nouvelle enseigne
 */
export function useCreateEnseigne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEnseigneInput) => {
      const { data, error } = await (supabase as any)
        .from('enseignes')
        .insert({
          name: input.name,
          description: input.description || null,
          logo_url: input.logo_url || null,
          is_active: input.is_active ?? true,
          member_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
    },
  });
}

/**
 * Hook: mettre à jour une enseigne
 */
export function useUpdateEnseigne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enseigneId,
      input,
    }: {
      enseigneId: string;
      input: UpdateEnseigneInput;
    }) => {
      const { data, error } = await (supabase as any)
        .from('enseignes')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enseigneId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
      queryClient.invalidateQueries({
        queryKey: ['linkme-enseigne', variables.enseigneId],
      });
    },
  });
}

/**
 * Hook: supprimer une enseigne
 */
export function useDeleteEnseigne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enseigneId: string) => {
      const { error } = await (supabase as any)
        .from('enseignes')
        .delete()
        .eq('id', enseigneId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
    },
  });
}

/**
 * Hook: toggle activation enseigne
 */
export function useToggleEnseigneActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enseigneId,
      isActive,
    }: {
      enseigneId: string;
      isActive: boolean;
    }) => {
      const { error } = await (supabase as any)
        .from('enseignes')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', enseigneId);

      if (error) throw error;
    },
    onMutate: async ({ enseigneId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['linkme-enseignes'] });

      const previousData = queryClient.getQueryData<EnseigneWithStats[]>([
        'linkme-enseignes',
      ]);

      if (previousData) {
        queryClient.setQueryData<EnseigneWithStats[]>(
          ['linkme-enseignes'],
          old =>
            old?.map(enseigne =>
              enseigne.id === enseigneId
                ? { ...enseigne, is_active: isActive }
                : enseigne
            ) ?? []
        );
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['linkme-enseignes'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
    },
  });
}

/**
 * Hook: statistiques globales enseignes
 */
export function useLinkMeEnseignesStats() {
  return useQuery({
    queryKey: ['linkme-enseignes-stats'],
    queryFn: async () => {
      const enseignes = await fetchEnseignesWithStats();

      const active = enseignes.filter(e => e.is_active).length;
      const totalOrgs = enseignes.reduce(
        (sum, e) => sum + e.organisations_count,
        0
      );
      const totalAffiliates = enseignes.reduce(
        (sum, e) => sum + e.affiliates_count,
        0
      );
      const totalSelections = enseignes.reduce(
        (sum, e) => sum + e.selections_count,
        0
      );

      return {
        total: enseignes.length,
        active,
        inactive: enseignes.length - active,
        totalOrganisations: totalOrgs,
        totalAffiliates,
        totalSelections,
      };
    },
    staleTime: 60000,
  });
}
