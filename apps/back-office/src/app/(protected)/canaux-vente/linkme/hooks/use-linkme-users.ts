/**
 * Hook: useLinkMeUsers
 * Gestion des Utilisateurs pour le CMS LinkMe
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import type {
  LinkMeUser,
  LinkMeRole,
  CreateLinkMeUserInput,
  UpdateLinkMeUserInput,
  UserProfileUpdate,
  UserAppRoleUpdate,
} from './linkme-user-types';

export type {
  LinkMeUser,
  LinkMeRole,
  CreateLinkMeUserInput,
  UpdateLinkMeUserInput,
};
export {
  LINKME_ROLE_LABELS,
  LINKME_ROLE_COLORS,
  LINKME_ROLE_PERMISSIONS,
} from './linkme-user-types';
export type {
  EnseigneSelectOption,
  OrganisationSelectOption,
} from './linkme-user-types';

import {
  fetchLinkMeUsers,
  fetchLinkMeUserById,
  fetchLinkMeUsersByEnseigne,
  fetchEnseignesForSelect,
  fetchOrganisationsForSelect,
} from './linkme-user-queries';

const supabase = createClient();

export function useLinkMeUsers() {
  return useQuery({
    queryKey: ['linkme-users'],
    queryFn: fetchLinkMeUsers,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });
}

export function useLinkMeUser(userId: string | null) {
  return useQuery({
    queryKey: ['linkme-user', userId],
    queryFn: () => fetchLinkMeUserById(userId!),
    enabled: !!userId,
    staleTime: 300_000,
  });
}

export function useLinkMeUsersByEnseigne(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-users-enseigne', enseigneId],
    queryFn: () => fetchLinkMeUsersByEnseigne(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 300_000,
  });
}

export function useLinkMeEnseignesSelect() {
  return useQuery({
    queryKey: ['linkme-enseignes-select'],
    queryFn: fetchEnseignesForSelect,
    staleTime: 60000,
  });
}

export function useLinkMeOrganisationsSelect(
  enseigneId?: string,
  forOrganisationAdmin = false
) {
  return useQuery({
    queryKey: ['linkme-organisations-select', enseigneId, forOrganisationAdmin],
    queryFn: () =>
      fetchOrganisationsForSelect(enseigneId, forOrganisationAdmin),
    staleTime: 60000,
  });
}

export function useCreateLinkMeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLinkMeUserInput) => {
      const response = await fetch('/api/linkme/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        const errorData = (await response.json()) as {
          message?: string;
          error?: string;
        };
        throw new Error(
          errorData.message ?? errorData.error ?? 'Erreur lors de la creation'
        );
      }
      return response.json() as Promise<{ user_id: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
    },
  });
}

export function useUpdateLinkMeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      input,
    }: {
      userId: string;
      input: UpdateLinkMeUserInput;
    }) => {
      if (
        input.first_name !== undefined ||
        input.last_name !== undefined ||
        input.phone !== undefined
      ) {
        const profileUpdate: UserProfileUpdate = {};
        if (input.first_name !== undefined)
          profileUpdate.first_name = input.first_name;
        if (input.last_name !== undefined)
          profileUpdate.last_name = input.last_name;
        if (input.phone !== undefined) profileUpdate.phone = input.phone;
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdate)
          .eq('user_id', userId);
        if (profileError) throw profileError;
      }
      const roleUpdate: UserAppRoleUpdate = {
        updated_at: new Date().toISOString(),
      };
      if (input.role !== undefined) roleUpdate.role = input.role;
      if (input.enseigne_id !== undefined)
        roleUpdate.enseigne_id = input.enseigne_id;
      if (input.organisation_id !== undefined)
        roleUpdate.organisation_id = input.organisation_id;
      if (input.permissions !== undefined)
        roleUpdate.permissions = input.permissions;
      if (input.is_active !== undefined) roleUpdate.is_active = input.is_active;
      const { data, error } = await supabase
        .from('user_app_roles')
        .update(roleUpdate)
        .eq('user_id', userId)
        .eq('app', 'linkme')
        .select(
          'id, user_id, app, role, enseigne_id, organisation_id, permissions, is_active, updated_at'
        )
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-users'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-user', variables.userId],
        }),
      ]);
    },
  });
}

export function useToggleLinkMeUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string;
      isActive: boolean;
    }) => {
      const { error } = await supabase
        .from('user_app_roles')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('app', 'linkme');
      if (error) throw error;
    },
    onMutate: async ({ userId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['linkme-users'] });
      const previousData = queryClient.getQueryData<LinkMeUser[]>([
        'linkme-users',
      ]);
      if (previousData) {
        queryClient.setQueryData<LinkMeUser[]>(
          ['linkme-users'],
          old =>
            old?.map(user =>
              user.user_id === userId ? { ...user, is_active: isActive } : user
            ) ?? []
        );
      }
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData)
        queryClient.setQueryData(['linkme-users'], context.previousData);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
    },
  });
}

export function useDeleteLinkMeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('user_app_roles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('app', 'linkme')
        .select('id, is_active');
      if (error) throw error;
      if (!data || data.length === 0)
        throw new Error(
          'Impossible de desactiver cet utilisateur. Permissions insuffisantes.'
        );
      if (data[0].is_active !== false)
        throw new Error(
          'La desactivation a echoue. Contactez un administrateur.'
        );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
    },
  });
}

export function useHardDeleteLinkMeUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch('/api/linkme/users/hard-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(
          errorData.message ?? 'Erreur lors de la suppression definitive'
        );
      }
      return response.json() as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-users'] }),
        queryClient.invalidateQueries({ queryKey: ['linkme-users-stats'] }),
      ]);
    },
  });
}

export function useLinkMeUsersStats() {
  return useQuery({
    queryKey: ['linkme-users-stats'],
    queryFn: async () => {
      const users = await fetchLinkMeUsers();
      const countByRole = (role: LinkMeRole) =>
        users.filter(u => u.linkme_role === role).length;
      const active = users.filter(u => u.is_active).length;
      return {
        total: users.length,
        active,
        inactive: users.length - active,
        byRole: {
          enseigne_admin: countByRole('enseigne_admin'),
          enseigne_collaborateur: countByRole('enseigne_collaborateur'),
          organisation_admin: countByRole('organisation_admin'),
        },
      };
    },
    staleTime: 60000,
  });
}
