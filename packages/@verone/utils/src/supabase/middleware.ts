/**
 * 🔐 Supabase Middleware - Token Refresh
 *
 * Utilitaire pour rafraîchir les tokens Supabase dans le middleware Next.js.
 *
 * IMPORTANT (Best Practices 2025):
 * - Le middleware ne doit PAS bloquer les routes
 * - Il doit SEULEMENT rafraîchir les tokens
 * - La protection des routes se fait dans le Data Access Layer (DAL)
 *
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 * Ref: https://nextjs.org/docs/app/guides/authentication
 *
 * @module middleware
 * @since 2026-01-29
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import type { Database } from './types';

/**
 * Rafraîchit la session Supabase et synchronise les cookies.
 *
 * Cette fonction doit être appelée dans le middleware pour :
 * 1. Rafraîchir les tokens expirés (via getUser)
 * 2. Passer les tokens rafraîchis aux Server Components (request.cookies)
 * 3. Passer les tokens rafraîchis au navigateur (response.cookies)
 *
 * @param request - NextRequest du middleware
 * @returns NextResponse avec cookies synchronisés
 *
 * @example
 * // middleware.ts
 * import { updateSession } from '@verone/utils/supabase/middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request);
 * }
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  // Créer la response initiale
  let supabaseResponse = NextResponse.next({ request });

  // Créer le client Supabase avec gestion des cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mettre à jour les cookies dans la request (pour les Server Components)
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Recréer la response avec les cookies mis à jour
          supabaseResponse = NextResponse.next({ request });

          // Ajouter les cookies à la response (pour le navigateur)
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // IMPORTANT: Appeler getUser() pour rafraîchir le token
  // Ne PAS utiliser getSession() car il ne valide pas le JWT
  // Documentation: "Never trust getSession() inside server code"
  //
  // Note: On ignore le résultat car le middleware ne doit PAS bloquer
  // La protection des routes se fait dans le Data Access Layer
  await supabase.auth.getUser();

  return supabaseResponse;
}

/**
 * Configuration matcher recommandée pour le middleware.
 * Exclut les fichiers statiques et assets.
 */
export const defaultMatcherConfig = {
  matcher: [
    /*
     * Match tous les chemins SAUF :
     * - _next/static (fichiers statiques Next.js)
     * - _next/image (optimisation images)
     * - favicon.ico
     * - Assets statiques (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
