/**
 * Hook: useLinkMeEnseignes
 * Gestion des Enseignes pour le CMS LinkMe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

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
 * OPTIMISÉ: Utilise Promise.all pour requêtes parallèles (4 au lieu de 5 séquentielles)
 */
async function fetchEnseignesWithStats(): Promise<EnseigneWithStats[]> {
  const supabase = createClient();

  // Fetch enseignes d'abord (nécessaire pour avoir les IDs)
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

  const enseigneIds = enseignes.map((e: any) => e.id);

  // OPTIMISATION: Exécuter les 3 requêtes de stats EN PARALLÈLE
  const [orgsResult, affiliatesResult, selectionsResult] = await Promise.all([
    // 1. Organisations par enseigne
    (supabase as any)
      .from('organisations')
      .select('enseigne_id')
      .in('enseigne_id', enseigneIds),
    // 2. Affiliates par enseigne (avec ID pour les sélections)
    (supabase as any)
      .from('linkme_affiliates')
      .select('id, enseigne_id')
      .in('enseigne_id', enseigneIds),
    // 3. Toutes les sélections (on filtrera côté client)
    (supabase as any).from('linkme_selections').select('affiliate_id'),
  ]);

  // Compter organisations par enseigne
  const orgsCountMap = new Map<string, number>();
  (orgsResult.data || []).forEach((o: any) => {
    orgsCountMap.set(o.enseigne_id, (orgsCountMap.get(o.enseigne_id) || 0) + 1);
  });

  // Compter affiliates par enseigne + créer map affiliate->enseigne
  const affiliatesCountMap = new Map<string, number>();
  const affiliateToEnseigneMap = new Map<string, string>();
  (affiliatesResult.data || []).forEach((a: any) => {
    affiliatesCountMap.set(
      a.enseigne_id,
      (affiliatesCountMap.get(a.enseigne_id) || 0) + 1
    );
    affiliateToEnseigneMap.set(a.id, a.enseigne_id);
  });

  // Compter sélections par enseigne (via affiliate->enseigne mapping)
  const selectionsCountMap = new Map<string, number>();
  (selectionsResult.data || []).forEach((s: any) => {
    const enseigneId = affiliateToEnseigneMap.get(s.affiliate_id);
    if (enseigneId) {
      selectionsCountMap.set(
        enseigneId,
        (selectionsCountMap.get(enseigneId) || 0) + 1
      );
    }
  });

  // Mapper les résultats
  return enseignes.map((enseigne: any) => ({
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
    orders_count: 0,
    total_ca_ht: 0,
    total_commissions: 0,
  }));
}

/**
 * Fetch une enseigne par ID avec statistiques détaillées
 * OPTIMISÉ: Requêtes parallèles avec Promise.all
 */
async function fetchEnseigneById(
  enseigneId: string
): Promise<EnseigneWithStats | null> {
  const supabase = createClient();

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

  // OPTIMISATION: Requêtes parallèles pour les counts
  const [orgsResult, affiliatesResult] = await Promise.all([
    (supabase as any)
      .from('organisations')
      .select('id', { count: 'exact', head: true })
      .eq('enseigne_id', enseigneId),
    (supabase as any)
      .from('linkme_affiliates')
      .select('id')
      .eq('enseigne_id', enseigneId),
  ]);

  const affiliateIds = (affiliatesResult.data || []).map((a: any) => a.id);

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
    organisations_count: orgsResult.count || 0,
    affiliates_count: affiliatesResult.data?.length || 0,
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
  const supabase = createClient();

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
      const supabase = createClient();
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
      const supabase = createClient();
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
 * PROTECTION: Verifie d'abord si des utilisateurs sont lies via user_app_roles
 */
export function useDeleteEnseigne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enseigneId: string) => {
      const supabase = createClient();

      // PROTECTION: Verifier si des utilisateurs sont lies a cette enseigne
      const { count: linkedUsersCount, error: checkError } = await supabase
        .from('user_app_roles')
        .select('*', { count: 'exact', head: true })
        .eq('enseigne_id', enseigneId)
        .eq('is_active', true);

      if (checkError) {
        console.warn('Erreur verification users lies:', checkError);
        // Continue si erreur de verification (graceful)
      } else if (linkedUsersCount && linkedUsersCount > 0) {
        throw new Error(
          `Impossible de supprimer cette enseigne : ${linkedUsersCount} utilisateur(s) y sont rattaches. ` +
            `Veuillez d'abord archiver l'enseigne (is_active = false) ou retirer les utilisateurs.`
        );
      }

      // Pas d'utilisateurs lies, on peut supprimer
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
      const supabase = createClient();
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
