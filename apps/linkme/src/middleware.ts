/**
 * 🔐 Middleware LinkMe - Token Refresh
 *
 * ARCHITECTURE AUTH (Best Practices 2025):
 * =========================================
 *
 * 1. MIDDLEWARE (ici):
 *    - Rafraîchir les tokens Supabase (getUser)
 *    - ❌ NE PAS bloquer les routes
 *
 * 2. AUTH CONTEXT (client-side):
 *    - Vérifier l'auth avec useAuth()
 *    - Gérer les rôles LinkMe
 *
 * 3. RLS SUPABASE:
 *    - Protection au niveau données
 *    - Dernière ligne de défense
 *
 * Ref: https://nextjs.org/docs/app/guides/authentication
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 *
 * @since 2025-12-01
 * @updated 2026-01-29 - Refonte selon best practices
 */

import type { NextRequest } from 'next/server';

import { updateSession } from '@verone/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // ─────────────────────────────────────────────────────────────
  // TOKEN REFRESH (Supabase)
  // ─────────────────────────────────────────────────────────────
  // Rafraîchit le token et synchronise les cookies.
  // NE bloque PAS les routes - la protection est dans AuthContext.

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
