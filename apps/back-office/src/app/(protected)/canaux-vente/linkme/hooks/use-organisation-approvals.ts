/**
 * Hook: useOrganisationApprovals
 * Gestion de la queue d'approbation des organisations LinkMe
 *
 * IMPORTANT: Seules les organisations LIEES A LINKME doivent s'afficher
 * C'est-a-dire celles qui ont un enregistrement dans linkme_affiliates
 * avec organisation_id correspondant.
 *
 * Les organisations sont creees via le stepper enseigne sur LinkMe
 * et doivent etre validees avant d'etre utilisables.
 *
 * @module use-organisation-approvals
 * @since 2026-01-05
 * @updated 2026-01-09 - Fix: filtrer uniquement les orgs LinkMe via linkme_affiliates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Types
export type OrganisationApprovalStatus =
  | 'pending_validation'
  | 'approved'
  | 'rejected';

export interface PendingOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  siret: string | null;
  approval_status: OrganisationApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  enseigne_name?: string | null;
  affiliate_display_name?: string | null;
}

/**
 * Hook: compte le nombre d'organisations LinkMe en attente de validation
 * IMPORTANT: Ne compte que les organisations ayant un profil linkme_affiliates
 */
export function usePendingOrganisationsCount() {
  return useQuery({
    queryKey: ['pending-organisations-count'],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();

      // D'abord récupérer les organisation_id depuis linkme_affiliates
      const { data: affiliates, error: affError } = await supabase
        .from('linkme_affiliates')
        .select('organisation_id')
        .not('organisation_id', 'is', null);

      if (affError) {
        console.error('Error fetching affiliate org ids:', affError);
        throw affError;
      }

      const orgIds = (affiliates || [])
        .map(a => a.organisation_id)
        .filter(Boolean) as string[];

      if (orgIds.length === 0) {
        return 0;
      }

      // Compter seulement les organisations LinkMe en attente
      const { count, error } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .in('id', orgIds)
        .eq('approval_status', 'pending_validation');

      if (error) {
        console.error('Error fetching pending organisations count:', error);
        throw error;
      }

      return count ?? 0;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook: recupere la liste des organisations LinkMe en attente de validation
 * IMPORTANT: Ne retourne que les organisations ayant un profil linkme_affiliates
 */
export function usePendingOrganisations() {
  return useQuery({
    queryKey: ['pending-organisations'],
    queryFn: async (): Promise<PendingOrganisation[]> => {
      const supabase = createClient();

      // D'abord récupérer les organisation_id et display_name depuis linkme_affiliates
      const { data: affiliates, error: affError } = await supabase
        .from('linkme_affiliates')
        .select('organisation_id, display_name')
        .not('organisation_id', 'is', null);

      if (affError) {
        console.error('Error fetching affiliate org ids:', affError);
        throw affError;
      }

      const orgIds = (affiliates || [])
        .map(a => a.organisation_id)
        .filter(Boolean) as string[];

      if (orgIds.length === 0) {
        return [];
      }

      // Créer un map pour les display_name
      const displayNameMap = new Map(
        (affiliates || []).map(a => [a.organisation_id, a.display_name])
      );

      const { data, error } = await supabase
        .from('organisations')
        .select(
          `
          id,
          legal_name,
          trade_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          postal_code,
          siret,
          approval_status,
          approved_at,
          approved_by,
          created_at,
          updated_at,
          enseigne:enseigne_id (
            name
          )
        `
        )
        .in('id', orgIds)
        .eq('approval_status', 'pending_validation')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending organisations:', error);
        throw error;
      }

      return (data || []).map((org: Record<string, unknown>) => ({
        ...org,
        enseigne_name: (org.enseigne as { name?: string })?.name ?? null,
        affiliate_display_name: displayNameMap.get(org.id as string) ?? null,
      })) as PendingOrganisation[];
    },
    staleTime: 30000,
  });
}

/**
 * Hook: recupere toutes les organisations LinkMe (tous statuts)
 * IMPORTANT: Ne retourne que les organisations ayant un profil linkme_affiliates
 */
export function useAllOrganisationsWithApproval(
  status?: OrganisationApprovalStatus
) {
  return useQuery({
    queryKey: ['all-organisations-approval', status],
    queryFn: async (): Promise<PendingOrganisation[]> => {
      const supabase = createClient();

      // D'abord récupérer les organisation_id et display_name depuis linkme_affiliates
      const { data: affiliates, error: affError } = await supabase
        .from('linkme_affiliates')
        .select('organisation_id, display_name')
        .not('organisation_id', 'is', null);

      if (affError) {
        console.error('Error fetching affiliate org ids:', affError);
        throw affError;
      }

      const orgIds = (affiliates || [])
        .map(a => a.organisation_id)
        .filter(Boolean) as string[];

      if (orgIds.length === 0) {
        return [];
      }

      // Créer un map pour les display_name
      const displayNameMap = new Map(
        (affiliates || []).map(a => [a.organisation_id, a.display_name])
      );

      let query = supabase
        .from('organisations')
        .select(
          `
          id,
          legal_name,
          trade_name,
          email,
          phone,
          address_line1,
          address_line2,
          city,
          postal_code,
          siret,
          approval_status,
          approved_at,
          approved_by,
          created_at,
          updated_at,
          enseigne:enseigne_id (
            name
          )
        `
        )
        // Filtrer UNIQUEMENT les organisations liees a LinkMe
        .in('id', orgIds)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('approval_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching organisations:', error);
        throw error;
      }

      return (data || []).map((org: Record<string, unknown>) => ({
        ...org,
        enseigne_name: (org.enseigne as { name?: string })?.name ?? null,
        affiliate_display_name: displayNameMap.get(org.id as string) ?? null,
      })) as PendingOrganisation[];
    },
    staleTime: 30000,
  });
}

/**
 * Hook: approuver une organisation
 */
export function useApproveOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organisationId }: { organisationId: string }) => {
      const supabase = createClient();

      // Get current user for audit
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('organisations')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organisationId);

      if (error) {
        console.error('Error approving organisation:', error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pending-organisations'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['pending-organisations-count'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['all-organisations-approval'],
      });
    },
  });
}

/**
 * Hook: rejeter une organisation
 */
export function useRejectOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationId,
      reason: _reason,
    }: {
      organisationId: string;
      reason: string;
    }) => {
      const supabase = createClient();

      // Get current user for audit
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('organisations')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user?.id ?? null,
          // Store rejection reason in notes or a dedicated field if exists
          updated_at: new Date().toISOString(),
        })
        .eq('id', organisationId);

      if (error) {
        console.error('Error rejecting organisation:', error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['pending-organisations'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['pending-organisations-count'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['all-organisations-approval'],
      });
    },
  });
}
