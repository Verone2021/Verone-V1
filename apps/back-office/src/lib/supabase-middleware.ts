/**
 * 🔐 Supabase Middleware Helpers - Vérone Back Office
 *
 * Helpers pour créer un client Supabase dans le middleware Next.js
 * avec gestion correcte des cookies pour la session auth.
 *
 * Pattern adapté de apps/linkme/src/lib/supabase-server.ts
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Crée un client Supabase pour le middleware avec gestion cookies
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Met à jour les cookies dans la requête pour le render
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          // Crée nouvelle réponse avec cookies mis à jour
          response = NextResponse.next({ request });
          // Ajoute les cookies à la réponse
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  return { supabase, response };
}

/**
 * Rafraîchit la session Supabase et retourne la réponse avec cookies mis à jour
 */
export async function updateSession(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // getSession rafraîchit automatiquement le token si expiré
  await supabase.auth.getSession();

  return response;
}
