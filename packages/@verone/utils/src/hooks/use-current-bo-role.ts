'use client';

/**
 * Hook: useCurrentBoRole
 *
 * Returns the current user's active back-office role.
 * Cached with React Query (Infinity staleTime, invalidated on auth change).
 *
 * Used by UI to gate sensitive actions (selling price edits, channel
 * publication, finance pages) for the catalog_manager role introduced in
 * BO-RBAC-CATALOG-MGR-001.
 *
 * @example
 * ```tsx
 * const { role, isLoading } = useCurrentBoRole();
 * const canEditPrice = role === 'owner' || role === 'admin';
 * ```
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '../supabase/client';

import { useCurrentUserId, authKeys } from './use-current-user';

export type BoRole =
  | 'owner'
  | 'admin'
  | 'catalog_manager'
  | 'sales'
  | 'partner_manager'
  | 'manager'
  | 'user';

export const boRoleKeys = {
  all: [...authKeys.all, 'bo-role'] as const,
  byUser: (userId: string) => [...boRoleKeys.all, userId] as const,
};

async function fetchBoRole(userId: string): Promise<BoRole | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[useCurrentBoRole] DB error:', error.message);
    return null;
  }

  return (data?.role as BoRole | undefined) ?? null;
}

export function useCurrentBoRole() {
  const userId = useCurrentUserId();

  const query = useQuery({
    queryKey: userId ? boRoleKeys.byUser(userId) : boRoleKeys.all,
    queryFn: () => fetchBoRole(userId as string),
    enabled: !!userId,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
  });

  const role = query.data ?? null;

  return {
    role,
    isLoading: query.isLoading,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isCatalogManager: role === 'catalog_manager',
    isAdminOrOwner: role === 'owner' || role === 'admin',
    canEditSellingPrice: role === 'owner' || role === 'admin',
    canPublishToChannel: role === 'owner' || role === 'admin',
    canManageUsers: role === 'owner',
  };
}
