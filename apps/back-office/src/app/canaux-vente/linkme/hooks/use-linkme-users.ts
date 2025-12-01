/**
 * Hook: useLinkMeUsers
 * Gestion des Utilisateurs pour le CMS LinkMe
 * Supporte les 3 rôles: enseigne_admin, organisation_admin, client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

// Types
export type LinkMeRole = 'enseigne_admin' | 'organisation_admin' | 'client';

export interface LinkMeUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  linkme_role: LinkMeRole;
  enseigne_id: string | null;
  organisation_id: string | null;
  permissions: string[];
  is_active: boolean;
  role_created_at: string;
  enseigne_name: string | null;
  enseigne_logo: string | null;
  organisation_name: string | null;
  organisation_logo: string | null;
}

export interface EnseigneSelectOption {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface OrganisationSelectOption {
  id: string;
  legal_name: string;
  trade_name: string | null;
  logo_url: string | null;
}

export interface CreateLinkMeUserInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: LinkMeRole;
  enseigne_id?: string;
  organisation_id?: string;
  permissions?: string[];
}

export interface UpdateLinkMeUserInput {
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: LinkMeRole;
  enseigne_id?: string | null;
  organisation_id?: string | null;
  permissions?: string[];
  is_active?: boolean;
}

// ============================================
// FETCH FUNCTIONS
// ============================================

/**
 * Fetch tous les utilisateurs LinkMe via la vue v_linkme_users
 */
async function fetchLinkMeUsers(): Promise<LinkMeUser[]> {
  const { data, error } = await (supabase as any)
    .from('v_linkme_users')
    .select('*')
    .order('role_created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch LinkMe users:', error);
    throw error;
  }

  return (data || []).map((user: any) => ({
    user_id: user.user_id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    linkme_role: user.linkme_role as LinkMeRole,
    enseigne_id: user.enseigne_id,
    organisation_id: user.organisation_id,
    permissions: user.permissions || [],
    is_active: user.is_active ?? true,
    role_created_at: user.role_created_at,
    enseigne_name: user.enseigne_name,
    enseigne_logo: user.enseigne_logo,
    organisation_name: user.organisation_name,
    organisation_logo: user.organisation_logo,
  }));
}

/**
 * Fetch un utilisateur LinkMe par ID
 */
async function fetchLinkMeUserById(userId: string): Promise<LinkMeUser | null> {
  const { data, error } = await (supabase as any)
    .from('v_linkme_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Erreur fetch LinkMe user:', error);
    throw error;
  }

  if (!data) return null;

  return {
    user_id: data.user_id,
    email: data.email,
    first_name: data.first_name,
    last_name: data.last_name,
    avatar_url: data.avatar_url,
    phone: data.phone,
    linkme_role: data.linkme_role as LinkMeRole,
    enseigne_id: data.enseigne_id,
    organisation_id: data.organisation_id,
    permissions: data.permissions || [],
    is_active: data.is_active ?? true,
    role_created_at: data.role_created_at,
    enseigne_name: data.enseigne_name,
    enseigne_logo: data.enseigne_logo,
    organisation_name: data.organisation_name,
    organisation_logo: data.organisation_logo,
  };
}

/**
 * Fetch utilisateurs par enseigne
 */
async function fetchLinkMeUsersByEnseigne(
  enseigneId: string
): Promise<LinkMeUser[]> {
  const { data, error } = await (supabase as any)
    .from('v_linkme_users')
    .select('*')
    .eq('enseigne_id', enseigneId)
    .order('linkme_role')
    .order('role_created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch LinkMe users by enseigne:', error);
    throw error;
  }

  return (data || []).map((user: any) => ({
    user_id: user.user_id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    linkme_role: user.linkme_role as LinkMeRole,
    enseigne_id: user.enseigne_id,
    organisation_id: user.organisation_id,
    permissions: user.permissions || [],
    is_active: user.is_active ?? true,
    role_created_at: user.role_created_at,
    enseigne_name: user.enseigne_name,
    enseigne_logo: user.enseigne_logo,
    organisation_name: user.organisation_name,
    organisation_logo: user.organisation_logo,
  }));
}

/**
 * Fetch enseignes pour dropdown (sélection lors création)
 */
async function fetchEnseignesForSelect(): Promise<EnseigneSelectOption[]> {
  const { data, error } = await (supabase as any)
    .from('enseignes')
    .select('id, name, logo_url')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Erreur fetch enseignes:', error);
    throw error;
  }

  return (data as EnseigneSelectOption[]) || [];
}

/**
 * Fetch organisations pour dropdown (filtrées par enseigne si fourni)
 */
async function fetchOrganisationsForSelect(enseigneId?: string) {
  let query = (supabase as any)
    .from('organisations')
    .select('id, legal_name, trade_name, logo_url, enseigne_id')
    .eq('is_active', true)
    .order('legal_name');

  if (enseigneId) {
    query = query.eq('enseigne_id', enseigneId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erreur fetch organisations:', error);
    throw error;
  }

  return (data || []).map((org: any) => ({
    id: org.id,
    name: org.trade_name || org.legal_name,
    logo_url: org.logo_url,
    enseigne_id: org.enseigne_id,
  }));
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: récupère tous les utilisateurs LinkMe
 */
export function useLinkMeUsers() {
  return useQuery({
    queryKey: ['linkme-users'],
    queryFn: fetchLinkMeUsers,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: récupère un utilisateur LinkMe par ID
 */
export function useLinkMeUser(userId: string | null) {
  return useQuery({
    queryKey: ['linkme-user', userId],
    queryFn: () => fetchLinkMeUserById(userId!),
    enabled: !!userId,
    staleTime: 30000,
  });
}

/**
 * Hook: récupère les utilisateurs d'une enseigne
 */
export function useLinkMeUsersByEnseigne(enseigneId: string | null) {
  return useQuery({
    queryKey: ['linkme-users-enseigne', enseigneId],
    queryFn: () => fetchLinkMeUsersByEnseigne(enseigneId!),
    enabled: !!enseigneId,
    staleTime: 30000,
  });
}

/**
 * Hook: enseignes pour dropdown
 */
export function useLinkMeEnseignesSelect() {
  return useQuery({
    queryKey: ['linkme-enseignes-select'],
    queryFn: fetchEnseignesForSelect,
    staleTime: 60000,
  });
}

/**
 * Hook: organisations pour dropdown
 */
export function useLinkMeOrganisationsSelect(enseigneId?: string) {
  return useQuery({
    queryKey: ['linkme-organisations-select', enseigneId],
    queryFn: () => fetchOrganisationsForSelect(enseigneId),
    staleTime: 60000,
  });
}

/**
 * Hook: créer un nouvel utilisateur LinkMe
 * Utilise l'API route Next.js pour appeler Supabase Admin API
 */
export function useCreateLinkMeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLinkMeUserInput) => {
      // Appel à l'API route Next.js qui utilisera Supabase Admin
      const response = await fetch('/api/linkme/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
    },
  });
}

/**
 * Hook: mettre à jour un utilisateur LinkMe
 */
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
      // Mise à jour du profil utilisateur
      if (
        input.first_name !== undefined ||
        input.last_name !== undefined ||
        input.phone !== undefined
      ) {
        const profileUpdate: any = {};
        if (input.first_name !== undefined)
          profileUpdate.first_name = input.first_name;
        if (input.last_name !== undefined)
          profileUpdate.last_name = input.last_name;
        if (input.phone !== undefined) profileUpdate.phone = input.phone;

        const { error: profileError } = await (supabase as any)
          .from('user_profiles')
          .update(profileUpdate)
          .eq('user_id', userId);

        if (profileError) throw profileError;
      }

      // Mise à jour du rôle LinkMe
      const roleUpdate: any = { updated_at: new Date().toISOString() };
      if (input.role !== undefined) roleUpdate.role = input.role;
      if (input.enseigne_id !== undefined)
        roleUpdate.enseigne_id = input.enseigne_id;
      if (input.organisation_id !== undefined)
        roleUpdate.organisation_id = input.organisation_id;
      if (input.permissions !== undefined)
        roleUpdate.permissions = input.permissions;
      if (input.is_active !== undefined) roleUpdate.is_active = input.is_active;

      const { data, error } = await (supabase as any)
        .from('user_app_roles')
        .update(roleUpdate)
        .eq('user_id', userId)
        .eq('app', 'linkme')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
      queryClient.invalidateQueries({
        queryKey: ['linkme-user', variables.userId],
      });
    },
  });
}

/**
 * Hook: toggle activation utilisateur
 */
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
      const { error } = await (supabase as any)
        .from('user_app_roles')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
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
      if (context?.previousData) {
        queryClient.setQueryData(['linkme-users'], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
    },
  });
}

/**
 * Hook: supprimer un utilisateur LinkMe (soft delete - désactivation)
 */
export function useDeleteLinkMeUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Soft delete: désactiver le rôle
      const { error } = await (supabase as any)
        .from('user_app_roles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('app', 'linkme');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
    },
  });
}

/**
 * Hook: statistiques utilisateurs LinkMe
 */
export function useLinkMeUsersStats() {
  return useQuery({
    queryKey: ['linkme-users-stats'],
    queryFn: async () => {
      const users = await fetchLinkMeUsers();

      const byRole = {
        enseigne_admin: users.filter(u => u.linkme_role === 'enseigne_admin')
          .length,
        organisation_admin: users.filter(
          u => u.linkme_role === 'organisation_admin'
        ).length,
        client: users.filter(u => u.linkme_role === 'client').length,
      };

      const active = users.filter(u => u.is_active).length;

      return {
        total: users.length,
        active,
        inactive: users.length - active,
        byRole,
      };
    },
    staleTime: 60000,
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Labels des rôles pour affichage
 */
export const LINKME_ROLE_LABELS: Record<LinkMeRole, string> = {
  enseigne_admin: 'Admin Enseigne',
  organisation_admin: 'Admin Organisation',
  client: 'Client',
};

/**
 * Couleurs des badges par rôle
 */
export const LINKME_ROLE_COLORS: Record<LinkMeRole, string> = {
  enseigne_admin: 'bg-purple-100 text-purple-800',
  organisation_admin: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800',
};

/**
 * Description des permissions par rôle
 */
export const LINKME_ROLE_PERMISSIONS: Record<LinkMeRole, string[]> = {
  enseigne_admin: [
    'Voir toutes les commandes du réseau',
    'Créer et gérer les utilisateurs',
    'Assigner des utilisateurs aux organisations',
    "Gérer le catalogue de l'enseigne",
  ],
  organisation_admin: [
    'Voir les commandes de son organisation',
    'Créer et gérer le catalogue',
    'Créer des sélections',
  ],
  client: [
    'Voir les sélections (publiques ou de son réseau)',
    'Passer des commandes',
  ],
};
