/**
 * Hook: useLinkMeUsers
 * Gestion des Utilisateurs pour le CMS LinkMe
 * Supporte les 3 rôles: enseigne_admin, organisation_admin, client
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';

const supabase = createClient();

// Types Supabase
type UserProfileUpdate =
  Database['public']['Tables']['user_profiles']['Update'];
type UserAppRoleUpdate =
  Database['public']['Tables']['user_app_roles']['Update'];
type LinkMeUserView = Database['public']['Views']['v_linkme_users']['Row'];

// Types
export type LinkMeRole = 'enseigne_admin' | 'organisation_admin';

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
  default_margin_rate: number | null;
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
  const { data, error } = await supabase
    .from('v_linkme_users')
    .select('*')
    .order('role_created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch LinkMe users:', error);
    throw error;
  }

  return (data ?? []).map((user: LinkMeUserView) => ({
    user_id: user.user_id ?? '',
    email: user.email ?? '',
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    linkme_role: (user.linkme_role ?? 'client') as LinkMeRole,
    enseigne_id: user.enseigne_id,
    organisation_id: user.organisation_id,
    permissions: user.permissions ?? [],
    is_active: user.is_active ?? true,
    role_created_at: user.role_created_at ?? '',
    default_margin_rate: user.default_margin_rate,
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
  const { data, error } = await supabase
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

  const user: LinkMeUserView = data;
  return {
    user_id: user.user_id ?? '',
    email: user.email ?? '',
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    linkme_role: (user.linkme_role ?? 'client') as LinkMeRole,
    enseigne_id: user.enseigne_id,
    organisation_id: user.organisation_id,
    permissions: user.permissions ?? [],
    is_active: user.is_active ?? true,
    role_created_at: user.role_created_at ?? '',
    default_margin_rate: user.default_margin_rate,
    enseigne_name: user.enseigne_name,
    enseigne_logo: user.enseigne_logo,
    organisation_name: user.organisation_name,
    organisation_logo: user.organisation_logo,
  };
}

/**
 * Fetch utilisateurs par enseigne
 */
async function fetchLinkMeUsersByEnseigne(
  enseigneId: string
): Promise<LinkMeUser[]> {
  const { data, error } = await supabase
    .from('v_linkme_users')
    .select('*')
    .eq('enseigne_id', enseigneId)
    .order('linkme_role')
    .order('role_created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch LinkMe users by enseigne:', error);
    throw error;
  }

  return (data ?? []).map((user: LinkMeUserView) => ({
    user_id: user.user_id ?? '',
    email: user.email ?? '',
    first_name: user.first_name,
    last_name: user.last_name,
    avatar_url: user.avatar_url,
    phone: user.phone,
    linkme_role: (user.linkme_role ?? 'client') as LinkMeRole,
    enseigne_id: user.enseigne_id,
    organisation_id: user.organisation_id,
    permissions: user.permissions ?? [],
    is_active: user.is_active ?? true,
    role_created_at: user.role_created_at ?? '',
    default_margin_rate: user.default_margin_rate,
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
  const { data, error } = await supabase
    .from('enseignes')
    .select('id, name, logo_url')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Erreur fetch enseignes:', error);
    throw error;
  }

  return (data ?? []).map(enseigne => ({
    id: enseigne.id,
    name: enseigne.name,
    logo_url: enseigne.logo_url,
  }));
}

/**
 * Fetch organisations pour dropdown (filtrées par enseigne si fourni)
 * @param enseigneId - Filtrer par enseigne
 * @param forOrganisationAdmin - Si true, exclut les organisations qui ont déjà un utilisateur organisation_admin
 */
async function fetchOrganisationsForSelect(
  enseigneId?: string,
  forOrganisationAdmin: boolean = false
) {
  let query = supabase
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

  let organisations = (data ?? []).map(org => ({
    id: org.id,
    name: org.trade_name ?? org.legal_name,
    logo_url: org.logo_url,
    enseigne_id: org.enseigne_id,
  }));

  // Si création pour organisation_admin, exclure les orgs qui ont déjà un utilisateur
  if (forOrganisationAdmin) {
    const { data: existingRoles } = await supabase
      .from('user_app_roles')
      .select('organisation_id')
      .eq('app', 'linkme')
      .eq('role', 'organisation_admin')
      .not('organisation_id', 'is', null);

    const usedOrgIds = new Set(
      (existingRoles ?? [])
        .map(r => r.organisation_id)
        .filter((id): id is string => id !== null)
    );
    organisations = organisations.filter(org => !usedOrgIds.has(org.id));
  }

  return organisations;
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
 * @param enseigneId - Filtrer par enseigne
 * @param forOrganisationAdmin - Si true, exclut les organisations qui ont déjà un utilisateur organisation_admin
 */
export function useLinkMeOrganisationsSelect(
  enseigneId?: string,
  forOrganisationAdmin: boolean = false
) {
  return useQuery({
    queryKey: ['linkme-organisations-select', enseigneId, forOrganisationAdmin],
    queryFn: () =>
      fetchOrganisationsForSelect(enseigneId, forOrganisationAdmin),
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
        const error = (await response.json()) as { message?: string };
        throw new Error(error.message ?? 'Erreur lors de la création');
      }

      return response.json() as Promise<{ user_id: string }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
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

      // Mise à jour du rôle LinkMe
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
        .select()
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
      const { error } = await supabase
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
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
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
      const { error } = await supabase
        .from('user_app_roles')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('app', 'linkme');

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['linkme-users'] });
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
  enseigne_admin: 'Enseigne',
  organisation_admin: 'Organisation',
};

/**
 * Couleurs des badges par rôle
 */
export const LINKME_ROLE_COLORS: Record<LinkMeRole, string> = {
  enseigne_admin: 'bg-purple-100 text-purple-800',
  organisation_admin: 'bg-blue-100 text-blue-800',
};

/**
 * Description des permissions par rôle
 */
export const LINKME_ROLE_PERMISSIONS: Record<LinkMeRole, string[]> = {
  enseigne_admin: [
    'Gérer les sélections de produits',
    'Vendre aux organisations du réseau',
    "Voir toutes les organisations de l'enseigne",
    'Accès aux statistiques réseau',
  ],
  organisation_admin: [
    'Créer des sélections de produits',
    'Voir uniquement son organisation',
    'Formulaire de sélection limité',
  ],
};
