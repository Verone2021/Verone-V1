/**
 * 🔧 Supabase Server - Server Side
 *
 * Configuration server pour middleware et server components
 *
 * ⚠️ MIGRATION 2025-12-12: API cookies migrée vers getAll/setAll
 * Ancienne API get/set/remove deprecated depuis @supabase/ssr v0.5.0+
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

import { cookies } from 'next/headers';

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

export const createServerClient = async () => {
  const cookieStore = await cookies();

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
            // C'est normal - le middleware gère le refresh des sessions
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
