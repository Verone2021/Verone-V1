/**
 * 🔐 Middleware Minimal - Edge Runtime Safe
 *
 * Middleware ultra-léger pour débloquer la production.
 * Zéro dépendance externe, zéro import Supabase.
 * L'auth sera gérée côté Server Components / layouts.
 *
 * Dernière mise à jour : 2025-12-12 (Fix: Remove all Supabase imports)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Route racine "/" → redirect vers /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Tout le reste passe
  return NextResponse.next();
}

// Matcher: exclut explicitement /api/*, /_next/*, et assets statiques
export const config = {
  matcher: [
    /*
     * Match tous les chemins SAUF :
     * - /api/* (API routes)
     * - /_next/* (Next.js internals)
     * - /favicon.ico
     * - Static assets (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
