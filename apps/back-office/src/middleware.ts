/**
 * Middleware Back Office - SANS Supabase (Edge Runtime Safe)
 *
 * ❌ INTERDIT: import de @supabase/*, createServerClient, updateSession
 * ✅ SEULEMENT: NextRequest, NextResponse, redirections simples
 *
 * POURQUOI:
 * - @supabase/ssr utilise `process.version` (API Node.js)
 * - Edge Runtime de Vercel ne supporte PAS `process.version`
 * - Résultat: MIDDLEWARE_INVOCATION_FAILED en production
 *
 * ARCHITECTURE AUTH:
 * - L'auth est vérifiée dans: apps/back-office/src/app/(protected)/layout.tsx
 * - Le layout utilise supabase.auth.getUser() (sécurisé)
 * - RLS Supabase protège les données
 *
 * @since 2026-01-29 - Suppression Supabase pour Edge Runtime
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Redirections backward-compatibility (anciennes URLs)
const URL_REDIRECTS: Record<string, string> = {
  '/comptabilite': '/finance',
  '/comptabilite/transactions': '/finance/transactions',
  '/comptabilite/depenses': '/finance/depenses',
  '/comptabilite/livres': '/finance/livres',
  '/tresorerie': '/finance/tresorerie',
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ─────────────────────────────────────────────────────────────
  // REDIRECTIONS SIMPLES (pas d'async, pas de Supabase)
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

  return NextResponse.next();
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
