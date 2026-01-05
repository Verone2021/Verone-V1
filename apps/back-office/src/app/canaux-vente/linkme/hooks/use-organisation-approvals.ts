/**
 * Hook: useOrganisationApprovals
 * Gestion de la queue d'approbation des organisations LinkMe
 *
 * Les organisations sont creees via le stepper enseigne sur LinkMe
 * et doivent etre validees avant d'etre utilisables.
 *
 * @module use-organisation-approvals
 * @since 2026-01-05
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
 * Hook: compte le nombre d'organisations en attente de validation
 */
export function usePendingOrganisationsCount() {
  return useQuery({
    queryKey: ['pending-organisations-count'],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();

      const { count, error } = await supabase
        .from('organisations')
        .select('*', { count: 'exact', head: true })
        .eq('approval_status', 'pending_validation');

      if (error) {
        console.error('Error fetching pending organisations count:', error);
        throw error;
      }

      return count || 0;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

/**
 * Hook: recupere la liste des organisations en attente de validation
 */
export function usePendingOrganisations() {
  return useQuery({
    queryKey: ['pending-organisations'],
    queryFn: async (): Promise<PendingOrganisation[]> => {
      const supabase = createClient();

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
        .eq('approval_status', 'pending_validation')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending organisations:', error);
        throw error;
      }

      return (data || []).map((org: Record<string, unknown>) => ({
        ...org,
        enseigne_name: (org.enseigne as { name?: string })?.name || null,
      })) as PendingOrganisation[];
    },
    staleTime: 30000,
  });
}

/**
 * Hook: recupere toutes les organisations (tous statuts)
 */
export function useAllOrganisationsWithApproval(
  status?: OrganisationApprovalStatus
) {
  return useQuery({
    queryKey: ['all-organisations-approval', status],
    queryFn: async (): Promise<PendingOrganisation[]> => {
      const supabase = createClient();

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
        // Only show orgs that have an approval_status (i.e., created via LinkMe)
        .not('approval_status', 'is', null)
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
        enseigne_name: (org.enseigne as { name?: string })?.name || null,
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
          approved_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organisationId);

      if (error) {
        console.error('Error approving organisation:', error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-organisations'] });
      queryClient.invalidateQueries({
        queryKey: ['pending-organisations-count'],
      });
      queryClient.invalidateQueries({
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
      reason,
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
          approved_by: user?.id || null,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-organisations'] });
      queryClient.invalidateQueries({
        queryKey: ['pending-organisations-count'],
      });
      queryClient.invalidateQueries({
        queryKey: ['all-organisations-approval'],
      });
    },
  });
}
