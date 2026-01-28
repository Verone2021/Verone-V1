/**
 * 🔧 Supabase Server - Server Side
 *
 * Configuration server pour middleware et server components
 *
 * NOTE: Toutes les apps partagent le même cookie Supabase par défaut.
 * L'isolation des sessions par app n'est PAS supportée par @supabase/ssr.
 * Les permissions sont gérées côté serveur via RLS et user_app_roles.
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
 * Crée un client Supabase pour le serveur
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

// Validation des variables d'environnement requises pour le client Admin
const validateAdminEnv = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '⚠️ SUPABASE_SERVICE_ROLE_KEY manquante. ' +
        'Configuration requise sur Vercel : ' +
        'Settings > Environment Variables > SUPABASE_SERVICE_ROLE_KEY. ' +
        'Obtenez la clé depuis Supabase Dashboard > Settings > API > service_role key'
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('⚠️ NEXT_PUBLIC_SUPABASE_URL manquante');
  }
};

// Client Admin avec Service Role Key pour les opérations d'administration
// Utilise createSupabaseClient (pas createServerClient) car Service Role Key
// ne nécessite pas de gestion cookies (server-to-server auth)
export const createAdminClient = () => {
  validateAdminEnv(); // ✅ Validation explicite au démarrage

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
