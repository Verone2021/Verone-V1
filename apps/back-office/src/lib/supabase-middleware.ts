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
 * Erreur levée quand les variables d'environnement Supabase sont manquantes
 */
export class SupabaseEnvError extends Error {
  constructor(missingVars: string[]) {
    super(`Supabase env vars missing: ${missingVars.join(', ')}`);
    this.name = 'SupabaseEnvError';
  }
}

/**
 * Valide et retourne les variables d'environnement Supabase
 * @throws {SupabaseEnvError} si des variables sont manquantes
 */
function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    throw new SupabaseEnvError(missing);
  }

  // Safe assertion après validation explicite
  return { url: url as string, anonKey: anonKey as string };
}

/**
 * Crée un client Supabase pour le middleware avec gestion cookies
 * @throws {SupabaseEnvError} si les variables d'environnement sont manquantes
 */
export function createMiddlewareClient(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
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
  });

  return { supabase, response };
}

/**
 * Rafraîchit la session Supabase et retourne la réponse avec cookies mis à jour
 * @throws {SupabaseEnvError} si les variables d'environnement sont manquantes
 */
export async function updateSession(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);

  // getSession rafraîchit automatiquement le token si expiré
  await supabase.auth.getSession();

  return response;
}
