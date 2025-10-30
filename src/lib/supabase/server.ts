/**
 * 🔧 Supabase Server - Server Side
 *
 * Configuration server pour middleware et server components
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './types';

export const createServerClient = async () => {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
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
