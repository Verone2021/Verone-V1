/**
 * Back-office middleware
 *
 * Two concerns:
 *
 * 1. Refresh the Supabase auth session on every request (cookie rotation).
 * 2. RBAC gate for the `catalog_manager` role: redirect any non-allowed
 *    path to `/produits`. Owner/admin pass through unchanged.
 *
 * The catalog_manager whitelist must stay aligned with the sidebar
 * whitelist in `components/layout/app-sidebar/sidebar-nav-items.ts`.
 *
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

const CATALOG_MANAGER_ALLOWED_PREFIXES = [
  '/produits',
  '/stocks',
  '/parametres',
  '/profile',
  '/login',
  '/logout',
  '/auth',
];

function isPathAllowedForCatalogManager(pathname: string): boolean {
  return CATALOG_MANAGER_ALLOWED_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);

  // Unauthenticated requests: let layouts/pages handle the /login redirect.
  if (!user) return response;

  const pathname = request.nextUrl.pathname;

  // Don't gate API routes from the middleware — Server Actions, route handlers
  // and Supabase webhooks need to pass freely; their auth is enforced inside.
  if (pathname.startsWith('/api/')) return response;

  // Already on an allowed path: nothing to do.
  if (isPathAllowedForCatalogManager(pathname)) return response;

  // Path is restricted (e.g. /finance, /dashboard, /factures, …).
  // Look up the back-office role of the current user — only catalog_manager
  // is redirected; owner/admin/manager/etc. continue normally.
  const { data: roleRow } = await supabase
    .from('user_app_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('app', 'back-office')
    .eq('is_active', true)
    .maybeSingle();

  if (roleRow?.role === 'catalog_manager') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/produits';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Match every page route. Skip static assets, Next internals, the
    // auth pages, and API routes (each route handler enforces its own
    // auth). Limiting the matcher avoids spurious Supabase calls on the
    // health-check (curl /login from the CI smoke-test bootstrap).
    '/((?!_next/static|_next/image|favicon.ico|login|logout|auth|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
