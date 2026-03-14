'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { isRouteAllowed, getRedirectUrl } from '@/config/route-permissions';

/**
 * RouteGuard — Client-side role-based route protection
 *
 * Checks if the current user's LinkMe role has access to the current route.
 * Redirects to the configured redirect URL if not authorized.
 *
 * Works in tandem with:
 * - MainLayout (server-side auth check)
 * - ROUTE_PERMISSIONS config (centralized role→route mapping)
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { linkMeRole, loading, initializing } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading || initializing) return;

    // No role = layout already handles redirect to login
    if (!linkMeRole) return;

    const allowed = isRouteAllowed(pathname, linkMeRole.role);

    if (!allowed) {
      const redirectUrl = getRedirectUrl(pathname);
      router.replace(redirectUrl);
    }
  }, [pathname, linkMeRole, loading, initializing, router]);

  return <>{children}</>;
}
