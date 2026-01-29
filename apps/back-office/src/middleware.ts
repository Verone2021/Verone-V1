/**
 * 🔐 Middleware Minimal - Edge Runtime Safe
 *
 * Zéro dépendance Supabase. L'auth est gérée dans les layouts.
 * Version stable restaurée de décembre 2025.
 *
 * POURQUOI CE DESIGN:
 * - @supabase/ssr + Edge Runtime Vercel = Incompatibilité connue
 * - Issues GitHub: #1552, #107, #24194
 * - CVE-2025-29927: "Middleware alone is insufficient"
 *
 * L'AUTH EST VÉRIFIÉE DANS:
 * - apps/back-office/src/app/(protected)/layout.tsx (getUser())
 * - RLS Supabase (Data Access Layer)
 *
 * @since 2025-12-12
 * @restored 2026-01-29
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Redirections backward-compatibility
const URL_REDIRECTS: Record<string, string> = {
  '/comptabilite': '/finance',
  '/comptabilite/transactions': '/finance/transactions',
  '/comptabilite/depenses': '/finance/depenses',
  '/comptabilite/livres': '/finance/livres',
  '/tresorerie': '/finance/tresorerie',
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Route racine "/" → redirect vers /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirections backward-compatibility
  if (URL_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(URL_REDIRECTS[pathname], request.url));
  }

  // Redirections par préfixe
  for (const [oldPath, newPath] of Object.entries(URL_REDIRECTS)) {
    if (pathname.startsWith(oldPath + '/')) {
      return NextResponse.redirect(
        new URL(pathname.replace(oldPath, newPath), request.url)
      );
    }
  }

  // Tout le reste passe → auth gérée dans layout.tsx
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
