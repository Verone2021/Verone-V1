/**
 * 🔐 Middleware Minimal - Edge Runtime Safe
 *
 * Zéro dépendance Supabase. L'auth est gérée dans AuthContext.
 *
 * POURQUOI CE DESIGN:
 * - @supabase/ssr + Edge Runtime Vercel = Incompatibilité connue
 * - Issues GitHub: #1552, #107, #24194
 * - CVE-2025-29927: "Middleware alone is insufficient"
 *
 * L'AUTH EST VÉRIFIÉE DANS:
 * - AuthContext (client-side)
 * - RLS Supabase (Data Access Layer)
 *
 * @since 2026-01-29
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // Tout passe → l'auth est gérée dans AuthContext côté client
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
