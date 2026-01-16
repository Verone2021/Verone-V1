/**
 * Supabase Middleware Helpers - Pour protection des routes
 *
 * Utilise @supabase/ssr pour la gestion des cookies dans le middleware.
 * Cookie standard Supabase (pas de préfixe custom pour back-office).
 *
 * @module supabase-middleware
 * @since 2026-01-07
 */

import { type NextRequest, NextResponse } from 'next/server';

import { createServerClient as createSSRServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Créer un client Supabase pour le middleware
 * Met à jour la session et gère les cookies
 */
export function createMiddlewareClient(request: NextRequest): {
  supabase: ReturnType<typeof createSSRServerClient>;
  response: NextResponse;
} {
  let response = NextResponse.next({
    request,
  });

  const supabase = createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
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
 * Mettre à jour la session dans le middleware ET vérifier l'authentification
 * Rafraîchit le token si nécessaire et retourne le user
 *
 * Cette fonction combine la mise à jour de session ET la vérification d'auth
 * pour éviter de créer plusieurs instances du client Supabase (cause erreur 500)
 */
export async function updateSessionAndGetUser(
  request: NextRequest
): Promise<{
  supabase: ReturnType<typeof createSSRServerClient>;
  response: NextResponse;
  user: unknown;
}> {
  const result = createMiddlewareClient(request);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const supabase = result.supabase;
  const response = result.response;

  // Récupérer le user (cela va automatiquement rafraîchir la session si nécessaire)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const { data } = await (supabase.auth.getUser() as Promise<{
    data: { user: unknown };
  }>);

  return { supabase, response, user: data.user };
}

/**
 * @deprecated Use updateSessionAndGetUser() instead to avoid multiple client instantiations
 * Mettre à jour la session dans le middleware
 * Rafraîchit le token si nécessaire
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  const result = createMiddlewareClient(request);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const supabase = result.supabase;
  const response = result.response;

  // Rafraîchir la session (important pour SSR)
  // Cela va automatiquement rafraîchir le token si expiré
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  await supabase.auth.getSession();

  return response;
}
