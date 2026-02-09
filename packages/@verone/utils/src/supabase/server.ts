/**
 * 🔧 Supabase Server - Server Side
 *
 * Configuration server pour Server Components et Server Actions.
 *
 * NOTE: Toutes les apps partagent le même cookie Supabase par défaut.
 * L'isolation des sessions par app n'est PAS supportée par @supabase/ssr.
 * Les permissions sont gérées côté serveur via RLS et user_app_roles.
 *
 * ⚠️ Ce fichier utilise `cookies()` de `next/headers` —
 * il ne doit JAMAIS être importé par le middleware (Edge Runtime).
 * Pour le client Admin, voir `./admin.ts`.
 *
 * ⚠️ MIGRATION 2025-12-12: API cookies migrée vers getAll/setAll
 * Ancienne API get/set/remove deprecated depuis @supabase/ssr v0.5.0+
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { cookies } from 'next/headers';

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { AppName } from './client';
import type { Database } from './types';

/**
 * Crée un client Supabase pour le serveur (Server Components / Server Actions)
 *
 * @param _appName - Paramètre ignoré (rétrocompatibilité)
 * @returns Client Supabase avec cookie par défaut
 *
 * @example
 * const supabase = await createServerClient();
 */
export const createServerClient = async (_appName?: AppName) => {
  const cookieStore = await cookies();

  // Toutes les apps utilisent le cookie par défaut: sb-{PROJECT_ID}-auth-token
  // L'option cookieOptions de @supabase/ssr n'est PAS supportée
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll peut échouer dans Server Components (read-only)
          }
        },
      },
    }
  );
};

// Edge Runtime Compatible Client (pour API routes avec runtime = 'edge')
export const createClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Re-export createAdminClient from dedicated module for backward compatibility
export { createAdminClient } from './admin';
