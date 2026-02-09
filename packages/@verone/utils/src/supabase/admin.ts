/**
 * 🔧 Supabase Admin Client - Service Role
 *
 * Client Admin avec Service Role Key pour opérations d'administration.
 * Utilise createClient (pas createServerClient) car Service Role Key
 * ne nécessite pas de gestion cookies (server-to-server auth).
 *
 * ⚠️ JAMAIS importé par le middleware (Edge Runtime incompatible).
 * Ce fichier est réservé aux API routes et Server Actions.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from './types';

/**
 * Validates required environment variables for the Admin client.
 * Throws with a helpful message if anything is missing.
 */
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

/**
 * Creates a Supabase Admin client using the Service Role Key.
 *
 * This bypasses RLS — use only for trusted server-side operations
 * (API routes, Server Actions, cron jobs).
 *
 * @example
 * import { createAdminClient } from '@verone/utils/supabase/admin';
 * const admin = createAdminClient();
 */
export const createAdminClient = () => {
  validateAdminEnv();

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
