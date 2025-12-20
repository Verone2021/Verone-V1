/**
 * Supabase Server Client - Pour SSR et Middleware
 *
 * Utilise @supabase/ssr pour la gestion des cookies
 * Cookie distinct 'sb-linkme-auth' pour isoler la session de LinkMe
 *
 * @module supabase-server
 * @since 2025-12-01
 */

import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient as createSSRServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Préfixe cookie distinct pour LinkMe (isolation des sessions)
const COOKIE_PREFIX = 'sb-linkme-auth';

/**
 * Créer un client Supabase pour les Server Components
 * Utilise les cookies pour maintenir la session
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: COOKIE_PREFIX,
    },
    cookies: {
      getAll() {
        // Filtrer pour ne retourner que les cookies LinkMe
        return cookieStore
          .getAll()
          .filter(c => c.name.startsWith(COOKIE_PREFIX));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // La méthode setAll a été appelée depuis un Server Component.
          // Cela peut être ignoré si vous avez un middleware qui rafraîchit
          // les sessions utilisateur.
        }
      },
    },
  });
}

/**
 * Créer un client Supabase pour le middleware
 * Met à jour la session et gère les cookies
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: COOKIE_PREFIX,
    },
    cookies: {
      getAll() {
        // Filtrer pour ne retourner que les cookies LinkMe
        return request.cookies
          .getAll()
          .filter(c => c.name.startsWith(COOKIE_PREFIX));
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return { supabase, response };
}

/**
 * Mettre à jour la session dans le middleware
 * Rafraîchit le token si nécessaire
 */
export async function updateSession(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // Rafraîchir la session (important pour SSR)
  // Cela va automatiquement rafraîchir le token si expiré
  await supabase.auth.getSession();

  return response;
}
