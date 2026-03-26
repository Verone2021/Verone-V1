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

  const isChecking = loading || initializing;
  const allowed = linkMeRole ? isRouteAllowed(pathname, linkMeRole.role) : true;

  useEffect(() => {
    if (isChecking) return;
    if (!linkMeRole) return;

    if (!allowed) {
      const redirectUrl = getRedirectUrl(pathname);
      router.replace(redirectUrl);
    }
  }, [pathname, linkMeRole, isChecking, allowed, router]);

  // Block rendering while redirecting unauthorized users
  if (!isChecking && linkMeRole && !allowed) {
    return null;
  }

  return <>{children}</>;
}
