/**
 * Server-side helper: getCurrentBoRole
 *
 * Returns the current user's active back-office role from a Server
 * Component or Route Handler. Returns null if user has no active BO role.
 *
 * Use this for SSR gating (redirect 403 if catalog_manager tries to access
 * /finance, /qonto, /admin/users, etc.).
 *
 * @example
 * ```tsx
 * // In a Server Component layout
 * const role = await getCurrentBoRole();
 * if (role === 'catalog_manager') redirect('/produits');
 * ```
 */

import { createServerClient } from '@verone/utils/supabase/server';

export type BoRole =
  | 'owner'
  | 'admin'
  | 'catalog_manager'
  | 'sales'
  | 'partner_manager'
  | 'manager'
  | 'user';

export async function getCurrentBoRole(): Promise<BoRole | null> {
  const supabase = await createServerClient('backoffice');

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('[getCurrentBoRole] DB error:', error.message);
    return null;
  }

  return (data?.role as BoRole | undefined) ?? null;
}

export function isCatalogManagerRole(role: BoRole | null): boolean {
  return role === 'catalog_manager';
}

export function isOwnerOrAdminRole(role: BoRole | null): boolean {
  return role === 'owner' || role === 'admin';
}

export function isOwnerRole(role: BoRole | null): boolean {
  return role === 'owner';
}
