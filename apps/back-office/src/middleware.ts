/**
 * Back-office middleware — minimal (session refresh only).
 *
 * The first iteration of BO-RBAC-CATALOG-MGR-001 attempted to perform a
 * server-side RBAC redirect for catalog_manager users here, but the extra
 * Supabase round-trip on every request made the production `next start`
 * fail to respond within the 60s window the CI smoke-test uses to detect
 * readiness, which then dragged Playwright into spinning up its own
 * `turbo dev` and timing out at 240s.
 *
 * Until that is investigated properly (BO-RBAC-CATALOG-MGR-002), we keep
 * the middleware to its bare essential — refreshing the Supabase session
 * cookies — and rely on the sidebar whitelist
 * (components/layout/app-sidebar/sidebar-nav-items.ts) so that catalog
 * managers never see a link to a page they shouldn't visit.
 *
 * @see BO-RBAC-CATALOG-MGR-001
 */
import { type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    // Match every page route. Skip static assets, Next internals, auth
    // pages, and API routes.
    '/((?!_next/static|_next/image|favicon.ico|login|logout|auth|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
