/**
 * Hook: useLinkMeEnseignes
 * Gestion des Enseignes pour le CMS LinkMe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type {
  EnseigneWithStats,
  CreateEnseigneInput,
  UpdateEnseigneInput,
  EnseigneOrganisation,
} from './linkme-enseigne-types';

export type {
  EnseigneWithStats,
  CreateEnseigneInput,
  UpdateEnseigneInput,
  EnseigneOrganisation,
};

import {
  fetchEnseignesWithStats,
  fetchEnseigneById,
  fetchEnseigneOrganisations,
} from './linkme-enseigne-queries';

export function useLinkMeEnseignes() {
  return useQuery({
    queryKey: ['linkme-enseignes'],
    queryFn: fetchEnseignesWithStats,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });
}

export function useLinkMeEnseigne(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-enseigne', enseigneId],
    queryFn: () => fetchEnseigneById(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 300_000,
  });
}

export function useLinkMeEnseigneOrganisations(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-enseigne-organisations', enseigneId],
    queryFn: () => fetchEnseigneOrganisations(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 300_000,
  });
}

export function useCreateEnseigne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateEnseigneInput) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('enseignes')
        .insert({
          name: input.name,
          description: input.description ?? null,
          logo_url: input.logo_url ?? null,
          is_active: input.is_active ?? true,
          member_count: 0,
        })
        .select(
          'id, name, description, logo_url, member_count, is_active, created_at, updated_at, created_by'
        )
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
    },
  });
}

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
      const { data, error } = await supabase
        .from('enseignes')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', enseigneId)
        .select(
          'id, name, description, logo_url, member_count, is_active, created_at, updated_at, created_by'
        )
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
      await queryClient.invalidateQueries({
        queryKey: ['linkme-enseigne', variables.enseigneId],
      });
    },
  });
}

export function useDeleteEnseigne() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enseigneId: string) => {
      const supabase = createClient();
      const { count: linkedUsersCount, error: checkError } = await supabase
        .from('user_app_roles')
        .select('*', { count: 'exact', head: true })
        .eq('enseigne_id', enseigneId)
        .eq('is_active', true);
      if (!checkError && linkedUsersCount && linkedUsersCount > 0) {
        throw new Error(
          `Impossible de supprimer cette enseigne : ${linkedUsersCount} utilisateur(s) y sont rattaches.`
        );
      }
      const { error } = await supabase
        .from('enseignes')
        .delete()
        .eq('id', enseigneId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
    },
  });
}

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
      const { error } = await supabase
        .from('enseignes')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
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
            old?.map(e =>
              e.id === enseigneId ? { ...e, is_active: isActive } : e
            ) ?? []
        );
      }
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData)
        queryClient.setQueryData(['linkme-enseignes'], context.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-enseignes'] });
    },
  });
}

export function useLinkMeEnseignesStats() {
  return useQuery({
    queryKey: ['linkme-enseignes-stats'],
    queryFn: async () => {
      const enseignes = await fetchEnseignesWithStats();
      const active = enseignes.filter(e => e.is_active).length;
      return {
        total: enseignes.length,
        active,
        inactive: enseignes.length - active,
        totalOrganisations: enseignes.reduce(
          (sum, e) => sum + e.organisations_count,
          0
        ),
        totalAffiliates: enseignes.reduce(
          (sum, e) => sum + e.affiliates_count,
          0
        ),
        totalSelections: enseignes.reduce(
          (sum, e) => sum + e.selections_count,
          0
        ),
      };
    },
    staleTime: 60000,
  });
}
