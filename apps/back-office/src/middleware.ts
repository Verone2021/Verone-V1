/**
 * 🔐 Middleware Back Office - Token Refresh + Redirections
 *
 * ARCHITECTURE AUTH (Best Practices 2025):
 * =========================================
 *
 * 1. MIDDLEWARE (ici):
 *    - Rafraîchir les tokens Supabase (getUser)
 *    - Redirections basiques (/, anciennes URLs)
 *    - ❌ NE PAS bloquer les routes non-auth
 *
 * 2. DATA ACCESS LAYER (dal.ts):
 *    - Vérifier l'auth avec verifySession()
 *    - C'est LA vraie protection
 *
 * 3. RLS SUPABASE:
 *    - Protection au niveau données
 *    - Dernière ligne de défense
 *
 * Ref: https://nextjs.org/docs/app/guides/authentication
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * @since 2025-12-12
 * @updated 2026-01-29 - Refonte selon best practices
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { updateSession } from '@verone/utils/supabase/middleware';

// Redirections backward-compatibility (anciennes URLs)
const URL_REDIRECTS: Record<string, string> = {
  '/comptabilite': '/finance',
  '/comptabilite/transactions': '/finance/transactions',
  '/comptabilite/depenses': '/finance/depenses',
  '/comptabilite/livres': '/finance/livres',
  '/tresorerie': '/finance/tresorerie',
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────────
  // 1. REDIRECTIONS (avant le token refresh)
  // ─────────────────────────────────────────────────────────────

  // Route racine "/" → redirect vers /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirections backward-compatibility (exactes)
  if (URL_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(URL_REDIRECTS[pathname], request.url));
  }

  // Redirections backward-compatibility (préfixes)
  for (const [oldPath, newPath] of Object.entries(URL_REDIRECTS)) {
    if (pathname.startsWith(oldPath + '/')) {
      return NextResponse.redirect(
        new URL(pathname.replace(oldPath, newPath), request.url)
      );
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. TOKEN REFRESH (Supabase)
  // ─────────────────────────────────────────────────────────────
  // Rafraîchit le token et synchronise les cookies.
  // NE bloque PAS les routes - la protection est dans le DAL.

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match tous les chemins SAUF :
     * - api (routes API - ont leur propre auth)
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - Assets statiques (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
