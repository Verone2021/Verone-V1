/**
 * Middleware LinkMe - SANS Supabase (Edge Runtime Safe)
 *
 * ❌ INTERDIT: import de @supabase/*, createServerClient, updateSession
 * ✅ SEULEMENT: NextRequest, NextResponse
 *
 * POURQUOI:
 * - @supabase/ssr utilise `process.version` (API Node.js)
 * - Edge Runtime de Vercel ne supporte PAS `process.version`
 * - Résultat: MIDDLEWARE_INVOCATION_FAILED en production
 *
 * ARCHITECTURE AUTH:
 * - L'auth est vérifiée dans AuthContext côté client
 * - RLS Supabase protège les données
 *
 * @since 2026-01-29 - Suppression Supabase pour Edge Runtime
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(_request: NextRequest) {
  // Pas de logique nécessaire - auth gérée par AuthContext
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
